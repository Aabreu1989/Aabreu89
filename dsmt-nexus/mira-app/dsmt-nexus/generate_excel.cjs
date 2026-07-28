const xlsx = require('xlsx');
const path = require('path');

// Dados simulando o novo modelo com todos os campos solicitados
const stakeholders = [
  {
    "ID": "1",
    "Nome (Stakeholder)": "Ministério de Minas e Energia (MME)",
    "Tipo de Registro": "Instituição",
    "Papel no SBCE": "Regulador",
    "Camada 1": "Executivo Federal",
    "Camada 2": "Administração Direta",
    "Camada 3": "MME",
    "Camada 4": "Secretaria Executiva",
    "Camada 5": "",
    "Contato Principal": "Alexandre Silveira",
    "Cargo": "Ministro",
    "Contato Secundário": "Chefe de Gabinete",
    "E-mail": "contato@mme.ficticio.lgpd",
    "Telefone": "+55 61 2032-5000",
    "Influência Institucional (1-5)": 5,
    "Exposição ao SBCE (1-5)": 5,
    "Legitimidade (1-5)": 5,
    "Urgência (1-5)": 5,
    "Mobilização (1-5)": 5,
    "Abertura ao Diálogo (1-5)": 4,
    "Sensibilidade Política (1-5)": 5,
    "Risco/Bloqueio (1-5)": 2,
    "Score Prioridade": 22, // Exemplo de score pré-calculado (Infl + Exp + Urg + Risco) = 5+5+5+2 = 17
    "Posição Atual": "Aliado Ativo",
    "Jornada (Estágio)": "Defensor do SBCE",
    "Estratégia": "Manutenção de Alinhamento de Alto Nível",
    "Próxima Ação Recomendada": "Reunião Bilateral sobre CRVE",
    "Objetivo da Ação": "Validar métricas de emissões do setor elétrico",
    "Owner Interno": "Equipe MF - Clima",
    "Data Último Contato": "2026-05-01",
    "Tipo de Interação": "Reunião Presencial",
    "Resumo Padronizado (Último Contato)": "Alinhamento geral sobre cronograma de emissões.",
    "Próximo Contato Previsto": "2026-05-15",
    "Frequência Recomendada": "Quinzenal",
    "Tema SBCE Principal": "CRVE",
    "Tema SBCE Secundário": "Transição Energética",
    "Janela Regulatória": "Q3 2026",
    "Participação em Eventos": "COP30 Preparatório",
    "Data de Atualização": "2026-05-06",
    "Atualizado Por": "Nexus AI",
    "Fonte da Informação": "Diário Oficial"
  },
  {
    "ID": "2",
    "Nome (Stakeholder)": "Banco Mundial",
    "Tipo de Registro": "Instituição",
    "Papel no SBCE": "Legitimador",
    "Camada 1": "Organizações Internacionais",
    "Camada 2": "Financeiras",
    "Camada 3": "World Bank",
    "Camada 4": "",
    "Camada 5": "",
    "Contato Principal": "Mariana Villa Nova",
    "Cargo": "Especialista em Carbono",
    "Contato Secundário": "",
    "E-mail": "contato@banco-mundial.ficticio.lgpd",
    "Telefone": "",
    "Influência Institucional (1-5)": 5,
    "Exposição ao SBCE (1-5)": 4,
    "Legitimidade (1-5)": 5,
    "Urgência (1-5)": 4,
    "Mobilização (1-5)": 4,
    "Abertura ao Diálogo (1-5)": 5,
    "Sensibilidade Política (1-5)": 2,
    "Risco/Bloqueio (1-5)": 1,
    "Score Prioridade": 14,
    "Posição Atual": "Aliado Ativo",
    "Jornada (Estágio)": "Aliado ativo",
    "Estratégia": "Parceria Técnica e Financiamento",
    "Próxima Ação Recomendada": "Publicação de estudo conjunto",
    "Objetivo da Ação": "Legitimar a metodologia SBCE",
    "Owner Interno": "Equipe MF - Internacional",
    "Data Último Contato": "2026-04-20",
    "Tipo de Interação": "Email",
    "Resumo Padronizado (Último Contato)": "Revisão do rascunho do relatório MRV.",
    "Próximo Contato Previsto": "2026-05-20",
    "Frequência Recomendada": "Mensal",
    "Tema SBCE Principal": "MRV",
    "Tema SBCE Secundário": "Mercados Globais",
    "Janela Regulatória": "",
    "Participação em Eventos": "",
    "Data de Atualização": "2026-05-06",
    "Atualizado Por": "Nexus AI",
    "Fonte da Informação": "Cooperação Técnica"
  }
];

const generateExcel = () => {
  const wb = xlsx.utils.book_new();
  
  // Sheet 1: Master Base
  const wsMaster = xlsx.utils.json_to_sheet(stakeholders);
  xlsx.utils.book_append_sheet(wb, wsMaster, "Nexus_SBCE_Master");

  // Format header row
  const headerRange = xlsx.utils.decode_range(wsMaster['!ref']);
  for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
    const address = xlsx.utils.encode_col(C) + "1";
    if (!wsMaster[address]) continue;
    wsMaster[address].s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "4F81BD" } }
    };
  }

  // Sheet 2: KPIs & Governance
  const kpis = [
    { "Indicador": "% de registros com contato completo", "Como Medir": "registros com pessoa + cargo + e-mail", "Objetivo": "Melhorar acionabilidade" },
    { "Indicador": "% de registros com papel no SBCE definido", "Como Medir": "registros com campo funcional preenchido", "Objetivo": "Melhorar segmentação" },
    { "Indicador": "% de registros com owner interno definido", "Como Medir": "registros com responsável", "Objetivo": "Melhorar gestão do relacionamento" },
    { "Indicador": "% de registros com score de prioridade", "Como Medir": "registros com critérios preenchidos", "Objetivo": "Melhorar priorização" },
    { "Indicador": "Taxa de conversão da jornada", "Como Medir": "% que passam de um estágio a outro", "Objetivo": "Medir avanço real" }
  ];
  const wsKPIs = xlsx.utils.json_to_sheet(kpis);
  xlsx.utils.book_append_sheet(wb, wsKPIs, "Governança_e_Indicadores");

  const exportPath = path.join(__dirname, 'NEXUS_SBCE_Master_V2_Completo.xlsx');
  xlsx.writeFile(wb, exportPath);
  console.log(`Excel file generated successfully at: ${exportPath}`);
};

generateExcel();
