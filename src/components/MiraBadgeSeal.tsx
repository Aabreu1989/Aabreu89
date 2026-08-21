import React from 'react';
import { 
  Star, ShieldCheck, Search, BookOpen, Diamond, ShieldAlert, 
  Scale, Flame, Heart, Award, CheckCircle2, Lock, Sparkles, Crown, Zap, Check, MapPin
} from 'lucide-react';

export interface MiraBadgeSealProps {
  id: string;
  name?: string;
  category?: 'trust' | 'help' | 'social' | 'special' | string;
  rarityLevel?: number; // 1: Bronze, 2: Prata, 3: Ouro, 4: Diamante, 5: Soberano
  unlocked: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const BADGE_CONFIGS: Record<string, {
  name: string;
  tier: 'bronze' | 'prata' | 'ouro' | 'diamante' | 'soberano';
  category: 'trust' | 'help' | 'social' | 'special';
  icon: any;
  gradient: string;
  outerRing: string;
  ribbonColor: string;
  ribbonBg: string;
  accentColor: string;
  shineColor: string;
  description: string;
}> = {
  pioneiro: {
    name: 'Membro Pioneiro',
    tier: 'ouro',
    category: 'special',
    icon: Star,
    gradient: 'from-[#FFD700] via-[#FFA500] to-[#B8860B]',
    outerRing: '#FFD700',
    ribbonColor: '#b45309',
    ribbonBg: 'bg-gradient-to-r from-amber-500 to-yellow-600',
    accentColor: '#FFF8DC',
    shineColor: '#FFE4B5',
    description: 'Pertence à primeira geração de utilizadores que fundaram a comunidade MIRA.'
  },
  verificado: {
    name: 'Cidadão Verificado',
    tier: 'soberano',
    category: 'trust',
    icon: ShieldCheck,
    gradient: 'from-emerald-400 via-teal-300 to-emerald-700',
    outerRing: '#34d399',
    ribbonColor: '#047857',
    ribbonBg: 'bg-gradient-to-r from-emerald-600 to-teal-700',
    accentColor: '#e6fffa',
    shineColor: '#a7f3d0',
    description: 'Identidade verificada e reconhecida pelo sistema de segurança e moderação MIRA.'
  },
  curador: {
    name: 'Curador de Conteúdo',
    tier: 'bronze',
    category: 'trust',
    icon: Search,
    gradient: 'from-amber-600 via-amber-500 to-amber-900',
    outerRing: '#d97706',
    ribbonColor: '#78350f',
    ribbonBg: 'bg-gradient-to-r from-amber-700 to-orange-800',
    accentColor: '#fef3c7',
    shineColor: '#fde68a',
    description: 'Validou guias de utilidade pública e ajudou na curadoria da informação comunitária.'
  },
  mestre_docs: {
    name: 'Mestre dos Documentos',
    tier: 'prata',
    category: 'help',
    icon: BookOpen,
    gradient: 'from-slate-200 via-sky-100 to-slate-500',
    outerRing: '#38bdf8',
    ribbonColor: '#0369a1',
    ribbonBg: 'bg-gradient-to-r from-sky-600 to-slate-700',
    accentColor: '#ffffff',
    shineColor: '#bae6fd',
    description: 'Especialista no preenchimento e utilização de minutas, NIF, NISS e guias de alojamento.'
  },
  exemplar: {
    name: 'Cidadão Exemplar',
    tier: 'diamante',
    category: 'social',
    icon: Diamond,
    gradient: 'from-cyan-300 via-sky-200 to-indigo-600',
    outerRing: '#22d3ee',
    ribbonColor: '#4338ca',
    ribbonBg: 'bg-gradient-to-r from-cyan-500 to-indigo-600',
    accentColor: '#ffffff',
    shineColor: '#c7d2fe',
    description: 'Conduta exemplar na comunidade, ajudando ativamente outros migrantes sem qualquer registo de infração.'
  },
  sentinela: {
    name: 'Sentinela MIRA',
    tier: 'prata',
    category: 'trust',
    icon: ShieldAlert,
    gradient: 'from-orange-400 via-red-400 to-orange-700',
    outerRing: '#fb923c',
    ribbonColor: '#c2410c',
    ribbonBg: 'bg-gradient-to-r from-orange-600 to-red-700',
    accentColor: '#ffedd5',
    shineColor: '#fed7aa',
    description: 'Guardião da integridade do ecossistema, denunciando abusos, fraudes e desinformação.'
  },
  especialista_leis: {
    name: 'Especialista em Leis',
    tier: 'ouro',
    category: 'help',
    icon: Scale,
    gradient: 'from-amber-300 via-yellow-400 to-amber-600',
    outerRing: '#fbbf24',
    ribbonColor: '#92400e',
    ribbonBg: 'bg-gradient-to-r from-amber-600 to-yellow-600',
    accentColor: '#fffbeb',
    shineColor: '#fde68a',
    description: 'Esclareceu dúvidas jurídicas e informou a comunidade com base nas leis de estrangeiros e direito português.'
  },
  mentor_emprego: {
    name: 'Mentor de Emprego',
    tier: 'ouro',
    category: 'help',
    icon: Flame,
    gradient: 'from-rose-400 via-orange-400 to-amber-500',
    outerRing: '#fb7185',
    ribbonColor: '#be123c',
    ribbonBg: 'bg-gradient-to-r from-rose-600 to-orange-600',
    accentColor: '#fff1f2',
    shineColor: '#fecdd3',
    description: 'Apoiou o talento internacional na integração no mercado de trabalho e na criação de propostas de valor.'
  },
  coracao: {
    name: 'Coração da Tribo',
    tier: 'bronze',
    category: 'social',
    icon: Heart,
    gradient: 'from-pink-400 via-rose-400 to-rose-600',
    outerRing: '#f472b6',
    ribbonColor: '#9f1239',
    ribbonBg: 'bg-gradient-to-r from-pink-600 to-rose-700',
    accentColor: '#fdf2f8',
    shineColor: '#fbcfe8',
    description: 'O maior símbolo de empatia, acolhimento e apoio humano aos novos chegados a Portugal.'
  },
  voz_autoridade: {
    name: 'Voz de Autoridade',
    tier: 'soberano',
    category: 'help',
    icon: Zap,
    gradient: 'from-purple-400 via-violet-300 to-amber-500',
    outerRing: '#a855f7',
    ribbonColor: '#6b21a8',
    ribbonBg: 'bg-gradient-to-r from-purple-600 to-amber-600',
    accentColor: '#faf5ff',
    shineColor: '#e9d5ff',
    description: 'Alcançou 500+ pontos de reputação. A voz mais respeitada e ouvida da comunidade MIRA.'
  },
  escudo_anti_burla: {
    name: 'Escudo Anti-Burla',
    tier: 'diamante',
    category: 'trust',
    icon: ShieldCheck,
    gradient: 'from-blue-400 via-teal-300 to-cyan-600',
    outerRing: '#60a5fa',
    ribbonColor: '#1e40af',
    ribbonBg: 'bg-gradient-to-r from-blue-600 to-teal-700',
    accentColor: '#eff6ff',
    shineColor: '#bfdbfe',
    description: 'Denunciador verificado de esquemas e fraudes de agendamento AIMA. Protege a comunidade.'
  },
  guia_local: {
    name: 'Guia Local',
    tier: 'prata',
    category: 'social',
    icon: MapPin,
    gradient: 'from-emerald-400 via-green-300 to-teal-600',
    outerRing: '#34d399',
    ribbonColor: '#065f46',
    ribbonBg: 'bg-gradient-to-r from-emerald-600 to-teal-700',
    accentColor: '#ecfdf5',
    shineColor: '#a7f3d0',
    description: 'Avaliou serviços de apoio ao imigrante no Mapa Local. Disponível quando o módulo de avaliações estiver ativo.'
  }
};

const TIER_LABELS: Record<string, string> = {
  bronze: 'BRONZE',
  prata: 'PRATA',
  ouro: 'OURO',
  diamante: 'DIAMANTE',
  soberano: 'SOBERANO'
};

export const MiraBadgeSeal: React.FC<MiraBadgeSealProps> = ({
  id,
  unlocked,
  size = 'md',
  className = ''
}) => {
  const config = BADGE_CONFIGS[id] || {
    name: 'Selo MIRA',
    tier: 'bronze',
    category: 'social',
    icon: Award,
    gradient: 'from-amber-400 to-orange-500',
    outerRing: '#f59e0b',
    ribbonColor: '#78350f',
    ribbonBg: 'bg-amber-600',
    accentColor: '#ffffff',
    shineColor: '#fef3c7',
    description: 'Medalha comunitária MIRA.'
  };

  const IconComponent = config.icon;

  const sizeClasses = {
    sm: { container: 'w-14 h-16', badgeSize: 44, iconSize: 18, ribbonH: 14, text: 'text-[6px]' },
    md: { container: 'w-20 h-24 sm:w-24 sm:h-28', badgeSize: 64, iconSize: 26, ribbonH: 20, text: 'text-[8px]' },
    lg: { container: 'w-28 h-32 sm:w-32 sm:h-36', badgeSize: 88, iconSize: 36, ribbonH: 26, text: 'text-[9px]' },
    xl: { container: 'w-36 h-40 sm:w-44 sm:h-48', badgeSize: 120, iconSize: 48, ribbonH: 34, text: 'text-[11px]' }
  }[size];

  if (!unlocked) {
    return (
      <div className={`relative flex flex-col items-center justify-center ${sizeClasses.container} ${className}`}>
        <div className="relative w-full h-full flex flex-col items-center justify-center">
          {/* Locked Grey Ribbon Tails */}
          <svg className="absolute -bottom-1 w-2/3 h-6 text-slate-300 opacity-40" viewBox="0 0 60 20">
            <polygon points="10,0 22,20 30,12 38,20 50,0" fill="currentColor" />
          </svg>
          {/* Locked Disc */}
          <div className="w-[80%] h-[75%] rounded-full bg-slate-100 border-2 border-slate-200 shadow-inner flex items-center justify-center opacity-70">
            <Lock className="text-slate-400" size={sizeClasses.iconSize * 0.75} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative group flex flex-col items-center justify-center ${sizeClasses.container} ${className}`}>
      
      {/* 🔮 Background Glow Pulse */}
      <div className={`absolute inset-0 rounded-full bg-gradient-to-tr ${config.gradient} opacity-30 blur-xl group-hover:opacity-60 transition-opacity duration-500`} />

      {/* 🎗️ 3D Ribbon Tails (Hanging below the medal) */}
      <div className="absolute -bottom-2 z-0 w-3/4 flex justify-center pointer-events-none">
        <svg viewBox="0 0 100 35" className="w-full h-8 drop-shadow-md">
          {/* Left Ribbon Tail */}
          <polygon points="25,0 10,32 30,24 45,32 40,0" fill={config.ribbonColor} opacity="0.9" />
          {/* Right Ribbon Tail */}
          <polygon points="60,0 55,32 70,24 90,32 75,0" fill={config.ribbonColor} opacity="0.9" />
          {/* Ribbon Fold Highlights */}
          <polygon points="25,0 30,24 40,0" fill="#ffffff" opacity="0.2" />
          <polygon points="60,0 70,24 75,0" fill="#ffffff" opacity="0.2" />
        </svg>
      </div>

      {/* 🥇 3D Multi-Layered SVG Medal Disc */}
      <div className="relative z-10 w-full h-[85%] flex items-center justify-center transform transition-transform duration-300 group-hover:scale-105 active:scale-95">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
          <defs>
            {/* Metallic Gold/Silver Radial Gradient */}
            <radialGradient id={`goldGrad_${id}`} cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor={config.accentColor} />
              <stop offset="50%" stopColor={config.outerRing} />
              <stop offset="100%" stopColor="#1e293b" />
            </radialGradient>
            
            {/* Bevel Stroke Gradient */}
            <linearGradient id={`bevelGrad_${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="50%" stopColor={config.outerRing} />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.6" />
            </linearGradient>
          </defs>

          {/* Outer Starburst / Hexagon Gear Crest Ring */}
          <polygon 
            points="50,2 62,8 75,5 82,18 95,25 92,38 98,50 92,62 95,75 82,82 75,95 62,92 50,98 38,92 25,95 18,82 5,75 8,62 2,50 8,38 5,25 18,18 25,5 38,8" 
            fill={`url(#goldGrad_${id})`} 
            stroke={`url(#bevelGrad_${id})`} 
            strokeWidth="2.5" 
          />

          {/* Inner Raised Bevel Ring */}
          <circle cx="50" cy="50" r="38" fill="#0f172a" stroke={`url(#bevelGrad_${id})`} strokeWidth="3" />

          {/* 3D Sunburst Radial Rays */}
          {Array.from({ length: 12 }).map((_, i) => (
            <line 
              key={i} 
              x1="50" 
              y1="50" 
              x2={50 + 35 * Math.cos((i * 30 * Math.PI) / 180)} 
              y2={50 + 35 * Math.sin((i * 30 * Math.PI) / 180)} 
              stroke={config.outerRing} 
              strokeWidth="0.8" 
              opacity="0.25" 
            />
          ))}

          {/* Center Inner Disc (Dark Glass Window) */}
          <circle cx="50" cy="50" r="30" fill="url(#goldGrad_${id})" opacity="0.2" />
          <circle cx="50" cy="50" r="28" fill="#090d16" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />

          {/* Laurel Leaf Wreath SVG Arc */}
          <path d="M 28 64 A 25 25 0 0 1 72 64" fill="none" stroke={config.outerRing} strokeWidth="1.5" strokeDasharray="2,2" opacity="0.6" />

          {/* Specular Lens Reflection Arc */}
          <path d="M 26 38 A 26 26 0 0 1 74 38" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.4" strokeLinecap="round" />
        </svg>

        {/* Center Lucide Vector Icon */}
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <IconComponent 
            size={sizeClasses.iconSize} 
            style={{ color: config.accentColor }} 
            className="filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] transition-transform duration-300 group-hover:scale-110" 
          />
        </div>

        {/* Crown Accent for Sovereign & Diamond Tiers */}
        {(config.tier === 'soberano' || config.tier === 'diamante') && (
          <Crown className="absolute top-1 z-30 text-amber-300 animate-pulse drop-shadow" size={sizeClasses.iconSize * 0.45} />
        )}
      </div>

      {/* 🏷️ Banner Ribbon Tag */}
      <div className={`relative z-20 -mt-2 px-2.5 py-0.5 rounded-full ${config.ribbonBg} text-white font-black tracking-widest ${sizeClasses.text} shadow-lg border border-white/40 uppercase flex items-center gap-1`}>
        <Sparkles size={8} className="text-amber-200 animate-spin" />
        <span>{TIER_LABELS[config.tier]}</span>
      </div>
    </div>
  );
};
