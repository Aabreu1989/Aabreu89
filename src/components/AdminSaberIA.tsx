import React, { useState } from 'react';
import { ShieldCheck, Brain, Database, Flame, Briefcase, Stethoscope, Home, FileText, Users, Link as LinkIcon, PlusCircle, Trash2 } from 'lucide-react';
import { adminService } from '../services/adminService';
import { useToast } from './Toast';
import { SABER_IA_TAXONOMY } from '../brain/taxonomy/knowledgeTaxonomy';

/**
 * 🛡️ MIRA SOVEREIGN v6.0: ADMIN SABER IA
 * This is a protected component for the Diamond Master Admin Hub.
 * It strictly adheres to the 7-node knowledge taxonomy defined in SQL V68.1.
 */

const CATEGORY_UI: Record<string, { icon: any, color: string }> = {
    diretrizes_ceo: { icon: ShieldCheck, color: 'text-orange-500' },
    vistos_aima: { icon: FileText, color: 'text-blue-500' },
    saude_sns: { icon: Stethoscope, color: 'text-emerald-500' },
    trabalho_seg_social: { icon: Briefcase, color: 'text-yellow-500' },
    habitacao_nif: { icon: Home, color: 'text-rose-500' },
    hacks_da_tribo: { icon: Flame, color: 'text-orange-600' },
    acolhimento_e_apoio: { icon: Users, color: 'text-cyan-500' }
};

const AdminSaberIA = ({ onRefresh }: { onRefresh?: () => void }) => {
    const [newKnowledge, setNewKnowledge] = useState({ 
        topic: '', 
        information: '', 
        category: 'diretrizes_ceo', 
        url: '' 
    });
    const [isInjecting, setIsInjecting] = useState(false);
    const [items, setItems] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(0);
    const limit = 20;
    const { showToast } = useToast();

    const loadKnowledge = async () => {
        setIsLoading(true);
        try {
            const data = await adminService.fetchAIKnowledgePaginated(page, limit);
            setItems(data.items);
            setTotal(data.total);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        loadKnowledge();
    }, [page]);

    const handleInjectKnowledge = async () => {
        if (!newKnowledge.topic || !newKnowledge.information) {
            showToast('Tópico e Informação são obrigatórios.', 'error');
            return;
        }

        setIsInjecting(true);
        try {
            await adminService.addAIKnowledge(newKnowledge);
            setNewKnowledge({ topic: '', information: '', category: 'diretrizes_ceo', url: '' });
            showToast('💎 Saber IA hidratado com sucesso!', 'success');
            loadKnowledge();
            if (onRefresh) onRefresh();
        } catch (err: any) {
            showToast(`Erro na Injeção: ${err.message}`, 'error');
        } finally {
            setIsInjecting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem a certeza que deseja eliminar este Saber Soberano?')) return;
        try {
            await adminService.deleteAIKnowledge(id);
            showToast('Nodo de Inteligência removido.', 'success');
            loadKnowledge();
        } catch (err: any) {
            showToast('Erro ao remover: ' + err.message, 'error');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header: Intelligence Pillar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl">
                        <Brain className="text-orange-500" size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tighter text-white">SABER IA <span className="text-orange-500">v6.0</span></h2>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Injeção de Conhecimento Soberano (RAG Protocol)</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                        <span className="text-[14px] font-black text-white">{total}</span>
                        <span className="text-[7px] font-black text-white/40 uppercase tracking-widest">Nodos Ativos</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <Database size={10} className="text-emerald-500" />
                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Master Base: Online</span>
                    </div>
                </div>
            </div>

            {/* Injection Form: The Master Gateway */}
            <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] shadow-2xl backdrop-blur-3xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-1000 pointer-events-none">
                    <ShieldCheck size={120} className="text-white" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                    <div className="lg:col-span-2 space-y-2">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Assunto / Tópico Neural</label>
                        <input 
                            type="text" 
                            placeholder="Ex: HACK DA TRIBO: NIF 2026..." 
                            value={newKnowledge.topic}
                            onChange={(e) => setNewKnowledge({...newKnowledge, topic: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none focus:border-orange-500/50 focus:bg-white/10 transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Taxonomia MIRA</label>
                        <select 
                            value={newKnowledge.category}
                            onChange={(e) => setNewKnowledge({...newKnowledge, category: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none focus:border-orange-500/50 focus:bg-white/10 cursor-pointer"
                        >
                            {SABER_IA_TAXONOMY.map(cat => (
                                <option key={cat.key} value={cat.key} className="bg-slate-900 text-white">
                                    {cat.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Fonte / URL Oficial</label>
                        <input 
                            type="text" 
                            placeholder="https://..." 
                            value={newKnowledge.url}
                            onChange={(e) => setNewKnowledge({...newKnowledge, url: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none focus:border-orange-500/50 focus:bg-white/10 transition-all"
                        />
                    </div>

                    <div className="md:col-span-4 space-y-2">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Conteúdo Neural (O alimento do MIRA)</label>
                        <textarea 
                            value={newKnowledge.information}
                            placeholder="Descreva a diretriz ou hack com precisão cirúrgica..." 
                            onChange={(e) => setNewKnowledge({...newKnowledge, information: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-5 text-sm font-bold text-white outline-none focus:border-orange-500/50 focus:bg-white/10 h-32 transition-all resize-none"
                        />
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <button 
                        onClick={handleInjectKnowledge}
                        disabled={isInjecting}
                        className="group px-10 py-5 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 transition-all active:scale-95 shadow-2xl shadow-orange-600/20"
                    >
                        {isInjecting ? 'SINCRONIZANDO...' : 'INJETAR NO CÉREBRO MIRA'}
                        <Brain size={18} />
                    </button>
                </div>
            </div>

            {/* Knowledge List: Retrieval Viewer */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-2">Explorador de Inteligência Ativa</h3>
                
                {isLoading ? (
                    <div className="flex justify-center p-20">
                        <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {items.length === 0 ? (
                            <div className="col-span-full p-20 text-center bg-white/5 border border-white/5 rounded-[2rem]">
                                <Brain size={40} className="mx-auto mb-4 text-white/10" />
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">O cérebro do MIRA está vazio. Comece a injetar conhecimento.</p>
                            </div>
                        ) : items.map((item) => {
                            const UI = CATEGORY_UI[item.category] || { icon: Brain, color: 'text-white' };
                            return (
                                <div key={item.id} className="p-6 bg-white/5 border border-white/10 rounded-3xl group hover:bg-white/[0.08] transition-all relative overflow-hidden flex flex-col gap-3">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl bg-white/5 ${UI.color}`}>
                                                <UI.icon size={18} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-white line-clamp-1">{item.topic}</h4>
                                                <span className="text-[8px] font-black uppercase text-white/30 tracking-widest">{item.category}</span>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleDelete(item.id)}
                                            className="p-2 text-white/20 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                            title="Remover Nodo"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <p className="text-xs text-white/60 leading-relaxed line-clamp-3 italic">"{item.information}"</p>
                                    {item.url && (
                                        <div className="flex items-center gap-1 text-[9px] text-blue-400 font-bold hover:underline">
                                            <LinkIcon size={10} /> {new URL(item.url).hostname}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {total > limit && (
                    <div className="flex justify-center gap-2 mt-8">
                        <button onClick={() => setPage(p => Math.max(0, p-1))} className="px-4 py-2 text-[10px] font-black text-white bg-white/5 rounded-xl hover:bg-white/10 disabled:opacity-20" disabled={page === 0}>ANTERIOR</button>
                        <button onClick={() => setPage(p => p+1)} className="px-4 py-2 text-[10px] font-black text-white bg-white/5 rounded-xl hover:bg-white/10 disabled:opacity-20" disabled={(page+1)*limit >= total}>PRÓXIMO</button>
                    </div>
                )}
            </div>

            {/* Taxonomy Pillars */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 pt-4 border-t border-white/5">
                {SABER_IA_TAXONOMY.map(cat => {
                    const UI = CATEGORY_UI[cat.key] || { icon: Brain, color: 'text-white' };
                    return (
                        <div key={cat.key} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col items-center text-center group hover:bg-white/10 transition-all cursor-default">
                            <UI.icon className={`${UI.color} mb-3 group-hover:scale-110 transition-transform`} size={20} />
                            <span className="text-[7px] font-black uppercase text-white/60 tracking-wider mb-1 line-clamp-1">{cat.label}</span>
                            <div className="px-2 py-0.5 bg-black/50 rounded-full text-[6px] font-black text-white/40 border border-white/5">
                                PESO: {cat.weight >= 1000 ? `${cat.weight/1000}k` : cat.weight}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AdminSaberIA;
