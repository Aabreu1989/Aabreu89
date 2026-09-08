// src/components/NissWizard.tsx
import React, { useState, useMemo } from 'react';
import {
    ArrowLeft, ChevronRight, CheckCircle2, FileText, Info,
    Shield, RotateCcw, Zap, MapPin, ExternalLink, Globe, Sparkles,
    Calculator, Calendar, DollarSign, Lightbulb, Check, Copy, HelpCircle,
    AlertTriangle, Scale, Clock, Sliders, CheckSquare, Square
} from 'lucide-react';
import { t } from '../utils/translations';
import { analytics } from '../services/analyticsService';
import { ViewType } from '../types';
import { CrossModuleNavigationHub } from './CrossModuleNavigationHub';

interface NissWizardProps {
    language: string;
    onBack: () => void;
    onSelectTemplate: (templateId: string) => void;
    onViewChange?: (view: ViewType, params?: any) => void;
}

// ─── Step Indicator Dots ─────────────────────────────────────────────────────
const StepDots: React.FC<{ total: number; current: number }> = ({ total, current }) => (
    <div className="flex items-center justify-center gap-2">
        {Array.from({ length: total }).map((_, i) => (
            <div
                key={i}
                className={`rounded-full transition-all duration-500 ${
                    i + 1 === current
                        ? 'w-6 h-2 bg-blue-400 shadow-md shadow-blue-400/50'
                        : i + 1 < current
                        ? 'w-2 h-2 bg-blue-400/60'
                        : 'w-2 h-2 bg-white/20'
                }`}
            />
        ))}
    </div>
);

// ─── Badge Pill ──────────────────────────────────────────────────────────────
const BadgePill: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
        <span className="text-blue-400">{icon}</span>
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-200">{text}</span>
    </div>
);

// ─── LOCALIZED TRANSLATIONS (5 IDIOMAS) ──────────────────────────────────────
type Lang = 'pt' | 'br' | 'es' | 'en' | 'fr';
const LOCAL_TRANS: Record<Lang, Record<string, string>> = {
    "pt": {
        "menu_activity": "Abrir e Fechar Atividade",
        "menu_activity_sub": "Prazos fiscais AT (CIRS Art. 112 / CIVA Art. 33), IVA Art. 53 e sincronização SS.",
        "niss_type_pre_arrival": "Pré-Chegada (No País de Origem)",
        "niss_type_pre_arrival_sub": "NIF via procurador no e-Balcão AT e NISS via representante/empregador na SS.",
        "supports_disclaimer": "Catálogo Informativo de Prestações Públicas: A listagem destes apoios tem finalidade exclusivamente orientativa e informativa. A visualização de um apoio não infere nem confere direito ou elegibilidade automática, dependendo da avaliação individual das condições de recursos e requisitos legais pelas entidades oficiais competentes.",
        "badge_pre_arrival": "Pré-Chegada Consular / Remota",
        "tab_act_open": "Abrir Atividade (Início)",
        "tab_act_close": "Fechar Atividade (Cessação)",
        "niss_title": "Segurança Social & Jornada MIRA",
        "niss_menu_desc": "NISS, Declaração Trimestral, Simulador de Contribuição e Life Hacks para Imigrantes em Portugal.",
        "menu_get_niss": "Obter Número NISS",
        "menu_get_niss_sub": "Passo a passo e documentação oficial para obter o seu NISS.",
        "menu_decl_trimestral": "Declaração Trimestral SS",
        "menu_decl_trimestral_sub": "Guia oficial de como declarar rendimentos de Recibos Verdes na SS Direta.",
        "menu_simulador_ss": "Simulador de Contribuição SS",
        "menu_simulador_ss_sub": "Calcule quanto vai pagar por mês com opção de variação de -25% a +25%.",
        "menu_lifehacks": "Life Hacks & Dicas de Integração",
        "menu_lifehacks_sub": "Isenção no 1.º ano, Acordo de Saúde PB4/SNS, Atestado de Morada e Dicas Fiscais.",
        "menu_supports": "Apoios Sociais (Prestações)",
        "menu_supports_sub": "Consulte abonos, subsídios de desemprego, doença, RSI e mais.",
        "back_to_menu": "Voltar ao Menu",
        "support_steps_title": "Passo a Passo de Candidatura",
        "support_docs_title": "Documentos Exigidos",
        "support_apply_title": "Onde e Como Dar Entrada",
        "support_list_title": "Catálogo de Apoios Sociais",
        "support_list_sub": "Selecione um apoio para ver o procedimento passo a passo e onde aplicar.",
        "sim_title": "Simulador de Contribuição Segurança Social",
        "sim_subtitle": "Cálculo de Recibos Verdes & Trabalhadores Independentes (DL 110/2009 - 2026)",
        "sim_revenue_label": "Rendimento Bruto Total do Trimestre (€):",
        "sim_revenue_desc": "Soma de todas as faturas/recibos emitidos nos 3 meses do trimestre anterior.",
        "sim_activity_label": "Tipo de Atividade Profissional:",
        "sim_act_services": "💼 Prestação de Serviços (70%)",
        "sim_act_services_sub": "Profissões Liberais, Saúde, TI, Consultoria, Engenharia",
        "sim_act_sales": "🛍️ Vendas / Restauração (20%)",
        "sim_act_sales_sub": "Comércio de Bens, Hotelaria, Alojamento Local e Restauração",
        "sim_health_note": "⚖️ Nota Legal (Art. 151.º do CRC): Médicos, profissionais de saúde e profissões liberais enquadram-se na prestação de serviços com coeficiente de 70%.",
        "sim_toggles_title": "Isenções e Condições Especiais",
        "sim_first_year_label": "Primeiro ano de enquadramento na Segurança Social (Início de Atividade)?",
        "sim_first_year_desc": "Beneficia de isenção facultativa nos primeiros 12 meses consecutivos de atividade.",
        "sim_tco_label": "Acumula com contrato de trabalho (Trabalho por Conta de Outrem)?",
        "sim_tco_salary_label": "Remuneração Mensal Bruta do Emprego Dependente (€):",
        "sim_tco_salary_desc": "Condição de isenção cumulativa (Art. 157.º do CRC): Salário do contrato ≥ 1 IAS (€ 537,13) E Rendimento Relevante TI < 4 IAS (€ 2.148,52).",
        "sim_variation_label": "Opção de Ajuste de Variação Trimestral (-25% a +25%):",
        "sim_variation_desc": "Escolha em patamares de 5% o ajuste sobre a base mensal apurada.",
        "sim_tax_rate_label": "Taxa Contributiva Oficial (Art. 168.º do CRC):",
        "sim_rate_ti": "21,4% — Trabalhador Independente em Geral",
        "sim_rate_eni": "25,2% — Empresário em Nome Individual (ENI)",
        "sim_res_title": "Resultado da Simulação SS",
        "sim_res_monthly": "Contribuição Mensal a Pagar (Fixa por 3 meses):",
        "sim_res_declared": "Rendimento Bruto Declarado:",
        "sim_res_relevant_avg": "Rendimento Relevante Médio Mensal (1/3):",
        "sim_res_contributory_base": "Base de Incidência Fixada:",
        "sim_res_quarterly_total": "Total do Trimestre (3 Prestações):",
        "sim_badge_min": "Piso Mínimo Legal (€ 20,00/mês)",
        "sim_badge_ceiling": "Teto Máximo Legal Atingido (12 × IAS = € 6.445,56)",
        "sim_badge_exempt": "Isenção Legal Válida",
        "sim_official_deadlines_title": "Prazos Oficiais da Segurança Social (Obrigatórios)",
        "sim_deadline_declaration": "📅 Declaração Trimestral: Entregue obrigatoriamente até ao último dia dos meses de Janeiro, Abril, Julho e Outubro através da Segurança Social Direta.",
        "sim_deadline_payment": "💳 Janela de Pagamento: Mensalmente, entre os dias 10 e 20 do mês seguinte àquele a que a contribuição respeita (ex.: contribuição de Janeiro paga entre 10 e 20 de Fevereiro)."
    },
    "br": {
        "menu_activity": "Abrir e Fechar Atividade",
        "menu_activity_sub": "Prazos fiscais AT (CIRS Art. 112 / CIVA Art. 33), IVA Art. 53 e sincronização SS.",
        "niss_type_pre_arrival": "Pré-Chegada (No País de Origem)",
        "niss_type_pre_arrival_sub": "NIF via procurador no e-Balcão AT e NISS via representante/empregador na SS.",
        "supports_disclaimer": "Catálogo Informativo de Prestações Públicas: A listagem destes apoios tem finalidade exclusivamente orientativa e informativa. A visualização de um apoio não infere nem confere direito ou elegibilidade automática, dependendo da avaliação individual das condições de recursos e requisitos legais pelas entidades oficiais competentes.",
        "badge_pre_arrival": "Pré-Chegada Consular / Remota",
        "tab_act_open": "Abrir Atividade (Início)",
        "tab_act_close": "Fechar Atividade (Cessação)",
        "niss_title": "Segurança Social & Jornada MIRA",
        "niss_menu_desc": "NISS, Declaração Trimestral, Simulador de Contribuição e Dicas para Brasileiros em Portugal.",
        "menu_get_niss": "Obter Número NISS",
        "menu_get_niss_sub": "Passo a passo e documentação oficial para obter o seu NISS.",
        "menu_decl_trimestral": "Declaração Trimestral SS",
        "menu_decl_trimestral_sub": "Guia oficial de como declarar rendimentos de Recibos Verdes na SS Direta.",
        "menu_simulador_ss": "Simulador de Contribuição SS",
        "menu_simulador_ss_sub": "Calcule quanto vai pagar por mês com opção de variação de -25% a +25%.",
        "menu_lifehacks": "Life Hacks & Dicas de Integração",
        "menu_lifehacks_sub": "Isenção no 1.º ano, Acordo de Saúde PB4/SNS, Atestado de Morada e Dicas Fiscais.",
        "menu_supports": "Benefícios Sociais",
        "menu_supports_sub": "Consulte abonos de família, seguro-desemprego, auxílio-doença, RSI e mais.",
        "back_to_menu": "Voltar ao Menu",
        "support_steps_title": "Passo a Passo da Solicitação",
        "support_docs_title": "Documentos Exigidos",
        "support_apply_title": "Onde e Como Solicitar",
        "support_list_title": "Catálogo de Benefícios Sociais",
        "support_list_sub": "Selecione um benefício para ver o procedimento passo a passo e onde solicitar.",
        "sim_title": "Simulador de Contribuição Segurança Social",
        "sim_subtitle": "Cálculo de Recibos Verdes & Autônomos (DL 110/2009 - 2026)",
        "sim_revenue_label": "Faturamento Bruto Total do Trimestre (€):",
        "sim_revenue_desc": "Soma de todas as notas fiscais/recibos verdes emitidos nos 3 meses do trimestre anterior.",
        "sim_activity_label": "Tipo de Atividade Profissional:",
        "sim_act_services": "💼 Prestação de Serviços (70%)",
        "sim_act_services_sub": "Profissões Liberais, Saúde, TI, Consultoria, Engenharia",
        "sim_act_sales": "🛍️ Vendas / Restaurantes (20%)",
        "sim_act_sales_sub": "Comércio de Bens, Hotelaria, Alojamento Local e Alimentação",
        "sim_health_note": "⚖️ Nota Legal (Art. 151.º do CRC): Médicos, profissionais da saúde e autônomos liberais entram na prestação de serviços com coeficiente de 70%.",
        "sim_toggles_title": "Isenções e Situações Especiais",
        "sim_first_year_label": "Primeiro ano de cadastro na Segurança Social (Início de Atividade)?",
        "sim_first_year_desc": "Direito à isenção facultativa nos primeiros 12 meses ininterruptos de atividade.",
        "sim_tco_label": "Acumula com emprego de carteira assinada (Trabalho por Conta de Outrem)?",
        "sim_tco_salary_label": "Salário Mensal Bruto do Emprego Fixo (€):",
        "sim_tco_salary_desc": "Regra cumulativa de isenção (Art. 157.º do CRC): Salário fixo ≥ 1 IAS (€ 537,13) E Renda Relevante como autônomo < 4 IAS (€ 2.148,52).",
        "sim_variation_label": "Opção de Ajuste de Variação Trimestral (-25% a +25%):",
        "sim_variation_desc": "Escolha em degraus de 5% o ajuste sobre a base mensal de contribuição.",
        "sim_tax_rate_label": "Alíquota Contributiva Oficial (Art. 168.º do CRC):",
        "sim_rate_ti": "21,4% — Trabalhador Autônomo em Geral",
        "sim_rate_eni": "25,2% — Empresário em Nome Individual (ENI)",
        "sim_res_title": "Resultado da Simulação SS",
        "sim_res_monthly": "Contribuição Mensal Fixa a Pagar (por 3 meses):",
        "sim_res_declared": "Faturamento Bruto Declarado:",
        "sim_res_relevant_avg": "Rendimento Relevante Mensal Médio (1/3):",
        "sim_res_contributory_base": "Base de Cálculo Fixada:",
        "sim_res_quarterly_total": "Total do Trimestre (3 Parcelas):",
        "sim_badge_min": "Piso Mínimo Obrigatório (€ 20,00/mês)",
        "sim_badge_ceiling": "Teto Máximo Legal Atingido (12 × IAS = € 6.445,56)",
        "sim_badge_exempt": "Isenção Legal Confirmada",
        "sim_official_deadlines_title": "Prazos Oficiais da Segurança Social (Obrigatórios)",
        "sim_deadline_declaration": "📅 Declaração Trimestral: Entregue obrigatoriamente até o último dia de Janeiro, Abril, Julho e Outubro pela Segurança Social Direta.",
        "sim_deadline_payment": "💳 Janela de Pagamento: Mensalmente, entre os dias 10 e 20 do mês seguinte àquele a que a contribuição se refere (ex.: contribuição de Janeiro paga entre 10 e 20 de Fevereiro)."
    },
    "es": {
        "menu_activity": "Abrir y Cerrar Actividad",
        "menu_activity_sub": "Plazos fiscales AT (CIRS Art. 112 / CIVA Art. 33), IVA Art. 53 y sincronización SS.",
        "niss_type_pre_arrival": "Previo a la Llegada (País de Origen)",
        "niss_type_pre_arrival_sub": "NIF mediante apoderado en e-Balcão AT y NISS vía representante/empleador en SS.",
        "supports_disclaimer": "Catálogo Informativo de Prestaciones Públicas: El listado de estas ayudas tiene fines exclusivamente orientativos e informativos. La visualización no confiere derecho ni elegibilidad automática, estando sujeta a la evaluación de requisitos por los organismos competentes.",
        "badge_pre_arrival": "Previo a la Llegada / Remoto",
        "tab_act_open": "Abrir Actividad (Inicio)",
        "tab_act_close": "Cerrar Actividad (Cese)",
        "niss_title": "Seguridad Social & Guía MIRA",
        "niss_menu_desc": "NISS, Declaración Trimestral, Simulador de Cotización y Consejos para Inmigrantes en Portugal.",
        "menu_get_niss": "Obtener Número NISS",
        "menu_get_niss_sub": "Paso a paso y documentación oficial para tramitar su NISS.",
        "menu_decl_trimestral": "Declaración Trimestral SS",
        "menu_decl_trimestral_sub": "Guía oficial para declarar ingresos de Recibos Verdes en la SS Direta.",
        "menu_simulador_ss": "Simulador de Cotización SS",
        "menu_simulador_ss_sub": "Calcule su cuota mensual con opción de ajuste de -25% a +25%.",
        "menu_lifehacks": "Life Hacks & Consejos de Integración",
        "menu_lifehacks_sub": "Exención del 1er año, Convenios de Salud, Certificado de Domicilio y Fiscalidad.",
        "menu_supports": "Ayudas Sociales (Prestaciones)",
        "menu_supports_sub": "Consulte asignaciones familiares, desempleo, incapacidad temporal y más.",
        "back_to_menu": "Volver al Menú",
        "support_steps_title": "Paso a Paso de Solicitud",
        "support_docs_title": "Documentos Exigidos",
        "support_apply_title": "Dónde y Cómo Solicitar",
        "support_list_title": "Catálogo de Ayudas Sociales",
        "support_list_sub": "Seleccione una ayuda para ver el procedimiento paso a paso.",
        "sim_title": "Simulador de Cotización a la Seguridad Social",
        "sim_subtitle": "Cálculo para Autónomos y Recibos Verdes (DL 110/2009 - 2026)",
        "sim_revenue_label": "Ingresos Brutos Totales del Trimestre (€):",
        "sim_revenue_desc": "Suma de todas las facturas/recibos emitidos en los 3 meses del trimestre anterior.",
        "sim_activity_label": "Tipo de Actividad Profesional:",
        "sim_act_services": "💼 Prestación de Servicios (70%)",
        "sim_act_services_sub": "Profesiones Liberales, Salud, TI, Consultoría, Ingeniería",
        "sim_act_sales": "🛍️ Ventas / Restauración (20%)",
        "sim_act_sales_sub": "Comercio de Bienes, Hostelería, Alojamiento Turístico y Restauración",
        "sim_health_note": "⚖️ Nota Legal (Art. 151.º del CRC): Los médicos, sanitarios y profesiones liberales tributan bajo servicios al 70%.",
        "sim_toggles_title": "Exenciones y Casos Especiales",
        "sim_first_year_label": "¿Primer año de alta en la Seguridad Social (Inicio de Actividad)?",
        "sim_first_year_desc": "Disfruta de exención voluntaria durante los primeros 12 meses consecutivos.",
        "sim_tco_label": "¿Pluriempleo con contrato laboral por cuenta ajena?",
        "sim_tco_salary_label": "Salario Mensual Bruto del Empleo Asalariado (€):",
        "sim_tco_salary_desc": "Requisitos de exención (Art. 157.º del CRC): Salario asalariado ≥ 1 IAS (€ 537,13) e Ingreso Relevante como autónomo < 4 IAS (€ 2.148,52).",
        "sim_variation_label": "Opción de Ajuste Trimestral de Base (-25% a +25%):",
        "sim_variation_desc": "Ajuste en tramos del 5% sobre la base de cotización mensual.",
        "sim_tax_rate_label": "Tipo de Cotización Oficial (Art. 168.º del CRC):",
        "sim_rate_ti": "21,4% — Trabajador Autónomo General",
        "sim_rate_eni": "25,2% — Empresario Individual (ENI)",
        "sim_res_title": "Resultado de la Simulación SS",
        "sim_res_monthly": "Cuota Mensual a Pagar (fija durante 3 meses):",
        "sim_res_declared": "Ingresos Brutos Declarados:",
        "sim_res_relevant_avg": "Ingreso Relevante Mensual Medio (1/3):",
        "sim_res_contributory_base": "Base de Cotización Fijada:",
        "sim_res_quarterly_total": "Total del Trimestre (3 Cuotas):",
        "sim_badge_min": "Cuota Mínima Obligatoria (€ 20,00/mes)",
        "sim_badge_ceiling": "Tope Máximo Legal Alcanzado (12 × IAS = € 6.445,56)",
        "sim_badge_exempt": "Exención Legal Válida",
        "sim_official_deadlines_title": "Plazos Oficiales de la Seguridad Social (Obligatorios)",
        "sim_deadline_declaration": "📅 Declaración Trimestral: Presentación obligatoria hasta el último día de Enero, Abril, Julio y Octubre en la Seguridad Social Direta.",
        "sim_deadline_payment": "💳 Ventana de Pago: Mensualmente, entre los días 10 y 20 del mes siguiente (ej.: cuota de Enero abonada entre el 10 y el 20 de Febrero)."
    },
    "en": {
        "menu_activity": "Open & Close Activity",
        "menu_activity_sub": "Tax deadlines AT (CIRS Art. 112 / CIVA Art. 33), VAT Art. 53, and Social Security sync.",
        "niss_type_pre_arrival": "Pre-Arrival (In Home Country)",
        "niss_type_pre_arrival_sub": "NIF via attorney-in-fact on AT e-Balcão and NISS via legal rep/employer on SS.",
        "supports_disclaimer": "Public Benefits Informational Catalog: The listing of these supports is strictly informative. Viewing a benefit does not infer or grant automatic eligibility, which remains subject to individual verification of statutory requirements by official bodies.",
        "badge_pre_arrival": "Pre-Arrival / Remote Request",
        "tab_act_open": "Open Activity (Start)",
        "tab_act_close": "Close Activity (Cessation)",
        "niss_title": "Social Security & MIRA Journey",
        "niss_menu_desc": "NISS, Quarterly Declaration, Contribution Simulator and Integration Hacks in Portugal.",
        "menu_get_niss": "Get NISS Number",
        "menu_get_niss_sub": "Official step-by-step and paperwork guide to obtain your NISS.",
        "menu_decl_trimestral": "Quarterly Declaration SS",
        "menu_decl_trimestral_sub": "Official guide on how to report Green Receipt income on Social Security Direct.",
        "menu_simulador_ss": "Social Security Simulator",
        "menu_simulador_ss_sub": "Calculate your monthly contribution with optional -25% to +25% adjustments.",
        "menu_lifehacks": "Life Hacks & Integration Tips",
        "menu_lifehacks_sub": "1st Year Exemption, PB4/SNS Health Agreement, Proof of Address & Tax Hacks.",
        "menu_supports": "Social Supports (Benefits)",
        "menu_supports_sub": "Check allowances, unemployment benefits, sickness, RSI and more.",
        "back_to_menu": "Back to Menu",
        "support_steps_title": "Step-by-Step Application Guide",
        "support_docs_title": "Required Documents",
        "support_apply_title": "Where & How to Apply",
        "support_list_title": "Social Supports Catalog",
        "support_list_sub": "Select a benefit to view the step-by-step procedure and where to apply.",
        "sim_title": "Social Security Contribution Simulator",
        "sim_subtitle": "Self-Employed & Green Receipts Assessment (DL 110/2009 - 2026)",
        "sim_revenue_label": "Total Quarterly Gross Invoiced Amount (€):",
        "sim_revenue_desc": "Total sum of all invoices/green receipts issued in the 3 months of the prior quarter.",
        "sim_activity_label": "Professional Activity Category:",
        "sim_act_services": "💼 Service Provision (70%)",
        "sim_act_services_sub": "Liberal Professions, Healthcare, IT, Consulting, Engineering",
        "sim_act_sales": "🛍️ Sales & Hospitality (20%)",
        "sim_act_sales_sub": "Goods Trade, Hotels, Short-Term Rentals & Restaurants",
        "sim_health_note": "⚖️ Statutory Note (CRC Art. 151): Medical and healthcare professionals fall under services with a 70% coefficient.",
        "sim_toggles_title": "Exemptions & Special Conditions",
        "sim_first_year_label": "First year registered with Social Security (New Business Activity)?",
        "sim_first_year_desc": "Entitled to optional full exemption during the first 12 consecutive months of activity.",
        "sim_tco_label": "Concurrently employed under an employment contract (Dual Status)?",
        "sim_tco_salary_label": "Gross Monthly Salary from Employment Contract (€):",
        "sim_tco_salary_desc": "Cumulative exemption test (CRC Art. 157): Employed salary ≥ 1 IAS (€ 537.13) AND Freelance relevant income < 4 IAS (€ 2,148.52).",
        "sim_variation_label": "Quarterly Base Adjustment Option (-25% to +25%):",
        "sim_variation_desc": "Select adjustment in 5% increments over the statutory average monthly base.",
        "sim_tax_rate_label": "Statutory Contribution Rate (CRC Art. 168):",
        "sim_rate_ti": "21.4% — Self-Employed in General",
        "sim_rate_eni": "25.2% — Sole Proprietorship (ENI)",
        "sim_res_title": "Social Security Simulation Results",
        "sim_res_monthly": "Monthly Fixed Contribution (payable for 3 months):",
        "sim_res_declared": "Gross Quarterly Invoiced:",
        "sim_res_relevant_avg": "Average Monthly Relevant Income (1/3):",
        "sim_res_contributory_base": "Fixed Contributory Base:",
        "sim_res_quarterly_total": "Total Quarterly Commitment (3 Payments):",
        "sim_badge_min": "Statutory Minimum Floor (€ 20.00/mo)",
        "sim_badge_ceiling": "Statutory Maximum Cap Applied (12 × IAS = € 6,445.56)",
        "sim_badge_exempt": "Full Statutory Exemption Granted",
        "sim_official_deadlines_title": "Official Social Security Statutory Deadlines",
        "sim_deadline_declaration": "📅 Quarterly Declaration: Mandatory submission by the last day of January, April, July, and October via Social Security Direct.",
        "sim_deadline_payment": "💳 Payment Window: Monthly, between the 10th and 20th of the following month (e.g., January contribution paid between February 10th and 20th)."
    },
    "fr": {
        "menu_activity": "Ouvrir et Fermer Activité",
        "menu_activity_sub": "Délais fiscaux AT (CIRS Art. 112 / CIVA Art. 33), TVA Art. 53 et synchronisation SS.",
        "niss_type_pre_arrival": "Pré-Arrivée (Pays d'Origine)",
        "niss_type_pre_arrival_sub": "NIF via mandataire sur e-Balcão AT et NISS via représentant/employeur sur SS.",
        "supports_disclaimer": "Catalogue Informatif des Prestations Publiques : Cette liste est fournie à titre indicatif. La consultation d'une aide ne confère aucun droit automatique, l'éligibilité dépendant de l'examen individuel des conditions légales par les organismes officiels.",
        "badge_pre_arrival": "Pré-Arrivée / Démarche à Distance",
        "tab_act_open": "Ouvrir Activité (Début)",
        "tab_act_close": "Fermer Activité (Cessation)",
        "niss_title": "Sécurité Sociale & Parcours MIRA",
        "niss_menu_desc": "NISS, Déclaration Trimestrielle, Simulateur de Cotisation et Astuces pour Expatriés au Portugal.",
        "menu_get_niss": "Obtenir le Numéro NISS",
        "menu_get_niss_sub": "Guide officiel étape par étape et documents requis pour votre NISS.",
        "menu_decl_trimestral": "Déclaration Trimestrielle SS",
        "menu_decl_trimestral_sub": "Procédure officielle pour déclarer vos revenus d'indépendant sur SS Direta.",
        "menu_simulador_ss": "Simulateur de Cotisation SS",
        "menu_simulador_ss_sub": "Calculez votre cotisation mensuelle avec option de variation de -25% à +25%.",
        "menu_lifehacks": "Life Hacks & Astuces d'Intégration",
        "menu_lifehacks_sub": "Exonération 1ère année, Accords de Santé, Justificatif de Domicile et Fiscalité.",
        "menu_supports": "Aides Sociales (Prestations)",
        "menu_supports_sub": "Consultez allocations familiales, chômage, maladie, RSI et autres.",
        "back_to_menu": "Retour au Menu",
        "support_steps_title": "Procédure Étape par Étape",
        "support_docs_title": "Pièces Justificatives",
        "support_apply_title": "Où et Comment Déposer",
        "support_list_title": "Catalogue des Aides Sociales",
        "support_list_sub": "Sélectionnez une prestation pour voir la procédure détaillée.",
        "sim_title": "Simulateur de Cotisation à la Sécurité Sociale",
        "sim_subtitle": "Calcul pour Travailleurs Indépendants & Reçus Verts (DL 110/2009 - 2026)",
        "sim_revenue_label": "Chiffre d'Affaires Brut Trimestriel (€):",
        "sim_revenue_desc": "Total des factures/reçus émis au cours des 3 mois du trimestre civil précédent.",
        "sim_activity_label": "Catégorie d'Activité Professionnelle:",
        "sim_act_services": "💼 Prestations de Services (70%)",
        "sim_act_services_sub": "Professions Libérales, Santé, Informatique, Conseil, Ingénierie",
        "sim_act_sales": "🛍️ Vente de Biens & Restauration (20%)",
        "sim_act_sales_sub": "Commerce, Hôtellerie, Hébergement Touristique et Restauration",
        "sim_health_note": "⚖️ Note Légale (Art. 151 du CRC): Les professions médicales et libérales relèvent des prestations de services avec un coefficient de 70%.",
        "sim_toggles_title": "Exonérations et Régimes Dérogatoires",
        "sim_first_year_label": "Première année d'affiliation à la Sécurité Sociale (Début d'Activité)?",
        "sim_first_year_desc": "Droit à une exonération facultative pendant les 12 premiers mois consécutifs.",
        "sim_tco_label": "Cumul avec une activité salariée sous contrat de travail?",
        "sim_tco_salary_label": "Salaire Brut Mensuel de l'Emploi Salarié (€):",
        "sim_tco_salary_desc": "Critères d'exonération cumulatifs (Art. 157 du CRC): Salaire salarié ≥ 1 IAS (€ 537,13) ET Revenu pertinent indépendant < 4 IAS (€ 2.148,52).",
        "sim_variation_label": "Option d'Ajustement Trimestriel (-25% à +25%):",
        "sim_variation_desc": "Modulation par paliers de 5% sur l'assiette mensuelle moyenne.",
        "sim_tax_rate_label": "Taux de Cotisation Légal (Art. 168 du CRC):",
        "sim_rate_ti": "21,4% — Travailleur Indépendant Général",
        "sim_rate_eni": "25,2% — Entreprise Individuelle (ENI)",
        "sim_res_title": "Résultats de la Simulation SS",
        "sim_res_monthly": "Cotisation Mensuelle Fixe à Régler (pendant 3 mois):",
        "sim_res_declared": "Revenu Brut Déclaré:",
        "sim_res_relevant_avg": "Revenu Pertinent Mensuel Moyen (1/3):",
        "sim_res_contributory_base": "Assiette de Cotisation Fixée:",
        "sim_res_quarterly_total": "Total du Trimestre (3 Mensualités):",
        "sim_badge_min": "Cotisation Minimale Obligatoire (€ 20,00/mois)",
        "sim_badge_ceiling": "Plafond Légal Atteint (12 × IAS = € 6.445,56)",
        "sim_badge_exempt": "Exonération Légale Accordée",
        "sim_official_deadlines_title": "Calendrier Officiel de la Sécurité Sociale (Impératif)",
        "sim_deadline_declaration": "📅 Déclaration Trimestrielle: Dépôt obligatoire avant le dernier jour de Janvier, Avril, Juillet et Octobre sur Segurança Social Direta.",
        "sim_deadline_payment": "💳 Fenêtre de Paiement: Chaque mois, entre le 10 et le 20 du mois suivant (ex.: cotisation de Janvier payée entre le 10 et le 20 Février)."
    }
};

interface SupportDetail {
    title: string;
    description: string;
    category: string;
    steps: { icon: string; text: string }[];
    docs: { icon: string; text: string }[];
    applyInfo: string;
    links: { label: string; url: string }[];
}

const SOCIAL_SUPPORTS: Record<string, Record<string, SupportDetail>> = {
    abono: {
        pt: {
            title: "Abono de Família para Crianças e Jovens",
            description: "Apoio mensal para ajudar nas despesas com o sustento e educação de crianças e jovens (DL 176/2003).",
            category: "🏛️ Segurança Social — Família",
            steps: [
                { icon: "1️⃣", text: "Obtenha o NIF e NISS da criança e de todos os membros do agregado familiar." },
                { icon: "2️⃣", text: "Submeta a declaração de IRS ou comprove a situação económica do agregado nas Finanças." },
                { icon: "3️⃣", text: "Preencha o formulário oficial Mod. RP5045-DGSS (Requerimento de Abono de Família)." },
                { icon: "4️⃣", text: "Submeta o requerimento na Segurança Social Direta ou num balcão de atendimento." }
            ],
            docs: [
                { icon: "🛂", text: "Documento de Identificação da Criança e dos Pais" },
                { icon: "🔢", text: "NIF e NISS de todos os membros do agregado" },
                { icon: "📄", text: "Declaração de IRS ou comprovativo de rendimentos" },
                { icon: "📋", text: "Formulário Mod. RP5045-DGSS preenchido" }
            ],
            applyInfo: "Pode submeter o pedido de forma 100% digital através do portal Segurança Social Direta. Se preferir atendimento presencial, agende online através do portal SIGA.",
            links: [
                { label: "Segurança Social Direta", url: "https://app.seg-social.pt" },
                { label: "Guia Oficial — Abono de Família", url: "https://www.seg-social.pt/abono-de-familia-para-criancas-e-jovens" }
            ]
        },
        en: {
            title: "Family Allowance for Children & Youth",
            description: "Monthly financial support to help cover cost of raising and educating children and young people (DL 176/2003).",
            category: "🏛️ Social Security — Family",
            steps: [
                { icon: "1️⃣", text: "Obtain NIF and NISS for the child and all household members." },
                { icon: "2️⃣", text: "Submit your IRS tax return or prove your household's financial status." },
                { icon: "3️⃣", text: "Fill in the official Form Mod. RP5045-DGSS (Family Allowance Application)." },
                { icon: "4️⃣", text: "Submit the application on Social Security Direct portal or at a physical branch." }
            ],
            docs: [
                { icon: "🛂", text: "ID Document for the child and parents" },
                { icon: "🔢", text: "NIF and NISS of all household members" },
                { icon: "📄", text: "IRS tax return or proof of income" },
                { icon: "📋", text: "Completed Form Mod. RP5045-DGSS" }
            ],
            applyInfo: "Submit 100% digitally via the Social Security Direct portal or in person with prior SIGA booking.",
            links: [
                { label: "Social Security Direct", url: "https://app.seg-social.pt" },
                { label: "Official Guide — Family Allowance", url: "https://www.seg-social.pt/abono-de-familia-para-criancas-e-jovens" }
            ]
        },
        es: {
            title: "Asignación Familiar para Hijos y Jóvenes",
            description: "Prestación mensual para ayudar en los gastos de manutención y educación de menores y jóvenes (DL 176/2003).",
            category: "🏛️ Seguridad Social — Familia",
            steps: [
                { icon: "1️⃣", text: "Obtenga el NIF y NISS del menor y de todos los miembros de la unidad de convivencia." },
                { icon: "2️⃣", text: "Presente la declaración de IRPF (IRS) o acredite los ingresos de la unidad familiar en Hacienda." },
                { icon: "3️⃣", text: "Rellene el formulario oficial Mod. RP5045-DGSS (Solicitud de Asignación Familiar)." },
                { icon: "4️⃣", text: "Presente la solicitud en el portal Seguridad Social Direta o en una oficina de la Seguridad Social." }
            ],
            docs: [
                { icon: "🛂", text: "Documento de identidad del menor y de los progenitores" },
                { icon: "🔢", text: "NIF y NISS de todos los miembros de la unidad familiar" },
                { icon: "📄", text: "Declaración de la renta (IRS) o justificante de ingresos" },
                { icon: "📋", text: "Formulario oficial Mod. RP5045-DGSS cumplimentado" }
            ],
            applyInfo: "Puede tramitarlo 100% online en la Seguridad Social Direta o de forma presencial con cita previa en el portal SIGA.",
            links: [
                { label: "Segurança Social Direta", url: "https://app.seg-social.pt" },
                { label: "Guía Oficial — Asignación Familiar", url: "https://www.seg-social.pt/abono-de-familia-para-criancas-e-jovens" }
            ]
        },
        fr: {
            title: "Allocations Familiales pour Enfants et Jeunes",
            description: "Aide mensuelle destinée à couvrir les dépenses d'entretien et d'éducation des enfants et adolescents (DL 176/2003).",
            category: "🏛️ Sécurité Sociale — Famille",
            steps: [
                { icon: "1️⃣", text: "Obtenez le NIF et le NISS de l'enfant ainsi que de l'ensemble des membres du foyer fiscal." },
                { icon: "2️⃣", text: "Déposez votre déclaration d'impôt IRS ou justifiez de la situation financière du ménage auprès de l'AT." },
                { icon: "3️⃣", text: "Complétez le formulaire officiel Mod. RP5045-DGSS (Demande d'Allocations Familiales)." },
                { icon: "4️⃣", text: "Transmettez votre demande sur le portail Segurança Social Direta ou au guichet de votre caisse." }
            ],
            docs: [
                { icon: "🛂", text: "Pièce d'identité de l'enfant et des parents en cours de validité" },
                { icon: "🔢", text: "NIF et NISS de l'ensemble des membres du foyer familial" },
                { icon: "📄", text: "Avis d'imposition IRS ou justificatifs récents de revenus" },
                { icon: "📋", text: "Formulaire officiel Mod. RP5045-DGSS dûment complété" }
            ],
            applyInfo: "Démarche réalisable 100% en ligne sur Segurança Social Direta ou sur rendez-vous via le portail SIGA.",
            links: [
                { label: "Segurança Social Direta", url: "https://app.seg-social.pt" },
                { label: "Guide Officiel — Allocations Familiales", url: "https://www.seg-social.pt/abono-de-familia-para-criancas-e-jovens" }
            ]
        }
    },
    desemprego: {
        pt: {
            title: "Subsídio de Desemprego",
            description: "Apoio financeiro mensal para trabalhadores que perderam o emprego de forma involuntária (DL 220/2006).",
            category: "🏛️ Segurança Social — Emprego",
            steps: [
                { icon: "1️⃣", text: "Obtenha a Declaração de Situação de Desemprego (Mod. RP5005-DGSS) da sua entidade empregadora." },
                { icon: "2️⃣", text: "Inscreva-se para procura de emprego no IEFP num prazo de 90 dias após o despedimento." },
                { icon: "3️⃣", text: "Submeta o requerimento do subsídio de desemprego no portal Segurança Social Direta ou no IEFP." },
                { icon: "4️⃣", text: "Registe o seu IBAN na Segurança Social Direta para garantir o recebimento automático." }
            ],
            docs: [
                { icon: "📄", text: "Declaração Mod. RP5005-DGSS emitida pelo empregador" },
                { icon: "📋", text: "Comprovativo de inscrição para emprego no IEFP" },
                { icon: "🛂", text: "Documento de Identificação válido, NIF e NISS" },
                { icon: "🏦", text: "Comprovativo de IBAN bancário em nome do titular" }
            ],
            applyInfo: "O pedido deve ser formalizado no IEFP Online ou presencialmente no IEFP até 90 dias após a cessação do contrato de trabalho.",
            links: [
                { label: "Portal IEFP Online", url: "https://iefponline.iefp.pt" },
                { label: "Guia Oficial — Subsídio de Desemprego", url: "https://www.seg-social.pt/subsidio-de-desemprego" }
            ]
        },
        en: {
            title: "Unemployment Benefit",
            description: "Monthly financial benefit for workers who involuntarily lost their job (DL 220/2006).",
            category: "🏛️ Social Security — Employment",
            steps: [
                { icon: "1️⃣", text: "Obtain the Declaration of Unemployment Status (Mod. RP5005-DGSS) from your employer." },
                { icon: "2️⃣", text: "Register for job seeking at the IEFP Employment Center within 90 days of dismissal." },
                { icon: "3️⃣", text: "Submit the unemployment request on Social Security Direct or at the IEFP center." },
                { icon: "4️⃣", text: "Register your IBAN bank details on Social Security Direct for payments." }
            ],
            docs: [
                { icon: "📄", text: "Employer declaration Form Mod. RP5005-DGSS" },
                { icon: "📋", text: "Proof of job registration with IEFP" },
                { icon: "🛂", text: "Valid identification document, NIF, and NISS" },
                { icon: "🏦", text: "Proof of personal bank account IBAN" }
            ],
            applyInfo: "Submit through IEFP Online portal or in person at an IEFP employment center within 90 days.",
            links: [
                { label: "IEFP Online Portal", url: "https://iefponline.iefp.pt" },
                { label: "Official Guide — Unemployment", url: "https://www.seg-social.pt/subsidio-de-desemprego" }
            ]
        },
        es: {
            title: "Prestación por Desempleo",
            description: "Subsidio mensual para trabajadores por cuenta ajena que pierdan involuntariamente su empleo (DL 220/2006).",
            category: "🏛️ Seguridad Social — Empleo",
            steps: [
                { icon: "1️⃣", text: "Obtenga el Certificado de Situación de Desempleo (Mod. RP5005-DGSS) firmado por su empleador." },
                { icon: "2️⃣", text: "Inscríbase como demandante de empleo en el IEFP en un plazo máximo de 90 días tras el despido." },
                { icon: "3️⃣", text: "Tramite la prestación por desempleo a través de la web del IEFP o en Seguridad Social Direta." },
                { icon: "4️⃣", text: "Registre y valide su IBAN en la Seguridad Social Direta para recibir los pagos mensuales." }
            ],
            docs: [
                { icon: "📄", text: "Declaración oficial Mod. RP5005-DGSS expedida por la empresa" },
                { icon: "📋", text: "Justificante de inscripción como demandante de empleo en el IEFP" },
                { icon: "🛂", text: "Documento de identidad en vigor, NIF y NISS" },
                { icon: "🏦", text: "Certificado de titularidad bancaria (IBAN) a nombre del solicitante" }
            ],
            applyInfo: "Presente la solicitud en el portal del IEFP Online o presencialmente en un centro de empleo del IEFP en 90 días.",
            links: [
                { label: "Portal IEFP Online", url: "https://iefponline.iefp.pt" },
                { label: "Guía Oficial — Desempleo", url: "https://www.seg-social.pt/subsidio-de-desemprego" }
            ]
        },
        fr: {
            title: "Allocation d'Assurance Chômage",
            description: "Revenu de remplacement mensuel pour les salariés ayant perdu involontairement leur emploi (DL 220/2006).",
            category: "🏛️ Sécurité Sociale — Emploi",
            steps: [
                { icon: "1️⃣", text: "Obtenez l'attestation de cessation d'activité salariée (Mod. RP5005-DGSS) délivrée par l'employeur." },
                { icon: "2️⃣", text: "Inscrivez-vous comme demandeur d'emploi auprès de l'IEFP dans un délai de 90 jours après la rupture." },
                { icon: "3️⃣", text: "Déposez votre demande d'allocation chômage via le portail de l'IEFP ou sur Segurança Social Direta." },
                { icon: "4️⃣", text: "Enregistrez et vérifiez votre IBAN bancaire sur Segurança Social Direta pour les versements." }
            ],
            docs: [
                { icon: "📄", text: "Attestation officielle de situation de chômage Mod. RP5005-DGSS signée par l'employeur" },
                { icon: "📋", text: "Justificatif officiel d'inscription auprès de l'agence IEFP" },
                { icon: "🛂", text: "Passeport ou Titre de Séjour valide, NIF et NISS" },
                { icon: "🏦", text: "Relevé d'identité bancaire (IBAN) au nom du titulaire" }
            ],
            applyInfo: "Déposez votre dossier sur IEFP Online ou auprès de votre centre pour l'emploi IEFP dans les 90 jours.",
            links: [
                { label: "Portail IEFP Online", url: "https://iefponline.iefp.pt" },
                { label: "Guide Officiel — Chômage", url: "https://www.seg-social.pt/subsidio-de-desemprego" }
            ]
        }
    },
    doenca: {
        pt: {
            title: "Subsídio de Doença (Baixa Médica)",
            description: "Compensação pela perda de remuneração decorrente de incapacidade temporária para o trabalho por doença natural (DL 28/2004).",
            category: "🏛️ Segurança Social — Saúde",
            steps: [
                { icon: "1️⃣", text: "Consulte um médico do Serviço Nacional de Saúde (SNS) ou centro de saúde da sua área." },
                { icon: "2️⃣", text: "O médico emite o Certificado de Incapacidade Temporária (CIT) e envia eletronicamente à SS." },
                { icon: "3️⃣", text: "Guarde a cópia do CIT em seu poder e entregue o duplicado à sua entidade empregadora." },
                { icon: "4️⃣", text: "Confirme que o seu IBAN está ativo na Segurança Social Direta para pagamento automático." }
            ],
            docs: [
                { icon: "🩺", text: "Certificado de Incapacidade Temporária (CIT / Baixa Médica) emitido pelo SNS" },
                { icon: "🛂", text: "Número de Utente do SNS, Cartão de Cidadão ou Título de Residência" },
                { icon: "🔢", text: "NIF e NISS com prazo de garantia contributivo cumprido (mínimo 6 meses de descontos)" },
                { icon: "🏦", text: "IBAN bancário registado na SS Direta" }
            ],
            applyInfo: "O processo é automático: o médico do SNS transmite a baixa diretamente à Segurança Social por via eletrónica. Não precisa de se deslocar a um balcão da SS.",
            links: [
                { label: "Segurança Social Direta", url: "https://app.seg-social.pt" },
                { label: "Guia Oficial — Subsídio de Doença", url: "https://www.seg-social.pt/subsidio-de-doenca" }
            ]
        },
        en: {
            title: "Sickness Benefit (Medical Leave)",
            description: "Income replacement benefit for temporary incapacity to work due to illness (DL 28/2004).",
            category: "🏛️ Social Security — Health",
            steps: [
                { icon: "1️⃣", text: "Visit a National Health Service (SNS) doctor or local public healthcare center." },
                { icon: "2️⃣", text: "The doctor issues the electronic certificate of temporary incapacity (CIT) directly to SS." },
                { icon: "3️⃣", text: "Keep your copy of the CIT and hand over the employer copy to your company." },
                { icon: "4️⃣", text: "Ensure your IBAN is verified on Social Security Direct for automatic transfers." }
            ],
            docs: [
                { icon: "🩺", text: "Electronic Temporary Incapacity Certificate (CIT) issued by SNS doctor" },
                { icon: "🛂", text: "SNS User Number, ID Card or Residence Permit" },
                { icon: "🔢", text: "NIF and NISS with qualifying contribution period (at least 6 months of contributions)" },
                { icon: "🏦", text: "Registered IBAN on Social Security Direct" }
            ],
            applyInfo: "The procedure is automated: the NHS doctor transmits the medical certificate directly to Social Security electronically.",
            links: [
                { label: "Social Security Direct", url: "https://app.seg-social.pt" },
                { label: "Official Guide — Sickness Benefit", url: "https://www.seg-social.pt/subsidio-de-doenca" }
            ]
        },
        es: {
            title: "Subsidio por Incapacidad Temporal (Baja Médica)",
            description: "Compensación por pérdida de ingresos debida a incapacidad temporal para el trabajo por enfermedad común (DL 28/2004).",
            category: "🏛️ Seguridad Social — Salud",
            steps: [
                { icon: "1️⃣", text: "Acuda a su médico del Servicio Nacional de Salud (SNS) o centro de salud de su zona." },
                { icon: "2️⃣", text: "El médico expedirá el Certificado de Incapacidad Temporal (CIT) y lo enviará telemáticamente a la SS." },
                { icon: "3️⃣", text: "Conserve la copia del CIT y entregue el duplicado correspondiente a su empleador." },
                { icon: "4️⃣", text: "Compruebe que su cuenta bancaria (IBAN) está validada en la Seguridad Social Direta." }
            ],
            docs: [
                { icon: "🩺", text: "Certificado de Incapacidad Temporal (CIT / Baja Médica) emitido por el SNS" },
                { icon: "🛂", text: "Número de usuario del SNS (Utente), DNI/Pasaporte o Tarjeta de Residencia" },
                { icon: "🔢", text: "NIF y NISS con período de carencia cubierto (mínimo 6 meses de cotizaciones)" },
                { icon: "🏦", text: "IBAN bancario registrado en la Seguridad Social Direta" }
            ],
            applyInfo: "El proceso es 100% automático: el médico del SNS comunica directamente la baja a la Seguridad Social. No requiere acudir a una oficina de la SS.",
            links: [
                { label: "Segurança Social Direta", url: "https://app.seg-social.pt" },
                { label: "Guía Oficial — Baja Médica", url: "https://www.seg-social.pt/subsidio-de-doenca" }
            ]
        },
        fr: {
            title: "Indemnités Journalières de Maladie (Arrêt de Travail)",
            description: "Indemnité compensatrice de perte de salaire suite à une incapacité temporaire de travail pour maladie (DL 28/2004).",
            category: "🏛️ Sécurité Sociale — Santé",
            steps: [
                { icon: "1️⃣", text: "Consultez un médecin du Service National de Santé (SNS) dans le centre de santé de votre secteur." },
                { icon: "2️⃣", text: "Le médecin établit le Certificat d'Incapacité Temporaire (CIT) et le télétransmet directement à la SS." },
                { icon: "3️⃣", text: "Conservez le volet personnel du CIT et remettez sans délai le double à votre employeur." },
                { icon: "4️⃣", text: "Assurez-vous que vos coordonnées bancaires (IBAN) sont à jour sur Segurança Social Direta." }
            ],
            docs: [
                { icon: "🩺", text: "Certificat d'Incapacité Temporaire (CIT / Arrêt de travail) délivré par le SNS" },
                { icon: "🛂", text: "Numéro d'usager de santé SNS (Utente), Titre de Séjour ou passeport valide" },
                { icon: "🔢", text: "NIF et NISS avec période de stage cotisante validée (au moins 6 mois de cotisations)" },
                { icon: "🏦", text: "IBAN vérifié sur Segurança Social Direta" }
            ],
            applyInfo: "Télétransmission automatique : le médecin du SNS transmet directement l'avis d'arrêt à la Sécurité Sociale. Aucun déplacement en caisse requis.",
            links: [
                { label: "Segurança Social Direta", url: "https://app.seg-social.pt" },
                { label: "Guide Officiel — Maladie", url: "https://www.seg-social.pt/subsidio-de-doenca" }
            ]
        }
    },
    parentalidade: {
        pt: {
            title: "Subsídio de Parentalidade (Maternidade e Paternidade)",
            description: "Prestações pecuniárias pagas durante as licenças de maternidade, paternidade ou adoção (DL 91/2009).",
            category: "🏛️ Segurança Social — Família",
            steps: [
                { icon: "1️⃣", text: "Registe o nascimento do bebé no Registo Civil ou no serviço 'Nascer Cidadão' do hospital." },
                { icon: "2️⃣", text: "Defina entre os progenitores a modalidade de partilha da licença parental inicial." },
                { icon: "3️⃣", text: "Aceda à Segurança Social Direta e preencha o pedido de Subsídio Parental em até 6 meses." },
                { icon: "4️⃣", text: "Comunique à entidade empregadora as datas de início e termo do período de licença." }
            ],
            docs: [
                { icon: "👶", text: "Certidão de nascimento da criança ou comprovativo emitido pelo hospital" },
                { icon: "🛂", text: "Documentos de identificação, NIF e NISS dos pais e do recém-nascido" },
                { icon: "📄", text: "Acordo conjunto de partilha da licença parental (quando aplicável)" },
                { icon: "🏦", text: "IBAN ativo na Segurança Social Direta" }
            ],
            applyInfo: "Submeta online na Segurança Social Direta no menu Família > Parentalidade > Pedir subsídio parental.",
            links: [
                { label: "Segurança Social Direta", url: "https://app.seg-social.pt" },
                { label: "Guia Oficial — Subsídio de Parentalidade", url: "https://www.seg-social.pt/subsidio-de-parentalidade" }
            ]
        },
        en: {
            title: "Parental Benefit (Maternity & Paternity)",
            description: "Cash benefits replacing employment income during maternity, paternity, or adoption leave (DL 91/2009).",
            category: "🏛️ Social Security — Family",
            steps: [
                { icon: "1️⃣", text: "Register the birth with the Civil Registry or hospital registration desk." },
                { icon: "2️⃣", text: "Agree between parents on the initial parental leave sharing schedule." },
                { icon: "3️⃣", text: "Apply online via Social Security Direct within 6 months of the birth." },
                { icon: "4️⃣", text: "Notify your employer about the start and end dates of your parental leave." }
            ],
            docs: [
                { icon: "👶", text: "Birth certificate of the child or hospital birth record" },
                { icon: "🛂", text: "Identity documents, NIF, and NISS of parents and newborn" },
                { icon: "📄", text: "Joint leave-sharing statement (if sharing leave)" },
                { icon: "🏦", text: "Verified IBAN on Social Security Direct" }
            ],
            applyInfo: "Apply online via Social Security Direct under Family > Parental Leave within 6 months of birth.",
            links: [
                { label: "Social Security Direct", url: "https://app.seg-social.pt" },
                { label: "Official Guide — Parental Benefit", url: "https://www.seg-social.pt/subsidio-de-parentalidade" }
            ]
        },
        es: {
            title: "Subsidio de Parentalidad (Maternidad y Paternidad)",
            description: "Compensación económica durante el permiso por nacimiento, adopción o cuidado de hijos recién nacidos (DL 91/2009).",
            category: "🏛️ Seguridad Social — Familia",
            steps: [
                { icon: "1️⃣", text: "Inscriba el nacimiento del bebé en el Registro Civil (Hospital o Conservatória) y obtenga el NIF/NISS." },
                { icon: "2️⃣", text: "Acuerde con el otro progenitor el reparto del permiso parental inicial compartido (120 a 180 días)." },
                { icon: "3️⃣", text: "Acceda a la Seguridad Social Direta en el apartado Familia > Parentalidad." },
                { icon: "4️⃣", text: "Rellene y envíe la solicitud electrónica dentro del plazo de 6 meses tras el parto." }
            ],
            docs: [
                { icon: "👶", text: "Certificado de nacimiento del bebé o justificante hospitalario de nacimiento" },
                { icon: "🛂", text: "Documentos de identidad, NIF y NISS de los progenitores y del recién nacido" },
                { icon: "📄", text: "Declaración conjunta de disfrute del permiso (en caso de permiso compartido)" },
                { icon: "🏦", text: "IBAN verificado en la Seguridad Social Direta" }
            ],
            applyInfo: "Tramítelo por internet a través de la Seguridad Social Direta en Familia > Parentalidad en un plazo de 6 meses.",
            links: [
                { label: "Segurança Social Direta", url: "https://app.seg-social.pt" },
                { label: "Guía Oficial — Parentalidad", url: "https://www.seg-social.pt/subsidio-de-parentalidade" }
            ]
        },
        fr: {
            title: "Indemnités de Congé Parental (Maternité & Paternité)",
            description: "Revenu de remplacement lors de la naissance ou adoption d'un enfant pour la garde parentale (DL 91/2009).",
            category: "🏛️ Sécurité Sociale — Famille",
            steps: [
                { icon: "1️⃣", text: "Déclarez la naissance à l'état civil (hôpital ou mairie) et obtenez le NIF/NISS du nouveau-né." },
                { icon: "2️⃣", text: "Convenez de la répartition du congé parental initial partagé entre conjoints (120 à 180 jours)." },
                { icon: "3️⃣", text: "Connectez-vous à Segurança Social Direta sous Família > Parentalidade." },
                { icon: "4️⃣", text: "Soumettez votre demande en ligne au plus tard dans les 6 mois suivant la naissance." }
            ],
            docs: [
                { icon: "👶", text: "Acte de naissance de l'enfant ou déclaration hospitalière de naissance" },
                { icon: "🛂", text: "Pièces d'identité, NIF et NISS des parents et du nouveau-né" },
                { icon: "📄", text: "Déclaration conjointe de partage du congé parental (en cas de partage)" },
                { icon: "🏦", text: "IBAN vérifié sur Segurança Social Direta" }
            ],
            applyInfo: "Faites la demande sur Segurança Social Direta dans l'onglet Família > Parentalité sous 6 mois.",
            links: [
                { label: "Segurança Social Direta", url: "https://app.seg-social.pt" },
                { label: "Guide Officiel — Parentalité", url: "https://www.seg-social.pt/subsidio-de-parentalidade" }
            ]
        }
    },
    cuidador_informal: {
        pt: {
            title: "Subsídio de Apoio ao Cuidador Informal Principal",
            description: "Apoio financeiro mensal concedido ao cuidador informal principal não remunerado, condicionado a recursos (Lei 100/2019).",
            category: "🏛️ Segurança Social — Cuidado",
            steps: [
                { icon: "1️⃣", text: "Requeira o reconhecimento oficial do Estatuto de Cuidador Informal na Segurança Social." },
                { icon: "2️⃣", text: "Apresente comprovação de dependência médica da pessoa cuidada (grau 1 ou 2 de dependência)." },
                { icon: "3️⃣", text: "Comprove a residência em comunhão de habitação com a pessoa cuidada e ausência de atividade profissional remunerada." },
                { icon: "4️⃣", text: "Submeta o requerimento do subsídio de apoio na SS Direta, sujeito a condição de recursos." }
            ],
            docs: [
                { icon: "📋", text: "Reconhecimento do Estatuto de Cuidador Informal emitido pela SS" },
                { icon: "🩺", text: "Atestado médico da pessoa cuidada comprovando a dependência de terceiros" },
                { icon: "🏠", text: "Atestado de residência comprovando comunhão de habitação" },
                { icon: "📄", text: "Comprovativos de rendimentos e património do agregado familiar" }
            ],
            applyInfo: "O requerimento deve ser submetido na Segurança Social Direta ou presencialmente com agendamento prévio no portal SIGA.",
            links: [
                { label: "Segurança Social Direta", url: "https://app.seg-social.pt" },
                { label: "Guia Oficial — Cuidador Informal", url: "https://www.seg-social.pt/estatuto-do-cuidador-informal" }
            ]
        },
        en: {
            title: "Informal Caregiver Support Allowance",
            description: "Monthly financial allowance for the primary non-remunerated informal caregiver, subject to means test (Law 100/2019).",
            category: "🏛️ Social Security — Care",
            steps: [
                { icon: "1️⃣", text: "Apply for official recognition of Informal Caregiver Status at Social Security." },
                { icon: "2️⃣", text: "Provide medical proof of dependency of the cared-for relative (level 1 or 2 dependency)." },
                { icon: "3️⃣", text: "Prove joint cohabitation and that you do not pursue gainful employment." },
                { icon: "4️⃣", text: "Submit the allowance request on Social Security Direct, subject to means-testing." }
            ],
            docs: [
                { icon: "📋", text: "Certificate of Informal Caregiver Status issued by Social Security" },
                { icon: "🩺", text: "Medical board certificate demonstrating dependence on third-party care" },
                { icon: "🏠", text: "Proof of common cohabitation address" },
                { icon: "📄", text: "Income statements and asset declarations for the household" }
            ],
            applyInfo: "Submit via Social Security Direct or at local Social Security branch with prior SIGA appointment.",
            links: [
                { label: "Social Security Direct", url: "https://app.seg-social.pt" },
                { label: "Official Guide — Caregiver Status", url: "https://www.seg-social.pt/estatuto-do-cuidador-informal" }
            ]
        },
        es: {
            title: "Subsidio de Apoyo al Cuidador Informal Principal",
            description: "Prestación económica mensual para cuidadores informales principales no remunerados, sujeta a baremo de ingresos (Ley 100/2019).",
            category: "🏛️ Seguridad Social — Cuidados",
            steps: [
                { icon: "1️⃣", text: "Solicite el reconocimiento oficial del Estatuto de Cuidador Informal en la Seguridad Social." },
                { icon: "2️⃣", text: "Aporte informe médico acreditativo del grado de dependencia de la persona atendida (grado 1 o 2)." },
                { icon: "3️⃣", text: "Acredite la convivencia en el mismo domicilio y la ausencia de otra actividad laboral remunerada." },
                { icon: "4️⃣", text: "Presente la solicitud del subsidio de apoyo en la SS Direta, sujeta a evaluación de recursos." }
            ],
            docs: [
                { icon: "📋", text: "Resolución de concesión del Estatuto de Cuidador Informal emitida por la SS" },
                { icon: "🩺", text: "Dictamen médico acreditativo de la dependencia de terceras personas" },
                { icon: "🏠", text: "Certificado de empadronamiento que acredite la convivencia en el mismo domicilio" },
                { icon: "📄", text: "Justificantes de ingresos y patrimonio de la unidad económica de convivencia" }
            ],
            applyInfo: "Debe solicitarse en la Seguridad Social Direta o en ventanilla con cita previa a través del portal SIGA.",
            links: [
                { label: "Segurança Social Direta", url: "https://app.seg-social.pt" },
                { label: "Guía Oficial — Cuidador Informal", url: "https://www.seg-social.pt/estatuto-do-cuidador-informal" }
            ]
        },
        fr: {
            title: "Allocation de Soutien à l'Aidant Informel Principal",
            description: "Indemnité financière mensuelle octroyée à l'aidant proche principal non rémunéré sous condition de ressources (Loi 100/2019).",
            category: "🏛️ Sécurité Sociale — Dépendance",
            steps: [
                { icon: "1️⃣", text: "Demandez la reconnaissance officielle du Statut d'Aidant Informel auprès de la Sécurité Sociale." },
                { icon: "2️⃣", text: "Fournissez les pièces médicales attestant du degré de dépendance de la personne aidée (niveau 1 ou 2)." },
                { icon: "3️⃣", text: "Justifiez de la cohabitation sous le même toit et de l'absence d'autre activité professionnelle rémunérée." },
                { icon: "4️⃣", text: "Déposez votre demande d'allocation d'aide sur SS Direta, soumise aux plafonds de ressources." }
            ],
            docs: [
                { icon: "📋", text: "Certificat de reconnaissance du Statut d'Aidant Informel délivré par la SS" },
                { icon: "🩺", text: "Rapport médical certifiant la perte d'autonomie et le besoin d'aide de tierce personne" },
                { icon: "🏠", text: "Attestation de domicile démontrant la communauté d'habitation" },
                { icon: "📄", text: "Justificatifs de revenus et de patrimoine du foyer économique" }
            ],
            applyInfo: "Déposez la demande sur Segurança Social Direta ou au guichet après prise de rendez-vous sur SIGA.",
            links: [
                { label: "Segurança Social Direta", url: "https://app.seg-social.pt" },
                { label: "Guide Officiel — Aidant Informel", url: "https://www.seg-social.pt/estatuto-do-cuidador-informal" }
            ]
        }
    },
    pre_natal: {
        pt: {
            title: "Abono de Família Pré-natal",
            description: "Prestação mensal atribuída à mulher grávida a partir da 13.ª semana de gestação para incentivo à maternidade (DL 176/2003).",
            category: "🏛️ Segurança Social — Família",
            steps: [
                { icon: "1️⃣", text: "Obtenha declaração médica comprovando a 13.ª semana de gravidez e a data prevista do parto." },
                { icon: "2️⃣", text: "Preencha o formulário Mod. RP5045-DGSS na Segurança Social Direta." },
                { icon: "3️⃣", text: "A Segurança Social afere o escalão de rendimentos de referência do agregado familiar." },
                { icon: "4️⃣", text: "Receba o apoio durante os últimos 6 meses de gravidez (até ao parto)." }
            ],
            docs: [
                { icon: "🩺", text: "Declaração médica com a data provável do parto e semana gestacional" },
                { icon: "🛂", text: "Documento de identificação válido, NIF e NISS da requerente" },
                { icon: "📄", text: "Declaração de IRS ou comprovativo dos rendimentos do agregado" },
                { icon: "🏦", text: "IBAN bancário registado na SS Direta" }
            ],
            applyInfo: "Submeta na Segurança Social Direta ou nos balcões de atendimento da Segurança Social a partir da 13.ª semana.",
            links: [
                { label: "Segurança Social Direta", url: "https://app.seg-social.pt" },
                { label: "Guia Oficial — Abono Pré-natal", url: "https://www.seg-social.pt/abono-de-familia-pre-natal" }
            ]
        },
        en: {
            title: "Prenatal Family Allowance",
            description: "Monthly allowance for expectant mothers starting from the 13th gestational week (DL 176/2003).",
            category: "🏛️ Social Security — Family",
            steps: [
                { icon: "1️⃣", text: "Obtain medical statement confirming the 13th week of pregnancy and expected delivery date." },
                { icon: "2️⃣", text: "Fill in Form Mod. RP5045-DGSS on Social Security Direct." },
                { icon: "3️⃣", text: "Social Security evaluates your household income bracket." },
                { icon: "4️⃣", text: "Receive monthly payments over the final 6 months of gestation." }
            ],
            docs: [
                { icon: "🩺", text: "Doctor's certificate with expected delivery date and gestational week" },
                { icon: "🛂", text: "Valid identification document, NIF, and NISS of applicant" },
                { icon: "📄", text: "IRS tax return or household income proofs" },
                { icon: "🏦", text: "Verified IBAN on Social Security Direct" }
            ],
            applyInfo: "Submit via Social Security Direct or in person from the 13th week of pregnancy onward.",
            links: [
                { label: "Social Security Direct", url: "https://app.seg-social.pt" },
                { label: "Official Guide — Prenatal Allowance", url: "https://www.seg-social.pt/abono-de-familia-pre-natal" }
            ]
        },
        es: {
            title: "Asignación Familiar Prenatal",
            description: "Prestación mensual para mujeres embarazadas a partir de la semana 13 de gestación (DL 176/2003).",
            category: "🏛️ Seguridad Social — Familia",
            steps: [
                { icon: "1️⃣", text: "Obtenga certificado médico que acredite las 13 semanas de embarazo y la fecha prevista de parto." },
                { icon: "2️⃣", text: "Cumplimente el formulario oficial Mod. RP5045-DGSS en la Seguridad Social Direta." },
                { icon: "3️⃣", text: "La Seguridad Social calculará el tramo de ingresos correspondiente a su unidad de convivencia." },
                { icon: "4️⃣", text: "Perciba la ayuda económica durante los últimos 6 meses de embarazo (hasta el parto)." }
            ],
            docs: [
                { icon: "🩺", text: "Certificado médico con la semana gestacional y la fecha probable de parto" },
                { icon: "🛂", text: "Documento de identidad en vigor, NIF y NISS de la solicitante" },
                { icon: "📄", text: "Declaración del IRPF (IRS) o justificantes de ingresos de la familia" },
                { icon: "🏦", text: "IBAN registrado en la Seguridad Social Direta" }
            ],
            applyInfo: "Presente la solicitud en la Seguridad Social Direta o en ventanilla a partir de la 13.ª semana de embarazo.",
            links: [
                { label: "Segurança Social Direta", url: "https://app.seg-social.pt" },
                { label: "Guía Oficial — Asignación Prenatal", url: "https://www.seg-social.pt/abono-de-familia-pre-natal" }
            ]
        },
        fr: {
            title: "Allocation Familiale Prénatale",
            description: "Prestation mensuelle versée à la femme enceinte à partir de la 13e semaine de grossesse (DL 176/2003).",
            category: "🏛️ Sécurité Sociale — Famille",
            steps: [
                { icon: "1️⃣", text: "Obtenez un certificat médical attestant de la 13e semaine de grossesse et de la date prévue du terme." },
                { icon: "2️⃣", text: "Remplissez le formulaire officiel Mod. RP5045-DGSS sur Segurança Social Direta." },
                { icon: "3️⃣", text: "La Sécurité Sociale détermine le niveau de revenus de référence de votre foyer." },
                { icon: "4️⃣", text: "Percevez l'allocation mensuelle durant les 6 derniers mois de la grossesse." }
            ],
            docs: [
                { icon: "🩺", text: "Certificat médical officiel avec semaine de grossesse et date probable d'accouchement" },
                { icon: "🛂", text: "Pièce d'identité en cours de validité, NIF et NISS de la future mère" },
                { icon: "📄", text: "Avis d'imposition IRS ou justificatifs des revenus du ménage" },
                { icon: "🏦", text: "IBAN enregistré sur Segurança Social Direta" }
            ],
            applyInfo: "Déposez votre demande sur Segurança Social Direta ou au guichet dès la 13e semaine de grossesse.",
            links: [
                { label: "Segurança Social Direta", url: "https://app.seg-social.pt" },
                { label: "Guide Officiel — Allocation Prénatale", url: "https://www.seg-social.pt/abono-de-familia-pre-natal" }
            ]
        }
    },
    rsi: {
        pt: {
            title: "Rendimento Social de Inserção (RSI)",
            description: "Prestação não contributiva de combate à pobreza extrema, associada a contrato de inserção socioprofissional (Lei 13/2003).",
            category: "🏛️ Segurança Social — Inclusão",
            steps: [
                { icon: "1️⃣", text: "Verifique se o rendimento do agregado é inferior ao valor de referência legal do RSI." },
                { icon: "2️⃣", text: "Preencha o formulário oficial Mod. RSI1-DGSS com a composição e património do agregado." },
                { icon: "3️⃣", text: "Compareça à entrevista com o Núcleo Local de Inserção (NLI) e assine o Contrato de Inserção." },
                { icon: "4️⃣", text: "Cumpra os deveres de procura ativa de trabalho e frequência de ações de capacitação." }
            ],
            docs: [
                { icon: "🛂", text: "Título de Residência válido de todos os elementos do agregado (ou estatuto regular)" },
                { icon: "🔢", text: "NIF e NISS de todos os elementos da família" },
                { icon: "🏦", text: "Extratos bancários de todas as contas e comprovativo de património mobiliário" },
                { icon: "📋", text: "Formulário oficial Mod. RSI1-DGSS preenchido e assinado" }
            ],
            applyInfo: "O pedido deve ser entregue nos balcões da Segurança Social ou Lojas do Cidadão, com marcação prévia no SIGA.",
            links: [
                { label: "Segurança Social Direta", url: "https://app.seg-social.pt" },
                { label: "Guia Oficial — RSI", url: "https://www.seg-social.pt/rendimento-social-de-insercao" }
            ]
        },
        en: {
            title: "Social Insertion Income (RSI)",
            description: "Non-contributory minimum subsistence benefit linked to an active social integration contract (Law 13/2003).",
            category: "🏛️ Social Security — Inclusion",
            steps: [
                { icon: "1️⃣", text: "Verify that your household total income is below the statutory RSI threshold." },
                { icon: "2️⃣", text: "Complete official application Form Mod. RSI1-DGSS detailing household assets." },
                { icon: "3️⃣", text: "Attend interview with the Local Insertion Team (NLI) and sign Integration Agreement." },
                { icon: "4️⃣", text: "Actively participate in job seeking, education, or designated community programs." }
            ],
            docs: [
                { icon: "🛂", text: "Valid legal residence permits for all household members" },
                { icon: "🔢", text: "NIF and NISS for all family members" },
                { icon: "🏦", text: "Bank statements for all accounts and proof of movable assets" },
                { icon: "📋", text: "Completed and signed Form Mod. RSI1-DGSS" }
            ],
            applyInfo: "Submit at a Social Security branch or Citizen Bureau with a prior appointment via SIGA.",
            links: [
                { label: "Social Security Direct", url: "https://app.seg-social.pt" },
                { label: "Official Guide — RSI", url: "https://www.seg-social.pt/rendimento-social-de-insercao" }
            ]
        },
        es: {
            title: "Renta Social de Inserción (RSI)",
            description: "Prestación no contributiva de garantía de subsistencia vinculada a un programa de integración sociolaboral (Ley 13/2003).",
            category: "🏛️ Seguridad Social — Inclusión",
            steps: [
                { icon: "1️⃣", text: "Compruebe que los ingresos totales de la unidad familiar son inferiores al umbral legal de RSI." },
                { icon: "2️⃣", text: "Rellene el formulario oficial Mod. RSI1-DGSS detallando la composición y patrimonio familiar." },
                { icon: "3️⃣", text: "Acuda a la entrevista con el Núcleo Local de Inserción (NLI) y firme el Contrato de Inserción." },
                { icon: "4️⃣", text: "Participe activamente en acciones de búsqueda de empleo o programas formativos indicados." }
            ],
            docs: [
                { icon: "🛂", text: "Tarjeta de Residencia legal válida de todos los integrantes de la familia" },
                { icon: "🔢", text: "NIF y NISS de todos los componentes de la unidad de convivencia" },
                { icon: "🏦", text: "Extractos de cuentas bancarias y acreditación de patrimonio mobiliario" },
                { icon: "📋", text: "Formulario oficial Mod. RSI1-DGSS debidamente firmado" }
            ],
            applyInfo: "Presente la solicitud en una oficina de la Seguridad Social o Loja do Cidadão con cita previa en SIGA.",
            links: [
                { label: "Segurança Social Direta", url: "https://app.seg-social.pt" },
                { label: "Guía Oficial — RSI", url: "https://www.seg-social.pt/rendimento-social-de-insercao" }
            ]
        },
        fr: {
            title: "Revenu Social d'Insertion (RSI)",
            description: "Prestation non contributive de lutte contre la pauvreté extrême liée à un contrat d'insertion (Loi 13/2003).",
            category: "🏛️ Sécurité Sociale — Insertion",
            steps: [
                { icon: "1️⃣", text: "Vérifiez que le montant des ressources du ménage se situe sous le seuil légal d'attribution du RSI." },
                { icon: "2️⃣", text: "Complétez le formulaire officiel Mod. RSI1-DGSS détaillant composition et patrimoine." },
                { icon: "3️⃣", text: "Présentez-vous à l'entretien avec le Référent Local d'Insertion (NLI) et signez le Contrat d'Insertion." },
                { icon: "4️⃣", text: "Respectez les obligations de recherche d'emploi et de formation prévues au contrat." }
            ],
            docs: [
                { icon: "🛂", text: "Titre de séjour en règle pour tous les membres du foyer fiscal" },
                { icon: "🔢", text: "NIF et NISS de chaque membre composant la famille" },
                { icon: "🏦", text: "Relevés de l'ensemble des comptes bancaires et déclarations d'épargne" },
                { icon: "📋", text: "Formulaire officiel Mod. RSI1-DGSS complété et signé" }
            ],
            applyInfo: "Déposez votre dossier dans un centre de Sécurité Sociale ou Loja do Cidadão avec rendez-vous SIGA.",
            links: [
                { label: "Segurança Social Direta", url: "https://app.seg-social.pt" },
                { label: "Guide Officiel — RSI", url: "https://www.seg-social.pt/rendimento-social-de-insercao" }
            ]
        }
    },
    pensao_velhice: {
        pt: {
            title: "Pensão Social de Velhice",
            description: "Pensão mensal do regime não contributivo atribuída a cidadãos a partir da idade de reforma sem carreira contributiva suficiente (DL 464/1980).",
            category: "🏛️ Segurança Social — Terceira Idade",
            steps: [
                { icon: "1️⃣", text: "Tenha idade igual ou superior à idade legal de acesso à pensão de velhice (66 anos e 7 meses)." },
                { icon: "2️⃣", text: "Comprove rendimentos mensais próprios inferiores a 40% do IAS (ou 60% se casal)." },
                { icon: "3️⃣", text: "Preencha o formulário Mod. RP5002-DGSS (Requerimento de Pensão Social de Velhice)." },
                { icon: "4️⃣", text: "Submeta o pedido num balcão da Segurança Social ou através da Segurança Social Direta." }
            ],
            docs: [
                { icon: "🛂", text: "Cartão de Cidadão ou Título de Residência permanente / de longa duração" },
                { icon: "🔢", text: "NIF e NISS do requerente e cônjuge" },
                { icon: "📄", text: "Declaração de IRS e comprovativos de património financeiro" },
                { icon: "📋", text: "Formulário oficial Mod. RP5002-DGSS" }
            ],
            applyInfo: "Submeta na Segurança Social Direta ou num balcão da Segurança Social com agendamento prévio.",
            links: [
                { label: "Segurança Social Direta", url: "https://app.seg-social.pt" },
                { label: "Guia Oficial — Pensão Social de Velhice", url: "https://www.seg-social.pt/pensao-social-de-velhice" }
            ]
        },
        en: {
            title: "Social Old-Age Pension",
            description: "Non-contributory monthly pension for seniors reaching retirement age without sufficient contributory history (DL 464/1980).",
            category: "🏛️ Social Security — Seniors",
            steps: [
                { icon: "1️⃣", text: "Reach statutory retirement age (66 years and 7 months) without contributory eligibility." },
                { icon: "2️⃣", text: "Prove individual monthly income under 40% of IAS (or 60% if married)." },
                { icon: "3️⃣", text: "Complete application Form Mod. RP5002-DGSS (Social Old-Age Pension)." },
                { icon: "4️⃣", text: "Submit on Social Security Direct or at a physical Social Security branch." }
            ],
            docs: [
                { icon: "🛂", text: "Citizen Card or valid long-term legal residence permit" },
                { icon: "🔢", text: "NIF and NISS of applicant and spouse" },
                { icon: "📄", text: "IRS tax return and bank asset statements" },
                { icon: "📋", text: "Completed Form Mod. RP5002-DGSS" }
            ],
            applyInfo: "Submit online on Social Security Direct or in person with prior SIGA booking.",
            links: [
                { label: "Social Security Direct", url: "https://app.seg-social.pt" },
                { label: "Official Guide — Social Old-Age Pension", url: "https://www.seg-social.pt/pensao-social-de-velhice" }
            ]
        },
        es: {
            title: "Pensión Social de Jubilación (Vejez)",
            description: "Pensión mensual no contributiva para adultos mayores que alcanzan la edad de jubilación sin cotizaciones suficientes (DL 464/1980).",
            category: "🏛️ Seguridad Social — Mayores",
            steps: [
                { icon: "1️⃣", text: "Tener la edad legal ordinaria de acceso a la pensión de jubilación (66 años y 7 meses)." },
                { icon: "2️⃣", text: "Acreditar ingresos mensuales propios inferiores al 40% del IAS (o 60% en caso de matrimonio)." },
                { icon: "3️⃣", text: "Cumplimentar el formulario oficial Mod. RP5002-DGSS (Pensión Social de Vejez)." },
                { icon: "4️⃣", text: "Tramitar la solicitud en la Seguridad Social Direta o en oficinas de la Seguridad Social." }
            ],
            docs: [
                { icon: "🛂", text: "Tarjeta de Residencia legal de larga duración o Cartão de Cidadão" },
                { icon: "🔢", text: "NIF y NISS del solicitante y de su cónyuge" },
                { icon: "📄", text: "Declaración del IRS y extractos de patrimonio financiero" },
                { icon: "📋", text: "Formulario oficial Mod. RP5002-DGSS" }
            ],
            applyInfo: "Presente la solicitud en Seguridad Social Direta o en ventanilla con cita previa concertada en SIGA.",
            links: [
                { label: "Segurança Social Direta", url: "https://app.seg-social.pt" },
                { label: "Guía Oficial — Pensión Social de Vejez", url: "https://www.seg-social.pt/pensao-social-de-velhice" }
            ]
        },
        fr: {
            title: "Pension Sociale de Retraite (Vieillesse)",
            description: "Pension mensuelle du régime non contributif versée aux seniors n'ayant pas suffisamment cotisé (DL 464/1980).",
            category: "🏛️ Sécurité Sociale — Retraite",
            steps: [
                { icon: "1️⃣", text: "Atteindre l'âge légal ouvrant droit à la pension de vieillesse (66 ans et 7 mois)." },
                { icon: "2️⃣", text: "Justifier de revenus personnels mensuels inférieurs à 40% de l'IAS (ou 60% pour un couple)." },
                { icon: "3️⃣", text: "Remplir le formulaire officiel Mod. RP5002-DGSS (Demande de Pension Sociale de Vieillesse)." },
                { icon: "4️⃣", text: "Déposer la demande sur Segurança Social Direta ou auprès d'une agence de la SS." }
            ],
            docs: [
                { icon: "🛂", text: "Titre de séjour de longue durée ou Carte d'Identité valide" },
                { icon: "🔢", text: "NIF et NISS du demandeur et du conjoint" },
                { icon: "📄", text: "Avis d'imposition IRS et relevés de l'épargne patrimoniale" },
                { icon: "📋", text: "Formulaire officiel Mod. RP5002-DGSS" }
            ],
            applyInfo: "Déposez votre dossier sur Segurança Social Direta ou en personne avec rendez-vous préalable via SIGA.",
            links: [
                { label: "Segurança Social Direta", url: "https://app.seg-social.pt" },
                { label: "Guide Officiel — Pension de Vieillesse", url: "https://www.seg-social.pt/pensao-social-de-velhice" }
            ]
        }
    },
    pensao_invalidez: {
        pt: {
            title: "Pensão de Invalidez (Regime Não Contributivo / Geral)",
            description: "Prestação mensal para cidadãos com incapacidade permanente para o trabalho (DL 464/80 no regime não contributivo e DL 187/2007 no regime geral).",
            category: "🏛️ Segurança Social — Incapacidade",
            steps: [
                { icon: "1️⃣", text: "Seja avaliado pelo Sistema de Verificação de Incapacidades (SVI) da Segurança Social." },
                { icon: "2️⃣", text: "Obtenha a certificação médica oficial de incapacidade permanente absoluta ou relativa." },
                { icon: "3️⃣", text: "Preencha o formulário oficial Mod. RP5001-DGSS (Requerimento de Pensão de Invalidez)." },
                { icon: "4️⃣", text: "Submeta o requerimento na SS Direta ou no balcão da Segurança Social." }
            ],
            docs: [
                { icon: "🩺", text: "Relatórios médicos circunstanciados, exames e relatório do médico assistente" },
                { icon: "🛂", text: "Documento de identificação válido, NIF e NISS" },
                { icon: "📄", text: "Declaração de rendimentos e composição do agregado familiar" },
                { icon: "📋", text: "Formulário Mod. RP5001-DGSS" }
            ],
            applyInfo: "Apresente no balcão da Segurança Social ou através da Segurança Social Direta para marcação de junta médica.",
            links: [
                { label: "Segurança Social Direta", url: "https://app.seg-social.pt" },
                { label: "Guia Oficial — Pensão de Invalidez", url: "https://www.seg-social.pt/pensao-de-invalidez" }
            ]
        },
        en: {
            title: "Disability Pension (Non-Contributory & General Schemes)",
            description: "Monthly income support for permanent incapacity to work (DL 464/80 non-contributory & DL 187/2007 general scheme).",
            category: "🏛️ Social Security — Disability",
            steps: [
                { icon: "1️⃣", text: "Undergo clinical examination by the Social Security Disability Assessment System (SVI)." },
                { icon: "2️⃣", text: "Receive formal medical certification of permanent incapacity to work." },
                { icon: "3️⃣", text: "Complete application Form Mod. RP5001-DGSS (Disability Pension Application)." },
                { icon: "4️⃣", text: "Submit online via Social Security Direct or at a physical branch." }
            ],
            docs: [
                { icon: "🩺", text: "Comprehensive clinical reports, test results, and treating physician statement" },
                { icon: "🛂", text: "Valid identification document, NIF, and NISS" },
                { icon: "📄", text: "Household income declaration and family composition" },
                { icon: "📋", text: "Completed Form Mod. RP5001-DGSS" }
            ],
            applyInfo: "Submit at a Social Security branch or online for scheduling a medical verification board.",
            links: [
                { label: "Social Security Direct", url: "https://app.seg-social.pt" },
                { label: "Official Guide — Disability Pension", url: "https://www.seg-social.pt/pensao-de-invalidez" }
            ]
        },
        es: {
            title: "Pensión de Incapacidad Permanente (Regímenes No Contributivo / General)",
            description: "Prestación mensual para ciudadanos con incapacidad laboral permanente (DL 464/80 en régimen no contributivo y DL 187/2007 en régimen general).",
            category: "🏛️ Seguridad Social — Incapacidad",
            steps: [
                { icon: "1️⃣", text: "Someterse a la valoración del Sistema de Verificación de Incapacidades (SVI) de la Seguridad Social." },
                { icon: "2️⃣", text: "Obtener la resolución médica oficial de incapacidad permanente absoluta o relativa." },
                { icon: "3️⃣", text: "Cumplimentar el formulario oficial Mod. RP5001-DGSS (Solicitud de Pensión de Invalidez)." },
                { icon: "4️⃣", text: "Entregar la solicitud en la SS Direta o en un mostrador de la Seguridad Social." }
            ],
            docs: [
                { icon: "🩺", text: "Informes clínicos detallados, pruebas diagnósticas e informe del médico de cabecera" },
                { icon: "🛂", text: "Documento de identidad en vigor, NIF y NISS" },
                { icon: "📄", text: "Declaración de ingresos y composición de la unidad familiar" },
                { icon: "📋", text: "Formulario Mod. RP5001-DGSS cumplimentado" }
            ],
            applyInfo: "Preséntelo en una oficina de la Seguridad Social o por internet para la convocatoria del tribunal médico.",
            links: [
                { label: "Segurança Social Direta", url: "https://app.seg-social.pt" },
                { label: "Guía Oficial — Pensión de Invalidez", url: "https://www.seg-social.pt/pensao-de-invalidez" }
            ]
        },
        fr: {
            title: "Pension d'Invalidité (Régime Non Contributif / Général)",
            description: "Revenu mensuel de remplacement pour les personnes en situation d'incapacité permanente de travail (DL 464/80 régime non contributif et DL 187/2007 régime général).",
            category: "🏛️ Sécurité Sociale — Invalidité",
            steps: [
                { icon: "1️⃣", text: "Passer une visite médicale auprès de la Commission Médicale d'Évaluation de l'Incapacité (SVI)." },
                { icon: "2️⃣", text: "Obtenir la notification médicale officielle constatant l'incapacité permanente de travail." },
                { icon: "3️⃣", text: "Remplir le formulaire officiel Mod. RP5001-DGSS (Demande de Pension d'Invalidité)." },
                { icon: "4️⃣", text: "Déposer votre dossier sur SS Direta ou au guichet de votre caisse." }
            ],
            docs: [
                { icon: "🩺", text: "Dossier médical circonstancié, examens cliniques et rapport du médecin traitant" },
                { icon: "🛂", text: "Pièce d'identité en cours de validité, NIF et NISS" },
                { icon: "📄", text: "Déclaration de revenus et justificatif de composition de famille" },
                { icon: "📋", text: "Formulaire officiel Mod. RP5001-DGSS" }
            ],
            applyInfo: "À déposer au guichet de la Sécurité Sociale ou en ligne pour la programmation de la commission médicale.",
            links: [
                { label: "Segurança Social Direta", url: "https://app.seg-social.pt" },
                { label: "Guide Officiel — Pension d'Invalidité", url: "https://www.seg-social.pt/pensao-de-invalidez" }
            ]
        }
    },
    csi: {
        pt: {
            title: "Complemento Solidário para Idosos (CSI)",
            description: "Apoio em dinheiro mensal pago a pensionistas idosos de baixos rendimentos para combate à pobreza na velhice (DL 232/2005 / Lei 90/2009).",
            category: "🏛️ Segurança Social — Terceira Idade",
            steps: [
                { icon: "1️⃣", text: "Tenha idade igual ou superior à idade normal de acesso à pensão de velhice." },
                { icon: "2️⃣", text: "Comprove residência legal em Portugal há pelo menos 6 anos consecutivos." },
                { icon: "3️⃣", text: "Verifique se os seus rendimentos anuais são inferiores ao limiar de referência do CSI." },
                { icon: "4️⃣", text: "Preencha o formulário Mod. CSI1-DGSS com a declaração de rendimentos dos filhos." }
            ],
            docs: [
                { icon: "🛂", text: "Documento de identificação válido, NIF e NISS do requerente e cônjuge" },
                { icon: "🏠", text: "Comprovativo de residência legal há mais de 6 anos em território português" },
                { icon: "📄", text: "Declaração de rendimentos do idoso e dos filhos (para cálculo da solidariedade familiar)" },
                { icon: "📋", text: "Formulário Mod. CSI1-DGSS devidamente instruído" }
            ],
            applyInfo: "Submeta num balcão de atendimento da Segurança Social com marcação prévia no SIGA.",
            links: [
                { label: "Segurança Social Direta", url: "https://app.seg-social.pt" },
                { label: "Guia Oficial — CSI", url: "https://www.seg-social.pt/complemento-solidario-para-idosos" }
            ]
        },
        en: {
            title: "Solidarity Supplement for the Elderly (CSI)",
            description: "Monthly income supplement paid to low-income senior citizens reaching pension age (DL 232/2005 / Law 90/2009).",
            category: "🏛️ Social Security — Seniors",
            steps: [
                { icon: "1️⃣", text: "Reach statutory retirement age and reside legally in Portugal for at least 6 years." },
                { icon: "2️⃣", text: "Ensure total annual income falls below the statutory CSI poverty threshold." },
                { icon: "3️⃣", text: "Fill in application Form Mod. CSI1-DGSS including adult children income details." },
                { icon: "4️⃣", text: "Submit at a Social Security counter with prior SIGA booking." }
            ],
            docs: [
                { icon: "🛂", text: "Valid identification document, NIF, and NISS of applicant and spouse" },
                { icon: "🏠", text: "Proof of at least 6 consecutive years of legal residence in Portugal" },
                { icon: "📄", text: "Tax returns and income proofs of applicant and children" },
                { icon: "📋", text: "Completed Form Mod. CSI1-DGSS" }
            ],
            applyInfo: "Submit in person at a Social Security branch with a booked appointment via SIGA.",
            links: [
                { label: "Social Security Direct", url: "https://app.seg-social.pt" },
                { label: "Official Guide — CSI", url: "https://www.seg-social.pt/complemento-solidario-para-idosos" }
            ]
        },
        es: {
            title: "Complemento Solidario para Mayores (CSI)",
            description: "Ayuda económica mensual para pensionistas de edad avanzada con bajos ingresos en riesgo de pobreza (DL 232/2005 / Ley 90/2009).",
            category: "🏛️ Seguridad Social — Mayores",
            steps: [
                { icon: "1️⃣", text: "Haber cumplido la edad ordinaria legal de acceso a la jubilación." },
                { icon: "2️⃣", text: "Acreditar residencia legal continuada en Portugal de al menos 6 años." },
                { icon: "3️⃣", text: "Comprobar que los ingresos anuales se encuentran por debajo del umbral fijado para el CSI." },
                { icon: "4️⃣", text: "Rellenar el formulario Mod. CSI1-DGSS incluyendo ingresos de los descendientes directos." }
            ],
            docs: [
                { icon: "🛂", text: "Documento de identidad válido, NIF y NISS del solicitante y cónyuge" },
                { icon: "🏠", text: "Certificado de residencia legal continuada en Portugal durante los últimos 6 años" },
                { icon: "📄", text: "Declaración fiscal de ingresos del solicitante y de sus hijos (cálculo de solidaridad)" },
                { icon: "📋", text: "Formulario Mod. CSI1-DGSS correctamente cumplimentado" }
            ],
            applyInfo: "Debe presentarse en un centro de atención de la Seguridad Social con cita previa reservada en SIGA.",
            links: [
                { label: "Segurança Social Direta", url: "https://app.seg-social.pt" },
                { label: "Guía Oficial — CSI", url: "https://www.seg-social.pt/complemento-solidario-para-idosos" }
            ]
        },
        fr: {
            title: "Complément Solidaire pour Personnes Âgées (CSI)",
            description: "Allocation mensuelle différentielle versée aux retraités modestes pour lutter contre la pauvreté du grand âge (DL 232/2005 / Loi 90/2009).",
            category: "🏛️ Sécurité Sociale — Seniors",
            steps: [
                { icon: "1️⃣", text: "Avoir atteint l'âge légal normal d'ouverture des droits à la retraite." },
                { icon: "2️⃣", text: "Justifier d'une résidence régulière et ininterrompue d'au moins 6 ans sur le sol portugais." },
                { icon: "3️⃣", text: "Justifier de revenus annuels globaux inférieurs au plafond légal de référence du CSI." },
                { icon: "4️⃣", text: "Compléter le formulaire Mod. CSI1-DGSS renseignant les revenus des enfants adultes." }
            ],
            docs: [
                { icon: "🛂", text: "Pièce d'identité en cours de validité, NIF et NISS du requérant et du conjoint" },
                { icon: "🏠", text: "Justificatif de séjour régulier en continu depuis au moins 6 ans au Portugal" },
                { icon: "📄", text: "Avis fiscaux du retraité et de ses enfants (au titre de la solidarité familiale)" },
                { icon: "📋", text: "Formulaire officiel Mod. CSI1-DGSS complété" }
            ],
            applyInfo: "Dossier à déposer obligatoirement dans une agence de la Sécurité Sociale avec rendez-vous SIGA.",
            links: [
                { label: "Segurança Social Direta", url: "https://app.seg-social.pt" },
                { label: "Guide Officiel — CSI", url: "https://www.seg-social.pt/complemento-solidario-para-idosos" }
            ]
        }
    },
    morte: {
        pt: {
            title: "Subsídio por Morte",
            description: "Prestação pecuniária única paga aos familiares para facilitar a reorganização da vida familiar após o falecimento (DL 322/90 de 18 de outubro, alterado).",
            category: "🏛️ Segurança Social — Família e Luto",
            steps: [
                { icon: "1️⃣", text: "Requeira a prestação no prazo de até 180 dias a contar da data do falecimento." },
                { icon: "2️⃣", text: "Preencha o formulário oficial Mod. RP5075-DGSS (Requerimento de Prestações por Morte)." },
                { icon: "3️⃣", text: "Junte a certidão de óbito e a prova de parentesco (casamento, união de facto ou filiação)." },
                { icon: "4️⃣", text: "Submeta na Segurança Social Direta ou presencialmente com agendamento." }
            ],
            docs: [
                { icon: "📄", text: "Certidão de óbito do beneficiário falecido" },
                { icon: "👨‍👩‍👦", text: "Certidão de casamento, nascimento dos filhos ou escritura de união de facto" },
                { icon: "🔢", text: "NIF e NISS do falecido e de todos os requerentes" },
                { icon: "🏦", text: "IBAN dos beneficiários com direito ao subsídio" }
            ],
            applyInfo: "Submeta através do portal Segurança Social Direta ou num balcão com marcação prévia.",
            links: [
                { label: "Segurança Social Direta", url: "https://app.seg-social.pt" },
                { label: "Guia Oficial — Subsídio por Morte", url: "https://www.seg-social.pt/subsidio-por-morte" }
            ]
        },
        en: {
            title: "Death Grant (Subsídio por Morte)",
            description: "Lump-sum cash benefit paid to surviving family members to reorganize family life (DL 322/90 of Oct 18, as amended).",
            category: "🏛️ Social Security — Bereavement",
            steps: [
                { icon: "1️⃣", text: "Submit application within 180 days from the date of death." },
                { icon: "2️⃣", text: "Complete official Form Mod. RP5075-DGSS (Survivor Benefits Application)." },
                { icon: "3️⃣", text: "Attach death certificate and formal proof of family relationship." },
                { icon: "4️⃣", text: "File via Social Security Direct or at a local Social Security office." }
            ],
            docs: [
                { icon: "📄", text: "Official death certificate of the deceased insured worker" },
                { icon: "👨‍👩‍👦", text: "Marriage certificate, children birth certificates, or civil partnership proof" },
                { icon: "🔢", text: "NIF and NISS of the deceased and all applicants" },
                { icon: "🏦", text: "Verified IBAN for benefit payment" }
            ],
            applyInfo: "Submit online through Social Security Direct or in person with prior SIGA appointment.",
            links: [
                { label: "Social Security Direct", url: "https://app.seg-social.pt" },
                { label: "Official Guide — Death Grant", url: "https://www.seg-social.pt/subsidio-por-morte" }
            ]
        },
        es: {
            title: "Subsidio por Defunción (Subsídio por Morte)",
            description: "Prestación única abonada a los familiares para facilitar la reorganización familiar tras el fallecimiento (DL 322/90 de 18 de octubre, modificado).",
            category: "🏛️ Seguridad Social — Duelo y Familia",
            steps: [
                { icon: "1️⃣", text: "Solicite la prestación en un plazo máximo de 180 días naturales desde el fallecimiento." },
                { icon: "2️⃣", text: "Cumplimente el formulario oficial Mod. RP5075-DGSS (Prestaciones por Muerte)." },
                { icon: "3️⃣", text: "Aporte el certificado literal de defunción y la acreditación de parentesco (matrimonio o filiación)." },
                { icon: "4️⃣", text: "Tramite el expediente en Seguridad Social Direta o presencialmente con cita previa." }
            ],
            docs: [
                { icon: "📄", text: "Certificado literal de defunción del asegurado fallecido" },
                { icon: "👨‍👩‍👦", text: "Libro de familia, certificado de matrimonio, nacimiento de hijos o pareja de hecho" },
                { icon: "🔢", text: "NIF y NISS del causante fallecido y de los solicitantes" },
                { icon: "🏦", text: "IBAN bancario verificado de los herederos con derecho a la prestación" }
            ],
            applyInfo: "Presente la solicitud en la Seguridad Social Direta o en ventanilla con cita previa en el portal SIGA.",
            links: [
                { label: "Segurança Social Direta", url: "https://app.seg-social.pt" },
                { label: "Guía Oficial — Subsidio por Muerte", url: "https://www.seg-social.pt/subsidio-por-morte" }
            ]
        },
        fr: {
            title: "Capital Décès (Subsídio por Morte)",
            description: "Prestation financière forfaitaire unique versée aux survivants pour faciliter la réorganisation familiale (DL 322/90 du 18 octobre, modifié).",
            category: "🏛️ Sécurité Sociale — Décès et Deuil",
            steps: [
                { icon: "1️⃣", text: "Déposez votre demande dans un délai impératif de 180 jours à compter de la date du décès." },
                { icon: "2️⃣", text: "Complétez le formulaire officiel Mod. RP5075-DGSS (Prestations de Décès et Survivants)." },
                { icon: "3️⃣", text: "Joignez l'acte de décès officiel et les preuves de filiation ou de mariage/pacs." },
                { icon: "4️⃣", text: "Soumettez le dossier en ligne sur Segurança Social Direta ou en agence avec rendez-vous." }
            ],
            docs: [
                { icon: "📄", text: "Acte de décès officiel du cotisant / assuré décédé" },
                { icon: "👨‍👩‍👦", text: "Acte de mariage, livret de famille ou acte d'union libre officiel" },
                { icon: "🔢", text: "NIF et NISS du défunt et de chacun des ayants droit demandeurs" },
                { icon: "🏦", text: "Relevé bancaire (IBAN) des bénéficiaires ayants droit" }
            ],
            applyInfo: "Déposez votre demande sur le portail Segurança Social Direta ou au guichet après réservation sur SIGA.",
            links: [
                { label: "Segurança Social Direta", url: "https://app.seg-social.pt" },
                { label: "Guide Officiel — Capital Décès", url: "https://www.seg-social.pt/subsidio-por-morte" }
            ]
        }
    },
    funeral: {
        pt: {
            title: "Subsídio de Funeral (Reembolso de Despesas)",
            description: "Prestação única de reembolso concedida a quem comprove ter suportado as despesas do funeral (DL 322/90, regime de proteção na morte e DL 167/2007).",
            category: "🏛️ Segurança Social — Despesas Funerárias",
            steps: [
                { icon: "1️⃣", text: "Obtenha a fatura e recibo originais emitidos pela agência funerária em seu nome." },
                { icon: "2️⃣", text: "Preencha o formulário Mod. RP5076-DGSS (Requerimento de Subsídio de Funeral)." },
                { icon: "3️⃣", text: "Submeta o pedido num prazo máximo de até 6 meses após o falecimento." },
                { icon: "4️⃣", text: "O reembolso é efetuado por transferência bancária para o titular da despesa." }
            ],
            docs: [
                { icon: "🧾", text: "Fatura e recibo originais das despesas de funeral em nome do requerente" },
                { icon: "📄", text: "Certidão de óbito da pessoa falecida" },
                { icon: "🛂", text: "Documento de identificação, NIF e IBAN do pagador das despesas" },
                { icon: "📋", text: "Formulário oficial Mod. RP5076-DGSS preenchido" }
            ],
            applyInfo: "Pode ser requerido por qualquer pessoa (familiar ou terceiro) que comprove ter pago o funeral. Submissão na SS Direta ou balcão.",
            links: [
                { label: "Segurança Social Direta", url: "https://app.seg-social.pt" },
                { label: "Guia Oficial — Subsídio de Funeral", url: "https://www.seg-social.pt/subsidio-de-funeral" }
            ]
        },
        en: {
            title: "Funeral Reimbursement Grant",
            description: "One-off reimbursement grant paid to whoever proved payment of funeral costs (DL 322/90 death protection framework & DL 167/2007).",
            category: "🏛️ Social Security — Funeral Costs",
            steps: [
                { icon: "1️⃣", text: "Obtain the original invoice and payment receipt issued by the funeral agency in your name." },
                { icon: "2️⃣", text: "Complete application Form Mod. RP5076-DGSS (Funeral Grant Application)." },
                { icon: "3️⃣", text: "Submit within 6 months following the date of death." },
                { icon: "4️⃣", text: "Reimbursement is directly deposited into payer's verified bank account." }
            ],
            docs: [
                { icon: "🧾", text: "Original itemized funeral invoice and receipt issued in applicant's name" },
                { icon: "📄", text: "Death certificate of the deceased person" },
                { icon: "🛂", text: "Identification document, NIF, and IBAN of the payer" },
                { icon: "📋", text: "Completed Form Mod. RP5076-DGSS" }
            ],
            applyInfo: "Can be requested by any individual (family or non-family) who paid funeral costs. Apply via SS Direct or branch.",
            links: [
                { label: "Social Security Direct", url: "https://app.seg-social.pt" },
                { label: "Official Guide — Funeral Grant", url: "https://www.seg-social.pt/subsidio-de-funeral" }
            ]
        },
        es: {
            title: "Subsidio de Sepelio / Funeral (Reembolso de Gastos)",
            description: "Prestación única de reembolso a quien acredite documentalmente haber sufragado los gastos del funeral (DL 322/90 marco general y DL 167/2007).",
            category: "🏛️ Seguridad Social — Gastos Funerarios",
            steps: [
                { icon: "1️⃣", text: "Consiga la factura y recibo originales emitidos por la funeraria a su nombre." },
                { icon: "2️⃣", text: "Cumplimente el formulario oficial Mod. RP5076-DGSS (Subsidio de Sepelio)." },
                { icon: "3️⃣", text: "Presente la solicitud en un plazo máximo improrrogable de 6 meses tras el deceso." },
                { icon: "4️⃣", text: "El abono se transfiere directamente a la cuenta del pagador que figura en la factura." }
            ],
            docs: [
                { icon: "🧾", text: "Factura y recibo originales desglosados emitidos a nombre del solicitante" },
                { icon: "📄", text: "Certificado de defunción de la persona fallecida" },
                { icon: "🛂", text: "Documento de identidad, NIF e IBAN de quien pagó el sepelio" },
                { icon: "📋", text: "Formulario oficial Mod. RP5076-DGSS cumplimentado" }
            ],
            applyInfo: "Puede ser solicitado por cualquier persona (familiar o tercero) que demuestre haber pagado el funeral. En SS Direta o ventanilla.",
            links: [
                { label: "Segurança Social Direta", url: "https://app.seg-social.pt" },
                { label: "Guía Oficial — Subsidio de Funeral", url: "https://www.seg-social.pt/subsidio-de-funeral" }
            ]
        },
        fr: {
            title: "Allocation de Frais Funéraires / Obsèques (Remboursement)",
            description: "Prestation unique de remboursement accordée à toute personne prouvant avoir réglé les frais funéraires (DL 322/90 cadre général et DL 167/2007).",
            category: "🏛️ Sécurité Sociale — Obsèques",
            steps: [
                { icon: "1️⃣", text: "Conservez la facture originale acquittée émise à votre nom par les pompes funèbres." },
                { icon: "2️⃣", text: "Complétez le formulaire officiel Mod. RP5076-DGSS (Allocation de Frais Funéraires)." },
                { icon: "3️⃣", text: "Déposez la demande dans un délai maximal de 6 mois suivant la date du décès." },
                { icon: "4️⃣", text: "Le remboursement s'effectue par virement bancaire sur le compte du payeur mentionné sur la facture." }
            ],
            docs: [
                { icon: "🧾", text: "Facture et reçu originaux acquittés des frais d'obsèques libellés au nom du demandeur" },
                { icon: "📄", text: "Certificat de décès officiel de la personne défunte" },
                { icon: "🛂", text: "Pièce d'identité, NIF et IBAN de la personne ayant acquitté la dépense" },
                { icon: "📋", text: "Formulaire officiel Mod. RP5076-DGSS complété" }
            ],
            applyInfo: "Peut être demandé par toute personne (proche ou tiers) prouvant avoir payé les obsèques. Sur SS Direta ou en agence.",
            links: [
                { label: "Segurança Social Direta", url: "https://app.seg-social.pt" },
                { label: "Guide Officiel — Frais d'Obsèques", url: "https://www.seg-social.pt/subsidio-de-funeral" }
            ]
        }
    },
    tarifa_social_energia: {
        pt: {
            title: "Tarifa Social de Energia Elétrica (DGEG)",
            description: "Desconto social na fatura de eletricidade atribuído automaticamente pela DGEG aos clientes com rendimento elegível ou prestações sociais (DL 138-A/2010 + DL 15/2022).",
            category: "⚡ DGEG — Energia e Utilidades",
            steps: [
                { icon: "1️⃣", text: "Tenha contrato de eletricidade em seu nome para habitação própria permanente (potência ≤ 6,9 kVA)." },
                { icon: "2️⃣", text: "A DGEG cruza dados mensalmente com a Autoridade Tributária e a Segurança Social." },
                { icon: "3️⃣", text: "Se elegível, o desconto de 33,8% é aplicado de forma 100% automática na fatura da luz." },
                { icon: "4️⃣", text: "Em caso de omissão indevida, solicite declaração de elegibilidade na SS e envie ao comercializador." }
            ],
            docs: [
                { icon: "💡", text: "Fatura de eletricidade com contrato doméstico ativo em baixa tensão normal (BTN)" },
                { icon: "🔢", text: "NIF e NISS do titular do contrato de fornecimento de energia" },
                { icon: "📄", text: "Declaração de IRS com rendimento anual elegível ou comprovativo de prestação social ativa" },
                { icon: "🏛️", text: "Certidão de não dívida ou prova supletiva da SS (apenas se não for automático)" }
            ],
            applyInfo: "Atribuição 100% automática pela Direção-Geral de Energia e Geologia (DGEG). Reclamações junto do seu fornecedor de eletricidade.",
            links: [
                { label: "DGEG — Tarifa Social de Eletricidade", url: "https://www.dgeg.gov.pt/pt/areas-de-atuacao/energia/eletricidade/apoios-e-programas/tarifa-social-de-eletricidade/" },
                { label: "Portal ERSE — Simulador de Energia", url: "https://www.erse.pt" }
            ]
        },
        en: {
            title: "Social Energy Tariff (DGEG)",
            description: "Automatic electricity discount managed by DGEG for lower-income households and social benefit recipients (DL 138-A/2010 + DL 15/2022).",
            category: "⚡ DGEG — Energy & Utilities",
            steps: [
                { icon: "1️⃣", text: "Hold an active domestic electricity supply contract in your name (meter power ≤ 6.9 kVA)." },
                { icon: "2️⃣", text: "DGEG runs monthly automated cross-checks with Tax Authority and Social Security." },
                { icon: "3️⃣", text: "If eligible, the statutory 33.8% discount is deducted automatically on your power bill." },
                { icon: "4️⃣", text: "If missed automatically, request eligibility statement from SS and provide to your utility." }
            ],
            docs: [
                { icon: "💡", text: "Electricity bill under applicant's name for permanent primary residence" },
                { icon: "🔢", text: "NIF and NISS matching the utility supply agreement holder" },
                { icon: "📄", text: "IRS tax declaration under statutory income ceiling or active social benefit certificate" },
                { icon: "🏛️", text: "Social Security proof of eligible benefit (only if automated attribution fails)" }
            ],
            applyInfo: "100% automated attribution by the Directorate-General for Energy and Geology (DGEG).",
            links: [
                { label: "DGEG Official Portal — Social Energy Tariff", url: "https://www.dgeg.gov.pt/pt/areas-de-atuacao/energia/eletricidade/apoios-e-programas/tarifa-social-de-eletricidade/" },
                { label: "ERSE Regulatory Energy Portal", url: "https://www.erse.pt" }
            ]
        },
        es: {
            title: "Bono Social Eléctrico / Tarifa Social de Energía (DGEG)",
            description: "Descuento automático del 33,8% en la factura eléctrica para consumidores económicamente vulnerables (DL 138-A/2010 y DL 15/2022).",
            category: "⚡ DGEG — Energía y Servicios Básicos",
            steps: [
                { icon: "1️⃣", text: "Tenga un contrato de suministro eléctrico doméstico de baja tensión (potencia ≤ 6,9 kVA)." },
                { icon: "2️⃣", text: "Sea beneficiario de una ayuda social elegible o tenga ingresos dentro del umbral fiscal fijado." },
                { icon: "3️⃣", text: "Si cumple los requisitos, el descuento legal del 33,8% se aplica automáticamente en la factura." },
                { icon: "4️⃣", text: "Si no se aplicase automáticamente, solicite certificado en la SS y remítalo a su compañía eléctrica." }
            ],
            docs: [
                { icon: "💡", text: "Factura eléctrica a nombre del solicitante para su vivienda habitual permanente" },
                { icon: "🔢", text: "NIF y NISS coincidentes con el titular del contrato de suministro eléctrico" },
                { icon: "📄", text: "Declaración del IRS dentro del límite de ingresos o certificado de prestación social activa" },
                { icon: "🏛️", text: "Certificado de la Seguridad Social de ayuda compatible (en caso de fallo en el cruce automático)" }
            ],
            applyInfo: "Asignación 100% automática por la Dirección General de Energía y Geología (DGEG) cruzando datos con la SS y AT.",
            links: [
                { label: "Portal Oficial DGEG — Tarifa Social", url: "https://www.dgeg.gov.pt/pt/areas-de-atuacao/energia/eletricidade/apoios-e-programas/tarifa-social-de-eletricidade/" },
                { label: "Portal Regulador ERSE", url: "https://www.erse.pt" }
            ]
        },
        fr: {
            title: "Tarif Social de l'Énergie Électrique (DGEG)",
            description: "Réduction tarifaire automatique de 33,8% sur la facture d'électricité pour les ménages vulnérables (DL 138-A/2010 et DL 15/2022).",
            category: "⚡ DGEG — Énergie & Tarifs Sociaux",
            steps: [
                { icon: "1️⃣", text: "Être titulaire d'un contrat de fourniture d'électricité basse tension (puissance ≤ 6,9 kVA)." },
                { icon: "2️⃣", text: "Être allocataire d'une aide sociale compatible ou respecter les plafonds de revenus annuels." },
                { icon: "3️⃣", text: "Si éligible, la déduction légale de 33,8% est appliquée directement sur votre facture d'énergie." },
                { icon: "4️⃣", text: "En cas d'omission automatique, demandez une attestation à la SS et remettez-la à votre fournisseur." }
            ],
            docs: [
                { icon: "💡", text: "Facture d'électricité au nom du demandeur pour sa résidence principale permanente" },
                { icon: "🔢", text: "NIF et NISS correspondant rigoureusement au titulaire du contrat d'énergie" },
                { icon: "📄", text: "Avis d'imposition IRS dans la limite du barème ou attestation d'allocation sociale en cours" },
                { icon: "🏛️", text: "Attestation de la Sécurité Sociale d'aide perçue (uniquement si la liaison automatique échoue)" }
            ],
            applyInfo: "Attribution 100% automatisée par la Direction Générale de l'Énergie et de la Géologie (DGEG) via croisement de données.",
            links: [
                { label: "Portail Officiel DGEG — Tarif Social", url: "https://www.dgeg.gov.pt/pt/areas-de-atuacao/energia/eletricidade/apoios-e-programas/tarifa-social-de-eletricidade/" },
                { label: "Portail Régulateur ERSE", url: "https://www.erse.pt" }
            ]
        }
    },
    porta65_jovem: {
        pt: {
            title: "Programa Porta 65 Jovem (IHRU)",
            description: "Apoio financeiro mensal ao arrendamento de habitação para jovens entre os 18 e 35 anos (gerido pelo IHRU — Portaria 308-A/2007).",
            category: "🏠 IHRU — Habitação e Arrendamento",
            steps: [
                { icon: "1️⃣", text: "Tenha entre 18 e 35 anos (ou até 37 em casal) e contrato de arrendamento registado nas Finanças." },
                { icon: "2️⃣", text: "Aceda ao Portal da Habitação durante os períodos de candidatura com Chave Móvel Digital ou NIF." },
                { icon: "3️⃣", text: "O IHRU analisa a candidatura cruzando dados de rendimento com a Segurança Social e a AT." },
                { icon: "4️⃣", text: "Se aprovado, recebe uma percentagem da renda paga mensalmente na sua conta bancária." }
            ],
            docs: [
                { icon: "📝", text: "Contrato de arrendamento habitacional registado na AT com recibo eletrónico" },
                { icon: "🛂", text: "Documento de identificação válido, NIF e NISS de todos os candidatos" },
                { icon: "📄", text: "Última declaração de IRS de todos os membros ou comprovativo de rendimentos" },
                { icon: "🏦", text: "Comprovativo de IBAN bancário em nome do candidato" }
            ],
            applyInfo: "Candidatura exclusivamente online através do Portal da Habitação gerido pelo IHRU (https://www.portaldahabitacao.pt/porta-65-jovem).",
            links: [
                { label: "Portal da Habitação — Porta 65 Jovem", url: "https://www.portaldahabitacao.pt/porta-65-jovem" },
                { label: "IHRU — Habitação Oficial", url: "https://www.ihru.pt" }
            ]
        },
        en: {
            title: "Porta 65 Youth Rental Support (IHRU)",
            description: "Monthly state rent subsidy for young adults aged 18 to 35 managed by IHRU (Administrative Order 308-A/2007).",
            category: "🏠 IHRU — Housing & Rent",
            steps: [
                { icon: "1️⃣", text: "Be aged 18-35 (or up to 37 for couples) with a formal lease registered at Finanças." },
                { icon: "2️⃣", text: "Log in to the Housing Portal during application windows using Digital Mobile Key or NIF." },
                { icon: "3️⃣", text: "IHRU cross-checks applicant income with Social Security and Tax Authority records." },
                { icon: "4️⃣", text: "If approved, receive monthly rent subsidy deposited directly into your bank account." }
            ],
            docs: [
                { icon: "📝", text: "Registered residential lease agreement with electronic rent receipt from AT" },
                { icon: "🛂", text: "Valid identification document, NIF, and NISS of all co-tenants" },
                { icon: "📄", text: "Latest IRS tax return or verifiable proof of employment earnings" },
                { icon: "🏦", text: "Proof of bank account IBAN in applicant's name" }
            ],
            applyInfo: "Apply exclusively online via the official Housing Portal managed by IHRU (https://www.portaldahabitacao.pt/porta-65-jovem).",
            links: [
                { label: "Housing Portal — Porta 65 Jovem", url: "https://www.portaldahabitacao.pt/porta-65-jovem" },
                { label: "IHRU Official Portal", url: "https://www.ihru.pt" }
            ]
        },
        es: {
            title: "Programa Porta 65 Joven (IHRU)",
            description: "Subvención pública mensual para el alquiler de vivienda dirigida a jóvenes de entre 18 y 35 años (gestionada por el IHRU — Portaría 308-A/2007).",
            category: "🏠 IHRU — Vivienda y Alquiler",
            steps: [
                { icon: "1️⃣", text: "Tener entre 18 y 35 años (o hasta 37 años en pareja) y contrato de arrendamiento registrado en Hacienda." },
                { icon: "2️⃣", text: "Acceder al Portal da Habitação con la Chave Móvel Digital o credenciales de la AT en las convocatorias." },
                { icon: "3️⃣", text: "El IHRU evaluará la solicitud cruzando ingresos con la Seguridad Social y la Autoridad Tributaria." },
                { icon: "4️⃣", text: "Si se aprueba, recibirá una subvención porcentual mensual ingresada directamente en su cuenta bancaria." }
            ],
            docs: [
                { icon: "📝", text: "Contrato de alquiler residencial registrado en la AT con recibos de renta electrónicos" },
                { icon: "🛂", text: "Documento de identidad válido, NIF y NISS de todos los miembros del hogar" },
                { icon: "📄", text: "Última declaración de IRS de todos los solicitantes o comprobantes fehacientes de ingresos" },
                { icon: "🏦", text: "Certificado de cuenta bancaria con IBAN a nombre del solicitante" }
            ],
            applyInfo: "Solicitud exclusivamente en línea a través del Portal da Habitação del IHRU (https://www.portaldahabitacao.pt/porta-65-jovem).",
            links: [
                { label: "Portal da Habitação — Porta 65 Jovem", url: "https://www.portaldahabitacao.pt/porta-65-jovem" },
                { label: "IHRU — Vivienda Oficial", url: "https://www.ihru.pt" }
            ]
        },
        fr: {
            title: "Programme Porta 65 Jeunes (IHRU)",
            description: "Subvention publique mensuelle au loyer pour les jeunes adultes âgés de 18 à 35 ans (gérée par l'IHRU — Arrêté 308-A/2007).",
            category: "🏠 IHRU — Logement & Aides au Loyer",
            steps: [
                { icon: "1️⃣", text: "Avoir entre 18 et 35 ans (ou jusqu'à 37 ans en couple) et un bail enregistré aux Finanças." },
                { icon: "2️⃣", text: "Se connecter au Portail du Logement durant les campagnes avec la Chave Móvel Digital ou NIF." },
                { icon: "3️⃣", text: "L'IHRU instruit le dossier en croisant les données avec la Sécurité Sociale et l'AT." },
                { icon: "4️⃣", text: "Si acceptée, percevez chaque mois une part de votre loyer versée directement sur votre compte." }
            ],
            docs: [
                { icon: "📝", text: "Contrat de bail résidentiel enregistré aux Finanças avec quittances de loyer électroniques" },
                { icon: "🛂", text: "Pièce d'identité valide, NIF et NISS de l'ensemble des candidats colocataires" },
                { icon: "📄", text: "Dernier avis d'imposition IRS ou attestations récentes de revenus réguliers" },
                { icon: "🏦", text: "Relevé bancaire avec IBAN libellé au nom du demandeur" }
            ],
            applyInfo: "Candidature exclusivement en ligne via le portail officiel de l'IHRU (https://www.portaldahabitacao.pt/porta-65-jovem).",
            links: [
                { label: "Portail du Logement — Porta 65 Jovem", url: "https://www.portaldahabitacao.pt/porta-65-jovem" },
                { label: "Site Officiel IHRU", url: "https://www.ihru.pt" }
            ]
        }
    },
    apoios_migrantes_aima: {
        pt: {
            title: "Apoios à Integração de Imigrantes (AIMA)",
            description: "Programas de integração, acolhimento, cursos de Português Língua de Acolhimento (PLA) e rede nacional CLAIM/CNAIM da AIMA.",
            category: "🌍 AIMA — Integração e Acolhimento",
            steps: [
                { icon: "1️⃣", text: "Consulte os avisos de programas ativos e parcerias comunitárias no portal da AIMA." },
                { icon: "2️⃣", text: "Dirija-se a um Centro Local de Apoio à Integração de Migrantes (CLAIM) para atendimento social." },
                { icon: "3️⃣", text: "Inscreva-se nos cursos gratuitos de língua portuguesa (PLA) para certificação de nacionalidade/residência." },
                { icon: "4️⃣", text: "Aceda a apoio jurídico, mediação intercultural e programas de inserção laboral." }
            ],
            docs: [
                { icon: "🛂", text: "Passaporte ou Documento de Identificação válido" },
                { icon: "📄", text: "Título de Residência, Visto ou comprovativo de manifestação / pedido na AIMA" },
                { icon: "🔢", text: "NIF e NISS (caso já atribuídos)" },
                { icon: "🏠", text: "Comprovativo de morada de residência em Portugal" }
            ],
            applyInfo: "⚠️ Em verificação normativa contínua para novos editais de 2026. Consulte o portal oficial da AIMA e a rede de balcões CNAIM/CLAIM.",
            links: [
                { label: "Portal Oficial AIMA", url: "https://aima.gov.pt" },
                { label: "Rede de Centros CLAIM", url: "https://aima.gov.pt" }
            ]
        },
        en: {
            title: "Immigrant Integration Supports (AIMA)",
            description: "State integration programs, reception services, Portuguese Language for Foreigners (PLA) courses, and CLAIM network under AIMA.",
            category: "🌍 AIMA — Integration & Reception",
            steps: [
                { icon: "1️⃣", text: "Review active community initiatives and public notices on the official AIMA portal." },
                { icon: "2️⃣", text: "Visit a Local Immigrant Support Center (CLAIM) for specialized social guidance." },
                { icon: "3️⃣", text: "Enroll in free Portuguese language courses (PLA) required for citizenship and residence." },
                { icon: "4️⃣", text: "Access legal counseling, intercultural mediation, and employability assistance." }
            ],
            docs: [
                { icon: "🛂", text: "Valid Passport or National Identity Document" },
                { icon: "📄", text: "Residence Permit, Visa, or formal application receipt from AIMA" },
                { icon: "🔢", text: "NIF and NISS (if already issued)" },
                { icon: "🏠", text: "Proof of residential address in Portugal" }
            ],
            applyInfo: "⚠️ Under ongoing statutory review for active 2026 notices. Consult the official AIMA portal and CNAIM/CLAIM offices.",
            links: [
                { label: "Official AIMA Portal", url: "https://aima.gov.pt" },
                { label: "CLAIM Support Centers Network", url: "https://aima.gov.pt" }
            ]
        },
        es: {
            title: "Apoyo a la Integración de Inmigrantes (AIMA)",
            description: "Programas estatales de integración, cursos de portugués como lengua de acogida (PLA) y red de centros CLAIM/CNAIM bajo la AIMA.",
            category: "🌍 AIMA — Integración y Acogida",
            steps: [
                { icon: "1️⃣", text: "Consulte las convocatorias de programas comunitarios activos en el portal oficial de AIMA." },
                { icon: "2️⃣", text: "Acérquese a un Centro Local de Apoyo a la Integración de Migrantes (CLAIM) para orientación social." },
                { icon: "3️⃣", text: "Inscríbase en los cursos oficiales gratuitos de portugués (PLA) válidos para residencia y nacionalidad." },
                { icon: "4️⃣", text: "Acceda a orientación legal, mediación intercultural y programas de inserción laboral." }
            ],
            docs: [
                { icon: "🛂", text: "Pasaporte en vigor o documento nacional de identidad del país de origen" },
                { icon: "📄", text: "Permiso de residencia, visado o justificante formal de solicitud ante AIMA" },
                { icon: "🔢", text: "NIF y NISS (si ya le han sido asignados)" },
                { icon: "🏠", text: "Justificante de domicilio de residencia en Portugal" }
            ],
            applyInfo: "⚠️ En proceso continuo de adecuación normativa para nuevas convocatorias 2026. Consulte el portal de AIMA y la red de oficinas CNAIM/CLAIM.",
            links: [
                { label: "Portal Oficial AIMA", url: "https://aima.gov.pt" },
                { label: "Red de Centros CLAIM", url: "https://aima.gov.pt" }
            ]
        },
        fr: {
            title: "Aides à l'Intégration des Immigrés (AIMA)",
            description: "Programmes publics d'accueil, cours de Portugais Langue d'Accueil (PLA) et réseau de centres CLAIM/CNAIM sous l'AIMA.",
            category: "🌍 AIMA — Intégration & Accueil",
            steps: [
                { icon: "1️⃣", text: "Consultez les appels à projets et dispositifs ouverts sur le portail officiel de l'AIMA." },
                { icon: "2️⃣", text: "Présentez-vous dans un Centre Local d'Appui à l'Intégration des Migrants (CLAIM) pour conseil social." },
                { icon: "3️⃣", text: "Inscrivez-vous aux cours de langue portugaise gratuits (PLA) requis pour la nationalité/séjour." },
                { icon: "4️⃣", text: "Bénéficiez d'une aide juridique, de la médiation interculturelle et de l'aide à l'emploi." }
            ],
            docs: [
                { icon: "🛂", text: "Passeport en cours de validité ou pièce d'identité officielle" },
                { icon: "📄", text: "Titre de séjour, visa ou récépissé d'enregistrement de demande auprès de l'AIMA" },
                { icon: "🔢", text: "NIF et NISS (s'ils ont déjà été délivrés)" },
                { icon: "🏠", text: "Justificatif d'adresse de résidence sur le sol portugais" }
            ],
            applyInfo: "⚠️ En cours d'actualisation réglementaire continue pour les nouveaux dispositifs 2026. Consultez le portail de l'AIMA et le réseau CLAIM.",
            links: [
                { label: "Portail Officiel AIMA", url: "https://aima.gov.pt" },
                { label: "Réseau des Centres CLAIM", url: "https://aima.gov.pt" }
            ]
        }
    }
};

export const NissWizard: React.FC<NissWizardProps> = ({ language, onBack, onSelectTemplate, onViewChange }) => {
    const [flow, setFlow] = useState<'menu' | 'niss' | 'decl_trimestral' | 'lifehacks' | 'supports' | 'activity'>('menu');
    const [activityTab, setActivityTab] = useState<'open' | 'close'>('open');
    const [step, setStep] = useState(1);
    const [workerType, setWorkerType] = useState<string>('');
    const [selectedSupport, setSelectedSupport] = useState<string>('');

    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const rawLang = language?.toLowerCase() || 'pt';
    const lang: Lang = rawLang === 'br' ? 'br' : rawLang === 'es' ? 'es' : rawLang === 'en' ? 'en' : rawLang === 'fr' ? 'fr' : 'pt';

    const handleBack = () => {
        if (flow !== 'menu') {
            if (flow === 'niss' && step > 1) {
                setStep(s => s - 1);
            } else {
                setFlow('menu');
            }
        } else {
            onBack();
        }
    };

    const copyToClipboard = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const types = [
        { id: 'employed', emoji: '💼', label: t('niss_type_employed', lang), sub: t('niss_type_employed_sub', lang) },
        { id: 'selfemployed', emoji: '🧑‍💻', label: t('niss_type_self', lang), sub: t('niss_type_self_sub', lang) },
        { id: 'unemployed', emoji: '📋', label: t('niss_type_unemployed', lang), sub: t('niss_type_unemployed_sub', lang) },
    ];

    const checklistBase = [
        { icon: '🛂', text: t('niss_doc_passport', lang) },
        { icon: '🔢', text: t('niss_doc_nif', lang) },
        { icon: '📍', text: t('niss_doc_address', lang) },
    ];

    const checklistExtra = workerType === 'employed'
        ? [{ icon: '📄', text: t('niss_doc_contract', lang) }]
        : workerType === 'selfemployed'
        ? [{ icon: '🏛️', text: t('niss_doc_activity', lang) }]
        : [];

    const checklist = [...checklistBase, ...checklistExtra];

    // Helper translation accessor
    const localT = (key: string) => LOCAL_TRANS[lang][key] || key;

    const currentSupportData = selectedSupport ? (SOCIAL_SUPPORTS[selectedSupport]?.[lang] || SOCIAL_SUPPORTS[selectedSupport]?.['pt'] || SOCIAL_SUPPORTS[selectedSupport]?.['en']) : null;

    return (
        <div className="flex flex-col h-full bg-slate-950 overflow-hidden">
            {/* ── STICKY HERO BANNER ─────────────────────────────────────────── */}
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-b from-slate-950 via-blue-950/20 to-slate-950 px-6 pt-5 pb-8 border-b border-white/5">
                {/* Background Glassmorphism Blobs */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[90px] -mr-32 -mt-32 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-sky-500/10 rounded-full blur-[80px] -ml-24 -mb-24 pointer-events-none" />

                {/* Sticky Header Nav Row */}
                <div className="relative z-10 flex items-center justify-between mb-8">
                    <button
                        onClick={handleBack}
                        className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center border border-white/10 active:scale-90 transition-all hover:bg-white/20"
                    >
                        <ArrowLeft size={16} />
                    </button>

                    {flow === 'niss' ? (
                        <StepDots total={2} current={step} />
                    ) : flow === 'supports' && step === 2 ? (
                        <StepDots total={2} current={2} />
                    ) : null}

                    <div className="flex items-center gap-1">
                        <Sparkles size={12} className="text-blue-400 animate-pulse" />
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                            ✦ {flow === 'menu' ? 'MENU' : flow === 'activity' ? 'ATIVIDADE' : flow === 'decl_trimestral' ? 'DECLARAÇÃO SS' : flow === 'lifehacks' ? 'LIFE HACKS' : flow === 'niss' ? `NISS ${step}/2` : 'APOIOS'}
                        </span>
                    </div>
                </div>

                {/* Hero Title & Description */}
                <div className="relative z-10 space-y-4">
                    <div className="flex justify-between items-start">
                        <BadgePill
                            icon={<Shield size={10} />}
                            text={localT('niss_title')}
                        />
                    </div>

                    {flow === 'menu' && (
                        <div className="animate-in slide-in-from-bottom-2 duration-400">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">
                                {localT('niss_title')}
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                {localT('niss_menu_desc')}
                            </p>
                        </div>
                    )}

                    {flow === 'decl_trimestral' && (
                        <div className="animate-in slide-in-from-bottom-2 duration-400">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">
                                Declaração Trimestral SS
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                Passo a passo oficial de preenchimento para Recibos Verdes na Segurança Social Direta.
                            </p>
                        </div>
                    )}

                    {flow === 'lifehacks' && (
                        <div className="animate-in slide-in-from-bottom-2 duration-400">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">
                                Life Hacks de Integração 🇵🇹
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                Isenções fiscais, Acordo de Saúde PB4/SNS, Atestado de Morada e Dicas Fiscais Vitais.
                            </p>
                        </div>
                    )}

                    {flow === 'niss' && (
                        <div className="animate-in slide-in-from-bottom-2 duration-400">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">
                                {step === 1 ? t('niss_step1_q', lang) : types.find(t => t.id === workerType)?.label}
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                {step === 1 ? t('niss_step1_desc', lang) : t('niss_subtitle', lang)}
                            </p>
                        </div>
                    )}

                    {flow === 'activity' && (
                        <div className="animate-in slide-in-from-bottom-2 duration-400">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">
                                {t('act_title', lang)}
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                {t('act_subtitle', lang)}
                            </p>
                        </div>
                    )}

                    {flow === 'supports' && (
                        <div className="animate-in slide-in-from-bottom-2 duration-400">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">
                                {step === 1 ? localT('support_list_title') : currentSupportData?.title}
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                {step === 1 ? localT('support_list_sub') : currentSupportData?.category}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── SCROLLABLE BODY ──────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto bg-slate-50 no-scrollbar">
                <div className="p-5 space-y-5 pb-32">

                    {/* ════ FLOW MENU — Core Hub ════════════════ */}
                    {flow === 'menu' && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Option 1: Get NISS */}
                            <button
                                onClick={() => { setFlow('niss'); setStep(1); setWorkerType(''); }}
                                className="group w-full bg-white border border-slate-100 rounded-[2.25rem] p-6 text-left transition-all duration-500 hover:border-blue-400/30 hover:shadow-2xl hover:shadow-blue-500/5 active:scale-[0.98] flex items-center gap-4"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 text-blue-500 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 transition-transform">
                                    🆔
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-tight group-hover:text-blue-500 transition-colors">
                                        {localT('menu_get_niss')}
                                    </h4>
                                    <p className="text-[11px] text-slate-400 font-medium mt-1 leading-normal">
                                        {localT('menu_get_niss_sub')}
                                    </p>
                                </div>
                                <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors" size={20} />
                            </button>

                            {/* Option: Abrir e Fechar Atividade */}
                            <button
                                onClick={() => { setFlow('activity'); setActivityTab('open'); }}
                                className="group w-full bg-white border border-slate-100 rounded-[2.25rem] p-6 text-left transition-all duration-500 hover:border-amber-400/30 hover:shadow-2xl hover:shadow-amber-500/5 active:scale-[0.98] flex items-center gap-4"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 text-amber-500 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 transition-transform">
                                    🏢
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-tight group-hover:text-amber-500 transition-colors">
                                        {localT('menu_activity')}
                                    </h4>
                                    <p className="text-[11px] text-slate-400 font-medium mt-1 leading-normal">
                                        {localT('menu_activity_sub')}
                                    </p>
                                </div>
                                <ChevronRight className="text-slate-300 group-hover:text-amber-500 transition-colors" size={20} />
                            </button>

                            {/* Option 2: Declaração Trimestral SS */}
                            <button
                                onClick={() => { setFlow('decl_trimestral'); }}
                                className="group w-full bg-white border border-slate-100 rounded-[2.25rem] p-6 text-left transition-all duration-500 hover:border-indigo-400/30 hover:shadow-2xl hover:shadow-indigo-500/5 active:scale-[0.98] flex items-center gap-4"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-500 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 transition-transform">
                                    📋
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-tight group-hover:text-indigo-500 transition-colors">
                                        {localT('menu_decl_trimestral')}
                                    </h4>
                                    <p className="text-[11px] text-slate-400 font-medium mt-1 leading-normal">
                                        {localT('menu_decl_trimestral_sub')}
                                    </p>
                                </div>
                                <ChevronRight className="text-slate-300 group-hover:text-indigo-500 transition-colors" size={20} />
                            </button>

                            {/* Option 4: Life Hacks & Dicas de Integração */}
                            <button
                                onClick={() => { setFlow('lifehacks'); }}
                                className="group w-full bg-white border border-slate-100 rounded-[2.25rem] p-6 text-left transition-all duration-500 hover:border-purple-400/30 hover:shadow-2xl hover:shadow-purple-500/5 active:scale-[0.98] flex items-center gap-4"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-100 text-purple-500 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 transition-transform">
                                    💡
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-tight group-hover:text-purple-500 transition-colors">
                                        {localT('menu_lifehacks')}
                                    </h4>
                                    <p className="text-[11px] text-slate-400 font-medium mt-1 leading-normal">
                                        {localT('menu_lifehacks_sub')}
                                    </p>
                                </div>
                                <ChevronRight className="text-slate-300 group-hover:text-purple-500 transition-colors" size={20} />
                            </button>

                            {/* Option 5: Social Supports */}
                            <button
                                onClick={() => { setFlow('supports'); setStep(1); setSelectedSupport(''); }}
                                className="group w-full bg-white border border-slate-100 rounded-[2.25rem] p-6 text-left transition-all duration-500 hover:border-emerald-400/30 hover:shadow-2xl hover:shadow-emerald-500/5 active:scale-[0.98] flex items-center gap-4"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-500 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 transition-transform">
                                    🤝
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-tight group-hover:text-emerald-500 transition-colors">
                                        {localT('menu_supports')}
                                    </h4>
                                    <p className="text-[11px] text-slate-400 font-medium mt-1 leading-normal">
                                        {localT('menu_supports_sub')}
                                    </p>
                                </div>
                                <ChevronRight className="text-slate-300 group-hover:text-emerald-500 transition-colors" size={20} />
                            </button>

                            {/* Legal Notice */}
                            <div className="bg-slate-100 border border-slate-200/60 rounded-2xl p-4 flex items-start gap-3 mt-4">
                                <Info size={16} className="text-slate-500 shrink-0 mt-0.5" />
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-relaxed">
                                    {t('general_disclaimer_note', lang)}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ════ FLOW DECLARAÇÃO TRIMESTRAL ═════════════════════════════ */}
                    {flow === 'decl_trimestral' && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Schedule Card */}
                            <div className="bg-indigo-900/90 text-white rounded-3xl p-6 border border-indigo-700/50 shadow-xl space-y-3">
                                <div className="flex items-center gap-2">
                                    <Calendar className="text-indigo-300" size={20} />
                                    <h3 className="text-sm font-black uppercase tracking-wider text-indigo-200">
                                        Calendário Oficial de Entregas 2026
                                    </h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                                    <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
                                        <p className="font-black text-indigo-300">🗓️ 1 a 31 de JANEIRO</p>
                                        <p className="text-[11px] text-slate-200 mt-1">Rendimentos de Outubro, Novembro e Dezembro</p>
                                    </div>
                                    <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
                                        <p className="font-black text-indigo-300">🗓️ 1 a 30 de ABRIL</p>
                                        <p className="text-[11px] text-slate-200 mt-1">Rendimentos de Janeiro, Fevereiro e Março</p>
                                    </div>
                                    <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
                                        <p className="font-black text-indigo-300">🗓️ 1 a 31 de JULHO</p>
                                        <p className="text-[11px] text-slate-200 mt-1">Rendimentos de Abril, Maio e Junho</p>
                                    </div>
                                    <div className="bg-white/10 p-3 rounded-2xl border border-white/10">
                                        <p className="font-black text-indigo-300">🗓️ 1 a 31 de OUTUBRO</p>
                                        <p className="text-[11px] text-slate-200 mt-1">Rendimentos de Julho, Agosto e Setembro</p>
                                    </div>
                                </div>
                            </div>

                            {/* Step-by-Step Instructions */}
                            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                    <span>📝</span> Passo a Passo na Segurança Social Direta
                                </h3>
                                <div className="space-y-4 text-xs text-slate-700">
                                    <div className="flex gap-3">
                                        <div className="w-7 h-7 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-black shrink-0">
                                            1
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">Aceder ao Portal Oficial</p>
                                            <p className="text-slate-500 mt-0.5">Entre em <a href="https://app.seg-social.pt" target="_blank" rel="noreferrer" className="text-indigo-600 underline font-bold">app.seg-social.pt</a> com o seu NISS e Palavra-passe ou Chave Móvel Digital.</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <div className="w-7 h-7 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-black shrink-0">
                                            2
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">Navegar até ao Menu Correto</p>
                                            <p className="text-slate-500 mt-0.5">No menu superior, escolha: <strong className="text-slate-800">Emprego</strong> ➔ <strong className="text-slate-800">Trabalho Independente</strong> ➔ <strong className="text-slate-800">Declaração Trimestral</strong>.</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <div className="w-7 h-7 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-black shrink-0">
                                            3
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">Inserir os Rendimentos Ilíquidos</p>
                                            <p className="text-slate-500 mt-0.5">Preencha o valor total bruto das Faturas-Recibos emitidas em cada um dos 3 meses do trimestre anterior. Se não faturou num mês, insira <strong>0,00€</strong>.</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <div className="w-7 h-7 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-black shrink-0">
                                            4
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">Escolher a Opção de Variação (-25% a +25%)</p>
                                            <p className="text-slate-500 mt-0.5">Pode optar por reduzir a base em <strong>-25%</strong> para pagar menos nos 3 meses seguintes ou aumentar até <strong>+25%</strong> para acumular mais direitos de proteção social.</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <div className="w-7 h-7 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-black shrink-0">
                                            5
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">Submeter e Guardar o Comprovativo</p>
                                            <p className="text-slate-500 mt-0.5">Confirme a declaração. O sistema irá gerar a nota com o valor fixo mensal a pagar a cada dia 20 nos 3 meses seguintes.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}
                    
                    {/* ════ FLOW ACTIVITY (ABRIR / FECHAR ATIVIDADE) ═════════════════ */}
                    {flow === 'activity' && (
                        <div className="space-y-5 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Interactive Tabs */}
                            <div className="flex bg-slate-200/80 p-1.5 rounded-2xl gap-1">
                                <button
                                    onClick={() => setActivityTab('open')}
                                    className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                                        activityTab === 'open'
                                            ? 'bg-white text-slate-900 shadow-md shadow-slate-300/50'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    🟢 {localT('tab_act_open')}
                                </button>
                                <button
                                    onClick={() => setActivityTab('close')}
                                    className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
                                        activityTab === 'close'
                                            ? 'bg-white text-slate-900 shadow-md shadow-slate-300/50'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    🔴 {localT('tab_act_close')}
                                </button>
                            </div>

                            {activityTab === 'open' ? (
                                <div className="space-y-4">
                                    {/* Statutory Deadline AT */}
                                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-3xl space-y-1 text-xs">
                                        <div className="flex items-center gap-2 text-emerald-800 font-black uppercase">
                                            <span>⏱️</span>
                                            <h4>{t('act_open_deadline_rule', lang)}</h4>
                                        </div>
                                    </div>

                                    {/* VAT Regime Art 53 CIVA (DL 35/2025) */}
                                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                            <span>⚖️</span> {t('act_open_vat_title', lang)}
                                        </h3>
                                        <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-700 leading-relaxed space-y-2">
                                            <p><strong>1. {t('act_open_vat_conditions', lang)}</strong></p>
                                            <p className="text-amber-900 font-semibold bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                                                <strong>2. {t('act_open_vat_thresholds', lang)}</strong>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Social Security Statutory Framework */}
                                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                            <span>🏛️</span> {t('act_open_ss_title', lang)}
                                        </h3>
                                        <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
                                            <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl">
                                                <p className="font-bold text-blue-950">📡 {t('act_open_ss_rule1', lang)}</p>
                                                <p className="text-[11px] text-blue-800 mt-0.5">{t('act_open_ss_rule2', lang)}</p>
                                            </div>
                                            <div className="p-3 bg-purple-50 border border-purple-100 rounded-2xl">
                                                <p className="font-bold text-purple-950">🗓️ {t('act_open_ss_rule3', lang)}</p>
                                                <p className="text-[11px] text-purple-800 mt-0.5">{t('act_open_ss_rule4', lang)}</p>
                                            </div>
                                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                                                <p className="font-bold text-slate-800">📋 {t('act_open_ss_rule5', lang)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Portal das Finanças Link */}
                                    <a
                                        href="https://www.portaldasfinancas.gov.pt"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg hover:shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        <ExternalLink size={18} />
                                        Abrir Atividade no Portal das Finanças
                                    </a>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Statutory Deadline AT for Cessation */}
                                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-3xl space-y-1 text-xs">
                                        <div className="flex items-center gap-2 text-amber-800 font-black uppercase">
                                            <span>⏱️</span>
                                            <h4>{t('act_close_deadline_rule', lang)}</h4>
                                        </div>
                                    </div>

                                    {/* Social Security Cessation Rules */}
                                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                            <span>🏛️</span> Sincronização Automática com a Segurança Social
                                        </h3>
                                        <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
                                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                                                <p className="font-bold text-slate-900">📡 {t('act_close_ss_rule1', lang)}</p>
                                                <p className="text-[11px] text-slate-600 mt-0.5">{t('act_close_ss_rule2', lang)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Checklist for Cessation */}
                                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                            <span>📋</span> {t('act_close_checklist_title', lang)}
                                        </h3>
                                        <div className="space-y-2 text-xs text-slate-700">
                                            <div className="p-3 bg-slate-50 rounded-2xl flex items-center gap-2.5">
                                                <span>1️⃣</span> <span>{t('act_close_chk1', lang)}</span>
                                            </div>
                                            <div className="p-3 bg-slate-50 rounded-2xl flex items-center gap-2.5">
                                                <span>2️⃣</span> <span>{t('act_close_chk2', lang)}</span>
                                            </div>
                                            <div className="p-3 bg-slate-50 rounded-2xl flex items-center gap-2.5">
                                                <span>3️⃣</span> <span>{t('act_close_chk3', lang)}</span>
                                            </div>
                                            <div className="p-3 bg-slate-50 rounded-2xl flex items-center gap-2.5">
                                                <span>4️⃣</span> <span>{t('act_close_chk4', lang)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Portal das Finanças Link */}
                                    <a
                                        href="https://www.portaldasfinancas.gov.pt"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-full py-4 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg hover:shadow-red-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        <ExternalLink size={18} />
                                        Comunicar Cessação no Portal das Finanças
                                    </a>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ════ FLOW LIFE HACKS ═══════════════════════════════════════════ */}
                    {flow === 'lifehacks' && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Hack 1 */}
                            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">🎉</span>
                                    <div>
                                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">
                                            Hack #1: Isenção no 1.º Ano de Recibos Verdes
                                        </h3>
                                        <p className="text-[10px] text-purple-600 font-bold uppercase">Artigo 157.º do Código dos Contratantes</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Ao abrir atividade de Trabalhador Independente pela primeira vez em Portugal, fica <strong>isento de pagar Segurança Social durante os primeiros 12 meses</strong> consecutivos.
                                </p>
                                <div className="bg-purple-50 p-3 rounded-2xl border border-purple-100 text-[11px] text-purple-900 font-medium">
                                    💡 <strong>Dica de Ouro:</strong> Pode optar por renunciar à isenção caso necessite de comprovar contribuições para subsidios ou renovação de visto.
                                </div>
                            </div>

                            {/* Hack 2 */}
                            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">🇧🇷</span>
                                    <div>
                                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">
                                            Hack #2: Acordo de Saúde PB4 / CDAM para Brasileiros
                                        </h3>
                                        <p className="text-[10px] text-blue-600 font-bold uppercase">Acesso ao SNS sem Título Físico</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Cidadãos brasileiros com o certificado PB4 (emitido pelo Ministério da Saúde do Brasil) têm direito a ser atendidos no Sistema Nacional de Saúde (SNS) exatamente com os mesmos custos e direitos de um cidadão português, mesmo antes de terem a residência emitida.
                                </p>
                            </div>

                            {/* Hack 3 */}
                            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">🏠</span>
                                    <div>
                                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">
                                            Hack #3: Atestado na Junta de Freguesia
                                        </h3>
                                        <p className="text-[10px] text-emerald-600 font-bold uppercase">Sem necessidade de 2 testemunhas</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Se não tiver 2 testemunhas recenseadas na mesma freguesia, pode apresentar o <strong>Contrato de Arrendamento ou Contrato de Comodato</strong> acompanhado pelo recibo de renda eletrónico emitido nas Finanças.
                                </p>
                            </div>

                            {/* Hack 4 */}
                            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl">📊</span>
                                    <div>
                                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">
                                            Hack #4: Isenção de Retenção de IRS e IVA até 15.000€
                                        </h3>
                                        <p className="text-[10px] text-amber-600 font-bold uppercase">Artigo 101.º, n.º 1 do CIRS & Art. 53.º do CIVA (2025/2026)</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Se estima faturar menos de <strong>15.000€ em 2026</strong>, pode selecionar a opção <em>"Sem retenção - art. 101.º, n.º 1 do CIRS"</em> ao emitir faturas-recibos verdes e usufruir da isenção de IVA do Artigo 53.º do CIVA, evitando retenções de imposto na fonte no arranque.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ════ FLOW NISS — Step 1: Worker Type ════════════════════════ */}
                    {flow === 'niss' && step === 1 && (
                        <div className="space-y-3.5 animate-in slide-in-from-bottom-4 duration-500">
                            {types.map((type, idx) => (
                                <button
                                    key={type.id}
                                    onClick={() => { setWorkerType(type.id); setStep(2); }}
                                    style={{ animationDelay: `${idx * 60}ms` }}
                                    className="group w-full bg-white border border-slate-100 rounded-[2.25rem] p-5 flex items-center gap-4 text-left transition-all duration-500 hover:border-blue-400/30 hover:shadow-2xl hover:shadow-blue-500/5 active:scale-[0.97]"
                                >
                                    <div className="relative w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 group-hover:bg-white transition-all duration-500">
                                        {type.emoji}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider border rounded-full bg-blue-500/10 text-blue-500 border-blue-500/20">
                                                {type.id === 'employed' ? t('badge_employed', lang) : type.id === 'selfemployed' ? t('badge_self_employed', lang) : t('badge_registration', lang)}
                                            </span>
                                        </div>
                                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight leading-tight group-hover:text-slate-950 transition-colors">
                                            {type.label}
                                        </h4>
                                        <p className="text-[10px] text-slate-400 font-medium mt-1 leading-normal">
                                            {type.sub}
                                        </p>
                                    </div>
                                    <ChevronRight className="text-slate-300 group-hover:text-blue-500 transition-colors" size={18} />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* ════ FLOW NISS — Step 2: Checklist & Apply ══════════════════ */}
                    {flow === 'niss' && step === 2 && (
                        <div className="space-y-5 animate-in slide-in-from-bottom-4 duration-500">
                            {/* Checklist */}
                            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                                    <span>📋</span> Documentos Necessários
                                </h3>
                                <div className="space-y-3">
                                    {checklist.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-medium text-slate-700">
                                            <span className="text-lg">{item.icon}</span>
                                            <span>{item.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Direct Action Link */}
                            <a
                                href="https://app.seg-social.pt"
                                target="_blank"
                                rel="noreferrer"
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <ExternalLink size={18} />
                                Solicitar NISS na Segurança Social Direta
                            </a>

                            {/* ── Interligação de Módulos (Cross-Module Navigation Hub) ── */}
                            <CrossModuleNavigationHub
                                language={language}
                                onViewChange={onViewChange}
                            />
                        </div>
                    )}

                    {/* ════ FLOW SUPPORTS — List or Detail ═════════════════════════ */}
                    {flow === 'supports' && step === 1 && (
                        <div className="space-y-3 animate-in slide-in-from-bottom-4 duration-500">
                            {Object.entries(SOCIAL_SUPPORTS).map(([key, data]) => {
                                const support = data[lang] || data['pt'];
                                return (
                                    <button
                                        key={key}
                                        onClick={() => { setSelectedSupport(key); setStep(2); }}
                                        className="group w-full bg-white border border-slate-100 rounded-[2.25rem] p-5 text-left transition-all duration-500 hover:border-emerald-400/30 hover:shadow-2xl hover:shadow-emerald-500/5 active:scale-[0.98] flex items-center gap-4"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0">
                                            🤝
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 mb-1 inline-block">
                                                {support.category}
                                            </span>
                                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight group-hover:text-emerald-600 transition-colors">
                                                {support.title}
                                            </h4>
                                            <p className="text-[10px] text-slate-400 font-medium mt-0.5 line-clamp-1">
                                                {support.description}
                                            </p>
                                        </div>
                                        <ChevronRight className="text-slate-300 group-hover:text-emerald-600 transition-colors" size={18} />
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {flow === 'supports' && step === 2 && currentSupportData && (
                        <div className="space-y-5 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">
                                    {localT('support_steps_title')}
                                </h3>
                                <div className="space-y-3">
                                    {currentSupportData.steps.map((st, idx) => (
                                        <div key={idx} className="flex gap-3 text-xs text-slate-700 p-3 bg-slate-50 rounded-2xl">
                                            <span className="text-base shrink-0">{st.icon}</span>
                                            <span className="font-medium">{st.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">
                                    {localT('support_docs_title')}
                                </h3>
                                <div className="space-y-2.5">
                                    {currentSupportData.docs.map((dc, idx) => (
                                        <div key={idx} className="flex items-center gap-3 text-xs font-medium text-slate-700 p-3 bg-slate-50 rounded-2xl">
                                            <span className="text-base shrink-0">{dc.icon}</span>
                                            <span>{dc.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-emerald-950 text-white rounded-3xl p-6 border border-emerald-800/50 shadow-xl space-y-3">
                                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-300">
                                    {localT('support_apply_title')}
                                </h3>
                                <p className="text-xs text-slate-200 leading-relaxed">
                                    {currentSupportData.applyInfo}
                                </p>
                                <div className="pt-2 space-y-2">
                                    {currentSupportData.links.map((link, idx) => (
                                        <a
                                            key={idx}
                                            href={link.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="w-full py-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-emerald-500/30 transition-all"
                                        >
                                            <ExternalLink size={14} />
                                            {link.label}
                                        </a>
                                    ))}
                                </div>
                            </div>

                            {/* ── Interligação de Módulos (Cross-Module Navigation Hub) ── */}
                            <CrossModuleNavigationHub
                                language={language}
                                onViewChange={onViewChange}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
