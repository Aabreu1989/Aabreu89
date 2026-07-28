const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("☢️ Iniciando Limpeza ATÓMICA de Artigos...");
    
    const nuclearBadTerms = [
        '%direito%', 
        '%falecimento%',
        '%familiar%',
        '%faltas%',
        '%contrato%',
        '%legislação%',
        '%segurança social%',
        '%subsídio%',
        '%baixa médica%',
        '%licença%',
        '%prazos%',
        '%multas%',
        '%finanças%',
        '%IRS%',
        '%seguro%',
        '%guia%',
        '%saiba%'
    ];

    let totalDeleted = 0;

    for (const term of nuclearBadTerms) {
        const { data, error, count } = await supabase
            .from('job_posts')
            .delete({ count: 'exact' })
            .ilike('title', term);
            
        if (!error && count > 0) {
            console.log(`🗑️ Removidos ${count} itens com: ${term}`);
            totalDeleted += count;
        }
    }

    console.log(`✨ LIMPEZA ATÓMICA CONCLUÍDA! Total removido: ${totalDeleted}`);
}

run();
