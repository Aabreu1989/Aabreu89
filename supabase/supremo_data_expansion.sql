-- MIRA V2026: Supremo-Data Expansion (Legal-Elite Edition)
-- Ingesting Lei 23/2007, STA Jurisprudência, and Provedoria Recommendations

-- 1. LEI 23/2007 CONSOLIDADA (DRE)
INSERT INTO knowledge_base (topic, content, category, metadata) VALUES
('Lei 23/2007: Artigo 1.º - Objecto', 'A presente lei define as condições e procedimentos de entrada, permanência, saída e afastamento de cidadãos estrangeiros do território português, bem como o estatuto de residente de longa duração.', 'Lei Consolidada', '{"priority": 0, "source": "DRE", "official": true}'),
('Lei 23/2007: Artigo 3.º - Definições de Elite', 'Define termos técnicos críticos: Atividade altamente qualificada, transportadora, passagem de fronteira, etc.', 'Lei Consolidada', '{"priority": 0, "source": "DRE", "official": true}'),
('Lei 23/2007: Artigo 5.º - Regimes Especiais', 'Salvaguarda regimes especiais decorrentes de acordos bilaterais ou multilaterais (ex: Mobilidade CPLP).', 'Lei Consolidada', '{"priority": 0, "source": "DRE", "official": true}'),
('Lei 23/2007: Artigo 10.º - Visto de Entrada', 'A entrada em território português de cidadãos estrangeiros está sujeita à posse de visto, salvo as excepções previstas na lei.', 'Lei Consolidada', '{"priority": 0, "source": "DRE", "official": true}'),
('Lei 23/2007: Artigo 122.º - Dispensa de Visto (Reagrupamento)', 'Permite a concessão de autorização de residência com dispensa de visto a: Nascidos em Portugal, Filhos de residentes, Situações humanitárias ou de excepcional interesse nacional.', 'Lei Consolidada', '{"priority": 0, "source": "DRE", "official": true}');

-- 2. JURISPRUDÊNCIA DO SUPREMO (STA)
INSERT INTO knowledge_base (topic, content, category, metadata) VALUES
('Jurisprudência STA: Processo 01004/25.6BELSB.SA1', 'Data: 15/01/2026. Decisão: A intimação para proteção de direitos (via urgente) não deve ser usada para contornar a morosidade administrativa normal da AIMA, exceto em casos de extrema vulnerabilidade comprovada.', 'Jurisprudência', '{"priority": 1, "source": "STA", "expert": true, "case_number": "01004/25.6BELSB.SA1"}'),
('Jurisprudência STA: Processo 02077/24.4BELSB', 'Data: 13/03/2025. Decisão: O silêncio da AIMA em pedidos de Reagrupamento Familiar exige prova de "urgência especial" (risco à integridade familiar) para justificar ordem judicial urgente.', 'Jurisprudência', '{"priority": 1, "source": "STA", "expert": true, "case_number": "02077/24.4BELSB"}'),
('Jurisprudência STA: Processo 03316/24.7BELSB', 'Data: 18/12/2024. Decisão: O Direito Fundamental ao Reagrupamento Familiar deve ser demonstrado como sob risco de dano irreparável em casos de atraso sistémico para priorização em tribunal.', 'Jurisprudência', '{"priority": 1, "source": "STA", "expert": true, "case_number": "03316/24.7BELSB"}'),
('Jurisprudência STA: Processo 0202/22.9BEPRT-A', 'Data: 04/12/2024. Decisão: Aplicabilidade do "fumus boni iuris" - o tribunal só força a AIMA se houver alta probabilidade de o requerente cumprir todos os requisitos legais.', 'Jurisprudência', '{"priority": 1, "source": "STA", "expert": true, "case_number": "0202/22.9BEPRT-A"}'),
('Jurisprudência STA: Processo 03760/23.7BELSB', 'Data: 11/07/2024. Decisão: O Estado tem obrigação de processar títulos de residência para familiares em território nacional, mesmo sem visto de entrada, sob cláusulas humanitárias.', 'Jurisprudência', '{"priority": 1, "source": "STA", "expert": true, "case_number": "03760/23.7BELSB"}');

-- 3. RECOMENDAÇÕES DA PROVEDORIA DE JUSTIÇA
INSERT INTO knowledge_base (topic, content, category, metadata) VALUES
('Recomendação Provedoria: Prorrogação Automática (DL 10-A/2020)', 'A Provedoria recomendou que a AIMA clarifique publicamente a validade dos títulos caducados para evitar recusas indevidas no acesso à saúde e trabalho.', 'Doutrina', '{"priority": 1, "source": "Provedoria de Justiça", "expert": true}'),
('Relatório Provedoria: Crise de Eficiência AIMA 2024/2025', 'Identifica um bloqueio sistémico no Reagrupamento Familiar pós-extinção do SEF, violando o princípio constitucional da proteção da família.', 'Doutrina', '{"priority": 1, "source": "Provedoria de Justiça", "expert": true}'),
('Crítica Provedoria: Portais Digitais AIMA', 'Recomenda a correção urgente dos erros 404 e bloqueios digitais que impedem o início de processos legais obrigatórios.', 'Doutrina', '{"priority": 1, "source": "Provedoria de Justiça", "expert": true}');
