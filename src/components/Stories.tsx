import React from 'react';
import { Post } from '../types';
import { Sparkles, CheckCircle } from 'lucide-react';

interface StoriesProps {
  stories: Post[];
  onStoryClick: (id: string) => void;
}

export const Stories: React.FC<StoriesProps> = ({ stories, onStoryClick }) => {
  return (
    <div className="w-full bg-white border-b border-slate-100 py-6 px-2 sm:px-4 overflow-hidden">
      <div className="flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar items-start h-28">
        {stories.map((story) => (
          <button
            key={story.id}
            onClick={() => onStoryClick(story.id)}
            className="flex flex-col items-center gap-2 group shrink-0"
          >
            {/* Anel de Destaque Estilo Instagram (Gradiente MIRA) */}
            <div className="relative p-1 rounded-full bg-gradient-to-tr from-[#FF8C00] via-[#FFD700] to-[#FF8C00] animate-in zoom-in duration-500 shadow-lg shadow-orange-500/10 active:scale-95 transition-transform">
              <div className="p-0.5 bg-white rounded-full">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-transparent">
                  <img 
                    src={story.authorAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(story.authorName)}&background=f97316&color=fff`} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    alt={story.authorName} 
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(story.authorName)}&background=f97316&color=fff`;
                    }}
                  />
                </div>
              </div>
              
              {/* Badge de Verificado no Destaque */}
              {story.authorIsVerified && (
                <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full p-1 border-2 border-white shadow-xl">
                  <CheckCircle size={10} strokeWidth={4} />
                </div>
              )}
              
              {/* Indicador de Oficial/AIMA */}
              {story.nobelScore > 100 && (
                <div className="absolute -top-1 -right-1 bg-orange-500 text-white rounded-full p-1 border-2 border-white shadow-xl">
                  <Sparkles size={10} strokeWidth={4} />
                </div>
              )}
            </div>
            
            <span className="text-[10px] font-black uppercase tracking-tight text-slate-500 group-hover:text-[#FF8C00] transition-colors truncate w-20 text-center">
              {story.authorName.split(' ')[0]}
            </span>
          </button>
        ))}
        
        {stories.length === 0 && (
          <div className="flex gap-4 opacity-20">
             {[1,2,3,4,5].map(i => (
               <div key={i} className="flex flex-col items-center gap-2">
                 <div className="w-16 h-16 rounded-full bg-slate-200 animate-pulse" />
                 <div className="w-12 h-2 bg-slate-200 rounded animate-pulse" />
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};
