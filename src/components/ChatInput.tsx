import React, { useState, useRef, memo } from 'react';
import { Send, Loader2, Zap, Mic2 } from 'lucide-react';
import { t } from '../utils/translations';
import { audioService } from '../services/audioService';

interface ChatInputProps {
    language: string;
    isLoading: boolean;
    onSend: (text: string) => void;
    placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
    language, 
    isLoading, 
    onSend,
    placeholder
}) => {
    const [text, setText] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
    };

    const handleFocus = () => {
        // Prime audio system as soon as user interacts with the input (faster readiness) (V26.12)
        import('../services/audioService').then(({ audioService }) => audioService.prime());
    };

    const handleInternalSend = () => {
        if (!text.trim()) {
            return;
        }
        if (isLoading) {
            return;
        }
        
        try {
            // IMMEDIATE Prime the audio system on user click (MIRA V26.12)
            audioService.prime();
        } catch (e) {
            // Silent catch for audio prime
        }
        
        onSend(text);
        setText("");
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
    };

    return (
        <div data-mira-v="2026.GO-LIVE" className="bg-transparent px-3 py-3 z-[300] safe-area-bottom pointer-events-auto">
            <div className={`w-full max-w-3xl mx-auto flex items-center gap-3 bg-white/90 backdrop-blur-2xl rounded-[2rem] px-3.5 py-3 shadow-xl border transition-all duration-500 ${text.trim() ? 'border-orange-500/50 shadow-orange-500/5' : 'border-slate-200'}`}>
                <div className="flex-1 px-4 py-1 flex items-center">
                    <textarea
                        ref={textareaRef}
                        placeholder={placeholder || t('input_chat', language) || "..."}
                        className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-[15px] leading-tight max-h-32 resize-none no-scrollbar font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-black placeholder:uppercase placeholder:text-[9px] placeholder:tracking-widest"
                        rows={1}
                        value={text}
                        onChange={handleTextChange}
                        onFocus={handleFocus}
                        onKeyDown={(e) => { 
                            if (e.key === 'Enter' && !e.shiftKey) { 
                                e.preventDefault(); 
                                handleInternalSend(); 
                            } 
                        }}
                    />
                </div>

                <button
                    onClick={handleInternalSend}
                    disabled={isLoading || !text.trim()}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 flex-shrink-0 active:scale-95 shadow-lg
                        ${text.trim() 
                            ? 'bg-mira-orange text-white shadow-[0_4px_15px_rgba(255,140,0,0.4)]' 
                            : 'bg-slate-100 text-slate-400 border border-slate-200'}`}
                >
                    {isLoading ? (
                        <Loader2 size={16} className="animate-spin text-slate-400" />
                    ) : (
                        <Send size={16} className={`${text.trim() ? 'translate-x-0.5' : ''}`} />
                    )}
                </button>
            </div>
        </div>
    );
};

export default memo(ChatInput);
