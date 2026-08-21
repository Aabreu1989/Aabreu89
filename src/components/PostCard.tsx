import React, { memo, useState, useMemo, useEffect } from 'react';
import {
    Handshake, MessageCircle, MoreHorizontal, Bookmark,
    Trash2, AlertCircle, Sparkles, CheckCircle, XCircle, Reply,
    Share2, Loader2, Flag, Star, ShieldAlert, Shield, X,
    Medal, MapPin, Heart, ShieldCheck, UserPlus, UserMinus, Globe, AlertTriangle
} from 'lucide-react';
import { Post, User, Comment, ValidationStatus } from '../types';
import { t } from '../utils/translations';
import { TranslatedText } from './TranslatedText';
import { getImageUrl, getPostBackgroundImage } from '../utils/imageUtils';
import { getCategoryKey } from '../utils/categoryUtils';
import { HandsHeartIcon } from './HandsHeartIcon';
import CommentCard from './CommentCard';
import { useToast } from './Toast';
import { authService } from '../services/authService';
import { communityService } from '../services/communityService';
import { supabase } from '../lib/supabase';

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
    onReport: (postId: string, targetAuthorId?: string, content?: string) => void;
    onDelete: (postId: string) => void;
    onDeleteAccount?: () => void;
    onFollow?: (authorId: string) => void;
    onDeleteComment?: (postId: string, commentId: string) => void;
    onOpenProfile: (post: Post) => void;
    onToggleTranslate: (id: string) => void;
    onReplyComment: (postId: string, replyToName: string, commentId: string) => void;
    onLikeComment: (postId: string, commentId: string) => void;
    onReportComment: (postId: string, commentId: string, targetAuthorId?: string, content?: string) => void;
    isAdmin?: boolean;
    onTranslationGenerated?: (translated: string) => void;
}

const PostCardComponent: React.FC<PostCardProps> = ({
    post, user, language, isPostLiked, isPostSaved, userVote, translatedPosts, likedComments,
    onLike, onComment, onToggleSave, onFactVote, onReport, onDelete, onDeleteAccount,
    onFollow, onDeleteComment, onOpenProfile, onToggleTranslate, onReplyComment, 
    onLikeComment, onReportComment, isAdmin, onTranslationGenerated
}) => {
    const { showToast } = useToast();
    const [openMenu, setOpenMenu] = useState(false);
    
    const [localLiked, setLocalLiked] = useState(isPostLiked);
    const [localLikeCount, setLocalLikeCount] = useState(post.likes);
    const [localUsefulCount, setLocalUsefulCount] = useState(post.usefulVotes);
    const [localFakeCount, setLocalFakeCount] = useState(post.fakeVotes);
    const [localSaved, setLocalSaved] = useState(isPostSaved);
    const [localVote, setLocalVote] = useState(userVote);
    const [isFollowing, setIsFollowing] = useState(post.isFollowing || false);
    const [isAnimating, setIsAnimating] = useState<string | null>(null);

    useEffect(() => { setLocalLiked(isPostLiked); }, [isPostLiked]);
    useEffect(() => { setLocalLikeCount(post.likes); }, [post.likes]);
    useEffect(() => { setLocalUsefulCount(post.usefulVotes); }, [post.usefulVotes]);
    useEffect(() => { setLocalFakeCount(post.fakeVotes); }, [post.fakeVotes]);
    useEffect(() => { setLocalSaved(isPostSaved); }, [isPostSaved]);
    useEffect(() => { setLocalVote(userVote); }, [userVote]);
    useEffect(() => { setIsFollowing(post.isFollowing || false); }, [post.isFollowing]);

    const handleOptimisticLike = () => {
        setIsAnimating('like');
        // 🧪 SOLDADURA OTIMISTA: Inversão instantânea do estado local
        const newLiked = !localLiked;
        setLocalLiked(newLiked);
        setLocalLikeCount(prev => newLiked ? prev + 1 : Math.max(0, prev - 1));
        
        // 🛡️ MIRA SOBERANIA: Toggle real baseado no estado atual da CommunityView
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
        const isTrue = vote === 'true';
        const alreadyVotedAsThis = localVote === vote;
        
        // 🧪 SOLDADURA OTIMISTA CIRÚRGICA: Incrementar e decrementar o oposto instantaneamente
        if (isTrue) {
            setLocalUsefulCount(prev => alreadyVotedAsThis ? Math.max(0, (prev || 0) - 1) : (prev || 0) + 1);
            if (!alreadyVotedAsThis && localVote === 'false') {
                setLocalFakeCount(prev => Math.max(0, (prev || 0) - 1));
            }
        } else {
            setLocalFakeCount(prev => alreadyVotedAsThis ? Math.max(0, (prev || 0) - 1) : (prev || 0) + 1);
            if (!alreadyVotedAsThis && localVote === 'true') {
                setLocalUsefulCount(prev => Math.max(0, (prev || 0) - 1));
            }
        }

        setLocalVote(alreadyVotedAsThis ? undefined : vote);
        onFactVote(post.id, isTrue);
        setTimeout(() => setIsAnimating(null), 400);
    };
    


    const commentTree = useMemo(() => {
        const map = new Map<string, any>();
        const roots: any[] = [];
        const comments = post.comments || [];
        comments.forEach(c => map.set(c.id, { ...c, replies: [] }));
        comments.forEach(c => {
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
        <div id={`post-${post.id}`} className="bg-white rounded-[2rem] sm:rounded-[3rem] overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-slate-50 group transition-all hover:shadow-[0_30px_70px_rgba(0,0,0,0.12)] hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-6 duration-700 mb-8 sm:mb-12 relative mx-1 sm:mx-0">

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

            {/* Instagram-style Header */}
            <div className="px-4 sm:px-6 py-4 flex items-center justify-between border-b border-slate-50">
                <div onClick={() => onOpenProfile(post)} className="flex items-center gap-3 cursor-pointer group/author active:scale-98">
                    <div className="p-[2px] bg-gradient-to-tr from-[#f97316] via-[#facc15] to-[#3b82f6] rounded-full shadow-sm relative shrink-0">
                        <img 
                            src={post.authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.authorName)}&background=f97316&color=fff`} 
                            className="w-10 h-10 rounded-full border-2 border-white object-cover" 
                            alt="" 
                            referrerPolicy="no-referrer" 
                            loading="lazy" 
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(post.authorName)}&background=f97316&color=fff`;
                            }}
                        />
                        {post.isAima && <ShieldCheck size={14} className="absolute -top-1 -right-1 text-orange-500 fill-white drop-shadow-md" />}
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                            <span className="text-xs sm:text-sm font-black text-slate-900 tracking-tight flex items-center gap-1">
                                {post.authorName}
                                {post.authorIsVerified && <CheckCircle size={12} className="text-mira-blue fill-mira-blue shrink-0" />}
                            </span>
                            {post.isVerified && (
                                <span className="bg-emerald-500 text-white p-0.5 rounded-full animate-pulse" title="Post Verificado">
                                    <ShieldCheck size={10} />
                                </span>
                            )}
                        </div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mt-0.5">
                            {t(getCategoryKey(post.category), language)}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {!isAuthor && onFollow && (
                        <button 
                            onClick={async (e) => {
                                e.stopPropagation();
                                setIsFollowing(!isFollowing);
                                if (onFollow) {
                                    onFollow(post.authorId);
                                }
                            }}
                            className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 shrink-0 ${
                                isFollowing 
                                ? 'bg-slate-100 text-slate-600 border border-slate-200' 
                                : 'bg-mira-blue/10 text-mira-blue border border-mira-blue/20 hover:bg-mira-blue/25'
                            }`}
                        >
                            {isFollowing ? <UserMinus size={10} /> : <UserPlus size={10} />}
                            <span>
                                {isFollowing ? (t('profile_following_status', language)) : (t('follow', language))}
                            </span>
                        </button>
                    )}

                    <div className="relative">
                        <button onClick={() => setOpenMenu(!openMenu)} className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 hover:bg-slate-100 active:scale-90 transition-all">
                            <MoreHorizontal size={16} className="text-slate-600" />
                        </button>
                        {openMenu && (
                            <div className="absolute right-0 top-9 bg-[#1A1A1A] rounded-2xl shadow-2xl overflow-hidden z-50 min-w-[190px] border border-white/10 animate-in zoom-in-95 duration-200">
                                {canDelete && (
                                    <button onClick={() => { setOpenMenu(false); onDelete(post.id); }} className="w-full flex items-center gap-3 px-5 py-4 text-red-500 font-extrabold text-xs uppercase tracking-wider hover:bg-white/5 transition-all text-left" id="COMM_DELETE_POST">
                                        <Trash2 size={16} /> {t('comm_delete_post_btn', language)}
                                    </button>
                                )}
                                 {!isAuthor && (
                                    <button 
                                        onClick={() => {
                                            setOpenMenu(false);
                                            onReport(post.id, post.authorId, post.content);
                                         }} 
                                        className="w-full flex items-center gap-3 px-5 py-4 text-red-400 font-extrabold text-xs uppercase tracking-wider hover:bg-white/5 transition-all text-left"
                                    >
                                        <AlertTriangle size={16} /> {t('comm_report_btn', language)}
                                    </button>
                                )}
                                {isAdmin && (
                                    <button 
                                        onClick={async () => {
                                            setOpenMenu(false);
                                            try {
                                                const { error } = await supabase.rpc('verify_post', { p_post_id: post.id, p_is_verified: !post.isVerified });
                                                if (error) throw error;
                                                showToast(post.isVerified ? t('toast_post_unverified', language) : t('toast_post_verified', language), "success");
                                            } catch (e) {
                                                console.error(e);
                                                showToast(t('toast_verify_error', language), "error");
                                            }
                                        }}
                                        className={`w-full flex items-center gap-3 px-5 py-4 ${post.isVerified ? 'text-emerald-500' : 'text-emerald-400'} font-extrabold text-xs uppercase tracking-wider hover:bg-white/5 transition-all text-left`}
                                    >
                                        <CheckCircle size={16} className={post.isVerified ? 'fill-emerald-500 text-white' : ''} /> 
                                        {post.isVerified ? t('comm_unverify_btn', language) : t('comm_verify_btn', language)}
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
                                        <Trash2 size={16} /> {t('comm_delete_account_btn', language)}
                                    </button>
                                )}
                                <button onClick={() => setOpenMenu(false)} className="w-full text-center px-5 py-3 text-white/40 font-bold text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all">{t('comm_cancel_btn', language)}</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Post Image & Content Container */}
            <div className="relative w-full aspect-square sm:aspect-[4/5] overflow-hidden group/img">
                <img 
                    src={getPostBackgroundImage(post.backgroundImage, post.id)} 
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

                <div className="absolute inset-0 z-10 flex items-center justify-center px-4 sm:px-6">
                    <div className="bg-white/95 backdrop-blur-2xl p-5 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border border-white/50 shadow-2xl w-[90%] sm:max-w-[460px] text-center max-h-[90%] flex flex-col justify-center transform transition-all duration-500 group-hover/img:scale-105 group-hover/img:shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                        <div className="overflow-y-auto no-scrollbar py-2 space-y-4 max-h-full">
                            <p className={`font-black text-slate-900 leading-[1.1] tracking-tight break-words italic ${fontSizeClass}`}>
                                <TranslatedText 
                                    text={post.content} 
                                    language={language} 
                                    shouldTranslate={translatedPosts.has(post.id)}
                                    translations={post.translations}
                                    onTranslationGenerated={(translated) => {
                                        communityService.updateTranslation(post.id, 'post', language, translated);
                                        if (onTranslationGenerated) {
                                            onTranslationGenerated(translated);
                                        }
                                    }}
                                />
                            </p>
                        </div>
                    </div>
                </div>

                {/* MIRA: Botão de tradução reativado usando o Gemini */}
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleTranslate(post.id);
                    }} 
                    className={`absolute bottom-6 right-6 z-20 w-10 h-10 rounded-full flex items-center justify-center border transition-all shadow-lg active:scale-95 ${
                        translatedPosts.has(post.id)
                        ? 'bg-orange-500 border-orange-500 text-white shadow-orange-500/30'
                        : 'bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/25'
                    }`}
                    title={translatedPosts.has(post.id) ? "Ver Original" : "Traduzir com IA"}
                >
                    <Globe size={18} />
                </button>
            </div>

            <div className="px-4 sm:px-6 py-2 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={() => handleOptimisticVote('true')} 
                        className={`py-3 rounded-2xl flex items-center justify-center gap-2 text-[8px] font-extrabold uppercase tracking-widest transition-all border-2 min-h-[44px] shadow-sm ${
                            localVote === 'true' 
                            ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/30 scale-105' 
                            : 'bg-white text-emerald-500 border-emerald-50 hover:bg-emerald-50'
                        } ${isAnimating === 'true' ? 'scale-125' : ''}`}
                    >
                        <CheckCircle size={12} className={`shrink-0 ${localVote === 'true' ? 'fill-white text-emerald-500' : ''}`} /> 
                        <span className="truncate">{t('comm_fact_true', language)} ({localUsefulCount || 0})</span>
                    </button>
                    <button 
                        onClick={() => handleOptimisticVote('false')} 
                        className={`py-3 rounded-2xl flex items-center justify-center gap-2 text-[8px] font-extrabold uppercase tracking-widest transition-all border-2 min-h-[44px] shadow-sm ${
                            localVote === 'false' 
                            ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/30 scale-105' 
                            : 'bg-white text-red-500 border-red-50 hover:bg-red-50'
                        } ${isAnimating === 'false' ? 'scale-125' : ''}`}
                    >
                        <XCircle size={12} className={`shrink-0 ${localVote === 'false' ? 'fill-white text-red-500' : ''}`} /> 
                        <span className="truncate">{t('comm_fact_false', language)} ({localFakeCount || 0})</span>
                    </button>
                </div>

                <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 flex justify-around items-center bg-slate-50 p-2 rounded-3xl border border-slate-100">
                        <button onClick={handleOptimisticLike} title="Apoiar" className="flex flex-col items-center gap-1 group transition-all active:scale-90">
                            <div className={`p-2.5 rounded-2xl transition-all ${
                                localLiked 
                                ? 'bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] scale-110' 
                                : 'bg-white text-slate-300 shadow-sm border border-slate-50 hover:border-red-200'
                            } ${isAnimating === 'like' ? 'animate-bounce' : ''}`}>
                                <HandsHeartIcon size={18} fill={localLiked ? 'currentColor' : 'none'} className={localLiked ? 'text-white' : 'text-slate-300 group-hover:text-red-400'} />
                            </div>
                            <span className={`text-[7px] font-extrabold uppercase tracking-tighter ${localLiked ? 'text-red-500' : 'text-slate-500'}`}>{localLikeCount}</span>
                        </button>

                        <button onClick={() => onComment(post.id)} className="flex flex-col items-center gap-1 group active:scale-90 transition-all">
                            <div className="p-2.5 bg-white text-slate-300 rounded-2xl shadow-sm border border-slate-50">
                                <MessageCircle size={18} />
                            </div>
                            <span className="text-[7px] font-extrabold text-slate-500 uppercase tracking-tighter">{(post.comments || []).length}</span>
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
                                ? 'bg-blue-600 text-white border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.5)] scale-110' 
                                : 'bg-white text-slate-300 border-slate-100 hover:border-blue-200 shadow-sm'
                            } ${isAnimating === 'save' ? 'animate-pulse' : ''}`}>
                                <Bookmark size={18} fill={localSaved ? 'currentColor' : 'none'} className={localSaved ? 'text-white' : 'text-slate-300 group-hover:text-blue-400'} />
                            </div>
                            <span className={`text-[7px] font-extrabold uppercase tracking-tighter ${localSaved ? 'text-blue-600' : 'text-slate-500'}`}>
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
                                currentUserId={user.id}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export const PostCard = memo(PostCardComponent);
