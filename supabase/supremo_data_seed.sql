-- 🏛️ MIRA V2026: SUPREMO-DATA (VERDADE DE ESTADO)
-- Injeta as diretrizes oficiais das autoridades portuguesas.

INSERT INTO public.knowledge_base (topic, content, category, url, metadata)
VALUES 
(
    'AIMA - Nova Regra de Residência (Junho 2024)',
    'A Manifestação de Interesse (Art. 88.2 e 89.2) foi REVOGADA em 4 de Junho de 2024 (Decreto-Lei 37-A/2024). Atualmente, é obrigatório entrar em Portugal com um Visto de Residência obtido no consulado de origem. Exceções aplicam-se apenas a casos humanitários ou regimes específicos de nomadismo digital.',
    'Verdade de Estado',
    'https://aima.gov.pt/pt/vistos',
    '{"source": "AIMA", "priority": 0, "veracity": "absolute"}'
),
(
    'Segurança Social - Como Pedir NISS Digital',
    'O NISS para estrangeiros agora é solicitado online via Segurança Social Direta (SSD). Menu: Perfil > Número de Identificação de Segurança Social > Pedir NISS. É necessário anexar cópia do Passaporte/Título de Residência, NIF e comprovativo de morada.',
    'Verdade de Estado',
    'https://www.seg-social.pt/',
    '{"source": "Segurança Social", "priority": 0, "veracity": "absolute"}'
),
(
    'ACT - Direitos do Trabalhador Estrangeiro',
    'O trabalhador estrangeiro tem os mesmos direitos que o nacional. É OBRIGATÓRIO que o contrato de trabalho seja escrito e mencione o título de residência. O empregador deve comunicar a admissão à Seg. Social (SSD) até 24h antes do início de funções. A ACT protege contra exploração e garante subsídios iguais.',
    'Verdade de Estado',
    'https://portal.act.gov.pt/',
    '{"source": "ACT", "priority": 0, "veracity": "absolute"}'
),
(
    'Porta 65 Jovem - Apoio ao Arrendamento',
    'O Porta 65 apoia jovens entre 18 e 35 anos no pagamento da renda. Requisitos: Contrato de arrendamento registado nas Finanças, residência legal em Portugal e rendimentos compatíveis. A candidatura é feita online no Portal da Habitação e o apoio pode durar até 60 meses.',
    'Verdade de Estado',
    'https://www.portaldahabitacao.pt/',
    '{"source": "IHRU", "priority": 0, "veracity": "absolute"}'
),
(
    'EMN/AIMA - Perfil Migratório 2024',
    'Portugal mantém uma política de migração humanista e regulada. O Relatório de 2024 destaca que a população estrangeira residente atingiu níveis recorde, com impacto positivo na demografia e economia. A integração laboral é a prioridade estratégica do governo.',
    'Verdade de Estado',
    'https://aima.gov.pt/pt/a-aima/relatorios-de-migracoes-e-asilo',
    '{"source": "AIMA/EMN", "priority": 0, "veracity": "absolute"}'
);
