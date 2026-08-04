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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800/80 w-full max-w-xl rounded-2xl sm:rounded-[2.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[90vh] animate-in zoom-in-95 duration-300 relative text-white">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-between border-b border-slate-800/80 relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-36 h-36 bg-[#FF8C00]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-2.5 sm:gap-3.5 relative z-10 min-w-0 pr-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#FF8C00] to-[#FF5500] p-0.5 shadow-lg shadow-orange-500/25 shrink-0 flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[0.7rem] sm:rounded-[0.9rem] flex items-center justify-center">
                <Bell size={20} className="text-[#FF8C00] animate-pulse" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] sm:text-[9px] font-black text-[#FF8C00] uppercase tracking-widest bg-[#FF8C00]/10 px-2 sm:px-2.5 py-0.5 rounded-full border border-[#FF8C00]/20 truncate">
                  ✦ Notificações Inteligentes
                </span>
              </div>
              <h3 className="text-base sm:text-xl font-black uppercase tracking-tight text-white mt-0.5 truncate">
                Alerta de Emprego MIRA
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-slate-800/60 text-slate-300 flex items-center justify-center border border-slate-700/50 hover:bg-slate-700 hover:text-white active:scale-95 transition-all relative z-10 shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1 custom-scrollbar">
          {successToast && (
            <div className="p-3.5 sm:p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl sm:rounded-2xl flex items-center gap-3 animate-in slide-in-from-top duration-300">
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
              <p className="text-[11px] sm:text-xs font-bold uppercase tracking-tight">
                Alerta de Vagas criado com sucesso! Notificaremos quando surgirem ofertas compatíveis.
              </p>
            </div>
          )}

          {/* Form Create Alert */}
          <form onSubmit={handleCreateAlert} className="bg-slate-850/60 border border-slate-800 rounded-xl sm:rounded-[2rem] p-4 sm:p-5 space-y-3.5 sm:space-y-4 shadow-xl backdrop-blur-md">
            <h4 className="text-[9px] sm:text-[10px] font-black text-[#FF8C00] uppercase tracking-[0.2em] flex items-center gap-2">
              <Sparkles size={12} className="text-[#FF8C00]" />
              Configurar Novo Alerta
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Select Work Topic */}
              <div className="space-y-1.5">
                <label className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Briefcase size={10} className="text-sky-400 shrink-0" /> Área de Atuação
                </label>
                <select
                  value={workTopic}
                  onChange={(e) => setWorkTopic(e.target.value)}
                  className="w-full px-3.5 py-3 sm:py-3.5 bg-slate-900/90 border border-slate-750 rounded-xl text-xs font-extrabold uppercase text-white outline-none focus:border-[#FF8C00] focus:ring-2 focus:ring-[#FF8C00]/20 transition-all cursor-pointer shadow-inner truncate pr-8"
                >
                  <option value="Todos" className="bg-slate-900 text-white">🌐 Todas as Áreas</option>
                  {WORK_TOPICS.map(t => (
                    <option key={t} value={t} className="bg-slate-900 text-white">{t}</option>
                  ))}
                </select>
              </div>

              {/* Select Location */}
              <div className="space-y-1.5">
                <label className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <MapPin size={10} className="text-[#FF8C00] shrink-0" /> Distrito / Cidade
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3.5 py-3 sm:py-3.5 bg-slate-900/90 border border-slate-750 rounded-xl text-xs font-extrabold uppercase text-white outline-none focus:border-[#FF8C00] focus:ring-2 focus:ring-[#FF8C00]/20 transition-all cursor-pointer shadow-inner pr-8"
                >
                  {LOCATIONS_LIST.map(loc => (
                    <option key={loc} value={loc} className="bg-slate-900 text-white">{loc}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Keyword Input */}
            <div className="space-y-1.5">
              <label className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Tag size={10} className="text-purple-400 shrink-0" /> Cargo ou Palavra-Chave (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: Cozinheiro, Enfermeiro, Motorista..."
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className="w-full px-3.5 py-3 sm:py-3.5 bg-slate-900/90 border border-slate-750 rounded-xl text-xs font-bold text-white outline-none focus:border-[#FF8C00] focus:ring-2 focus:ring-[#FF8C00]/20 transition-all placeholder:text-slate-500 shadow-inner"
              />
            </div>

            {/* Frequency Selection */}
            <div className="space-y-1.5">
              <label className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Clock size={10} className="text-teal-400 shrink-0" /> Frequência de Notificação
              </label>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                {[
                  { id: 'instant', label: 'Instantânea' },
                  { id: 'daily', label: 'Diária' },
                  { id: 'weekly', label: 'Semanal' },
                ].map(freq => (
                  <button
                    type="button"
                    key={freq.id}
                    onClick={() => setFrequency(freq.id as any)}
                    className={`py-2.5 sm:py-3 px-1.5 sm:px-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all text-center border truncate ${
                      frequency === freq.id
                        ? 'bg-gradient-to-r from-[#FF8C00] to-[#FF5500] text-white border-orange-400/50 shadow-lg shadow-orange-500/25 scale-[1.02]'
                        : 'bg-slate-900/80 text-slate-400 border-slate-750 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {freq.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-[#FF8C00] via-amber-500 to-[#FF5500] hover:brightness-110 text-white font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-xs rounded-xl sm:rounded-2xl shadow-xl shadow-orange-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 mt-2 sm:mt-3 border border-orange-400/40 relative overflow-hidden group cursor-pointer"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none" />
              <Bell size={18} className="animate-bounce text-white shrink-0 drop-shadow" />
              <span className="drop-shadow-sm font-black">Ativar Alerta de Vagas</span>
            </button>
          </form>

          {/* Active Alerts List */}
          {existingAlerts.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">
                Seus Alertas Ativos ({existingAlerts.length})
              </h4>

              <div className="space-y-2.5">
                {existingAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className="p-3.5 sm:p-4 bg-slate-850/80 border border-slate-800 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md hover:border-slate-700 transition-all"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 bg-[#FF8C00]/15 text-[#FF8C00] text-[8px] sm:text-[9px] font-black uppercase rounded-full border border-[#FF8C00]/30 max-w-full truncate">
                          {alert.workTopic}
                        </span>
                        <span className="px-2.5 py-0.5 bg-slate-800 text-slate-300 text-[8px] sm:text-[9px] font-black uppercase rounded-full border border-slate-700">
                          {alert.location}
                        </span>
                        {alert.keywords && (
                          <span className="px-2 py-0.5 bg-purple-500/15 text-purple-300 text-[8px] sm:text-[9px] font-black uppercase rounded-full border border-purple-500/30 truncate">
                            "{alert.keywords}"
                          </span>
                        )}
                      </div>
                      <p className="text-[8px] sm:text-[9px] text-slate-400 font-semibold tracking-wider uppercase">
                        Criado em {new Date(alert.createdAt).toLocaleDateString('pt-PT')} • {alert.frequency === 'instant' ? 'Instantâneo' : alert.frequency === 'daily' ? 'Diário' : 'Semanal'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t border-slate-800/60 sm:border-0 w-full sm:w-auto">
                      <button
                        onClick={() => handleToggle(alert.id, alert.isActive)}
                        className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-wider border transition-all text-center ${
                          alert.isActive
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-750'
                        }`}
                      >
                        {alert.isActive ? 'Ativo' : 'Pausado'}
                      </button>
                      <button
                        onClick={() => handleDelete(alert.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/15 transition-all border border-slate-800 hover:border-red-500/30 shrink-0"
                        title="Eliminar Alerta"
                      >
                        <Trash2 size={14} />
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
