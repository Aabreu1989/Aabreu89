
import React, { useState, useMemo } from 'react';
import {
    DocumentTask, DocumentTemplate, ChatSession, GeneratedDocument, CATEGORIES, UNIFIED_CATEGORIES, UnifiedCategory, ViewType
} from '../types';
import {
    CheckCircle2, FileText, ChevronRight, ArrowLeft, Loader2,
    Search, X, Download, FileSignature, Compass,
    RefreshCcw, Lightbulb, Filter, ChevronDown, PenTool, Info, Scale, Briefcase, Bot,
    Car, Home, Landmark
} from 'lucide-react';
import { generateOfficialPDF, generateGuidePDF } from '../utils/pdfGenerator';
import { analytics } from '../services/analyticsService';
import { t } from '../utils/translations';
import { supabase } from '../lib/supabase';
import { MIRA_PHOTO_URL } from '../constants';
import { templates, serviceGuides } from '../utils/documentsDatabase';
import { normalizeCategory, getCategoryIcon } from '../utils/categoryUtils';
import { RegularizationWizard } from './RegularizationWizard';
import { CitizenshipWizard } from './CitizenshipWizard';
import { EntrepreneurWizard } from './EntrepreneurWizard';
import { RevalidationWizard } from './RevalidationWizard';
import { NifWizard } from './NifWizard';
import { NissWizard } from './NissWizard';
import { UtenteSnsWizard } from './UtenteSnsWizard';
import { DrivingLicenseWizard } from './DrivingLicenseWizard';
import { AccommodationWizard } from './AccommodationWizard';
import { BankWizard } from './BankWizard';
import { MetroCardWizard } from './MetroCardWizard';
import { IrsWizard } from './IrsWizard';
import { RetirementWizard } from './RetirementWizard';
import { useToast } from './Toast';
import { TranslatedText } from './TranslatedText';

interface DocumentAssistantProps {
    tasks: DocumentTask[];
    chatSessions: ChatSession[];
    drafts: any[];
    setDrafts: (drafts: any[]) => void;
    history: GeneratedDocument[];
    addToHistory: (doc: GeneratedDocument) => void;
    onOpenSession: (sessionId: string) => void;
    onToggleTask: (id: string) => void;
    onEarnPoints: (points: number, badgeId?: string) => void;
    onViewChange: (view: ViewType, params?: any) => void;
    language: string;
    initialTab?: 'regularize' | 'docs' | 'wizard' | 'services' | 'visa_job_search' | 'retirement' | 'accommodation' | 'nif' | 'irs' | 'niss' | 'utente' | 'driving' | 'bank' | 'metro' | string;
    initialSearch?: string;
    initialTemplateId?: string;
    initialGuideId?: string;
    initialArticleId?: string;
}

export const DocumentAssistant: React.FC<DocumentAssistantProps> = ({
    tasks,
    chatSessions,
    drafts,
    setDrafts,
    history,
    addToHistory,
    onOpenSession,
    onToggleTask,
    onEarnPoints,
    onViewChange,
    language,
    initialTab,
    initialSearch,
    initialTemplateId,
    initialGuideId,
    initialArticleId
}) => {
    const { showToast } = useToast();
    const lang = language?.toLowerCase() || 'pt';
    const [activeScreen, setActiveScreen] = useState<'menu' | 'gallery' | 'form' | 'success' | 'guide_view' | 'regularize' | 'citizenship' | 'entrepreneur' | 'revalidation' | 'nif' | 'niss' | 'utente' | 'driving' | 'accommodation' | 'bank' | 'metro' | 'irs' | 'retirement_local'>(
        initialTab === 'irs' ? 'irs' :
        initialTab === 'niss' ? 'niss' :
        initialTab === 'nif' ? 'nif' :
        initialTab === 'utente' ? 'utente' :
        initialTab === 'driving' ? 'driving' :
        initialTab === 'bank' ? 'bank' :
        initialTab === 'metro' ? 'metro' :
        initialTab === 'accommodation' ? 'accommodation' :
        (initialTab === 'regularize' || initialTab === 'visa_job_search' || initialTab === 'retirement' || initialTab === 'voluntary_return' || initialTab === 'student' || initialTab === 'visa_d4') ? 'regularize' :
        (initialTab === 'docs' ? 'gallery' : 'menu')
    );
    const [wizardChoice, setWizardChoice] = useState<string | undefined>(
        initialTab === 'visa_job_search' ? 'visa_job_search' :
        initialTab === 'retirement' ? 'retirement' :
        initialTab === 'voluntary_return' ? 'voluntary_return' :
        (initialTab === 'student' || initialTab === 'visa_d4') ? 'visa_d4' :
        undefined
    );

    // ── State declarations — must be ABOVE useEffect that calls these setters ──
    const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
    const [selectedGuide, setSelectedGuide] = useState<any | null>(null);
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedFile, setGeneratedFile] = useState<any | null>(null);
    const [searchFilter, setSearchFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('Todos');
    const [entityFilter, setEntityFilter] = useState<string>('Todos');

    // Sync activeScreen ONLY on first mount (deep linking) — never on re-renders
    // Using a ref ensures the wizard is never reset mid-flow when parent re-renders
    const didInitRef = React.useRef(false);
    React.useEffect(() => {
        if (didInitRef.current) return;
        didInitRef.current = true;

        // 1. Check direct URL parameter (Highest priority for deep linking)
        const params = new URLSearchParams(window.location.search);
        const urlTab = params.get('tab');
        
        if (urlTab === 'irs' || initialTab === 'irs') {
            setActiveScreen('irs');
        } else if (urlTab === 'niss' || initialTab === 'niss') {
            setActiveScreen('niss');
        } else if (urlTab === 'utente' || initialTab === 'utente') {
            setActiveScreen('utente');
        } else if (urlTab === 'driving' || initialTab === 'driving') {
            setActiveScreen('driving');
        } else if (urlTab === 'bank' || initialTab === 'bank') {
            setActiveScreen('bank');
        } else if (urlTab === 'metro' || initialTab === 'metro') {
            setActiveScreen('metro');
        } else if (
            urlTab === 'regularize' || initialTab === 'regularize' ||
            urlTab === 'visa_job_search' || initialTab === 'visa_job_search' ||
            urlTab === 'retirement' || initialTab === 'retirement' ||
            urlTab === 'voluntary_return' || initialTab === 'voluntary_return' ||
            urlTab === 'student' || initialTab === 'student' ||
            urlTab === 'visa_d4' || initialTab === 'visa_d4'
        ) {
            if (urlTab === 'voluntary_return' || initialTab === 'voluntary_return') {
                setWizardChoice('voluntary_return');
            } else if (urlTab === 'retirement' || initialTab === 'retirement') {
                setWizardChoice('retirement');
            } else if (urlTab === 'visa_job_search' || initialTab === 'visa_job_search') {
                setWizardChoice('visa_job_search');
            } else if (urlTab === 'student' || initialTab === 'student' || urlTab === 'visa_d4' || initialTab === 'visa_d4') {
                setWizardChoice('visa_d4');
            } else {
                setWizardChoice(undefined);
            }
            setActiveScreen('regularize');
        } else if (urlTab === 'nif' || initialTab === 'nif') {
            setActiveScreen('nif');
        } else if (urlTab === 'accommodation' || initialTab === 'accommodation') {
            setActiveScreen('accommodation');
        } else if (urlTab === 'docs' || initialTab === 'docs') {
            setActiveScreen('gallery');
        }
        
        if (initialSearch || params.get('search')) {
            setSearchFilter(initialSearch || params.get('search') || '');
            setActiveScreen('gallery');
        }

        // 2. Handle Deep Linking to Specific Items
        if (initialTemplateId) {
            const template = templates.find(t => t.id === initialTemplateId);
            if (template) {
                setSelectedTemplate(template);
                setActiveScreen('form');
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty deps: run only once on mount, never reset wizard mid-flow





    const normalizedTemplates = useMemo(() => templates.map(t => ({
        ...t,
        category: normalizeCategory(t.category)
    })), []);

    const combinedItems = useMemo(() => {
        return [
            ...normalizedTemplates.map(t => ({ ...t, isTemplate: true })),
            ...serviceGuides.map(g => ({ ...g, isTemplate: false, category: normalizeCategory(g.category) }))
        ];
    }, [normalizedTemplates]);

    const availableEntities = useMemo(() => {
        const all = combinedItems.map(t => t.authority);
        return Array.from(new Set(all)).filter(Boolean).sort();
    }, [combinedItems]);

    const availableCategories = useMemo(() => {
        const all = combinedItems.map(t => t.category);
        return Array.from(new Set(all)).filter(Boolean).sort();
    }, [combinedItems]);

    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        combinedItems.forEach((t: any) => {
            if (t.category) {
                counts[t.category] = (counts[t.category] || 0) + 1;
            }
        });
        return counts;
    }, [combinedItems]);

    const filteredItems = useMemo(() => {
        const list = combinedItems;
        const term = searchFilter.toLowerCase().trim();
        const lang = language?.toLowerCase() || 'pt';
        return list.filter((item: any) => {
            const titleTranslated = (t(item.id, lang) !== item.id ? t(item.id, lang) : t(item.title, lang)).toLowerCase();
            const descTranslated = t(item.description || '', lang).toLowerCase();
            const idLower = item.id.toLowerCase();
            const authLower = (item.authority || '').toLowerCase();
            const catLower = (item.category || '').toLowerCase();

            const matchesSearch = !term ||
                titleTranslated.includes(term) ||
                descTranslated.includes(term) ||
                idLower.includes(term) ||
                authLower.includes(term) ||
                catLower.includes(term);

            const matchesCategory = categoryFilter === 'Todos' || item.category === categoryFilter;
            const matchesEntity = entityFilter === 'Todos' || item.authority === entityFilter;
            return matchesSearch && matchesCategory && matchesEntity;
        });
    }, [searchFilter, categoryFilter, entityFilter, combinedItems, language]);

    const generatePDF = async () => {
        if (!selectedTemplate) return;
        setIsGenerating(true);

        // Phase 3.2: Async Job UX - Notify user that processing is happening
        showToast(t("toast_preparing_doc", language), "info");

        try {
            const pdfResult = await generateOfficialPDF(
                t(selectedTemplate.title, 'PT'), 
                { ...formData, templateId: selectedTemplate.id },
                'PT'
            );

            setGeneratedFile({
                doc: pdfResult.doc,
                filename: pdfResult.filename,
                blob: pdfResult.blob,
                save: pdfResult.save
            });

            // Immediately switch to success screen to show download button
            setActiveScreen('success');

            // 🛡️ MIRA SOVEREIGN: Async Sync (Non-blocking)
            (async () => {
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    const currentUserId = session?.user?.id;
                    if (currentUserId) {
                        let storageUrl: string | null = null;
                        try {
                            const fileExt = pdfResult.filename.split('.').pop() || 'pdf';
                            const fileId = Math.random().toString(36).substring(2, 10);
                            const filePath = `${currentUserId}/doc_${fileId}.${fileExt}`;

                            const { error: uploadError } = await supabase.storage
                                .from('documents')
                                .upload(filePath, pdfResult.blob, {
                                    contentType: 'application/pdf',
                                    upsert: false
                                });

                            if (!uploadError) {
                                const { data: { publicUrl } } = supabase.storage
                                    .from('documents')
                                    .getPublicUrl(filePath);
                                storageUrl = publicUrl;
                            }
                        } catch (storageErr) {
                            // Storage não bloqueia a persistência da base de dados
                        }

                        // Persistir metadados diretamente na tabela relacional user_documents
                        await supabase.from('user_documents').insert([{
                            user_id: currentUserId,
                            document_type: selectedTemplate.id || selectedTemplate.title,
                            file_path: storageUrl,
                            metadata: {
                                title: t(selectedTemplate.title, language),
                                form_data: formData,
                                is_draft: false
                            }
                        }]);
                    }
                } catch (syncErr) {
                    console.warn("MIRA: Document sync failed (Non-blocking):", syncErr);
                }
            })();

            // Adicionalmente salva no histórico local, caso usado por outros componentes
            addToHistory({
                id: Math.random().toString(36).substr(2, 9),
                title: selectedTemplate.title,
                date: new Date().toISOString()
            });

            onEarnPoints(50);
            
            // V52.0 Gamification: Track document generation for 'Document Expert' badge
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            analytics.track('generate_document', currentSession?.user?.id || 'guest', selectedTemplate.category, {
                templateId: selectedTemplate.id,
                title: selectedTemplate.title
            });

            showToast(t("toast_doc_success", language), "success");
            setActiveScreen('success');
        } catch (error: any) {
            console.error('Generation failure:', error);
            alert(`${t('err_gen_doc', language)}: ${error?.message || t('auth_toggle_login', language)}.`);
        } finally {
            setIsGenerating(false);
        }
    };

    // Função auxiliar para download ultra-robusto (Padrão Elite V2026)
    // 🛑 [V5000 LOCKDOWN]: Zero latência, salvamento direto via jsPDF
    const handleDownload = () => {
        if (!generatedFile) {
            console.error("❌ [MIRA_FS] Error: No generated file found in state.");
            showToast(t('err_file_not_found', language), 'error');
            return;
        }

        try {
            // MIRA PROOF V2026.GOLD: High-Priority Native Save
            console.log("💾 [MIRA_FS] Attempting native jsPDF save...");
            
            const rawFilename = generatedFile.filename || `mira_document_${Date.now()}`;
            const finalFilename = rawFilename.toLowerCase().endsWith('.pdf') ? rawFilename : `${rawFilename}.pdf`;

            if (generatedFile.save && typeof generatedFile.save === 'function') {
                generatedFile.save(finalFilename);
                showToast(t("toast_download_start", language), "success");
                console.log("✅ [MIRA_FS] Native save triggered successfully.");
            } else if (generatedFile.doc && typeof generatedFile.doc.save === 'function') {
                // Secondary fallback using the doc object directly
                generatedFile.doc.save(finalFilename);
                showToast(t("toast_download_start", language), "success");
                console.log("✅ [MIRA_FS] Secondary native save (via doc) triggered.");
            } else {
                throw new Error("MIRA: Save methods missing from object");
            }
        } catch (e: any) {
            console.warn("⚠️ [MIRA_FS] Native save failed, escalating to Blob Fallback...", e);
            
            try {
                // ULTRA-ROBUST FALLBACK: Cross-browser Blob Download
                const blob = generatedFile.blob;
                if (!blob) throw new Error("No blob data available");

                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = (generatedFile.filename && generatedFile.filename.endsWith('.pdf')) 
                    ? generatedFile.filename 
                    : `${generatedFile.filename || 'mira_document'}.pdf`;
                
                document.body.appendChild(a);
                a.click();
                
                // Keep the URL for a while then revoke
                setTimeout(() => {
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    console.log("✅ [MIRA_FS] Blob fallback completed.");
                }, 5000); 
                
                showToast(t("toast_download_start", language), "success");
            } catch (innerE) {
                console.error("🚨 [MIRA_FS] FATAL: All download methods failed.", innerE);
                showToast(t('err_save_pdf', language), 'error');
                // Final strategy: Open in new tab so user can save manually
                if (generatedFile.blob) {
                    const blobUrl = window.URL.createObjectURL(generatedFile.blob);
                    window.open(blobUrl, '_blank');
                }
            }
        }
    };

    // Nova função para Download de Guias (V2026.GOLD)
    const handleDownloadGuide = async () => {
        if (!selectedGuide) return;
        setIsGenerating(true);
        showToast(t("toast_preparing_doc", language), "info");
        
        try {
            const guideResult = await generateGuidePDF({
                ...selectedGuide,
                title: t(selectedGuide.title, 'PT'),
                explanation: t(selectedGuide.explanation || selectedGuide.description, 'PT'),
                steps: selectedGuide.steps.map((s: any) => ({
                    docName: t(s.docName, 'PT'),
                    whereToGet: t(s.whereToGet, 'PT')
                }))
            }, 'PT');
            
            guideResult.save();

            // Track guide download telemetry under generate_document to unify counts
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            analytics.track('generate_document', currentSession?.user?.id || 'guest', selectedGuide.category || 'Guides', {
                templateId: selectedGuide.id,
                title: selectedGuide.title
            });

            showToast(t("toast_doc_success", language), "success");
        } catch (e) {
            console.error("Guide PDF Error:", e);
            showToast(t('err_save_pdf', language), 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="h-full bg-white overflow-hidden flex flex-col no-scrollbar">
            {activeScreen === 'menu' && (
                <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50 no-scrollbar pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="space-y-2 mt-4">
                        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{t('jornadas_menu_title', language)}</h2>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{t('jornadas_menu_subtitle', language)}</p>
                    </div>

                    {/* Timeline Journey Steps (Ordered by Importance for New Arrivals) */}
                    <div className="space-y-4">
                        {/* Passo 1: Regularização (AIMA) */}
                        <button onClick={() => {
                            setWizardChoice(undefined);
                            setActiveScreen('regularize');
                        }} className="w-full p-5 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-mira-green transition-all group text-left active:scale-[0.98] flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-50 text-mira-green rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform font-bold text-xl">1</div>
                            <div className="flex-1 min-w-0">
                                <span className="text-[8px] font-black text-mira-green uppercase tracking-wider bg-mira-green/10 px-2 py-0.5 rounded-md border border-mira-green/10">
                                    {t('jornadas_step_prefix', language)} 1 · {t('jornadas_step_residence', language)}
                                </span>
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mt-1">{t('jornadas_legal_title', language)}</h3>
                                <p className="text-[10px] text-slate-400 font-bold mt-0.5">{t('jornadas_legal_sub', language)}</p>
                            </div>
                            <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-950 transition-colors" />
                        </button>

                        {/* Passo 2: NIF */}
                        <button onClick={() => setActiveScreen('nif')} className="w-full p-5 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-amber-400 transition-all group text-left active:scale-[0.98] flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform font-bold text-xl">2</div>
                            <div className="flex-1 min-w-0">
                                <span className="text-[8px] font-black text-amber-500 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/10">
                                    {t('jornadas_step_prefix', language)} 2 · {t('jornadas_step_essential', language)}
                                </span>
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mt-1">{t('jornadas_nif_title', language)}</h3>
                                <p className="text-[10px] text-slate-400 font-bold mt-0.5">{t('jornadas_nif_sub', language)}</p>
                            </div>
                            <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-950 transition-colors" />
                        </button>

                        {/* Passo 3: Alojamento */}
                        <button onClick={() => setActiveScreen('accommodation')} className="w-full p-5 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-amber-500 transition-all group text-left active:scale-[0.98] flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform font-bold text-xl">3</div>
                            <div className="flex-1 min-w-0">
                                <span className="text-[8px] font-black text-amber-500 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/10">
                                    {t('jornadas_step_prefix', language)} 3 · {t('jornadas_step_housing', language)}
                                </span>
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mt-1">{t('acc_title', language)}</h3>
                                <p className="text-[10px] text-slate-400 font-bold mt-0.5">{t('acc_subtitle', language)}</p>
                            </div>
                            <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-950 transition-colors" />
                        </button>

                        {/* Passo 4: NISS */}
                        <button onClick={() => setActiveScreen('niss')} className="w-full p-5 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-blue-400 transition-all group text-left active:scale-[0.98] flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform font-bold text-xl">4</div>
                            <div className="flex-1 min-w-0">
                                <span className="text-[8px] font-black text-blue-550 uppercase tracking-wider bg-blue-550/10 px-2 py-0.5 rounded-md border border-blue-550/10">
                                    {t('jornadas_step_prefix', language)} 4 · {t('jornadas_step_work', language)}
                                </span>
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mt-1">{t('jornadas_niss_title', language)}</h3>
                                <p className="text-[10px] text-slate-400 font-bold mt-0.5">{t('jornadas_niss_sub', language)}</p>
                            </div>
                            <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-950 transition-colors" />
                        </button>

                        {/* Passo 5: Conta Bancária */}
                        <button onClick={() => setActiveScreen('bank')} className="w-full p-5 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-teal-400 transition-all group text-left active:scale-[0.98] flex items-center gap-4">
                            <div className="w-12 h-12 bg-teal-50 text-teal-500 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform font-bold text-xl">5</div>
                            <div className="flex-1 min-w-0">
                                <span className="text-[8px] font-black text-teal-500 uppercase tracking-wider bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/10">
                                    {t('jornadas_step_prefix', language)} 5 · {t('jornadas_step_finance', language)}
                                </span>
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mt-1">{t('bnk_title', language)}</h3>
                                <p className="text-[10px] text-slate-400 font-bold mt-0.5">{t('bnk_subtitle', language)}</p>
                            </div>
                            <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-950 transition-colors" />
                        </button>

                        {/* Passo 6: Cartão de Metro / Navegante */}
                        <button onClick={() => setActiveScreen('metro')} className="w-full p-5 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-violet-400 transition-all group text-left active:scale-[0.98] flex items-center gap-4">
                            <div className="w-12 h-12 bg-violet-50 text-violet-500 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform font-bold text-xl">6</div>
                            <div className="flex-1 min-w-0">
                                <span className="text-[8px] font-black text-violet-550 uppercase tracking-wider bg-violet-550/10 px-2 py-0.5 rounded-md border border-violet-550/10">
                                    {t('jornadas_step_prefix', language)} 6 · {t('jornadas_step_mobility', language)}
                                </span>
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mt-1">
                                    {t('jornadas_metro_title', language)}
                                </h3>
                                <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                                    {t('jornadas_metro_desc', language)}
                                </p>
                            </div>
                            <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-950 transition-colors" />
                        </button>

                        {/* Passo 7: Utente SNS */}
                        <button onClick={() => setActiveScreen('utente')} className="w-full p-5 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-rose-400 transition-all group text-left active:scale-[0.98] flex items-center gap-4">
                            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform font-bold text-xl">7</div>
                            <div className="flex-1 min-w-0">
                                <span className="text-[8px] font-black text-rose-500 uppercase tracking-wider bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/10">
                                    {t('jornadas_step_prefix', language)} 7 · {t('jornadas_step_health', language)}
                                </span>
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mt-1">{t('jornadas_utente_title', language)}</h3>
                                <p className="text-[10px] text-slate-400 font-bold mt-0.5">{t('jornadas_utente_sub', language)}</p>
                            </div>
                            <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-950 transition-colors" />
                        </button>

                        {/* Passo 8: Emprego e Negócios */}
                        <button onClick={() => setActiveScreen('entrepreneur')} className="w-full p-5 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-orange-400 transition-all group text-left active:scale-[0.98] flex items-center gap-4">
                            <div className="w-12 h-12 bg-orange-50 text-mira-orange rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform font-bold text-xl">8</div>
                            <div className="flex-1 min-w-0">
                                <span className="text-[8px] font-black text-orange-500 uppercase tracking-wider bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/10">
                                    {t('jornadas_step_prefix', language)} 8 · {t('jornadas_step_career', language)}
                                </span>
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mt-1">{t('jornadas_entrepreneur_title', language)}</h3>
                                <p className="text-[10px] text-slate-400 font-bold mt-0.5">{t('jornadas_entrepreneur_sub', language)}</p>
                            </div>
                            <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-950 transition-colors" />
                        </button>

                        {/* Passo 9: Carta de Condução */}
                        <button onClick={() => setActiveScreen('driving')} className="w-full p-5 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-indigo-400 transition-all group text-left active:scale-[0.98] flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform font-bold text-xl">9</div>
                            <div className="flex-1 min-w-0">
                                <span className="text-[8px] font-black text-indigo-550 uppercase tracking-wider bg-indigo-550/10 px-2 py-0.5 rounded-md border border-indigo-550/10">
                                    {t('jornadas_step_prefix', language)} 9 · {t('jornadas_step_driving', language)}
                                </span>
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mt-1">{t('drv_title', language)}</h3>
                                <p className="text-[10px] text-slate-400 font-bold mt-0.5">{t('drv_subtitle', language)}</p>
                            </div>
                            <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-950 transition-colors" />
                        </button>

                        {/* Passo 10: Equivalência de Estudos */}
                        <button onClick={() => setActiveScreen('revalidation')} className="w-full p-5 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-mira-green transition-all group text-left active:scale-[0.98] flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-50 text-mira-green rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform font-bold text-xl">10</div>
                            <div className="flex-1 min-w-0">
                                <span className="text-[8px] font-black text-mira-green uppercase tracking-wider bg-mira-green/10 px-2 py-0.5 rounded-md border border-mira-green/10">
                                    {t('jornadas_step_prefix', language)} 10 · {t('jornadas_step_studies', language)}
                                </span>
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mt-1">{t('jornadas_education_title', language)}</h3>
                                <p className="text-[10px] text-slate-400 font-bold mt-0.5">{t('jornadas_education_sub', language)}</p>
                            </div>
                            <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-950 transition-colors" />
                        </button>

                        {/* Passo 11: Nacionalidade */}
                        <button onClick={() => setActiveScreen('citizenship')} className="w-full p-5 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-sky-400 transition-all group text-left active:scale-[0.98] flex items-center gap-4">
                            <div className="w-12 h-12 bg-sky-50 text-[#0ea5e9] rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform font-bold text-xl">11</div>
                            <div className="flex-1 min-w-0">
                                <span className="text-[8px] font-black text-sky-550 uppercase tracking-wider bg-sky-550/10 px-2 py-0.5 rounded-md border border-sky-550/10">
                                    {t('jornadas_step_prefix', language)} 11 · {t('jornadas_step_citizenship', language)}
                                </span>
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mt-1">{t('jornadas_citizenship_title', language)}</h3>
                                <p className="text-[10px] text-slate-400 font-bold mt-0.5">{t('jornadas_citizenship_sub', language)}</p>
                            </div>
                            <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-950 transition-colors" />
                        </button>

                        {/* Passo 12: IRS */}
                        <button onClick={() => setActiveScreen('irs')} className="w-full p-5 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-red-400 transition-all group text-left active:scale-[0.98] flex items-center gap-4">
                            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform font-bold text-xl">12</div>
                            <div className="flex-1 min-w-0">
                                <span className="text-[8px] font-black text-red-500 uppercase tracking-wider bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/10">
                                    {t('jornadas_step_prefix', language)} 12 · {t('jornadas_step_irs', language)}
                                </span>
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mt-1">{t('jornadas_irs_title', language)}</h3>
                                <p className="text-[10px] text-slate-400 font-bold mt-0.5">{t('jornadas_irs_sub', language)}</p>
                            </div>
                            <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-950 transition-colors" />
                        </button>

                        {/* Passo 13: Aposentadoria em Portugal (Módulo de Simuladores) */}
                        <button onClick={() => onViewChange(ViewType.SIMULATORS, { tab: 'reforma' })} className="w-full p-5 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-amber-450 transition-all group text-left active:scale-[0.98] flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform font-bold text-xl">13</div>
                            <div className="flex-1 min-w-0">
                                <span className="text-[8px] font-black text-amber-600 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/10">
                                    {t('jornadas_step_prefix', language)} 13 · {t('jornadas_step_social_security', language)}
                                </span>
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mt-1">{t('jornadas_retirement_local_title', language)}</h3>
                                <p className="text-[10px] text-slate-400 font-bold mt-0.5">{t('jornadas_retirement_local_sub', language)}</p>
                            </div>
                            <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-950 transition-colors" />
                        </button>
                    </div>

                    {/* Document Templates Gallery Button */}
                    <div className="pt-4 border-t border-slate-200">
                        <button onClick={() => setActiveScreen('gallery')} className="w-full p-6 bg-slate-900 text-white rounded-[2rem] shadow-lg hover:bg-orange-500 hover:shadow-orange-500/20 active:scale-95 transition-all text-left flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-xl shrink-0">📂</div>
                            <div className="flex-1">
                                <h3 className="text-xs font-black uppercase tracking-widest">{t('jornadas_docs_title', language)}</h3>
                                <p className="text-[10px] text-slate-300 mt-1">{t('jornadas_docs_sub', language)}</p>
                            </div>
                            <ChevronRight size={20} className="text-white/60" />
                        </button>
                    </div>
                </div>
            )}

            {activeScreen === 'gallery' && (
                <div className="flex-1 flex flex-col overflow-hidden animate-in slide-in-from-right duration-500">
                    {/* SCROLLABLE TOP HEADER FOR BETTER MOBILE VIEWING */}
                    <div className="bg-white p-6 space-y-6 border-b border-slate-100">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setActiveScreen('menu')} className="p-3 bg-slate-50 rounded-2xl shrink-0"><ArrowLeft size={20} /></button>
                            <h2 className="mira-module-title mb-0">
                                {t('docs_title', language)}
                            </h2>
                        </div>

                        <div className="space-y-3">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input 
                                        type="text" 
                                        placeholder={t('docs_search_placeholder', language)} 
                                        value={searchFilter} 
                                        onChange={e => setSearchFilter(e.target.value)} 
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-mira-orange-pastel transition-all" 
                                    />
                                </div>

                                <div className="flex gap-2 relative z-50">
                                    <div className="relative flex-1">
                                        <select
                                            value={entityFilter}
                                            onChange={e => setEntityFilter(e.target.value)}
                                            className="w-full pl-4 pr-10 py-3 bg-slate-100 border-none rounded-xl text-[10px] font-black uppercase tracking-widest appearance-none outline-none focus:ring-2 focus:ring-mira-orange-pastel cursor-pointer"
                                        >
                                            <option value="Todos">{t('docs_authority', language)}</option>
                                            {availableEntities.map(e => <option key={e} value={e}>{t(e, language)}</option>)}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                    <div className="relative flex-1">
                                        <select
                                            value={categoryFilter}
                                            onChange={e => setCategoryFilter(e.target.value)}
                                            className="w-full pl-4 pr-10 py-3 bg-slate-100 border-none rounded-xl text-[10px] font-black uppercase tracking-widest appearance-none outline-none focus:ring-2 focus:ring-mira-orange-pastel cursor-pointer"
                                        >
                                            <option value="Todos">{t('doc_category', language)} ({combinedItems.length})</option>
                                            {availableCategories.map(c => (
                                                <option key={c} value={c}>
                                                    {t(c, language)} ({categoryCounts[c] || 0})
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
                        <div className="p-6 space-y-5">
                            {filteredItems.length > 0 ? filteredItems.map((item: any) => (
                                <div 
                                    key={item.id} 
                                    onClick={() => {
                                        if (item.isTemplate) {
                                            setSelectedTemplate(item);
                                            setFormData({});
                                            setActiveScreen('form');
                                        } else {
                                            setSelectedGuide(item);
                                            setActiveScreen('guide_view');
                                        }
                                    }} 
                                    className={`bg-white text-slate-900 p-5 rounded-[1.75rem] shadow-sm hover:shadow-xl hover:shadow-${item.isTemplate ? '[#0ea5e9]' : '[#f97316]'}/10 transition-all group cursor-pointer active:scale-[0.98] flex flex-col gap-3 relative overflow-hidden`}
                                    style={{ border: `2px solid ${item.isTemplate ? '#0ea5e9' : '#f97316'}` }}
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${item.isTemplate ? 'bg-sky-50 text-[#0ea5e9]' : 'bg-orange-50 text-[#f97316]'}`}>
                                                {item.isTemplate ? (lang === 'pt' ? 'Minuta' : lang === 'es' ? 'Minuta' : lang === 'fr' ? 'Modèle' : 'Template') : (lang === 'pt' ? 'Guia' : lang === 'es' ? 'Guía' : lang === 'fr' ? 'Guide' : 'Guide')}
                                            </span>
                                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 truncate font-semibold">
                                                {t(item.category, language)} · {t(item.authority, language)}
                                            </span>
                                        </div>
                                        <div className={`p-2 rounded-xl bg-slate-55 text-slate-400 group-hover:${item.isTemplate ? 'bg-[#0ea5e9]' : 'bg-[#f97316]'} group-hover:text-white transition-colors shrink-0`}>
                                            {item.isTemplate ? <FileText size={16} /> : <Compass size={16} />}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className={`font-black text-slate-900 text-base uppercase tracking-tight leading-tight group-hover:${item.isTemplate ? 'text-[#0ea5e9]' : 'text-[#f97316]'} transition-colors`}>
                                            {t(item.title || item.id, language) !== (item.title || item.id)
                                                ? t(item.title || item.id, language)
                                                : (t(item.id, language) !== item.id ? t(item.id, language) : <TranslatedText text={item.title} language={language} shouldTranslate={language !== 'PT'} />)}
                                        </h3>
                                        <p className="text-[10px] text-slate-500 font-medium line-clamp-2 mt-1 leading-relaxed">
                                            <TranslatedText text={item.description || ''} language={language} shouldTranslate={language !== 'PT'} />
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                        <div className="flex items-center gap-1.5">
                                            <Scale size={11} className="text-slate-400" />
                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                                                {t(`complexity_${(item.complexity || 'Easy').toLowerCase()}`, language)}
                                            </span>
                                        </div>
                                        <ChevronRight className={`text-slate-400 group-hover:${item.isTemplate ? 'text-[#0ea5e9]' : 'text-[#f97316]'} group-hover:translate-x-1 transition-all`} size={16} />
                                    </div>
                                </div>
                            )) : (
                                <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center">
                                    <FileText size={64} className="mb-4" />
                                    <p className="text-xs font-black uppercase tracking-widest">{t('docs_empty_title', language)}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeScreen === 'regularize' && (
                <RegularizationWizard
                    language={language}
                    onSelectTemplate={(id) => {
                        const template = templates.find(t => t.id === id);
                        if (template) {
                            setSelectedTemplate(template);
                            setFormData({});
                            setActiveScreen('form');
                        }
                    }}
                    onGoToDocs={() => setActiveScreen('gallery')}
                    initialChoice={wizardChoice}
                    onBack={() => {
                        setWizardChoice(undefined);
                        setActiveScreen('menu');
                    }}
                    onViewChange={onViewChange}
                />
            )}

            {activeScreen === 'citizenship' && (
                <CitizenshipWizard
                    language={language}
                    onBack={() => setActiveScreen('menu')}
                    onSelectTemplate={(id) => {
                        const template = templates.find(t => t.id === id);
                        if (template) {
                            setSelectedTemplate(template);
                            setFormData({});
                            setActiveScreen('form');
                        }
                    }}
                />
            )}

            {activeScreen === 'entrepreneur' && (
                <EntrepreneurWizard
                    language={language}
                    onBack={() => setActiveScreen('menu')}
                    onSelectTemplate={(id) => {
                        const template = templates.find(t => t.id === id);
                        if (template) {
                            setSelectedTemplate(template);
                            setFormData({});
                            setActiveScreen('form');
                        }
                    }}
                    onViewChange={onViewChange}
                />
            )}

            {activeScreen === 'revalidation' && (
                <RevalidationWizard
                    language={language}
                    onBack={() => setActiveScreen('menu')}
                    onSelectTemplate={(id) => {
                        const template = templates.find(t => t.id === id);
                        if (template) {
                            setSelectedTemplate(template);
                            setFormData({});
                            setActiveScreen('form');
                        }
                    }}
                />
            )}

            {activeScreen === 'nif' && (
                <NifWizard
                    language={language}
                    onBack={() => setActiveScreen('menu')}
                    onSelectTemplate={(id) => {
                        const template = templates.find(t => t.id === id);
                        if (template) {
                            setSelectedTemplate(template);
                            setFormData({});
                            setActiveScreen('form');
                        }
                    }}
                    onViewChange={onViewChange}
                />
            )}

            {activeScreen === 'niss' && (
                <NissWizard
                    language={language}
                    onBack={() => setActiveScreen('menu')}
                    onSelectTemplate={(id) => {
                        const template = templates.find(t => t.id === id);
                        if (template) {
                            setSelectedTemplate(template);
                            setFormData({});
                            setActiveScreen('form');
                        }
                    }}
                    onViewChange={onViewChange}
                />
            )}

            {activeScreen === 'utente' && (
                <UtenteSnsWizard
                    language={language}
                    onBack={() => setActiveScreen('menu')}
                    onSelectTemplate={(id) => {
                        const template = templates.find(t => t.id === id);
                        if (template) {
                            setSelectedTemplate(template);
                            setFormData({});
                            setActiveScreen('form');
                        }
                    }}
                />
            )}

            {activeScreen === 'driving' && (
                <DrivingLicenseWizard
                    language={language}
                    onBack={() => setActiveScreen('menu')}
                    onSelectTemplate={(id) => {
                        const template = templates.find(t => t.id === id);
                        if (template) {
                            setSelectedTemplate(template);
                            setFormData({});
                            setActiveScreen('form');
                        }
                    }}
                />
            )}

            {activeScreen === 'accommodation' && (
                <AccommodationWizard
                    language={language}
                    onBack={() => setActiveScreen('menu')}
                    onSelectTemplate={(id) => {
                        const template = templates.find(t => t.id === id);
                        if (template) {
                            setSelectedTemplate(template);
                            setFormData({});
                            setActiveScreen('form');
                        }
                    }}
                    onViewChange={onViewChange}
                />
            )}

            {activeScreen === 'bank' && (
                <BankWizard
                    language={language}
                    onBack={() => setActiveScreen('menu')}
                    onSelectTemplate={(id) => {
                        const template = templates.find(t => t.id === id);
                        if (template) {
                            setSelectedTemplate(template);
                            setFormData({});
                            setActiveScreen('form');
                        }
                    }}
                />
            )}

            {activeScreen === 'metro' && (
                <MetroCardWizard
                    language={language}
                    onBack={() => setActiveScreen('menu')}
                />
            )}

            {activeScreen === 'irs' && (
                <IrsWizard
                    language={language}
                    onBack={() => setActiveScreen('menu')}
                    onSelectTemplate={(id) => {
                        const template = templates.find(t => t.id === id);
                        if (template) {
                            setSelectedTemplate(template);
                            setFormData({});
                            setActiveScreen('form');
                        }
                    }}
                    onViewChange={onViewChange}
                />
            )}

            {activeScreen === 'retirement_local' && (
                <RetirementWizard
                    language={language}
                    onBack={() => setActiveScreen('menu')}
                    onSelectTemplate={(id) => {
                        const template = templates.find(t => t.id === id);
                        if (template) {
                            setSelectedTemplate(template);
                            setFormData({});
                            setActiveScreen('form');
                        }
                    }}
                    onViewChange={onViewChange}
                />
            )}


            {activeScreen === 'form' && (
                <div className="flex flex-col h-full animate-in slide-in-from-right duration-500 relative">
                    <div className="p-5 border-b flex items-center justify-between bg-white z-10">
                        <button onClick={() => setActiveScreen('gallery')} className="p-3 bg-slate-50 rounded-2xl shrink-0"><ArrowLeft size={20} /></button>
                        {/* Título com quebra de linha permitida e removido truncate para visibilidade completa */}
                        <h2 className="font-black text-[12px] uppercase tracking-tighter text-slate-800 text-center px-4 leading-[1.1] whitespace-pre-wrap break-words flex-1">
                            {selectedTemplate ? (
                                t(selectedTemplate.id, language) !== selectedTemplate.id 
                                ? t(selectedTemplate.id, language) 
                                : <TranslatedText text={selectedTemplate.title} language={language} shouldTranslate={language !== 'PT'} />
                            ) : ''}
                        </h2>
                        <div className="w-10 shrink-0"></div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 md:space-y-8 no-scrollbar pb-10">
                        {selectedTemplate?.explanation && (
                            <div className="bg-mira-orange-pastel/30 p-4 md:p-5 rounded-2xl border border-mira-orange/10 animate-in fade-in slide-in-from-top-4 duration-700">
                                <div className="flex items-center gap-2 mb-2">
                                    <Info size={14} className="text-mira-orange" />
                                    <h4 className="text-[9px] font-black text-slate-900 uppercase tracking-widest">{t('doc_explanation_title', language)}</h4>
                                </div>
                                <p className="text-[11px] text-slate-700 font-bold leading-normal">
                                    {(() => {
                                        const expl = t(selectedTemplate.explanation, language);
                                        if (expl === selectedTemplate.explanation && expl.startsWith('expl_')) {
                                            return <TranslatedText text={selectedTemplate.description} language={language} shouldTranslate={language !== 'PT'} />;
                                        }
                                        return expl;
                                    })()}
                                </p>
                            </div>
                        )}



                        <div className="space-y-5">
                            {selectedTemplate?.fields.map(f => (
                                <div key={f.id} className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                        {t(`field_${f.id}`, language) !== `field_${f.id}` ? t(`field_${f.id}`, language) : (
                                            <TranslatedText text={f.label} language={language} shouldTranslate={language !== 'PT'} />
                                        )}
                                    </label>
                                    <input
                                        type={f.type}
                                        placeholder={t(`place_${f.id}`, language) !== `place_${f.id}` ? t(`place_${f.id}`, language) : f.placeholder}
                                        value={formData[f.id] || ''}
                                        onChange={e => setFormData({ ...formData, [f.id]: e.target.value })}
                                        className="w-full p-4 md:p-5 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-mira-orange transition-all shadow-inner"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="pt-6 pb-24 md:pb-6 space-y-6">
                            <button onClick={generatePDF} disabled={isGenerating} className="w-full bg-slate-900 text-white py-5 md:py-6 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3">
                                {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Download size={24} strokeWidth={3} />}
                                {isGenerating ? t('docs_loading_pdf', language) : t('docs_generate_btn', language)}
                            </button>
                        </div>
                    </div>
                </div>
            )
            }

            {
                activeScreen === 'success' && (
                    <div className="flex-1 flex flex-col items-center justify-center p-10 text-center animate-fade-in">
                        <div className="w-24 h-24 bg-mira-green text-white rounded-full flex items-center justify-center mb-8 shadow-2xl animate-bounce"><CheckCircle2 size={56} /></div>
                        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{t('docs_ready', language)}</h2>
                        <p className="text-sm text-slate-500 font-bold mb-10 max-w-xs leading-relaxed uppercase">{t('docs_ready_desc', language)}</p>
                        <div className="w-full max-w-xs space-y-4">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    handleDownload();
                                }}
                                className="w-full bg-slate-900 text-white py-5 rounded-[2.5rem] font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 shadow-xl"
                            >
                                <Download size={20} /> {t('docs_download', language)}
                            </button>
                            <button onClick={() => setActiveScreen('gallery')} className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">{t('docs_back', language)}</button>
                        </div>
                    </div>
                )
            }

            {
                activeScreen === 'guide_view' && selectedGuide && (
                    <div className="flex flex-col h-full animate-in slide-in-from-right duration-500 bg-white">
                        <div className="p-5 border-b flex items-center justify-between bg-white sticky top-0 z-10">
                            <button onClick={() => setActiveScreen('gallery')} className="p-3 bg-slate-50 rounded-2xl shrink-0"><ArrowLeft size={20} /></button>
                            <h2 className="font-black text-sm uppercase tracking-tighter text-slate-800 text-center px-4 leading-tight break-words flex-1">
                                {t(selectedGuide.title, language)}
                            </h2>
                            <button 
                                onClick={handleDownloadGuide}
                                disabled={isGenerating}
                                className="p-3 bg-slate-900 text-white rounded-2xl shrink-0 shadow-lg active:scale-95 transition-all"
                            >
                                {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar pb-32">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <span className="px-3 py-1 bg-mira-blue text-white text-[8px] font-black uppercase tracking-widest rounded-md">{t(selectedGuide.category, language)}</span>
                                    <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[8px] font-black uppercase tracking-widest rounded-md">{t(selectedGuide.authority, language)}</span>
                                </div>
                                <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                    <TranslatedText text={selectedGuide.explanation} language={language} shouldTranslate={language !== 'PT'} />
                                </p>
                            </div>

                            <div className="space-y-6">
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] border-l-4 border-mira-orange pl-3">{t('doc_needed_title', language)}</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    {selectedGuide.steps.map((step: any, idx: number) => (
                                        <div key={idx} className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex gap-4 items-start">
                                            <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-mira-orange shadow-sm shrink-0 font-black text-xs">{idx + 1}</div>
                                            <div>
                                                <p className="text-xs font-black text-slate-900 uppercase tracking-tight">
                                                    <TranslatedText text={step.docName} language={language} shouldTranslate={language !== 'PT'} />
                                                </p>
                                                <p className="text-[10px] text-slate-500 font-medium mt-1">
                                                    <TranslatedText text={step.whereToGet} language={language} shouldTranslate={language !== 'PT'} />
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                                    {selectedGuide.faq && (
                                        <div className="space-y-6">
                                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] border-l-4 border-mira-blue pl-3">{t('doc_faq_title', language)}</h3>
                                            <div className="space-y-4">
                                                {selectedGuide.faq.map((item: any, idx: number) => (
                                                    <div key={idx} className="p-6 bg-blue-50/50 rounded-[2.5rem] border border-blue-100">
                                                        <p className="text-[11px] font-black text-blue-900 uppercase tracking-tight mb-2">P: <TranslatedText text={item.q} language={language} shouldTranslate={language !== 'PT'} /></p>
                                                        <p className="text-[11px] text-blue-700 font-medium leading-relaxed">R: <TranslatedText text={item.a} language={language} shouldTranslate={language !== 'PT'} /></p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                            <div className="p-8 bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[3rem] text-white space-y-4 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                                <div className="flex items-center gap-3 relative z-10">
                                    <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-lg overflow-hidden border border-slate-100">
                                        <img src={MIRA_PHOTO_URL} className="w-full h-full object-cover" alt="MIRA" />
                                    </div>
                                    <p className="text-xs font-black uppercase tracking-widest">{t('doc_doubts_title', language)}</p>
                                </div>
                                <p className="text-[11px] text-slate-300 font-medium leading-relaxed relative z-10">
                                    {t('doc_doubts_desc', language)}
                                </p>
                                <button
                                    onClick={() => onViewChange(ViewType.ASSISTANT)}
                                    className="w-full bg-white text-slate-900 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all relative z-10"
                                >
                                    {t('doc_chat_btn', language)}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};
