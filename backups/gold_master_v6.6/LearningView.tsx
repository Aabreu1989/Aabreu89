import React, { useState, useMemo, useEffect } from 'react';
import { BookOpen, ChevronRight, Mic2, Search, Filter, ChevronDown, FileText, Bot, ExternalLink, Calendar, X, Send, Mail, GraduationCap, ArrowLeft, Share2, Info, Globe, Building2, Sparkles, Briefcase, TrendingUp, MapPin, DollarSign, ArrowRight, UserCheck, CheckCircle2, Building, Activity } from 'lucide-react';
import { Course, UNIFIED_CATEGORIES, CATEGORIES } from '../types';
import { useToast } from './Toast';
import { t } from '../utils/translations';
import { IEFP_MASSIVE_DATABASE } from '../utils/iefpCoursesDatabase';
import { getImageUrl } from '../utils/imageUtils';
import { normalizeCategory, getCategoryIcon } from '../utils/categoryUtils';
import { TranslatedText } from './TranslatedText';
import { analytics } from '../services/analyticsService';
import { supabase } from '../lib/supabase';


interface LearningViewProps {
  courses: Course[];
  onNavigateToChat: () => void;
  onEarnPoints: (points: number, badgeId?: string) => void;
  onNavigateToContact: () => void;
  language: string;
}

const MANUAL_TRANSLATIONS = {
  PT: {
    title: 'MANUAL SIMPLIFICADO DO WEBAPP MIRA',
    summary: 'Guia completo e prático de todos os módulos do MIRA WebApp — o seu sistema operacional para uma nova vida em Portugal.',
    content: `Bem-vindo ao MIRA! Este manual explica cada módulo da plataforma para que tire o máximo proveito.

🏠 INÍCIO (HOME)
O painel principal do MIRA. Aqui acede ao Chat MIRA com inteligência artificial, vê publicações em destaque da comunidade, e pode enviar sugestões de melhoria à equipa.

🤖 CHAT MIRA (ASSISTENTE IA)
O coração do MIRA. Faça perguntas sobre documentos, vistos, emprego, legislação, saúde ou integração em Portugal. A IA responde com base em fontes oficiais. Suporta áudio e responde em PT, EN, ES e FR.

👥 COMUNIDADE (MIRA HUB)
Espaço de partilha entre imigrantes. Crie publicações, comente, apoie outros membros e ganhe reputação e selos (badges) pela sua contribuição.

📚 CURSOS & ARTIGOS
Aceda a cursos gratuitos do IEFP e artigos informativos sobre integração em Portugal. Esta é a aba para se manter actualizado.

📄 REGULARIZAÇÃO
Formulários inteligentes e minutas oficiais para processos como NIF, NISS e Residência.

💼 VAGAS DE EMPREGO
Pesquise ofertas de emprego em Portugal com filtros por distrito e área.

🗺️ SERVIÇOS DE APOIO
Serviços de apoio ao imigrante: juntas de freguesia, centros de saúde, associações e muito mais. Avalie os serviços e ajude outros membros.

🛡️ DIREITOS & SEGURANÇA
Informação sobre os seus direitos em Portugal, o sistema de badges e termos de uso.

👤 PERFIL
Gerencie o seu perfil, publicações e selos conquistados.

DICA MIRA: Em caso de dúvida, use sempre o Chat MIRA — é gratuito e disponível 24/7.`
  },
  EN: {
    title: 'MIRA WEBAPP SIMPLIFIED MANUAL',
    summary: 'Complete and practical guide to all MIRA WebApp modules — your operating system for a new life in Portugal.',
    content: `Welcome to MIRA! This manual explains each module of the platform so you can get the most out of it.

🏠 HOME
The main dashboard of MIRA. Here you can access the MIRA Chat with AI, see featured community posts, and send suggestions for improvement to the team.

🤖 MIRA CHAT (AI ASSISTANT)
The heart of MIRA. Ask questions about documents, visas, jobs, legislation, health, or integration in Portugal. The AI responds based on official sources. Supports audio and responds in PT, EN, ES, and FR.

👥 COMMUNITY (MIRA HUB)
A space for sharing among immigrants. Create posts, comment, support other members, and earn reputation and badges for your contribution.

📚 COURSES & ARTICLES
Access free IEFP courses and informative articles about integration in Portugal. This is the tab to stay updated.

📄 DOCUMENTS
Smart forms and official drafts for processes like NIF, NISS, and Residency.

💼 JOB VACANCIES
Search for job offers in Portugal with filters by district and area.

🗺️ SUPPORT SERVICES
Immigrant support services: parish councils, health centers, associations, and more. Rate the services and help other members.

🛡️ RIGHTS & SECURITY
Information about your rights in Portugal, the badge system, and terms of use.

👤 PROFILE
Manage your profile, posts, and earned badges.

MIRA TIP: When in doubt, always use the MIRA Chat — it's free and available 24/7.`
  },
  ES: {
    title: 'MANUAL SIMPLIFICADO DE MIRA WEBAPP',
    summary: 'Guía completa y práctica de todos los módulos de MIRA WebApp: su sistema operativo para una nueva vida en Portugal.',
    content: `¡Bienvenido a MIRA! Este manual explica cada módulo de la plataforma para que le saque el máximo provecho.

🏠 INICIO
El panel principal de MIRA. Aquí puede acceder al Chat MIRA con inteligencia artificial, ver publicaciones destacadas de la comunidad y enviar sugerencias de mejora al equipo.

🤖 CHAT MIRA (ASISTENTE IA)
El corazón de MIRA. Haga preguntas sobre documentos, visados, empleo, legislación, salud o integración en Portugal. La IA responde en base a fuentes oficiales. Soporta audio y responde en PT, EN, ES y FR.

👥 COMUNIDAD (MIRA HUB)
Espacio de intercambio entre inmigrantes. Cree publicaciones, comente, apoye a otros miembros y gane reputación e insignias (badges) por su contribución.

📚 CURSOS Y ARTÍCULOS
Acceda a cursos gratuitos del IEFP y artículos informativos sobre la integración en Portugal. Esta es la pestaña para mantenerse actualizado.

📄 TRÁMITES
Formularios inteligentes y borradores oficiales para procesos como NIF, NISS y Residencia.

💼 VACANTES DE EMPLEO
Busque ofertas de empleo en Portugal con filtros por distrito y área.

🗺️ SERVICIOS DE APOYO
Servicios de apoyo al imigrante: juntas de freguesia, centros de salud, asociaciones y mucho más. Evalúe los servicios y ayude a otros miembros.

🛡️ DERECHOS Y SEGURIDAD
Información sobre sus derechos en Portugal, el sistema de insignias y términos de uso.

👤 PERFIL
Gestione su perfil, publicaciones e insignias obtenidas.

CONSEJO MIRA: En caso de duda, use siempre el Chat MIRA — es gratuito y está disponible las 24 horas, los 7 días de la semana.`
  },
  FR: {
    title: 'MANUEL SIMPLIFIÉ DE MIRA WEBAPP',
    summary: 'Guide complet et pratique de tous les modules de MIRA WebApp — votre système d\'exploitation pour une nouvelle vie au Portugal.',
    content: `Bienvenue sur MIRA ! Ce manuel explique chaque module de la plateforme pour vous permettre d'en tirer le meilleur parti.

🏠 ACCUEIL
Le tableau de bord principal de MIRA. Ici, vous accédez au Chat MIRA avec intelligence artificielle, voyez les publications en vedette de la communauté et pouvez envoyer des suggestions d'amélioration à l'équipe.

🤖 CHAT MIRA (ASSISTANT IA)
Le cœur de MIRA. Posez des questions sur les documents, les visas, l'emploi, la législation, la santé ou l'intégration au Portugal. L'IA répond sur la base de sources officielles. Supporte l'audio et répond en PT, EN, ES et FR.

👥 COMMUNAUTÉ (MIRA HUB)
Espace de partage entre immigrés. Créez des publications, commentez, soutenez d'autres membres et gagnez une réputation et des badges pour votre contribution.

📚 COURS & ARTICLES
Accédiez à des cours gratuits de l'IEFP et à des articles informatifs sur l'intégration au Portugal. C'est l'onglet pour rester à jour.

📄 RÉGULARISATION
Formulaires intelligents et modèles officiels pour des processus tels que le NIF, le NISS et la Résidence.

💼 OFFRES D'EMPLOI
Recherchez des offres d'emploi au Portugal avec des filtres par district et secteur.

🗺️ SERVICES DE SOUTIEN
Services de soutien aux immigrés : conseils de paroisse, centres de santé, associations et bien plus encore. Évaluez les services et aidez les autres membres.

🛡️ DROITS & SÉCURITÉ
Informations sur vos droits au Portugal, le système de badges et les conditions d'utilisation.

👤 PROFIL
Gérez votre profil, vos publications et vos badges obtenus.

CONSEIL MIRA : En cas de doute, utilisez toujours le Chat MIRA — c'est gratuit et disponible 24h/24, 7j/7.`
  }
};

export const MIRA_ARTICLES = [
  {
    id: 408,
    isManual: true,
    sourceId: 'mira',
    date: '24 Mar 2026',
    created_at: '2026-03-24T00:00:00Z',
    category: CATEGORIES.COMMUNITY,
    readTime: '6',
    image: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&q=80&fm=webp',
    isNews: true
  },
  {
    id: 406,
    title: 'CONVENÇÃO DE GENEBRA E PROTEÇÃO EM PORTUGAL',
    summary: 'Entenda os pilares da proteção internacional e como Portugal acolhe quem necessita de refúgio por perseguição ou guerra.',
    content: `A Convenção de Genebra de 1951 é o tratado fundamental que protege os refugiados. Portugal, como Estado-membro, oferece dois tipos de proteção:

1. ESTATUTO DE REFUGIADO: Concedido a quem tem receio fundado de perseguição por motivos de raça, religião, nacionalidade, opiniões políticas ou pertença a certo grupo social.
2. PROTEÇÃO SUBSIDIÁRIA: Para quem não cumpre os requisitos de refugiado, mas corre risco real de sofrer danos graves (guerra, pena de morte) no seu país.

DIREITOS EM PORTUGAL:
- Acesso imediato ao SNS (Saúde).
- Direito ao trabalho e educação.
- Apoio social via Segurança Social e CPR.

O MIRA ajuda-o a preencher o formulário de pedido de asilo na aba de Documentos.`,
    sourceId: 'aima/cpr',
    date: '08 Mar 2026',
    category: CATEGORIES.HUMANITARIAN,
    readTime: '5',
    image: 'https://images.unsplash.com/photo-1532153975070-2e9ab71f1b14?w=800&q=80&fm=webp',
    isNews: false
  },
  {
    id: 407,
    title: 'MIGRAÇÃO CLIMÁTICA: O QUE DIZ A LEI ATUAL?',
    summary: 'Como enquadrar a perda de subsistência por razões climáticas nas leis de imigração portuguesas e europeias.',
    content: `Embora o estatuto de "refugiado climático" ainda não exista oficialmente no direito internacional, Portugal permite enquadrar estes casos em mecanismos humanitários:

RAZÕES HUMANITÁRIAS (ART. 122.º):
Se a sua região de origem foi devastada por desastres naturais e o regresso é impossível ou coloca a vida em risco, pode solicitar Autorização de Residência por razões humanitárias.

COMO PROCEDER:
1. Reúna provas do desastre (notícias oficiais, relatórios internacionais).
2. Justifique a perda de bens e meios de subsistência.
3. Utilize o modelo "Razões Humanitárias" disponível no MIRA.

A solidariedade é a base da nossa integração.`,
    sourceId: 'aima',
    date: '08 Mar 2026',
    category: CATEGORIES.HUMANITARIAN,
    readTime: '6',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80&fm=webp',
    isNews: false
  },
  {
    id: 404,
    title: 'NOVO PORTAL AIMA 2026: AGENDAMENTOS BIOMÉTRICOS LIBERADOS',
    summary: 'A MIRA confirma a abertura de 50.000 novas vagas para recolha de dados biométricos em todo o país através do sistema automatizado.',
    content: `A Agência para a Integração, Migrações e Asilo (AIMA) acaba de lançar a maior vaga de agendamentos da história recente de Portugal. 

O QUE PRECISA DE SABER:
1. Agendamento Automático: O sistema agora prioriza quem tem processos pagos há mais de 6 meses.
2. Localização: São 42 novos pólos de atendimento, incluindo centros temporários em Lisboa, Porto e Braga.
3. Validação de Dados: Verifique o seu e-mail agora. Receberá um link único para confirmar a sua disponibilidade. Não partilhe este link com ninguém!

AVISO MIRA:
- Nunca pague por agendamentos. O Portal AIMA 2026 é gratuito e seguro.
- Certifique-se de que tem os originais do contrato de trabalho e prova de morada atualizada.

Dúvida sobre a documentação necessária? Pergunte-me agora!`,
    sourceId: 'aima',
    date: '05 Mar 2026',
    category: CATEGORIES.RIGHTS,
    readTime: '4',
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80&fm=webp',
    isNews: false
  },
  {
    id: 403,
    title: 'ALERTA LEGISLATIVO: FIM DA MANIFESTAÇÃO DE INTERESSE & TRANSIÇÃO 2026',
    summary: 'A MIRA traduz as mudanças drásticas na Lei de Estrangeiros: o que fazer se entrou sem visto e como o novo Portal AIMA impacta o seu processo.',
    content: `A histórica "Manifestação de Interesse" (Art. 88.º e 89.º n.º 2) foi definitivamente extinta. O MIRA preparou este guia simplificado para a Newsroom de Março de 2026.

O QUE MUDOU?
1. Fim da MI: Já não é possível legalizar-se apenas com contrato de trabalho se entrou como turista após Junho de 2024.
2. Obrigatoriedade de Visto: A entrada em Portugal para fins laborais exige agora Visto Consular prévio (obtido no país de origem ou residência).
3. Portal AIMA 2026: Todos os processos pendentes foram migrados para o novo sistema digital que prioriza o agendamento biométrico automático.

RECOMENDAÇÕES MIRA:
- Se já tinha MI submetida e paga: O seu processo continua válido. Aguarde a notificação no e-mail registado.
- Se chegou agora sem visto: A sua via de legalização poderá passar pelo Artigo 122.º (Regime Especial) se tiver laços familiares fortes ou razões humanitárias. Caso contrário, a situação é de irregularidade.

Consulte o nosso Assistente MIRA para um diagnóstico personalizado baseado nestas novas regras!`,
    sourceId: 'aima',
    date: '05 Mar 2026',
    category: CATEGORIES.RIGHTS,
    readTime: '6',
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80&fm=webp',
    isNews: false
  },
  {
    id: 401,
    title: 'REGULARIZAÇÃO 2026: O NOVO ARTIGO 91',
    summary: 'Aprenda como as novas regras de 2026 para estudantes facilitam a obtenção de residência em Portugal.',
    content: `Em 2026, as regras de regularização via estudos foram simplificadas pela nova Reforma Administrativa.

Principais Novidades:
1. Matrícula Digital: O processo agora é 100% online através do portal gov.pt/estudos.
2. Visto Automático: Estudantes de instituições certificadas pela ANQEP recebem pré-aprovação imediata.
3. Transição Laboral: Permissão total de trabalho desde o primeiro dia de aulas.

Para saber mais detalhes e tirar dúvidas específicas para o seu caso, converse com o nosso assistente digital MIRA! Ele está treinado com toda a base de dados de 2026.`,
    sourceId: 'aima',
    date: '10 Jan 2026',
    category: CATEGORIES.EDUCATION,
    readTime: '5',
    image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80&fm=webp',
    isNews: false
  }
];

export const LearningView: React.FC<LearningViewProps> = ({ courses, onNavigateToChat, onEarnPoints, onNavigateToContact, language }) => {
  const [activeTab, setActiveTab] = useState<'articles' | 'courses'>('articles');
  const [searchQuery, setSearchQuery] = useState('');
  const [dbArticles, setDbArticles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const { showToast } = useToast();

  const sortedArticles = useMemo(() => {
    const combined = MIRA_ARTICLES.map(a => {
      if (a.isManual) {
        const trans = MANUAL_TRANSLATIONS[language.toUpperCase() as keyof typeof MANUAL_TRANSLATIONS] || MANUAL_TRANSLATIONS.PT;
        return { ...a, ...trans };
      }
      return a;
    }).concat(dbArticles);

    // V2026.NEBULA: Prioritize manual above everything
    return combined.map(a => ({
      ...a,
      category: normalizeCategory(a.category)
    })).sort((a, b) => {
        if (a.isManual) return -1;
        if (b.isManual) return 1;
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (dateA && dateB) return dateB - dateA;
        return (Number(b.id) || 0) - (Number(a.id) || 0);
    });
  }, [dbArticles, language]);

  // V2026.NEBULA: Derived state for localization sync
  const displayedArticle = useMemo(() => {
    if (!selectedArticle) return null;
    return sortedArticles.find(a => String(a.id) === String(selectedArticle.id)) || selectedArticle;
  }, [selectedArticle, sortedArticles]);

  useEffect(() => {
    const fetchKnowledgeBase = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('knowledge_base')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          const mapped = data.map((item: any) => ({
            id: item.id,
            title: item.topic,
            summary: item.content?.substring(0, 150) + '...' || '',
            content: item.content || '',
            sourceId: 'aima',
            date: new Date(item.created_at).toLocaleDateString(language === 'EN' ? 'en-US' : 'pt-PT'),
            category: item.category || CATEGORIES.RIGHTS,
            readTime: '5',
            image: item.image_url || 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&q=80&fm=webp',
            isNews: false
          }));
          setDbArticles(mapped);
        }
      } catch (e) {
        console.error("Error fetching knowledge base:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchKnowledgeBase();
  }, [language]);
  
  // V65.1: DEEP LINKING PROCESSOR (Localized)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const artId = params.get('article');
    if (artId && sortedArticles.length > 0) {
      const target = sortedArticles.find(a => String(a.id) === artId);
      if (target) {
        setSelectedArticle(target);
        setActiveTab('articles');
        const newUrl = window.location.pathname + window.location.search.replace(/[?&]article=\d+/, '');
        window.history.replaceState({}, '', newUrl || '/');
      }
    }
  }, [sortedArticles]);

  const filteredArticles = sortedArticles.filter(a => 
    (a.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.summary || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.content || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const allCourses = useMemo(() => {
    const seen = new Set<string>();
    const combined = [...courses, ...IEFP_MASSIVE_DATABASE].map(c => ({
      ...c,
      category: normalizeCategory(c.category)
    }));
    const filtered = combined.filter(c => {
      if (!c.id || seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
    return filtered.sort((a, b) => (b.isIefpSynced ? 1 : 0) - (a.isIefpSynced ? 1 : 0));
  }, [courses]);

  const filteredCourses = allCourses.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const latestNews = useMemo(() => sortedArticles.find(a => a.isManual) || sortedArticles.find(a => a.isNews), [sortedArticles]);

  useEffect(() => {
    if (selectedArticle) {
      const userId = localStorage.getItem('mira_user_id');
      analytics.track('read_article', userId || 'guest', selectedArticle.category, {
        articleId: selectedArticle.id,
        title: selectedArticle.title
      });
    }
  }, [selectedArticle]);

  if (displayedArticle) {
    return (
      <div className="flex flex-col h-full bg-white animate-in slide-in-from-right-10 duration-500 font-['Plus_Jakarta_Sans']">
        <div className="relative h-80 sm:h-[32rem] w-full overflow-hidden">
          <img 
            src={getImageUrl(displayedArticle.image) || '/placeholder.jpg'} 
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder.jpg'; }} 
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
              <Sparkles size={16} /> Newsroom MIRA
            </div>
          )}
        </div>
 
        <div className="flex-1 overflow-y-auto px-8 py-12 no-scrollbar pb-40">
          <div className="max-w-3xl mx-auto space-y-10">
            <div className="flex items-center gap-5">
              <span className={`text-[10px] font-black ${displayedArticle.isNews ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-100 text-slate-500 border border-slate-200'} px-5 py-2 rounded-full uppercase tracking-[0.2em]`}>
                {displayedArticle.category}
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
 
            <div className="prose max-w-none text-lg text-slate-600 font-medium leading-relaxed whitespace-pre-line border-l-4 border-mira-orange/20 pl-8 py-2">
              <TranslatedText 
                text={displayedArticle.content} 
                language={language} 
                shouldTranslate={!displayedArticle.isManual && language !== 'PT'} 
              />
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
              <div className="w-16 h-16 bg-mira-orange text-white rounded-3xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform"><Bot size={36} /></div>
              <div>
                <p className="text-sm font-black text-slate-900 uppercase tracking-tight mb-1">Dúvidas sobre este conteúdo?</p>
                <p className="text-[10px] text-mira-orange font-black uppercase tracking-[0.2em] flex items-center gap-2">Consultar Assistente MIRA <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" /></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 pb-24 font-['Plus_Jakarta_Sans'] overflow-hidden">
      {/* Dynamic Header */}
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
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-10 no-scrollbar pb-32">
        {activeTab === 'articles' ? (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {isLoading && (
               <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Activity className="animate-spin text-mira-orange" size={40} />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando SABER IA...</p>
               </div>
            )}

            {!isLoading && latestNews && !searchQuery && (
              <div className="relative">
                <div className="flex items-center gap-4 mb-5">
                  <div className="px-4 py-1.5 bg-red-600/90 rounded-full text-white text-[9px] font-black uppercase tracking-[0.25em] shadow-lg">Newsroom</div>
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
                        {latestNews.category}
                      </span>
                      <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">{latestNews.date}</span>
                    </div>
                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-tight line-clamp-2 drop-shadow-xl">
                      {latestNews.title}
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
                        <span className="text-[8px] font-black bg-slate-100 text-slate-400 px-3 py-1.5 rounded-full uppercase tracking-widest border border-slate-200">{article.category}</span>
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{article.date}</span>
                      </div>
                      <h4 className="font-black text-slate-900 text-base leading-[1.2] group-hover:text-mira-orange transition-all uppercase tracking-tight line-clamp-2 mb-2">
                        <TranslatedText text={article.title} language={language} shouldTranslate={language !== 'PT'} />
                      </h4>
                    </div>
                    
                    <div className="flex items-center gap-2 text-[9px] font-black text-mira-orange uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-1 duration-500">
                      Saiba mais <ArrowRight size={10} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
            {filteredCourses.map((course) => (
              <div 
                key={course.id} 
                className="bg-white rounded-[3rem] overflow-hidden shadow-sm border border-slate-100 hover:border-mira-orange/30 transition-all duration-500 group relative flex flex-col hover:shadow-xl"
              >
                <div className="h-64 w-full bg-slate-100 relative overflow-hidden flex-shrink-0">
                  <img 
                    src={getImageUrl(course.image) || '/placeholder.jpg'} 
                    onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder.jpg'; }} 
                    alt={course.title} 
                    className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-[3000ms]" 
                    referrerPolicy="no-referrer" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
                  
                  <div className="absolute top-8 right-8 bg-white/80 backdrop-blur-md text-slate-900 text-[10px] font-black px-4 py-2 rounded-2xl uppercase tracking-[0.15em] border border-slate-200 shadow-sm">
                    {course.category}
                  </div>
                  
                  {course.isIefpSynced && (
                    <div className="absolute bottom-8 left-8 bg-[#22c55e] text-white px-5 py-2.5 rounded-2xl shadow-xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest">
                      <Sparkles size={16} /> 
                      <span className="leading-none mt-0.5">IEFP Oficial</span>
                    </div>
                  )}
                </div>
                
                <div className="p-10 pt-4 flex flex-col flex-1">
                  <h4 className="font-black text-2xl text-slate-900 tracking-tighter uppercase leading-[1.1] mb-4 group-hover:text-mira-orange transition-all duration-500 min-h-[3rem]">
                      <TranslatedText text={course.title} language={language} shouldTranslate={language !== 'PT'} />
                  </h4>
                  <p className="text-sm text-slate-500 font-medium mb-10 leading-relaxed line-clamp-3">
                      <TranslatedText text={course.description} language={language} shouldTranslate={language !== 'PT'} />
                  </p>
                  
                  <div className="mt-auto flex items-center justify-between pt-8 border-t border-slate-50 gap-4">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">
                      <Calendar size={16} className="text-mira-orange/50" /> 
                      {course.duration}
                    </div>
                    
                    <button 
                      onClick={() => { 
                        onEarnPoints(10); 
                        const finalLink = course.link || 'https://iefponline.iefp.pt/IEFP/pesquisas/search.do?cat=ofertaFormacao';
                        window.open(finalLink, '_blank'); 
                      }} 
                      className={`px-8 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all duration-500 shadow-lg shrink-0 ${
                        course.isIefpSynced 
                        ? 'bg-mira-orange text-white hover:bg-orange-600 shadow-orange-500/20' 
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      {language === 'PT' ? 'Aceder' : language === 'EN' ? 'Access' : language === 'ES' ? 'Acceder' : 'Accéder'}
                      <ExternalLink size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
