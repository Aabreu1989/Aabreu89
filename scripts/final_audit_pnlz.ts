import { createClient } from '@supabase/supabase-js';

const url = "https://pnlzyshozpqlzuyjesdq.supabase.co";
const key = "SUPABASE_SERVICE_ROLE_KEY_PLACEHOLDER";
const supabase = createClient(url, key);

async function finalCheck() {
    console.log("💎 MIRA FINAL AUDIT (Project PNLZ)");
    
    const { count: jobs } = await supabase.from('job_posts').select('*', { count: 'exact', head: true });
    const { count: services } = await supabase.from('services').select('*', { count: 'exact', head: true });
    const { count: users } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    
    // Check one job to see if source_url is populated
    const { data: jobSample } = await supabase.from('job_posts').select('title, source_name, source_url').not('source_url', 'is', null).limit(1);

    console.log(`- Vagas: ${jobs}`);
    console.log(`- Serviços: ${services}`);
    console.log(`- Usuários: ${users}`);
    if (jobSample?.[0]) {
        console.log(`- Verificação de Fonte: OK (${jobSample[0].source_name}: ${jobSample[0].source_url})`);
    } else {
        console.log("- Verificação de Fonte: NENHUMA FONTE ENCONTRADA (Atenção)");
    }
}

finalCheck();
