import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Bot, Sparkles, Loader2, RefreshCw, AlertCircle, 
  MessageCircle, ShieldCheck, Heart, Zap, X, ChevronRight,
  User, Volume2, Globe, Brain
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
}

interface SovereignChatProps {
  user: any;
  onSendMessage: (content: string) => Promise<string>;
  onClose?: () => void;
  isDark?: boolean;
}

export const SovereignChat_V4: React.FC<SovereignChatProps> = ({ 
  user, 
  onSendMessage, 
  onClose,
  isDark = true 
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Olá ${user?.name || 'membro da Tribo'}! Eu sou o MIRA, seu melhor amigo e guia em Portugal. Como posso te proteger hoje? 🛡️`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [chatStatus, setChatStatus] = useState<'idle' | 'linking' | 'retrying' | 'error'>('idle');
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      status: 'sent'
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    setChatStatus('linking');
    setRetryCount(0);

    const executeWithRetry = async (count: number): Promise<string> => {
      try {
        return await onSendMessage(userMessage.content);
      } catch (err) {
        if (count < 4) {
          setRetryCount(count + 1);
          setChatStatus('retrying');
          // Exponential backoff: 1s, 2s, 4s, 8s
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, count) * 1000));
          return executeWithRetry(count + 1);
        }
        throw err;
      }
    };

    try {
      const response = await executeWithRetry(0);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setChatStatus('idle');
    } catch (err) {
      setChatStatus('error');
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Desculpe, a conexão com o cérebro do MIRA falhou após 5 tentativas. Por favor, verifique sua internet ou tente novamente em instantes. ⚠️",
        timestamp: new Date(),
        status: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setRetryCount(0);
    }
  };

  return (
    <div className={`flex flex-col h-full max-h-[600px] w-full max-w-[450px] transition-all duration-500 overflow-hidden ${isDark ? 'bg-black/90' : 'bg-white'} backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-2xl relative`}>
      {/* 💎 PREMIUM HEADER */}
      <div className="p-6 pb-4 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-orange-500/10 to-transparent">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 bg-[#FF8C00] rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 group animate-pulse">
              <Bot size={24} className="text-white" />
            </div>
            <div className={`absolute -right-1 -bottom-1 w-4 h-4 rounded-full border-2 border-black ${chatStatus === 'error' ? 'bg-red-500' : 'bg-emerald-500 shadow-lg shadow-emerald-500/50'}`} />
          </div>
          <div>
            <h3 className="text-white font-black uppercase tracking-tighter text-sm flex items-center gap-2">
              MIRA SOBERANO <Sparkles size={12} className="text-[#FF8C00]" />
            </h3>
            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest flex items-center gap-1.5">
              {chatStatus === 'retrying' ? (
                <span className="text-[#FF8C00] animate-pulse flex items-center gap-1">
                  <RefreshCw size={8} className="animate-spin" /> Tentativa {retryCount + 1}/5
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <ShieldCheck size={10} className="text-emerald-500/50" /> Proteção Ativa
                </span>
              )}
            </p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-3 bg-white/5 rounded-xl text-white/40 hover:text-white transition-all">
            <X size={18} />
          </button>
        )}
      </div>

      {/* 💬 CHAT AREA */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            {m.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-[#FF8C00]/20 flex items-center justify-center mr-3 mt-1 shrink-0 border border-[#FF8C00]/10">
                <Bot size={14} className="text-[#FF8C00]" />
              </div>
            )}
            <div className={`max-w-[85%] p-4 rounded-2xl text-[13px] leading-relaxed font-medium shadow-sm ${
              m.role === 'user' 
                ? 'bg-[#FF8C00] text-white rounded-tr-none' 
                : m.status === 'error' 
                  ? 'bg-red-500/10 border border-red-500/20 text-red-500 rounded-tl-none'
                  : 'bg-white/5 text-white/90 border border-white/10 rounded-tl-none'
            }`}>
              {m.content}
              <div className={`text-[8px] mt-2 opacity-30 flex items-center justify-end gap-1 font-black uppercase ${m.role === 'user' ? 'text-white' : 'text-white'}`}>
                {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start animate-in fade-in duration-300">
            <div className="w-8 h-8 rounded-lg bg-[#FF8C00]/20 flex items-center justify-center mr-3 shrink-0 border border-[#FF8C00]/10">
              <Bot size={14} className="text-[#FF8C00] animate-bounce" />
            </div>
            <div className="bg-white/5 p-4 rounded-2xl flex items-center gap-2 border border-white/10">
              <Loader2 size={12} className="animate-spin text-[#FF8C00]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Processando...</span>
            </div>
          </div>
        )}
      </div>

      {/* ⌨️ INPUT AREA */}
      <div className="p-6 bg-black/50 border-t border-white/5">
        <div className="relative group">
          <input 
            type="text" 
            placeholder="Pergunte ao seu melhor amigo..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isTyping}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-6 pr-14 py-4 text-xs font-bold text-white placeholder:text-white/20 outline-none focus:border-[#FF8C00]/50 transition-all group-hover:border-white/20"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-[#FF8C00] text-white rounded-xl shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 transition-all"
          >
            <Send size={16} />
          </button>
        </div>
        <div className="mt-4 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <Brain size={12} className="text-[#FF8C00]" />
            <span className="text-[8px] font-black uppercase tracking-tighter text-white/20">768D RAG</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe size={12} className="text-blue-500" />
            <span className="text-[8px] font-black uppercase tracking-tighter text-white/20">Grounding ON</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={12} className="text-emerald-500" />
            <span className="text-[8px] font-black uppercase tracking-tighter text-white/20">Vault Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
