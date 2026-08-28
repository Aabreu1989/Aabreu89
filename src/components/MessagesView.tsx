import React, { useState, useEffect } from 'react';
import { User, ViewType } from '../types';
import { Search, MessageSquare, ChevronRight, UserPlus, Clock, ArrowLeft, Send } from 'lucide-react';
import { dmService } from '../services/dmService';
import { t } from '../utils/translations';

interface MessagesViewProps {
    user: User;
    language: string;
    onViewChange: (view: ViewType) => void;
    onSelectConversation?: (conversation: any) => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({ user, language, onViewChange, onSelectConversation }) => {
    const [conversations, setConversations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchConvs = async () => {
            const { data } = await dmService.getConversations(user.id);
            if (data) setConversations(data);
            setIsLoading(false);
        };
        fetchConvs();
    }, [user.id]);

    const filteredConvs = conversations.filter(c => 
        c.otherParticipant?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-white text-slate-800">
            {/* Header */}
            <div className="p-6 pb-2">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black uppercase tracking-tighter">{t('nav_bottom_messages', language)}</h2>
                    <div className="p-2 bg-slate-50 rounded-2xl text-[#FF8C00]">
                        <MessageSquare size={20} />
                    </div>
                </div>

                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#FF8C00] transition-colors" size={18} />
                    <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Pesquisar conversas..."
                        className="w-full bg-slate-50 border border-slate-100 pl-12 pr-4 py-4 rounded-[1.8rem] text-sm outline-none focus:border-[#FF8C00] transition-all"
                    />
                </div>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                        <div className="w-8 h-8 border-4 border-[#FF8C00] border-t-transparent rounded-full animate-spin mb-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sincronizando...</span>
                    </div>
                ) : filteredConvs.length > 0 ? (
                    filteredConvs.map((conv) => (
                        <div 
                            key={conv.id}
                            onClick={() => onSelectConversation && onSelectConversation(conv)}
                            className="bg-white p-5 rounded-[2.5rem] border border-slate-100 shadow-xl hover:border-[#FF8C00]/30 transition-all cursor-pointer group flex items-center gap-4 active:scale-98"
                        >
                            <div className="relative">
                                <img 
                                    src={conv.otherParticipant?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=mira'} 
                                    alt="" 
                                    className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md"
                                />
                                {conv.otherParticipant?.onlineStatus === 'online' && (
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
                                )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-black text-slate-800 text-sm truncate uppercase tracking-tight">
                                        {conv.otherParticipant?.name || 'Membro MIRA'}
                                    </h4>
                                    <span className="text-[9px] font-black text-slate-300 uppercase shrink-0">
                                        {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold truncate uppercase tracking-widest opacity-60">
                                    {conv.lastMessage || 'Toca para conversar...'}
                                </p>
                            </div>
                            
                            <ChevronRight size={18} className="text-slate-100 group-hover:text-[#FF8C00] transition-colors" />
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-10">
                        <div className="p-8 bg-slate-50 rounded-[3rem] text-slate-200 mb-6">
                            <MessageSquare size={48} />
                        </div>
                        <h4 className="font-black text-slate-800 uppercase tracking-tighter mb-2">Nenhuma conversa</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                            Clica num perfil na comunidade para iniciar uma conversa privada e profissional.
                        </p>
                    </div>
                )}
            </div>
            
            <div className="p-6 pt-0">
                <button 
                    onClick={() => onViewChange(ViewType.COMMUNITY)}
                    className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                    <UserPlus size={16} /> ENCONTRAR PESSOAS
                </button>
            </div>
        </div>
    );
};
