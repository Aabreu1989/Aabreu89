
import React from 'react';
export const COLORS = {
  primary: '#FF8C00', // Laranja Neon
  secondary: '#0066FF', // Azul High-Tech
  negro: '#0A0A0A', // Negro Premium
  navy: '#001F3F', // Azul Marinho Deep
  accent: '#eab308', // MIRA Yellow
  success: '#22c55e', // MIRA Green
  pastel: {
    orange: '#FFF1E6',
    yellow: '#FEFAE0',
    blue: '#E0F2FE',
    green: '#DCFCE7',
  }
};

export const MIRA_PHOTO_URL = '/mira-robot.png';
export const MIRA_LOGO_URL = '/logo-mira.png';

export const OFFICIAL_SOURCES = [
  { name: "AIMA", url: "https://aima.gov.pt", category: "Imigração e Regularização", id: "aima" },
  { name: "IEFP", url: "https://iefp.pt", category: "Emprego e Formação", id: "iefp" },
  { name: "ACT", url: "https://act.gov.pt", category: "Condições de Trabalho", id: "act" },
  { name: "Segurança Social", url: "https://seg-social.pt", category: "Apoios Sociais", id: "seg_social" },
  { name: "IHRU", url: "https://ihru.pt", category: "Habitação", id: "ihru" },
  { name: "Portal das Finanças", url: "https://portaldasfinancas.gov.pt", category: "Finanças e NIF", id: "financas" },
  { name: "SNS", url: "https://sns.gov.pt", category: "Saúde", id: "sns" },
  { name: "DGES", url: "https://dges.gov.pt", category: "Educação e Diplomas", id: "dges" },
  { name: "IRN", url: "https://irn.justica.gov.pt", category: "Registos e Nacionalidade", id: "irn" },
  { name: "ACM", url: "https://acm.gov.pt", category: "Integração e Direitos Humanos", id: "acm" },
  { name: "IOM Portugal", url: "https://portugal.iom.int", category: "Refugiados e Migração", id: "oim" },
  { name: "UNHCR Portugal", url: "https://help.unhcr.org/portugal", category: "Refúgio e Proteção", id: "acnur" },
  { name: "DRE", url: "https://dre.pt", category: "Legislação", id: "dre" },
  { name: "dados.gov.pt", url: "https://dados.gov.pt", category: "Dados Públicos", id: "dadosgov" },
  { name: "ANQEP", url: "https://anqep.gov.pt", category: "Formação Profissional", id: "anqep" },
  { name: "justica.gov.pt", url: "https://justica.gov.pt", category: "Serviços Jurídicos", id: "justica" },
  { name: "Casa do Brasil de Lisboa", url: "https://casadobrasildelisboa.pt", category: "ONGs / Comunidade Brasileira", id: "casa_brasil" }
];

export const MIRA_LOGO = (
  <img src="/logo-mira.png" alt="MIRA" className="w-full h-full object-contain bg-transparent border-none outline-none" style={{ background: 'transparent' }} />
);

export const PREDEFINED_AVATARS = [
  // Grupo 1: Diversos (22 originais)
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1763757321162-95c0de309d22?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1624395213043-fa2e123b2656?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1548142813-c348350df52b?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1534030347209-467a5b0ad3e6?w=400&h=400&fit=crop",
  // Grupo 2: Árabes (3)
  "https://images.unsplash.com/photo-1576558656222-ba66febe3dec?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1510832198440-a52376950479?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&h=400&fit=crop",
  // Grupo 3: Asiáticos (7)
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1542206395-9feb3edaa68d?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1520333789090-1afc82db536a?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1474176857210-7287d38d27c6?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1621390890561-48f5afc3be21?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1668536681456-817e4a575c6e?w=400&h=400&fit=crop",
  // Grupo 4: Indígenas / Latino-Americanos (5)
  "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1610216705422-caa3fcb6d158?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1590086782957-93c06ef21604?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1563237023-b1e970526dcb?w=400&h=400&fit=crop",
  // Grupo 5: Indianos (4)
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1628157588553-5eeea00af15c?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1507152832244-10d45c7eda57?w=400&h=400&fit=crop",
  // Grupo 6: Latinos (5)
  "https://images.unsplash.com/photo-1657773558233-e7b245d59bf5?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1523824921871-d6f1a15151f1?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1512485694743-9c9538b4e6e0?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1653129305118-3c5b26df576c?w=400&h=400&fit=crop",
  // Grupo 7: Europeus (6)
  "https://images.unsplash.com/photo-1566616213894-2d4e1baee5d8?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1505033575518-a36ea2ef75ae?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1543165365-07232ed12fad?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1550525811-e5869dd03032?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1558222218-b7b54eede3f3?w=400&h=400&fit=crop",
  // Grupo 8: Negros / Africanos (6)
  "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1618559850638-2aed8a8e8cdc?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1589156288859-f0cb0d82b065?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1651684215020-f7a5b6610f23?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1579420593648-0deba81fd762?w=400&h=400&fit=crop",
];
