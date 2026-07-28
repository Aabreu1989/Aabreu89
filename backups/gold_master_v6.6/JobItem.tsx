import React, { memo } from 'react';
import { Briefcase, MapPin, Building2, ExternalLink } from 'lucide-react';
import { JobPost } from '../types';
import { t } from '../utils/translations';
import { analytics } from '../services/analyticsService';

interface JobItemProps {
    job: JobPost;
    language: string;
}

const JobItem: React.FC<JobItemProps> = ({ job, language }) => {
    return (
        <div
            className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-mira-blue/20 hover:border-mira-blue hover:shadow-mira-blue/5 transition-all group relative overflow-hidden cursor-pointer flex flex-col h-full"
            onClick={() => {
                analytics.track('job_click', undefined, job.workTopic, { id: job.id, title: job.title });
                window.open(job.sourceUrl, '_blank');
            }}
        >
            <div className="flex-1">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-[#FF8C00] border border-slate-100 group-hover:scale-110 transition-transform">
                            <Briefcase size={22} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h4 className="font-black text-slate-800 text-[15px] sm:text-lg leading-tight tracking-tight uppercase group-hover:text-[#FF8C00] transition-colors whitespace-normal break-words">
                                {job.title}
                            </h4>
                            <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest">{job.sourceName}</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                        <MapPin size={10} className="text-[#FF8C00]" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{job.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                        <Building2 size={10} className="text-[#FFD700]" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{job.workTopic}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                        {t('jobs_published_ago', language)} {job.datePosted}
                    </span>
                </div>
                <div className="bg-slate-50 text-[#FF8C00] p-2.5 rounded-xl group-hover:bg-[#FF8C00] group-hover:text-white transition-colors border border-slate-100">
                    <ExternalLink size={16} />
                </div>
            </div>
        </div>
    );
};

export default memo(JobItem);
