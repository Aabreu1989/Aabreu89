-- ============================================================
-- 🦾 MIRA V2026: PILLAR 027 - AI CHAT SOVEREIGN PERSISTENCE
-- CEO: Amanda Abreu | Estabilidade de Histórico do Agente Diamond
-- ============================================================

-- 1. CHAT SESSIONS TABLE
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CHAT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    is_sovereign BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS & SECURITY
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 🛡️ chat_sessions Policies
DROP POLICY IF EXISTS "Users can manage own chat sessions" ON public.chat_sessions;
CREATE POLICY "Users can manage own chat sessions" ON public.chat_sessions 
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 🛡️ chat_messages Policies (via session join)
DROP POLICY IF EXISTS "Users can manage own chat messages" ON public.chat_messages;
CREATE POLICY "Users can manage own chat messages" ON public.chat_messages 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.chat_sessions 
        WHERE id = session_id AND user_id = auth.uid()
    )
) 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.chat_sessions 
        WHERE id = session_id AND user_id = auth.uid()
    )
);

-- 4. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON public.chat_messages(session_id);

-- Success check
DO $$ BEGIN RAISE NOTICE 'MIRA Chat Persistence V027 Applied Succesfully! 💎'; END $$;
