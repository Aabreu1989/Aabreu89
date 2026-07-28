import { generateAssistantResponseV45 } from './geminiService';

/**
 * 👑 MIRA CHAT SERVICE V850 - REDIRECIONAMENTO SOBERANO
 * ----------------------------------------------------------------
 * STATUS: LIMPEZA DE BYPASS - AMANDA ABREU
 * OBJETIVO: Matar a rota localhost:3001 e unificar o cérebro.
 * ----------------------------------------------------------------
 */

export const aiChatService = {
  /**
   * 🛡️ Esta função foi redirecionada para usar apenas a Edge Function Cloud.
   * Qualquer tentativa de falar com o localhost:3001 foi extirpada.
   */
  sendMessage: async (message: string, history: any[] = []) => {
    console.log("🎯 [aiChatService]: Redirecionando para Nervo Cloud V850...");
    
    const result = await generateAssistantResponseV45(message, history);
    
    if (!result.success) {
      throw new Error(result.text);
    }
    
    return {
      text: result.text,
      version: result.version
    };
  },
  askMira: async (message: string, history: any[] = []) => {
    // Fallback in case UI component is still hardcoded to askMira
    console.log("🎯 [aiChatService]: Redirecionando para Nervo Cloud V850 (askMira fallback)...");
    
    const result = await generateAssistantResponseV45(message, history);
    if (!result.success) throw new Error(result.text);
    
    return { text: result.text, version: result.version };
  }
};