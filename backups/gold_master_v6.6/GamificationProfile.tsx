import React, { useState, useEffect, useRef } from 'react';
import { followService } from '../services/followService';
import { User, Comment, ForumPost, ViewType, Badge, Post } from '../types';
import { FileText, Bookmark, Shield, CheckCircle2, Heart, Zap, Star, X, LogOut, Award, Flame, UserCheck, ShieldAlert, Book, MapPin, Activity, Edit2, Check, CalendarCheck, Trash2, Lock, Users, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PREDEFINED_AVATARS } from '../constants';
import { authService } from '../services/authService';
import { useToast } from './Toast';
import { t } from '../utils/translations';

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
        impact: "Impacto"
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
        impact: "Impact"
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
        reputation: "Réputation",
        activities: "Activités",
        impact: "Impact"
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
        reputation: "Reputación",
        activities: "Actividades",
        impact: "Impacto"
    }
};

const getT = (key: string, lang: string) => {
    const l = lang.toLowerCase();
    const targetLang = ['pt', 'en', 'fr', 'es'].includes(l) ? l : 'en';
    return (PROFILE_T as any)[targetLang][key] || (PROFILE_T as any)['en'][key];
};

const BADGE_LOCALES = {
    pt: {
        b1n: "Pioneiro MIRA",    b1d: "Concedido aos primeiros utilizadores que acreditaram no projeto. Representa a fundação da comunidade.",
        b2n: "Conta Verificada",  b2d: "Identidade validada pessoalmente pela equipa MIRA. Símbolo de confiança máxima na plataforma.",
        b3n: "Sentinela",         b3d: "Guardião da integridade. Atribuído a quem reporta fraudes. Requer 10+ denúncias confirmadas.",
        b4n: "Escudo Anti-Burla", b4d: "Barreira real contra burlas detetadas na comunidade. Requer 5 burlas confirmadas prevenidas.",
        b5n: "Mestre dos Docs",   b5d: "Especialista em documentação oficial. Requer 30+ downloads ou ajudas documentais.",
        b6n: "Curador",           b6d: "Atribuído a quem valida informações úteis. Requer 20+ validações confirmadas.",
        b7n: "Utilizador Exemplar",b7d: "Conduta impecável na plataforma. Requer 60 dias de atividade sem denúncias.",
        b8n: "Voz de Autoridade", b8d: "Posts verificados e selados pela CEO da plataforma MIRA.",
        b9n: "Guia Local",        b9d: "Especialista em serviços públicos. Requer 15+ avaliações com 4+ estrelas.",
        b10n: "Coração",          b10d: "Alto nível de empatia e apoio emocional consistente aos membros.",
    },
    en: {
        b1n: "MIRA Pioneer",     b1d: "Awarded to earliest members who trusted the project from the very start.",
        b2n: "Verified Account", b2d: "Identity personally validated by the MIRA team. Highest trust symbol on the platform.",
        b3n: "Sentinel",         b3d: "Platform integrity guardian. Requires 10+ confirmed fraud reports.",
        b4n: "Anti-Scam Shield", b4d: "Real barrier against detected scams. Requires 5+ confirmed scams prevented.",
        b5n: "Doc Master",       b5d: "Official documentation expert. Requires 30+ document downloads or assistance.",
        b6n: "Curator",          b6d: "Validates useful community info. Requires 20+ confirmed validations.",
        b7n: "Exemplary User",   b7d: "Impeccable platform conduct. Requires 60 days of activity without reports.",
        b8n: "Voice of Authority",b8d: "Posts verified and sealed by the MIRA platform CEO.",
        b9n: "Local Guide",      b9d: "Public services specialist. Requires 15+ reviews with 4+ stars.",
        b10n: "Heart",           b10d: "High level of empathy and consistent emotional support to members.",
    },
    fr: {
        b1n: "Pionnier MIRA",    b1d: "Décerné aux premiers membres qui ont cru dans le projet dès le début.",
        b2n: "Compte Vérifié",  b2d: "Identité validée par l'équipe MIRA. Le plus haut symbole de confiance.",
        b3n: "Sentinelle",       b3d: "Gardien de l'intégrité. Nécessite 10+ signalements confirmés.",
        b4n: "Bouclier Anti-Arnaque",b4d: "Barrière contre les arnaques. Nécessite 5+ arnaques confirmées prévenues.",
        b5n: "Maître des Docs",  b5d: "Expert en documentation officielle. Nécessite 30+ téléchargements ou aides.",
        b6n: "Curateur",         b6d: "Valide des informations utiles. Nécessite 20+ validations confirmées.",
        b7n: "Utilisateur Exemplaire",b7d: "Conduite irréprochable. Nécessite 60 jours d'activité sans signalement.",
        b8n: "Voix d'Autorité", b8d: "Posts vérifiés et sellés par la CEO de la plateforme MIRA.",
        b9n: "Guide Local",      b9d: "Spécialiste des services publics. Nécessite 15+ évaluations avec 4+ étoiles.",
        b10n: "Cœur",           b10d: "Haut niveau d'empathie et de soutien émotionnel constant aux membres.",
    },
    es: {
        b1n: "Pionero MIRA",     b1d: "Otorgado a los primeros miembros que creyeron en el proyecto desde el principio.",
        b2n: "Cuenta Verificada",b2d: "Identidad validada por el equipo MIRA. El más alto símbolo de confianza.",
        b3n: "Centinela",        b3d: "Guardián de la integridad. Requiere 10+ denuncias confirmadas.",
        b4n: "Escudo Anti-Estafa",b4d: "Barrera contra estafas detectadas. Requiere 5+ estafas confirmadas prevenidas.",
        b5n: "Maestro de Docs",  b5d: "Experto en documentación oficial. Requiere 30+ descargas o ayudas.",
        b6n: "Curador",          b6d: "Valida información útil. Requiere 20+ validaciones confirmadas.",
        b7n: "Usuario Ejemplar", b7d: "Conducta impecable. Requiere 60 días de actividad sin denuncias.",
        b8n: "Voz de Autoridad", b8d: "Posts verificados y sellados por la CEO de la plataforma MIRA.",
        b9n: "Guía Local",       b9d: "Especialista en servicios públicos. Requiere 15+ evaluaciones con 4+ estrellas.",
        b10n: "Corazón",         b10d: "Alto nivel de empatía y apoyo emocional constante a los miembros.",
    }
};

const getBadges = (lang: string): Badge[] => {
    const l = lang.toLowerCase();
    const targetLang = ['pt', 'en', 'fr', 'es'].includes(l) ? l : 'en';
    const b = (BADGE_LOCALES as any)[targetLang];
    return [
        { id: 'pioneiro',          name: b.b1n,  icon: 'Star',          description: b.b1d,  unlocked: false, category: 'social' },
        { id: 'verificado',        name: b.b2n,  icon: 'CheckCircle2',  description: b.b2d,  unlocked: false, category: 'trust'  },
        { id: 'sentinela',         name: b.b3n,  icon: 'ShieldAlert',   description: b.b3d,  unlocked: false, category: 'trust'  },
        { id: 'escudo_antiburla',  name: b.b4n,  icon: 'Shield',        description: b.b4d,  unlocked: false, category: 'trust'  },
        { id: 'mestre_docs',       name: b.b5n,  icon: 'Bookmark',      description: b.b5d,  unlocked: false, category: 'help'   },
        { id: 'curador',           name: b.b6n,  icon: 'Check',         description: b.b6d,  unlocked: false, category: 'trust'  },
        { id: 'exemplar',          name: b.b7n,  icon: 'Award',         description: b.b7d,  unlocked: false, category: 'social' },
        { id: 'voz_autoridade',    name: b.b8n,  icon: 'Flame',         description: b.b8d,  unlocked: false, category: 'social' },
        { id: 'guia_local',        name: b.b9n,  icon: 'MapPin',        description: b.b9d,  unlocked: false, category: 'help'   },
        { id: 'coracao',           name: b.b10n, icon: 'Heart',         description: b.b10d, unlocked: false, category: 'social' },
    ];
};

const BadgeIcon = ({ icon, unlocked }: { icon: string, unlocked: boolean }) => {
    const color = unlocked ? 'text-[#FF8C00]' : 'text-slate-300';
    const props = { size: 26, className: color };
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

    // Sync followers count when user prop changes
    useEffect(() => {
        setLocalFollowersCount(user?.followersCount || 0);
    }, [user?.followersCount]);

    // Consolidate stats for display
    const stats = {
        reputation: user?.reputation || 0,
        activities: activitiesCount,
        impact: user?.totalLikesReceived || 0 // Using totalLikesReceived for impact as per original JSX
    };

    const handleSaveProfile = async () => {
        if (!user || !currentUser || isSaving) return;
        
        // 🔐 MIRA NUCLEAR LOCK: Prevent Session Poisoning / Account Takeover
        if (user.id !== currentUser.id) {
            console.error("MIRA Security: Bloqueio de usurpação detetado.");
            showToast("Ação não permitida: Apenas o dono pode editar o perfil.", "error");
            return;
        }

        setIsSaving(true);
        try {
            const updatedUser = { ...user, name: editName, bio: editBio, avatar: editAvatar };
            onUpdateUser(updatedUser);
            localStorage.setItem('mira_user', JSON.stringify(updatedUser));
            
            const { syncService } = await import('../services/syncService');
            await syncService.enqueue('profile', { id: user.id, name: editName, bio: editBio, avatar_url: editAvatar });

            setTimeout(() => { setIsEditing(false); setIsSaving(false); }, 500);
        } catch (error) {
            console.error('MIRA: Error saving profile:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white text-slate-800 overflow-hidden no-scrollbar">
            {/* Header / Top Stats Container */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
                <div className="p-8 pb-4 relative overflow-hidden">
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
                                    src={isEditing ? editAvatar : (user?.avatar || PREDEFINED_AVATARS[0])} 
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
                                <div className="grid grid-cols-5 gap-2 pt-2 max-h-[160px] overflow-y-auto no-scrollbar pb-2">
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
                            <div className="mt-6 text-center">
                                <h3 className="text-xl font-black uppercase tracking-tight text-slate-800 mb-1">{user?.name || 'Membro MIRA'}</h3>
                                {((currentUser?.role === 'admin') || (currentUser?.id === user?.id)) && user?.email && (
                                    <div className="flex flex-col items-center gap-1 mb-2">
                                        <p className="text-[10px] font-black text-[#FF8C00] uppercase tracking-widest border border-[#FF8C00]/20 bg-[#FF8C00]/5 px-3 py-1 rounded-full">
                                            {user.email}
                                        </p>
                                        <span className="text-[7px] font-bold text-slate-400">EMAIL DE REGISTO MIRA</span>
                                    </div>
                                )}
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 italic px-8">{user?.bio || getT('member_of', language)}</p>
                                <div className="flex items-center justify-center gap-2">
                                    <span className="text-[10px] font-black text-[#FF8C00] uppercase tracking-widest bg-[#FF8C00]/10 px-3 py-1 rounded-full border border-[#FF8C00]/20">
                                        {user?.trustLevel || 'Elite'}
                                    </span>
                                    {user?.isVerified && <CheckCircle2 size={14} className="text-blue-500" />}
                                </div>
                            </div>
                        )}
                    </div>

                    {isOtherProfile && (
                        <div className="flex gap-4 mb-8">
                            <button 
                                onClick={async () => {
                                    if (!currentUser || !user) return;
                                    if (isFollowing) {
                                        setLocalFollowersCount(prev => Math.max(0, prev - 1));
                                        setIsFollowing(false);
                                        await followService.unfollowUser(currentUser.id, user.id);
                                    } else {
                                        setLocalFollowersCount(prev => prev + 1);
                                        setIsFollowing(true);
                                        await followService.followUser(currentUser.id, user.id);
                                        // Refetch user to sync badges if threshold met
                                        const { data: updated } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                                        if (updated) onUpdateUser(authService.mapProfileToUser(updated, null));
                                    }
                                }}
                                className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl ${isFollowing ? 'bg-slate-100 text-slate-400' : 'bg-[#FF8C00] text-white'}`}
                            >
                                {isFollowing ? getT('unfollow', language) : getT('follow', language)}
                            </button>

                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-3 mb-10 relative z-10">
                        <div className="bg-slate-50 p-4 rounded-[2rem] flex flex-col items-center justify-center text-slate-800 border border-slate-100 shadow-xl shadow-slate-100/50">
                            <Zap size={18} className="mb-1 text-[#FFD700]" />
                            <span className="text-[32px] font-black leading-none">{stats.reputation || 0}</span>
                            <span className="text-[8px] font-black uppercase tracking-widest opacity-40">{getT('reputation', language)}</span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-[2rem] flex flex-col items-center justify-center text-slate-800 border border-slate-100 shadow-xl shadow-slate-100/50">
                            <Activity size={18} className="mb-1 text-cyan-500" />
                            <span className="text-[32px] font-black leading-none">{stats.activities || 0}</span>
                            <span className="text-[8px] font-black uppercase tracking-widest opacity-40">{getT('activities', language)}</span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-[2rem] flex flex-col items-center justify-center text-slate-800 border border-slate-100 shadow-xl shadow-slate-100/50">
                            <Heart size={18} className="mb-1 text-rose-500" />
                            <span className="text-[32px] font-black leading-none">{stats.impact || 0}</span>
                            <span className="text-[8px] font-black uppercase tracking-widest opacity-40">{getT('impact', language)}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-8 relative z-10">
                         <div className="bg-slate-50 p-4 rounded-[2rem] flex flex-col items-center justify-center text-slate-800 border border-slate-100 shadow-xl shadow-slate-100/50">
                            <Users size={18} className="mb-1 text-blue-500" />
                            <span className="font-black text-sm tracking-tight">{localFollowersCount}</span>
                            <span className="text-[8px] font-black uppercase tracking-widest opacity-40">{t_func('profile_followers')}</span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-[2rem] flex flex-col items-center justify-center text-slate-800 border border-slate-100 shadow-xl shadow-slate-100/50">
                            <CheckCircle2 size={18} className="mb-1 text-emerald-500" />
                            <span className="font-black text-sm tracking-tight">{user?.verifiedPostsCount || 0}</span>
                            <span className="text-[8px] font-black uppercase tracking-widest opacity-40">{t_func('verified_posts_count')}</span>
                        </div>
                    </div>
                </div>

                <div className="flex border-b border-slate-100 sticky top-0 bg-white/95 backdrop-blur-xl z-[20] w-full overflow-hidden">
                    <button onClick={() => setActiveTab('posts')} className={`flex-1 py-4 text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap text-center ${activeTab === 'posts' ? 'text-[#FF8C00] border-b-4 border-[#FF8C00] bg-slate-50' : 'text-slate-400 hover:bg-slate-50'}`}>{getT('tab_posts', language)}</button>
                    <button onClick={() => setActiveTab('badges')} className={`flex-1 py-4 text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap text-center ${activeTab === 'badges' ? 'text-[#FF8C00] border-b-4 border-[#FF8C00] bg-slate-50' : 'text-slate-400 hover:bg-slate-50'}`}>{getT('tab_badges', language)}</button>
                    <button onClick={() => setActiveTab('verified')} className={`flex-1 py-4 text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap text-center ${activeTab === 'verified' ? 'text-[#FF8C00] border-b-4 border-[#FF8C00] bg-slate-50' : 'text-slate-400 hover:bg-slate-50'}`}>{getT('tab_saved', language)}</button>
                </div>

                <div className="p-6">
                    {activeTab === 'badges' && (
                        <div className="grid grid-cols-3 gap-6 animate-in fade-in duration-500">
                            {getBadges(language).map(badge => {
                                const unlocked = (user?.badges?.includes(badge.id)) || (user?.badges?.includes(badge.name));
                                return (
                                    <div key={badge.id} className="flex flex-col items-center text-center group cursor-pointer" onClick={() => setSelectedBadge(badge)}>
                                        <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center mb-3 transition-all group-hover:scale-110 group-hover:rotate-3 border-2 shadow-sm ${
                                            unlocked 
                                                ? 'bg-orange-50 border-orange-200 shadow-orange-100' 
                                                : 'bg-slate-50 border-slate-100 opacity-40'
                                        }`}>
                                            <BadgeIcon icon={badge.icon} unlocked={unlocked} />
                                        </div>
                                        <h5 className={`text-[8px] font-black uppercase tracking-tight leading-tight ${unlocked ? 'text-slate-800' : 'text-slate-300'}`}>{badge.name}</h5>
                                        {unlocked && <span className="text-[6px] text-[#FF8C00] font-black uppercase tracking-wider mt-0.5">{t_func('profile_unlocked')}</span>}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'posts' && (
                        <div className="grid grid-cols-1 gap-4 animate-in fade-in duration-500">
                            {createdPosts.length > 0 ? createdPosts.map(post => (
                                <div key={post.id} className="p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-xl hover:border-[#FF8C00]/50 transition-all group flex items-start justify-between">
                                    <div onClick={() => onNavigateToPost(post.id)} className="flex-1 cursor-pointer">
                                        <span className="text-[8px] font-black bg-slate-50 text-slate-400 px-3 py-1 rounded-full uppercase tracking-widest mb-3 inline-block">{post.category}</span>
                                        <h4 className="font-bold text-slate-800 text-sm group-hover:text-[#FF8C00] leading-tight uppercase tracking-tight">{post.title}</h4>
                                    </div>
                                    {onDeletePost && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDeletePost(post.id); }}
                                            className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all ml-4 border border-red-100"
                                        >
                                            <Trash2 size={16} />
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
            {selectedBadge && (
                <div className="fixed inset-0 z-[10000] bg-slate-900/80 backdrop-blur-2xl flex items-center justify-center p-8 animate-in fade-in duration-300" onClick={() => setSelectedBadge(null)}>
                    <div className="bg-white border border-slate-100 rounded-[3.5rem] p-10 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-500" onClick={e => e.stopPropagation()}>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-24 h-24 bg-[#FF8C00] rounded-[2.5rem] flex items-center justify-center mb-8 shadow-xl">
                                <BadgeIcon icon={selectedBadge.icon} unlocked={true} />
                            </div>
                            <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-3">{selectedBadge.name}</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed mb-8">{selectedBadge.description}</p>
                            
                            <button 
                                onClick={() => setSelectedBadge(null)}
                                className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
                            >
                                FECHAR
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GamificationProfile;
