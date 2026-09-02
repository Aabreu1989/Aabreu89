
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { submitReportRest } from '../services/reportService';
import { Search, Filter, MapPin, Phone, Globe, Building2, RefreshCcw, ChevronDown, X, Mail, Navigation } from 'lucide-react';
import { MapAlert } from '../types';
import { t } from '../utils/translations';
import { PROTECTED_SERVICES } from '../utils/protectedData';
import { useToast } from './Toast';
import { normalizeCategory, getCategoryKey, getCategoryColor } from '../utils/categoryUtils';
import { analyticsService } from '../services/analyticsService';

const normalizeForSearch = (str: string | undefined | null): string => {
    if (!str) return '';
    return str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
};

// 🌐 MIRA WEBSITES RECOVERY: Garante que todo e qualquer serviço tem um site funcional (oficial ou via pesquisa direta)
const getServiceWebsite = (service: MapAlert): string => {
    let url = (service.website || '').trim();
    
    // Normalizações de URLs desatualizadas ou migradas
    if (url.includes('portaldocidadao.pt')) {
        return 'https://eportugal.gov.pt/locais-de-atendimento-de-servicos-publicos/lojas-de-cidadao';
    }
    if (url.includes('siga.marcacaoprevia.pt')) {
        return 'https://siga.marcacaoprevia.gov.pt/';
    }
    if (url.includes('escolhas.pt')) {
        return 'https://www.programaescolhas.pt/';
    }
    if (url.includes('cspcostacap.org')) {
        return 'https://www.cspcostacaparica.pt';
    }
    if (url.includes('ccmoldavo.pt') || url.includes('asigv.org') || url.includes('aemirep.pt')) {
        url = '';
    }

    // Se o site já estiver preenchido com link válido, garante apenas o protocolo
    if (url) {
        if (!url.startsWith('http') && !url.startsWith('mailto:')) {
            url = `https://${url}`;
        }
        return url;
    }
    
    // Fallbacks inteligentes por nome/tópico do serviço
    const title = (service.title || '').toUpperCase();
    const city = (service.city || '').trim();
    
    if (title.includes('FINANÇAS') || title.includes('AUTORIDADE TRIBUTÁRIA') || title.includes('PORTAL DAS FINANÇAS') || title.includes('FINANCAS')) {
        return 'https://www.portaldasfinancas.gov.pt/';
    }
    
    if (title.includes('IRN') || title.includes('REGISTO CIVIL') || title.includes('CONSERVATÓRIA') || title.includes('NOTARIADO') || title.includes('REGISTOS') || title.includes('CONSERVATORIA')) {
        return 'https://irn.justica.gov.pt/';
    }
    
    if (title.includes('AIMA') || title.includes('SEF') || title.includes('IMIGRAÇÃO') || title.includes('INTEGRAÇÃO') || title.includes('IMIGRACAO') || title.includes('INTEGRACAO')) {
        return 'https://aima.gov.pt/';
    }
    
    if (title.includes('SEGURANÇA SOCIAL') || title.includes('NISS') || title.includes('SEG-SOCIAL') || title.includes('ISS') || title.includes('SEGURANCA')) {
        return 'https://www.seg-social.pt/';
    }
    
    if (title.includes('IEFP') || title.includes('EMPREGO') || title.includes('IEFPNET') || title.includes('TRABALHO')) {
        return 'https://www.iefp.pt/';
    }
    
    if (title.includes('CRUZ VERMELHA')) {
        return 'https://www.cruzvermelha.pt/';
    }
    
    if (title.includes('CÂMARA MUNICIPAL') || title.includes('MUNICÍPIO') || title.includes('CM ') || title.includes('CAMARA') || title.includes('MUNICIPIO')) {
        return `https://www.google.com/search?q=${encodeURIComponent(service.title + ' ' + (city && city !== 'Portugal' ? city : '') + ' Portugal')}`;
    }
    
    if (title.includes('SNS') || title.includes('SAÚDE') || title.includes('HOSPITAL') || title.includes('CENTRO DE SAUDE') || title.includes('SAUDE')) {
        return 'https://www.sns.gov.pt/';
    }

    if (title.includes('LOJA DO CIDADÃO') || title.includes('LOJA DO CIDADAO') || title.includes('ESPAÇO CIDADÃO') || title.includes('ESPACO CIDADAO')) {
        return 'https://eportugal.gov.pt/locais-de-atendimento-de-servicos-publicos/lojas-de-cidadao';
    }

    if (title.includes('CPLP') || title.includes('VISTO')) {
        return 'https://aima.gov.pt/';
    }

    // Fallback garantido por pesquisa estruturada no Google para levar ao info card/morada do local
    return `https://www.google.com/search?q=${encodeURIComponent(service.title + ' ' + (city && city !== 'Portugal' ? city : '') + ' Portugal')}`;
};

interface LocalServicesListProps {
    language: string;
    user: any;
    targetServiceId?: string | null;
    onClearTargetService?: () => void;
    onEarnPoints?: (amount: number, reason: string, actionKey?: string, entityId?: string) => void;
}

export const LocalServicesList: React.FC<LocalServicesListProps> = ({ language, user, targetServiceId, onClearTargetService, onEarnPoints }) => {
    const { showToast } = useToast();
    
    // ⚡ MIRA OPTIMIZATION: Load protected services synchronously by default for instant rendering (0ms)
    const initialServices = React.useMemo(() => {
        return (PROTECTED_SERVICES || []).map(ps => ({
            ...ps,
            category: normalizeCategory(ps.category, ps.title)
        }));
    }, []);

    // 🛡️ MIRA ANTI-FLICKER: Single source of truth — filteredServices removed, use only useMemo below
    const [services, setServices] = useState<MapAlert[]>(initialServices);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [selectedLocation, setSelectedLocation] = useState('Todos');
    const [visibleCount, setVisibleCount] = useState(20);
    const listEndRef = useRef<HTMLDivElement>(null);
    const hasFetchedRef = useRef(false);

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

    const cleanDescText = (text: string | undefined): string => {
        if (!text) return '';
        return text
            .replace(/📍\s*Endereço:[^\n]+/gi, '')
            .replace(/🌐\s*Site:[^\n]+/gi, '')
            .replace(/🏙️\s*Cidade:[^\n]+/gi, '')
            .replace(/📞\s*Telefone:[^\n]+/gi, '')
            .replace(/✉️\s*Email:[^\n]+/gi, '')
            .replace(/Apoio ao Migrante/gi, '')
            .replace(/\n+/g, ' ')
            .replace(/\s{2,}/g, ' ')
            .trim();
    };

    const fetchServices = async () => {
        // 🛡️ MIRA ANTI-FLICKER: Prevent duplicate fetches
        if (hasFetchedRef.current) return;
        hasFetchedRef.current = true;
        setError(null);

        // Limpar caches antigos corrompidos
        try {
            localStorage.removeItem('mira_services_cache');
            localStorage.removeItem('mira_services_cache_v2');
            localStorage.removeItem('mira_services_cache_v3');
        } catch (e) { }

        // 1. Tentar carregar do cache local v4 para resposta rápida
        const cached = localStorage.getItem('mira_services_cache_v4');
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                const data = Array.isArray(parsed) ? parsed : (parsed?.data || []);
                const timestamp = parsed?.timestamp || 0;
                if (Array.isArray(data) && data.length > 0) {
                    const seen = new Set<string>();
                    const dedup: MapAlert[] = [];
                    data.forEach((ps: any) => {
                        const normKey = (ps.title || ps.name || '').toLowerCase().replace(/[^a-z0-9à-ú]/g, '');
                        if (!seen.has(normKey)) {
                            seen.add(normKey);
                            dedup.push({ ...ps, category: normalizeCategory(ps.category, ps.title), description: cleanDescText(ps.description) });
                        }
                    });
                    // Cache recente (< 10 min): usar direto, sem novo fetch
                    if (timestamp && Date.now() - timestamp < 600000) {
                        setServices(dedup);
                        hasFetchedRef.current = false;
                        return;
                    }
                    // Cache antigo: usar enquanto vai buscar em background silencioso
                    setServices(dedup);
                }
            } catch (e) { }
        }

        // Offline: usar protegidos
        if (!navigator.onLine) {
            setServices(initialServices);
            hasFetchedRef.current = false;
            return;
        }

        // Background fetch silencioso — sem loading spinner se já há dados
        const hasData = services.length > initialServices.length || services.length > 0;
        if (!hasData) setLoading(true);

        try {
            const fetchPromise = supabase
                .from('services')
                .select('*')
                .order('name', { ascending: true });

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('MIRA-TIMEOUT')), 5000)
            );

            const result: any = await Promise.race([fetchPromise, timeoutPromise]);
            const { data, error: pError } = result;

            if (pError) {
                console.warn("⚠️ [MIRA] Tabela 'services' com erro, usando Protegidos.", pError);
                setLoading(false);
                hasFetchedRef.current = false;
                return;
            }

            let mappedData: MapAlert[] = [];
            if (data && Array.isArray(data)) {
                mappedData = data
                    .filter(item => {
                        const name = item.name || item.title || '';
                        // Rejeitar registos obsoletos (como ACM) e registos sem morada
                        if (name.toUpperCase().includes('ACM') || !item.address || item.address.trim().length < 4) {
                            return false;
                        }
                        return true;
                    })
                    .map(item => {
                        const rawTitle = item.name || item.title || 'Serviço';
                        const rawAddr = item.address || '';
                        const rawDesc = cleanDescText(item.description || '');

                        const detectedCity = item.city || 'Portugal';
                        const detectedPhone = item.phone || '';
                        const detectedEmail = item.email || '';
                        const finalWebsite = item.website || '';
                        const finalCategory = normalizeCategory(item.category, rawTitle);

                        return {
                            id: item.id || Math.random().toString(),
                            title: rawTitle,
                            category: finalCategory,
                            lat: Number(item.lat) || Number(item.latitude) || 0,
                            lng: Number(item.lng) || Number(item.longitude) || 0,
                            distance: 'N/A',
                            address: rawAddr,
                            city: detectedCity,
                            phone: detectedPhone,
                            email: detectedEmail,
                            website: finalWebsite,
                            description: rawDesc,
                            avgRating: 5.0,
                            ratings: []
                        };
                    });
            }

            // 🛡️ MIRA SOBERANIA: Prioridade Absoluta para Dados Protegidos Curados (Moradas e Descrições)
            const seenKeys = new Map<string, MapAlert>();

            // 1. Inserir primeiro a base de dados curada com moradas e descrições completas
            PROTECTED_SERVICES.forEach(ps => {
                const normKey = (ps.title || '').toLowerCase().replace(/[^a-z0-9à-ú]/g, '');
                if (normKey) {
                    seenKeys.set(normKey, {
                        ...ps,
                        category: normalizeCategory(ps.category, ps.title),
                        description: cleanDescText(ps.description)
                    });
                }
            });

            // 2. Adicionar apenas novos serviços válidos que não existam na base protegida
            mappedData.forEach(srv => {
                const normKey = (srv.title || '').toLowerCase().replace(/[^a-z0-9à-ú]/g, '');
                if (!normKey) return;
                if (!seenKeys.has(normKey)) {
                    seenKeys.set(normKey, srv);
                }
            });

            const deduplicatedServices = Array.from(seenKeys.values());

            // 🛡️ ANTI-FLICKER: Só atualiza o estado se houver dados consistentes
            setServices(deduplicatedServices);
            
            localStorage.setItem('mira_services_cache_v4', JSON.stringify({
                timestamp: Date.now(),
                data: deduplicatedServices
            }));

        } catch (err: any) {
            console.warn("MIRA_WARN: fetchServices failed, using protected data.", err);
            // Fallback silencioso — sem retry loop para evitar piscar
        } finally {
            setLoading(false);
            hasFetchedRef.current = false;
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    // 🚀 MIRA CATEGORY MEMO
    const availableCategories = useMemo(() => {
        const cats = Array.from(new Set(services.map(s => s.category || 'Geral')));
        return cats.sort((a, b) => String(a).localeCompare(String(b)));
    }, [services]);

    // 🚀 MIRA LOCATION MEMO
    const availableLocations = useMemo(() => {
        const locs = services
            .map(s => (s.city || '').trim())
            .filter(c => c !== '' && c.toLowerCase() !== 'portugal');
        return Array.from(new Set(locs)).sort((a, b) => a.localeCompare(b));
    }, [services]);

    const filteredServicesResult = useMemo(() => {
        let result = services;
        if (selectedCategory !== 'Todos') result = result.filter(s => s.category === selectedCategory);
        if (selectedLocation !== 'Todos') {
            result = result.filter(s => (s.city || '').trim().toLowerCase() === selectedLocation.trim().toLowerCase());
        }
        if (searchTerm.trim() !== '') {
            const term = normalizeForSearch(searchTerm);
            result = result.filter(s =>
                normalizeForSearch(s.title).includes(term) ||
                normalizeForSearch(s.address).includes(term) ||
                normalizeForSearch(s.city).includes(term) ||
                normalizeForSearch(s.category).includes(term) ||
                normalizeForSearch(s.description || '').includes(term)
            );
        }
        return [...result].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }, [searchTerm, selectedCategory, selectedLocation, services]);

    // 🚀 MIRA SERVICE INTERACTION TRACKING
    const trackServiceInteraction = (service: MapAlert, interactionType: string = 'card_click') => {
        try {
            const nameLower = ((service as any).name || service.title || '').toLowerCase();
            let matchedGroup = 'Lojas do Cidadão & Espaços Cidadão';
            if (nameLower.includes('aima') || nameLower.includes('conservatóri') || nameLower.includes('irn') || nameLower.includes('sef') || nameLower.includes('cnaim')) {
                matchedGroup = 'Balcões AIMA / Conservatórias';
            } else if (nameLower.includes('finança') || nameLower.includes('at') || nameLower.includes('tributári')) {
                matchedGroup = 'Serviço de Finanças (AT)';
            } else if (nameLower.includes('segurança social') || nameLower.includes('iss')) {
                matchedGroup = 'Segurança Social (ISS)';
            } else if (nameLower.includes('saúde') || nameLower.includes('sns') || nameLower.includes('usf') || nameLower.includes('hospital') || nameLower.includes('centro de saúde')) {
                matchedGroup = 'Centros de Saúde SNS & USF';
            } else if (nameLower.includes('iefp') || nameLower.includes('emprego') || nameLower.includes('formação')) {
                matchedGroup = 'Centros de Emprego IEFP';
            }
            const current = parseInt(localStorage.getItem(`mira_service_click_${matchedGroup}`) || '0', 10);
            localStorage.setItem(`mira_service_click_${matchedGroup}`, (current + 1).toString());
            analyticsService.logActivity('click_service', { 
                serviceName: matchedGroup,
                serviceTitle: service.title,
                district: service.city,
                interactionType
            });

            // 🎮 Gamificação Cross-Module: Consulta de Serviço (+10 XP, 1x por serviço)
            if (onEarnPoints && service.id) {
                try {
                    onEarnPoints(10, `Consulta de Serviço: ${service.title || service.id}`, 'service_viewed', service.id);
                } catch (_) {}
            }
        } catch (err) {}
    };

    // 🚀 MIRA INFINITE SCROLL: Serviços
    useEffect(() => {
        if (!listEndRef.current || loading) return;
        const obs = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                 setVisibleCount(prev => Math.min(prev + 20, filteredServicesResult.length));
            }
        }, { threshold: 0.1 });
        obs.observe(listEndRef.current);
        return () => obs.disconnect();
    }, [filteredServicesResult.length, loading]);

    return (
        <div className="flex flex-col min-h-screen bg-white font-sans pb-24">
            <div className="bg-white px-6 pt-8 pb-4 space-y-6 z-30 border-b border-slate-50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                         <h2 className="mira-module-title uppercase">
                            {t('service_guide_title', language)}
                        </h2>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-mira-blue animate-pulse"></div>
                            <p className="mira-module-subtitle !mb-0 uppercase">
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

                <div className="flex flex-col md:flex-row gap-3">
                    <div className="relative group flex-[2]">
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
                            onChange={(e) => {
                                setSelectedCategory(e.target.value);
                                analyticsService.logActivity('click_service', { action: 'filter_category', category: e.target.value });
                            }}
                            className="w-full pl-12 pr-10 py-5 sm:py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-900 outline-none focus:bg-white focus:border-mira-blue transition-all shadow-sm appearance-none cursor-pointer"
                        >
                            <option value="Todos">{t('map_all_areas', language)} ({services.length})</option>
                            {availableCategories.map(cat => {
                                const count = services.filter(s => s.category === cat).length;
                                return (
                                    <option key={cat as string} value={cat as string}>
                                        {t(getCategoryKey(cat as string), language)} ({count})
                                    </option>
                                );
                            })}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                    </div>
                    <div className="relative group flex-1">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-mira-blue transition-colors pointer-events-none" size={18} />
                        <select
                            value={selectedLocation}
                            onChange={(e) => {
                                setSelectedLocation(e.target.value);
                                analyticsService.logActivity('click_service', { action: 'filter_location', location: e.target.value });
                            }}
                            className="w-full pl-12 pr-10 py-5 sm:py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-900 outline-none focus:bg-white focus:border-mira-blue transition-all shadow-sm appearance-none cursor-pointer"
                        >
                            <option value="Todos">
                                {language.toLowerCase() === 'pt' ? 'Todas as Localidades' 
                                 : language.toLowerCase() === 'es' ? 'Todas las Localidades' 
                                 : language.toLowerCase() === 'fr' ? 'Toutes les Localités' 
                                 : 'All Locations'} ({services.length})
                            </option>
                            {availableLocations.map(loc => {
                                const count = services.filter(s => (s.city || '').trim().toLowerCase() === loc.toLowerCase()).length;
                                return (
                                    <option key={loc} value={loc}>
                                        {loc} ({count})
                                    </option>
                                );
                            })}
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
                ) : filteredServicesResult.length > 0 ? (
                    <div className="grid grid-cols-1 gap-5">
                        {filteredServicesResult.slice(0, visibleCount).map((service) => (

                            <div 
                                id={`service-${service.id}`}
                                key={service.id} 
                                onClick={() => trackServiceInteraction(service, 'card_click')}
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
                                                <h3 className="text-sm sm:text-lg font-black text-slate-900 leading-tight tracking-tight uppercase group-hover:text-mira-blue transition-colors break-words" style={{ overflowWrap: 'break-word', hyphens: 'auto' }}>
                                                    {service.title}
                                                </h3>
                                                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] text-slate-600">
                                                        <span className="w-2 h-2 rounded-full animate-pulse shrink-0" style={{ backgroundColor: getCategoryColor(service.category) }}></span>
                                                        {t(getCategoryKey(service.category), language)}
                                                    </span>
                                                    {service.type && (
                                                        <span className="px-2.5 py-1 bg-sky-50 text-sky-700 border border-sky-200/60 rounded-lg text-[9px] font-black tracking-wider uppercase">
                                                            {service.type}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {service.description && (
                                            <p className="text-[12px] font-medium text-slate-600 leading-relaxed bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                                                {service.description}
                                            </p>
                                        )}

                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-start gap-3">
                                            <div className="w-8 h-8 bg-white rounded-xl shadow-sm text-[#0ea5e9] shrink-0 flex items-center justify-center border border-slate-200">
                                                <MapPin size={14} />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t('map_located_at', language)}</p>
                                                <p className="text-[11px] font-bold text-slate-900 leading-relaxed max-w-[90%]">
                                                    {service.address}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            {service.lat && service.lng ? (
                                                <a
                                                    href={`https://www.google.com/maps/dir/?api=1&destination=${service.lat},${service.lng}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        trackServiceInteraction(service, 'directions');
                                                    }}
                                                    className="flex items-center gap-2 px-3 py-2 bg-sky-50 border border-sky-200 rounded-xl text-sky-700 hover:bg-sky-100 hover:border-[#0ea5e9] transition-all"
                                                >
                                                    <Navigation size={14} className="shrink-0 text-sky-600" />
                                                    <span className="text-[9px] font-black tracking-widest uppercase">
                                                        {language.toLowerCase() === 'pt' ? 'Como Chegar' 
                                                         : language.toLowerCase() === 'es' ? 'Cómo Llegar' 
                                                         : language.toLowerCase() === 'fr' ? 'Itinéraire' 
                                                         : 'Directions'}
                                                    </span>
                                                </a>
                                            ) : null}
                                            {service.phone && (
                                                <a
                                                    href={`tel:${service.phone}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        trackServiceInteraction(service, 'phone');
                                                    }}
                                                    className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:border-[#0ea5e9] hover:text-[#0ea5e9] transition-all"
                                                >
                                                    <Phone size={14} className="shrink-0" />
                                                    <span className="text-[9px] font-black tracking-widest">{service.phone}</span>
                                                </a>
                                            )}
                                            {service.email && (
                                                <a
                                                    href={`mailto:${service.email}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        trackServiceInteraction(service, 'email');
                                                    }}
                                                    className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:border-[#0ea5e9] hover:text-[#0ea5e9] transition-all"
                                                >
                                                    <Mail size={14} className="shrink-0" />
                                                    <span className="text-[9px] font-black tracking-widest">{service.email}</span>
                                                </a>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    trackServiceInteraction(service, 'website');
                                                    const finalUrl = getServiceWebsite(service);
                                                    window.open(finalUrl, '_blank');
                                                }}
                                                className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-[#0ea5e9] transition-all"
                                            >
                                                <Globe size={14} className="shrink-0" />
                                                <span className="text-[9px] font-black tracking-widest">Website</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={listEndRef} className="h-4" />
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                        <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200">
                            <Search size={40} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{t('service_no_results', language)}</h3>
                            <p className="text-xs font-bold text-slate-400 leading-relaxed">{t('service_no_results_desc', language)}</p>
                        </div>
                        <button
                            onClick={() => { setSearchTerm(''); setSelectedCategory('Todos'); setSelectedLocation('Todos'); }}
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
