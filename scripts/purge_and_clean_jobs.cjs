const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fetch = require('node-fetch');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function normalize(text) {
    if (!text) return "";
    return text.toLowerCase()
        .replace(/\(m\/f\)/g, '')
        .replace(/\(m\/f\/d\)/g, '')
        .replace(/[^a-z0-9]/g, '')
        .trim();
}

async function runClean() {
    console.log("\n👑 ===================================================");
    console.log("💎 MIRA JOB SHIELD: PROCESSO DE LIMPEZA E ESTABILIZAÇÃO");
    console.log("=======================================================\n");

    // 1. Apagar imediatamente do DB as vagas expiradas (> 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutOffTimeISO = thirtyDaysAgo.toISOString();
    console.log(`📅 [PASSO 1] A apagar vagas criadas antes de: ${cutOffTimeISO}...`);

    const { count: expiredDeleted, error: expError } = await supabase
        .from('job_posts')
        .delete({ count: 'exact' })
        .lt('created_at', cutOffTimeISO);

    if (expError) {
        console.error("❌ [PASSO 1] Erro ao limpar vagas antigas:", expError.message);
    } else {
        console.log(`✅ [PASSO 1] Sucesso: Removidas ${expiredDeleted || 0} vagas obsoletas.`);
    }

    // 2. Apagar imediatamente do DB as vagas sem URL válida (malformadas)
    console.log("🔗 [PASSO 2] A apagar vagas com links nulos ou inválidos...");
    
    // Buscar todas para podermos fazer a limpeza precisa das malformadas
    let allJobs = [];
    let from = 0;
    while (true) {
        const { data, error } = await supabase.from('job_posts').select('id, title, location, source_url, created_at').range(from, from + 999);
        if (error) {
            console.error("❌ Erro de busca:", error.message);
            break;
        }
        if (data && data.length > 0) {
            allJobs = [...allJobs, ...data];
            from += 1000;
        } else break;
    }

    const malformedIds = [];
    const seen = new Set();
    const duplicateIds = [];
    const activeJobs = [];

    for (const job of allJobs) {
        const url = job.source_url;
        if (!url || !url.startsWith('http')) {
            malformedIds.push(job.id);
            continue;
        }

        const key = normalize(job.title) + "|" + normalize(job.location);
        if (seen.has(key)) {
            duplicateIds.push(job.id);
            continue;
        }

        seen.add(key);
        activeJobs.push(job);
    }

    // Apagar malformadas do DB em lotes de 100
    if (malformedIds.length > 0) {
        console.log(`🗑️ [PASSO 2] A apagar ${malformedIds.length} vagas com links malformados do DB...`);
        for (let i = 0; i < malformedIds.length; i += 100) {
            const batch = malformedIds.slice(i, i + 100);
            await supabase.from('job_posts').delete().in('id', batch);
        }
        console.log(`✅ [PASSO 2] Vagas com links malformados expurgadas.`);
    } else {
        console.log("✨ [PASSO 2] Nenhuma vaga com link malformado encontrada.");
    }

    // 3. Apagar duplicados do DB em lotes de 100
    if (duplicateIds.length > 0) {
        console.log(`👥 [PASSO 3] A apagar ${duplicateIds.length} vagas duplicadas do DB...`);
        for (let i = 0; i < duplicateIds.length; i += 100) {
            const batch = duplicateIds.slice(i, i + 100);
            await supabase.from('job_posts').delete().in('id', batch);
        }
        console.log(`✅ [PASSO 3] Vagas duplicadas expurgadas.`);
    } else {
        console.log("✨ [PASSO 3] Nenhuma vaga duplicada encontrada.");
    }

    // 4. Testar links ativos em paralelo para identificar links quebrados (retornando 404, etc.)
    console.log(`\n🌐 [PASSO 4] A validar integridade de ${activeJobs.length} links ativos via requisições HTTP...`);
    const brokenIds = [];
    let checkedCount = 0;
    const concurrencyLimit = 50;

    async function checkLink(job) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 segundos de timeout

        try {
            const res = await fetch(job.source_url, {
                method: 'HEAD',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                },
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            // Se for 404, a vaga não existe mais (link quebrado)
            if (res.status === 404) {
                brokenIds.push(job.id);
            }
        } catch (err) {
            clearTimeout(timeoutId);
            // Se falhar a ligação (ex: domínio expirado ou host inexistente)
            if (err.name === 'AbortError' || err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
                brokenIds.push(job.id);
            }
        } finally {
            checkedCount++;
            if (checkedCount % 200 === 0 || checkedCount === activeJobs.length) {
                console.log(`   🔹 Progresso: ${checkedCount}/${activeJobs.length} links verificados...`);
            }
        }
    }

    // Executador de piscina de concorrência
    const queue = [...activeJobs];
    const workers = Array(concurrencyLimit).fill(null).map(async () => {
        while (queue.length > 0) {
            const job = queue.shift();
            if (job) await checkLink(job);
        }
    });

    await Promise.all(workers);

    // Apagar links quebrados do DB em lotes de 100
    if (brokenIds.length > 0) {
        console.log(`\n🗑️ [PASSO 4] A apagar ${brokenIds.length} vagas com links quebrados (404/Inacessível) do DB...`);
        for (let i = 0; i < brokenIds.length; i += 100) {
            const batch = brokenIds.slice(i, i + 100);
            await supabase.from('job_posts').delete().in('id', batch);
        }
        console.log(`✅ [PASSO 4] Vagas com links quebrados expurgadas.`);
    } else {
        console.log("\n✨ [PASSO 4] Todos os links estão íntegros!");
    }

    // Mostrar balanço final
    const { count: finalCount } = await supabase.from('job_posts').select('*', { count: 'exact', head: true });

    console.log("\n🏆 ===================================================");
    console.log("🏁 RELATÓRIO FINAL DA LIMPEZA:");
    console.log(`- Vagas Expiradas Removidas: ${expiredDeleted || 0}`);
    console.log(`- Vagas com Links Malformados: ${malformedIds.length}`);
    console.log(`- Vagas Duplicadas Removidas: ${duplicateIds.length}`);
    console.log(`- Vagas com Links Quebrados Removidas: ${brokenIds.length}`);
    console.log(`🌟 Total de Vagas Ativas e Limpas no DB: ${finalCount}`);
    console.log("=======================================================\n");
}

runClean();
