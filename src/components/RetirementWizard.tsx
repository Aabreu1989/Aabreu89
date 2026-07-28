// src/components/RetirementWizard.tsx
import React, { useState, useMemo } from 'react';
import {
    ArrowLeft, ChevronRight, Sparkles, Calculator, ExternalLink,
    AlertTriangle, ShieldCheck, FileText, UserCheck, CreditCard,
    Calendar, Clock, ChevronDown, ChevronUp, TrendingUp, Award
} from 'lucide-react';
import { audioService } from '../services/audioService';
import { templates } from '../utils/documentsDatabase';
import { t } from '../utils/translations';

interface RetirementWizardProps {
    language: string;
    onBack: () => void;
    onSelectTemplate?: (templateId: string) => void;
}

// ════════════════════════ Step Indicator Dots ════════════════════════════════
const StepDots: React.FC<{ total: number; current: number }> = ({ total, current }) => (
    <div className="flex items-center justify-center gap-2">
        {Array.from({ length: total }).map((_, i) => (
            <div
                key={i}
                className={`rounded-full transition-all duration-500 ${
                    i + 1 === current
                        ? 'w-6 h-2 bg-amber-400 shadow-md shadow-amber-400/50'
                        : i + 1 < current
                        ? 'w-2 h-2 bg-amber-400/60'
                        : 'w-2 h-2 bg-white/20'
                }`}
            />
        ))}
    </div>
);

// ════════════════════════ Badge Pill ═════════════════════════════════════════
const BadgePill: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
        <span className="text-amber-400">{icon}</span>
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-200">{text}</span>
    </div>
);

// ════════════════════════ Accordion Card ══════════════════════════════════════
const AccordionCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, icon, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden transition-all duration-300">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                        {icon}
                    </div>
                    <span className="text-xs font-black text-slate-900 uppercase tracking-tight leading-snug">{title}</span>
                </div>
                {isOpen ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
            </button>
            {isOpen && (
                <div className="px-6 pb-6 border-t border-slate-50 text-[11px] text-slate-600 font-semibold leading-relaxed space-y-2 bg-white animate-in slide-in-from-top-2 duration-300 pt-4">
                    {children}
                </div>
            )}
        </div>
    );
};

// ════════════════════════ Translations ═══════════════════════════════════════
type Lang = 'pt' | 'br' | 'es' | 'en' | 'fr';

const TRANS: Record<Lang, Record<string, string>> = {
    pt: {
        badge: 'Reforma & Aposentadoria',
        step1_q: 'Qual é o seu perfil contributivo?',
        step1_desc: 'Selecione a opção que melhor descreve a sua situação profissional e histórico de contribuições.',
        step2_h: 'Guia Completo de Reforma',
        step2_desc: 'Pensão de Velhice da Segurança Social',
        opt_standard: 'Trabalhador Padrão',
        opt_standard_sub: 'Descontos apenas em Portugal',
        opt_expat: 'Imigrante / Trabalhador Expatriado',
        opt_expat_sub: 'Contribuições em Portugal e no estrangeiro',
        opt_long_career: 'Carreira Longa (+40 anos)',
        opt_long_career_sub: 'Reforma antecipada sem penalização',
        opt_freelance: 'Trabalhador Independente',
        opt_freelance_sub: 'Recibos Verdes / Empresário',
        req_age_title: '📅 Idade de Acesso (2025/2026)',
        req_age_desc: '• Idade normal de reforma em Portugal: 66 anos e 4 meses.\n• Com mais de 40 anos de descontos reais, pode reformar-se antes sem cortes significativos (Reforma Antecipada por Longa Carreira).',
        req_time_title: '⏳ Período de Garantia Obrigatório',
        req_time_desc: '• Mínimo de 15 anos civis com registo de remunerações (descontos) na Segurança Social.\n• Acordos Bilaterais (ex: Brasil/Portugal): pode totalizar os anos de contribuições para atingir o mínimo de 15 anos!',
        calc_title: 'Simulador de Reforma',
        calc_age: 'Idade Atual',
        calc_pt_years: 'Anos de Desconto em Portugal',
        calc_foreign_years: 'Anos de Desconto no Estrangeiro',
        calc_salary: 'Média Salarial Mensal (€)',
        calc_btn: 'Calcular Reforma',
        results_title: 'Resultado da Simulação',
        status_eligible_normal: '✅ Elegível para Reforma Normal (Sem cortes)',
        status_eligible_early: '⚠️ Elegível para Reforma Antecipada (Com cortes)',
        status_eligible_long: '🏆 Elegível por Longa Carreira (Sem cortes!)',
        status_not_eligible: '❌ Não Elegível (Abaixo do mínimo de 15 anos)',
        status_too_young: '❌ Não Elegível (Idade inferior a 60 anos)',
        ret_age_est: 'Idade de Reforma Estimada',
        monthly_pension: 'Pensão Mensal Estimada',
        how_request_title: '🏦 Como e Onde Solicitar',
        how_request_desc: 'A forma mais rápida é online através da Segurança Social Direta. O pedido entra automaticamente no sistema e é pré-aprovado em 24h (Pensão na Hora).\n🔗 Pedido Online: https://app.seg-social.pt\n→ Caminho: SS Direta → Menu "Pensões" → "Pensão de Velhice" → Seguir o assistente virtual.',
        docs_title: '📋 Documentos Obrigatórios',
        docs_desc: '• Documento de Identificação (Cartão de Cidadão / Título de Residência válido).\n• NIF (Número de Identificação Fiscal) e NISS (Segurança Social).\n• Comprovativo de IBAN (em seu nome).\n• Formulários de Ligação Internacional (ex: Formulário I/PT 1 para contar tempo de serviço no Brasil).',
        formula_title: '📊 Como é Calculada a Pensão?',
        formula_desc: 'A pensão baseia-se na média salarial de toda a carreira e nos anos totais de contribuições:\n\n[Pensão = Remuneração de Referência × Taxa de Formação × Fator de Sustentabilidade]\n\nO Fator de Sustentabilidade penaliza a reforma antecipada com base na esperança média de vida atual.',
        min_pension_title: '🛡️ Garantia de Pensão Mínima',
        min_pension_desc: 'Portugal garante uma pensão mínima com base nos anos de contribuição:\n• Menos de 15 anos: Valor mínimo indexado ao IAS.\n• 15 a 20 anos: Valor mínimo ligeiramente superior.\n• Mais de 31 anos: Pensão mínima máxima assegurada.',
        hack_work_title: '💡 Hack: Trabalhar e Receber Pensão?',
        hack_work_desc: 'Sim! Em Portugal é completamente legal trabalhar e receber salário em simultâneo com a sua pensão de velhice — sem cortes nem penalizações. Além disso, continua a descontar, o que aumenta ligeiramente o valor da reforma no ano seguinte.',
        hack_tax_title: '💡 Dica Fiscal: IRS sobre Pensões',
        hack_tax_desc: 'As pensões são consideradas rendimentos de Categoria H em sede de IRS. Se a sua pensão anual for inferior a €11.480, está isento de IRS. Se receber pensões de vários países, evite a dupla tributação registando corretamente a sua residência fiscal.',
        comparison: 'Se esperar até à idade normal de reforma:',
        back: 'Voltar',
        base_pension_label: 'Pensão Base Teórica (Sem Cortes)',
        real_pension_label: 'Pensão Mensal Real Estimada (Já Calculada com Todos os Cortes)',
        explanation_title: '📜 Detalhamento do Cálculo Real e Razão dos Cortes',
        early_penalty_reason: 'Penalização por Antecipação',
        early_penalty_desc: 'Requerida {months} meses antes da idade legal (66 anos e 4 meses). A lei aplica o corte de 0,5% por cada mês de antecipação.',
        sustainability_reason: 'Fator de Sustentabilidade 2026',
        sustainability_desc: 'Corte legal de 14,45% aplicado pela Segurança Social devido ao aumento da esperança média de vida em Portugal.',
        no_penalty_reason: 'Sem Penalizações (100% da Pensão)',
        no_penalty_desc: 'Idade legal atingida (66 anos e 4 meses) ou mais de 40 anos de descontos reais.',
        min_applied_note: 'Garantia de Pensão Mínima Ativada: O valor calculado era inferior ao limite legal, pelo que recebe a pensão mínima garantida da Segurança Social de €{min}.',
        total_cuts_label: 'Total de Descontos Aplicados:',
    },
    br: {
        badge: 'Reforma & Aposentadoria',
        step1_q: 'Qual é o seu perfil contributivo?',
        step1_desc: 'Selecione a opção que melhor descreve a sua situação profissional e histórico de contribuições.',
        step2_h: 'Guia Completo de Aposentadoria',
        step2_desc: 'Pensão de Velhice da Segurança Social Portuguesa',
        opt_standard: 'Trabalhador Padrão',
        opt_standard_sub: 'Contribuições apenas em Portugal',
        opt_expat: 'Imigrante / Brasileiro em Portugal',
        opt_expat_sub: 'Contribuições no Brasil e em Portugal',
        opt_long_career: 'Carreira Longa (+40 anos)',
        opt_long_career_sub: 'Aposentadoria antecipada sem penalidade',
        opt_freelance: 'Trabalhador Autônomo',
        opt_freelance_sub: 'Freelancer / Recibos Verdes / Empresário',
        req_age_title: '📅 Idade de Acesso (2025/2026)',
        req_age_desc: '• Idade normal de reforma em Portugal: 66 anos e 4 meses.\n• Com mais de 40 anos de contribuição real, pode se aposentar mais cedo sem cortes (Reforma Antecipada por Longa Carreira).',
        req_time_title: '⏳ Período de Garantia Obrigatório',
        req_time_desc: '• Mínimo de 15 anos civis com registro de remunerações na Seguridade Social portuguesa.\n• Acordo Brasil-Portugal: pode totalizar os anos de contribuições do Brasil para atingir o mínimo de 15 anos!',
        calc_title: 'Simulador de Aposentadoria',
        calc_age: 'Idade Atual',
        calc_pt_years: 'Anos de Contribuição em Portugal',
        calc_foreign_years: 'Anos de Contribuição no Estrangeiro (ex: Brasil)',
        calc_salary: 'Média Salarial Mensal (€)',
        calc_btn: 'Calcular Aposentadoria',
        results_title: 'Resultado da Simulação',
        status_eligible_normal: '✅ Elegível para Aposentadoria Normal (Sem cortes)',
        status_eligible_early: '⚠️ Elegível para Aposentadoria Antecipada (Com cortes)',
        status_eligible_long: '🏆 Elegível por Carreira Longa (Sem cortes!)',
        status_not_eligible: '❌ Não Elegível (Abaixo do mínimo de 15 anos)',
        status_too_young: '❌ Não Elegível (Idade inferior a 60 anos)',
        ret_age_est: 'Idade de Aposentadoria Estimada',
        monthly_pension: 'Valor Mensual Estimado da Pensão',
        how_request_title: '🏦 Como e Onde Solicitar',
        how_request_desc: 'A forma mais rápida é online pela Segurança Social Direta. O pedido é processado automaticamente e pré-aprovado em 24h (Pensão na Hora).\n🔗 Pedido Online: https://app.seg-social.pt\n→ Caminho: SS Direta → Menu "Pensões" → "Pensão de Velhice" → Siga o assistente.',
        docs_title: '📋 Documentos Obrigatórios',
        docs_desc: '• Documento de Identificação (Cartão de Cidadão / Título de Residência válido).\n• NIF (Número de Identificação Fiscal) e NISS (Número de Identificação da Seguridade Social).\n• Comprovante de IBAN (em seu nome).\n• Formulário I/PT 1 (para totalizar os anos de contribuição no Brasil).',
        formula_title: '📊 Como é Calculada a Pensão?',
        formula_desc: 'A pensão é baseada na média salarial de toda a carreira e no total de anos de contribuição:\n\n[Pensão = Remuneração de Referência × Taxa de Formação × Fator de Sustentabilidade]\n\nO Fator de Sustentabilidade penaliza a aposentadoria antecipada com base na expectativa de vida atual.',
        min_pension_title: '🛡️ Garantia de Pensão Mínima',
        min_pension_desc: 'Portugal garante uma pensão mínima com base nos anos de contribuição:\n• Menos de 15 anos: Valor mínimo indexado ao IAS.\n• 15 a 20 anos: Valor mínimo ligeiramente superior.\n• Mais de 31 anos: Pensão mínima máxima assegurada.',
        hack_work_title: '💡 Hack: Trabalhar e Receber Pensão?',
        hack_work_desc: 'Sim! Em Portugal é totalmente legal trabalhar e receber salário ao mesmo tempo que recebe a pensão de velhice — sem cortes nem penalidades. Além disso, você continua contribuindo, o que aumenta ligeiramente o valor da aposentadoria no ano seguinte.',
        hack_tax_title: '💡 Dica Fiscal: Imposto sobre Pensões',
        hack_tax_desc: 'As pensões são tributadas como rendimentos de Categoria H no IRS. Se a sua pensão anual for inferior a €11.480, você está isento de IRS. Se receber pensões de vários países, evite a dupla tributação registrando corretamente a sua residência fiscal.',
        comparison: 'Se esperar até à idade normal de aposentadoria:',
        back: 'Voltar',
        base_pension_label: 'Pensão Base Teórica (Sem Cortes)',
        real_pension_label: 'Valor Mensal Real Estimado da Aposentadoria (Já Calculado com Todos os Cortes)',
        explanation_title: '📜 Detalhamento do Cálculo Real e Razão das Penalidades',
        early_penalty_reason: 'Penalidade por Antecipação',
        early_penalty_desc: 'Requerida {months} meses antes da idade legal (66 anos e 4 meses). Aplicação do corte legal de 0,5% por cada mês antecipado.',
        sustainability_reason: 'Fator de Sustentabilidade 2026',
        sustainability_desc: 'Desconto legal de 14,45% aplicado pela Seguridade Social relativo à expectativa de vida em Portugal.',
        no_penalty_reason: 'Sem Penalidades (100% do Valor)',
        no_penalty_desc: 'Idade legal atingida (66 anos e 4 meses) ou mais de 40 anos de contribuição.',
        min_applied_note: 'Garantia de Pensão Mínima Ativada: Valor ajustado para o piso mínimo da Seguridade Social de €{min}.',
        total_cuts_label: 'Total de Descontos Aplicados:',
    },
    es: {
        badge: 'Jubilación y Pensión',
        step1_q: '¿Cuál es su perfil contributivo?',
        step1_desc: 'Seleccione la opción que mejor describe su situación profesional e historial de cotizaciones.',
        step2_h: 'Guía Completa de Jubilación',
        step2_desc: 'Pensión de Vejez de la Seguridad Social',
        opt_standard: 'Trabajador Estándar',
        opt_standard_sub: 'Cotizaciones solo en Portugal',
        opt_expat: 'Inmigrante / Trabajador Expatriado',
        opt_expat_sub: 'Cotizaciones en Portugal y en el extranjero',
        opt_long_career: 'Carrera Larga (+40 años)',
        opt_long_career_sub: 'Jubilación anticipada sin penalización',
        opt_freelance: 'Trabajador Autónomo',
        opt_freelance_sub: 'Recibos Verdes / Empresario',
        req_age_title: '📅 Edad de Acceso (2025/2026)',
        req_age_desc: '• Edad normal de jubilación en Portugal: 66 años y 4 meses.\n• Con más de 40 años de cotizaciones reales, puede jubilarse antes sin recortes graves (Jubilación Anticipada por Larga Carrera).',
        req_time_title: '⏳ Período de Garantía Obligatorio',
        req_time_desc: '• Mínimo de 15 años civiles con registro de cotizaciones en la Seguridad Social.\n• Convenios Bilaterales (ej: América Latina/España/Portugal): puede sumar los años de cotizaciones para alcanzar el mínimo de 15 años.',
        calc_title: 'Simulador de Jubilación',
        calc_age: 'Edad Actual',
        calc_pt_years: 'Años de Cotización en Portugal',
        calc_foreign_years: 'Años de Cotización en el Extranjero',
        calc_salary: 'Promedio Salarial Mensual (€)',
        calc_btn: 'Calcular Jubilación',
        results_title: 'Resultado de la Simulación',
        status_eligible_normal: '✅ Elegible para Jubilación Normal (Sin recortes)',
        status_eligible_early: '⚠️ Elegible para Jubilación Anticipada (Con recortes)',
        status_eligible_long: '🏆 Elegible por Larga Carrera (¡Sin recortes!)',
        status_not_eligible: '❌ No Elegible (Menos del mínimo de 15 años)',
        status_too_young: '❌ No Elegible (Edad inferior a 60 años)',
        ret_age_est: 'Edad de Jubilación Estimada',
        monthly_pension: 'Valor Mensual Estimado',
        how_request_title: '🏦 Cómo y Dónde Solicitar',
        how_request_desc: 'La vía más rápida es online en la Seguridad Social Direta. La solicitud se procesa automáticamente y se preaprueba en 24h (Pensão na Hora).\n🔗 Solicitud Online: https://app.seg-social.pt\n→ Camino: SS Direta → Menú "Pensões" → "Pensão de Velhice" → Seguir el asistente virtual.',
        docs_title: '📋 Documentos Obligatorios',
        docs_desc: '• Documento de Identidad (Carta de Cidadão / Título de Residencia válido).\n• NIF (Número Fiscal) y NISS (Seguridad Social).\n• Comprobante de IBAN (a su nombre).\n• Formularios de Enlace Internacional (para validar años trabajados en el extranjero).',
        formula_title: '📊 ¿Cómo se Calcula la Pensión?',
        formula_desc: 'La pensión se basa en el promedio de salarios de toda la carrera y en los años totales de cotización:\n\n[Pensión = Remuneración de Referencia × Tasa de Formación × Factor de Sostenibilidad]\n\nEl Factor de Sostenibilidad penaliza la jubilación anticipada en base a la esperanza media de vida.',
        min_pension_title: '🛡️ Garantía de Pensión Mínima',
        min_pension_desc: 'Portugal garantiza una pensión mínima en función de los años aportados:\n• Menos de 15 años: Valor mínimo indexado al IAS.\n• 15 a 20 años: Valor mínimo ligeramente superior.\n• Más de 31 años: Pensión mínima máxima asegurada.',
        hack_work_title: '💡 Hack: ¿Trabajar y Recibir Pensión?',
        hack_work_desc: '¡Sí! En Portugal es completamente legal trabajar y recibir salario simultáneamente con su pensión de vejez — sin recortes ni penalizaciones. Además, continúa cotizando, lo que aumenta ligeramente la pensión al año siguiente.',
        hack_tax_title: '💡 Consejo Fiscal: Impuesto sobre Pensiones',
        hack_tax_desc: 'Las pensiones se gravan como rendimientos de Categoría H en el IRPF portugués. Si su pensión anual es inferior a €11.480, está exento. Si recibe pensiones de varios países, evite la doble imposición registrando correctamente su residencia fiscal.',
        comparison: 'Si espera hasta la edad normal de jubilación:',
        back: 'Volver',
        base_pension_label: 'Pensión Base Teórica (Sin Recortes)',
        real_pension_label: 'Pensión Mensual Real Estimada (Ya Calculada con Todos los Recortes)',
        explanation_title: '📜 Desglose del Cálculo Real y Razón de Penalizaciones',
        early_penalty_reason: 'Penalización por Anticipación',
        early_penalty_desc: 'Solicitada {months} meses antes de la edad legal (66 años y 4 meses). Recorte legal del 0.5% por mes anticipado.',
        sustainability_reason: 'Factor de Sostenibilidad 2026',
        sustainability_desc: 'Deducción legal del 14.45% aplicada por la Seguridad Social según la esperanza de vida en Portugal.',
        no_penalty_reason: 'Sin Penalizaciones (100% de la Pensión)',
        no_penalty_desc: 'Edad legal alcanzada (66 años y 4 meses) o más de 40 años cotizados.',
        min_applied_note: 'Garantía de Pensión Mínima Activada: Se asegura la pensión mínima legal de €{min}.',
        total_cuts_label: 'Total de Descuentos Aplicados:',
    },
    en: {
        badge: 'Retirement & Pension',
        step1_q: 'What is your contribution profile?',
        step1_desc: 'Select the option that best describes your professional situation and contribution history.',
        step2_h: 'Full Retirement Guide',
        step2_desc: 'Social Security Old-Age Pension',
        opt_standard: 'Standard Worker',
        opt_standard_sub: 'Contributions only in Portugal',
        opt_expat: 'Immigrant / Expat Worker',
        opt_expat_sub: 'Contributions in Portugal and abroad',
        opt_long_career: 'Long Career (+40 years)',
        opt_long_career_sub: 'Early retirement without penalty',
        opt_freelance: 'Self-Employed / Freelancer',
        opt_freelance_sub: 'Green Receipts / Entrepreneur',
        req_age_title: '📅 Access Age (2025/2026)',
        req_age_desc: '• Normal retirement age in Portugal: 66 years and 4 months.\n• With more than 40 years of actual contributions, you can retire earlier without major penalties (Early Retirement for Long Career).',
        req_time_title: '⏳ Mandatory Contribution Period',
        req_time_desc: '• Minimum of 15 calendar years with registered contributions to Social Security.\n• Bilateral Agreements (e.g., US, UK, Brazil): you can combine contribution years to reach the 15-year minimum!',
        calc_title: 'Retirement Simulator',
        calc_age: 'Current Age',
        calc_pt_years: 'Years of Contributions in Portugal',
        calc_foreign_years: 'Years of Contributions Abroad',
        calc_salary: 'Average Monthly Salary (€)',
        calc_btn: 'Calculate Retirement',
        results_title: 'Simulation Results',
        status_eligible_normal: '✅ Eligible for Normal Retirement (No cuts)',
        status_eligible_early: '⚠️ Eligible for Early Retirement (With cuts)',
        status_eligible_long: '🏆 Eligible by Long Career (No cuts!)',
        status_not_eligible: '❌ Not Eligible (Below 15-year minimum)',
        status_too_young: '❌ Not Eligible (Age below 60)',
        ret_age_est: 'Estimated Retirement Age',
        monthly_pension: 'Estimated Monthly Pension',
        how_request_title: '🏦 How and Where to Apply',
        how_request_desc: 'The fastest way is online via Segurança Social Direta. Applications are processed automatically and pre-approved in 24h (Pensão na Hora).\n🔗 Online Application: https://app.seg-social.pt\n→ Path: SS Direta → "Pensões" Menu → "Pensão de Velhice" → Follow the step-by-step wizard.',
        docs_title: '📋 Required Documents',
        docs_desc: '• Identification Document (Citizen Card / valid Residence Permit).\n• NIF (Tax Number) and NISS (Social Security Number).\n• Proof of IBAN (must be in your name).\n• International Link Forms (e.g., to count work years abroad).',
        formula_title: '📊 How Is the Pension Calculated?',
        formula_desc: 'The pension is based on the average salary of your entire career and total years of contributions:\n\n[Pension = Reference Earnings × Accrual Rate × Sustainability Factor]\n\nThe Sustainability Factor penalizes early retirement based on average life expectancy.',
        min_pension_title: '🛡️ Minimum Pension Guarantee',
        min_pension_desc: 'Portugal guarantees a minimum pension based on your years of contributions:\n• Under 15 years: Minimum value indexed to IAS.\n• 15 to 20 years: Slightly higher minimum.\n• Over 31 years: Maximum national minimum pension assured.',
        hack_work_title: '💡 Hack: Work While Retired?',
        hack_work_desc: 'Yes! In Portugal it is completely legal to work and receive a salary while simultaneously receiving your old-age pension — no cuts or penalties. You also continue contributing, which slightly increases your pension the following year.',
        hack_tax_title: '💡 Tax Tip: IRS on Pensions',
        hack_tax_desc: 'Pensions are taxed as Category H income in Portugal. If your annual pension is below €11,480, you are tax-exempt. If you receive pensions from multiple countries, prevent double taxation by correctly registering your tax residency.',
        comparison: 'If you wait until normal retirement age:',
        back: 'Back',
        base_pension_label: 'Theoretical Base Pension (Uncut)',
        real_pension_label: 'Estimated Real Monthly Pension (Fully Calculated with All Deductions)',
        explanation_title: '📜 Calculation Breakdown & Penalty Rationale',
        early_penalty_reason: 'Early Retirement Penalty',
        early_penalty_desc: 'Requested {months} months prior to legal age (66 years & 4 months). Statutory 0.5% deduction per month early.',
        sustainability_reason: '2026 Sustainability Factor',
        sustainability_desc: 'Statutory 14.45% deduction applied by Social Security based on life expectancy in Portugal.',
        no_penalty_reason: 'No Penalties Applied (100% Pension)',
        no_penalty_desc: 'Legal retirement age reached (66 years & 4 months) or 40+ contribution years.',
        min_applied_note: 'Minimum Pension Guarantee Activated: Adjusted to Social Security minimum threshold of €{min}.',
        total_cuts_label: 'Total Deductions Applied:',
    },
    fr: {
        badge: 'Retraite & Pension',
        step1_q: 'Quel est votre profil de cotisant?',
        step1_desc: 'Sélectionnez l\'option qui décrit le mieux votre situation professionnelle et votre historique de cotisations.',
        step2_h: 'Guide Complet de Retraite',
        step2_desc: 'Pension de Vieillesse de la Sécurité Sociale',
        opt_standard: 'Travailleur Standard',
        opt_standard_sub: 'Cotisations uniquement au Portugal',
        opt_expat: 'Immigré / Travailleur Expatrié',
        opt_expat_sub: 'Cotisations au Portugal et à l\'étranger',
        opt_long_career: 'Carrière Longue (+40 ans)',
        opt_long_career_sub: 'Retraite anticipée sans pénalité',
        opt_freelance: 'Travailleur Indépendant',
        opt_freelance_sub: 'Reçus Verts / Entrepreneur',
        req_age_title: '📅 Âge d\'Accès (2025/2026)',
        req_age_desc: '• Âge légal de retraite au Portugal: 66 ans et 4 mois.\n• Avec plus de 40 ans de cotisations réelles, vous pouvez partir plus tôt sans décote majeure (Retraite Anticipée pour Carrière Longue).',
        req_time_title: '⏳ Durée de Cotisation Obligatoire',
        req_time_desc: '• Minimum de 15 années civiles de cotisations enregistrées à la Sécurité Sociale.\n• Accords Bilatéraux (ex: France/Portugal, UE): vous pouvez cumuler les années de cotisations pour atteindre le minimum de 15 ans!',
        calc_title: 'Simulateur de Retraite',
        calc_age: 'Âge Actuel',
        calc_pt_years: 'Années de Cotisation au Portugal',
        calc_foreign_years: 'Années de Cotisation à l\'Étranger',
        calc_salary: 'Salaire Mensuel Moyen (€)',
        calc_btn: 'Calculer la Retraite',
        results_title: 'Résultat de la Simulation',
        status_eligible_normal: '✅ Éligible à la Retraite Normale (Sans décote)',
        status_eligible_early: '⚠️ Éligible à la Retraite Anticipée (Avec décote)',
        status_eligible_long: '🏆 Éligible par Carrière Longue (Sans décote!)',
        status_not_eligible: '❌ Non Éligible (Moins de 15 ans de cotisation)',
        status_too_young: '❌ Non Éligible (Âge inférieur à 60 ans)',
        ret_age_est: 'Âge Estimé de Départ en Retraite',
        monthly_pension: 'Pension Mensuelle Estimée',
        how_request_title: '🏦 Comment et Où Demander',
        how_request_desc: 'Le moyen le plus rapide est en ligne via Segurança Social Direta. La demande est pré-approuvée en 24h (Pensão na Hora).\n🔗 Demande en Ligne: https://app.seg-social.pt\n→ Chemin: SS Direta → Menu "Pensões" → "Pensão de Velhice".',
        docs_title: '📋 Documents Obligatoires',
        docs_desc: '• Document d\'Identité (Carte de Séjour / Carte d\'Identité valide).\n• NIF (Numéro Fiscal) et NISS (Sécurité Sociale).\n• Justificatif de RIB/IBAN (à votre nom).\n• Formulaires de Liaison Internationale (ex: Formulaire E205 / UE pour valider les années travaillées à l\'étranger).',
        formula_title: '📊 Comment la Pension est-elle Calculée?',
        formula_desc: 'La pension est basée sur le salaire moyen de toute la carrière et le total des années de cotisation:\n\n[Pension = Rémunération de Référence × Taux d\'Accumulation × Facteur de Durabilité]\n\nLe Facteur de Durabilité applique une décote selon l\'espérance de vie actuelle.',
        min_pension_title: '🛡️ Garantie de Pension Minimale',
        min_pension_desc: 'Le Portugal garantit une pension minimale selon les années cotisées:\n• Moins de 15 ans: Valeur minimale indexée sur l\'IAS.\n• 15 à 20 ans: Valeur minimale légèrement supérieure.\n• Plus de 31 ans: Pension minimale maximale garantie.',
        hack_work_title: '💡 Hack: Travailler et Toucher sa Retraite?',
        hack_work_desc: 'Oui! Au Portugal, il est totalement légal de travailler et de percevoir un salaire tout en cumulant sa pension de vieillesse — sans coupes ni pénalités. De plus, vous continuez à cotiser, ce qui augmente légèrement le montant l\'année suivante.',
        hack_tax_title: '💡 Conseil Fiscal: Impôt sur les Pensions',
        hack_tax_desc: 'Les pensions sont imposées comme revenus de Catégorie H dans l\'IRS. Si votre pension annuelle est inférieure à 11.480 €, vous êtes exonéré d\'impôt. En cas de pensions de plusieurs pays, évitez la double imposition en enregistrant correctement votre résidence fiscale.',
        comparison: 'Si vous attendez l\'âge légal de retraite:',
        back: 'Retour',
        base_pension_label: 'Pension de Base Théorique (Sans Décote)',
        real_pension_label: 'Pension Mensuelle Réelle Estimée (Calculée avec Déductions)',
        explanation_title: '📜 Détail du Calcul Réel et Raison des Pénalités',
        early_penalty_reason: 'Pénalité pour Anticipation',
        early_penalty_desc: 'Demandée {months} mois avant l\'âge légal (66 ans et 4 mois). Réduction légale de 0.5% par mois anticipé.',
        sustainability_reason: 'Facteur de Durabilité 2026',
        sustainability_desc: 'Déduction légale de 14.45% appliquée par la Sécurité Sociale selon l\'espérance de vie au Portugal.',
        no_penalty_reason: 'Sans Pénalités (100% de la Pension)',
        no_penalty_desc: 'Âge légal atteint (66 ans et 4 mois) ou plus de 40 ans de cotisations.',
        min_applied_note: 'Garantie de Pension Minimale Activée: Ajusté au seuil minimum légal de la Sécurité Sociale de €{min}.',
        total_cuts_label: 'Total des Déductions Appliquées:',
    }
};

// ════════════════════════ Calculator Logic ════════════════════════════════════
type Profile = 'standard' | 'expat' | 'long_career' | 'freelance';

function calcPension(age: number, ptYears: number, foreignYears: number, salary: number, profile: Profile) {
    const totalYears = ptYears + foreignYears;
    const legalAge = 66 + 4 / 12;
    const normalRetirementAge = `${66} anos e 4 meses`;

    const emptyRes = {
        normalRetirementAge,
        isEligible: false,
        basePension: '0.00',
        monthlyPension: '0.00',
        projectedPension: '0.00',
        accrualRate: '0%',
        sustainabilityCut: '0%',
        anticipationCut: '0%',
        bonusRate: '0%',
        ageDiffMonths: 0,
        minPensionGuaranteed: '0.00',
        sustainabilityCutEuros: '0.00',
        anticipationCutEuros: '0.00',
        totalCutEuros: '0.00',
        bonusEuros: '0.00',
        isMinApplied: false
    };

    if (totalYears < 15) return { status: 'not_eligible' as const, ...emptyRes };
    if (age < 60 && profile !== 'long_career') return { status: 'too_young' as const, ...emptyRes };

    const isLongCareer = ptYears >= 40 || profile === 'long_career';
    let status: 'eligible_normal' | 'eligible_early' | 'eligible_long';
    let accrualPct: number;

    if (totalYears <= 20) accrualPct = 2.3;
    else if (totalYears <= 30) accrualPct = 2.25;
    else if (totalYears <= 40) accrualPct = 2.0;
    else accrualPct = 2.3;

    const referenceEarnings = salary;
    let basePensionVal = referenceEarnings * (accrualPct / 100) * ptYears;

    // Pro-rata for expat
    if (profile === 'expat' && foreignYears > 0) {
        basePensionVal = basePensionVal * (ptYears / totalYears);
    }

    let sustainabilityCutPct = 0;
    let anticipationCutPct = 0;
    let bonusPct = 0;

    const monthsBeforeLegal = Math.max(0, (legalAge - age) * 12);
    const monthsAfterLegal = Math.max(0, (age - legalAge) * 12);

    if (isLongCareer) {
        status = 'eligible_long';
    } else if (age >= legalAge) {
        status = 'eligible_normal';
        bonusPct = Math.floor(monthsAfterLegal) * (1 / 14);
    } else {
        status = 'eligible_early';
        sustainabilityCutPct = 14.45;
        anticipationCutPct = Math.min(60, Math.floor(monthsBeforeLegal) * 0.5);
    }

    const sustainabilityFactor = 1 - sustainabilityCutPct / 100;
    const anticipationFactor = 1 - anticipationCutPct / 100;
    const bonusFactor = 1 + bonusPct / 100;

    const afterSustainability = basePensionVal * sustainabilityFactor;
    const sustainabilityCutVal = basePensionVal - afterSustainability;
    const calculatedPensionVal = afterSustainability * anticipationFactor * bonusFactor;
    const anticipationCutVal = afterSustainability - (afterSustainability * anticipationFactor);
    const bonusVal = (afterSustainability * anticipationFactor * bonusFactor) - (afterSustainability * anticipationFactor);

    let finalPension = calculatedPensionVal;

    // Minimums from IAS
    const minPension = ptYears >= 31 ? 509.26 : ptYears >= 20 ? 462.06 : 438.81;
    const minPensionGuaranteed = minPension.toFixed(2);
    const isMinApplied = finalPension < minPension && ptYears >= 15;
    if (isMinApplied) finalPension = minPension;

    // Projected if waited until 66.33
    const projectedPension = (referenceEarnings * (accrualPct / 100) * ptYears).toFixed(2);

    return {
        status,
        normalRetirementAge,
        isEligible: true,
        basePension: basePensionVal.toFixed(2),
        monthlyPension: finalPension.toFixed(2),
        projectedPension,
        accrualRate: `${accrualPct.toFixed(2)}%`,
        sustainabilityCut: `${sustainabilityCutPct.toFixed(2)}%`,
        anticipationCut: `${anticipationCutPct.toFixed(2)}%`,
        bonusRate: `${bonusPct.toFixed(2)}%`,
        ageDiffMonths: Math.ceil(monthsBeforeLegal),
        minPensionGuaranteed,
        sustainabilityCutEuros: sustainabilityCutVal.toFixed(2),
        anticipationCutEuros: anticipationCutVal.toFixed(2),
        totalCutEuros: (basePensionVal - calculatedPensionVal).toFixed(2),
        bonusEuros: bonusVal.toFixed(2),
        isMinApplied
    };
}

// ════════════════════════ Main Component ══════════════════════════════════════
export const RetirementWizard: React.FC<RetirementWizardProps> = ({ language, onBack, onSelectTemplate }) => {
    const [step, setStep] = useState(1);
    const [profile, setProfile] = useState<Profile | null>(null);

    // Calculator state
    const [age, setAge] = useState(55);
    const [ptYears, setPtYears] = useState(15);
    const [foreignYears, setForeignYears] = useState(0);
    const [salary, setSalary] = useState(1000);
    const [showResults, setShowResults] = useState(false);

    const rawLang = language?.toLowerCase() || 'pt';
    const lang: Lang = rawLang === 'br' ? 'br' : rawLang === 'es' ? 'es' : rawLang === 'en' ? 'en' : rawLang === 'fr' ? 'fr' : 'pt';
    const tr = TRANS[lang];

    const handleProfileSelect = (p: Profile) => {
        audioService.playClick();
        setProfile(p);
        setStep(2);
    };

    const handleBack = () => {
        if (step > 1) { setStep(1); setShowResults(false); }
        else onBack();
    };

    const results = useMemo(() => {
        if (!profile) return null;
        return calcPension(age, ptYears, foreignYears, salary, profile);
    }, [age, ptYears, foreignYears, salary, profile]);

    const profiles: { id: Profile; emoji: string; label: string; sub: string }[] = [
        { id: 'standard',    emoji: '🧑‍💼', label: tr.opt_standard,    sub: tr.opt_standard_sub },
        { id: 'expat',       emoji: '🌍', label: tr.opt_expat,       sub: tr.opt_expat_sub },
        { id: 'long_career', emoji: '🏆', label: tr.opt_long_career, sub: tr.opt_long_career_sub },
        { id: 'freelance',   emoji: '💻', label: tr.opt_freelance,   sub: tr.opt_freelance_sub },
    ];

    return (
        <div className="flex flex-col h-full min-h-0 bg-slate-950 overflow-hidden">

            {/* ══ STICKY HERO BANNER ══════════════════════════════════════════ */}
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-b from-slate-950 via-amber-950/20 to-slate-950 px-6 pt-5 pb-8 border-b border-white/5">
                {/* Background blobs */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[90px] -mr-32 -mt-32 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-500/10 rounded-full blur-[80px] -ml-24 -mb-24 pointer-events-none" />

                {/* Header Nav Row */}
                <div className="relative z-10 flex items-center justify-between mb-8">
                    <button
                        onClick={handleBack}
                        className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center border border-white/10 active:scale-90 transition-all hover:bg-white/20"
                    >
                        <ArrowLeft size={16} />
                    </button>

                    <StepDots total={2} current={step} />

                    <div className="flex items-center gap-1">
                        <Sparkles size={12} className="text-amber-400 animate-pulse" />
                        <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                            🎯 {step}/2
                        </span>
                    </div>
                </div>

                {/* Hero Title & Description */}
                <div className="relative z-10 space-y-4">
                    <div className="flex justify-between items-start">
                        <BadgePill
                            icon={<Award size={10} />}
                            text={tr.badge}
                        />
                    </div>

                    {step === 1 ? (
                        <div className="animate-in slide-in-from-bottom-2 duration-400">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">
                                {tr.step1_q}
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                {tr.step1_desc}
                            </p>
                        </div>
                    ) : (
                        <div className="animate-in slide-in-from-bottom-2 duration-400">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">
                                {tr.step2_h}
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                {tr.step2_desc}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* ══ SCROLLABLE BODY ═════════════════════════════════════════════ */}
            <div 
                className="flex-1 min-h-0 overflow-y-auto bg-slate-50" 
                style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
            >
                <div className="p-5 space-y-5 pb-36">

                    {/* ──── STEP 1: Profile Selection ──── */}
                    {step === 1 && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                            {profiles.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => handleProfileSelect(p.id)}
                                    className="group w-full bg-white border border-slate-100 rounded-[2.25rem] p-5 flex items-center gap-4 text-left transition-all duration-500 hover:border-amber-400/30 hover:shadow-2xl hover:shadow-amber-500/5 active:scale-[0.97]"
                                >
                                    <div className="relative w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 group-hover:bg-white transition-all duration-500">
                                        {p.emoji}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider border rounded-full bg-amber-500/10 text-amber-600 border-amber-500/20">
                                                {p.id === 'expat' ? (lang === 'en' ? 'BILATERAL AGREEMENT' : lang === 'es' ? 'CONVENIO' : 'ACORDO BILATERAL') : p.id === 'long_career' ? (lang === 'en' ? 'EARLY RETIREMENT' : lang === 'es' ? 'ANTICIP.' : 'ANTECIPADA') : p.id === 'freelance' ? (lang === 'en' ? 'SELF-EMPLOYED' : lang === 'es' ? 'AUTÓNOMO' : 'INDEPENDENTE') : (lang === 'en' ? 'STANDARD' : lang === 'es' ? 'ESTÁNDAR' : 'PADRÃO')}
                                            </span>
                                        </div>
                                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight leading-tight group-hover:text-slate-950 transition-colors">
                                            {p.label}
                                        </h4>
                                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5 leading-tight">
                                            {p.sub}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all duration-300 shrink-0">
                                        <ChevronRight size={14} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* ──── STEP 2: Full Content ──── */}
                    {step === 2 && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">

                            {/* Requirements */}
                            <AccordionCard title={tr.req_age_title} icon={<Calendar size={15} />} defaultOpen={true}>
                                {(tr.req_age_desc || '').split('\n').map((line, i) => <p key={i} className="mb-1 last:mb-0">{line}</p>)}
                            </AccordionCard>
                            <AccordionCard title={tr.req_time_title} icon={<Clock size={15} />} defaultOpen={true}>
                                {(tr.req_time_desc || '').split('\n').map((line, i) => <p key={i} className="mb-1 last:mb-0">{line}</p>)}
                            </AccordionCard>

                            <div className="h-px bg-slate-200/70 my-4" />

                            {/* Calculator */}
                            <div className="bg-slate-900 rounded-[2rem] p-5 space-y-5 shadow-lg">
                                <div className="flex items-center gap-2.5 mb-1">
                                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                                        <Calculator size={15} />
                                    </div>
                                    <span className="text-xs font-black text-white uppercase tracking-tight">{tr.calc_title}</span>
                                </div>

                                {/* Inputs */}
                                {[
                                    { label: tr.calc_age, value: age, min: 18, max: 80, setter: setAge },
                                    { label: tr.calc_pt_years, value: ptYears, min: 0, max: 50, setter: setPtYears },
                                    { label: tr.calc_foreign_years, value: foreignYears, min: 0, max: 50, setter: setForeignYears },
                                ].map(({ label, value, min, max, setter }) => (
                                    <div key={label}>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label}</label>
                                            <span className="text-sm font-black text-amber-400">{value}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min={min} max={max} value={value}
                                            onChange={e => { e.stopPropagation(); setter(Number(e.target.value)); }}
                                            className="w-full h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-amber-400"
                                        />
                                    </div>
                                ))}

                                {/* Salary input */}
                                <div>
                                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">{tr.calc_salary}</label>
                                    <div className="flex items-center bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                                        <span className="px-4 py-3 text-amber-400 font-black text-sm border-r border-slate-700">€</span>
                                        <input
                                            type="number"
                                            value={salary}
                                            onChange={e => setSalary(Number(e.target.value))}
                                            className="flex-1 bg-transparent px-4 py-3 text-white font-bold text-sm outline-none"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowResults(true); }}
                                    type="button"
                                    className="w-full py-3.5 bg-amber-500 text-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-amber-400 transition-all active:scale-95 shadow-lg shadow-amber-500/20"
                                >
                                    {tr.calc_btn}
                                </button>

                                {/* Results */}
                                {showResults && results && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="h-px bg-white/10" />
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{tr.results_title}</p>

                                        <div className={`p-4 rounded-2xl text-[11px] font-bold leading-relaxed border ${
                                            results.status === 'eligible_long' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                                            : results.status === 'eligible_normal' ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                                            : results.status === 'eligible_early' ? 'bg-orange-500/10 border-orange-500/20 text-orange-300'
                                            : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                                        }`}>
                                            {results.status === 'eligible_normal' && tr.status_eligible_normal}
                                            {results.status === 'eligible_early' && tr.status_eligible_early}
                                            {results.status === 'eligible_long' && tr.status_eligible_long}
                                            {results.status === 'not_eligible' && tr.status_not_eligible}
                                            {results.status === 'too_young' && tr.status_too_young}
                                        </div>

                                        {results.isEligible && (
                                            <div className="bg-slate-800/90 rounded-2xl p-5 space-y-4 text-[11px] border border-white/5">
                                                {/* Pensão Líquida / Real Destacada */}
                                                <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-500/40 rounded-2xl p-5 text-center shadow-lg">
                                                    <span className="text-[9px] font-black uppercase text-amber-300 tracking-widest block mb-1">
                                                        {tr.real_pension_label}
                                                    </span>
                                                    <span className="text-3xl sm:text-4xl font-black text-amber-400 tracking-tight">
                                                        €{parseFloat(results.monthlyPension).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                                                    </span>
                                                    <span className="text-[10px] font-extrabold text-slate-300 block mt-1">
                                                        {lang === 'en' ? '/ month' : lang === 'es' ? '/ mes' : '/ mês'}
                                                    </span>
                                                </div>

                                                {/* Detalhamento Passo a Passo */}
                                                <div className="space-y-3 pt-2">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-white/10 pb-2">
                                                        {tr.explanation_title}
                                                    </p>

                                                    <div className="flex justify-between text-slate-400">
                                                        <span>{tr.ret_age_est}:</span>
                                                        <span className="text-white font-extrabold">{results.normalRetirementAge}</span>
                                                    </div>

                                                    <div className="flex justify-between text-slate-400">
                                                        <span>{tr.calc_salary}:</span>
                                                        <span className="text-white font-extrabold">€{salary.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</span>
                                                    </div>

                                                    <div className="flex justify-between text-slate-400">
                                                        <span>{tr.base_pension_label}:</span>
                                                        <span className="text-white font-extrabold">€{parseFloat(results.basePension).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</span>
                                                    </div>

                                                    <div className="flex justify-between text-slate-400">
                                                        <span>{lang === 'en' ? 'Accrual Rate' : lang === 'es' ? 'Tasa Formación' : 'Taxa Formação'}:</span>
                                                        <span className="text-white font-bold">{results.accrualRate} ({ptYears} {lang === 'en' ? 'years' : 'anos'})</span>
                                                    </div>

                                                    {results.status === 'eligible_early' && (
                                                        <div className="space-y-2.5 pt-2 border-t border-white/10">
                                                            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-1">
                                                                <div className="flex justify-between text-rose-300 font-bold text-xs">
                                                                    <span>⚠️ {tr.early_penalty_reason} (-{results.anticipationCut}):</span>
                                                                    <span>-€{parseFloat(results.anticipationCutEuros).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</span>
                                                                </div>
                                                                <p className="text-[9.5px] text-rose-200/80 leading-normal">
                                                                    {tr.early_penalty_desc.replace('{months}', String(results.ageDiffMonths))}
                                                                </p>
                                                            </div>

                                                            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-1">
                                                                <div className="flex justify-between text-rose-300 font-bold text-xs">
                                                                    <span>📉 {tr.sustainability_reason} (-{results.sustainabilityCut}):</span>
                                                                    <span>-€{parseFloat(results.sustainabilityCutEuros).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</span>
                                                                </div>
                                                                <p className="text-[9.5px] text-rose-200/80 leading-normal">
                                                                    {tr.sustainability_desc}
                                                                </p>
                                                            </div>

                                                            <div className="flex justify-between text-rose-400 font-extrabold text-[11px] pt-1">
                                                                <span>{tr.total_cuts_label}</span>
                                                                <span>-€{parseFloat(results.totalCutEuros).toLocaleString('pt-PT', { minimumFractionDigits: 2 })} / mês</span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {(results.status === 'eligible_normal' || results.status === 'eligible_long') && (
                                                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1 mt-2">
                                                            <div className="text-emerald-300 font-bold text-xs">
                                                                ✅ {tr.no_penalty_reason}
                                                            </div>
                                                            <p className="text-[9.5px] text-emerald-200/80 leading-normal">
                                                                {tr.no_penalty_desc}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {results.isMinApplied && (
                                                        <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-[9.5px] text-cyan-200 leading-normal">
                                                            {tr.min_applied_note.replace('{min}', results.minPensionGuaranteed)}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {results.status === 'eligible_early' && (
                                            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-[10px] text-amber-300 font-semibold leading-relaxed flex items-start gap-2">
                                                <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-400" />
                                                <span>{tr.comparison} <strong className="text-white">€{parseFloat(results.projectedPension).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}/mês</strong> (+{results.ageDiffMonths} meses).</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="h-px bg-slate-200/70 my-4" />

                            {/* How to apply */}
                            <AccordionCard title={tr.how_request_title} icon={<ExternalLink size={15} />} defaultOpen={false}>
                                {(tr.how_request_desc || '').split('\n').map((line, i) => {
                                    if (line.startsWith('🔗')) {
                                        const url = line.replace(/^🔗 \S+ /, '').trim();
                                        return (
                                            <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white rounded-2xl hover:bg-amber-600 transition-colors font-bold uppercase tracking-widest text-[10px] my-2 shadow-sm">
                                                <ExternalLink size={11} /> {lang === 'en' ? 'Apply Online' : lang === 'es' ? 'Solicitar Online' : 'Solicitar Online'}
                                            </a>
                                        );
                                    }
                                    return <p key={i} className="mb-1 last:mb-0">{line}</p>;
                                })}
                            </AccordionCard>

                            <AccordionCard title={tr.docs_title} icon={<FileText size={15} />} defaultOpen={false}>
                                {(tr.docs_desc || '').split('\n').map((line, i) => <p key={i} className="mb-1 last:mb-0">{line}</p>)}
                            </AccordionCard>

                            <div className="h-px bg-slate-200/70 my-4" />

                            <AccordionCard title={tr.formula_title} icon={<TrendingUp size={15} />} defaultOpen={false}>
                                {(tr.formula_desc || '').split('\n').map((line, i) => <p key={i} className="mb-1 last:mb-0 font-mono text-amber-700 bg-amber-50 rounded-lg px-2 py-1">{line.startsWith('[') ? line : <span className="font-semibold text-slate-600">{line}</span>}</p>)}
                            </AccordionCard>

                            <AccordionCard title={tr.min_pension_title} icon={<ShieldCheck size={15} />} defaultOpen={false}>
                                {(tr.min_pension_desc || '').split('\n').map((line, i) => <p key={i} className="mb-1 last:mb-0">{line}</p>)}
                            </AccordionCard>

                            <div className="h-px bg-slate-200/70 my-4" />

                            <AccordionCard title={tr.hack_work_title} icon={<UserCheck size={15} />} defaultOpen={false}>
                                <p>{tr.hack_work_desc}</p>
                            </AccordionCard>

                            <AccordionCard title={tr.hack_tax_title} icon={<CreditCard size={15} />} defaultOpen={false}>
                                <p>{tr.hack_tax_desc}</p>
                            </AccordionCard>

                            {onSelectTemplate && (
                                <div className="space-y-3 mt-8">
                                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] border-l-4 border-amber-500 pl-3">
                                        {language === 'pt' ? 'Minutas e Documentos Disponíveis' : (language === 'es' ? 'Minutas y Documentos Disponibles' : language === 'fr' ? 'Modèles et Documents Disponibles' : 'Available Templates & Documents')}
                                    </h3>
                                    <div className="grid gap-3">
                                        {(() => {
                                            const docIds = ['ss_pensao_velhice_req', 'ss_contagem_tempo_estrangeiro'];
                                            return docIds.map((docId) => {
                                                const template = templates.find(t => t.id === docId);
                                                if (!template) return null;
                                                return (
                                                    <button
                                                        key={docId}
                                                        onClick={() => onSelectTemplate(docId)}
                                                        className="
                                                            group flex items-center justify-between
                                                            p-4 bg-white border border-slate-100 rounded-[2.25rem]
                                                            hover:border-amber-400 hover:shadow-xl hover:shadow-amber-500/8
                                                            active:scale-[0.98] transition-all shadow-sm text-left
                                                        "
                                                    >
                                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                                            <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl border border-amber-100/50 group-hover:bg-amber-500 group-hover:text-white transition-colors shrink-0">
                                                                <FileText size={17} />
                                                            </div>
                                                            <div className="flex flex-col gap-0.5 min-w-0">
                                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                                                    {language === 'pt' ? 'Preencher Documento' : (language === 'es' ? 'Rellenar Documento' : language === 'fr' ? 'Remplir le document' : 'Fill Document')}
                                                                </span>
                                                                <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-tight whitespace-normal break-words leading-tight group-hover:text-amber-500 transition-colors">
                                                                    {t(template.id, language) !== template.id ? t(template.id, language) : (t(template.title, language) !== template.title ? t(template.title, language) : template.title)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="w-8 h-8 rounded-xl bg-slate-55 border border-slate-100/50 flex items-center justify-center text-slate-400 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500 transition-colors duration-300 shrink-0 ml-3">
                                                            <ChevronRight size={14} />
                                                        </div>
                                                    </button>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
