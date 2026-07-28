const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Erro: VITE_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontrados no .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Robustly extracts an array from a TypeScript file.
 * Uses a more tolerant approach than the previous regex-to-JSON.
 */
function extractArrayRobust(filePath, variableName) {
    console.log(`🔍 Extraindo ${variableName} de ${path.basename(filePath)}...`);
    const content = fs.readFileSync(filePath, 'utf8');
    
    const startMarker = `export const ${variableName}`;
    const startIndex = content.indexOf(startMarker);
    console.log(`   - startIndex: ${startIndex}`);
    if (startIndex === -1) return [];

    // Find the equals sign after the marker
    const equalsIndex = content.indexOf('=', startIndex);
    if (equalsIndex === -1) return [];

    // Find the first '[' after the equals sign
    const arrayStart = content.indexOf('[', equalsIndex);
    console.log(`   - arrayStart: ${arrayStart}`);
    if (arrayStart === -1) return [];

    // Find the last ']' in the file (assuming the array ends the file or is the main content)
    // For very large files, we look for the closing bracket that matches the first one.
    let arrayContent = "";
    let bracketCount = 0;
    for (let i = arrayStart; i < content.length; i++) {
        if (content[i] === '[') bracketCount++;
        if (content[i] === ']') bracketCount--;
        arrayContent += content[i];
        if (bracketCount === 0) break;
    }

    console.log(`   - arrayContent length: ${arrayContent.length}`);

    try {
        let jsonStr = arrayContent
            .replace(/\/\/.*$/gm, '') // remove line comments
            .replace(/\/\*[\s\S]*?\*\//g, '') // remove block comments
            .replace(/([{,]\s*)([a-zA-Z0-9_]+):/g, '$1"$2":') // quote unquoted keys
            .replace(/:\s*'([^']*)'/g, ': "$1"') // single to double quotes for values
            .replace(/,\s*([}\]])/g, '$1'); // remove trailing commas

        const result = JSON.parse(jsonStr);
        console.log(`   - result length: ${result ? result.length : 'null'}`);
        return result;
    } catch (e) {
        console.error(`❌ Erro ao processar ${variableName}:`, e.message);
        // If JSON.parse fails, try one last time with a very permissive Function eval
        try {
            const result = new Function(`return ${arrayContent.replace(/export const .* = /g, '')}`)();
            return result;
        } catch (e2) {
            return [];
        }
    }
}

async function run() {
    console.log("🚀 [MIRA SOBERANA] Iniciando Restauro de Dados Massivos...");
    console.log(`📍 Destino: ${supabaseUrl}`);

    // 1. SERVIÇOS PROTEGIDOS
    const servicesFile = path.join(__dirname, '../src/utils/protectedData.ts');
    const services = extractArrayRobust(servicesFile, 'PROTECTED_SERVICES');
    if (services && services.length > 0) {
        console.log(`🛠️ Restaurando ${services.length} Serviços com Descrição Enriquecida...`);
        const formatted = services.map(s => ({
            name: s.title || s.name,
            description: `${s.description || 'Apoio ao Migrante'}\n📍 Endereço: ${s.address || 'Consultar MIRA'}\n🌐 Site: ${s.website || 'N/A'}\n🏙️ Cidade: ${s.city || 'Portugal'}`,
            created_at: new Date().toISOString()
        }));
        
        // Limpar tabela antes de reinserir para evitar duplicados e lixo
        console.log("🧹 Limpando tabela de serviços para renovação...");
        await supabase.from('services').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        const { error } = await supabase.from('services').insert(formatted);
        if (error) console.error("❌ Erro em Serviços:", error.message);
        else console.log("✅ Serviços restaurados e visíveis no Dashboard.");
    }

    // 2. CURSOS IEFP
    const coursesFile = path.join(__dirname, '../src/utils/iefpCoursesDatabase.ts');
    const courses = extractArrayRobust(coursesFile, 'IEFP_MASSIVE_DATABASE');
    if (courses && courses.length > 0) {
        console.log(`🎓 Restaurando ${courses.length} Cursos...`);
        const formatted = courses.map(c => ({
            id: c.id,
            title: c.title,
            description: c.description || 'Sem descrição',
            category: c.category,
            type: c.type,
            duration: c.duration,
            image_url: c.image || null,
            link: c.link || null,
            is_iefp_synced: true,
            created_at: new Date().toISOString()
        }));
        const { error } = await supabase.from('courses').upsert(formatted, { onConflict: 'id' });
        if (error) console.error("❌ Erro em Cursos:", error.message);
        else console.log("✅ Cursos restaurados.");
    }

    // 3. VAGAS DE EMPREGO (O Coração do App)
    const jobsFile = path.join(__dirname, '../src/utils/massiveJobsDatabase.ts');
    const jobs = extractArrayRobust(jobsFile, 'PROTECTED_JOBS');
    if (jobs && jobs.length > 0) {
        console.log(`💼 Restaurando ${jobs.length} Vagas (em lotes de 100)...`);
        const CHUNK_SIZE = 100;
        let totalInserted = 0;
        for (let i = 0; i < jobs.length; i += CHUNK_SIZE) {
            const chunk = jobs.slice(i, i + CHUNK_SIZE).map(j => ({
                id: j.id,
                title: j.title,
                location: j.location,
                source_name: j.sourceName,
                source_url: j.sourceUrl,
                category: j.category,
                work_topic: j.workTopic,
                // tags omitido temporariamente para evitar erro de schema cache
                created_at: new Date().toISOString()
            }));
            const { error } = await supabase.from('job_posts').upsert(chunk, { onConflict: 'id' });
            if (error) {
                console.error(`❌ Erro no lote ${i}:`, error.message);
                // Continue despite errors in one chunk
            } else {
                totalInserted += chunk.length;
            }
            if (i % 1000 === 0 && i > 0) console.log(`... ${i} vagas processadas.`);
        }
        console.log(`✅ ${totalInserted} Vagas de Emprego restauradas com sucesso.`);
    }

    console.log("\n✨ [MIRA SOBERANA] Missão Cumprida. O sistema está alimentado e seguro.");
}

run().catch(err => {
    console.error("❌ Erro fatal no bootstrap:", err.message);
});
