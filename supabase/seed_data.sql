-- 👑 MIRA SEED DATA: COMMUNITY CONTENT V2026
-- Objetivo: Criar exemplos de alta qualidade para a comunidade

BEGIN;

-- 1. Criar Perfis de Exemplo (se não existirem)
-- Nota: Usamos IDs fixos para referência, mas em produção estes viriam do Auth
INSERT INTO public.profiles (id, name, avatar_url, bio, role, is_verified, reputation, badges)
VALUES 
('a1111111-1111-4111-a111-111111111111', 'Amanda Abreu', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amanda', 'Especialista em Imigração e Criadora do MIRA. Aqui para ajudar!', 'admin', true, 1000, '["pioneer", "verified", "expert"]'::jsonb),
('b2222222-2222-4222-b222-222222222222', 'Ricardo "O Guia"', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ricardo', 'Mentor comunitário e conhecedor das leis de PT.', 'mentor', true, 500, '["verified", "community_leader"]'::jsonb),
('c3333333-3333-4333-c333-333333333333', 'Elena Rossi', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elena', 'Imigrante italiana vivendo o sonho em Lisboa.', 'member', false, 150, '["active_member"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  is_verified = EXCLUDED.is_verified;

-- 2. Inserir Posts de Exemplo
INSERT INTO public.posts (id, author_id, title, content, category, is_verified, validation_status, urgency, likes, useful_votes)
VALUES
(gen_random_uuid(), 'a1111111-1111-4111-a111-111111111111', 
'Guia Definitivo: Agendamento AIMA 2026', 
'Pessoal, para quem está a tentar agendar a renovação do título de residência: o portal costuma abrir novas vagas às terças-feiras de madrugada. Recomendo ter todos os documentos (NIF, NISS, Atestado de Morada) já digitalizados em PDF. Não usem intermediários que cobram por vagas, é perigoso e ilegal! Foquem no portal oficial.', 
'cat_doc', true, 'verified', 2, 45, 12),

(gen_random_uuid(), 'b2222222-2222-4222-b222-222222222222', 
'CUIDADO: Burlas no Arrendamento', 
'Vi muitos posts no Facebook com apartamentos T2 a 400€ em Lisboa. Se parece bom demais para ser verdade, provavelmente é burla. Nunca transfiram dinheiro sem visitar o imóvel e ver o contrato físico. Verifiquem sempre se o senhorio tem o imóvel registado nas Finanças. Segurança em primeiro lugar!', 
'cat_hou', true, 'verified', 3, 89, 34),

(gen_random_uuid(), 'c3333333-3333-4333-c333-333333333333', 
'Consegui! Minha jornada até o Título de Residência', 
'Depois de 6 meses de espera e muita ansiedade, finalmente recebi o meu cartão de residência. O processo foi todo feito online através do novo portal. Para quem está na dúvida: sim, o sistema funciona, mas requer muita paciência. Não desistam e mantenham a vossa morada fiscal sempre atualizada nas Finanças!', 
'cat_com', false, 'verified', 1, 120, 15),

(gen_random_uuid(), 'b2222222-2222-4222-b222-222222222222', 
'Saúde: Como obter o Número de Utente sem stress', 
'Muita gente pergunta como aceder ao SNS. Precisam de ir ao Centro de Saúde (UCSP) da vossa área de residência com: Passaporte, NIF e comprovativo de morada (Junta de Freguesia). Não precisam de ter residência legal para ter número de utente, é um direito universal à saúde em Portugal!', 
'cat_hea', true, 'verified', 2, 67, 28),

(gen_random_uuid(), 'a1111111-1111-4111-a111-111111111111', 
'IEFP: Formação Certificada Gratuita para Junho', 
'Estão abertas as inscrições para novos cursos de Português Língua Não Materna (PLNM) e competências digitais. Estes cursos dão direito a subsídio de alimentação e ajudam imenso na pontuação para a nacionalidade e no currículo. Procurem o centro IEFP mais próximo ou inscrevam-se pelo portal iefponline.', 
'cat_job', true, 'verified', 1, 54, 20);

COMMIT;
