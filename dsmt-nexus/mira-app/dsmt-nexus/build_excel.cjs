const ExcelJS = require('exceljs');
const path = require('path');

async function createNexusExcel() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Nexus AI';
  workbook.created = new Date();

  // ABA 1: BASE DE DADOS
  const baseSheet = workbook.addWorksheet('Base de Dados', { views: [{ state: 'frozen', ySplit: 1 }] });
  
  baseSheet.columns = [
    { header: 'ID', key: 'id', width: 5 },
    { header: 'Stakeholder', key: 'nome', width: 35 },
    { header: 'Tipo', key: 'tipo', width: 15 },
    { header: 'Papel SBCE', key: 'papel', width: 15 },
    { header: 'Contato Principal', key: 'contato', width: 25 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'Influência (1-5)', key: 'inf', width: 15 },
    { header: 'Exposição (1-5)', key: 'exp', width: 15 },
    { header: 'Urgência (1-5)', key: 'urg', width: 15 },
    { header: 'Risco/Bloqueio (1-5)', key: 'risco', width: 20 },
    { header: 'SCORE PRIORIDADE', key: 'score', width: 20 },
    { header: 'Estágio Jornada', key: 'jornada', width: 20 },
    { header: 'Próxima Ação', key: 'acao', width: 30 },
    { header: 'Owner Interno', key: 'owner', width: 20 }
  ];

  // Header styling
  baseSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  baseSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF12192D' } }; // Dark blue/black (Nexus theme)

  // Add Data
  baseSheet.addRow({
    id: 1, nome: 'Ministério de Minas e Energia', tipo: 'Instituição', papel: 'Regulador', 
    contato: 'Alexandre Silveira', email: 'contato@mme.ficticio.lgpd',
    inf: 5, exp: 5, urg: 5, risco: 2,
    jornada: 'Defensor do SBCE', acao: 'Reunião Bilateral sobre CRVE', owner: 'Equipe MF - Clima'
  });
  
  baseSheet.addRow({
    id: 2, nome: 'CNI - Confederação da Indústria', tipo: 'Instituição', papel: 'Regulado', 
    contato: 'Ricardo Alban', email: 'contato@cni.ficticio.lgpd',
    inf: 5, exp: 5, urg: 4, risco: 5,
    jornada: 'Abordado', acao: 'Reunião de alto nível sobre custo', owner: 'Equipe MF - Industria'
  });

  // Native Excel Formulas for SCORE
  for(let i = 2; i <= 50; i++) {
    // Score = Influência (G) + Exposição (H) + Urgência (I) + Risco (J)
    baseSheet.getCell(`K${i}`).value = { formula: `SUM(G${i}:J${i})` };
    baseSheet.getCell(`K${i}`).font = { bold: true };
  }

  // ABA 2: NEXUS DASHBOARD (Analysis)
  const dashSheet = workbook.addWorksheet('Nexus Dashboard Analytics');
  
  dashSheet.getCell('B2').value = "MÉTRICAS NATIVAS NEXUS AI";
  dashSheet.getCell('B2').font = { size: 16, bold: true };
  
  dashSheet.getCell('B4').value = "Total de Stakeholders:";
  dashSheet.getCell('C4').value = { formula: "COUNTA('Base de Dados'!B2:B50)" };
  
  dashSheet.getCell('B5').value = "Stakeholders Prioridade Crítica (Score >= 15):";
  dashSheet.getCell('C5').value = { formula: "COUNTIF('Base de Dados'!K2:K50, \">=15\")" };
  dashSheet.getCell('C5').font = { color: { argb: 'FFFF0000' }, bold: true };

  dashSheet.getCell('B6').value = "Alto Risco de Bloqueio (Nível 4 ou 5):";
  dashSheet.getCell('C6').value = { formula: "COUNTIF('Base de Dados'!J2:J50, \">=4\")" };

  dashSheet.getCell('B8').value = "DISTRIBUIÇÃO DO FUNIL DE JORNADA";
  dashSheet.getCell('B8').font = { bold: true };
  
  const funnelStages = ["Identificado", "Qualificado", "Priorizado", "Abordado", "Engajado", "Feedback registrado", "Aliado potencial", "Aliado ativo", "Defensor do SBCE", "Opositor", "Cético"];
  
  for(let i=0; i < funnelStages.length; i++) {
    const row = 9 + i;
    dashSheet.getCell(`B${row}`).value = funnelStages[i];
    // Count how many people in this stage
    dashSheet.getCell(`C${row}`).value = { formula: `COUNTIF('Base de Dados'!L2:L50, "${funnelStages[i]}")` };
  }

  const exportPath = path.join(__dirname, 'NEXUS_SBCE_Ultra_Master_Autonomo.xlsx');
  await workbook.xlsx.writeFile(exportPath);
  console.log(`Excel nativo autônomo criado em: ${exportPath}`);
}

createNexusExcel().catch(console.error);
