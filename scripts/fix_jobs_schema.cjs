const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const projectRef = "pnlzyshozpqlzuyjesdq";
const password = "Britney123%"; 

const connectionString = `postgres://postgres.${projectRef}:${password}@aws-0-eu-west-3.pooler.supabase.com:6543/postgres`;

const sql = `
-- 🛠️ FIX SCHEMA VAGAS
ALTER TABLE public.job_posts ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.job_posts ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.job_posts ADD COLUMN IF NOT EXISTS work_topic TEXT;

-- Garantir RLS e permissões
ALTER TABLE public.job_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public view jobs" ON public.job_posts;
CREATE POLICY "Public view jobs" ON public.job_posts FOR SELECT USING (true);
GRANT SELECT ON public.job_posts TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
`;

async function run() {
    const client = new Client({ connectionString });
    try {
        console.log("🛠️ Corrigindo schema da tabela job_posts...");
        await client.connect();
        await client.query(sql);
        console.log("✅ Schema corrigido com sucesso!");
    } catch (e) {
        console.error("❌ Erro ao corrigir schema:", e.message);
    } finally {
        await client.end();
    }
}

run();
