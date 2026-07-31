
import { jsPDF } from 'jspdf';
import { TRANSLATIONS } from './translations';

/**
 * Gerador de PDF MIRA v10.0 - Padrão de Declaração Jurídica Oficial
 * Suporte a Multilíngue (ES, FR, EN, PT) para etiquetas e campos.
 * Garante que o texto respeite rigorosamente as margens laterais.
 */
export async function generateOfficialPDF(
  templateTitle: string, 
  data: Record<string, any>, 
  language: string = 'pt'
) {
  // --- MIRA SOVEREIGN LOCK: TODOS OS DOCUMENTOS DEVEM SER EM PORTUGUÊS (OFFICIAL PT-PT) ---
  const forcedLanguage = 'pt';
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const langKey = 'PT';
  const langLower = 'pt';

  const margin = 25;
  const pageWidth = 210;
  const contentWidth = pageWidth - (margin * 2); // 160mm exatos
  let y = 35;

  // --- LOCALIZED LABELS ---
  const labels: Record<string, any> = {
    PT: {
      salutation: 'EXCELENTÍSSIMOS SENHORES,',
      i: 'Eu',
      nationality: 'de nacionalidade',
      id: 'titular do documento de identificação n.º',
      nif: 'contribuinte fiscal n.º',
      niss: 'beneficiário da Segurança Social n.º',
      resident: 'residente para todos os efeitos legais na morada sita em',
      hereby: 'venho por este meio e na melhor forma de direito, apresentar o presente requerimento de',
      extra: 'Relativamente ao campo',
      extra_decl: 'declara-se o seguinte',
      honor: 'O signatário declara, sob compromisso de honra, que os dados acima indicados são verdadeiros e assume total responsabilidade legal sobre os mesmos, em conformidade com a legislação portuguesa vigente.',
      defer: 'Pede Deferimento.',
      signature: '(Assinatura do Requerente)',
      disclaimer: 'As informações apresentadas têm caráter informativo e educativo. O MIRA não presta consultoria jurídica individual. Para aconselhamento personalizado, consulte a AIMA ou um advogado.'
    },
    ES: {
      salutation: 'EXCELENTÍSIMOS SEÑORES,',
      i: 'Yo',
      nationality: 'de nacionalidad',
      id: 'titular del documento de identificación n.º',
      nif: 'contribuyente fiscal n.º',
      niss: 'beneficiario de la Seguridad Social n.º',
      resident: 'residente para todos los efectos legales en el domicilio sito en',
      hereby: 'vengo por este medio y en la mejor forma de derecho, a presentar el presente requerimiento de',
      extra: 'En relación al campo',
      extra_decl: 'se declara lo siguiente',
      honor: 'El firmante declara, bajo compromiso de honor, que los datos arriba indicados son verdaderos y asume total responsabilidad legal sobre los mismos, de conformidad con la legislación portuguesa vigente.',
      defer: 'Pide Deferimiento.',
      signature: '(Firma del Solicitante)',
      disclaimer: 'La información presentada tiene carácter informativo e educativo. MIRA no presta asesoría jurídica individual. Para asesoramiento personalizado, consulte a la AIMA o a un abogado.'
    },
    FR: {
      salutation: 'MESDAMES, MESSIEURS,',
      i: 'Je soussigné',
      nationality: 'de nationalité',
      id: 'titulaire du document d\'identification n.º',
      nif: 'numéro d\'identification fiscale n.º',
      niss: 'bénéficiaire de la Sécurité Sociale n.º',
      resident: 'résidant à toutes fins légales à l\'adresse sise à',
      hereby: 'viens par la presente et dans la meilleure forme de droit, soumettre la présente demande de',
      extra: 'Concernant le champ',
      extra_decl: 'il est déclaré ce qui suit',
      honor: 'Le soussigné déclare, sur l\'honneur, que les données indiquées ci-dessus sont exactes et assume l\'entière responsabilité légale de celles-ci, conformément à la législation portugaise en vigueur.',
      defer: 'Je demande l\'agrément.',
      signature: '(Signature du Demandeur)',
      disclaimer: 'Les informations présentées sont fournies à titre informatif et éducatif. MIRA ne fournit pas de conseil juridique individuel. Pour un conseil personnalisé, veuillez consulter l\'AIMA ou un avocat.'
    },
    EN: {
      salutation: 'DEAR SIR/MADAM,',
      i: 'I',
      nationality: 'of nationality',
      id: 'holder of identification document No.',
      nif: 'taxpayer identification No.',
      niss: 'social security beneficiary No.',
      resident: 'residing for all legal purposes at the address located at',
      hereby: 'hereby and in the best legal form, present this request for',
      extra: 'Regarding the field',
      extra_decl: 'the following is declared',
      honor: 'The undersigned declares, under oath, that the data indicated above are true and assumes full legal responsibility for them, in accordance with current Portuguese legislation.',
      defer: 'Yours faithfully.',
      signature: '(Applicant\'s Signature)',
      disclaimer: 'The information presented is for informational and educational purposes. MIRA does not provide individual legal advice. For personalized advice, consult AIMA or a lawyer.'
    }
  };

  // --- SELECÇÃO DA LÍNGUA (PT como fallback) ---
  const L = labels[langKey] || labels.PT; 
  const T = (TRANSLATIONS as any)[langLower] || TRANSLATIONS.pt;

  // --- TÍTULO DO DOCUMENTO (Traduzido) ---
  const translatedTitle = T[templateTitle] || templateTitle;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont('times', 'bold');

  const titleLines = doc.splitTextToSize(translatedTitle.toUpperCase(), contentWidth);
  doc.text(titleLines, margin, y);
  y += (titleLines.length * 8) + 10;

  // --- SAUDAÇÃO ---
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  doc.text(L.salutation, margin, y);
  y += 12;

  y += 6;

  // --- CORPO DO TEXTO (NARRATIVA INTEGRADA) ---
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);

  const getSafe = (val: any) => {
    if (val === undefined || val === null) return '___________________________';
    const s = String(val).trim();
    return s === '' ? '___________________________' : s;
  };

  const n = getSafe(data.full_name).toUpperCase();
  const nac = getSafe(data.nationality);
  const id = getSafe(data.passport_num || data.id_number);
  const nif = getSafe(data.nif);
  const niss = getSafe(data.niss);
  const morada = getSafe(data.address);
  const city = getSafe(data.city); 

  // NARRATIVA NA LÍNGUA ESCOLHIDA
  let narrative = '';

  if (data.templateId === 'aima_audiencia_previa' || templateTitle === 'Resposta a Indeferimento (Audiência Prévia)' || templateTitle === 'aima_audiencia_previa') {
    const notifDate = data.notification_date ? getSafe(data.notification_date) : '___________________________';
    const procNum = data.process_number ? getSafe(data.process_number) : '___________________________';
    const defArgs = data.defense_arguments ? getSafe(data.defense_arguments) : '';
    const attDocs = data.attached_documents ? getSafe(data.attached_documents) : '';

    narrative = `À Direção de Serviços da Agência para a Integração, Migrações e Asilo (AIMA, I.P.)\n\n` +
      `Assunto: Pronúncia em Sede de Audiência Prévia\n` +
      `Processo N.º: ${procNum}\n\n` +
      `Eu, ${n}, de nacionalidade ${nac}, titular do documento de identificação/passaporte n.º ${id}, contribuinte fiscal n.º ${nif} e beneficiário da Segurança Social n.º ${niss}, residente para todos os efeitos legais na morada sita em ${morada}, tendo sido notificado da intenção de indeferimento do meu pedido de Autorização de Residência, notificação essa datada de ${notifDate}, venho, muito respeitosamente, apresentar a presente PRONÚNCIA EM SEDE DE AUDIÊNCIA PRÉVIA, nos termos e para os efeitos do disposto nos artigos 121.º e seguintes do Código do Procedimento Administrativo (CPA), com base nos seguintes fundamentos:\n\n` +
      `1. O signatário preenche todos os requisitos legais aplicáveis e instruiu o seu processo de boa-fé, com vista a fixar a sua residência e a exercer a sua atividade em território nacional de forma plenamente integrada e regular.\n\n` +
      `2. Com o intuito de suprir qualquer dúvida ou eventual lacuna na instrução do processo que possa ter fundamentado a intenção de indeferimento ora notificada, junta-se em anexo toda a documentação comprobatória e retificada necessária à total conformidade do pedido.\n\n` +
      (defArgs && defArgs !== '___________________________' ? `3. Adicionalmente, cumpre expor o seguinte: ${defArgs}\n\n` : '') +
      `Termos em que se requer a V. Exas. se dignem admitir a presente pronúncia e a respetiva documentação anexa, revendo-se a intenção de indeferimento notificada e procedendo-se, por conseguinte, ao deferimento do pedido de Autorização de Residência, por ser de inteira Justiça.\n\n` +
      (attDocs && attDocs !== '___________________________' ? `Documentação anexa: ${attDocs}\n\n` : '') +
      `${L.honor}`;
  } else if (data.templateId === 'business_plan_d2') {
    const bName = getSafe(data.business_name);
    const bSector = getSafe(data.business_sector);
    const bInv = getSafe(data.investment_amount);
    const bDesc = getSafe(data.business_description);
    narrative = `Declaro, para efeitos de instrução do meu pedido de Visto de Residência D2 ou Autorização de Residência para Imigrante Empreendedor, os detalhes do meu plano de negócios simplificado:\n\n` +
      `1. Nome do Projeto / Firma: ${bName}\n` +
      `2. Setor de Atividade: ${bSector}\n` +
      `3. Montante do Investimento Estimado: ${bInv}\n` +
      `4. Descrição da Atividade e Viabilidade: ${bDesc}\n\n` +
      `${L.honor}`;
  } else if (data.templateId === 'at_inicio_atividade_draft') {
    const cae = getSafe(data.cae_code);
    const earn = getSafe(data.estimated_earnings);
    const vat = getSafe(data.vat_regime);
    narrative = `Solicito e declaro perante a Autoridade Tributária e Aduaneira as informações necessárias para a preparação da Declaração de Início de Atividade:\n\n` +
      `1. Código de Atividade (CAE/CIRS Principal): ${cae}\n` +
      `2. Rendimento Anual Estimado: ${earn} €\n` +
      `3. Enquadramento de IVA pretendido: ${vat}\n\n` +
      `${L.honor}`;
  } else if (data.templateId === 'estatutos_lda_minuta') {
    const cName = getSafe(data.company_name);
    const sCap = getSafe(data.share_capital);
    const cPurpose = getSafe(data.company_purpose);
    narrative = `Apresento, para efeitos de constituição de sociedade comercial por quotas sob a designação de "${cName}", os seguintes termos estatutários base:\n\n` +
      `Artigo 1.º (Firma e Sede): A sociedade adota a denominação de ${cName} e tem a sua sede em ${morada}, concelho de ${city}.\n` +
      `Artigo 2.º (Objeto): A sociedade tem por objeto: ${cPurpose}.\n` +
      `Artigo 3.º (Capital Social): O capital social, integralmente realizado em dinheiro, é de ${sCap} euros e corresponde à soma das quotas dos sócios.\n` +
      `Artigo 4.º (Gerência): A gerência e representação da sociedade será exercida pelos gerentes nomeados.\n\n` +
      `${L.honor}`;
  } else if (data.templateId === 'at_reclamacao_graciosa_irs') {
    const taxYr = getSafe(data.tax_year);
    const assessNum = getSafe(data.assessment_number);
    const errDesc = getSafe(data.error_description);
    narrative = `Venho, nos termos e para os efeitos do disposto no artigo 68.º e seguintes do Código de Procedimento e de Processo Tributário (CPPT), apresentar RECLAMAÇÃO GRACIOSA contra a liquidação de IRS n.º ${assessNum}, referente ao ano fiscal de ${taxYr}, com base nos seguintes fundamentos:\n\n` +
      `1. O reclamante detetou um erro na liquidação emitida pela Autoridade Tributária, concretamente: ${errDesc}.\n` +
      `2. Nestes termos, requer-se a V. Exas. a revisão do ato tributário com a consequente anulação parcial ou total da referida liquidação de imposto e o reembolso do montante indevidamente liquidado.\n\n` +
      `${L.honor}`;
  } else if (data.templateId === 'at_isencao_rnh_req') {
    const rnhCode = getSafe(data.rnh_activity_code);
    narrative = `Venho requerer à Autoridade Tributária a inscrição e enquadramento fiscal sob o regime de Residente Não Habitual (RNH), declarando para o efeito que exerço atividade de elevado valor acrescentado correspondente ao código RNH: ${rnhCode}.\n\n` +
      `${L.honor}`;
  } else if (data.templateId === 'at_alteracao_morada_estrangeiro') {
    const newAddr = getSafe(data.new_portuguese_address);
    const effDate = getSafe(data.effect_date);
    narrative = `Venho requerer a alteração da minha morada fiscal de cidadão estrangeiro não residente para a morada de residente em Portugal, sita em: ${newAddr}, com efeitos a partir de ${effDate}, com vista a regularizar a minha situação fiscal e evitar a tributação penalizadora como não residente.\n\n` +
      `${L.honor}`;
  } else if (data.templateId === 'ss_pensao_velhice_req') {
    const retAge = getSafe(data.retirement_age);
    const contYrs = getSafe(data.contributions_years);
    narrative = `Requeiro ao Instituto da Segurança Social, I.P., a concessão da Pensão de Velhice/Reforma por idade, tendo em conta que preencho as condições de idade legal (${retAge}) e totalizo ${contYrs} de descontos registados na Segurança Social em Portugal.\n\n` +
      `${L.honor}`;
  } else if (data.templateId === 'ss_contagem_tempo_estrangeiro') {
    const fSsNum = getSafe(data.foreign_ss_number);
    const fCountry = getSafe(data.foreign_country);
    const empPer = getSafe(data.employment_periods);
    narrative = `Ao abrigo dos acordos e convenções internacionais de segurança social aplicáveis (Convenção Multilateral da CPLP / Acordo Bilateral), venho requerer a contagem e agregação de tempo de descontos efetuados no estrangeiro, indicando para o efeito o meu número de identificação de segurança social estrangeiro ${fSsNum} no país ${fCountry}, correspondente aos períodos de trabalho: ${empPer}.\n\n` +
      `${L.honor}`;
  } else if (data.templateId === 'junta_declaracao_alojamento_testemunhas') {
    const hostName = getSafe(data.host_name);
    const hostNif = getSafe(data.host_nif);
    const w1Name = getSafe(data.witness_1_name);
    const w1Nif = getSafe(data.witness_1_nif);
    const w2Name = getSafe(data.witness_2_name);
    const w2Nif = getSafe(data.witness_2_nif);
    narrative = `DECLARAÇÃO DE ALOJAMENTO E COMPROVATIVO DE RESIDÊNCIA (REGULAMENTAÇÃO JUNTA DE FREGUESIA / AIMA 2026)\n\n` +
      `I. DECLARAÇÃO DO ALOJANTE / TITULAR:\n` +
      `Eu, ${hostName}, NIF ${hostNif}, residente na morada ${morada}, declaro sob compromisso de honra que o(a) Requerente ${n}, titular do passaporte/documento n.º ${id}, reside efetivamente e a título habitual na minha habitação no endereço acima indicado.\n\n` +
      `II. ATESTAMENTO DAS TESTEMUNHAS RECENSEADAS NA FREGUESIA:\n` +
      `Nós, os abaixo assinados:\n` +
      `1. ${w1Name}, NIF/CC ${w1Nif}, eleitor(a) e residente recenseado(a) nesta Junta de Freguesia;\n` +
      `2. ${w2Name}, NIF/CC ${w2Nif}, eleitor(a) e residente recenseado(a) nesta Junta de Freguesia;\n` +
      `atestamos e confirmamos expressamente perante a Junta de Freguesia e demais autoridades competentes que o(a) Requerente ${n} reside no imóvel indicado, assumindo inteira responsabilidade legal pelas presentes declarações.\n\n` +
      `${L.honor}`;
  } else {
    narrative = `${L.i}, ${n}, ${L.nationality} ${nac}, ${L.id} ${id}, ${L.nif} ${nif} e ${L.niss} ${niss}, ${L.resident} ${morada}, ${L.hereby} ${translatedTitle}.`;

    try {
      const skipFields = ['full_name', 'nationality', 'passport_num', 'id_number', 'nif', 'niss', 'address', 'city', 'templateId', 'type'];
      const extraDetails = Object.entries(data)
        .filter(([key, value]) => !skipFields.includes(key) && value)
        .map(([key, value]) => {
          const fieldKey = `field_${key}`;
          const translatedLabel = T[fieldKey] || String(key).replace(/_/g, ' ').toLowerCase();
          const valStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
          return `${L.extra} ${translatedLabel}, ${L.extra_decl}: ${valStr}.`;
        }).join(' ');

      if (extraDetails) {
        narrative += ` ${extraDetails}`;
      }
    } catch (e) {
      console.warn("MIRA PDF: Falha ao processar campos extra, continuando com narrativa base.", e);
    }

    narrative += ` ${L.honor}`;
  }

  // Renderização Resiliente com Suporte a Multipage
  try {
    const splitNarrative = doc.splitTextToSize(narrative, contentWidth);
    const lineHeight = 6;
    const pageHeight = 297;
    const bottomMargin = 40;

    for (let i = 0; i < splitNarrative.length; i++) {
        if (y > (pageHeight - bottomMargin)) {
            doc.addPage();
            y = 30; 
        }
        doc.text(splitNarrative[i], margin, y);
        y += lineHeight;
    }
    
    y += 10; 
  } catch (e) {
    console.error("MIRA PDF: Erro crítico na renderização do texto.", e);
    doc.text("Erro na renderização. Por favor, tente novamente.", margin, y);
    y += 20;
  }

  // --- FECHAMENTO ---
  if (y > 250) { doc.addPage(); y = 30; }
  doc.setFont('times', 'normal');
  doc.text(L.defer, margin, y);
  y += 10;

  doc.setFont('times', 'bold');
  doc.text(`${city.toUpperCase()}, ${new Date().toLocaleDateString('pt-PT')}`, margin, y);
  y += 20;

  // --- LINHA DE ASSINATURA ---
  doc.setDrawColor(0, 0, 0);
  doc.line(margin, y, margin + 85, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont('times', 'italic');
  doc.text(L.signature, margin, y);

  // --- RODAPÉ EM TODAS AS PÁGINAS ---
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const footerY = 282;
      
      // Linha dourada/laranja fina superior do rodapé
      doc.setDrawColor(255, 140, 0); // Laranja MIRA
      doc.setLineWidth(0.3);
      doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

      // Texto de Disclaimer
      doc.setFontSize(7);
      doc.setTextColor(130, 130, 130);
      doc.setFont('times', 'italic');
      const disclaimerLines = doc.splitTextToSize(L.disclaimer, contentWidth - 20);
      doc.text(disclaimerLines, pageWidth / 2, footerY, { align: 'center' });
      
      // Paginação e Branding
      doc.setFont('times', 'bold');
      doc.setTextColor(100, 100, 100);
      
      const brandingText = `MIRA APP © ${new Date().getFullYear()} - GERADO EM ${new Date().toLocaleDateString('pt-PT')}`;
      doc.text(brandingText, margin, footerY + 8);
      doc.text(`PÁGINA ${i} DE ${pageCount}`, pageWidth - margin, footerY + 8, { align: 'right' });
  }

  const safeTitle = (translatedTitle || 'documento_mira')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') 
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_') 
    .replace(/_+/g, '_') 
    .replace(/^_|_$/g, '') || 'documento_mira'; 

  return {
    filename: `${safeTitle}.pdf`,
    blob: doc.output('blob'),
    doc,
    save: (filename?: string) => doc.save(filename || `${safeTitle}.pdf`)
  };
}

/**
 * Gerador de PDF para Guias MIRA - Padrão Lista de Verificação (Checklist)
 */
export async function generateGuidePDF(guide: any, _language: string) {
  // --- MIRA SOVEREIGN LOCK: GUIAS DE DOWNLOAD SEMPRE EM PORTUGUÊS ---
  const language = 'pt';
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const margin = 20;
  const pageWidth = 210;
  const contentWidth = pageWidth - (margin * 2);
  let y = 30;

  const T = TRANSLATIONS.pt;

  // Header MIRA
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.setFont('times', 'bold');
  doc.text('MIRA APP V2026.GOLD - GUIA DE PROCEDIMENTOS', margin, y);
  y += 10;

  // Title
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.setFont('times', 'bold');
  const titleText = T[guide.title] || guide.title || 'Guia de Serviço';
  const title = String(titleText).toUpperCase();
  const splitTitle = doc.splitTextToSize(title, contentWidth);
  doc.text(splitTitle, margin, y);
  y += (splitTitle.length * 10) + 5;

  // Authority & Category
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  const auth = guide.authority || 'ENTIDADE';
  const cat = T[guide.category] || guide.category || 'GERAL';
  doc.text(`${String(auth).toUpperCase()} | ${String(cat).toUpperCase()}`, margin, y);
  y += 15;

  // Introduction
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  doc.setFont('times', 'normal');
  const explanation = T[guide.explanation] || guide.explanation || 'Instruções oficiais.';
  const splitExpl = doc.splitTextToSize(explanation, contentWidth);
  doc.text(splitExpl, margin, y);
  y += (splitExpl.length * 6) + 15;

  // Steps
  doc.setFontSize(12);
  doc.setFont('times', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(language.toUpperCase() === 'PT' ? 'PASSOS E DOCUMENTOS:' : (language.toUpperCase() === 'ES' ? 'PASOS Y DOCUMENTOS:' : 'ÉTAPES ET DOCUMENTS:'), margin, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont('times', 'normal');
  (guide.steps || []).forEach((step: any, index: number) => {
    if (y > 250) { doc.addPage(); y = 30; }
    doc.setDrawColor(200, 200, 200);
    doc.circle(margin + 3, y - 1, 4, 'S');
    doc.setFont('times', 'bold');
    doc.text(String(index + 1), margin + 2, y);
    
    doc.setFont('times', 'bold');
    const stepName = T[step.docName] || step.docName;
    doc.text(String(stepName).toUpperCase(), margin + 10, y);
    y += 5;
    doc.setFont('times', 'italic');
    doc.setTextColor(100, 100, 100);
    const whereLabel = language.toUpperCase() === 'PT' ? 'Onde obter' : (language.toUpperCase() === 'ES' ? 'Dónde obtener' : 'Où obtenir');
    const splitWhere = doc.splitTextToSize(`${whereLabel}: ${step.whereToGet}`, contentWidth - 10);
    doc.text(splitWhere, margin + 10, y);
    y += (splitWhere.length * 5) + 8;
    doc.setTextColor(50, 50, 50);
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const footerY = 282;
      
      // Linha dourada/laranja
      doc.setDrawColor(255, 140, 0); 
      doc.setLineWidth(0.3);
      doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

      doc.setFontSize(7);
      doc.setTextColor(130, 130, 130);
      doc.setFont('times', 'italic');
      
      const disclaimer = language.toUpperCase() === 'PT' 
        ? 'Este guia é estritamente educativo. Verifique as informações oficiais junto das entidades competentes.'
        : 'This guide is strictly educational. Verify official information with competent authorities.';
      const disclaimerLines = doc.splitTextToSize(disclaimer, contentWidth - 20);
      doc.text(disclaimerLines, pageWidth / 2, footerY, { align: 'center' });
      
      doc.setFont('times', 'bold');
      doc.setTextColor(100, 100, 100);
      const brandingText = `MIRA APP © ${new Date().getFullYear()} - GERADO EM ${new Date().toLocaleDateString('pt-PT')}`;
      doc.text(brandingText, margin, footerY + 8);
      doc.text(`PÁGINA ${i} DE ${pageCount}`, pageWidth - margin, footerY + 8, { align: 'right' });
  }

  const safeTitle = (T[guide.title] || guide.title || 'guia').toLowerCase().replace(/\s+/g, '_').substring(0, 30);
  
  return {
    filename: `mira_guia_${safeTitle}.pdf`,
    blob: doc.output('blob'),
    doc,
    save: (name?: string) => doc.save(name || `mira_guia_${safeTitle}.pdf`)
  };
}
