-- ============================================================
-- 👑 RESGATE DE FEED SOBERANO — V200000
-- PROJETO: pnlzyshozpqlzuyjesdq (BASTIÃO 2.0)
-- OBJETIVO: Injetar os 18 pilares da imigração em public.posts
-- INSTRUÇÃO: Correr no SQL Editor do projeto pnlz
-- ============================================================

BEGIN;

-- Garantir que a CEO Amanda tem perfil no novo projeto
-- (Substitui o UUID abaixo pelo teu user ID se souberes)
DO $$
DECLARE
  v_author_id UUID;
BEGIN
  -- Busca o ID da Amanda pelo email
  SELECT id INTO v_author_id FROM auth.users 
  WHERE email IN ('amandajhonnes@yahoo.com.br', 'amandasabreu89@gmail.com')
  LIMIT 1;

  -- Se não existe utilizador ainda, usa um UUID fixo de sistema
  IF v_author_id IS NULL THEN
    -- Cria um perfil de sistema para os posts oficiais
    v_author_id := '00000000-0000-0000-0000-000000000001'::UUID;
    INSERT INTO public.profiles (id, email, username, role, is_verified, level, avatar_url)
    VALUES (v_author_id, 'sistema@miraimigrante.pt', 'MIRA Oficial', 'admin', true, 99, '')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- ============================================================
  -- INJEÇÃO DOS 18 PILARES SOBERANOS
  -- ============================================================
  INSERT INTO public.posts (author_id, title, content, category, is_verified, validation_status, urgency, nobel_score, likes_count, useful_votes_count, fake_votes_count)
  VALUES

  -- 1. AIMA — Manifestação de Interesse (REVOGADA)
  (v_author_id,
   'AIMA 2026: A Manifestação de Interesse foi REVOGADA',
   'A Manifestação de Interesse (Art. 88.2 e 89.2) foi revogada em 4 de Junho de 2024 pelo Decreto-Lei 37-A/2024. Atualmente é OBRIGATÓRIO entrar em Portugal com Visto de Residência obtido no consulado de origem. Não há mais regularização "por dentro". Exceções apenas para casos humanitários. Fonte: AIMA oficial.',
   'AIMA', true, 'approved', 10, 5000, 120, 89, 2),

  -- 2. AIMA — Agendamentos
  (v_author_id,
   'Como agendar na AIMA em 2026 (Guia Completo)',
   'Os agendamentos na AIMA são feitos exclusivamente pelo portal digital aima.gov.pt. Passos: 1. Cria conta no portal. 2. Escolhe o serviço (Autorização de Residência, Renovação, etc.). 3. Seleciona data e hora disponível. 4. Leva TODOS os documentos originais + cópias. Dica: Os slots para Lisboa esgotam em minutos — tenta às 08h00 exatas.',
   'AIMA', true, 'approved', 9, 4800, 98, 76, 1),

  -- 3. NIF sem representante
  (v_author_id,
   'NIF em Portugal: Como obter sem Representante Fiscal',
   'Residentes fora da UE podem obter o NIF sem representante fiscal se apresentarem prova de morada válida em Portugal no ato do pedido. Documentos necessários: Passaporte original + cópia, comprovativo de morada em Portugal (contrato de arrendamento, declaração de hospedagem). Local: Qualquer Loja do Cidadão ou Serviço de Finanças. É GRATUITO.',
   'Fiscal', true, 'approved', 8, 4500, 145, 112, 0),

  -- 4. NISS
  (v_author_id,
   'NISS para Estrangeiros: Passo a Passo 2026',
   'O Número de Identificação de Segurança Social (NISS) para estrangeiros é pedido online via Segurança Social Direta (SSD). Caminho: Perfil > Número de Identificação > Pedir NISS. Documentos: Passaporte/Título de Residência, NIF e comprovativo de morada. Para trabalhadores com contrato, o empregador pode pedir o NISS diretamente.',
   'Segurança Social', true, 'approved', 8, 4200, 87, 65, 0),

  -- 5. Reagrupamento Familiar
  (v_author_id,
   'Reagrupamento Familiar em Portugal: Requisitos 2026',
   'O pedido de reagrupamento familiar deve ser feito no portal AIMA após 1 ano de residência legal do titular principal. Documentos: Título de residência válido, prova de meios de subsistência (IRS ou declaração de rendimentos), habitação adequada (certidão de composição do agregado + contrato de arrendamento) e certidão de nascimento/casamento apostilada.',
   'AIMA', true, 'approved', 9, 4100, 76, 58, 1),

  -- 6. Renovação de Autorização de Residência
  (v_author_id,
   'Renovação de Autorização de Residência: Não Percas o Prazo',
   'A renovação deve ser pedida 30 dias ANTES do vencimento do título. Se pedires fora do prazo, podes receber uma coima. O pedido é feito no portal AIMA. Enquanto o processo está pendente, o título anterior mantém a validade (declaração de pendência). Dica: Guarda sempre o comprovativo de entrega do pedido.',
   'AIMA', true, 'approved', 10, 4000, 134, 98, 0),

  -- 7. Visto D7 — Rendimento Passivo
  (v_author_id,
   'Visto D7: A Via para Quem Tem Rendimento Passivo',
   'O Visto D7 é para quem recebe rendimentos de fontes externas a Portugal (reforma, arrendamento, dividendos, trabalho remoto). Requisitos: Rendimento mínimo mensal igual ou superior ao salário mínimo português (820€/mês em 2026). Pedido feito no consulado português do país de origem. Após aprovação, pede Autorização de Residência na AIMA.',
   'Vistos', true, 'approved', 7, 3800, 92, 71, 0),

  -- 8. CPLP
  (v_author_id,
   'Título CPLP: O Que Muda em 2026',
   'Os títulos CPLP conferem direito de residência em Portugal mas exigem troca pelo título definitivo para circulação livre em Schengen. A troca é feita na AIMA com apresentação do título CPLP válido + documentos pessoais. Atenção: o título CPLP NÃO permite trabalhar automaticamente — precisas de comunicar à ACT.',
   'Vistos', true, 'approved', 7, 3600, 65, 48, 2),

  -- 9. Direitos Laborais
  (v_author_id,
   'Direitos do Trabalhador Estrangeiro em Portugal (ACT 2026)',
   'O trabalhador estrangeiro tem os MESMOS direitos que o nacional. Obrigações do empregador: contrato escrito com menção ao título de residência, comunicação à Segurança Social até 24h antes do início de funções, salário mínimo garantido (820€/mês em 2026). Denúncias de exploração laboral: portal da ACT (portal.act.gov.pt) — é confidencial.',
   'Trabalho', true, 'approved', 8, 3500, 88, 67, 1),

  -- 10. SNS — Saúde
  (v_author_id,
   'Acesso ao SNS para Imigrantes: Como Inscrever-se',
   'Imigrantes com situação regularizada têm acesso pleno ao SNS. Inscrição: vai ao Centro de Saúde da tua área de residência com título de residência ou comprovativo de pedido pendente + comprovativo de morada. Imigrantes em situação irregular também têm acesso a cuidados urgentes e de maternidade.',
   'Saúde', true, 'approved', 7, 3400, 71, 54, 0),

  -- 11. IRS para Imigrantes
  (v_author_id,
   'IRS em Portugal: Guia para Imigrantes 2026',
   'Se trabalhaste em Portugal em 2025, és obrigado a entregar IRS em 2026 (prazo: Abril-Junho). Precisas de NIF e acesso ao Portal das Finanças. Se ficaste cá menos de 183 dias, és considerado não-residente (taxa fixa de 25%). Se ficaste mais, és residente e aplica-se o escalão normal. Dica: o IRS pode gerar reembolso!',
   'Fiscal', true, 'approved', 6, 3200, 56, 43, 0),

  -- 12. Porta 65 — Habitação
  (v_author_id,
   'Porta 65 Jovem: Apoio à Habitação para Imigrantes',
   'O programa Porta 65 apoia jovens entre 18 e 35 anos no pagamento da renda. Imigrantes com residência legal podem candidatar-se. Requisitos: contrato de arrendamento registado nas Finanças, rendimentos compatíveis. O apoio pode chegar a 200€/mês e durar até 60 meses. Candidatura online no Portal da Habitação (portaldahabitacao.pt).',
   'Habitação', true, 'approved', 7, 3100, 79, 61, 0),

  -- 13. Naturalização
  (v_author_id,
   'Naturalização Portuguesa: Requisitos e Prazos 2026',
   'Após 5 anos de residência legal em Portugal podes pedir a nacionalidade portuguesa. Requisitos: título de residência válido, registo criminal limpo (do país de origem e de Portugal), conhecimento básico de português (A2 — certificado reconhecido pelo Camões). Pedido feito nos Registos Centrais (irn.justica.gov.pt). Prazo de resposta: 12-24 meses.',
   'Nacionalidade', true, 'approved', 8, 3000, 93, 72, 1),

  -- 14. Subsídio de Desemprego
  (v_author_id,
   'Subsídio de Desemprego para Imigrantes: Tens Direito?',
   'Sim! Se trabalhaste legalmente em Portugal e descontaste para a Segurança Social durante pelo menos 360 dias nos últimos 24 meses, tens direito ao subsídio de desemprego. O valor é calculado sobre o teu salário base. Pedido: Segurança Social Direta (SSD) ou presencialmente. Prazo: 90 dias após o desemprego.',
   'Segurança Social', true, 'approved', 7, 2900, 67, 51, 0),

  -- 15. Abono de Família
  (v_author_id,
   'Abono de Família para Imigrantes com Filhos',
   'Imigrantes com residência legal e filhos em Portugal têm direito ao abono de família. Condições: filho inscrito no SNS e na escola, rendimentos do agregado dentro dos limites (varia conforme o escalão). Pedido online na Segurança Social Direta. O abono pode acumular com outros apoios sociais.',
   'Família', true, 'approved', 6, 2800, 58, 44, 0),

  -- 16. Equivalência de Diplomas
  (v_author_id,
   'Equivalência e Reconhecimento de Diplomas em Portugal',
   'Para exercer profissões reguladas (médico, enfermeiro, advogado, engenheiro) precisas de reconhecimento do diploma pela ordem profissional respetiva. Para outros fins (emprego geral, mestrado): pede equivalência na universidade pública portuguesa correspondente. Para diplomas da CPLP o processo é simplificado. Custo: entre 50€ e 200€.',
   'Educação', true, 'approved', 6, 2700, 49, 37, 0),

  -- 17. Condução em Portugal
  (v_author_id,
   'Carta de Condução Estrangeira em Portugal: O Que Fazer',
   'Cartas de condução da UE/EEE são válidas em Portugal sem conversão. Cartas de fora da UE: podes conduzir até 185 dias após te tornares residente. Após esse prazo, deves trocar pela carta portuguesa no IMT. Para trocar: título de residência + carta original + exame médico. Países com acordo bilateral (Brasil, EUA, etc.) têm processo simplificado.',
   'Transportes', true, 'approved', 5, 2600, 44, 33, 0),

  -- 18. Empreendedorismo — Criação de Empresa
  (v_author_id,
   'Criar Empresa em Portugal como Imigrante: Guia 2026',
   'Imigrantes com autorização de residência podem criar empresa em Portugal. Formas jurídicas mais comuns: Empresário em Nome Individual (ENI) — mais simples, sem capital mínimo; Sociedade por Quotas (Lda) — capital mínimo de 1€. Registo online em eportugal.gov.pt em 1 dia útil. Obrigações: NIF, NISS, inscrição na Segurança Social como trabalhador independente.',
   'Empreendedorismo', true, 'approved', 6, 2500, 41, 31, 0);

  RAISE NOTICE 'RESGATE COMPLETO: 18 posts injetados com sucesso. Author ID: %', v_author_id;

END $$;

-- Verificação final
SELECT COUNT(*) as total_posts, 
       SUM(CASE WHEN is_verified THEN 1 ELSE 0 END) as posts_verificados,
       MAX(nobel_score) as maior_nobel_score
FROM public.posts;

COMMIT;
