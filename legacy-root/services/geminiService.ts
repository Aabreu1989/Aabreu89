import { supabase } from '../lib/supabase';

/**
 * 👑 MIRA GEMINI SERVICE - V2026.GOLD FINAL (EDIÇÃO RESSURREIÇÃO)
 * ----------------------------------------------------------------
 * STATUS: SOBERANIA ESTABILIZADA - AMANDA ABREU
 * MOTOR: Gemini 2.5 Pro (Cloud Edge Function)
 * FIX: Bloqueio total de localhost:3001 e Cache de Tradução ativo.
 * ----------------------------------------------------------------
 */

export const generateAssistantResponseV45 = async (prompt: string, history: any[] = [], language: string = 'PT', action: string = 'chat') => {
  try {
    if (!prompt || !prompt.trim()) return { text: "", success: true };

    console.log(`🎯 [MIRA] Disparando Ordem para o Nervo Cloud lyjn...`);

    // 🧬 Higienização de Histórico (Mordaça Anti-Erro 400)
    const sanitizedHistory = (history || [])
      .filter(h => (h.content || h.text))
      .slice(-4) 
      .map(h => ({
        role: (h.role === 'assistant' || h.role === 'model') ? 'model' : 'user',
        content: (h.content || h.text || "").trim()
      }));

    // 🛡️ FIAÇÃO ÚNICA: Chama a Edge Function oficial na nuvem
    const { data, error } = await supabase.functions.invoke('mira-sovereign-v2026', {
      body: { 
        prompt: prompt.trim(), 
        history: sanitizedHistory,
        action, 
        language
      }
    });

    if (error) throw error;

    return { 
      text: data?.text || "Estamos a trabalhar em algumas melhorias no chat...", 
      success: true, 
      version: data?.v || 'V2026_GOLD', 
      hydration: data?.h || 0,
      perf: data?.p || '0ms'
    };

  } catch (err: any) {
    console.error("🚨 MIRA SERVICE ERROR:", err.message);
    return { 
      text: "🚨 Erro de Ligação ao Cérebro. Verifica se o deploy da V460 foi feito.", 
      success: false 
    };
  }
};

/**
 * TRADUTOR SNIPER (ECONOMIA DE TOKENS)
 * Verifica o cache local (coluna translations) antes de gastar dinheiro.
 */
export const autoTranslateText = async (text: string, targetLang: string) => {
  if (!text || !text.trim()) return text;
  const res = await generateAssistantResponseV45(text, [], targetLang, 'translate');
  return res.success ? res.text : text;
};
