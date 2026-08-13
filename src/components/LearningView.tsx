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
    title: '📖 MANUAL DO UTILIZADOR – MIRA',
    summary: 'Bem-vindo ao MIRA, o teu escudo e a tua bússola em Portugal! Criámos este guia rápido para te localizares facilmente dentro da nossa aplicação e saberes o que encontras em cada secção.',
    content: `🔒 Segurança e Privacidade em Primeiro Lugar: O MIRA é 100% seguro. Nós não guardamos as tuas informações pessoais. Podes navegar, consultar os teus documentos e tirar as tuas dúvidas com total privacidade e tranquilidade.

🗺️ A tua Barra de Navegação (Menu Inferior)
O menu na parte de baixo do ecrã é o teu ponto de partida para explorar o ecossistema MIRA:

🏠 Início: O teu painel principal de boas-vindas.

👥 MIRA HUB: A nossa rede social e maior comunidade de apoio entre imigrantes. Partilha experiências e conecta-te com quem já chegou.

💼 Empregos: Acesso a mais de 5.000 vagas de trabalho filtradas para o talento internacional.

📍 Serviços: Mapa com geolocalização exata de 178 pontos de apoio essenciais (centros de saúde, associações e órgãos públicos).

📚 Cursos: Central de evolução profissional com 156 cursos certificados (reconhecidos pelo IEFP e DGES).

📄 Documentos: Onde encontras a tua Jornada MIRA para descomplicares toda a burocracia.

🚀 Dentro do Módulo "Documentos": A Jornada MIRA
Ao clicares no ícone de Documentos, tens acesso a guias práticos com downloads de formulários oficiais em PDF. A tua jornada divide-se em caminhos claros:

📄 Documentos: Formulários oficiais prontos a usar e o passo a passo para o teu dia a dia (como o IMT para a Troca de Carta de Condução).

📋 Legalização: Tudo o que precisas para descobrir e estruturar o teu Visto em Portugal.

⚖️ Cidadania: Informações atualizadas sobre Passaporte e Leis de nacionalidade.

💼 Empreender: O teu guia prático para abrir e gerir Negócios em Portugal.

🎓 Educação & Diplomas: O caminho certo para Revalidação e Equivalências de estudos.

🛡️ Os Documentos Essenciais
Mais abaixo, encontras secções dedicadas aos passos obrigatórios e iniciais da tua chegada:

🏠 Morada e Alojamento: Como fazer o teu Registo de Residência em Portugal.

🏦 Abertura de Conta Bancária: Quais os bancos, regras de KYC e como aderir.

🆔 NIF (Finanças - AT): Guia completo para o teu Número de Identificação Fiscal.

🛡️ NISS (Segurança Social): Como obter o teu Número de Identificação da Segurança Social.

🏥 Utente SNS (Saúde Pública): Como te registares no sistema público de saúde e acederes a hospitais e centros de saúde.

🤖 Precisa de Ajuda Extra? Usa o Chat MIRA
Em qualquer ecrã, vais ver um botão cor-de-laranja flutuante com um robô no canto inferior direito.

Apenas tens de clicar nele para falar com o nosso Assistente. É uma inteligência artificial humanizada, alimentada com dados oficiais em tempo real, pronta para responder com precisão a qualquer dúvida, sem registar ou guardar os teus dados privados.

💡 Dica: O MIRA é um ecossistema 100% gratuito e focado na tua proteção. Usa a bússola e faz a tua jornada ao teu próprio ritmo!`,
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
    title: '📖 USER MANUAL – MIRA',
    summary: 'Welcome to MIRA, your shield and compass in Portugal! We created this quick guide to help you easily locate yourself within our application and know what you can find in each section.',
    content: `🔒 Security and Privacy First: MIRA is 100% secure. We do not store your personal information. You can browse, consult your documents, and clear your doubts with total privacy and peace of mind.

🗺️ Your Navigation Bar (Bottom Menu)
The menu at the bottom of the screen is your starting point to explore the MIRA ecosystem:

🏠 Home: Your main welcome dashboard.

👥 MIRA HUB: Our social network and largest support community among immigrants. Share experiences and connect with those who have already arrived.

💼 Jobs: Access to more than 5,000 job vacancies filtered for international talent.

📍 Services: Map with the exact geolocation of 178 essential support points (health centers, associations, and public bodies).

📚 Courses: Professional development hub with 156 certified courses (recognized by IEFP and DGES).

📄 Documents: Where you find your MIRA Journey to simplify all bureaucracy.

🚀 Inside the "Documents" Module: The MIRA Journey
When you click on the Documents icon, you have access to practical guides with official form downloads in PDF. Your journey is divided into clear paths:

📄 Documents: Official forms ready to use and a step-by-step guide for your daily life (such as IMT for Driving License Exchange).

📋 Legalization: Everything you need to discover and structure your Visa in Portugal.

⚖️ Citizenship: Updated information on Passport and Nationality laws.

💼 Entrepreneurship: Your practical guide to opening and managing Businesses in Portugal.

🎓 Education & Diplomas: The right path for Degree Validation and Equivalencies of studies.

🛡️ Essential Documents
Below, you will find sections dedicated to the mandatory and initial steps of your arrival:

🏠 Address and Accommodation: How to register your Residence in Portugal.

🏦 Opening a Bank Account: Which banks, KYC rules, and how to join.

🆔 NIF (Tax Authority - AT): Complete guide to your Tax Identification Number.

🛡️ NISS (Social Security): How to obtain your Social Security Identification Number.

🏥 SNS User (Public Health): How to register in the public health system and access hospitals and health centers.

🤖 Need Extra Help? Use MIRA Chat
On any screen, you will see a floating orange button with a robot in the bottom right corner.

Just click on it to speak with our Assistant. It is a humanized artificial intelligence, powered by official data in real time, ready to answer any question with precision, without registering or storing your private data.

💡 Tip: MIRA is a 100% free ecosystem focused on your protection. Use the compass and make your journey at your own pace!`,
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
    title: '📖 MANUAL DEL USUARIO – MIRA',
    summary: '¡Bienvenido a MIRA, tu escudo y tu brújula en Portugal! Hemos creado esta guía rápida para que te localices fácilmente dentro de nuestra aplicación y sepas qué encuentras en cada sección.',
    content: `🔒 Seguridad y Privacidad Primero: MIRA es 100% seguro. Nosotros no guardamos tu información personal. Puedes navegar, consultar tus documentos y resolver tus dudas con total privacidad y tranquilidad.

🗺️ Tu Barra de Navegación (Menú Inferior)
El menú en la parte inferior de la pantalla es tu punto de partida para explorar el ecosistema MIRA:

🏠 Inicio: Tu panel principal de bienvenida.

👥 MIRA HUB: Nuestra red social y la mayor comunidad de apoyo entre inmigrantes. Comparte experiencias y conéctate con quienes ya llegaron.

💼 Empleos: Acceso a más de 5.000 ofertas de trabajo filtradas para el talento internacional.

📍 Servicios: Mapa con geolocalización exacta de 178 puntos de apoyo esenciales (centros de salud, asociaciones y organismos públicos).

📚 Cursos: Central de evolución profesional con 156 cursos certificados (reconocidos por el IEFP y la DGES).

📄 Documentos: Donde encuentras tu Jornada MIRA para descomplicar toda la burocracia.

🚀 Dentro del Módulo "Documentos": La Jornada MIRA
Al hacer clic en el icono de Documentos, tienes acceso a guías prácticas con descargas de formularios oficiales en PDF. Tu jornada se divide en caminos claros:

📄 Documentos: Formularios oficiales listos para usar y el paso a paso para tu día a día (como el IMT para el Canje de Licencia de Conducir).

📋 Legalización: Todo lo que necesitas para descubrir y estructurar tu Visado en Portugal.

⚖️ Ciudadanía: Información actualizada sobre Pasaporte y Leyes de nacionalidad.

💼 Emprender: Tu guía práctica para abrir y gestionar Negocios en Portugal.

🎓 Educación & Diplomas: El camino correcto para Revalidación e Equivalencias de estudios.

🛡️ Los Documentos Esenciales
Más abajo, encuentras secciones dedicadas a los pasos obligatorios e iniciales de tu llegada:

🏠 Dirección y Alojamiento: Cómo hacer tu Registro de Residencia en Portugal.

🏦 Apertura de Cuenta Bancaria: Qué bancos, reglas de KYC y cómo adherirte.

🆔 NIF (Hacienda - AT): Guía completa para tu Número de Identificación Fiscal.

🛡️ NISS (Seguridad Social): Cómo obtener tu Número de Identificación de la Seguridad Social.

🏥 Usuario SNS (Salud Pública): Cómo registrarte en el sistema público de salud y acceder a hospitales y centros de salud.

🤖 ¿Necesitas Ayuda Extra? Usa el Chat MIRA
En cualquier pantalla, verás un botón naranja flotante con un robot en la esquina inferior derecha.

Solo tienes que hacer clic en él para hablar con nuestro Asistente. Es una inteligencia artificial humanizada, alimentada con datos oficiales en tiempo real, lista para responder con precisión a cualquier duda, sin registrar ni guardar tus datos privados.

💡 Consejo: MIRA es un ecosistema 100% gratuito y enfocado en tu protección. ¡Usa la brújula y haz tu jornada a tu propio ritmo!`,
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
    title: '📖 MANUEL DE L\'UTILISATEUR – MIRA',
    summary: 'Bienvenue sur MIRA, ton bouclier et ta boussole au Portugal ! Nous avons créé ce guide rapide pour t\'aider à te repérer facilement dans notre application et à savoir ce que tu trouveras dans chaque section.',
    content: `🔒 Sécurité et Confidentialité d'abord : MIRA est 100% sécurisé. Nous ne conservons pas vos informations personnelles. Vous pouvez naviguer, consulter vos documents et poser vos questions en toute confidentialité et sérénité.

🗺️ Ta Barre de Navigation (Menu Inférieur)
Le menu en bas de l'écran est ton point de départ pour explorer l'écosystème MIRA :

🏠 Accueil : Ton tableau de bord principal de bienvenue.

👥 MIRA HUB : Notre réseau social et la plus grande communauté de soutien entre immigrés. Partage tes expériences et connecte-toi avec ceux qui sont déjà arrivés.

💼 Emplois : Accès à plus de 5 000 offres d'emploi filtrées pour les talents internationaux.

📍 Services : Carte avec géolocalisation exacte de 178 points de soutien essentiels (centres de santé, associations et organismes publics).

📚 Cursos (Cours) : Centre de développement professionnel avec 156 cours certifiés (reconnus par l'IEFP et la DGES).

📄 Documents : Où tu trouveras ton Parcours MIRA pour simplifier toutes les démarches administratives.

🚀 Dans le Module "Documents" : Le Parcours MIRA
En cliquant sur l'icône Documents, tu accèdes à des guides pratiques avec téléchargement de formulaires officiels en PDF. Ton parcours est divisé en chemins clairs :

📄 Documents : Formulaires officiels prêts à l'emploi et guide étape par étape pour ton quotidien (comme l'IMT pour l'Échange de Permis de Conduire).

📋 Légalisation : Tout ce dont tu as besoin pour découvrir et structurer ton Visa au Portugal.

⚖️ Citoyenneté : Informations à jour sur le Passeport et les Lois sur la nationalité.

💼 Entreprendre : Ton guide pratique pour ouvrir et gérer des Entreprises au Portugal.

🎓 Éducation & Diplômes : Le bon chemin pour la Validation et l'Équivalence des études.

🛡️ Les Documents Essentiels
Plus bas, tu trouveras des sections dédiées aux étapes obligatoires et initiales de ton arrivée :

🏠 Adresse et Logement : Comment enregistrer ton justificatif de Domicile au Portugal.

🏦 Ouverture de Compte Bancária : Quelles banques, règles KYC et comment y adhérer.

🆔 NIF (Impôts - AT) : Guide complet pour ton Numéro d'Identification Fiscale.

🛡️ NISS (Sécurité Sociale) : Comment obtenir ton Numéro d'Identification de la Sécurité Sociale.

🏥 Usager SNS (Santé Publique) : Comment t'inscrire au système de santé publique et accéder aux hôpitaux et centres de santé.

🤖 Besoin d'Aide Supplémentaire ? Utilise le Chat MIRA
Sur n'importe quel écran, tu verras un bouton orange flottant avec un robot dans le coin inférieur droit.

Il te suffit de cliquer dessus pour parler à notre Assistant. C'est une intelligence artificielle humanisée, alimentée par des données officielles en temps réel, prête à répondre avec précision à toutes tes questions, sans enregistrer ni conserver tes données privées.

💡 Conseil : MIRA est un écosystème 100% gratuit et axé sur ta protection. Utilise la boussole et fais ton parcours à ton propre rythme!`,
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
  const [activeTab, setActiveTab] = useState<'articles' | 'courses'>('courses');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');
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
    },
    {
      id: 410,
      isManual: true,
      sourceId: 'aima',
      date: '25 Abr 2026',
      created_at: '2026-04-25T00:00:00Z',
      category: CATEGORIES.RIGHTS,
      readTime: '12',
      image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80&fm=webp',
      isNews: false
    },
    {
      id: 411,
      isManual: true,
      sourceId: 'at',
      date: '25 Abr 2026',
      created_at: '2026-04-25T00:00:00Z',
      category: CATEGORIES.FINANCE,
      readTime: '10',
      image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80&fm=webp',
      isNews: false
    },
    {
      id: 406,
      isManual: true,
      sourceId: 'aima/cpr',
      date: '28 Mar 2026',
      created_at: '2026-03-28T00:00:00Z',
      category: CATEGORIES.HUMANITARIAN,
      readTime: '7',
      image: 'https://images.unsplash.com/photo-1532153975070-2e9ab71f1b14?w=800&q=80&fm=webp',
      isNews: false
    },
    {
      id: 404,
      isManual: true,
      sourceId: 'aima',
      date: '25 Mar 2026',
      created_at: '2026-03-25T00:00:00Z',
      category: CATEGORIES.RIGHTS,
      readTime: '5',
      image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80&fm=webp',
      isNews: false
    },
    {
      id: 403,
      isManual: true,
      sourceId: 'aima',
      date: '05 Mar 2026',
      created_at: '2026-03-05T00:00:00Z',
      category: CATEGORIES.RIGHTS,
      readTime: '6',
      image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80&fm=webp',
      isNews: false
    },
    {
      id: 401,
      isManual: true,
      sourceId: 'aima',
      date: '10 Jan 2026',
      created_at: '2026-01-10T00:00:00Z',
      category: CATEGORIES.EDUCATION,
      readTime: '5',
      image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80&fm=webp',
      isNews: false
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

    return combined.map(a => ({
      ...a,
      category: normalizeCategory(a.category)
    })).sort((a, b) => {
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
    const fetchKnowledgeBase = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('ai_knowledge')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          const mapped = data
            .filter((item: any) => item.topic || item.information) // Skip completely empty rows
            .map((item: any) => {
              let rawTitle = item.topic || '';
              let rawContent = item.information || '';

              // If title is massively long, it's actually the content
              if (rawTitle.length > 150) {
                 rawContent = rawTitle + (rawContent ? '\n\n' + rawContent : '');
                 rawTitle = rawContent.substring(0, 50) + '...';
              }
              
              // If title is empty but we have content
              if (!rawTitle && rawContent) {
                 rawTitle = rawContent.substring(0, 50) + '...';
              }

              // Clean asterisks for the preview UI
              const cleanTitle = rawTitle.replace(/\*/g, '').trim();
              const cleanSummary = rawContent.replace(/\*/g, '').substring(0, 150) + '...';

              return {
                id: item.id,
                title: cleanTitle || 'Documentação MIRA',
                summary: cleanSummary,
                content: rawContent,
                sourceId: 'aima',
                date: new Date(item.created_at).toLocaleDateString(
                  language === 'EN' ? 'en-US' : 
                  language === 'ES' ? 'es-ES' : 
                  language === 'FR' ? 'fr-FR' : 'pt-PT'
                ),
                category: item.category || CATEGORIES.RIGHTS,
                readTime: '5',
                image: item.image_url || 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&q=80&fm=webp',
                isNews: false
              };
          });
          setDbArticles(mapped);
        }
      } catch (e) {
        console.error("Error fetching knowledge base:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchKnowledgeBase();
    
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
          setActiveTab('articles');
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
    const seen = new Set<string>();
    const combined = [...courses, ...extraCourses].map(c => ({
      ...c,
      category: normalizeCategory(c.category)
    }));
    const filtered = combined.filter(c => {
      if (!c.id || seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
    return filtered.sort((a, b) => {
        if (a.isDgesRecognized && !b.isDgesRecognized) return -1;
        if (!a.isDgesRecognized && b.isDgesRecognized) return 1;
        return (b.isIefpSynced ? 1 : 0) - (a.isIefpSynced ? 1 : 0);
    });
  }, [courses, extraCourses]);

  const filteredCourses = allCourses.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'Todos' || c.category === categoryFilter;
    
    const matchesType = typeFilter === 'Todos' || 
                        (typeFilter === 'DGES' && c.isDgesRecognized) ||
                        (typeFilter === 'IEFP' && c.isIefpSynced);

    return matchesSearch && matchesCategory && matchesType;
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, typeFilter, activeTab]);

  const ITEMS_PER_PAGE = 20;
  const totalPages = Math.ceil(filteredCourses.length / ITEMS_PER_PAGE);
  const paginatedCourses = filteredCourses.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);


  const availableCategories = useMemo(() => {
    const cats = Array.from(new Set(allCourses.map(c => c.category)));
    return cats.sort();
  }, [allCourses]);

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
              {t('learning_title', language)}
            </h2>
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner w-full sm:w-auto self-end sm:self-center">
            <button 
              onClick={() => setActiveTab('courses')} 
              className={`flex-1 px-5 sm:px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 whitespace-nowrap ${
                activeTab === 'courses' 
                ? 'bg-slate-900 text-white shadow-md scale-[1.02] transform' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
              }`}
            >
              {t('learning_courses', language)}
            </button>
            <button 
              onClick={() => setActiveTab('articles')} 
              className={`flex-1 px-5 sm:px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 whitespace-nowrap ${
                activeTab === 'articles' 
                ? 'bg-slate-900 text-white shadow-md scale-[1.02] transform' 
                : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
              }`}
            >
              {t('learning_articles', language)}
            </button>
          </div>
        </div>

        <div className="relative group max-w-3xl mx-auto w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-mira-orange transition-all duration-300" size={20} />
          <input
            type="text"
            placeholder={activeTab === 'courses' ? t('learning_search_courses', language) : t('learning_search_articles', language)}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 py-5 pl-16 pr-6 rounded-[2rem] text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-mira-orange/10 focus:border-mira-orange/30 transition-all placeholder:text-slate-300 relative z-10 font-medium shadow-sm"
          />
        </div>

        {activeTab === 'courses' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl mx-auto w-full animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="relative space-y-1.5 flex-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                {t('learning_course_category', language)}
              </label>
              <div className="relative group">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-mira-orange transition-colors pointer-events-none" size={16} />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none focus:bg-white focus:border-mira-orange/40 focus:ring-4 focus:ring-mira-orange/5 transition-all shadow-sm appearance-none cursor-pointer"
                >
                  <option value="Todos">{t('map_all_areas', language)}</option>
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat}>{t(getCategoryKey(cat), language)}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={14} />
              </div>
            </div>

            <div className="relative space-y-1.5 flex-1">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                {t('learning_cert_source', language)}
              </label>
              <div className="relative group">
                <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-mira-orange transition-colors pointer-events-none" size={16} />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 outline-none focus:bg-white focus:border-mira-orange/40 focus:ring-4 focus:ring-mira-orange/5 transition-all shadow-sm appearance-none cursor-pointer"
                >
                  <option value="Todos">{t('learning_all_sources', language)}</option>
                  <option value="DGES">DGES — {allCourses.filter(c => c.isDgesRecognized).length} Cursos</option>
                  <option value="IEFP">IEFP — {allCourses.filter(c => c.isIefpSynced).length} Cursos</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            </div>
          </div>
        </div>
      )}
    </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-10 no-scrollbar pb-32">
        {activeTab === 'articles' ? (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {latestNews && !searchQuery && (
              <div className="relative">
                <div className="flex items-center gap-4 mb-5">
                  <div className="px-4 py-1.5 bg-red-600/90 rounded-full text-white text-[9px] font-black uppercase tracking-[0.25em] shadow-lg">{t('newsroom', language)}</div>
                  <div className="h-px flex-1 bg-slate-200"></div>
                </div>

                <div
                  onClick={() => setSelectedArticle(latestNews)}
                  className="relative h-[28rem] w-full rounded-[3.5rem] overflow-hidden shadow-2xl cursor-pointer group hover:shadow-mira-orange/10 transition-all duration-700 border border-slate-100"
                >
                  <img 
                    src={getImageUrl(latestNews.image) || '/mira-icon.png'} 
                    alt="" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2000ms]" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
                  
                  <div className="absolute top-8 right-8 w-14 h-14 bg-white/20 backdrop-blur-xl rounded-3xl border border-white/20 flex items-center justify-center text-white group-hover:text-mira-orange group-hover:bg-white group-hover:border-mira-orange/30 transition-all duration-500 shadow-2xl">
                    <Sparkles size={28} className="animate-pulse" />
                  </div>

                  <div className="absolute bottom-0 left-0 p-10 space-y-3 w-full">
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-black bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full uppercase tracking-[0.2em] border border-white/20">
                        {t(getCategoryKey(latestNews.category), language)}
                      </span>
                      <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">{latestNews.date}</span>
                    </div>
                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-tight line-clamp-2 drop-shadow-xl">
                      {(latestNews as any).title}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
              {filteredArticles.filter(a => searchQuery || !latestNews || a.id !== latestNews.id).map(article => (
                <div 
                  key={article.id} 
                  onClick={() => setSelectedArticle(article)} 
                  className={`group bg-white hover:bg-slate-50 p-4 rounded-[2.5rem] border border-slate-100 transition-all duration-500 cursor-pointer flex gap-5 items-stretch relative overflow-hidden shadow-sm hover:shadow-md`}
                >
                  <div className="w-28 sm:w-36 h-auto rounded-3xl overflow-hidden flex-shrink-0 shadow-lg border border-slate-100">
                    <img 
                      src={getImageUrl(article.image) || '/mira-icon.png'} 
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                    />
                  </div>
                  
                  <div className="flex flex-col justify-between py-2 flex-1 relative z-10">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[8px] font-black bg-slate-100 text-slate-400 px-3 py-1.5 rounded-full uppercase tracking-widest border border-slate-200">{t(getCategoryKey(article.category), language)}</span>
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{article.date}</span>
                      </div>
                      <h4 className="font-black text-slate-900 text-base leading-[1.2] group-hover:text-mira-orange transition-all uppercase tracking-tight line-clamp-2 mb-2">
                        <TranslatedText text={(article as any).title} language={language} shouldTranslate={language !== 'PT'} />
                      </h4>
                    </div>
                    
                    <div className="flex items-center gap-2 text-[9px] font-black text-mira-orange uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-1 duration-500">
                      {t('learning_read_more', language)} <ArrowRight size={10} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {isLoading && (
               <div className="flex flex-col items-center justify-center py-10 gap-4">
                  <Activity className="animate-spin text-mira-orange" size={30} />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('learning_syncing', language)} {t('learning_articles', language)}...</p>
               </div>
            )}
          </div>
        ) : (
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
        )}
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
