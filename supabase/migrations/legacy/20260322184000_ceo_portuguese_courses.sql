-- 🧠 MIRA V2026: DIRETIVA CEO AMANDA ABREU - CURSOS DE PORTUGUÊS
-- Objetivo: Garantir resposta "simples" e direta sobre cursos gratuitos

INSERT INTO saber_ia (category, topic, content, url)
VALUES (
  'Educação',
  'Cursos de Português Gratuitos',
  'Existem várias opções de cursos de português gratuitos em Portugal: 1. Centros Qualifica (IEFP) - Procure o mais próximo da sua residência. 2. ACM (Alto Comissariado para as Migrações) através do programa PPT (Português para Todos). 3. Projetos locais da AIMA (antigo SEF). 4. Bibliotecas Municipais em Lisboa, Porto e Braga costumam oferecer cursos livres. Pode encontrar mais detalhes e links diretos na nossa seção [/learning].',
  '/learning'
)
ON CONFLICT (topic) DO UPDATE SET content = EXCLUDED.content;
