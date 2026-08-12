import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Send, Volume2, VolumeX, Square, ThumbsUp, ThumbsDown, 
  ArrowLeft, CheckCheck, Trash2, Sparkles, X, 
  Briefcase, MapPin, GraduationCap, ArrowRight, Bot, ShieldCheck,
  Brain, Loader2, Shield, Globe
} from 'lucide-react';

import { generateAssistantResponseV45, generateSpeech } from '../services/geminiService';
import { audioService } from '../services/audioService';
import { Message, ViewType, User as UserType, UNIFIED_CATEGORIES, UnifiedCategory } from '../types';
import { supabase } from '../lib/supabase';
import { useToast } from './Toast';
import { t } from '../utils/translations';
import { persistence } from '../utils/persistence';
import { MIRA_PHOTO_URL } from '../constants';
import { normalizeCategory } from '../utils/categoryUtils';
import { analytics } from '../services/analyticsService';
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

const getSuggestions = (lang: string) => {
  const suggestions: Record<string, string[]> = {
    PT: ["COMO TIRAR O NIF?", "Regularização por Estudos (Art. 91.º)", "AGENDAMENTO AIMA 2026", "Pedido de Cidadania"],
    EN: ["HOW TO GET THE NIF?", "AIMA Appointment 2026", "NISS Registration", "Citizenship Request"],
    FR: ["COMMENT OBTENIR LE NIF ?", "Rendez-vous AIMA 2026", "Inscription NISS", "Demande de Citoyenneté"],
    ES: ["¿CÓMO OBTENER EL NIF?", "Cita AIMA 2026", "Registro NISS", "Solicitud de Ciudadanía"]
  };
  return suggestions[lang] || suggestions['PT'];
};

const getUIText = (lang: string, name: string) => {
  let welcome = `Olá ${name}! 👋 Sou a MIRA, a tua guia em Portugal. Pergunta-me o que precisares sobre NIF, residência, AIMA, SNS, ou qualquer dúvida da vida em Portugal!`;
  let typing = 'MIRA está a escrever...';
  let clearConfirm = 'Deseja apagar permanentemente o histórico de mensagens?';
  let clearSuccess = 'Histórico limpo com sucesso.';
  let clearError = 'Erro ao limpar histórico.';
  let chatError = 'Erro na ligação à MIRA.';
  let disclaimer = 'AVISO LEGAL: O MIRA É UMA FERRAMENTA DE APOIO. NÃO SUBSTITUÍMOS ACONSELHAMENTO JURÍDICO OFICIAL.';

  if (lang === 'EN') {
      welcome = `Hello ${name}! 👋 I'm MIRA, your guide in Portugal. Ask me anything about NIF, residency, AIMA, health or daily life!`;
      typing = 'MIRA is writing...';
      clearConfirm = 'Do you want to permanently delete the chat history?';
      clearSuccess = 'Chat history cleared.';
      clearError = 'Error clearing history.';
      chatError = 'Connection error to MIRA.';
      disclaimer = 'DISCLAIMER: MIRA IS A SUPPORT TOOL. WE DO NOT REPLACE OFFICIAL LEGAL ADVICE.';
  } else if (lang === 'FR') {
      welcome = `Bonjour ${name} ! 👋 Je suis MIRA, votre guide au Portugal. Posez vos questions sur le NIF, la résidence, l'AIMA, la santé ou la vie quotidienne !`;
      typing = 'MIRA écrit...';
      clearConfirm = 'Voulez-vous supprimer définitivement l\'historique des messages ?';
      clearSuccess = 'Historique effacé.';
      clearError = 'Erreur lors de l\'effacement.';
      chatError = 'Erreur de connexion à MIRA.';
      disclaimer = 'AVERTISSEMENT : MIRA EST UN OUTIL D\'AIDE. NOUS NE REMPLAÇONS PAS UN CONSEIL JURIDIQUE OFFICIEL.';
  } else if (lang === 'ES') {
      welcome = `¡Hola ${name}! 👋 Soy MIRA, tu guía en Portugal. Pregúntame lo que necesites sobre NIF, residencia, AIMA, salud o cualquier duda de la vida en Portugal.`;
      typing = 'MIRA está escribiendo...';
      clearConfirm = '¿Deseas eliminar permanentemente el historial de mensajes?';
      clearSuccess = 'Historial eliminado con éxito.';
      clearError = 'Error al eliminar el historial.';
      chatError = 'Error de conexión con MIRA.';
      disclaimer = 'AVISO LEGAL: MIRA ES UNA HERRAMIENTA DE APOYO. NO REEMPLAZAMOS EL ASESORAMIENTO JURÍDICO OFICIAL.';
  }
  return { welcome, typing, clearConfirm, clearSuccess, clearError, chatError, disclaimer };
};

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
                    <div className="w-10 h-10 rounded-full overflow-hidden shadow-lg border border-slate-100 shrink-0 bg-white group-hover:scale-110 transition-transform relative">
                        <img src={MIRA_PHOTO_URL || '/mira-robot.png'} alt="MIRA" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h1 className="mira-module-title !text-slate-800">ASSISTENTE MIRA IA</h1>
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
                   className={`p-2.5 rounded-2xl transition-all shadow-sm border active:scale-90 ${audioEnabled ? 'bg-orange-500 text-white border-orange-400 shadow-orange-500/20' : 'bg-slate-50 text-slate-350 border-slate-100'}`}
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
  
  const cleanText = msg.text
    .replace(/\[(job|course)-card:([a-f0-9-]+|[0-9]+)\]/g, '')
    .replace(/\[view:([A-Z_]+):(.+?)\]/g, '')
    .replace(/\[BUTTON\|(.+?)\|(.+?)\]/g, '')
    .trim();

  return (
    <div className={`flex w-full mb-8 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
      <div className={`max-w-[85%] relative group transition-all duration-500 p-5 rounded-[2rem] shadow-xl
        ${isUser 
            ? 'bg-mira-orange text-white rounded-tr-none shadow-orange-500/10' 
            : 'bg-blue-600 text-white rounded-tl-none border-l-[4px] border-orange-400 shadow-blue-500/10'} overflow-hidden`}>

          {!isUser && (
            <div className="flex items-center gap-3 mb-2">
               <div className="px-2 py-0.5 bg-white/10 rounded-md text-[7px] font-black uppercase tracking-[0.2em] text-white/60 border border-white/10 flex items-center gap-1.5">
                <Brain size={10} className="text-orange-400" />
                MIGRANT'S INTELLIGENT RIGHTS ASSISTANT
               </div>
            </div>
          )}

          <div className="text-[14px] leading-relaxed font-bold select-text break-words">
            {cleanText}
          </div>

          {cardMatch && (
            <LazyChatCard type={cardMatch[1]} id={cardMatch[2]} language={language} onViewChange={onViewChange} />
          )}

          {/* 🔗 MODULE NAVIGATION BUTTONS & EXTERNAL LINKS (V26.GOLD) */}
          {(msg.text.includes('[view:') || msg.text.includes('[BUTTON|')) && (
             <div className="mt-4 flex flex-col gap-3">
                {/* Native Module Links [view:VIEW_TYPE:LABEL] or [view:VIEW_TYPE:SUB_TAB:LABEL] */}
                {Array.from(msg.text.matchAll(/\[view:([A-Z_]+)(?::([a-z0-9_]+))?:(.+?)\]/g)).map((match: any, i) => {
                  const rawTarget = match[1];
                  const subTab = match[2];
                  const label = match[3] || match[2] || rawTarget;

                  const handleClick = () => {
                    if (rawTarget === 'SIMULATORS' && label?.toLowerCase().includes('irs')) {
                      onViewChange(ViewType.DOCUMENTS, { tab: 'irs' });
                    } else if (rawTarget === 'IRS' || subTab === 'irs') {
                      onViewChange(ViewType.DOCUMENTS, { tab: 'irs' });
                    } else if (subTab) {
                      onViewChange(rawTarget as ViewType, { tab: subTab });
                    } else {
                      onViewChange(rawTarget as ViewType);
                    }
                  };

                  return (
                    <button
                      key={`view-${i}`}
                      onClick={handleClick}
                      className="w-full py-3.5 px-5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-[1.5rem] flex items-center justify-between group transition-all active:scale-95 shadow-lg backdrop-blur-sm"
                    >
                      <span className="text-[11px] font-black uppercase tracking-widest text-white">{label}</span>
                      <ArrowRight size={16} className="text-orange-400 group-hover:translate-x-1 transition-transform" />
                    </button>
                  );
                })}

                {/* External Link Buttons [BUTTON|Name|URL] */}
                {Array.from(msg.text.matchAll(/\[BUTTON\|(.+?)\|(.+?)\]/g)).map((match: any, i) => (
                  <button
                    key={`btn-${i}`}
                    onClick={() => window.open(match[2], '_blank', 'noopener,noreferrer')}
                    className="w-full py-3.5 px-5 bg-[#FF8C00] hover:bg-[#FF8C00]/90 border border-white/20 rounded-[1.5rem] flex items-center justify-between group transition-all active:scale-95 shadow-lg shadow-orange-500/20"
                  >
                    <span className="text-[11px] font-black uppercase tracking-widest text-white">{match[1]}</span>
                    <Globe size={16} className="text-white group-hover:scale-110 transition-transform" />
                  </button>
                ))}
             </div>
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

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const lang = (language || 'PT').toUpperCase();
  const userName = user?.name?.split(' ')[0] || 'Membro';
  const T = getUIText(lang, userName);
  const SUGGESTIONS = getSuggestions(lang);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await persistence.get('mira_chat_history');
        if (history && Array.isArray(history) && history.length > 0) {
          // [MIRA GOLD]: Always ensure the welcome message is in the correct language
          const updatedHistory = history.map(m => {
            if (m.id === 'welcome') {
              return { ...m, text: T.welcome, timestamp: new Date(m.timestamp) };
            }
            return { ...m, timestamp: new Date(m.timestamp) };
          });
          setMessages(updatedHistory);
        } else {
          setMessages([{ 
            id: 'welcome', 
            role: 'assistant', 
            text: T.welcome,
            timestamp: new Date()
          }]);
        }
      } catch (e) {
        console.error("Error loading chat history:", e);
      }
    };
    loadHistory();
  }, [user, lang]);

  useEffect(() => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleAudioAction = async (msg: any) => {
    if (isPlaying === msg.id) { 
        audioService.stop(); 
        window.speechSynthesis.cancel();
        setIsPlaying(null); 
        return; 
    }
    
    audioService.stop();
    window.speechSynthesis.cancel();
    setIsPlaying(msg.id);

    try {
      const ttsText = sanitizeTTS(msg.text);
      const audioBase64 = await generateSpeech(ttsText, language.toUpperCase());
      
      if (audioBase64) {
          audioService.playBase64(audioBase64, undefined, () => setIsPlaying(null));
      } else { 
          // 🎙️ [MIRA GOLD FALLBACK]: Voz Nativa do Browser
          console.log("🎙️ [MIRA]: Usando síntese nativa de voz...");
          const utterance = new SpeechSynthesisUtterance(ttsText);
          utterance.lang = language === 'PT' ? 'pt-PT' : 
                          language === 'EN' ? 'en-GB' : 
                          language === 'FR' ? 'fr-FR' : 'es-ES';
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          utterance.onend = () => setIsPlaying(null);
          utterance.onerror = () => setIsPlaying(null);
          window.speechSynthesis.speak(utterance);
      }
    } catch (e) { 
        console.error("Audio Fallback Error:", e);
        setIsPlaying(null); 
    }
  };

  const handleClearChat = React.useCallback(async () => {
    if (window.confirm(T.clearConfirm)) {
      const welcomeMsg = { 
        id: 'welcome', 
        role: 'assistant', 
        text: T.welcome,
        timestamp: new Date() 
      };
      
      try {
        setMessages([welcomeMsg]);
        
        // Comprehensive cleanup
        await persistence.delete('mira_chat_history');
        localStorage.removeItem('mira_chat_history');
        localStorage.removeItem('chat_history');
        
        audioService.stop();
        setIsPlaying(null);
        showToast(T.clearSuccess, "success");
        
        // Soft refresh for UI sync
        setTimeout(() => {
           window.scrollTo(0,0);
        }, 100);
      } catch (err) {
        console.error("Error clearing chat:", err);
        showToast(T.clearError, "error");
      }
    }
  }, [T.clearConfirm, T.welcome, T.clearSuccess, T.clearError, showToast]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg = { id: Date.now().toString(), role: 'user', text, timestamp: new Date() };
    
    // 🏷️ AUTOMATIC CATEGORIZATION & AUDIT CATALOGING (UNIFIED CATEGORIES)
    const classifiedCategory = normalizeCategory(selectedCategory || undefined, text);
    analytics.track('ai_query', user?.id || 'guest', classifiedCategory, {
      prompt: text,
      category: classifiedCategory,
      user_category_selection: selectedCategory || null,
      timestamp: new Date().toISOString()
    });

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setIsTyping(true);
    
    try {
      const response = await generateAssistantResponseV45(
        text, 
        messages.map(m => ({ 
          role: m.role, 
          text: m.text 
        })), 
        language.toUpperCase(),
        "chat"
      );
      
      const assistantMsg = { 
        id: (Date.now() + 1).toString(), 
        role: 'assistant', 
        text: response.text || "Sem resposta...", 
        timestamp: new Date()
      };
      
      setMessages(prev => {
        const newMessages = [...prev, assistantMsg];
        persistence.set('mira_chat_history', newMessages);
        return newMessages;
      });
    } catch (e) {
      showToast(T.chatError, "error");
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] relative overflow-hidden font-sans text-slate-800">
      {/* 🧩 IMPERIAL TEXTURE (Online Replica Grid) */}
      <div className="absolute inset-0 z-0 opacity-100 pointer-events-none" 
           style={{ 
             backgroundColor: '#f8fafc',
             backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230066ff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2v-4h4v-2h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2v-4h4v-2H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
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
                <div className="bg-white p-4 rounded-2xl flex items-center gap-2 border border-slate-100 shadow-sm">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-450">{T.typing}</span>
                    <Loader2 size={10} className="animate-spin text-slate-405" />
                </div>
            </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* 🛠️ HARMONIOUS FOOTER (Floating & Glassy) */}
      <div className="p-4 sm:p-6 bg-transparent z-50 pb-20 md:pb-6">
        
        {/* ⚖️ DISCLAIMER (Floating Glass) */}
        <div className="flex items-center justify-center gap-2 py-2 px-4 bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl mb-4 sm:mb-6 text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em] text-center max-w-2xl mx-auto shadow-sm">
            <Shield size={12} className="shrink-0 text-slate-300" />
            {T.disclaimer}
        </div>

        {/* 💡 SUGGESTIONS (Sovereign Choice Grid) */}
        <div className="flex flex-col gap-2 mb-6 max-w-2xl mx-auto px-2">
            <div className="grid grid-cols-2 gap-2">
                {SUGGESTIONS.map((s, idx) => (
                    <button 
                      key={idx}
                      onClick={() => handleSend(s)}
                      className="group relative p-3 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-orange-500/10 hover:border-orange-500/30 transition-all active:scale-[0.98] flex flex-col items-center justify-center text-center gap-1 overflow-hidden min-h-[60px]"
                    >
                      <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Sparkles size={10} className="text-orange-400" />
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-black text-slate-800 uppercase tracking-tighter leading-tight">
                        {s}
                      </span>
                    </button>
                ))}
            </div>
        </div>

        <div className="max-w-4xl mx-auto">
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
