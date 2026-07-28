// src/lib/rag-core.ts
import { supabase } from './supabase';

export interface RagRequest {
    query: string;
    programaSlug: string;
    userId?: string;
    userRegion?: string;
    language?: string;
}

export interface RagResponse {
    success: boolean;
    context: Array<{
        topic: string;
        content: string;
        category: string;
    }>;
    responseTimeMs: number;
}

/**
 * Executes a robust, fault-tolerant (Shielded) RAG process.
 * prioritizes AIMA and legalization context when query indicates so.
 * Logs execution telemetry directly into public.requisitos_programa_logs.
 */
export async function executeShieldedRag(req: RagRequest): Promise<RagResponse> {
    const startTime = Date.now();
    let successRag = false;
    let context: any[] = [];
    let responseTimeMs = 0;
    
    const userRegion = req.userRegion || 'Geral';
    const language = req.language || 'pt';
    
    try {
        // 1. Detect if query is related to AIMA/Immigration/Legalization (AIMA Priority)
        const isAimaQuery = /aima|legaliz|residencia|visto|autorizacao|passaporte|morada|nif|niss/i.test(req.query);
        
        // 2. Shielded Ingestion: Query database with robust fuzzy fallback keyword match
        const sanitizedQuery = req.query.replace(/[%_\\]/g, '').substring(0, 40).trim();
        
        if (sanitizedQuery.length > 2) {
            const { data, error } = await supabase
                .from('knowledge_base')
                .select('topic, content, category')
                .or(`topic.ilike.%${sanitizedQuery}%,content.ilike.%${sanitizedQuery}%`)
                .limit(5);
                
            if (!error && data && data.length > 0) {
                context = data;
                successRag = true;
            }
        }
        
        // Fallback: If no matches or query was too short, load high-value general context
        if (context.length === 0) {
            const { data: fallbackData, error: fallbackError } = await supabase
                .from('knowledge_base')
                .select('topic, content, category')
                .limit(3);
                
            if (!fallbackError && fallbackData) {
                context = fallbackData;
                successRag = true;
            }
        }
        
        // 3. AIMA Priority Context Sorting
        if (isAimaQuery && context.length > 0) {
            context.sort((a, b) => {
                const aIsAima = /aima|legaliz|residencia|visto|autorizacao/i.test((a.topic + ' ' + a.content).toLowerCase());
                const bIsAima = /aima|legaliz|residencia|visto|autorizacao/i.test((b.topic + ' ' + b.content).toLowerCase());
                if (aIsAima && !bIsAima) return -1;
                if (!aIsAima && bIsAima) return 1;
                return 0;
            });
        }
        
    } catch (e) {
        console.error("MIRA RAG Shielded Engine Fallback Active:", e);
        successRag = false;
    } finally {
        responseTimeMs = Date.now() - startTime;
        
        // 4. Traceability & Regional Logging (Audit compliance) - Async and Non-blocking
        (async () => {
            try {
                await supabase.from('requisitos_programa_logs').insert([{
                    programa_slug: req.programaSlug,
                    regiao_utilizador: userRegion,
                    idioma_requisicao: language,
                    tempo_resposta_ms: responseTimeMs,
                    sucesso_rag: successRag,
                    timestamp: new Date().toISOString()
                }]);
            } catch (loggingErr) {
                console.warn("MIRA Telemetry: failed to write audit log", loggingErr);
            }
        })();
    }
    
    return {
        success: successRag,
        context,
        responseTimeMs
    };
}
