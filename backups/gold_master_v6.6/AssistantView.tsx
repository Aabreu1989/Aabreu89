import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Send, Volume2, VolumeX, Square, ThumbsUp, ThumbsDown, 
  ArrowLeft, CheckCheck, Trash2, Sparkles, X, 
  Briefcase, MapPin, GraduationCap, ArrowRight, Bot, ShieldCheck,
  Brain, Loader2, Shield
} from 'lucide-react';

import { generateAssistantResponseV45, generateSpeech } from '../services/geminiService';
import { audioService } from '../services/audioService';
import { Message, ViewType, User as UserType } from '../types';
import { supabase } from '../lib/supabase';
import { useToast } from './Toast';
import { t } from '../utils/translations';
import { persistence } from '../utils/persistence';
import ChatInput from './ChatInput';

interface AssistantViewProps {
  language: string;
  onViewChange: (view: ViewType, params?: any) => void;
  user: UserType;
}

const sanitizeTTS = (text: string) => {
  return text
    .replace(/\[.*?\]\(.*?\)/g, '') 
    .replace(/\*\*?|_|#|`|~|-/g, '') 
    .replace(/\[(job|course)-card:([a-f0-9-]+|[0-9]+)\]/g, '') 
    .replace(/[\n\r]+/g, ' ') 
    .trim();
};

const SUGGESTIONS = [
  "COMO TIRAR O NIF?",
  "O QUE É O ARTIGO 88?",
  "AGENDAMENTO AIMA 2026",
  "ATRIBUIÇÃO DE NISS"
];

const MiraChatHeader = ({ 
  language, 
  onBack, 
  audioEnabled, 
  onToggleAudio,
  onClearChat
}: { 
  language: string, 
  onBack: () => void, 
  audioEnabled: boolean,
  onToggleAudio: () => void,
  onClearChat: () => void
}) => {
    return (
        <div className="bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-3 sm:py-4 flex items-center justify-between z-[100] sticky top-0 shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all active:scale-95 text-slate-400 border border-slate-100">
                    <ArrowLeft size={18} />
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl p-0.5 shadow-md border border-slate-100 overflow-hidden">
                        <img src="/mira-robot.png" alt="MIRA" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 tracking-tighter uppercase leading-none">MIRA</h1>
                        <div className="flex items-center gap-1.5 mt-1 px-2 py-0.5 bg-emerald-50 rounded-full border border-emerald-100 w-fit">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[7px] font-black text-emerald-600 uppercase tracking-widest">ONLINE</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button 
                   onClick={onToggleAudio} 
                   className={`p-2.5 rounded-2xl transition-all shadow-sm border active:scale-90 ${audioEnabled ? 'bg-mira-orange text-white border-orange-400' : 'bg-slate-50 text-slate-300 border-slate-100'}`}
                >
                    {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
                <button 
                  onClick={onClearChat}
                  className="px-4 py-2.5 bg-red-50 text-red-500 border border-red-100 rounded-2xl transition-all hover:bg-red-500 hover:text-white active:scale-95 flex items-center gap-2 shadow-sm font-black text-[9px] uppercase tracking-widest"
                >
                  <Trash2 size={14} />
                  <span className="hidden sm:inline">ELIMINAR</span>
                </button>
            </div>
        </div>
    );
};

const LazyChatCard = React.memo(({ type, id, language, onViewChange }: any) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const table = type === 'job' ? 'job_posts' : 'courses';
        const { data: res } = await supabase.from(table).select('*').eq('id', id).single();
        if (res) setData(res);
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetchData();
  }, [type, id]);

  if (loading || !data) return null;

  return (
    <div className={`w-full p-5 rounded-[2rem] border mt-4 shadow-xl ${type === 'job' ? 'bg-white border-slate-100' : 'bg-slate-900 border-white/5 text-white'}`}>
       <div className="flex gap-4 items-start">
         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${type === 'job' ? 'bg-orange-50 text-mira-orange' : 'bg-white/10 text-indigo-400'}`}>
           {type === 'job' ? <Briefcase size={20} /> : <GraduationCap size={20} />}
         </div>
         <div className="flex-1">
           <h4 className={`font-bold text-sm ${type === 'job' ? 'text-slate-800' : 'text-white'}`}>{data.title}</h4>
           <p className={`text-[10px] mt-1 ${type === 'job' ? 'text-slate-400' : 'text-white/50'}`}>{type === 'job' ? data.company : data.description}</p>
         </div>
       </div>
       <button 
         onClick={() => onViewChange(type === 'job' ? ViewType.JOBS : ViewType.LEARNING, type === 'job' ? { jobId: id } : { courseId: id })}
         className={`w-full mt-4 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 ${type === 'job' ? 'bg-mira-orange text-white shadow-lg shadow-orange-500/20' : 'bg-indigo-600 text-white'}`}
       >
         {type === 'job' ? 'CANDIDATAR AGORA' : 'ACEDER AO CURSO'} <ArrowRight size={14} />
       </button>
    </div>
  );
});

const MiraChatMessage = React.memo(({ 
  msg, language, isPlaying, onAudioAction, onFeedback, onViewChange 
}: any) => {
  const isUser = msg.role === 'user';
  const cardMatch = msg.text.match(/\[(job|course)-card:([a-f0-9-]+|[0-9]+)\]/);
  const cleanText = msg.text.replace(/\[(job|course)-card:([a-f0-9-]+|[0-9]+)\]/g, '').trim();

  return (
    <div className={`flex w-full mb-8 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mr-3 mt-1 shrink-0 border border-blue-100">
          <Bot size={14} className="text-blue-600" />
        </div>
      )}
      <div className={`max-w-[85%] relative group transition-all duration-500 p-5 rounded-[2rem] shadow-xl
        ${isUser 
            ? 'bg-mira-orange text-white rounded-tr-none shadow-orange-500/10' 
            : 'bg-blue-600 text-white rounded-tl-none border-l-[4px] border-orange-400 shadow-blue-500/10'}`}>

          {!isUser && (
            <div className="flex items-center gap-3 mb-2">
               <div className="px-2 py-0.5 bg-white/10 rounded-md text-[7px] font-black uppercase tracking-[0.2em] text-white/60 border border-white/10 flex items-center gap-1.5">
                <Bot size={8} />
                MIRA ASSISTANT
               </div>
            </div>
          )}

          <div className="text-[14px] leading-relaxed font-bold select-text break-words">
            {cleanText}
          </div>

          {cardMatch && (
            <LazyChatCard type={cardMatch[1]} id={cardMatch[2]} language={language} onViewChange={onViewChange} />
          )}

          <div className="mt-4 flex items-center justify-between gap-2 opacity-50">
            <span className="text-[8px] font-black uppercase tracking-[0.2em]">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {!isUser && (
              <div className="flex items-center gap-3">
                 <button 
                  onClick={(e) => { e.stopPropagation(); onAudioAction(msg); }} 
                  title="Ouvir Resposta"
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md group/audio ${isPlaying === msg.id ? 'bg-white text-blue-600 animate-pulse' : 'bg-blue-600 text-white hover:bg-blue-700 border border-blue-500'}`}
                >
                  <Volume2 size={18} className="group-hover/audio:scale-110 transition-transform" />
                </button>
                <div className="flex items-center gap-1">
                    <button onClick={() => onFeedback(msg.id, 'helpful')} className="p-1.5 hover:text-emerald-400 transition-colors"><ThumbsUp size={14} /></button>
                    <button onClick={() => onFeedback(msg.id, 'not_helpful')} className="p-1.5 hover:text-red-400 transition-colors"><ThumbsDown size={14} /></button>
                </div>
              </div>
            )}
            {isUser && <CheckCheck size={14} />}
          </div>
      </div>
    </div>
  );
});

const AssistantView = ({ language, onViewChange, user }: AssistantViewProps) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const history = persistence.get('mira_chat_history');
    if (history && Array.isArray(history)) {
      setMessages(history.map(m => ({ ...m, timestamp: new Date(m.timestamp) })));
    } else {
      setMessages([{ 
        id: 'welcome', 
        role: 'assistant', 
        text: `Olá, ${user?.name || 'Membro da Tribo'}. Sou o MIRA! O que quer que estejas a enfrentar em Portugal, aqui tens apoio. Precisas de ajuda com documentos, trabalho ou integração? Farei o meu melhor para te guiar.`, 
        timestamp: new Date()
      }]);
    }
  }, [user]);

  useEffect(() => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleAudioAction = async (msg: any) => {
    if (isPlaying === msg.id) { audioService.stop(); setIsPlaying(null); return; }
    audioService.stop();
    setIsPlaying(msg.id);
    try {
      const ttsText = sanitizeTTS(msg.text);
      const audioBase64 = await generateSpeech(ttsText, language.toUpperCase());
      if (audioBase64) {
          audioService.playBase64(audioBase64, undefined, () => setIsPlaying(null));
      } else { setIsPlaying(null); }
    } catch (e) { setIsPlaying(null); }
  };

  const handleClearChat = React.useCallback(() => {
    if (window.confirm("Deseja apagar permanentemente o histórico de mensagens?")) {
      const welcomeMsg = { 
        id: 'welcome-' + Date.now(), 
        role: 'assistant', 
        text: `Olá, ${user?.name || 'Membro da Tribo'}. Sou o MIRA! O que quer que estejas a enfrentar em Portugal, aqui tens apoio. Precisas de ajuda com documentos, trabalho ou integração? Farei o meu melhor para te guiar.`,
        timestamp: new Date() 
      };
      
      setMessages([welcomeMsg]);
      persistence.delete('mira_chat_history');
      localStorage.removeItem('mira_chat_history');
      sessionStorage.removeItem('mira_chat_history');
      
      audioService.stop();
      setIsPlaying(null);
      showToast("Histórico limpo.", "success");
    }
  }, [user, showToast]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg = { id: Date.now().toString(), role: 'user', text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setIsTyping(true);
    
    try {
      const response = await generateAssistantResponseV45(text, messages.map(m => ({ 
        role: m.role === 'assistant' ? 'model' : 'user', 
        parts: [{ text: m.text }] 
      })), "MIRA ONLINE", language.toUpperCase());
      
      const assistantMsg = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        text: response.text || "Sem resposta...", 
        timestamp: new Date()
      };
      
      const newMessages = [...messages, userMsg, assistantMsg];
      setMessages(newMessages);
      persistence.set('mira_chat_history', newMessages);
    } catch (e) {
      showToast("Erro na ligação à MIRA.", "error");
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] relative overflow-hidden font-sans">
      {/* 🧩 IMPERIAL TEXTURE (Online Replica Grid) */}
      <div className="absolute inset-0 z-0 opacity-100 pointer-events-none" 
           style={{ 
             backgroundColor: '#ffffff',
             backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230066ff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2v-4h4v-2h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2v-4h4v-2H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
             backgroundAttachment: 'fixed'
           }} />

      <MiraChatHeader 
        language={language} 
        onBack={() => onViewChange(ViewType.HOME)} 
        audioEnabled={audioEnabled}
        onToggleAudio={() => setAudioEnabled(!audioEnabled)}
        onClearChat={handleClearChat}
      />

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-2 z-10">
        {messages.map(m => (
          <MiraChatMessage key={m.id} msg={m} language={language} isPlaying={isPlaying} onAudioAction={handleAudioAction} onFeedback={id => {}} onViewChange={onViewChange} />
        ))}
        {isTyping && (
            <div className="flex justify-start animate-in fade-in duration-300">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mr-3 shrink-0 border border-blue-100">
                    <Bot size={14} className="text-blue-600 animate-bounce" />
                </div>
                <div className="bg-white p-4 rounded-2xl flex items-center gap-2 border border-slate-100 shadow-sm">
                    <Loader2 size={12} className="animate-spin text-blue-600" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">MIRA está a escrever...</span>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* 🛠️ HARMONIOUS FOOTER (Floating & Glassy) */}
      <div className="p-4 sm:p-6 bg-transparent z-50">
        
        {/* ⚖️ DISCLAIMER (Floating Glass) */}
        <div className="flex items-center justify-center gap-2 py-2 px-4 bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl mb-6 text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em] text-center max-w-2xl mx-auto shadow-sm">
            <Shield size={12} className="shrink-0 text-slate-300" />
            AVISO LEGAL: O MIRA É UMA FERRAMENTA DE APOIO. NÃO SUBSTITUÍMOS ACONSELHAMENTO JURÍDICO OFICIAL.
        </div>

        {/* 💡 SUGGESTIONS (Floating Glass Pills) */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4 max-w-4xl mx-auto">
            {SUGGESTIONS.map((s, idx) => (
                <button 
                  key={idx}
                  onClick={() => handleSend(s)}
                  className="px-4 py-2.5 bg-white/90 backdrop-blur-md border border-slate-100 rounded-full shadow-md text-[9px] sm:text-[10px] font-black text-slate-700 uppercase tracking-tight hover:border-mira-orange hover:text-mira-orange active:scale-95 transition-all whitespace-nowrap"
                >
                  {s}
                </button>
            ))}
        </div>

        <div className="max-w-4xl mx-auto">
          {/* ChatInput should also be glassy internal to its component, but we ensure it here if needed */}
          <ChatInput language={language} isLoading={isLoading} onSend={handleSend} />
        </div>
      </div>
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default React.memo(AssistantView);
