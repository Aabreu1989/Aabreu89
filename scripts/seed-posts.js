import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
  console.log('🚀 Starting MIRA Community Seeding (V2026.REALISM)...');

  // Existing user IDs found in the database
  const authors = {
    amanda: '775fb10a-78cd-4753-938d-dea75fddd77a',
    ricardo: 'ae84be4c-1420-4439-8d4c-48f4c1dbb1aa',
    elena: '96bcf90d-f87a-453a-824c-218cae90249f'
  };

  // 1. Update Profiles with REALISTIC Unsplash photos (standard in the project)
  const profilesToUpdate = [
    {
      id: authors.amanda,
      full_name: 'Amanda Abreu',
      username: 'amanda_mira',
      avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop',
      bio: 'Especialista em Imigração e Criadora do MIRA. Aqui para ajudar!',
      role: 'admin',
      is_verified: true,
      reputation: 1250,
      badges: ['pioneer', 'verified', 'expert'],
      trust_level: 'Curador Comunitário'
    },
    {
      id: authors.ricardo,
      full_name: 'Ricardo "O Guia"',
      username: 'ricardo_guia',
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
      bio: 'Mentor comunitário e conhecedor das leis de PT.',
      role: 'mentor',
      is_verified: true,
      reputation: 840,
      badges: ['verified', 'community_leader'],
      trust_level: 'Colaborador'
    },
    {
      id: authors.elena,
      full_name: 'Elena Rossi',
      username: 'elena_rossi',
      avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop',
      bio: 'Imigrante italiana vivendo o sonho em Lisboa.',
      role: 'member',
      is_verified: false,
      reputation: 320,
      badges: ['active_member'],
      trust_level: 'Observador'
    }
  ];

  for (const profile of profilesToUpdate) {
    const { error } = await supabase.from('profiles').update(profile).eq('id', profile.id);
    if (error) console.error(`❌ Error updating profile ${profile.full_name}:`, error.message);
    else console.log(`✅ Profile ${profile.full_name} updated with realistic photo.`);
  }

  // 2. Clear previous seeded posts to avoid duplicates and show the new realistic ones
  // (Optional, but better for the user to see the change)
  await supabase.from('posts').delete().in('author_id', Object.values(authors));

  // 3. Seed Posts with REALISTIC covers
  const posts = [
    {
      author_id: authors.amanda,
      title: 'Guia Definitivo: Agendamento AIMA 2026',
      content: 'Pessoal, para quem está a tentar agendar a renovação do título de residência: o portal costuma abrir novas vagas às terças-feiras de madrugada. Recomendo ter todos os documentos (NIF, NISS, Atestado de Morada) já digitalizados em PDF. Não usem intermediários que cobram por vagas, é perigoso e ilegal! Foquem no portal oficial.',
      category: 'Residência & Vistos',
      background_image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80',
      is_verified: true,
      validation_status: 'validated',
      urgency: 2,
      likes: 145,
      nobel_score: 100,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
    },
    {
      author_id: authors.ricardo,
      title: 'CUIDADO: Burlas no Arrendamento',
      content: 'Vi muitos posts no Facebook com apartamentos T2 a 400€ em Lisboa. Se parece bom demais para ser verdade, provavelmente é burla. Nunca transfiram dinheiro sem visitar o imóvel e ver o contrato físico. Verifiquem sempre se o senhorio tem o imóvel registado nas Finanças. Segurança em primeiro lugar!',
      category: 'Habitação & Casa',
      background_image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80',
      is_verified: true,
      validation_status: 'validated',
      urgency: 3,
      likes: 289,
      nobel_score: 95,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() // 5 hours ago
    },
    {
      author_id: authors.elena,
      title: 'Consegui! Minha jornada até o Título de Residência',
      content: 'Depois de 6 meses de espera e muita ansiedade, finalmente recebi o meu cartão de residência. O processo foi todo feito online através do novo portal. Para quem está na dúvida: sim, o sistema funciona, mas requer muita paciência. Não desistam e mantenham a vossa morada fiscal sempre atualizada nas Finanças!',
      category: 'Comunidade & Histórias',
      background_image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80',
      is_verified: false,
      validation_status: 'validated',
      urgency: 1,
      likes: 420,
      nobel_score: 80,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
    },
    {
      author_id: authors.ricardo,
      title: 'Saúde: Como obter o Número de Utente sem stress',
      content: 'Muita gente pergunta como aceder ao SNS. Precisam de ir ao Centro de Saúde (UCSP) da vossa área de residência com: Passaporte, NIF e comprovativo de morada (Junta de Freguesia). Não precisam de ter residência legal para ter número de utente, é um direito universal à saúde em Portugal!',
      category: 'Saúde & SNS',
      background_image: 'https://images.unsplash.com/photo-1505751172107-57322a3e23dd?w=800&q=80',
      is_verified: true,
      validation_status: 'validated',
      urgency: 2,
      likes: 167,
      nobel_score: 85,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() // 2 days ago
    },
    {
      author_id: authors.amanda,
      title: 'IEFP: Formação Certificada Gratuita para Junho',
      content: 'Estão abertas as inscrições para novos cursos de Português Língua Não Materna (PLNM) e competências digitais. Estes cursos dão direito a subsídio de alimentação e ajudam imenso na pontuação para a nacionalidade e no currículo. Procurem o centro IEFP mais próximo ou inscrevam-se pelo portal iefponline.',
      category: 'Trabalho & Carreira',
      background_image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80',
      is_verified: true,
      validation_status: 'validated',
      urgency: 1,
      likes: 94,
      nobel_score: 75,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString() // 3 days ago
    }
  ];

  for (const post of posts) {
    const { error } = await supabase.from('posts').insert([post]);
    if (error) console.error(`❌ Error inserting post "${post.title}":`, error.message);
    else console.log(`✅ Post "${post.title}" inserted with realistic cover.`);
  }

  console.log('✨ MIRA Community REALISM Seeding complete!');
}

seed();
