import React, { useState, useMemo, useEffect, useRef } from 'react';
import { BookOpen, ChevronRight, Mic2, Search, Filter, ChevronDown, FileText, Bot, ExternalLink, Calendar, X, Send, Mail, GraduationCap, ArrowLeft, Share2, Info, Globe, Building2, Sparkles, Briefcase, TrendingUp, MapPin, DollarSign, ArrowRight, UserCheck, CheckCircle2, Building, Activity } from 'lucide-react';
import { Course, UNIFIED_CATEGORIES, CATEGORIES } from '../types';
import { useToast } from './Toast';
import { t } from '../utils/translations';
// import { IEFP_MASSIVE_DATABASE } from '../utils/iefpCoursesDatabase';
// import { DGES_RECOGNIZED_DATABASE } from '../utils/dgesCoursesDatabase';
import { getImageUrl } from '../utils/imageUtils';
import { normalizeCategory, getCategoryIcon, getCategoryKey } from '../utils/categoryUtils';
import { TranslatedText } from './TranslatedText';
import { analytics } from '../services/analyticsService';
import { supabase } from '../lib/supabase';
import { MIRA_PHOTO_URL } from '../constants';



interface LearningViewProps {
  courses: Course[];
  onNavigateToChat: () => void;
  onEarnPoints: (points: number, badgeId?: string) => void;
  onNavigateToContact: () => void;
  language: string;
  initialArticleId?: string;
}

const MANUAL_TRANSLATIONS = {
  PT: {
    title: '📖 MANUAL DO UTILIZADOR – MIRA V2026.GOLD',
    summary: 'O guia definitivo do teu escudo e da tua bússola em Portugal! Descobre todas as ferramentas, simuladores, empregos e o sistema de comunidade que criámos para a tua integração segura.',
    content: `🔒 Segurança e Privacidade em Primeiro Lugar: O MIRA é 100% seguro. Nós não guardamos as tuas informações pessoais ou documentos. Podes navegar, simular processos e tirar dúvidas com total privacidade e tranquilidade.

🗺️ A tua Barra de Navegação (Menu Inferior)
O menu na parte de baixo do ecrã é o teu ponto de partida para explorar todo o ecossistema MIRA:

🏠 Início: O teu painel principal de boas-vindas com atalhos rápidos e novidades.

👥 MIRA HUB (Comunidade): A maior rede de apoio entre imigrantes em Portugal. Partilha relatos, tira dúvidas com tradução instantânea em 4 idiomas e participa no Fact-Checking Comunitário (votação de veracidade para combater fraudes e esquemas).

💼 Empregos (JobBoard): Mais de 11.600 vagas de emprego reais atualizadas diariamente (IEFP, Net-Empregos, Jooble e Indeed), com filtros por distrito e área de atuação.

📍 Serviços Locais: Mapa interativo com a geolocalização exata de pontos essenciais de acolhimento (centros de saúde, conservatórias, associações e órgãos públicos).

📚 Cursos & Formação: Central de evolução profissional com cursos certificados e reconhecidos pelo IEFP e DGES.

📄 Documentos & Jornada: O teu centro de descomplicar a burocracia com guias passo a passo e minutas prontas para download.

---

🏆 Sistema de Gamificação & 12 Selos de Conquista
No teu Perfil, tens acesso ao sistema oficial de reputação MIRA. Ganhas pontos e desbloqueias 12 medalhas oficiais ao ajudar outros membros e manter a comunidade segura:
• ⭐ Pioneiro MIRA: Membro fundador da comunidade.
• ❤️ Coração da Tribo: Reconhecimento por generosidade e empatia comunitária.
• 🔍 Curador de Conteúdo: Validador de informações úteis e guias essenciais.
• 📚 Mestre dos Documentos: Especialista em minutas e processos práticos.
• 💎 Cidadão Exemplar: Conduta exemplar e participação ativa.
• 🔥 Mentor de Emprego: Apoio na inserção de talentos no mercado de trabalho.
• 🛡️ Sentinela MIRA: Guardião da qualidade e integridade do ecossistema.
• ⚖️ Especialista em Leis: Domínio da legislação de estrangeiros e direitos em Portugal.
• ✅ Cidadão Verificado: Identidade validada pela moderação MIRA.
• 🎙️ Voz de Autoridade: Nível de elite com 500+ pontos de reputação.
• 🔰 Escudo Anti-Burla: Denunciador verificado de fraudes de agendamento e esquemas ilegais.
• 🗺️ Guia Local: Avaliador de serviços e apoio comunitário no mapa.

---

🚀 Assistentes Interativos & Simuladores MIRA
Dentro dos módulos de Documentos e Ferramentas, podes usar assistentes inteligentes:
• 🆔 Assistente NIF (Finanças): Guia para obtenção e regularização do Número de Identificação Fiscal.
• 🛡️ Assistente NISS (Segurança Social): Passo a passo para obtenção do teu número de proteção social.
• 🧮 Simulador de IRS: Cálculo de retenção na fonte, recibos verdes e enquadramento fiscal.
• 🚗 Assistente IMT: Guia completo para a Troca da Carta de Condução estrangeira.
• 🏥 Utente SNS: Como aceder ao Serviço Nacional de Saúde e obter o teu número de utente.
• ⚖️ Nacionalidade: Calculadora e orientações sobre os 5 anos de residência legal.

---

🤖 Precisa de Ajuda Extra? Usa o Assistente MIRA
Em qualquer ecrã, clica no botão cor-de-laranja flutuante com o robô no canto inferior direito.
O nosso Assistente foi treinado nas leis e normativas oficiais em tempo real para responder com clareza e empatia a qualquer dúvida.

📱 Dica Extra: Instala o MIRA no teu telemóvel (PWA)! Podes adicionar à tela inicial no iOS ou Android para ter acesso rápido mesmo offline.`,
    art406_title: 'CONVENÇÃO DE GENEBRA: PROTEÇÃO & DIGNIDADE',
    art406_summary: 'Explore os pilares da proteção internacional e o compromisso de Portugal com o acolhimento humanitário soberano.',
    art406_content: `A Convenção de Genebra de 1951 é o marco civilizacional que garante segurança a quem foge da perseguição. Em Portugal, a soberania e a solidariedade caminham juntas:
    
    1. ESTATUTO DE REFUGIADO: Resposta direta para perseguições por raça, religião, nacionalidade ou opiniões políticas.
    2. PROTEÇÃO SUBSIDIÁRIA: Salvaguarda contra riscos reais de danos graves (conflitos armados, pena de morte).
    
    DIREITOS & SOBERANIA:
    - Saúde (SNS): Acesso universal e imediato.
    - Dignidade: Direito ao trabalho, habitação e educação.
    - Segurança: Proteção garantida pelo Estado Português.`,
    art404_title: 'PORTAL AIMA 2026: SOBERANIA TECNOLÓGICA',
    art404_summary: 'Lançamento do sistema inteligente de agendamentos: 50.000 novas vagas processadas por IA.',
    art404_content: `A modernização da AIMA atingiu o seu auge. O novo sistema de 2026 elimina intermediários e garante que quem mais precisa é atendido primeiro.
    
    1. Agendamento Preditivo: A IA identifica processos urgentes e aloca slots automaticamente.
    2. Rede Alargada: 42 novos pólos de atendimento integrados.
    3. Segurança: Confirmação biométrica via app oficial.`,
    art403_title: 'ALERTA LEGISLATIVO: FIM DA MI',
    art403_summary: 'Fim da Manifestação de Interesse (Art. 88 e 89): o que muda para quem já está em Portugal.',
    art403_content: `A Manifestação de Interesse foi extinta. O que muda:
    1. Visto Obrigatório: Entrada para trabalho exige agora visto consular prévio.
    2. Processos Pendentes: MI submetidas continuam válidas.
    3. Portal AIMA: Novo sistema prioriza agendamento automático.`,
    art410_title: 'ESTRATÉGIA DE INTEGRAÇÃO SOBERANA 2026',
    art410_summary: 'A bíblia da sobrevivência e sucesso em Portugal: entenda a nova arquitetura do Estado e como navegar no sistema AIMA sem intermediários.',
    art410_content: `O cenário migratório de 2026 exige mais do que simples documentos; exige soberania de informação. Com a extinção definitiva da Manifestação de Interesse, o imigrante deve operar sob a lógica da "Antecipação Legal".
    
    1. A NOVA ARQUITETURA AIMA: O Portal AIMA 2026 não é apenas um site de agendamentos, é um motor de IA que processa a viabilidade da sua residência em tempo real. Para ter sucesso, a sua documentação (PDFs) deve estar impecável. O sistema prioriza agora quem possui "Contratos de Alta Fidelidade" e vínculos habitacionais validados digitalmente via AT.
    
    2. O FIM DO INTERMEDIÁRIO: A MIRA nasceu para destruir a dependência de "facilitadores" que cobram fortunas. O seu processo é pessoal e intransferível. Se alguém lhe pedir dinheiro para "agilizar" o Portal AIMA, denuncie imediatamente no nosso Hub. A agilidade hoje vem da correção técnica dos seus dados.
    
    3. PROTEÇÃO CONSTITUCIONAL: Saiba que, independentemente do seu título de residência, o acesso ao SNS (Saúde) e ao Ensino Público é um direito blindado. Se um balcão lhe negar atendimento por falta de 'papéis', invoque o Princípio da Dignidade Humana.
    
    DICA ESTRATÉGICA: Use o MIRA para simular a sua entrevista na AIMA. O conhecimento das leis (Art. 122, Art. 98) é a sua maior arma contra o medo.`,
    art411_title: 'SOBERANIA FINANCEIRA: ALÉM DO NIF',
    art411_summary: 'Guia avançado sobre fiscalidade para imigrantes, proteção de património e o novo sistema de IRS 2026.',
    art411_content: `Ter um NIF é apenas o primeiro passo. Em 2026, a soberania financeira em Portugal passa pelo domínio do Portal das Finanças e pela compreensão da residência fiscal.
    
    1. RESIDÊNCIA FISCAL VS. RESIDÊNCIA LEGAL: Muitos imigrantes cometem o erro de manter o endereço do país de origem nas finanças. Isso gera tributação dupla. Assim que tiver um contrato de arrendamento, atualize o seu domicílio fiscal. É a sua prova de vida em Portugal.
    
    2. O NOVO IRS PARA IMIGRANTES: As tabelas de retenção mudaram para favorecer a integração. Se trabalha por conta própria (Recibos Verdes), o sistema MIRA ajuda-o a calcular a sua contribuição para a Segurança Social, evitando dívidas surpresa que impedem a renovação da sua residência.
    
    3. BANCARIZAÇÃO DIGITAL: O Banco de Portugal exige agora provas de rendimentos digitais. Evite depósitos em numerário sem fatura. Tudo o que não é digital em 2026, não existe para a AIMA.`
  },
  EN: {
    title: '📖 USER MANUAL – MIRA V2026.GOLD',
    summary: 'The definitive guide to your shield and compass in Portugal! Explore all tools, simulators, jobs, and the community support system designed for your safe integration.',
    content: `🔒 Security and Privacy First: MIRA is 100% secure. We do not store your personal information or documents. You can browse, simulate processes, and clear doubts with total privacy and peace of mind.

🗺️ Your Navigation Bar (Bottom Menu)
The menu at the bottom of the screen is your starting point to explore the full MIRA ecosystem:

🏠 Home: Your main welcome dashboard with quick shortcuts and latest updates.

👥 MIRA HUB (Community): The largest support network for immigrants in Portugal. Share experiences, get answers with instant 4-language translation, and participate in Community Fact-Checking (veracity voting to combat scams).

💼 Jobs (JobBoard): Over 11,600 real job openings updated daily (IEFP, Net-Empregos, Jooble, Indeed), with filters by district and field.

📍 Local Services: Interactive map with the exact geolocation of essential support points (health centers, registry offices, associations, and public bodies).

📚 Courses & Training: Professional development hub with certified courses recognized by IEFP and DGES.

📄 Documents & Journey: Your center to simplify bureaucracy with step-by-step guides and official PDF form downloads.

---

🏆 Gamification System & 12 Official Achievement Badges
In your Profile, access the official MIRA reputation system. Earn points and unlock 12 badges by helping other members and keeping the community safe:
• ⭐ MIRA Pioneer: Founding member of the community.
• ❤️ Heart of the Tribe: Recognition for community empathy and support.
• 🔍 Content Curator: Validator of useful information and essential guides.
• 📚 Master of Documents: Expert in forms and practical processes.
• 💎 Exemplary Citizen: Impeccable conduct and active participation.
• 🔥 Employment Mentor: Supporting international talent entering the job market.
• 🛡️ MIRA Sentinel: Guardian of ecosystem quality and integrity.
• ⚖️ Law Specialist: Deep knowledge of foreigners' legislation and rights.
• ✅ Verified Citizen: Identity validated by MIRA moderation.
• 🎙️ Voice of Authority: Elite tier with 500+ reputation points.
• 🔰 Anti-Scam Shield: Verified reporter of appointment scams and illegal fraud.
• 🗺️ Local Guide: Reviewer of local services and community support.

---

🚀 Interactive Assistants & MIRA Simulators
Inside Documents and Tools modules, use smart assistants:
• 🆔 NIF Assistant (Tax Authority): Guide to obtaining and regularizing your Tax Number.
• 🛡️ NISS Assistant (Social Security): Step-by-step to get your social security number.
• 🧮 IRS Simulator: Calculate tax withholding, green receipts, and fiscal brackets.
• 🚗 IMT Assistant: Complete guide for Foreign Driving License Exchange.
• 🏥 SNS User: How to access the National Health Service and get your user number.
• ⚖️ Nationality: Calculator and rules on the 5 years of legal residence.

---

🤖 Need Extra Help? Use the MIRA Assistant
On any screen, click the floating orange robot button in the bottom right corner.
Our Assistant is trained on official laws in real time to answer any questions with precision and empathy.

📱 Extra Tip: Install MIRA on your mobile device (PWA)! Add it to your home screen on iOS or Android for fast access even offline.`,
    art406_title: 'GENEVA CONVENTION: PROTECTION & DIGNITY',
    art406_summary: 'Explore the pillars of international protection and Portugal\'s commitment to humanitarian reception.',
    art406_content: `The 1951 Geneva Convention is the civilizational framework that guarantees safety. In Portugal:
    
    1. REFUGEE STATUS: Direct response to persecution.
    2. SUBSIDIARY PROTECTION: Safeguard against serious harm risks.
    
    RIGHTS:
    - Health (SNS): Universal access.
    - Dignity: Right to work, housing, and education.
    - Security: Guaranteed by the Portuguese State.`,
    art404_title: 'AIMA PORTAL 2026: TECH SOVEREIGNTY',
    art404_summary: 'Launch of the intelligent appointment system: 50,000 new slots processed by AI.',
    art404_content: `AIMA modernization. The new 2026 system eliminates intermediaries.
    
    1. Predictive Scheduling: AI identifies urgent cases.
    2. Extended Network: 42 new integrated service points.
    3. Security: Biometric confirmation via official app.`,
    art403_title: 'LEGISLATIVE ALERT: END OF MI',
    art403_summary: 'End of Expression of Interest (Art. 88 & 89): what changes for those in PT.',
    art403_content: `Expression of Interest is extinct. Key changes:
    1. Mandatory Visa: Entry for work now requires a prior consular visa.
    2. Pending Processes: Submitted MIs remain valid.
    3. AIMA Portal: New system prioritizes automatic scheduling.`,
    art410_title: 'SOVEREIGN INTEGRATION STRATEGY 2026',
    art410_summary: 'The bible of survival and success in Portugal: understand the new State architecture.',
    art410_content: `The 2026 migration landscape requires more than just documents; it requires information sovereignty.
    
    1. THE NEW AIMA ARCHITECTURE: The AIMA 2026 Portal is an AI engine. Your documentation must be flawless.
    2. END OF INTERMEDIARIES: MIRA was born to destroy dependence on "facilitators".
    3. CONSTITUTIONAL PROTECTION: Access to SNS (Health) and Public Education is a shielded right.`,
    art411_title: 'FINANCIAL SOVEREIGNTY: BEYOND NIF',
    art411_summary: 'Advanced guide on taxation for immigrants and asset protection.',
    art411_content: `Having a NIF is just the first step.
    1. FISCAL RESIDENCE: Update your fiscal address immediately to avoid double taxation.
    2. NEW IRS: Retention tables have changed.
    3. DIGITAL BANKING: Everything that is not digital in 2026 does not exist for AIMA.`
  },
  ES: {
    title: '📖 MANUAL DEL USUARIO – MIRA V2026.GOLD',
    summary: '¡La guía definitiva de tu escudo y tu brújula en Portugal! Descubre todas las herramientas, simuladores, empleos y el sistema comunitario que creamos para tu integración segura.',
    content: `🔒 Seguridad y Privacidad Primero: MIRA es 100% seguro. Nosotros no guardamos tu información personal ni documentos. Puedes navegar, simular trámites y resolver dudas con total privacidad y tranquilidad.

🗺️ Tu Barra de Navegación (Menú Inferior)
El menú en la parte inferior de la pantalla es tu punto de partida para explorar todo el ecosistema MIRA:

🏠 Inicio: Tu panel principal de bienvenida con accesos rápidos y novedades.

👥 MIRA HUB (Comunidad): La mayor red de apoyo entre inmigrantes en Portugal. Comparte experiencias, resuelve dudas con traducción instantánea en 4 idiomas y participa en el Fact-Checking Comunitario (votación de veracidad para combatir estafas).

💼 Empleos (JobBoard): Más de 11.600 ofertas de trabajo reales actualizadas diariamente (IEFP, Net-Empregos, Jooble e Indeed), con filtros por distrito y área profesional.

📍 Servicios Locales: Mapa interactivo con la geolocalización exacta de puntos esenciales de apoyo (centros de salud, registros, asociaciones y organismos públicos).

📚 Cursos y Formación: Central de desarrollo profesional con cursos certificados reconocidos por el IEFP y la DGES.

📄 Documentos y Jornada: Tu centro para descomplicar la burocracia con guías paso a paso y formularios oficiales en PDF listos para descargar.

---

🏆 Sistema de Gamificación y 12 Sellos Oficiales de Logro
En tu Perfil, accede al sistema oficial de reputación MIRA. Gana puntos y desbloquea 12 insignias oficiales ayudando a otros miembros y protegiendo a la comunidad:
• ⭐ Pionero MIRA: Miembro fundador de la comunidad.
• ❤️ Corazón de la Tribu: Reconocimiento por empatía y apoyo comunitario.
• 🔍 Curador de Contenido: Validador de información útil y guías clave.
• 📚 Maestro de Documentos: Experto en trámites y minutas prácticas.
• 💎 Ciudadano Exemplar: Conducta ejemplar y participación activa.
• 🔥 Mentor de Empleo: Apoyo para talentos que ingresan al mercado laboral.
• 🛡️ Centinela MIRA: Guardián de la integridad y calidad del ecosistema.
• ⚖️ Especialista en Leyes: Conocimiento de la legislación de extranjería.
• ✅ Ciudadano Verificado: Identidad validada por moderación MIRA.
• 🎙️ Voz de Autoridad: Nivel élite con 500+ puntos de reputación.
• 🔰 Escudo Anti-Estafa: Denunciante verificado de fraudes de citas y engaños ilegales.
• 🗺️ Guía Local: Evaluador de servicios y apoyo comunitario en el mapa.

---

🚀 Asistentes Interactivos y Simuladores MIRA
Dentro de los módulos de Documentos y Herramientas, utiliza asistentes inteligentes:
• 🆔 Asistente NIF (Hacienda - AT): Guía para obtener y regularizar tu Número Fiscal.
• 🛡️ Asistente NISS (Seguridad Social): Paso a paso para tu número de seguridad social.
• 🧮 Simulador de IRS: Cálculo de retención en la fuente, recibos verdes y régimen fiscal.
• 🚗 Asistente IMT: Guía completa para el Canje de Carnet de Conducir extranjero.
• 🏥 Usuario SNS: Cómo acceder al Servicio Nacional de Salud y obtener tu número.
• ⚖️ Nacionalidad: Calculadora y normativas sobre los 5 años de residencia legal.

---

🤖 ¿Necesitas Ayuda Extra? Usa el Asistente MIRA
En cualquier pantalla, haz clic en el botón naranja flotante con el robot en la esquina inferior derecha.
Nuestro Asistente está capacitado con leyes oficiales en tiempo real para responder con precisión y calidez.

📱 Consejo Extra: ¡Instala MIRA en tu móvil (PWA)! Añádelo a la pantalla de inicio en iOS o Android para acceso rápido incluso sin conexión.`,
    art406_title: 'CONVENCIÓN DE GINEBRA: PROTECCIÓN Y DIGNIDAD',
    art406_summary: 'Explore los pilares de la protección internacional y el compromiso de Portugal con el acogimiento humanitario.',
    art406_content: `La Convención de Ginebra de 1951 es el marco que garantiza la seguridad. En Portugal:
    
    1. ESTATUTO DE REFUGIADO: Respuesta a la persecución.
    2. PROTECCIÓN SUBSIDIARIA: Salvaguarda contra riesgos graves.
    
    DERECHOS:
    - Salud (SNS): Acceso universal.
    - Dignidad: Derecho al trabajo, vivienda y educación.
    - Seguridad: Garantizada por el Estado Portugués.`,
    art404_title: 'PORTAL AIMA 2026: SOBERANÍA TECNOLÓGICA',
    art404_summary: 'Lanzamiento del sistema inteligente de citas: 50.000 nuevas vacantes procesadas por IA.',
    art404_content: `Modernización de AIMA. El sistema 2026 elimina intermediarios.
    
    1. Programación Predictiva: La IA identifica casos urgentes.
    2. Red Extendida: 42 nuevos puntos de atención integrados.
    3. Seguridad: Confirmación biométrica mediante app oficial.`,
    art403_title: 'ALERTA LEGISLATIVA: FIN DE LA MI',
    art403_summary: 'Fin de la Manifestación de Interés (Art. 88 y 89): qué cambia para quienes están en PT.',
    art403_content: `La Manifestación de Interés se extinguió. Cambios clave:
    1. Visa Obligatoria: Entrada para trabajo requiere visa consular previa.
    2. Procesos Pendientes: Las MI presentadas siguen siendo válidas.
    3. Portal AIMA: Nuevo sistema prioriza la programación automática.`,
    art410_title: 'ESTRATEGIA DE INTEGRACIÓN SOBERANA 2026',
    art410_summary: 'La biblia de la supervivencia y el éxito em Portugal: entienda la nueva arquitectura del Estado.',
    art410_content: `El escenario migratorio de 2026 exige más que simples documentos; exige soberanía de información.
    
    1. LA NUEVA ARQUITETURA AIMA: El Portal AIMA 2026 es un motor de IA. Su documentación debe estar impecable. El sistema prioriza ahora a quienes poseen contratos validados digitalmente.
    
    2. EL FIN DEL INTERMEDIARIO: MIRA nació para destruir la dependencia de "facilitadores". Su proceso es personal. Si alguien le pide dinero para "agilizar" el Portal AIMA, denuncie en nuestro Hub.
    
    3. PROTECCIÓN CONSTITUCIONAL: El acceso al SNS (Salud) y a la Educación Pública es un derecho blindado. Invoque el Principio de Dignidad Humana si se le niega atención.`,
    art411_title: 'SOBERANÍA FINANCIERA: MÁS ALLÁ DEL NIF',
    art411_summary: 'Guía avanzada sobre fiscalidad para inmigrantes y protección de patrimonio.',
    art411_content: `Tener un NIF es solo el primer paso.
    1. RESIDENCIA FISCAL: Actualice su domicilio fiscal inmediatamente para evitar la doble tributación. Es su prueba de vida en Portugal.
    2. EL NUEVO IRS: Las tablas de retención han cambiado para favorecer la integración.
    3. BANCARIZAÇÃO DIGITAL: Todo lo que no es digital en 2026, no existe para la AIMA.`
  },
  FR: {
    title: '📖 MANUEL DE L\'UTILISATEUR – MIRA V2026.GOLD',
    summary: 'Le guide ultime de ton bouclier et de ta boussole au Portugal ! Découvre tous les outils, simulateurs, offres d\'emploi et le système communautaire pour ton intégration sereine.',
    content: `🔒 Sécurité et Confidentialité d'abord : MIRA est 100% sécurisé. Nous ne conservons pas vos informations personnelles ni vos documents. Vous pouvez naviguer, simuler vos démarches et poser vos questions en toute confidentialité et sérénité.

🗺️ Ta Barre de Navigation (Menu Inférieur)
Le menu en bas de l'écran est ton point de départ pour explorer tout l'écosystème MIRA :

🏠 Accueil : Ton tableau de bord principal de bienvenue avec raccourcis et actualités.

👥 MIRA HUB (Communauté) : Le plus grand réseau d'entraide entre immigrés au Portugal. Partage tes expériences, pose des questions avec traduction instantanée en 4 langues et participe au Fact-Checking Communautaire (vote de véracité pour contrer les fraudes).

💼 Emplois (JobBoard) : Plus de 11 600 offres d'emploi réelles mises à jour quotidiennement (IEFP, Net-Empregos, Jooble, Indeed), avec filtres par district et secteur.

📍 Services Locaux : Carte interactive avec géolocalisation exacte des points d'accueil essentiels (centres de santé, mairies, associations, organismes publics).

📚 Cours et Formations : Pôle de développement professionnel avec formations certifiées reconnues par l'IEFP et la DGES.

📄 Documents et Parcours : Ton centre pour simplifier la bureaucratie avec guides pas à pas et téléchargements de formulaires officiels en PDF.

---

🏆 Système de Gamification et 12 Badges Officiels
Dans ton Profil, accède au système officiel de réputation MIRA. Gagne des points et débloque 12 badges en aidant la communauté et en protégeant les nouveaux arrivants :
• ⭐ Pionnier MIRA : Membre fondateur de la communauté.
• ❤️ Cœur de la Tribu : Reconnaissance pour l'entraide et l'empathie.
• 🔍 Curateur de Contenu : Validateur d'informations fiables et de guides pratiques.
• 📚 Maître des Documents : Expert des démarches et formulaires utiles.
• 💎 Citoyen Exemplaire : Conduite exemplaire et engagement actif.
• 🔥 Mentor Emploi : Soutien à l'insertion professionnelle des talents.
• 🛡️ Sentinelle MIRA : Gardien de l'intégrité et de la qualité du réseau.
• ⚖️ Spécialiste des Lois : Maîtrise du droit des étrangers au Portugal.
• ✅ Citoyen Vérifié : Identité validée par la modération MIRA.
• 🎙️ Voix d'Autorité : Niveau élite avec 500+ points de réputation.
• 🔰 Bouclier Anti-Arnaque : Dénonciateur officiel des fraudes de rendez-vous et faux intermédiaires.
• 🗺️ Guide Local : Évaluateur des services de proximité sur la carte.

---

🚀 Assistants Interactifs et Simulateurs MIRA
Dans les modules Documents et Outils, utilise nos assistants intelligents :
• 🆔 Assistant NIF (Finances - AT) : Guide pour obtenir et mettre à jour ton Numéro Fiscal.
• 🛡️ Assistant NISS (Sécurité Sociale) : Démarche pas à pas pour ton numéro de protection sociale.
• 🧮 Simulateur d'IRS : Calcul de retenue à la source, reçus verts et tranches d'imposition.
• 🚗 Assistant IMT : Guide complet pour l'Échange de Permis de Conduire étranger.
• 🏥 Usager SNS : Inscription au système de santé publique et numéro d'usager.
• ⚖️ Nationalité : Calculateur et règles relatives aux 5 ans de résidence légale.

---

🤖 Besoin d'Aide Supplémentaire ? Utilise l'Assistant MIRA
Sur n'importe quel écran, clique sur le bouton orange flottant avec le robot en bas à droite.
Notre Assistant est entraîné sur les textes officiels en temps réel pour répondre avec clarté et bienveillance.

📱 Astuce : Installe MIRA sur ton téléphone (PWA) ! Ajoute l'application à ton écran d'accueil sur iOS ou Android pour un accès rapide même hors-ligne.`,
    art406_title: 'CONVENTION DE GENÈVE : PROTECTION & DIGNITÉ',
    art406_summary: 'Explorez les piliers de la protection internationale et l\'engagement du Portugal.',
    art406_content: `La Convention de Genève de 1951 est le cadre garantissant la sécurité. Au Portugal :
    
    1. STATUT DE RÉFUGIÉ : Réponse à la persécution.
    2. PROTECTION SUBSIDIAIRE : Sauvegarde contre les risques graves.
    
    DROITS :
    - Santé (SNS) : Accès universel.
    - Dignité : Travail, logement, éducation.
    - Sécurité : Garantie par l'État portugais.`,
    art404_title: 'PORTAIL AIMA 2026 : SOUVERAINETÉ TECH',
    art404_summary: 'Lancement du système intelligent : 50 000 créneaux traités par IA.',
    art404_content: `Modernisation de l'AIMA. Le nouveau système 2026 élimine les intermédiaires.
    
    1. Planification prédictive : IA identifie les cas urgents.
    2. Réseau étendu : 42 nouveaux points de service.
    3. Securité : Confirmation biométrique via app.`,
    art403_title: 'ALERTE LÉGISLATIVE : FIN DE LA MI',
    art403_summary: 'Fin de la Manifestation d\'Intérêt (Art. 88 & 89) : ce qui change pour vous.',
    art403_content: `La Manifestation d'Intérêt est éteinte. Changements :
    1. Visa obligatoire : Entrée travail exige un visa consulaire.
    2. Dossiers en cours : Les MI déjà soumises restent valides.
    3. Portail AIMA : Nouveau système priorise la planification auto.`,
    art410_title: 'STRATÉGIE D\'INTÉGRATION SOUVERAINE 2026',
    art410_summary: 'La bible de la survie et du succès au Portugal : comprendre la nouvelle architecture de l\'État.',
    art410_content: `Le paysage migratoire de 2026 exige plus que de simples documents ; il exige une souveraineté informationnelle.
    
    1. LA NOUVELLE ARCHITECTURE AIMA : Le portail AIMA 2026 est um moteur d\'IA. Votre documentation doit être impeccable.
    2. FIN DES INTERMÉDIAIRES : MIRA est né pour détruire la dépendance aux "facilitateurs". Votre démarche est personnelle.
    3. PROTECTION CONSTITUTIONNELLE : L\'accès au SNS (Santé) e à l\'Éducation Publique est um droit protégé.`,
    art411_title: 'SOUVERAINETÉ FINANCIÈRE : AU-DELÀ DU NIF',
    art411_summary: 'Guide avancé sur la fiscalité pour les immigrés et la protection du patrimoine.',
    art411_content: `Avoir un NIF n'est que la première étape.
    1. RÉSIDENCE FISCALE : Mettez à jour votre domicile fiscal immédiatement pour éviter la double imposition.
    2. LE NOUVEL IRS : Les barèmes de rétention ont changé.
    3. BANQUE DIGITALE : Tout ce qui n'est pas numérique en 2026 n'existe pas pour l'AIMA.`,
  art412_title: 'REVALIDAÇÃO DE DIPLOMA',
  art412_summary: 'Passo a passo para validar diplomas estrangeiros em Portugal.',
  art412_content: `1. Verifique a necessidade de revalidação no seu caso.
2. Reúna documentos: diploma original, histórico, certificado de conclusão, tradução juramentada.
3. Submeta ao serviço de equivalência (DGES).
4. Pague as taxas administrativas.
5. Aguarde a avaliação.
6. Receba o certificado de equivalência.
7. Use o certificado para solicitar reconhecimento profissional ou continuação de estudos.`,
  documents_content: `📄 DOCUMENTOS:
- Diploma original
- Histórico escolar
- Certificado de conclusão
- Tradução juramentada
- Certificado de equivalência (DGES)
- Documentos de suporte (identificação, NIF, NISS)`
  }
};

export const LearningView: React.FC<LearningViewProps> = ({ courses, onNavigateToChat, onEarnPoints, onNavigateToContact, language, initialArticleId }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const [locationFilter, setLocationFilter] = useState('Todos');
  const [typeFilter, setTypeFilter] = useState('Todos');
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [showDGESDetail, setShowDGESDetail] = useState<any | null>(null);
  const [dbArticles, setDbArticles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [extraCourses, setExtraCourses] = useState<Course[]>([]);
  const lastOpenedArticleIdRef = useRef<string | null>(null);

  const { showToast } = useToast();

  const handleCourseAction = (course: Course) => {
    analytics.track('course_click' as any, undefined, course.category, { id: course.id, title: course.title });
    
    if (course.link && course.link !== '#') {
      let finalLink = course.link;
      if (finalLink && !finalLink.startsWith('http') && !finalLink.startsWith('mailto:')) {
        finalLink = `https://${finalLink}`;
      }
      window.open(finalLink, '_blank');
    } else {
      setActiveCourse(course);
    }
  };

  const MIRA_ARTICLES = useMemo(() => [
    {
      id: 408,
      isManual: true,
      sourceId: 'mira',
      date: '25 Abr 2026',
      created_at: '2026-04-25T00:00:00Z',
      category: CATEGORIES.COMMUNITY,
      readTime: '15',
      image: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&q=80&fm=webp',
      isNews: true
    }
  ], [language]);

  const sortedArticles = useMemo(() => {
    const combined = MIRA_ARTICLES.map(a => {
      if (a.isManual) {
        const trans = MANUAL_TRANSLATIONS[language.toUpperCase() as keyof typeof MANUAL_TRANSLATIONS] || MANUAL_TRANSLATIONS.PT;
        const artKeyPrefix = a.id === 408 ? '' : `art${a.id}_`;
        return { 
          ...a, 
          title: (trans as any)[`${artKeyPrefix}title`] || (a as any).title,
          summary: (trans as any)[`${artKeyPrefix}summary`] || (a as any).summary,
          content: (trans as any)[`${artKeyPrefix}content`] || (a as any).content
        };
      }
      return a;
    }).concat(dbArticles);

    return combined.map((a: any) => ({
      ...a,
      category: normalizeCategory(a.category, a.title)
    })).sort((a: any, b: any) => {
        if (a.isManual && !b.isManual) return -1;
        if (!a.isManual && b.isManual) return 1;
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (dateA && dateB) return dateB - dateA;
        return (Number(a.id) || 0) - (Number(b.id) || 0);
    });
  }, [dbArticles, MIRA_ARTICLES, language]);

  const displayedArticle = useMemo(() => {
    if (!selectedArticle) return null;
    return sortedArticles.find(a => String(a.id) === String(selectedArticle.id)) || selectedArticle;
  }, [selectedArticle, sortedArticles]);

  useEffect(() => {
    setIsLoading(false);
    
    // Dynamic load of massive databases
    Promise.all([
      import('../utils/iefpCoursesDatabase'),
      import('../utils/dgesCoursesDatabase')
    ]).then(([{ IEFP_MASSIVE_DATABASE }, { DGES_RECOGNIZED_DATABASE }]) => {
      setExtraCourses([...IEFP_MASSIVE_DATABASE, ...DGES_RECOGNIZED_DATABASE]);
    });
  }, [language]);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const artId = initialArticleId || params.get('article');
    if (artId && sortedArticles.length > 0) {
      if (lastOpenedArticleIdRef.current !== artId) {
        const target = sortedArticles.find(a => String(a.id) === String(artId));
        if (target) {
          console.log('Navigated to article ID:', artId);
          lastOpenedArticleIdRef.current = artId;
          setSelectedArticle(target);
          const newUrl = window.location.pathname + window.location.search.replace(/[?&]article=\d+/, '');
          window.history.replaceState({}, '', newUrl || '/');
        }
      }
    }
  }, [sortedArticles, initialArticleId]);

  const filteredArticles = sortedArticles.filter(a => 
    ((a as any).title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    ((a as any).summary || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    ((a as any).content || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const allCourses = useMemo(() => {
    const map = new Map<string, Course>();
    
    extraCourses.forEach(c => {
      if (!c.id) return;
      const isDges = Boolean(c.isDgesRecognized || c.id.startsWith('dges') || c.id.startsWith('ctesp') || c.id.startsWith('dg-') || c.id.startsWith('ts-') || (c.link && c.link.includes('dges.gov.pt')));
      map.set(c.id, {
        ...c,
        category: normalizeCategory(c.category, c.title),
        isDgesRecognized: isDges
      });
    });

    courses.forEach(c => {
      if (!c.id) return;
      const existing = map.get(c.id);
      const isDges = Boolean(c.isDgesRecognized || existing?.isDgesRecognized || c.id.startsWith('dges') || c.id.startsWith('ctesp') || c.id.startsWith('dg-') || c.id.startsWith('ts-') || (c.link && c.link.includes('dges.gov.pt')));
      map.set(c.id, {
        ...(existing || {}),
        ...c,
        category: normalizeCategory(c.category, c.title),
        isDgesRecognized: isDges
      });
    });

    return Array.from(map.values()).sort((a, b) => {
        if (a.isDgesRecognized && !b.isDgesRecognized) return -1;
        if (!a.isDgesRecognized && b.isDgesRecognized) return 1;
        return (b.isIefpSynced ? 1 : 0) - (a.isIefpSynced ? 1 : 0);
    });
  }, [courses, extraCourses]);

  const COURSE_LOCATIONS = useMemo(() => [
    'Todos',
    'Nacional / Online',
    'Lisboa',
    'Porto',
    'Braga',
    'Setúbal',
    'Faro',
    'Coimbra',
    'Aveiro',
    'Leiria',
    'Santarém',
    'Viseu',
    'Viana do Castelo',
    'Vila Real',
    'Bragança',
    'Guarda',
    'Castelo Branco',
    'Portalegre',
    'Évora',
    'Beja',
    'Madeira',
    'Açores'
  ], []);

  const availableCategories = useMemo(() => {
    // Include all 10 UNIFIED_CATEGORIES guaranteed
    const catSet = new Set<string>(UNIFIED_CATEGORIES);
    allCourses.forEach(c => {
      if (c.category) catSet.add(c.category);
    });
    return Array.from(catSet);
  }, [allCourses]);

  const filteredCourses = allCourses.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const normalizedCat = normalizeCategory(c.category, c.title);
    const matchesCategory = categoryFilter === 'Todos' || 
                            c.category === categoryFilter || 
                            normalizedCat === categoryFilter;
    
    const isDges = Boolean(c.isDgesRecognized || c.id?.startsWith('dges') || c.id?.startsWith('ctesp') || c.id?.startsWith('dg-') || c.id?.startsWith('ts-') || c.link?.includes('dges.gov.pt'));
    const isIefp = Boolean(c.isIefpSynced || c.link?.includes('iefp') || (!isDges));

    const matchesType = typeFilter === 'Todos' || 
                        (typeFilter === 'DGES' && isDges) ||
                        (typeFilter === 'IEFP' && isIefp);

    const matchesLocation = (() => {
      if (locationFilter === 'Todos') return true;
      if (locationFilter === 'Nacional / Online') {
        const typeStr = (c.type || '').toLowerCase();
        const descStr = (c.description || '').toLowerCase();
        return typeStr.includes('online') || typeStr.includes('remoto') || typeStr.includes('híbrido') || descStr.includes('online') || descStr.includes('e-learning') || descStr.includes('nacional');
      }

      const locTarget = locationFilter.toLowerCase();
      const courseText = `${c.title} ${c.description || ''} ${c.category || ''} ${(c as any).location || ''} ${(c as any).city || ''}`.toLowerCase();
      const isOnlineOrHybrid = (c.type || '').toLowerCase().includes('online') || (c.type || '').toLowerCase().includes('remoto') || (c.type || '').toLowerCase().includes('híbrido') || (c.description || '').toLowerCase().includes('online');

      return courseText.includes(locTarget) || isOnlineOrHybrid;
    })();

    return matchesSearch && matchesCategory && matchesType && matchesLocation;
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, typeFilter, locationFilter]);

  const ITEMS_PER_PAGE = 20;
  const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);
  const paginatedCourses = filteredCourses.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const latestNews = useMemo(() => sortedArticles.find(a => a.isManual) || sortedArticles.find(a => a.isNews), [sortedArticles]);

  useEffect(() => {
    if (selectedArticle) {
      const userId = localStorage.getItem('mira_user_id');
      analytics.track('read_article' as any, userId || 'guest', selectedArticle.category, {
        articleId: selectedArticle.id,
        title: selectedArticle.title
      });
    }
  }, [selectedArticle]);

  if (displayedArticle) {
    return (
      <div className="flex flex-col h-full bg-white animate-in slide-in-from-right-10 duration-500 font-sans">
        <div className="relative h-80 sm:h-[32rem] w-full overflow-hidden">
          <img 
            src={getImageUrl(displayedArticle.image) || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80'} 
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80'; }} 
            alt="" 
            className="w-full h-full object-cover" 
            referrerPolicy="no-referrer" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent"></div>
          
          <button 
            onClick={() => setSelectedArticle(null)} 
            className="absolute top-8 left-8 p-4 bg-white/80 backdrop-blur-2xl rounded-3xl text-slate-900 border border-slate-200 shadow-2xl active:scale-95 z-10 hover:bg-mira-orange hover:text-white transition-all group"
          >
            <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
          </button>
 
          {displayedArticle.isNews && (
            <div className="absolute bottom-10 left-10 bg-red-600/90 backdrop-blur-xl text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 shadow-2xl animate-pulse">
              <Sparkles size={16} /> {t('newsroom', language)}
            </div>
          )}
        </div>
 
        <div className="flex-1 overflow-y-auto px-8 py-12 no-scrollbar pb-40">
          <div className="max-w-3xl mx-auto space-y-10">
            <div className="flex items-center gap-5">
              <span className={`text-[10px] font-black ${displayedArticle.isNews ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-100 text-slate-500 border border-slate-200'} px-5 py-2 rounded-full uppercase tracking-[0.2em]`}>
                {t(getCategoryKey(displayedArticle.category), language)}
              </span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Calendar size={14} /> {displayedArticle.date}
              </span>
            </div>
 
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tighter leading-[1.05] uppercase">
              <TranslatedText 
                text={displayedArticle.title} 
                language={language} 
                shouldTranslate={!displayedArticle.isManual && language !== 'PT'} 
              />
            </h1>
 
            <div className="prose max-w-none text-lg text-slate-600 font-medium leading-relaxed overflow-hidden border-l-4 border-mira-orange/20 pl-8 py-2">
              {displayedArticle.content.split('\n').map((para: string, i: number) => {
                  if (!para.trim()) return null;
                  const isBullet = para.trim().startsWith('* ');
                  const cleanPara = isBullet ? para.trim().substring(2) : para;
                  const parts = cleanPara.split(/(\*\*.*?\*\*)/g);
                  return (
                    <div key={i} className={`mb-4 ${isBullet ? "pl-4 border-l-2 border-slate-200 relative" : ""}`}>
                      {isBullet && <div className="absolute left-[-1px] top-2.5 w-2 h-2 bg-slate-300 rounded-full" style={{ transform: 'translateX(-50%)' }}></div>}
                      {parts.map((part, j) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                          return <strong key={j} className="text-slate-800 font-black"><TranslatedText text={part.slice(2, -2)} language={language} shouldTranslate={!displayedArticle.isManual && language !== 'PT'} /></strong>;
                        }
                        return <span key={j}><TranslatedText text={part} language={language} shouldTranslate={!displayedArticle.isManual && language !== 'PT'} /></span>;
                      })}
                    </div>
                  );
              })}
            </div>
 
            <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 mt-12">
              <div className="flex items-start gap-5 text-slate-400">
                <Info size={24} className="shrink-0 mt-1 text-mira-orange/50" />
                <p className="text-xs font-bold leading-relaxed">
                  {t('learning_ai_disclaimer', language)}
                </p>
              </div>
            </div>
 
            <div onClick={onNavigateToChat} className="p-8 bg-gradient-to-br from-mira-orange/5 to-transparent border border-mira-orange/10 rounded-[3rem] cursor-pointer hover:from-mira-orange/10 transition-all flex items-center gap-6 group">
              <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform overflow-hidden border border-slate-100">
                <img src={MIRA_PHOTO_URL} className="w-full h-full object-cover" alt="MIRA" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1">{t('learning_chat_question', language)}</p>
                <p className="text-[10px] text-mira-orange font-black uppercase tracking-[0.2em] flex items-center gap-2">{t('learning_chat_button', language)} <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" /></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 pb-24 font-sans overflow-hidden">
      <div className="bg-white/80 backdrop-blur-2xl border-b border-slate-100 p-6 space-y-6 sticky top-0 z-20 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div>
            <h2 className="mira-module-title text-slate-900">
              {t('learning_courses', language) || t('learning_title', language)}
            </h2>
          </div>
        </div>

        <div className="relative group max-w-3xl mx-auto w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-mira-orange transition-all duration-300" size={20} />
          <input
            type="text"
            placeholder={t('learning_search_courses', language)}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 py-5 pl-16 pr-6 rounded-[2rem] text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-mira-orange/10 focus:border-mira-orange/30 transition-all placeholder:text-slate-300 relative z-10 font-medium shadow-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="relative space-y-1.5 flex-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
              {t('learning_course_category', language) || "Área / Categoria"}
            </label>
            <div className="relative group">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-mira-orange transition-colors pointer-events-none" size={16} />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none focus:bg-white focus:border-mira-orange/40 focus:ring-4 focus:ring-mira-orange/5 transition-all shadow-sm appearance-none cursor-pointer"
              >
                <option value="Todos">{t('map_all_areas', language) || "Todas as Áreas de Apoio"}</option>
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{t(getCategoryKey(cat), language) || cat}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} />
            </div>
          </div>

          <div className="relative space-y-1.5 flex-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
              {language === 'PT' ? 'Distrito / Cidade' : language === 'ES' ? 'Distrito / Ciudad' : language === 'FR' ? 'District / Ville' : 'District / Location'}
            </label>
            <div className="relative group">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-mira-orange transition-colors pointer-events-none" size={16} />
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none focus:bg-white focus:border-mira-orange/40 focus:ring-4 focus:ring-mira-orange/5 transition-all shadow-sm appearance-none cursor-pointer"
              >
                {COURSE_LOCATIONS.map(loc => (
                  <option key={loc} value={loc}>
                    {loc === 'Todos' ? (t('jobs_all_districts', language) || 'Todos os Distritos') : loc}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} />
            </div>
          </div>

          <div className="relative space-y-1.5 flex-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
              {t('learning_cert_source', language) || "Certificação"}
            </label>
            <div className="relative group">
              <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-mira-orange transition-colors pointer-events-none" size={16} />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none focus:bg-white focus:border-mira-orange/40 focus:ring-4 focus:ring-mira-orange/5 transition-all shadow-sm appearance-none cursor-pointer"
              >
                <option value="Todos">{t('learning_all_sources', language) || "Todas as Fontes"}</option>
                <option value="DGES">DGES — {allCourses.filter(c => c.isDgesRecognized).length} Cursos</option>
                <option value="IEFP">IEFP — {allCourses.filter(c => c.isIefpSynced).length} Cursos</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            </div>
          </div>
        </div>
      </div>

    <div className="flex-1 overflow-y-auto p-6 space-y-10 no-scrollbar pb-32">
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
              {paginatedCourses.map((course) => (
              <div 
                key={course.id} 
                className={`bg-white rounded-[3rem] overflow-hidden shadow-sm border transition-all duration-500 group relative flex flex-col hover:shadow-xl ${
                  course.isDgesRecognized ? 'border-blue-100 hover:border-blue-400' : 'border-slate-100 hover:border-mira-orange/30'
                }`}
              >
                <div className="h-64 w-full bg-slate-100 relative overflow-hidden flex-shrink-0">
                  <img 
                    src={getImageUrl(course.image) || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80'} 
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80'; }} 
                    alt={course.title} 
                    className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-[3000ms]" 
                    referrerPolicy="no-referrer" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
                  
                  <div className="absolute top-8 right-8 bg-white/80 backdrop-blur-md text-slate-900 text-[10px] font-black px-4 py-2 rounded-2xl uppercase tracking-[0.15em] border border-slate-200 shadow-sm">
                    {t(getCategoryKey(course.category), language)}
                  </div>
                  
                  {course.isIefpSynced && (
                    <div className="absolute bottom-8 left-8 bg-[#22c55e] text-white px-5 py-2.5 rounded-2xl shadow-xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
                      <Sparkles size={16} /> 
                      <span className="leading-none mt-0.5">{t('iefp_official', language)}</span>
                    </div>
                  )}

                  {course.isDgesRecognized && (
                    <div className="absolute bottom-8 left-8 bg-blue-600 text-white px-5 py-2.5 rounded-2xl shadow-xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest border border-white/20">
                      <CheckCircle2 size={16} /> 
                      <span className="leading-none mt-0.5">{t('dges_official', language)}</span>
                    </div>
                  )}
                </div>
                
                <div className="p-10 pt-4 flex flex-col flex-1">
                  <h4 className={`font-black text-2xl tracking-tighter uppercase leading-[1.1] mb-4 transition-all duration-500 min-h-[3rem] ${
                    course.isDgesRecognized ? 'text-blue-900 group-hover:text-blue-600' : 'text-slate-900 group-hover:text-mira-orange'
                  }`}>
                      <TranslatedText text={course.title} language={language} shouldTranslate={language !== 'PT'} />
                  </h4>
                  <p className="text-sm text-slate-500 font-medium mb-10 leading-relaxed line-clamp-3">
                    {(() => {
                      const transKey = `course_${course.id?.replace(/-/g, '')}_desc`;
                      const manualTrans = t(transKey, language);
                      
                      if (manualTrans !== transKey) {
                        return manualTrans;
                      }
                      
                      return (
                        <TranslatedText 
                          text={course.description.replace(/\*/g, '').substring(0, 150) + (course.description.length > 150 ? '...' : '')} 
                          language={language} 
                          shouldTranslate={language !== 'PT'} 
                        />
                      );
                    })()}
                  </p>
                  
                  <div className="mt-auto flex flex-col sm:flex-row items-start sm:items-center justify-between pt-8 border-t border-slate-50 gap-4">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">
                      <Calendar size={16} className="text-mira-orange/50" /> 
                      {course.duration}
                    </div>
                    
                    <button 
                      onClick={() => { 
                        onEarnPoints(10); 
                        handleCourseAction(course);
                      }} 
                      className={`w-full sm:w-auto px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all duration-500 shadow-lg shrink-0 ${
                        course.isDgesRecognized
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'
                        : course.isIefpSynced 
                          ? 'bg-mira-orange text-white hover:bg-orange-600 shadow-orange-500/20' 
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      {t('course_card_access', language)}
                      <ExternalLink size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-12 pb-8">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-3 rounded-full bg-white border border-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors shadow-sm"
              >
                <ArrowLeft size={18} />
              </button>
              
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNumber = idx + 1;
                  if (
                    pageNumber === 1 || 
                    pageNumber === totalPages || 
                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`w-10 h-10 rounded-full text-xs font-black transition-colors ${
                          currentPage === pageNumber
                            ? 'bg-mira-orange text-white shadow-lg shadow-orange-500/30'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  }
                  if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                    return <span key={pageNumber} className="text-slate-400 px-1">...</span>;
                  }
                  return null;
                })}
              </div>
              
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-3 rounded-full bg-white border border-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors shadow-sm"
              >
                <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* DGES Detailed Modal */}
      {showDGESDetail && (
        <div className="fixed inset-0 z-[10000] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg max-h-[90vh] flex flex-col rounded-[2rem] sm:rounded-[3rem] overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-500">
            <div className="p-6 sm:p-8 space-y-6 overflow-y-auto no-scrollbar flex-1">
              <div className="flex justify-between items-start">
                <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
                  <GraduationCap size={32} />
                </div>
                <button onClick={() => setShowDGESDetail(null)} className="p-2 bg-slate-50 text-slate-400 rounded-xl hover:text-slate-900 transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                   <span className="px-3 py-1 bg-blue-600 text-white text-[8px] font-black uppercase tracking-widest rounded-md">CURSO DGES</span>
                   <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[8px] font-black uppercase tracking-widest rounded-md border border-blue-100">RECONHECIDO</span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-tight">{showDGESDetail.title}</h3>
                <div className="text-xs text-slate-500 font-medium leading-relaxed overflow-y-auto max-h-[35vh] pr-2 no-scrollbar space-y-3">
                  {showDGESDetail.description.split('\n').map((para: string, i: number) => {
                    if (!para.trim()) return null;
                    const isBullet = para.trim().startsWith('* ');
                    const cleanPara = isBullet ? para.trim().substring(2) : para;
                    const parts = cleanPara.split(/(\*\*.*?\*\*)/g);
                    return (
                      <div key={i} className={isBullet ? "pl-4 border-l-2 border-slate-200 relative" : ""}>
                        {isBullet && <div className="absolute left-[-1px] top-1.5 w-2 h-2 bg-slate-300 rounded-full" style={{ transform: 'translateX(-50%)' }}></div>}
                        {parts.map((part, j) => {
                          if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={j} className="text-slate-800 font-black">{part.slice(2, -2)}</strong>;
                          }
                          return <span key={j}>{part}</span>;
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                  <Building2 size={20} className="text-blue-500" />
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Instituição</p>
                    <p className="text-xs font-bold text-slate-800">{showDGESDetail.institution}</p>
                  </div>
                </div>
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4">
                  <Info size={20} className="text-blue-500" />
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Vantagem Soberana</p>
                    <p className="text-xs font-bold text-slate-800">Garante Residência por Estudos</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => {
                  const url = showDGESDetail.link;
                  setShowDGESDetail(null);
                  window.open(url, '_blank');
                }}
                className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                ACEDER AO PORTAL DGES <ExternalLink size={18} />
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};
