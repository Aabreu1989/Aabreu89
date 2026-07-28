-- 🛡️ MIRA SOBERANIA: Injeção de Serviços Públicos Core
-- Inserir os principais balcões e portais oficiais de Portugal

INSERT INTO public.map_alerts (id, title, category, lat, lng, address, city, website, description)
VALUES 
('p-serv-irn-nacional', 'IRN – Instituto dos Registos e do Notariado (Portal Oficial)', 'Residência & Vistos', 38.7223, -9.1393, 'Rua de São Bento, 148, 1200-821 Lisboa', 'Lisboa / Nacional', 'https://irn.justica.gov.pt/', 'Portal oficial para documentos, nacionalidade e registos civis.'),
('p-serv-iefp-nacional', 'IEFP – Instituto do Emprego e Formação Profissional (Portal Oficial)', 'Trabalho & Carreira', 38.7223, -9.1393, 'Rua de Xabregas, 52, 1949-003 Lisboa', 'Lisboa / Nacional', 'https://www.iefp.pt/', 'Gestão de emprego, formação profissional e apoio ao desemprego.'),
('p-serv-ss-nacional', 'Segurança Social Direta (Portal Oficial)', 'Finanças & Impostos', 38.7223, -9.1393, 'Rua Rosa Araújo, 43, 1250-194 Lisboa', 'Lisboa / Nacional', 'https://www.seg-social.pt/', 'Acesso principal a apoios sociais, abonos e historial de descontos.'),
('p-serv-financas-nacional', 'Portal das Finanças (Autoridade Tributária)', 'Finanças & Impostos', 38.7223, -9.1393, 'Rua do Comércio, 49, 1100-150 Lisboa', 'Lisboa / Nacional', 'https://www.portaldasfinancas.gov.pt/', 'Gestão fiscal, NIF, IRS e situação tributária.'),
('p-serv-loja-cidadao-laranjeiras', 'Loja do Cidadão das Laranjeiras', 'Residência & Vistos', 38.7495, -9.1678, 'Rua Abranches Ferrão, 10, 1600-001 Lisboa', 'Lisboa', 'https://www.gov.pt/contactos/loja-de-cidadao-das-laranjeiras', 'O maior centro de serviços públicos concentrados de Lisboa.')
ON CONFLICT (id) DO UPDATE SET 
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  address = EXCLUDED.address,
  website = EXCLUDED.website;
