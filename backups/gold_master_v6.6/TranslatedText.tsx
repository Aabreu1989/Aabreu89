import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { autoTranslateText } from '../services/geminiService';

// Global translation cache so translations are reused across renders
const translationCache: Record<string, string> = {};

interface TranslatedTextProps {
    text: string;
    language: string;
    className?: string;
    /** When true, translates to target language. When false, shows original text */
    shouldTranslate?: boolean;
    /** Persisted translations from DB */
    translations?: Record<string, string>;
    /** Optional callback to save new translations back to DB */
    onTranslationGenerated?: (translated: string) => void;
}

export const TranslatedText: React.FC<TranslatedTextProps> = ({ 
    text, 
    language, 
    className, 
    shouldTranslate = true,
    translations,
    onTranslationGenerated
}) => {
    const [translatedText, setTranslatedText] = useState<string>(text);
    const [isTranslating, setIsTranslating] = useState(false);

    useEffect(() => {
        // Only translate when explicitly asked
        if (!shouldTranslate) {
            setTranslatedText(text); // show original
            setIsTranslating(false); // Make sure we stop spinning
            return;
        }

        const langKey = language?.toUpperCase?.() || 'PT';
        
        // 1. Check DB-persisted cache (JSONB)
        if (translations && translations[langKey]) {
            setTranslatedText(translations[langKey]);
            setIsTranslating(false);
            return;
        }

        // 2. Check Memory cache
        const cacheKey = `${text}_${langKey}`;
        if (translationCache[cacheKey]) {
            setTranslatedText(translationCache[cacheKey]);
            setIsTranslating(false);
            return;
        }

        let isMounted = true;
        setIsTranslating(true);
        
        autoTranslateText(text, langKey).then(res => {
            if (isMounted) {
                if (res && res.trim() && res !== text) {
                    translationCache[cacheKey] = res;
                    setTranslatedText(res);
                    // 3. PERSIST back to DB via callback
                    if (onTranslationGenerated) {
                        onTranslationGenerated(res);
                    }
                } else {
                    setTranslatedText(text);
                }
                setIsTranslating(false);
            }
        }).catch((err) => {
            console.error("[MIRA FATAL] Translation Error:", err);
            if (isMounted) {
                setTranslatedText(text);
                setIsTranslating(false);
            }
        });

        return () => { isMounted = false; };
    }, [text, language, shouldTranslate, translations]);

    return (
        <span className={className}>
            {translatedText}
            {isTranslating && <Loader2 size={12} className="inline animate-spin ml-1 opacity-50" />}
        </span>
    );
};
