import React, { memo, useState } from 'react';
import { Flag, Handshake, Trash2, Reply, Sparkles } from 'lucide-react';
import { useToast } from './Toast';
import { Post, Comment } from '../types';
import { t } from '../utils/translations';
import { TranslatedText } from './TranslatedText';
import { communityService } from '../services/communityService';

interface CommentCardProps {
    comment: Comment;
    post: Post;
    language: string;
    likedComments: Set<string>;
    onOpenProfile: (data: any) => void;
    onReportComment: (postId: string, commentId: string, targetAuthorId?: string, content?: string) => void;
    onLikeComment: (postId: string, commentId: string) => void;
    onReplyComment: (postId: string, authorName: string, commentId: string) => void;
    onToggleTranslate: (id: string) => void;
    onDeleteComment?: (postId: string, commentId: string) => void;
    translatedPosts: Set<string>;
    isAdmin?: boolean;
    currentUserId?: string;
    depth?: number;
}

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

const CommentCard: React.FC<CommentCardProps> = ({ 
    comment, 
    post, 
    language, 
    likedComments, 
    onOpenProfile, 
    onReportComment, 
    onLikeComment, 
    onReplyComment, 
    onToggleTranslate, 
    onDeleteComment, 
    translatedPosts, 
    isAdmin, 
    currentUserId,
    depth = 0 
}) => {
    const { showToast } = useToast();
    const [isReporting, setIsReporting] = useState(false);
    return (
        <div className={`space-y-4 ${depth > 0 ? 'mt-4 ml-2 sm:ml-6 pl-2 sm:pl-4 border-l-2 border-white/10' : ''}`}>
            <div id={`comment-${comment.id}`} className="flex gap-3 items-start group/comment">
                <img 
                    src={comment.authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.authorName)}&background=1e293b&color=fff`} 
                    className="w-10 h-10 rounded-full border-2 border-white shadow-sm cursor-pointer hover:scale-110 transition-all shrink-0" 
                    onClick={() => onOpenProfile(comment)} 
                    alt="" 
                    referrerPolicy="no-referrer" 
                    loading="lazy" 
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.authorName)}&background=1e293b&color=fff`;
                    }}
                />
                <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between mb-1">
                            <span 
                                className="font-black text-[13px] uppercase tracking-tight cursor-pointer hover:text-mira-orange transition-colors"
                                onClick={() => onOpenProfile(comment)}
                            >
                                {comment.authorName}
                            </span>
                            <button 
                                onClick={() => {
                                    if (isReporting) return;
                                    setIsReporting(true);
                                    onReportComment(post.id, comment.id, comment.authorId, comment.content);
                                    setTimeout(() => setIsReporting(false), 2000);
                                }} 
                                className={`flex items-center justify-center w-9 h-9 rounded-xl border transition-all active:scale-95 shadow-sm ${isReporting ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-red-50 text-red-600 border-red-100/50 hover:bg-red-100'} group/report`}
                                title={t('comm_report', language)}
                            >
                                <Flag size={14} className={`${isReporting ? 'text-slate-300' : 'fill-red-200 group-hover/report:fill-red-500'} transition-colors`} />
                            </button>
                        </div>

                        <div className="text-[14px] leading-relaxed text-slate-900 font-medium bg-white p-5 rounded-[30px] rounded-tl-none border border-slate-50 shadow-sm break-words [overflow-wrap:anywhere] [word-break:break-word]">
                            {comment.content}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-5 mt-3 ml-1">
                            <span className="text-[9px] text-slate-300 font-black uppercase tracking-widest">{timeAgo(comment.timestamp)}</span>
                            
                            <button 
                                onClick={() => onLikeComment(post.id, comment.id)} 
                                className={`flex items-center gap-2 transition-all active:scale-125 ${(comment.isLikedByUser || likedComments?.has(comment.id)) ? 'text-mira-blue font-black' : 'text-slate-400 font-bold'}`}
                            >
                                <Handshake size={15} className={(comment.isLikedByUser || likedComments?.has(comment.id)) ? 'fill-mira-blue text-mira-blue' : ''} />
                                <span className="text-[10px]">{comment.likes > 0 ? comment.likes : ''}</span>
                            </button>

                            <button 
                                onClick={() => onReplyComment(post.id, comment.authorName || 'Membro', comment.id)} 
                                className="p-3 bg-white text-slate-300 rounded-2xl shadow-sm border border-slate-50 hover:text-mira-blue active:scale-95 transition-all"
                                title={t('comm_reply_btn', language)}
                            >
                                <Reply size={15} />
                            </button>

                            {/* MIRA: Tradução de comentário removida por ordem da CEO */}

                            {(isAdmin || comment.authorId === currentUserId || post.authorId === currentUserId) && onDeleteComment && (
                                <button 
                                    onClick={() => onDeleteComment(post.id, comment.id)}
                                    className="p-2.5 bg-red-50 text-red-500 rounded-2xl shadow-sm border border-red-100 hover:bg-red-500 hover:text-white transition-all active:scale-95"
                                    title="ELIMINAR"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Recursive replies support */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="space-y-4">
                    {comment.replies.map((reply: any) => (
                        <CommentCard 
                            key={reply.id} 
                            comment={reply} 
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
                            currentUserId={currentUserId}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default memo(CommentCard);
