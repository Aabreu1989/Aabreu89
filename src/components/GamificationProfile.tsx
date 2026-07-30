import React, { useState, useEffect, useRef } from 'react';
import { followService } from '../services/followService';
import { User, Comment, ForumPost, ViewType, Badge, Post } from '../types';
import { FileText, Bookmark, Shield, CheckCircle2, Heart, Zap, Star, X, LogOut, Award, Flame, UserCheck, ShieldAlert, Book, MapPin, Activity, Edit2, Check, CalendarCheck, Trash2, Lock, Users, MessageSquare, Mail, Map, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PREDEFINED_AVATARS } from '../constants';
import { authService } from '../services/authService';
import { useToast } from './Toast';
import { t } from '../utils/translations';
import { MiraBadgeSeal } from './MiraBadgeSeal';

interface GamificationProfileProps {
    user: User | null; // The user whose profile is being viewed
    currentUser: User | null; // The logged-in user
    onUpdateUser: (user: User) => void;
    helps: number;
    impact: number;
    badges: string[];
    activitiesCount: number;
    savedCount: number;
    createdPosts?: ForumPost[];
    createdComments?: (Comment & { postId: string })[];
    userValidations?: ForumPost[];
    savedPosts?: Post[];
    language: string;
    onNavigateToPost: (postId: string) => void;
    onViewChange: (view: ViewType) => void;
    onStartChat?: (otherUser: User) => void;
    onDeletePost?: (postId: string) => void;
    onLogout: () => void;
    t_func?: (key: string) => string;
}

const PROFILE_T = {
    pt: {
        my_profile: "Meu Perfil",
        community_name: "Nome comunitário",
        bio_placeholder: "Frase curta de bio...",
        member_of: "Membro da comunidade MIRA",
        observer: "Observador",
        profile_photo: "Foto de Perfil",
        saving: "A guardar...",
        save_profile: "Salvar Perfil",
        tab_posts: "Publicações",
        tab_badges: "Meus Selos",
        tab_saved: "Salvos",
        delete_post: "Eliminar Publicação",
        no_posts_yet: "Sem publicações ainda",
        no_saved_items: "Nenhum item guardado",
        security_settings: "Definições de Segurança",
        profile_followers: "Seguidores",
        profile_badges: "Selos",
        verified_posts_count: "Posts Verificados",
        total_likes_received: "Total Curtidas",
        delete_account: "Eliminar Minha Conta",
        delete_account_confirm: "Tens a certeza? Isto irá eliminar permanentemente todos os teus dados pessoais do MIRA.",
        follow: "Seguir",
        unfollow: "Deixar de Seguir",
        message: "Mensagem Privada",
        following: "A seguir",
        profile_unlocked: "Desbloqueado",
        reputation: "Reputação",
        activities: "Atividades",
        impact: "Impacto",
        doc_downloads: "Downloads Realizados",
        medals_unlocked: "Medalhas MIRA",
        likes_received: "Likes Recebidos",
        metro_title: "Linha de Metro da Integração",
        metro_pending: "Pendente",
        metro_completed: "Concluído",
        metro_start_process: "Iniciar Processo ➔",
        station_arrival_label: "Chegada",
        station_arrival_desc: "Chegada a Portugal e início da sua jornada MIRA!",
        station_nif_label: "NIF",
        station_nif_desc: "Número de Identificação Fiscal - indispensável para assinar contratos!",
        station_niss_label: "NISS",
        station_niss_desc: "Segurança Social - garante a sua proteção e direitos laborais.",
        station_utente_label: "SNS",
        station_utente_desc: "Número de Utente do SNS para acesso a cuidados de saúde públicos.",
        station_job_label: "Emprego",
        station_job_desc: "Procura ativa de vagas no mercado de trabalho e candidaturas.",
        station_residence_label: "Residência",
        station_residence_desc: "Processo de regularização de residência concluído com sucesso!"
    },
    en: {
        my_profile: "My Profile",
        community_name: "Community Name",
        bio_placeholder: "Short bio phrase...",
        member_of: "MIRA Community Member",
        observer: "Observer",
        profile_photo: "Profile Photo",
        saving: "Saving...",
        save_profile: "Save Profile",
        tab_posts: "Posts",
        tab_badges: "My Badges",
        tab_saved: "Saved",
        delete_post: "Delete Post",
        no_posts_yet: "No posts yet",
        no_saved_items: "No saved items",
        security_settings: "Security Settings",
        profile_followers: "Followers",
        profile_badges: "Badges",
        verified_posts_count: "Verified Posts",
        total_likes_received: "Total Likes",
        delete_account: "Delete My Account",
        delete_account_confirm: "Are you sure? This will permanently delete all your personal data from MIRA.",
        follow: "Follow",
        unfollow: "Unfollow",
        message: "Private Message",
        following: "Following",
        profile_unlocked: "Unlocked",
        reputation: "Reputation",
        activities: "Activities",
        impact: "Impact",
        doc_downloads: "Downloaded Docs",
        medals_unlocked: "MIRA Medals",
        likes_received: "Likes Received",
        metro_title: "Integration Subway Line",
        metro_pending: "Pending",
        metro_completed: "Completed",
        metro_start_process: "Start Process ➔",
        station_arrival_label: "Arrival",
        station_arrival_desc: "Arrival in Portugal and start of your MIRA journey!",
        station_nif_label: "NIF",
        station_nif_desc: "Tax Identification Number - essential for signing contracts!",
        station_niss_label: "NISS",
        station_niss_desc: "Social Security - ensures your protection and labor rights.",
        station_utente_label: "SNS",
        station_utente_desc: "SNS National Health Service number for access to public healthcare.",
        station_job_label: "Employment",
        station_job_desc: "Active job search in the local labor market and job applications.",
        station_residence_label: "Residence",
        station_residence_desc: "Residence regularization process successfully completed!"
    },
    fr: {
        my_profile: "Mon Profil",
        community_name: "Nom de communauté",
        bio_placeholder: "Courte phrase de bio...",
        member_of: "Membre de la communauté MIRA",
        observer: "Observateur",
        profile_photo: "Photo de Profil",
        saving: "Enregistrement...",
        save_profile: "Enregistrer le Profil",
        tab_posts: "Publications",
        tab_badges: "Mes Badges",
        tab_saved: "Enregistrés",
        delete_post: "Supprimer la Publication",
        no_posts_yet: "Pas encore de publications",
        no_saved_items: "Aucun élément enregistré",
        security_settings: "Paramètres de Sécurité",
        profile_followers: "Abonnés",
        profile_badges: "Badges",
        verified_posts_count: "Posts Vérifiés",
        total_likes_received: "Total J'aime",
        delete_account: "Supprimer Mon Compte",
        delete_account_confirm: "Êtes-vous sûr ? Cela supprimera définitivement toutes vos données personnelles de MIRA.",
        follow: "Suivre",
        unfollow: "Ne plus suivre",
        message: "Message Privé",
        following: "Abonné",
        profile_unlocked: "Débloqué",
        reputation: "Réputation",
        activities: "Activités",
        impact: "Impact",
        doc_downloads: "Téléchargements",
        medals_unlocked: "Médailles MIRA",
        likes_received: "Likes Reçus",
        metro_title: "Ligne de Métro de l'Intégration",
        metro_pending: "En attente",
        metro_completed: "Terminé",
        metro_start_process: "Démarrer le Processus ➔",
        station_arrival_label: "Arrivée",
        station_arrival_desc: "Arrivée au Portugal et début de votre parcours MIRA !",
        station_nif_label: "NIF",
        station_nif_desc: "Numéro d'Identification Fiscale - indispensable pour signer des contrats !",
        station_niss_label: "NISS",
        station_niss_desc: "Sécurité Sociale - garantit votre protection et vos droits du travail.",
        station_utente_label: "SNS",
        station_utente_desc: "Numéro d'Utente du SNS pour l'accès aux soins de santé publics.",
        station_job_label: "Emploi",
        station_job_desc: "Recherche active d'emplois sur le marché du travail et candidatures.",
        station_residence_label: "Résidence",
        station_residence_desc: "Processus de régularisation de la résidence terminé avec succès !"
    },
    es: {
        my_profile: "Mi Perfil",
        community_name: "Nombre de comunidad",
        bio_placeholder: "Frase corta de bio...",
        member_of: "Miembro de la comunidad MIRA",
        observer: "Observador",
        profile_photo: "Foto de Perfil",
        saving: "Guardando...",
        save_profile: "Guardar Perfil",
        tab_posts: "Publicaciones",
        tab_badges: "Mis Insignias",
        tab_saved: "Guardados",
        delete_post: "Eliminar Publicación",
        no_posts_yet: "Aún no hay publicaciones",
        no_saved_items: "Ningún elemento guardado",
        security_settings: "Ajustes de Seguridad",
        profile_followers: "Seguidores",
        profile_badges: "Insignias",
        verified_posts_count: "Posts Verificados",
        total_likes_received: "Total Me gusta",
        delete_account: "Eliminar Mi Cuenta",
        delete_account_confirm: "¿Estás seguro? Esto eliminará permanentemente todos tus datos personales de MIRA.",
        follow: "Seguir",
        unfollow: "Dejar de Seguir",
        message: "Mensaje Privado",
        following: "Siguiendo",
        profile_unlocked: "Desbloqueado",
        reputation: "Reputación",
        activities: "Actividades",
        impact: "Impacto",
        doc_downloads: "Descargas de Docs",
        medals_unlocked: "Medallas MIRA",
        likes_received: "Likes Recibidos",
        metro_title: "Línea de Metro de la Integración",
        metro_pending: "Pendiente",
        metro_completed: "Completado",
        metro_start_process: "Iniciar Proceso ➔",
        station_arrival_label: "Llegada",
        station_arrival_desc: "¡Llegada a Portugal y comienzo de su viaje MIRA!",
        station_nif_label: "NIF",
        station_nif_desc: "¡Número de Identificación Fiscal - indispensable para firmar contratos!",
        station_niss_label: "NISS",
        station_niss_desc: "Seguridad Social - garantiza su protección y derechos laborales.",
        station_utente_label: "SNS",
        station_utente_desc: "Número de Utente del SNS para acceder a la atención médica pública.",
        station_job_label: "Empleo",
        station_job_desc: "Búsqueda activa de empleo en el mercado laboral y candidaturas.",
        station_residence_label: "Residencia",
        station_residence_desc: "¡Proceso de regularización de residencia completado con éxito!"
    }
};

const getT = (key: string, lang: string) => {
    const l = lang.toLowerCase();
    const targetLang = ['pt', 'en', 'fr', 'es'].includes(l) ? l : 'en';
    return (PROFILE_T as any)[targetLang][key] || (PROFILE_T as any)['en'][key];
};

const BADGE_LOCALES = {
    pt: {
        b1n: "Pioneiro MIRA",            b1d: "Concedido aos primeiros utilizadores que acreditaram no projeto. Representa a base da nossa comunidade.",
        b2n: "Conta Verificada",         b2d: "Identidade validada pessoalmente pela equipa MIRA. Símbolo de máxima confiança na plataforma.",
        b3n: "Curador da Comunidade",    b3d: "Atribuído a quem valida ativamente informação útil para outros membros. Requer mais de 20 validações confirmadas.",
        b4n: "Mestre dos Documentos",    b4d: "Especialista em processos de regularização e documentação oficial. Requer mais de 30 downloads ou ajudas documentais.",
        b5n: "Utilizador Exemplar",      b5d: "Concedido a membros com conduta impecável. Requer 60 dias consecutivos de atividade sem denúncias.",
        b6n: "Sentinela",                b6d: "Guardião da integridade da plataforma. Atribuído a quem identifica e reporta fraudes. Requer mais de 10 denúncias confirmadas.",
        b7n: "Especialista em Leis",     b7d: "Reconhece um profundo conhecimento da Lei de Estrangeiros e da legislação portuguesa. Requer mais de 50 consultas informativas.",
        b8n: "Mentor de Emprego",        b8d: "Atribuído a quem apoia outros membros na procura de emprego em Portugal. Requer mais de 10 comentários úteis em Vagas.",
        b9n: "Coração da Comunidade",    b9d: "O maior reconhecimento de empatia e apoio emocional. Atribuído a quem demonstra um cuidado constante."
    },
    en: {
        b1n: "MIRA Pioneer",             b1d: "Awarded to the first users who believed in the project. Represents the foundation of our community.",
        b2n: "Verified Account",         b2d: "Identity personally validated by the MIRA team. Symbol of maximum trust on the platform.",
        b3n: "Community Curator",        b3d: "Awarded to those who actively validate useful information for other members. Requires more than 20 confirmed validations.",
        b4n: "Master of Documents",      b4d: "Expert in regularization processes and official documentation. Requires more than 30 downloads or documentary helps.",
        b5n: "Exemplary User",           b5d: "Awarded to members with impeccable conduct. Requires 60 consecutive days of activity without reports.",
        b6n: "Sentinel",                 b6d: "Guardian of platform integrity. Awarded to those who identify and report fraud. Requires more than 10 confirmed reports.",
        b7n: "Law Specialist",           b7d: "Recognizes deep knowledge of the Foreigners Law and Portuguese legislation. Requires more than 50 informative queries.",
        b8n: "Employment Mentor",        b8d: "Awarded to those who support other members in finding employment in Portugal. Requires more than 10 useful comments in Jobs.",
        b9n: "Heart of the Community",   b9d: "The highest recognition of empathy and emotional support. Awarded to those who demonstrate constant care."
    },
    fr: {
        b1n: "Pionnier MIRA",            b1d: "Décerné aux premiers utilisateurs qui ont cru au projet. Représente la base de notre communauté.",
        b2n: "Compte Vérifié",           b2d: "Identité validée personnellement par l'équipe MIRA. Symbole de confiance maximale sur la plateforme.",
        b3n: "Curateur de la Communauté",b3d: "Décerné à ceux qui valident activement des informations utiles pour les autres membres. Nécessite plus de 20 validations confirmées.",
        b4n: "Maître des Documents",     b4d: "Expert en processus de régularisation et documentation officielle. Nécessite plus de 30 téléchargements ou aides documentaires.",
        b5n: "Utilisateur Exemplaire",   b5d: "Décerné aux membres ayant une conduite irréprochable. Nécessite 60 jours consécutifs d'activité sans signalement.",
        b6n: "Sentinelle",               b6d: "Gardien de l'intégrité de la plateforme. Décerné à ceux qui identifient et signalent les fraudes. Nécessite plus de 10 signalements confirmés.",
        b7n: "Spécialiste en Droit",     b7d: "Reconnaît une connaissance approfondie de la Loi sur les Étrangers et de la législation portugaise. Nécessite plus de 50 requêtes informatives.",
        b8n: "Mentor d'Emploi",          b8d: "Décerné à ceux qui soutiennent d'autres membres dans leur recherche d'emploi au Portugal. Nécessite plus de 10 commentaires utiles dans Emplois.",
        b9n: "Cœur de la Communauté",    b9d: "La plus haute reconnaissance d'empathie et de soutien émotionnel. Décerné à ceux qui font preuve d'une attention constante."
    },
    es: {
        b1n: "Pionero MIRA",             b1d: "Concedido a los primeros usuarios que creyeron en el proyecto. Representa la base de nuestra comunidad.",
        b2n: "Cuenta Verificada",        b2d: "Identidad validada personalmente por el equipo MIRA. Símbolo de máxima confianza en la plataforma.",
        b3n: "Curador de la Comunidad",  b3d: "Otorgado a quienes validan activamente información útil para otros miembros. Requiere más de 20 validaciones confirmadas.",
        b4n: "Maestro de los Documentos",b4d: "Experto en procesos de regularización y documentación oficial. Requiere más de 30 descargas o ayudas documentales.",
        b5n: "Usuario Ejemplar",         b5d: "Concedido a miembros con conducta impecable. Requiere 60 días consecutivos de actividad sin denuncias.",
        b6n: "Centinela",                b6d: "Guardián de la integridad de la plataforma. Otorgado a quienes identifican y reportan fraudes. Requiere más de 10 denuncias confirmadas.",
        b7n: "Especialista en Leyes",    b7d: "Reconoce un profundo conocimiento de la Ley de Extranjería y la legislación portuguesa. Requiere más de 50 consultas informativas.",
        b8n: "Mentor de Empleo",         b8d: "Otorgado a quienes apoyan a otros miembros en la búsqueda de empleo en Portugal. Requiere más de 10 comentarios útiles en Vacantes.",
        b9n: "Corazón de la Comunidad",  b9d: "El mayor reconocimiento de empatía y apoyo emocional. Otorgado a quienes demuestran un cuidado constante."
    }
};

const getBadges = (lang: string): Badge[] => {
    const l = lang.toLowerCase();
    const targetLang = ['pt', 'en', 'fr', 'es'].includes(l) ? l : 'en';
    const b = (BADGE_LOCALES as any)[targetLang];
    return [
        { id: 'pioneiro',          name: b.b1n,  icon: 'Star',          description: b.b1d,  unlocked: false, category: 'social' },
        { id: 'verificado',        name: b.b2n,  icon: 'CheckCircle2',  description: b.b2d,  unlocked: false, category: 'trust'  },
        { id: 'curador',           name: b.b3n,  icon: 'Check',         description: b.b3d,  unlocked: false, category: 'trust'  },
        { id: 'mestre_docs',       name: b.b4n,  icon: 'Bookmark',      description: b.b4d,  unlocked: false, category: 'help'   },
        { id: 'exemplar',          name: b.b5n,  icon: 'Award',         description: b.b5d,  unlocked: false, category: 'social' },
        { id: 'sentinela',         name: b.b6n,  icon: 'ShieldAlert',   description: b.b6d,  unlocked: false, category: 'trust'  },
        { id: 'especialista_leis', name: b.b7n,  icon: 'Book',          description: b.b7d,  unlocked: false, category: 'help'   },
        { id: 'mentor_emprego',    name: b.b8n,  icon: 'Flame',         description: b.b8d,  unlocked: false, category: 'help'   },
        { id: 'coracao',           name: b.b9n,  icon: 'Heart',         description: b.b9d,  unlocked: false, category: 'social' },
    ];
};


const BadgeIcon: React.FC<{ icon?: string; unlocked: boolean; emoji?: string }> = ({ icon, unlocked, emoji }) => {
    if (emoji) {
        return <span className="text-2xl sm:text-3xl select-none leading-none drop-shadow-sm">{emoji}</span>;
    }
    const color = unlocked ? 'text-white' : 'text-slate-400';
    const props = { size: 24, className: color };
    switch (icon) {
        case 'Flame':        return <Flame {...props} />;
        case 'CheckCircle2': return <CheckCircle2 {...props} />;
        case 'Shield':       return <Shield {...props} />;
        case 'Bookmark':     return <Bookmark {...props} />;
        case 'Check':        return <Check {...props} />;
        case 'Star':         return <Star {...props} />;
        case 'ShieldAlert':  return <ShieldAlert {...props} />;
        case 'MapPin':       return <MapPin {...props} />;
        case 'Heart':        return <Heart {...props} />;
        case 'Award':        return <Award {...props} />;
        default:             return <Award {...props} />;
    }
};

export const GamificationProfile: React.FC<GamificationProfileProps> = ({
    user,
    currentUser,
    onUpdateUser,
    activitiesCount = 0,
    impact = 0, // Ensure impact is destructured from props
    createdPosts = [],
    savedPosts = [],
    language,
    onNavigateToPost,
    onStartChat,
    onViewChange,
    onDeletePost,
    onLogout
}) => {
    const { showToast } = useToast();
    const isOtherProfile = currentUser?.id !== user?.id;
    const [isFollowing, setIsFollowing] = useState(false);
    
    // V2026.GOLD: Use proper ESM import
    const t_func = (key: string) => t(key, language);

    useEffect(() => {
        if (isOtherProfile && currentUser && user) {
            followService.isFollowing(currentUser.id, user.id).then(setIsFollowing);
        }
    }, [isOtherProfile, currentUser?.id, user?.id]);
    const [activeTab, setActiveTab] = useState<'posts' | 'badges' | 'verified'>('posts');
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(user?.name || '');
    const [editBio, setEditBio] = useState(user?.bio || '');
    const [editAvatar, setEditAvatar] = useState(user?.avatar || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
    const [localFollowersCount, setLocalFollowersCount] = useState(user?.followersCount || 0);
    const [documentDownloadsCount, setDocumentDownloadsCount] = useState(0);

    const [profileUser, setProfileUser] = useState<User | null>(user);
    const [allBadges, setAllBadges] = useState<Badge[]>([]);

    // SOBERANIA V500: Carregar medalhas dinâmicas do disco
    useEffect(() => {
        const loadBadges = async () => {
            const { gamificationService } = await import('../services/gamificationService');
            const data = await gamificationService.fetchAllBadges();
            if (data && data.length > 0) {
                setAllBadges(data.map(b => ({
                    id: b.id,
                    name: b.name,
                    icon: b.icon || 'Award',
                    icon_emoji: b.icon_emoji,
                    description: b.description || '',
                    unlocked: false,
                    category: b.category || 'social',
                    rarity_level: b.rarity_level
                })));
            }
        };
        loadBadges();
    }, []);

    // Sync full profile user details, followers count and handle admin/owner email display
    useEffect(() => {
        if (!user?.id) return;

        const isOwner = currentUser?.id === user?.id;
        const isAdmin = currentUser?.role === 'admin' || ['amandasabreu89@gmail.com'].includes(currentUser?.email?.toLowerCase() || '');

        // Fetch full profile including badges
        authService.fetchFullProfile(user.id).then(fullProfile => {
            if (fullProfile) {
                const sanitized = { ...fullProfile };
                // Hide email if user is not admin and not the owner
                if (!isAdmin && !isOwner) {
                    sanitized.email = undefined;
                }
                setProfileUser(sanitized);
            }
        });

        // 🛡️ MIRA SOBERANIA: Sincronização Real-Time de Métricas (Evita contagem estagnada)
        followService.getFollowerCount(user.id).then(count => {
            setLocalFollowersCount(count);
            setProfileUser(prev => prev ? { ...prev, followersCount: count } : prev);
        });
        followService.getFollowingCount(user.id).then(count => {
            setProfileUser(prev => prev ? { ...prev, followingCount: count } : prev);
        });
        
        // 📊 MIRA: Buscar contagem real de downloads de documentos do utilizador
        supabase
            .from('user_documents')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .then(({ count, error }) => {
                if (!error && count !== null) {
                    setDocumentDownloadsCount(count);
                }
            });

    }, [user?.id, currentUser?.role, currentUser?.id]);


    // Helper: Verificar se selo está conquistado (por registo atómico ou marco de reputação)
    const checkIsUnlocked = React.useCallback((badgeId: string) => {
        const isAdmin = profileUser?.role === 'admin' || user?.role === 'admin' || currentUser?.role === 'admin' || ['mira.app@hotmail.com', 'amandajhonnes@yahoo.com.br', 'amandasabreu89@gmail.com'].includes(currentUser?.email?.toLowerCase() || '') || ['mira.app@hotmail.com', 'amandajhonnes@yahoo.com.br', 'amandasabreu89@gmail.com'].includes(user?.email?.toLowerCase() || '');
        if (isAdmin) return true;

        const hasDbBadge = !!profileUser?.badges?.find(ub => 
            (ub as any)?.badge_id === badgeId || 
            (typeof ub === 'string' && ub === badgeId) || 
            (ub && typeof ub === 'object' && (ub as any).id === badgeId)
        );
        if (hasDbBadge) return true;

        const currentRep = profileUser?.reputation || user?.reputation || 0;
        const thresholds: Record<string, number> = {
            coracao: 10,
            curador: 50,
            mestre_docs: 80,
            exemplar: 100,
            mentor_emprego: 120,
            sentinela: 150,
            especialista_leis: 200
        };

        if (thresholds[badgeId] !== undefined && currentRep >= thresholds[badgeId]) return true;
        if (badgeId === 'verificado' && (profileUser?.isVerified || isAdmin)) return true;
        if (badgeId === 'pioneiro') return true;

        return false;
    }, [profileUser, user, currentUser]);

    // Calcular quantidade de medalhas conquistadas pelo utilizador
    const unlockedBadgesCount = React.useMemo(() => {
        const badgesList = allBadges.length > 0 ? allBadges : getBadges(language);
        return badgesList.filter(badge => checkIsUnlocked(badge.id)).length;
    }, [allBadges, checkIsUnlocked, language]);

    // Consolidate stats for display - MIRA V2026.GOLD: High Resilience Mapping
    const stats = {
        reputation: profileUser?.reputation || user?.reputation || 0,
        activities: activitiesCount || profileUser?.completedCoursesCount || 0,
        impact: profileUser?.totalLikesReceived || user?.totalLikesReceived || 0 
    };




    const handleSaveProfile = async () => {
        const targetUser = user || currentUser;
        if (!targetUser || isSaving) return;

        setIsSaving(true);
        try {
            const updatedUser: User = { 
                ...targetUser, 
                name: editName, 
                bio: editBio, 
                avatar: editAvatar 
            };

            // ⚡ INSTANT LOCAL UPDATE
            onUpdateUser(updatedUser);
            setProfileUser(updatedUser);
            localStorage.setItem('mira_user', JSON.stringify(updatedUser));
            if (targetUser.id) {
                localStorage.setItem(`mira_avatar_${targetUser.id}`, editAvatar);
            }

            const { supabase } = await import('../lib/supabase');
            // 🛡️ MIRA: Synchronous upsert to Supabase profiles table without invalid columns
            const profilePayload: any = {
                id: targetUser.id,
                name: editName,
                full_name: editName,
                bio: editBio,
                avatar_url: editAvatar,
                updated_at: new Date().toISOString()
            };

            if (targetUser.email) {
                profilePayload.email = targetUser.email.toLowerCase().trim();
            }

            const { error: upsertErr } = await supabase.from('profiles').upsert(profilePayload, { onConflict: 'id' });

            if (upsertErr) {
                console.warn('MIRA: Cloud upsert warning:', upsertErr.message);
            } else {
                console.log('✅ [MIRA] Foto de perfil e dados atualizados no Supabase:', editAvatar);
            }

            const { syncService } = await import('../services/syncService');
            await syncService.enqueue('profile', { id: targetUser.id, name: editName, bio: editBio, avatar_url: editAvatar });
            
            showToast("Perfil e foto atualizados com sucesso!", "success");
            setTimeout(() => { setIsEditing(false); setIsSaving(false); }, 300);
        } catch (error) {
            console.error('MIRA: Error saving profile:', error);
            showToast("Perfil salvo localmente.", "info");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white text-slate-800 overflow-hidden no-scrollbar">
            {/* Header / Top Stats Container */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
                <div className="p-4 sm:p-8 pb-4 relative overflow-hidden">
                    {/* Background decorations */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF8C00]/5 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#FFD700]/5 rounded-full blur-[100px] -ml-32 -mb-32"></div>
                    
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-800">{getT('my_profile', language)}</h2>
                        <button 
                            onClick={onLogout}
                            className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all border border-red-100"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>

                    <div className="flex flex-col items-center mb-10 relative z-10">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-[3.5rem] p-1 bg-gradient-to-tr from-[#FF8C00] via-[#FFD700] to-[#FF8C00] shadow-[0_0_40px_rgba(255,140,0,0.1)]">
                                <img 
                                    src={isEditing ? editAvatar : (profileUser?.avatar || PREDEFINED_AVATARS[0])} 
                                    alt="Profile" 
                                    className="w-full h-full rounded-[3.3rem] object-cover border-4 border-white"
                                    referrerPolicy="no-referrer"
                                />
                            </div>
                            <button 
                                onClick={() => setIsEditing(!isEditing)}
                                className={`absolute bottom-0 right-0 p-3 rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-all border-4 border-white ${isEditing ? 'bg-slate-900 text-white' : 'bg-[#FF8C00] text-white'}`}
                            >
                                {isEditing ? <X size={16} /> : <Edit2 size={16} />}
                            </button>
                        </div>

                        {isEditing ? (
                            <div className="mt-6 w-full max-w-xs space-y-3 animate-in fade-in slide-in-from-top-4">
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 px-4 py-3 rounded-2xl font-bold text-center text-sm outline-none focus:border-[#FF8C00]"
                                    placeholder={getT('community_name', language)}
                                />
                                <input
                                    type="text"
                                    value={editBio}
                                    onChange={e => setEditBio(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 px-4 py-3 rounded-2xl text-xs text-center font-medium outline-none focus:border-[#FF8C00]"
                                    placeholder={getT('bio_placeholder', language)}
                                />
                                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 pt-2 max-h-[160px] overflow-y-auto no-scrollbar pb-2">
                                    {PREDEFINED_AVATARS.map((url, idx) => (
                                        <button key={idx} onClick={() => setEditAvatar(url)} className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${editAvatar === url ? 'border-[#FF8C00] scale-105 shadow-md shadow-orange-500/20' : 'border-slate-100 opacity-60 hover:opacity-100'}`}>
                                            <img src={url} alt="" className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={isSaving}
                                    className="w-full bg-[#FF8C00] text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50 mt-4"
                                >
                                    {isSaving ? getT('saving', language) : getT('save_profile', language)}
                                </button>
                            </div>
                        ) : (
                            <div className="mt-6 text-center animate-in fade-in slide-in-from-top-4 duration-700">
                                {((currentUser?.role === 'admin') || (currentUser?.id === profileUser?.id)) && profileUser?.email && (
                                    <div className="flex flex-col items-center gap-2 mb-4">
                                        <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-black/20 flex items-center gap-2 group">
                                            <Mail size={14} className="text-[#FF8C00] group-hover:scale-110 transition-transform" />
                                            <p className="text-[11px] font-black text-white uppercase tracking-widest selection:bg-[#FF8C00] selection:text-white">
                                                {profileUser.email}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.3em] bg-slate-100 px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                                                ID: {profileUser.id.substring(0, 12).toUpperCase()}
                                            </span>
                                            {currentUser?.role === 'admin' && (
                                                <span className="text-[8px] font-black text-[#FF8C00] uppercase tracking-[0.3em] bg-orange-50 px-3 py-1 rounded-full border border-orange-100 shadow-sm">
                                                    ACESSO ADMIN
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 italic px-8 max-w-xs mx-auto leading-relaxed">{profileUser?.bio || getT('member_of', language)}</p>
                                <div className="flex items-center justify-center gap-2">
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border transition-all ${profileUser?.role === 'admin' ? 'bg-slate-900 text-white border-slate-800 shadow-xl' : 'bg-[#FF8C00]/10 text-[#FF8C00] border-[#FF8C00]/20'}`}>
                                        {profileUser?.role === 'admin' ? 'Soberania Admin' : (profileUser?.trustLevel || 'Elite')}
                                    </span>
                                    {profileUser?.isVerified && <CheckCircle2 size={14} className="text-blue-500 animate-pulse" />}
                                </div>
                                <div className="flex items-center justify-center gap-4 mt-4">
                                    <span className="text-[10px] font-bold text-slate-500 font-semibold">
                                        <strong className="text-slate-800 font-black">{localFollowersCount}</strong> {getT('profile_followers', language)}
                                    </span>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-[10px] font-bold text-slate-500 font-semibold">
                                        <strong className="text-slate-800 font-black">{profileUser?.followingCount || 0}</strong> {getT('following', language)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {isOtherProfile && (
                        <div className="flex gap-4 mb-8">
                            <button 
                                onClick={async () => {
                                    if (!currentUser || !user) {
                                        showToast("SESSÃO INVÁLIDA: Utilizadores não identificados.", "error");
                                        return;
                                    }
                                    
                                    try {
                                        if (isFollowing) {
                                            // 🛡️ MIRA SOBERANIA: Desseguir (Atomic Write)
                                            const result = await followService.unfollowUser(currentUser.id, user.id);
                                            if (result?.error) throw result.error;
                                            
                                            setLocalFollowersCount(prev => Math.max(0, prev - 1));
                                            setIsFollowing(false);
                                            showToast("MIRA: Deixou de seguir.", "success");
                                        } else {
                                            // 🛡️ MIRA SOBERANIA: Seguir (Atomic Write)
                                            const result = await followService.followUser(currentUser.id, user.id);
                                            if (result?.error) throw result.error;
                                            
                                            setLocalFollowersCount(prev => prev + 1);
                                            setIsFollowing(true);
                                            showToast("MIRA: Seguidor registado.", "success");
                                            
                                            // 🛡️ MIRA SOBERANIA: Auto-refresh de métricas sem vazar e-mail (Atomic Read)
                                            const { data: updated } = await supabase
                                                .from('profiles')
                                                .select('id, name, full_name, avatar_url, reputation, trust_level, role, followers_count, following_count, verified_posts_count, total_likes_received')
                                                .eq('id', user.id)
                                                .single();
                                                
                                            if (updated) {
                                                const mapped = authService.mapProfileToUser(updated, null);
                                                // 🛡️ MIRA SOBERANIA: Forçar contagem real se o campo do banco estiver estagnado
                                                const realFollowers = await followService.getFollowerCount(user.id);
                                                const realFollowing = await followService.getFollowingCount(user.id);
                                                
                                                mapped.followersCount = realFollowers;
                                                mapped.followingCount = realFollowing;

                                                // Garantir que o email não entra no estado se não houver permissão
                                                const isOwner = currentUser?.id === user?.id;
                                                const isAdmin = currentUser?.role === 'admin' || ['amandasabreu89@gmail.com'].includes(currentUser?.email?.toLowerCase() || '');
                                                if (!isAdmin && !isOwner) mapped.email = undefined;
                                                setProfileUser(mapped);
                                                setLocalFollowersCount(realFollowers);
                                            }
                                        }
                                    } catch (err: any) {
                                        console.error('MIRA DB ERROR:', err);
                                        showToast(`ERRO DE DISCO: ${err.message || 'Falha na escrita'}`, "error");
                                    }
                                }}
                                className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl ${isFollowing ? 'bg-slate-100 text-slate-400' : 'bg-[#FF8C00] text-white'}`}
                            >
                                {isFollowing ? getT('unfollow', language) : getT('follow', language)}
                            </button>

                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 mb-8 relative z-10">
                        {/* Reputação */}
                        <div className="bg-slate-50 p-4 rounded-[2rem] flex flex-col items-center justify-center text-slate-800 border border-slate-100 shadow-xl shadow-slate-100/50">
                            <Zap size={18} className="mb-1 text-[#FFD700]" />
                            <span className="text-[28px] font-black leading-none">{stats.reputation || 0}</span>
                            <span className="text-[8px] font-black uppercase tracking-widest opacity-40 mt-1">{getT('reputation', language)}</span>
                        </div>
                        {/* Atividades */}
                        <div className="bg-slate-50 p-4 rounded-[2rem] flex flex-col items-center justify-center text-slate-800 border border-slate-100 shadow-xl shadow-slate-100/50">
                            <Activity size={18} className="mb-1 text-cyan-500" />
                            <span className="text-[28px] font-black leading-none">{stats.activities || 0}</span>
                            <span className="text-[8px] font-black uppercase tracking-widest opacity-40 mt-1">{getT('activities', language)}</span>
                        </div>
                        {/* Likes Recebidos */}
                        <div className="bg-slate-50 p-4 rounded-[2rem] flex flex-col items-center justify-center text-slate-800 border border-slate-100 shadow-xl shadow-slate-100/50">
                            <Heart size={18} className="mb-1 text-rose-500" />
                            <span className="text-[28px] font-black leading-none">{stats.impact || 0}</span>
                            <span className="text-[8px] font-black uppercase tracking-widest opacity-40 mt-1">{getT('likes_received', language)}</span>
                        </div>
                        {/* Downloads Realizados */}
                        <div className="bg-slate-50 p-4 rounded-[2rem] flex flex-col items-center justify-center text-slate-800 border border-slate-100 shadow-xl shadow-slate-100/50">
                            <Download size={18} className="mb-1 text-sky-500" />
                            <span className="text-[28px] font-black leading-none">{documentDownloadsCount}</span>
                            <span className="text-[8px] font-black uppercase tracking-widest opacity-40 mt-1">{getT('doc_downloads', language)}</span>
                        </div>
                        {/* Medalhas Conquistadas */}
                        <div className="bg-slate-50 p-4 rounded-[2rem] flex flex-col items-center justify-center text-slate-800 border border-slate-100 shadow-xl shadow-slate-100/50">
                            <Award size={18} className="mb-1 text-[#FF8C00]" />
                            <span className="text-[28px] font-black leading-none">{unlockedBadgesCount}</span>
                            <span className="text-[8px] font-black uppercase tracking-widest opacity-40 mt-1">{getT('medals_unlocked', language)}</span>
                        </div>
                        {/* Posts Verificados */}
                        <div className="bg-slate-50 p-4 rounded-[2rem] flex flex-col items-center justify-center text-slate-800 border border-slate-100 shadow-xl shadow-slate-100/50">
                            <CheckCircle2 size={18} className="mb-1 text-emerald-500" />
                            <span className="text-[28px] font-black leading-none">{profileUser?.verifiedPostsCount || user?.verifiedPostsCount || 0}</span>
                            <span className="text-[8px] font-black uppercase tracking-widest opacity-40 mt-1">{getT('verified_posts_count', language)}</span>
                        </div>
                    </div>


                </div>

                <div className="flex border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-xl z-[20] w-full overflow-hidden">
                    <button onClick={() => setActiveTab('posts')} className={`flex-1 py-4 text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap text-center ${activeTab === 'posts' ? 'text-[#FF8C00] border-b-4 border-[#FF8C00] bg-slate-50' : 'text-slate-400 hover:bg-slate-50'}`}>{getT('tab_posts', language)}</button>
                    <button onClick={() => setActiveTab('badges')} className={`flex-1 py-4 text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap text-center ${activeTab === 'badges' ? 'text-[#FF8C00] border-b-4 border-[#FF8C00] bg-slate-50' : 'text-slate-400 hover:bg-slate-50'}`}>{getT('tab_badges', language)}</button>
                    <button onClick={() => setActiveTab('verified')} className={`flex-1 py-4 text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap text-center ${activeTab === 'verified' ? 'text-[#FF8C00] border-b-4 border-[#FF8C00] bg-slate-50' : 'text-slate-400 hover:bg-slate-50'}`}>{getT('tab_saved', language)}</button>
                </div>

                <div className="p-3 sm:p-6">
                    {activeTab === 'badges' && (
                        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-4 animate-in fade-in duration-500">
                            {(allBadges.length > 0 ? allBadges : getBadges(language)).map(badge => {
                                const userBadge = profileUser?.badges?.find(ub => ub.badge_id === badge.id || (typeof ub === 'string' && ub === badge.id));
                                const unlocked = checkIsUnlocked(badge.id);
                                return (
                                    <div 
                                        key={badge.id} 
                                        onClick={() => setSelectedBadge({ ...badge, unlocked, awardedAt: userBadge?.awarded_at } as any)}
                                        className={`w-full flex flex-col items-center justify-between p-3 sm:p-4 rounded-[1.6rem] sm:rounded-[2.2rem] border transition-all duration-300 transform active:scale-95 cursor-pointer group relative overflow-hidden ${
                                            unlocked
                                                ? 'bg-gradient-to-b from-amber-500/10 via-orange-500/5 to-white border-amber-300/60 shadow-md shadow-amber-500/5 hover:border-amber-400 hover:shadow-amber-500/20'
                                                : 'bg-slate-50/80 border-slate-100 opacity-60 hover:opacity-80'
                                        }`}
                                    >
                                        <MiraBadgeSeal id={badge.id} unlocked={unlocked} size="md" className="mb-2" />
                                        
                                        <h5 className={`text-[10px] sm:text-[11px] font-black uppercase text-center leading-tight tracking-tight px-1 line-clamp-2 ${
                                            unlocked ? 'text-slate-800' : 'text-slate-500'
                                        }`}>
                                            {badge.name}
                                        </h5>
                                        
                                        {unlocked ? (
                                            <span className="mt-2 px-2.5 py-0.5 rounded-full text-[7px] xs:text-[8px] font-black uppercase tracking-wider bg-emerald-100/90 text-emerald-800 border border-emerald-300/60 shadow-xs flex items-center gap-1">
                                                <CheckCircle2 size={10} className="text-emerald-600 shrink-0" />
                                                {getT('profile_unlocked', language)}
                                            </span>
                                        ) : (
                                            <span className="mt-2 px-2 py-0.5 rounded-full text-[7px] xs:text-[8px] font-black uppercase tracking-wider bg-slate-200/80 text-slate-500 flex items-center gap-1">
                                                <Lock size={9} className="text-slate-400 shrink-0" />
                                                Bloqueado
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'posts' && (
                        <div className="grid grid-cols-1 gap-4 animate-in fade-in duration-500">
                            {createdPosts.length > 0 ? createdPosts.map(post => (
                                <div key={post.id} className="p-4 bg-white border border-slate-100 rounded-[2.5rem] shadow-xl hover:border-[#FF8C00]/30 transition-all flex items-center gap-4 group relative">
                                    <div onClick={() => onNavigateToPost(post.id)} className="w-20 h-20 rounded-[1.8rem] overflow-hidden shrink-0 border border-slate-100 cursor-pointer">
                                        <img 
                                            src={post.backgroundImage || 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&q=80'} 
                                            alt="" 
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                        />
                                    </div>
                                    <div onClick={() => onNavigateToPost(post.id)} className="flex-1 min-w-0 cursor-pointer">
                                        <span className="text-[8px] font-black bg-slate-50 text-slate-400 px-3 py-1 rounded-full uppercase tracking-widest mb-1.5 inline-block">{post.category}</span>
                                        <h4 className="font-black text-slate-800 text-xs leading-tight mb-1 group-hover:text-[#FF8C00] transition-colors uppercase tracking-tight truncate">{post.title}</h4>
                                        <div className="flex items-center gap-2 mt-auto">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{post.authorName || profileUser?.name}</span>
                                        </div>
                                    </div>
                                    {onDeletePost && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDeletePost(post.id); }}
                                            className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all border border-red-100 opacity-0 group-hover:opacity-100"
                                            title="Remover"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            )) : (
                                <div className="text-center py-20 text-slate-100 bg-slate-50 rounded-[3.5rem] border-2 border-dashed border-slate-100">
                                    <FileText size={48} className="mx-auto mb-4 opacity-10" />
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">{getT('no_posts_yet', language)}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'verified' && (
                        <div className="space-y-4 animate-in fade-in duration-500">
                            {savedPosts.length > 0 ? savedPosts.map(post => (
                                <div key={post.id} onClick={() => onNavigateToPost(post.id)} className="flex gap-4 p-4 bg-white border border-slate-100 rounded-[2.5rem] shadow-xl hover:border-[#FF8C00]/30 transition-all cursor-pointer group">
                                    <div className="w-20 h-20 rounded-[1.8rem] overflow-hidden shrink-0 border border-slate-100">
                                        <img src={post.backgroundImage} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    </div>
                                    <div className="flex flex-col justify-center min-w-0 flex-1">
                                        <span className="text-[8px] font-black bg-[#FF8C00]/10 text-[#FF8C00] px-3 py-1 rounded-full uppercase tracking-widest w-fit mb-2">{post.category}</span>
                                        <h4 className="font-black text-slate-800 text-xs leading-tight mb-1 group-hover:text-[#FF8C00] transition-colors uppercase tracking-tight truncate">{post.title}</h4>
                                        <div className="flex items-center gap-2 mt-auto">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{post.authorName}</span>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-20 text-slate-100 bg-slate-50 rounded-[3.5rem] border-2 border-dashed border-slate-100">
                                    <Bookmark size={48} className="mx-auto mb-4 opacity-10" />
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">{getT('no_saved_items', language)}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {!isOtherProfile && (
                        <div className="mt-12 pt-8 border-t border-slate-100 pb-10">
                            <div className="flex items-center gap-3 mb-6 px-2">
                                <div className="p-2.5 bg-slate-50 rounded-[1.2rem] text-[#FF8C00] border border-slate-100">
                                    <Lock size={18} />
                                </div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{getT('security_settings', language)}</h4>
                            </div>

                            <div className="bg-red-50 p-8 rounded-[3rem] border border-red-100 backdrop-blur-sm">
                                <p className="text-[10px] text-red-500/60 font-bold leading-relaxed mb-6 flex items-start gap-4 uppercase tracking-tight">
                                    <ShieldAlert size={16} className="shrink-0 text-red-500" />
                                    {getT('delete_account_confirm', language)}
                                </p>
                                <button
                                    id="comm_delete_btn"
                                    disabled={isDeleting}
                                    onClick={async () => {
                                        if (user && window.confirm("Deseja realmente eliminar a sua conta? Esta ação é irreversível e removerá todos os seus dados do MIRA.")) {
                                            setIsDeleting(true);
                                            try {
                                                const success = await authService.deleteAccount();
                                                if (success) {
                                                    onLogout();
                                                } else { 
                                                    setIsDeleting(false); 
                                                    alert("Erro ao eliminar conta. O Protocolo Nuclear falhou."); 
                                                }
                                            } catch (e) { onLogout(); }
                                        }
                                    }}
                                    className={`w-full flex items-center justify-center gap-3 py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-widest transition-all ${isDeleting ? 'bg-slate-50 text-slate-200' : 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white shadow-lg'}`}
                                >
                                    {isDeleting ? (
                                        <div className="w-5 h-5 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Trash2 size={16} /> {getT('delete_account', language)}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal for Badges */}
            {selectedBadge && (() => {
                const colors = {
                    trust: { bg: 'bg-blue-500/20', border: 'border-blue-400/30', glow: 'shadow-blue-500/40', text: 'text-blue-400' },
                    help: { bg: 'bg-emerald-500/20', border: 'border-emerald-400/30', glow: 'shadow-emerald-500/40', text: 'text-emerald-400' },
                    social: { bg: 'bg-amber-500/20', border: 'border-amber-400/30', glow: 'shadow-amber-500/40', text: 'text-amber-400' }
                }[selectedBadge.category || 'social'] || { bg: 'bg-amber-500/20', border: 'border-amber-400/30', glow: 'shadow-amber-500/40', text: 'text-amber-400' };

                return (
                    <div className="fixed inset-0 z-[10000] bg-slate-950/90 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-500" onClick={() => setSelectedBadge(null)}>
                        {/* Glow Solar Flare em background */}
                        <div className={`absolute w-64 h-64 rounded-full blur-[100px] opacity-20 animate-pulse ${colors.bg}`} />
                        
                        <div className="relative bg-slate-900 border border-slate-800 rounded-[4rem] p-1 shadow-2xl max-w-sm w-full animate-in zoom-in-95 slide-in-from-bottom-10 duration-700 overflow-hidden" onClick={e => e.stopPropagation()}>
                            {/* Reflexo Glassmorphism Superior */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                            
                            <div className="relative p-10 flex flex-col items-center text-center">
                                {/* Badge Showcase with Flare */}
                                <div className="relative mb-6">
                                    <div className={`absolute inset-0 rounded-full blur-2xl opacity-50 ${colors.bg}`} />
                                    <MiraBadgeSeal id={selectedBadge.id} unlocked={selectedBadge.unlocked} size="xl" />
                                </div>

                                <span className={`text-[8px] font-black uppercase tracking-[0.4em] mb-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 ${colors.text}`}>
                                    {selectedBadge.category || 'Sovereign'}
                                </span>
                                
                                <h4 className="text-3xl font-black text-white uppercase tracking-tighter mb-4 leading-none">{selectedBadge.name}</h4>
                                <div className="w-12 h-1 bg-white/10 rounded-full mb-6" />
                                
                                <p className="text-[11px] text-slate-400 font-medium leading-relaxed mb-8 px-4">
                                    {selectedBadge.description}
                                </p>
                                
                                {selectedBadge.unlocked && (selectedBadge as any).awardedAt && (
                                    <div className="w-full mb-8 p-6 bg-white/5 rounded-[2.5rem] border border-white/5 backdrop-blur-md">
                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Selo Atribuído em</p>
                                        <p className="text-sm font-black text-white uppercase tracking-tight">
                                            {new Date((selectedBadge as any).awardedAt).toLocaleDateString(language === 'PT' ? 'pt-PT' : 'en-US', {
                                                day: '2-digit', month: 'long', year: 'numeric'
                                            }).replace(',', '')}
                                        </p>
                                    </div>
                                )}
                                
                                <button 
                                    onClick={() => setSelectedBadge(null)}
                                    className="w-full py-6 bg-white text-slate-900 rounded-[2.5rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-[0_20px_40px_rgba(255,255,255,0.1)] hover:scale-105 active:scale-95 transition-all"
                                >
                                    FECHAR
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default GamificationProfile;
