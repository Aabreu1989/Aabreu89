
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { submitReportRest } from '../services/reportService';
import { Search, Filter, MapPin, Phone, Globe, Building2, RefreshCcw, ChevronDown, X } from 'lucide-react';
import { MapAlert } from '../types';
import { t } from '../utils/translations';
import { PROTECTED_SERVICES } from '../utils/protectedData';
import { useToast } from './Toast';
import { normalizeCategory } from '../utils/categoryUtils';

interface LocalServicesListProps {
    language: string;
    user: any;
    targetServiceId?: string | null;
    onClearTargetService?: () => void;
}

export const LocalServicesList: React.FC<LocalServicesListProps> = ({ language, user, targetServiceId, onClearTargetService }) => {
    const { showToast } = useToast();
    const [services, setServices] = useState<MapAlert[]>([]);
    const [filteredServices, setFilteredServices] = useState<MapAlert[]>([]);
    const [loading, setLoading] = useState(!localStorage.getItem('mira_services_cache'));
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todos');

    const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null);
    const highlightRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (targetServiceId && services.length > 0) {
            const timer = setTimeout(() => {
                const element = document.getElementById(`service-${targetServiceId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.classList.add('ring-4', 'ring-indigo-400', 'ring-offset-2');
                    setTimeout(() => {
                        element.classList.remove('ring-4', 'ring-indigo-400', 'ring-offset-2');
                        if (onClearTargetService) onClearTargetService();
                    }, 3000);
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [targetServiceId, services]);

    const fetchServices = async (retries = 3) => {
        setError(null);

        if (!navigator.onLine) {
            const cached = localStorage.getItem('mira_services_cache');
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    setServices(parsed);
                    setFilteredServices(parsed);
                } catch (e) {
                    setServices(PROTECTED_SERVICES);
                    setFilteredServices(PROTECTED_SERVICES);
                }
            } else {
                setServices(PROTECTED_SERVICES);
                setFilteredServices(PROTECTED_SERVICES);
            }
            setLoading(false);
            return;
        }

        const cached = localStorage.getItem('mira_services_cache');
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setServices(parsed);
                    setFilteredServices(parsed);
                    setLoading(false);
                }
            } catch (e) { }
        }

        try {
            const fetchPromise = supabase
                .from('map_alerts')
                .select('id, title, category, lat, lng, address, city, website, phone, email, avg_rating, description, created_at')
                .order('title', { ascending: true });

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('MIRA-TIMEOUT')), 5000)
            );

            const result: any = await Promise.race([fetchPromise, timeoutPromise]);
            const { data, error } = result;

            if (error) throw error;

            let mappedData: MapAlert[] = [];
            if (data && data.length > 0) {
                mappedData = data.map(item => ({
                    id: item.id,
                    title: item.title || 'Serviço Sem Nome',
                    category: normalizeCategory(item.category || 'Geral'),
                    lat: item.lat || 0,
                    lng: item.lng || 0,
                    distance: 'N/A',
                    address: item.address || 'Morada não disponível',
                    city: item.city || 'Portugal',
                    phone: item.phone || '',
                    email: item.email || '',
                    website: item.website || '',
                    avgRating: 0, // Ratings Purged
                    ratings: []
                }));
            }

            const finalData = [...mappedData];
            PROTECTED_SERVICES.forEach(ps => {
                if (!finalData.some(d => d.id === ps.id || d.title === ps.title)) {
                    finalData.push(ps);
                }
            });

            setServices(finalData);
            setFilteredServices(finalData);
            localStorage.setItem('mira_services_cache', JSON.stringify(finalData));

        } catch (err: any) {
            console.error('MIRA Services Error:', err);
            if (services.length === 0) {
                setServices(PROTECTED_SERVICES);
                setFilteredServices(PROTECTED_SERVICES);
            }
            if (retries > 0 && navigator.onLine) setTimeout(() => fetchServices(retries - 1), 2500);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    useEffect(() => {
        let result = services;
        if (selectedCategory !== 'Todos') result = result.filter(s => s.category === selectedCategory);
        if (searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase();
            result = result.filter(s =>
                s.title.toLowerCase().includes(term) ||
                s.address.toLowerCase().includes(term) ||
                s.city.toLowerCase().includes(term)
            );
        }

        result = [...result].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        setFilteredServices(result);
    }, [searchTerm, selectedCategory, services]);

    return (
        <div className="flex flex-col min-h-screen bg-white font-['Plus_Jakarta_Sans'] pb-24">
            <div className="bg-white px-6 pt-8 pb-4 space-y-6 z-30 border-b border-slate-50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                         <h2 className="mira-module-title">
                            {t('service_guide_title', language)}
                        </h2>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-mira-blue animate-pulse"></div>
                            <p className="mira-module-subtitle !mb-0">
                                {t('service_guide_subtitle', language)}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => fetchServices()}
                        className="p-3 bg-slate-50 text-slate-400 hover:text-mira-blue hover:bg-mira-blue/5 rounded-2xl transition-all active:rotate-180 duration-500 w-full sm:w-auto flex justify-center shrink-0 border border-slate-100"
                    >
                        <RefreshCcw size={22} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative group flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-mira-blue transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder={t('service_search_place', language)}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-mira-blue transition-all shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="relative group flex-1">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-mira-blue transition-colors pointer-events-none" size={18} />
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full pl-12 pr-10 py-5 sm:py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-900 outline-none focus:bg-white focus:border-mira-blue transition-all shadow-sm appearance-none cursor-pointer"
                        >
                            <option value="Todos">{t('map_all_areas', language)}</option>
                            {Array.from(new Set(services.map(s => s.category || 'Geral'))).sort().map(cat => (
                                <option key={cat} value={cat}>{t(cat as string, language)}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    </div>
                </div>
            </div>

            <div className="px-6 space-y-6 pb-10 mt-4">
                {loading && services.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-6 animate-pulse">
                        <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200">
                            <Building2 size={40} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">{t('service_loading', language)}</p>
                    </div>
                ) : filteredServices.length > 0 ? (
                    <div className="grid grid-cols-1 gap-5">
                        {filteredServices.map((service) => (
                            <div 
                                id={`service-${service.id}`}
                                key={service.id} 
                                className="bg-white text-slate-900 p-6 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:shadow-[#0ea5e9]/10 transition-all cursor-pointer group active:scale-[0.98] relative overflow-hidden"
                                style={{ border: '3px solid #0ea5e9' }}
                            >
                                <div className="relative z-10 flex flex-col gap-6">
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                        <div className="flex gap-4 items-center">
                                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-[#0ea5e9] group-hover:text-white transition-all shadow-sm border border-slate-100 shrink-0">
                                                <Building2 size={20} />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-sm sm:text-lg font-black text-slate-900 leading-tight tracking-tight uppercase group-hover:text-[#0ea5e9] transition-colors break-words" style={{ overflowWrap: 'break-word', hyphens: 'auto' }}>
                                                    {service.title}
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-[#0ea5e9] animate-pulse shrink-0"></span>
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{service.category}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 text-slate-400 px-4 py-2 rounded-2xl flex items-center gap-2 shadow-sm self-start border border-slate-100">
                                            <Building2 size={14} className="shrink-0" />
                                            <span className="text-[10px] font-black uppercase tracking-tight">Oficial</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
                                            <div className="w-8 h-8 bg-white rounded-xl shadow-sm text-[#0ea5e9] shrink-0 flex items-center justify-center border border-slate-200">
                                                <MapPin size={14} />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t('map_located_at', language)}</p>
                                                <p className="text-[11px] font-bold text-slate-900 leading-relaxed max-w-[90%]">
                                                    {(() => {
                                                        const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
                                                        let cleanAddr = service.address || '';
                                                        cleanAddr = cleanAddr.replace(urlRegex, '').replace(/\s*-\s*$/, '').replace(/,\s*$/, '').trim();
                                                        return cleanAddr;
                                                    })()}
                                                    {service.city && `, ${service.city}`}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {service.phone && (
                                                <a href={`tel:${service.phone}`} className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:border-[#0ea5e9] hover:text-[#0ea5e9] transition-all">
                                                    <Phone size={14} className="shrink-0" />
                                                    <span className="text-[9px] font-black tracking-widest">{service.phone}</span>
                                                </a>
                                            )}
                                            {(() => {
                                                const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
                                                const embeddedMatch = service.address ? service.address.match(urlRegex) : null;
                                                const finalWebsite = service.website || (embeddedMatch ? embeddedMatch[0] : null);

                                                if (finalWebsite) {
                                                    const validUrl = finalWebsite.startsWith('http') ? finalWebsite : `https://${finalWebsite}`;
                                                    return (
                                                        <a href={validUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-[#0ea5e9] transition-all">
                                                            <Globe size={14} className="shrink-0" />
                                                            <span className="text-[9px] font-black tracking-widest">Website</span>
                                                        </a>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                    </div>

                                    {/* Ratings Functionality Purged - MIRA V2026 Sovereign */}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                        <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200">
                            <Search size={40} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{t('service_no_results', language)}</h3>
                            <p className="text-xs font-bold text-slate-400 leading-relaxed">{language === 'PT' ? 'Não encontramos o que procura? Tente outros termos ou limpe os filtros.' : 'No results found. Try other terms or clear filters.'}</p>
                        </div>
                        <button
                            onClick={() => { setSearchTerm(''); setSelectedCategory('Todos'); }}
                            className="px-8 py-3 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all shadow-sm"
                        >
                            {t('service_clear_filters', language)}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
