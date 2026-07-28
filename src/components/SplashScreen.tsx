import React, { useEffect, useState, useRef } from 'react';
import { Volume2, VolumeX, FastForward } from 'lucide-react';

/**
 * SplashScreen V5.2
 * - Displays an 8-second video WITH audio by default.
 * - Buttons: toggle mute/audio + skip.
 * - Auto-falls back to muted if browser blocks autoplay with sound.
 */

interface SplashScreenProps {
    onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
    const [fadeOut, setFadeOut] = useState(false);
    const [isMuted, setIsMuted] = useState(false); // Audio ON by default
    const videoRef = useRef<HTMLVideoElement>(null);
    const hasStartedFadeOut = useRef(false);

    const triggerFadeOut = () => {
        if (hasStartedFadeOut.current) return;
        hasStartedFadeOut.current = true;
        setFadeOut(true);
        setTimeout(onFinish, 400);
    };

    const toggleMute = () => {
        setIsMuted(prev => {
            const next = !prev;
            if (videoRef.current) videoRef.current.muted = next;
            return next;
        });
    };

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.muted = false; // Start with audio
            videoRef.current.play().catch(() => {
                // Browser blocked autoplay with sound — fallback to muted
                setIsMuted(true);
                if (videoRef.current) {
                    videoRef.current.muted = true;
                    videoRef.current.play().catch(() => {});
                }
            });
        }

        const timer = setTimeout(triggerFadeOut, 8000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className={`fixed inset-0 z-[9999] bg-[#0A0A0A] flex items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <div className="relative w-full h-[100dvh] bg-[#0A0A0A] overflow-hidden">

                {/* Full-screen video */}
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={isMuted}
                    className="absolute inset-0 w-full h-full object-cover"
                    onEnded={triggerFadeOut}
                >
                    <source src="/splash_video.mp4" type="video/mp4" />
                </video>

                {/* Overlay gradient — bottom fade */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/60 via-transparent to-transparent pointer-events-none" />

                {/* Controls — bottom right */}
                <div className="absolute bottom-8 right-6 flex items-center gap-3 z-10">
                    {/* Audio toggle */}
                    <button
                        onClick={toggleMute}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#0A0A0A]/50 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#0A0A0A]/70 active:scale-95 transition-all shadow-xl"
                        title={isMuted ? 'Ativar Som' : 'Desativar Som'}
                    >
                        {isMuted
                            ? <><VolumeX size={16} className="text-red-400" /> <span className="hidden sm:inline">SEM SOM</span></>
                            : <><Volume2 size={16} className="text-mira-orange" /> <span className="hidden sm:inline">COM SOM</span></>
                        }
                    </button>

                    {/* Skip button */}
                    <button
                        onClick={triggerFadeOut}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#FF8C00]/90 backdrop-blur-md border border-orange-400/30 text-white text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 active:scale-95 transition-all shadow-xl shadow-orange-500/30"
                        title="Saltar Intro"
                    >
                        <FastForward size={16} />
                        <span className="hidden sm:inline">SALTAR</span>
                    </button>
                </div>

                {/* Progress bar — bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-10">
                    <div className="h-full bg-[#FF8C00] animate-progress-fast" />
                </div>

            </div>

            <style>{`
                @keyframes progress-fast {
                    0%   { width: 0%; }
                    100% { width: 100%; }
                }
                .animate-progress-fast {
                    animation: progress-fast 8s linear forwards;
                }
            `}</style>
        </div>
    );
};
