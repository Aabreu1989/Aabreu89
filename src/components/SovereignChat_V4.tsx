import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Bot, Sparkles, Loader2, RefreshCw, AlertCircle, 
  MessageCircle, ShieldCheck, Heart, Zap, X, ChevronRight,
  User, Volume2, Globe, Brain
} from 'lucide-react';
import { generateAssistantResponseV45 } from '../services/geminiService';
import { MIRA_PHOTO_URL } from '../constants';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
}

interface SovereignChatProps {
  user: any;
  onSendMessage?: (content: string) => Promise<string>;
  onClose?: () => void;
  isDark?: boolean;
  language?: string;
  onViewChange?: (view: any, params?: any) => void;
}

export const SovereignChat_V4: React.FC<SovereignChatProps> = ({ 
  user, 
  onSendMessage, 
  onClose,
  isDark = true,
  language = 'PT',
  onViewChange
}) => {
  // 🌍 Multilingual UI strings
  const lang = (language || 'PT').toUpperCase();
  const UI = {
    PT: { welcome: `Olá ${user?.name?.split(' ')[0] || 'amigo'}! 👋 Sou a MIRA, a tua guia em Portugal. Pergunta-me o que precisares sobre NIF, residência, AIMA, SNS, emprego ou qualquer dúvida da vida em Portugal!`, typing: 'MIRA está a pensar...', placeholder: 'Pergunta à MIRA...', error: 'Ligação interrompida. Tente novamente. ⚠️', protection: 'Proteção Ativa' },
    EN: { welcome: `Hello ${user?.name?.split(' ')[0] || 'there'}! 👋 I'm MIRA, your guide in Portugal. Ask me anything about NIF, residency, AIMA, health, jobs or daily life in Portugal!`, typing: 'MIRA is thinking...', placeholder: 'Ask MIRA anything...', error: 'Connection lost. Please try again. ⚠️', protection: 'Active Protection' },
    FR: { welcome: `Bonjour ${user?.name?.split(' ')[0] || ''} ! 👋 Je suis MIRA, votre guide au Portugal. Posez-moi vos questions sur le NIF, la résidence, l'AIMA, la santé, l'emploi ou la vie quotidienne au Portugal !`, typing: 'MIRA réfléchit...', placeholder: 'Posez votre question à MIRA...', error: 'Connexion perdue. Veuillez réessayer. ⚠️', protection: 'Protection Active' },
    ES: { welcome: `¡Hola ${user?.name?.split(' ')[0] || ''} ! 👋 Soy MIRA, tu guía en Portugal. ¿Te ayudo con el NIF, la residencia, AIMA, salud, empleo o la vida diaria en Portugal?`, typing: 'MIRA está pensando...', placeholder: 'Pregunta a MIRA...', error: 'Conexión interrumpida. Intenta de nuevo. ⚠️', protection: 'Protección Activa' }
  };
  const T = UI[lang as keyof typeof UI] || UI['PT'];

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: T.welcome,
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
        if (onSendMessage) {
          return await onSendMessage(userMessage.content);
        } else {
          // 🛡️ [MIRA GOLD]: Fallback for internal processing
          const history = messages.map(m => ({
            role: m.role === 'assistant' ? 'model' as const : 'user' as const,
            parts: [{ text: m.content }]
          }));
          const result = await generateAssistantResponseV45(userMessage.content, history, "MIRA ONLINE", language.toUpperCase());
          return result.text || "Desculpe, não consegui processar sua mensagem agora.";
        }
      } catch (err) {
        if (count < 4) {
          setRetryCount(count + 1);
          setChatStatus('retrying');
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
        content: T.error,
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
    <div className={`flex flex-col h-full w-full transition-all duration-500 overflow-hidden ${isDark ? 'bg-[#0A0A0A]' : 'bg-white'} backdrop-blur-3xl rounded-[2.5rem] border border-white/5 shadow-2xl relative`}>

      {/* 💎 PREMIUM HEADER */}
      <div className="p-6 pb-4 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-blue-500/10 to-transparent">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 border border-white/10 overflow-hidden">
              <img src={MIRA_PHOTO_URL} alt="MIRA" className="w-full h-full object-cover" />
            </div>
            <div className={`absolute -right-1 -bottom-1 w-4 h-4 rounded-full border-2 border-black ${chatStatus === 'error' ? 'bg-red-500' : 'bg-emerald-500 shadow-lg shadow-emerald-500/50'}`} />
          </div>
          <div>
            <h3 className="text-white font-black uppercase tracking-tighter text-sm flex items-center gap-2">
              MIRA SOBERANO <Sparkles size={12} className="text-[#001F3F]" />
            </h3>
            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest flex items-center gap-1.5">
              {chatStatus === 'retrying' ? (
                <span className="text-[#001F3F] animate-pulse flex items-center gap-1">
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
              <div 
                className="w-8 h-8 rounded-lg bg-white flex items-center justify-center mr-3 mt-1 shrink-0 border border-white/10 overflow-hidden"
              >
                <img 
                  src={MIRA_PHOTO_URL} 
                  alt="MIRA" 
                  className="w-full h-full object-cover" 
                  onError={(e) => { e.currentTarget.src = '/mira-robot.png'; }}
                />
              </div>
            )}
            <div className={`max-w-[85%] p-4 rounded-2xl text-[13px] leading-relaxed font-medium shadow-sm ${
              m.role === 'user' 
                ? 'bg-[#001F3F] text-white rounded-tr-none' 
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
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center mr-3 shrink-0 border border-white/10 overflow-hidden">
               <img 
                 src={MIRA_PHOTO_URL} 
                 alt="MIRA" 
                 className="w-full h-full object-cover animate-pulse" 
                 onError={(e) => { e.currentTarget.src = '/mira-robot.png'; }}
               />
            </div>
            <div className="bg-white/5 p-4 rounded-2xl flex items-center gap-2 border border-white/10">
              <Loader2 size={12} className="animate-spin text-[#001F3F]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{T.typing}</span>
            </div>
          </div>
        )}
      </div>

      {/* ⌨️ INPUT AREA */}
      <div className="p-6 bg-black/50 border-t border-white/5">
        <div className="relative group">
          <input 
            type="text" 
            placeholder={T.placeholder} 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isTyping}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-6 pr-14 py-4 text-xs font-bold text-white placeholder:text-white/20 outline-none focus:border-[#001F3F]/50 transition-all group-hover:border-white/20"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-[#001F3F] text-white rounded-xl shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 transition-all"
          >
            <Send size={16} />
          </button>
        </div>
        <div className="mt-4 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <Brain size={12} className="text-[#001F3F]" />
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
