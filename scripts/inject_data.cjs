const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pnlzyshozpqlzuyjesdq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBubHp5c2hvenBxbHp1eWplc2RxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjY4NDIwMSwiZXhwIjoyMDkyMjYwMjAxfQ.B7nklWlm6C7AcZB1-ca0QWzvTLLDj-1yat7AjdQJal0';

const supabase = createClient(supabaseUrl, supabaseKey);

const pillars = [
  {
    content: '# AIMA 2026: A Manifestação de Interesse foi REVOGADA\n\nA Manifestação de Interesse (Art. 88.2 e 89.2) foi revogada em 4 de Junho de 2024 pelo Decreto-Lei 37-A/2024. Atualmente é OBRIGATÓRIO entrar em Portugal com Visto de Residência obtido no consulado de origem. Não há mais regularização "por dentro". Exceções apenas para casos humanitários. Fonte: AIMA oficial.',
    category: 'AIMA',
    is_verified: true,
    validation_status: 'approved'
  },
  {
    content: '# Como agendar na AIMA em 2026 (Guia Completo)\n\nOs agendamentos na AIMA são feitos exclusivamente pelo portal digital aima.gov.pt. Passos: 1. Cria conta no portal. 2. Escolhe o serviço (Autorização de Residência, Renovação, etc.). 3. Seleciona data e hora disponível. 4. Leva TODOS os documentos originais + cópias. Dica: Os slots para Lisboa esgotam em minutos — tenta às 08h00 exatas.',
    category: 'AIMA',
    is_verified: true,
    validation_status: 'approved'
  },
  {
    content: '# NIF em Portugal: Como obter sem Representante Fiscal\n\nResidentes fora da UE podem obter o NIF sem representante fiscal se apresentarem prova de morada válida em Portugal no ato do pedido. Documentos necessários: Passaporte original + cópia, comprovativo de morada em Portugal (contrato de arrendamento, declaração de hospedagem). Local: Qualquer Loja do Cidadão ou Serviço de Finanças. É GRATUITO.',
    category: 'Fiscal',
    is_verified: true,
    validation_status: 'approved'
  },
  {
    content: '# NISS para Estrangeiros: Passo a Passo 2026\n\nO Número de Identificação de Segurança Social (NISS) para estrangeiros é pedido online via Segurança Social Direta (SSD). Caminho: Perfil > Número de Identificação > Pedir NISS. Documentos: Passaporte/Título de Residência, NIF e comprovativo de morada. Para trabalhadores com contrato, o empregador pode pedir o NISS diretamente.',
    category: 'Segurança Social',
    is_verified: true,
    validation_status: 'approved'
  }
];

async function run() {
    console.log("🚀 [MIRA] Injetando Saber IA (Formato V2026)...");
    
    // Buscar o ID real da Amanda
    const { data: profile } = await supabase.from('profiles').select('id').eq('email', 'amandasabreu89@gmail.com').single();
    const authorId = profile?.id || '00000000-0000-0000-0000-000000000001';

    for (const pillar of pillars) {
        console.log(`📝 Injetando conteúdo...`);
        const { error } = await supabase.from('posts').insert({
            ...pillar,
            author_id: authorId,
            likes: 0
        });
        if (error) console.error(`❌ Erro: ${error.message}`);
    }
    
    console.log("✅ Saber IA restaurado e visível no Feed!");
}

run();
