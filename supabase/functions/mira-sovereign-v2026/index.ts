// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"

/**
 * 👑 MIRA BACKEND V3.1M - OPERAÇÃO CUSTO ZERO (ONG EDITION)
 * ----------------------------------------------------------------
 * MOTOR ÚNICO: gemini-2.0-flash (TIER GRATUITO - SEM COBRANÇA)
 * KEY: Deve usar chave de aistudio.google.com SEM billing ativado
 * Limites Gratuitos: 15 RPM / 1M TPM / 1500 RPD - CUSTO €0.00
 * ----------------------------------------------------------------
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  
  const startTime = Date.now();
  const apiKey = Deno.env.get('GEMINI_API_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.json().catch(() => ({}));
    const prompt = (body.prompt || body.message || body.text || "").trim();
    const { history = [], action = "chat", language = "PT" } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ 
        status: "V2.1M_GOLD_READY", 
        engine: "Dual Engine Active",
        cache: "Hardened 1536"
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 🧬 1. GERAR EMBEDDING PARA CONSULTA (Obrigatório para Cache e RAG)
    const embRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: { parts: [{ text: prompt }] } })
    });
    const embData = await embRes.json();
    const vector = embData.embedding?.values;

    if (!vector) throw new Error("FALHA_VETORIAL: Não foi possível gerar o embedding.");

    // 🧬 2. BYPASS DE CACHE SEMÂNTICO (CUSTO ZERO REAL)
    // Procuramos se esta pergunta já foi respondida com 92% de semelhança.
    const { data: cacheHit } = await supabase.rpc('match_semantic_cache', { 
        query_embedding: vector, 
        match_threshold: 0.92, 
        match_count: 1 
    });

    if (cacheHit && cacheHit.length > 0) {
      return new Response(JSON.stringify({ 
        text: cacheHit[0].response_text || cacheHit[0].response, 
        v: 'V2.1M_CACHE_HIT', 
        h: 100, 
        p: `${Date.now() - startTime}ms (Custo 0)` 
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 🧬 3. MOTOR ÚNICO (OPERAÇÃO CUSTO ZERO)
    // gemini-2.0-flash é GRATUITO em aistudio.google.com: 15RPM, 1M TPM, 1500 RPD
    const isChat = action === "chat";
    const MODEL_NAME = "gemini-2.0-flash";
    
    let context = "";
    let hydration = 0;

    // 🧬 4. RAG SOBERANO (Apenas para Chat quando o Cache falha)
    if (isChat) {
      const { data: facts } = await supabase.rpc('match_knowledge_sniper_v5', { 
        query_embedding: vector, 
        match_threshold: 0.12, 
        match_count: 5 
      });
      
      if (facts && facts.length > 0) {
        hydration = facts.length;
        context = facts.map(f => `[DADO_OFICIAL_AMANDA]: ${f.content}`).join('\n');
      }
    }

    // 🧬 5. CONFIGURAÇÃO DE PERSONALIDADE (Sniper Mode)
    const systemInstruction = isChat 
      ? `ÉS A MIRA V2.1. ASSISTENTE DE ELITE.
         DIRETRIZES: 
         - Contexto: ${context}
         - Estilo: Consultora sénior, direta, SEM SAUDAÇÕES LONGAS.
         - Máximo 120 palavras. Português de Portugal.`
      : `SÊ UM TRADUTOR SNIPER. TRADUZ O TEXTO PARA ${language.toUpperCase()} SEM ADICIONAR COMENTÁRIOS.`;

    // 🧬 6. DISPARO AO MOTOR SELECIONADO (ECONOMIA FLASH)
    const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${apiKey}`;

    const aiRes = await fetch(apiURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: history.slice(-2).map(h => ({ // Reduzimos o histórico de 3 para 2 para economizar tokens
          role: h.role === 'assistant' || h.role === 'model' ? 'model' : 'user',
          parts: [{ text: (h.content || h.text || "").trim() }]
        })).concat([{ role: 'user', parts: [{ text: prompt }] }]),
        systemInstruction: { parts: [{ text: systemInstruction }] },
        tools: [], // Google Search DESATIVADO - custo zero
        generationConfig: { 
          temperature: isChat ? 0.3 : 0.1, 
          maxOutputTokens: isChat ? 400 : 500 // SNIPER MODE: máximo 400 tokens = 300 palavras
        }
      })
    });

    const result = await aiRes.json();
    const aiText = result.candidates?.[0]?.content?.parts?.[0]?.text || "MIRA: Sistema em recalibração.";

    // 🧬 7. AUTO-ALIMENTAÇÃO DO CACHE (Para a próxima vez ser grátis)
    if (aiText && !aiText.includes("Erro")) {
        await supabase.from('ai_semantic_cache').insert({
            prompt: prompt,
            response: aiText,
            embedding: vector
        });
    }

    return new Response(JSON.stringify({ 
      text: aiText, 
      v: isChat ? 'V2.5_PRO_CHAT' : 'V1.5_FLASH_TASK', 
      h: hydration, 
      p: `${Date.now() - startTime}ms` 
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: any) {
    return new Response(JSON.stringify({ text: "🚨 Erro de Motor: " + err.message }), { headers: corsHeaders });
  }
});