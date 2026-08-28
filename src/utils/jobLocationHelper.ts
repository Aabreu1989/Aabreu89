// MIRA Job Location Filter: Strictly Portugal or Remote Work
// Ensures all displayed jobs are either in Portuguese territory (Districts, Açores, Madeira) or Remote/Telework.

const FOREIGN_PATTERNS = [
  // Country ISO codes in parentheses or commas (e.g. "(Guarulhos, BR)", "(Madrid, ES)", "(Houston, US)", "(São Paulo, BR)", "Guarulhos, BR")
  /[(\[,]\s*(?:[^)\]]*[,\s])?(?:BR|ES|FR|DE|IT|UK|GB|US|USA|NL|CH|BE|LU|IE|NO|SE|DK|FI|AT|PL|CZ|HU|RO|AO|MZ|CV|GW|ST|AE|QA|SA|CL|CO|MX|PE|AR|IN|CN|JP|AU|CA)\s*[)\]]/i,
  /[,\s]\b(BR|ES|FR|DE|IT|UK|GB|US|USA|NL|CH|BE|LU|IE|NO|SE|DK|FI|AT|PL|CZ|HU|RO|AO|MZ|CV|GW|ST|AE|QA|SA|CL|CO|MX|PE|AR|IN|CN|JP|AU|CA)\b\s*$/i,

  // Explicit foreign country / city destinations (for working abroad)
  /\b(holanda|pa[íi]ses\s*baixos|netherlands|amsterdam|amsterd[ãa]o|rotterdam|roterd[ãa]o|utrecht|eindhoven)\b/i,
  /\b(alemanha|germany|deutschland|berlim|berlin|munique|munich|frankfurt|hamburgo|hamburg|col[óo]nia|cologne|estugarda|stuttgart|d[üu]sseldorf)\b/i,
  /\b(su[íi][çc]a|switzerland|schweiz|genebra|geneva|gen[èe]ve|zurique|zurich|z[üu]rich|basileia|basel|lausanne|berna|bern)\b/i,
  /\b(fran[çc]a|france|paris|lyon|marseille|toulouse|nice|nantes|bordeaux|lille|strasbourg)\b/i,
  /\b(b[ée]lgica|belgium|belgique|bruxelas|brussels|bruxelles|antuerpia|antwerp|gent|li[èe]ge)\b/i,
  /\b(luxemburgo|luxembourg)\b/i,
  /\b(reino\s*unido|united\s*kingdom|\buk\b|\bgb\b|inglaterra|england|londres|london|esc[óo]cia|scotland|manchester|birmingham|liverpool|leeds|glasgow|edimburgo|edinburgh)\b/i,
  /\b(irlanda|ireland|dublin|cork|galway)\b/i,
  /\b(espanha|spain|españa|madrid|barcelona|valencia|sevilla|galiza|vigo|a\s*coru[ñn]a|bilbao|oviedo|gij[óo]n|zaragoza|m[áa]laga|alicante)\b/i,
  /\b(it[áa]lia|italy|italia|roma|mil[ãa]o|milan|turim|turin|n[áa]poles|naples|bolonha|bologna)\b/i,
  /\b(noruega|norway|oslo|bergen)\b/i,
  /\b(dinamarca|denmark|copenhaga|copenhagen)\b/i,
  /\b(su[ée]cia|sweden|estocolmo|stockholm|gotemburgo|gothenburg)\b/i,
  /\b(finl[âa]ndia|finland|hels[íi]nquia|helsinki)\b/i,
  /\b([áa]ustria|austria|viena|vienna)\b/i,
  /\b(pol[óo]nia|poland|varsovia|warsaw|crac[óo]via|krakow)\b/i,
  /\b(rep[úu]blica\s*checa|czech|praga|prague)\b/i,
  /\b(hungria|hungary|budapeste|budapest)\b/i,
  /\b(rom[êe]nia|romania|bucareste|bucharest)\b/i,
  /\b(angola|luanda|benguela|huambo|lobito)\b/i,
  /\b(mo[çc]ambique|maputo|beira|nampula)\b/i,
  /\b(cabo\s*verde|praia|mindelo)\b/i,
  /\b(s[ãa]o\s*tom[ée]|guin[ée]-bissau)\b/i,
  /\b(dubai|abu\s*dhabi|emirados|uae)\b/i,
  /\b(catar|qatar|doha|ar[áa]bia|saudi)\b/i,
  /\b(estados\s*unidos|\beua\b|\busa\b|united\s*states|new\s*york|florida|california|texas|houston|miami|chicago)\b/i,
  /\b(canad[áa]|canada|toronto|montreal|vancouver)\b/i,
  /\b(austr[áa]lia|australia|sydney|melbourne)\b/i,
  /\b(brasil|brazil|s[ãa]o\s*paulo|rio\s*de\s*janeiro|guarulhos|campinas|santos|curitiba|porto\s*alegre|belo\s*horizonte|salvador|recife|bras[íi]lia|manaus|bel[ée]m|goi[âa]nia|mogi\s*das\s*cruzes|s[ãa]o\s*jos[ée]\s*dos\s*campos|vit[óo]ria|serra|rio\s*branco|florian[óo]polis|joinville|maca[ée])\b/i,
  /\b(chile|santiago\s*de\s*chile|col[ôo]mbia|colombia|bogot[áa]|m[ée]xico|mexico|peru|lima|argentina|buenos\s*aires)\b/i,
  /\b(recrutamento\s*internacional|trabalhar\s*no\s*estrangeiro|vaga\s*no\s*estrangeiro|oportunidade\s*no\s*estrangeiro|fora\s*de\s*portugal|relocation\s*abroad|trabalho\s*no\s*exterior)\b/i,
];

/**
 * Returns true if the job indicates working abroad outside Portugal (unless remote).
 */
export function isJobOutsidePortugal(title: string = '', location: string = ''): boolean {
  const locLower = (location || '').toLowerCase();
  const titleLower = (title || '').toLowerCase();

  const isRemote = /\b(remoto|remote|teletrabalho|home\s*office)\b/i.test(locLower) || 
                   /\b(100%\s*remoto|fully\s*remote|trabalho\s*remoto|regime\s*remoto)\b/i.test(titleLower);
  
  // If explicitly remote, it is valid to work from Portugal
  if (isRemote) {
    return false;
  }

  const combined = `${title} ${location}`;
  return FOREIGN_PATTERNS.some(rx => rx.test(combined));
}

/**
 * Returns true if the job is located in Portugal or is Remote.
 */
export function isPortugalOrRemoteJob(title: string = '', location: string = ''): boolean {
  return !isJobOutsidePortugal(title, location);
}
