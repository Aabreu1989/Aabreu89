
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error("❌ Missing environment variables for cleanup.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

async function nukeTestData() {
  console.log("🚀 MIRA: INICIDANDO LIMPEZA PARA LANÇAMENTO...");

  // 1. Nuke Job Posts (Test ones mostly anyway)
  const { error: errJob } = await supabase.from('job_posts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (errJob) console.error("❌ Error deleting job posts:", errJob);
  else console.log("✅ Vagas de teste eliminadas.");

  // 2. Nuke Community Posts
  const { error: errPost } = await supabase.from('community_posts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (errPost) console.error("❌ Error deleting community posts:", errPost);
  else console.log("✅ Posts da comunidade eliminados.");

  // 3. Reset Reports (Clean slate)
  const { error: errRep } = await supabase.from('reports').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (errRep) console.error("❌ Error deleting reports:", errRep);
  else console.log("✅ Denúncias limpas.");

  console.log("💎 MIRA V2026.GOLD: LIMPA E PRONTA PARA PRODUÇÃO!");
}

nukeTestData();
