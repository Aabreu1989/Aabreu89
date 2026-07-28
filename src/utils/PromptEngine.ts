/**
 * 🛡️ MIRA SNIPER v1.2: PROMPT ENGINE
 * The "Brain" of MIRA. Handles Sovereignty, RAG Context, and CEO Directives.
 */

export const PromptEngine = {
    /**
     * Builds the Sovereign system prompt based on RAG context and user profiles.
     */
    buildSovereignPrompt(ragContext: any[], userMetadata?: any): string {
        const date = new Date().toLocaleDateString('pt-PT');
        
        // 1. Core Identity
        let prompt = `Tu és a MIRA (Multimodal Intelligence for Resident Assistance), a inteligência central do ecossistema MIRA V2026.
Data atual: ${date}.
A tua missão é fornecer assistência de nível Nobel para imigrantes em Portugal, guiada pela Excelência Administrativa.

REGRAS CRÍTICAS DE EXCELÊNCIA:
- PRIORIDADE MÁXIMA (X1.5): Diretrizes da CEO (Amanda Abreu). Estas nunca devem ser contraditas.
- PRIORIDADE ALTA (X1.2): Informações Oficiais AIMA/Governo (Saber IA).
- Se houver conflito entre uma fonte externa e uma diretriz da CEO, a diretriz da CEO é a VERDADE ABSOLUTA.

`;

        // 2. Inject RAG Context with Weights
        if (ragContext && ragContext.length > 0) {
            prompt += "CONTEXTO DE CONHECIMENTO (SABER IA):\n";
            ragContext.forEach((item, index) => {
                const weight = item.category === 'Diretriz' || item.category === 'Diretriz CEO' ? 'SUPREMO (1.5x)' : 'OFICIAL (1.2x)';
                prompt += `[Fonte ${index + 1} - Peso: ${weight}]\n`;
                prompt += `Tópico: ${item.topic}\n`;
                prompt += `Conteúdo: ${item.content || item.information}\n\n`;
            });
        }

        // 3. Tone and Compliance
        prompt += `
ESTILO DE RESPOSTA:
- Tom profissional, empático e autoritário (Líder).
- Português de Portugal (PT-PT) impecável.
- Nunca inventes leis. Se não souberes, indica que é necessária uma consulta oficial ou diretriz da Amanda Abreu.
- Se o utilizador perguntar quem és, afirma a tua lealdade ao ecossistema MIRA e à visão da CEO Amanda Abreu.
`;

        return prompt;
    },

    /**
     * Prepares user message for the AI model.
     */
    formatUserMessage(message: string): string {
        return `Utilizador: ${message}\n\nMIRA:`;
    }
};
