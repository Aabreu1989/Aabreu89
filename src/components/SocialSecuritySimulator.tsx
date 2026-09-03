// src/components/SocialSecuritySimulator.tsx
import React, { useState, useMemo } from 'react';
import {
    Calculator, Shield, Scale, Clock, AlertTriangle, CheckCircle2,
    Calendar, TrendingUp, Sparkles, HelpCircle, ArrowRight
} from 'lucide-react';
import { ViewType } from '../types';
import {
    calculateMiraSocialSecurity,
    MiraSSAssessment,
    SS_VARIATION_STEPS
} from '../services/miraSocialSecurityEngine';

interface SocialSecuritySimulatorProps {
    language: string;
    onViewChange?: (view: ViewType, params?: any) => void;
    onSelectTemplate?: (templateId: string) => void;
}

type Lang = 'pt' | 'br' | 'es' | 'en' | 'fr';

const TRANS: Record<Lang, Record<string, string>> = {
    pt: {
        title: "Simulador de Contribuições à Segurança Social",
        subtitle: "Trabalhadores Independentes & Recibos Verdes (DL 110/2009 - CRC 2026)",
        badge_official: "DL 110/2009 (2026)",
        rev_label: "Rendimento Bruto Total do Trimestre (€):",
        rev_desc: "Soma de todas as faturas e recibos verdes emitidos nos 3 meses do trimestre anterior.",
        act_label: "Tipo de Atividade Profissional (Art. 151.º do CRC):",
        act_services: "💼 Prestação de Serviços (70%)",
        act_services_sub: "Profissões Liberais, Saúde, TI, Consultoria, Engenharia",
        act_sales: "🛍️ Vendas / Restauração (20%)",
        act_sales_sub: "Comércio de Bens, Hotelaria, Alojamento Local e Restauração",
        health_note: "⚖️ Nota Legal (Art. 151.º do CRC): Médicos, profissionais de saúde e profissões liberais enquadram-se na prestação de serviços com coeficiente de 70%.",
        toggles_title: "Isenções e Condições Especiais",
        first_year_label: "Primeiro ano de enquadramento na Segurança Social (Início de Atividade)?",
        first_year_desc: "Beneficia de isenção facultativa nos primeiros 12 meses consecutivos de atividade.",
        tco_label: "Acumula com contrato de trabalho (Trabalho por Conta de Outrem)?",
        tco_salary_label: "Remuneração Mensal Bruta do Emprego Dependente (€):",
        tco_salary_desc: "Condição cumulativa (Art. 157.º do CRC): Salário do contrato ≥ 1 IAS (€ 537,13) E Rendimento Relevante TI < 4 IAS (€ 2.148,52).",
        tco_ok: "✅ Elegível para Isenção Total: Salário dependente ≥ 1 IAS (€ 537,13) e Rendimento Relevante como TI < 4 IAS (€ 2.148,52).",
        tco_fail: "⚠️ Não isento de contribuição: Para isenção cumulativa, o salário de TCO deve ser ≥ € 537,13 e o rendimento relevante como TI deve ser < € 2.148,52.",
        var_label: "Opção de Ajuste de Variação Trimestral (-25% a +25%):",
        var_desc: "Ajuste em patamares legais de 5% sobre a base mensal apurada.",
        tax_rate_label: "Taxa Contributiva Oficial (Art. 168.º do CRC):",
        rate_ti: "21,4% — Trabalhador Independente em Geral",
        rate_eni: "25,2% — Empresário em Nome Individual (ENI)",
        res_title: "Resultado da Simulação SS",
        res_monthly: "Contribuição Mensal a Pagar (Fixa durante 3 meses):",
        res_declared: "Rendimento Bruto Declarado:",
        res_relevant_avg: "Rendimento Relevante Médio Mensal (1/3):",
        res_contributory_base: "Base de Incidência Fixada:",
        res_quarterly_total: "Total do Trimestre (3 Prestações):",
        badge_min: "Piso Mínimo Obrigatório (€ 20,00/mês)",
        badge_ceiling: "Teto Máximo Legal Atingido (12 × IAS = € 6.445,56)",
        badge_exempt: "Isenção Legal Válida",
        deadlines_title: "Prazos Oficiais da Segurança Social (Obrigatórios)",
        deadline_declaration: "📅 Entrega da Declaração Trimestral: Obrigatoriamente até ao último dia dos meses de Janeiro, Abril, Julho e Outubro através da Segurança Social Direta.",
        deadline_payment: "💳 Janela de Pagamento Mensal: Mensalmente, entre os dias 10 e 20 do mês seguinte àquele a que a contribuição respeita (ex.: contribuição de Janeiro paga entre 10 e 20 de Fevereiro).",
        btn_guide: "Ver Guia de Preenchimento da Declaração Trimestral"
    },
    br: {
        title: "Simulador de Contribuições à Segurança Social",
        subtitle: "Autônomos & Recibos Verdes (DL 110/2009 - CRC 2026)",
        badge_official: "DL 110/2009 (2026)",
        rev_label: "Faturamento Bruto Total do Trimestre (€):",
        rev_desc: "Soma de todas as notas fiscais/recibos verdes emitidos nos 3 meses do trimestre anterior.",
        act_label: "Tipo de Atividade Profissional (Art. 151.º do CRC):",
        act_services: "💼 Prestação de Serviços (70%)",
        act_services_sub: "Profissões Liberais, Saúde, TI, Consultoria, Engenharia",
        act_sales: "🛍️ Vendas / Restaurantes (20%)",
        act_sales_sub: "Comércio de Bens, Hotelaria, Alojamento Local e Alimentação",
        health_note: "⚖️ Nota Legal (Art. 151.º do CRC): Médicos, profissionais da saúde e autônomos liberais entram na prestação de serviços com coeficiente de 70%.",
        toggles_title: "Isenções e Situações Especiais",
        first_year_label: "Primeiro ano de cadastro na Segurança Social (Início de Atividade)?",
        first_year_desc: "Direito à isenção facultativa nos primeiros 12 meses ininterruptos de atividade.",
        tco_label: "Acumula com emprego de carteira assinada (Trabalho por Conta de Outrem)?",
        tco_salary_label: "Salário Mensal Bruto do Emprego Fixo (€):",
        tco_salary_desc: "Regra cumulativa de isenção (Art. 157.º do CRC): Salário fixo ≥ 1 IAS (€ 537,13) E Renda Relevante como autônomo < 4 IAS (€ 2.148,52).",
        tco_ok: "✅ Elegível para Isenção Total: Salário fixo ≥ 1 IAS (€ 537,13) e Rendimento Relevante como autônomo < 4 IAS (€ 2.148,52).",
        tco_fail: "⚠️ Não isento de contribuição: O salário do emprego deve ser ≥ € 537,13 e o rendimento relevante como autônomo deve ser < € 2.148,52.",
        var_label: "Opção de Ajuste de Variação Trimestral (-25% a +25%):",
        var_desc: "Escolha em degraus de 5% o ajuste sobre a base mensal de contribuição.",
        tax_rate_label: "Alíquota Contributiva Oficial (Art. 168.º do CRC):",
        rate_ti: "21,4% — Trabalhador Autônomo em Geral",
        rate_eni: "25,2% — Empresário em Nome Individual (ENI)",
        res_title: "Resultado da Simulação SS",
        res_monthly: "Contribuição Mensal Fixa a Pagar (por 3 meses):",
        res_declared: "Faturamento Bruto Declarado:",
        res_relevant_avg: "Rendimento Relevante Mensal Médio (1/3):",
        res_contributory_base: "Base de Cálculo Fixada:",
        res_quarterly_total: "Total do Trimestre (3 Parcelas):",
        badge_min: "Piso Mínimo Obrigatório (€ 20,00/mês)",
        badge_ceiling: "Teto Máximo Legal Atingido (12 × IAS = € 6.445,56)",
        badge_exempt: "Isenção Legal Confirmada",
        deadlines_title: "Prazos Oficiais da Segurança Social (Obrigatórios)",
        deadline_declaration: "📅 Declaração Trimestral: Entregue obrigatoriamente até o último dia de Janeiro, Abril, Julho e Outubro pela Segurança Social Direta.",
        deadline_payment: "💳 Janela de Pagamento: Mensalmente, entre os dias 10 e 20 do mês seguinte àquele a que a contribuição se refere (ex.: contribuição de Janeiro paga entre 10 e 20 de Fevereiro).",
        btn_guide: "Ver Guia de Preenchimento da Declaração Trimestral"
    },
    es: {
        title: "Simulador de Cotización a la Seguridad Social",
        subtitle: "Autónomos & Recibos Verdes (DL 110/2009 - CRC 2026)",
        badge_official: "DL 110/2009 (2026)",
        rev_label: "Ingresos Brutos Totales del Trimestre (€):",
        rev_desc: "Suma de todas las facturas/recibos emitidos en los 3 meses del trimestre anterior.",
        act_label: "Tipo de Actividad Profesional (Art. 151.º del CRC):",
        act_services: "💼 Prestación de Servicios (70%)",
        act_services_sub: "Profesiones Liberales, Salud, TI, Consultoría, Ingeniería",
        act_sales: "🛍️ Ventas / Restauración (20%)",
        act_sales_sub: "Comercio de Bienes, Hostelería, Alojamiento Turístico y Restauración",
        health_note: "⚖️ Nota Legal (Art. 151.º del CRC): Los médicos, sanitarios y profesiones liberales tributan bajo servicios al 70%.",
        toggles_title: "Exenciones y Casos Especiales",
        first_year_label: "¿Primer año de alta en la Seguridad Social (Inicio de Actividad)?",
        first_year_desc: "Disfruta de exención voluntaria durante los primeros 12 meses consecutivos.",
        tco_label: "¿Pluriempleo con contrato laboral por cuenta ajena?",
        tco_salary_label: "Salario Mensual Bruto del Empleo Asalariado (€):",
        tco_salary_desc: "Requisitos de exención (Art. 157.º del CRC): Salario asalariado ≥ 1 IAS (€ 537,13) e Ingreso Relevante como autónomo < 4 IAS (€ 2.148,52).",
        tco_ok: "✅ Elegible para Exención Total: Salario asalariado ≥ 1 IAS (€ 537,13) e Ingreso Relevante < 4 IAS (€ 2.148,52).",
        tco_fail: "⚠️ No exento: El salario asalariado debe ser ≥ € 537,13 y el ingreso como autónomo debe ser < € 2.148,52.",
        var_label: "Opción de Ajuste Trimestral de Base (-25% a +25%):",
        var_desc: "Ajuste en tramos del 5% sobre la base de cotización mensual.",
        tax_rate_label: "Tipo de Cotización Oficial (Art. 168.º del CRC):",
        rate_ti: "21,4% — Trabajador Autónomo General",
        rate_eni: "25,2% — Empresario Individual (ENI)",
        res_title: "Resultado de la Simulación SS",
        res_monthly: "Cuota Mensual a Pagar (fija durante 3 meses):",
        res_declared: "Ingresos Brutos Declarados:",
        res_relevant_avg: "Ingreso Relevante Mensual Medio (1/3):",
        res_contributory_base: "Base de Cotización Fijada:",
        res_quarterly_total: "Total del Trimestre (3 Cuotas):",
        badge_min: "Cuota Mínima Obligatoria (€ 20,00/mes)",
        badge_ceiling: "Tope Máximo Legal Alcanzado (12 × IAS = € 6.445,56)",
        badge_exempt: "Exención Legal Válida",
        deadlines_title: "Plazos Oficiales de la Seguridad Social (Obligatorios)",
        deadline_declaration: "📅 Declaración Trimestral: Presentación obligatoria hasta el último día de Enero, Abril, Julio y Octubre en la Seguridad Social Direta.",
        deadline_payment: "💳 Ventana de Pago: Mensualmente, entre los días 10 y 20 del mes siguiente (ej.: cuota de Enero abonada entre el 10 y el 20 de Febrero).",
        btn_guide: "Ver Guía de Cumplimentación de la Declaración Trimestral"
    },
    en: {
        title: "Social Security Contribution Simulator",
        subtitle: "Self-Employed & Green Receipts (DL 110/2009 - CRC 2026)",
        badge_official: "DL 110/2009 (2026)",
        rev_label: "Total Quarterly Gross Invoiced Amount (€):",
        rev_desc: "Total sum of all invoices/green receipts issued in the 3 months of the prior quarter.",
        act_label: "Professional Activity Category (CRC Art. 151):",
        act_services: "💼 Service Provision (70%)",
        act_services_sub: "Liberal Professions, Healthcare, IT, Consulting, Engineering",
        act_sales: "🛍️ Sales & Hospitality (20%)",
        act_sales_sub: "Goods Trade, Hotels, Short-Term Rentals & Restaurants",
        health_note: "⚖️ Statutory Note (CRC Art. 151): Medical and healthcare professionals fall under services with a 70% coefficient.",
        toggles_title: "Exemptions & Special Conditions",
        first_year_label: "First year registered with Social Security (New Business Activity)?",
        first_year_desc: "Entitled to optional full exemption during the first 12 consecutive months of activity.",
        tco_label: "Concurrently employed under an employment contract (Dual Status)?",
        tco_salary_label: "Gross Monthly Salary from Employment Contract (€):",
        tco_salary_desc: "Cumulative exemption test (CRC Art. 157): Employed salary ≥ 1 IAS (€ 537.13) AND Freelance relevant income < 4 IAS (€ 2,148.52).",
        tco_ok: "✅ Full Exemption Eligible: Employed salary ≥ 1 IAS (€ 537.13) and Freelance relevant income < 4 IAS (€ 2,148.52).",
        tco_fail: "⚠️ Not exempt: Employed salary must be ≥ € 537.13 and freelance relevant income must be < € 2,148.52.",
        var_label: "Quarterly Base Adjustment Option (-25% to +25%):",
        var_desc: "Select adjustment in 5% increments over the statutory average monthly base.",
        tax_rate_label: "Statutory Contribution Rate (CRC Art. 168):",
        rate_ti: "21.4% — Self-Employed in General",
        rate_eni: "25.2% — Sole Proprietorship (ENI)",
        res_title: "Social Security Simulation Results",
        res_monthly: "Monthly Fixed Contribution (payable for 3 months):",
        res_declared: "Gross Quarterly Invoiced:",
        res_relevant_avg: "Average Monthly Relevant Income (1/3):",
        res_contributory_base: "Fixed Contributory Base:",
        res_quarterly_total: "Total Quarterly Commitment (3 Payments):",
        badge_min: "Statutory Minimum Floor (€ 20.00/mo)",
        badge_ceiling: "Statutory Maximum Cap Applied (12 × IAS = € 6,445.56)",
        badge_exempt: "Full Statutory Exemption Granted",
        deadlines_title: "Official Social Security Statutory Deadlines",
        deadline_declaration: "📅 Quarterly Declaration: Mandatory submission by the last day of January, April, July, and October via Social Security Direct.",
        deadline_payment: "💳 Payment Window: Monthly, between the 10th and 20th of the following month (e.g., January contribution paid between February 10th and 20th).",
        btn_guide: "View Step-by-Step Quarterly Declaration Guide"
    },
    fr: {
        title: "Simulateur de Cotisation à la Sécurité Sociale",
        subtitle: "Travailleurs Indépendants & Reçus Verts (DL 110/2009 - CRC 2026)",
        badge_official: "DL 110/2009 (2026)",
        rev_label: "Chiffre d'Affaires Brut Trimestriel (€):",
        rev_desc: "Total des factures/reçus émis au cours des 3 mois du trimestre civil précédent.",
        act_label: "Catégorie d'Activité Professionnelle (Art. 151 du CRC):",
        act_services: "💼 Prestations de Services (70%)",
        act_services_sub: "Professions Libérales, Santé, Informatique, Conseil, Ingénierie",
        act_sales: "🛍️ Vente de Biens & Restauration (20%)",
        act_sales_sub: "Commerce, Hôtellerie, Hébergement Touristique et Restauration",
        health_note: "⚖️ Note Légale (Art. 151 du CRC): Les professions médicales et libérales relèvent des prestations de services avec un coefficient de 70%.",
        toggles_title: "Exonérations et Régimes Dérogatoires",
        first_year_label: "Première année d'affiliation à la Sécurité Sociale (Début d'Activité)?",
        first_year_desc: "Droit à une exonération facultative pendant les 12 premiers mois consécutifs.",
        tco_label: "Cumul avec une activité salariée sous contrat de travail?",
        tco_salary_label: "Salaire Brut Mensuel de l'Emploi Salarié (€):",
        tco_salary_desc: "Critères d'exonération cumulatifs (Art. 157 du CRC): Salaire salarié ≥ 1 IAS (€ 537,13) ET Revenu pertinent indépendant < 4 IAS (€ 2.148,52).",
        tco_ok: "✅ Exonération Totale Accordée: Salaire salarié ≥ 1 IAS (€ 537,13) et Revenu pertinent < 4 IAS (€ 2.148,52).",
        tco_fail: "⚠️ Non exonéré: Le salaire salarié doit être ≥ € 537,13 et le revenu indépendant doit être < € 2.148,52.",
        var_label: "Option d'Ajustement Trimestriel (-25% à +25%):",
        var_desc: "Modulation par paliers de 5% sur l'assiette mensuelle moyenne.",
        tax_rate_label: "Taux de Cotisation Légal (Art. 168 du CRC):",
        rate_ti: "21,4% — Travailleur Indépendant Général",
        rate_eni: "25,2% — Entreprise Individuelle (ENI)",
        res_title: "Résultats de la Simulation SS",
        res_monthly: "Cotisation Mensuelle Fixe à Régler (pendant 3 mois):",
        res_declared: "Revenu Brut Déclaré:",
        res_relevant_avg: "Revenu Pertinent Mensuel Moyen (1/3):",
        res_contributory_base: "Assiette de Cotisation Fixée:",
        res_quarterly_total: "Total du Trimestre (3 Mensualités):",
        badge_min: "Cotisation Minimale Obligatoire (€ 20,00/mois)",
        badge_ceiling: "Plafond Légal Atteint (12 × IAS = € 6.445,56)",
        badge_exempt: "Exonération Légale Accordée",
        deadlines_title: "Calendrier Officiel de la Sécurité Sociale (Impératif)",
        deadline_declaration: "📅 Déclaration Trimestrielle: Dépôt obligatoire avant le dernier jour de Janvier, Avril, Juillet et Octobre sur Segurança Social Direta.",
        deadline_payment: "💳 Fenêtre de Paiement: Chaque mois, entre le 10 et le 20 du mois suivant (ex.: cotisation de Janvier payée entre le 10 et le 20 Février).",
        btn_guide: "Consulter le Guide Pas à Pas de la Déclaration Trimestrielle"
    }
};

export const SocialSecuritySimulator: React.FC<SocialSecuritySimulatorProps> = ({
    language,
    onViewChange,
    onSelectTemplate
}) => {
    const [simRevenue, setSimRevenue] = useState<number>(3000);
    const [simActivity, setSimActivity] = useState<'services' | 'sales_hospitality'>('services');
    const [simVariation, setSimVariation] = useState<number>(0); // -0.25 to +0.25 in 0.05 steps
    const [simTaxRate, setSimTaxRate] = useState<number>(0.214); // 0.214 (TI) or 0.252 (ENI)
    const [isFirstYear, setIsFirstYear] = useState<boolean>(false);
    const [isTCO, setIsTCO] = useState<boolean>(false);
    const [tcoSalary, setTcoSalary] = useState<number>(1200);

    const rawLang = language?.toLowerCase() || 'pt';
    const lang: Lang = rawLang === 'br' ? 'br' : rawLang === 'es' ? 'es' : rawLang === 'en' ? 'en' : rawLang === 'fr' ? 'fr' : 'pt';
    const tr = TRANS[lang];

    const ssAssessment: MiraSSAssessment = useMemo(() => {
        return calculateMiraSocialSecurity({
            quarterlyRevenue: simRevenue,
            activityType: simActivity,
            variationPct: simVariation,
            taxRate: simTaxRate,
            isFirstYear,
            isTCO,
            tcoMonthlySalary: tcoSalary,
            referenceYear: 2026,
        });
    }, [simRevenue, simActivity, simVariation, simTaxRate, isFirstYear, isTCO, tcoSalary]);

    return (
        <div className="space-y-6 animate-in fade-in duration-400">
            {/* Form Input Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-black">
                            <Calculator size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">
                                {tr.title}
                            </h3>
                            <p className="text-xs text-slate-500 font-bold">{tr.subtitle}</p>
                        </div>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-full border border-emerald-300">
                        {tr.badge_official}
                    </span>
                </div>

                {/* Revenue Input */}
                <div className="space-y-2">
                    <label className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                        {tr.rev_label}
                    </label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-black text-lg">€</span>
                        <input
                            type="number"
                            value={simRevenue}
                            onChange={(e) => setSimRevenue(Number(e.target.value))}
                            placeholder="3000"
                            className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-900 font-black text-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-[#FF8C00] focus:outline-none transition-all"
                        />
                    </div>
                    <p className="text-[11px] font-medium text-slate-600">{tr.rev_desc}</p>
                </div>

                {/* Activity Category Selection */}
                <div className="space-y-2">
                    <label className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                        {tr.act_label}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setSimActivity('services')}
                            className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                                simActivity === 'services'
                                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-lg shadow-indigo-500/25 scale-[1.01]'
                                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                        >
                            <span className="text-xs font-black mb-1">{tr.act_services}</span>
                            <span className={`text-[10px] font-semibold ${simActivity === 'services' ? 'text-indigo-100' : 'text-slate-500'}`}>
                                {tr.act_services_sub}
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setSimActivity('sales_hospitality')}
                            className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                                simActivity === 'sales_hospitality'
                                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-lg shadow-indigo-500/25 scale-[1.01]'
                                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                        >
                            <span className="text-xs font-black mb-1">{tr.act_sales}</span>
                            <span className={`text-[10px] font-semibold ${simActivity === 'sales_hospitality' ? 'text-indigo-100' : 'text-slate-500'}`}>
                                {tr.act_sales_sub}
                            </span>
                        </button>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-600 font-semibold leading-relaxed flex items-start gap-2">
                        <Scale size={14} className="shrink-0 mt-0.5 text-indigo-600" />
                        <span>{tr.health_note}</span>
                    </div>
                </div>

                {/* Conditional Switches (Toggles) */}
                <div className="space-y-3 pt-1">
                    <label className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                        {tr.toggles_title}
                    </label>

                    {/* Toggle 1: First Year Exemption */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl transition-all">
                        <div className="space-y-0.5 pr-3">
                            <p className="text-xs font-black text-slate-900">{tr.first_year_label}</p>
                            <p className="text-[10px] text-slate-500 font-medium">{tr.first_year_desc}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsFirstYear(!isFirstYear)}
                            className={`w-12 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${isFirstYear ? 'bg-emerald-600' : 'bg-slate-300'}`}
                        >
                            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${isFirstYear ? 'translate-x-6' : 'translate-x-0.5'} top-0.5 absolute shadow-sm`} />
                        </button>
                    </div>

                    {/* Toggle 2: TCO Exemption */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 transition-all">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5 pr-3">
                                <p className="text-xs font-black text-slate-900">{tr.tco_label}</p>
                                <p className="text-[10px] text-slate-500 font-medium">{tr.tco_salary_desc}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsTCO(!isTCO)}
                                className={`w-12 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${isTCO ? 'bg-indigo-600' : 'bg-slate-300'}`}
                            >
                                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${isTCO ? 'translate-x-6' : 'translate-x-0.5'} top-0.5 absolute shadow-sm`} />
                            </button>
                        </div>

                        {isTCO && (
                            <div className="pt-2 border-t border-slate-200/80 space-y-2 animate-in fade-in duration-300">
                                <label className="text-[10.5px] font-black text-slate-800 uppercase tracking-wider block">
                                    {tr.tco_salary_label}
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-black text-sm">€</span>
                                    <input
                                        type="number"
                                        value={tcoSalary}
                                        onChange={(e) => setTcoSalary(Number(e.target.value))}
                                        placeholder="1200"
                                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-black text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    />
                                </div>
                                <div className={`p-2.5 rounded-xl text-[10px] font-bold ${
                                    (tcoSalary >= 537.13 && ssAssessment.monthlyAverageRelevantIncome < 2148.52)
                                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                                }`}>
                                    {(tcoSalary >= 537.13 && ssAssessment.monthlyAverageRelevantIncome < 2148.52)
                                        ? tr.tco_ok
                                        : tr.tco_fail}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Variation Scale (-25% to +25% in 5% steps) */}
                <div className="space-y-3 pt-1">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-black text-slate-900 uppercase tracking-wider">
                            {tr.var_label}
                        </label>
                        <span className={`text-xs font-black px-2.5 py-1 rounded-xl border ${
                            simVariation === 0 ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : simVariation > 0 ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                            {simVariation === 0 ? '0% (Padrão)' : `${simVariation > 0 ? '+' : ''}${(simVariation * 100).toFixed(0)}%`}
                        </span>
                    </div>

                    {/* Continuous Range Slider */}
                    <input
                        type="range"
                        min="-0.25"
                        max="0.25"
                        step="0.05"
                        value={simVariation}
                        onChange={(e) => setSimVariation(Number(Number(e.target.value).toFixed(2)))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />

                    {/* Quick Pills for 11 steps */}
                    <div className="grid grid-cols-6 sm:grid-cols-11 gap-1 pt-1">
                        {SS_VARIATION_STEPS.map((stepVal) => (
                            <button
                                key={stepVal}
                                type="button"
                                onClick={() => setSimVariation(stepVal)}
                                className={`py-1 px-1 rounded-lg text-[9px] font-black transition-all cursor-pointer ${
                                    simVariation === stepVal
                                        ? 'bg-indigo-600 text-white shadow-sm scale-105'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {stepVal === 0 ? '0%' : `${stepVal > 0 ? '+' : ''}${(stepVal * 100).toFixed(0)}%`}
                            </button>
                        ))}
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium">{tr.var_desc}</p>
                </div>

                {/* Tax Rate Selection */}
                <div className="space-y-2 pt-1">
                    <label className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                        {tr.tax_rate_label}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <button
                            type="button"
                            onClick={() => setSimTaxRate(0.214)}
                            className={`p-3.5 rounded-2xl border text-center text-xs font-black transition-all cursor-pointer ${
                                simTaxRate === 0.214
                                    ? 'bg-slate-900 text-white border-slate-950 shadow-lg scale-[1.01]'
                                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                            }`}
                        >
                            {tr.rate_ti}
                        </button>
                        <button
                            type="button"
                            onClick={() => setSimTaxRate(0.252)}
                            className={`p-3.5 rounded-2xl border text-center text-xs font-black transition-all cursor-pointer ${
                                simTaxRate === 0.252
                                    ? 'bg-slate-900 text-white border-slate-950 shadow-lg scale-[1.01]'
                                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                            }`}
                        >
                            {tr.rate_eni}
                        </button>
                    </div>
                </div>
            </div>

            {/* Result Card — Premium MIRA Dark Theme */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl space-y-5">
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                    <span className="text-xs font-black uppercase tracking-widest text-[#FF8C00] flex items-center gap-2">
                        <Calculator size={16} /> {tr.res_title}
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-3 py-1 rounded-full border border-emerald-500/30">
                        {tr.badge_official}
                    </span>
                </div>

                {/* Main Monthly Due Header */}
                <div className="space-y-1">
                    <p className="text-xs text-slate-300 font-bold uppercase tracking-wider">
                        {tr.res_monthly}
                    </p>
                    <p className="text-4xl font-black text-[#FF8C00] tracking-tight">
                        € {ssAssessment.monthlyContribution.toFixed(2)}{' '}
                        <span className="text-sm text-slate-400 font-bold">
                            {lang === 'en' ? '/ mo' : lang === 'es' ? '/ mes' : lang === 'fr' ? '/ mois' : '/ mês'}
                        </span>
                    </p>
                </div>

                {/* Status / Exemption Badges */}
                {ssAssessment.isExempt && (
                    <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-start gap-2.5 text-emerald-200 font-bold text-xs">
                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                            <span className="block uppercase tracking-wider text-[10px] text-emerald-300">
                                {tr.badge_exempt}
                            </span>
                            <p className="text-[11px] text-emerald-100 font-medium mt-0.5">
                                {ssAssessment.exemptionReason}
                            </p>
                        </div>
                    </div>
                )}

                {ssAssessment.isMinimumPayment && !ssAssessment.isExempt && (
                    <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-2xl flex items-center gap-2 text-amber-200 font-bold text-xs">
                        <AlertTriangle size={15} className="text-amber-400 shrink-0" />
                        <span>{tr.badge_min} (Art. 163.º, n.º 2 do CRC)</span>
                    </div>
                )}

                {ssAssessment.isCappedAt12IAS && (
                    <div className="p-3 bg-cyan-500/15 border border-cyan-500/30 rounded-2xl flex items-center gap-2 text-cyan-200 font-bold text-xs">
                        <Shield size={15} className="text-cyan-400 shrink-0" />
                        <span>{tr.badge_ceiling} (Art. 163.º, n.º 5 do CRC)</span>
                    </div>
                )}

                {/* Discriminative Summary Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-xs border-t border-white/10">
                    <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{tr.res_declared}</p>
                        <p className="text-base font-black text-white mt-0.5">€ {ssAssessment.quarterlyRevenue.toFixed(2)}</p>
                    </div>
                    <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{tr.res_relevant_avg}</p>
                        <p className="text-base font-black text-amber-300 mt-0.5">€ {ssAssessment.monthlyAverageRelevantIncome.toFixed(2)}</p>
                    </div>
                    <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{tr.res_contributory_base}</p>
                        <p className="text-base font-black text-white mt-0.5">
                            € {ssAssessment.finalContributoryBase.toFixed(2)}{' '}
                            <span className="text-[10px] text-slate-400 font-normal">
                                ({ssAssessment.variationPct >= 0 ? '+' : ''}{(ssAssessment.variationPct * 100).toFixed(0)}%)
                            </span>
                        </p>
                    </div>
                    <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{tr.res_quarterly_total}</p>
                        <p className="text-base font-black text-emerald-400 mt-0.5">€ {ssAssessment.quarterlyTotalContribution.toFixed(2)}</p>
                    </div>
                </div>

                {/* Official Deadlines & Information Box */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-xs text-slate-200 space-y-2">
                    <p className="font-black text-white flex items-center gap-1.5 uppercase tracking-wide text-[10.5px]">
                        <Clock size={14} className="text-amber-400" />
                        <span>{tr.deadlines_title}</span>
                    </p>
                    <p className="text-slate-300 text-[10.5px] leading-relaxed">
                        {tr.deadline_declaration}
                    </p>
                    <p className="text-slate-300 text-[10.5px] leading-relaxed">
                        {tr.deadline_payment}
                    </p>
                </div>

                {/* Direct Link to Documents if onViewChange is available */}
                {onViewChange && (
                    <div className="pt-2 border-t border-white/10">
                        <button
                            type="button"
                            onClick={() => onViewChange(ViewType.DOCUMENTS, { tab: 'docs' })}
                            className="w-full py-3 px-4 bg-white/10 hover:bg-white/15 text-white rounded-2xl text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
                        >
                            <span>{tr.btn_guide}</span>
                            <ArrowRight size={14} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
