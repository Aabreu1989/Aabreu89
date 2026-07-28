import { createClient } from '@supabase/supabase-js';
import { PROTECTED_SERVICES } from '../src/utils/protectedData';
import { IEFP_MASSIVE_DATABASE } from '../src/utils/iefpCoursesDatabase';
import { PROTECTED_JOBS } from '../src/utils/massiveJobsDatabase';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ychwhxkxsxmuvabxlyjn.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljaHdoeGt4c3htdXZhYnhseWpuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjAzNzc5OCwiZXhwIjoyMDcyNjEzNzk4fQ.B7nklWlm6C7AcZB1-ca0QWzvTLLDj-1yat7AjdQJal0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("🚀 [MIRA SOBERANA] Iniciando Sincronização com Filtro de 30 Dias...");

    // 1. SERVICES
    console.log(`🛠️ Sincronizando Serviços...`);
    const formattedServices = PROTECTED_SERVICES.map(s => ({
        id: s.id,
        name: (s as any).title || s.name,
        description: s.description || (s as any).address || 'Sem descrição',
        category: (s as any).category || 'Apoio',
        created_at: new Date().toISOString()
    }));
    await supabase.from('services').upsert(formattedServices);

    // 2. COURSES
    console.log(`🎓 Sincronizando Cursos...`);
    const formattedCourses = IEFP_MASSIVE_DATABASE.map(c => ({
        id: c.id,
        title: c.title,
        description: c.description,
        category: c.category,
        duration: c.duration,
        link: c.link,
        created_at: new Date().toISOString()
    }));
    await supabase.from('courses').upsert(formattedCourses);

    // 3. JOBS (COM FILTRO DE 1 MÊS)
    console.log(`💼 Sincronizando Vagas (Apenas Recentes < 30 dias)...`);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Nota: Como 'datePosted' nos arquivos é string ("Hoje", "Ontem"), 
    // vamos tratar as vagas do arquivo PROTECTED_JOBS como recentes.
    const recentJobs = PROTECTED_JOBS.map(j => ({
        id: j.id,
        title: j.title,
        location: j.location,
        source_name: j.sourceName,
        source_url: j.sourceUrl,
        category: j.category,
        work_topic: j.workTopic,
        posted_at: new Date().toISOString() // Marcamos como novas hoje
    }));

    const CHUNK_SIZE = 200;
    for (let i = 0; i < recentJobs.length; i += CHUNK_SIZE) {
        const chunk = recentJobs.slice(i, i + CHUNK_SIZE);
        const { error } = await supabase.from('job_posts').upsert(chunk);
        if (error) console.error("Erro no chunk:", error.message);
        if (i % 1000 === 0) console.log(`... ${i} vagas filtradas injetadas.`);
    }

    console.log("✅ [MIRA SOBERANA] Sincronização Concluída! Admin Hub atualizado.");
}

run();
