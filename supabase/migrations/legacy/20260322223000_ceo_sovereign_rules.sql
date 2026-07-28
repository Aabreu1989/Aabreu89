-- 🧠 MIRA V2026: INGESTÃO DE DIRETRIZES SOBERANAS (SABER IA)
-- Este script injeta os 4 Pilares de Ouro da CEO Amanda Abreu.

DELETE FROM public.saber_ia WHERE topic IN ('A PASTA DE OURO', 'A LÍNGUA É A CHAVE', 'ZERO ATALHOS', 'A TRIBO MIRA');

INSERT INTO public.saber_ia (topic, content, category, url, metadata)
VALUES 
(
    'A PASTA DE OURO',
    'O sucesso do imigrante começa na organização. Digitaliza tudo, guarda os originais. A MIRA salva o teu futuro.',
    'Estratégia CEO',
    'https://mira.pt/docs',
    '{"priority": "supreme", "ceo_weight": 1.5}'
),
(
    'A LÍNGUA É A CHAVE',
    'Não fiques na bolha. Aprende português no module [/learning]. Quem fala a língua ganha o dobro e é respeitado o triplo.',
    'Estratégia CEO',
    'https://mira.pt/learning',
    '{"priority": "supreme", "ceo_weight": 1.5}'
),
(
    'ZERO ATALHOS',
    'Em Portugal, quem tenta ''comprar'' o caminho acaba deportado ou burlado. Usa apenas os canais oficiais.',
    'Estratégia CEO',
    'https://aima.gov.pt/',
    '{"priority": "supreme", "ceo_weight": 1.5}'
),
(
    'A TRIBO MIRA',
    'A solidão mata. Se estás perdido, entra na [/community]. Onde um cai, dez levantam.',
    'Estratégia CEO',
    'https://mira.pt/community',
    '{"priority": "supreme", "ceo_weight": 1.5}'
);

-- Notificar Sucesso
DO $$ BEGIN RAISE NOTICE 'MIRA: Diretrizes de Ouro (Saber IA) Injetadas! 👑'; END $$;
