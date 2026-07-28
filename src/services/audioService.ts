export const audioService = {
    /**
     * Get available voices
     */
    getVoices: () => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
        
        // MIRA V26.12: Force load voices
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
            // Some browsers require a dummy call to trigger voice list population
            const dummy = new SpeechSynthesisUtterance('');
            window.speechSynthesis.speak(dummy);
            window.speechSynthesis.cancel();
        }
        return voices;
    },

    /**
     * MIRA Chrome Mobile Safety: keep synthesis engine alive
     */
    initChromeSafety: () => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
        if ((window as any)._mira_chrome_safety_active) return;
        
        (window as any)._mira_chrome_safety_active = true;
        
        // MIRA V26.14: AudioContext persistent unlock (High-End Gesture Bridge)
        const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
           try {
               const ctx = new AudioCtx();
               (window as any)._mira_audio_ctx = ctx;
           } catch (e) {
           }
        }

        // MIRA V26.80: Persistent AudioContext is enough to keep the "gate" open.
        // We removed the aggressive pause/resume interval that caused repetitions.
    },

    /**
     * Speak text in a specific language using Web Speech API
     * @param text The text to read
     * @param lang Language code ('PT', 'EN', 'ES', 'FR')
     */
    speak: (text: string, lang: string, voiceURI?: string, onStart?: () => void, onEnd?: () => void) => {
        if (!('speechSynthesis' in window)) {
            if (onEnd) onEnd();
            return;
        }
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
            window.speechSynthesis.cancel();
        }
        
        window.speechSynthesis.cancel();
        (window as any)._mira_speech_utterance = null; // V26.90: Clean session reference for browser audio
        
        setTimeout(() => {
            if (window.speechSynthesis.paused) window.speechSynthesis.resume();
        }, 40); // Increased buffer to 40ms to ensure engine clears completely before new session


 
        // V26.49: SESSION GUARD (Prevents Overlap & Persistent Repetition)
        const speakSessionId = Date.now() + Math.random();
        (window as any)._mira_active_speak_id = speakSessionId;

        // V26.48: ROBUST CHUNKING (Prevents Browser Truncation & Silence)
        // Split by punctuation first, but then ensure no chunk exceeds 160 characters
        const crudeChunks = text.match(/[^.!?]+[.!?]*|[\s\S]+/g)?.filter(c => c.trim().length > 0) || [text];
        const chunks: string[] = [];
        crudeChunks.forEach(c => {
            if (c.length <= 160) {
                chunks.push(c);
            } else {
                // Split long punctuation-less segments by words
                const words = c.split(' ');
                let current = '';
                words.forEach(w => {
                    if ((current + ' ' + w).length <= 160) {
                        current += (current ? ' ' : '') + w;
                    } else {
                        if (current) chunks.push(current);
                        current = w;
                    }
                });
                if (current) chunks.push(current);
            }
        });
        let currentChunkIndex = 0;
        let isMovingToNext = false;

        const initializeSpeech = () => {
            setTimeout(() => {
                const speakNext = () => {
                    // SESSION ABORT CHECK: If a new session started, kill this one immediately
                    if ((window as any)._mira_active_speak_id !== speakSessionId) {
                        return;
                    }

                    if (currentChunkIndex >= chunks.length) {
                        if (onEnd) onEnd();
                        return;
                    }

                    const chunkText = chunks[currentChunkIndex].trim();
                    if (!chunkText) {
                        currentChunkIndex++;
                        speakNext();
                        return;
                    }

                    const utterance = new SpeechSynthesisUtterance(chunkText);
                    (window as any)._mira_speech_utterance = utterance; // V26.85: Prevents GC Cutoff
                    isMovingToNext = false;

                    const locales: { [key: string]: string } = {
                        'PT': 'pt-PT', 'EN': 'en-US', 'ES': 'es-ES', 'FR': 'fr-FR'
                    };

                    let targetLocale = locales[lang] || 'pt-PT';
                    utterance.lang = targetLocale;
                    utterance.rate = 1.05; // MIRA v26.1: Slightly faster for momentum
                    utterance.pitch = 0.94; // MIRA Signature Pitch

                    const voices = window.speechSynthesis.getVoices();
                    if (voices.length > 0) {
                        const maleKeywords = [
                            'thomas', 'daniel', 'marcus', 'leo', 'antonio', 'rafael', 'miguel', 'rui', 'paul', 'henri', 'andrew', 'brian', 'guy', 'masculino', 'male', 'man', 'peter', 'david', 'joao', 'helio', 'diogo',
                            'lionel', 'jean', 'pierre', 'nicolas', 'jorge', 'sergio', 'pablo', 'diego', 'ricardo', 'fabio', 'marco', 'vitor', 'hugo', 'nuno', 'pedro', 'goncalo', 'tiago', 'christopher', 'oscar', 'julio',
                            'roberto', 'alvaro', 'vicente', 'manuel', 'joaquim', 'fernando', 'bernardo', 'filipe', 'andre', 'gabriel', 'mateus', 'lucas', 'duarte', 'vasco'
                        ];
                        let preferredVoice = voices.find(v => {
                            if (!v.lang.startsWith(targetLocale.split('-')[0])) return false;
                            const nameLower = v.name.toLowerCase();
                            return maleKeywords.some(kw => nameLower.includes(kw));
                        });
                        if (!preferredVoice) preferredVoice = voices.find(v => v.lang.startsWith(targetLocale.split('-')[0]));
                        if (preferredVoice) {
                            utterance.voice = preferredVoice;
                            utterance.lang = preferredVoice.lang;
                        }
                    }

                    utterance.onstart = () => { 
                        if ((window as any)._mira_active_speak_id !== speakSessionId) {
                            window.speechSynthesis.cancel();
                            return;
                        }
                        if (currentChunkIndex === 0 && onStart) onStart(); 
                    };
                    utterance.onend = () => {
                        if (isMovingToNext) return;
                        isMovingToNext = true;
                        
                        if ((window as any)._mira_active_speak_id !== speakSessionId) return;

                        currentChunkIndex++;
                        // Incremented delay (100ms) for browser voice buffer release (V26.90 Fix)
                        setTimeout(speakNext, 100);
                    };
                    utterance.onerror = (e) => {
                        if (isMovingToNext) return;
                        isMovingToNext = true;

                        // If it's a 'cancelled' error from a new session, just stop
                        if (e.error === 'interrupted' || e.error === 'canceled') return;
                        
                        currentChunkIndex++;
                        setTimeout(speakNext, 50);
                    };

                    utterance.volume = 1;
                    window.speechSynthesis.speak(utterance);
                };

                speakNext();
            }, 50);
        };

        // V26.21: Add a "Wake Up" utterance for the synthesis engine
        const wakeUp = new SpeechSynthesisUtterance('');
        wakeUp.volume = 0;
        window.speechSynthesis.speak(wakeUp);

        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
            const dummy = new SpeechSynthesisUtterance(' ');
            dummy.volume = 0;
            window.speechSynthesis.speak(dummy);
            window.speechSynthesis.onvoiceschanged = () => {
                initializeSpeech();
                window.speechSynthesis.onvoiceschanged = null;
            };
            setTimeout(() => {
                if (window.speechSynthesis.onvoiceschanged) {
                    initializeSpeech();
                    window.speechSynthesis.onvoiceschanged = null;
                }
            }, 500);
        } else {
            initializeSpeech();
        }
    },

    /**
     * Stop all current speech
     */
    stop: () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            // MIRA V26.85: Engine Kick
            if (window.speechSynthesis.paused) window.speechSynthesis.resume();
        }
        // Also stop any HTML5 audio
        const existingAudios = document.querySelectorAll('audio.mira-playback');
        existingAudios.forEach(a => {
            (a as HTMLAudioElement).pause();
            a.remove();
        });
    },

    /**
     * Play base64 audio string (from Gemini TTS)
     */
    playBase64: (base64: string, onStart?: () => void, onEnd?: () => void) => {
        try {
            audioService.stop();
            const source = base64.startsWith('data:') ? base64 : `data:audio/mpeg;base64,${base64}`;
            const audio = new Audio(source);
            audio.className = 'mira-playback';
            
            audio.onplay = () => { if (onStart) onStart(); };
            audio.onended = () => { 
                if (onEnd) onEnd(); 
                audio.remove();
            };
            audio.onerror = (e) => {
                if (onEnd) onEnd();
            };
            
            document.body.appendChild(audio);
            audio.play().catch(err => {
                if (onEnd) onEnd();
            });
        } catch (e) {
            if (onEnd) onEnd();
        }
    },

    /**
     * Prime the voice engine on user gesture to avoid activation issues
     */
    prime: () => {
        if (typeof window === 'undefined') return;

        try {
            // MIRA V26.14: Resume AudioContext on gesture
            const ctx = (window as any)._mira_audio_ctx;
            if (ctx && ctx.state === 'suspended') {
            }

            // Prime Web Speech with an empty but valid utterance
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                const dummy = new SpeechSynthesisUtterance(' ');
                dummy.volume = 0.001; // Tiny volume instead of 0 to be more "convincing"
                dummy.rate = 10;
                window.speechSynthesis.speak(dummy);
            }
            
            // Prime HTML5 Audio with a real silent buffer
            // Using a shared singleton audio object to keep the "gate" open
            if (!(window as any)._mira_audio_unlocked) {
                const silent = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA== ");
                silent.play().then(() => {
                    (window as any)._mira_audio_unlocked = true;
                }).catch(() => {
                });
            }
        } catch (e) {
        }
    },

    /**
     * Play a subtle UI interaction click
     */
    playClick: () => {
        try {
            const click = new Audio("data:audio/wav;base64,UklGRjIAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YRAAAAAAAAAAAAAAAAD//wEA");
            click.volume = 0.2;
            click.play().catch(() => {});
        } catch (e) {
            // Passive failure
        }
    }
};
