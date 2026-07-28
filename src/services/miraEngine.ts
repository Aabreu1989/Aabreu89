/**
 * 🏛️ [MIRA SOVEREIGN ORACLE V110.0]
 * Cérebro Local Expandido: Mais vocabulário e profundidade estratégica.
 */

const KNOWLEDGE_BASE = [
  {
    keywords: ["manifestação", "interesse", "portal"],
    topic: "Extinção da Manifestação de Interesse (MI)",
    content: "A Manifestação de Interesse foi EXTINTA. Já não é possível regularizar-se entrando como turista para trabalhar. Agora é obrigatório obter um visto no consulado do país de origem. Processos submetidos antes de Junho 2024 continuam válidos e devem ser acompanhados no portal aima.gov.pt."
  },
  {
    keywords: ["artigo 92", "turista", "estudante"],
    topic: "Legalização via Artigo 92",
    content: "Sim, é possível. Alguém que entrou como turista e excedeu os prazo pode legalizar-se pelo Artigo 92 com prova de matrícula em ensino reconhecido."
  },
  {
    keywords: ["agendamento", "aima", "vagas", "tentando", "meses", "como", "conseguir", "monitoro", "monitorar", "servir", "serve", "site", "portal"],
    topic: "Estratégia de Monitoramento AIMA",
    content: "Monitorar o portal AIMA (aima.gov.pt) serve para capturar 'vagas de desistência' ou novos slots de agendamento que abrem inesperadamente. Como fazer: 1. Aceder ao site logo às 08h00. 2. Fazer Login na tua área pessoal. 3. Carregar a página de agendamentos e fazer 'Refresh' (F5) periodicamente. A paciência estratégica é o que separa quem consegue de quem desiste."
  },
  {
    keywords: ["nif", "senha", "morada fiscal"],
    topic: "Os 3 Pilares do NIF",
    content: "1. Senha Online (pedir no ato). 2. Número de Identificação Fiscal. 3. Validação da Morada Fiscal: evita custos abusivos e garante a soberania fiscal."
  },
  {
    keywords: ["reagrupamento", "família"],
    topic: "Reagrupamento Familiar",
    content: "Direito fundamental. Solicitado via portal AIMA. Requer prova de parentesco e condições de subsistência."
  },
  {
    keywords: ["cplp", "prorrogação", "validade", "junho"],
    topic: "Autorizações de Residência CPLP — Lei 2026",
    content: "As Autorizações de Residência CPLP seguem agora o regime geral. A prorrogação especial que vigorou até meados de 2025 já terminou. Os titulares de AR CPLP devem verificar a validade do seu título e iniciar a renovação com antecedência de 90 dias no portal aima.gov.pt. Para aceder à cidadania portuguesa, os cidadãos CPLP necessitam agora de 7 anos de residência legal (Nova Lei da Nacionalidade, Maio 2026)."
  },
  {
    keywords: ["nacionalidade", "tempo", "cidadania", "anos", "lei", "nova lei"],
    topic: "Nova Lei da Nacionalidade (Maio 2026)",
    content: "A nova Lei da Nacionalidade (em vigor em Portugal a partir de 19 de Maio de 2026) alterou significativamente os prazos de residência legal para acesso à cidadania. Cidadãos de países da CPLP (incluindo Brasileiros) agora necessitam de 7 anos de residência legal (antes eram 5), enquanto cidadãos de outras nacionalidades necessitam de 10 anos de residência legal (antes eram 5). Os novos prazos não têm caráter retroativo e aplicam-se a processos iniciados a partir desta data. ATENÇÃO: O tempo de espera pela aprovação do pedido deixou de contar! A nova lei exige que a contagem do tempo inicie apenas após a emissão do título de residência definitivo."
  },
  {
    keywords: ["irn", "renovação", "conservatória", "renovar"],
    topic: "Renovações no IRN",
    content: "A renovação de títulos de residência de 5 anos (Longa Duração) ou Permanentes é agora feita no IRN (Conservatórias), não na AIMA. Isto visa acelerar os processos e libertar a AIMA para casos de primeira concessão."
  },
  {
    keywords: ["visto", "procura", "trabalho", "120 dias"],
    topic: "Visto de Procura de Trabalho",
    content: "Visto de 120 dias (+60 prorrogáveis) que permite entrar em Portugal para procurar emprego legalmente. Dá direito a NIF, NISS e acesso ao IEFP logo à chegada. É a via recomendada após a extinção da Manifestação de Interesse."
  },
  {
    keywords: ["nómada", "digital", "d8", "remoto"],
    topic: "Visto Nómada Digital (D8)",
    content: "Para quem trabalha remotamente para fora de Portugal e aufere rendimentos superiores a 4 salários mínimos portugueses. Permite residência estável e acesso ao sistema de saúde."
  },
  {
    keywords: ["apostila", "haia", "validar", "documento", "estrangeiro"],
    topic: "Apostila de Haia",
    content: "Documentos emitidos fora de Portugal (como certidões de nascimento ou registos criminais) DEVEM ser apostilados no país de origem para serem aceites pelas autoridades portuguesas. Sem a Apostila, o documento não tem validade legal em Portugal."
  },
  {
    keywords: ["representante", "fiscal", "nif", "morada", "estrangeiro"],
    topic: "Representante Fiscal",
    content: "Desde Julho de 2022, a nomeação de representante fiscal é facultativa para residentes em países fora da UE/EEE, desde que adiram ao sistema de notificações eletrónicas das Finanças (Via CTT)."
  },
  {
    keywords: ["perda", "roubo", "residência", "segunda via"],
    topic: "2ª Via de Documentos",
    content: "Fazer queixa na PSP/GNR. Guardar o auto de ocorrência e agendar na AIMA para 2ª via."
  }
];

export const getSovereignLocalResponse = (prompt: string): string | null => {
  const cleanPrompt = prompt.toLowerCase();
  
  // Procura a melhor correspondência por palavras-chave
  const match = KNOWLEDGE_BASE.find(item => 
    item.keywords.some(key => cleanPrompt.includes(key))
  );

  if (match) {
    return `⚖️ [MIRA SOBERANO - ${match.topic.toUpperCase()}]:\n\n${match.content}\n\nNota: Resposta gerada via Oráculo Local (v110.0).`;
  }
  
  return null;
};
