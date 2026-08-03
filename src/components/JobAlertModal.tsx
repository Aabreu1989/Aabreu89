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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white border border-slate-100 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Bell size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  ✦ Notificações Inteligentes
                </span>
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight text-white mt-1">
                Alerta de Emprego MIRA
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center border border-white/10 hover:bg-white/20 active:scale-95 transition-all relative z-10"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 no-scrollbar">
          {successToast && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top duration-300">
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
              <p className="text-xs font-bold uppercase tracking-tight">
                Alerta de Vagas criado com sucesso! Notificaremos quando surgirem ofertas compatíveis.
              </p>
            </div>
          )}

          {/* Form Create Alert */}
          <form onSubmit={handleCreateAlert} className="bg-slate-50 border border-slate-150 rounded-[2rem] p-5 space-y-4 shadow-inner">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Sparkles size={12} className="text-amber-500" />
              Configurar Novo Alerta
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Select Work Topic */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <Briefcase size={10} className="text-sky-500" /> Área de Atuação
                </label>
                <select
                  value={workTopic}
                  onChange={(e) => setWorkTopic(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-extrabold uppercase text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all cursor-pointer"
                >
                  <option value="Todos">🌐 Todas as Áreas</option>
                  {WORK_TOPICS.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Select Location */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <MapPin size={10} className="text-amber-500" /> Distrito / Cidade
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-extrabold uppercase text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all cursor-pointer"
                >
                  {LOCATIONS_LIST.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Keyword Input */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Tag size={10} className="text-purple-500" /> Cargo ou Palavra-Chave (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: Cozinheiro, Enfermeiro, Python, Motorista..."
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all placeholder:text-slate-400"
              />
            </div>

            {/* Frequency Selection */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Clock size={10} className="text-teal-500" /> Frequência de Notificação
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'instant', label: 'Instantânea' },
                  { id: 'daily', label: 'Diária' },
                  { id: 'weekly', label: 'Semanal' },
                ].map(freq => (
                  <button
                    type="button"
                    key={freq.id}
                    onClick={() => setFrequency(freq.id as any)}
                    className={`py-2.5 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all text-center border ${
                      frequency === freq.id
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {freq.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-[#FF8C00] via-amber-500 to-[#FF8C00] hover:from-amber-500 hover:to-orange-600 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-xl shadow-orange-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 mt-2 border border-orange-400/40 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none" />
              <Bell size={18} className="animate-bounce text-white shrink-0 drop-shadow" />
              <span className="drop-shadow-sm font-black">Ativar Alerta de Vagas</span>
            </button>
          </form>

          {/* Active Alerts List */}
          {existingAlerts.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">
                Seus Alertas Ativos ({existingAlerts.length})
              </h4>

              <div className="space-y-2">
                {existingAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className="p-4 bg-white border border-slate-150 rounded-2xl flex items-center justify-between gap-3 shadow-xs hover:border-slate-200 transition-all"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-700 text-[9px] font-black uppercase rounded-full border border-amber-500/20">
                          {alert.workTopic}
                        </span>
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-black uppercase rounded-full border border-slate-200">
                          {alert.location}
                        </span>
                        {alert.keywords && (
                          <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[9px] font-black uppercase rounded-full border border-purple-100">
                            "{alert.keywords}"
                          </span>
                        )}
                      </div>
                      <p className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase">
                        Criado em {new Date(alert.createdAt).toLocaleDateString('pt-PT')} • {alert.frequency === 'instant' ? 'Instantâneo' : alert.frequency === 'daily' ? 'Diário' : 'Semanal'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggle(alert.id, alert.isActive)}
                        className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all ${
                          alert.isActive
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {alert.isActive ? 'Ativo' : 'Pausado'}
                      </button>
                      <button
                        onClick={() => handleDelete(alert.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all border border-slate-100"
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
