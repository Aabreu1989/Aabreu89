const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("🧹 Iniciando limpeza de 'Lixo' (Artigos/Guias) nas Vagas...");
    
    // Lista de termos que indicam que NÃO é uma vaga
    const garbageTerms = [
        '%Como calcular%',
        '%Guia%',
        '%O que é%',
        '%Saiba como%',
        '%Dicas para%',
        '%Regras de%',
        '%Trabalho Suplementar%',
        '%Horas Extraordinárias%'
    ];

    let totalDeleted = 0;

    for (const term of garbageTerms) {
        const { data, error, count } = await supabase
            .from('job_posts')
            .delete({ count: 'exact' })
            .ilike('title', term);

        if (error) {
            console.error(`❌ Erro ao apagar ${term}:`, error.message);
        } else {
            console.log(`🗑️ Apagados ${count || 0} itens com o termo: ${term}`);
            totalDeleted += (count || 0);
        }
    }

    console.log(`✨ Limpeza concluída! Total de lixo removido: ${totalDeleted}`);
}

run();
