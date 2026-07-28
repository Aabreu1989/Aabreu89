import React from 'react';

interface Story {
  id: string;
  authorName: string;
  authorAvatar: string;
  isOfficial?: boolean;
  hasUpdate?: boolean;
}

interface StoriesProps {
  stories: Story[];
  onStoryClick: (id: string) => void;
}

export const Stories: React.FC<StoriesProps> = ({ stories, onStoryClick }) => {
  return (
    <div className="flex gap-4 overflow-x-auto no-scrollbar py-6 px-4 bg-[#001F3F]/95 backdrop-blur-xl border-b border-white/5 scroll-smooth">
      {stories.map((story) => (
        <div 
          key={story.id} 
          onClick={() => onStoryClick(story.id)}
          className="flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-transform shrink-0 group"
        >
          <div className={`relative p-[3px] rounded-full transition-all ${
            story.hasUpdate 
            ? 'bg-gradient-to-tr from-[#f97316] via-[#facc15] to-[#f97316] animate-pulse shadow-[0_0_15px_#f97316]' 
            : 'bg-white/10'
          }`}>
            <div className="bg-[#001F3F] rounded-full p-[2px]">
              <img 
                src={story.authorAvatar} 
                className="w-16 h-16 rounded-full object-cover border-2 border-transparent group-hover:border-white/20 transition-all" 
                alt={story.authorName} 
              />
            </div>
            {story.isOfficial && (
              <div className="absolute -bottom-1 -right-1 bg-mira-orange text-white p-1 rounded-full border-2 border-black shadow-lg scale-90">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            )}
          </div>
          <span className={`text-[9px] font-extrabold uppercase tracking-tighter truncate max-w-[80px] ${
            story.hasUpdate ? 'text-white' : 'text-white/40'
          }`}>
            {story.authorName}
          </span>
        </div>
      ))}
    </div>
  );
};
