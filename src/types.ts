
export enum ViewType {
  HOME = 'home',
  COMMUNITY = 'community',
  ASSISTANT = 'assistant',
  LEARNING = 'learning',
  DOCUMENTS = 'documents',
  DASHBOARD = 'dashboard',
  PROFILE = 'profile',
  CURATOR = 'curator',
  JOBS = 'jobs',
  MAP = 'map',
  PRIVACY = 'privacy',
  ADMIN = 'admin',
  NOTIFICATIONS = 'notifications',
  COOKIES = 'cookies',
  MESSAGES = 'messages',
  GAMIFICATION = 'gamification',
  SERVICES = 'services',
  DIAGNOSTICS = 'diag',
  PREMIOS = 'premios',
  SIMULATORS = 'simulators'
}

export type TrustLevel = "Observador" | "Colaborador" | "Curador Comunitário";
export type ValidationStatus = "pending" | "validated" | "under_review" | "hidden" | "fraud" | "banned";

export type BadgeId = 
  | 'pioneiro'
  | 'verificado'
  | 'verificada'
  | 'sentinela'
  | 'escudo_anti_burla'
  | 'mestre_docs'
  | 'curador'
  | 'exemplar'
  | 'voz_autoridade'
  | 'guia_local'
  | 'coracao';

export interface BadgeRegistryItem {
  id: BadgeId;
  name: string;
  description: string;
  icon: string;
  icon_emoji?: string;
  rule: string;
  requiredValue: number;
  isActive: boolean;
  createdAt: string;
  category: string;
  rarity_level?: number;
}

export interface UserBadgeConcession {
  userId: string;
  badgeId: BadgeId;
  earnedAt: string;
  sourceEvent: string;
}

export interface Badge {
  id: BadgeId | string;
  name: string;
  icon: string; // Lucide fallback
  icon_emoji?: string; // SOBERANIA V500
  description: string;
  unlocked: boolean;
  category: string; // Flexible category
  rarity_level?: string | number; // SOBERANIA V500
}

export interface UserBadge {
  badge_id: BadgeId | string;
  awarded_at: string;
  source_event?: string;
  details?: Badge;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'aima' | 'community' | 'jobs' | 'docs' | 'social';
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationPreferences {
  OFFICIAL_AIMA: boolean; // Alertas oficiais diretos da AIMA
  LEGAL_CHANGES: boolean; // Mudanças legislativas (DRE/Conselho de Ministros)
  DOC_EXPIRATION: boolean; // Prazos de validade dos seus documentos
  JOB_MATCHES: boolean; // Vagas urgentes compatíveis com seu perfil
  COMMUNITY_REPUTATION: boolean; // Conquistas de selos e pontos
  MAP_URGENCY: boolean; // Alertas de balcões abertos ou greves em serviços
  MIRA_INSIGHTS: boolean; // Novos artigos e guias práticos do MIRA Learning
  SOCIAL_CONNECT: boolean; // Quando alguém responde ou valida seus posts
  MIRA_ARTICLE: boolean; // Novo Artigo MIRA
  COMMUNITY_REPLY: boolean; // Novo comentário no seu Post
  COMMUNITY_FOLLOW_UP: boolean; // Novo comentário em Post que comentou
}

export const UNIFIED_CATEGORIES = [
  "Residência & Vistos",
  "Trabalho & Carreira",
  "Saúde & SNS",
  "Finanças & Impostos",
  "Habitação & Casa",
  "Educação & Formação",
  "Direitos & Apoio Social",
  "Comunidade & Histórias",
  "Ajuda Humanitária",
  "Geral & Tecnologia"
] as const;

export type UnifiedCategory = typeof UNIFIED_CATEGORIES[number];

export const CATEGORIES = {
  IMMIGRATION: UNIFIED_CATEGORIES[0],
  WORK: UNIFIED_CATEGORIES[1],
  HEALTH: UNIFIED_CATEGORIES[2],
  FINANCE: UNIFIED_CATEGORIES[3],
  HOUSING: UNIFIED_CATEGORIES[4],
  EDUCATION: UNIFIED_CATEGORIES[5],
  RIGHTS: UNIFIED_CATEGORIES[6],
  COMMUNITY: UNIFIED_CATEGORIES[7],
  HUMANITARIAN: UNIFIED_CATEGORIES[8],
  TECH: UNIFIED_CATEGORIES[9],
  SOCIAL_SECURITY: UNIFIED_CATEGORIES[6],
  SOCIAL_SUPPORT: UNIFIED_CATEGORIES[6],
  WELLBEING: UNIFIED_CATEGORIES[2],
};

export const MAP_CATEGORIES = [
  UNIFIED_CATEGORIES[0],
  UNIFIED_CATEGORIES[1],
  UNIFIED_CATEGORIES[2],
  UNIFIED_CATEGORIES[3],
  UNIFIED_CATEGORIES[4],
  UNIFIED_CATEGORIES[5],
  UNIFIED_CATEGORIES[6],
  UNIFIED_CATEGORIES[7],
  UNIFIED_CATEGORIES[8],
] as const;

export const WORK_TOPICS = [
  "Tecnologia, Dados & IA",
  "Saúde & Cuidados Continuados",
  "Construção Civil & Engenharia",
  "Turismo, Hotelaria & Restauração",
  "Indústria, Produção & Manufatura",
  "Logística, Transportes & Armazém",
  "Comércio, Vendas & Retalho",
  "Administrativo, Gestão & RH",
  "Apoio ao Cliente",
  "Técnicos e Consultores",
  "Design, Marketing e Media",
  "Gestão de Equipas e Negócios",
  "Limpeza, Segurança & Facility Management",
  "Agricultura, Pesca & Pecuária",
  "Artes, Design & Multimédia",
  "Apoio Social & Terceiro Setor",
  "Energia & Sustentabilidade",
  "Trabalho Remoto & Freelancing",
  "Outros"
] as const;

export interface User {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  email?: string; // Visibilidade controlada (Admin) | RGPD
  nationality?: string;
  ageRange?: string;
  location?: string;
  mainChallenge?: string;
  dataConsent?: boolean;
  registrationDate?: string;
  isMuted?: boolean;
  reputation: number;
  trustLevel: TrustLevel;
  isVerified?: boolean;
  isAima?: boolean;    // SOVEREIGNTY: Peso +5000
  isCEO?: boolean;     // SOVEREIGNTY: Peso +3000
  authorityLevel?: number; // Escala Nobel: 0-5000
  role?: 'member' | 'mentor' | 'admin';
  isBlocked?: boolean;
  followersCount: number;
  followingCount: number;
  reports_count?: number; // Integridade Algoritmo de Stories
  status?: 'active' | 'deleted'; // RGPD Compliance
  onlineStatus?: 'online' | 'offline';
  lastSeen?: string;
  badges?: UserBadge[]; // SOBERANIA V500: Rich badge data
  points?: number;   // SOBERANIA V2000
  level?: number;    // SOBERANIA V2000
  verify_count?: number;  // SOBERANIA V2000
  help_count?: number;    // SOBERANIA V2000
  report_count?: number;  // SOBERANIA V2000
  consult_count?: number; // SOBERANIA V2000
  verifiedPostsCount: number;
  totalLikesReceived: number;
  reportsConfirmedCount?: number;
  scamReportsConfirmed?: number;
  documentDownloads?: number;
  completedCoursesCount?: number;
  serviceReviewsCount?: number;
  invitesConfirmedCount?: number;
  saberIaHits?: number;
  lynxEyeCount?: number;
  communityValidationsCount?: number;
  likesGivenCount?: number;
  sovereignty_score?: number; // 🛡️ SOBERANIA: Ranking Nobel (0-100.000)
  email_confirmed_at?: string | null; // Verification Timestamp
}

export interface AuthorData {
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorBio?: string;
  authorBadges?: string[];
  authorIsVerified?: boolean;
  authorFollowersCount?: number;
  authorFollowingCount?: number;
  authorityLevel?: number;
  authorEmail?: string;
}

export interface Comment extends AuthorData {
  id: string;
  content: string;
  timestamp: string;
  likes: number;
  isValidated?: boolean;
  isLikedByUser?: boolean;
  isPending?: boolean;
  replies?: Comment[];
  parentId?: string;
  translations?: Record<string, string>;
}

export interface Post extends AuthorData {
  id: string;
  title: string;
  content: string;
  isLikedByUser?: boolean;
  isSaved?: boolean;
  isFollowing?: boolean; 
  userVote?: 'true' | 'false';
  category: string;
  workTopic?: string;
  geoTag?: string;
  backgroundImage?: string;
  tags: string[];
  likes: number;
  comments: Comment[];
  isVerified: boolean;
  isAima?: boolean; // Flag Soberania Ativa
  isCEO?: boolean; // Flag Soberania Ativa (CEO)
  authorityLevel?: number; // Escala Nobel: 0-5000
  isFraudWarning: boolean;
  aiStatus?: 'validated' | 'suspect' | 'fraud';
  aiReason?: string;
  location?: string;
  timestamp: string;
  reports: number;
  urgency: number; // 0-5
  validationStatus: ValidationStatus;
  usefulVotes: number;
  fakeVotes: number;
  reviewVotes: number;
  isPending?: boolean;
  sovereignty_weight?: number; // Nobel Ranking Engine
  translations?: Record<string, string>; // Cache de Tradução Funcional
  rag_verified?: boolean; // Saber IA Feedback
  nobelScore?: number; // 🛡️ NOBEL SOBERANIA: Ranking vindo do Banco
  commentCount?: number; // Otimização Sniper V5.7
  isManual?: boolean; // 📖 MANUAL MIRA: Flag para redirecionamento
}

export interface JobPost {
  id: string;
  title: string;
  location: string;
  sourceName: string;
  source_name?: string; // Compatibility
  sourceUrl: string;
  source_url?: string; // Compatibility
  datePosted: string;
  date_posted?: string; // Compatibility
  tags: string[];
  category: string;
  workTopic: string;
  work_topic?: string; // Compatibility
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  duration: string;
  image: string;
  link?: string;
  isIefpSynced?: boolean;
  isDgesRecognized?: boolean;
}

export interface Rating {
  stars: number;
  comment: string;
}

export interface MapAlert {
  id: string;
  title: string;
  category: string;
  lat: number;
  lng: number;
  latitude?: number;
  longitude?: number;
  distance: string;
  ratings: Rating[];
  avgRating: number;
  address: string;
  city: string;
  image?: string;
  phone?: string;
  email?: string;
  website?: string;
  type?: string;
  description?: string;
  isOfficial?: boolean;
  is_official?: boolean;
  schedule?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  relatedArticles?: any[];
}

export interface AppActivityLog {
  id: string;
  userId: string;
  action: 'post_created' | 'post_deleted' | 'comment_created' | 'ai_query' | 'ai_feedback' | 'view_changed' | 'fraud_report' | 'doc_generated' | 'generate_document' | 'vote_cast' | 'job_click' | 'course_view' | 'read_article' | 'service_review' | 'chat_with_mira' | 'admin_delete' | 'admin_include' | 'admin_topic_suggestion' | 'admin_job_sync' | 'admin_course_sync' | 'admin_delete_all_posts' | 'admin_delete_all_comments' | 'admin_delete_all_users' | 'europass_click' | 'saved_post_toggled' | 'user_followed' | 'points_earned' | 'content_reported' | 'suggestion_submitted' | 'home_module_click' | 'app_launch' | 'app_access' | 'manual_opened_from_community' | 'badge_awarded' | 'post_like' | 'post_fact_vote' | 'pwa_install' | 'use_simulator' | 'like_post' | 'click_service';
  category?: string;
  timestamp: string;
  metadata?: any;
}

export interface DocumentTask {
  id: string;
  title: string;
  completed: boolean;
  category: UnifiedCategory;
}

export interface DocumentField {
  id: string;
  label: string;
  placeholder: string;
  type: string;
}

export interface DocumentTemplate {
  id: string;
  title: string;
  category: UnifiedCategory;
  complexity: 'Easy' | 'Medium' | 'Hard';
  description: string;
  explanation?: string;
  purpose: string;
  requirements: string[];
  fields: DocumentField[];
  authority: string;
  location: string;
  tips: string;
}

export interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
}

export interface ForumPost {
  id: string;
  authorId: string;
  authorName?: string;
  authorAvatar?: string;
  title: string;
  content: string;
  category: string;
  likes: number;
  comments: any[];
  backgroundImage?: string;
}

export interface GeneratedDocument {
  id: string;
  title: string;
  date: string;
  url?: string;
  formData?: Record<string, string>;
  isDraft?: boolean;
  authority?: string;
}
