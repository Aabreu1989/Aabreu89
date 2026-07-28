/**
 * MIRA Restauração Soberana — Executa o SQL via Supabase Management API
 * Usa a service_role key para aplicar o SQL diretamente
 */
const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Variáveis de ambiente não encontradas.');
    process.exit(1);
}

// Extract project ref from URL
const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];

const sqlFile = path.join(__dirname, '../RESTAURAR_COMUNIDADE_V2026.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

console.log(`🚀 MIRA: Executando SQL de restauração no projeto ${projectRef}...`);
console.log(`📄 SQL: ${sqlFile}`);

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function runRestoration() {
    // Split the SQL into individual statements to execute one by one
    // since Supabase JS client doesn't support raw multi-statement SQL
    
    // Strategy: Use the rpc method if available, or direct REST call
    try {
        // Try to call a helper RPC if it exists
        const { data, error } = await supabase.rpc('exec_sql', { query: sql });
        if (!error) {
            console.log('✅ SQL executado via RPC exec_sql:', data);
            return;
        }
    } catch (e) {
        console.log('ℹ️ exec_sql RPC não disponível, tentando método alternativo...');
    }

    // Method 2: Execute targeted inserts directly
    console.log('🔄 A executar inserção direta dos 18 pilares...');
    
    const AUTHOR_ID = '00000000-0000-0000-0000-000000000001';
    
    // Ensure profile exists
    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
            id: AUTHOR_ID,
            name: 'MIRA Oficial',
            role: 'admin',
            reputation: 9999,
            trust_level: 'Especialista',
            is_verified: true
        }, { onConflict: 'id' });
    
    if (profileError) {
        console.warn('⚠️ Perfil MIRA Oficial:', profileError.message);
    } else {
        console.log('✅ Perfil MIRA Oficial garantido.');
    }

    const posts = [
        { title: 'AIMA 2026: A Manifestação de Interesse foi REVOGADA', content: 'A Manifestação de Interesse (Art. 88.2 e 89.2) foi revogada em 4 de Junho de 2024 pelo Decreto-Lei 37-A/2024. Atualmente é OBRIGATÓRIO entrar em Portugal com Visto de Residência obtido no consulado de origem. Não há mais regularização "por dentro". Exceções apenas para casos humanitários. Fonte: AIMA oficial.', category: 'AIMA', nobel_score: 5000, likes: 120, useful_votes: 89, background_image: 'https://images.unsplash.com/photo-1521737852567-6949f3f9f2b5?w=800&q=80' },
        { title: 'Como agendar na AIMA em 2026 (Guia Completo)', content: 'Os agendamentos na AIMA são feitos exclusivamente pelo portal digital aima.gov.pt. Passos: 1. Cria conta no portal. 2. Escolhe o serviço. 3. Seleciona data e hora disponível. 4. Leva TODOS os documentos originais + cópias. Dica: Os slots para Lisboa esgotam em minutos — tenta às 08h00 exatas.', category: 'AIMA', nobel_score: 4800, likes: 98, useful_votes: 76, background_image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80' },
        { title: 'NIF em Portugal: Como obter sem Representante Fiscal', content: 'Residentes fora da UE podem obter o NIF sem representante fiscal se apresentarem prova de morada válida em Portugal. Documentos necessários: Passaporte original + cópia, comprovativo de morada em Portugal. Local: Qualquer Loja do Cidadão ou Serviço de Finanças. É GRATUITO.', category: 'Fiscal', nobel_score: 4500, likes: 145, useful_votes: 112, background_image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=80' },
        { title: 'NISS para Estrangeiros: Passo a Passo 2026', content: 'O Número de Identificação de Segurança Social (NISS) para estrangeiros é pedido online via Segurança Social Direta (SSD). Caminho: Perfil > Número de Identificação > Pedir NISS. Documentos: Passaporte/Título de Residência, NIF e comprovativo de morada.', category: 'Segurança Social', nobel_score: 4200, likes: 87, useful_votes: 65, background_image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&q=80' },
        { title: 'Reagrupamento Familiar em Portugal: Requisitos 2026', content: 'O pedido de reagrupamento familiar deve ser feito no portal AIMA após 1 ano de residência legal do titular principal. Documentos: Título de residência válido, prova de meios de subsistência, habitação adequada e certidão de nascimento/casamento apostilada.', category: 'AIMA', nobel_score: 4100, likes: 76, useful_votes: 58, background_image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&q=80' },
        { title: 'Renovação de Autorização de Residência: Não Percas o Prazo', content: 'A renovação deve ser pedida 30 dias ANTES do vencimento do título. Se pedires fora do prazo, podes receber uma coima. O pedido é feito no portal AIMA. Enquanto o processo está pendente, o título anterior mantém a validade (declaração de pendência).', category: 'AIMA', nobel_score: 4000, likes: 134, useful_votes: 98, background_image: 'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?w=800&q=80' },
        { title: 'Visto D7: A Via para Quem Tem Rendimento Passivo', content: 'O Visto D7 é para quem recebe rendimentos de fontes externas a Portugal (reforma, arrendamento, dividendos, trabalho remoto). Requisitos: Rendimento mínimo mensal igual ou superior ao salário mínimo português (820€/mês em 2026).', category: 'Vistos', nobel_score: 3800, likes: 92, useful_votes: 71, background_image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80' },
        { title: 'Título CPLP: O Que Muda em 2026', content: 'Os títulos CPLP conferem direito de residência em Portugal mas exigem troca pelo título definitivo para circulação livre em Schengen. A troca é feita na AIMA. Atenção: o título CPLP NÃO permite trabalhar automaticamente — precisas de comunicar à ACT.', category: 'Vistos', nobel_score: 3600, likes: 65, useful_votes: 48, background_image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80' },
        { title: 'Direitos do Trabalhador Estrangeiro em Portugal (ACT 2026)', content: 'O trabalhador estrangeiro tem os MESMOS direitos que o nacional. Obrigações do empregador: contrato escrito, comunicação à Segurança Social até 24h antes do início de funções, salário mínimo garantido (820€/mês em 2026). Denúncias: portal da ACT.', category: 'Trabalho', nobel_score: 3500, likes: 88, useful_votes: 67, background_image: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800&q=80' },
        { title: 'Acesso ao SNS para Imigrantes: Como Inscrever-se', content: 'Imigrantes com situação regularizada têm acesso pleno ao SNS. Inscrição: vai ao Centro de Saúde da tua área de residência com título de residência ou comprovativo de pedido pendente + comprovativo de morada.', category: 'Saúde', nobel_score: 3400, likes: 71, useful_votes: 54, background_image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80' },
        { title: 'IRS em Portugal: Guia para Imigrantes 2026', content: 'Se trabalhaste em Portugal em 2025, és obrigado a entregar IRS em 2026 (prazo: Abril-Junho). Precisas de NIF e acesso ao Portal das Finanças. Dica: o IRS pode gerar reembolso!', category: 'Fiscal', nobel_score: 3200, likes: 56, useful_votes: 43, background_image: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&q=80' },
        { title: 'Porta 65 Jovem: Apoio à Habitação para Imigrantes', content: 'O programa Porta 65 apoia jovens entre 18 e 35 anos no pagamento da renda. Imigrantes com residência legal podem candidatar-se. O apoio pode chegar a 200€/mês e durar até 60 meses.', category: 'Habitação', nobel_score: 3100, likes: 79, useful_votes: 61, background_image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80' },
        { title: 'Naturalização Portuguesa: Requisitos e Prazos 2026', content: 'Após 5 anos de residência legal em Portugal podes pedir a nacionalidade portuguesa. Requisitos: título de residência válido, registo criminal limpo, conhecimento básico de português (A2). Prazo de resposta: 12-24 meses.', category: 'Nacionalidade', nobel_score: 3000, likes: 93, useful_votes: 72, background_image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80' },
        { title: 'Subsídio de Desemprego para Imigrantes: Tens Direito?', content: 'Sim! Se trabalhaste legalmente em Portugal e descontaste para a Segurança Social durante pelo menos 360 dias nos últimos 24 meses, tens direito ao subsídio de desemprego. Prazo: 90 dias após o desemprego.', category: 'Segurança Social', nobel_score: 2900, likes: 67, useful_votes: 51, background_image: 'https://images.unsplash.com/photo-1476900543704-4312b78632f8?w=800&q=80' },
        { title: 'Abono de Família para Imigrantes com Filhos', content: 'Imigrantes com residência legal e filhos em Portugal têm direito ao abono de família. Pedido online na Segurança Social Direta. O abono pode acumular com outros apoios sociais.', category: 'Família', nobel_score: 2800, likes: 58, useful_votes: 44, background_image: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&q=80' },
        { title: 'Equivalência e Reconhecimento de Diplomas em Portugal', content: 'Para exercer profissões reguladas (médico, enfermeiro, advogado, engenheiro) precisas de reconhecimento do diploma pela ordem profissional respetiva. Para diplomas da CPLP o processo é simplificado.', category: 'Educação', nobel_score: 2700, likes: 49, useful_votes: 37, background_image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&q=80' },
        { title: 'Carta de Condução Estrangeira em Portugal: O Que Fazer', content: 'Cartas de condução da UE/EEE são válidas em Portugal sem conversão. Cartas de fora da UE: podes conduzir até 185 dias após te tornares residente. Após esse prazo, deves trocar pela carta portuguesa no IMT.', category: 'Transportes', nobel_score: 2600, likes: 44, useful_votes: 33, background_image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&q=80' },
        { title: 'Criar Empresa em Portugal como Imigrante: Guia 2026', content: 'Imigrantes com autorização de residência podem criar empresa em Portugal. Formas jurídicas: ENI (sem capital mínimo) ou Lda (capital mínimo 1€). Registo online em eportugal.gov.pt em 1 dia útil.', category: 'Empreendedorismo', nobel_score: 2500, likes: 41, useful_votes: 31, background_image: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&q=80' }
    ];

    let successCount = 0;
    for (const post of posts) {
        const { error: postError } = await supabase
            .from('posts')
            .insert({
                author_id: AUTHOR_ID,
                author_name: 'MIRA Oficial',
                title: post.title,
                content: post.content,
                category: post.category,
                is_verified: true,
                validation_status: 'approved',
                urgency: 8,
                nobel_score: post.nobel_score,
                likes: post.likes,
                useful_votes: post.useful_votes,
                fake_votes: 0,
                background_image: post.background_image,
                translations: {}
            });
        
        if (postError && !postError.message.includes('duplicate')) {
            console.warn(`⚠️ Post "${post.title.substring(0,30)}...": ${postError.message}`);
        } else if (!postError) {
            successCount++;
            process.stdout.write(`✅ ${successCount}/${posts.length}\r`);
        }
    }
    
    console.log(`\n\n✅ RESTAURAÇÃO CONCLUÍDA: ${successCount}/${posts.length} posts inseridos!`);
    
    // Check total
    const { count } = await supabase.from('posts').select('*', { count: 'exact', head: true });
    console.log(`📊 Total de posts na BD: ${count}`);
    
    process.exit(0);
}

runRestoration().catch(err => {
    console.error('❌ Erro fatal:', err);
    process.exit(1);
});
