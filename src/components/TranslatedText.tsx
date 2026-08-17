import React, { useState, useEffect } from 'react';
import { autoTranslateText } from '../services/geminiService';
import { t } from '../utils/translations';
import { Loader2 } from 'lucide-react';

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
    language = 'PT', 
    className, 
    shouldTranslate = false,
    translations,
    onTranslationGenerated
}) => {
    const [translatedText, setTranslatedText] = useState<string>(text);
    const [isTranslating, setIsTranslating] = useState(false);

    useEffect(() => {
        const dictTranslation = t(text, language);
        if (dictTranslation && dictTranslation !== text) {
            setTranslatedText(dictTranslation);
            setIsTranslating(false);
            return;
        }

        // Se a tradução não foi explicitamente solicitada/ativada
        if (!shouldTranslate) {
            setTranslatedText(text);
            setIsTranslating(false);
            return;
        }

        const langKey = (language || 'PT').toUpperCase().split('-')[0];

        // 1. Verificar cache persistido na base de dados (JSONB translations)
        if (translations && translations[langKey]) {
            setTranslatedText(translations[langKey]);
            setIsTranslating(false);
            return;
        }

        // 2. Verificar cache em memória
        const cacheKey = `${text}_${langKey}`;
        if (translationCache[cacheKey]) {
            setTranslatedText(translationCache[cacheKey]);
            setIsTranslating(false);
            return;
        }

        let isMounted = true;
        setIsTranslating(true);
        
        // 🛡️ Limite de tempo de segurança (10s)
        const timer = setTimeout(() => {
            if (isMounted && isTranslating) {
                console.warn("🌍 [MIRA]: Timeout na tradução. A exibir texto original.");
                setIsTranslating(false);
                setTranslatedText(text);
            }
        }, 10000);

        autoTranslateText(text, langKey).then(res => {
            clearTimeout(timer);
            if (isMounted) {
                if (res && res.trim() && res !== text) {
                    translationCache[cacheKey] = res;
                    setTranslatedText(res);
                    // Persistir no banco de dados para os próximos utilizadores
                    if (onTranslationGenerated) {
                        onTranslationGenerated(res);
                    }
                } else {
                    setTranslatedText(text);
                }
                setIsTranslating(false);
            }
        }).catch((err) => {
            clearTimeout(timer);
            console.error("[MIRA] Erro na tradução:", err);
            if (isMounted) {
                setTranslatedText(text);
                setIsTranslating(false);
            }
        });

        return () => { 
            isMounted = false; 
            clearTimeout(timer);
        };
    }, [text, language, shouldTranslate, translations]);

    if (isTranslating) {
        return (
            <span className={`inline-flex items-center gap-1.5 opacity-80 italic ${className || ''}`}>
                <Loader2 size={13} className="animate-spin text-[#FF8C00] shrink-0" />
                <span>{language === 'EN' ? 'Translating...' : language === 'ES' ? 'Traduciendo...' : language === 'FR' ? 'Traduction...' : 'A traduzir...'}</span>
            </span>
        );
    }

    return (
        <span className={className}>
            {translatedText}
        </span>
    );
};
