import React, { useState, useEffect } from 'react';
import { X, Mail, Copy, Check, Sparkles, ExternalLink } from 'lucide-react';
import { useToast } from './Toast';

interface SuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
  userEmail?: string;
}

const EMAIL = 'mira.app@hotmail.com';
const GMAIL_URL = `https://mail.google.com/mail/?view=cm&fs=1&to=${EMAIL}&su=${encodeURIComponent('Sugestão MIRA - Melhoria')}`;

const UI: Record<string, any> = {
  PT: {
    title: 'Sugestões & Melhorias',
    subtitle: 'Voz da Comunidade via Email',
    body: 'A tua opinião é a bússola do MIRA. Envia-nos o teu feedback diretamente para o email oficial com o assunto já configurado.',
    actionBtn: 'Abrir Email Agora',
    copyBtn: 'Copiar Endereço de Email',
    copied: 'Copiado para a área de transferência!',
    fallback: 'mira.app@hotmail.com',
    close: 'Fechar'
  },
  EN: {
    title: 'Suggestions & Improvements',
    subtitle: 'Community Voice via Email',
    body: 'Your opinion is MIRA\'s compass. Send us your feedback directly to our official email with recipient and subject pre-filled.',
    actionBtn: 'Open Email Now',
    copyBtn: 'Copy Email Address',
    copied: 'Copied to clipboard!',
    fallback: 'mira.app@hotmail.com',
    close: 'Close'
  }
};

export const SuggestionModal: React.FC<SuggestionModalProps> = ({ isOpen, onClose, language }) => {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  // Auto-redirect opcional removido para evitar bloqueadores de popups, permitindo que o clique manual do utilizador seja seguro e direto.
  useEffect(() => {
    if (isOpen) {
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const lang = (language || 'PT').toUpperCase();
  const T = UI[lang] || UI['PT'];

  const handleCopy = () => {
    navigator.clipboard.writeText(EMAIL).then(() => {
      setCopied(true);
      showToast(T.copied, 'success');
      setTimeout(() => setCopied(false), 3000);
    }).catch(() => {
      showToast('Erro ao copiar email', 'error');
    });
  };

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
      
      {/* Container Principal do Modal */}
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100 flex flex-col relative">
        
        {/* ❌ BOTÃO DE FECHAR "X" GIGANTE E ULTRA-VISÍVEL */}
        <button
          onClick={onClose}
          type="button"
          aria-label={T.close}
          className="absolute top-6 right-6 z-[5010] p-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-mira-orange rounded-full shadow-md transition-all active:scale-90 flex items-center justify-center border border-slate-200/50 group"
        >
          <X size={22} className="stroke-[3] transition-transform group-hover:rotate-90" />
        </button>

        {/* Premium Header */}
        <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] px-8 py-8 flex items-center justify-between relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-mira-orange/10 rounded-full blur-3xl -mr-16 -mt-16 animate-pulse"></div>
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-gradient-to-tr from-mira-orange to-amber-400 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">
              <Mail size={24} className="text-white drop-shadow-md" />
            </div>
            <div>
              <h2 className="text-white font-black text-lg uppercase tracking-tighter leading-none">{T.title}</h2>
              <p className="text-mira-orange text-[9px] font-black uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1.5">
                <Sparkles size={8} className="fill-mira-orange text-mira-orange animate-pulse" />
                {T.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Corpo do Modal */}
        <div className="px-8 py-8 space-y-6 flex flex-col">
          
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100/80">
            <p className="text-slate-600 text-xs font-semibold leading-relaxed tracking-tight">
              {T.body}
            </p>
          </div>

          <div className="space-y-3">
            {/* Botão de Ação Principal: Abre o Gmail Composer */}
            <a
              href={GMAIL_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="w-full py-5 bg-mira-orange text-white rounded-2xl font-black uppercase text-xs tracking-[0.15em] shadow-xl shadow-mira-orange/20 transition-all flex items-center justify-center gap-2.5 active:scale-[0.98] hover:brightness-110"
            >
              <ExternalLink size={16} className="stroke-[2.5]" />
              {T.actionBtn}
            </a>

            {/* Botão Secundário: Copia o Email */}
            <button
              onClick={handleCopy}
              className="w-full py-4.5 bg-slate-100 hover:bg-slate-150 text-slate-800 rounded-2xl font-extrabold uppercase text-[10px] tracking-[0.1em] transition-all flex items-center justify-center gap-2 active:scale-[0.98] border border-slate-200/50"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-500 stroke-[3]" />
                  <span className="text-emerald-600 font-black">{T.copied}</span>
                </>
              ) : (
                <>
                  <Copy size={14} className="text-slate-500" />
                  {T.copyBtn}
                </>
              )}
            </button>
          </div>

          {/* Email visível para confirmação visual */}
          <div className="text-center">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
              {T.fallback}
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};
