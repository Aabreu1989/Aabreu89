const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("🧹 Iniciando Limpeza Profunda (Deep Clean) MIRA V2026...");
    
    // 1. Eliminar por termos proibidos (Case Insensitive)
    const badPatterns = [
        '%como %',
        '%saiba %',
        '%guia %',
        '%valor %',
        '%direitos%',
        '%indemnizações%',
        '%despedimentos%',
        '%currículo vitae%',
        '%voluntariado%',
        '%horário%',
        '%trabalho suplementar%',
        '%extraordinárias%',
        '%?%'
    ];

    let totalDeleted = 0;

    for (const pattern of badPatterns) {
        const { data, error, count } = await supabase
            .from('job_posts')
            .delete({ count: 'exact' })
            .ilike('title', pattern);
            
        if (!error && count > 0) {
            console.log(`🗑️ Removidos ${count} itens com padrão: ${pattern}`);
            totalDeleted += count;
        }
    }

    // 2. Eliminar duplicados exatos (Mesmo URL)
    const { data: duplicates } = await supabase
        .from('job_posts')
        .select('source_url, id')
        .order('source_url');

    if (duplicates) {
        const seenUrls = new Set();
        const toDelete = [];
        for (const item of duplicates) {
            if (seenUrls.has(item.source_url)) {
                toDelete.push(item.id);
            } else {
                seenUrls.add(item.source_url);
            }
        }
        
        if (toDelete.length > 0) {
            console.log(`🗑️ Removendo ${toDelete.length} duplicados por URL...`);
            // Delete in batches of 100
            for (let i = 0; i < toDelete.length; i += 100) {
                const batch = toDelete.slice(i, i + 100);
                await supabase.from('job_posts').delete().in('id', batch);
            }
            totalDeleted += toDelete.length;
        }
    }

    console.log(`✨ LIMPEZA CONCLUÍDA! Total de itens removidos: ${totalDeleted}`);
    console.log("✅ A base de dados agora contém apenas vagas reais.");
}

run();
