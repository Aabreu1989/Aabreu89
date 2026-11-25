import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

let supabaseAdmin = null;
if (supabaseUrl && supabaseServiceKey) {
    try {
        supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
    } catch (e) {
        console.warn('⚠️ [MIRA CHAT] Failed to init supabaseAdmin:', e.message);
    }
}

function isValidTranslation(candidate, original) {
    if (!candidate || typeof candidate !== 'string') return false;
    const cand = candidate.trim();
    const orig = (original || '').trim();
    if (!cand || cand === orig || cand.toLowerCase() === orig.toLowerCase()) return false;

    const lower = cand.toLowerCase();
    const corruptedMarkers = [
        "could not", "não consegui", "no pude", "pas pu", "gemini api error",
        "quota_exceeded", "resource_exhausted", "error", "exception", "unavailable",
        "config_missing", "como modelo de linguagem", "as an ai language model",
        "estamos a trabalhar", "explore mira", "explorar módulos", "⚠️ aviso legal",
        "⚠️ disclaimer", "[view:local_services:"
    ];

    return !corruptedMarkers.some(m => lower.includes(m));
}

async function recordApiTelemetry(telemetryData) {
    if (!supabaseAdmin) return;
    try {
        const { error } = await supabaseAdmin
            .from('ai_api_telemetry')
            .insert([{
                request_id: telemetryData.requestId,
                user_id: telemetryData.userId || null,
                guest_id: telemetryData.guestId || null,
                model: telemetryData.model,
                status: telemetryData.status,
                prompt_tokens: telemetryData.promptTokens || 0,
                candidate_tokens: telemetryData.candidateTokens || 0,
                total_tokens: telemetryData.totalTokens || 0,
                latency_ms: telemetryData.latencyMs || 0,
                http_status: telemetryData.httpStatus,
                error_code: telemetryData.errorCode || null,
                error_message: telemetryData.errorMessage || null,
                finish_reason: telemetryData.finishReason || null,
                created_at: new Date().toISOString()
            }]);
        if (error) {
            console.warn('⚠️ [MIRA TELEMETRY] Erro ao gravar ai_api_telemetry:', error.message);
        }
    } catch (e) {
        console.warn('⚠️ [MIRA TELEMETRY] Exceção ao gravar ai_api_telemetry:', e.message);
    }
}

export default async function handler(req, res) {
    const allowedOrigins = ['https://miraimigrante.pt', 'https://www.miraimigrante.pt', 'http://127.0.0.1:3333', 'http://localhost:3333', 'http://localhost:5173'];
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { prompt, history, communityContext, language, action, kbContext, profileContext } = req.body;
    const isTranslate = action === 'translate';
    const lang = (language || 'PT').toUpperCase().split('-')[0];
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();

    // ──────────────────────────────────────────────────────────────────────────
    // 🌐 SISTEMA SOBERANO DE TRADUÇÃO: CACHE GLOBAL + GEMINI + FALLBACK GTX
    // ──────────────────────────────────────────────────────────────────────────
    if (action === 'translate') {
        const normText = (prompt || '').trim();
        const normLang = lang;

        if (!normText || normLang === 'PT') {
            return res.status(200).json({ success: true, text: normText, source: 'original' });
        }

        // 1. Verificar cache global persistido no Supabase
        if (supabaseAdmin) {
            try {
                const { data: cachedRow } = await supabaseAdmin
                    .from('translation_cache')
                    .select('translated_text')
                    .eq('original_text', normText)
                    .eq('target_language', normLang)
                    .maybeSingle();

                if (cachedRow && cachedRow.translated_text && isValidTranslation(cachedRow.translated_text, normText)) {
                    return res.status(200).json({
                        success: true,
                        text: cachedRow.translated_text.trim(),
                        source: 'db_cache'
                    });
                }
            } catch (dbErr) {
                console.warn('⚠️ [MIRA TRANSLATE] DB check error:', dbErr.message);
            }
        }

        let translatedCandidate = '';
        let translationSource = 'gemini';

        // 2. Tentar tradução via Google Gemini
        if (apiKey) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
                const gemResponse = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        system_instruction: { parts: [{ text: `Professional Translation: Translate the following text to ${normLang}. Output ONLY the direct translated text without quotation marks, explanations, greetings or commentary.` }] },
                        contents: [{ role: "user", parts: [{ text: normText }] }],
                        generationConfig: { maxOutputTokens: 1000 }
                    })
                });

                if (gemResponse.ok) {
                    const gemData = await gemResponse.json();
                    const cand = gemData.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (cand && isValidTranslation(cand, normText)) {
                        translatedCandidate = cand.trim();
                        translationSource = 'gemini';
                    }
                    if (gemData?.usageMetadata) {
                        recordApiTelemetry({
                            requestId: 'trans_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
                            userId: null,
                            guestId: 'translation_service',
                            model: 'gemini-3.6-flash',
                            status: 'success',
                            promptTokens: gemData.usageMetadata.promptTokenCount || 0,
                            candidateTokens: gemData.usageMetadata.candidatesTokenCount || 0,
                            totalTokens: gemData.usageMetadata.totalTokenCount || 0,
                            latencyMs: 0,
                            httpStatus: 200,
                            errorCode: null,
                            errorMessage: null,
                            finishReason: gemData.candidates?.[0]?.finishReason || 'STOP'
                        }).catch(() => {});
                    }
                } else if (gemResponse.status === 429 || gemResponse.status >= 500) {
                    recordApiTelemetry({
                        requestId: 'trans_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
                        userId: null,
                        guestId: 'translation_service',
                        model: 'gemini-3.6-flash',
                        status: gemResponse.status === 429 ? '429' : '5xx',
                        promptTokens: 0,
                        candidateTokens: 0,
                        totalTokens: 0,
                        latencyMs: 0,
                        httpStatus: gemResponse.status,
                        errorCode: gemResponse.status === 429 ? 'QUOTA_EXCEEDED' : 'SERVER_ERROR',
                        errorMessage: 'Gemini translation error'
                    }).catch(() => {});
                }
            } catch (gemErr) {
                console.warn('⚠️ [MIRA TRANSLATE] Gemini error, trying GTX fallback:', gemErr.message);
            }
        }

        // 3. Fallback de Tradução: Google GTX
        if (!translatedCandidate) {
            try {
                const langCode = normLang.toLowerCase() === 'br' ? 'pt' : normLang.toLowerCase();
                const gtxUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t&q=${encodeURIComponent(normText)}`;
                const gtxRes = await fetch(gtxUrl);
                if (gtxRes.ok) {
                    const gtxData = await gtxRes.json();
                    if (gtxData && gtxData[0] && Array.isArray(gtxData[0])) {
                        const segments = gtxData[0].map(s => s[0]).filter(Boolean).join('');
                        if (segments && isValidTranslation(segments, normText)) {
                            translatedCandidate = segments.trim();
                            translationSource = 'gtx';
                        }
                    }
                }
            } catch (gtxErr) {
                console.warn('⚠️ [MIRA TRANSLATE] GTX fallback error:', gtxErr.message);
            }
        }

        // 4. Se obteve tradução válida: Persistir no Supabase e retornar
        if (translatedCandidate && isValidTranslation(translatedCandidate, normText)) {
            if (supabaseAdmin) {
                try {
                    await supabaseAdmin
                        .from('translation_cache')
                        .upsert({
                            original_text: normText,
                            target_language: normLang,
                            translated_text: translatedCandidate
                        }, { onConflict: 'original_text,target_language' });
                } catch (saveErr) {
                    console.warn('⚠️ [MIRA TRANSLATE] Error upserting to translation_cache:', saveErr.message);
                }
            }

            return res.status(200).json({
                success: true,
                text: translatedCandidate,
                source: translationSource
            });
        }

        // 5. Se todos os motores falharem: Retorna texto original (NUNCA grava no cache)
        return res.status(200).json({
            success: false,
            text: normText,
            source: 'original',
            fallbackRequired: true
        });
    }

    const verifiedKbBlock = kbContext ? `\n\n[BASE DE CONHECIMENTO VERIFICADA MIRA 2026 PARA O TEMA]:\n${kbContext}\n(Utiliza esta informação verificada para fundamentar a tua resposta de forma contextualizada e personalizada.)` : '';

    // 🚇 6 ESTAÇÕES CANÓNICAS OFICIAIS DA LINHA DE METRO MIRA
    const CANONICAL_METRO_STATIONS = [
        { id: 'chegada', name: '1. Chegada & Visto Consular', nextTip: 'obtenção do NIF nas Finanças com passaporte' },
        { id: 'nif', name: '2. NIF (Número de Identificação Fiscal)', nextTip: 'obtenção do NISS na Segurança Social' },
        { id: 'niss', name: '3. NISS (Segurança Social)', nextTip: 'inscrição no Centro de Saúde (SNS) para obter Número de Utente' },
        { id: 'sns', name: '4. SNS (Número de Utente do Centro de Saúde)', nextTip: 'procura ativa de emprego e celebração de contrato de trabalho' },
        { id: 'emprego', name: '5. Emprego & Contrato de Trabalho', nextTip: 'agendamento e regularização de residência na AIMA' },
        { id: 'residencia', name: '6. Residência Legal (AIMA / Título de Residência)', nextTip: 'integração plena e consolidação dos direitos' }
    ];

    // 🧠 MOTOR DE TRIAGEM DETERMINÍSTICO & AVALIAÇÃO DE SLOTS (FASE C)
    function evaluateTriageProtocol(p = '', hist = [], prof = {}) {
        const promptLower = (p || '').toLowerCase().trim();
        
        // 1. Localização (Precedência do Chat Recente)
        let locationStatus = 'DESCONHECIDO';
        let locationSource = 'NENHUMA';
        let currentDistrict = prof?.district || null;

        const districts = [
            'lisboa', 'porto', 'braga', 'setúbal', 'setubal', 'aveiro', 'faro', 'coimbra',
            'leiria', 'santarém', 'santarem', 'viseu', 'viana do castelo', 'vila real',
            'castelo branco', 'bragança', 'braganca', 'guarda', 'évora', 'evora', 'beja',
            'portalegre', 'funchal', 'madeira', 'açores', 'acores', 'ponta delgada'
        ];

        for (const d of districts) {
            if (promptLower.includes(d) || promptLower.includes(`em ${d}`) || promptLower.includes(`para ${d}`) || promptLower.includes(`no ${d}`) || promptLower.includes(`na ${d}`)) {
                currentDistrict = d.charAt(0).toUpperCase() + d.slice(1);
                locationStatus = `PORTUGAL (${currentDistrict})`;
                locationSource = 'CHAT_RECENTE (Precedência Ativa)';
                break;
            }
        }

        if (locationStatus === 'DESCONHECIDO') {
            if (
                promptLower.includes('cheguei a portugal') || promptLower.includes('cheguei ontem') || 
                promptLower.includes('estou em portugal') || promptLower.includes('a viver em portugal') || 
                promptLower.includes('já estou cá') || promptLower.includes('ja estou ca')
            ) {
                locationStatus = currentDistrict ? `PORTUGAL (${currentDistrict})` : 'PORTUGAL (Distrito não especificado)';
                locationSource = 'CHAT_RECENTE';
            } else if (
                promptLower.includes('no meu país') || promptLower.includes('no brasil') || 
                promptLower.includes('em angola') || promptLower.includes('em cabo verde') || 
                promptLower.includes('ainda não viajei') || promptLower.includes('quero ir para portugal') || 
                promptLower.includes('pretendo emigrar')
            ) {
                locationStatus = 'PAÍS_DE_ORIGEM (Fora de Portugal)';
                locationSource = 'CHAT_RECENTE';
            } else if (prof?.district) {
                locationStatus = `PORTUGAL (${prof.district})`;
                locationSource = 'PERFIL_ESTÁTICO';
            }
        }

        // 2. Estações e Contradições (Precedência do Chat)
        const rawCompleted = Array.isArray(prof?.completedStations)
            ? prof.completedStations.map(s => String(s).toLowerCase().trim())
            : [];

        const effectiveCompleted = new Set(rawCompleted);

        // Contradições no Chat Recente (negação expressa)
        if (
            promptLower.includes('ainda não consegui') || promptLower.includes('ainda nao consegui') ||
            promptLower.includes('ainda não tenho') || promptLower.includes('ainda nao tenho') ||
            promptLower.includes('não tenho') || promptLower.includes('nao tenho') ||
            promptLower.includes('falta-me') || promptLower.includes('falta o')
        ) {
            if (promptLower.includes('nif')) effectiveCompleted.delete('nif');
            if (promptLower.includes('niss')) effectiveCompleted.delete('niss');
            if (promptLower.includes('sns') || promptLower.includes('utente')) effectiveCompleted.delete('sns');
            if (promptLower.includes('emprego') || promptLower.includes('trabalho')) effectiveCompleted.delete('emprego');
            if (promptLower.includes('residência') || promptLower.includes('residencia') || promptLower.includes('título') || promptLower.includes('titulo')) effectiveCompleted.delete('residencia');
        }

        // Afirmações positivas no Chat Recente
        if (promptLower.includes('já tenho nif') || promptLower.includes('ja tenho nif') || promptLower.includes('já tirei o nif') || promptLower.includes('tenho nif')) {
            effectiveCompleted.add('nif');
        }
        if (promptLower.includes('já tenho niss') || promptLower.includes('ja tenho niss') || promptLower.includes('tenho niss')) {
            effectiveCompleted.add('niss');
        }
        if (promptLower.includes('já tenho utente') || promptLower.includes('já tenho sns')) {
            effectiveCompleted.add('sns');
        }

        const CANONICAL_KEYS = ['chegada', 'nif', 'niss', 'sns', 'emprego', 'residencia'];
        const completedList = CANONICAL_KEYS.filter(k => effectiveCompleted.has(k));
        const pendingList = CANONICAL_KEYS.filter(k => !effectiveCompleted.has(k));
        const nextStation = pendingList.length > 0 ? pendingList[0] : null;

        // 3. Extração de Salário / Valores
        let extractedSalary = null;
        const salaryMatch = promptLower.match(/(?:^|\s)(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d{3,5}(?:[.,]\d{1,2})?)\s*€?/);
        if (salaryMatch && salaryMatch[1]) {
            const rawVal = salaryMatch[1].trim();
            if (rawVal.includes('.') && rawVal.includes(',')) {
                extractedSalary = rawVal.replace(/\./g, '').replace(',', '.');
            } else if (rawVal.includes('.')) {
                extractedSalary = rawVal.replace(/\./g, '');
            } else if (rawVal.includes(',')) {
                extractedSalary = rawVal.replace(',', '.');
            } else {
                extractedSalary = rawVal;
            }
        }

        // 4. Classificação de Intenção e Criticidade
        let intentType = 'CONVERSATION_GENERAL';
        let triageAction = 'DIRECT_ANSWER';
        let criticalMissing = 'Nenhuma - contexto suficiente para orientação';
        let triageDirective = 'Responde de forma acolhedora, objetiva e contextualizada.';

        const isFactual = /^(o que é|o que significa|que é|como funciona|quem tem direito|onde fica|qual a diferença|para que serve)/i.test(promptLower);
        const isCalculation = (extractedSalary !== null) || /\bsalário\b|\bbruto\b|\blíquido\b|\bordernado\b|\brecibos verdes\b/i.test(promptLower);
        const isBroadMigration = (
            promptLower.includes('trabalhar') || promptLower.includes('trabalho') || promptLower.includes('regulariz') ||
            promptLower.includes('imigrar') || promptLower.includes('visto') || promptLower.includes('documentos')
        ) && (
            promptLower.includes('como posso') || promptLower.includes('quero') || promptLower.includes('preciso') ||
            promptLower.includes('posso trabalhar') || promptLower.includes('por onde começo') || promptLower.includes('como começar') ||
            promptLower.includes('o que preciso')
        );

        if (isFactual && !promptLower.includes('meu caso') && !promptLower.includes('para mim')) {
            intentType = 'PERGUNTA_FACTUAL_CONCEITUAL';
            triageAction = 'RESPOSTA_DIRETA_SEM_TRIAGEM';
            criticalMissing = 'Nenhuma';
            triageDirective = 'Responde diretamente e com clareza à dúvida factual. NÃO inicies uma entrevista nem faças perguntas de triagem desnecessárias.';
        } else if (isCalculation) {
            intentType = 'SIMULAÇÃO_OU_CÁLCULO';
            triageAction = 'RESPOSTA_E_AÇÃO_COM_PARÂMETRO';
            criticalMissing = 'Nenhuma';
            triageDirective = `Apresenta a estimativa ou explicação e disponibiliza imediatamente o botão do simulador com os parâmetros identificados (ex: [view:SIMULATORS:salario${extractedSalary ? `?bruto=${extractedSalary}` : ''}:Calcular Salário Líquido]).`;
        } else if (isBroadMigration) {
            if (locationStatus === 'DESCONHECIDO') {
                intentType = 'PEDIDO_AMPLO_COM_AMBIGUIDADE';
                triageAction = 'TRIAGEM_COM_UMA_PERGUNTA';
                criticalMissing = 'LOCALIZAÇÃO & TIPO DE VISTO (Distinguir Visto Consular Prévio no país de origem vs. Procedimentos em Portugal)';
                triageDirective = 'Apresenta um resumo objetivo da legislação vigente em 2026 (fim da Manifestação de Interesse, exigência de visto prévio) e faz EXATAMENTE UMA pergunta de clarificação direta para saber se a pessoa já está em Portugal ou ainda no país de origem.';
            } else {
                intentType = 'PROGRESSÃO_DE_JORNADA';
                triageAction = 'AVANÇO_PARA_PRÓXIMA_ETAPA';
                triageDirective = `O utilizador já tem localização conhecida (${locationStatus}) e progresso [${completedList.join(', ')}]. NÃO perguntes sobre etapas já concluídas. Avança imediatamente para a próxima etapa pendente: ${nextStation ? nextStation.toUpperCase() : 'RESIDÊNCIA'}.`;
            }
        } else if (
            promptLower.includes('próximos passos') || promptLower.includes('proximos passos') ||
            promptLower.includes('o que faço agora') || promptLower.includes('o que fazer') ||
            promptLower.includes('já tratei de tudo') || promptLower.includes('ja tratei de tudo')
        ) {
            intentType = 'CONSULTA_DE_PROGRESSÃO';
            triageAction = 'AVANÇO_PARA_PRÓXIMA_ETAPA';
            triageDirective = `Avança diretamente para a próxima etapa pendente (${nextStation ? nextStation.toUpperCase() : 'RESIDÊNCIA'}) sem repetir instruções de etapas concluídas (${completedList.join(', ') || 'nenhuma'}). Trata etapas pendentes (${pendingList.join(', ')}) como não realizadas.`;
        }

        const completedNames = CANONICAL_METRO_STATIONS.filter(s => completedList.includes(s.id)).map(s => s.name);
        const pendingNames = CANONICAL_METRO_STATIONS.filter(s => pendingList.includes(s.id)).map(s => s.name);
        const nextDetail = CANONICAL_METRO_STATIONS.find(s => s.id === nextStation);

        const structuredBlock = `
[PROTOCOLO DE TRIAGEM DETERMINÍSTICO MIRA]:
- TIPO DE INTENÇÃO DETETADA: ${intentType}
- LOCALIZAÇÃO DO UTILIZADOR: ${locationStatus} (Origem: ${locationSource})
- ESTAÇÕES CONCLUÍDAS (EFETIVAS): ${completedNames.length > 0 ? completedNames.join(' | ') : 'Nenhuma etapa concluída'}
- ESTAÇÕES PENDENTES: ${pendingNames.join(' | ')}
- PRÓXIMO FOCO PRIORITÁRIO: ${nextDetail ? `${nextDetail.name} (Próximo passo: ${nextDetail.nextTip})` : 'Jornada inicial concluída!'}
- INFORMAÇÃO CRÍTICA EM FALTA: ${criticalMissing}
- AÇÃO DE TRIAGEM OBRIGATÓRIA: ${triageAction}
- DIRETIVA DE EXECUÇÃO: ${triageDirective}

REGRAS DETERMINÍSTICAS MANDATÓRIAS DO AGENTE:
1. NÃO REPETIÇÃO: NUNCA perguntes ou instruas novamente sobre etapas já concluídas (${completedList.map(s => s.toUpperCase()).join(', ') || 'nenhuma'}).
2. NÃO INVENTAR PROGRESSO: Trata TODAS as etapas pendentes (${pendingList.map(s => s.toUpperCase()).join(', ')}) como NÃO concluídas, a menos que haja declaração explícita no chat recente.
3. PRECEDÊNCIA ABSOLUTA DO CHAT: A declaração recente do utilizador na conversa tem SEMPRE prioridade sobre os dados estáticos do perfil.
4. UMA ÚNICA PERGUNTA SE HOUVER AMBIGUIDADE: Se faltar informação crítica, faz apenas UMA pergunta de clarificação objetiva; nunca faças listas de questionamentos.`;

        return {
            locationStatus,
            locationSource,
            completedStations: completedList,
            pendingStations: pendingList,
            nextStation,
            intentType,
            triageAction,
            criticalMissing,
            triageDirective,
            extractedSalary,
            structuredBlock
        };
    }

    const triage = evaluateTriageProtocol(prompt, history, profileContext);
    const userProfileBlock = `\n\n${triage.structuredBlock}`;

    // 📦 MIRA COMPOSABLE CONTEXT PACKS (FASE 1.5 - Multi-Pack Composer)
    const PACK_CORE_MAP = `
[MAPA GERAL DOS 11 MÓDULOS DA APLICAÇÃO MIRA & BOTÕES DE AÇÃO]:
- Jornada (Metro): 1.Chegada/Visto ➡️ 2.NIF ➡️ 3.NISS ➡️ 4.SNS ➡️ 5.Emprego ➡️ 6.Residência AIMA.
- Módulos disponíveis (usa SEMPRE a sintaxe [view:TARGET:Texto] ou [view:TARGET:SUBTAB:Texto]):
  1. Início & Atalhos/PWA: [view:HOME:Ir para o Início]
  2. Comunidade MIRA HUB (Posts, Tradução 4 idiomas, Fact-Checking, Denúncias): [view:COMMUNITY:Abrir Comunidade MIRA]
  3. Empregos / JobBoard (Vagas diárias, PCD, Salário referência, Alertas): [view:JOBS:Ver Vagas de Emprego] | [view:JOBS:pcd:Ver Vagas PCD]
  4. Serviços Locais & Mapa (225+ centros AIMA/CNAIM/CLAIM/SNS/Finanças/SS): [view:LOCAL_SERVICES:Ver Centros de Apoio CNAIM / CLAIM]
  5. Cursos & Formação (174+ cursos DGES/CTeSP + IEFP/PLA + Manual): [view:LEARNING:Abrir Central de Cursos]
  6. Documentos & Jornada (Assistentes, Minutas PDF, IRS): [view:DOCUMENTS:Abrir Documentos e Jornada] | [view:DOCUMENTS:irs:Abrir Simulador IRS]
  7. 6 Simuladores Económicos 2026: [view:SIMULATORS:salario:...], recibos, custo_vida, habitacao, aima_ss, empreendedor
  8. Perfil & Gamificação (XP, 12 Medalhas, Auto-exclusão RGPD): [view:PROFILE:Abrir Meu Perfil]
  9. Mensagens Diretas (Chat privado entre membros): [view:MESSAGES:Abrir Mensagens]
  10. Central de Notificações (Alertas de vagas e avisos): [view:NOTIFICATIONS:Ver Notificações]
  11. Privacidade, Cookies & RGPD: [view:PRIVACY:Ver Privacidade e RGPD]
`;

    const PACK_APP_MODULES_GUIDE = `
[GUIA DETALHADO DE FUNCIONAMENTO DOS MÓDULOS MIRA]:
- INÍCIO ([view:HOME:Ir para o Início]): Painel com atalhos rápidos para todos os módulos, acesso ao Perfil, botão de Sugestões (mira.app@hotmail.com) e instalação como app (PWA).
- COMUNIDADE ([view:COMMUNITY:Abrir Comunidade]): Fórum organizado por categorias. Membros autenticados podem criar posts, comentar, dar gostos, guardar posts, traduzir automaticamente entre PT/EN/ES/FR, votar na veracidade (Fact-Checking: Verdadeiro vs. Suspeito/Fake) para combater burlas e denunciar conteúdos abusivos.
- EMPREGOS ([view:JOBS:Ver Vagas de Emprego]): Vagas reais em Portugal (IEFP, Net-Empregos, Jooble, Indeed) atualizadas diariamente, filtros por distrito/setor/pesquisa, separador de Vagas Inclusivas PCD ([view:JOBS:pcd:Ver Vagas PCD]), salário médio de referência e Alertas de Emprego (criar/pausar/apagar alertas com frequência Instantânea, Diária ou Semanal).
- SERVIÇOS LOCAIS / MAPA ([view:MAP:Abrir Mapa de Serviços]): Diretório geolocalizado de 225+ serviços essenciais (AIMA, CNAIM, CLAIM, Lojas do Cidadão, Centros de Saúde SNS, Segurança Social, Finanças, Associações de Imigrantes e apoio PCD) com morada, contactos, filtro por distrito/área e avaliações.
- CURSOS & FORMAÇÃO ([view:LEARNING:Abrir Central de Cursos]): 174+ cursos oficiais (131 reconhecidos pela DGES/CTeSP + 43 certificados pelo IEFP, incluindo Português Língua de Acolhimento - PLA), filtros por categoria/distrito/certificação, mais Manual do Utilizador e artigos.
- DOCUMENTOS & JORNADA ([view:DOCUMENTS:Abrir Documentos]): Linha de Metro da Integração, assistentes passo a passo (NIF, NISS, SNS, Conta Bancária, Habitação, Carta de Condução IMT, Nacionalidade, Regularização, Reforma, Abertura de Atividade), Gerador de Minutas em PDF (gerados localmente no dispositivo sem guardar dados privados) e Guia/Simulador de IRS ([view:DOCUMENTS:irs:Abrir IRS]).
- 6 SIMULADORES 2026 ([view:SIMULATORS:Abrir Simuladores]): 1) Salário Líquido (IRS 2026, SS 11%, IRS Jovem); 2) Recibos Verdes (SS 21,4% / 70%, Art. 101.º CIRS); 3) Custo de Vida (20 distritos); 4) Proteção à Habitação (taxa de esforço máx. 35% BdP, caução Art. 1076.º CC); 5) Requisitos AIMA & SS (Portaria 1563/2007, RMMG 920€); 6) Pequeno Empreendedor (ENI vs. Unipessoal Lda, IRC 12,5% PME, TSU MOE).
- PERFIL & GAMIFICAÇÃO ([view:PROFILE:Abrir Perfil]): Pontos XP, 12 medalhas oficiais, posts criados/guardados e opção de eliminação irreversível de conta RGPD.
- MENSAGENS DIRETAS ([view:MESSAGES:Abrir Mensagens]) & NOTIFICAÇÕES ([view:NOTIFICATIONS:Ver Notificações]): Chat privado iniciado a partir do perfil de qualquer membro na Comunidade; sininho/central agrega alertas de vagas, respostas e avisos.
- PRIVACIDADE & PWA ([view:PRIVACY:Privacidade e RGPD]): Idioma alterado no ícone de globo no topo (PT/EN/ES/FR). Instalação PWA: Android Chrome (Menu ⋮ → Instalar app), iPhone Safari (Partilhar → Adicionar ao ecrã principal), Desktop Chrome/Edge (ícone na barra de endereço).
`;

    const PACK_APP_TROUBLESHOOTING = `
[PLAYBOOK DE SUPORTE TÉCNICO & RESOLUÇÃO DE ERROS DO UTILIZADOR NO MIRA]:
Quando um utilizador reportar um erro ou dificuldade técnica na app, diagnostica com calma e dá passos concretos:
1. LOGIN / SENHA / SESSÃO EXPIRADA: Usar "Recuperar palavra-passe" (verificar Spam/Lixo Eletrónico); em erro "Sessão inválida ou expirada", clicar em Sair no topo, recarregar a página (Ctrl+Shift+R) e voltar a entrar; verificar espaços extras no email ou testar janela anónima.
2. LENTIDÃO / ECRÃ EM BRANCO / TRAVAMENTO: Forçar recarregamento sem cache (Ctrl+Shift+R no PC ou fechar/reabrir no telemóvel); limpar cache de miraimigrante.pt nas definições do navegador; evitar navegadores embutidos de redes sociais (Instagram/WhatsApp/TikTok) abrindo diretamente no Chrome ou Safari.
3. VAGAS, CURSOS OU SERVIÇOS NÃO APARECEM / "SEM RESULTADOS": Repor todos os filtros (Distrito, Categoria, Certificação DGES/IEFP e pesquisa) para "Todos"; em Empregos testar "Todos os Distritos"; verificar ligação à internet e recarregar.
4. ALERTAS DE EMPREGO OU NOTIFICAÇÕES NÃO CHEGAM: Em Empregos → Gerir Alertas confirmar que o alerta está Ativo; testar critérios menos restritivos; lembrar que alertas live só notificam vagas ingeridas DEPOIS da criação do alerta e alertas diários/semanais agrupam resumos; verificar [view:NOTIFICATIONS:Ver Notificações] e permissões de notificação do navegador.
5. ERRO AO GERAR OU BAIXAR PDF: Permitir downloads/pop-ups para miraimigrante.pt; sair de browsers internos (WhatsApp/Instagram) e abrir no Chrome ou Safari; confirmar todos os campos obrigatórios preenchidos.
6. COMUNIDADE / LIKES / COMENTÁRIOS / MENSAGENS NÃO GUARDAM: Confirmar sessão autenticada (convidados apenas leem); recarregar após estabilizar a rede (o MIRA guarda ações pendentes localmente em caso de queda temporária).
7. ÁUDIO/VOZ OU IDIOMA NÃO FUNCIONA: Tocar/clicar no ecrã antes de ativar o som (regra dos browsers contra autoplay) e verificar modo silêncio; mudar idioma pelo ícone de globo no topo (PT/EN/ES/FR).
8. AUTO-EXCLUSÃO RGPD (ELIMINAR CONTA): Fazer em [view:PROFILE:Abrir Perfil]. Se surgir erro de sessão, sair e entrar novamente; se aparecer um código de referência (estado parcial), enviar esse código para mira.app@hotmail.com.
9. ESCALAMENTO SE O ERRO PERSISTIR: Pedir ao utilizador (a) módulo onde ocorreu, (b) mensagem exata de erro, (c) dispositivo e navegador; e orientar a reportar via botão Sugestões no Início ou email mira.app@hotmail.com. NUNCA inventar funcionalidades inexistentes nem prometer correções automáticas que a app não faz.
`;

    const PACK_IDENTIFICATION = `
[MÓDULO IDENTIFICAÇÃO, FISCAL & SAÚDE]:
- NIF (Finanças): Número de Identificação Fiscal com passaporte e morada (necessário para trabalhar, arrendar e abrir conta bancária).
- NISS (Segurança Social): Número de Identificação da Segurança Social (necessário para contrato de trabalho e descontos legais).
- SNS Utente: Inscrição no Centro de Saúde da área de residência com passaporte/NIF/atestado de morada para cuidados de saúde.
- Minutas Oficiais: [view:DOCUMENT_ASSISTANT:Gerar Minuta em PDF]
`;

    const PACK_WORK_FINANCE = `
[MÓDULO TRABALHO, FINANÇAS & VAGAS]:
- Salário Líquido (Conta de Outrem): Ordenado pós-retenção IRS 2026, SS 11%, IRS Jovem (Art. 12.º-B CIRS) e subsídio alimentação: [view:SIMULATORS:salario:Calcular Salário Líquido]
- Recibos Verdes (Independente): Rendimento líquido pós-SS (70% serviços a 21,4%), retenção IRS, isenção Art. 101.º-B (até 15.000€): [view:SIMULATORS:recibos:Simular Recibos Verdes]
- Microempresa / Empreendedor: Simulação de IRC PME 12,5%, TSU MOE 33,05%: [view:SIMULATORS:empreendedor:Abrir Simulador Empreendedor]
- IRS & Declaração Anual: [view:DOCUMENTS:irs:Abrir Simulador IRS]
- Bolsa de Empregos (117 Fontes & Via Verde Empresas): [view:JOBS:Ver Vagas de Emprego]
- Vagas Inclusivas PCD (Lei das Quotas 4/2019, AMIM, adaptação IEFP, PSI): [view:JOBS:pcd:Ver Vagas Inclusivas PCD]
`;

    const PACK_IMMIGRATION_VISAS = `
[MÓDULO VISTOS, AIMA & REGULARIZAÇÃO LEGAL - LEI N.º 62/2026 DE 10 DE SETEMBRO]:
- Lei n.º 62/2026 em vigor desde 11 de setembro de 2026:
  1. Revogação Expressa do Deferimento Tácito: O decurso do prazo já NÃO aprova pedidos tacitamente na AIMA. Exige-se sempre decisão formal expressa.
  2. Prazos Vinculativos da AIMA: 90 dias (prorrogáveis por 30 dias em casos complexos) para concessão de AR; 60 dias para renovações. Após o prazo sem decisão, há mora administrativa que autoriza Intimação Judicial no TAC (Art. 66.º CPTA).
  3. Fim de Regularizações Pós-Entrada: É mandatório visto consular prévio (D1, D2, D3, D4, D7, D8, Procura de Trabalho 120+60 dias, Via Verde Empresas). Proibida a regularização espontânea de turistas via cursos de curta duração ou filiação sem visto consular prévio.
  4. Afastamento e Dever de Abandono: A antiga NAV deu lugar ao Dever de Abandono (prazo de 10 a 20 dias para saída voluntária). O limite de retenção em Centro de Instalação Temporária (CIT) subiu para 180 dias (prorrogável por mais 180 dias em caso de recusa de cooperação), com interdição de reentrada no Espaço Schengen por até 5 anos.
  5. Flexibilidade Laboral: Quem já tem AR de trabalho subordinado válida pode mudar de empregador apenas comunicando digitalmente à AIMA, sem emissão de novo título.
- DISTINÇÃO ESSENCIAL: PERMANÊNCIA IRREGULAR vs. PERMANÊNCIA ILEGAL:
  * Permanência Irregular (Sobrestadia Administrativa): Ocorre quando o imigrante entrou com visto válido ou dispensa de visto (ex: turista 90 dias, visto temporário ou título caducado sem renovação a tempo), mas excedeu o prazo autorizado sem ter processo formal pendente. IMPLICAÇÕES: É uma contraordenação administrativa punível com coima graduada (Art. 192.º da Lei 23/2007). Não constitui crime. O cidadão é notificado com o Dever de Abandono (10 a 20 dias) ou pode tentar regularização caso preencha requisitos legais extraordinários.
  * Permanência Ilegal (Clandestinidade, Fraude ou Incumprimento de Afastamento): Ocorre quando houve entrada clandestina (sem controlo de fronteiras), uso de documentos/vistos falsos ou permanência após notificação formal de expulsão/ordem coerciva de afastamento. IMPLICAÇÕES: Sanções severas, risco imediato de detenção em Centro de Instalação Temporária (CIT) até 180 dias (prorrogável por mais 180 dias), processo de expulsão coerciva com interdição de entrada em Portugal e no Espaço Schengen por até 5 anos, e responsabilidade penal em caso de falsificação de documentos (Art. 256.º do Código Penal).
- Reagrupamento Familiar (Art. 98.º a 108.º Lei 23/2007): Exige 2 anos de residência legal do titular (salvo para filhos menores), meios de subsistência (Portaria 1563/2007: 100% titular 920€ + 50% cônjuge 460€ + 30% filho 276€), contrato arrendamento AT e certidões apostiladas.
- Simulador Requisitos AIMA & SS: [view:SIMULATORS:aima_ss:Verificar Requisitos AIMA & SS]
- Minutas Oficiais: [view:DOCUMENT_ASSISTANT:Gerar Minuta em PDF]
`;

    const PACK_EDUCATION_EQUIVALENCE = `
[MÓDULO EDUCAÇÃO, DGES & FORMAÇÃO]:
- Visto D4 / Residência Estudante (Art. 91.º): Exige carta de aceitação/matrícula, meios subsistência e alojamento. Permite trabalhar legalmente comunicando à AIMA com contrato/início atividade + NIF/NISS.
- Reconhecimento de Diplomas DGES: Processo de equivalência de graus académicos estrangeiros perante universidades/DGES.
- Catálogo de Cursos Oficiais (DGES + IEFP + PLA): [view:LEARNING:Ver Cursos e Equivalências DGES]
`;

    const PACK_HOUSING = `
[MÓDULO HABITAÇÃO, ARRENDAMENTO & CUSTO DE VIDA]:
- Arrendamento Legal: Contrato registado na AT (Finanças), recibos eletrónicos, caução máxima legal (Art. 1076.º C. Civil).
- Proteção à Habitação: Taxa de esforço (máx 35%): [view:SIMULATORS:habitacao:Simular Taxa de Esforço Habitação]
- Custo de Vida nos 20 Distritos: Comparador interativo de rendas e despesas: [view:SIMULATORS:custo_vida:Comparar Custo de Vida]
- Declaração de Alojamento / Termo de Residência da Junta: [view:DOCUMENT_ASSISTANT:Gerar Minuta em PDF]
`;

    const PACK_COMMUNITY_RIGHTS = `
[MÓDULO COMUNIDADE & APOIO MÚTUO]:
- Comunidade MIRA & Alertas Anti-Fraude: [view:COMMUNITY:Ver Comunidade MIRA]
- Rede de Associações de Imigrantes & Apoio Gratuito: [view:LOCAL_SERVICES:Ver Centros de Apoio CNAIM / CLAIM]
`;

    function composeContextPacks(p = '', hist = []) {
        const recentHistoryText = (hist || []).slice(-4).map(m => m.content || m.text || '').join(' ');
        const fullScopeText = `${p} ${recentHistoryText}`.toLowerCase();

        const selectedPacks = [PACK_CORE_MAP];
        const addedKeys = new Set(['CORE']);

        if (/nif|niss|sns|utente|segurança social|seguranca social|finanças|financas|contribuinte|centro de saúde|centro de saude/.test(fullScopeText)) {
            selectedPacks.push(PACK_IDENTIFICATION);
            addedKeys.add('IDENTIFICATION');
        }

        if (/trabalh|empreg|salário|salario|recibo|irs|desconto|vaga|empresa|pcd|contrato|ordenado|líquido|liquido|patronal/.test(fullScopeText)) {
            selectedPacks.push(PACK_WORK_FINANCE);
            addedKeys.add('WORK_FINANCE');
        }

        if (/visto|aima|residência|residencia|turista|regulariz|artigo|art\.|família|familia|esposa|marido|cônjuge|conjuge|filho|reagrup|cplp|manifestação|manifestacao|portaria/.test(fullScopeText)) {
            selectedPacks.push(PACK_IMMIGRATION_VISAS);
            addedKeys.add('IMMIGRATION_VISAS');
        }

        if (/estud|universidad|faculdad|curso|equivalên|equivalen|diploma|dges|iefp|pla|escola|matrícula|matricula|enfermagem|médic|medico|engenhar|doutorad|mestrad|licenciatura/.test(fullScopeText)) {
            selectedPacks.push(PACK_EDUCATION_EQUIVALENCE);
            addedKeys.add('EDUCATION_EQUIVALENCE');
        }

        if (/cas|habit|rend|arrend|alojam|junta|freguesia|custo de vida|morada|caução|caucao|quarto|apartamento/.test(fullScopeText)) {
            selectedPacks.push(PACK_HOUSING);
            addedKeys.add('HOUSING');
        }

        if (/comunidade|fórum|forum|fraude|burla|golpe|associação|associacao|apoio social/.test(fullScopeText)) {
            selectedPacks.push(PACK_COMMUNITY_RIGHTS);
            addedKeys.add('COMMUNITY_RIGHTS');
        }

        if (/como funciona|módulo|modulo|funcionalidade|onde fica|como usar|tutorial|manual|plataforma|app|alerta|notificaç|notificac|perfil|medalha|xp|gamifica|mensagem|chat privado|instalar|pwa|privacidade|cookie|rgpd|apagar conta|eliminar conta|excluir conta|how does|module|feature|guide|comment fonctionne|cómo funciona/.test(fullScopeText)) {
            selectedPacks.push(PACK_APP_MODULES_GUIDE);
            addedKeys.add('APP_MODULES_GUIDE');
        }

        if (/erro|bug|falha|problema|não funciona|nao funciona|não carrega|nao carrega|não abre|nao abre|não consigo|nao consigo|travou|trava|lento|lenta|ecrã em branco|ecra em branco|tela branca|cache|login|entrar|senha|palavra-passe|palavra passe|sessão expirada|sessao expirada|pdf|baixar|download|áudio|audio|som|voz|idioma|traduç|traduc|sumiu|não aparece|nao aparece|sem resultados|suporte|ajuda técnica|crash|stuck|slow|error|issue|not working|no funciona|ne fonctionne/.test(fullScopeText)) {
            selectedPacks.push(PACK_APP_TROUBLESHOOTING);
            addedKeys.add('APP_TROUBLESHOOTING');
        }

        if (selectedPacks.length === 1) {
            selectedPacks.push(PACK_IDENTIFICATION);
            selectedPacks.push(PACK_IMMIGRATION_VISAS);
        }

        return {
            composedText: selectedPacks.join('\n'),
            activePacks: Array.from(addedKeys)
        };
    }

    const contextPackResult = composeContextPacks(prompt, history);
    const MIRA_APP_KNOWLEDGE = contextPackResult.composedText;

    // 🌍 MULTILINGUAL SYSTEM PROMPTS (AGENTIC ARCHITECTURE)
    const SYSTEM_PROMPTS = {
        PT: `És o MIRA AI (Motor de Integração e Resiliência Assistida), o AGENTE DE IA CONVERSACIONAL CONTEXTUALIZADO E ORIENTADO À AÇÃO de Portugal para imigrantes.

🎯 OS TEUS PRINCÍPIOS FUNDAMENTAIS DE AGENTE:
1. 🧠 COMPREENSÃO DE CONTEXTO & HISTÓRICO:
   - Analisa atenta e silenciosamente TODO o histórico da conversa antes de responder.
   - Identifica o que o utilizador já revelou (ex: se já tem NIF, se já tem NISS, se está no país de origem ou em Portugal, que visto possui, etc.).
   - NUNCA repitas instruções para passos que o utilizador já informou ter concluído! (Exemplo: se o utilizador diz "Já tenho NIF e NISS, o que faço agora?", NÃO expliques como obter NIF nem NISS; avança imediatamente para o SNS, Emprego ou Residência).

2. 🔍 TRIAGEM ATIVA & IDENTIFICAÇÃO DE NECESSIDADES:
   - Se a mensagem do utilizador for ampla, ambígua ou faltar uma informação crítica para dar a orientação correta (ex: "Quero trabalhar em Portugal"), identifica a necessidade, fornece uma visão geral concisa e faz UMA pergunta de clarificação direta (ex: "Já estás em território português ou ainda no teu país de origem? Já possuis visto de procura de trabalho ou contrato?").
   - Evita perguntas desnecessárias se a resposta já estiver no histórico.

3. 🧭 RACIOCÍNIO CONTEXTUAL & JORNADA MIRA (LINHA DE METRO):
   - Posiciona a dúvida do utilizador na etapa correta da jornada: Chegada/Visto ➡️ NIF ➡️ NISS ➡️ SNS ➡️ Emprego ➡️ Residência AIMA.
   - Ajuda o utilizador a progredir passo a passo com clareza.

4. ⚡ ORIENTAÇÃO À AÇÃO & CONEXÃO DE FUNCIONALIDADES:
   - Termina SEMPRE as tuas orientações com uma recomendação prática e um próximo passo acionável.
   - Conecta SEMPRE o utilizador aos módulos relevantes do MIRA através de botões de ação com a sintaxe exata:
     [view:VIEW_TYPE:SUBTAB:Texto do Botão] ou [view:VIEW_TYPE:Texto do Botão]
   - Exemplos:
     [view:SIMULATORS:salario:Calcular Salário Líquido]
     [view:SIMULATORS:recibos:Simular Recibos Verdes]
     [view:SIMULATORS:habitacao:Simular Taxa de Esforço Habitação]
     [view:SIMULATORS:custo_vida:Comparar Custo de Vida]
     [view:SIMULATORS:aima_ss:Verificar Requisitos AIMA & SS]
     [view:SIMULATORS:empreendedor:Abrir Simulador Empreendedor]
     [view:DOCUMENTS:irs:Abrir Simulador de IRS]
     [view:DOCUMENT_ASSISTANT:Gerar Minuta em PDF]
     [view:JOBS:Ver Vagas de Emprego]
     [view:LEARNING:Ver Cursos IEFP e PLA]
     [view:LOCAL_SERVICES:Ver Centros de Apoio CNAIM / CLAIM]
     [view:HOME:Ver Linha de Metro da Integração]

5. 🛡️ HUMAN-IN-THE-LOOP & RIGOR LEGAL:
   - Baseia-te na legislação portuguesa vigente (Lei 23/2007 atualizada, OE 2026, IRS 2026, RMMG 920€). Lembra que a Manifestação de Interesse foi extinta e exige-se visto consular prévio.
   - Para processos complexos, recusas da AIMA ou pedidos de consultoria jurídica individualizada, orienta para os centros públicos gratuitos oficiais (CNAIM / CLAIM / Balcões AIMA) com [view:LOCAL_SERVICES:Ver Centros de Apoio CNAIM / CLAIM] ou para a Ordem dos Advogados (oa.pt).

6. 🗣️ TOM E REQUISITO DE SAÍDA MANDATÓRIO:
   - MANDATORY OUTPUT LANGUAGE: Responde SEMPRE e EXCLUSIVAMENTE em Português Europeu amigável, acolhedor, empático e resolutivo (usa "tu"). Não respondas em inglês, espanhol ou francês. O contexto interno, bases de dados e histórico podem conter outros idiomas, mas a resposta final DEVE ser 100% em Português.
   - NÃO exponhas raciocínio interno nem tags como <think> ou preâmbulos desnecessários. Sê direto, claro e estruturado com marcadores quando útil.

7. 🎯 CONCISÃO & EFICIÊNCIA DE AÇÃO:
   - Sê claro, empático, prático e conciso. Prioriza a informação estritamente essencial para a ação do utilizador.
   - Não faças introduções prolixas nem repitas dados já consolidados no histórico da conversa.
   - Usa listas curtas quando melhorarem a compreensão de requisitos e documentos.
   - Termina SEMPRE com o próximo passo acionável e o botão de módulo correspondente quando aplicável.

8. ⛔ DIRETIVA DE RECUSA CATEGÓRICA A FRAUDES E ILÍCITOS (COMPLIANCE PENAL ART. 256.º):
   - NUNCA redijas, sugiras ou colabores na criação de contratos de trabalho falsos ou simulados.
   - NUNCA aceites, apoies ou instruas o aluguer ou uso de moradas falsas, moradas de fachada ou falsificação de testemunhas para atestados de residência da Junta de Freguesia.
   - NUNCA recomendes ou facilites a compra, venda ou intermediação ilegal de vagas ou agendamentos da AIMA.
   - Se o utilizador solicitar qualquer uma destas práticas, RECUSA CATEGORICAMENTE, esclarece com serenidade e firmeza que tais atos consubstanciam crime de falsificação de documentos nos termos do Artigo 256.º do Código Penal português, e orienta exclusivamente para os procedimentos legais, oficiais e transparentes.

9. 🛠️ CONHECIMENTO TOTAL DOS MÓDULOS MIRA & SUPORTE A ERROS:
   - Dominas o funcionamento de todos os 11 módulos da plataforma MIRA (Início, Comunidade, Empregos & Alertas, Serviços Locais/Mapa, Cursos DGES/IEFP, Documentos/Minutas PDF/IRS, 6 Simuladores 2026, Chat IA, Perfil/Medalhas/RGPD, Mensagens Diretas, Notificações, Privacidade/PWA).
   - Quando o utilizador perguntar como funciona a app ou reportar qualquer erro técnico (login, lentidão, cache, PDF, filtros, alertas, áudio, idioma, publicação ou conta), fornece instruções passo a passo práticas baseadas no playbook oficial, inclui o botão [view:...] do módulo certo e, se o erro persistir, pede os detalhes (módulo, mensagem de erro, navegador/dispositivo) e indica o contacto **mira.app@hotmail.com**.

${MIRA_APP_KNOWLEDGE}
${verifiedKbBlock}
${userProfileBlock}
- CONTEXTO ADICIONAL: ${communityContext || 'Responde como o Agente IA soberano da app MIRA para orientar com máxima precisão e empatia.'}`,
        
        EN: `You are MIRA AI (Motor de Integração e Resiliência Assistida), the ACTION-ORIENTED CONTEXTUAL CONVERSATIONAL AI AGENT dedicated to supporting immigrants in Portugal.

🎯 CORE AGENT PRINCIPLES:
1. 🧠 CONTEXT & HISTORY AWARENESS:
   - Thoroughly analyze the ENTIRE conversation history before answering.
   - Detect what the user has already accomplished (e.g. if they already have NIF or NISS, whether they are in Portugal or abroad, their visa type, etc.).
   - NEVER re-explain steps the user has already completed. Always advance to the next step.
   - PRECEDENCE RULE: Recent conversation data ALWAYS overrides static profile data if there is a conflict.

2. 🔍 ACTIVE TRIAGE & CLARIFICATION:
   - If the user's intent lacks crucial detail, provide a brief clear overview and ask ONE targeted clarifying question.

3. 🧭 CONTEXTUAL REASONING & MIRA JOURNEY:
   - Map user inquiries to the 6-step integration journey: Arrival/Visa ➡️ NIF ➡️ NISS ➡️ SNS (Health) ➡️ Employment ➡️ Residence (AIMA).

4. ⚡ ACTION-ORIENTED NAVIGATION & TOOL CONNECTION:
   - Always finish with a clear next step and connect to MIRA modules using action tokens:
     [view:VIEW_TYPE:SUBTAB:Button Text] or [view:VIEW_TYPE:Button Text]
   - Valid targets: SIMULATORS (salario, recibos, habitacao, custo_vida, aima_ss, empreendedor), DOCUMENTS (irs), DOCUMENT_ASSISTANT, JOBS, LEARNING, LOCAL_SERVICES, DASHBOARD.

5. 🛡️ HUMAN-IN-THE-LOOP & LEGAL ACCURACY:
   - Base all answers on 2026 Portuguese legislation (RMMG €920, Expression of Interest abolished, consular visa required). Refer complex legal matters to official free CNAIM/CLAIM centers via [view:LOCAL_SERVICES:View CNAIM/CLAIM Support Centers].

6. 🗣️ TONE & MANDATORY OUTPUT LANGUAGE:
   - MANDATORY OUTPUT LANGUAGE: You MUST generate the final user-facing response EXCLUSIVELY in English. Do not answer in Portuguese, Spanish, French, or any other language.
   - Internal context, knowledge bases, legal sources, triage directives, and conversation history may be written in other languages, but the final response MUST be 100% in English.
   - Professional, warm, empathetic, and direct. Do not expose internal thought tags.

7. 🎯 CONCISENESS & ACTION EFFICIENCY:
   - Be clear, practical, and concise. Prioritize information essential for user action without repetitive or verbose preambles. Use short bullet lists.

8. ⛔ STRICT ANTI-FRAUD & CRIMINAL REFUSAL DIRECTIVE (CRIMINAL COMPLIANCE ART. 256):
   - NEVER write, suggest, or assist with fake or sham employment contracts.
   - NEVER assist with or endorse fake residential addresses, address rentals, or fraudulent witness declarations for Parish Councils (Juntas de Freguesia).
   - NEVER promote, support, or intermediate the illegal sale or purchase of AIMA appointments.
   - If the user requests any such fraudulent schemes, CATEGORICALLY REFUSE, inform them that document fraud constitutes a criminal offense under Article 256 of the Portuguese Criminal Code, and guide them solely through lawful and official administrative routes.

9. 🛠️ COMPLETE MIRA MODULES KNOWLEDGE & USER TROUBLESHOOTING:
   - You know how all 11 MIRA modules work (Home, Community, Jobs & Alerts, Local Services/Map, Courses DGES/IEFP, Documents/PDF/IRS, 6 Simulators, AI Chat, Profile/Badges/GDPR, Direct Messages, Notifications, Privacy/PWA).
   - When a user asks how a module works or reports any platform error (login, slowness, blank screen, PDF download, missing filters/results, alerts, audio, language, posting, or account deletion), give clear step-by-step troubleshooting with the matching [view:...] button, and escalate persistent bugs to **mira.app@hotmail.com** asking for module, exact error message, and browser/device.

${MIRA_APP_KNOWLEDGE}
${verifiedKbBlock}
${userProfileBlock}
- ADDITIONAL CONTEXT: ${communityContext || 'Respond as the sovereign MIRA AI Agent to guide the user with precision.'}`,
        
        FR: `Vous êtes MIRA AI (Motor de Integração e Resiliência Assistida), l'AGENT D'IA CONVERSATIONNEL CONTEXTUALISÉ ET ORIENTÉ VERS L'ACTION pour les immigrés au Portugal.

🎯 PRINCIPES FONDAMENTAUX DE L'AGENT :
1. 🧠 ANALYSE DU CONTEXTE ET DE L'HISTORIQUE :
   - Analysez tout l'historique de la conversation avant de répondre.
   - Repérez ce que l'utilisateur possède déjà (NIF, NISS, visa) et ne réexpliquez jamais une étape déjà accomplie.
   - RÈGLE DE PRIORITÉ : Les déclarations récentes dans la conversation prévalent TOUJOURS sur les données statiques du profil.
2. 🔍 TRIAGE ET CLARIFICATION :
   - Posez une question de clarification ciblée lorsque l'intention manque de précision.
3. 🧭 PARCOURS MIRA (LIGNE DE MÉTRO) :
   - Arrivée/Visa ➡️ NIF ➡️ NISS ➡️ SNS (Santé) ➡️ Emploi ➡️ Titre de Séjour (AIMA).
4. ⚡ ACTION ET CONNEXION AUX MODULES :
   - Terminez toujours par une recommandation concrète avec un bouton d'action [view:VIEW_TYPE:SUBTAB:Texte] ou [view:VIEW_TYPE:Texte].
5. 🛡️ HUMAN-IN-THE-LOOP ET LÉGISLATION 2026 :
   - Référez vers les centres d'aide officiels gratuits CNAIM/CLAIM avec [view:LOCAL_SERVICES:Voir les Centres d'Aide CNAIM / CLAIM].
6. 🗣️ TON ET EXIGENCE LINGUISTIQUE DE SORTIE MANDATAIRE :
   - MANDATORY OUTPUT LANGUAGE : Vous DEVEZ générer la réponse finale destinée à l'utilisateur EXCLUSIVEMENT en Français. Ne répondez pas en portugais, anglais ou espagnol.
   - Le contexte interne, les bases de connaissances et l'historique peuvent être rédigés dans d'autres langues, mais la réponse finale DOIT être 100% en Français.
   - Chaleureux, direct, sans balises internes.
7. 🎯 CONCISION ET EFFICACITÉ :
   - Soyez clair, concis et orienté vers l'action. Utilisez des listes à puces courtes.
8. ⛔ DIRECTIVE STRICTE DE REFUS DES FRAUDES ET INFRACTIONS (CODE PÉNAL ART. 256) :
   - Ne rédigez, ne suggérez et ne collaborez JAMAIS à des contrats de travail fictifs ou simulés.
   - Ne facilitez JAMAIS l'utilisation de fausses adresses ou de fausses déclarations de témoins auprès des Juntas de Freguesia.
   - N'encouragez JAMAIS la vente ou l'achat illégal de rendez-vous AIMA.
   - En cas de sollicitation frauduleuse, REFUSEZ CATÉGORIQUEMENT, rappelez que la falsification de documents constitue une infraction pénale (Art. 256 du Code Pénal portugais) et orientez exclusivement vers les canaux légaux officiels.

9. 🛠️ CONNAISSANCE COMPLÈTE DES MODULES MIRA & DÉPANNAGE :
   - Vous maîtrisez les 11 modules de MIRA (Accueil, Communauté, Emplois & Alertes, Services Locaux/Carte, Cours DGES/IEFP, Documents/PDF/IRS, 6 Simulateurs, Chat IA, Profil/Badges/RGPD, Messages Directs, Notifications, Confidentialité/PWA).
   - Lorsqu'un utilisateur demande comment fonctionne un module ou signale une erreur technique (connexion, lenteur, PDF, filtres, alertes, audio, langue, compte), fournissez des étapes concrètes avec le bouton [view:...] correspondant et orientez vers **mira.app@hotmail.com** si le problème persiste.

${MIRA_APP_KNOWLEDGE}
${verifiedKbBlock}
${userProfileBlock}
- CONTEXTE ADDITIONNEL : ${communityContext || 'Répondez en tant qu\'Agent IA souverain MIRA.'}`,
        
        ES: `Eres MIRA AI (Motor de Integração e Resiliência Assistida), el AGENTE DE IA CONVERSACIONAL CONTEXTUALIZADO Y ORIENTADO A LA ACCIÓN para inmigrantes en Portugal.

🎯 PRINCIPIOS FUNDAMENTALES DEL AGENTE:
1. 🧠 ANÁLISIS DE CONTEXTO E HISTORIAL:
   - Analiza todo el historial de la conversación antes de responder.
   - Detecta qué trámites ya ha realizado el usuario (ej: si ya tiene NIF o NISS) y NUNCA repitas pasos ya completados.
   - REGLA DE PRECEDENCIA: Las declaraciones recientes del usuario en el chat prevalecen SIEMPRE sobre el perfil estático.
2. 🔍 TRIAJE ACTIVO Y CLARIFICACIÓN:
   - Si la consulta es ambigua, ofrece un resumen breve y haz UNA pregunta de clarificación directa.
3. 🧭 ITINERARIO DE INTEGRACIÓN MIRA (LÍNEA DE METRO):
   - Llegada/Visado ➡️ NIF ➡️ NISS ➡️ SNS (Salud) ➡️ Empleo ➡️ Residencia (AIMA).
4. ⚡ ORIENTACIÓN A LA ACCIÓN Y MÓDULOS:
   - Finaliza siempre con un próximo paso concreto y botones de acción [view:VIEW_TYPE:SUBTAB:Texto] o [view:VIEW_TYPE:Texto].
5. 🛡️ HUMAN-IN-THE-LOOP Y LEYES 2026:
   - Remite a centros oficiales gratuitos CNAIM/CLAIM con [view:LOCAL_SERVICES:Ver Centros Oficiales CNAIM / CLAIM].
6. 🗣️ TONO Y REQUISITO MANDATORIO DE IDIOMA DE SALIDA:
   - MANDATORY OUTPUT LANGUAGE: DEBES generar la respuesta final dirigida al usuario EXCLUSIVAMENTE en Español. No respondas en portugués, inglés o francés.
   - El contexto interno, bases de conocimiento y el historial pueden estar en otros idiomas, pero la respuesta final DEBE ser 100% en Español.
   - Cercano, empático y directo.
7. 🎯 CONCISIÓN Y ACCIÓN:
   - Sé claro, conciso y orientado a la acción sin preámbulos innecesarios. Usa listas breves.
8. ⛔ DIRECTIVA ESTRICTA DE RECHAZO DE FRAUDES E ILÍCITOS (CÓDIGO PENAL ART. 256):
   - NUNCA redactes, sugieras ni colabores en contratos de trabajo simulados o ficticios.
   - NUNCA aceptes, facilites ni instruyas el uso de domicilios falsos ni testimonios fraudulentos ante las Juntas de Freguesia.
   - NUNCA promuevas ni intermedies en la compraventa ilegal de citas de AIMA.
   - Ante cualquier petición de esta índole, RECHAZA CATEGÓRICAMENTE, advierte de que tales conductas constituyen delito de falsedad documental según el Art. 256.º del Código Penal portugués y orienta únicamente por las vías oficiales y legítimas.

9. 🛠️ CONOCIMIENTO COMPLETO DE LOS MÓDULOS MIRA Y SOPORTE DE ERRORES:
   - Conoces el funcionamiento de los 11 módulos de MIRA (Inicio, Comunidad, Empleos y Alertas, Servicios Locales/Mapa, Cursos DGES/IEFP, Documentos/PDF/IRS, 6 Simuladores, Chat IA, Perfil/Insignias/RGPD, Mensajes Directos, Notificaciones, Privacidad/PWA).
   - Cuando el usuario pregunte cómo funciona un módulo o reporte un error técnico (acceso, lentitud, pantalla en blanco, PDF, filtros, alertas, audio, idioma o cuenta), ofrece pasos claros de solución con el botón [view:...] adecuado y, si persiste, pide módulo, error y navegador e indica **mira.app@hotmail.com**.

${MIRA_APP_KNOWLEDGE}
${verifiedKbBlock}
${userProfileBlock}
- CONTEXTO ADICIONAL: ${communityContext || 'Responde como el Agente IA soberano de MIRA.'}`
    };

    const systemInstruction = isTranslate
        ? `Professional Translation: Translate the following text to ${lang}. Output ONLY the translated text, no comments or greetings.`
        : (SYSTEM_PROMPTS[lang] || SYSTEM_PROMPTS['PT']);

    const modelId = 'gemini-3.6-flash';
    
    // 🧬 3. SMART HISTORY MERGER (V1.7M - Amanda Abreu Standards)
    let processedHistory = [];
    let lastRole = null;
    
    if (history && Array.isArray(history)) {
        for (const msg of history) {
            const role = (msg.role === 'assistant' || msg.role === 'model') ? 'model' : 'user';
            const content = (msg.content || msg.text || "").trim();
            if (!content) continue;

            if (role === lastRole) {
                processedHistory[processedHistory.length - 1].parts[0].text += "\n\n" + content;
            } else {
                processedHistory.push({ role, parts: [{ text: content }] });
                lastRole = role;
            }
        }
    }

    // Force API Symmetry: Starts with User, Ends with Model
    if (processedHistory.length > 0 && processedHistory[0].role === 'model') {
        processedHistory.shift();
    }
    if (processedHistory.length > 0 && processedHistory[processedHistory.length - 1].role === 'user') {
        processedHistory.pop();
    }

    // Intelligence Retention
    const finalHistory = processedHistory.slice(-24);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
    const t0 = Date.now();
    const requestId = 'gemini_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    const effectiveUserId = profileContext?.userId || req.body?.userId || null;
    const effectiveGuestId = !effectiveUserId ? (req.body?.guestId || req.body?.guest_id || 'guest') : null;
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: systemInstruction }] },
                contents: [...finalHistory, { role: "user", parts: [{ text: prompt || "Olá!" }] }],
                generationConfig: {
                    maxOutputTokens: 1700
                }
            })
        });

        const latencyMs = Date.now() - t0;
        const data = await response.json();
        
        if (!response.ok) {
            const status = response.status;
            let errorType = 'ERROR';
            if (status === 429) errorType = 'QUOTA_EXCEEDED';
            else if (status === 503) errorType = 'UNAVAILABLE';
            else if (status === 400) errorType = 'INVALID_REQUEST';

            console.warn(`⚠️ [MIRA CHAT] Gemini ${status} (${errorType}): ${data.error?.message || 'Error'}, switching to local fallback`);

            await recordApiTelemetry({
                requestId,
                userId: effectiveUserId,
                guestId: effectiveGuestId,
                model: modelId,
                status: status === 429 ? '429' : (status >= 500 ? '5xx' : 'error'),
                promptTokens: 0,
                candidateTokens: 0,
                totalTokens: 0,
                latencyMs,
                httpStatus: status,
                errorCode: errorType,
                errorMessage: data.error?.message || 'Gemini API Error',
                finishReason: null
            });

            return res.status(200).json({
                success: false,
                fallbackRequired: true,
                errorType,
                error: data.error?.message || 'Gemini API Error',
                source: 'local_fallback',
                provider: 'none',
                model: 'none',
                reason: `Gemini ${status} (${errorType}): ${data.error?.message || 'Error'}`
            });
        }

        const candidate = data.candidates?.[0];
        const textOutput = candidate?.content?.parts?.[0]?.text;
        const finishReason = candidate?.finishReason || 'STOP';
        const promptTokens = data.usageMetadata?.promptTokenCount || 0;
        const candidateTokens = data.usageMetadata?.candidatesTokenCount || 0;
        const totalTokens = data.usageMetadata?.totalTokenCount || 0;

        if (!textOutput) {
            console.warn(`⚠️ [MIRA CHAT] Gemini empty response, switching to local fallback`);

            await recordApiTelemetry({
                requestId,
                userId: effectiveUserId,
                guestId: effectiveGuestId,
                model: modelId,
                status: 'empty_response',
                promptTokens,
                candidateTokens,
                totalTokens,
                latencyMs,
                httpStatus: 200,
                errorCode: 'EMPTY_RESPONSE',
                errorMessage: 'Resposta vazia do Gemini',
                finishReason
            });

            return res.status(200).json({
                success: false,
                fallbackRequired: true,
                errorType: 'EMPTY_RESPONSE',
                error: 'Resposta vazia do Gemini',
                source: 'local_fallback',
                provider: 'none',
                model: 'none',
                reason: 'Resposta vazia da Google Gemini API'
            });
        }

        await recordApiTelemetry({
            requestId,
            userId: effectiveUserId,
            guestId: effectiveGuestId,
            model: modelId,
            status: 'success',
            promptTokens,
            candidateTokens,
            totalTokens,
            latencyMs,
            httpStatus: 200,
            errorCode: null,
            errorMessage: null,
            finishReason
        });

        console.log(`⚡ [MIRA CHAT] source=gemini provider=google model=${modelId} tokens=${totalTokens} status=200 finishReason=${finishReason}`);
        return res.status(200).json({
            text: textOutput,
            source: 'gemini',
            provider: 'google',
            category: 'Soberana',
            model: modelId,
            success: true,
            finishReason,
            usageMetadata: data.usageMetadata || null
        });
    } catch (err) {
        const latencyMs = Date.now() - t0;
        console.error(`❌ [MIRA CHAT EXCEPTION]`, err.message);

        await recordApiTelemetry({
            requestId,
            userId: effectiveUserId,
            guestId: effectiveGuestId,
            model: modelId,
            status: 'exception',
            promptTokens: 0,
            candidateTokens: 0,
            totalTokens: 0,
            latencyMs,
            httpStatus: 500,
            errorCode: 'EXCEPTION',
            errorMessage: err.message,
            finishReason: null
        });

        return res.status(200).json({
            success: false,
            fallbackRequired: true,
            errorType: 'EXCEPTION',
            error: err.message,
            source: 'local_fallback',
            provider: 'none',
            model: 'none',
            reason: err.message
        });
    }
}
