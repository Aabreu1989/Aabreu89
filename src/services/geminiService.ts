const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ""; 

import { createClient } from '@supabase/supabase-js';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 🛡️ [MIRA V3.1M] LOCAL KNOWLEDGE BASE - Funciona SEM API (Custo €0)
const MIRA_LOCAL_KB: Record<string, string> = {
  'nif': 'O NIF (Número de Identificação Fiscal) é o teu número de contribuinte em Portugal. Pedes nas Finanças (Portal das Finanças ou presencialmente), gratuitamente, com o passaporte. É obrigatório para trabalhar, abrir conta bancária e assinar contratos.',
  'niss': 'O NISS (Número de Identificação da Segurança Social) é obtido através do portal da Segurança Social Direta ou presencialmente. Precisas de contrato de trabalho ou declaração de atividade. É necessário para descontar e aceder a subsídios.',
  'visto': 'ATUALIZAÇÃO LEGISLATIVA PARLAMENTAR 2025/2026: A Lei n.º 61/2025 e o Decreto-Lei n.º 37-A/2024 aprovaram o fim definitivo das Manifestações de Interesse (Art. 88.º/89.º). Agora é OBRIGATÓRIO obter visto no Consulado Português do país de origem antes de viajar para Portugal (Vistos D1, D2, D3, D7, D8 ou Visto para Procura de Trabalho). Entrar como turista para regularizar em Portugal foi EXTINTO por lei.',
  'vistos': 'ATUALIZAÇÃO LEGISLATIVA PARLAMENTAR 2025/2026: A Lei n.º 61/2025 e o Decreto-Lei n.º 37-A/2024 aprovaram o fim definitivo das Manifestações de Interesse (Art. 88.º/89.º). Agora é OBRIGATÓRIO obter visto no Consulado Português do país de origem antes de viajar para Portugal (Vistos D1, D2, D3, D7, D8 ou Visto para Procura de Trabalho). Entrar como turista para regularizar em Portugal foi EXTINTO por lei.',
  'parlamento': 'O Parlamento Português aprovou alterações estruturais à Lei de Estrangeiros: 1. Extinção das Manifestações de Interesse (Art. 88/89); 2. Exigência obrigatória de visto prévio obtido no consulado de origem; 3. Reformulação do Visto de Procura de Trabalho com pré-validação empresarial; 4. Novas regras de Reagrupamento Familiar com tempo de residência prévia e prova estrita de alojamento; 5. Descentralização judicial das ações contra a AIMA pelos tribunais administrativos de todo o país.',
  'lei': 'As últimas alterações à Lei de Estrangeiros aprovadas no Parlamento estabelecem que NENHUM estrangeiro pode regularizar-se a partir de estatuto de turista em Portugal. É obrigatória a instrução do visto no posto consular do país de residência legal antes da viagem.',
  'cplp': 'VISTOS E RESIDÊNCIA CPLP (Acordo de Mobilidade): A concessão da Autorização de Residência CPLP mantém-se ativa mas exige apresentação de Visto Consular emitido no país de origem ou agendamento oficial. Os cidadãos CPLP beneficiam de isenção de taxas de visto e dispensam apresentação de comprovativo de meios quando apoiados por termo de responsabilidade.',
  'residencia': 'Para obter residência legal: 1. Obtém o visto adequado no Consulado do teu país de origem. 2. Viaja para Portugal com visto válido. 3. Agenda na AIMA via portal aima.gov.pt para emitir o Título de Residência. Regularizar-se em território nacional como turista foi extinto pelas reformas do Parlamento.',
  'aima': 'A AIMA (Agência para a Integração, Migrações e Asilo) gere todos os processos de imigração. Com as leis aprovadas em 2025/2026, a AIMA disponibilizou o Portal de Renovações Online para cartões permanentes e UE, e o Governo descentralizou os processos judiciais pelos tribunais do país para acelerar as pendências.',
  'sns': 'Para aceder ao SNS (Serviço Nacional de Saúde), registas-te no Centro de Saúde da tua área com o passaporte e comprovativo de morada. Tens direito a médico de família e urgências.',
  'emprego': 'Na secção de Emprego do MIRA temos 5.326 vagas de emprego ativas sincronizadas em tempo real com portais como IEFP, Net-Empregos, Sapo Emprego e Turismo de Portugal. Podes filtrar por categoria, localidade e candidatura direta.',
  'vagas': 'A plataforma MIRA disponibiliza 5.326 vagas de emprego ativas em Portugal em diversas áreas (Hotelaria, Restauração, Construção, TI, Saúde, Serviços e Administração).',
  'curso': 'Na secção de Formação temos 156 cursos de formação gratuitos e certificados pelo IEFP e DGES / Passaporte Qualifica.',
  'cursos': 'Na secção de Formação temos 156 cursos de formação gratuitos e certificados pelo IEFP e DGES / Passaporte Qualifica.',
  'serviço': 'No mapa de Serviços Locais encontras 238 pontos de apoio oficiais ao imigrante em Portugal (CNAIM, CLAIM, Balcões AIMA e Lojas do Cidadão).',
  'servicos': 'No mapa de Serviços Locais encontras 238 pontos de apoio oficiais ao imigrante em Portugal (CNAIM, CLAIM, Balcões AIMA e Lojas do Cidadão).',
  'comunidade': 'A Comunidade MIRA reúne 999+ membros ativos, onde podes partilhar dúvidas, participar em debates, consultar publicações verificadas e ganhar selos de conquista.',
  'selos': 'Os Selos MIRA reconhecem o contributo dos membros: Pioneiro, Conta Verificada, Curador, Mestre dos Documentos, Utilizador Exemplar, Sentinela, Especialista em Leis, Mentor de Emprego e Coração da Comunidade. Os Administradores possuem todos os selos ativos!',
  'medalhas': 'Os Selos e Medalhas MIRA reconhecem o contributo dos membros: Pioneiro, Conta Verificada, Curador, Mestre dos Documentos, Utilizador Exemplar, Sentinela, Especialista em Leis, Mentor de Emprego e Coração da Comunidade. Os Administradores possuem todos os selos ativos!',
  'irs': '📑 DECLARAÇÃO DE IRS EM PORTUGAL & TRABALHO NO ESTRANGEIRO:\n\n1. OBRIGAÇÃO DE DECLARAR:\nSe auferes rendimentos de fonte portuguesa (trabalho dependente Cat A, recibos verdes Cat B, pensões Cat H ou rendimentos prediais Cat F), tens a obrigação de declarar IRS em Portugal, mesmo que estejas a residir noutro país.\n\n2. NÃO RESIDENTES FISCAIS:\n- Se a tua residência fiscal é noutro país, deves manter a morada fiscal atualizada no Portal das Finanças (e nomear Representante Fiscal se residires fora da UE/EEE).\n- Os rendimentos auferidos em Portugal são declarados no Modelo 3 com os anexos correspondentes (Anexo A/B e Anexo J para rendimentos internacionais).\n\n3. CONVENÇÃO PARA EVITAR A DUPLA TRIBUTAÇÃO (CDT):\nPortugal possui acordos bilaterais de dupla tributação com mais de 80 países. Deves submeter o formulário RFI (Mod. 21-RFI) junto da Autoridade Tributária para comprovar a residência fiscal no outro país e beneficiar de isenção ou retenção reduzida, evitando pagar imposto duas vezes pelo mesmo valor.\n\n4. PRAZOS LEGAIS:\nA declaração de IRS (Modelo 3) submete-se anualmente entre 1 de Abril e 30 de Junho no Portal das Finanças.\n\n5. FERRAMENTAS NO MIRA:\nPodes utilizar a nossa Calculadora de IRS e o Guia Completo da Jornada de IRS para simulares a retenção e o imposto final, bem como descarregar a minuta oficial de Reclamação Graciosa IRS.\n[view:SIMULATORS:Calculadora de IRS]',
  'calculadora': 'No MIRA encontras ferramentas e calculadoras para IRS, Simulação de Reforma/Aposentadoria e Custo de Vida em Portugal.',
  'minutas': 'No MIRA podes gerar minutas e modelos oficiais de documentos em PDF para NIF, NISS, AIMA e contratos de arrendamento.',
  'documentos': 'Na secção de Documentos podes descarregar e gerar minutas oficiais em PDF (pedidos NIF, NISS, Agendamento AIMA, declarações de alojamento e contratos).',
  'metro': 'A Linha de Metro da Integração no teu Perfil guia-te pelos 6 passos essenciais: 1. Chegada, 2. NIF, 3. NISS, 4. SNS/Saúde, 5. Emprego e 6. Residência AIMA.',
  'asilo': 'Para pedir proteção internacional (asilo) em Portugal: diriges-te a qualquer posto de fronteira, esquadra da PSP ou GNR e declaras intenção de pedir asilo. O CPR (Conselho Português para os Refugiados: refugiados.pt) oferece apoio jurídico gratuito. O processo é gerido pela AIMA.',
  'reagrupamento': 'O Reagrupamento Familiar permite que residentes legais chamem cônjuge, filhos menores e pais. Precisas de: título de residência válido, meios de subsistência suficientes, alojamento adequado e provas do vínculo familiar. O pedido é feito na AIMA.',
  'segurança social': 'A Segurança Social Portuguesa garante acesso a subsídio de desemplego, abono de família, baixa médica e reforma. Registas-te com NIF e contrato de trabalho. Portal: seg-social.pt.',
  'banco': 'Para abrir conta bancária em Portugal precisas de: passaporte, NIF e comprovativo de morada. Bancos como a Caixa Geral de Depósitos, BPI e Millennium BCP aceitam imigrantes. Alguns permitem abertura online.',
  'contrato': 'O contrato de trabalho em Portugal pode ser a prazo (máximo 2 anos, renovável) ou sem termo (permanente). O salário mínimo em 2026 é de 870€/mês. O empregador deve inscrevê-lo na Segurança Social.',
  'documento': 'Os principais documentos para imigrantes em Portugal são: Passaporte, Título de Residência (AR), NIF, NISS e Utente do SNS. Guarda sempre cópias digitalizadas em PDF.',
  'renovar': 'A renovação do título de residência deve ser pedida na AIMA entre 90 a 30 dias antes do vencimento. Podes fazê-lo pelo portal aima.gov.pt. Tens direito a um comprovativo imediato que mantém a validade legal enquanto aguardas.',
  'cidadania': 'Para obter a Cidadania Portuguesa (Nacionalidade), os caminhos mais comuns (Lei Orgânica n.º 1/2026, em vigor desde 19 Maio 2026) são: 1. Tempo de residência legal (7 anos para cidadãos da CPLP/Brasileiros, 10 anos para outras nacionalidades. O tempo de espera não conta, só a partir da emissão do cartão); 2. Casamento/União de facto com cidadão português (3 anos); 3. Descendência (filhos ou netos de portugueses). O pedido faz-se no IRN (não na AIMA).',
  'estatuto de igualdade': 'ESTATUTO DE DIREITOS IGUAL (TRATADO DE PORTO SEGURO PT-BR):\n1. ESTATUTO DE DIREITOS CIVIS (Tipo 1): Concede aos cidadãos brasileiros com residência legal em Portugal os mesmos direitos e deveres civis que aos portugueses (acesso a concursos públicos, criação de empresas, saúde SNS, segurança social, habitação e exercício profissional em igualdade). Requisitos: Cidadania Brasileira + Título de Residência válido.\n2. ESTATUTO DE DIREITOS POLÍTICOS (Tipo 2): Concede a capacidade eleitoral ativa e passiva (direito de votar e ser votado em eleições autárquicas e legislativas em Portugal). Requisitos: Cidadania Brasileira + 3 anos de residência legal.\n3. CARTÃO DE CIDADÃO PARA ESTRANGEIRO: Após deferimento do Estatuto de Igualdade pelo IRN, o requerente pode emitir o Cartão de Cidadão físico de Estrangeiro no IRN/Conservatórias e ativar a Chave Móvel Digital (CMD) para acesso a todos os portais da administração pública de Portugal.',
  'filho': '⚠️ LEI DA NACIONALIDADE PARA FILHOS NASCIDOS EM PORTUGAL (Nova Lei 2026):\n\n📅 NASCIDO ANTES de 19 Maio 2026 (Lei Antiga — Lei 2/2020):\n✅ Direito à nacionalidade SE um dos pais residia legalmente em Portugal há pelo menos 1 ANO à data do nascimento.\n✅ Processos já submetidos antes de 19/05/2026 continuam ao abrigo da lei antiga.\n✅ Se nunca pediu, ainda pode pedir com a lei antiga se o filho nasceu antes dessa data.\n\n📅 NASCIDO APÓS 19 Maio 2026 (Nova Lei — Lei 1/2026):\n✅ Direito à nacionalidade SE um dos pais residia legalmente em Portugal há pelo menos 5 ANOS à data do nascimento.\n❌ Se o pai/mãe não cumpre os 5 anos: filho NÃO tem ainda direito à nacionalidade.\n✅ MAS a criança TEM direito a certidão de nascimento portuguesa (IRN). Não fica sem documentação.\n\nOnde tratar: IRN — irn.justica.gov.pt | nacionalidade.justica.gov.pt',
  'filho nasceu': '⚠️ LEI DA NACIONALIDADE PARA FILHOS NASCIDOS EM PORTUGAL (Nova Lei 2026):\n\n📅 NASCIDO ANTES de 19 Maio 2026 (Lei Antiga — Lei 2/2020):\n✅ Direito à nacionalidade SE um dos pais residia legalmente em Portugal há pelo menos 1 ANO à data do nascimento.\n✅ Processos já submetidos antes de 19/05/2026 continuam ao abrigo da lei antiga.\n✅ Se nunca pediu, ainda pode pedir com a lei antiga se o filho nasceu antes dessa data.\n\n📅 NASCIDO APÓS 19 Maio 2026 (Nova Lei — Lei 1/2026):\n✅ Direito à nacionalidade SE um dos pais residia legalmente em Portugal há pelo menos 5 ANOS à data do nascimento.\n❌ Se o pai/mãe não cumpre os 5 anos: filho NÃO tem ainda direito à nacionalidade.\n✅ MAS a criança TEM direito a certidão de nascimento portuguesa (IRN). Não fica sem documentação.\n\nOnde tratar: IRN — irn.justica.gov.pt | nacionalidade.justica.gov.pt',
  'filha': '⚠️ LEI DA NACIONALIDADE PARA FILHOS NASCIDOS EM PORTUGAL (Nova Lei 2026):\n\n📅 NASCIDA ANTES de 19 Maio 2026 (Lei Antiga — Lei 2/2020):\n✅ Direito à nacionalidade SE um dos pais residia legalmente em Portugal há pelo menos 1 ANO à data do nascimento.\n\n📅 NASCIDA APÓS 19 Maio 2026 (Nova Lei — Lei 1/2026):\n✅ Direito à nacionalidade SE um dos pais residia legalmente em Portugal há pelo menos 5 ANOS à data do nascimento.\n❌ Se os pais não cumprem os 5 anos: filha NÃO tem ainda direito à nacionalidade, MAS tem direito a certidão de nascimento portuguesa.\n\nOnde tratar: IRN — irn.justica.gov.pt',
  'bebe': '⚠️ NATIONALIDADE PARA BEBÊ NASCIDO EM PORTUGAL (Lei 1/2026, em vigor desde 19 Maio 2026):\nSe o bebé nasceu ANTES de 19/05/2026: a regra era que um dos pais residisse legalmente em Portugal há 1+ anos à data do nascimento.\nSe o bebé nasceu APÓS 19/05/2026: um dos pais precisa de residir legalmente em Portugal há 5+ anos à data do nascimento.\nEm ambos os casos: o bebé tem sempre direito a certidão de nascimento portuguesa no IRN.\nPara o registo do nascimento: prazo de 20 dias (maternidade colabora frequentemente no registo imediato).',
  'nascimento': '⚠️ REGISTO DE NASCIMENTO E NACIONALIDADE EM PORTUGAL (Lei 1/2026):\nTodo o bebé nascido em Portugal tem direito a certidão de nascimento portuguesa, independentemente da nacionalidade dos pais.\nPrazo de registo: 20 dias a partir do nascimento (via maternidade ou IRN).\n\nDireito à NACIONALIDADE PORTUGUESA:\n- Filho nascido ANTES de 19/05/2026: pais com 1+ ano de residência legal já chegava.\n- Filho nascido APÓS 19/05/2026: pelo menos um dos pais precisa de 5+ anos de residência legal à data do nascimento.\nSem esse requisito: criança registada em Portugal mas sem nacionalidade portuguesa por ora. Pode regressar ao IRN quando o requisito for cumprido.',
  'direitos iguais': 'ESTATUTO DE DIREITOS IGUAI (TRATADO DE PORTO SEGURO PT-BR):\n1. ESTATUTO DE DIREITOS CIVIS (Tipo 1): Concede aos cidadãos brasileiros com residência legal em Portugal os mesmos direitos e deveres civis que aos portugueses (acesso a concursos públicos, criação de empresas, saúde SNS, segurança social, habitação e exercício profissional em igualdade). Requisitos: Cidadania Brasileira + Título de Residência válido.\n2. ESTATUTO DE DIREITOS POLÍTICOS (Tipo 2): Concede a capacidade eleitoral ativa e passiva (direito de votar e ser votado em eleições autárquicas e legislativas em Portugal). Requisitos: Cidadania Brasileira + 3 anos de residência legal.\n3. CARTÃO DE CIDADÃO PARA ESTRANGEIRO: Após deferimento do Estatuto de Igualdade pelo IRN, o requerente pode emitir o Cartão de Cidadão físico de Estrangeiro no IRN/Conservatórias e ativar a Chave Móvel Digital (CMD) para acesso a todos os portais da administração pública de Portugal.',
  'cartao de cidadao': 'CARTÃO DE CIDADÃO PARA ESTRANGEIROS COM ESTATUTO DE IGUALDADE:\nO cidadão estrangeiro (brasileiro) beneficiário do Estatuto de Igualdade de Direitos Civis ou Políticos pode solicitar a emissão do Cartão de Cidadão Português para Estrangeiro num balcão do IRN / Loja do Cidadão.\n- Formato: Idêntico ao Cartão de Cidadão português, indicando "Estatuto de Igualdade" e a nacionalidade de origem.\n- Vantagens: Dá direito à ativação da Chave Móvel Digital (CMD) para autenticação em portais governamentais (Portal das Finanças, Segurança Social Direta, SNS 24, IEFP) e identificação oficial em Portugal.\n- Nota: Não atribui nacionalidade nem passaporte português, mas garante total igualdade de direitos e acesso aos serviços públicos.',
  'cartao de cidadao para estrangeiro': 'CARTÃO DE CIDADÃO PARA ESTRANGEIROS COM ESTATUTO DE IGUALDADE:\nO cidadão estrangeiro (brasileiro) beneficiário do Estatuto de Igualdade de Direitos Civis ou Políticos pode solicitar a emissão do Cartão de Cidadão Português para Estrangeiro num balcão do IRN / Loja do Cidadão.\n- Formato: Idêntico ao Cartão de Cidadão português, indicando "Estatuto de Igualdade" e a nacionalidade de origem.\n- Vantagens: Dá direito à ativação da Chave Móvel Digital (CMD) para autenticação em portais governamentais (Portal das Finanças, Segurança Social Direta, SNS 24, IEFP) e identificação oficial em Portugal.\n- Nota: Não atribui nacionalidade nem passaporte português, mas garante total igualdade de direitos e acesso aos serviços públicos.',
  'carta': 'Carta de Condução em Portugal (Legislação 2026 - Decreto-Lei 114/2026 & Decreto 4/2026): 1. Cartas CPLP (Brasil/CNH, etc.) e OCDE são válidas em Portugal sem troca obrigatória (se o titular tiver <60 anos e a carta tiver <15 anos). 2. A troca da CNH para carta portuguesa é simplificada sem exames (Taxa 30€). 3. ATENÇÃO: A condução com a carta de origem é válida APENAS em Portugal. Para conduzir noutros países da UE, a troca no IMT Online é obrigatória.',
  'condução': 'Carta de Condução em Portugal (Legislação 2026 - Decreto-Lei 114/2026 & Decreto 4/2026): 1. Cartas CPLP (Brasil/CNH, etc.) e OCDE são válidas em Portugal sem troca obrigatória (se o titular tiver <60 anos e a carta tiver <15 anos). 2. A troca da CNH para carta portuguesa é simplificada sem exames (Taxa 30€). 3. ATENÇÃO: A condução com a carta de origem é válida APENAS em Portugal. Para conduzir noutros países da UE, a troca no IMT Online é obrigatória.',
  'mira': 'Sou a MIRA — Assistente Inteligente de Direitos do Migrante. Conheço 100% de todo o ecossistema da aplicação MIRA: 5.326 vagas de emprego, 156 cursos IEFP/DGES, 238 serviços locais de apoio, minutas em PDF, calculadoras de IRS e regras da AIMA e NIF/NISS.',
  'olá': 'Olá! Sou a MIRA, a tua assistente para imigração e integração em Portugal. Conheço todas as funcionalidades da app: vagas de emprego (5.326 vagas), cursos (156 cursos), mapa de apoio (238 serviços), documentos PDF, IRS e fóruns. Como te posso ajudar hoje?',
  'ola': 'Olá! Sou a MIRA, a tua assistente para imigração e integração em Portugal. Conheço todas as funcionalidades da app: vagas de emprego (5.326 vagas), cursos (156 cursos), mapa de apoio (238 serviços), documentos PDF, IRS e fóruns. Como te posso ajudar hoje?',
  'oi': 'Oi! Sou a MIRA, a tua assistente para imigração em Portugal. Conheço 100% da aplicação MIRA (empregos, cursos, apoio local, minutas e regras AIMA). Em que posso ser útil?',
  'bom dia': 'Bom dia! Sou a MIRA, assistente de apoio ao imigrante em Portugal. Posso ajudar-te com qualquer funcionalidade da app ou dúvida de imigração. Em que te posso ajudar hoje?',
  'boa tarde': 'Boa tarde! Sou a MIRA, assistente de apoio ao imigrante em Portugal. Posso ajudar-te com qualquer funcionalidade da app ou dúvida de imigração. Como te posso ajudar?',
  'boa noite': 'Boa noite! Sou a MIRA, assistente de apoio ao imigrante em Portugal. Posso ajudar-te com qualquer funcionalidade da app ou dúvida de imigração. Como te posso ajudar?',
  'importante': 'Para quem chega a Portugal, a jornada essencial de integração segue esta ordem de importância:\n1. NIF (Número de Identificação Fiscal)\n2. Alojamento (Morada fiscal)\n3. NISS (Segurança Social para trabalhar)\n4. Conta Bancária (para receber salários)\n5. Transporte (Metro e Mobilidade)\n6. Utente SNS (Acesso à Saúde)\n7. Regularização AIMA (Vistos e Residência).\nPodes perguntar-me detalhes sobre qualquer um destes tópicos!',
  'portugal': 'Para te integrares com sucesso em Portugal, é fundamental obteres os documentos essenciais de cidadão: NIF, Alojamento/Morada, NISS, Conta Bancária, Utente SNS e a Regularização na AIMA. Como te posso ajudar hoje?',
  'passos': 'A Jornada MIRA divide-se em passos essenciais: NIF, Alojamento/Morada, NISS, Abertura de Conta, Mobilidade/Metro, Saúde (SNS), Emprego/IEFP (5.326 vagas), Regularização AIMA, Carta de Condução, Equivalências e Nacionalidade. Qual destes passos queres explorar agora?',
  'default': 'Sou a MIRA, assistente de apoio ao imigrante em Portugal. Tenho conhecimento total de todas as funcionalidades do aplicativo MIRA: 5.326 vagas de emprego, 156 cursos de formação, 238 serviços locais de apoio, gerador de minutas PDF, calculadoras de IRS e todas as regras da AIMA, NIF e NISS. Qual é a tua dúvida específica?'
};

const MIRA_LOCAL_KB_EN: Record<string, string> = {
  'nif': 'The NIF (Tax Identification Number) is your taxpayer number in Portugal. You request it at the Tax Office (Portal das Finanças or in person), free of charge, with your passport. It is mandatory to work, open a bank account, and sign contracts.',
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
  'contract': 'The employment contract in Portugal can be temporary (maximum 2 years, renewable) or permanent. The minimum wage in 2026 is €870/month. The employer must register you with Social Security.',
  'contrato': 'The employment contract in Portugal can be temporary (maximum 2 years, renewable) or permanent. The minimum wage in 2026 is €870/month. The employer must register you with Social Security.',
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

const MIRA_LOCAL_KB_ES: Record<string, string> = {
  'nif': 'El NIF (Número de Identificación Fiscal) es tu número de contribuyente en Portugal. Se solicita en Hacienda (Portal das Finanças o presencialmente) de forma gratuita presentando tu pasaporte. Es obligatorio para trabajar, abrir cuentas bancarias y firmar contratos.',
  'niss': 'El NISS (Número de Identificación de la Seguridad Social) se obtiene en el portal de la Segurança Social Direta o de forma presencial. Necesitas un contrato de trabajo o declaración de actividad. Es necesario para cotizar y acceder a subsidios.',
  'visto': 'Las reglas cambiaron en 2024-2026: La Manifestación de Interés (Art. 88/89) fue EXTINTA. Ahora es obligatorio obtener un Visado de Residencia (D1, D2, D7, D8, CPLP) o un Visado de Búsqueda de Trabajo en el Consulado de Portugal en tu país de origen antes de viajar.',
  'visado': 'Las reglas cambiaron en 2024-2026: La Manifestación de Interés (Art. 88/89) fue EXTINTA. Ahora es obligatorio obtener un Visado de Residencia (D1, D2, D7, D8, CPLP) o un Visado de Búsqueda de Trabajo en el Consulado de Portugal en tu país de origen antes de viajar.',
  'residencia': 'Para obtener residencia legal: 1. Obtén el visado en el consulado de tu país de origen. 2. Viaja a Portugal. 3. Solicita una cita en AIMA para convertir tu visado en un Permiso de Residencia. Regularizarse entrando como turista ya no está permitido por ley.',
  'aima': 'AIMA (Agencia para la Integración, Migraciones y Asilo) gestiona todos los trámites de extranjería. Tras las reformas de 2026, el enfoque está en la entrada legal con visado previo. El portal oficial aima.gov.pt es donde debes realizar el seguimiento de tu trámite.',
  'sns': 'Para acceder al SNS (Servicio Nacional de Salud), debes registrarte en el Centro de Salud de tu zona con tu pasaporte y comprobante de domicilio. Tienes derecho a médico de cabecera y urgencias.',
  'salud': 'Para acceder al SNS (Servicio Nacional de Salud), debes registrarte en el Centro de Salud de tu zona con tu pasaporte y comprobante de domicilio. Tienes derecho a médico de cabecera y urgencias.',
  'empleo': 'Para buscar trabajo en Portugal: regístrate en el IEFP (iefp.pt), utiliza net-empregos.pt, infojobs.pt o LinkedIn. Con contrato de trabajo, el empleador te inscribe en la Seguridad Social.',
  'trabajo': 'Para buscar trabajo en Portugal: regístrate en el IEFP (iefp.pt), utiliza net-empregos.pt, infojobs.pt o LinkedIn. Con contrato de trabajo, el empleador te inscribe en la Seguridad Social.',
  'asilo': 'Para solicitar protección internacional (asilo) en Portugal: acude a cualquier puesto fronterizo, comisaría de la PSP o puesto de la GNR y declara tu intención. El CPR (Consejo Portugués para los Refugiados: refugiados.pt) ofrece apoyo jurídico gratuito. El trámite lo gestiona AIMA.',
  'reagrupamento': 'El Reagrupamiento Familiar permite que los residentes legales traigan a su cónyuge, hijos menores y padres. Necesitas: permiso de residencia válido, medios de subsistencia suficientes, alojamiento adecuado y pruebas de vínculo familiar. La solicitud se presenta en AIMA.',
  'reagrupación': 'El Reagrupamiento Familiar permite que los residentes legales traigan a su cónyuge, hijos menores y padres. Necesitas: permiso de residencia válido, medios de subsistencia suficientes, alojamiento adecuado y pruebas de vínculo familiar. La solicitud se presenta en AIMA.',
  'seguridad social': 'La Seguridad Social portuguesa garantiza acceso a subsidio por desempleo, asignación familiar, baja médica y jubilación. Te registras con NIF y contrato de trabajo. Portal: seg-social.pt.',
  'banco': 'Para abrir una cuenta bancaria en Portugal necesitas: pasaporte, NIF y comprobante de domicilio. Bancos como Caixa Geral de Depósitos, BPI y Millennium BCP aceptan inmigrantes. Algunos permiten la apertura en línea.',
  'contrato': 'El contrato de trabajo en Portugal puede ser temporal (máximo 2 años, renovable) o indefinido. El salario mínimo en 2026 es de 870€/mes. El empleador debe registrarte en la Seguridad Social.',
  'documento': 'Los principales documentos para inmigrantes en Portugal son: Pasaporte, Permiso de Residencia (AR), NIF, NISS y Número de Utente del SNS. Guarda siempre copias escaneadas en PDF.',
  'renovar': 'La renovación del permiso de residencia debe solicitarse en AIMA entre 90 y 30 días antes de su vencimiento. Puedes hacerlo a través del portal aima.gov.pt. Tienes derecho a un comprobante inmediato que mantiene la validez legal mientras esperas.',
  'ciudadanía': 'Para obtener la Ciudadanía Portuguesa (Nacionalidad), las vías más comunes (según la Nueva Ley de Mayo de 2026) son: 1. Tiempo de residencia legal (7 años para ciudadanos de la CPLP/brasileños, 10 años para otras nacionalidades. El tiempo de espera no cuenta, solo después de la emisión de la tarjeta); 2. Matrimonio/Unión de hecho con ciudadano portugués (3 años); 3. Descendencia (hijos o nietos de portugueses). La solicitud se realiza en el Registro Civil (IRN), no en AIMA.',
  'mira': 'Soy MIRA — Asistente Inteligente de Derechos del Migrante. Fui creada para apoyar a los inmigrantes en Portugal con información práctica y gratuita sobre documentación, empleo, salud e integración. No reemplazamos el asesoramiento jurídico profesional.',
  'hola': '¡Hola! Soy MIRA, tu asistente para cuestiones de inmigración e integración en Portugal. ¿Cómo te puedo ayudar hoy?',
  'default': 'Soy MIRA, tu asistente para inmigración e integración en Portugal. Puedo ayudarte con NIF, NISS, AIMA, visados, SNS, empleo, asilo y más. ¿Cuál es tu duda específica?'
};

const MIRA_LOCAL_KB_FR: Record<string, string> = {
  'nif': 'Le NIF (Numéro d\'Identification Fiscale) est votre numéro de contribuable au Portugal. Vous pouvez le demander gratuitement aux Finances (Portal das Finanças ou en personne) sur présentation de votre passeport. Il est obligatoire pour travailler, ouvrir un compte bancaire et signer des contrats.',
  'niss': 'Le NISS (Numéro d\'Identification de la Sécurité Sociale) s\'obtient via le portail Segurança Social Direta ou en personne. Vous devez présenter un contrat de travail ou une déclaration d\'activité. Il est nécessaire pour cotiser et bénéficier des aides.',
  'visto': 'Les règles ont changé en 2024-2026 : la Manifestation d\'Intérêt (Art. 88/89) a été ABOLIE. Il est désormais obligatoire d\'obtenir un Visa de Résidence (D1, D2, D7, D8, CPLP) ou un Visa de Recherche d\'Emploi au consulat du Portugal dans votre pays d\'origine avant de voyager.',
  'visa': 'Les règles ont changé en 2024-2026 : la Manifestation d\'Intérêt (Art. 88/89) a été ABOLIE. Il est désormais obligatoire d\'obtenir un Visa de Résidence (D1, D2, D7, D8, CPLP) ou un Visa de Recherche d\'Emploi au consulat du Portugal dans votre pays d\'origine avant de voyager.',
  'residencia': 'Pour obtenir la résidence légale : 1. Obtenez un visa au consulat de votre pays d\'origine. 2. Voyagez au Portugal. 3. Prenez rendez-vous à l\'AIMA pour convertir votre visa en Titre de Résidence. Se régulariser en entrant comme simple touriste n\'est plus permis par la loi.',
  'residence': 'Pour obtenir la résidence légale : 1. Obtenez un visa au consulat de votre pays d\'origine. 2. Voyagez au Portugal. 3. Prenez rendez-vous à l\'AIMA pour convertir votre visa en Titre de Résidence. Se régulariser en entrant comme simple touriste n\'est plus permis par la loi.',
  'aima': 'L\'AIMA (Agence pour l\'Intégration, les Migrations et l\'Asile) gère toutes les procédures d\'immigration. Après les réformes de 2026, l\'accent est mis sur l\'entrée légale avec visa préalable. Vous devez suivre votre dossier sur le portail officiel aima.gov.pt.',
  'sns': 'Pour accéder au SNS (Service National de Santé), inscrivez-vous au Centre de Santé de votre quartier avec votre passeport et un justificatif de domicile. Vous aurez droit à un médecin de famille et aux urgences.',
  'sante': 'Pour accéder au SNS (Service National de Santé), inscrivez-vous au Centre de Santé de votre quartier avec votre passeport et un justificatif de domicile. Vous aurez droit à un médecin de famille et aux urgences.',
  'santé': 'Pour accéder au SNS (Service National de Santé), inscrivez-vous au Centre de Santé de votre quartier avec votre passeport et un justificatif de domicile. Vous aurez droit à un médecin de famille et aux urgences.',
  'emploi': 'Pour chercher un emploi au Portugal : inscrivez-vous à l\'IEFP (iefp.pt), utilisez net-empregos.pt, infojobs.pt ou LinkedIn. Avec un contrat, l\'employeur vous inscrit à la Sécurité Sociale.',
  'travail': 'Pour chercher un emploi au Portugal : inscrivez-vous à l\'IEFP (iefp.pt), utilisez net-empregos.pt, infojobs.pt ou LinkedIn. Avec un contrat, l\'employeur vous inscrit à la Sécurité Sociale.',
  'asilo': 'Pour demander l\'asile au Portugal : présentez-vous à n\'importe quel poste frontière ou commissariat (PSP/GNR) et déclarez votre intention. Le CPR (Conseil Portugais pour les Réfugiés : refugiados.pt) offre une aide juridique gratuite. L\'AIMA gère le dossier.',
  'asile': 'Pour demander l\'asile au Portugal : présentez-vous à n\'importe quel poste frontière ou commissariat (PSP/GNR) et déclarez votre intention. Le CPR (Conseil Portugais pour les Réfugiés : refugiados.pt) offre une aide juridique gratuite. L\'AIMA gère le dossier.',
  'reagrupamento': 'Le Regroupement Familial permet aux résidents légaux de faire venir leur conjoint, enfants mineurs et parents. Requis : titre de séjour valide, ressources suffisantes, logement adéquat et preuves des liens familiaux. La demande se fait à l\'AIMA.',
  'regroupement': 'Le Regroupement Familial permet aux résidents légaux de faire venir leur conjoint, enfants mineurs et parents. Requis : titre de séjour valide, ressources suffisantes, logement adéquat et preuves des liens familiaux. La demande se fait à l\'AIMA.',
  'securite sociale': 'La Sécurité Sociale portugaise garantit l\'accès aux allocations chômage, familiales, maladie et retraite. Inscription avec NIF et contrat de travail. Portail : seg-social.pt.',
  'sécurité sociale': 'La Sécurité Sociale portugaise garantit l\'accès aux allocations chômage, familiales, maladie et retraite. Inscription avec NIF et contrat de travail. Portail : seg-social.pt.',
  'banco': 'Pour ouvrir un compte bancaire au Portugal, vous devez fournir : passeport, NIF et justificatif de domicile. Des banques comme Caixa Geral de Depósitos, BPI et Millennium BCP acceptent les immigrés. Certaines permettent l\'ouverture en ligne.',
  'banque': 'Pour ouvrir un compte bancaire au Portugal, vous devez fournir : passeport, NIF et justificatif de domicile. Des banques comme Caixa Geral de Depósitos, BPI et Millennium BCP acceptent les immigrés. Certaines permettent l\'ouverture en ligne.',
  'contract': 'Le contrat de travail au Portugal peut être à durée déterminée (maximum 2 ans, renouvelable) ou indéterminée. Le salaire minimum en 2026 est de 870€/mois. L\'employeur doit vous inscrire à la Sécurité Sociale.',
  'contrat': 'Le contrat de travail au Portugal peut être à durée déterminée (maximum 2 ans, renouvelable) ou indéterminée. Le salaire minimum en 2026 est de 870€/mois. L\'employeur doit vous inscrire à la Sécurité Sociale.',
  'document': 'Les principaux documents pour les immigrés au Portugal sont : Passeport, Titre de Séjour (AR), NIF, NISS et Numéro d\'Utente du SNS. Conservez toujours des copies PDF numérisées.',
  'renew': 'Le renouvellement du titre de séjour doit être demandé à l\'AIMA entre 90 et 30 days avant son expiration sur aima.gov.pt. Vous recevez un justificatif immédiat qui maintient la validité légale pendant l\'attente.',
  'renouveler': 'Le renouvellement du titre de séjour doit être demandé à l\'AIMA entre 90 et 30 jours avant son expiration sur aima.gov.pt. Vous recevez un justificatif immédiat qui maintient la validité légale pendant l\'attente.',
  'citoyenneté': 'Pour obtenir la citoyenneté portugaise (nationalité), les voies les plus courantes (selon la nouvelle loi de mai 2026) sont : 1. Durée de résidence légale (7 ans pour les citoyens de la CPLP/Brésiliens, 10 ans pour les autres) ; 2. Mariage/Union de fait avec un citoyen portugais (3 ans) ; 3. Filiation (enfants ou petits-enfants de Portugais). La demande se fait à l\'état civil (IRN), pas à l\'AIMA.',
  'mira': 'Je suis MIRA — Assistant Intelligent pour les Droits des Migrants. J\'ai été créée pour aider les immigrés au Portugal avec des informations gratuites sur les documents, l\'emploi, la santé et l\'intégration. Nous ne remplaçons pas un conseil juridique professionnel.',
  'bonjour': 'Bonjour ! Je suis MIRA, votre assistante pour les questions d\'immigration et d\'intégration au Portugal. Comment puis-je vous aider aujourd\'hui ?',
  'salut': 'Salut ! Je suis MIRA, votre assistante pour les questions d\'immigration et d\'intégration au Portugal. Comment puis-je vous aider aujourd\'hui ?',
  'default': 'Je suis MIRA, votre assistante pour l\'immigration et l\'intégration au Portugal. Je peux vous aider pour le NIF, le NISS, l\'AIMA, les visas, le SNS, l\'emploi, l\'asile et plus. Quelle est votre question ?'
};

const getMiraLocalResponse = (prompt: string, language: string = 'PT'): string | null => {
  const p = prompt.toLowerCase();
  const lang = (language || 'PT').toUpperCase();
  const kb = lang === 'EN' ? MIRA_LOCAL_KB_EN :
             lang === 'ES' ? MIRA_LOCAL_KB_ES :
             lang === 'FR' ? MIRA_LOCAL_KB_FR : MIRA_LOCAL_KB;
  
  for (const [key, response] of Object.entries(kb)) {
    if (key !== 'default' && p.includes(key)) return response;
  }
  return kb['default'] || null;
};

const safeBtoa = (str: string) => {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch (e) {
    return encodeURIComponent(str).substring(0, 100).replace(/%/g, '_');
  }
};

export const generateAssistantResponseV45 = async (prompt: string, history: any[] = [], language: string = 'PT', action: string = 'chat') => {
  try {
    if (!prompt || !prompt.trim()) return { text: "", success: true };

    console.log(`🧠 [MIRA] Ordem enviada para a Nuvem...`);

    // Organização de mensagens para manter o contexto (V2026.GOLD)
    const sanitizedHistory = (history || [])
      .filter(h => (h.content || h.text || h.message))
      .slice(-10) 
      .map(h => ({
        role: (h.role === 'assistant' || h.role === 'model') ? 'model' : 'user',
        content: (h.content || h.text || h.message || "").trim()
      }));

    // 🛡️ [SOVEREIGN V2026] CACHE DE MEMÓRIA (TOKEN SAVER)
    const cacheKey = `mira_chat_${safeBtoa(prompt.substring(0, 100))}_${language}`;
    if (action === 'chat') {
      const cachedResponse = sessionStorage.getItem(cacheKey);
      if (cachedResponse) {
        console.log('🧠 [MIRA CACHE] Resposta recuperada do histórico (custo €0, poupança de tokens)');
        return { text: cachedResponse, success: true, version: 'V2026_CACHE', hydration: 1, perf: '0ms' };
      }
    }

    const apiUrl = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001');
    const response = await fetch(`${apiUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        prompt: prompt.trim(), 
        history: sanitizedHistory,
        action, 
        language,
        userId: 'amanda_user'
      })
    });
 
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    const data = await response.json();
 
    // Retorno de Sucesso com a frase aprovada caso o motor venha vazio (ou erro de IA silencioso)
    const textFallback = language === 'EN' ? "We are working on some improvements to the chat to offer you a better experience. We will be right back!" :
                         language === 'ES' ? "Estamos trabajando en algunas mejoras en el chat para ofrecerte una mejor experiencia. ¡Volvemos pronto!" :
                         language === 'FR' ? "Nous travaillons sur quelques améliorations du chat pour vous offrir une meilleure expérience. Nous revenons très vite !" :
                         "Estamos a trabalhar em algumas melhorias no chat para te oferecer uma melhor experiência. Voltamos já!";
    
    const text = data?.text || textFallback;
 
    // 🛡️ [SOVEREIGN V2026] GUARDA NO HISTÓRICO PARA NÃO GASTAR MAIS TOKENS NESSA PERGUNTA
    if (action === 'chat' && data?.text) {
      sessionStorage.setItem(cacheKey, data.text);
    }
 
    return { 
      text, 
      success: true, 
      version: data?.v || 'V2026_GOLD', 
      hydration: data?.h || 0,
      perf: data?.p || '0ms'
    };
 
  } catch (err: any) {
    console.error("🚨 MIRA SERVICE ERROR:", err.message);
 
    // 🛡️ [V3.1M] LOCAL KB FALLBACK - Usar apenas se a chamada à API falhar
    if (action === 'chat') {
      const localAnswer = getMiraLocalResponse(prompt, language);
      if (localAnswer) {
        console.log('🧠 [MIRA LOCAL KB] Fallback para a base de conhecimento local (servidor offline/erro)');
        return { 
          text: localAnswer, 
          success: true, 
          version: 'V3.1M_LOCAL_FALLBACK', 
          hydration: 1, 
          perf: '0ms' 
        };
      }
    }
 
    const textFallback = language === 'EN' ? "We are working on some improvements to the chat to offer you a better experience. We will be right back!" :
                         language === 'ES' ? "Estamos trabajando en algunas mejoras en el chat para ofrecerte una mejor experiencia. ¡Volvemos pronto!" :
                         language === 'FR' ? "Nous travaillons sur quelques améliorations du chat pour vous offrir une meilleure expérience. Nous revenons très vite !" :
                         "Estamos a trabalhar em algumas melhorias no chat para te oferecer uma melhor experiência. Voltamos já!";
 
    // Retorno de Erro Amigável (Evita ecrã branco e mantém a dignidade da plataforma)
    return { 
      text: textFallback, 
      success: false 
    };
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