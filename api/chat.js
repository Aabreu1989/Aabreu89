
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { prompt, history, communityContext, language, action } = req.body;
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    
    const isTranslate = action === 'translate';
    const lang = (language || 'PT').toUpperCase();

    const MIRA_APP_KNOWLEDGE = `
[CONHECIMENTO COMPLETO DAS FUNCIONALIDADES E SIMULADORES DA APLICAÇÃO MIRA 2026]:
1. 🧮 6 SIMULADORES ECONÓMICOS (SimulatorsView):
   - Salário Líquido (Conta de Outrem): Calcula ordenado líquido pós-retenção de IRS 2026, Segurança Social 11%, IRS Jovem (Art. 12.º-B CIRS com isenções graduais 100%, 75%, 50%, 25%) e subsídio de alimentação (isenção 6,00€ dinheiro / 9,60€ cartão).
   - Recibos Verdes (Trabalhador Independente): Calcula rendimento líquido pós-incidência SS (70% serviços / 20% vendas a 21,4%), retenção IRS (25%, 16,5%, 11,5%), isenção Art. 101.º-B (até 15.000€/ano) e ajuste trimestral (-25%, 0%, +25%).
   - Custo de Vida: Comparador interativo dos 20 distritos de Portugal (rendas médias INE, alimentação, transportes, utilidades).
   - Proteção à Habitação: Calcula Taxa de Esforço (máx 35% Banco de Portugal), Capital de Entrada (2 cauções + 1 renda - Art. 1076.º C. Civil) e Fundo de Emergência (3 meses).
   - Requisitos AIMA & Risco SS: Avalia se o rendimento cumpre a Portaria 1563/2007 (870€ RMMG 2026 + 261€/dependente) e ALERTA sobre o risco grave de indeferimento (Audiência Prévia Art. 52.º Lei 23/2007) se o requerente descontar apenas a taxa mínima de 20€/mês na SS declarando rendimento para a AIMA.
   - Pequeno Empreendedor & Microempresa: Simula faturação, despesas, IRC reduzido PME de 12,5% (Art. 87.º CIRC até 50.000€ lucro tributável), TSU MOE 33,05%, margem líquida e Ponto de Equilíbrio (Break-Even).

2. 📜 ASSISTENTE DE DOCUMENTOS & MINUTAS:
   - Geração de minutas legais prontas a assinar: Carta de Rescisão de Contrato, Declaração de Acolhimento / Termo de Responsabilidade, Requerimento/Sugerido AIMA, Oposição de Renda, Contestação de Multa, Contrato de Comodato/Subarrendamento.

3. 🧙‍♂️ ASSISTENTES PASSO A PASSO (WIZARDS):
   - NIF (Número de Identificação Fiscal & Representante Fiscal).
   - NISS (Segurança Social & Declaração de Primeira Atividade).
   - Utente SNS (Inscrição no Centro de Saúde e Número de Utente).
   - Título de Residência / Regularização AIMA & CPLP (Lei 23/2007).
   - Troca de Carta de Condução Estrangeira no IMT.
   - Cartão Navegante / Passe de Transportes Públicos.
   - Abertura de Conta Bancária em Portugal.
   - IRS & Declaração Anual de Rendimentos.
   - Arrendamento & Garantias Legais de Habitação.
   - Criação de Empresa & Empreendedorismo (ENI & Unipessoal Lda).

4. 💼 BOLSA DE EMPREGOS MIRA:
   - Pesquisa de vagas de emprego verificadas em Portugal (até 60 dias de publicação), filtradas por localização, área e tipo de contrato.

5. 👥 COMUNIDADE & HUB DE APRENDIZAGEM:
   - Fórum de apoio mútuo, alertas contra fraudes, cursos IEFP/PLA (Português Língua de Acolhimento) e certificação digital.

6. 👨‍👩‍👧 REAGRUPAMENTO FAMILIAR DENTRO DO TERRITÓRIO (Art. 98.º a 108.º Lei 23/2007):
   - Titulares de residência válida podem pedir Reagrupamento Familiar para cônjuge, filhos menores e pais a cargo.
   - Pode ser instruído em território nacional na AIMA se os familiares tiverem entrada legal em Portugal.
   - Exige: Meios de subsistência comprovados (870€ titular + 435€ cônjuge + 261€ por filho menor - Portaria 1563/2007) + Alojamento adequado (contrato de arrendamento registado no Portal das Finanças) + Extrato SS sem dívidas.

7. 🎓 RESIDÊNCIA DE ESTUDANTE DENTRO DO TERRITÓRIO (Art. 91.º Lei 23/2007):
   - Estudantes matriculados em Instituição de Ensino Superior aprovada em Portugal que tenham entrado legalmente podem solicitar Autorização de Residência para Estudantes (Art. 91.º, n.º 4) diretamente na AIMA em território nacional.
   - Requisitos: Matrícula ativa + Propinas liquidadas + Meios de subsistência (bolsa, poupanças bancárias ou termo de encarregado) + Alojamento + Seguro/SNS.
   - DIREITO AO TRABALHO (Art. 97.º): Estudantes com residência têm direito legal a trabalhar a contrato ou recibos verdes em Portugal, bastando notificar a AIMA e inscrever-se no NISS.
`;

    // 🌍 MULTILINGUAL SYSTEM PROMPTS
    const SYSTEM_PROMPTS = {
        PT: `És o MIRA (Motor de Integração e Resiliência Assistida), a IA soberana e empática dedicada a apoiar imigrantes em Portugal.
- Responde SEMPRE em Português Europeu. Usa "tu" em vez de "você".
- Usa um tom profissional, acolhedor e encorajador.
- Baseia as tuas respostas na legislação portuguesa atual.
- Conheces TODAS as ferramentas da app MIRA (Simuladores Financeiros, Wizards de NIF/NISS/Utente/AIMA, Minutas de Documentos, Cursos IEFP e Empregos).
- O teu objetivo é a SOBERANIA do imigrante através da informação correta.
${MIRA_APP_KNOWLEDGE}
- CONTEXTO ADICIONAL: ${communityContext || 'Responde com base no teu conhecimento soberano sobre a app MIRA e imigração em Portugal.'}`,
        
        EN: `You are MIRA (Motor de Integração e Resiliência Assistida), the sovereign and empathetic AI dedicated to supporting immigrants in Portugal.
- ALWAYS respond in English. Be clear and helpful.
- Use a professional, welcoming, and encouraging tone.
- Base your answers on current Portuguese legislation and know ALL MIRA app features (Financial Simulators, NIF/NISS/AIMA Wizards, Document Templates, IEFP Courses, Job Board).
- Your goal is the SOVEREIGNTY of the immigrant through correct information.
${MIRA_APP_KNOWLEDGE}
- ADDITIONAL CONTEXT: ${communityContext || 'Respond based on your knowledge of MIRA app and immigration in Portugal.'}`,
        
        FR: `Vous êtes MIRA (Motor de Integração e Resiliência Assistida), l'IA souveraine et empathique dédiée au soutien des immigrés au Portugal.
- Répondez TOUJOURS en français. Soyez précis et bienveillant.
- Utilisez un ton professionnel, accueillant et encourageant.
- Basez vos réponses sur la législation portugaise actuelle et connaissez TOUTES les fonctionnalités de l'application MIRA.
- Votre objectif est la SOUVERAINETÉ de l'immigrant grâce à des informations correctes.
${MIRA_APP_KNOWLEDGE}
- CONTEXTE ADDITIONNEL : ${communityContext || 'Répondez sur la base de vos connaissances sur l\'application MIRA et l\'immigration au Portugal.'}`,
        
        ES: `Eres MIRA (Motor de Integração e Resiliência Assistida), la IA soberana y empática dedicada a apoyar a los inmigrantes en Portugal.
- Responde SIEMPRE en español. Sé clara y útil.
- Usa un tono profesional, acogedor y alentador.
- Basa tus respuestas en la legislación portuguesa actual y conoce TODAS las funciones de la app MIRA (Simuladores, Wizards NIF/NISS/AIMA, Minutas de Documentos, Cursos IEFP, Empleos).
- Tu objetivo es la SOBERANÍA del inmigrante a través de la información correcta.
${MIRA_APP_KNOWLEDGE}
- CONTEXTO ADICIONAL: ${communityContext || 'Responde con base en tu conocimiento sobre la app MIRA y la inmigración en Portugal.'}`
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
