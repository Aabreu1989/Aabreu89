import React from 'react';
import { 
  Star, ShieldCheck, Search, BookOpen, Diamond, ShieldAlert, 
  Scale, Flame, Heart, Award, CheckCircle2, Lock, Sparkles, Crown, Zap
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
  borderGlow: string;
  bgGlow: string;
  ribbonBg: string;
  accentColor: string;
  emojiFallback: string;
}> = {
  pioneiro: {
    name: 'Membro Pioneiro',
    tier: 'ouro',
    category: 'special',
    icon: Star,
    gradient: 'from-[#FFD700] via-[#FFA500] to-[#FF8C00]',
    borderGlow: 'border-amber-300 shadow-amber-500/50',
    bgGlow: 'from-amber-500/20 via-orange-500/10 to-amber-500/5',
    ribbonBg: 'bg-gradient-to-r from-amber-500 to-orange-600',
    accentColor: '#FFD700',
    emojiFallback: '⭐'
  },
  verificado: {
    name: 'Cidadão Verificado',
    tier: 'soberano',
    category: 'trust',
    icon: ShieldCheck,
    gradient: 'from-emerald-400 via-teal-300 to-emerald-600',
    borderGlow: 'border-emerald-300 shadow-emerald-500/50',
    bgGlow: 'from-emerald-500/20 via-teal-500/10 to-emerald-500/5',
    ribbonBg: 'bg-gradient-to-r from-emerald-600 to-teal-700',
    accentColor: '#34d399',
    emojiFallback: '✅'
  },
  curador: {
    name: 'Curador da Comunidade',
    tier: 'bronze',
    category: 'trust',
    icon: Search,
    gradient: 'from-amber-600 via-orange-500 to-amber-800',
    borderGlow: 'border-amber-500/60 shadow-amber-600/30',
    bgGlow: 'from-amber-600/20 via-orange-600/10 to-amber-600/5',
    ribbonBg: 'bg-gradient-to-r from-amber-700 to-orange-800',
    accentColor: '#d97706',
    emojiFallback: '🔍'
  },
  mestre_docs: {
    name: 'Mestre dos Documentos',
    tier: 'prata',
    category: 'help',
    icon: BookOpen,
    gradient: 'from-slate-200 via-sky-100 to-slate-400',
    borderGlow: 'border-sky-200 shadow-sky-400/40',
    bgGlow: 'from-sky-500/20 via-slate-400/10 to-sky-500/5',
    ribbonBg: 'bg-gradient-to-r from-sky-600 to-slate-700',
    accentColor: '#38bdf8',
    emojiFallback: '📚'
  },
  exemplar: {
    name: 'Cidadão Exemplar',
    tier: 'diamante',
    category: 'social',
    icon: Diamond,
    gradient: 'from-cyan-300 via-sky-200 to-indigo-500',
    borderGlow: 'border-cyan-300 shadow-cyan-400/50',
    bgGlow: 'from-cyan-500/25 via-indigo-500/10 to-cyan-500/5',
    ribbonBg: 'bg-gradient-to-r from-cyan-500 to-indigo-600',
    accentColor: '#22d3ee',
    emojiFallback: '💎'
  },
  sentinela: {
    name: 'Sentinela MIRA',
    tier: 'prata',
    category: 'trust',
    icon: ShieldAlert,
    gradient: 'from-[#FF8C00] via-orange-400 to-red-600',
    borderGlow: 'border-orange-400 shadow-orange-500/40',
    bgGlow: 'from-orange-500/20 via-red-500/10 to-orange-500/5',
    ribbonBg: 'bg-gradient-to-r from-orange-600 to-red-700',
    accentColor: '#fb923c',
    emojiFallback: '🛡️'
  },
  especialista_leis: {
    name: 'Especialista em Leis',
    tier: 'ouro',
    category: 'help',
    icon: Scale,
    gradient: 'from-amber-300 via-yellow-400 to-amber-600',
    borderGlow: 'border-amber-300 shadow-amber-500/50',
    bgGlow: 'from-amber-500/20 via-yellow-500/10 to-amber-500/5',
    ribbonBg: 'bg-gradient-to-r from-amber-600 to-yellow-600',
    accentColor: '#fbbf24',
    emojiFallback: '📖'
  },
  mentor_emprego: {
    name: 'Mentor de Emprego',
    tier: 'ouro',
    category: 'help',
    icon: Flame,
    gradient: 'from-rose-400 via-orange-400 to-amber-500',
    borderGlow: 'border-rose-400 shadow-rose-500/50',
    bgGlow: 'from-rose-500/20 via-orange-500/10 to-rose-500/5',
    ribbonBg: 'bg-gradient-to-r from-rose-600 to-orange-600',
    accentColor: '#fb7185',
    emojiFallback: '🔥'
  },
  coracao: {
    name: 'Coração da Tribo',
    tier: 'bronze',
    category: 'social',
    icon: Heart,
    gradient: 'from-pink-400 via-rose-400 to-rose-600',
    borderGlow: 'border-pink-300 shadow-pink-500/40',
    bgGlow: 'from-pink-500/20 via-rose-500/10 to-pink-500/5',
    ribbonBg: 'bg-gradient-to-r from-pink-600 to-rose-700',
    accentColor: '#f472b6',
    emojiFallback: '❤️'
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
    borderGlow: 'border-amber-300 shadow-amber-500/30',
    bgGlow: 'from-amber-500/10 to-transparent',
    ribbonBg: 'bg-amber-600',
    accentColor: '#f59e0b',
    emojiFallback: '🏅'
  };

  const IconComponent = config.icon;

  const sizeClasses = {
    sm: { container: 'w-12 h-12', iconSize: 18, border: 'border-2', ribbonText: 'text-[6px]' },
    md: { container: 'w-16 h-16 sm:w-20 sm:h-20', iconSize: 26, border: 'border-[3px]', ribbonText: 'text-[7px]' },
    lg: { container: 'w-24 h-24 sm:w-28 sm:h-28', iconSize: 36, border: 'border-4', ribbonText: 'text-[8px]' },
    xl: { container: 'w-32 h-32 sm:w-36 sm:h-36', iconSize: 48, border: 'border-4', ribbonText: 'text-[9px]' }
  }[size];

  if (!unlocked) {
    return (
      <div className={`relative flex flex-col items-center justify-center ${sizeClasses.container} ${className}`}>
        <div className="absolute inset-0 rounded-3xl bg-slate-100 border border-slate-200/80 shadow-inner flex items-center justify-center opacity-60">
          <Lock className="text-slate-400 opacity-50" size={sizeClasses.iconSize * 0.8} />
        </div>
      </div>
    );
  }

  return (
    <div className={`relative group flex items-center justify-center ${sizeClasses.container} ${className}`}>
      {/* Ambient Pulsing Glow Backdrop */}
      <div 
        className={`absolute inset-0 rounded-3xl bg-gradient-to-tr ${config.gradient} opacity-40 blur-lg transition-opacity duration-500 group-hover:opacity-75`}
      />

      {/* Main 3D Medal Base Shield */}
      <div className={`relative w-full h-full rounded-[1.8rem] sm:rounded-[2.2rem] bg-gradient-to-tr ${config.gradient} p-0.5 ${sizeClasses.border} border-white shadow-xl shadow-amber-500/10 overflow-hidden transform transition-all duration-300 group-hover:scale-105 active:scale-95 flex items-center justify-center`}>
        
        {/* Glassmorphism Inner Lens */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-black/30 pointer-events-none" />

        {/* Outer Bevel Ring with Laurel Wreath SVG accent */}
        <div className="w-[86%] h-[86%] rounded-[1.4rem] sm:rounded-[1.8rem] bg-slate-950/85 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center relative shadow-inner p-1">
          
          {/* Inner Golden Radial Sunburst */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,215,0,0.15)_0%,transparent_70%)] pointer-events-none" />

          {/* Crown Accent for Sovereign / Diamond badges */}
          {(config.tier === 'soberano' || config.tier === 'diamante') && (
            <Crown className="absolute top-1 text-amber-300 animate-pulse" size={sizeClasses.iconSize * 0.45} />
          )}

          {/* Center Vector Icon */}
          <div className="relative z-10 drop-shadow-[0_2px_10px_rgba(255,215,0,0.5)] transition-transform duration-300 group-hover:scale-110">
            <IconComponent 
              size={sizeClasses.iconSize} 
              style={{ color: config.accentColor }} 
              className="filter drop-shadow"
            />
          </div>

          {/* Laurel Leaf SVG Flourish at Bottom */}
          <svg className="absolute bottom-1 w-3/4 opacity-60 text-amber-300" viewBox="0 0 100 20" fill="currentColor">
            <path d="M10,10 Q30,0 50,10 Q70,0 90,10 Q70,20 50,10 Q30,20 10,10 Z" opacity="0.3" />
          </svg>
        </div>

        {/* Tier Ribbon Label Badge */}
        <div className={`absolute bottom-0.5 px-2 py-0.5 rounded-full ${config.ribbonBg} text-white font-black tracking-widest ${sizeClasses.ribbonText} shadow-md uppercase border border-white/30`}>
          {TIER_LABELS[config.tier]}
        </div>
      </div>
    </div>
  );
};
