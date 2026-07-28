import React, { useState, useEffect, useRef } from 'react';
import { User, Message } from '../types';
import { ArrowLeft, Send, MoreVertical, Shield, Clock, Bot } from 'lucide-react';
import { dmService } from '../services/dmService';
import { aiChatService } from '../services/aiChatService';
import { supabase } from '../lib/supabase';
import { MIRA_PHOTO_URL } from '../constants';
import { PromptEngine } from '../utils/PromptEngine';

interface ChatWindowProps {
    conversationId: string;
    currentUser: User;
    otherUser: any;
    onBack: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ conversationId, currentUser, otherUser, onBack }) => {
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isAiThinking, setIsAiThinking] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const isMiraChat = otherUser?.role === 'admin' && (otherUser?.name?.toLowerCase().includes('mira') || otherUser?.id === 'mira-ai');

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const fetchMessages = async () => {
            const { data } = await dmService.getMessages(conversationId);
            if (data) setMessages(data);
            setIsLoading(false);
            setTimeout(scrollToBottom, 100);
        };
        fetchMessages();

        // Real-time listener for new messages
        const channel = supabase
            .channel(`chat-${conversationId}`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'messages',
                filter: `conversation_id=eq.${conversationId}`
            }, (payload) => {
                setMessages(prev => [...prev, payload.new]);
                setTimeout(scrollToBottom, 50);
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [conversationId]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || isAiThinking) return;

        const content = newMessage.trim();
        setNewMessage('');
        
        // 1. Send user message via DM service (persists to DB)
        const { data: userMsg, error } = await dmService.sendMessage(conversationId, currentUser.id, content);
        if (error) {
            console.error('MIRA: Error sending message:', error);
            setNewMessage(content); 
            return;
        }

        // 2. 🛡️ [MIRA SNIPER v1.2]: Trigger Sovereign Intelligence if it's the MIRA Chat
        if (isMiraChat) {
            setIsAiThinking(true);
            try {
                const aiResponse = await aiChatService.askMira(content, messages);
                
                // Persist AI response as the MIRA bot
                await dmService.sendMessage(conversationId, otherUser.id, aiResponse.text);
                
                console.log("🎯 [MIRA BRAIN] Response version:", aiResponse.version);
            } catch (err) {
                console.error("❌ MIRA Brain Failure:", err);
            } finally {
                setIsAiThinking(false);
            }
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="bg-white p-6 pb-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-800 transition-all">
                        <ArrowLeft size={18} />
                    </button>
                    <div className="relative">
                        <img 
                            src={isMiraChat ? MIRA_PHOTO_URL : (otherUser?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=mira')} 
                            alt="" 
                            className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-md"
                        />
                        {otherUser?.onlineStatus === 'online' && (
                            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                        )}
                    </div>
                    <div>
                        <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight">{otherUser?.name || 'Membro MIRA'}</h4>
                        <div className="flex items-center gap-1.5">
                            <span className={`text-[8px] font-black uppercase tracking-widest ${otherUser?.onlineStatus === 'online' ? 'text-emerald-500' : 'text-slate-300'}`}>
                                {otherUser?.onlineStatus === 'online' ? 'Online' : 'Offline'}
                            </span>
                        </div>
                    </div>
                </div>
                <button className="p-3 text-slate-300 hover:text-slate-800 transition-all">
                    <MoreVertical size={20} />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col no-scrollbar bg-white/40">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full opacity-30">
                        <div className="w-8 h-8 border-4 border-[#FF8C00] border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : messages.length > 0 ? (
                    messages.map((msg) => {
                        const isMine = msg.sender_id === currentUser.id;
                        return (
                            <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[85%] ${isMine ? 'ml-auto' : ''}`}>
                                <div className={`p-5 rounded-[2.5rem] text-sm leading-relaxed shadow-lg ${
                                    isMine 
                                        ? 'bg-[#FF8C00] text-white rounded-tr-none shadow-orange-100' 
                                        : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none shadow-slate-200'
                                }`}>
                                    {msg.content}
                                </div>
                                <div className={`mt-2 flex items-center gap-2 text-[8px] font-black uppercase tracking-widest ${isMine ? 'text-[#FF8C00]/60' : 'text-slate-300'}`}>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    {isMine && <span className="opacity-50">Enviado</span>}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center px-10 opacity-30">
                        <Shield size={48} className="mb-4 text-slate-200" />
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">Início da conversa profissional e segura.</p>
                    </div>
                )}
                {isAiThinking && (
                    <div className="flex flex-col items-start max-w-[85%] animate-pulse">
                        <div className="p-5 rounded-[2.5rem] bg-white text-slate-400 border border-slate-100 rounded-tl-none shadow-sm flex items-center gap-3">
                            <img src={MIRA_PHOTO_URL} className="w-6 h-6 rounded-lg object-cover" alt="MIRA" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#FF8C00]">MIRA está a consultar a Soberania...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-6 bg-white border-t border-slate-100">
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                    <div className="flex-1 relative group">
                        <input 
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Escreve uma mensagem..."
                            className="w-full bg-slate-50 border border-slate-100 px-6 py-5 rounded-[2rem] text-sm outline-none focus:border-[#FF8C00] transition-all pr-14 font-medium"
                        />
                        <button 
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-4 bg-[#FF8C00] text-white rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all disabled:grayscale disabled:opacity-30 disabled:hover:scale-100"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </form>
                <div className="mt-4 flex items-center justify-center gap-2 opacity-30">
                    <Shield size={10} className="text-[#FF8C00]" />
                    <span className="text-[7px] font-black uppercase tracking-[0.3em] text-slate-400">Mensagens encriptadas e privadas</span>
                </div>
            </div>
        </div>
    );
};
