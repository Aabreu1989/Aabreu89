import React, { memo } from 'react';
import { Briefcase, MapPin, Building2, ExternalLink, Clock } from 'lucide-react';
import { JobPost } from '../types';
import { t } from '../utils/translations';
import { analytics } from '../services/analyticsService';
import { getWorkTopicKey } from '../utils/categoryUtils';

interface JobItemProps {
    job: JobPost;
    language: string;
}

const TOPIC_THEMES: Record<string, { color: string; border: string; bg: string; iconBg: string; emoji: string }> = {
  "Tecnologia, Dados & IA": { color: "text-blue-600", border: "hover:border-blue-300/80 hover:shadow-blue-500/5", bg: "bg-blue-50/50 text-blue-600 border-blue-100", iconBg: "bg-slate-50 text-blue-600 border-slate-100 group-hover:bg-blue-100/50 group-hover:border-blue-200", emoji: "💻" },
  "Saúde & Cuidados Continuados": { color: "text-emerald-600", border: "hover:border-emerald-300/80 hover:shadow-emerald-500/5", bg: "bg-emerald-50/50 text-emerald-600 border-emerald-100", iconBg: "bg-slate-50 text-emerald-600 border-slate-100 group-hover:bg-emerald-100/50 group-hover:border-emerald-200", emoji: "🩺" },
  "Construção Civil & Engenharia": { color: "text-amber-700", border: "hover:border-amber-300/80 hover:shadow-amber-500/5", bg: "bg-amber-50/50 text-amber-700 border-amber-100", iconBg: "bg-slate-50 text-amber-700 border-slate-100 group-hover:bg-amber-100/50 group-hover:border-amber-200", emoji: "🏗️" },
  "Turismo, Hotelaria & Restauração": { color: "text-orange-600", border: "hover:border-orange-300/80 hover:shadow-orange-500/5", bg: "bg-orange-50/50 text-orange-600 border-orange-100", iconBg: "bg-slate-50 text-orange-600 border-slate-100 group-hover:bg-orange-100/50 group-hover:border-orange-200", emoji: "🍽️" },
  "Indústria, Produção & Manufatura": { color: "text-violet-600", border: "hover:border-violet-300/80 hover:shadow-violet-500/5", bg: "bg-violet-50/50 text-violet-600 border-violet-100", iconBg: "bg-slate-50 text-violet-600 border-slate-100 group-hover:bg-violet-100/50 group-hover:border-violet-200", emoji: "🏭" },
  "Logística, Transportes & Armazém": { color: "text-indigo-600", border: "hover:border-indigo-300/80 hover:shadow-indigo-500/5", bg: "bg-indigo-50/50 text-indigo-600 border-indigo-100", iconBg: "bg-slate-50 text-indigo-600 border-slate-100 group-hover:bg-indigo-100/50 group-hover:border-indigo-200", emoji: "📦" },
  "Comércio, Vendas & Retalho": { color: "text-pink-600", border: "hover:border-pink-300/80 hover:shadow-pink-500/5", bg: "bg-pink-50/50 text-pink-600 border-pink-100", iconBg: "bg-slate-50 text-pink-600 border-slate-100 group-hover:bg-pink-100/50 group-hover:border-pink-200", emoji: "🛍️" },
  "Administrativo, Gestão & RH": { color: "text-slate-600", border: "hover:border-slate-300/80 hover:shadow-slate-500/5", bg: "bg-slate-50/50 text-slate-600 border-slate-100", iconBg: "bg-slate-50 text-slate-600 border-slate-100 group-hover:bg-slate-100/50 group-hover:border-slate-200", emoji: "📂" },
  "Limpeza, Segurança & Facility Management": { color: "text-zinc-600", border: "hover:border-zinc-300/80 hover:shadow-zinc-500/5", bg: "bg-zinc-50/50 text-zinc-600 border-zinc-100", iconBg: "bg-slate-50 text-zinc-600 border-slate-100 group-hover:bg-zinc-100/50 group-hover:border-zinc-200", emoji: "🧹" },
  "Agricultura, Pesca & Pecuária": { color: "text-green-600", border: "hover:border-green-300/80 hover:shadow-green-500/5", bg: "bg-green-50/50 text-green-600 border-green-100", iconBg: "bg-slate-50 text-green-600 border-slate-100 group-hover:bg-green-100/50 group-hover:border-green-200", emoji: "🚜" },
  "Artes, Design & Multimédia": { color: "text-rose-600", border: "hover:border-rose-300/80 hover:shadow-rose-500/5", bg: "bg-rose-50/50 text-rose-600 border-rose-100", iconBg: "bg-slate-50 text-rose-600 border-slate-100 group-hover:bg-rose-100/50 group-hover:border-rose-200", emoji: "🎨" },
  "Apoio Social & Terceiro Setor": { color: "text-cyan-600", border: "hover:border-cyan-300/80 hover:shadow-cyan-500/5", bg: "bg-cyan-50/50 text-cyan-600 border-cyan-100", iconBg: "bg-slate-50 text-cyan-600 border-slate-100 group-hover:bg-cyan-100/50 group-hover:border-cyan-200", emoji: "🤝" },
  "Energia & Sustentabilidade": { color: "text-yellow-700", border: "hover:border-yellow-300/80 hover:shadow-yellow-500/5", bg: "bg-yellow-50/50 text-yellow-700 border-yellow-100", iconBg: "bg-slate-50 text-yellow-700 border-slate-100 group-hover:bg-yellow-100/50 group-hover:border-yellow-200", emoji: "⚡" },
  "Trabalho Remoto & Freelancing": { color: "text-teal-600", border: "hover:border-teal-300/80 hover:shadow-teal-500/5", bg: "bg-teal-50/50 text-teal-600 border-teal-100", iconBg: "bg-slate-50 text-teal-600 border-slate-100 group-hover:bg-teal-100/50 group-hover:border-teal-200", emoji: "🏡" },
  "Outros": { color: "text-slate-500", border: "hover:border-slate-300/80 hover:shadow-slate-500/5", bg: "bg-slate-50/50 text-slate-500 border-slate-100", iconBg: "bg-slate-50 text-slate-500 border-slate-100 group-hover:bg-slate-100/50 group-hover:border-slate-200", emoji: "🌐" }
};

const formatJobTitle = (title: string): string => {
    if (!title) return "";
    const acronyms = ["PHP", "JS", "SQL", "HR", "RH", "NIF", "CSS", "HTML", "IT", "AI", "IA", "IEFP", "CNAIM", "AIMA", "CPLP", "CTT", "TAP", "CVP", "UI", "UX", "QA", "B2B", "B2C", "PWA", "CEO", "AIMA", "SEF"];
    return title
        .trim()
        .split(/\s+/)
        .map(word => {
            const upperWord = word.toUpperCase().replace(/[^A-Z0-9#+]/g, '');
            if (acronyms.includes(upperWord)) {
                return word.toUpperCase();
            }
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
};

const formatFriendlyJobDate = (rawDate: string | undefined, language: string): string => {
    if (!rawDate) return t('jobs_today', language);
    const lower = rawDate.toLowerCase();
    if (lower === 'hoje' || lower === 'today' || lower === 'hoy') {
        return t('jobs_today', language);
    }

    const parsed = new Date(rawDate);
    if (isNaN(parsed.getTime())) {
        return rawDate;
    }

    const now = new Date();
    const diffMs = now.getTime() - parsed.getTime();
    if (diffMs < 0) return t('jobs_today', language);

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 2) return language.toLowerCase() === 'en' ? 'Just now' : 'Hoje (Recente)';
    if (diffHours < 24) return `Há ${diffHours}h`;
    if (diffDays === 1) return language.toLowerCase() === 'en' ? 'Yesterday' : 'Ontem';
    if (diffDays <= 7) return `Há ${diffDays} dias`;
    if (diffDays <= 30) return `Há ${Math.floor(diffDays / 7)} sem.`;
    return `Há ${Math.floor(diffDays / 30)} mes.`;
};

const JobItem: React.FC<JobItemProps> = ({ job, language }) => {
    const theme = TOPIC_THEMES[job.workTopic || "Outros"] || TOPIC_THEMES["Outros"];
    const displayDate = formatFriendlyJobDate((job as any).posted_at || job.datePosted, language);

    const jobTags = React.useMemo(() => {
        const list = Array.isArray(job.tags) ? [...job.tags] : [];
        const lowerTitle = job.title.toLowerCase();
        
        if (lowerTitle.includes('remoto') || lowerTitle.includes('remote') || lowerTitle.includes('teletrabalho')) {
            if (!list.some(t => t.toLowerCase().includes('remot'))) list.push('Trabalho Remoto');
        }
        if (lowerTitle.includes('urgente') || lowerTitle.includes('entrada imediata')) {
            if (!list.some(t => t.toLowerCase().includes('urgente'))) list.push('Urgente');
        }
        if (lowerTitle.includes('estágio') || lowerTitle.includes('estagiário')) {
            if (!list.some(t => t.toLowerCase().includes('estág'))) list.push('Estágio');
        }

        return list.slice(0, 3);
    }, [job.tags, job.title]);

    return (
        <div
            className={`bg-white p-6 rounded-[2.2rem] shadow-sm border border-slate-200/80 ${theme.border} hover:shadow-[0_15px_40px_-15px_rgba(0,0,0,0.06)] hover:scale-[1.01] transition-all duration-300 group relative overflow-hidden cursor-pointer flex flex-col h-full`}
            onClick={() => {
                if (!job.sourceUrl || job.sourceUrl === '#') {
                    return;
                }
                analytics.track('job_click', undefined, job.workTopic, { id: job.id, title: job.title });
                
                let finalUrl = job.sourceUrl;
                if (!finalUrl.startsWith('http') && !finalUrl.startsWith('mailto:')) {
                    finalUrl = `https://${finalUrl}`;
                }
                
                window.open(finalUrl, '_blank');
            }}
        >
            <div className="flex-1">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3.5 w-full">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-300 ${theme.iconBg} group-hover:scale-110 shadow-sm`}>
                            <span className="text-xl group-hover:scale-125 transition-transform duration-300">{theme.emoji}</span>
                        </div>
                        
                        <div className="min-w-0 flex-1">
                            <h4 className="font-black text-slate-800 text-[15px] sm:text-[16px] leading-tight tracking-tight group-hover:text-slate-950 transition-colors whitespace-normal break-words">
                                {formatJobTitle(job.title)}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200/30">
                                    {job.sourceName || 'MIRA'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {jobTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {jobTags.map(tag => {
                            const isUrgent = tag.toLowerCase().includes('urgente') || tag.toLowerCase().includes('imediata');
                            const isRemote = tag.toLowerCase().includes('remot') || tag.toLowerCase().includes('teletrabalho');
                            
                            let tagStyle = "bg-slate-50 text-slate-500 border-slate-100";
                            if (isUrgent) tagStyle = "bg-red-50 text-red-600 border-red-100";
                            else if (isRemote) tagStyle = "bg-teal-50 text-teal-600 border-teal-100";
                            else if (tag.toLowerCase().includes('full') || tag.toLowerCase().includes('tempo inteiro')) tagStyle = "bg-blue-50 text-blue-600 border-blue-100";

                            return (
                                <span key={tag} className={`text-[8px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${tagStyle}`}>
                                    {tag}
                                </span>
                            );
                        })}
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-2 mb-4">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50/70 rounded-xl border border-slate-100 shadow-3xs">
                        <MapPin size={10} className="text-slate-400 group-hover:text-mira-orange transition-colors" />
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{job.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50/70 rounded-xl border border-slate-100 shadow-3xs">
                        <Building2 size={10} className="text-slate-400 group-hover:text-current transition-colors" />
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                            {t(getWorkTopicKey(job.workTopic), language)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100/60">
                <div className="flex items-center gap-1.5 text-slate-400">
                    <Clock size={10} className="text-slate-300" />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                        {displayDate}
                    </span>
                </div>
                
                <div className="p-2.5 rounded-xl text-slate-400 bg-slate-50 border border-slate-100 transition-all duration-300 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-950 group-hover:scale-105 group-hover:shadow-md">
                    <ExternalLink size={14} />
                </div>
            </div>
        </div>
    );
};

export default memo(JobItem);
