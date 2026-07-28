
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const PROTECTED_SERVICES = [
    { name: "JRS Portugal – Serviço Jesuíta aos Refugiados", address: "Rua Rogério de Moura, Lote 59, Alto do Lumiar, 1750-342 Lisboa", website: "https://jrsportugal.pt", city: "Lisboa", category: "Comunidade & Apoio" },
    { name: "Conselho Português para os Refugiados (CPR)", address: "Estrada da Costa, nº 1359, 2750-642 Cascais", website: "https://www.cpr.pt", city: "Cascais", category: "Residência e Legalização" },
    { name: "Solidariedade Imigrante (SOLIM)", address: "Rua do Benformoso, 289, 1100-085 Lisboa", website: "https://solimportugal.org", city: "Lisboa", category: "Comunidade & Apoio" },
    { name: "Lisbon Project", address: "Rua Carvalho Araújo, 66-B, 1900-140 Lisboa", website: "https://lisbonproject.org", city: "Lisboa", category: "Comunidade & Apoio" },
    { name: "Casa do Brasil de Lisboa", address: "Rua Luz Soriano, 42, 1200-248 Lisboa", website: "http://casadobrasillisboa.pt", city: "Lisboa", category: "Comunidade & Apoio" },
    { name: "Refugees Welcome Portugal", address: "Rua de Alfredo Cunha 378, Sala 7, 4450-021 Matosinhos", website: "https://refugees-welcome.pt", city: "Matosinhos / Porto", category: "Comunidade & Apoio" },
    { name: "APIRP – Apoio a Imigrantes e Refugiados", address: "Avenida de São José, nº 6, 3º Esquerdo, 2685-108 Sacavém", website: "https://www.apirp.pt", city: "Loures", category: "Comunidade & Apoio" },
    { name: "FEMAFRO – Associação de Mulheres Negras", address: "Lisboa (Sede)", website: "https://femafro.pt", city: "Lisboa", category: "Comunidade & Apoio" },
    { name: "Médicos do Mundo Portugal", address: "Avenida de Ceuta (Sul), Lote 4, Loja 1, 1300-125 Lisboa", website: "https://medicosdomundo.pt", city: "Lisboa", category: "Saúde (SNS)" },
    { name: "Cáritas Portuguesa", address: "Praça Pasteur, 11 – 2º Esq., 1000-238 Lisboa", website: "https://www.caritas.pt", city: "Lisboa", category: "Comunidade & Apoio" },
    { name: "Open Gate Portugal", address: "Rua 2 da Matinha, 5D, 1950-326 Lisboa", website: "https://opengateportugal.com", city: "Lisboa", category: "Comunidade & Apoio" },
    { name: "ADIP – Associação Despertar Imigrantes", address: "Rua Professor Egas Moniz, nº 24A, Salas B/C, 2845-384 Amora", website: "https://associacaoadip.com", city: "Seixal", category: "Comunidade & Apoio" },
    { name: "Renovar a Mouraria", address: "Beco do Rosendo, nº 8 e 10, 1100-460 Lisboa", website: "https://renovaramouraria.pt", city: "Lisboa", category: "Comunidade & Apoio" },
    { name: "Programa Escolhas (IPDJ)", address: "Avenida Columbano Bordalo Pinheiro, 86, 1070-065 Lisboa", website: "https://escolhas.pt", city: "Lisboa", category: "Comunidade & Apoio" },
    { name: "Mundo Feliz – Associação de Imigrantes", address: "Rua Dr. Manuel de Arriaga, Nº 20A, 1495-019 Algés", website: "https://www.mundofeliz.pt", city: "Oeiras", category: "Comunidade & Apoio" },
    { name: "Pão a Pão – Integração Alimentar", address: "Mercado de Arroios, Rua de Arroios, Lisboa", website: "https://paoapao.pt", city: "Lisboa", category: "Comunidade & Apoio" },
    { name: "Plataforma de Direitos Humanos Portugal", address: "Lisboa", website: "https://plataformadh.pt", city: "Lisboa", category: "Comunidade & Apoio" },
    { name: "Cruz Vermelha Portuguesa – Apoio a Migrantes", address: "Jardim 9 de Abril, 1 a 5, 1249-083 Lisboa", website: "https://www.cruzvermelha.pt", city: "Lisboa", category: "Comunidade & Apoio" },
    { name: "SOS Racismo Portugal", address: "Rua das Janelas Verdes, 2, 1200-692 Lisboa", website: "https://sosracismo.pt", city: "Lisboa", category: "Comunidade & Apoio" },
    { name: "CRESCER – Associação de Intervenção Comunitária", address: "Bairro Qta Cabrinha 3 – E/F, 1300-906 Lisboa", website: "https://crescer.org", city: "Lisboa", category: "Comunidade & Apoio" },
    { name: "AEMIREP – Empreendedorismo Imigrante", address: "Rua Varela Silva, Lote 10, Loja B, 1750-403 Lisboa", website: "https://aemirep.pt", city: "Lisboa", category: "Trabalho & Carreira" }
];

async function sync() {
    console.log(`🚀 [MIRA] Sincronizando Base de Dados Massiva de Serviços...`);
    
    // Ler os serviços do ficheiro (simulando extração robusta)
    const fs = require('fs');
    const content = fs.readFileSync(path.join(__dirname, '../src/utils/massiveServicesDatabase.ts'), 'utf8');
    
    // Extração simplificada via Regex para o script CJS
    const matches = content.matchAll(/title:\s*"([^"]*)",\s*category:\s*"([^"]*)",\s*lat:\s*([0-9.-]+),\s*lng:\s*([0-9.-]+),\s*address:\s*"([^"]*)",\s*city:\s*"([^"]*)",\s*website:\s*"([^"]*)"/g);
    
    const formatted = [];
    for (const match of matches) {
        formatted.push({
            name: match[1],
            address: match[5],
            website: match[7],
            category: match[2],
            description: `Serviço Público em ${match[6]}.`,
            created_at: new Date().toISOString()
        });
    }

    console.log(`📦 Preparando para inserir ${formatted.length} novos serviços públicos...`);

    // Limpar e reinserir
    await supabase.from('services').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    const { error } = await supabase.from('services').insert(formatted);

    if (error) {
        console.error("❌ Erro:", error.message);
    } else {
        console.log(`✅ ${formatted.length} Serviços sincronizados com sucesso!`);
    }
}

sync();
