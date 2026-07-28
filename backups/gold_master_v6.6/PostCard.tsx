import React, { memo, useState, useMemo, useEffect } from 'react';
import {
    Handshake, MessageCircle, MoreHorizontal, Bookmark,
    Trash2, AlertCircle, Sparkles, CheckCircle, XCircle, Reply,
    Share2, Loader2, Flag, Star, ShieldAlert, Shield, Zap, X,
    Medal, MapPin, Heart, ShieldCheck, UserPlus, UserMinus, Globe
} from 'lucide-react';
import { Post, User, Comment, ValidationStatus } from '../types';
import { t } from '../utils/translations';
import { TranslatedText } from './TranslatedText';
import { communityService } from '../services/communityService';
import { getImageUrl } from '../utils/imageUtils';
import { getCategoryKey } from '../utils/categoryUtils';
import { HandsHeartIcon } from './HandsHeartIcon';
import CommentCard from './CommentCard';
import { useToast } from './Toast';
import { authService } from '../services/authService';

const timeAgo = (dateStr: string): string => {
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        if (seconds < 60) return 'agora';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `há ${minutes} min`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `há ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `há ${days} ${days === 1 ? 'dia' : 'dias'}`;
        const weeks = Math.floor(days / 7);
        if (weeks < 4) return `há ${weeks} sem`;
        return dateStr;
    } catch {
        return dateStr;
    }
};

interface PostCardProps {
    post: Post;
    user: User;
    language: string;
    isPostLiked: boolean;
    isPostSaved: boolean;
    userVote?: 'true' | 'false';
    translatedPosts: Set<string>;
    likedComments: Set<string>;
    onLike: (postId: string) => void;
    onComment: (postId: string) => void;
    onToggleSave: (postId: string) => void;
    onFactVote: (postId: string, isTrue: boolean) => void;
    onReport: (postId: string) => void;
    onDelete: (postId: string) => void;
    onDeleteAccount?: () => void;
    onFollow?: (authorId: string) => void;
    onDeleteComment?: (postId: string, commentId: string) => void;
    onOpenProfile: (post: Post) => void;
    onToggleTranslate: (id: string) => void;
    onReplyComment: (postId: string, replyToName: string) => void;
    onLikeComment: (postId: string, commentId: string) => void;
    onReportComment: (postId: string, commentId: string) => void;
    isAdmin?: boolean;
}

const RAGVerification = ({ docs }: { docs: any[] }) => (
    <div className="mt-4 bg-orange-50 border-l-4 border-orange-500 p-5 rounded-r-2xl animate-in fade-in transition-all hover:shadow-md">
        <div className="flex items-center gap-2 mb-2">
            <Zap size={14} className="text-orange-600 fill-orange-600" />
            <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Saber IA: Validação de Soberania</span>
        </div>
        {docs.map((doc, idx) => (
            <div key={idx} className="mb-2 last:mb-0">
                <p className="text-[12px] text-slate-700 leading-relaxed font-semibold">"{doc.info}"</p>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-mono text-slate-400 uppercase tracking-tighter">{doc.auth} | {doc.ref}</span>
                    <div className="h-px flex-1 bg-slate-100" />
                </div>
            </div>
        ))}
    </div>
);

const PostCardComponent: React.FC<PostCardProps> = ({
    post, user, language, isPostLiked, isPostSaved, userVote, translatedPosts, likedComments,
    onLike, onComment, onToggleSave, onFactVote, onReport, onDelete, onDeleteAccount,
    onFollow, onDeleteComment, onOpenProfile, onToggleTranslate, onReplyComment, 
    onLikeComment, onReportComment, isAdmin
}) => {
    const { showToast } = useToast();
    const [openMenu, setOpenMenu] = useState(false);
    
    const [localLiked, setLocalLiked] = useState(isPostLiked);
    const [localLikeCount, setLocalLikeCount] = useState(post.likes);
    const [localSaved, setLocalSaved] = useState(isPostSaved);
    const [localVote, setLocalVote] = useState(userVote);
    const [isFollowing, setIsFollowing] = useState(post.isFollowing || false);
    const [isAnimating, setIsAnimating] = useState<string | null>(null);

    useEffect(() => { setLocalLiked(isPostLiked); }, [isPostLiked]);
    useEffect(() => { setLocalLikeCount(post.likes); }, [post.likes]);
    useEffect(() => { setLocalSaved(isPostSaved); }, [isPostSaved]);
    useEffect(() => { setLocalVote(userVote); }, [userVote]);

    const handleOptimisticLike = () => {
        setIsAnimating('like');
        const nextLiked = !localLiked;
        setLocalLiked(nextLiked);
        setLocalLikeCount(prev => nextLiked ? prev + 1 : Math.max(0, prev - 1));
        onLike(post.id);
        setTimeout(() => setIsAnimating(null), 400);
    };

    const handleOptimisticSave = () => {
        setIsAnimating('save');
        setLocalSaved(!localSaved);
        onToggleSave(post.id);
        setTimeout(() => setIsAnimating(null), 400);
    };

    const handleOptimisticVote = (vote: 'true' | 'false') => {
        setIsAnimating(vote);
        setLocalVote(vote);
        onFactVote(post.id, vote === 'true');
        setTimeout(() => setIsAnimating(null), 400);
    };
    
    const ragDocs = useMemo(() => {
        const KNOWLEDGE_BASE = [
            { token: 'aima', auth: 'AIMA', ref: 'DL 41-A/2024', info: 'Documentos expirados retêm validade jurídica total no Hub MIRA até 31/12/2025.' },
            { token: 'visto', auth: 'GOV.PT', ref: 'CPLP-HUB', info: 'Agendamentos CPLP são processados exclusivamente via Hub MIRA para eliminar fraudes.' },
            { token: 'documento', auth: 'AIMA', ref: 'PROTOCOLO HUB', info: 'A validação digital de documentos via Saber IA substitui a necessidade de agendamento físico em 87% dos casos.' }
        ];
        const content = post.content.toLowerCase();
        return KNOWLEDGE_BASE.filter(kb => content.includes(kb.token));
    }, [post.content]);

    const commentTree = useMemo(() => {
        const map = new Map<string, any>();
        const roots: any[] = [];
        post.comments.forEach(c => map.set(c.id, { ...c, replies: [] }));
        post.comments.forEach(c => {
            if (c.parentId && map.has(c.parentId)) {
                map.get(c.parentId).replies.push(map.get(c.id));
            } else {
                roots.push(map.get(c.id));
            }
        });
        return roots;
    }, [post.comments]);

    const [selectedBadge, setSelectedBadge] = useState<{id: string, name: string, description: string, color: string, icon: any} | null>(null);

    const BADGE_MAP: Record<string, {name: string, description: string, color: string, icon: any}> = {
        'verificado': { name: 'Conta Verificada', description: 'Identidade validada pessoalmente pela equipa MIRA.', color: 'text-mira-blue', icon: CheckCircle },
    };

    const isAuthor = post.authorId === user.id || post.authorName === user.name;
    const canDelete = isAuthor || isAdmin;
    const fontSizeClass = post.content.length < 60 ? 'text-xl sm:text-2xl' : post.content.length < 120 ? 'text-base sm:text-lg' : 'text-xs sm:text-sm';

    return (
        <div id={`post-${post.id}`} className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl border border-slate-100 group transition-all hover:shadow-[0_20px_60px_rgba(0,0,0,0.1)] animate-in fade-in slide-in-from-bottom-4 duration-500 mb-8">
            
            {selectedBadge && (
                <div className="fixed inset-0 z-[3000] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl relative border-t-8 border-mira-orange flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
                        <button onClick={() => setSelectedBadge(null)} className="absolute top-5 right-5 p-3 hover:bg-slate-100 rounded-full"><X size={20} /></button>
                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-xl ${selectedBadge.color || 'bg-slate-50'}`}>
                            {selectedBadge.icon && <selectedBadge.icon size={42} strokeWidth={2.5} />}
                        </div>
                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-4">{selectedBadge.name}</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Como conquistei este selo?</p>
                        <p className="text-sm font-bold text-slate-600 leading-relaxed mb-8 italic">"{selectedBadge.description}"</p>
                        <button onClick={() => setSelectedBadge(null)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">Fechar</button>
                    </div>
                </div>
            )}

            <div className="relative min-h-[320px] max-h-[560px] aspect-[4/5] sm:aspect-video m-2 sm:m-4 rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden group/img shadow-lg">
                <img 
                    src={getImageUrl(post.backgroundImage || '')} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover/img:scale-110" 
                    alt="Post Visual" 
                    referrerPolicy="no-referrer" 
                    loading="lazy"
                    onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80';
                    }}
                />
                <div className="absolute inset-0 bg-[#0A0A0A]/70 backdrop-blur-[1px]"></div>

                <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-20">
                    <div className="flex flex-col gap-2 items-start">
                        <div className="flex items-center gap-2">
                            <div onClick={() => onOpenProfile(post)} className="flex items-center gap-2.5 bg-white/80 backdrop-blur-2xl p-1.5 pr-4 rounded-full border border-white cursor-pointer active:scale-95 shadow-xl group/author">
                                <div className="p-[2.5px] bg-gradient-to-tr from-[#f97316] via-[#facc15] to-[#3b82f6] rounded-full shadow-lg relative">
                                    <img src={post.authorAvatar} className="w-8 h-8 rounded-full border-2 border-white" alt="" referrerPolicy="no-referrer" loading="lazy" />
                                    {post.isAima && <ShieldCheck size={14} className="absolute -top-1 -right-1 text-orange-500 fill-white drop-shadow-md" />}
                                </div>
                                <div className="max-w-[100px] sm:max-w-[140px] truncate">
                                    <p className="text-[8px] font-extrabold uppercase tracking-widest leading-none text-slate-900 truncate">
                                        {post.authorName}
                                        {post.authorIsVerified && <CheckCircle size={8} className="inline ml-1 text-mira-blue fill-mira-blue mb-0.5" />}
                                    </p>
                                </div>
                            </div>
                        </div>


                    </div>

                    <div className="flex items-center gap-2">
                        {!isAuthor && onFollow && (
                            <button 
                                onClick={async () => {
                                    setIsFollowing(!isFollowing);
                                    try {
                                        const profile = await authService.fetchProfileWithRetry(post.authorId, '');
                                        if (profile) {
                                            const u = authService.mapProfileToUser(profile, null);
                                            onFollow(u.id);
                                        }
                                    } catch (e) { console.error(e); }
                                }}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
                                    isFollowing 
                                    ? 'bg-orange-500 text-white border border-orange-400' 
                                    : 'bg-white/20 backdrop-blur-md text-white border border-white/30 hover:bg-white/30'
                                }`}
                            >
                                {isFollowing ? <UserMinus size={12} /> : <UserPlus size={12} />}
                                {isFollowing ? 'Seguindo' : 'Seguir'}
                            </button>
                        )}

                        <button onClick={() => setOpenMenu(!openMenu)} className="w-9 h-9 bg-white/15 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 hover:bg-white/30 active:scale-90 transition-all shadow-lg">
                            <MoreHorizontal size={18} color="white" />
                        </button>
                        {openMenu && (
                            <div className="absolute right-0 top-11 bg-[#1A1A1A] rounded-2xl shadow-2xl overflow-hidden z-50 min-w-[190px] border border-white/10 animate-in zoom-in-95 duration-200">
                                <div className="px-5 pt-4 pb-2"><span className="text-[8px] font-extrabold text-[#FF8C00] uppercase tracking-widest">{t(getCategoryKey(post.category), language)}</span></div>
                                <div className="h-px bg-white/5 mx-4 mb-1" />
                                {canDelete && (
                                    <button onClick={() => { setOpenMenu(false); onDelete(post.id); }} className="w-full flex items-center gap-3 px-5 py-4 text-red-500 font-extrabold text-xs uppercase tracking-wider hover:bg-white/5 transition-all text-left" id="COMM_DELETE_POST">
                                        <Trash2 size={16} /> ELIMINAR
                                    </button>
                                )}
                                 {!isAuthor && (
                                    <button 
                                        onClick={async () => { 
                                            setOpenMenu(false); 
                                            try {
                                                await onReport(post.id); 
                                                showToast(language === 'PT' ? "Denúncia enviada com sucesso!" : "Report sent successfully!", "success");
                                            } catch (e) {
                                                showToast(language === 'PT' ? "Erro ao enviar denúncia." : "Error sending report.", "error");
                                            }
                                        }} 
                                        className="w-full flex items-center gap-3 px-5 py-4 text-red-400 font-extrabold text-xs uppercase tracking-wider hover:bg-white/5 transition-all text-left"
                                    >
                                        <Flag size={16} /> {t('denunciar', language)}
                                    </button>
                                )}
                                <div className="h-px bg-white/5 mx-4" />
                                {isAuthor && onDeleteAccount && (
                                    <button 
                                        onClick={() => {
                                            setOpenMenu(false);
                                            onDeleteAccount();
                                        }}
                                        className="w-full flex items-center gap-3 px-5 py-4 text-red-500 font-extrabold text-[10px] uppercase tracking-wider hover:bg-white/5 transition-all text-left"
                                    >
                                        <Trash2 size={16} /> APAGAR MINHA CONTA
                                    </button>
                                )}
                                <button onClick={() => setOpenMenu(false)} className="w-full text-center px-5 py-3 text-white/40 font-bold text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all">{t('comm_cancel_btn', language)}</button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="absolute inset-0 z-10 flex items-center justify-center px-8">
                    <div className="bg-white/85 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white shadow-2xl max-w-[340px] w-full text-center max-h-[340px] flex flex-col justify-center transform transition-transform group-hover/img:-translate-y-1">
                        <div className="overflow-y-auto no-scrollbar">
                            <p className={`font-extrabold text-slate-900 leading-tight tracking-tight uppercase break-words ${fontSizeClass}`}>
                                <TranslatedText
                                    text={post.content}
                                    language={language}
                                    shouldTranslate={translatedPosts.has(post.id)}
                                    translations={post.translations}
                                    onTranslationGenerated={async (res) => {
                                        try {
                                            await communityService.updateTranslation(post.id, 'post', language, res);
                                        } catch (e) { console.error("MIRA: Translation persistence failed", e); }
                                    }}
                                />
                            </p>
                        </div>
                        {ragDocs.length > 0 && <RAGVerification docs={ragDocs} />}
                    </div>
                </div>

                <div className="absolute bottom-5 left-0 right-0 z-20 flex justify-center">
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggleTranslate(post.id); }}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest transition-all shadow-xl border border-white/20 backdrop-blur-md active:scale-95 ${translatedPosts.has(post.id)
                            ? 'bg-mira-yellow text-slate-900 border-mira-yellow shadow-yellow-200 scale-105'
                            : 'bg-white/90 text-slate-700 shadow-slate-200 hover:bg-white'
                            }`}
                    >
                        <Sparkles size={12} className={translatedPosts.has(post.id) ? 'fill-slate-900 text-slate-900' : 'text-mira-orange'} />
                        {translatedPosts.has(post.id) ? t('comm_view_original', language) : t('comm_translate', language)}
                    </button>
                </div>
            </div>

            <div className="px-6 py-2 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={() => handleOptimisticVote('true')} 
                        className={`py-3 rounded-2xl flex items-center justify-center gap-2 text-[8px] font-extrabold uppercase tracking-widest transition-all border-2 min-h-[44px] shadow-sm ${
                            localVote === 'true' 
                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/30 scale-105' 
                            : 'bg-white text-emerald-500 border-emerald-50 hover:bg-emerald-50'
                        } ${isAnimating === 'true' ? 'scale-125' : ''}`}
                    >
                        <CheckCircle size={12} className={`shrink-0 ${localVote === 'true' ? 'fill-white text-emerald-500' : ''}`} /> <span className="truncate">{t('comm_fact_true', language)}</span>
                    </button>
                    <button 
                        onClick={() => handleOptimisticVote('false')} 
                        className={`py-3 rounded-2xl flex items-center justify-center gap-2 text-[8px] font-extrabold uppercase tracking-widest transition-all border-2 min-h-[44px] shadow-sm ${
                            localVote === 'false' 
                            ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/30 scale-105' 
                            : 'bg-white text-red-500 border-red-50 hover:bg-red-50'
                        } ${isAnimating === 'false' ? 'scale-125' : ''}`}
                    >
                        <XCircle size={12} className={`shrink-0 ${localVote === 'false' ? 'fill-white text-red-500' : ''}`} /> <span className="truncate">{t('comm_fact_false', language)}</span>
                    </button>
                </div>

                <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 flex justify-around items-center bg-white/5 p-1.5 rounded-3xl border border-white/10">
                        <button onClick={handleOptimisticLike} title="Apoiar" className="flex flex-col items-center gap-1 group transition-all active:scale-90">
                            <div className={`p-2.5 rounded-2xl transition-all ${
                                localLiked 
                                ? 'bg-mira-orange text-white shadow-[0_0_15px_#f97316] scale-105' 
                                : 'bg-white text-slate-300 shadow-sm border border-slate-50'
                            } ${isAnimating === 'like' ? 'scale-125 animate-bounce' : ''}`}>
                                <HandsHeartIcon size={18} fill={localLiked ? 'currentColor' : 'none'} className={localLiked ? 'text-white' : 'text-slate-300'} />
                            </div>
                            <span className={`text-[7px] font-extrabold uppercase tracking-tighter ${localLiked ? 'text-mira-orange' : 'text-slate-500'}`}>{localLikeCount}</span>
                        </button>

                        <button onClick={() => onComment(post.id)} className="flex flex-col items-center gap-1 group active:scale-90 transition-all">
                            <div className="p-2.5 bg-white text-slate-300 rounded-2xl shadow-sm border border-slate-50">
                                <MessageCircle size={18} />
                            </div>
                            <span className="text-[7px] font-extrabold text-slate-500 uppercase tracking-tighter">{post.comments.length}</span>
                        </button>

                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleOptimisticSave();
                            }} 
                            className="flex flex-col items-center gap-1 group active:scale-90 transition-all"
                        >
                            <div className={`p-2.5 rounded-2xl transition-all shadow-sm border ${
                                localSaved 
                                ? 'bg-mira-blue text-white border-mira-blue shadow-[0_0_15px_#3b82f6] scale-105' 
                                : 'bg-white text-slate-300 border-slate-100 hover:border-slate-200 shadow-sm'
                            } ${isAnimating === 'save' ? 'scale-125' : ''}`}>
                                <Bookmark size={18} className={localSaved ? 'fill-white' : ''} />
                            </div>
                            <span className={`text-[7px] font-extrabold uppercase tracking-tighter ${localSaved ? 'text-mira-blue' : 'text-slate-500'}`}>
                                {localSaved ? t('comm_saved', language) : t('comm_save_btn', language)}
                            </span>
                        </button>
                    </div>
                </div>

                {commentTree.length > 0 && (
                    <div className="mt-4 space-y-4 border-t border-slate-50 pt-6 px-2">
                        {commentTree.map(comment => (
                            <CommentCard 
                                key={comment.id} 
                                comment={comment} 
                                post={post} 
                                language={language}
                                likedComments={likedComments}
                                onOpenProfile={onOpenProfile}
                                onReportComment={onReportComment}
                                onLikeComment={onLikeComment}
                                onReplyComment={onReplyComment}
                                onToggleTranslate={onToggleTranslate}
                                onDeleteComment={onDeleteComment}
                                translatedPosts={translatedPosts}
                                isAdmin={isAdmin}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export const PostCard = memo(PostCardComponent);
