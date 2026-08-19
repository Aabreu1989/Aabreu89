import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Trash2, Sparkles, MapPin, Briefcase, Tag, Clock, CheckCircle2, ChevronDown, Loader2, AlertCircle, Info, Plus, Edit3, ArrowLeft } from 'lucide-react';
import { WORK_TOPICS, JobPost } from '../types';
import { jobAlertService, JobAlert } from '../services/jobAlertService';
import { supabase } from '../lib/supabase';

interface JobAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
  user?: any;
  jobs?: JobPost[];
  onAlertsChanged?: () => void;
}

const LOCATIONS_LIST = [
  "Todos os Distritos", "Lisboa", "Porto", "Braga", "Setúbal", "Faro", "Coimbra", "Aveiro", "Remoto", "Leiria", "Santarém", "Viseu", "Évora"
];

const MODAL_I18N: Record<string, Record<string, string>> = {
  PT: {
    notifications_badge: '✦ Notificações MIRA',
    title_create: 'Criar Alerta de Vagas',
    title_edit: 'Editar Alerta de Vagas',
    title_list: 'Meus Alertas de Vagas',
    btn_new_alert: '+ Criar Novo Alerta',
    btn_back_to_list: '← Ver Meus Alertas',
    btn_cancel_edit: 'Cancelar Edição',
    area_label: 'Área de Atuação',
    location_label: 'Distrito / Cidade',
    all_areas: '🌐 Todas as Áreas',
    keywords_label: 'Cargo ou Palavra-Chave (Opcional)',
    keywords_placeholder: 'Ex: Cozinheiro, Enfermeiro, Motorista...',
    frequency_label: 'Frequência de Alertas',
    freq_instant: 'Instantânea',
    freq_daily: 'Diária',
    freq_weekly: 'Semanal',
    submit_create_btn: 'Ativar Alerta de Vagas',
    submit_edit_btn: 'Guardar Alterações',
    scanning_msg: 'A analisar 4.368 vagas em tempo real...',
    status_active: 'Ativo',
    status_paused: 'Pausado',
    btn_edit: 'Editar',
    delete_tooltip: 'Eliminar Alerta',
    created_at: 'Criado em',
    empty_list_msg: 'Ainda não tens nenhum alerta configurado.',
    empty_list_sub: 'Cria um alerta para receberes notificações automáticas de novas vagas compatíveis!'
  },
  EN: {
    notifications_badge: '✦ MIRA Notifications',
    title_create: 'Create Job Alert',
    title_edit: 'Edit Job Alert',
    title_list: 'My Job Alerts',
    btn_new_alert: '+ Create New Alert',
    btn_back_to_list: '← View My Alerts',
    btn_cancel_edit: 'Cancel Edit',
    area_label: 'Field of Activity',
    location_label: 'District / City',
    all_areas: '🌐 All Fields',
    keywords_label: 'Role or Keyword (Optional)',
    keywords_placeholder: 'Ex: Chef, Nurse, Driver...',
    frequency_label: 'Alert Frequency',
    freq_instant: 'Instant',
    freq_daily: 'Daily',
    freq_weekly: 'Weekly',
    submit_create_btn: 'Activate Job Alert',
    submit_edit_btn: 'Save Changes',
    scanning_msg: 'Scanning 4,368 job posts in real-time...',
    status_active: 'Active',
    status_paused: 'Paused',
    btn_edit: 'Edit',
    delete_tooltip: 'Delete Alert',
    created_at: 'Created on',
    empty_list_msg: 'You have no job alerts configured yet.',
    empty_list_sub: 'Create an alert to receive automated notifications for matching opportunities!'
  },
  ES: {
    notifications_badge: '✦ Notificaciones MIRA',
    title_create: 'Crear Alerta de Empleo',
    title_edit: 'Editar Alerta de Empleo',
    title_list: 'Mis Alertas de Empleo',
    btn_new_alert: '+ Crear Nueva Alerta',
    btn_back_to_list: '← Ver Mis Alertas',
    btn_cancel_edit: 'Cancelar Edición',
    area_label: 'Área de Actuación',
    location_label: 'Distrito / Ciudad',
    all_areas: '🌐 Todas las Áreas',
    keywords_label: 'Cargo o Palabra Clave (Opcional)',
    keywords_placeholder: 'Ej: Cocinero, Enfermero, Conductor...',
    frequency_label: 'Frecuencia de Alertas',
    freq_instant: 'Instantánea',
    freq_daily: 'Diaria',
    freq_weekly: 'Semanal',
    submit_create_btn: 'Activar Alerta de Empleo',
    submit_edit_btn: 'Guardar Cambios',
    scanning_msg: 'Analizando 4.368 vacantes en tiempo real...',
    status_active: 'Activo',
    status_paused: 'Pausado',
    btn_edit: 'Editar',
    delete_tooltip: 'Eliminar Alerta',
    created_at: 'Creado el',
    empty_list_msg: 'Aún no tienes alertas de empleo configuradas.',
    empty_list_sub: '¡Crea una alerta para recibir notificaciones automáticas de nuevas vacantes compatibles!'
  },
  FR: {
    notifications_badge: '✦ Notifications MIRA',
    title_create: 'Créer une Alerte d\'Emploi',
    title_edit: 'Modifier l\'Alerte d\'Emploi',
    title_list: 'Mes Alertes d\'Emploi',
    btn_new_alert: '+ Créer une Nouvelle Alerte',
    btn_back_to_list: '← Voir Mes Alertes',
    btn_cancel_edit: 'Annuler la Modification',
    area_label: 'Domaine d\'Activité',
    location_label: 'District / Ville',
    all_areas: '🌐 Tous les Domaines',
    keywords_label: 'Poste ou Mot-Clé (Optionnel)',
    keywords_placeholder: 'Ex: Cuisinier, Infirmière, Chauffeur...',
    frequency_label: 'Fréquence des Alertes',
    freq_instant: 'Instantanée',
    freq_daily: 'Quotidienne',
    freq_weekly: 'Hebdomadaire',
    submit_create_btn: 'Activer l\'Alerte d\'Emploi',
    submit_edit_btn: 'Enregistrer les Modifications',
    scanning_msg: 'Analyse de 4 368 offres en temps réel...',
    status_active: 'Actif',
    status_paused: 'En pause',
    btn_edit: 'Modifier',
    delete_tooltip: 'Supprimer l\'Alerte',
    created_at: 'Créé le',
    empty_list_msg: 'Vous n\'avez pas encore configuré d\'alerte d\'emploi.',
    empty_list_sub: 'Créez une alerte pour recevoir des notifications automatiques pour les offres compatibles !'
  }
};

export const JobAlertModal: React.FC<JobAlertModalProps> = ({
  isOpen,
  onClose,
  language,
  user,
  jobs,
  onAlertsChanged
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('create');
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);

  const [workTopic, setWorkTopic] = useState('Todos');
  const [location, setLocation] = useState('Todos os Distritos');
  const [keywords, setKeywords] = useState('');
  const [frequency, setFrequency] = useState<'instant' | 'daily' | 'weekly'>('instant');
  
  const [existingAlerts, setExistingAlerts] = useState<JobAlert[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);

  const [scanFeedback, setScanFeedback] = useState<{
    status: 'idle' | 'scanning' | 'success' | 'zero' | 'error';
    matchesCount: number;
    message?: string;
  }>({ status: 'idle', matchesCount: 0 });

  const langKey = (language || 'PT').toUpperCase();
  const i18n = MODAL_I18N[langKey] || MODAL_I18N['PT'];

  useEffect(() => {
    if (isOpen) {
      loadAlertsInitial();
    }
  }, [isOpen, user?.id]);

  const loadAlertsInitial = async () => {
    setIsLoadingAlerts(true);
    setScanFeedback({ status: 'idle', matchesCount: 0 });
    try {
      const alerts = await jobAlertService.getAlertsAsync(user?.id);
      setExistingAlerts(alerts || []);
      if (alerts && alerts.length > 0) {
        setViewMode('list');
      } else {
        setViewMode('create');
      }
    } catch (e) {
      console.warn('MIRA: Error loading initial alerts', e);
      setViewMode('create');
    } finally {
      setIsLoadingAlerts(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const alerts = await jobAlertService.getAlertsAsync(user?.id);
      setExistingAlerts(alerts || []);
    } catch (e) {
      console.warn('MIRA: Error reloading alerts', e);
    }
  };

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setEditingAlertId(null);
    setWorkTopic('Todos');
    setLocation('Todos os Distritos');
    setKeywords('');
    setFrequency('instant');
    setScanFeedback({ status: 'idle', matchesCount: 0 });
    setViewMode('create');
  };

  const handleStartEdit = (alert: JobAlert) => {
    setEditingAlertId(alert.id);
    setWorkTopic(alert.workTopic || 'Todos');
    setLocation(alert.location || 'Todos os Distritos');
    setKeywords(alert.keywords || '');
    setFrequency(alert.frequency || 'instant');
    setScanFeedback({ status: 'idle', matchesCount: 0 });
    setViewMode('edit');
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (viewMode === 'edit' && editingAlertId) {
      // MODO EDIÇÃO
      try {
        await jobAlertService.updateAlert(editingAlertId, {
          workTopic,
          location,
          keywords,
          frequency
        }, user?.id);

        setExistingAlerts(prev => prev.map(a => a.id === editingAlertId ? {
          ...a,
          workTopic,
          location,
          keywords: keywords.trim(),
          frequency
        } : a));

        await loadAlerts();
        if (onAlertsChanged) onAlertsChanged();
        setViewMode('list');
        setEditingAlertId(null);
      } catch (err) {
        console.error('MIRA: Erro ao atualizar alerta:', err);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // MODO CRIAÇÃO
    try {
      // 1. Salvar o novo alerta de forma atómica e instantânea
      const newAlert = await jobAlertService.saveAlert({
        workTopic,
        location,
        keywords,
        frequency
      }, user?.id);

      // Injeta imediatamente o novo alerta no estado
      setExistingAlerts(prev => [newAlert, ...prev.filter(a => a.id !== newAlert.id)]);

      // 2. Feedback visual limpo (zero notificações geradas no banco na criação)
      const freqLabel = frequency === 'daily'
        ? 'Enviaremos um resumo diário às 06:00 UTC com as novas oportunidades.'
        : frequency === 'weekly'
          ? 'Enviaremos um resumo semanal com as novas oportunidades.'
          : 'Avisaremos em tempo real assim que novas vagas compatíveis forem publicadas.';

      setScanFeedback({
        status: 'success',
        matchesCount: 0,
        message: `🎉 Alerta ativado com sucesso! ${freqLabel}`
      });

      setKeywords('');
      await loadAlerts();
      if (onAlertsChanged) onAlertsChanged();

      // Transitar imediatamente para a lista de alertas
      setViewMode('list');
    } catch (err: any) {
      console.error('MIRA: Erro ao salvar alerta:', err);
      setScanFeedback({
        status: 'error',
        matchesCount: 0,
        message: 'Erro de comunicação ao salvar o alerta. Por favor tenta novamente.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (alertId: string, currentStatus: boolean) => {
    setExistingAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isActive: !currentStatus } : a));
    await jobAlertService.toggleAlert(alertId, !currentStatus, user?.id);
    await loadAlerts();
    if (onAlertsChanged) onAlertsChanged();
  };

  const handleDelete = async (alertId: string) => {
    setExistingAlerts(prev => prev.filter(a => a.id !== alertId));
    await jobAlertService.deleteAlert(alertId, user?.id);
    const updated = await jobAlertService.getAlertsAsync(user?.id);
    setExistingAlerts(updated || []);
    if (!updated || updated.length === 0) {
      setViewMode('create');
    }
    if (onAlertsChanged) onAlertsChanged();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-300">
      {/* Backdrop overlay click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Modal Container */}
      <div className="bg-white text-slate-900 border border-slate-200/80 w-full max-w-lg sm:max-w-xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.45)] overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 relative z-10 font-sans mb-0">
        
        {/* Mobile Grab Bar Indicator */}
        <div className="w-14 h-1.5 bg-slate-300 rounded-full mx-auto my-2.5 sm:hidden shrink-0 shadow-inner cursor-grab" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-3 relative z-10 min-w-0 pr-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 p-0.5 shadow-lg shadow-emerald-500/30 shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[0.85rem] flex items-center justify-center">
                <Bell size={20} className="text-emerald-400 animate-pulse" />
              </div>
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30 inline-block truncate">
                {i18n.notifications_badge}
              </span>
              <h3 className="text-base sm:text-xl font-black uppercase tracking-tight text-white mt-0.5 truncate">
                {viewMode === 'list' 
                  ? `${i18n.title_list} (${existingAlerts.length})` 
                  : viewMode === 'edit'
                    ? i18n.title_edit
                    : i18n.title_create}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center border border-slate-700/60 active:scale-95 transition-all relative z-10 shrink-0 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body with Extra Bottom Clearance (pb-32) for Mobile Navbar */}
        <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain touch-pan-y space-y-4 sm:space-y-6 flex-1 custom-scrollbar bg-slate-50/70 pb-32 sm:pb-8">
          
          {/* Feedback Banners (Dismissable) */}
          {scanFeedback.status === 'scanning' && (
            <div className="p-4 bg-sky-50 border border-sky-200 text-sky-900 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top duration-300 shadow-sm">
              <Loader2 size={20} className="text-sky-600 animate-spin shrink-0" />
              <p className="text-xs font-bold uppercase tracking-tight">
                {i18n.scanning_msg}
              </p>
            </div>
          )}

          {scanFeedback.status === 'success' && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center justify-between gap-3 animate-in slide-in-from-top duration-300 shadow-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                <p className="text-xs font-bold uppercase tracking-tight truncate">
                  {scanFeedback.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setScanFeedback({ status: 'idle', matchesCount: 0 })}
                className="text-emerald-700 hover:text-emerald-900 p-1 rounded-lg hover:bg-emerald-100 transition-colors shrink-0 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {scanFeedback.status === 'zero' && (
            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex items-center justify-between gap-3 animate-in slide-in-from-top duration-300 shadow-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <Info size={18} className="text-amber-600 shrink-0" />
                <p className="text-xs font-bold uppercase tracking-tight">
                  {scanFeedback.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setScanFeedback({ status: 'idle', matchesCount: 0 })}
                className="text-amber-700 hover:text-amber-900 p-1 rounded-lg hover:bg-amber-100 transition-colors shrink-0 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {scanFeedback.status === 'error' && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl flex items-center justify-between gap-3 animate-in slide-in-from-top duration-300 shadow-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <AlertCircle size={18} className="text-rose-600 shrink-0" />
                <p className="text-xs font-bold uppercase tracking-tight">
                  {scanFeedback.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setScanFeedback({ status: 'idle', matchesCount: 0 })}
                className="text-rose-700 hover:text-rose-900 p-1 rounded-lg hover:bg-rose-100 transition-colors shrink-0 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* ESTADO 2: VISUALIZAÇÃO DA LISTA DE MEUS ALERTAS               */}
          {/* ───────────────────────────────────────────────────────────── */}
          {viewMode === 'list' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Botão de Destaque: + Criar Novo Alerta */}
              <div className="flex items-center justify-between gap-3 pb-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                  {existingAlerts.length} {existingAlerts.length === 1 ? 'ALERTA CONFIGURADO' : 'ALERTAS CONFIGURADOS'}
                </p>
                <button
                  type="button"
                  onClick={handleStartCreate}
                  className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 !text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} className="!text-white" />
                  <span>{i18n.btn_new_alert}</span>
                </button>
              </div>

              {/* Lista de Alertas */}
              {existingAlerts.length > 0 ? (
                <div className="space-y-3">
                  {existingAlerts.map(alert => (
                    <div
                      key={alert.id}
                      className="p-4 bg-white border border-slate-200/90 rounded-2xl flex flex-col gap-3 shadow-sm hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase rounded-xl border border-emerald-200/80 max-w-full truncate flex items-center gap-1">
                              <Briefcase size={11} className="shrink-0" />
                              {alert.workTopic}
                            </span>
                            <span className="px-2.5 py-1 bg-sky-50 text-sky-700 text-[10px] font-black uppercase rounded-xl border border-sky-200/80 flex items-center gap-1">
                              <MapPin size={11} className="shrink-0" />
                              {alert.location}
                            </span>
                            {alert.keywords && (
                              <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-[10px] font-black uppercase rounded-xl border border-purple-200/80 truncate flex items-center gap-1">
                                <Tag size={11} className="shrink-0" />
                                "{alert.keywords}"
                              </span>
                            )}
                          </div>
                          <p className="text-[9px] text-slate-400 font-bold tracking-wider uppercase !mb-0 flex items-center gap-1">
                            <Clock size={10} />
                            {i18n.created_at} {new Date(alert.createdAt).toLocaleDateString('pt-PT')} • {alert.frequency === 'instant' ? i18n.freq_instant : alert.frequency === 'daily' ? i18n.freq_daily : i18n.freq_weekly}
                          </p>
                        </div>

                        {/* Badge Ativo / Pausado */}
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 border ${
                          alert.isActive
                            ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30'
                            : 'bg-slate-100 text-slate-500 border-slate-300'
                        }`}>
                          {alert.isActive ? i18n.status_active : i18n.status_paused}
                        </span>
                      </div>

                      {/* Barra de Ações: Editar | Ativar/Pausar | Apagar */}
                      <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(alert)}
                            className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 size={12} />
                            {i18n.btn_edit}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggle(alert.id, alert.isActive)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                              alert.isActive
                                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            {alert.isActive ? i18n.status_paused : i18n.status_active}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDelete(alert.id)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all border border-slate-200 hover:border-red-200 shrink-0 cursor-pointer"
                          title={i18n.delete_tooltip}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-white border border-slate-200 rounded-2xl text-center space-y-2">
                  <p className="text-xs font-bold text-slate-600 uppercase">{i18n.empty_list_msg}</p>
                  <p className="text-[11px] text-slate-400">{i18n.empty_list_sub}</p>
                  <button
                    type="button"
                    onClick={handleStartCreate}
                    className="mt-2 px-4 py-2 bg-emerald-500 text-white text-xs font-black uppercase rounded-xl"
                  >
                    {i18n.btn_new_alert}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* ESTADO 1 / EDIÇÃO: FORMULÁRIO DE CRIAÇÃO OU EDIÇÃO            */}
          {/* ───────────────────────────────────────────────────────────── */}
          {(viewMode === 'create' || viewMode === 'edit') && (
            <form onSubmit={handleSubmit} className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-[2rem] p-4 sm:p-5 space-y-4 shadow-sm animate-in fade-in duration-200">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Sparkles size={13} className="text-emerald-500" />
                  {viewMode === 'edit' ? i18n.title_edit : i18n.title_create}
                </h4>

                {existingAlerts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('list');
                      setEditingAlertId(null);
                    }}
                    className="text-[10px] font-black text-slate-500 hover:text-slate-800 uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <ArrowLeft size={12} />
                    {i18n.btn_back_to_list} ({existingAlerts.length})
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Select Work Topic */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase size={12} className="text-sky-500 shrink-0" /> {i18n.area_label}
                  </label>
                  <div className="relative">
                    <select
                      value={workTopic}
                      onChange={(e) => setWorkTopic(e.target.value)}
                      className="w-full px-3.5 py-3 pr-9 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold uppercase text-slate-800 outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all cursor-pointer appearance-none shadow-sm truncate"
                    >
                      <option value="Todos">{i18n.all_areas}</option>
                      {WORK_TOPICS.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Select Location */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin size={12} className="text-emerald-500 shrink-0" /> {i18n.location_label}
                  </label>
                  <div className="relative">
                    <select
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full px-3.5 py-3 pr-9 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold uppercase text-slate-800 outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all cursor-pointer appearance-none shadow-sm"
                    >
                      {LOCATIONS_LIST.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Keyword Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag size={12} className="text-purple-500 shrink-0" /> {i18n.keywords_label}
                </label>
                <input
                  type="text"
                  placeholder={i18n.keywords_placeholder}
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all placeholder:text-slate-400 shadow-sm"
                />
              </div>

              {/* Frequency Selection Pills */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={12} className="text-teal-500 shrink-0" /> {i18n.frequency_label}
                </label>
                <div className="bg-slate-100 p-1.5 rounded-2xl grid grid-cols-3 gap-1.5 border border-slate-200/80">
                  {[
                    { id: 'instant', label: i18n.freq_instant },
                    { id: 'daily', label: i18n.freq_daily },
                    { id: 'weekly', label: i18n.freq_weekly },
                  ].map(freq => {
                    const isSelected = frequency === freq.id;
                    return (
                      <button
                        type="button"
                        key={freq.id}
                        onClick={() => setFrequency(freq.id as any)}
                        className={`py-2.5 px-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all text-center truncate cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-500 !text-white shadow-md shadow-emerald-500/30 border border-emerald-400 font-extrabold scale-[1.02]'
                            : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200/70 font-bold'
                        }`}
                      >
                        {freq.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                {viewMode === 'edit' && (
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('list');
                      setEditingAlertId(null);
                    }}
                    className="py-4 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black uppercase tracking-wider text-xs rounded-2xl border border-slate-200 transition-all cursor-pointer"
                  >
                    {i18n.btn_cancel_edit}
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:brightness-110 !text-white font-black uppercase tracking-[0.2em] text-xs sm:text-sm rounded-2xl shadow-xl shadow-emerald-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 border border-emerald-400/40 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin !text-white shrink-0" />
                      <span className="drop-shadow-sm font-black !text-white">A processar...</span>
                    </>
                  ) : (
                    <>
                      <Bell size={18} className="animate-bounce !text-white shrink-0 drop-shadow" />
                      <span className="drop-shadow-sm font-black !text-white">
                        {viewMode === 'edit' ? i18n.submit_edit_btn : i18n.submit_create_btn}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
