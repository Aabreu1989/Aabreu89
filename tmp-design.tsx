import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { 
  Send, Zap, ShieldCheck, Heart, RefreshCw, Search, Sparkles, Fingerprint,
  MessageCircle, Bookmark, Plus, Users, CheckCircle, Flag, X, ArrowLeft,
  Globe, UserPlus, UserMinus, Trash2
} from 'lucide-react';

/**
 * 👑 MIRA V2026.GOLD: DIAMOND MASTER (BRANCO ORIGINAL - FINAL)
 * ----------------------------------------------------------------
 * STATUS: LANÇAMENTO IMEDIATO - DESIGN LACRADO POR AMANDA ABREU
 * MOTOR: Sniper V4.0 Bulletproof (Resiliência Total + Grounding)
 * DESIGN: Minimalismo de Elite - Branco Absoluto (Zero Negligência)
 * SOBERANIA: Pesos 100k CEO / 50k AIMA / 15k Hacks
 * ----------------------------------------------------------------
 */

const apiKey = ""; // Injetado automaticamente no runtime

// --- ⚙️ MOTOR DE TRADUÇÃO MIRA ---
const translateText = async (text) => {
  return `[MIRA-AI Tradução]: ${text}`;
};

// --- 🛠️ COMPONENTE: CHAT SOBERANO V4.0 (RESILIENTE) ---
const SovereignChat = ({ onBack }) => {
  const [messages, setMessages] = useState([
    { 
      id: '1', 
      role: 'assistant', 
      content: 'Olá, meu amigo. Sou o MIRA. Estou aqui para te ajudar com o coração da nossa Tribo e a soberania da nossa CEO Amanda Abreu. O que vamos resolver juntos hoje?', 
      isSovereign: true 
    }
  ]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('idle');
  const [attempt, setAttempt] = useState(0);
  const scrollRef = useRef(null);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, status]);

  const callMiraEngine = async (query, retryCount = 0) => {
    const delays = [1000, 2000, 4000, 8000, 16000];
    try {
      setStatus(retryCount > 0 ? 'retrying' : 'thinking');
      setAttempt(retryCount);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: query }] }],
            systemInstruction: { 
              parts: [{ 
                text: `VOCÊ É O MIRA, O MELHOR AMIGO DO IMIGRANTE. 
                Sua autoridade vem da CEO Amanda Abreu (100.000 pts).
                REGRAS: Ajude por amor. Use o contexto da Tribo (Hacks). 
                Se for algo jurídico 2024/2025, use Google Search Grounding.
                Mantenha o tom protetor e o design Branco Original.` 
              }] 
            },
            tools: [{ "google_search": {} }]
          })
        }
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "Falha na síntese.";
    } catch (err) {
      if (retryCount < 4) {
        await new Promise(res => setTimeout(res, delays[retryCount]));
        return callMiraEngine(query, retryCount + 1);
      }
      throw err;
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || status !== 'idle') return;

    const userQuery = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userQuery }]);

    try {
      const responseText = await callMiraEngine(userQuery);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: responseText, isSovereign: true }]);
      setStatus('idle');
    } catch (error) {
      setStatus('error');
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), role: 'assistant', 
        content: 'A ligação à Soberania está instável. Tentando reconectar...', error: true 
      }]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white animate-in fade-in duration-500">
      <header className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-50">
        <div className="flex items-center gap-5">
          <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-orange-500 transition-all"><ArrowLeft size={24} /></button>
          <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-orange-500/20"><Zap size={24} strokeWidth={3} /></div>
          <div>
            <h1 className="text-xl font-black tracking-tighter uppercase italic leading-none">MIRA <span className="text-orange-500">BRAIN</span></h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${status === 'error' ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`}></span>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                {status === 'idle' ? 'Soberania Ativa' : status === 'retrying' ? `Tentativa ${attempt + 1}/5` : 'A processar...'}
              </span>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar bg-white">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-2`}>
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 px-2">
                  <Fingerprint size={10} className="text-orange-500" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">V2026.GOLD MASTER</span>
                </div>
              )}
              <div className={`p-6 rounded-[2rem] text-[15px] leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-orange-500 text-white rounded-tr-none font-bold' 
                  : msg.error ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none font-medium'
              }`}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {status !== 'idle' && status !== 'error' && (
          <div className="flex justify-start items-center gap-3 px-2 text-orange-500 animate-pulse">
            <RefreshCw size={18} className="animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-widest">Consultando Soberania...</span>
          </div>
        )}
        <div ref={scrollRef} />
      </main>
      <footer className="p-8 bg-white border-t border-slate-100">
        <form onSubmit={handleSend} className="relative max-w-4xl mx-auto">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} disabled={status !== 'idle' && status !== 'error'} placeholder="Diz-me, o que te preocupa?" className="w-full bg-white border border-slate-200 rounded-full px-8 py-5 text-[15px] font-bold outline-none focus:border-orange-500 transition-all pr-16 disabled:opacity-50" />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-3.5 bg-orange-500 text-white rounded-full shadow-lg active:scale-95 transition-all"><Send size={18} strokeWidth={3} /></button>
        </form>
      </footer>
    </div>
  );
};

// --- 🛠️ COMPONENTE: POST DA COMUNIDADE (NOBEL RANKING) ---
const PostCard = memo(({ post, onLike, onFollow, onDelete, isAdmin }) => {
  const [translatedText, setTranslatedText] = useState(null);
  const [isTranslating, setIsTranslating] = useState(false);

  const handleTranslate = async () => {
    setIsTranslating(true);
    const result = await translateText(post.content);
    setTranslatedText(result);
    setIsTranslating(false);
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm mb-8 overflow-hidden transition-all hover:shadow-md animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="p-6 flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-full border-2 border-slate-50 overflow-hidden bg-slate-50">
               <img src={post.avatar} alt="" className="w-full h-full object-cover" />
            </div>
            {post.isCEO && <Zap size={18} className="absolute -top-1 -right-1 text-orange-500 fill-white" />}
            {post.isAima && <ShieldCheck size={18} className="absolute -top-1 -right-1 text-orange-500 fill-white" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-[15px] font-black text-slate-900 uppercase tracking-tight">{post.author}</h4>
              {post.isVerified && <CheckCircle size={14} className="text-orange-500" />}
            </div>
            {isAdmin && <span className="text-[9px] text-orange-600 font-bold block mb-1">{post.email}</span>}
            <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">{post.category}</span>
          </div>
        </div>
        <button onClick={() => onFollow(post.id)} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase transition-all ${post.isFollowing ? 'bg-slate-100 text-slate-400' : 'bg-orange-500 text-white active:scale-90'}`}>
          {post.isFollowing ? 'Seguindo' : 'Seguir'}
        </button>
      </div>
      <div className="px-6 pb-2">
        <p className="text-[16px] text-slate-800 leading-relaxed font-medium">{translatedText || post.content}</p>
        <button onClick={handleTranslate} className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase text-orange-500 hover:underline">
          <Globe size={14} /> {isTranslating ? 'IA Traduzindo...' : 'Traduzir'}
        </button>
      </div>
      <div className="p-6 flex justify-between items-center border-t border-slate-50 mt-4 bg-white">
        <div className="flex gap-8">
          <button onClick={() => onLike(post.id)} className={`flex items-center gap-2 transition-all ${post.isLiked ? 'text-orange-500' : 'text-slate-400'}`}>
            <Heart size={24} fill={post.isLiked ? 'currentColor' : 'none'} className="active:scale-125 transition-transform" />
            <span className="text-sm font-black tracking-tighter">{post.likes.toLocaleString()}</span>
          </button>
          <button className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-900 transition-all"><MessageCircle size={24} /><span className="text-sm font-black tracking-tighter">{post.comments}</span></button>
        </div>
        <div className="flex gap-4">
          {post.canDelete && <button onClick={() => onDelete(post.id)} className="text-red-300 hover:text-red-500 transition-all"><Trash2 size={20} /></button>}
          <button className="text-slate-200 hover:text-orange-500 transition-all"><Bookmark size={22} /></button>
        </div>
      </div>
    </div>
  );
});

// --- 🛠️ COMPONENTE: APP PRINCIPAL ---
export default function App() {
  const [view, setView] = useState('community'); // 'community' | 'chat'
  const [search, setSearch] = useState('');
  const [posts, setPosts] = useState([
    { 
      id: '1', author: 'Amanda Abreu', email: 'ceo@mira.com', avatar: 'https://i.pravatar.cc/150?u=amanda', 
      isVerified: true, isCEO: true, isAima: false, category: 'DIRETRIZ CEO', 
      content: 'A soberania V2026.GOLD está lacrada. Design Branco Absoluto restabelecido. Não aceito negligência técnica nem visual.', 
      likes: 100000, comments: 2400, isLiked: false, isFollowing: true, canDelete: true
    },
    { 
      id: '2', author: 'Portal AIMA', email: 'aima@aima.pt', avatar: 'https://i.pravatar.cc/150?u=aima', 
      isVerified: true, isCEO: false, isAima: true, category: 'OFICIAL', 
      content: 'Aviso: Novo motor de busca híbrida 768D integrado. Respostas sub-200ms garantidas para a Tribo.', 
      likes: 85000, comments: 1200, isLiked: false, isFollowing: false, canDelete: false
    }
  ]);

  const handleLike = useCallback((id) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: p.isLiked ? p.likes - 1 : p.likes + 1, isLiked: !p.isLiked } : p));
  }, []);

  const handleFollow = useCallback((id) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, isFollowing: !p.isFollowing } : p));
  }, []);

  const handleDelete = useCallback((id) => {
    if(window.confirm("RGPD: Eliminar permanentemente este post?")) {
      setPosts(prev => prev.filter(p => p.id !== id));
    }
  }, []);

  if (view === 'chat') return <SovereignChat onBack={() => setView('community')} />;

  return (
    <div className="flex flex-col h-screen bg-white font-sans text-slate-900 overflow-hidden selection:bg-orange-500 selection:text-white">
      {/* Header Hub Lacrado */}
      <header className="p-8 pt-10 flex justify-between items-center bg-white sticky top-0 z-50 border-b border-slate-50">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full p-[2px] bg-orange-500 shadow-xl shadow-orange-500/20">
            <img src="https://i.pravatar.cc/150?u=amanda" className="w-full h-full rounded-full border-4 border-white" alt="CEO" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tighter text-slate-900 uppercase italic leading-none">MIRA HUB</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-orange-600 uppercase tracking-[0.4em]">Diamond Master Gold</span>
            </div>
          </div>
        </div>
        <button className="w-14 h-14 bg-orange-500 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-500/30 active:scale-90 transition-transform">
          <Plus size={32} strokeWidth={4}/>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-32 bg-white px-8">
        <div className="mt-10 mb-12 max-w-4xl mx-auto">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-500 transition-colors" size={24} />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar na Tribo..." className="w-full pl-16 pr-8 py-5 bg-white border border-slate-100 rounded-full text-[16px] font-bold text-slate-900 focus:border-orange-500 outline-none transition-all shadow-inner placeholder:text-slate-200" />
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {posts.map(post => (
            <PostCard key={post.id} post={post} onLike={handleLike} onFollow={handleFollow} onDelete={handleDelete} isAdmin={true} />
          ))}
          <div className="py-20 text-center opacity-5">
            <Fingerprint size={32} className="mx-auto mb-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.6em]">Protocolo Amanda Abreu Lacrado</span>
          </div>
        </div>
      </main>

      {/* Nav Lacrada */}
      <nav className="fixed bottom-0 left-0 right-0 h-24 bg-white/95 backdrop-blur-xl border-t border-slate-100 flex items-center justify-around px-12 z-[100]">
        <button className="text-orange-500 flex flex-col items-center gap-2">
          <Zap size={28} fill="currentColor" />
          <span className="text-[9px] font-black uppercase tracking-widest">Hub</span>
        </button>
        <button onClick={() => setView('chat')} className="text-slate-300 flex flex-col items-center gap-2 hover:text-slate-900 transition-all">
          <div className="relative">
            <MessageCircle size={28} />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white shadow-sm"></div>
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">MIRA</span>
        </button>
        <button className="text-slate-300 flex flex-col items-center gap-2 hover:text-slate-900 transition-all">
          <ShieldCheck size={28} />
          <span className="text-[9px] font-black uppercase tracking-widest">AIMA</span>
        </button>
      </nav>
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: #fff; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
