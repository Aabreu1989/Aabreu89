import React, { useState, useEffect, createContext, useContext } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = (message: string, type: ToastType = 'success') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            removeToast(id);
        }, 4000);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-20 sm:top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2.5 w-[calc(100vw-2rem)] max-w-md pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-2xl shadow-2xl border backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-300 w-full ${toast.type === 'success' ? 'bg-emerald-600/95 border-emerald-400 text-white' :
                                toast.type === 'error' ? 'bg-red-600/95 border-red-400 text-white' :
                                    toast.type === 'warning' ? 'bg-amber-600/95 border-amber-400 text-white' :
                                        'bg-blue-600/95 border-blue-400 text-white'
                            }`}
                    >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            {toast.type === 'success' && <CheckCircle size={20} className="shrink-0 text-white" />}
                            {toast.type === 'error' && <XCircle size={20} className="shrink-0 text-white" />}
                            {toast.type === 'warning' && <AlertTriangle size={20} className="shrink-0 text-white" />}
                            {toast.type === 'info' && <Info size={20} className="shrink-0 text-white" />}
                            <p className="text-xs font-black uppercase tracking-tight leading-snug break-words text-white">{toast.message}</p>
                        </div>
                        <button onClick={() => removeToast(toast.id)} className="p-1.5 hover:bg-white/20 rounded-xl transition-colors shrink-0 text-white">
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};
