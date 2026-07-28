-- ================================================================
-- 👑 MIRA RESTAURAÇÃO SOBERANA DA COMUNIDADE — V2026.GOLD
-- PROJETO: pnlzyshozpqlzuyjesdq (PRODUÇÃO LOCAL)
-- OBJETIVO: Restaurar os 18 Pilares + RPC do Feed Soberano
-- INSTRUÇÃO: Correr no SQL Editor do Supabase Dashboard
-- ================================================================

-- PASSO 1: Garantir colunas necessárias na tabela posts
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='background_image') THEN
        ALTER TABLE public.posts ADD COLUMN background_image TEXT DEFAULT '';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='validation_status') THEN
        ALTER TABLE public.posts ADD COLUMN validation_status TEXT DEFAULT 'approved';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='urgency') THEN
        ALTER TABLE public.posts ADD COLUMN urgency INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='nobel_score') THEN
        ALTER TABLE public.posts ADD COLUMN nobel_score INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='likes') THEN
        ALTER TABLE public.posts ADD COLUMN likes INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='useful_votes') THEN
        ALTER TABLE public.posts ADD COLUMN useful_votes INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='fake_votes') THEN
        ALTER TABLE public.posts ADD COLUMN fake_votes INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='translations') THEN
        ALTER TABLE public.posts ADD COLUMN translations JSONB DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='author_name') THEN
        ALTER TABLE public.posts ADD COLUMN author_name TEXT DEFAULT 'MIRA Oficial';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='posts' AND column_name='author_avatar') THEN
        ALTER TABLE public.posts ADD COLUMN author_avatar TEXT DEFAULT '';
    END IF;
END $$;

-- PASSO 2: Injetar o perfil oficial MIRA (sem dependência de auth.users)
INSERT INTO public.profiles (id, name, role, reputation, trust_level, is_verified)
VALUES (
    '00000000-0000-0000-0000-000000000001'::UUID,
    'MIRA Oficial',
    'admin',
    9999,
    'Especialista',
    true
) ON CONFLICT (id) DO UPDATE SET
    name = 'MIRA Oficial',
    role = 'admin',
    reputation = 9999,
    is_verified = true;

-- PASSO 3: Injetar os 18 Pilares Soberanos
DO $$
DECLARE
  v_author_id UUID := '00000000-0000-0000-0000-000000000001'::UUID;
BEGIN

INSERT INTO public.posts (author_id, author_name, title, content, category, is_verified, validation_status, urgency, nobel_score, likes, useful_votes, fake_votes, background_image)
VALUES
  (v_author_id, 'MIRA Oficial', 'AIMA 2026: A Manifestação de Interesse foi REVOGADA',
   'A Manifestação de Interesse (Art. 88.2 e 89.2) foi revogada em 4 de Junho de 2024 pelo Decreto-Lei 37-A/2024. Atualmente é OBRIGATÓRIO entrar em Portugal com Visto de Residência obtido no consulado de origem. Não há mais regularização "por dentro". Exceções apenas para casos humanitários. Fonte: AIMA oficial.',
   'AIMA', true, 'approved', 10, 5000, 120, 89, 2,
   'https://images.unsplash.com/photo-1521737852567-6949f3f9f2b5?w=800&q=80'),

  (v_author_id, 'MIRA Oficial', 'Como agendar na AIMA em 2026 (Guia Completo)',
   'Os agendamentos na AIMA são feitos exclusivamente pelo portal digital aima.gov.pt. Passos: 1. Cria conta no portal. 2. Escolhe o serviço. 3. Seleciona data e hora disponível. 4. Leva TODOS os documentos originais + cópias. Dica: Os slots para Lisboa esgotam em minutos — tenta às 08h00 exatas.',
   'AIMA', true, 'approved', 9, 4800, 98, 76, 1,
   'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80'),

  (v_author_id, 'MIRA Oficial', 'NIF em Portugal: Como obter sem Representante Fiscal',
   'Residentes fora da UE podem obter o NIF sem representante fiscal se apresentarem prova de morada válida em Portugal no ato do pedido. Documentos necessários: Passaporte original + cópia, comprovativo de morada em Portugal (contrato de arrendamento, declaração de hospedagem). Local: Qualquer Loja do Cidadão ou Serviço de Finanças. É GRATUITO.',
   'Fiscal', true, 'approved', 8, 4500, 145, 112, 0,
   'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=80'),

  (v_author_id, 'MIRA Oficial', 'NISS para Estrangeiros: Passo a Passo 2026',
   'O Número de Identificação de Segurança Social (NISS) para estrangeiros é pedido online via Segurança Social Direta (SSD). Caminho: Perfil > Número de Identificação > Pedir NISS. Documentos: Passaporte/Título de Residência, NIF e comprovativo de morada.',
   'Segurança Social', true, 'approved', 8, 4200, 87, 65, 0,
   'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&q=80'),

  (v_author_id, 'MIRA Oficial', 'Reagrupamento Familiar em Portugal: Requisitos 2026',
   'O pedido de reagrupamento familiar deve ser feito no portal AIMA após 1 ano de residência legal do titular principal. Documentos: Título de residência válido, prova de meios de subsistência, habitação adequada e certidão de nascimento/casamento apostilada.',
   'AIMA', true, 'approved', 9, 4100, 76, 58, 1,
   'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&q=80'),

  (v_author_id, 'MIRA Oficial', 'Renovação de Autorização de Residência: Não Percas o Prazo',
   'A renovação deve ser pedida 30 dias ANTES do vencimento do título. Se pedires fora do prazo, podes receber uma coima. O pedido é feito no portal AIMA. Enquanto o processo está pendente, o título anterior mantém a validade (declaração de pendência).',
   'AIMA', true, 'approved', 10, 4000, 134, 98, 0,
   'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?w=800&q=80'),

  (v_author_id, 'MIRA Oficial', 'Visto D7: A Via para Quem Tem Rendimento Passivo',
   'O Visto D7 é para quem recebe rendimentos de fontes externas a Portugal (reforma, arrendamento, dividendos, trabalho remoto). Requisitos: Rendimento mínimo mensal igual ou superior ao salário mínimo português (820€/mês em 2026).',
   'Vistos', true, 'approved', 7, 3800, 92, 71, 0,
   'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80'),

  (v_author_id, 'MIRA Oficial', 'Título CPLP: O Que Muda em 2026',
   'Os títulos CPLP conferem direito de residência em Portugal mas exigem troca pelo título definitivo para circulação livre em Schengen. A troca é feita na AIMA com apresentação do título CPLP válido + documentos pessoais. Atenção: o título CPLP NÃO permite trabalhar automaticamente.',
   'Vistos', true, 'approved', 7, 3600, 65, 48, 2,
   'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80'),

  (v_author_id, 'MIRA Oficial', 'Direitos do Trabalhador Estrangeiro em Portugal (ACT 2026)',
   'O trabalhador estrangeiro tem os MESMOS direitos que o nacional. Obrigações do empregador: contrato escrito com menção ao título de residência, comunicação à Segurança Social até 24h antes do início de funções, salário mínimo garantido (820€/mês em 2026).',
   'Trabalho', true, 'approved', 8, 3500, 88, 67, 1,
   'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800&q=80'),

  (v_author_id, 'MIRA Oficial', 'Acesso ao SNS para Imigrantes: Como Inscrever-se',
   'Imigrantes com situação regularizada têm acesso pleno ao SNS. Inscrição: vai ao Centro de Saúde da tua área de residência com título de residência ou comprovativo de pedido pendente + comprovativo de morada. Imigrantes em situação irregular também têm acesso a cuidados urgentes.',
   'Saúde', true, 'approved', 7, 3400, 71, 54, 0,
   'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80'),

  (v_author_id, 'MIRA Oficial', 'IRS em Portugal: Guia para Imigrantes 2026',
   'Se trabalhaste em Portugal em 2025, és obrigado a entregar IRS em 2026 (prazo: Abril-Junho). Precisas de NIF e acesso ao Portal das Finanças. Se ficaste cá menos de 183 dias, és considerado não-residente (taxa fixa de 25%). Se ficaste mais, és residente.',
   'Fiscal', true, 'approved', 6, 3200, 56, 43, 0,
   'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&q=80'),

  (v_author_id, 'MIRA Oficial', 'Porta 65 Jovem: Apoio à Habitação para Imigrantes',
   'O programa Porta 65 apoia jovens entre 18 e 35 anos no pagamento da renda. Imigrantes com residência legal podem candidatar-se. O apoio pode chegar a 200€/mês e durar até 60 meses. Candidatura online no Portal da Habitação (portaldahabitacao.pt).',
   'Habitação', true, 'approved', 7, 3100, 79, 61, 0,
   'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80'),

  (v_author_id, 'MIRA Oficial', 'Naturalização Portuguesa: Requisitos e Prazos 2026',
   'Após 5 anos de residência legal em Portugal podes pedir a nacionalidade portuguesa. Requisitos: título de residência válido, registo criminal limpo, conhecimento básico de português (A2). Pedido feito nos Registos Centrais. Prazo de resposta: 12-24 meses.',
   'Nacionalidade', true, 'approved', 8, 3000, 93, 72, 1,
   'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80'),

  (v_author_id, 'MIRA Oficial', 'Subsídio de Desemprego para Imigrantes: Tens Direito?',
   'Sim! Se trabalhaste legalmente em Portugal e descontaste para a Segurança Social durante pelo menos 360 dias nos últimos 24 meses, tens direito ao subsídio de desemprego. Pedido: Segurança Social Direta (SSD) ou presencialmente. Prazo: 90 dias após o desemprego.',
   'Segurança Social', true, 'approved', 7, 2900, 67, 51, 0,
   'https://images.unsplash.com/photo-1476900543704-4312b78632f8?w=800&q=80'),

  (v_author_id, 'MIRA Oficial', 'Abono de Família para Imigrantes com Filhos',
   'Imigrantes com residência legal e filhos em Portugal têm direito ao abono de família. Condições: filho inscrito no SNS e na escola, rendimentos do agregado dentro dos limites. Pedido online na Segurança Social Direta.',
   'Família', true, 'approved', 6, 2800, 58, 44, 0,
   'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&q=80'),

  (v_author_id, 'MIRA Oficial', 'Equivalência e Reconhecimento de Diplomas em Portugal',
   'Para exercer profissões reguladas (médico, enfermeiro, advogado, engenheiro) precisas de reconhecimento do diploma pela ordem profissional respetiva. Para diplomas da CPLP o processo é simplificado. Custo: entre 50€ e 200€.',
   'Educação', true, 'approved', 6, 2700, 49, 37, 0,
   'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800&q=80'),

  (v_author_id, 'MIRA Oficial', 'Carta de Condução Estrangeira em Portugal: O Que Fazer',
   'Cartas de condução da UE/EEE são válidas em Portugal sem conversão. Cartas de fora da UE: podes conduzir até 185 dias após te tornares residente. Após esse prazo, deves trocar pela carta portuguesa no IMT.',
   'Transportes', true, 'approved', 5, 2600, 44, 33, 0,
   'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&q=80'),

  (v_author_id, 'MIRA Oficial', 'Criar Empresa em Portugal como Imigrante: Guia 2026',
   'Imigrantes com autorização de residência podem criar empresa em Portugal. Formas jurídicas: ENI (sem capital mínimo) ou Lda (capital mínimo 1€). Registo online em eportugal.gov.pt em 1 dia útil.',
   'Empreendedorismo', true, 'approved', 6, 2500, 41, 31, 0,
   'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&q=80')

ON CONFLICT DO NOTHING;

RAISE NOTICE '✅ RESGATE COMPLETO: 18 posts soberanos injetados com sucesso!';

END $$;

-- PASSO 4: Criar/Substituir o RPC do Feed Soberano
CREATE OR REPLACE FUNCTION public.get_sovereign_community_feed_v25(
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0,
    p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    author_id UUID,
    author_name TEXT,
    author_avatar TEXT,
    author_is_verified BOOLEAN,
    title TEXT,
    content TEXT,
    category TEXT,
    is_verified BOOLEAN,
    background_image TEXT,
    validation_status TEXT,
    created_at TIMESTAMPTZ,
    likes INTEGER,
    useful_votes INTEGER,
    fake_votes INTEGER,
    reports INTEGER,
    nobel_score INTEGER,
    translations JSONB,
    comments JSONB,
    is_liked_by_user BOOLEAN,
    is_saved_by_user BOOLEAN,
    user_vote TEXT,
    urgency INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.author_id,
        COALESCE(pr.name, p.author_name, 'Membro MIRA') AS author_name,
        COALESCE(pr.avatar_url, p.author_avatar, '') AS author_avatar,
        COALESCE(pr.is_verified, false) AS author_is_verified,
        p.title,
        p.content,
        p.category,
        COALESCE(p.is_verified, false) AS is_verified,
        COALESCE(p.background_image, '') AS background_image,
        COALESCE(p.validation_status, 'approved') AS validation_status,
        p.created_at,
        COALESCE(p.likes, 0) AS likes,
        COALESCE(p.useful_votes, 0) AS useful_votes,
        COALESCE(p.fake_votes, 0) AS fake_votes,
        COALESCE(p.reports, 0) AS reports,
        COALESCE(p.nobel_score, 0) AS nobel_score,
        COALESCE(p.translations, '{}'::JSONB) AS translations,
        COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'id', c.id,
                    'author_id', c.author_id,
                    'author_name', COALESCE(cp.name, 'Membro'),
                    'author_avatar', COALESCE(cp.avatar_url, ''),
                    'content', c.content,
                    'created_at', c.created_at,
                    'likes_count', COALESCE(c.likes_count, 0),
                    'parent_id', c.parent_id
                ) ORDER BY c.created_at ASC
            ) FROM public.comments c
            LEFT JOIN public.profiles cp ON cp.id = c.author_id
            WHERE c.post_id = p.id),
            '[]'::JSONB
        ) AS comments,
        CASE 
            WHEN p_user_id IS NOT NULL THEN EXISTS(
                SELECT 1 FROM public.post_votes pv 
                WHERE pv.post_id = p.id AND pv.user_id = p_user_id AND pv.vote_type = 'like'
            )
            ELSE false
        END AS is_liked_by_user,
        CASE 
            WHEN p_user_id IS NOT NULL THEN EXISTS(
                SELECT 1 FROM public.saved_posts sp 
                WHERE sp.post_id = p.id AND sp.user_id = p_user_id
            )
            ELSE false
        END AS is_saved_by_user,
        CASE 
            WHEN p_user_id IS NOT NULL THEN (
                SELECT pv.vote_type 
                FROM public.post_votes pv 
                WHERE pv.post_id = p.id AND pv.user_id = p_user_id 
                AND pv.vote_type IN ('useful', 'fake')
                LIMIT 1
            )
            ELSE NULL
        END AS user_vote,
        COALESCE(p.urgency, 0) AS urgency
    FROM public.posts p
    LEFT JOIN public.profiles pr ON pr.id = p.author_id
    WHERE COALESCE(p.validation_status, 'approved') != 'rejected'
    ORDER BY 
        COALESCE(p.nobel_score, 0) DESC,
        p.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Conceder permissão ao role anon e authenticated
GRANT EXECUTE ON FUNCTION public.get_sovereign_community_feed_v25 TO anon;
GRANT EXECUTE ON FUNCTION public.get_sovereign_community_feed_v25 TO authenticated;

-- Verificação final
SELECT 
    COUNT(*) as total_posts,
    SUM(CASE WHEN is_verified THEN 1 ELSE 0 END) as posts_verificados,
    MAX(COALESCE(nobel_score, 0)) as maior_nobel_score
FROM public.posts;

NOTIFY pgrst, 'reload schema';
