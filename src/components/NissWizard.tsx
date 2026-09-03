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

const SOCIAL_SUPPORTS: Record<string, Record<'pt' | 'en', SupportDetail>> = {
    abono: {
        pt: {
            title: "Abono de Família",
            description: "Apoio mensal para ajudar nas despesas com o sustento e educação de crianças e jovens.",
            category: "Família & Crianças",
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
            applyInfo: "Pode submeter o pedido de forma 100% digital através do portal Segurança Social Direta. Se preferir atendimento presencial, deve efetuar o agendamento prévio online através do portal SIGA.",
            links: [
                { label: "Segurança Social Direta", url: "https://app.seg-social.pt" },
                { label: "Marcações Online (SIGA)", url: "https://siga.marcacaodeatendimento.pt" }
            ]
        },
        en: {
            title: "Family Allowance",
            description: "Monthly financial support to help cover cost of raising and educating children and young people.",
            category: "Family & Children",
            steps: [
                { icon: "1️⃣", text: "Obtain NIF (Tax Number) and NISS (Social Security Number) for the child and all household members." },
                { icon: "2️⃣", text: "Submit your IRS tax return or prove your household's financial status at the Tax Authority." },
                { icon: "3️⃣", text: "Fill in the official Form Mod. RP5045-DGSS (Family Allowance Application)." },
                { icon: "4️⃣", text: "Submit the application on the Social Security Direct portal or at a physical branch." }
            ],
            docs: [
                { icon: "... ", text: "ID Document for the child and parents" },
                { icon: "🔢", text: "NIF and NISS of all household members" },
                { icon: "📄", text: "IRS tax return or proof of income" },
                { icon: "📋", text: "Completed Form Mod. RP5045-DGSS" }
            ],
            applyInfo: "You can submit the application 100% digitally via the Social Security Direct portal. If you prefer in-person support, you must book an appointment in advance via the SIGA portal.",
            links: [
                { label: "Social Security Direct", url: "https://app.seg-social.pt" },
                { label: "Online Bookings (SIGA)", url: "https://siga.marcacaodeatendimento.pt" }
            ]
        }
    },
    desemprego: {
        pt: {
            title: "Subsídio de Desemprego",
            description: "Apoio financeiro mensal para trabalhadores que perderam o emprego de forma involuntária.",
            category: "Emprego & Carreira",
            steps: [
                { icon: "1️⃣", text: "Obtenha a Declaração de Situação de Desemprego (Mod. RP5005-DGSS) da sua antiga entidade empregadora." },
                { icon: "2️⃣", text: "Inscreva-se para procura de emprego no Centro de Emprego (IEFP) num prazo de 90 dias após o despedimento." },
                { icon: "3️⃣", text: "Submeta o requerimento do subsídio de desemprego no portal Segurança Social Direta ou diretamente no IEFP." },
                { icon: "4️⃣", text: "Registe o seu IBAN na Segurança Social Direta para garantir o recebimento automático dos pagamentos." }
            ],
            docs: [
                { icon: "📄", text: "Declaração Mod. RP5005-DGSS emitida pelo empregador" },
                { icon: "📋", text: "Comprovativo de inscrição para emprego no IEFP" },
                { icon: "🛂", text: "Documento de Identificação válido, NIF e NISS" },
                { icon: "🏦", text: "Comprovativo de IBAN bancário em nome do titular" }
            ],
            applyInfo: "O pedido deve ser formalizado no ato de inscrição para o emprego no portal IEFP Online ou no balcão físico do IEFP. Alternativamente, pode ser submetido online na Segurança Social Direta nas 24h seguintes.",
            links: [
                { label: "Portal IEFP Online", url: "https://iefponline.iefp.pt" },
                { label: "Segurança Social Direta", url: "https://app.seg-social.pt" }
            ]
        },
        en: {
            title: "Unemployment Benefit",
            description: "Monthly financial support for workers who have involuntarily lost their job.",
            category: "Employment & Career",
            steps: [
                { icon: "1️⃣", text: "Obtain the Declaration of Unemployment Status (Form Mod. RP5005-DGSS) from your former employer." },
                { icon: "2️⃣", text: "Register for job seeking at the Job Center (IEFP) within 90 consecutive days after your dismissal." },
                { icon: "3️⃣", text: "Submit the unemployment benefit request on the Social Security Direct portal or at the IEFP." },
                { icon: "4️⃣", text: "Register your IBAN bank details on Social Security Direct to receive payments automatically." }
            ],
            docs: [
                { icon: "📄", text: "Declaration Form Mod. RP5005-DGSS issued by the employer" },
                { icon: "📋", text: "Proof of job registration with the IEFP" },
                { icon: "🛂", text: "Valid identification document, NIF, and NISS" },
                { icon: "🏦", text: "Proof of bank account IBAN matching your name" }
            ],
            applyInfo: "The application must be formalized during your job registration on the IEFP Online portal or at a physical IEFP center. Alternatively, it can be submitted online on Social Security Direct within 24 hours.",
            links: [
                { label: "IEFP Online Portal", url: "https://iefponline.iefp.pt" },
                { label: "Social Security Direct", url: "https://app.seg-social.pt" }
            ]
        }
    }
};

export const NissWizard: React.FC<NissWizardProps> = ({ language, onBack, onSelectTemplate, onViewChange }) => {
    const [flow, setFlow] = useState<'menu' | 'niss' | 'decl_trimestral' | 'lifehacks' | 'supports'>('menu');
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

    const currentSupportData = selectedSupport ? SOCIAL_SUPPORTS[selectedSupport]?.[lang] : null;

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
                            ✦ {flow === 'menu' ? 'MENU' : flow === 'decl_trimestral' ? 'DECLARAÇÃO SS' : flow === 'lifehacks' ? 'LIFE HACKS' : flow === 'niss' ? `NISS ${step}/2` : 'APOIOS'}
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

                    
                    {/* ════ FLOW LIFE HACKS ═══════════════════════════════════════════ */}
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
                                const support = data[lang];
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
