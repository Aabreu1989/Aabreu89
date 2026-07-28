const ExcelJS = require('exceljs');
const path = require('path');

async function createBeautifulExcel() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Nexus AI';
  workbook.created = new Date();

  // ABA 1: Base de Dados (Matriz Oficial)
  const baseSheet = workbook.addWorksheet('Matriz Stakeholders', { views: [{ state: 'frozen', ySplit: 1, xSplit: 2 }] });

  const columns = [
    { name: 'ID', filterButton: true },
    { name: 'Nome (Stakeholder)', filterButton: true },
    { name: 'Tipo de Registro', filterButton: true },
    { name: 'Papel no SBCE', filterButton: true },
    { name: 'Camada 1 (Esfera)', filterButton: true },
    { name: 'Camada 2 (Poder)', filterButton: true },
    { name: 'Contato Principal', filterButton: true },
    { name: 'Cargo', filterButton: true },
    { name: 'Contato Secundário', filterButton: true },
    { name: 'E-mail', filterButton: true },
    { name: 'Telefone', filterButton: true },
    { name: 'Influência (1-5)', filterButton: true },
    { name: 'Exposição (1-5)', filterButton: true },
    { name: 'Urgência (1-5)', filterButton: true },
    { name: 'Potencial Bloqueio (1-5)', filterButton: true },
    { name: 'Score Prioridade', filterButton: true },
    { name: 'Estágio da Jornada', filterButton: true },
    { name: 'Próxima Ação', filterButton: true },
    { name: 'Owner Interno', filterButton: true },
    { name: 'Data Último Contato', filterButton: true },
    { name: 'Tipo de Interação', filterButton: true },
    { name: 'Resumo Padronizado', filterButton: true },
    { name: 'Tema Principal', filterButton: true },
    { name: 'Tema Secundário', filterButton: true },
    { name: 'Atualizado Por', filterButton: true }
  ];

  const rows = [
    [
      1, 'Ministério de Minas e Energia (MME)', 'Instituição', 'Regulador', 'Federal', 'Executivo',
      'Alexandre Silveira', 'Ministro', 'Chefe de Gabinete', 'contato@mme.ficticio.lgpd', '+55 61 2032-5000',
      5, 5, 5, 2, null, 'Defensor do SBCE', 'Reunião Bilateral sobre CRVE', 'Equipe MF - Clima',
      '2026-05-01', 'Reunião Presencial', 'Alinhamento geral sobre cronograma.', 'CRVE', 'Transição Energética', 'NEXUS'
    ],
    [
      2, 'CNI - Confederação da Indústria', 'Associação', 'Regulado', 'Privado', 'Setor Produtivo',
      'Ricardo Alban', 'Presidente', 'Diretor de Sustentabilidade', 'contato@cni.ficticio.lgpd', '+55 61 3317-9000',
      5, 5, 4, 5, null, 'Abordado', 'Reunião de alto nível sobre custo', 'Equipe MF - Indústria',
      '2026-04-20', 'Call', 'Apresentação de impactos na indústria.', 'Competitividade', 'Custo de Conformidade', 'NEXUS'
    ]
  ];

  baseSheet.addTable({
    name: 'MatrizOficial',
    ref: 'A1',
    headerRow: true,
    totalsRow: false,
    style: {
      theme: 'TableStyleMedium9', // Azul corporativo clássico e limpo (Padrão Excel)
      showRowStripes: true,
    },
    columns: columns,
    rows: rows
  });

  // Ajustar larguras das colunas
  baseSheet.columns.forEach((column, i) => {
    let maxLength = 0;
    column["eachCell"]({ includeEmpty: true }, function (cell) {
      var columnLength = cell.value ? cell.value.toString().length : 10;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });
    column.width = maxLength < 15 ? 15 : maxLength + 5;
  });

  // FÓRMULA SCORE (Coluna P - Indice 16) = L + M + N + O
  for(let i = 2; i <= 50; i++) {
    baseSheet.getCell(`P${i}`).value = { formula: `SUM(L${i}:O${i})` };
    baseSheet.getCell(`P${i}`).font = { bold: true, color: { argb: 'FF000000' } };
    
    // Formatação Condicional no Score
    baseSheet.addConditionalFormatting({
      ref: `P${i}`,
      rules: [
        { type: 'cellIs', operator: 'greaterThanOrEqual', formulae: [15], style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFFC7CE' } }, font: { color: { argb: 'FF9C0006' }, bold: true } } }
      ]
    });
    
    // Validação de Dados (1 a 5)
    ['L','M','N','O'].forEach(col => {
      baseSheet.getCell(`${col}${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: ['"1,2,3,4,5"']
      };
      baseSheet.getCell(`${col}${i}`).alignment = { horizontal: 'center' };
    });

    // Validação de Estágio (Coluna Q)
    baseSheet.getCell(`Q${i}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"Identificado,Qualificado,Priorizado,Abordado,Engajado,Feedback registrado,Aliado potencial,Aliado ativo,Defensor do SBCE,Opositor,Cético"']
    };
  }

  // ABA 2: NEXUS DASHBOARD (Analytics)
  const dashSheet = workbook.addWorksheet('Nexus Analytics', { properties: { tabColor: { argb: 'FFC0000' } }});
  
  dashSheet.getCell('B2').value = "DASHBOARD E GOVERNANÇA NEXUS";
  dashSheet.getCell('B2').font = { size: 18, bold: true, color: { argb: 'FF4F81BD' } };
  
  dashSheet.getCell('B4').value = "Total de Stakeholders:";
  dashSheet.getCell('C4').value = { formula: "COUNTA('Matriz Stakeholders'!B2:B500)" };
  
  dashSheet.getCell('B5').value = "Stakeholders Prioridade Crítica (Score >= 15):";
  dashSheet.getCell('C5').value = { formula: "COUNTIF('Matriz Stakeholders'!P2:P500, \">=15\")" };
  dashSheet.getCell('C5').font = { color: { argb: 'FFFF0000' }, bold: true };

  dashSheet.getCell('B6').value = "Alto Risco de Bloqueio (Nível 4 ou 5):";
  dashSheet.getCell('C6').value = { formula: "COUNTIF('Matriz Stakeholders'!O2:O500, \">=4\")" };

  // Styling dashboard
  ['B4','B5','B6'].forEach(cell => {
    dashSheet.getCell(cell).font = { bold: true };
    dashSheet.getCell(cell).alignment = { vertical: 'middle', horizontal: 'left' };
  });

  const exportPath = path.join(__dirname, 'NEXUS_SBCE_Design_Original.xlsx');
  await workbook.xlsx.writeFile(exportPath);
  console.log(`Excel premium gerado em: ${exportPath}`);
}

createBeautifulExcel().catch(console.error);
