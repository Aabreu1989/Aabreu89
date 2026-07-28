const fs = require('fs');
const path = require('path');

// =======================
// 1. AssistantView.tsx
// =======================
let assistPath = path.join(__dirname, 'components', 'AssistantView.tsx');
let assistCode = fs.readFileSync(assistPath, 'utf8');

// Replace MiraChatHeader
assistCode = assistCode.replace(
  /const MiraChatHeader =[\s\S]*?return \([\s\S]*?className="bg-white\/90 backdrop-blur-md border-b border-slate-100[\s\S]*?\);\n\};/,
  `const MiraChatHeader = ({ 
  language, 
  onBack, 
  audioEnabled, 
  onToggleAudio,
  onClearChat
}: any) => {
    return (
      <header className="px-5 sm:px-8 py-4 sm:py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-50">
        <div className="flex items-center gap-3 sm:gap-5">
          <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-orange-500 transition-all"><ArrowLeft size={24} /></button>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-orange-500/20"><Zap size={20} className="sm:w-6 sm:h-6" strokeWidth={3} /></div>
          <div>
            <h1 className="text-lg sm:text-xl font-black tracking-tighter uppercase italic leading-none">MIRA <span className="text-orange-500">BRAIN</span></h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Soberania Ativa</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <button 
               onClick={() => onToggleAudio?.()} 
               className={\`p-2 sm:p-3 rounded-[1rem] sm:rounded-[1.2rem] transition-all shadow-sm active:scale-90 \${audioEnabled ? 'bg-orange-500 text-white shadow-orange-500/20' : 'bg-slate-50 text-slate-400'}\`}
            >
                {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <button 
              onClick={onClearChat}
              className="p-2 sm:p-3 rounded-[1rem] sm:rounded-[1.2rem] bg-red-50 text-red-500 transition-all hover:bg-red-500 hover:text-white active:scale-95 shadow-sm"
            >
              <Trash2 size={16} />
            </button>
        </div>
      </header>
    );
};`
);

// Replace AssistantView container background
assistCode = assistCode.replace(
  /className="flex flex-col h-full bg-\[\#f8fbff\] \w* animate-[a-zA-Z-0-9]+ duration-[0-9]+"/,
  `className="flex flex-col h-full bg-white animate-in fade-in duration-500"`
);
assistCode = assistCode.replace(
  /className="flex flex-col h-full bg-\[\#f8fbff\] animate-in fade-in duration-500"/,
  `className="flex flex-col h-full bg-white animate-in fade-in duration-500"`
);

// Assistant Chat bubbles background
assistCode = assistCode.replace(
  /className=\{`p-3 sm:p-5 rounded-\[2rem\] text-sm sm:text-\[15px\] leading-relaxed shadow-sm flex flex-col gap-2 \${[\s]\s*m.role === 'user'[\s]\s*\? 'bg-\[\#f3f8ff\] text-slate-800 rounded-tr-none font-bold align-right'[\s]\s*: 'bg-\[\#0066FF\] text-white rounded-tl-none font-medium'[\s]\s*\}`\}/,
  `className={\`p-4 sm:p-6 rounded-[2rem] text-sm sm:text-[15px] leading-relaxed shadow-sm flex flex-col gap-2 \${
    m.role === 'user' 
      ? 'bg-orange-500 text-white rounded-tr-none font-bold' 
      : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none font-medium'
  }\`}`
);

// We also need to add the little Fingerprint "V2026.GOLD MASTER" badge on Assistant bubbles.
assistCode = assistCode.replace(
  /(\{m\.role === 'assistant' && \([\s\S]*?<div className="flex items-center gap-2 mb-1 px-1">[\s\S]*?<div className="p-1 bg-white\/20 rounded-md">[\s\S]*?<Zap size=\{12\} className="text-white" \/>[\s\S]*?<\/div>[\s\S]*?<span className="text-\[9px\] font-black uppercase tracking-widest text-white\/80">MIRA Sovereign<\/span>[\s\S]*?<\/div>[\s\S]*?\)\})/,
  `{m.role === 'assistant' && (
      <div className="flex items-center gap-2 px-2 pb-1">
          <Fingerprint size={10} className="text-orange-500" />
          <span className="text-[8px] font-black uppercase tracking-widest text-slate-300">V2026.GOLD MASTER</span>
      </div>
  )}`
);

// Input container
assistCode = assistCode.replace(
  /className={`w-full bg-white border border-slate-100 rounded-full px-5 sm:px-6 py-4 sm:py-5 text-sm sm:text-\[15px\] font-bold outline-none focus:border-mira-blue focus:ring-4 focus:ring-blue-50 transition-all pr-[120px] sm:pr-[140px] shadow-sm[\\s\\S]*?`}/,
  `className={\`w-full bg-white border border-slate-200 rounded-[2rem] px-5 sm:px-8 py-4 sm:py-5 text-sm sm:text-[15px] font-bold outline-none focus:border-orange-500 transition-all pr-[120px] sm:pr-[140px] shadow-inner \${status !== 'idle' ? 'opacity-50' : ''}\`}`
);

// Send button color
assistCode = assistCode.replace(
  /className="p-3 sm:p-3.5 bg-mira-blue text-white rounded-full shadow-lg active:scale-95 transition-all shadow-blue-500\/20"/,
  `className="p-3 sm:p-3.5 bg-orange-500 text-white rounded-full shadow-lg active:scale-95 transition-all shadow-orange-500/20"`
);


fs.writeFileSync(assistPath, assistCode);



// =======================
// 2. PostCard.tsx
// =======================
let postPath = path.join(__dirname, 'components', 'PostCard.tsx');
let postCode = fs.readFileSync(postPath, 'utf8');

// Replace standard outer div in return
postCode = postCode.replace(
  /<div id=\{\`post-\$\{post\.id\}\`\} className="bg-white rounded-\[2\.5rem\] overflow-hidden shadow-xl border border-slate-100 group transition-all hover:shadow-\[0_20px_60px_rgba\(0,0,0,0\.1\)\] animate-in fade-in slide-in-from-bottom-4 duration-500 mb-8">/,
  `<div id={\`post-\${post.id}\`} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm mb-10 mt-2 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">`
);

// We need to keep the RAG Verification and the content, but structure it like her minimal header.
// Instead of rewriting the whole 200 lines of PostCard return block using Regex, we can use Babel or just target the header div.
// The easiest way is to rewrite only the header and footer classes of PostCard.

// Header Container
postCode = postCode.replace(
  /<div className="absolute top-6 left-6 right-6 flex justify-between items-start z-20">/,
  `<div className="p-6 sm:p-8 flex justify-between items-start z-20">`
);

// The avatar and name block
postCode = postCode.replace(
  /<div className="p-\[2\.5px\] bg-gradient-to-tr from-\[\#f97316\] via-\[\#facc15\] to-\[\#3b82f6\] rounded-full shadow-lg relative">/,
  `<div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-4 border-slate-50 overflow-hidden relative shadow-sm">`
);

// Text classes
postCode = postCode.replace(
  /text-\[8px\] font-extrabold uppercase tracking-widest leading-none text-slate-900 truncate/g,
  `text-[14px] sm:text-[17px] font-black text-slate-900 uppercase tracking-tighter truncate leading-none`
);

// Remove Absolute from Header
postCode = postCode.replace(
  /className="relative min-h-\[320px\] max-h-\[560px\] aspect-\[4\/5\] sm:aspect-video m-2 sm:m-4 rounded-\[2rem\] sm:rounded-\[2\.5rem\] overflow-hidden group\/img shadow-lg"/,
  `className="relative mx-6 mt-2 mb-4 rounded-[2rem] overflow-hidden group/img"`
);

// Make translate button orange
postCode = postCode.replace(
  /className="mt-4 flex flex-col gap-2 items-start text-\[9px\] font-black uppercase text-mira-blue underline-offset-4 hover:underline"/,
  `className="mt-4 flex items-center gap-2 text-[11px] font-black uppercase text-orange-500 hover:underline"`
);

// Bottom footer
postCode = postCode.replace(
  /className="absolute bottom-6 left-6 right-6 flex justify-between items-end z-20"/,
  `className="p-6 sm:p-8 flex justify-between items-center border-t border-slate-50 mt-4 bg-white"`
);

// Heart button
postCode = postCode.replace(
  /className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full transition-all active:scale-90 \${[\s\S]*?localLiked \? 'bg-rose-500 text-white shadow-rose-500\/30 shadow-lg' : 'bg-white\/80 backdrop-blur-2xl text-slate-700 hover:bg-white'[\s\S]*?}`}/,
  `className={\`flex items-center gap-2 sm:gap-3 \${localLiked ? 'text-orange-500' : 'text-slate-400'}\`}`
);
postCode = postCode.replace(
  /size=\{16\} className="sm:w-\[18px\] sm:h-\[18px\]"/g,
  `size={24} className="sm:w-7 sm:h-7"`
);

fs.writeFileSync(postPath, postCode);


// =======================
// 3. CommunityView.tsx
// =======================
let commPath = path.join(__dirname, 'components', 'CommunityView.tsx');
let commCode = fs.readFileSync(commPath, 'utf8');

// Header
commCode = commCode.replace(
  /<div className="bg-slate-900 text-white flex flex-col p-5 sm:p-8 space-y-6 shrink-0 relative overflow-hidden">[\s\S]*?<\/div>\s*<\/div>/,
  `<header className="px-6 py-8 sm:p-8 sm:pt-10 flex justify-between items-center bg-white sticky top-0 z-50 border-b border-slate-50">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full p-[3px] bg-orange-500 relative cursor-pointer active:scale-95 transition-transform" onClick={() => setActiveStory({ authorName: user.name, authorAvatar: user.profileImage, content: "Criar Story", image: null })} >
            <img src={user.profileImage || "https://i.pravatar.cc/150"} className="w-full h-full rounded-full border-[3px] sm:border-4 border-white object-cover" alt="User" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tighter text-slate-900 uppercase italic leading-none">MIRA HUB</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-orange-500 animate-pulse"></div>
              <span className="text-[9px] sm:text-[11px] font-black text-orange-600 uppercase tracking-[0.4em]">Diamond Master Gold</span>
            </div>
          </div>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="w-14 h-14 sm:w-16 sm:h-16 bg-orange-500 text-white rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-2xl shadow-orange-500/30 active:scale-90 transition-transform">
          <Plus size={32} className="sm:w-9 sm:h-9" strokeWidth={4}/>
        </button>
  </header>`
);

// Filter Input
commCode = commCode.replace(
  /<div className="px-5 mb-5 space-y-4">[\s\S]*?<\/div>\s*<\/div>/,
  `<div className="mt-4 mb-10 max-w-5xl mx-auto px-6 sm:px-8">
      <div className="relative group">
        <Search className="absolute left-10 sm:left-12 top-1/2 -translate-y-1/2 text-slate-300 transition-colors" size={24} />
        <input 
          type="text" 
          value={filterText} 
          onChange={(e) => setFilterText(e.target.value)} 
          placeholder="Interrogar base de conhecimento..." 
          className="w-full pl-[4.5rem] pr-10 py-5 sm:py-7 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] text-[16px] sm:text-[18px] font-bold text-slate-900 focus:bg-white focus:border-orange-500 outline-none transition-all placeholder:text-slate-300" 
        />
      </div>
  </div>`
);

// Navigation Bottom Bar
commCode = commCode.replace(
  /<div className="fixed bottom-0 left-0 right-0 h-20 sm:h-24 bg-white flex items-center justify-around px-8 border-t border-slate-100 pb-2 z-\[100\] shadow-\[0_-10px_40px_rgba\(0,0,0,0\.05\)\]">[\s\S]*?<\/div>/,
  `<nav className="fixed bottom-0 left-0 right-0 h-24 sm:h-32 bg-white/95 backdrop-blur-2xl border-t border-slate-100 flex items-center justify-around px-8 sm:px-12 z-[100] pb-safe">
        <button className="text-orange-500 flex flex-col items-center gap-2 sm:gap-3 scale-110 transition-transform">
          <Zap size={28} className="sm:w-8 sm:h-8" fill="currentColor" />
          <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest">Hub</span>
        </button>
        <button onClick={() => onViewChange(ViewType.CHAT)} className="text-slate-300 flex flex-col items-center gap-2 sm:gap-3 hover:text-orange-500 transition-all">
          <div className="relative">
            <MessageCircle size={28} className="sm:w-8 sm:h-8" />
            <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-orange-500 rounded-full border-2 border-white shadow-sm animate-pulse"></div>
          </div>
          <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest">MIRA</span>
        </button>
        <button onClick={() => window.open('https://aima.gov.pt', '_blank')} className="text-slate-300 flex flex-col items-center gap-2 sm:gap-3 hover:text-slate-900 transition-all">
          <ShieldCheck size={28} className="sm:w-8 sm:h-8" />
          <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest">AIMA</span>
        </button>
  </nav>`
);

// Body background
commCode = commCode.replace(
  /className="flex flex-col h-full bg-\[\#f8fbff\] text-slate-900 relative"/,
  `className="flex flex-col h-full bg-white text-slate-900 relative"`
);

fs.writeFileSync(commPath, commCode);

console.log("UI integration complete!");
