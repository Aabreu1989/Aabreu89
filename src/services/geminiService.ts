const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ""; 

import { createClient } from '@supabase/supabase-js';
import { analytics } from './analyticsService';
import {
  cacheGet,
  cacheSet,
  detectIntentType,
  buildContextHash,
  GREETING_PATTERNS,
  getSessionCoveredTopics,
  normalizeForCache,
} from '../utils/sessionCache';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Versão da KB dinâmica — actualizada quando consultamos ai_knowledge
let _currentKbVersion = '0';
// 🛡️ [MIRA V3.1M] LOCAL KNOWLEDGE BASE - Funciona SEM API (Custo €0)
export const MIRA_LOCAL_KB: Record<string, string> = {
  'nif': 'O NIF (Número de Identificação Fiscal) é o teu número de contribuinte em Portugal. Pedes nas Finanças (Portal das Finanças ou presencialmente), gratuitamente, com o passaporte. É obrigatório para trabalhar, abrir conta bancária e assinar contratos.\n[view:DOCUMENT_ASSISTANT:Gerar Minuta NIF em PDF]',
  'niss': 'O NISS (Número de Identificação da Segurança Social) é obtido através do portal da Segurança Social Direta ou presencialmente. Precisas de contrato de trabalho ou declaração de atividade. É necessário para descontar e aceder a subsídios.\n[view:DOCUMENT_ASSISTANT:Gerar Minuta NISS em PDF]',
  'visto': 'ATUALIZAÇÃO LEGISLATIVA PARLAMENTAR 2025/2026: A Lei n.º 61/2025 e o Decreto-Lei n.º 37-A/2024 aprovaram o fim definitivo das Manifestações de Interesse (Art. 88.º/89.º). Agora é OBRIGATÓRIO obter visto no Consulado Português do país de origem antes de viajar para Portugal (Vistos D1, D2, D3, D7, D8 ou Visto para Procura de Trabalho). Entrar como turista para regularizar em Portugal foi EXTINTO por lei.\n[view:LOCAL_SERVICES:Ver Balcões AIMA e Consulados]',
  'vistos': 'ATUALIZAÇÃO LEGISLATIVA PARLAMENTAR 2025/2026: A Lei n.º 61/2025 e o Decreto-Lei n.º 37-A/2024 aprovaram o fim definitivo das Manifestações de Interesse (Art. 88.º/89.º). Agora é OBRIGATÓRIO obter visto no Consulado Português do país de origem antes de viajar para Portugal (Vistos D1, D2, D3, D7, D8 ou Visto para Procura de Trabalho). Entrar como turista para regularizar em Portugal foi EXTINTO por lei.\n[view:LOCAL_SERVICES:Ver Balcões AIMA e Consulados]',
  'visto de trabalho': '👔 NOVAS DIRETRIZES SOBRE EMPRESAS & VISTO DE TRABALHO (2025/2026):\n\n1. OBRIGATORIEDADE DE VISTO PRÉVIO CONSULAR (VISTO D1):\nNenhuma empresa em Portugal pode contratar um trabalhador estrangeiro que tenha entrado como turista para regularização posterior (a Manifestação de Interesse Art. 88.º foi extinta). O visto de trabalho (D1) DEVE ser solicitado no Consulado de Portugal no país de origem.\n\n2. RESPONSABILIDADE DA EMPRESA CONTRATANTE:\n- A empresa DEVE emitir uma Promessa de Contrato de Trabalho ou Contrato de Trabalho submetido previamente ao IEFP/Consulado.\n- A empresa pode subscrever um Termo de Responsabilidade garantindo alojamento e custos de repatriamento para instrução do Visto D1 ou Visto para Procura de Trabalho.\n- Benefício do Canal "Via Verde para Empresas" para contratações céleres e parecer prioritário da AIMA/IEFP.\n\n3. FISCALIZAÇÃO & SANÇÕES (ACT E AIMA):\nEmpresas que empreguem cidadãos sem visto consular válido incorrem em contraordenações muito graves, coimas pesadas da ACT e AIMA, e interdição de contratar trabalhadores estrangeiros.\n\n4. VISTO PARA PROCURA DE TRABALHO:\nPermite a entrada legal do trabalhador por 120 dias (prorrogável por 60 dias) para procurar emprego em Portugal, convertendo-se em Autorização de Residência após assinatura do contrato.\n[view:JOBS:Ver Vagas e Contratos de Emprego]',
  'via verde': '🚀 VIA VERDE PARA EMPRESAS & ATRAÇÃO DE TALENTOS (Diretrizes 2026):\n\n1. O QUE É:\nCanal prioritário e célere criado para empresas sediadas em Portugal contratarem profissionais e trabalhadores estrangeiros com tramitação desburocratizada.\n\n2. COMO FUNCIONA:\n- A empresa contratante emite uma Promessa de Contrato de Trabalho ou Contrato de Trabalho formal e um Termo de Responsabilidade empresarial;\n- O pedido de Visto de Trabalho (D1 / D3 / Tech Visa) tem tramitação consular prioritária e parecer rápido da AIMA/IEFP;\n- O trabalhador entra em Portugal com visto legal e tem agendamento prioritário na AIMA para emissão do Título de Residência.\n\n3. TECH VISA & QUADROS QUALIFICADOS:\nEmpresas tecnológicas certificadas pelo IAPMEI têm canal 100% digital e prioritário para contratação de quadros altamente qualificados (Visto D3 / Tech Visa).\n\n4. VANTAGENS:\nElimina a necessidade de comprovações financeiras complexas individuais quando garantidas pela empresa através do Termo de Responsabilidade.\n[view:JOBS:Ver Vagas e Contratos de Emprego]',
  'via verde empresas': '🚀 VIA VERDE PARA EMPRESAS & ATRAÇÃO DE TALENTOS (Diretrizes 2026):\n\nCanal prioritário e célere para contratação de trabalhadores estrangeiros por empresas em Portugal. Permite instrução rápida de vistos de trabalho (D1/D3) no consulado com Termo de Responsabilidade empresarial e agendamento célere na AIMA.\n[view:JOBS:Ver Vagas e Contratos de Emprego]',
  'tech visa': '💻 TECH VISA & QUADROS ALTAMENTE QUALIFICADOS (Visto D3):\n\nPrograma de certificação para empresas tecnológicas e inovadoras em Portugal (IAPMEI). Concede tramitação prioritária de vistos e autorizações de residência para trabalhadores altamente qualificados com salário mínimo qualificado (1.5x a 3x salário médio).\n[view:JOBS:Ver Vagas de Emprego]',
  'modalidades de visto': '🛂 MODALIDADES DE VISTO CONSULAR EM PORTUGAL (LEGISLAÇÃO 2026):\n\nCom a extinção definitiva da Manifestação de Interesse (Art. 88/89 sem visto), a entrada em Portugal exige OBRIGATORIAMENTE visto consular prévio:\n1. Visto D1 (Trabalho Subordinado): Para quem tem contrato ou promessa de contrato de trabalho emitida por empresa em Portugal (com canal Via Verde).\n2. Visto de Procura de Trabalho: Válido por 120 dias (+60 dias) para procurar emprego em Portugal, convertível em Título de Residência.\n3. Visto D2 (Empreendedores & Startups): Para criação de empresas e investimento em Portugal.\n4. Visto D3 (Altamente Qualificados & Investigação): Para profissionais especializados e quadros técnicos (Tech Visa / Via Verde Empresas).\n5. Visto D8 (Nómadas Digitais): Para teletrabalho remoto internacional (rendimentos mínimos mensais de 4x RMMG = 3.680€/mês).\n6. Visto D7 (Rendimentos Próprios & Reformados): Para titulares de pensões, dividendos ou rendas passivas estáveis (mínimo 920€/mês).\n7. Visto CPLP: Acordo de mobilidade facilitado entre países lusófonos.\n[view:LOCAL_SERVICES:Ver Balcões AIMA e Apoio Legal]',
  'visto d1': '💼 VISTO D1 (TRABALHO SUBORDINADO):\nExige contrato de trabalho ou promessa de contrato emitida por empresa em Portugal (mínimo Salário Mínimo Nacional 920€). É solicitado no Consulado de Portugal no país de origem e beneficia do canal de Via Verde para empresas certificadas.\n[view:JOBS:Ver Vagas de Emprego]',
  'visto d2': '🏢 VISTO D2 (EMPREENDEDORES & INDEPENDENTES):\nDestinado a cidadãos estrangeiros que pretendam abrir empresa em Portugal, exercer atividade independente ou investir no país. Exige plano de negócios, constituição de sociedade ou relevância económica.\n[view:SIMULATORS:empreendedor:Abrir Simulador Empreendedor]',
  'visto d3': '🔬 VISTO D3 (ALTAMENTE QUALIFICADOS & TECH VISA):\nPara profissionais de topo, engenheiros, investigadores, médicos e quadros técnicos de empresas certificadas (Via Verde / Tech Visa). Exige contrato qualificado com remuneração acima da média nacional.\n[view:JOBS:Ver Vagas de Emprego]',
  'visto d8': '💻 VISTO D8 (NÓMADAS DIGITAIS & TELETRABALHO):\nPara trabalhadores remotos e freelancers com contratos ou clientes fora de Portugal. Exige comprovação de rendimentos médios mensais iguais ou superiores a 4x o salário mínimo nacional (mínimo 3.680€/mês) nos últimos 3 meses.\n[view:SIMULATORS:recibos:Simular Rendimentos]',
  'visto d7': '🏠 VISTO D7 (REFORMADOS & RENDIMENTOS PASSIVOS):\nPara aposentados, reformados e titulares de rendimentos passivos estáveis (imóveis arrendados, dividendos, aplicações financeiras). Exige comprovação de rendimento mínimo anual de 100% do Salário Mínimo Nacional (11.040€/ano).\n[view:SIMULATORS:habitacao:Verificar Custo de Vida]',
  'procura de trabalho': '🔍 GUIA COMPLETO: VISTO DE PROCURA DE TRABALHO (PORTUGAL 2026)\n\n1. 💶 MEIOS DE SUBSISTÊNCIA (COMPROVAÇÃO FINANCEIRA):\n- Exigência: Comprovação de pelo menos 3 vezes o Salário Mínimo Nacional (RMMG 920€ em 2026 = 2.760€; ou ~2.610€ caso o consulado utilize como base o ano de 870€).\n- Alternativa: Apresentação de Termo de Responsabilidade subscrito por cidadão português ou estrangeiro residente legal em Portugal que assegure alojamento e subsistência.\n\n2. 📄 INSCRIÇÃO PRÉVIA NO IEFP (OBRIGATÓRIO):\n- Deves registar-te previamente no portal do IEFP (iefp.pt) e submeter a "Declaração de Manifestação de Interesse para Oferta de Emprego".\n- O comprovativo emitido pelo IEFP com o teu número de registo tem de ser anexado obrigatoriamente no agendamento da VFS Global / Consulado.\n\n3. ⏱️ PRAZOS MÉDIOS RECENTES NA VFS / CONSULADOS:\n- O prazo legal de decisão é de até 30 a 60 dias úteis.\n- Na prática recente dos últimos meses: VFS Brasil (SP/RJ/BH) tem demorado em média entre 25 a 45 dias úteis após a recolha biométrica; outros postos consulares variam entre 30 a 60 dias.\n\n4. 👥 RELATOS EM TEMPO REAL:\n- Para acompanhar prazos exatos e experiências de quem teve o visto deferido no último mês no teu consulado específico, consulta os relatos na Comunidade MIRA.\n\n[view:JOBS:Ver Vagas no IEFP e MIRA] [view:COMMUNITY:Ver Relatos na Comunidade]',
  'visto de procura de trabalho': '🔍 GUIA COMPLETO: VISTO DE PROCURA DE TRABALHO (PORTUGAL 2026)\n\n1. 💶 MEIOS DE SUBSISTÊNCIA (COMPROVAÇÃO FINANCEIRA):\n- Exigência: Comprovação de pelo menos 3 vezes o Salário Mínimo Nacional (RMMG 920€ em 2026 = 2.760€; ou ~2.610€ caso o consulado utilize como base o ano de 870€).\n- Alternativa: Apresentação de Termo de Responsabilidade subscrito por cidadão português ou estrangeiro residente legal em Portugal que assegure alojamento e subsistência.\n\n2. 📄 INSCRIÇÃO PRÉVIA NO IEFP (OBRIGATÓRIO):\n- Deves registar-te previamente no portal do IEFP (iefp.pt) e submeter a "Declaração de Manifestação de Interesse para Oferta de Emprego".\n- O comprovativo emitido pelo IEFP com o teu número de registo tem de ser anexado obrigatoriamente no agendamento da VFS Global / Consulado.\n\n3. ⏱️ PRAZOS MÉDIOS RECENTES NA VFS / CONSULADOS:\n- O prazo legal de decisão é de até 30 a 60 dias úteis.\n- Na prática recente dos últimos meses: VFS Brasil (SP/RJ/BH) tem demorado em média entre 25 a 45 dias úteis após a recolha biométrica; outros postos consulares variam entre 30 a 60 dias.\n\n4. 👥 RELATOS EM TEMPO REAL:\n- Para acompanhar prazos exatos e experiências de quem teve o visto deferido no último mês no teu consulado específico, consulta os relatos na Comunidade MIRA.\n\n[view:JOBS:Ver Vagas no IEFP e MIRA] [view:COMMUNITY:Ver Relatos na Comunidade]',
  'visto procura de trabalho': '🔍 GUIA COMPLETO: VISTO DE PROCURA DE TRABALHO (PORTUGAL 2026)\n\n1. 💶 MEIOS DE SUBSISTÊNCIA (COMPROVAÇÃO FINANCEIRA):\n- Exigência: Comprovação de pelo menos 3 vezes o Salário Mínimo Nacional (RMMG 920€ em 2026 = 2.760€; ou ~2.610€ caso o consulado utilize como base o ano de 870€).\n- Alternativa: Apresentação de Termo de Responsabilidade subscrito por cidadão português ou estrangeiro residente legal em Portugal que assegure alojamento e subsistência.\n\n2. 📄 INSCRIÇÃO PRÉVIA NO IEFP (OBRIGATÓRIO):\n- Deves registar-te previamente no portal do IEFP (iefp.pt) e submeter a "Declaração de Manifestação de Interesse para Oferta de Emprego".\n- O comprovativo emitido pelo IEFP com o teu número de registo tem de ser anexado obrigatoriamente no agendamento da VFS Global / Consulado.\n\n3. ⏱️ PRAZOS MÉDIOS RECENTES NA VFS / CONSULADOS:\n- O prazo legal de decisão é de até 30 a 60 dias úteis.\n- Na prática recente dos últimos meses: VFS Brasil (SP/RJ/BH) tem demorado em média entre 25 a 45 dias úteis após a recolha biométrica; outros postos consulares variam entre 30 a 60 dias.\n\n4. 👥 RELATOS EM TEMPO REAL:\n- Para acompanhar prazos exatos e experiências de quem teve o visto deferido no último mês no teu consulado específico, consulta os relatos na Comunidade MIRA.\n\n[view:JOBS:Ver Vagas no IEFP e MIRA] [view:COMMUNITY:Ver Relatos na Comunidade]',
  'empresa': '👔 RESPONSABILIDADE DAS EMPRESAS NA CONTRATAÇÃO DE ESTRANGEIROS (DIRETRIZES 2025/2026):\n\nAs empresas em Portugal só podem contratar trabalhadores estrangeiros mediante prévia obtenção de Visto de Trabalho (D1/D3) no Consulado de origem ou Visto de Procura de Trabalho. As empresas podem aderir à "Via Verde para Empresas" para acelerar o processo. O contrato assinado em Portugal não serve para regularizar turistas (Art. 88 extinto). A empresa deve emitir a Promessa de Contrato e inscrever o trabalhador na Segurança Social sob pena de sanções severas da ACT.\n[view:JOBS:Ver Vagas de Emprego]',
  'empresas': '👔 RESPONSABILIDADE DAS EMPRESAS NA CONTRATAÇÃO DE ESTRANGEIROS (DIRETRIZES 2025/2026):\n\nAs empresas em Portugal só podem contratar trabalhadores estrangeiros mediante prévia obtenção de Visto de Trabalho (D1/D3) no Consulado de origem ou Visto de Procura de Trabalho. As empresas podem aderir à "Via Verde para Empresas" para acelerar o processo. O contrato assinado em Portugal não serve para regularizar turistas (Art. 88 extinto). A empresa deve emitir a Promessa de Contrato e inscrever o trabalhador na Segurança Social sob pena de sanções severas da ACT.\n[view:JOBS:Ver Vagas de Emprego]',
  'termo de responsabilidade': '📄 TERMO DE RESPONSABILIDADE EMPRESARIAL / ALOJAMENTO (2025/2026):\n\n1. TERMO DE RESPONSABILIDADE DA EMPRESA: A empresa contratante em Portugal pode emitir um Termo de Responsabilidade para comprovar meios de subsistência e alojamento no Consulado, facilitando a emissão do Visto D1 ou Visto de Procura de Trabalho via canal Via Verde.\n2. TERMO DE RESPONSABILIDADE DE ALOJAMENTO: Emitido por cidadão residente legal em Portugal com caderneta predial ou contrato de arrendamento válido registado nas Finanças.\n[view:DOCUMENT_ASSISTANT:Gerar Minuta de Termo de Responsabilidade]',
  'promessa de trabalho': '📜 PROMESSA DE CONTRATO DE TRABALHO PARA VISTO CONSULAR (D1):\n\nA Promessa de Contrato de Trabalho emitida por empresa sediada em Portugal é o documento essencial submetido ao Consulado Português do país de origem para instrução do Visto D1 (Trabalho Subordinado). Deve conter a identificação da empresa, função, remuneração (mínimo 920€/mês) e compromisso de contratação via canal Via Verde.\n[view:DOCUMENT_ASSISTANT:Gerar Minuta de Promessa de Contrato]',
  'morada': '🏠 NOVAS DIRETRIZES DO GOVERNO SOBRE COMPROVATIVO DE MORADA (2025/2026):\n\n1. FIM DOS ATESTADOS DE COMPLACÊNCIA/FAVOR:\nAs Juntas de Freguesia deixaram de passar atestados de residência baseados apenas em testemunhas informais. É obrigatório comprovar o título legítimo de habitação.\n\n2. DOCUMENTOS VÁLIDOS ACEITES PELA AIMA E FINANÇAS:\n- Contrato de Arrendamento/Subarrendamento registado nas Finanças com recibos eletrónicos de renda emitidos.\n- Escritura de Compra e Venda de Imóvel.\n- Declaração do Proprietário/Senhorio acompanhada da Caderneta Predial Urbana atualizada.\n- Atestado de Residência da Junta de Freguesia (emitido apenas mediante apresentação prévia de contrato ou autorização formal do senhorio com caderneta predial).\n- Faturas de serviços públicos (Água, Luz, Gás) em nome do próprio na morada declarada.\n\n3. SANÇÕES LEGAIS:\nMoradas falsas ou atestados de complacência constituem crime de falsificação de documentos, resultando no cancelamento imediato de processos de NIF, NISS e Título de Residência na AIMA.\n[view:DOCUMENT_ASSISTANT:Gerar Minutas de Alojamento e Arrendamento]',
  'comprovativo de morada': '🏠 NOVAS DIRETRIZES DO GOVERNO SOBRE COMPROVATIVO DE MORADA (2025/2026):\n\n1. FIM DOS ATESTADOS DE COMPLACÊNCIA/FAVOR:\nAs Juntas de Freguesia deixaram de passar atestados de residência baseados apenas em testemunhas informais. É obrigatório comprovar o título legítimo de habitação.\n\n2. DOCUMENTOS VÁLIDOS ACEITES PELA AIMA E FINANÇAS:\n- Contrato de Arrendamento/Subarrendamento registado nas Finanças com recibos eletrónicos de renda emitidos.\n- Escritura de Compra e Venda de Imóvel.\n- Declaração do Proprietário/Senhorio acompanhada da Caderneta Predial Urbana atualizada.\n- Atestado de Residência da Junta de Freguesia (emitido apenas mediante apresentação prévia de contrato ou autorização formal do senhorio com caderneta predial).\n- Faturas de serviços públicos (Água, Luz, Gás) em nome do próprio na morada declarada.\n\n3. SANÇÕES LEGAIS:\nMoradas falsas ou atestados de complacência constituem crime de falsificação de documentos, resultando no cancelamento imediato de processos de NIF, NISS e Título de Residência na AIMA.\n[view:DOCUMENT_ASSISTANT:Gerar Minutas de Alojamento e Arrendamento]',
  'atestado de residencia': '🏠 NOVAS DIRETRIZES DO GOVERNO SOBRE COMPROVATIVO DE MORADA (2025/2026):\n\nAs Juntas de Freguesia apenas passam Atestados de Residência mediante apresentação de Contrato de Arrendamento registado nas Finanças ou Declaração do Senhorio com Caderneta Predial Urbana. Atestados com meras testemunhas foram abolidos por lei para evitar moradas de complacência.\n[view:DOCUMENT_ASSISTANT:Gerar Minutas de Alojamento]',
  'atestado de residência': '🏠 NOVAS DIRETRIZES DO GOVERNO SOBRE COMPROVATIVO DE MORADA (2025/2026):\n\nAs Juntas de Freguesia apenas passam Atestados de Residência mediante apresentação de Contrato de Arrendamento registado nas Finanças ou Declaração do Senhorio com Caderneta Predial Urbana. Atestados com meras testemunhas foram abolidos por lei para evitar moradas de complacência.\n[view:DOCUMENT_ASSISTANT:Gerar Minutas de Alojamento]',
  'junta de freguesia': '🏠 REGULAMENTAÇÃO DE ATESTADOS NA JUNTA DE FREGUESIA:\n\nAs Juntas de Freguesia exigem agora prova documental de ocupação legal do imóvel (Contrato registado no Portal das Finanças ou Declaração com Caderneta Predial do Proprietário). Declarações falsas são punidas nos termos do Código Penal.\n[view:DOCUMENT_ASSISTANT:Gerar Minutas de Alojamento]',
  'parlamento': 'O Parlamento Português aprovou alterações estruturais à Lei de Estrangeiros: 1. Extinção das Manifestações de Interesse (Art. 88/89); 2. Exigência obrigatória de visto prévio obtido no consulado de origem; 3. Reformulação do Visto de Procura de Trabalho com pré-validação empresarial; 4. Novas regras de Reagrupamento Familiar com tempo de residência prévia e prova estrita de alojamento; 5. Descentralização judicial das ações contra a AIMA pelos tribunais administrativos de todo o país.\n[view:LOCAL_SERVICES:Ver Balcões AIMA]',
  'lei': 'As últimas alterações à Lei de Estrangeiros aprovadas no Parlamento estabelecem que NENHUM estrangeiro pode regularizar-se a partir de estatuto de turista em Portugal. É obrigatória a instrução do visto no posto consular do país de residência legal antes da viagem.\n[view:LOCAL_SERVICES:Ver Mapa de Apoio Legal]',
  'cplp': 'VISTOS E RESIDÊNCIA CPLP (Acordo de Mobilidade): A concessão da Autorização de Residência CPLP mantém-se ativa mas exige apresentação de Visto Consular emitido no país de origem ou agendamento oficial. Os cidadãos CPLP beneficiam de isenção de taxas de visto e dispensam apresentação de comprovativo de meios quando apoiados por termo de responsabilidade.\n[view:DOCUMENT_ASSISTANT:Gerar Minutas CPLP]',
  'residencia': 'Para obter residência legal: 1. Obtém o visto adequado no Consulado do teu país de origem. 2. Viaja para Portugal com visto válido. 3. Agenda na AIMA via portal aima.gov.pt para emitir o Título de Residência. Regularizar-se em território nacional como turista foi extinto pelas reformas do Parlamento.\n[view:LOCAL_SERVICES:Ver Balcões AIMA]',
  'aima': 'A AIMA (Agência para a Integração, Migrações e Asilo) gere todos os processos de imigração. Com as leis aprovadas em 2025/2026, a AIMA disponibilizou o Portal de Renovações Online para cartões permanentes e UE, e o Governo descentralizou os processos judiciais pelos tribunais do país para acelerar as pendências.\n[view:LOCAL_SERVICES:Ver Balcões AIMA]',
  'sns': 'Para aceder ao SNS (Serviço Nacional de Saúde), registas-te no Centro de Saúde da tua área com o passaporte e comprovativo de morada. Tens direito a médico de família e urgências.\n[view:LOCAL_SERVICES:Centros de Saúde SNS]',
  'emprego': 'Na secção de Emprego do MIRA temos 5.326 vagas de emprego ativas sincronizadas em tempo real com portais como IEFP, Net-Empregos, Sapo Emprego e Turismo de Portugal. Podes filtrar por categoria, localidade e candidatura direta.\n[view:JOBS:Ver 5.326 Vagas de Emprego]',
  'vagas': 'A plataforma MIRA disponibiliza 5.326 vagas de emprego ativas em Portugal em diversas áreas (Hotelaria, Restauração, Construção, TI, Saúde, Serviços e Administração).\n[view:JOBS:Ver 5.326 Vagas de Emprego]',
  'curso': 'Na secção de Formação temos 156 cursos de formação gratuitos e certificados pelo IEFP e DGES / Passaporte Qualifica.\n[view:LEARNING:Ver 156 Cursos Gratuitos]',
  'cursos': 'Na secção de Formação temos 156 cursos de formação gratuitos e certificados pelo IEFP e DGES / Passaporte Qualifica.\n[view:LEARNING:Ver 156 Cursos Gratuitos]',
  'serviço': 'No mapa de Serviços Locais encontras 238 pontos de apoio oficiais ao imigrante em Portugal (CNAIM, CLAIM, Balcões AIMA e Lojas do Cidadão).\n[view:LOCAL_SERVICES:Ver Mapa de Serviços]',
  'servicos': 'No mapa de Serviços Locais encontras 238 pontos de apoio oficiais ao imigrante em Portugal (CNAIM, CLAIM, Balcões AIMA e Lojas do Cidadão).\n[view:LOCAL_SERVICES:Ver Mapa de Serviços]',
  'comunidade': 'A Comunidade MIRA reúne 999+ membros ativos, onde podes partilhar dúvidas, participar em debates, consultar publicações verificadas e ganhar selos de conquista.\n[view:COMMUNITY:Entrar na Comunidade]',
  'selos': 'Os Selos MIRA reconhecem o contributo dos membros: Pioneiro, Conta Verificada, Curador, Mestre dos Documentos, Utilizador Exemplar, Sentinela, Especialista em Leis, Mentor de Emprego e Coração da Comunidade. Os Administradores possuem todos os selos ativos!\n[view:COMMUNITY:Ver Comunidade e Selos]',
  'medalhas': 'Os Selos e Medalhas MIRA reconhecem o contributo dos membros: Pioneiro, Conta Verificada, Curador, Mestre dos Documentos, Utilizador Exemplar, Sentinela, Especialista em Leis, Mentor de Emprego e Coração da Comunidade. Os Administradores possuem todos os selos ativos!\n[view:COMMUNITY:Ver Comunidade e Selos]',
  'irs': '📑 DECLARAÇÃO DE IRS EM PORTUGAL & TRABALHO NO ESTRANGEIRO:\n\n1. OBRIGAÇÃO DE DECLARAR:\nSe auferes rendimentos de fonte portuguesa (trabalho dependente Cat A, recibos verdes Cat B, pensões Cat H ou rendimentos prediais Cat F), tens a obrigação de declarar IRS em Portugal, mesmo que estejas a residir noutro país.\n\n2. NÃO RESIDENTES FISCAIS:\n- Se a tua residência fiscal é noutro país, deves manter a morada fiscal atualizada no Portal das Finanças (e nomear Representante Fiscal se residires fora da UE/EEE).\n- Os rendimentos auferidos em Portugal são declarados no Modelo 3 com os anexos correspondentes (Anexo A/B e Anexo J para rendimentos internacionais).\n\n3. CONVENÇÃO PARA EVITAR A DUPLA TRIBUTAÇÃO (CDT):\nPortugal possui acordos bilaterais de dupla tributação com mais de 80 países. Deves submeter o formulário RFI (Mod. 21-RFI) junto da Autoridade Tributária para comprovar a residência fiscal no outro país e beneficiar de isenção ou retenção reduzida, evitando pagar imposto duas vezes pelo mesmo valor.\n\n4. PRAZOS LEGAIS:\nA declaração de IRS (Modelo 3) submete-se anualmente entre 1 de Abril e 30 de Junho no Portal das Finanças.\n\n5. FERRAMENTAS NO MIRA:\nPodes utilizar a nossa Calculadora de IRS e o Guia Completo da Jornada de IRS para simulares a retenção e o imposto final, bem como descarregar a minuta oficial de Reclamação Graciosa IRS.\n[view:DOCUMENTS:irs:Abrir Calculadora & Guia de IRS]',
  'salário': '🧮 SIMULADOR DE SALÁRIO LÍQUIDO & CONTRATO DE TRABALHO (2026):\n\nNo MIRA podes simular o teu salário líquido exato com todas as deduções legais em Portugal:\n- 11% de Segurança Social (Trabalho Dependente - Cat. A).\n- Tabela de Retenção na Fonte de IRS 2026.\n- Isenções do IRS Jovem (anos 1 a 10 de atividade).\n- Subsídio de Refeição (dinheiro vs cartão de refeição).\n- Ajustamento Regional (Continente, Madeira -20%, Açores -30%).\n\n[view:SIMULATORS:Abrir Calculadora de Salário Líquido]',
  'salario': '🧮 SIMULADOR DE SALÁRIO LÍQUIDO & CONTRATO DE TRABALHO (2026):\n\nNo MIRA podes simular o teu salário líquido exato com todas as deduções legais em Portugal:\n- 11% de Segurança Social (Trabalho Dependente - Cat. A).\n- Tabela de Retenção na Fonte de IRS 2026.\n- Isenções do IRS Jovem (anos 1 a 10 de atividade).\n- Subsídio de Refeição (dinheiro vs cartão de refeição).\n- Ajustamento Regional (Continente, Madeira -20%, Açores -30%).\n\n[view:SIMULATORS:Abrir Calculadora de Salário Líquido]',
  'ordenado': '🧮 SIMULADOR DE SALÁRIO LÍQUIDO & CONTRATO DE TRABALHO (2026):\n\nNo MIRA podes simular o teu salário líquido exato com todas as deduções legais em Portugal:\n- 11% de Segurança Social (Trabalho Dependente - Cat. A).\n- Tabela de Retenção na Fonte de IRS 2026.\n- Isenções do IRS Jovem (anos 1 a 10 de atividade).\n- Subsídio de Refeição (dinheiro vs cartão de refeição).\n- Ajustamento Regional (Continente, Madeira -20%, Açores -30%).\n\n[view:SIMULATORS:Abrir Calculadora de Salário Líquido]',
  'líquido': '🧮 SIMULADOR DE SALÁRIO LÍQUIDO & CONTRATO DE TRABALHO (2026):\n\nCalcula o teu rendimento líquido após descontos de 11% Segurança Social, retenção na fonte de IRS 2026, IRS Jovem e subsídio de refeição.\n[view:SIMULATORS:Abrir Calculadora de Salário Líquido]',
  'liquido': '🧮 SIMULADOR DE SALÁRIO LÍQUIDO & CONTRATO DE TRABALHO (2026):\n\nCalcula o teu rendimento líquido após descontos de 11% Segurança Social, retenção na fonte de IRS 2026, IRS Jovem e subsídio de refeição.\n[view:SIMULATORS:Abrir Calculadora de Salário Líquido]',
  'recibo': '🧮 CALCULADORA DE RECIBOS VERDES & TRABALHADORES INDEPENDENTES (ENI):\n\nCalcula o teu valor líquido e contribuições de Trabalhador Independente:\n- Incidência Contributiva: 70% em prestação de serviços / 20% em venda de produtos.\n- Taxa SS: 21,4% (Trabalhadores Independentes) / 25,2% (ENI) / 0% no 1.º ano.\n- Ajustamento Trimestral: Variação de -25%, 0% ou +25% na declaração trimestral.\n- Retenção na fonte de IRS segundo a tabela oficial.\n\n[view:SIMULATORS:Abrir Calculadora de Recibos Verdes]',
  'recibos': '🧮 CALCULADORA DE RECIBOS VERDES & TRABALHADORES INDEPENDENTES (ENI):\n\nCalcula o teu valor líquido e contribuições de Trabalhador Independente:\n- Incidência Contributiva: 70% em prestação de serviços / 20% em venda de produtos.\n- Taxa SS: 21,4% (Trabalhadores Independentes) / 25,2% (ENI) / 0% no 1.º ano.\n- Ajustamento Trimestral: Variação de -25%, 0% ou +25% na declaração trimestral.\n- Retenção na fonte de IRS segundo a tabela oficial.\n\n[view:SIMULATORS:Abrir Calculadora de Recibos Verdes]',
  'custo de vida': '📊 COMPARADOR DE CUSTO DE VIDA INTER-DISTRITAL:\n\nCompara o custo de vida por distrito em Portugal com dados atualizados do INE:\n- Rendas médias de quartos, T1 e T2 por distrito.\n- Gastos médios de alimentação, transportes e utilidades (água, luz, gás).\n- Comparador de taxa de esforço e poupança estimada entre dois distritos.\n\n[view:SIMULATORS:Abrir Comparador de Custo de Vida]',
  'renda': '📊 COMPARADOR DE CUSTO DE VIDA INTER-DISTRITAL:\n\nCompara o custo de vida e rendas médias de quartos e apartamentos (T1, T2) por distrito em Portugal com estatísticas oficiais INE.\n[view:SIMULATORS:Abrir Comparador de Custo de Vida]',
  'calculadora': 'No MIRA encontras 3 Calculadoras Interativas:\n1. Calculadora de Salário Líquido (Contrato de Trabalho Cat. A)\n2. Calculadora de Recibos Verdes / Trabalhadores Independentes (ENI)\n3. Comparador Inter-Distrital de Custo de Vida & Rendas INE\n\n[view:SIMULATORS:Abrir Calculadoras MIRA]',
  'pcd': '♿ EMPREGO INCLUSIVO, DIREITOS & QUOTAS PCD EM PORTUGAL (Lei n.º 4/2019):\n1. QUOTAS DE EMPREGO: Empresas com 75+ trabalhadores são obrigadas por lei a admitir de 1% a 2% de pessoas com deficiência (grau de incapacidade ≥ 60%).\n2. ATESTADO MULTIUSO (AMIM): Atestado Médico de Incapacidade Multiuso emitido por Junta Médica de Saúde Pública no Centro de Saúde/ULS. Garante benefícios fiscais (isenção de IRS, IVA, IUC) e acesso às quotas.\n3. APOIOS DO IEFP: Subvenções para adaptação do posto de trabalho, eliminação de barreiras arquitetónicas e programas de reabilitação profissional.\n4. SEGURANÇA SOCIAL (PSI): Prestação Social para a Inclusão para apoio financeiro a cidadãos com deficiência.\n5. APOIO HUMANITÁRIO: Instituto Nacional para a Reabilitação (INR: inr.pt), centros CNAIM/CLAIM e apoio social de emergência.\n[view:JOBS:pcd:Ver Vagas Inclusivas PCD]',
  'deficiencia': '♿ EMPREGO INCLUSIVO, DIREITOS & APOIO A PESSOAS COM DEFICIÊNCIA (PCD):\nEm Portugal, imigrantes com residência legal têm pleno direito a concorrer a vagas inclusivas e ao sistema de quotas (Lei 4/2019 para incapacidade ≥ 60%). O IEFP disponibiliza apoios à adaptação do posto de trabalho e a Segurança Social concede a Prestação Social para a Inclusão (PSI).\n[view:JOBS:pcd:Ver Vagas Inclusivas PCD]',
  'deficiência': '♿ EMPREGO INCLUSIVO, DIREITOS & APOIO A PESSOAS COM DEFICIÊNCIA (PCD):\nEm Portugal, imigrantes com residência legal têm pleno direito a concorrer a vagas inclusivas e ao sistema de quotas (Lei 4/2019 para incapacidade ≥ 60%). O IEFP disponibiliza apoios à adaptação do posto de trabalho e a Segurança Social concede a Prestação Social para a Inclusão (PSI).\n[view:JOBS:pcd:Ver Vagas Inclusivas PCD]',
  'incapacidade': '♿ ATESTADO MÉDICO DE INCAPACIDADE MULTIUSO (AMIM) & DIREITOS:\nO AMIM avalia o grau de incapacidade. Grau ≥ 60% confere acesso a quotas de emprego (Lei 4/2019), benefícios fiscais de IRS/IUC, Prestação Social para a Inclusão (PSI) e prioridade no atendimento. O pedido é feito no Centro de Saúde da tua área.\n[view:JOBS:pcd:Ver Vagas Inclusivas PCD]',
  'psi': '🏛️ PRESTAÇÃO SOCIAL PARA A INCLUSÃO (PSI) — SEGURANÇA SOCIAL:\nDestinada a cidadãos com grau de incapacidade comprovado ≥ 60% (ou ≥ 80% para certas condições). O pedido é submetido na Segurança Social Direta ou presencialmente com o Atestado Multiuso (AMIM).\n[view:LOCAL_SERVICES:Ver Balcões Segurança Social]',
  'atestado multiuso': '🏥 ATESTADO MÉDICO DE INCAPACIDADE MULTIUSO (AMIM):\nDocumento oficial emitido por Junta Médica de Saúde Pública que certifica o grau global de incapacidade. Exigido para comprovar estatuto de PCD perante Finanças, Segurança Social, IEFP e empregadores.\n[view:LOCAL_SERVICES:Ver Centros de Saúde SNS]',
  'minutas': 'No MIRA podes gerar minutas e modelos oficiais de documentos em PDF para NIF, NISS, AIMA e contratos de arrendamento.\n[view:DOCUMENT_ASSISTANT:Gerar Minutas em PDF]',
  'documentos': 'Na secção de Documentos podes descarregar e gerar minutas oficiais em PDF (pedidos NIF, NISS, Agendamento AIMA, declarações de alojamento e contratos).\n[view:DOCUMENT_ASSISTANT:Gerar Minutas em PDF]',
  'metro': 'A Linha de Metro da Integração no teu Perfil guia-te pelos 6 passos essenciais: 1. Chegada, 2. NIF, 3. NISS, 4. SNS/Saúde, 5. Emprego e 6. Residência AIMA.\n[view:DASHBOARD:Ver Linha de Metro]',
  'asilo': 'Para pedir proteção internacional (asilo) em Portugal: diriges-te a qualquer posto de fronteira, esquadra da PSP ou GNR e declaras intenção de pedir asilo. O CPR (Conselho Português para os Refugiados: refugiados.pt) oferece apoio jurídico gratuito. O processo é gerido pela AIMA.\n[view:LOCAL_SERVICES:Ver Apoio Legal]',
  'reagrupamento': '👨‍👩‍👧 REAGRUPAMENTO FAMILIAR (Art. 98.º a 108.º Lei 23/2007 — Atualização 2026):\n\n1. QUEM TEM DIREITO:\nTitulares de Autorização de Residência válida em Portugal (ou com renovação/recibo oficial válido) podem solicitar reagrupamento para cônjuge/união de facto registada, filhos menores ou incapazes a cargo, filhos maiores estudantes solteiros e ascendentes em 1.º grau a cargo.\n\n2. CANAL DE SUBMISSÃO:\n- Portal Digital AIMA (aima.gov.pt) quando aberto para agendamentos online;\n- Postos Consulares de Portugal no país de origem para instrução do Visto D6 de Residência para Reagrupamento Familiar.\n\n3. MEIOS DE SUBSISTÊNCIA (Portaria 1563/2007 sobre Salário Mínimo 920€):\n- 1.º Adulto (Requerente): 100% (920€/mês)\n- 2.º Adulto / Cônjuge: 50% (460€/mês)\n- Por cada menor / dependente: 30% (276€/mês)\nComprovados por recibos de vencimento, contrato de trabalho ou extratos bancários com saldo anual correspondente.\n\n4. ALOJAMENTO CONDIGNO:\nContrato de arrendamento registado no Portal das Finanças (AT) com recibos eletrónicos de renda ou Caderneta Predial Urbana atualizada.\n\n5. CERTIDÕES & APOSTILA:\nCertidões de casamento/nascimento e registos criminais dos dependentes devem estar traduzidos e apostilados pela Convenção de Haia no país de origem.\n[view:SIMULATORS:aima_ss:Verificar Requisitos AIMA & Subsistência]',
  'reagrupamento familiar': '👨‍👩‍👧 REAGRUPAMENTO FAMILIAR (Art. 98.º a 108.º Lei 23/2007 — Atualização 2026):\n\nTitulares de Autorização de Residência válida podem reagrupar cônjuge, filhos menores ou a cargo e ascendentes. Requisitos: Meios de subsistência suficientes (920€ titular + 460€ cônjuge + 276€/filho - Portaria 1563/2007), habitação condigna comprovada com contrato AT e certidões apostiladas de Haia.\n[view:SIMULATORS:aima_ss:Verificar Requisitos AIMA & Subsistência]',
  'estudante': '🎓 RESIDÊNCIA DE ESTUDANTE DENTRO DO TERRITÓRIO (Art. 91.º Lei 23/2007):\nEstudantes matriculados no Ensino Superior em Portugal que tenham entrado legalmente no país podem requerer a Autorização de Residência para Estudantes (Art. 91.º, n.º 4) diretamente na AIMA em território nacional.\n- Requisitos: Matrícula ativa em estabelecimento reconhecido + Propinas pagas + Meios de subsistência (bolsa de estudo, poupanças bancárias ou termo de encarregado) + Alojamento + Seguro de Saúde ou inscrição no SNS.\n- DIREITO AO TRABALHO (Art. 97.º da Lei 23/2007): O estudante residente tem direito legal de trabalhar a contrato ou recibos verdes em Portugal (basta notificar a AIMA e inscrever-se na Segurança Social - NISS).\n[view:SIMULATORS:Abrir Requisitos AIMA e Guia de Estudante]',
  'estudantes': '🎓 RESIDÊNCIA DE ESTUDANTE DENTRO DO TERRITÓRIO (Art. 91.º Lei 23/2007):\nEstudantes matriculados no Ensino Superior em Portugal com entrada legal podem requerer a Autorização de Residência para Estudantes (Art. 91.º, n.º 4) diretamente na AIMA e TÊM DIREITO LEGAL AO TRABALHO a contrato ou recibos verdes (Art. 97.º).\n[view:SIMULATORS:Abrir Requisitos AIMA e Guia de Estudante]',
  'visto de estudante': '🎓 RESIDÊNCIA E VISTO DE ESTUDANTE (Art. 91.º Lei 23/2007):\nPermite estudar no Ensino Superior em Portugal. Se já estás em Portugal com entrada legal e matriculado, podes solicitar a Autorização de Residência de Estudante diretamente na AIMA. Tens direito legal a trabalhar (Art. 97.º).\n[view:SIMULATORS:Abrir Requisitos AIMA e Guia de Estudante]',
  'segurança social': 'A Segurança Social Portuguesa garante acesso a subsídio de desemplego, abono de família, baixa médica e reforma. Registas-te com NIF e contrato de trabalho. Portal: seg-social.pt.\n[view:DOCUMENT_ASSISTANT:Gerar Minuta NISS]',
  'banco': 'Para abrir conta bancária em Portugal precisas de: passaporte, NIF e comprovativo de morada. Bancos como a Caixa Geral de Depósitos, BPI e Millennium BCP aceitam imigrantes. Alguns permitem abertura online.\n[view:SIMULATORS:Guia de Abertura de Conta]',
  'contrato': 'O contrato de trabalho em Portugal pode ser a prazo (máximo 2 anos, renovável) ou sem termo (permanente). O salário mínimo em 2026 é de 920€/mês. O empregador deve inscrevê-lo na Segurança Social.\n[view:JOBS:Ver Vagas de Emprego]',
  'documento': 'Os principais documentos para imigrantes em Portugal são: Passaporte, Título de Residência (AR), NIF, NISS e Utente do SNS. Guarda sempre cópias digitalizadas em PDF.\n[view:DOCUMENT_ASSISTANT:Gerar Minutas PDF]',
  'lei da nacionalidade': '🏛️ LEI DA NACIONALIDADE EM PORTUGAL & CONTAGEM DO TEMPO DE ESPERA (Art. 15.º):\n\n1. CONTAGEM DO TEMPO DE ESPERA (AIMA / MANIFESTAÇÃO):\nA alteração ao artigo 15.º da Lei da Nacionalidade aprovada pelo Parlamento estabelece que o tempo decorrido desde a submissão inicial do pedido de autorização de residência (incluindo o período de espera da Manifestação de Interesse ou agendamento na AIMA) CONTA para os 5 anos de residência legal exigidos, desde que o título de residência venha a ser deferido.\n\n2. PRINCIPAIS VIAS DE AQUISIÇÃO NO IRN:\n- Tempo de Residência Legal: 5 anos de residência acumulada em Portugal.\n- Casamento / União de Facto: 3 anos com cidadão português.\n- Descendência: Filhos ou netos de cidadãos portugueses.\n\n3. ONDE TRATAR:\nO processo de nacionalidade corre exclusivamente no Instituto dos Registos e do Notariado (IRN) e Conservatórias (não na AIMA).\n[view:DOCUMENT_ASSISTANT:Ver Minutas de Nacionalidade]',
  'nacionalidade': '🏛️ LEI DA NACIONALIDADE EM PORTUGAL & CONTAGEM DO TEMPO DE ESPERA (Art. 15.º):\n\n1. CONTAGEM DO TEMPO DE ESPERA (AIMA / MANIFESTAÇÃO):\nO tempo decorrido desde a submissão inicial do pedido de autorização de residência (inclusive o período em que aguardavas a Manifestação de Interesse ou decisão da AIMA) CONTA para o cômputo dos 5 anos de residência legal, desde que o título venha a ser deferido.\n\n2. REQUISITOS (5 ANOS):\n- 5 anos de residência legal comprovada.\n- Prova de Língua Portuguesa (nível A2) para países não lusófonos (CPLP isenta).\n- Registo criminal limpo sem condenações ≥ 3 anos de prisão.\n\n3. ONDE SUBMETER:\nConservatórias do Registo Civil e IRN (irn.justica.gov.pt).\n[view:DOCUMENT_ASSISTANT:Ver Minutas de Nacionalidade]',
  'promessa de contrato': '📜 PROMESSA DE CONTRATO DE TRABALHO & VISTO D1 (PORTUGAL 2026):\n\n1. O QUE É:\nDocumento vinculativo emitido por empresa com sede em Portugal comprometendo-se a contratar o trabalhador estrangeiro assim que o Visto D1 for emitido.\n\n2. OBRIGAÇÕES DA EMPRESA:\n- O vencimento declarado deve ser igual ou superior ao Salário Mínimo Nacional (920€ em 2026).\n- A empresa deve estar em situação contributiva e fiscal regularizada e efetuar o registo da oferta no IEFP (ou utilizar o canal "Via Verde para Empresas").\n\n3. INSTRUÇÃO DO VISTO D1 NO CONSULADO:\nO trabalhador anexa a Promessa assinada, formulário consular/VFS, registo criminal apostilado, seguro de viagem e comprovativo do IEFP no posto consular do seu país de origem.\n[view:JOBS:Ver Vagas e Contratos] [view:DOCUMENT_ASSISTANT:Gerar Minuta de Promessa de Contrato]',
  'cidadania': 'Para obter a Cidadania Portuguesa (Nacionalidade), os caminhos mais comuns são: 1. Tempo de residência legal (5 anos, contando o tempo de espera desde a manifestação deferida); 2. Casamento/União de facto com cidadão português (3 anos); 3. Descendência (filhos ou netos de portugueses). O pedido faz-se no IRN (não na AIMA).\n[view:DOCUMENT_ASSISTANT:Ver Minutas de Nacionalidade]',
  'estatuto de igualdade': 'ESTATUTO DE DIREITOS IGUAL (TRATADO DE PORTO SEGURO PT-BR):\n1. ESTATUTO DE DIREITOS CIVIS (Tipo 1): Concede aos cidadãos brasileiros com residência legal em Portugal os mesmos direitos e deveres civis que aos portugueses (acesso a concursos públicos, criação de empresas, saúde SNS, segurança social, habitação e exercício profissional em igualdade). Requisitos: Cidadania Brasileira + Título de Residência válido.\n2. ESTATUTO DE DIREITOS POLÍTICOS (Tipo 2): Concede a capacidade eleitoral ativa e passiva (direito de votar e ser votado em eleições autárquicas e legislativas em Portugal). Requisitos: Cidadania Brasileira + 3 anos de residência legal.\n3. CARTÃO DE CIDADÃO PARA ESTRANGEIRO: Após deferimento do Estatuto de Igualdade pelo IRN, o requerente pode emitir o Cartão de Cidadão físico de Estrangeiro no IRN/Conservatórias e ativar a Chave Móvel Digital (CMD) para acesso a todos os portais da administração pública de Portugal.\n[view:DOCUMENT_ASSISTANT:Gerar Minutas de Igualdade]',
  'filho': '⚠️ LEI DA NACIONALIDADE PARA FILHOS NASCIDOS EM PORTUGAL (Nova Lei 2026):\n\n📅 NASCIDO ANTES de 19 Maio 2026 (Lei Antiga — Lei 2/2020):\n✅ Direito à nacionalidade SE um dos pais residia legalmente em Portugal há pelo menos 1 ANO à data do nascimento.\n\n📅 NASCIDO APÓS 19 Maio 2026 (Nova Lei — Lei 1/2026):\n✅ Direito à nacionalidade SE um dos pais residia legalmente em Portugal há pelo menos 5 ANOS à data do nascimento.\n\nOnde tratar: IRN — irn.justica.gov.pt\n[view:DOCUMENT_ASSISTANT:Ver Minutas de Nacionalidade]',
  'filho nasceu': '⚠️ LEI DA NACIONALIDADE PARA FILHOS NASCIDOS EM PORTUGAL (Nova Lei 2026):\n\n📅 NASCIDO ANTES de 19 Maio 2026: 1 ANO de residência dos pais.\n📅 NASCIDO APÓS 19 Maio 2026: 5 ANOS de residência dos pais.\n[view:DOCUMENT_ASSISTANT:Ver Minutas de Nacionalidade]',
  'filha': '⚠️ LEI DA NACIONALIDADE PARA FILHOS NASCIDOS EM PORTUGAL (Nova Lei 2026):\n\n📅 NASCIDA ANTES de 19 Maio 2026: 1 ANO de residência dos pais.\n📅 NASCIDA APÓS 19 Maio 2026: 5 ANOS de residência dos pais.\n[view:DOCUMENT_ASSISTANT:Ver Minutas de Nacionalidade]',
  'bebe': '⚠️ NATIONALIDADE PARA BEBÊ NASCIDO EM PORTUGAL (Lei 1/2026):\nSe nasceu ANTES de 19/05/2026: 1+ ano de residência legal dos pais.\nSe nasceu APÓS 19/05/2026: 5+ anos de residência legal dos pais.\n[view:DOCUMENT_ASSISTANT:Ver Minutas de Nacionalidade]',
  'nascimento': '⚠️ REGISTO DE NASCIMENTO E NACIONALIDADE EM PORTUGAL (Lei 1/2026):\nRegisto de nascimento no IRN dentro de 20 dias.\n[view:DOCUMENT_ASSISTANT:Ver Minutas de Nacionalidade]',
  'direitos iguais': 'ESTATUTO DE DIREITOS IGUAL (TRATADO DE PORTO SEGURO PT-BR):\nDireitos civis e políticos garantidos a cidadãos brasileiros residentes em Portugal.\n[view:DOCUMENT_ASSISTANT:Gerar Minuta de Estatuto]',
  'cartao de cidadao': 'CARTÃO DE CIDADÃO PARA ESTRANGEIROS COM ESTATUTO DE IGUALDADE:\nEmissão no IRN para portadores do Estatuto de Igualdade com Chave Móvel Digital (CMD).\n[view:DOCUMENT_ASSISTANT:Gerar Minutas de Igualdade]',
  'cartao de cidadao para estrangeiro': 'CARTÃO DE CIDADÃO PARA ESTRANGEIROS COM ESTATUTO DE IGUALDADE:\nEmissão no IRN para portadores do Estatuto de Igualdade com Chave Móvel Digital (CMD).\n[view:DOCUMENT_ASSISTANT:Gerar Minutas de Igualdade]',
  'carta': 'Carta de Condução em Portugal (Legislação 2026): Válida sem troca obrigatória para CPLP e OCDE (<60 anos). Troca simples no IMT por 30€.\n[view:SIMULATORS:Guia da Carta de Condução]',
  'condução': 'Carta de Condução em Portugal (Legislação 2026): Válida sem troca obrigatória para CPLP e OCDE (<60 anos). Troca simples no IMT por 30€.\n[view:SIMULATORS:Guia da Carta de Condução]',
  'mira': 'Sou a MIRA — Assistente Inteligente de Direitos do Migrante. Conheço 100% de todo o ecossistema da aplicação MIRA: 5.326 vagas de emprego, 156 cursos IEFP/DGES, 238 serviços locais de apoio, minutas em PDF, calculadoras de IRS e regras da AIMA e NIF/NISS.\n[view:DASHBOARD:Ver Painel Principal MIRA]',
  'olá': 'Olá! Sou a MIRA, a tua assistente para imigração e integração em Portugal. Conheço todas as funcionalidades da app: vagas de emprego, cursos, mapa de apoio, documentos PDF, IRS e fóruns. Como te posso ajudar hoje?\n[view:DASHBOARD:Explorar Módulos do MIRA]',
  'ola': 'Olá! Sou a MIRA, a tua assistente para imigração e integração em Portugal. Conheço todas as funcionalidades da app: vagas de emprego, cursos, mapa de apoio, documentos PDF, IRS e fóruns. Como te posso ajudar hoje?\n[view:DASHBOARD:Explorar Módulos do MIRA]',
  'oi': 'Oi! Sou a MIRA, a tua assistente para imigração em Portugal. Conheço 100% da aplicação MIRA (empregos, cursos, apoio local, minutas e regras AIMA). Em que posso ser útil?\n[view:DASHBOARD:Explorar Módulos do MIRA]',
  'bom dia': 'Bom dia! Sou a MIRA, assistente de apoio ao imigrante em Portugal. Posso ajudar-te com qualquer funcionalidade da app ou dúvida de imigração. Em que te posso ajudar hoje?\n[view:DASHBOARD:Explorar Módulos do MIRA]',
  'boa tarde': 'Boa tarde! Sou a MIRA, assistente de apoio ao imigrante em Portugal. Posso ajudar-te com qualquer funcionalidade da app ou dúvida de imigração. Como te posso ajudar?\n[view:DASHBOARD:Explorar Módulos do MIRA]',
  'boa noite': 'Boa noite! Sou a MIRA, assistente de apoio ao imigrante em Portugal. Posso ajudar-te com qualquer funcionalidade da app ou dúvida de imigração. Como te posso ajudar?\n[view:DASHBOARD:Explorar Módulos do MIRA]',
  'importante': 'Para quem chega a Portugal, a jornada essencial de integração segue esta ordem de importância:\n1. NIF\n2. Alojamento\n3. NISS\n4. Conta Bancária\n5. Transporte\n6. Utente SNS\n7. Regularização AIMA.\n[view:DASHBOARD:Ver Linha de Metro da Integração]',
  'portugal': 'Para te integrares com sucesso em Portugal, é fundamental obteres os documentos essenciais de cidadão: NIF, Alojamento/Morada, NISS, Conta Bancária, Utente SNS e a Regularização na AIMA.\n[view:DASHBOARD:Ver Linha de Metro]',
  'simulador': '🧮 6 SIMULADORES ECONÓMICOS MIRA (2026):\n1. Salário Líquido (Conta de Outrem - IRS 2026, SS 11%, IRS Jovem)\n2. Recibos Verdes (Trabalhador Independente - SS 21,4%, Incidência 70%/20%, Isenção 15k€)\n3. Custo de Vida (Comparador dos 20 Distritos de Portugal)\n4. Proteção à Habitação (Taxa de Esforço 35% e Capital de Entrada)\n5. Requisitos AIMA & Risco SS (Limiar 920€ RMMG + 276€/dep & Alerta Risco SS 20€/mês)\n6. Pequeno Empreendedor (IRC PME 12.5%, TSU MOE 33,05%, Margem e Break-Even)\n\n[view:SIMULATORS:Abrir Simuladores MIRA]',
  'simuladores': '🧮 6 SIMULADORES ECONÓMICOS MIRA (2026):\n1. Salário Líquido (Conta de Outrem - IRS 2026, SS 11%, IRS Jovem)\n2. Recibos Verdes (Trabalhador Independente - SS 21,4%, Incidência 70%/20%, Isenção 15k€)\n3. Custo de Vida (Comparador dos 20 Distritos de Portugal)\n4. Proteção à Habitação (Taxa de Esforço 35% e Capital de Entrada)\n5. Requisitos AIMA & Risco SS (Limiar 920€ RMMG + 276€/dep & Alerta Risco SS 20€/mês)\n6. Pequeno Empreendedor (IRC PME 12.5%, TSU MOE 33,05%, Margem e Break-Even)\n\n[view:SIMULATORS:Abrir Simuladores MIRA]',
  'pequeno empreendedor': '🏢 SIMULADOR PEQUENO EMPREENDEDOR & MICROEMPRESA:\nSimula a faturação, despesas operacionais, tributação reduzida PME em IRC (12,5% até 50.000€ lucro tributável - Art. 87.º CIRC), TSU do Sócio-Gerente (33,05% MOE) ou ENI (IRS Simplificado), margem de lucro e Ponto de Equilíbrio (Break-Even).\n\n[view:SIMULATORS:Abrir Simulador Pequeno Empreendedor]',
  'empreendedor': '🏢 SIMULADOR PEQUENO EMPREENDEDOR & MICROEMPRESA:\nSimula a faturação, despesas operacionais, tributação reduzida PME em IRC (12,5% até 50.000€ lucro tributável - Art. 87.º CIRC), TSU do Sócio-Gerente (33,05% MOE) ou ENI (IRS Simplificado), margem de lucro e Ponto de Equilíbrio (Break-Even).\n\n[view:SIMULATORS:Abrir Simulador Pequeno Empreendedor]',
  'habitação': '🏠 SIMULADOR DE PROTEÇÃO À HABITAÇÃO:\nCalcula a tua Taxa de Esforço com a renda (recomendação Banco de Portugal de máx. 35%), o Capital Inicial de Entrada necessário (2 cauções + 1 renda adiantada - Art. 1076.º C. Civil) e o Fundo de Emergência familiar (3 meses).\n\n[view:SIMULATORS:Abrir Simulador de Habitação]',
  'habitacao': '🏠 SIMULADOR DE PROTEÇÃO À HABITAÇÃO:\nCalcula a tua Taxa de Esforço com a renda (recomendação Banco de Portugal de máx. 35%), o Capital Inicial de Entrada necessário (2 cauções + 1 renda adiantada - Art. 1076.º C. Civil) e o Fundo de Emergência familiar (3 meses).\n\n[view:SIMULATORS:Abrir Simulador de Habitação]',
  'default': 'Sou a MIRA, assistente de apoio ao imigrante em Portugal. Tenho conhecimento total de todas as funcionalidades do aplicativo MIRA: 6 Simuladores Económicos (Salário, Recibos Verdes, Custo de Vida, Habitação, AIMA/SS, Empreendedor), 5.326 vagas de emprego, 156 cursos de formação, 238 serviços locais de apoio, gerador de minutas PDF, calculadoras de IRS e todas as regras da AIMA, NIF e NISS. Qual é a tua dúvida específica?\n[view:DASHBOARD:Ver Módulos do MIRA]'
};

export const MIRA_LOCAL_KB_EN: Record<string, string> = {
  'niss': 'The NISS (Social Security Identification Number) is obtained through the Social Security Direct portal or in person. You need an employment contract or declaration of activity. It is required for contributions and benefits.',
  'visto': 'The rules changed in 2024-2026: The Expression of Interest (Art. 88/89) was ABOLISHED. Now it is mandatory to obtain a Residence Visa (D1, D2, D7, D8, CPLP) or a Job Search Visa at the Portuguese Consulate in your country of origin before traveling.',
  'visa': 'The rules changed in 2024-2026: The Expression of Interest (Art. 88/89) was ABOLISHED. Now it is mandatory to obtain a Residence Visa (D1, D2, D7, D8, CPLP) or a Job Search Visa at the Portuguese Consulate in your country of origin before traveling.',
  'residencia': 'To obtain legal residence: 1. Obtain a visa at the consulate of your home country. 2. Travel to Portugal. 3. Book an appointment at AIMA to convert your visa into a Residence Permit. Regularizing as a tourist is no longer permitted by law.',
  'residency': 'To obtain legal residence: 1. Obtain a visa at the consulate of your home country. 2. Travel to Portugal. 3. Book an appointment at AIMA to convert your visa into a Residence Permit. Regularizing as a tourist is no longer permitted by law.',
  'aima': 'AIMA (Agency for Integration, Migration and Asylum) manages all immigration processes. After the 2026 reforms, the focus is on legal entry with a prior visa. The official portal aima.gov.pt is where you should follow your process.',
  'sns': 'To access the SNS (National Health Service), register at the Health Center in your area with your passport and proof of address. You are entitled to a family doctor and emergency care.',
  'health': 'To access the SNS (National Health Service), register at the Health Center in your area with your passport and proof of address. You are entitled to a family doctor and emergency care.',
  'job': 'To look for a job in Portugal: register on IEFP (iefp.pt), use net-empregos.pt, infojobs.pt, or LinkedIn. With a contract, the employer registers you with Social Security.',
  'work': 'To look for a job in Portugal: register on IEFP (iefp.pt), use net-empregos.pt, infojobs.pt, or LinkedIn. With a contract, the employer registers you with Social Security.',
  'employment': 'To look for a job in Portugal: register on IEFP (iefp.pt), use net-empregos.pt, infojobs.pt, or LinkedIn. With a contract, the employer registers you with Social Security.',
  'asilo': 'To request international protection (asylum) in Portugal: go to any border post, PSP, or GNR station and declare your intention. CPR (Portuguese Council for Refugees: refugiados.pt) offers free legal support. The process is managed by AIMA.',
  'asylum': 'To request international protection (asylum) in Portugal: go to any border post, PSP, or GNR station and declare your intention. CPR (Portuguese Council for Refugees: refugiados.pt) offers free legal support. The process is managed by AIMA.',
  'reagrupamento': 'Family Reunification allows legal residents to bring their spouse, minor children, and parents. You need: a valid residence permit, sufficient means of subsistence, adequate accommodation, and proof of family ties. The request is made at AIMA.',
  'reunification': 'Family Reunification allows legal residents to bring their spouse, minor children, and parents. You need: a valid residence permit, sufficient means of subsistence, adequate accommodation, and proof of family ties. The request is made at AIMA.',
  'social security': 'Portuguese Social Security guarantees access to unemployment benefit, family allowance, sick leave, and pension. You register with NIF and employment contract. Portal: seg-social.pt.',
  'segurança social': 'Portuguese Social Security guarantees access to unemployment benefit, family allowance, sick leave, and pension. You register with NIF and employment contract. Portal: seg-social.pt.',
  'bank': 'To open a bank account in Portugal you need: passport, NIF, and proof of address. Banks like Caixa Geral de Depósitos, BPI, and Millennium BCP accept immigrants. Some allow online opening.',
  'banco': 'To open a bank account in Portugal you need: passport, NIF, and proof of address. Banks like Caixa Geral de Depósitos, BPI, and Millennium BCP accept immigrants. Some allow online opening.',
  'contract': 'The employment contract in Portugal can be temporary (maximum 2 years, renewable) or permanent. The minimum wage in 2026 is €920/month. The employer must register you with Social Security.',
  'contrato': 'The employment contract in Portugal can be temporary (maximum 2 years, renewable) or permanent. The minimum wage in 2026 is €920/month. The employer must register you with Social Security.',
  'document': 'The main documents for immigrants in Portugal are: Passport, Residence Permit (AR), NIF, NISS, and SNS Health User Number. Always keep scanned copies in PDF.',
  'documento': 'The main documents for immigrants in Portugal are: Passport, Residence Permit (AR), NIF, NISS, and SNS Health User Number. Always keep scanned copies in PDF.',
  'renew': 'The renewal of the residence permit must be requested at AIMA between 90 and 30 days before expiration. You can do it through the aima.gov.pt portal. You are entitled to immediate proof that maintains legal validity while waiting.',
  'renovar': 'The renewal of the residence permit must be requested at AIMA between 90 and 30 days before expiration. You can do it through the aima.gov.pt portal. You are entitled to immediate proof that maintains legal validity while waiting.',
  'citizenship': 'To obtain Portuguese Citizenship (Nationality), the most common paths (updated under the New Law of May 2026) are: 1. Legal residence time (7 years for CPLP/Brazilian citizens, 10 years for other nationalities. Waiting time does not count, only after card issuance); 2. Marriage/De facto union with a Portuguese citizen (3 years); 3. Ancestry (children or grandchildren of Portuguese). The request is made at the Civil Registry (IRN), not AIMA.',
  'cidadania': 'To obtain Portuguese Citizenship (Nationality), the most common paths (updated according to the New Law of May 2026) are: 1. Legal residence time (7 years for CPLP/Brazilian citizens, 10 years for other nationalities. Waiting time does not count, only after card issuance); 2. Marriage/De facto union with a Portuguese citizen (3 years); 3. Descent (children or grandchildren of Portuguese). The request is made at the Central Registry (IRN) and not at AIMA.',
  'mira': 'I am MIRA — Migrant\'s Intelligent Rights Assistant. I was created to support immigrants in Portugal with practical, free information on documentation, employment, health, and integration. We do not replace professional legal advice.',
  'hello': 'Hello! I am MIRA, your assistant for immigration and integration in Portugal. How can I help you today?',
  'hi': 'Hi! I am MIRA, your assistant for immigration and integration in Portugal. How can I help you today?',
  'default': 'I am MIRA, your assistant for immigration and integration in Portugal. I can help with NIF, NISS, AIMA, visas, SNS, jobs, asylum, and more. What is your specific question?'
};

export const MIRA_LOCAL_KB_ES: Record<string, string> = {
  'nif': 'El NIF (Número de Identificación Fiscal) es tu número de contribuyente en Portugal. Se solicita en Hacienda (Portal das Finanças o presencialmente) de forma gratuita presentando tu pasaporte. Es obligatorio para trabajar, abrir cuentas bancarias y firmar contratos.',
  'niss': 'El NISS (Número de Identificación de la Seguridad Social) se obtiene en el portal de la Segurança Social Direta o de forma presencial. Necesitas un contrato de trabajo o declaración de actividad. Es necesario para cotizar y acceder a subsidios.',
  'visado de búsqueda de trabajo': '🔍 GUÍA: VISADO DE BÚSQUEDA DE TRABAJO EN PORTUGAL (2026)\n\n1. 💶 MEDIOS ECONÓMICOS: Justificación de al menos 3 Salarios Mínimos Nacionales (RMMG 920€ en 2026 = 2.760€; o ~2.610€ con base anterior) o Acta/Término de Responsabilidad de residente en Portugal.\n2. 📄 REGISTRO EN EL IEFP: Es obligatorio registrarse previamente en el portal iefp.pt y obtener la declaración de manifestación de interés antes de solicitar la cita consular/VFS.\n3. ⏱️ PLAZOS VFS / CONSULADOS: El plazo legal es de 30 a 60 días hábiles (en la práctica suele tardar entre 25 a 45 días hábiles en Brasil/Latinoamérica).\n4. 👥 COMUNIDAD MIRA: Para consultar plazos y experiencias recientes del último mes, consulta los testimonios en la Comunidad MIRA.\n[view:JOBS:Ver Ofertas de Empleo] [view:COMMUNITY:Ver Comunidad]',
  'visado busqueda de trabalho': '🔍 GUÍA: VISADO DE BÚSQUEDA DE TRABAJO EN PORTUGAL (2026)\n\n1. 💶 MEDIOS ECONÓMICOS: Justificación de al menos 3 Salarios Mínimos Nacionales (RMMG 920€ en 2026 = 2.760€; o ~2.610€ con base anterior) o Acta/Término de Responsabilidad de residente en Portugal.\n2. 📄 REGISTRO EN EL IEFP: Es obligatorio registrarse previamente en el portal iefp.pt y obtener la declaración de manifestación de interés antes de solicitar la cita consular/VFS.\n3. ⏱️ PLAZOS VFS / CONSULADOS: El plazo legal es de 30 a 60 días hábiles (en la práctica suele tardar entre 25 a 45 días hábiles en Brasil/Latinoamérica).\n4. 👥 COMUNIDAD MIRA: Para consultar plazos y experiencias recentes del último mes, consulta los testimonios en la Comunidad MIRA.\n[view:JOBS:Ver Ofertas de Empleo] [view:COMMUNITY:Ver Comunidad]',
  'visto de procura de trabalho': '🔍 GUÍA: VISADO DE BÚSQUEDA DE TRABAJO EN PORTUGAL (2026)\n\n1. 💶 MEDIOS ECONÓMICOS: Justificación de al menos 3 Salarios Mínimos Nacionales (RMMG 920€ en 2026 = 2.760€; o ~2.610€ con base anterior) o Acta/Término de Responsabilidad de residente en Portugal.\n2. 📄 REGISTRO EN EL IEFP: Es obligatorio registrarse previamente en el portal iefp.pt y obtener la declaración de manifestación de interés antes de solicitar la cita consular/VFS.\n3. ⏱️ PLAZOS VFS / CONSULADOS: El plazo legal es de 30 a 60 días hábiles (en la práctica suele tardar entre 25 a 45 días hábiles en Brasil/Latinoamérica).\n4. 👥 COMUNIDAD MIRA: Para consultar plazos e experiências recentes del último mes, consulta los testimonios en la Comunidad MIRA.\n[view:JOBS:Ver Ofertas de Empleo] [view:COMMUNITY:Ver Comunidad]',
  'visto procura de trabalho': '🔍 GUÍA: VISADO DE BÚSQUEDA DE TRABAJO EN PORTUGAL (2026)\n\n1. 💶 MEDIOS ECONÓMICOS: Justificación de al menos 3 Salarios Mínimos Nacionales (RMMG 920€ en 2026 = 2.760€; o ~2.610€ con base anterior) o Acta/Término de Responsabilidad de residente en Portugal.\n2. 📄 REGISTRO EN EL IEFP: Es obligatorio registrarse previamente en el portal iefp.pt y obtener la declaración de manifestación de interest antes de solicitar la cita consular/VFS.\n3. ⏱️ PLAZOS VFS / CONSULADOS: El prazo legal es de 30 a 60 días hábiles (en la práctica suele tardar entre 25 a 45 días hábiles en Brasil/Latinoamérica).\n4. 👥 COMUNIDAD MIRA: Para consultar plazos y experiencias recentes del último mes, consulta los testimonios en la Comunidad MIRA.\n[view:JOBS:Ver Ofertas de Empleo] [view:COMMUNITY:Ver Comunidad]',
  'procura de trabalho': '🔍 GUÍA: VISADO DE BÚSQUEDA DE TRABAJO EN PORTUGAL (2026)\n\n1. 💶 MEDIOS ECONÓMICOS: Justificación de al menos 3 Salarios Mínimos Nacionales (RMMG 920€ en 2026 = 2.760€; o ~2.610€ con base anterior) o Acta/Término de Responsabilidad de residente en Portugal.\n2. 📄 REGISTRO EN EL IEFP: Es obligatorio registrarse previamente en el portal iefp.pt y obtener la declaración de manifestación de interés antes de solicitar la cita consular/VFS.\n3. ⏱️ PLAZOS VFS / CONSULADOS: El prazo legal es de 30 a 60 días hábiles (en la práctica suele tardar entre 25 a 45 días hábiles en Brasil/Latinoamérica).\n4. 👥 COMUNIDAD MIRA: Para consultar plazos y experiencias recientes del último mes, consulta los testimonios en la Comunidad MIRA.\n[view:JOBS:Ver Ofertas de Empleo] [view:COMMUNITY:Ver Comunidad]',
  'visto': 'Las reglas cambiaron en 2024-2026: La Manifestación de Interés (Art. 88/89) fue EXTINTA. Ahora es obligatorio obtener un Visado de Residencia (D1, D2, D7, D8, CPLP) o un Visado de Búsqueda de Trabajo en el Consulado de Portugal en tu país de origen antes de viajar.',
  'visado': 'Las reglas cambiaron en 2024-2026: La Manifestación de Interés (Art. 88/89) fue EXTINTA. Ahora es obligatorio obtener un Visado de Residencia (D1, D2, D7, D8, CPLP) o un Visado de Búsqueda de Trabajo en el Consulado de Portugal en tu país de origen antes de viajar.',
  'residencia': 'Para obtener residencia legal: 1. Obtén el visado en el consulado de tu país de origen. 2. Viaja a Portugal. 3. Solicita una cita en AIMA para convertir tu visado en un Permiso de Residencia. Regularizarse entrando como turista ya no está permitido por ley.',
  'aima': 'AIMA (Agencia para la Integración, Migraciones y Asilo) gestiona todos los trámites de extranjería. Tras las reformas de 2026, el enfoque está en la entrada legal con visado previo. El portal oficial aima.gov.pt es donde debes realizar el seguimiento de tu trámite.',
  'sns': 'Para acceder al SNS (Servicio Nacional de Salud), debes registrarte en el Centro de Salud de tu zona con tu pasaporte y comprobante de domicilio. Tienes derecho a médico de cabecera y urgencias.',
  'salud': 'Para acceder al SNS (Servicio Nacional de Salud), debes registrarte en el Centro de Salud de tu zona con tu pasaporte y comprobante de domicilio. Tienes derecho a médico de cabecera y urgencias.',
  'empleo': 'Para buscar trabajo en Portugal: regístrate en el IEFP (iefp.pt), utiliza net-empregos.pt, infojobs.pt o LinkedIn. Con contrato de trabajo, el empleador te inscribe en la Seguridad Social.',
  'trabajo': 'Para buscar trabalho en Portugal: regístrate en el IEFP (iefp.pt), utiliza net-empregos.pt, infojobs.pt o LinkedIn. Con contrato de trabalho, el empleador te inscribe en la Seguridad Social.',
  'asilo': 'Para solicitar protección internacional (asilo) en Portugal: acude a cualquier puesto fronterizo, comisaría de la PSP o puesto de la GNR y declara tu intención. El CPR (Consejo Portugués para los Refugiados: refugiados.pt) ofrece apoyo jurídico gratuito. El trámite lo gestiona AIMA.',
  'reagrupamento': 'El Reagrupamiento Familiar permite que los residentes legales traigan a su cónyuge, hijos menores y padres. Necesitas: permiso de residencia válido, medios de subsistencia suficientes, alojamiento adecuado y pruebas de vínculo familiar. La solicitud se presenta en AIMA.',
  'reagrupación': 'El Reagrupamiento Familiar permite que los residentes legales traigan a su cónyuge, hijos menores y padres. Necesitas: permiso de residencia válido, medios de subsistencia suficientes, alojamiento adequado e pruebas de vínculo familiar. La solicitud se presenta en AIMA.',
  'seguridad social': 'La Seguridad Social portuguesa garantiza acceso a subsidio por desempleo, asignación familiar, baja médica y jubilación. Te registras con NIF e contrato de trabajo. Portal: seg-social.pt.',
  'banco': 'Para abrir una cuenta bancaria en Portugal necesitas: pasaporte, NIF y comprobante de domicilio. Bancos como Caixa Geral de Depósitos, BPI y Millennium BCP acceptan inmigrantes. Algunos permiten la apertura en línea.',
  'contrato': 'El contrato de trabajo en Portugal puede ser temporal (máximo 2 años, renovable) o indefinido. El salario mínimo en 2026 es de 920€/mes. El empleador debe registrarte en la Seguridad Social.',
  'documento': 'Los principales documentos para inmigrantes en Portugal son: Pasaporte, Permiso de Residencia (AR), NIF, NISS y Número de Utente del SNS. Guarda siempre copias escaneadas en PDF.',
  'renovar': 'La renovación del permiso de residencia debe solicitarse en AIMA entre 90 y 30 días antes de su vencimiento. Puedes hacerlo a través del portal aima.gov.pt. Tienes derecho a un comprobante inmediato que mantiene la validez legal mientras esperas.',
  'ciudadanía': 'Para obtener la Ciudadanía Portuguesa (Nacionalidad), las vías más comunes (según la Nueva Ley de Mayo de 2026) son: 1. Tiempo de residencia legal (7 años para ciudadanos de la CPLP/brasileños, 10 años para otras nacionalidades. El tiempo de espera no cuenta, solo después de la emisión de la tarjeta); 2. Matrimonio/Unión de hecho con ciudadano portugués (3 años); 3. Descendencia (hijos o nietos de portugueses). La solicitud se realiza en el Registro Civil (IRN), no en AIMA.',
  'mira': 'Soy MIRA — Asistente Inteligente de Derechos del Migrante. Fui creada para apoyar a los inmigrantes en Portugal con información práctica y gratuita sobre documentación, empleo, salud e integración. No reemplazamos el asesoramiento jurídico profesional.',
  'hola': '¡Hola! Soy MIRA, tu asistente para cuestiones de inmigración e integración en Portugal. ¿Cómo te posso ayudar hoy?',
  'default': 'Soy MIRA, tu asistente para inmigración e integración en Portugal. Puedo ayudarte con NIF, NISS, AIMA, visados, SNS, empleo, asilo y más. ¿Cuál es tu duda específica?'
};

const MIRA_LOCAL_KB_FR: Record<string, string> = {
  'nif': 'Le NIF (Numéro d\'Identification Fiscale) est votre numéro de contribuable au Portugal. Vous pouvez le demander gratuitement aux Finances (Portal das Finanças ou en personne) sur présentation de votre passeport. Il est obligatoire pour travailler, ouvrir un compte bancaire et signer des contrats.',
  'niss': 'Le NISS (Numéro d\'Identification de la Sécurité Sociale) s\'obtient via le portail Segurança Social Direta ou en personne. Vous devez présenter un contrat de travail ou une déclaration d\'activité. Il est nécessaire pour cotiser et bénéficier des aides.',
  'visto': 'Les règles ont changé en 2024-2026 : la Manifestation d\'Intérêt (Art. 88/89) a été ABOLIE. Il est désormais obligatoire d\'obtenir un Visa de Résidence (D1, D2, D7, D8, CPLP) ou un Visa de Recherche d\'Emploi au consulat du Portugal dans votre pays d\'origine avant de voyager.',
  'residencia': 'Pour obtenir la résidence légale : 1. Obtenez un visa au consulat de votre pays d\'origine. 2. Voyagez au Portugal. 3. Prenez rendez-vous à l\'AIMA pour convertir votre visa en Titre de Séjour. Se régulariser en entrant comme simple touriste n\'est plus permis par la loi.',
  'residence': 'Pour obtenir la résidence légale : 1. Obtenez un visa au consulat de votre pays d\'origine. 2. Voyagez au Portugal. 3. Prenez rendez-vous à l\'AIMA pour convertir votre visa en Titre de Séjour. Se régulariser en entrant comme simple touriste n\'est plus permis par la loi.',
  'aima': 'L\'AIMA (Agence pour l\'Intégration, les Migrations et l\'Asile) gère toutes les procédures d\'immigration. Après les réformes de 2026, l\'accent est mis sur l\'entrée légale avec visa préalable. Vous devez suivre votre dossier sur le portail officiel aima.gov.pt.',
  'emploi': 'Pour chercher un emploi au Portugal : inscrivez-vous à l\'IEFP (iefp.pt), utilisez net-empregos.pt, infojobs.pt ou LinkedIn. Avec un contrat, l\'employeur vous inscrit à la Sécurité Sociale.',
  'asilo': 'Pour demander l\'asile au Portugal : présentez-vous à n\'importe quel poste frontière ou commissariat (PSP/GNR) et déclarez votre intention. Le CPR (Conseil Portugais pour les Réfugiés : refugiados.pt) offre une aide juridique gratuite. L\'AIMA gère le dossier.',
  'asile': 'Pour demander l\'asile au Portugal : présentez-vous à n\'importe quel poste frontière ou commissariat (PSP/GNR) et déclarez votre intention. Le CPR (Conseil Portugais pour les Réfugiés : refugiados.pt) offre une aide juridique gratuite. L\'AIMA gère le dossier.',
  'reagrupamento': 'Le Regroupement Familial permet aux résidents légaux de faire venir leur conjoint, enfants mineurs et parents. Requis : titre de séjour valide, ressources suffisantes, logement adéquat et preuves des liens familiaux. La demande se fait à l\'AIMA.',
  'regroupement': 'Le Regroupement Familial permet aux résidents légaux de faire venir leur conjoint, enfants mineurs et parents. Requis : titre de séjour valide, ressources suffisantes, logement adéquat et preuves des liens familiaux. La demande se fait à l\'AIMA.',
  'securite sociale': 'La Sécurité Sociale portugaise garantit l\'accès aux allocations chômage, familiales, maladie et retraite. Inscription avec NIF et contrat de travail. Portail : seg-social.pt.',
  'sécurité sociale': 'La Sécurité Sociale portugaise garantit l\'accès aux allocations chômage, familiales, maladie et retraite. Inscription avec NIF et contrat de travail. Portail : seg-social.pt.',
  'banco': 'Pour ouvrir un compte bancaire au Portugal, vous devez fournir : passeport, NIF et justificatif de domicile. Des banques comme Caixa Geral de Depósitos, BPI et Millennium BCP acceptent les immigrés. Certaines permettent l\'ouverture en ligne.',
  'banque': 'Pour ouvrir un compte bancaire au Portugal, vous devez fournir : passeport, NIF et justificatif de domicile. Des banques comme Caixa Geral de Depósitos, BPI et Millennium BCP acceptent les immigrés. Certaines permettent l\'ouverture en ligne.',
  'contract': 'Le contrat de travail au Portugal peut être à durée déterminée (maximum 2 ans, renouvelable) ou indéterminée. Le salaire minimum en 2026 est de 920€/mois. L\'employeur doit vous inscrire à la Sécurité Sociale.',
  'contrat': 'Le contrat de travail au Portugal peut être à durée déterminée (maximum 2 ans, renouvelable) ou indéterminée. Le salaire minimum en 2026 est de 920€/mois. L\'employeur doit vous inscrire à la Sécurité Sociale.',
  'document': 'Les principaux documents pour les immigrés au Portugal sont : Passeport, Titre de Séjour (AR), NIF, NISS et Numéro d\'Utente du SNS. Conservez toujours des copies PDF numérisées.',
  'renew': 'Le renouvellement du titre de séjour doit être demandé à l\'AIMA entre 90 et 30 days avant son expiration sur aima.gov.pt. Vous recevez un justificatif immédiat qui maintient la validité légale pendant l\'attente.',
  'renouveler': 'Le renouvellement du titre de séjour doit être demandé à l\'AIMA entre 90 et 30 jours avant son expiration sur aima.gov.pt. Vous recevez un justificatif immédiat qui maintient la validité légale pendant l\'attente.',
  'citoyenneté': 'Pour obtenir la citoyenneté portugaise (nationalité), les voies les plus courantes (selon la nouvelle loi de mai 2026) sont : 1. Durée de résidence légale (7 ans pour les citoyens de la CPLP/Brésiliens, 10 ans pour les autres) ; 2. Mariage/Union de fait avec un citoyen portugais (3 ans) ; 3. Filiation (enfants ou petits-enfants de Portugais). La demande se fait à l\'état civil (IRN), pas à l\'AIMA.',
  'mira': 'Je suis MIRA — Assistant Intelligent pour les Droits des Migrants. J\'ai été créée pour aider les immigrés au Portugal avec des informations gratuites sur les documents, l\'emploi, la santé et l\'intégration. Nous ne remplaçons pas un conseil juridique professionnel.',
  'bonjour': 'Bonjour ! Je suis MIRA, votre assistante pour les questions d\'immigration et d\'intégration au Portugal. Comment puis-je vous aider aujourd\'hui ?',
  'salut': 'Salut ! Je suis MIRA, votre assistante pour les questions d\'immigration et d\'intégration au Portugal. Comment puis-je vous aider aujourd\'hui ?',
  'default': 'Je suis MIRA, votre assistante pour l\'immigration et l\'intégration au Portugal. Je peux vous aider pour le NIF, le NISS, l\'AIMA, les visas, le SNS, l\'emploi, l\'asile et plus. Quelle est votre question ?'
};

/**
 * PIPE-3 FIX (Fase E): consulta Supabase ai_knowledge como fonte primária.
 * Fallback para MIRA_LOCAL_KB se Supabase falhar ou sem resultado.
 * Recuperação SELECTIVA: máx. 3 nós relevantes, ≤ 500 chars.
 */
export const getVerifiedKbKnowledge = async (prompt: string, language: string = 'PT'): Promise<string | null> => {
  const p = prompt.toLowerCase();
  const lang = (language || 'PT').toUpperCase();

  // Extrair keywords principais do prompt (1-3 termos)
  const stopWords = new Set(['como', 'para', 'que', 'qual', 'quais', 'onde', 'quando', 'what', 'how', 'where', 'when', 'the', 'a', 'e', 'o', 'de', 'em']);
  const keywords = p
    .replace(/[^a-zà-ú\s]/gi, '')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w))
    .slice(0, 3);

  // --- FONTE PRIMÁRIA: Supabase ai_knowledge (SABER IA dinâmico) ---
  if (keywords.length > 0 && SUPABASE_URL) {
    try {
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('kb_timeout')), 2000)
      );

      const queryPromise = (async () => {
        const orFilters = keywords
          .map(kw => `topic.ilike.%${kw}%,information.ilike.%${kw}%`)
          .join(',');

        const { data, error } = await supabase
          .from('ai_knowledge')
          .select('topic, information, updated_at')
          .or(orFilters)
          .limit(3);

        if (error || !data || data.length === 0) return null;

        // Actualizar versão da KB para invalidação de cache
        const latestTs = data
          .map(r => r.updated_at || '')
          .sort()
          .reverse()[0] || String(Date.now());
        if (latestTs > _currentKbVersion) _currentKbVersion = latestTs;

        // Concatenar resultados (máx ≈ 500 chars)
        const combined = data
          .map(r => `[${r.topic}] ${r.information}`)
          .join('\n---\n')
          .substring(0, 500);

        return combined;
      })();

      const result = await Promise.race([queryPromise, timeoutPromise]);
      if (result) return result;

    } catch (e) {
      // Timeout ou erro → fallback imediato para KB local (não bloqueia o agente)
      console.warn('⚠️ [MIRA KB] Supabase ai_knowledge indisponível, a usar fallback local.');
    }
  }

  // --- FALLBACK: MIRA_LOCAL_KB estática ---
  const kb = lang === 'EN' ? MIRA_LOCAL_KB_EN :
             lang === 'ES' ? MIRA_LOCAL_KB_ES :
             lang === 'FR' ? MIRA_LOCAL_KB_FR : MIRA_LOCAL_KB;

  for (const [key, response] of Object.entries(kb)) {
    if (key !== 'default' && p.includes(key)) return response;
  }
  return null;
};

/**
 * 🌐 DETECÇÃO & CONTRATO DE IDIOMA HIERÁRQUICO
 * 1. Idioma detectado na mensagem atual (prevalência máxima)
 * 2. Idioma da conversa recente
 * 3. Idioma da interface (UI)
 * 4. Fallback padrão: PT
 */
export const detectPromptLanguage = (prompt: string): 'PT' | 'EN' | 'ES' | 'FR' | null => {
  const p = prompt.toLowerCase();
  
  const ptScore = (p.match(/\b(não|está|para|com|tenho|fiquei|aguardando|manifestação|nacionalidade|obter|trabalho|quem|como|onde|quanto|tempo|anos|residência|minha|meu|meus|minhas|você|estou|quais|dúvida|notícias|pedir|preciso|precisa|carta|registo|quero|queria|saber|sobre|direitos|fazer|posso|pode|sou|somos|aqui|portugal|agendamento|conta|cartão|marcar)\b/gi) || []).length;
  const esScore = (p.match(/\b(no|está|para|con|tengo|quedé|esperando|manifestación|nacionalidad|obtener|trabajo|quien|cómo|donde|cuánto|tiempo|años|residencia|mi|mis|usted|estoy|cuáles|duda|noticias|pedir|necesito|necesita|registro|quiero|quisiera|saber|sobre|derechos|hacer|puedo|puede|soy|somos|aquí|cita|tarjeta)\b/gi) || []).length;
  const enScore = (p.match(/\b(the|is|are|for|with|have|stayed|waiting|nationality|get|work|who|how|where|how much|time|years|residence|my|you|which|doubt|news|need|visa|permit|want|know|about|rights|do|can|am|here|card|book)\b/gi) || []).length;
  const frScore = (p.match(/\b(le|la|les|pour|avec|ai|suis|attendant|nationalité|obtenir|travail|qui|comment|où|combien|temps|ans|résidence|mon|mes|vous|quels|doute|nouvelles|besoin|veux|savoir|sur|droits|faire|peux|peut|ici|carte|rdv)\b/gi) || []).length;

  if (ptScore > esScore && ptScore > enScore && ptScore > frScore) return 'PT';
  if (esScore > ptScore && esScore > enScore && esScore > frScore) return 'ES';
  if (enScore > ptScore && enScore > esScore && enScore > frScore) return 'EN';
  if (frScore > ptScore && frScore > esScore && frScore > enScore) return 'FR';

  return null;
};

export const resolveConversationLanguage = (prompt: string, historyLanguage?: string, uiLanguage: string = 'PT'): 'PT' | 'EN' | 'ES' | 'FR' => {
  const detected = detectPromptLanguage(prompt);
  if (detected) return detected;

  if (historyLanguage && ['PT', 'EN', 'ES', 'FR'].includes(historyLanguage.toUpperCase())) {
    return historyLanguage.toUpperCase() as 'PT' | 'EN' | 'ES' | 'FR';
  }

  if (uiLanguage && ['PT', 'EN', 'ES', 'FR'].includes(uiLanguage.toUpperCase())) {
    return uiLanguage.toUpperCase() as 'PT' | 'EN' | 'ES' | 'FR';
  }

  return 'PT';
};

const hasWord = (text: string, wordOrPhrase: string): boolean => {
  const escaped = wordOrPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Suporte a limites de palavra unicode
  const regex = new RegExp(`(^|[^a-záàâãéèêíïóôõöúçñ])${escaped}(?=[^a-záàâãéèêíïóôõöúçñ]|$)`, 'iu');
  return regex.test(text);
};

export const getMiraLocalResponse = (prompt: string, language: string = 'PT', historyLang?: string): string => {
  const p = prompt.toLowerCase().trim();
  const lang = resolveConversationLanguage(prompt, historyLang, language);

  // 🛡️ DISCLAIMER PRIORITÁRIO: Perguntas sobre aconselhamento jurídico, assessoria, cobrança/vender serviços
  const isLegalOrAdvisoryQuery = [
    'aconselhamento', 'juridico', 'jurídico', 'advogado', 'advogados', 'assessoria', 'pagar', 'pagamento',
    'vender', 'consulta', 'consultoria', 'legal advice', 'lawyer', 'advisory', 'asesoramiento',
    'asesoría', 'conseil juridique', 'cobram', 'preço', 'preco', 'custa', 'serviço pago', 'servicos pagos'
  ].some(k => hasWord(p, k));

  if (isLegalOrAdvisoryQuery) {
    if (lang === 'EN') {
      return "⚠️ DISCLAIMER & OFFICIAL LEGAL NOTICE:\nMIRA is a 100% FREE information and digital triage platform. WE DO NOT PROVIDE INDIVIDUAL LEGAL ADVICE NOR DO WE SELL PRIVATE IMMIGRATION ADVISORY SERVICES.\n\nWe do not replace professional lawyers or solicitadores. For individual legal advice or representation in court, consult a lawyer registered with the Portuguese Bar Association (oa.pt) or contact official free support centers (CNAIM / CLAIM).\n[view:LOCAL_SERVICES:View Official Free Support Centers]";
    } else if (lang === 'ES') {
      return "⚠️ AVISO LEGAL Y DISCLAIMER OFICIAL:\nMIRA es una plataforma 100% GRATUITA de información y triaje digital. NO OFRECEMOS ASESORAMIENTO JURÍDICO INDIVIDUAL NI VENDEMOS SERVICIOS DE ASESORÍA DE EXTRANJERÍA.\n\nNo reemplazamos a abogados ni solicitadores. Para asesoramiento legal personalizado, consulta a un abogado colegiado en la Ordem dos Advogados (oa.pt) o acude a los centros oficiales de apoyo gratuito (CNAIM / CLAIM).\n[view:LOCAL_SERVICES:Ver Centros Oficiales de Apoyo]";
    } else if (lang === 'FR') {
      return "⚠️ AVERTISSEMENT ET NOTICE JURIDIQUE OFFICIELLE :\nMIRA est une plateforme 100% GRATUITE d'information et de tri numérique. NOUS NE FOURNISSONS PAS DE CONSEIL JURIDIQUE INDIVIDUEL ET NOUS NE VENDONS PAS DE SERVICES D'ACCOMPAGNEMENT PRIVÉ.\n\nPour un conseil juridique personnalisé, consultez un avocat inscrit à l'Ordre des Avocats Portugais (oa.pt) ou rendez-vous dans les centres d'aide officiels (CNAIM / CLAIM).\n[view:LOCAL_SERVICES:Voir les Centres d'Aide Officiels]";
    }
    return "⚠️ AVISO LEGAL E DISCLAIMER OFICIAL DA PLATAFORMA:\n\n1. O MIRA NÃO PRESTA ACONSELHAMENTO JURÍDICO INDIVIDUALIZADO NEM VENDE SERVIÇOS DE ASSESSORIA DE IMIGRAÇÃO.\n\n2. O MIRA é uma plataforma 100% gratuita de cidadania, informação e triagem digital para orientar os cidadãos sobre os seus direitos em Portugal.\n\n3. Não somos um escritório de advogados nem cobramos por qualquer serviço de regularização. Para apoio jurídico individualizado ou representação formal, deves consultar um advogado inscrito na Ordem dos Advogados (oa.pt) ou recorrer aos gabinetes de apoio oficial gratuito do CNAIM / CLAIM.\n[view:LOCAL_SERVICES:Ver Mapa de Apoio Oficial e Serviços]";
  }

  const kb = lang === 'EN' ? MIRA_LOCAL_KB_EN :
             lang === 'ES' ? MIRA_LOCAL_KB_ES :
             lang === 'FR' ? MIRA_LOCAL_KB_FR : MIRA_LOCAL_KB;

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🧭 HIERARQUIA DE INTENÇÕES (NÍVEL 1: FRASES ESPECÍFICAS)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const specificPhrases = [
    'visto de procura de trabalho', 'visto procura de trabalho', 'procura de trabalho',
    'visado de búsqueda de trabajo', 'visado busqueda de trabajo', 'job seeker visa', 'visa recherche d\'emploi',
    'promessa de contrato de trabalho', 'promessa de contrato', 'promessa de trabalho', 'contrato de trabalho',
    'lei da nacionalidade', 'tempo de espera nacionalidade', 'nacionalidade 5 anos', 'tempo de manifestacao conta',
    'reagrupamento familiar', 'estatuto de igualdade', 'direitos iguais', 'cartao de cidadao para estrangeiro',
    'cartao de cidadao', 'atestado de residencia', 'atestado de residência', 'comprovativo de morada',
    'junta de freguesia', 'termo de responsabilidade', 'via verde empresas', 'via verde', 'tech visa',
    'visto d1', 'visto d2', 'visto d3', 'visto d7', 'visto d8', 'visto cplp', 'visto de estudante',
    'salario liquido', 'salário líquido', 'recibos verdes', 'custo de vida', 'atestado multiuso'
  ];

  for (const phrase of specificPhrases) {
    if (hasWord(p, phrase) && kb[phrase]) {
      return kb[phrase];
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🧭 HIERARQUIA DE INTENÇÕES (NÍVEL 2: COMPOSTOS & CONTEXTO)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Caso A: Nacionalidade + Manifestação / Tempo / 5 anos
  if ((hasWord(p, 'nacionalidade') || hasWord(p, 'cidadania') || hasWord(p, 'nacionalidad') || hasWord(p, 'nationality')) &&
      (hasWord(p, 'manifestação') || hasWord(p, 'manifestacao') || hasWord(p, 'aima') || hasWord(p, 'tempo') || hasWord(p, 'anos') || hasWord(p, 'espera') || hasWord(p, 'contar') || hasWord(p, 'conta'))) {
    if (kb['lei da nacionalidade']) return kb['lei da nacionalidade'];
    if (kb['cidadania']) return kb['cidadania'];
  }

  // Caso B / C: Visto D1 / Promessa / IEFP
  if ((hasWord(p, 'd1') || hasWord(p, 'promessa') || hasWord(p, 'proposta') || hasWord(p, 'contrato') || hasWord(p, 'trabalho')) &&
      (hasWord(p, 'visto') || hasWord(p, 'consulado') || hasWord(p, 'iefp') || hasWord(p, 'carta') || hasWord(p, 'empresa'))) {
    if (hasWord(p, 'promessa') && kb['promessa de contrato']) return kb['promessa de contrato'];
    if (kb['visto d1']) return kb['visto d1'];
  }

  // Procura de trabalho / VFS
  if ((hasWord(p, 'procura') || hasWord(p, 'busqueda') || hasWord(p, 'seeker')) &&
      (hasWord(p, 'trabalho') || hasWord(p, 'trabajo') || hasWord(p, 'visto') || hasWord(p, 'vfs') || hasWord(p, 'salários') || hasWord(p, 'salarios') || hasWord(p, 'iefp'))) {
    if (kb['visto de procura de trabalho']) return kb['visto de procura de trabalho'];
    if (kb['procura de trabalho']) return kb['procura de trabalho'];
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🧭 HIERARQUIA DE INTENÇÕES (NÍVEL 3: TERMOS INDIVIDUAIS COM \b)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  const singleTokens = Object.keys(kb)
    .filter(k => k !== 'default')
    .sort((a, b) => b.length - a.length);

  for (const token of singleTokens) {
    if (hasWord(p, token)) {
      return kb[token];
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🛡️ NÍVEL 4: RESPOSTA SEGURA DE CLARIFICAÇÃO (NÃO INVENTA)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (lang === 'EN') {
    return "I could not confidently identify the specific topic of your question. Could you please clarify if you are asking about Visas (D1, Job Seeker, D7, CPLP), AIMA Residence Permits, NIF/NISS, or Portuguese Nationality?\n[view:DASHBOARD:Explore MIRA Modules]";
  } else if (lang === 'ES') {
    return "No pude identificar con seguridad el tema específico de tu consulta. ¿Podrías aclarar si te refieres a Visados (D1, Búsqueda de Trabajo, D7, CPLP), Residencia en AIMA, NIF/NISS o Nacionalidad Portuguesa?\n[view:DASHBOARD:Explorar Módulos MIRA]";
  } else if (lang === 'FR') {
    return "Je n'ai pas pu identifier avec certitude le sujet précis de votre question. Pourriez-vous préciser s'il s'agit de Visas (D1, Recherche d'emploi, D7, CPLP), Titre de Séjour AIMA, NIF/NISS ou Nationalité Portugaise ?\n[view:DASHBOARD:Explorer les Modules MIRA]";
  }

  return "Não consegui identificar com segurança o tema específico da tua pergunta. Podes esclarecer se estás a perguntar sobre Vistos (D1, Procura de Trabalho, D7, CPLP), Título de Residência AIMA, NIF/NISS ou Nacionalidade Portuguesa?\n[view:DASHBOARD:Explorar Módulos do MIRA]";
};

const getGreetingResponse = (prompt: string, language: string = 'PT'): string | null => {
  const p = prompt.toLowerCase();
  const lang = resolveConversationLanguage(prompt, undefined, language);
  const kb = lang === 'EN' ? MIRA_LOCAL_KB_EN :
             lang === 'ES' ? MIRA_LOCAL_KB_ES :
             lang === 'FR' ? MIRA_LOCAL_KB_FR : MIRA_LOCAL_KB;
  
  if (hasWord(p, 'olá') || hasWord(p, 'ola') || hasWord(p, 'oi') || hasWord(p, 'bom dia') || hasWord(p, 'boa tarde') || hasWord(p, 'boa noite')) {
    return kb['olá'] || kb['hello'] || kb['bonjour'] || kb['hola'] || null;
  }
  if (hasWord(p, 'hello') || hasWord(p, 'hi') || hasWord(p, 'good morning') || hasWord(p, 'good evening')) {
    return MIRA_LOCAL_KB_EN['hello'] || MIRA_LOCAL_KB_EN['hi'] || null;
  }
  if (hasWord(p, 'hola') || hasWord(p, 'buenos dias') || hasWord(p, 'buenas tardes')) {
    return MIRA_LOCAL_KB_ES['hola'] || null;
  }
  if (hasWord(p, 'bonjour') || hasWord(p, 'salut') || hasWord(p, 'bonsoir')) {
    return MIRA_LOCAL_KB_FR['bonjour'] || MIRA_LOCAL_KB_FR['salut'] || null;
  }
  return null;
};

export interface SafeProfileContext {
  language?: string;
  firstName?: string;
  district?: string;
  nationalityGroup?: string;
  completedStations?: string[];
  activeGoal?: string;
}

export const generateAssistantResponseV45 = async (
  prompt: string, 
  history: any[] = [], 
  language: string = 'PT', 
  action: string = 'chat',
  profileContext?: SafeProfileContext
) => {
  try {
    if (!prompt || !prompt.trim()) return { text: "", source: 'local_fallback' as const, success: true };

    const p = prompt.trim();
    const pLower = p.toLowerCase();
    const resolvedLang = resolveConversationLanguage(p, undefined, language);

    // ⚡ Telemetria
    try { analytics.track('ai_query', 'system', 'chat', { promptLength: p.length }); } catch (e) {}

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🟢 SHORTCIRCUIT: SAUDAÇÕES → SEM GEMINI (E20)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (action === 'chat') {
      const isGreeting = GREETING_PATTERNS.some(g =>
        pLower === g || pLower.startsWith(g + ' ') || pLower.startsWith(g + '!')
      );
      if (isGreeting) {
        const localResp = getGreetingResponse(p, resolvedLang);
        if (localResp) {
          console.log('⚡ [MIRA CHAT] source=local_fallback (greeting shortcircuit)');
          return { 
            text: localResp, 
            source: 'local_fallback' as const,
            success: true, 
            version: 'SHORTCIRCUIT_GREETING', 
            hydration: 0, 
            perf: '0ms' 
          };
        }
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🧠 PIPE-3: SABER IA (ai_knowledge) → kbContext selectivo
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const verifiedKb = action === 'chat' ? await getVerifiedKbKnowledge(p, resolvedLang) : null;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🔵 SESSION CACHE: reutilizar se válido
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (action === 'chat') {
      const ctxHash = buildContextHash(
        profileContext?.completedStations || [],
        profileContext?.district || '',
        resolvedLang
      );
      const cached = cacheGet(p, ctxHash, _currentKbVersion);
      if (cached) {
        console.log(`⚡ [MIRA CACHE] Cache hit (${cached.intentType})`);
        return { 
          text: cached.response, 
          source: 'local_fallback' as const,
          success: true, 
          version: 'SESSION_CACHE_HIT', 
          hydration: 0, 
          perf: '0ms' 
        };
      }
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🗜️ HISTÓRICO COMPACTO (máx. 8 turnos selectivos)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const rawHistory = (history || [])
      .filter(h => (h.content || h.text || h.message))
      .map(h => ({
        role: (h.role === 'assistant' || h.role === 'model') ? 'model' : 'user',
        content: (h.content || h.text || h.message || '').trim()
      }));

    const sanitizedHistory = compactHistory(rawHistory);
    console.log(`🧠 [MIRA AGENT] Histórico compacto: ${sanitizedHistory.length}/${rawHistory.length} turnos. SABER IA: ${verifiedKb ? verifiedKb.length + ' chars' : 'sem resultado'}`);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 🤖 GEMINI PRIMARY_LLM — Tentativa prioritária
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const apiUrl = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001');
    const response = await fetch(`${apiUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        prompt: p, 
        history: sanitizedHistory,
        action, 
        language: resolvedLang,
        kbContext: verifiedKb || undefined,
        profileContext: profileContext || undefined
      })
    });

    let chatSource: 'gemini' | 'local_fallback' = 'gemini';
    let textResult = '';
    let responseModel = 'gemini-2.5-flash';

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      if (data && data.success && data.text && !data.fallbackRequired) {
        chatSource = 'gemini';
        textResult = data.text;
        responseModel = data.model || 'gemini-2.5-flash';
        console.log(`⚡ [MIRA CHAT] source=gemini model=${responseModel}`);
      } else {
        chatSource = 'local_fallback';
        console.warn(`⚠️ [MIRA CHAT] source=local_fallback (Gemini fallback flag: ${data?.errorType || data?.error || 'unspecified'})`);
        textResult = getMiraLocalResponse(p, resolvedLang);
      }
    } else {
      chatSource = 'local_fallback';
      console.warn(`⚠️ [MIRA CHAT] source=local_fallback (HTTP ${response.status})`);
      textResult = getMiraLocalResponse(p, resolvedLang);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 💾 Guardar na session cache
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (action === 'chat' && textResult) {
      const intentType = detectIntentType(p);
      const ctxHash = buildContextHash(
        profileContext?.completedStations || [],
        profileContext?.district || '',
        resolvedLang
      );
      const coveredTopics = p.toLowerCase().split(/\s+/).filter(w => w.length > 3).slice(0, 5);
      const sourceTopics = verifiedKb ? [verifiedKb.substring(0, 30)] : [];

      cacheSet(p, textResult, ctxHash, _currentKbVersion, intentType, coveredTopics, sourceTopics);
    }

    return { 
      text: textResult, 
      source: chatSource,
      success: true, 
      version: chatSource === 'gemini' ? responseModel : 'LOCAL_FALLBACK', 
      hydration: 0, 
      perf: '0ms' 
    };

  } catch (err: any) {
    console.error('🚨 [MIRA CHAT] Service exception:', err.message);

    const resolvedLang = resolveConversationLanguage(prompt, undefined, language);
    const localAnswer = getMiraLocalResponse(prompt, resolvedLang);
    console.log('🧠 [MIRA CHAT] source=local_fallback (exception fallback)');
    return { 
      text: localAnswer, 
      source: 'local_fallback' as const,
      success: true, 
      version: 'LOCAL_FALLBACK', 
      hydration: 1, 
      perf: '0ms' 
    };
  }
};

const normalizePromptKey = (str: string) => {
  return str
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
};

/**
 * Compacta o histórico para máx. 8 turnos selectivos:
 * - Sempre inclui os últimos 4 turnos
 * - Dos restantes, inclui apenas turnos com factos-chave não redundantes
 */
const compactHistory = (history: any[]): any[] => {
  if (!history || history.length <= 8) return history;

  const recent = history.slice(-4);           // últimos 4 sempre incluídos
  const older = history.slice(0, -4);         // turnos mais antigos

  // Palavras-chave que indicam factos relevantes para o contexto actual
  const factKeywords = [
    'enfermeira', 'enfermeiro', 'médico', 'médica', 'engenheiro', 'professor',
    'filho', 'filhos', 'filha', 'família', 'cônjuge', 'marido', 'esposa',
    'brasileiro', 'brasileira', 'ucraniano', 'ucraniana', 'cabo-verdiano',
    'lisboa', 'porto', 'braga', 'coimbra', 'faro', 'aveiro',
    'nif', 'niss', 'sns', 'aima', 'visto', 'autorização', 'residência',
    'nurse', 'doctor', 'engineer', 'family', 'children',
  ];

  // Recolher tópicos já cobertos nos turnos recentes (para evitar redundância)
  const recentContent = recent.map(h => (h.content || '')).join(' ').toLowerCase();

  const relevantOlder = older.filter(h => {
    const content = (h.content || '').toLowerCase();
    const hasKeyFact = factKeywords.some(kw => content.includes(kw));
    if (!hasKeyFact) return false;
    // Excluir se o facto já está coberto nos turnos recentes
    const mainWord = factKeywords.find(kw => content.includes(kw)) || '';
    return mainWord && !recentContent.includes(mainWord);
  }).slice(-4); // máx. 4 turnos antigos relevantes

  return [...relevantOlder, ...recent];
};

const safeBtoa = (str: string) => {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch (e) {
    return encodeURIComponent(str).substring(0, 100).replace(/%/g, '_');
  }
};



/**
 * TRADUTOR SNIPER (ECONOMIA DE TOKENS + CACHE LOCAL + FALLBACK TRIPLO BULLETPROOF)
 */
export const autoTranslateText = async (text: string, targetLang: string) => {
  if (!text || !text.trim()) return text;
  
  const normLang = (targetLang || 'PT').toUpperCase().split('-')[0];
  const cacheKey = `mira_trans_${safeBtoa(text.substring(0, 100))}_${normLang}`;
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) return cached;

  // 1. Tentar primeiro via Assistente MIRA (/api/chat)
  try {
    const translationPrompt = `Translate the following community post text to ${normLang}. Return ONLY the direct translated text without any quotation marks, explanations, or preambles. Text: ${text}`;
    const res = await generateAssistantResponseV45(translationPrompt, [], normLang, 'translate');
    const fallbackMsg = "Estamos a trabalhar em algumas melhorias no chat";
    
    if (res.success && res.text && !res.text.includes(fallbackMsg) && res.text.trim() !== text.trim()) {
      sessionStorage.setItem(cacheKey, res.text.trim());
      return res.text.trim();
    }
  } catch (e) {
    console.warn('🔄 [MIRA] Assistente principal indisponível para tradução, a tentar Edge Function...');
  }

  // 2. Tentar via Supabase Edge Function
  try {
    const { data } = await supabase.functions.invoke('mira-sovereign-v2026', {
      body: { 
        action: 'translate', 
        prompt: text, 
        language: normLang 
      }
    });
    if (data && data.text && data.text.trim() !== text.trim()) {
      sessionStorage.setItem(cacheKey, data.text.trim());
      return data.text.trim();
    }
  } catch (e) {
    console.warn('🔄 [MIRA] Edge function indisponível para tradução, a tentar fallback GTX...');
  }

  // 3. Fallback Infalível de 3º Nível: Google GTX Public Translation Endpoint
  try {
    const langCode = normLang.toLowerCase() === 'br' ? 'pt' : normLang.toLowerCase();
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data && data[0] && Array.isArray(data[0])) {
        const translatedSegments = data[0].map((segment: any) => segment[0]).filter(Boolean).join('');
        if (translatedSegments && translatedSegments.trim()) {
          sessionStorage.setItem(cacheKey, translatedSegments.trim());
          return translatedSegments.trim();
        }
      }
    }
  } catch (err) {
    console.error('🚨 [MIRA] Todos os 3 métodos de tradução falharam:', err);
  }

  return text;
};

// Interface Legada para Compatibilidade (Se necessário em outros componentes)
export const generateAssistantResponse = generateAssistantResponseV45;

export const generateSpeech = async (text: string, language: string) => { return null; };