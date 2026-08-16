
import { UNIFIED_CATEGORIES, UnifiedCategory, WORK_TOPICS } from '../types';

/**
 * MIRA UNIVERSAL TAXONOMY ENGINE (V40.5)
 * Standardizes disparate keys from different modules into the 10 Master Categories.
 */
export const normalizeCategory = (cat: string | undefined | null, title?: string): UnifiedCategory => {
    const c = cat ? cat.toUpperCase().trim() : '';
    const t = (title || '').toUpperCase();
    
    // Check if it's null/empty or "Geral" or "Geral & Tecnologia" and we have a title to infer from
    if (!cat || c === 'GERAL & TECNOLOGIA' || c === 'CAT_TEC' || c === 'GERAL') {
        if (title) {
            // 1. Residence & Visas (AIMA, SEF, CLAIM, CNAIM, ACM, IRN, Registos, Conservatória, Visto, Regularização)
            if (
                t.includes('AIMA') || t.includes('SEF') || t.includes('IMIGRAÇ') || t.includes('IMIGRAC') || 
                t.includes('VISTO') || t.includes('CPLP') || t.includes('RESIDÊNCIA') || t.includes('RESIDENCIA') || 
                t.includes('CONSULADO') || t.includes('EMBAIXADA') || t.includes('REGULARIZA') || t.includes('LEGALIZA') ||
                t.includes('CLAIM') || t.includes('CNAIM') || t.includes('ACM') || t.includes('MIGRANTE') ||
                t.includes('IRN') || t.includes('CONSERVATÓRIA') || t.includes('CONSERVATORIA') || t.includes('REGISTO CIVIL') || t.includes('REGISTOS')
            ) {
                return "Residência & Vistos";
            }
            
            // 2. Finance & Taxes (Finanças, NIF, AT, Autoridade Tributária, Imposto)
            if (t.includes('FINANÇA') || t.includes('FINANCA') || t.includes(' NIF') || t.includes('AUTORIDADE TRIBUTÁRIA') || t.includes('AUTORIDADE TRIBUTARIA') || t.includes('IMPOSTO') || t.includes('CONTRIBUINTE') || t.includes('ALFÂNDEGA') || t.includes('ALFANDEGA')) {
                return "Finanças & Impostos";
            }
            
            // 3. Work & Career (IEFP, Emprego, Trabalho, Carreira, Vagas, Profissional)
            if (t.includes('IEFP') || t.includes('EMPREGO') || t.includes('TRABALHO') || t.includes('CARREIRA') || t.includes('VAGAS') || t.includes('PROFISSIONAL') || t.includes('RECRUTAMENTO') || t.includes('AEMIREP')) {
                return "Trabalho & Carreira";
            }
            
            // 4. Health & SNS (Saúde, SNS, Hospital, Centro de Saúde, USF, Utente, Psicólogo)
            if (
                t.includes('SAÚDE') || t.includes('SAUDE') || t.includes('SNS') || t.includes('HOSPITAL') || 
                t.includes('CENTRO DE SAÚDE') || t.includes('CENTRO DE SAUDE') || t.includes('USF') || t.includes('UTENTE') || 
                t.includes('MÉDICO') || t.includes('MEDICO') || t.includes('FARMÁCIA') || t.includes('FARMACIA') || 
                t.includes('CLÍNIC') || t.includes('CLINIC') || t.includes('TOXICODEPENDENTE') || t.includes('GRATO') ||
                t.includes('PSICÓLOGO') || t.includes('PSICOLOGO') || t.includes('PSICOLÓGICO') || t.includes('PSICOLOGICO')
            ) {
                return "Saúde & SNS";
            }
            
            // 5. Humanitarian Aid (Cruz Vermelha, Paroquial, Misericórdia, Solidariedade, Refugiado, Asilo, Humanitário, Cáritas, SOS Racismo, Pão a Pão)
            if (
                t.includes('CRUZ VERMELHA') || t.includes('PAROQUIAL') || t.includes('MISERICÓRDIA') || t.includes('MISERICORDIA') || 
                t.includes('SOLIDARIEDADE') || t.includes('REFUGIADO') || t.includes('ASILO') || t.includes('HUMANITÁRI') || t.includes('HUMANITARI') ||
                t.includes('CÁRITAS') || t.includes('CARITAS') || t.includes('REFUGEE') || t.includes('SOS RACISMO') || t.includes('PÃO A PÃO') || 
                t.includes('PAO A PAO') || t.includes('LISBON PROJECT') || t.includes('IGREJA') || t.includes('FÁBRICA') || t.includes('FABRICA') ||
                t.includes('BANCO ALIMENTAR') || t.includes('CONTRA A FOME')
            ) {
                return "Ajuda Humanitária";
            }
            
            // 6. Rights & Social Support (Segurança Social, NISS, Apoio Social, Câmaras, Juntas de Freguesia, Lojas de Cidadão, Associações)
            if (
                t.includes('SEGURANÇA SOCIAL') || t.includes('SEGURANCA SOCIAL') || t.includes(' NISS') || t.includes(' ISS') || 
                t.includes('APOIO SOCIAL') || t.includes('DIREITO') || t.includes('ADVOGAD') || t.includes('TRIBUNAL') || t.includes('PROVEDOR') ||
                t.includes('ASSOCIAÇÃO') || t.includes('ASSOCIACAO') || t.includes('ONG') || t.includes('CENTRO SOCIAL') || 
                t.includes('CÂMARA') || t.includes('CAMARA') || t.includes('MUNICÍPIO') || t.includes('MUNICIPIO') || 
                t.includes('JUNTA DE FREGUESIA') || t.includes('LOJA DO CIDADÃO') || t.includes('LOJA DO CIDADAO') || 
                t.includes('ESPAÇO DO CIDADÃO') || t.includes('ESPACO DO CIDADAO') || t.includes('CRESCER') || 
                t.includes('ADIP') || t.includes('FEMAFRO') || t.includes('DOINA') || t.includes('PROABRAÇAR') || 
                t.includes('PROABRACAR') || t.includes('SEIVA') || t.includes('AAEIF') || t.includes('OPEN GATE') ||
                t.includes('RENOVAR A MOURARIA') || t.includes('PROGRAMA ESCOLHAS') || t.includes('IPDJ') ||
                t.includes('PORTUANDO') || t.includes('CULTURAL') || t.includes('BATOTO YETU') || t.includes(' BYP')
            ) {
                return "Direitos & Apoio Social";
            }
            
            // 7. Education & Training (Escola, Universidade, Instituto, Educação, Equivalência)
            if (t.includes('ESCOLA') || t.includes('UNIVERSIDADE') || t.includes('INSTITUTO') || t.includes('EDUCAÇÃO') || t.includes('EDUCACAO') || t.includes('ENSINO') || t.includes('EQUIVALÊNCIA') || t.includes('EQUIVALENCIA') || t.includes('ESTUDO') || t.includes('CURSO') || t.includes('ACADEMIA')) {
                return "Educação & Formação";
            }
            
            // 8. Housing & Home (Habitação, Casa, Arrendamento)
            if (t.includes('HABITAÇ') || t.includes('HABITAC') || t.includes('CASA') || t.includes('ARRENDAMENTO') || t.includes('ALUGUER') || t.includes('ALOJAMENTO')) {
                return "Habitação & Casa";
            }
        }
        
        if (!cat) return "Geral & Tecnologia";
    }
    
    // 1. Residence & Visas
    if (c === 'CAT_DOC' || c.includes('RESIDÊNCIA') || c.includes('VISTO') || c.includes('REGULARIZA') || c.includes('LEGALIZA') || c.includes('AIMA') || c.includes('DOCUMENT') || c.includes('PASSAPORTE') || c.includes('EMBAIXADA') || c.includes('CONSULADO') || c.includes('SEF')) 
        return "Residência & Vistos";
    
    // 7. Rights & Social Support (Priority for Associations/ONGs)
    if (c === 'CAT_RIG' || c.includes('DIREITO') || c.includes('APOIO SOCIAL') || c.includes('APOIOS SOCIAIS') || c.includes('COMUNIDADE & APOIO') || c.includes('APOIO E EMIGRANTES') || c.includes('APOIO AO') || c.includes('SEGURANÇA') || c.includes('LEI') || c.includes('DIRETRIZ') || c.includes('CEO') || c.includes('ADVOGADO') || c.includes('JURÍDICO') || c.includes('ASSOCIAÇÃO') || c.includes('ONG')) 
        return "Direitos & Apoio Social";
    
    // 2. Work & Career
    if (c === 'CAT_JOB' || c.includes('TRABALHO') || c.includes('EMPREGO') || c.includes('CARREIRA') || c.includes('PROFISSIONAL') || c.includes('VAGAS') || c.includes('IEFP')) 
        return "Trabalho & Carreira";
    
    // 3. Health & SNS
    if (c === 'CAT_HEA' || c.includes('SAÚDE') || c.includes('SNS') || c.includes('MÉDICO') || c.includes('DOENÇA') || c.includes('HOSPITAL') || c.includes('CENTRO DE SAÚDE') || c.includes('PSICOL') || c.includes('CUIDADO') || c.includes('BEM-ESTAR') || c.includes('BEM ESTAR')) 
        return "Saúde & SNS";
    
    // 4. Finance & Taxes
    if (c === 'CAT_FIN' || c.includes('FINANÇA') || c.includes('IMPOSTO') || c.includes('NIF') || c.includes('SEGURANÇA SOCIAL') || c.includes('SS') || c.includes('BANCO') || c.includes('ECONOMIA') || c.includes('AT ')) 
        return "Finanças & Impostos";
    
    // 5. Housing & Home
    if (c === 'CAT_HOU' || c.includes('HABITAÇ') || c.includes('CASA') || c.includes('ALUGUER') || c.includes('ARRENDAMENTO') || c.includes('ALOJAMENTO') || c.includes('QUARTO')) 
        return "Habitação & Casa";
    
    // 6. Education & Training
    if (c === 'CAT_EDU' || c.includes('EDUCAÇÃO') || c.includes('FORMAÇÃO') || c.includes('CURSO') || c.includes('ESCOLA') || c.includes('UNIVERSIDADE') || c.includes('ESTUDO') || c.includes('EQUIVALÊNCIA')) 
        return "Educação & Formação";
    
    // 7. Rights & Social Support (Handled above with higher priority)
    
    // 8. Community & Stories
    if (c === 'CAT_STO' || c.includes('COMUNIDADE') || c.includes('HISTÓRIA') || c.includes('VOZES') || c.includes('RELATO') || c.includes('MIGRANTE') || c.includes('BRASIL') || c.includes('CULTURAL') || c.includes('SOCIAL')) 
        return "Comunidade & Histórias";
    
    // 9. Humanitarian Aid
    if (c === 'CAT_HUMANITARIAN' || c.includes('AJUDA') || c.includes('SOLIDARIEDADE') || c.includes('HUMANIT') || c.includes('APOIO') || c.includes('VOLUNTARIADO') || c.includes('CARIDADE') || c.includes('ALIMENTAR')) 
        return "Ajuda Humanitária";
    
    // 10. General & Tech
    if (c === 'CAT_TEC' || c.includes('GERAL') || c.includes('TECNOLOGIA') || c.includes('APP') || c.includes('MIRA') || c.includes('OUTRO') || c.includes('SITE')) 
        return "Geral & Tecnologia";

    // Direct match check
    const match = UNIFIED_CATEGORIES.find(uc => uc.toUpperCase() === c);
    if (match) return match as UnifiedCategory;

    return "Geral & Tecnologia";
};

/**
 * Returns the Lucide icon name for a category to ensure visual consistency.
 */
export const getCategoryIcon = (cat: string) => {
    const norm = normalizeCategory(cat);
    switch (norm) {
        case "Residência & Vistos": return "FileText";
        case "Trabalho & Carreira": return "Briefcase";
        case "Saúde & SNS": return "Activity";
        case "Finanças & Impostos": return "DollarSign";
        case "Habitação & Casa": return "Home";
        case "Educação & Formação": return "GraduationCap";
        case "Direitos & Apoio Social": return "ShieldCheck";
        case "Comunidade & Histórias": return "Users";
        case "Ajuda Humanitária": return "Heart";
        case "Geral & Tecnologia": return "Zap";
        default: return "Info";
    }
};

/**
 * Returns the branding color for a category.
 */
export const getCategoryColor = (cat: string) => {
    const norm = normalizeCategory(cat);
    switch (norm) {
        case "Residência & Vistos": return "#6366f1"; // Indigo
        case "Trabalho & Carreira": return "#3b82f6"; // Blue
        case "Saúde & SNS": return "#10b981"; // Emerald
        case "Finanças & Impostos": return "#f59e0b"; // Amber
        case "Habitação & Casa": return "#f43f5e"; // Rose
        case "Educação & Formação": return "#8b5cf6"; // Violet
        case "Direitos & Apoio Social": return "#06b6d4"; // Cyan
        case "Comunidade & Histórias": return "#f97316"; // Orange
        case "Ajuda Humanitária": return "#ef4444"; // Red
        case "Geral & Tecnologia": return "#64748b"; // Slate
        default: return "#94a3b8";
    }
};
/**
 * Returns the translation key for a category.
 */
export const getCategoryKey = (cat: string | undefined): string => {
    const norm = normalizeCategory(cat);
    switch (norm) {
        case "Residência & Vistos": return "cat_doc";
        case "Trabalho & Carreira": return "cat_job";
        case "Saúde & SNS": return "cat_hea";
        case "Finanças & Impostos": return "cat_fin";
        case "Habitação & Casa": return "cat_hou";
        case "Educação & Formação": return "cat_edu";
        case "Direitos & Apoio Social": return "cat_rig";
        case "Comunidade & Histórias": return "cat_com";
        case "Ajuda Humanitária": return "cat_humanitarian";
        case "Geral & Tecnologia": return "cat_tec";
        default: return "cat_tec";
    }
};

/**
 * MIRA WORK TOPIC ENGINE (V2026)
 * Standardizes and cleans job categories/topics.
 */
export const normalizeWorkTopic = (topic: string | undefined | null, titleFallback?: string): string => {
    // 1. Clean the inputs
    const title = (titleFallback || "").trim();
    const titleUpper = title.toUpperCase();
    
    // Clean topic encoding
    let cleanTopic = (topic || "").trim();
    if (cleanTopic) {
        cleanTopic = cleanTopic
            .replace(/Log[\uFFFD\u00ED]stica/gi, 'Logística')
            .replace(/Sa[\uFFFD\u00FA]de/gi, 'Saúde')
            .replace(/Produ[\uFFFD\u00E7][\uFFFD\u00E3]o/gi, 'Produção')
            .replace(/Administra[\uFFFD\u00E7][\uFFFD\u00E3]o/gi, 'Administração')
            .replace(/Com[\uFFFD\u00E9]rcio/gi, 'Comércio')
            .replace(/Manuten[\uFFFD\u00E7][\uFFFD\u00E3]o/gi, 'Manutenção')
            .replace(/Constru├º├úo/gi, 'Construção')
            .replace(/├º/g, 'ç')
            .replace(/├ú/g, 'ã')
            .replace(/├í/g, 'á')
            .replace(/├ó/g, 'ó')
            .replace(/├é/g, 'é');
    }
    const topicUpper = cleanTopic.toUpperCase();

    // 2. PRIORITY 1: High-specificity title keyword matching to override generic scraper topics
    // Apoio ao Cliente / Call Center / Bilingue
    if (titleUpper.includes("CUSTOMER") || titleUpper.includes("ADVISOR") || titleUpper.includes("CONTACT CENTER") || titleUpper.includes("CALL CENTER") || titleUpper.includes("ATENDIMENTO") || titleUpper.includes("SUPORTE AO CLIENTE") || titleUpper.includes("APOIO AO CLIENTE") || titleUpper.includes("HELPDESK") || titleUpper.includes("TELEPERFORMANCE") || titleUpper.includes("FOUNDEVER") || titleUpper.includes("BILINGUAL") || titleUpper.includes("BILINGUE") || titleUpper.includes("GERMAN SPEAKER") || titleUpper.includes("FRENCH SPEAKER") || titleUpper.includes("ITALIAN SPEAKER") || titleUpper.includes("DUTCH SPEAKER")) {
        return "Apoio ao Cliente";
    }

    // Design, Marketing & Media
    if (titleUpper.includes("MARKETING") || titleUpper.includes("DESIGN") || titleUpper.includes("SOCIAL MEDIA") || titleUpper.includes("COPYWRITER") || titleUpper.includes("CONTENT") || titleUpper.includes("AUDIOVISUAL") || titleUpper.includes("VÍDEO") || titleUpper.includes("VIDEO") || titleUpper.includes("FOTOGRAF") || titleUpper.includes("UX") || titleUpper.includes("UI") || titleUpper.includes("COMUNICAÇÃO") || titleUpper.includes("COMUNICACAO") || titleUpper.includes("BRAND")) {
        return "Design, Marketing e Media";
    }

    // Gestão de Equipas & Negócios
    if (titleUpper.includes("TEAM LEADER") || titleUpper.includes("PROJECT MANAGER") || titleUpper.includes("PRODUCT MANAGER") || titleUpper.includes("GESTOR DE PROJETO") || titleUpper.includes("COORDENADOR") || titleUpper.includes("BUSINESS ANALYST") || titleUpper.includes("BUSINESS CONTROLLER") || titleUpper.includes("DIRETOR") || titleUpper.includes("DIRECTOR") || titleUpper.includes("AUDITOR") || titleUpper.includes("SCRUM")) {
        return "Gestão de Equipas e Negócios";
    }

    // Técnicos & Consultores
    if (titleUpper.includes("CONSULTOR") || titleUpper.includes("CONSULTANT") || titleUpper.includes("TÉCNICO") || titleUpper.includes("TECNICO") || titleUpper.includes("MECATRÓNICO") || titleUpper.includes("MECATRONICO") || titleUpper.includes("MECÂNICO") || titleUpper.includes("MECANICO") || titleUpper.includes("PERITAGEM") || titleUpper.includes("CONTROLO DE QUALIDADE") || titleUpper.includes("ESPECIALISTA") || titleUpper.includes("SPECIALIST")) {
        return "Técnicos e Consultores";
    }

    // Medical / Health
    if (titleUpper.includes("ENFERMEIR") || titleUpper.includes("MÉDIC") || titleUpper.includes("MEDIC") || titleUpper.includes("DENTÁRI") || titleUpper.includes("DENTISTA") || titleUpper.includes("FARMACÊUTIC") || titleUpper.includes("FARMAC") || titleUpper.includes("PSICÓLOG") || titleUpper.includes("PSICOL") || titleUpper.includes("FISIOTERAP") || titleUpper.includes("AUXILIAR DE SAÚDE") || titleUpper.includes("AUXILIAR DE SAUDE") || titleUpper.includes("CUIDADOR") || titleUpper.includes("AUXILIAR DE GERIATRIA") || titleUpper.includes("GERIATRIA")) {
        return "Saúde & Cuidados Continuados";
    }
    // Tech & IT
    if (titleUpper.includes("SOFTWARE") || titleUpper.includes("DEVELOPER") || titleUpper.includes("PROGRAMADOR") || titleUpper.includes("DEV ") || titleUpper.includes("DADOS") || titleUpper.includes("DATA ENGINEER") || titleUpper.includes("DATA ANALYST") || titleUpper.includes("WEB DEVELOPER") || titleUpper.includes("SYSTEMS ENGINEER") || titleUpper.includes("SUPORTE TÉCNICO") || titleUpper.includes("SUPORTE TECNICO") || titleUpper.includes("TI ") || titleUpper.includes("TELECOM")) {
        return "Tecnologia, Dados & IA";
    }
    // Construction
    if (titleUpper.includes("CONSTRU") || titleUpper.includes("PEDREIRO") || titleUpper.includes("SERVENTE") || titleUpper.includes("PINTOR") || titleUpper.includes("CARPINTEIRO") || titleUpper.includes("TROLHA") || titleUpper.includes("PICHELEIRO") || titleUpper.includes("CANALIZADOR") || titleUpper.includes("ELETRICISTA") || titleUpper.includes("LADRILHADOR")) {
        return "Construção Civil & Engenharia";
    }
    // Tourism / Hospitality / Food
    if (titleUpper.includes("TURISMO") || titleUpper.includes("HOTEL") || titleUpper.includes("RESTAURANTE") || titleUpper.includes("COZINHA") || titleUpper.includes("COZINHEIR") || titleUpper.includes("COPA") || titleUpper.includes("EMPREGADO DE MESA") || titleUpper.includes("BARMAN") || titleUpper.includes("GARÇOM") || titleUpper.includes("CAFÉ") || titleUpper.includes("BARISTA") || titleUpper.includes("PASTELAR") || titleUpper.includes("PADARIA") || titleUpper.includes("PADEIRO")) {
        return "Turismo, Hotelaria & Restauração";
    }
    // Logistics / Transport / Warehouse
    if (titleUpper.includes("LOGÍSTICA") || titleUpper.includes("LOGISTICA") || titleUpper.includes("ARMAZÉM") || titleUpper.includes("ARMAZEM") || titleUpper.includes("MOTORISTA") || titleUpper.includes("CONDUTOR") || titleUpper.includes("DISTRIBUIÇÃO") || titleUpper.includes("DISTRIBUICAO") || titleUpper.includes("DISTRIBUIDOR") || titleUpper.includes("ESTAFETA") || titleUpper.includes("EMPILHADOR") || titleUpper.includes("PICKING") || titleUpper.includes("PACKING") || titleUpper.includes("ENTREGADOR") || titleUpper.includes("ARMAZ")) {
        return "Logística, Transportes & Armazém";
    }
    // Industry / Production / Manufacturing
    if (titleUpper.includes("PRODUÇÃO") || titleUpper.includes("PRODUCAO") || titleUpper.includes("FÁBRICA") || titleUpper.includes("FABRICA") || titleUpper.includes("OPERADOR DE MÁQUINA") || titleUpper.includes("OPERADOR DE MAQUINA") || titleUpper.includes("MANUFATURA") || titleUpper.includes("TORNEIRO") || titleUpper.includes("SOLDADOR") || titleUpper.includes("MANUTENÇÃO") || titleUpper.includes("MANUTENCAO") || titleUpper.includes("OPERADOR DE PRODUÇÃO") || titleUpper.includes("OPERADOR DE PRODUCAO") || titleUpper.includes("PRODU")) {
        return "Indústria, Produção & Manufatura";
    }
    // Sales / Retail / Commercial
    if (titleUpper.includes("COMERCIAL") || titleUpper.includes("VENDEDOR") || titleUpper.includes("VENDAS") || titleUpper.includes("CAIXA") || titleUpper.includes("REPOSITOR") || titleUpper.includes("SUPERMERCADO") || titleUpper.includes("LOJA") || titleUpper.includes("BALCÃO") || titleUpper.includes("BALCAO") || titleUpper.includes("STORE") || titleUpper.includes("RETALHO")) {
        return "Comércio, Vendas & Retalho";
    }
    // Administrative / HR / Management
    if (titleUpper.includes("ADMINISTRATIV") || titleUpper.includes("SECRETÁRI") || titleUpper.includes("SECRETARI") || titleUpper.includes("CONTABIL") || titleUpper.includes("FINANCEIR") || titleUpper.includes("RECURSOS HUMANOS") || titleUpper.includes("HR ") || titleUpper.includes("RECRUT") || titleUpper.includes("GESTÃO") || titleUpper.includes("GESTAO") || titleUpper.includes("ASSISTENTE DE DIREÇÃO") || titleUpper.includes("OFFICE")) {
        return "Administrativo, Gestão & RH";
    }
    // Cleaning / Security / Facilities
    if (titleUpper.includes("LIMPEZA") || titleUpper.includes("EMPREGADA DE LIMPEZA") || titleUpper.includes("HIGIENE") || titleUpper.includes("VIGILANTE") || titleUpper.includes("SEGURANÇA PRIVADA") || titleUpper.includes("FACILITY") || titleUpper.includes("PORTEIRO")) {
        return "Limpeza, Segurança & Facility Management";
    }
    // Agriculture / Farming / Fishing
    if (titleUpper.includes("AGRIC") || titleUpper.includes("CAMPO") || titleUpper.includes("QUINTA") || titleUpper.includes("JARDINEIR") || titleUpper.includes("COLHEITA") || titleUpper.includes("TRACTORISTA") || titleUpper.includes("TRATORISTA") || titleUpper.includes("PECUÁRIA") || titleUpper.includes("PECUARIA") || titleUpper.includes("PESCA")) {
        return "Agricultura, Pesca & Pecuária";
    }
    // Remote
    if (titleUpper.includes("REMOTO") || titleUpper.includes("REMOTE") || titleUpper.includes("FREELANCE") || titleUpper.includes("VIRTUAL ASSISTANT")) {
        return "Trabalho Remoto & Freelancing";
    }

    // 3. PRIORITY 2: Map direct topic from scraper
    if (topicUpper) {
        if (topicUpper.includes("TECNOLOGIA") || topicUpper.includes(" TI") || topicUpper.includes("INFORMÁTICA")) return "Tecnologia, Dados & IA";
        if (topicUpper.includes("SAÚDE") || topicUpper.includes("CUIDADOS") || topicUpper.includes("CLÍNICA")) return "Saúde & Cuidados Continuados";
        if (topicUpper.includes("CONSTRUÇÃO") || topicUpper.includes("ENGENHARIA")) return "Construção Civil & Engenharia";
        if (topicUpper.includes("TURISMO") || topicUpper.includes("HOTEL") || topicUpper.includes("RESTAURA") || topicUpper.includes("PASTELARIA")) return "Turismo, Hotelaria & Restauração";
        if (topicUpper.includes("PRODUÇÃO") || topicUpper.includes("INDÚSTRIA") || topicUpper.includes("MANUFATURA") || topicUpper.includes("FÁBRICA")) return "Indústria, Produção & Manufatura";
        if (topicUpper.includes("LOGÍSTICA") || topicUpper.includes("TRANSPORT") || topicUpper.includes("ARMAZÉM")) return "Logística, Transportes & Armazém";
        if (topicUpper.includes("VENDAS") || topicUpper.includes("COMERCIAL") || topicUpper.includes("COMÉRCIO")) return "Comércio, Vendas & Retalho";
        if (topicUpper.includes("ADMINISTRA") || topicUpper.includes("FINANÇAS") || topicUpper.includes("GESTÃO") || topicUpper.includes("RECURSOS HUMANOS") || topicUpper.includes(" RH")) return "Administrativo, Gestão & RH";
        if (topicUpper.includes("LIMPEZA") || topicUpper.includes("DOMÉSTIC") || topicUpper.includes("SEGURANÇA")) return "Limpeza, Segurança & Facility Management";
        if (topicUpper.includes("AGRICULTURA") || topicUpper.includes("RURAL") || topicUpper.includes("PESCA")) return "Agricultura, Pesca & Pecuária";
        if (topicUpper.includes("ARTES") || topicUpper.includes("DESIGN") || topicUpper.includes("MULTIMÉDIA") || topicUpper.includes("MARKETING")) return "Artes, Design & Multimédia";
        if (topicUpper.includes("APOIO SOCIAL") || topicUpper.includes("AÇÃO SOCIAL") || topicUpper.includes("TERCEIRO SETOR")) return "Apoio Social & Terceiro Setor";
        if (topicUpper.includes("ENERGIA") || topicUpper.includes("SUSTENTABILIDADE") || topicUpper.includes("SOLAR") || topicUpper.includes("EÓLICA") || topicUpper.includes("AMBIENTAL")) return "Energia & Sustentabilidade";
        if (topicUpper.includes("REMOTO") || topicUpper.includes("FREELANCE")) return "Trabalho Remoto & Freelancing";
    }

    // 4. PRIORITY 3: Broad text matching as fallback on combined text
    const combinedText = (topicUpper + " " + titleUpper).trim();
    if (combinedText.includes("TECNOLOGIA") || combinedText.includes("DADOS") || combinedText.includes(" IA ") || combinedText.includes("SOFTWARE") || combinedText.includes("PROGRAMADOR") || combinedText.includes("DEVELOPER") || combinedText.includes(" IT ")) return "Tecnologia, Dados & IA";
    if (combinedText.includes("SAÚDE") || combinedText.includes("CUIDADOS") || combinedText.includes("MÉDIC") || combinedText.includes("DENTÁRIA") || combinedText.includes("ENFERMEIR") || combinedText.includes("CLÍNICA") || combinedText.includes("FARMÁCIA")) return "Saúde & Cuidados Continuados";
    if (combinedText.includes("CONSTRU") || combinedText.includes("ENGENHARIA") || combinedText.includes("PEDREIRO") || combinedText.includes("SERVENTE") || combinedText.includes("OBRA") || combinedText.includes("CARPINTEIRO") || combinedText.includes("PINTOR")) return "Construção Civil & Engenharia";
    if (combinedText.includes("TURISMO") || combinedText.includes("HOTEL") || combinedText.includes("RESTAURA") || combinedText.includes("COZINH") || combinedText.includes("BALCÃO") || combinedText.includes("EMPREGADO DE MESA") || combinedText.includes("BARMAN") || combinedText.includes("CAFÉ")) return "Turismo, Hotelaria & Restauração";
    if (combinedText.includes("INDÚSTRIA") || combinedText.includes("PRODU") || combinedText.includes("MANUFATURA") || combinedText.includes("FÁBRICA") || combinedText.includes("OPERADOR DE MÁQUINA")) return "Indústria, Produção & Manufatura";
    if (combinedText.includes("LOGÍSTICA") || combinedText.includes("TRANSPORT") || combinedText.includes("ARMAZÉM") || combinedText.includes("MOTORISTA") || combinedText.includes("EXPEDI") || combinedText.includes("ENTREGADOR")) return "Logística, Transportes & Armazém";
    if (combinedText.includes("COMÉRCIO") || combinedText.includes("VENDAS") || combinedText.includes("RETALHO") || combinedText.includes("LOJA") || combinedText.includes("SALES") || combinedText.includes("COMERCIAL")) return "Comércio, Vendas & Retalho";
    if (combinedText.includes("ADMINISTRATIV") || combinedText.includes("GESTÃO") || combinedText.includes("RH ") || combinedText.includes("RECURSOS HUMANOS") || combinedText.includes("FINANCEIRO") || combinedText.includes("ACCOUNT") || combinedText.includes("SUPORTE")) return "Administrativo, Gestão & RH";
    if (combinedText.includes("LIMPEZA") || combinedText.includes("SEGURANÇA") || combinedText.includes("FACILITY") || combinedText.includes("VIGILANTE")) return "Limpeza, Segurança & Facility Management";
    if (combinedText.includes("AGRICULTURA") || combinedText.includes("PESCA") || combinedText.includes("PECUÁRIA") || combinedText.includes("QUINTA")) return "Agricultura, Pesca & Pecuária";
    if (combinedText.includes("ARTES") || combinedText.includes("DESIGN") || combinedText.includes("MULTIMÉDIA") || combinedText.includes("MARKETING")) return "Artes, Design & Multimédia";
    if (combinedText.includes("APOIO SOCIAL") || combinedText.includes("TERCEIRO SETOR") || combinedText.includes("AÇÃO SOCIAL")) return "Apoio Social & Terceiro Setor";
    if (combinedText.includes("ENERGIA") || combinedText.includes("SUSTENTABILIDADE") || combinedText.includes("SOLAR") || combinedText.includes("EÓLICA") || combinedText.includes("AMBIENTAL")) return "Energia & Sustentabilidade";
    if (combinedText.includes("REMOTO") || combinedText.includes("FREELANCE")) return "Trabalho Remoto & Freelancing";

    // Direct match check in official list (fallback)
    const exactMatch = WORK_TOPICS.find(wt => wt.toUpperCase() === cleanTopic.toUpperCase().trim());
    if (exactMatch) return exactMatch;

    return "Outros";
};

/**
 * Returns the translation key for a work topic.
 */
export const getWorkTopicKey = (topic: string | undefined | null): string => {
    const norm = normalizeWorkTopic(topic);
    switch (norm) {
        case "Tecnologia, Dados & IA": return "jobs_topic_tech";
        case "Saúde & Cuidados Continuados": return "jobs_topic_health";
        case "Construção Civil & Engenharia": return "jobs_topic_construction";
        case "Turismo, Hotelaria & Restauração": return "jobs_topic_tourism";
        case "Indústria, Produção & Manufatura": return "jobs_topic_industry";
        case "Logística, Transportes & Armazém": return "jobs_topic_logistics";
        case "Comércio, Vendas & Retalho": return "jobs_topic_sales";
        case "Administrativo, Gestão & RH": return "jobs_topic_admin";
        case "Apoio ao Cliente": return "jobs_topic_support";
        case "Técnicos e Consultores": return "jobs_topic_consultants";
        case "Design, Marketing e Media": return "jobs_topic_design_media";
        case "Gestão de Equipas e Negócios": return "jobs_topic_management";
        case "Limpeza, Segurança & Facility Management": return "jobs_topic_services";
        case "Agricultura, Pesca & Pecuária": return "jobs_topic_agriculture";
        case "Artes, Design & Multimédia": return "jobs_topic_arts";
        case "Apoio Social & Terceiro Setor": return "jobs_topic_social";
        case "Energia & Sustentabilidade": return "jobs_topic_energy";
        case "Trabalho Remoto & Freelancing": return "jobs_topic_remote";
        default: return "jobs_topic_others";
    }
};
