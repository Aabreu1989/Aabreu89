import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Trash2, Sparkles, MapPin, Briefcase, Tag, Clock, CheckCircle2 } from 'lucide-react';
import { WORK_TOPICS } from '../types';
import { jobAlertService, JobAlert } from '../services/jobAlertService';
import { t } from '../utils/translations';
import { getWorkTopicKey } from '../utils/categoryUtils';

interface JobAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
  onAlertsChanged?: () => void;
}

const LOCATIONS_LIST = [
  "Todos os Distritos", "Lisboa", "Porto", "Braga", "Setúbal", "Faro", "Coimbra", "Aveiro", "Remoto", "Leiria", "Santarém", "Viseu", "Évora"
];

export const JobAlertModal: React.FC<JobAlertModalProps> = ({
  isOpen,
  onClose,
  language,
  onAlertsChanged
}) => {
  const [workTopic, setWorkTopic] = useState('Todos');
  const [location, setLocation] = useState('Todos os Distritos');
  const [keywords, setKeywords] = useState('');
  const [frequency, setFrequency] = useState<'instant' | 'daily' | 'weekly'>('instant');
  const [existingAlerts, setExistingAlerts] = useState<JobAlert[]>([]);
  const [successToast, setSuccessToast] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAlerts();
    }
  }, [isOpen]);

  const loadAlerts = () => {
    const alerts = jobAlertService.getAlerts();
    setExistingAlerts(alerts);
  };

  if (!isOpen) return null;

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    await jobAlertService.saveAlert({
      workTopic,
      location,
      keywords,
      frequency
    });
    setSuccessToast(true);
    setTimeout(() => setSuccessToast(false), 3000);
    setKeywords('');
    loadAlerts();
    if (onAlertsChanged) onAlertsChanged();
  };

  const handleToggle = async (alertId: string, currentStatus: boolean) => {
    await jobAlertService.toggleAlert(alertId, !currentStatus);
    loadAlerts();
    if (onAlertsChanged) onAlertsChanged();
  };

  const handleDelete = async (alertId: string) => {
    await jobAlertService.deleteAlert(alertId);
    loadAlerts();
    if (onAlertsChanged) onAlertsChanged();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300">
      {/* Backdrop overlay click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Modal Container */}
      <div className="bg-white text-slate-900 border border-slate-200/90 w-full max-w-xl rounded-t-[2.2rem] sm:rounded-[2.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh] animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 relative z-10">
        
        {/* Mobile Pull Handle Indicator */}
        <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-between border-b border-slate-800 relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-36 h-36 bg-[#FF8C00]/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center gap-3 relative z-10 min-w-0 pr-2">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-[#FF8C00] to-[#FF5500] p-0.5 shadow-lg shadow-orange-500/30 shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[0.9rem] flex items-center justify-center">
                <Bell size={22} className="text-[#FF8C00] animate-pulse" />
              </div>
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-black text-[#FF8C00] uppercase tracking-widest bg-[#FF8C00]/15 px-2.5 py-0.5 rounded-full border border-[#FF8C00]/30 inline-block truncate">
                ✦ Notificações MIRA
              </span>
              <h3 className="text-base sm:text-xl font-black uppercase tracking-tight text-white mt-0.5 truncate">
                Alertas de Emprego
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center justify-center border border-slate-700/60 active:scale-95 transition-all relative z-10 shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1 custom-scrollbar bg-slate-50/50">
          {successToast && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top duration-300 shadow-sm">
              <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
              <p className="text-xs font-bold uppercase tracking-tight">
                Alerta configurado com sucesso! Notificaremos sobre novas vagas compatíveis.
              </p>
            </div>
          )}

          {/* Form Create Alert */}
          <form onSubmit={handleCreateAlert} className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-[2rem] p-4 sm:p-5 space-y-4 shadow-sm">
            <h4 className="text-[10px] font-black text-[#FF8C00] uppercase tracking-[0.2em] flex items-center gap-2">
              <Sparkles size={13} className="text-[#FF8C00]" />
              Configurar Novo Alerta
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Select Work Topic */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase size={12} className="text-sky-500 shrink-0" /> Área de Atuação
                </label>
                <select
                  value={workTopic}
                  onChange={(e) => setWorkTopic(e.target.value)}
                  className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase text-slate-900 outline-none focus:border-[#FF8C00] focus:ring-4 focus:ring-[#FF8C00]/10 transition-all cursor-pointer truncate shadow-sm"
                >
                  <option value="Todos">🌐 Todas as Áreas</option>
                  {WORK_TOPICS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Select Location */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin size={12} className="text-[#FF8C00] shrink-0" /> Distrito / Cidade
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase text-slate-900 outline-none focus:border-[#FF8C00] focus:ring-4 focus:ring-[#FF8C00]/10 transition-all cursor-pointer shadow-sm"
                >
                  {LOCATIONS_LIST.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Keyword Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Tag size={12} className="text-purple-500 shrink-0" /> Cargo ou Palavra-Chave (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: Cozinheiro, Enfermeiro, Motorista..."
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#FF8C00] focus:ring-4 focus:ring-[#FF8C00]/10 transition-all placeholder:text-slate-400 shadow-sm"
              />
            </div>

            {/* Frequency Selection Pills */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={12} className="text-teal-500 shrink-0" /> Frequência de Alertas
              </label>
              <div className="bg-slate-100/80 p-1 rounded-2xl grid grid-cols-3 gap-1 border border-slate-200/60">
                {[
                  { id: 'instant', label: 'Instantânea' },
                  { id: 'daily', label: 'Diária' },
                  { id: 'weekly', label: 'Semanal' },
                ].map(freq => (
                  <button
                    type="button"
                    key={freq.id}
                    onClick={() => setFrequency(freq.id as any)}
                    className={`py-2.5 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all text-center truncate ${
                      frequency === freq.id
                        ? 'bg-gradient-to-r from-[#FF8C00] to-[#FF5500] text-white shadow-md shadow-orange-500/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                    }`}
                  >
                    {freq.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-[#FF8C00] via-amber-500 to-[#FF5500] hover:brightness-105 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-xl shadow-orange-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 border border-orange-400/30 cursor-pointer mt-2"
            >
              <Bell size={18} className="animate-bounce text-white shrink-0 drop-shadow" />
              <span className="drop-shadow-sm font-black">Ativar Alerta de Vagas</span>
            </button>
          </form>

          {/* Active Alerts List */}
          {existingAlerts.length > 0 && (
            <div className="space-y-3 pt-1">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">
                Seus Alertas Ativos ({existingAlerts.length})
              </h4>

              <div className="space-y-2.5">
                {existingAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className="p-4 bg-white border border-slate-200/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:border-slate-300 transition-all"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 bg-orange-50 text-[#FF8C00] text-[9px] font-black uppercase rounded-full border border-orange-200 max-w-full truncate">
                          {alert.workTopic}
                        </span>
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[9px] font-black uppercase rounded-full border border-slate-200">
                          {alert.location}
                        </span>
                        {alert.keywords && (
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[9px] font-black uppercase rounded-full border border-purple-200 truncate">
                            "{alert.keywords}"
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] text-slate-500 font-bold tracking-wider uppercase">
                        Criado em {new Date(alert.createdAt).toLocaleDateString('pt-PT')} • {alert.frequency === 'instant' ? 'Instantâneo' : alert.frequency === 'daily' ? 'Diário' : 'Semanal'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t border-slate-100 sm:border-0 w-full sm:w-auto">
                      <button
                        onClick={() => handleToggle(alert.id, alert.isActive)}
                        className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all text-center ${
                          alert.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {alert.isActive ? 'Ativo' : 'Pausado'}
                      </button>
                      <button
                        onClick={() => handleDelete(alert.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all border border-slate-200 hover:border-red-200 shrink-0"
                        title="Eliminar Alerta"
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
