const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

function normalize(text) {
    if (!text) return "";
    return text.toLowerCase()
        .replace(/\(m\/f\)/g, '')
        .replace(/\(m\/f\/d\)/g, '')
        .replace(/[^a-z0-9]/g, '') // Remove tudo o que não é letra ou número
        .trim();
}

async function run() {
    console.log("🧹 Iniciando VARREDURA de Duplicados (Título + Local)...");
    
    // 1. Buscar todas as vagas
    let allJobs = [];
    let from = 0;
    while (true) {
        const { data } = await supabase.from('job_posts').select('*').range(from, from + 999);
        if (data && data.length > 0) {
            allJobs = [...allJobs, ...data];
            from += 1000;
        } else break;
    }

    console.log(`📊 Analisando ${allJobs.length} vagas...`);

    const seen = new Map();
    const toDelete = [];

    for (const job of allJobs) {
        const key = normalize(job.title) + "|" + normalize(job.location);
        
        if (seen.has(key)) {
            // Já vimos esta vaga. Marcar para apagar.
            toDelete.push(job.id);
        } else {
            seen.set(key, job.id);
        }
    }

    if (toDelete.length > 0) {
        console.log(`🗑️ Encontrados ${toDelete.length} duplicados. Apagando...`);
        // Apagar em lotes de 100
        for (let i = 0; i < toDelete.length; i += 100) {
            const batch = toDelete.slice(i, i + 100);
            await supabase.from('job_posts').delete().in('id', batch);
        }
        console.log(`✅ Limpeza concluída. ${toDelete.length} duplicados removidos.`);
    } else {
        console.log("✨ Nenhun duplicado encontrado.");
    }
}

run();
