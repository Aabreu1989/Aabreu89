export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { prompt, history, communityContext, language, action, kbContext, profileContext } = req.body;
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    
    const isTranslate = action === 'translate';
    const lang = (language || 'PT').toUpperCase();

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

    const MIRA_APP_KNOWLEDGE = `
[CONHECIMENTO COMPLETO DAS FUNCIONALIDADES E SIMULADORES DA APLICAÇÃO MIRA 2026]:
1. 🧮 6 SIMULADORES ECONÓMICOS (SimulatorsView):
   - Salário Líquido (Conta de Outrem): Calcula ordenado líquido pós-retenção de IRS 2026, Segurança Social 11%, IRS Jovem (Art. 12.º-B CIRS com isenções graduais 100%, 75%, 50%, 25%) e subsídio de alimentação (isenção 6,00€ dinheiro / 9,60€ cartão).
     Token: [view:SIMULATORS:salario:Abrir Calculadora de Salário]
   - Recibos Verdes (Trabalhador Independente): Calcula rendimento líquido pós-incidência SS (70% serviços / 20% vendas a 21,4%), retenção IRS (25%, 16,5%, 11,5%), isenção Art. 101.º-B (até 15.000€/ano) e ajuste trimestral (-25%, 0%, +25%).
     Token: [view:SIMULATORS:recibos:Abrir Simulador de Recibos Verdes]
   - Custo de Vida: Comparador interativo dos 20 distritos de Portugal (rendas médias INE, alimentação, transportes, utilidades).
     Token: [view:SIMULATORS:custo_vida:Comparar Custo de Vida nos Distritos]
   - Proteção à Habitação: Calcula Taxa de Esforço (máx 35% Banco de Portugal), Capital de Entrada (2 cauções + 1 renda - Art. 1076.º C. Civil) e Fundo de Emergência (3 meses).
     Token: [view:SIMULATORS:habitacao:Abrir Simulador de Habitação]
   - Requisitos AIMA & Risco SS: Avalia se o rendimento cumpre a Portaria 1563/2007 (920€ RMMG 2026 + 276€/dependente) e ALERTA sobre o risco grave de indeferimento se o requerente descontar apenas a taxa mínima de 20€/mês na SS declarando rendimento para a AIMA.
     Token: [view:SIMULATORS:aima_ss:Verificar Requisitos AIMA & SS]
   - Pequeno Empreendedor & Microempresa: Simula faturação, despesas, IRC reduzido PME de 12,5% (Art. 87.º CIRC até 50.000€ lucro tributável), TSU MOE 33,05%, margem líquida e Ponto de Equilíbrio (Break-Even).
     Token: [view:SIMULATORS:empreendedor:Abrir Simulador Empreendedor]

2. 📜 ASSISTENTE DE DOCUMENTOS & MINUTAS:
   - Geração de minutas legais prontas a assinar: Carta de Rescisão de Contrato, Declaração de Acolhimento / Termo de Responsabilidade, Requerimento AIMA, Oposição de Renda, Contestação de Multa, Contrato de Comodato/Subarrendamento.
     Token: [view:DOCUMENT_ASSISTANT:Gerar Minuta em PDF]

3. 🧙‍♂️ ASSISTENTES E WIZARDS PASSO A PASSO:
   - NIF (Número de Identificação Fiscal & Representante Fiscal)
   - NISS (Segurança Social & Declaração de Atividade)
   - Utente SNS (Inscrição no Centro de Saúde e Número de Utente)
   - Regularização & Vistos Consulares (Lei 23/2007: Visto D1 Trabalho, Visto de Procura de Trabalho 120+60 dias, Visto D2 Empreendedor, Visto D3 Altamente Qualificado, Visto D8 Nómada Digital, Visto D7 Reformados, Visto D4 Estudante, Visto CPLP).
   - Reagrupamento Familiar (Art. 98.º a 108.º): Exige autorização de residência válida do titular, meios de subsistência (Portaria 1563/2007: 100% titular + 50% cônjuge + 30% filho s/ Salário Mínimo 920€), contrato de arrendamento registado na AT e certidões apostiladas.
   - "Via Verde para Empresas": Canal célere e prioritário para contratação de trabalhadores estrangeiros por empresas sediadas em Portugal com Termo de Responsabilidade empresarial e parecer célere AIMA/IEFP.
   - IRS & Declaração Anual de Rendimentos: [view:DOCUMENTS:irs:Abrir Simulador IRS]

4. 💼 BOLSA DE EMPREGOS MIRA, VIA VERDE & INCLUSÃO PCD:
   - Pesquisa de vagas de emprego verificadas em Portugal (filtradas por localização, área, contrato, canal Via Verde e inclusão PCD).
   - Tokens:
     [view:JOBS:Ver Vagas de Emprego]
     [view:JOBS:pcd:Ver Vagas Inclusivas PCD]
   - Para imigrantes com deficiência/incapacidade (PCD): esclarece sobre a Lei das Quotas (Lei 4/2019, 1%-2% em empresas com 75+ trabalhadores), o Atestado Médico de Incapacidade Multiuso (AMIM), apoios do IEFP à adaptação do posto de trabalho e a Prestação Social para a Inclusão (PSI da Segurança Social). Sempre orienta com empatia e conecta com [view:JOBS:pcd:Ver Vagas Inclusivas PCD].

5. 👥 COMUNIDADE & FORMAÇÃO:
   - Fórum de apoio mútuo, alertas contra fraudes: [view:COMMUNITY:Ver Comunidade MIRA]
   - Cursos IEFP e PLA (Português Língua de Acolhimento): [view:LEARNING:Ver Cursos e Formação]

6. 📍 PONTOS DE APOIO OFICIAL (HUMAN-IN-THE-LOOP):
   - 238 pontos de apoio oficiais gratuitos (CNAIM, CLAIM, Balcões AIMA e Lojas do Cidadão): [view:LOCAL_SERVICES:Ver Centros de Apoio CNAIM / CLAIM]

7. 🚇 JORNADA DE INTEGRAÇÃO MIRA (LINHA DE METRO):
   - Estação 1: Chegada & Planeamento / Entrada Legal (Visto consular D1/D2/D3/D7/D8/Procura de Trabalho/CPLP ou Via Verde Empresas)
   - Estação 2: NIF (Identificação Fiscal nas Finanças)
   - Estação 3: NISS (Segurança Social para poder trabalhar e descontar)
   - Estação 4: SNS (Número de Utente de Saúde)
   - Estação 5: Emprego (Contrato de Trabalho / Recibos Verdes / Salário)
   - Estação 6: Residência (Autorização de Residência AIMA, CPLP, Reagrupamento Familiar)
   Token: [view:DASHBOARD:Ver Linha de Metro da Integração]
`;

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
     [view:DASHBOARD:Ver Linha de Metro da Integração]

5. 🛡️ HUMAN-IN-THE-LOOP & RIGOR LEGAL:
   - Baseia-te na legislação portuguesa vigente (Lei 23/2007 atualizada, OE 2026, IRS 2026, RMMG 920€). Lembra que a Manifestação de Interesse foi extinta e exige-se visto consular prévio.
   - Para processos complexos, recusas da AIMA ou pedidos de consultoria jurídica individualizada, orienta para os centros públicos gratuitos oficiais (CNAIM / CLAIM / Balcões AIMA) com [view:LOCAL_SERVICES:Ver Centros de Apoio CNAIM / CLAIM] ou para a Ordem dos Advogados (oa.pt).

6. 🗣️ TOM E FORMATO:
   - Responde SEMPRE em Português Europeu amigável, acolhedor, empático e resolutivo (usa "tu").
   - NÃO exponhas raciocínio interno nem tags como <think> ou preâmbulos desnecessários. Sê direto, claro e estruturado com marcadores quando útil.

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

6. 🗣️ TONE:
   - Professional, warm, empathetic, and direct. Do not expose internal thought tags.

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

${MIRA_APP_KNOWLEDGE}
${verifiedKbBlock}
${userProfileBlock}
- CONTEXTO ADICIONAL: ${communityContext || 'Responde como el Agente IA soberano de MIRA.'}`
    };

    const systemInstruction = isTranslate
        ? `Professional Translation: Translate the following text to ${lang}. Output ONLY the translated text, no comments or greetings.`
        : (SYSTEM_PROMPTS[lang] || SYSTEM_PROMPTS['PT']);

    const modelId = isTranslate ? 'gemini-2.5-flash' : 'gemini-2.5-flash';
    
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
                    temperature: isTranslate ? 0.1 : 0.3,
                    maxOutputTokens: 2500,
                    topP: 0.8,
                    topK: 40
                }
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "Gemini API Error");

        const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textOutput) throw new Error("Resposta vazia do Gemini");

        return res.status(200).json({
            text: textOutput,
            category: 'Soberana',
            model: modelId
        });
    } catch (err) {
        console.error(`❌ [MIRA AI ERROR]`, err.message);
        return res.status(500).json({ error: err.message });
    }
}
