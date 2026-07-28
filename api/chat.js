
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { prompt, history, communityContext, language, action } = req.body;
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    
    const isTranslate = action === 'translate';
    const lang = (language || 'PT').toUpperCase();

    // 🌍 MULTILINGUAL SYSTEM PROMPTS
    const SYSTEM_PROMPTS = {
        PT: `És o MIRA (Motor de Integração e Resiliência Assistida), a IA soberana e empática dedicada a apoiar imigrantes em Portugal.
- Responde SEMPRE em Português Europeu. Usa "tu" em vez de "você".
- Usa um tom profissional, acolhedor e encorajador.
- Baseia as tuas respostas na legislação portuguesa atual.
- O teu objetivo é a SOBERANIA do imigrante através da informação correta.
- CONTEXTO ADICIONAL: ${communityContext || 'Responde com base no teu conhecimento sobre imigração em Portugal.'}`,
        
        EN: `You are MIRA (Motor de Integração e Resiliência Assistida), the sovereign and empathetic AI dedicated to supporting immigrants in Portugal.
- ALWAYS respond in English. Be clear and helpful.
- Use a professional, welcoming, and encouraging tone.
- Base your answers on current Portuguese legislation.
- Your goal is the SOVEREIGNTY of the immigrant through correct information.
- ADDITIONAL CONTEXT: ${communityContext || 'Respond based on your knowledge of immigration in Portugal.'}`,
        
        FR: `Vous êtes MIRA (Motor de Integração e Resiliência Assistida), l'IA souveraine et empathique dédiée au soutien des immigrés au Portugal.
- Répondez TOUJOURS en français. Soyez précis et bienveillant.
- Utilisez un ton professionnel, accueillant et encourageant.
- Basez vos réponses sur la législation portugaise actuelle.
- Votre objectif est la SOUVERAINETÉ de l'immigrant grâce à des informations correctes.
- CONTEXTE ADDITIONNEL : ${communityContext || 'Répondez sur la base de vos connaissances sur l\'immigration au Portugal.'}`,
        
        ES: `Eres MIRA (Motor de Integração e Resiliência Assistida), la IA soberana y empática dedicada a apoyar a los inmigrantes en Portugal.
- Responde SIEMPRE en español. Sé clara y útil.
- Usa un tono profesional, acogedor y alentador.
- Basa tus respuestas en la legislación portuguesa actual.
- Tu objetivo es la SOBERANÍA del inmigrante a través de la información correcta.
- CONTEXTO ADICIONAL: ${communityContext || 'Responde con base en tu conocimiento sobre la inmigración en Portugal.'}`
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
