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
  'presidente': '🏛️ PROMULGAÇÃO DO PACOTE LEGISLATIVO DE ESTRANGEIROS & ASILO (31 DE AGOSTO DE 2026):\n\nO Presidente da República promulgou o novo diploma que revê a Lei de Estrangeiros e a Lei do Asilo, após o Tribunal Constitucional (TC) ter emitido critérios vinculativos de proteção de direitos:\n1. PROTEÇÃO DE MENORES: Proibição absoluta de expulsão de crianças nascidas em Portugal e salvaguarda rigorosa da unidade familiar contra separações forçadas.\n2. DETENÇÃO PROPORCIONAL: Proibição de privação desproporcionada de liberdade de imigrantes sem cadastro criminal.\n3. REAGRUPAMENTO FAMILIAR (Art. 98.º): Regra de residência com exceções prioritárias de deferimento para menores de idade e cônjuges com filhos.\n4. VISTOS CONSULARES: Fim definitivo das Manifestações de Interesse e obrigatoriedade de visto consular prévio (D1, D2, D3, D7, D8, Procura de Trabalho).\n5. PRAZOS LEGAIS: Limite máximo de 90 dias para decisão de processos na AIMA.\n[view:LOCAL_SERVICES:Ver Balcões AIMA e Apoio Legal] [view:DOCUMENT_ASSISTANT:Gerar Minutas Oficiais]',
  'promulgou': '🏛️ PROMULGAÇÃO DO PACOTE LEGISLATIVO DE ESTRANGEIROS & ASILO (31 DE AGOSTO DE 2026):\nO Presidente da República promulgou a nova Lei de Estrangeiros e Asilo com diretrizes interpretativas obrigatórias do Tribunal Constitucional que protegem crianças nascidas em Portugal, asseguram a unidade familiar no Reagrupamento e limitam a retenção de estrangeiros sem antecedentes.\n[view:LOCAL_SERVICES:Ver Balcões AIMA]',
  'promulgação': '🏛️ PROMULGAÇÃO DO PACOTE LEGISLATIVO DE ESTRANGEIROS & ASILO (31 DE AGOSTO DE 2026):\nO Presidente da República promulgou a nova Lei de Estrangeiros e Asilo com diretrizes interpretativas obrigatórias do Tribunal Constitucional que protegem crianças nascidas em Portugal, asseguram a unidade familiar no Reagrupamento e limitam a retenção de estrangeiros sem antecedentes.\n[view:LOCAL_SERVICES:Ver Balcões AIMA]',
  'promulgacao': '🏛️ PROMULGAÇÃO DO PACOTE LEGISLATIVO DE ESTRANGEIROS & ASILO (31 DE AGOSTO DE 2026):\nO Presidente da República promulgou a nova Lei de Estrangeiros e Asilo com diretrizes interpretativas obrigatórias do Tribunal Constitucional que protegem crianças nascidas em Portugal, asseguram a unidade familiar no Reagrupamento e limitam a retenção de estrangeiros sem antecedentes.\n[view:LOCAL_SERVICES:Ver Balcões AIMA]',
  'pacote de leis': '🏛️ NOVO PACOTE LEGISLATIVO DE ESTRANGEIROS & ASILO (PROMULGADO PELO PRESIDENTE EM 31/08/2026):\n1. Proteção estrita de crianças nascidas em Portugal e proibição de separação familiar (Tribunal Constitucional).\n2. Reagrupamento Familiar (Art. 98.º) com isenção prioritária para menores.\n3. Exigência estrita de Visto Consular prévio obtido no país de origem (fim da Manifestação de Interesse).\n4. Prazos de 90 dias não prorrogáveis para decisão de pedidos.\n[view:LOCAL_SERVICES:Ver Balcões AIMA]',
  'tribunal constitucional': '⚖️ DECISÃO DO TRIBUNAL CONSTITUCIONAL SOBRE A LEI DE ESTRANGEIROS (Agosto 2026):\nO Tribunal Constitucional validou o diploma e fixou critérios orientadores vinculativos: salvaguarda do superior interesse da criança, proibição de expulsão de crianças nascidas em Portugal, garantia da unidade familiar e proporcionalidade na não privação de liberdade de cidadãos sem antecedentes.\n[view:LOCAL_SERVICES:Ver Apoio Legal]',
  'mudancas de lei': '🏛️ PACOTE LEGISLATIVO DE ESTRANGEIROS E ASILO PROMULGADO (31/08/2026):\nO novo quadro legal aprovado e promulgado pelo Presidente estabelece: 1. Proteção de crianças nascidas em Portugal e não separação de famílias; 2. Fim da manifestação de interesse e obrigatoriedade de vistos consulares prévios (D1 a D8); 3. Reagrupamento familiar prioritário para menores; 4. Prazo improrrogável de 90 dias para decisões AIMA.\n[view:LOCAL_SERVICES:Ver Balcões AIMA]',
  'novas leis': '🏛️ PACOTE LEGISLATIVO DE ESTRANGEIROS E ASILO PROMULGADO (31/08/2026):\nO novo quadro legal aprovado e promulgado pelo Presidente estabelece: 1. Proteção de crianças nascidas em Portugal e não separação de famílias; 2. Fim da manifestação de interesse e obrigatoriedade de vistos consulares prévios (D1 a D8); 3. Reagrupamento familiar prioritário para menores; 4. Prazo improrrogável de 90 dias para decisões AIMA.\n[view:LOCAL_SERVICES:Ver Balcões AIMA]',
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
  'metro': 'A Linha de Metro da Integração no teu Perfil guia-te pelos 6 passos essenciais: 1. Chegada, 2. NIF, 3. NISS, 4. SNS/Saúde, 5. Emprego e 6. Residência AIMA.\n[view:HOME:Ver Linha de Metro]',
  'asilo': 'Para pedir proteção internacional (asilo) em Portugal: diriges-te a qualquer posto de fronteira, esquadra da PSP ou GNR e declaras intenção de pedir asilo. O CPR (Conselho Português para os Refugiados: refugiados.pt) oferece apoio jurídico gratuito. O processo é gerido pela AIMA.\n[view:LOCAL_SERVICES:Ver Apoio Legal]',
    'retorno voluntario': '✈️ PROGRAMA DE RETORNO VOLUNTÁRIO (OIM / AIMA / Projeto ÁRVORE):\n\n1. O QUE É:\nApoio oficial gratuito e digno para cidadãos migrantes que pretendem regressar ao seu país de origem e não têm condições financeiras.\n\n2. O QUE INCLUI:\n- Bilhete de avião pago integralmente até ao destino final;\n- Apoio para emissão de documentos de viagem no consulado;\n- Subsídio de reinstalação / apoio à reintegração socioeconómica no país de origem;\n- Assistência no aeroporto.\n\n3. AVISO LEGAL CRÍTICO (Art. 139.º da Lei 23/2007):\nO retorno voluntário financiado pelo Estado Português implica interdição de entrada em Portugal e no Espaço Schengen por 3 anos (exceto se o valor for integralmente reembolsado ao Estado).\n\n4. COMO PEDIR:\n- Portal Oficial: retornovoluntario.pt\n- Linha Telefónica Gratuita: 808 257 257 ou +351 218 106 191\n- Presencialmente num balcão CNAIM (Lisboa, Porto, Faro).\n[view:LOCAL_SERVICES:Ver Balcões CNAIM e Apoio Social] [view:DOCUMENTS:voluntary_return:Programa de Retorno Voluntário (ARVoRE VIII)]',
  'retorno voluntário': '✈️ PROGRAMA DE RETORNO VOLUNTÁRIO (OIM / AIMA / Projeto ÁRVORE):\n\n1. O QUE É:\nApoio oficial gratuito e digno para cidadãos migrantes que pretendem regressar ao seu país de origem e não têm condições financeiras.\n\n2. O QUE INCLUI:\n- Bilhete de avião pago integralmente até ao destino final;\n- Apoio para emissão de documentos de viagem no consulado;\n- Subsídio de reinstalação / apoio à reintegração socioeconómica no país de origem;\n- Assistência no aeroporto.\n\n3. AVISO LEGAL CRÍTICO (Art. 139.º da Lei 23/2007):\nO retorno voluntário financiado pelo Estado Português implica interdição de entrada em Portugal e no Espaço Schengen por 3 anos (exceto se o valor for integralmente reembolsado ao Estado).\n\n4. COMO PEDIR:\n- Portal Oficial: retornovoluntario.pt\n- Linha Telefónica Gratuita: 808 257 257 ou +351 218 106 191\n- Presencialmente num balcão CNAIM (Lisboa, Porto, Faro).\n[view:LOCAL_SERVICES:Ver Balcões CNAIM e Apoio Social] [view:DOCUMENTS:voluntary_return:Programa de Retorno Voluntário (ARVoRE VIII)]',
  'voltar para o meu país': '✈️ PROGRAMA DE RETORNO VOLUNTÁRIO (OIM / AIMA):\nSe pretende regressar ao seu país e necessita de ajuda com passagem aérea e apoio financeiro de reinstalação, pode candidatar-se ao Programa de Apoio ao Retorno Voluntário da OIM (retornovoluntario.pt ou linha 808 257 257). Tenha em atenção que o apoio financiado pelo Estado gera interdição de regresso a Portugal por 3 anos.\n[view:LOCAL_SERVICES:Ver Balcões CNAIM]',
  'oim': '✈️ OIM (ORGANIZAÇÃO INTERNACIONAL PARA AS MIGRAÇÕES):\nResponsável pela gestão dos programas de Retorno Voluntário e Reintegração (Projeto ÁRVORE) e apoio humanitário aos migrantes em parceria com a AIMA.\nContacto: retornovoluntario.pt | Tel: 808 257 257 / +351 218 106 191\n[view:LOCAL_SERVICES:Ver Balcões de Apoio]',
  'reagrupamento': '👨‍👩‍👧 GUIA COMPLETO: REAGRUPAMENTO FAMILIAR (Art. 98.º a 108.º Lei 23/2007 — Regras 2026):\n\n1. QUEM TEM DIREITO:\nTitulares de Autorização de Residência válida em Portugal podem reagrupar cônjuge/união de facto, filhos menores ou incapazes, filhos maiores solteiros estudantes e ascendentes em 1.º grau a cargo.\n\n2. MEIOS DE SUBSISTÊNCIA (Portaria 1563/2007 - Salário Mínimo 920€):\n- Titular requerente: 100% (920€/mês = 11.040€/ano)\n- Cônjuge: 50% (460€/mês = 5.520€/ano)\n- Por cada filho menor/dependente: 30% (276€/mês = 3.312€/ano)\nComprovados por declaração de IRS, recibos de vencimento recentes ou saldo bancário anual equivalente.\n\n3. ALOJAMENTO CONDIGNO:\nContrato de arrendamento registado na Autoridade Tributária (AT) com recibos eletrónicos ou escritura de compra de imóvel.\n\n4. DOCUMENTOS EXIGIDOS:\nCertidões de casamento e nascimento recentes apostiladas pela Convenção de Haia e com tradução certificada para português, além do registo criminal apostilado dos dependentes maiores de 16 anos.\n\n5. ONDE TRAMITAR:\n- Familiares no estrangeiro: Visto D6 no Posto Consular / VFS.\n- Familiares em Portugal: Portal Digital da AIMA (aima.gov.pt).\n[view:DOCUMENT_ASSISTANT:Gerar Minuta de Reagrupamento Familiar] [view:LOCAL_SERVICES:Ver Balcões AIMA]',
  'reagrupamento familiar': '👨‍👩‍👧 REAGRUPAMENTO FAMILIAR (Art. 98.º a 108.º Lei 23/2007 — Regras 2026):\nTitulares de residência válida podem reagrupar cônjuge, filhos menores/estudantes e pais dependentes. Requisitos: Meios de subsistência familiares (920€ titular + 460€ cônjuge + 276€/filho - Portaria 1563/2007), habitação condigna registada na AT e certidões apostiladas de Haia. Familiares fora de Portugal instruem o Visto D6 no Consulado.\n[view:DOCUMENT_ASSISTANT:Gerar Minuta de Reagrupamento Familiar] [view:LOCAL_SERVICES:Ver Balcões AIMA]',
  'reagrupar': '👨‍👩‍👧 REAGRUPAMENTO FAMILIAR (Art. 98.º Lei 23/2007):\nPara trazer familiares para Portugal: 1. Comprovar residência legal; 2. Comprovar rendimentos familiares estáveis (Portaria 1563/2007); 3. Apresentar contrato de arrendamento registado nas Finanças; 4. Certidões civis com Apostila de Haia.\n[view:DOCUMENT_ASSISTANT:Gerar Minuta de Reagrupamento Familiar]',
  'visto d7': '🏠 VISTO D7 (APOSENTADOS, REFORMADOS & RENDIMENTOS PASSIVOS):\n\n1. QUEM PODE PEDIR:\nAposentados, reformados e titulares de rendimentos próprios passivos estáveis (pensões oficiais, rendas de imóveis, dividendos societários ou aplicações financeiras).\n\n2. RENDIMENTO MÍNIMO OBRIGATÓRIO (100% Salário Mínimo):\n- Requerente principal: 920€/mês (11.040€/ano);\n- Cônjuge: +50% (460€/mês = 5.520€/ano adicionais);\n- Por cada filho dependente: +30% (276€/mês = 3.312€/ano adicionais).\n\n3. REQUISITOS ESSENCIAIS:\n- Obter NIF português e abrir conta bancária em Portugal com fundos para pelo menos 1 a 2 anos (15.000€ a 30.000€+);\n- Comprovativo de alojamento por 1 ano (contrato de arrendamento registado na AT ou escritura de imóvel);\n- Seguro de Saúde Internacional ou Certificado PB4 / CDAM (gratuito para cidadãos brasileiros no Gov.br);\n- Registo criminal apostilado de Haia.\n\n4. PROCESSO:\nSubmissão do visto no Consulado de Portugal / VFS no país de origem e, após entrada em Portugal, agendamento na AIMA para emissão do Título de Residência de 2 anos.\n[view:DOCUMENT_ASSISTANT:Gerar Minuta D7 Rendimentos Passivos] [view:SIMULATORS:habitacao:Verificar Custo de Vida]',
  'aposentado': '🏠 VISTO D7 PARA APOSENTADOS & REFORMADOS (LEGISLAÇÃO 2026):\nPermite aos aposentados residir legalmente em Portugal com base na sua pensão de reforma. Exige rendimento mensal igual ou superior ao Salário Mínimo Nacional (mínimo 920€/mês = 11.040€/ano), NIF, conta bancária em Portugal com depósito de reserva, alojamento de 1 ano e Seguro de Saúde ou PB4.\n[view:DOCUMENT_ASSISTANT:Gerar Minuta D7 Rendimentos Passivos] [view:SIMULATORS:habitacao:Verificar Custo de Vida]',
  'aposentados': '🏠 VISTO D7 PARA APOSENTADOS & REFORMADOS (LEGISLAÇÃO 2026):\nPermite aos aposentados residir legalmente em Portugal com base na sua pensão de reforma. Exige rendimento mensal igual ou superior ao Salário Mínimo Nacional (mínimo 920€/mês = 11.040€/ano), NIF, conta bancária em Portugal com depósito de reserva, alojamento de 1 ano e Seguro de Saúde ou PB4.\n[view:DOCUMENT_ASSISTANT:Gerar Minuta D7 Rendimentos Passivos] [view:SIMULATORS:habitacao:Verificar Custo de Vida]',
  'aposentadoria': '🏠 APOSENTADORIA & VISTO D7 EM PORTUGAL:\nSe recebe aposentadoria no seu país de origem, pode solicitar o Visto D7 para residir em Portugal. Exige comprovação de pensão oficial líquida mensal de pelo menos 920€ (+50% cônjuge, +30% por filho), NIF, conta bancária em Portugal, contrato de arrendamento de 1 ano e PB4 ou seguro de saúde.\n[view:DOCUMENT_ASSISTANT:Gerar Minuta D7 Rendimentos Passivos]',
  'reformado': '🏠 VISTO D7 PARA REFORMADOS & APOSENTADOS:\nPara pensionistas e titulares de rendimentos passivos próprios. Exige pensão regular igual ou superior ao Salário Mínimo Nacional (920€/mês), NIF português, conta bancária em Portugal com fundos para 1 ano e alojamento comprovado.\n[view:DOCUMENT_ASSISTANT:Gerar Minuta D7 Rendimentos Passivos]',
  'reformados': '🏠 VISTO D7 PARA REFORMADOS & APOSENTADOS:\nPara pensionistas e titulares de rendimentos passivos próprios. Exige pensão regular igual ou superior ao Salário Mínimo Nacional (920€/mês), NIF português, conta bancária em Portugal com fundos para 1 ano e alojamento comprovado.\n[view:DOCUMENT_ASSISTANT:Gerar Minuta D7 Rendimentos Passivos]',
  'rendimentos passivos': '🏠 VISTO D7 DE RENDIMENTOS PASSIVOS:\nPara quem vive de rendas de imóveis, dividendos, investimentos ou pensões. Exige rendimento comprovado anual de pelo menos 11.040€ para o titular (+50% cônjuge, +30% filho), NIF, conta bancária em Portugal com saldo líquido e alojamento de longa duração.\n[view:DOCUMENT_ASSISTANT:Gerar Minuta D7 Rendimentos Passivos]',
  'visto d6': '👨‍👩‍👧 VISTO D6 (REAGRUPAMENTO FAMILIAR CONSULAR):\nDestinado a familiares de residentes legais em Portugal que se encontram no país de origem. Exige deferimento prévio ou instrução com comprovativo de residência do chamador, meios de subsistência familiares (Portaria 1563/2007), alojamento na AT e certidões civis apostiladas de Haia.\n[view:DOCUMENT_ASSISTANT:Gerar Minuta de Reagrupamento Familiar]',
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
  'mira': 'Sou a MIRA — Assistente Inteligente de Direitos do Migrante. Conheço 100% de todo o ecossistema da aplicação MIRA: 5.326 vagas de emprego, 156 cursos IEFP/DGES, 238 serviços locais de apoio, minutas em PDF, calculadoras de IRS e regras da AIMA e NIF/NISS.\n[view:HOME:Ver Painel Principal MIRA]',
  'olá': 'Olá! Sou a MIRA, a tua assistente para imigração e integração em Portugal. Conheço todas as funcionalidades da app: vagas de emprego, cursos, mapa de apoio, documentos PDF, IRS e fóruns. Como te posso ajudar hoje?\n[view:HOME:Explorar Módulos do MIRA]',
  'ola': 'Olá! Sou a MIRA, a tua assistente para imigração e integração em Portugal. Conheço todas as funcionalidades da app: vagas de emprego, cursos, mapa de apoio, documentos PDF, IRS e fóruns. Como te posso ajudar hoje?\n[view:HOME:Explorar Módulos do MIRA]',
  'oi': 'Oi! Sou a MIRA, a tua assistente para imigração em Portugal. Conheço 100% da aplicação MIRA (empregos, cursos, apoio local, minutas e regras AIMA). Em que posso ser útil?\n[view:HOME:Explorar Módulos do MIRA]',
  'bom dia': 'Bom dia! Sou a MIRA, assistente de apoio ao imigrante em Portugal. Posso ajudar-te com qualquer funcionalidade da app ou dúvida de imigração. Em que te posso ajudar hoje?\n[view:HOME:Explorar Módulos do MIRA]',
  'boa tarde': 'Boa tarde! Sou a MIRA, assistente de apoio ao imigrante em Portugal. Posso ajudar-te com qualquer funcionalidade da app ou dúvida de imigração. Como te posso ajudar?\n[view:HOME:Explorar Módulos do MIRA]',
  'boa noite': 'Boa noite! Sou a MIRA, assistente de apoio ao imigrante em Portugal. Posso ajudar-te com qualquer funcionalidade da app ou dúvida de imigração. Como te posso ajudar?\n[view:HOME:Explorar Módulos do MIRA]',
  'importante': 'Para quem chega a Portugal, a jornada essencial de integração segue esta ordem de importância:\n1. NIF\n2. Alojamento\n3. NISS\n4. Conta Bancária\n5. Transporte\n6. Utente SNS\n7. Regularização AIMA.\n[view:HOME:Ver Linha de Metro da Integração]',
  'portugal': 'Para te integrares com sucesso em Portugal, é fundamental obteres os documentos essenciais de cidadão: NIF, Alojamento/Morada, NISS, Conta Bancária, Utente SNS e a Regularização na AIMA.\n[view:HOME:Ver Linha de Metro]',
  'simulador': '🧮 6 SIMULADORES ECONÓMICOS MIRA (2026):\n1. Salário Líquido (Conta de Outrem - IRS 2026, SS 11%, IRS Jovem)\n2. Recibos Verdes (Trabalhador Independente - SS 21,4%, Incidência 70%/20%, Isenção 15k€)\n3. Custo de Vida (Comparador dos 20 Distritos de Portugal)\n4. Proteção à Habitação (Taxa de Esforço 35% e Capital de Entrada)\n5. Requisitos AIMA & Risco SS (Limiar 920€ RMMG + 276€/dep & Alerta Risco SS 20€/mês)\n6. Pequeno Empreendedor (IRC PME 12.5%, TSU MOE 33,05%, Margem e Break-Even)\n\n[view:SIMULATORS:Abrir Simuladores MIRA]',
  'simuladores': '🧮 6 SIMULADORES ECONÓMICOS MIRA (2026):\n1. Salário Líquido (Conta de Outrem - IRS 2026, SS 11%, IRS Jovem)\n2. Recibos Verdes (Trabalhador Independente - SS 21,4%, Incidência 70%/20%, Isenção 15k€)\n3. Custo de Vida (Comparador dos 20 Distritos de Portugal)\n4. Proteção à Habitação (Taxa de Esforço 35% e Capital de Entrada)\n5. Requisitos AIMA & Risco SS (Limiar 920€ RMMG + 276€/dep & Alerta Risco SS 20€/mês)\n6. Pequeno Empreendedor (IRC PME 12.5%, TSU MOE 33,05%, Margem e Break-Even)\n\n[view:SIMULATORS:Abrir Simuladores MIRA]',
  'pequeno empreendedor': '🏢 SIMULADOR PEQUENO EMPREENDEDOR & MICROEMPRESA:\nSimula a faturação, despesas operacionais, tributação reduzida PME em IRC (12,5% até 50.000€ lucro tributável - Art. 87.º CIRC), TSU do Sócio-Gerente (33,05% MOE) ou ENI (IRS Simplificado), margem de lucro e Ponto de Equilíbrio (Break-Even).\n\n[view:SIMULATORS:Abrir Simulador Pequeno Empreendedor]',
  'empreendedor': '🏢 SIMULADOR PEQUENO EMPREENDEDOR & MICROEMPRESA:\nSimula a faturação, despesas operacionais, tributação reduzida PME em IRC (12,5% até 50.000€ lucro tributável - Art. 87.º CIRC), TSU do Sócio-Gerente (33,05% MOE) ou ENI (IRS Simplificado), margem de lucro e Ponto de Equilíbrio (Break-Even).\n\n[view:SIMULATORS:Abrir Simulador Pequeno Empreendedor]',
  'habitação': '🏠 SIMULADOR DE PROTEÇÃO À HABITAÇÃO:\nCalcula a tua Taxa de Esforço com a renda (recomendação Banco de Portugal de máx. 35%), o Capital Inicial de Entrada necessário (2 cauções + 1 renda adiantada - Art. 1076.º C. Civil) e o Fundo de Emergência familiar (3 meses).\n\n[view:SIMULATORS:Abrir Simulador de Habitação]',
  'habitacao': '🏠 SIMULADOR DE PROTEÇÃO À HABITAÇÃO:\nCalcula a tua Taxa de Esforço com a renda (recomendação Banco de Portugal de máx. 35%), o Capital Inicial de Entrada necessário (2 cauções + 1 renda adiantada - Art. 1076.º C. Civil) e o Fundo de Emergência familiar (3 meses).\n\n[view:SIMULATORS:Abrir Simulador de Habitação]',
  'default': 'Sou a MIRA, assistente de apoio ao imigrante em Portugal. Tenho conhecimento total de todas as funcionalidades do aplicativo MIRA: 6 Simuladores Económicos (Salário, Recibos Verdes, Custo de Vida, Habitação, AIMA/SS, Empreendedor), 5.326 vagas de emprego, 156 cursos de formação, 238 serviços locais de apoio, gerador de minutas PDF, calculadoras de IRS e todas as regras da AIMA, NIF e NISS. Qual é a tua dúvida específica?\n[view:HOME:Ver Módulos do MIRA]'
};

export const MIRA_LOCAL_KB_EN: Record<string, string> = {
  'nif': 'The NIF (Tax Identification Number) is your taxpayer number in Portugal. You can request it at the Tax Authority (Finanças portal or in person) for free with your passport. It is required to work, open a bank account, and sign contracts.\n[view:DOCUMENT_ASSISTANT:Generate NIF Document in PDF]',
  'tax number': 'The NIF (Tax Identification Number) is your taxpayer number in Portugal. You can request it at the Tax Authority (Finanças portal or in person) for free with your passport. It is required to work, open a bank account, and sign contracts.\n[view:DOCUMENT_ASSISTANT:Generate NIF Document in PDF]',
  'niss': 'The NISS (Social Security Identification Number) is obtained through the Social Security Direct portal or in person. You need an employment contract or declaration of activity. It is required for contributions and benefits.\n[view:DOCUMENT_ASSISTANT:Generate NISS Document in PDF]',
  'social security number': 'The NISS (Social Security Identification Number) is obtained through the Social Security Direct portal or in person. You need an employment contract or declaration of activity. It is required for contributions and benefits.\n[view:DOCUMENT_ASSISTANT:Generate NISS Document in PDF]',
  'visto': 'The rules changed in 2024-2026: The Expression of Interest (Art. 88/89) was ABOLISHED. Now it is mandatory to obtain a Residence Visa (D1, D2, D7, D8, CPLP) or a Job Search Visa at the Portuguese Consulate in your country of origin before traveling.\n[view:LOCAL_SERVICES:View AIMA Desks & Consulates]',
  'visa': 'The rules changed in 2024-2026: The Expression of Interest (Art. 88/89) was ABOLISHED. Now it is mandatory to obtain a Residence Visa (D1, D2, D7, D8, CPLP) or a Job Search Visa at the Portuguese Consulate in your country of origin before traveling.\n[view:LOCAL_SERVICES:View AIMA Desks & Consulates]',
  'residencia': 'To obtain legal residence: 1. Obtain a visa at the consulate of your home country. 2. Travel to Portugal. 3. Book an appointment at AIMA to convert your visa into a Residence Permit. Regularizing as a tourist is no longer permitted by law.\n[view:LOCAL_SERVICES:View AIMA Desks]',
  'residency': 'To obtain legal residence: 1. Obtain a visa at the consulate of your home country. 2. Travel to Portugal. 3. Book an appointment at AIMA to convert your visa into a Residence Permit. Regularizing as a tourist is no longer permitted by law.\n[view:LOCAL_SERVICES:View AIMA Desks]',
  'residence permit': 'To obtain a Residence Permit in Portugal: 1. Obtain the appropriate visa at the consulate of your home country. 2. Travel to Portugal with a valid visa. 3. Attend your appointment at AIMA to issue your Residence Permit Card.\n[view:LOCAL_SERVICES:View AIMA Desks]',
  'morada': 'Proof of Address in Portugal (2026 Regulations): Juntas de Freguesia require proof of legal tenancy (Registered Lease Agreement at Finanças or Landlord Declaration with Land Registry Caderneta Predial). Friendly witness statements have been abolished.\n[view:DOCUMENT_ASSISTANT:Generate Accommodation Declaration]',
  'address': 'Proof of Address in Portugal (2026 Regulations): Juntas de Freguesia require proof of legal tenancy (Registered Lease Agreement at Finanças or Landlord Declaration with Land Registry Caderneta Predial). Friendly witness statements have been abolished.\n[view:DOCUMENT_ASSISTANT:Generate Accommodation Declaration]',
  'irs': 'IRS Tax Return in Portugal: The annual tax return is submitted between April 1 and June 30 on Portal das Finanças. Double taxation treaties apply if you have foreign income.\n[view:DOCUMENTS:irs:Open IRS Calculator & Guide]',
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

export const resolveConversationLanguage = (prompt: string, historyLanguage?: string, uiLanguage?: string): 'PT' | 'EN' | 'ES' | 'FR' => {
  // 1. PREFERÊNCIA EXPLÍCITA DE IDIOMA DA UI (SOBERANA)
  if (uiLanguage && ['PT', 'EN', 'ES', 'FR'].includes(uiLanguage.toUpperCase())) {
    return uiLanguage.toUpperCase() as 'PT' | 'EN' | 'ES' | 'FR';
  }

  // 2. DETECÇÃO AUTOMÁTICA DO PROMPT (FALLBACK)
  const detected = detectPromptLanguage(prompt);
  if (detected) return detected;

  // 3. IDIOMA DO HISTÓRICO (FALLBACK)
  if (historyLanguage && ['PT', 'EN', 'ES', 'FR'].includes(historyLanguage.toUpperCase())) {
    return historyLanguage.toUpperCase() as 'PT' | 'EN' | 'ES' | 'FR';
  }

  // 4. FALLBACK CANÓNICO PADRÃO
  return 'PT';
};

const hasWord = (text: string, wordOrPhrase: string): boolean => {
  const escaped = wordOrPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Suporte a limites de palavra unicode
  const regex = new RegExp(`(^|[^a-záàâãéèêíïóôõöúçñ])${escaped}(?=[^a-záàâãéèêíïóôõöúçñ]|$)`, 'iu');
  return regex.test(text);
};

// 🏛️ DOMÍNIOS CANÓNICOS DE REGULARIZAÇÃO (MIRA AGENT POSTURE & DOMAIN RESILIENCE)
export const CANONICAL_DOMAINS: Record<string, { aliases: string[], PT: string, EN: string, ES: string, FR: string }> = {
  STUDENT_RESIDENCY: {
    aliases: [
      'regularizacao por estudos', 'regularização por estudos', 'regularizacao de estudantes', 'regularização de estudantes',
      'regularizacion por estudios', 'régularisation études', 'student regularization',
      'estudos', 'estudo', 'estudante', 'estudantes', 'student', 'students', 'étudiant', 'étudiants', 'estudiante', 'estudiantes',
      'art. 91', 'artigo 91', 'art 91', 'art. 91.º', 'artigo 91.º', 'art 91.º', '91.º', '91º', 'artículo 91', 'article 91',
      'visto d4', 'visto de estudante', 'residencia de estudante', 'residência de estudante', 'd4 visa', 'visado d4', 'visa d4',
      'faculdade', 'universidade', 'ensino superior', 'estudar em portugal', 'posso estudar', 'estudante pode trabalhar',
      'quiero estudiar en portugal', 'want to study in portugal', 'étudier au portugal'
    ],
    PT: `🎓 RESIDÊNCIA DE ESTUDANTE & ART. 91.º (LEI DE ESTRANGEIROS):

1. ENTRADA LEGAL & VISTO D4:
Para quem está no país de origem, o percurso inicia-se com o pedido de Visto D4 de Estudante no Consulado de Portugal / VFS, mediante comprovativo de matrícula ou admissão em estabelecimento de Ensino Superior ou cursos oficialmente reconhecidos.

2. EM TERRITÓRIO NACIONAL (ART. 91.º, N.º 4):
Estudantes que tenham entrado legalmente em Portugal e estejam matriculados no Ensino Superior podem requerer a Autorização de Residência diretamente na AIMA em território nacional, sem necessidade de regresso ao país de origem.
- Requisitos: Matrícula ativa + Comprovativo de propinas + Meios de subsistência (bolsa, apoio familiar ou recursos próprios) + Alojamento + Registo criminal apostilado + Seguro de saúde / inscrição SNS.

3. DIREITO AO TRABALHO (ART. 97.º):
O estudante residente tem pleno direito legal de trabalhar a contrato ou recibos verdes. Basta efetuar a comunicação à AIMA e registar a atividade na Segurança Social (NISS).

4. JORNADA MIRA:
Posicionas-te na Estação 1 (Entrada/Vistos) ou Estação 6 (Residência AIMA).

[view:SIMULATORS:Abrir Requisitos AIMA e Guia de Estudante] [view:LEARNING:Ver Cursos e Equivalências DGES] [view:JOBS:Ver Vagas Compatíveis com Estudante]`,
    EN: `🎓 STUDENT RESIDENCY & ART. 91 (PORTUGUESE IMMIGRATION LAW):

1. LEGAL ENTRY & D4 VISA:
From abroad, apply for a D4 Student Visa at the Portuguese Consulate/VFS with proof of enrollment/acceptance in Higher Education or recognized study programs.

2. WITHIN PORTUGAL (ART. 91, PARA 4):
Students who entered legally and are enrolled in Higher Education can apply for a Residence Permit directly with AIMA in Portugal.
- Requirements: Active Enrollment + Tuition payment proof + Means of subsistence + Registered accommodation + Police clearance + Health insurance / SNS.

3. RIGHT TO WORK (ART. 97):
Student residents are legally entitled to work (employment contract or self-employment). You only need to notify AIMA and register with Social Security (NISS).

4. MIRA JOURNEY:
Anchored in Station 1 (Entry/Visas) or Station 6 (AIMA Residence).

[view:SIMULATORS:Open AIMA Student Guide] [view:LEARNING:View DGES Courses & Equivalence] [view:JOBS:View Student Friendly Jobs]`,
    ES: `🎓 RESIDENCIA DE ESTUDIANTE Y ART. 91 (LEY DE EXTRANJERÍA DE PORTUGAL):

1. ENTRADA LEGAL Y VISADO D4:
Desde el país de origen, el trámite se inicia solicitando el Visado D4 de Estudiante en el Consulado de Portugal / VFS con matrícula o carta de aceptación en Educación Superior.

2. DENTRO DE PORTUGAL (ART. 91, APARTADO 4):
Los estudiantes matriculados en Educación Superior que hayan entrado legalmente pueden solicitar la Autorización de Residencia directamente en AIMA sin regresar a su país.
- Requisitos: Matrícula activa + Pago de propinas/tasas + Medios de subsistencia + Alojamiento acreditado + Antecedentes penales + Seguro médico / SNS.

3. DERECHO A TRABAJAR (ART. 97):
El estudiante residente tiene derecho legal a trabajar (contrato laboral o autónomo/recibos verdes). Debe comunicarse a AIMA y registrarse en la Seguridad Social (NISS).

[view:SIMULATORS:Abrir Requisitos AIMA y Guía de Estudiante] [view:LEARNING:Ver Cursos y Equivalencias DGES] [view:JOBS:Ver Ofertas de Empleo Compatibles]`,
    FR: `🎓 RÉSIDENCE ÉTUDIANT & ART. 91 (LOI SUR L'IMMIGRATION AU PORTUGAL) :

1. ENTRÉE LÉGALE & VISA D4 :
Depuis l'étranger, demandez le Visa D4 Étudiant au Consulat du Portugal / VFS avec attestation d'inscription dans l'Enseignement Supérieur.

2. SUR LE TERRITOIRE PORTUGAIS (ART. 91, AL. 4) :
Les étudiants inscrits dans l'Enseignement Supérieur entrés légalement peuvent demander le Titre de Séjour directement auprès de l'AIMA.
- Conditions : Inscription active + Moyens de subsistance + Logement + Casier judiciaire + Assurance santé / SNS.

3. DROIT DE TRAVAILLER (ART. 97) :
Les étudiants résidents ont le droit légal de travailler (contrat ou travail indépendant). Déclaration requise auprès de l'AIMA et inscription à la Sécurité Sociale (NISS).

[view:SIMULATORS:Guide Résidence Étudiant AIMA] [view:LEARNING:Formations et Équivalences DGES] [view:JOBS:Offres d'Emploi Compatibles]`
  },

  VISTO_D1: {
    aliases: [
      'visto d1', 'd1', 'visto de trabalho', 'trabalho subordinado',
      'promessa de contrato', 'promessa de contrato de trabalho', 'promessa de trabalho', 'contrato de trabalho para visto',
      'd1 visa', 'visado d1', 'visa d1', 'trabajo subordinado', 'promesa de contrato'
    ],
    PT: `💼 VISTO D1 (TRABALHO SUBORDINADO & PROMESSA DE CONTRATO):

1. OBRIGAÇÃO CONSULAR PRÉVIA:
Para exercer atividade profissional subordinada em Portugal, o cidadão deve obter o Visto D1 no Consulado de Portugal no país de origem antes de viajar. A regularização como turista em território nacional foi extinta.

2. REQUISITOS DA EMPRESA CONTRATANTE:
- Emissão de Contrato de Trabalho ou Promessa de Contrato de Trabalho formal.
- Vencimento igual ou superior ao Salário Mínimo Nacional (RMMG em vigor).
- A empresa deve estar com situação contributiva e fiscal regularizada perante as Finanças e Segurança Social e registar a oferta no IEFP (ou utilizar o canal "Via Verde para Empresas").

3. INSTRUÇÃO DO PEDIDO:
Apresentação da Promessa assinada, registo criminal apostilado, seguro de viagem e comprovativo do IEFP junto do Consulado / VFS.

4. APÓS A CHEGADA:
Entrada legal em Portugal com visto de 2 entradas e agendamento na AIMA para emissão do Título de Residência de 2 anos.

[view:JOBS:Ver Vagas e Contratos] [view:DOCUMENT_ASSISTANT:Gerar Minuta de Promessa de Contrato]`,
    EN: `💼 D1 VISA (SUBORDINATE WORK & PROMISE OF EMPLOYMENT):

1. MANDATORY CONSULAR VISA:
Must be obtained at the Portuguese Consulate/VFS in your home country before travelling. Regularization from tourist status is legally extinct.

2. EMPLOYER REQUIREMENTS:
- Formal Employment Contract or Promise of Employment contract.
- Salary equal to or above the Portuguese National Minimum Wage in force.
- Employer with clean tax and Social Security standing, registering the position with IEFP (or Via Verde channel).

3. APPLICATION & ARRIVAL:
Submit signed promise, apostilled police clearance and travel insurance. Upon arrival, attend AIMA appointment to receive your 2-year Residence Card.

[view:JOBS:Browse Job Offers] [view:DOCUMENT_ASSISTANT:Generate Promise Letter PDF]`,
    ES: `💼 VISADO D1 (TRABAJO POR CUENTA AJENA Y PROMESA DE CONTRATO):

1. OBLIGATORIEDAD DE VISADO PREVIO:
Debe tramitarse en el Consulado de Portugal en el país de origen antes de viajar. La regularización como turista está extinta.

2. REQUISITOS DE LA EMPRESA CONTRATANTE:
- Contrato o Promesa formal de Contrato de Trabajo.
- Remuneración igual o superior al Salario Mínimo Nacional vigente.
- Empresa al corriente de pagos con Hacienda y Seguridad Social, con registro en IEFP (o canal Vía Verde).

3. LLEGADA Y AIMA:
Entrada a Portugal y cita en AIMA para emisión de la Tarjeta de Residencia de 2 años.

[view:JOBS:Ver Ofertas de Empleo] [view:DOCUMENT_ASSISTANT:Generar Minuta Promesa de Contrato]`,
    FR: `💼 VISA D1 (TRAVAIL SALARIÉ & PROMESSE D'EMBAUCHE) :

1. VISA CONSULAIRE OBLIGATOIRE :
À obtenir au Consulat du Portugal avant le départ. La régularisation sur place comme touriste est abrogée.

2. EXIGENCES EMPLOYEUR :
- Contrat ou Promesse formelle d'embauche avec salaire au moins égal au Salaire Minimum National en vigueur.
- Situation fiscale et sociale en règle et enregistrement auprès de l'IEFP (ou Via Verde).

[view:JOBS:Offres d'Emploi] [view:DOCUMENT_ASSISTANT:Modèle Promesse de Contrat]`
  },

  VIA_VERDE_EMPRESAS: {
    aliases: [
      'via verde para empresas', 'via verde empresas', 'via verde', 'tech visa',
      'contratacao acelerada', 'contratação acelerada', 'via verde for companies',
      'via verde pour entreprises', 'vía verde para empresas', 'vía verde empresas'
    ],
    PT: `🚀 VIA VERDE PARA EMPRESAS & ATRAÇÃO DE TALENTOS:

1. CANAL PRIORITÁRIO DESBUROCRATIZADO:
Regime especial criado para acelerar a contratação de trabalhadores e quadros internacionais por empresas sediadas em Portugal com atividade económica comprovada.

2. COMO FUNCIONA:
- A empresa emite a Promessa de Contrato e um Termo de Responsabilidade empresarial (que assegura alojamento e subsistência);
- Tramitação consular prioritária no país de origem e parecer célere articulado entre AIMA e IEFP;
- Agendamento facilitado e prioritário na AIMA após a entrada em território nacional.

3. TECH VISA & QUADROS TÉCNICOS:
Empresas tecnológicas certificadas pelo IAPMEI beneficiam de canal 100% digital com critérios salariais qualificados.

[view:JOBS:Ver Vagas Via Verde] [view:LOCAL_SERVICES:Ver Balcões AIMA e CLAIM]`,
    EN: `🚀 VIA VERDE FOR COMPANIES & TALENT ATTRACTION:

1. FAST-TRACK EMPLOYMENT CHANNEL:
Dedicated priority route for Portuguese companies hiring international talent with streamlined bureaucratic steps.

2. PROCESS:
- Employer issues a Promise of Contract and Corporate Responsibility Undertaking.
- Fast-track consular processing and fast AIMA/IEFP clearance.
- Priority AIMA appointment upon arrival in Portugal.

[view:JOBS:View Fast-Track Jobs] [view:LOCAL_SERVICES:View AIMA Support Centers]`,
    ES: `🚀 VÍA VERDE PARA EMPRESAS Y ATRACCIÓN DE TALENTO:

1. CANAL PRIORITARIO DE CONTRATACIÓN:
Mecanismo ágil para empresas radicadas en Portugal que contratan profesionales extranjeros.

2. FUNCIONAMIENTO:
- La empresa suscribe un Término de Responsabilidad y Promesa de Contrato.
- Tramitación consular preferente y dictamen rápido AIMA/IEFP.
- Cita preferente en AIMA a la llegada.

[view:JOBS:Ver Ofertas Vía Verde] [view:LOCAL_SERVICES:Ver Centros AIMA y CLAIM]`,
    FR: `🚀 VIA VERDE POUR ENTREPRISES & RECRUTEMENT INTERNATIONAL :

1. CANAL PRIORITAIRE ACCÉLÉRÉ :
Procédure rapide pour les entreprises au Portugal recrutant des talents étrangers avec Engagement de Prise en Charge d'entreprise et RDV AIMA prioritaire.

[view:JOBS:Offres Via Verde] [view:LOCAL_SERVICES:Centres AIMA et CLAIM]`
  },

  RETORNO_VOLUNTARIO: {
    aliases: [
      'retorno voluntario', 'retorno voluntário', 'retornar voluntariamente', 'retornar voluntario', 'retornar voluntário',
      'voltar para o meu pais', 'voltar para o meu país', 'voltar para o brasil', 'voltar para cabo verde', 'voltar para angola',
      'voltar para casa', 'voltar para minha terra', 'voltar para a minha terra', 'voltar para o pais de origem', 'voltar para o país de origem',
      'retornar ao meu pais', 'retornar ao meu país', 'retornar para o meu pais', 'retornar para o meu país', 'retornar para o brasil',
      'retornar para cabo verde', 'retornar a cabo verde', 'retornar para angola', 'retornar ao brasil', 'retornar a angola',
      'retornar ao pais de origem', 'retornar ao país de origem', 'retornar para a guine', 'retornar para a guiné',
      'regresso voluntario', 'regresso voluntário', 'regressar voluntariamente', 'regressar ao meu pais', 'regressar ao meu país',
      'regressar a cabo verde', 'regressar ao brasil', 'regressar a angola',
      'programa arvore', 'projeto arvore', 'projeto árvore', 'arvore viii', 'árvore viii', 'oim', 'iom', 'retornovoluntario',
      'ajuda para voltar', 'ajuda para regressar', 'ajuda para retornar', 'passagem de volta', 'passagem de regresso', 'passagem para voltar',
      'voluntary return', 'return voluntarily', 'return to my country', 'return home', 'iom return',
      'volver a mi pais', 'volver a mi país', 'regresar a mi pais', 'regresar a mi país',
      'retour volontaire', 'retourner volontairement', 'rentrer dans mon pays', 'rentrer au pays', 'rentrer chez moi'
    ],
    PT: `✈️ PROGRAMA DE RETORNO VOLUNTÁRIO & REINTEGRAÇÃO (OIM / AIMA — Projeto ÁRVORE):

1. O QUE É:
Programa oficial gerido pela Organização Internacional para as Migrações (OIM) em parceria com a AIMA, destinado a migrantes em situação de vulnerabilidade que desejam regressar voluntariamente e com dignidade ao país de origem.

2. APOIOS DISPONÍVEIS:
- Passagem aérea internacional integralmente paga até ao aeroporto de destino final;
- Apoio na obtenção de documentos de viagem (passaporte / salvo-conduto consular);
- Subsídio de reinstalação e apoio à reintegração económica (formação, desenvolvimento de micro-atividades);
- Acompanhamento especializado no embarque.

3. CONSEQUÊNCIA LEGAL OBRIGATÓRIA (Artigo 139.º da Lei 23/2007):
A concessão do apoio financeiro ao retorno voluntário implica uma interdição de entrada em Portugal e no Espaço Schengen por um período de 3 anos, a contar da data de saída (salvo se o beneficiário reembolsar a totalidade do apoio recebido).

4. COMO CONTACTAR E CANDIDATAR-SE:
- Linha Gratuita OIM: 808 257 257 (ou +351 218 106 191)
- Portal Oficial: retornovoluntario.pt
- Atendimento Presencial: Balcões CNAIM / CLAIM em Lisboa, Porto e Faro.

[view:LOCAL_SERVICES:Ver Balcões CNAIM e Apoio Social] [view:DOCUMENTS:voluntary_return:Programa de Retorno Voluntário (ARVoRE VIII)]`,
    EN: `✈️ VOLUNTARY RETURN & REINTEGRATION PROGRAM (IOM / AIMA — ARVoRE Project):

1. PURPOSE:
Official program managed by the International Organization for Migration (IOM) in partnership with AIMA, providing assistance to migrants who wish to return voluntarily and safely to their country of origin.

2. ASSISTANCE PROVIDED:
- Full international flight ticket to your final destination;
- Consular travel document assistance;
- Reinstallation and reintegration grant for economic stability;
- Departure and airport logistics assistance.

3. LEGAL NOTICE (Art. 139 of Law 23/2007):
Voluntary return funded by the Portuguese State incurs a 3-year entry ban to Portugal and the Schengen Area (unless fully reimbursed to the State).

4. HOW TO APPLY:
- Official Portal: retornovoluntario.pt
- Phone Support: +351 218 106 191 (or 808 257 257)
- In person at CNAIM centers (Lisbon, Porto, Faro).

[view:DOCUMENTS:voluntary_return:Voluntary Return Program (ARVoRE VIII)]`,
    ES: `✈️ PROGRAMA DE RETORNO VOLUNTARIO Y REINTEGRACIÓN (OIM / AIMA):

1. DESTINATARIOS:
Programa gestionado por la Organización Internacional para las Migraciones (OIM) y AIMA para personas que desean regresar voluntariamente a su país de origen sin costes.

2. APOYOS INCLUIDOS:
- Billete de avión completo hasta el destino final;
- Gestión de salvoconductos y documentación consular;
- Ayuda económica de reinstalación y micro-proyectos;
- Acompañamiento en el aeropuerto.

3. CONSECUENCIA LEGAL (Art. 139 Ley 23/2007):
El retorno voluntario subvencionado conlleva una prohibición de entrada en Portugal y espacio Schengen durante 3 años (a menos que se reembolsen los gastos al Estado).

4. CONTACTO:
- Portal Oficial: retornovoluntario.pt | Teléfono: +351 218 106 191 / 808 257 257
- Centros CNAIM en Lisboa, Oporto y Faro.

[view:DOCUMENTS:voluntary_return:Programa de Retorno Voluntario (ARVoRE VIII)]`,
    FR: `✈️ PROGRAMME DE RETOUR VOLONTAIRE & RÉINTÉGRATION (OIM / AIMA) :

1. BÉNÉFICIAIRES :
Programme officiel de l'Organisation Internationale pour les Migrations (OIM) et de l'AIMA pour un retour digne et volontaire au pays d'origine.

2. AIDES FOURNIES :
- Billet d'avion intégralement pris en charge ;
- Aide à l'obtention des laissez-passer consulaires ;
- Allocation de réinstallation et accompagnement de projet ;
- Assistance à l'aéroport de départ.

3. CONSÉQUENCE JURIDIQUE (Art. 139 Loi 23/2007) :
Interdiction de séjour au Portugal et dans l'Espace Schengen de 3 ans (sauf remboursement intégral).

4. CONTACT :
- Site officiel : retornovoluntario.pt | Tél : +351 218 106 191 / 808 257 257
- Bureaux CNAIM (Lisbonne, Porto, Faro).

[view:DOCUMENTS:voluntary_return:Programme de Retour Volontaire (ARVoRE VIII)]`
  },

  PACOTE_LEGISLATIVO_PROMULGADO_2026: {
    aliases: [
      'pacote de leis', 'novo pacote de leis', 'presidente promulgou', 'promulgou', 'promulgacao', 'promulgação',
      'tribunal constitucional', 'nova lei de estrangeiros', 'novas leis', 'mudancas de lei', 'mudanças de lei',
      'lei de estrangeiros 2026', 'promulgated law', 'new immigration law', 'nueva ley de extranjeria', 'nouvelle loi immigration'
    ],
    PT: `🏛️ NOVO PACOTE LEGISLATIVO DE ESTRANGEIROS & ASILO (PROMULGADO PELO PRESIDENTE DA REPÚBLICA — 31 DE AGOSTO DE 2026):

1. CONTEXTO & VALIDAÇÃO PELO TRIBUNAL CONSTITUCIONAL:
O Presidente da República promulgou o novo diploma que revê o regime de entrada, permanência, saída e concessão de asilo em Portugal, após o Tribunal Constitucional (Acórdão de 28/08/2026) ter fixado diretrizes orientadoras vinculativas.

2. CRITÉRIOS VINCULATIVOS DE SALVAGUARDA DE DIREITOS:
- SUPERIOR INTERESSE DA CRIANÇA: Salvaguarda e proibição absoluta de expulsão de crianças nascidas em Portugal e impedimento legal de qualquer separação forçada de famílias com dependentes menores.
- PROPORCIONALIDADE DA DETENÇÃO: Ficam estritamente vedadas retenções desproporcionadas de cidadãos estrangeiros sem antecedentes criminais; centros de acolhimento sob estrita supervisão judicial.
- ASILO & PROTEÇÃO HUMANITÁRIA: Garantia integral do princípio de non-refoulement (não repulsão) e acolhimento humanitário.

3. PILARES OPERACIONAIS DA NOVA LEI:
- REAGRUPAMENTO FAMILIAR (Art. 98.º a 108.º): Regra geral de residência legal prévia com isenção prioritária imediata para filhos menores e dependentes directos (Portaria 1563/2007: 100% titular + 50% cônjuge + 30% filho).
- VISTOS CONSULARES OBRIGATÓRIOS: Extinção definitiva das Manifestações de Interesse (Art. 88/89). Exigência estrita de vistos prévios obtidos no Consulado (Visto D1 Trabalho, D2 Empreendedor, D3 Altamente Qualificados/Tech Visa, D7 Aposentados/Rendimentos, D8 Nómadas Digitais e Visto de Procura de Trabalho).
- PRAZOS RÍGIDOS DE 90 DIAS: Fixação de prazo máximo não prorrogável para decisão dos processos na AIMA para eliminar as pendências históricas.

[view:LOCAL_SERVICES:Ver Balcões AIMA e Apoio Legal] [view:DOCUMENT_ASSISTANT:Gerar Minutas Oficiais] [view:SIMULATORS:habitacao:Verificar Custo de Vida]`,
    EN: `🏛️ NEW IMMIGRATION & ASYLUM LEGISLATIVE PACKAGE (PROMULGATED BY THE PRESIDENT OF PORTUGAL — AUGUST 31, 2026):

1. CONTEXT & CONSTITUTIONAL COURT RULING:
The President of the Republic promulgated the new Foreigners and Asylum Act following the Constitutional Court's unanimous ruling establishing binding human rights safeguards.

2. BINDING CONSTITUTIONAL SAFEGUARDS:
- BEST INTERESTS OF THE CHILD: Absolute ban on the deportation of children born in Portugal and protection against forced family separation.
- PROPORTIONALITY IN DETENTION: Strictly forbids disproportionate detention of foreign nationals without criminal records.
- REFUGEE & ASYLUM PROTECTION: Full reinforcement of the non-refoulement principle and guaranteed legal/social support.

3. OPERATIONAL PILLARS:
- FAMILY REUNIFICATION (Art. 98): Legal residence framework with immediate priority exemptions for minor and dependent children.
- MANDATORY PRIOR CONSULAR VISAS: Final extinction of Expressions of Interest. All entries for work/residence require prior consular visas (D1 to D8, Job Seeker).
- STRICT 90-DAY DEADLINE: Imposition of a non-extendable 90-day deadline for AIMA process resolutions.

[view:LOCAL_SERVICES:View AIMA Support Centers] [view:DOCUMENT_ASSISTANT:Generate Official PDF Forms]`,
    ES: `🏛️ NUEVO PAQUETE LEGISLATIVO DE EXTRANJERÍA Y ASILO (PROMULGADO POR EL PRESIDENTE — 31 DE AGOSTO DE 2026):

1. CONTEXTO Y TRIBUNAL CONSTITUCIONAL:
El Presidente de la República promulgó la nueva Ley de Extranjería y Asilo con criterios interpretativos vinculantes fijados por el Tribunal Constitucional.

2. GARANTÍAS VINCULANTES DE DERECHOS:
- INTERÉS SUPERIOR DEL MENOR: Prohibición expresa de expulsión de niños nacidos en Portugal y garantía contra la separación familiar.
- PROPORCIONALIDAD: Prohibición de privación desproporcionada de libertad de extranjeros sin antecedentes penales.
- PROTECCIÓN INTERNACIONAL: Plena vigencia del principio de no devolución (non-refoulement).

3. EJES FUNDAMENTALES:
- REAGRUPACIÓN FAMILIAR: Tramitación prioritaria y exención para hijos menores.
- VISADOS CONSULARES PREVIOS: Supresión definitiva de la Manifestación de Interés. Obligación de visado consular previo (D1 a D8, Búsqueda de Empleo).
- PLAZOS DE 90 DÍAS: Límite improrrogable para resoluciones en AIMA.

[view:LOCAL_SERVICES:Ver Centros AIMA] [view:DOCUMENT_ASSISTANT:Generar Formularios Oficiales]`,
    FR: `🏛️ NOUVEAU PAQUET LÉGISLATIF IMMIGRATION & ASILE (PROMULGUÉ PAR LE PRÉSIDENT — 31 AOÛT 2026) :

1. PROMULGATION ET COUR CONSTITUTIONNELLE :
Le Président de la République a promulgué la nouvelle Loi sur les Étrangers et le Droit d'Asile avec des garanties contraignantes de la Cour Constitutionnelle.

2. GARANTIES FONDAMENTALES :
- INTÉRÊT SUPÉRIEUR DE L'ENFANT : Interdiction d'expulsion des enfants nés au Portugal et interdiction de séparation des familles avec mineurs.
- PROPORTIONNALITÉ : Interdiction de rétention disproportionnée pour les étrangers sans casier judiciaire.
- NON-REFOULEMENT : Protection stricte des demandeurs d'asile et réfugiés.

3. PILIERS CLÉS :
- REGROUPEMENT FAMILIAL : Priorité absolue pour les enfants mineurs et dépendants.
- VISAS CONSULAIRES OBLIGATOIRES : Fin définitive de la Déclaration d'Intérêt. Visa consulaire requis avant l'arrivée (D1 à D8).
- DÉLAI DE 90 JOURS : Délai strict et non prorogeable pour les décisions de l'AIMA.

[view:LOCAL_SERVICES:Centres AIMA] [view:DOCUMENT_ASSISTANT:Modèles Officiels PDF]`
  },

  REAGRUPAMENTO_FAMILIAR: {
    aliases: [
      'reagrupamento familiar', 'reagrupamento', 'reagrupar', 'trazer familia', 'trazer família', 'trazer esposa', 'trazer marido',
      'trazer filhos', 'reagrupamento aima', 'visto d6', 'visto de reagrupamento', 'family reunification', 'reagrupacion familiar',
      'regroupement familial', 'art 98', 'artigo 98', 'artigo 98.º', 'art. 98.º', 'reunir familia', 'portal reagrupamento'
    ],
    PT: `👨‍👩‍👧 REAGRUPAMENTO FAMILIAR EM PORTUGAL (Art. 98.º a 108.º da Lei 23/2007 — Legislação 2026):

1. QUEM PODE REAGRUPAR & QUEM TEM DIREITO:
- Titular com Autorização de Residência válida em Portugal (ou recibo comprovativo de renovação).
- Podem ser reagrupados: Cônjuge ou parceiro em União de Facto reconhecida; Filhos menores ou incapazes a cargo de ambos ou de um dos cônjuges; Filhos maiores solteiros a cargo que estudem em Portugal; Ascendentes em 1.º grau (pais) na dependência económica do residente.

2. MEIOS DE SUBSISTÊNCIA EXIGIDOS (Portaria n.º 1563/2007):
O cálculo é feito com base no Salário Mínimo Nacional (RMMG 920€/mês):
- 100% para o Titular Requerente (920€/mês = 11.040€/ano);
- 50% para o Cônjuge / 2.º Adulto (460€/mês = 5.520€/ano);
- 30% para cada Filho Menor ou dependente (276€/mês = 3.312€/ano).
Comprovados por IRS + recibos de vencimento recentes ou saldo bancário anual equivalente em Portugal.

3. ALOJAMENTO CONDIGNO COMPROVADO:
Contrato de Arrendamento registado no Portal das Finanças (AT) com os respetivos recibos de renda eletrónicos, ou Escritura de Imóvel. Atestados de complacência sem título de habitação foram abolidos.

4. DOCUMENTOS DOS FAMILIARES:
- Certidões de Casamento/Nascimento emitidas há menos de 6 meses com Apostila de Haia no país de origem e tradução certificada para português.
- Certificado de Registo Criminal do país de origem dos dependentes maiores de 16 anos (Apostilado).

5. PROCEDIMENTO DE PEDIDO:
- Familiares fora de Portugal: O processo inicia-se com o Visto de Residência D6 no Posto Consular / VFS no país de origem.
- Familiares em Portugal / Menores: Marcação e submissão através do Portal Digital da AIMA (aima.gov.pt).

[view:DOCUMENT_ASSISTANT:Gerar Minuta de Reagrupamento Familiar] [view:SIMULATORS:habitacao:Verificar Custo de Vida] [view:LOCAL_SERVICES:Ver Balcões AIMA]`,
    EN: `👨‍👩‍👧 FAMILY REUNIFICATION IN PORTUGAL (Art. 98 to 108 of Law 23/2007 — 2026 Rules):

1. ELIGIBILITY & FAMILY MEMBERS:
- Sponsor must hold a valid Portuguese Residence Permit (or renewal proof).
- Eligible relatives: Spouse or registered civil partner; Minor or dependent children of either or both partners; Single adult children who are dependents studying in Portugal; Dependent first-degree ascendants (parents).

2. FINANCIAL MEANS OF SUBSISTENCE (Portaria 1563/2007):
Based on the Portuguese National Minimum Wage (RMMG €920/mo):
- 100% for the Sponsor (€920/mo = €11,040/year);
- 50% for Spouse/2nd adult (€460/mo = €5,520/year);
- 30% for each Minor/Dependent Child (€276/mo = €3,312/year).
Proven via tax returns (IRS), recent payslips, or Portuguese bank savings.

3. SUITABLE ACCOMMODATION:
Lease agreement registered with the Portuguese Tax Authority (AT) with electronic rent receipts, or Property Deed. Informal affidavits without registered housing title are invalid.

4. REQUIRED CIVIL CERTIFICATES:
- Marriage/Birth certificates issued within the last 6 months, Hague Apostilled in country of origin with certified Portuguese translation.
- Criminal record certificates for all family members aged 16 and over (Apostilled).

5. HOW TO APPLY:
- Relatives abroad: Apply for a D6 Family Reunification Visa at the Portuguese Consulate / VFS in their country of residence.
- Relatives in Portugal: Appointment and application via the AIMA Digital Portal (aima.gov.pt).

[view:DOCUMENT_ASSISTANT:Generate Reunification Request PDF] [view:LOCAL_SERVICES:View AIMA Support Centers]`,
    ES: `👨‍👩‍👧 REAGRUPACIÓN FAMILIAR EN PORTUGAL (Art. 98 a 108 Ley 23/2007 — Normativa 2026):

1. BENEFICIARIOS Y REQUISITOS:
- Titular de Autorización de Residencia válida en Portugal.
- Familiares con derecho: Cónyuge o pareja de hecho registrada; Hijos menores o dependientes; Hijos mayores solteros estudiantes; Ascendientes directos (padres) a cargo.

2. MEDIOS DE SUBSISTENCIA EXIGIDOS:
Calculados sobre el Salario Mínimo Nacional (RMMG 920€/mes):
- 100% Titular solicitante (920€/mes = 11.040€/año);
- 50% Cónyuge / 2.º Adulto (460€/mes = 5.520€/año);
- 30% por cada Hijo Menor o dependiente (276€/mes = 3.312€/año).
Acreditados mediante IRPF (IRS), nóminas recientes o saldo bancario anual en Portugal.

3. VIVIENDA ADECUADA Y DOCUMENTOS:
- Contrato de arrendamiento registrado en Hacienda (AT) o Escritura de propiedad.
- Certificados civiles de matrimonio/nacimiento con Apostilla de La Haya y traducción jurada.
- Antecedentes penales de dependientes mayores de 16 años apostillados.

4. CÓMO TRAMITAR:
- Familiares en el extranjero: Tramitación del Visado D6 en el Consulado de Portugal / VFS.
- Familiares en Portugal: Cita y expediente en el Portal Digital AIMA (aima.gov.pt).

[view:DOCUMENT_ASSISTANT:Generar Minuta de Reagrupación Familiar] [view:LOCAL_SERVICES:Ver Centros AIMA]`,
    FR: `👨‍👩‍👧 REGROUPEMENT FAMILIAL AU PORTUGAL (Art. 98 à 108 Loi 23/2007 — Directives 2026) :

1. AYANTS DROIT & CONDITIONS :
- Le demandeur doit détenir un Titre de Séjour valide au Portugal.
- Membres éligibles : Conjoint ou partenaire d'union civile enregistrée ; Enfants mineurs ou dépendants ; Enfants majeurs célibataires poursuivant des études au Portugal ; Ascendants directs (parents) à charge.

2. RESSOURCES FINANCIÈRES EXIGÉES :
Basées sur le Salaire Minimum National (920€/mois) :
- 100% pour le Titulaire (920€/mois = 11.040€/an) ;
- 50% pour le Conjoint (460€/mois = 5.520€/an) ;
- 30% par Enfant mineur/dépendant (276€/mois = 3.312€/an).

3. LOGEMENT & PIÈCES REQUISES :
- Contrat de bail enregistré auprès de l'administration fiscale (AT) ou Titre de propriété.
- Actes d'état civil apostillés de La Haye avec traduction certifiée en portugais.
- Casier judiciaire apostillé pour les membres âgés de 16 ans et plus.

4. PROCÉDURE :
- Membres à l'étranger : Demande de Visa D6 au Consulat du Portugal / VFS.
- Membres au Portugal : Portail Digital AIMA (aima.gov.pt).

[view:DOCUMENT_ASSISTANT:Modèle Demande Regroupement Familial] [view:LOCAL_SERVICES:Centres AIMA]`
  },

  VISTO_D7: {
    aliases: [
      'visto d7', 'd7', 'aposentado', 'aposentados', 'aposentadoria', 'reformado', 'reformados', 'reforma', 'rendimentos passivos',
      'visto para aposentado', 'visto para reformado', 'visto de rendimentos proprios', 'visto de rendimentos próprios',
      'd7 visa', 'retiree visa', 'passive income visa', 'visado d7', 'visa d7', 'visado jubilado', 'visa retraite'
    ],
    PT: `🏠 VISTO D7 (APOSENTADOS, REFORMADOS & RENDIMENTOS PASSIVOS):

1. A QUEM SE DESTINA:
Cidadãos estrangeiros que vivam de rendimentos passivos estáveis e regulares, designadamente:
- Pensões de reforma / aposentadoria oficiais;
- Rendimentos prediais (imóveis arrendados no país de origem ou em Portugal);
- Dividendos societários, aplicações financeiras, fundos de investimento ou direitos de propriedade intelectual.

2. COMPROVAÇÃO FINANCEIRA MÍNIMA OBRIGATÓRIA:
O valor base exigido pela lei portuguesa corresponde a 100% do Salário Mínimo Nacional anual:
- Titular Requerente: 920€/mês (mínimo 11.040€/ano);
- Cônjuge / 2.º Adulto: +50% (460€/mês = 5.520€/ano adicionais);
- Por cada Filho / Dependente: +30% (276€/mês = 3.312€/ano adicionais).

3. PASSOS ESSENCIAIS DE PREPARAÇÃO:
- Obter NIF português (com morada atualizada ou representação fiscal);
- Abrir conta bancária num banco em Portugal e transferir fundos equivalentes a pelo menos 1 a 2 anos de despesas (recomendado 15.000€ a 30.000€ depositados em Portugal);
- Comprovativo de Alojamento de Longa Duração: Contrato de arrendamento de 1 ano registado na AT, Escritura de compra de imóvel, ou Termo de Alojamento assinado por residente legal;
- Seguro de Saúde Internacional com cobertura médica e de repatriamento (mínimo 30.000€) OU Certificado PB4 / CDAM para cidadãos brasileiros (gratuito e emitido online no Gov.br);
- Registo criminal apostilado de Haia emitido no país de origem.

4. PEDIDO CONSULAR & AIMA:
O pedido do Visto D7 é submetido no Posto Consular de Portugal / VFS no país de residência. Após a chegada a Portugal com o visto, o requerente comparece ao agendamento na AIMA para recolha de dados biométricos e emissão do Título de Residência de 2 anos (renovável por 3 anos).

[view:DOCUMENT_ASSISTANT:Gerar Minuta D7 Rendimentos Passivos] [view:SIMULATORS:habitacao:Verificar Custo de Vida] [view:LOCAL_SERVICES:Ver Balcões AIMA e Consulados]`,
    EN: `🏠 D7 VISA (RETIREES, PENSIONERS & PASSIVE INCOME HOLDERS):

1. TARGET AUDIENCE:
Foreign nationals with regular, stable passive income streams, including:
- Official retirement/pension payments;
- Real estate rental income from properties owned abroad or in Portugal;
- Company dividends, financial investments, bonds, or intellectual property royalties.

2. MINIMUM FINANCIAL REQUIREMENT:
Based on 100% of the Portuguese National Minimum Wage:
- Main Applicant: €920/month (€11,040/year minimum);
- Spouse / 2nd Adult: +50% (€460/month = €5,520/year);
- Per Dependent Child: +30% (€276/month = €3,312/year).

3. ESSENTIAL STEPS:
- Obtain a Portuguese NIF (Tax Number);
- Open a bank account in Portugal and transfer at least 1-2 years of living expenses (€15,000 to €30,000+);
- Long-term accommodation: 1-year AT-registered lease agreement or property deed;
- Comprehensive international health insurance (minimum €30,000 coverage with repatriation) OR PB4 health agreement form for Brazilian nationals;
- Hague Apostilled police clearance from home country.

4. APPLICATION PROCESS:
Apply for the D7 Visa at the Portuguese Consulate/VFS in your home country. Upon arrival in Portugal, attend your AIMA appointment to receive your 2-year renewable Residence Card.

[view:DOCUMENT_ASSISTANT:Generate D7 Passive Income Form PDF] [view:SIMULATORS:habitacao:Check Cost of Living] [view:LOCAL_SERVICES:View AIMA & Consular Centers]`,
    ES: `🏠 VISADO D7 (JUBILADOS, PENSIONISTAS Y RENTAS PASIVAS):

1. DESTINATARIOS:
Ciudadanos extranjeros que dispongan de ingresos pasivos regulares y demostrables:
- Pensiones oficiales de jubilación / retiro;
- Rentas por alquiler de bienes inmuebles;
- Dividendos de empresas, inversiones financieras o derechos de autor.

2. REQUISITOS ECONÓMICOS MÍNIMOS:
Calculados sobre el Salario Mínimo Nacional portugués:
- Solicitante Principal: 920€/mes (11.040€/año mínimo);
- Cónyuge / 2.º Adulto: +50% (460€/mes = 5.520€/año);
- Por cada Hijo dependiente: +30% (276€/mes = 3.312€/año).

3. TRÁMITES FUNDAMENTALES:
- NIF portugués y cuenta bancaria abierta en Portugal con transferencia de fondos de 1 año (15.000€ a 30.000€);
- Contrato de alquiler de 1 año registrado en Hacienda (AT) o Escritura de compraventa;
- Seguro médico internacional con cobertura mínima de 30.000€ o formulario PB4 para ciudadanos brasileños;
- Antecedentes penales apostillados de La Haya.

4. TRAMITACIÓN:
Solicitud en el Consulado de Portugal / VFS. Tras llegar a Portugal, cita en AIMA para emisión de la Tarjeta de Residencia de 2 años.

[view:DOCUMENT_ASSISTANT:Generar Minuta D7 Rentas Pasivas] [view:SIMULATORS:habitacao:Consultar Coste de Vida] [view:LOCAL_SERVICES:Ver Centros AIMA]`,
    FR: `🏠 VISA D7 (RETRAITÉS, PENSIONNÉS ET REVENUS PASSIFS) :

1. BÉNÉFICIAIRES :
Ressortissants étrangers disposant de revenus passifs réguliers et stables :
- Pensions officielles de retraite ;
- Revenus locatifs immobiliers ;
- Dividendes de sociétés, placements financiers ou redevances.

2. CONDITIONS FINANCIÈRES MINIMALES :
Basées sur le Salaire Minimum National au Portugal :
- Demandeur principal : 920€/mois (11.040€/an minimum) ;
- Conjoint : +50% (460€/mois = 5.520€/an) ;
- Par Enfant à charge : +30% (276€/mois = 3.312€/an).

3. DÉMARCHES ESSENTIELLES :
- Obtention du NIF portugais et ouverture de compte bancaire au Portugal avec réserve financière pour 1 an (15.000€ à 30.000€) ;
- Bail de location de 1 an enregistré aux Impôts (AT) ou Titre de propriété ;
- Assurance santé internationale (couverture minimale de 30.000€ avec rapatriement) ;
- Casier judiciaire apostillé de La Haye.

4. PROCÉDURE CONSULAIRE ET AIMA :
Dépôt au Consulat du Portugal / VFS. À l'arrivée au Portugal, convocation à l'AIMA pour la délivrance du Titre de Séjour de 2 ans.

[view:DOCUMENT_ASSISTANT:Modèle Justificatif D7 Revenus Passifs] [view:LOCAL_SERVICES:Centres AIMA]`
  },

  VISTO_D8: {
    aliases: [
      'visto d8', 'd8', 'nomada digital', 'nómada digital', 'nomadas digitais', 'nómadas digitais',
      'digital nomad', 'digital nomads', 'nomade digital', 'teletrabalho', 'trabalho remoto',
      'trabalhar remotamente', 'remote work', 'd8 visa', 'visado d8', 'visa d8'
    ],
    PT: `💻 VISTO D8 (NÓMADAS DIGITAIS & TRABALHO REMOTO INTERNACIONAL):

1. A QUEM SE DESTINA:
Trabalhadores dependentes (teletrabalho) ou independentes (prestadores de serviços) com contrato ou clientes sediados fora de Portugal.

2. MODALIDADES:
- Estada Temporária: Válido até 1 ano (para estadas de curta duração, sem direito inicial a reagrupamento de longa duração).
- Visto de Residência: Válido para entrada e emissão de Título de Residência AIMA de 2 anos (renovável por 3 anos).

3. COMPROVAÇÃO DE MEIOS DE SUBSISTÊNCIA:
- Rendimentos mensais médios comprovados nos últimos 3 meses iguais ou superiores a 4 vezes o Salário Mínimo Nacional (RMMG em vigor).
- Contrato de trabalho remoto, declaração da entidade empregadora ou contratos de prestação de serviços internacionais.
- Comprovativo de domicílio fiscal e extratos bancários que atestem solvência.

4. ENQUADRAMENTO FISCAL:
Estrangeiros residentes podem usufruir de regimes fiscais competitivos mediante inscrição no Portal das Finanças com NIF.

[view:SIMULATORS:recibos:Simular Rendimentos] [view:DOCUMENTS:irs:Guia Fiscal Nómada Digital]`,
    EN: `💻 D8 VISA (DIGITAL NOMADS & REMOTE WORK):

1. ELIGIBILITY:
Remote employees or freelancers providing services to companies/clients based outside Portugal.

2. MODALITIES:
- Temporary Stay: Up to 1 year.
- Residency Visa: Leads to a 2-year renewable AIMA Residence Card.

3. FINANCIAL REQUIREMENT:
- Average monthly earnings over the last 3 months equal to or exceeding 4 times the Portuguese National Minimum Wage in force.
- Remote employment contract, employer declaration, or service contracts.
- Proof of tax residence and bank statements.

[view:SIMULATORS:recibos:Simulate Income] [view:DOCUMENTS:irs:Digital Nomad Tax Guide]`,
    ES: `💻 VISADO D8 (NÓMADAS DIGITALES Y TRABAJO REMOTO):

1. DESTINATARIOS:
Trabajadores por cuenta ajena en teletrabajo o autónomos con clientes fuera de Portugal.

2. MODALIDADES:
- Estancia Temporal: Hasta 1 año.
- Visado de Residencia: Para obtener Tarjeta de Residencia AIMA de 2 años.

3. REQUISITO DE INGRESOS:
- Ingresos medios de los últimos 3 meses iguales o superiores a 4 veces el Salario Mínimo Nacional vigente en Portugal.
- Contrato laboral remoto o de servicios, extractos bancarios y certificado de residencia fiscal.

[view:SIMULATORS:recibos:Simulador de Ingresos] [view:DOCUMENTS:irs:Guía Fiscal Nómada Digital]`,
    FR: `💻 VISA D8 (NOMADES DIGITAUX & TÉLÉTRAVAIL) :

1. BÉNÉFICIAIRES :
Télétravailleurs salariés ou indépendants pour des clients situés hors du Portugal.

2. CONDITIONS FINANCIÈRES :
- Revenus mensuels moyens des 3 derniers mois au moins égaux à 4 fois le Salaire Minimum National en vigueur au Portugal.
- Contrat de travail à distance ou contrats de prestations internationales.

[view:SIMULATORS:recibos:Simulateur Revenus] [view:DOCUMENTS:irs:Guide Fiscal Nomade Digital]`
  }
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

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 🏛️ DOMÍNIOS CANÓNICOS DE REGULARIZAÇÃO (PRIORIDADE MÁXIMA)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  for (const [_, domain] of Object.entries(CANONICAL_DOMAINS)) {
    for (const alias of domain.aliases) {
      if (hasWord(p, alias)) {
        return domain[lang] || domain['PT'];
      }
    }
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
    return "I could not confidently identify the specific topic of your question. Could you please clarify if you are asking about Visas (D1, Job Seeker, D7, CPLP), AIMA Residence Permits, NIF/NISS, or Portuguese Nationality?\n[view:HOME:Explore MIRA Modules]";
  } else if (lang === 'ES') {
    return "No pude identificar con seguridad el tema específico de tu consulta. ¿Podrías aclarar si te refieres a Visados (D1, Búsqueda de Trabajo, D7, CPLP), Residencia en AIMA, NIF/NISS o Nacionalidad Portuguesa?\n[view:HOME:Explorar Módulos MIRA]";
  } else if (lang === 'FR') {
    return "Je n'ai pas pu identifier avec certitude le sujet précis de votre question. Pourriez-vous préciser s'il s'agit de Visas (D1, Recherche d'emploi, D7, CPLP), Titre de Séjour AIMA, NIF/NISS ou Nationalité Portugaise ?\n[view:HOME:Explorer les Modules MIRA]";
  }

  return "Não consegui identificar com segurança o tema específico da tua pergunta. Podes esclarecer se estás a perguntar sobre Vistos (D1, Procura de Trabalho, D7, CPLP), Título de Residência AIMA, NIF/NISS ou Nacionalidade Portuguesa?\n[view:HOME:Explorar Módulos do MIRA]";
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

    // ⚡ Telemetria técnica interna (namespace próprio - nunca ai_query)
    try { analytics.track('system_benchmark', 'system', 'chat', { promptLength: p.length }); } catch (e) {}

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

    /**
     * Compacta o histórico para máx. 8 turnos selectivos:
     * - Sempre inclui os últimos 4 turnos
     * - Dos restantes, inclui apenas turnos com factos-chave não redundantes
     */
    const compactHistory = (history: any[]): any[] => {
      if (!history || history.length <= 8) return history;

      const recent = history.slice(-4);
      const older = history.slice(0, -4);

      const factKeywords = [
        'enfermeira', 'enfermeiro', 'médico', 'médica', 'engenheiro', 'professor',
        'filho', 'filhos', 'filha', 'família', 'cônjuge', 'marido', 'esposa',
        'brasileiro', 'brasileira', 'ucraniano', 'ucraniana', 'cabo-verdiano',
        'lisboa', 'porto', 'braga', 'coimbra', 'faro', 'aveiro',
        'nif', 'niss', 'sns', 'aima', 'visto', 'autorização', 'residência',
        'nurse', 'doctor', 'engineer', 'family', 'children',
      ];

      const recentContent = recent.map(h => (h.content || '')).join(' ').toLowerCase();

      const relevantOlder = older.filter(h => {
        const content = (h.content || '').toLowerCase();
        const hasKeyFact = factKeywords.some(kw => content.includes(kw));
        if (!hasKeyFact) return false;
        const mainWord = factKeywords.find(kw => content.includes(kw)) || '';
        return mainWord && !recentContent.includes(mainWord);
      }).slice(-4);

      return [...relevantOlder, ...recent];
    };

    const safeBtoa = (str: string) => {
      try {
        return btoa(unescape(encodeURIComponent(str)));
      } catch (e) {
        return encodeURIComponent(str).substring(0, 100).replace(/%/g, '_');
      }
    };

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
    } else if (action === 'translate') {
      console.warn(`⚠️ [MIRA TRANSLATE] HTTP ${response.status} na tradução`);
      return {
        text: '',
        source: 'local_fallback',
        success: false,
        version: 'TRANSLATE_FAILED',
        hydration: 0,
        perf: '0ms'
      };
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

    if (action === 'translate') {
      return { 
        text: '', 
        source: 'local_fallback' as const,
        success: false, 
        version: 'TRANSLATE_ERROR', 
        hydration: 1, 
        perf: '0ms' 
      };
    }

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

const safeBtoa = (str: string) => {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch (e) {
    return encodeURIComponent(str).substring(0, 100).replace(/%/g, '_');
  }
};

/**
 * TRADUTOR SOBERANO MIRA (CACHE GLOBAL PERSISTENTE + GEMINI + FALLBACK GTX)
 */
export const autoTranslateText = async (text: string, targetLang: string) => {
  if (!text || !text.trim()) return text;
  
  const normLang = (targetLang || 'PT').toUpperCase().split('-')[0];
  if (normLang === 'PT') return text;

  const trimmedText = text.trim();
  const cacheKey = `mira_trans_${safeBtoa(trimmedText.substring(0, 100))}_${normLang}`;
  
  // Helper de validação anti-corrupção
  const isValidTranslation = (candidate: string): boolean => {
    if (!candidate || !candidate.trim() || candidate.trim() === trimmedText) return false;
    const lower = candidate.toLowerCase();
    return !lower.includes("could not") && 
           !lower.includes("consegui identificar") && 
           !lower.includes("pude identificar") && 
           !lower.includes("pas pu identifier") &&
           !lower.includes("gemini api error") &&
           !lower.includes("quota_exceeded") &&
           !lower.includes("estamos a trabalhar") &&
           !lower.includes("explore mira") &&
           !lower.includes("explorar módulos") &&
           !lower.includes("aviso legal") &&
           !lower.includes("disclaimer");
  };

  // 1. Verificar cache em memória na sessão (sessionStorage)
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached && isValidTranslation(cached)) {
      return cached;
    }
  } catch (_) {}

  // 2. Verificar CACHE GLOBAL no Supabase (SELECT público direto via RLS)
  try {
    const { data: dbRow } = await supabase
      .from('translation_cache')
      .select('translated_text')
      .eq('original_text', trimmedText)
      .eq('target_language', normLang)
      .maybeSingle();

    if (dbRow && dbRow.translated_text && isValidTranslation(dbRow.translated_text)) {
      const result = dbRow.translated_text.trim();
      try {
        sessionStorage.setItem(cacheKey, result);
      } catch (_) {}
      return result;
    }
  } catch (_) {
    // Falha silenciosa de rede no Supabase, continua para o Gateway
  }

  // 3. Solicitar tradução ao Gateway Backend (/api/chat) que traduz e persiste no Supabase
  try {
    const apiUrl = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001');
    const res = await fetch(`${apiUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'translate',
        prompt: trimmedText,
        language: normLang
      })
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data && data.text && isValidTranslation(data.text)) {
        const result = data.text.trim();
        try {
          sessionStorage.setItem(cacheKey, result);
        } catch (_) {}
        return result;
      }
    }
  } catch (e) {
    console.warn('🔄 [MIRA] Gateway indisponível para tradução, a tentar fallback client-side...');
  }

  // 4. Fallback Client-side de Último Recurso: Google GTX Public Translation Endpoint
  try {
    const langCode = normLang.toLowerCase() === 'br' ? 'pt' : normLang.toLowerCase();
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${langCode}&dt=t&q=${encodeURIComponent(trimmedText)}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      if (data && data[0] && Array.isArray(data[0])) {
        const translatedSegments = data[0].map((segment: any) => segment[0]).filter(Boolean).join('');
        if (isValidTranslation(translatedSegments)) {
          const result = translatedSegments.trim();
          try {
            sessionStorage.setItem(cacheKey, result);
          } catch (_) {}
          return result;
        }
      }
    }
  } catch (err) {
    console.error('🚨 [MIRA] Todos os métodos de tradução falharam:', err);
  }

  // 5. Preservar texto original em caso de falha de todos os motores
  return text;
};

// Interface Legada para Compatibilidade (Se necessário em outros componentes)
export const generateAssistantResponse = generateAssistantResponseV45;

export const generateSpeech = async (text: string, language: string) => { return null; };
