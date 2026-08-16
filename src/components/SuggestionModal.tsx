import React, { useState, useEffect } from 'react';
import { X, Mail, Copy, Check, Sparkles, ExternalLink, Send, MessageSquarePlus, CheckCircle2, Loader2 } from 'lucide-react';
import { useToast } from './Toast';
import { submitSuggestion } from '../services/reportService';
import { analytics } from '../services/analyticsService';

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
    title: 'Voz da Comunidade',
    subtitle: 'Sugestões & Melhorias da Plataforma',
    tabInApp: 'Escrever na App',
    tabEmail: 'Via Email',
    subjectLabel: 'Assunto / Categoria',
    subjectPlaceholder: 'Ex: Nova funcionalidade, Melhoria no Chat IA, etc.',
    contentLabel: 'A tua sugestão para melhorar o MIRA',
    contentPlaceholder: 'Explica o que está a faltar ou como podemos melhorar a plataforma...',
    submitBtn: 'Enviar Sugestão',
    sending: 'A enviar...',
    successTitle: 'Sugestão Enviada!',
    successDesc: 'Obrigado por ajudar a construir o MIRA! A tua sugestão foi registada com sucesso.',
    emailBody: 'Preferes enviar por email? Podes falar diretamente com a equipa de desenvolvimento.',
    actionBtn: 'Abrir Gmail Agora',
    copyBtn: 'Copiar Endereço de Email',
    copied: 'Copiado para a área de transferência!',
    fallback: 'mira.app@hotmail.com',
    close: 'Fechar'
  },
  EN: {
    title: 'Community Voice',
    subtitle: 'Platform Suggestions & Improvements',
    tabInApp: 'Write in App',
    tabEmail: 'Via Email',
    subjectLabel: 'Subject / Category',
    subjectPlaceholder: 'E.g., New feature, AI Chat improvement, etc.',
    contentLabel: 'Your suggestion to improve MIRA',
    contentPlaceholder: 'Explain what is missing or how we can improve the platform...',
    submitBtn: 'Submit Suggestion',
    sending: 'Submitting...',
    successTitle: 'Suggestion Submitted!',
    successDesc: 'Thank you for helping build MIRA! Your suggestion was recorded successfully.',
    emailBody: 'Prefer sending via email? You can message the development team directly.',
    actionBtn: 'Open Gmail Now',
    copyBtn: 'Copy Email Address',
    copied: 'Copied to clipboard!',
    fallback: 'mira.app@hotmail.com',
    close: 'Close'
  },
  ES: {
    title: 'Voz de la Comunidad',
    subtitle: 'Sugerencias y Mejoras de la Plataforma',
    tabInApp: 'Escribir en la App',
    tabEmail: 'Por Email',
    subjectLabel: 'Asunto / Categoría',
    subjectPlaceholder: 'Ej: Nueva función, Mejora del Chat IA, etc.',
    contentLabel: 'Tu sugerencia para mejorar MIRA',
    contentPlaceholder: 'Explica qué falta o cómo podemos mejorar la plataforma...',
    submitBtn: 'Enviar Sugerencia',
    sending: 'Enviando...',
    successTitle: '¡Sugerencia Enviada!',
    successDesc: '¡Gracias por ayudar a construir MIRA! Tu sugerencia se ha registrado con éxito.',
    emailBody: '¿Prefieres enviar por email? Puedes escribir directamente al equipo.',
    actionBtn: 'Abrir Gmail Ahora',
    copyBtn: 'Copiar Correo Electrónico',
    copied: '¡Copiado al portapapeles!',
    fallback: 'mira.app@hotmail.com',
    close: 'Cerrar'
  },
  FR: {
    title: 'Voix de la Communauté',
    subtitle: 'Suggestions et Améliorations de la Plateforme',
    tabInApp: 'Écrire dans l\'App',
    tabEmail: 'Par Email',
    subjectLabel: 'Sujet / Catégorie',
    subjectPlaceholder: 'Ex : Nouvelle fonctionnalité, Amélioration du Chat IA, etc.',
    contentLabel: 'Votre suggestion pour améliorer MIRA',
    contentPlaceholder: 'Expliquez ce qui manque ou comment nous pouvons améliorer la plateforme...',
    submitBtn: 'Envoyer la Suggestion',
    sending: 'Envoi en cours...',
    successTitle: 'Suggestion Envoyée !',
    successDesc: 'Merci d\'aider à construire MIRA ! Votre suggestion a été enregistrée avec succès.',
    emailBody: 'Vous préférez envoyer par email ? Vous pouvez écrire directement à l\'équipe.',
    actionBtn: 'Ouvrir Gmail Maintenant',
    copyBtn: 'Copier l\'Adresse Email',
    copied: 'Copié dans le presse-papier !',
    fallback: 'mira.app@hotmail.com',
    close: 'Fermer'
  }
};

export const SuggestionModal: React.FC<SuggestionModalProps> = ({ isOpen, onClose, language, userEmail }) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'in_app' | 'email'>('in_app');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCopied(false);
      setIsSubmitted(false);
      setSubject('');
      setContent('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const lang = (language || 'PT').toUpperCase();
  const T = UI[lang] || UI['PT'];

  const handleSubmitInApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      showToast('Por favor escreve a tua sugestão.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitSuggestion({
        subject: subject.trim() || 'Sugestão da Comunidade',
        content: content.trim(),
        email: userEmail
      });
      setIsSubmitted(true);
      analytics.track('suggestion_submitted', 'community', 'sugestao_plataforma', { subject });
      showToast(T.successTitle, 'success');
    } catch (err: any) {
      showToast('Erro ao submeter sugestão. Tenta por email.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100 flex flex-col relative max-h-[90vh]">
        
        {/* ❌ BOTÃO DE FECHAR */}
        <button
          onClick={onClose}
          type="button"
          aria-label={T.close}
          className="absolute top-6 right-6 z-[5010] p-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-orange-500 rounded-full shadow-md transition-all active:scale-90 flex items-center justify-center border border-slate-200/50 group"
        >
          <X size={20} className="stroke-[3] transition-transform group-hover:rotate-90" />
        </button>

        {/* Premium Header */}
        <div className="bg-gradient-to-br from-[#0f172a] to-[#1e293b] px-8 py-7 flex items-center justify-between relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-16 -mt-16 animate-pulse"></div>
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-gradient-to-tr from-orange-500 to-amber-400 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3">
              <MessageSquarePlus size={24} className="text-white drop-shadow-md" />
            </div>
            <div>
              <h2 className="text-white font-black text-lg uppercase tracking-tighter leading-none">{T.title}</h2>
              <p className="text-orange-400 text-[9px] font-black uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1.5">
                <Sparkles size={8} className="fill-orange-400 text-orange-400 animate-pulse" />
                {T.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Abas de Escolha */}
        <div className="flex border-b border-slate-100 bg-slate-50/70 p-1.5 gap-1.5">
          <button
            onClick={() => setActiveTab('in_app')}
            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === 'in_app' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {T.tabInApp}
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === 'email' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            {T.tabEmail}
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="px-7 py-6 overflow-y-auto space-y-4">
          
          {activeTab === 'in_app' && !isSubmitted && (
            <form onSubmit={handleSubmitInApp} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  {T.subjectLabel}
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={T.subjectPlaceholder}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400/40"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">
                  {T.contentLabel} *
                </label>
                <textarea
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={T.contentPlaceholder}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400/40 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !content.trim()}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>{T.sending}</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>{T.submitBtn}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {activeTab === 'in_app' && isSubmitted && (
            <div className="py-8 text-center space-y-3 animate-in zoom-in-95">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">{T.successTitle}</h3>
              <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">{T.successDesc}</p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all"
              >
                {T.close}
              </button>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-slate-600 text-xs font-semibold leading-relaxed">
                  {T.emailBody}
                </p>
              </div>

              <a
                href={GMAIL_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black uppercase text-xs tracking-wider shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98] hover:brightness-110"
              >
                <ExternalLink size={16} />
                {T.actionBtn}
              </a>

              <button
                onClick={handleCopy}
                className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-extrabold uppercase text-[10px] tracking-wider transition-all flex items-center justify-center gap-2 active:scale-[0.98] border border-slate-200/50"
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

              <div className="text-center pt-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                  {T.fallback}
                </span>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
