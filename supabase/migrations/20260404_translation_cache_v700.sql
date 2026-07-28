-- 👑 MIRA V2026.GOLD: ESCUDO DE CACHE V700
-- OBJETIVO: SOBERANIA FINANCEIRA ABSOLUTA NAS TRADUÇÕES

BEGIN;

-- 1. Tabela de Cache Global (Soberania V700)
CREATE TABLE IF NOT EXISTS public.translation_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_text_hash TEXT NOT NULL, -- MD5 do texto original
    target_lang VARCHAR(10) NOT NULL,
    translated_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_text_hash, target_lang)
);

-- 2. Índice Atómico para Busca Sniper (0ms)
CREATE INDEX IF NOT EXISTS idx_trans_hash_v700 ON public.translation_cache(source_text_hash);

-- 3. Função de Busca (Soberania Sniper)
CREATE OR REPLACE FUNCTION public.get_cached_translation_v700(t_text TEXT, t_lang TEXT)
RETURNS TEXT AS $$
DECLARE
    v_hash TEXT;
    v_result TEXT;
BEGIN
    v_hash := md5(t_text);
    SELECT translated_text INTO v_result 
    FROM public.translation_cache 
    WHERE source_text_hash = v_hash AND target_lang = t_lang;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Função de Persistência (Soberania de Aço)
CREATE OR REPLACE FUNCTION public.save_translation_v700(t_text TEXT, t_lang TEXT, t_translated TEXT)
RETURNS VOID AS $$
DECLARE
    v_hash TEXT;
BEGIN
    v_hash := md5(t_text);
    INSERT INTO public.translation_cache (source_text_hash, target_lang, translated_text)
    VALUES (v_hash, t_lang, t_translated)
    ON CONFLICT (source_text_hash, target_lang) 
    DO UPDATE SET translated_text = EXCLUDED.translated_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
