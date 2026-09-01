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
[MAPA GERAL DA APLICAÇÃO MIRA & BOTÕES DE AÇÃO]:
- Jornada (Metro): 1.Chegada/Visto ➡️ 2.NIF ➡️ 3.NISS ➡️ 4.SNS ➡️ 5.Emprego ➡️ 6.Residência AIMA.
- Botão Jornada: [view:HOME:Ver Linha de Metro da Integração]
- Centros Oficiais Gratuitos (CNAIM/CLAIM/AIMA): [view:LOCAL_SERVICES:Ver Centros de Apoio CNAIM / CLAIM]
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
[MÓDULO VISTOS, AIMA & REGULARIZAÇÃO LEGAL]:
- Legislação 2026: Manifestação de Interesse extinta. Exige-se visto consular prévio (D1 Trabalho, Procura de Trabalho 120+60 dias, D2, D3, D4, D7, D8, CPLP ou Via Verde Empresas).
- Reagrupamento Familiar (Art. 98.º a 108.º Lei 23/2007): Exige AR válida do titular, meios de subsistência (Portaria 1563/2007: 100% titular 920€ + 50% cônjuge 460€ + 30% filho 276€), contrato arrendamento AT e certidão casamento/nascimento apostilada há <6 meses. Confere direito pleno de trabalho ao familiar.
- Simulador Requisitos AIMA & SS: [view:SIMULATORS:aima_ss:Verificar Requisitos AIMA & SS]
- Minutas Oficiais (Termo Responsabilidade, Declaração Alojamento, Requerimento): [view:DOCUMENT_ASSISTANT:Gerar Minuta em PDF]
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

        const data = await response.json();
        
        if (!response.ok) {
            const status = response.status;
            let errorType = 'ERROR';
            if (status === 429) errorType = 'QUOTA_EXCEEDED';
            else if (status === 503) errorType = 'UNAVAILABLE';
            else if (status === 400) errorType = 'INVALID_REQUEST';

            console.warn(`⚠️ [MIRA CHAT] Gemini ${status} (${errorType}): ${data.error?.message || 'Error'}, switching to local fallback`);
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

        if (!textOutput) {
            console.warn(`⚠️ [MIRA CHAT] Gemini empty response, switching to local fallback`);
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

        console.log(`⚡ [MIRA CHAT] source=gemini provider=google model=${modelId} status=200 finishReason=${finishReason}`);
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
        console.error(`❌ [MIRA CHAT EXCEPTION]`, err.message);
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
