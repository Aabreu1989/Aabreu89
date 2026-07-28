import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCcw, AlertTriangle, Home } from 'lucide-react';
import { MIRA_LOGO } from '../constants';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
    public state: State;
    public props: Props;

    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    public static getDerivedStateFromError(_: Error): State {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center font-['Plus_Jakarta_Sans']">
                    <div className="relative mb-8">
                        <div className="w-16 h-16 bg-mira-blue/5 rounded-2xl flex items-center justify-center text-mira-blue animate-pulse">
                            <RefreshCcw size={32} className="animate-spin duration-[3000ms]" />
                        </div>
                    </div>

                    <div className="max-w-md space-y-4">
                        <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Sincronizando Motor MIRA...</h1>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest leading-relaxed">
                            A estabilizar ligação segura e limpando cache.
                        </p>

                        <div className="flex justify-center pt-8">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-8 py-3 bg-slate-100 text-slate-500 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2"
                            >
                                Reconnect Now
                            </button>
                        </div>
                    </div>

                    {/* Manual reload only to prevent infinite refresh loops */}
                </div>
            );
        }

        return this.props.children;
    }
}
