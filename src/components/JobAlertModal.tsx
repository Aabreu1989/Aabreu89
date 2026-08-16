import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Trash2, Sparkles, MapPin, Briefcase, Tag, Clock, CheckCircle2, ChevronDown } from 'lucide-react';
import { WORK_TOPICS } from '../types';
import { jobAlertService, JobAlert } from '../services/jobAlertService';
import { t } from '../utils/translations';

interface JobAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
  user?: any;
  onAlertsChanged?: () => void;
}

const LOCATIONS_LIST = [
  "Todos os Distritos", "Lisboa", "Porto", "Braga", "Setúbal", "Faro", "Coimbra", "Aveiro", "Remoto", "Leiria", "Santarém", "Viseu", "Évora"
];

const MODAL_I18N: Record<string, Record<string, string>> = {
  PT: {
    notifications_badge: '✦ Notificações MIRA',
    title: 'Alertas de Emprego',
    config_title: 'Configurar Novo Alerta',
    area_label: 'Área de Atuação',
    location_label: 'Distrito / Cidade',
    all_areas: '🌐 Todas as Áreas',
    keywords_label: 'Cargo ou Palavra-Chave (Opcional)',
    keywords_placeholder: 'Ex: Cozinheiro, Enfermeiro, Motorista...',
    frequency_label: 'Frequência de Alertas',
    freq_instant: 'Instantânea',
    freq_daily: 'Diária',
    freq_weekly: 'Semanal',
    submit_btn: 'Ativar Alerta de Vagas',
    active_alerts_title: 'Seus Alertas Ativos',
    success_toast: 'Alerta configurado com sucesso! Notificaremos sobre novas vagas compatíveis.',
    status_active: 'Ativo',
    status_paused: 'Pausado',
    delete_tooltip: 'Eliminar Alerta',
    created_at: 'Criado em'
  },
  EN: {
    notifications_badge: '✦ MIRA Notifications',
    title: 'Job Alerts',
    config_title: 'Set Up New Alert',
    area_label: 'Field of Activity',
    location_label: 'District / City',
    all_areas: '🌐 All Fields',
    keywords_label: 'Role or Keyword (Optional)',
    keywords_placeholder: 'Ex: Chef, Nurse, Driver...',
    frequency_label: 'Alert Frequency',
    freq_instant: 'Instant',
    freq_daily: 'Daily',
    freq_weekly: 'Weekly',
    submit_btn: 'Activate Job Alert',
    active_alerts_title: 'Your Active Alerts',
    success_toast: 'Alert successfully set up! We will notify you about matching new jobs.',
    status_active: 'Active',
    status_paused: 'Paused',
    delete_tooltip: 'Delete Alert',
    created_at: 'Created on'
  },
  ES: {
    notifications_badge: '✦ Notificaciones MIRA',
    title: 'Alertas de Empleo',
    config_title: 'Configurar Nuevo Alerta',
    area_label: 'Área de Actuación',
    location_label: 'Distrito / Ciudad',
    all_areas: '🌐 Todas las Áreas',
    keywords_label: 'Cargo o Palabra Clave (Opcional)',
    keywords_placeholder: 'Ej: Cocinero, Enfermero, Conductor...',
    frequency_label: 'Frecuencia de Alertas',
    freq_instant: 'Instantánea',
    freq_daily: 'Diaria',
    freq_weekly: 'Semanal',
    submit_btn: 'Activar Alerta de Empleo',
    active_alerts_title: 'Tus Alertas Activas',
    success_toast: '¡Alerta configurada con éxito! Te notificaremos sobre nuevas vacantes compatibles.',
    status_active: 'Activo',
    status_paused: 'Pausado',
    delete_tooltip: 'Eliminar Alerta',
    created_at: 'Creado el'
  },
  FR: {
    notifications_badge: '✦ Notifications MIRA',
    title: 'Alertes d\'Emploi',
    config_title: 'Configurer Nouvel Alerte',
    area_label: 'Domaine d\'Activité',
    location_label: 'District / Ville',
    all_areas: '🌐 Tous les Domaines',
    keywords_label: 'Poste ou Mot-Clé (Optionnel)',
    keywords_placeholder: 'Ex: Cuisinier, Infirmière, Chauffeur...',
    frequency_label: 'Fréquence des Alertes',
    freq_instant: 'Instantanée',
    freq_daily: 'Quotidienne',
    freq_weekly: 'Hebdomadaire',
    submit_btn: 'Activer l\'Alerte d\'Emploi',
    active_alerts_title: 'Vos Alertes Actives',
    success_toast: 'Alerte configurée avec succès ! Nous vous informerons des nouvelles offres compatibles.',
    status_active: 'Actif',
    status_paused: 'En pause',
    delete_tooltip: 'Supprimer l\'Alerte',
    created_at: 'Créé le'
  }
};

export const JobAlertModal: React.FC<JobAlertModalProps> = ({
  isOpen,
  onClose,
  language,
  user,
  onAlertsChanged
}) => {
  const [workTopic, setWorkTopic] = useState('Todos');
  const [location, setLocation] = useState('Todos os Distritos');
  const [keywords, setKeywords] = useState('');
  const [frequency, setFrequency] = useState<'instant' | 'daily' | 'weekly'>('instant');
  const [existingAlerts, setExistingAlerts] = useState<JobAlert[]>([]);
  const [successToast, setSuccessToast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const langKey = (language || 'PT').toUpperCase();
  const i18n = MODAL_I18N[langKey] || MODAL_I18N['PT'];

  useEffect(() => {
    if (isOpen) {
      loadAlerts();
    }
  }, [isOpen, user?.id]);

  const loadAlerts = async () => {
    const alerts = await jobAlertService.getAlertsAsync(user?.id);
    setExistingAlerts(alerts);
  };

  if (!isOpen) return null;

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await jobAlertService.saveAlert({
        workTopic,
        location,
        keywords,
        frequency
      }, user?.id);
      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 3500);
      setKeywords('');
      await loadAlerts();
      if (onAlertsChanged) onAlertsChanged();
    } catch (err) {
      console.error('MIRA: Erro ao salvar alerta:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (alertId: string, currentStatus: boolean) => {
    await jobAlertService.toggleAlert(alertId, !currentStatus, user?.id);
    await loadAlerts();
    if (onAlertsChanged) onAlertsChanged();
  };

  const handleDelete = async (alertId: string) => {
    await jobAlertService.deleteAlert(alertId, user?.id);
    await loadAlerts();
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
                {i18n.title}
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
          {successToast && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top duration-300 shadow-sm">
              <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
              <p className="text-xs font-bold uppercase tracking-tight">
                {i18n.success_toast}
              </p>
            </div>
          )}

          {/* Form Create Alert */}
          <form onSubmit={handleCreateAlert} className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-[2rem] p-4 sm:p-5 space-y-4 shadow-sm">
            <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-2">
              <Sparkles size={13} className="text-emerald-500" />
              {i18n.config_title}
            </h4>

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

            {/* Frequency Selection Pills with Light Green Theme */}
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

            {/* Light Green Submit Button */}
            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:brightness-110 !text-white font-black uppercase tracking-[0.2em] text-xs sm:text-sm rounded-2xl shadow-xl shadow-emerald-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 border border-emerald-400/40 cursor-pointer mt-2"
            >
              <Bell size={18} className="animate-bounce !text-white shrink-0 drop-shadow" />
              <span className="drop-shadow-sm font-black !text-white">{i18n.submit_btn}</span>
            </button>
          </form>

          {/* Active Alerts List */}
          {existingAlerts.length > 0 && (
            <div className="space-y-3 pt-1">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">
                {i18n.active_alerts_title} ({existingAlerts.length})
              </h4>

              <div className="space-y-2.5">
                {existingAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className="p-4 bg-white border border-slate-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:border-slate-300 transition-all"
                  >
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[9px] sm:text-[10px] font-black uppercase rounded-xl border border-emerald-200/80 max-w-full truncate">
                          {alert.workTopic}
                        </span>
                        <span className="px-2.5 py-1 bg-sky-50 text-sky-700 text-[9px] sm:text-[10px] font-black uppercase rounded-xl border border-sky-200/80">
                          {alert.location}
                        </span>
                        {alert.keywords && (
                          <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-[9px] sm:text-[10px] font-black uppercase rounded-xl border border-purple-200/80 truncate">
                            "{alert.keywords}"
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] text-slate-400 font-bold tracking-wider uppercase !mb-0">
                        {i18n.created_at} {new Date(alert.createdAt).toLocaleDateString('pt-PT')} • {alert.frequency === 'instant' ? i18n.freq_instant : alert.frequency === 'daily' ? i18n.freq_daily : i18n.freq_weekly}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t border-slate-100 sm:border-0 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => handleToggle(alert.id, alert.isActive)}
                        className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all text-center cursor-pointer ${
                          alert.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 shadow-xs'
                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {alert.isActive ? i18n.status_active : i18n.status_paused}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(alert.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all border border-slate-200 hover:border-red-200 shrink-0 cursor-pointer"
                        title={i18n.delete_tooltip}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
