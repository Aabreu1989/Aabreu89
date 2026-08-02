// src/components/IrsWizard.tsx
import React, { useState } from 'react';
import { audioService } from '../services/audioService';
import {
    ArrowLeft, Landmark, ChevronRight, Sparkles, Calculator, ExternalLink,
    AlertTriangle, ShieldCheck, HelpCircle, Gift, Info, CheckCircle2, ChevronDown, ChevronUp,
    User, GraduationCap, Briefcase, TrendingUp, FileText
} from 'lucide-react';
import { templates } from '../utils/documentsDatabase';
import { TranslatedText } from './TranslatedText';

interface IrsWizardProps {
    language: string;
    onBack: () => void;
    onSelectTemplate?: (templateId: string) => void;
}

// ─── Step Indicator Dots ─────────────────────────────────────────────────────
const StepDots: React.FC<{ total: number; current: number }> = ({ total, current }) => (
    <div className="flex items-center justify-center gap-2">
        {Array.from({ length: total }).map((_, i) => (
            <div
                key={i}
                className={`rounded-full transition-all duration-500 ${
                    i + 1 === current
                        ? 'w-6 h-2 bg-red-500 shadow-md shadow-red-500/50'
                        : i + 1 < current
                        ? 'w-2 h-2 bg-red-500/60'
                        : 'w-2 h-2 bg-white/20'
                }`}
            />
        ))}
    </div>
);

// ─── Badge Pill ──────────────────────────────────────────────────────────────
const BadgePill: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full backdrop-blur-md">
        <span className="text-red-500">{icon}</span>
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-200">{text}</span>
    </div>
);

// ─── Collapsible Accordion Card ────────────────────────────────────────────────
const AccordionCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, icon, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden transition-all duration-300">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                        {icon}
                    </div>
                    <span className="text-xs font-black text-slate-900 uppercase tracking-tight leading-snug">{title}</span>
                </div>
                {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
            </button>
            {isOpen && (
                <div className="p-6 pt-0 border-t border-slate-50 text-[11px] text-slate-650 font-semibold leading-relaxed space-y-3 bg-white animate-in slide-in-from-top-2 duration-300">
                    {children}
                </div>
            )}
        </div>
    );
};

// ─── Localized Translations Dictionary ──────────────────────────────────────────
const LOCAL_TRANS: Record<string, Record<string, string>> = {
    pt: {
        title: "IRS Sem Segredos",
        subtitle: "Imposto sobre o Rendimento de Pessoas Singulares",
        step1_title: "1. Prazos & Hacks de Faturas",
        step2_title: "2. Perfis de Declarantes",
        step3_title: "3. Modos de Declaração",
        step4_title: "4. Segredos do Reembolso",
        step5_title: "5. Consignação Avançada",
        step6_title: "6. Evitar Problemas Graves",
        
        // Profiles
        profile_title: "Como funciona o IRS para si?",
        profile_subtitle: "Selecione o seu perfil para ver as regras personalizadas, anexos necessários e armadilhas a evitar:",
        profile_dep: "Trabalhador Dependente (Cat. A)",
        profile_ind: "Trabalhador Independente (Cat. B)",
        profile_rnh: "Residente Não Habitual (RNH)",
        profile_jovem: "Jovens (IRS Jovem)",
        profile_pension: "Pensionistas / Aposentados",
        profile_investor: "Investidores (Mais-valias & Crypto)",
        profile_expat: "Imigrantes e Contas no Estrangeiro",

        // Profile Details (Category A)
        catA_title: "💼 Trabalhador Dependente (Conta de Outrem)",
        catA_desc: "• **Como Funciona**: O seu empregador retém imposto mensalmente (Retenção na Fonte) com base na sua remuneração e agregado.\n• **Anexos**: Modelo 3 padrão e **Anexo A** (Rendimentos do trabalho dependente e pensões).\n• **IRS Automático**: Está elegível na maioria das situações, desde que as Finanças tenham todos os dados corretos.\n• **Deduções Principais**: Despesas de saúde (15% até €1.000), educação (30% até €800), habitação (juros de crédito ou rendas de contratos antigos) e despesas gerais familiares (35% até €250 por sujeito passivo).\n• **Dica**: Compare sempre a simulação automática com a manual se tiver filhos ou despesas de renda que não apareçam no e-Fatura.",

        // Profile Details (Category B)
        catB_title: "🔨 Trabalhador Independente (Recibos Verdes / Cat. B)",
        catB_desc: "• **Como Funciona**: Regime Simplificado (se faturar até €200.000/ano) ou Contabilidade Organizada.\n• **Anexos**: **Anexo B** (Regime simplificado) ou **Anexo C** (Contabilidade) + **Anexo SS** (Segurança Social).\n• **Regra dos 15% de Despesas**: No Regime Simplificado de Serviços (onde apenas 75% do rendimento é tributado e 25% é assumido como despesa), o Estado obriga a justificar 15% dessa parcela de despesas (€3.750 para cada €25.000 faturados) com faturas de atividade no e-Fatura. Caso contrário, pagará mais IRS!\n• **Dica de Ouro**: Aceda ao e-Fatura e selecione 'Sim' na opção de despesas afetas à atividade profissional para todas as faturas relevantes (internet, eletricidade, material de escritório).",

        // Profile Details (RNH)
        rnh_title: "✈️ Residente Não Habitual (RNH / NHR)",
        rnh_desc: "• **Como Funciona**: Regime especial para novos residentes em Portugal com atividades de alto valor acrescentado ou pensões estrangeiras.\n• **Anexos**: **Anexo L** (Declaração do regime especial RNH) e **Anexo J** (Rendimentos obtidos no estrangeiro).\n• **Benefícios**: Taxa especial plana de 20% para rendimentos de trabalho dependente ou independente em profissões de alto valor. Taxa fixa de 10% sobre pensões de origem estrangeira.\n• **Armadilha**: Se os rendimentos do estrangeiro não estiverem devidamente identificados no Anexo J com o respetivo código do país de origem, o Fisco tributará os valores à taxa progressiva normal (até 48%).",

        // Profile Details (IRS Jovem)
        jovem_title: "🎓 IRS Jovem (Jovens Diplomados)",
        jovem_desc: "• **Como Funciona**: Benefício para jovens dos 18 aos 30 anos (35 anos se for doutoramento) após concluírem estudos secundários, profissionais ou superiores (QNQ nível 4 ou superior).\n• **Anexos**: Preencher **Modelo 3 (Manual), Quadro 4 da Folha de Rosto e Anexo A** (Quadro 4F - onde se declara o benefício).\n• **Benefício Progressivo**: Isenção de IRS de: \n  - 100% no 1.º ano (limite de 40x IAS)\n  - 75% no 2.º ano (limite de 30x IAS)\n  - 50% no 3.º e 4.º anos (limite de 20x IAS)\n  - 25% no 5.º ano (limite de 10x IAS)\n• **Atenção**: O IRS Jovem NÃO é automático. Se submeter o IRS Automático sem preencher o Anexo A manualmente, perderá o direito ao desconto fiscal desse ano!",

        // Profile Details (Pensionists)
        pension_title: "👴 Pensionistas e Aposentados",
        pension_desc: "• **Como Funciona**: As pensões nacionais ou estrangeiras são enquadradas na Categoria H.\n• **Anexos**: **Anexo A** (para pensões pagas pela Segurança Social ou CGA portuguesa) ou **Anexo J** (para pensões de origem estrangeira).\n• **Mínimo de Existência**: Se a soma das suas pensões anuais for inferior a €11.480 (em 2026), está totalmente isento de pagar IRS.\n• **Dica**: Verifique se Portugal tem acordo de dupla tributação com o país de origem da sua pensão estrangeira para evitar pagar impostos nos dois países (deve pedir isenção no país de origem).",

        // Profile Details (Investors)
        investor_title: "📈 Investidores (Mais-valias de Ações, Crypto e Imóveis)",
        investor_desc: "• **Como Funciona**: Ganhos com investimentos financeiros (mais-valias de ações, juros de contas) ou venda de propriedades imobiliárias.\n• **Anexos**: **Anexo G** (Mais-valias nacionais / Imobiliário) e **Anexo J** (Rendimentos e mais-valias obtidos no estrangeiro, ex: Degiro, Trading 212, Interactive Brokers).\n• **Criptomoedas**: Ganhos de venda de criptoativos mantidos por MENOS de 365 dias pagam taxa flat de 28% (ou opção de englobamento). Se retiver os ativos por MAIS de 365 dias, a mais-valia está 100% isenta de impostos!\n• **Mais-valias Imobiliárias**: Tributação incide sobre 50% do ganho. Está Isento se reinvestir o valor da venda na compra de outra habitação própria e permanente no prazo de 36 meses.\n• **Englobamento**: Se os seus rendimentos gerais forem baixos, simule 'Englobar' os juros ou mais-valias, pois poderá pagar menos do que a taxa flat de 28%.",

        // Profile Details (Expats)
        expat_title: "🌍 Imigrantes e Contas no Estrangeiro",
        expat_desc: "• **Como Funciona**: Imigrantes que residam e trabalhem em Portugal, ou residentes com contas bancárias no estrangeiro.\n• **Anexos**: **Anexo J** (Obrigatório para declarar contas e rendimentos externos).\n• **Contas Estrangeiras**: Se tem contas em bancos como Revolut, Wise, N26, Bunq, etc., é OBRIGATÓRIO declarar o IBAN dessas contas no Quadro 11 do Anexo J do IRS! Não paga imposto por ter a conta aberta, mas a multa por ocultar um IBAN estrangeiro vai de €50 a €250 por conta.\n• **Armadilha da Morada**: O maior erro de todos: se trabalhou em Portugal como residente mas a morada fiscal no seu NIF ainda constava como o seu país de origem, o Fisco tributará os seus salários a uma taxa fixa de 25% (Não Residente) sem direito a deduções! Atualize a sua morada fiscal imediatamente no Portal das Finanças.",

        // Step 1
        calendar_title: "📅 Calendário Crítico",
        calendar_desc: "• 1 de abril a 30 de junho: Entrega obrigatória da declaração.\n• 15 de fevereiro: Limite para comunicar agregado familiar.\n🔗 Agregado Familiar: https://irs.portaldasfinancas.gov.pt\n📍 Caminho: Entrar no Portal ➔ IRS ➔ Clicar em 'Comunicar Agregado Familiar' (até 15 de fevereiro).\n• 25 de fevereiro: Limite para validar faturas no e-Fatura.",
        hack_efatura_title: "💡 Hack: Faturas Perdidas?",
        hack_efatura_desc: "Se perdeu o prazo do e-Fatura ou o portal errou, NÃO se desespere! Ao preencher o IRS Manual (Modelo 3, Anexo H, Quadro 6C), pode rejeitar os valores automáticos do Fisco e introduzir manualmente os gastos reais com Saúde, Educação, Lares e Habitação. Guarde os comprovativos físicos por 4 anos.\n\n🔗 Portal e-Fatura: https://faturas.portaldasfinancas.gov.pt\n📍 Caminho: Entrar com credenciais ➔ Escolher perfil 'Adquirente' ➔ Clicar em 'Complementar Informação de Faturas' para associar despesas pendentes.",
        hack_nif_title: "🛒 Regra de Ouro do NIF",
        hack_nif_desc: "Peça NIF em tudo. Pequenas despesas (supermercados, cabeleireiro, restauração, veterinários, transportes) acumulam um retorno direto do IVA. Arrendamento e despesas de juros de crédito habitação devem constar obrigatoriamente.",

        // Step 3
        mode_comparison: "🔍 Comparação de Modos",
        mode_auto_title: "IRS Automático - Armadilhas",
        mode_auto_desc: "Parece fácil: o sistema preenche e submete. Mas atenção! Se tem filhos, despesas com rendas, estatuto RNH (Residente Não Habitual), ou rendimentos no estrangeiro, o simulador automático costuma ignorar deduções cruciais. Nunca submeta sem simular antes o IRS Automático vs. Manual.\n\n🔗 Simulador de IRS: https://irs.portaldasfinancas.gov.pt\n📍 Caminho: Entrar no Portal ➔ IRS ➔ Clicar em 'Simular' ou 'Entregar Declaração' para comparar os valores.",
        mode_manual_title: "IRS Manual (Modelo 3) & Anexos",
        mode_manual_desc: "• Anexo B (Recibos Verdes): No regime simplificado, o fisco assume 25% de despesa livre de impostos, mas obriga a justificar 15% dessa parcela com despesas da atividade. Se não o fizer, paga mais IRS!\n• Anexo J (Rendimentos no Estrangeiro): Tem conta Revolut, Wise ou salários remotos? É obrigatório declarar o IBAN estrangeiro e rendimentos externos. As multas por ocultar IBANs estrangeiros vão de €50 a €250 por conta.\n\n🔗 Declaração Manual: https://irs.portaldasfinancas.gov.pt\n📍 Caminho: Entrar ➔ IRS ➔ 'Declaração' ➔ Escolher 'Entregar Modelo 3'. Adicione os anexos correspondentes.",
        joint_filing_title: "💑 Tributação Conjunta vs Separada",
        joint_filing_desc: "Casados ou em união de facto há mais de 2 anos: Simule SEMPRE as duas opções. Se um dos cônjuges ganha muito mais que o outro, a Tributação Conjunta (declarar juntos) baixa significativamente o escalão de IRS combinado, gerando reembolsos massivos.\n\n🔗 Simulador de IRS: https://irs.portaldasfinancas.gov.pt\n📍 Caminho: No Modelo 3 (Manual), na Folha de Rosto ➔ Quadro 4 (Estado Civil) ➔ Selecionar 'Sim' na opção de Tributação Conjunta.",

        // Step 4
        refund_explanation: "💸 Como é Calculado o Reembolso?",
        refund_desc: "O reembolso não é um bónus do Estado. É o retorno do imposto que pagou em excesso mensalmente (Retenção na Fonte). A fórmula é:\n\n[IRS Devido = (Rendimento Coletável - Deduções) * Taxa do Escalão]\n\nSe o que reteve na fonte ao longo do ano for superior ao IRS Devido, recebe reembolso. Caso contrário, terá de pagar ao Estado.\n\n🔗 Consulta de Reembolso: https://irs.portaldasfinancas.gov.pt\n📍 Caminho: Entrar no Portal ➔ IRS ➔ Clicar em 'Consultar Declaração' ➔ Selecionar o ano correspondente para ver o estado (Ex: 'Declaração Certa', 'Reembolso Emitido').",
        exist_minimum: "🛡️ O Mínimo de Existência",
        exist_minimum_desc: "Em Portugal, o Estado garante o 'Mínimo de Existência' (isento de IRS para rendimentos até €11.480 anuais em 2026). Se ganhou menos que este limite no ano e lhe foi retido algum IRS na fonte, tem direito a receber de volta 100% dos valores retidos.\n\n🔗 Consulta de Deduções: https://irs.portaldasfinancas.gov.pt\n📍 Caminho: Entrar ➔ IRS ➔ Clicar em 'Consultar Despesas p/ Deduções à Coleta' para ver o detalhe de despesas calculadas para o Mínimo de Existência.",
        refund_speed: "⚡ Como Receber Mais Rápido?",
        refund_speed_desc: "Submeter na primeira semana de abril costuma processar reembolsos em cerca de 12 a 18 dias. Submissões após maio entram na fila de auditoria manual e podem demorar mais de 45 dias.",

        // Step 5
        consign_sec: "❤️ O Segredo da Consignação",
        consign_desc: "• Consignação de IRS (0.5%): Pode direcionar 0,5% do imposto coletado para uma IPSS, associação cultural ou ambiental. Isto é retirado do imposto que iria para o Estado. É 100% gratuito e não reduz o seu reembolso.\n• Consignação de IVA (15%): Atenção! Se selecionar a caixa para consignar o IVA, estará a doar o seu próprio benefício fiscal de faturas acumuladas. Isto NÃO é gratuito e reduz o seu reembolso. Selecione apenas a caixa de IRS!\n\n🔗 Consignação de IRS: https://irs.portaldasfinancas.gov.pt\n📍 Caminho: Para consignar antes: Entrar no Portal ➔ Pesquisar 'Comunicar Entidade a Consignar'. Para consignar na entrega: No Modelo 3, Folha de Rosto ➔ Quadro 11 ➔ Selecionar tipo de entidade (IRS) e inserir o NIF da instituição.",

        // Step 6
        address_trap: "🏠 A Rasteira do Morada Fiscal (NIF)",
        address_trap_desc: "O maior erro dos imigrantes: Se trabalhou como residente em Portugal mas a morada fiscal do seu NIF ainda constava como o seu país de origem, o fisco tributará o seu rendimento a uma taxa fixa de 25% (Não Residente) sem direito a deduções! Atualize a sua morada no Portal das Finanças imediatamente para ter direito ao regime fiscal normal.\n\n🔗 Alteração de Morada: https://www.portaldasfinancas.gov.pt\n📍 Caminho: Clicar na barra de pesquisa superior ➔ Escrever 'Alterar Morada Fiscal' ➔ Entrar com credenciais ➔ Inserir a nova morada portuguesa e confirmar via código enviado por carta postal (ou Chave Móvel Digital).",
        divergences: "⚠️ Divergências & Auditorias",
        divergences_desc: "Se a sua entidade patronal declarou valores diferentes dos que colocou na sua declaração, o sistema gera uma 'Divergência'. Confirme sempre os valores com a 'Declaração de Rendimentos' oficial da empresa antes de submeter.\n\n🔗 Consultar Divergências: https://irs.portaldasfinancas.gov.pt\n📍 Caminho: Entrar no Portal ➔ IRS ➔ Clicar em 'Consultar Divergências' para ver o detalhe de auditorias e anexar os documentos justificativos solicitados.",

        next: "Continuar",
        back: "Voltar",
        reset: "Reiniciar Guia",
        portal_btn: "Ir para Portal das Finanças",
        disclaimer: "Esta informação é meramente informativa baseada na legislação e regulamentos fiscais em vigor. Recomenda-se a consulta dos guias oficiais da Autoridade Tributária ou de um contabilista certificado."
    },
    en: {
        title: "IRS Unlocked",
        subtitle: "Personal Income Tax in Portugal",
        step1_title: "1. Deadlines & Invoice Hacks",
        step2_title: "2. Declarant Profiles",
        step3_title: "3. Filing Modes",
        step4_title: "4. Refund Secrets",
        step5_title: "5. Advanced Donation",
        step6_title: "6. Avoiding Penalties",
        
        // Profiles
        profile_title: "How does IRS work for you?",
        profile_subtitle: "Select your profile to view personalized rules, required annexes, and traps to avoid:",
        profile_dep: "Salaried Employee (Cat. A)",
        profile_ind: "Self-Employed (Cat. B)",
        profile_rnh: "Non-Habitual Resident (NHR)",
        profile_jovem: "Youth (IRS Jovem)",
        profile_pension: "Pensioner / Retired",
        profile_investor: "Investor (Capital Gains & Crypto)",
        profile_expat: "Immigrants & Foreign Accounts",

        // Profile Details (Category A)
        catA_title: "💼 Salaried Employee (Category A)",
        catA_desc: "• **How it works**: Your employer withholding taxes monthly based on salary and household composition.\n• **Annexes**: Standard Model 3 face sheet and **Annex A**.\n• **Automatic IRS**: Eligible in most situations, provided Finanças has correct employer reports.\n• **Main Deductions**: Health expenses (15% up to €1,000), education (30% up to €800), housing (rent or credit interest under old rules), and general family expenses (35% up to €250 per spouse).\n• **Tip**: Always compare automatic and manual simulations if you have children or rent costs not visible on e-Fatura.",

        // Profile Details (Category B)
        catB_title: "🔨 Self-Employed (Green Receipts / Category B)",
        catB_desc: "• **How it works**: Simplified regime (income up to €200,000/year) or organized accounting.\n• **Annexes**: **Annex B** (Simplified) or **Annex C** (Organized) + **Annex SS** (Social Security declaration).\n• **15% Expense Justification Rule**: In the Simplified Service Regime (where only 75% of income is taxed and 25% is assumed as activity costs), you must justify 15% of that cost part (€3,750 for every €25,000 billed) with business expenses. Otherwise, your taxable income increases!\n• **Tip**: Log into e-Fatura and categorize bills as professional (internet, electricity, office material) by selecting 'Sim'.",

        // Profile Details (RNH)
        rnh_title: "✈️ Non-Habitual Resident (NHR)",
        rnh_desc: "• **How it works**: Special regime for new residents in Portugal with high-value occupations or foreign pensions.\n• **Annexes**: **Annex L** (NHR declaration) and **Annex J** (Foreign income reporting).\n• **Benefits**: Flat 20% rate on salary/self-employment from high-value activities in Portugal. Flat 10% on foreign pensions.\n• **Trap**: If foreign income is not correctly entered in Annex J with the matching country code, Finanças will tax it at normal progressive rates up to 48%.",

        // Profile Details (IRS Jovem)
        jovem_title: "🎓 IRS Jovem (Graduates Benefiting)",
        jovem_desc: "• **How it works**: Tax benefit for young adults (18 to 30 years old, 35 for PhDs) after finishing a course cycle (secondary, professional, or higher education).\n• **Annexes**: **Model 3 (Manual), Face Sheet Box 4, and Annex A** (Box 4F where you declare study graduation year and tax exemption).\n• **Progressive Benefit**: Tax exemption of:\n  - 100% in year 1 (limit 40x IAS)\n  - 75% in year 2 (limit 30x IAS)\n  - 50% in year 3 & 4 (limit 20x IAS)\n  - 25% in year 5 (limit 10x IAS)\n• **Warning**: IRS Jovem is NOT automatic. Confirming automatic IRS without manual Annex A configuration yields standard taxation, losing your benefits!",

        // Profile Details (Pensionists)
        pension_title: "👴 Pensioners & Retired",
        pension_desc: "• **How it works**: Pension income is classified as Category H.\n• **Annexes**: **Annex A** (Portuguese Social Security/CGA) or **Annex J** (Foreign pension payments).\n• **Existence Minimum**: Total pensions under €11,480 (in 2026) are 100% tax-exempt.\n• **Tip**: Check if Portugal has a double taxation treaty with your pension paying country. Request country-of-origin tax exemption to avoid double taxes.",

        // Profile Details (Investors)
        investor_title: "📈 Investors (Capital Gains, Stocks & Crypto)",
        investor_desc: "• **How it works**: Earnings from stock sales, interest, dividends, or real estate sales.\n• **Annexes**: **Annex G** (National transactions / Real estate) and **Annex J** (Foreign transactions, e.g. Degiro, Revolut, IBKR).\n• **Cryptocurrencies**: Crypto sold after being held for LESS than 365 days is taxed at 28% flat. Crypto held for MORE than 365 days is 100% tax-free!\n• **Real Estate**: Only 50% of real estate capital gains are taxed. Exemption applies if you reinvest the sale amount into a new primary residence within 36 months.\n• **Aggregating (Englobamento)**: If your tax bracket is low, simulate aggregating capital gains. It might result in tax rates lower than the flat 28%.",

        // Profile Details (Expats)
        expat_title: "🌍 Immigrants & Foreign Accounts",
        expat_desc: "• **How it works**: Expatriates living in Portugal, or any resident with accounts abroad.\n• **Annexes**: **Annex J** (Foreign accounts and external income).\n• **Foreign Accounts**: Bank accounts like Revolut, Wise, N26, Bunq, etc. MUST have their IBAN declared in Annex J, Box 11! Having the account is not taxed, but hiding a foreign IBAN carries fines from €50 to €250 per account.\n• **Address Trap**: The most common expat error: working in Portugal while your NIF address is still set to your origin country. Finanças will tax your income at a flat 25% (Non-Resident) rate with zero deductions! Update NIF address immediately via Portal das Finanças.",

        // Step 1
        calendar_title: "📅 Critical Calendar",
        calendar_desc: "• April 1st to June 30th: Mandatory filing window.\n• February 15th: Deadline to update household members.\n🔗 Household Members: https://irs.portaldasfinancas.gov.pt\n📍 Navigation: Login ➔ IRS ➔ Click 'Comunicar Agregado Familiar' (Household communication) (until Feb 15).\n• February 25th: Deadline to categorize invoices on e-Fatura.",
        hack_efatura_title: "💡 Hack: Missed Invoices?",
        hack_efatura_desc: "If you missed the e-Fatura deadline or the portal bugged out, DO NOT panic! When filling out your IRS manually (Model 3, Annex H, Box 6C), you can reject the tax authority's pre-filled values and manually input your actual expenses for Health, Education, Rents, and Care Homes. Keep physical receipts for 4 years.\n\n🔗 e-Fatura Portal: https://faturas.portaldasfinancas.gov.pt\n📍 Navigation: Login ➔ Select 'Adquirente' (Buyer) profile ➔ Click 'Complementar Informação de Faturas' to categorize pending grocery, health, or restaurant bills.",
        hack_nif_title: "🛒 The Golden NIF Rule",
        hack_nif_desc: "Ask for NIF on every purchase. Small expenses (groceries, haircuts, dining out, vets, transport) accumulate a direct VAT refund. Rent and mortgage interest expenses must be declared to lower your tax brackets.",

        // Step 3
        mode_comparison: "🔍 Comparing Modes",
        mode_auto_title: "Automatic IRS - Traps",
        mode_auto_desc: "It looks simple: just confirm and submit. But beware! If you have children, rent expenses, NHR (Non-Habitual Resident) status, or foreign income, the automatic simulator often skips crucial deductions. Always simulate Automatic vs. Manual filing before submitting.\n\n🔗 IRS Portal: https://irs.portaldasfinancas.gov.pt\n📍 Navigation: Login ➔ IRS ➔ Click 'Simular' (Simulate) or 'Entregar Declaração' (Filing) to run simulator comparisons.",
        mode_manual_title: "Manual IRS (Model 3) & Annexes",
        mode_manual_desc: "• Annex B (Green Receipts / Freelancers): Under the simplified regime, the state assumes 25% of your income as tax-free expenses, but requires you to justify 15% of that through business expenses. If you don't, you will pay more tax!\n• Annex J (Foreign Income): Do you have Revolut, Wise, or foreign earnings? Declaring foreign IBANs and income is mandatory. Hiding foreign bank accounts ranges from €50 to €250 per account.\n\n🔗 Manual Filing: https://irs.portaldasfinancas.gov.pt\n📍 Navigation: Login ➔ IRS ➔ 'Declaração' ➔ Choose 'Entregar Modelo 3' (File Model 3). Append your required Annexes.",
        joint_filing_title: "💑 Joint vs. Separate Filing",
        joint_filing_desc: "Married or in a civil partnership for over 2 years: ALWAYS simulate both options. If one partner earns significantly more than the other, Joint Filing (declaring together) drops the combined tax bracket, producing massive refunds.\n\n🔗 IRS Portal: https://irs.portaldasfinancas.gov.pt\n📍 Navigation: Inside Model 3 (Manual), on the Face Sheet (Folha de Rosto) ➔ Box 4 (Quadro 4 - Estado Civil) ➔ Select 'Sim' (Yes) for Joint Taxation.",

        // Step 4
        refund_explanation: "💸 How is the Refund Calculated?",
        refund_desc: "A tax refund is not free money from the government. It is the return of the excess tax you paid monthly during the year (Withholding Tax / Retenção na Fonte). The formula is:\n\n[IRS Due = (Taxable Income - Deductions) * Bracket Rate]\n\nIf your withholding tax throughout the year was higher than the IRS Due, you receive a refund. Otherwise, you must pay the state.\n\n🔗 Refund Status: https://irs.portaldasfinancas.gov.pt\n📍 Navigation: Login ➔ IRS ➔ Click 'Consultar Declaração' (Consult Declaration) ➔ Select the tax year to see status (e.g., 'Declaração Certa', 'Reembolso Emitido').",
        exist_minimum: "🛡️ The Existence Minimum",
        exist_minimum_desc: "In Portugal, the state guarantees the 'Existence Minimum' (exempt from IRS for incomes up to €11,480 annually in 2026). If you earned less than this limit during the year and tax was withheld, you are entitled to receive 100% of those withheld values back.\n\n🔗 Deductions Portal: https://irs.portaldasfinancas.gov.pt\n📍 Navigation: Login ➔ IRS ➔ Click 'Consultar Despesas p/ Deduções à Coleta' to view computed deductions details.",
        refund_speed: "⚡ How to Get Paid Faster?",
        refund_speed_desc: "Filing in the first week of April usually yields refunds in 12 to 18 days. Submissions after May go into manual audit queues and can take over 45 days.",

        // Step 5
        consign_sec: "❤️ Tax Consignation Secrets",
        consign_desc: "• IRS Consignation (0.5%): You can direct 0.5% of your calculated tax to a charity, cultural, or environmental institution. This is taken from the tax that would normally go to the state. It is 100% free and does not reduce your refund.\n• VAT Consignation (15%): Warning! If you select the box to donate VAT, you are giving away your accumulated invoice benefits. This is NOT free and will reduce your refund amount. Only select the IRS box!\n\n🔗 Tax Donation: https://irs.portaldasfinancas.gov.pt\n📍 Navigation: To consign early: Login ➔ Search 'Comunicar Entidade a Consignar'. During filing: In Model 3, Face Sheet ➔ Box 11 (Quadro 11) ➔ Select entity type (IRS) and insert the institution's NIF.",

        // Step 6
        address_trap: "🏠 The Fiscal Address Trap (NIF)",
        address_trap_desc: "The biggest mistake for expats: If you worked as a resident in Portugal but your NIF address was still set as your home country, the tax authority will tax your income at a flat 25% (Non-Resident) rate with zero deductions! Update your address on Portal das Finanças immediately to access standard tax rates.\n\n🔗 Update Fiscal Address: https://www.portaldasfinancas.gov.pt\n📍 Navigation: Use the top search bar ➔ Search 'Alterar Morada Fiscal' ➔ Log in with credentials ➔ Insert your new Portuguese address and confirm with the code sent via physical mail (or use Chave Móvel Digital).",
        divergences: "⚠️ Divergences & Audits",
        divergences_desc: "If your employer reported different earnings than what you submitted, the system flags a 'Divergence' (audit). Always verify your numbers with the official employer statement (Declaração de Rendimentos) before submitting.\n\n🔗 Consult Divergences: https://irs.portaldasfinancas.gov.pt\n📍 Navigation: Login ➔ IRS ➔ Click 'Consultar Divergências' to view audit details and upload the requested supporting documents.",

        next: "Continue",
        back: "Back",
        reset: "Restart Guide",
        portal_btn: "Go to Portal das Finanças",
        disclaimer: "This information is for guidance purposes only. We recommend consulting the official tax authority guides or a certified accountant."
    },
    br: {
        title: "IRS Descomplicado",
        subtitle: "Imposto sobre o Rendimento em Portugal",
        step1_title: "1. Prazos & Hacks de Faturas",
        step2_title: "2. Perfis de Declarantes",
        step3_title: "3. Modos de Declaração",
        step4_title: "4. Segredos do Reembolso",
        step5_title: "5. Consignação Avançada",
        step6_title: "6. Evitar Problemas Graves",

        // Profiles
        profile_title: "Como funciona o IRS para você?",
        profile_subtitle: "Selecione o seu perfil para ver as regras personalizadas, anexos necessários e armadilhas a evitar:",
        profile_dep: "Trabalhador Dependente (Cat. A)",
        profile_ind: "Autônomo / Recibos Verdes (Cat. B)",
        profile_rnh: "Residente Não Habitual (RNH)",
        profile_jovem: "Jovens (IRS Jovem)",
        profile_pension: "Aposentados / Pensionistas",
        profile_investor: "Investidores (Ganhos de Capital & Crypto)",
        profile_expat: "Imigrantes e Contas no Exterior",

        catA_title: "💼 Trabalhador Dependente (Categoria A)",
        catA_desc: "• **Como Funciona**: O seu empregador retém imposto mensalmente (Retenção na Fonte) com base na remuneração e composição do agregado familiar.\n• **Anexos**: Modelo 3 padrão e **Anexo A** (Rendimentos do trabalho dependente e pensões).\n• **IRS Automático**: Elegível na maioria das situações, desde que as Finanças tenham todos os dados corretos do empregador.\n• **Principais Deduções**: Despesas de saúde (15% até €1.000), educação (30% até €800), habitação (juros do financiamento imobiliário ou aluguéis antigos) e despesas gerais familiares (35% até €250 por sujeito passivo).\n• **Dica**: Compare sempre a simulação automática com a manual se tiver filhos ou despesas de aluguel que não apareçam no e-Fatura.",

        catB_title: "🔨 Autônomo / Recibos Verdes (Categoria B)",
        catB_desc: "• **Como Funciona**: Regime Simplificado (faturamento até €200.000/ano) ou Contabilidade Organizada.\n• **Anexos**: **Anexo B** (Regime simplificado) ou **Anexo C** (Contabilidade) + **Anexo SS** (Seguridade Social).\n• **Regra dos 15% de Despesas**: No Regime Simplificado de Serviços (onde apenas 75% do rendimento é tributado e 25% é assumido como despesa), o Estado obriga a justificar 15% dessa parcela de despesas com faturas de atividade no e-Fatura. Caso contrário, pagará mais IRS!\n• **Dica de Ouro**: Acesse o e-Fatura e selecione 'Sim' na opção de despesas afetas à atividade profissional para todas as faturas relevantes (internet, luz, material de escritório).",

        rnh_title: "✈️ Residente Não Habitual (RNH)",
        rnh_desc: "• **Como Funciona**: Regime especial para novos residentes em Portugal com atividades de alto valor agregado ou pensões estrangeiras.\n• **Anexos**: **Anexo L** (Declaração do regime especial RNH) e **Anexo J** (Rendimentos obtidos no exterior).\n• **Benefícios**: Taxa especial plana de 20% para rendimentos de trabalho em profissões de alto valor. Taxa fixa de 10% sobre pensões de origem estrangeira.\n• **Armadilha**: Se os rendimentos do exterior não estiverem devidamente identificados no Anexo J com o código do país de origem, o Fisco tributará os valores à taxa progressiva normal (até 48%).",

        jovem_title: "🎓 IRS Jovem (Jovens Formados)",
        jovem_desc: "• **Como Funciona**: Benefício para jovens dos 18 aos 30 anos (35 anos para doutoramento) após concluírem estudos secundários, profissionais ou superiores.\n• **Anexos**: **Modelo 3 (Manual), Quadro 4 da Folha de Rosto e Anexo A** (Quadro 4F — onde se declara o benefício).\n• **Benefício Progressivo**: Isenção de IRS de:\n  - 100% no 1.º ano (limite de 40x IAS)\n  - 75% no 2.º ano (limite de 30x IAS)\n  - 50% no 3.º e 4.º anos (limite de 20x IAS)\n  - 25% no 5.º ano (limite de 10x IAS)\n• **Atenção**: O IRS Jovem NÃO é automático. Se submeter o IRS Automático sem preencher o Anexo A manualmente, perderá o direito ao desconto fiscal desse ano!",

        pension_title: "👴 Aposentados e Pensionistas",
        pension_desc: "• **Como Funciona**: As pensões nacionais ou estrangeiras são enquadradas na Categoria H.\n• **Anexos**: **Anexo A** (para pensões pagas pela Seguridade Social portuguesa ou CGA) ou **Anexo J** (para pensões de origem estrangeira).\n• **Mínimo de Existência**: Se a soma das suas pensões anuais for inferior a €11.480 (em 2026), está totalmente isento de pagar IRS.\n• **Dica**: Verifique se Portugal tem acordo de dupla tributação com o país de origem da sua pensão estrangeira para evitar pagar impostos nos dois países.",

        investor_title: "📈 Investidores (Ganhos de Capital, Ações & Crypto)",
        investor_desc: "• **Como Funciona**: Ganhos com investimentos financeiros (ações, juros) ou venda de propriedades imobiliárias.\n• **Anexos**: **Anexo G** (Mais-valias nacionais / Imobiliário) e **Anexo J** (Rendimentos e mais-valias obtidos no exterior, ex: Degiro, Trading 212, Interactive Brokers).\n• **Criptomoedas**: Ganhos de venda de criptoativos mantidos por MENOS de 365 dias pagam taxa flat de 28%. Se mantiver os ativos por MAIS de 365 dias, a mais-valia está 100% isenta de impostos!\n• **Mais-valias Imobiliárias**: Incide sobre 50% do ganho. Isento se reinvestir o valor da venda na compra de outra habitação própria e permanente no prazo de 36 meses.\n• **Englobamento**: Se os seus rendimentos gerais forem baixos, simule englobar os juros ou mais-valias, pois poderá pagar menos do que a taxa flat de 28%.",

        expat_title: "🌍 Imigrantes e Contas no Exterior",
        expat_desc: "• **Como Funciona**: Imigrantes que residam e trabalhem em Portugal, ou residentes com contas bancárias no exterior.\n• **Anexos**: **Anexo J** (Obrigatório para declarar contas e rendimentos externos).\n• **Contas no Exterior**: Se você tem contas em bancos como Revolut, Wise, N26, Nubank, etc., é OBRIGATÓRIO declarar o IBAN dessas contas no Quadro 11 do Anexo J do IRS! A multa por ocultar um IBAN estrangeiro vai de €50 a €250 por conta.\n• **Armadilha da Morada**: Se trabalhou em Portugal como residente, mas a morada fiscal no seu NIF ainda constava como o seu país de origem, o Fisco tributará os seus salários a uma taxa fixa de 25% (Não Residente) sem direito a deduções! Atualize a sua morada fiscal imediatamente no Portal das Finanças.",

        calendar_title: "📅 Calendário Crítico",
        calendar_desc: "• 1 de abril a 30 de junho: Entrega obrigatória da declaração.\n• 15 de fevereiro: Prazo para comunicar o agregado familiar.\n🔗 Agregado Familiar: https://irs.portaldasfinancas.gov.pt\n📍 Caminho: Entrar no Portal ➔ IRS ➔ Clicar em 'Comunicar Agregado Familiar' (até 15 de fevereiro).\n• 25 de fevereiro: Prazo para validar faturas no e-Fatura.",
        hack_efatura_title: "💡 Hack: Perdeu faturas no e-Fatura?",
        hack_efatura_desc: "Se perdeu o prazo do e-Fatura ou o portal falhou, NÃO entre em pânico! Ao preencher o IRS Manual (Modelo 3, Anexo H, Quadro 6C), pode rejeitar os valores pré-preenchidos e inserir manualmente os gastos reais com Saúde, Educação, Lares e Habitação. Guarde os comprovantes físicos por 4 anos.\n\n🔗 Portal e-Fatura: https://faturas.portaldasfinancas.gov.pt\n📍 Caminho: Entrar com credenciais ➔ Escolher perfil 'Adquirente' ➔ Clicar em 'Complementar Informação de Faturas' para associar despesas pendentes.",
        hack_nif_title: "🛒 Regra de Ouro do NIF",
        hack_nif_desc: "Peça NIF em tudo. Pequenas despesas (supermercados, cabeleireiro, restaurantes, veterinários, transportes) acumulam retorno direto do IVA. Aluguel e despesas de juros do financiamento imobiliário devem constar obrigatoriamente.",

        mode_comparison: "🔍 Comparação de Modos",
        mode_auto_title: "IRS Automático — Armadilhas",
        mode_auto_desc: "Parece fácil: o sistema preenche e submete. Mas atenção! Se você tem filhos, despesas com aluguel, estatuto RNH, ou rendimentos no exterior, o simulador automático costuma ignorar deduções cruciais. Nunca submeta sem simular antes o IRS Automático vs. Manual.\n\n🔗 Simulador de IRS: https://irs.portaldasfinancas.gov.pt\n📍 Caminho: Entrar no Portal ➔ IRS ➔ Clicar em 'Simular' ou 'Entregar Declaração' para comparar os valores.",
        mode_manual_title: "IRS Manual (Modelo 3) & Anexos",
        mode_manual_desc: "• Anexo B (Recibos Verdes): No regime simplificado, o fisco assume 25% de despesa livre de impostos, mas obriga a justificar 15% dessa parcela com despesas da atividade. Se não o fizer, paga mais IRS!\n• Anexo J (Rendimentos no Exterior): Tem conta Revolut, Wise ou salários remotos? É obrigatório declarar o IBAN estrangeiro e rendimentos externos. As multas por ocultar IBANs estrangeiros vão de €50 a €250 por conta.\n\n🔗 Declaração Manual: https://irs.portaldasfinancas.gov.pt\n📍 Caminho: Entrar ➔ IRS ➔ 'Declaração' ➔ Escolher 'Entregar Modelo 3'. Adicione os anexos correspondentes.",
        joint_filing_title: "💑 Tributação Conjunta vs. Separada",
        joint_filing_desc: "Casados ou em união de facto há mais de 2 anos: Simule SEMPRE as duas opções. Se um dos cônjuges ganha muito mais que o outro, a Tributação Conjunta (declarar juntos) baixa significativamente o escalão de IRS combinado, gerando reembolsos massivos.\n\n🔗 Simulador de IRS: https://irs.portaldasfinancas.gov.pt\n📍 Caminho: No Modelo 3 (Manual), na Folha de Rosto ➔ Quadro 4 (Estado Civil) ➔ Selecionar 'Sim' na opção de Tributação Conjunta.",

        refund_explanation: "💸 Como é Calculado o Reembolso?",
        refund_desc: "O reembolso não é um bónus do Estado. É o retorno do imposto que você pagou em excesso mensalmente (Retenção na Fonte). A fórmula é:\n\n[IRS Devido = (Rendimento Coletável - Deduções) × Taxa do Escalão]\n\nSe o que reteve na fonte ao longo do ano for superior ao IRS Devido, recebe reembolso. Caso contrário, terá de pagar ao Estado.\n\n🔗 Consulta de Reembolso: https://irs.portaldasfinancas.gov.pt\n📍 Caminho: Entrar no Portal ➔ IRS ➔ Clicar em 'Consultar Declaração' ➔ Selecionar o ano correspondente para ver o estado.",
        exist_minimum: "🛡️ O Mínimo de Existência",
        exist_minimum_desc: "Em Portugal, o Estado garante o 'Mínimo de Existência' (isento de IRS para rendimentos até €11.480 anuais em 2026). Se ganhou menos que este limite no ano e lhe foi retido algum IRS na fonte, tem direito a receber de volta 100% dos valores retidos.\n\n🔗 Consulta de Deduções: https://irs.portaldasfinancas.gov.pt\n📍 Caminho: Entrar ➔ IRS ➔ Clicar em 'Consultar Despesas p/ Deduções à Coleta' para ver o detalhe de despesas calculadas.",
        refund_speed: "⚡ Como Receber Mais Rápido?",
        refund_speed_desc: "Submeter na primeira semana de abril costuma processar reembolsos em cerca de 12 a 18 dias. Submissões após maio entram na fila de auditoria manual e podem demorar mais de 45 dias.",

        consign_sec: "❤️ O Segredo da Consignação",
        consign_desc: "• Consignação de IRS (0,5%): Pode direcionar 0,5% do imposto coletado para uma IPSS, associação cultural ou ambiental. Isto é retirado do imposto que iria para o Estado. É 100% gratuito e não reduz o seu reembolso.\n• Consignação de IVA (15%): Atenção! Se selecionar a caixa para consignar o IVA, estará a doar o seu próprio benefício fiscal de faturas acumuladas. Isto NÃO é gratuito e reduz o seu reembolso. Selecione apenas a caixa de IRS!\n\n🔗 Consignação de IRS: https://irs.portaldasfinancas.gov.pt\n📍 Caminho: Para consignar antes: Entrar no Portal ➔ Pesquisar 'Comunicar Entidade a Consignar'. Para consignar na entrega: No Modelo 3, Folha de Rosto ➔ Quadro 11 ➔ Selecionar tipo de entidade (IRS) e inserir o NIF da instituição.",

        address_trap: "🏠 A Armadilha da Morada Fiscal (NIF)",
        address_trap_desc: "O maior erro dos imigrantes brasileiros: Se você trabalhou como residente em Portugal mas a morada fiscal do seu NIF ainda constava como Brasil (ou outro país), o Fisco tributará o seu rendimento a uma taxa fixa de 25% (Não Residente) sem direito a deduções! Atualize a sua morada no Portal das Finanças imediatamente para ter direito ao regime fiscal normal.\n\n🔗 Alteração de Morada: https://www.portaldasfinancas.gov.pt\n📍 Caminho: Clicar na barra de pesquisa superior ➔ Escrever 'Alterar Morada Fiscal' ➔ Entrar com credenciais ➔ Inserir a nova morada portuguesa e confirmar via código enviado por carta postal (ou Chave Móvel Digital).",
        divergences: "⚠️ Divergências & Auditorias",
        divergences_desc: "Se a sua entidade patronal declarou valores diferentes dos que você colocou na sua declaração, o sistema gera uma 'Divergência'. Confirme sempre os valores com a 'Declaração de Rendimentos' oficial da empresa antes de submeter.\n\n🔗 Consultar Divergências: https://irs.portaldasfinancas.gov.pt\n📍 Caminho: Entrar no Portal ➔ IRS ➔ Clicar em 'Consultar Divergências' para ver o detalhe de auditorias e anexar os documentos justificativos solicitados.",

        next: "Continuar",
        back: "Voltar",
        reset: "Reiniciar Guia",
        portal_btn: "Ir para Portal das Finanças",
        disclaimer: "Esta informação é meramente orientativa baseada na legislação e regulamentos fiscais em vigor em Portugal. Recomenda-se a consulta dos guias oficiais da Autoridade Tributária ou de um contabilista certificado."
    },
    es: {
        title: "IRS Sin Secretos",
        subtitle: "Impuesto sobre la Renta en Portugal",
        step1_title: "1. Plazos & Trucos de Facturas",
        step2_title: "2. Perfiles de Declarantes",
        step3_title: "3. Modos de Declaración",
        step4_title: "4. Secretos del Reembolso",
        step5_title: "5. Consignación Avanzada",
        step6_title: "6. Evitar Problemas Graves",

        // Profiles
        profile_title: "¿Cómo funciona el IRS para usted?",
        profile_subtitle: "Seleccione su perfil para ver las reglas personalizadas, anexos necesarios y trampas a evitar:",
        profile_dep: "Trabajador por Cuenta Ajena (Cat. A)",
        profile_ind: "Trabajador Autónomo (Cat. B)",
        profile_rnh: "Residente No Habitual (RNH)",
        profile_jovem: "Jóvenes (IRS Jovem)",
        profile_pension: "Pensionistas / Jubilados",
        profile_investor: "Inversores (Ganancias de Capital & Crypto)",
        profile_expat: "Inmigrantes y Cuentas en el Extranjero",

        catA_title: "💼 Trabajador por Cuenta Ajena (Categoría A)",
        catA_desc: "• **Cómo Funciona**: Su empleador retiene impuestos mensualmente (Retención en la Fuente) según la remuneración y composición del hogar.\n• **Anexos**: Modelo 3 estándar y **Anexo A** (Rendimientos del trabajo dependiente y pensiones).\n• **IRS Automático**: Elegible en la mayoría de situaciones, siempre que Hacienda tenga los datos del empleador correctos.\n• **Deducciones Principales**: Gastos de salud (15% hasta €1.000), educación (30% hasta €800), vivienda (intereses hipotecarios o alquileres con contratos antiguos) y gastos generales familiares (35% hasta €250 por cónyuge).\n• **Consejo**: Compare siempre la simulación automática con la manual si tiene hijos o gastos de alquiler que no aparezcan en el e-Fatura.",

        catB_title: "🔨 Trabajador Autónomo / Recibos Verdes (Categoría B)",
        catB_desc: "• **Cómo Funciona**: Régimen Simplificado (facturación hasta €200.000/año) o Contabilidad Organizada.\n• **Anexos**: **Anexo B** (Régimen simplificado) o **Anexo C** (Contabilidad) + **Anexo SS** (Seguridad Social).\n• **Regla del 15% de Gastos**: En el Régimen Simplificado de Servicios (donde solo el 75% del rendimiento es tributable y el 25% se asume como gasto), el Estado obliga a justificar el 15% de esa parte con facturas de actividad en el e-Fatura. ¡De lo contrario, pagará más IRS!\n• **Consejo de Oro**: Acceda al e-Fatura y seleccione 'Sim' en la opción de gastos afectos a la actividad profesional para todas las facturas relevantes (internet, electricidad, material de oficina).",

        rnh_title: "✈️ Residente No Habitual (RNH)",
        rnh_desc: "• **Cómo Funciona**: Régimen especial para nuevos residentes en Portugal con actividades de alto valor añadido o pensiones extranjeras.\n• **Anexos**: **Anexo L** (Declaración del régimen especial RNH) y **Anexo J** (Rendimientos obtenidos en el extranjero).\n• **Beneficios**: Tipo especial plano del 20% para rendimientos de trabajo en profesiones de alto valor. Tipo fijo del 10% sobre pensiones de origen extranjero.\n• **Trampa**: Si los rendimientos del extranjero no están debidamente identificados en el Anexo J con el código del país de origen, Hacienda tributará los importes al tipo progresivo normal (hasta el 48%).",

        jovem_title: "🎓 IRS Jovem (Jóvenes Titulados)",
        jovem_desc: "• **Cómo Funciona**: Beneficio para jóvenes de 18 a 30 años (35 para doctorados) tras completar estudios secundarios, profesionales o superiores.\n• **Anexos**: **Modelo 3 (Manual), Cuadro 4 de la Hoja de Portada y Anexo A** (Cuadro 4F — donde se declara el beneficio).\n• **Beneficio Progresivo**: Exención de IRS de:\n  - 100% en el 1.er año (límite de 40x IAS)\n  - 75% en el 2.º año (límite de 30x IAS)\n  - 50% en el 3.er y 4.º años (límite de 20x IAS)\n  - 25% en el 5.º año (límite de 10x IAS)\n• **Atención**: ¡El IRS Jovem NO es automático! Si presenta el IRS Automático sin rellenar el Anexo A manualmente, perderá el derecho al descuento fiscal ese año.",

        pension_title: "👴 Pensionistas y Jubilados",
        pension_desc: "• **Cómo Funciona**: Las pensiones nacionales o extranjeras se encuadran en la Categoría H.\n• **Anexos**: **Anexo A** (para pensiones pagadas por la Seguridad Social o CGA portuguesa) o **Anexo J** (para pensiones de origen extranjero).\n• **Mínimo de Existencia**: Si la suma de sus pensiones anuales es inferior a €11.480 (en 2026), está totalmente exento de pagar IRS.\n• **Consejo**: Verifique si Portugal tiene un convenio de doble imposición con el país de origen de su pensión extranjera para evitar pagar impuestos en ambos países.",

        investor_title: "📈 Inversores (Ganancias de Capital, Acciones & Crypto)",
        investor_desc: "• **Cómo Funciona**: Ganancias con inversiones financieras (acciones, intereses, dividendos) o venta de propiedades inmobiliarias.\n• **Anexos**: **Anexo G** (Plusvalías nacionales / Inmobiliario) y **Anexo J** (Rendimientos y plusvalías obtenidos en el extranjero, ej: Degiro, Trading 212, Interactive Brokers).\n• **Criptomonedas**: Las ganancias de venta de criptoactivos mantenidos por MENOS de 365 días pagan una tasa fija del 28%. Si mantiene los activos por MÁS de 365 días, ¡la plusvalía está 100% exenta de impuestos!\n• **Plusvalías Inmobiliarias**: Se grava el 50% de la ganancia. Exento si reinvierte el importe de la venta en la compra de otra vivienda habitual en un plazo de 36 meses.\n• **Englobamiento**: Si sus rendimientos generales son bajos, simule el englobamiento de intereses o plusvalías, pues podría pagar menos que el tipo fijo del 28%.",

        expat_title: "🌍 Inmigrantes y Cuentas en el Extranjero",
        expat_desc: "• **Cómo Funciona**: Inmigrantes que residan y trabajen en Portugal, o residentes con cuentas bancarias en el extranjero.\n• **Anexos**: **Anexo J** (Obligatorio para declarar cuentas y rendimientos externos).\n• **Cuentas Extranjeras**: Si tiene cuentas en bancos como Revolut, Wise, N26, Bunq, etc., es OBLIGATORIO declarar el IBAN de esas cuentas en el Cuadro 11 del Anexo J del IRS. La multa por ocultar un IBAN extranjero va de €50 a €250 por cuenta.\n• **Trampa de la Dirección**: Si trabajó en Portugal como residente pero su dirección fiscal en el NIF aún constaba como su país de origen, Hacienda tributará sus salarios a un tipo fijo del 25% (No Residente) sin derecho a deducciones. ¡Actualice su dirección fiscal inmediatamente en el Portal das Finanças!",

        calendar_title: "📅 Calendario Crítico",
        calendar_desc: "• 1 de abril a 30 de junio: Presentación obligatoria de la declaración.\n• 15 de febrero: Plazo para comunicar el núcleo familiar.\n🔗 Núcleo Familiar: https://irs.portaldasfinancas.gov.pt\n📍 Camino: Acceder al Portal ➔ IRS ➔ Hacer clic en 'Comunicar Agregado Familiar' (hasta el 15 de febrero).\n• 25 de febrero: Plazo para validar facturas en el e-Fatura.",
        hack_efatura_title: "💡 Hack: ¿Facturas Perdidas?",
        hack_efatura_desc: "Si perdió el plazo del e-Fatura o el portal falló, ¡NO se desespere! Al rellenar el IRS Manual (Modelo 3, Anexo H, Cuadro 6C), puede rechazar los valores precompletados y añadir manualmente los gastos reales de Salud, Educación, Residencias y Vivienda. Guarde los justificantes físicos durante 4 años.\n\n🔗 Portal e-Fatura: https://faturas.portaldasfinancas.gov.pt\n📍 Camino: Acceder con credenciales ➔ Elegir perfil 'Adquirente' ➔ Hacer clic en 'Complementar Informação de Faturas' para asociar gastos pendientes.",
        hack_nif_title: "🛒 La Regla de Oro del NIF",
        hack_nif_desc: "Pida NIF en todo. Los pequeños gastos (supermercados, peluquería, restaurantes, veterinarios, transporte) acumulan una devolución directa del IVA. El alquiler y los gastos de intereses hipotecarios deben constar obligatoriamente.",

        mode_comparison: "🔍 Comparación de Modos",
        mode_auto_title: "IRS Automático — Trampas",
        mode_auto_desc: "Parece fácil: el sistema rellena y presenta. ¡Pero atención! Si tiene hijos, gastos de alquiler, estatuto RNH, o rendimientos en el extranjero, el simulador automático suele ignorar deducciones cruciales. Nunca presente sin simular antes el IRS Automático vs. Manual.\n\n🔗 Simulador de IRS: https://irs.portaldasfinancas.gov.pt\n📍 Camino: Acceder al Portal ➔ IRS ➔ Hacer clic en 'Simular' o 'Entregar Declaração' para comparar los valores.",
        mode_manual_title: "IRS Manual (Modelo 3) & Anexos",
        mode_manual_desc: "• Anexo B (Recibos Verdes / Autónomos): En el régimen simplificado, el Fisco asume el 25% de su rendimiento como gasto libre de impuestos, pero le obliga a justificar el 15% de esa parte con gastos de la actividad. ¡Si no lo hace, pagará más IRS!\n• Anexo J (Rendimientos en el Extranjero): ¿Tiene cuenta en Revolut, Wise o salarios remotos? Es obligatorio declarar el IBAN extranjero y los rendimientos externos. Las multas por ocultar IBANs extranjeros van de €50 a €250 por cuenta.\n\n🔗 Declaración Manual: https://irs.portaldasfinancas.gov.pt\n📍 Camino: Acceder ➔ IRS ➔ 'Declaração' ➔ Elegir 'Entregar Modelo 3'. Añada los anexos correspondientes.",
        joint_filing_title: "💑 Tributación Conjunta vs. Separada",
        joint_filing_desc: "Casados o en unión de hecho por más de 2 años: Simule SIEMPRE ambas opciones. Si uno de los cónyuges gana significativamente más que el otro, la Tributación Conjunta (declarar juntos) reduce notablemente el tramo de IRS combinado, generando reembolsos masivos.\n\n🔗 Simulador de IRS: https://irs.portaldasfinancas.gov.pt\n📍 Camino: En el Modelo 3 (Manual), en la Hoja de Portada ➔ Cuadro 4 (Estado Civil) ➔ Seleccionar 'Sim' en la opción de Tributación Conjunta.",

        refund_explanation: "💸 ¿Cómo se Calcula el Reembolso?",
        refund_desc: "El reembolso no es dinero gratis del Estado. Es la devolución del impuesto que pagó en exceso mensualmente (Retención en la Fuente). La fórmula es:\n\n[IRS Adeudado = (Rendimiento Imponible - Deducciones) × Tasa del Tramo]\n\nSi lo retenido durante el año fue superior al IRS Adeudado, recibe reembolso. En caso contrario, deberá pagar al Estado.\n\n🔗 Estado del Reembolso: https://irs.portaldasfinancas.gov.pt\n📍 Camino: Acceder al Portal ➔ IRS ➔ Hacer clic en 'Consultar Declaração' ➔ Seleccionar el año para ver el estado.",
        exist_minimum: "🛡️ El Mínimo de Existencia",
        exist_minimum_desc: "En Portugal, el Estado garantiza el 'Mínimo de Existencia' (exento de IRS para rendimientos hasta €11.480 anuales en 2026). Si ganó menos que este límite durante el año y le fue retenido algún impuesto, tiene derecho a recuperar el 100% de los importes retenidos.\n\n🔗 Consulta de Deducciones: https://irs.portaldasfinancas.gov.pt\n📍 Camino: Acceder ➔ IRS ➔ Hacer clic en 'Consultar Despesas p/ Deduções à Coleta' para ver el detalle de gastos calculados.",
        refund_speed: "⚡ ¿Cómo Recibir Más Rápido?",
        refund_speed_desc: "Presentar en la primera semana de abril suele procesar los reembolsos en unos 12 a 18 días. Las presentaciones posteriores a mayo entran en la cola de auditoría manual y pueden tardar más de 45 días.",

        consign_sec: "❤️ El Secreto de la Consignación",
        consign_desc: "• Consignación de IRS (0,5%): Puede destinar el 0,5% del impuesto calculado a una IPSS, asociación cultural o ambiental. Esto se extrae del impuesto que iría al Estado. Es 100% gratuito y no reduce su reembolso.\n• Consignación de IVA (15%): ¡Atención! Si selecciona la casilla para consignar el IVA, estará donando su propio beneficio fiscal de facturas acumuladas. Esto NO es gratuito y reducirá su reembolso. ¡Seleccione únicamente la casilla de IRS!\n\n🔗 Consignación de IRS: https://irs.portaldasfinancas.gov.pt\n📍 Camino: Para consignar antes: Acceder al Portal ➔ Buscar 'Comunicar Entidade a Consignar'. Para consignar al presentar: En Modelo 3, Hoja de Portada ➔ Cuadro 11 ➔ Seleccionar tipo de entidad (IRS) e insertar el NIF de la institución.",

        address_trap: "🏠 La Trampa de la Dirección Fiscal (NIF)",
        address_trap_desc: "El mayor error de los inmigrantes: Si trabajó como residente en Portugal pero su dirección fiscal en el NIF aún constaba como su país de origen, Hacienda tributará sus rendimientos a un tipo fijo del 25% (No Residente) sin deducciones. ¡Actualice su dirección en el Portal das Finanças inmediatamente!\n\n🔗 Actualización de Dirección: https://www.portaldasfinancas.gov.pt\n📍 Camino: Usar la barra de búsqueda superior ➔ Escribir 'Alterar Morada Fiscal' ➔ Acceder con credenciales ➔ Insertar la nueva dirección portuguesa y confirmar con el código enviado por correo postal (o con Chave Móvel Digital).",
        divergences: "⚠️ Divergencias & Auditorías",
        divergences_desc: "Si su empleador declaró importes distintos a los que usted indicó en su declaración, el sistema genera una 'Divergencia'. Verifique siempre los datos con la 'Declaração de Rendimentos' oficial de la empresa antes de presentar.\n\n🔗 Consultar Divergencias: https://irs.portaldasfinancas.gov.pt\n📍 Camino: Acceder al Portal ➔ IRS ➔ Hacer clic en 'Consultar Divergências' para ver el detalle y adjuntar los documentos justificativos solicitados.",

        next: "Continuar",
        back: "Volver",
        reset: "Reiniciar Guía",
        portal_btn: "Ir al Portal das Finanças",
        disclaimer: "Esta información es meramente orientativa basada en la legislación y normativa fiscal vigente en Portugal. Se recomienda consultar las guías oficiales de la Autoridad Tributaria o a un contable certificado."
    },
    fr: {
        title: "IRS Sans Secrets",
        subtitle: "Impôt sur le Revenu des Personnes Physiques au Portugal",
        step1_title: "1. Délais & Astuces Factures",
        step2_title: "2. Profils de Déclarants",
        step3_title: "3. Modes de Déclaration",
        step4_title: "4. Secrets de Remboursement",
        step5_title: "5. Consignation Avancée",
        step6_title: "6. Éviter les Erreurs Graves",

        profile_title: "Sélectionnez votre Profil Fiscal",
        profile_subtitle: "Découvrez les déductions spécifiques pour votre situation au Portugal",
        profile_dep: "Salarié (Catégorie A)",
        profile_ind: "Indépendant / Recibos Verdes",
        profile_rnh: "RNH / Résident Non Habituel",
        profile_jovem: "IRS Jovem (Exonération)",
        profile_pension: "Retraité (Pensions)",
        profile_investor: "Investisseur / Crypto / Immo",
        profile_expat: "Expatrié / Travaillé à l'Étranger",

        catA_title: "🧑‍💼 Salariés (Catégorie A)",
        catA_desc: "• Déduction Forfaitaire: Déduction automatique de 4.104 € par travailleur.\n• Déductions d'Éducation & Santé: Validez vos factures avec NIF sur e-fatura pour réduire l'impôt.\n• Retenue à la Source: Ajustez votre taux d'imposition pour éviter de trop payer.",

        catB_title: "💻 Indépendants / Recibos Verdes (Catégorie B)",
        catB_desc: "• Régime Simplifié: Coefficient d'abattement automatique sur le chiffre d'affaires.\n• Factures d'Activité: Justifiez 15% de vos dépenses professionnelles sur e-fatura.\n• Option pour la Comptabilité Organisée: Avantageux si vos charges réelles dépassent 25%.",

        rnh_title: "🛡️ RNH / Résident Non Habituel",
        rnh_desc: "• Taux Fixe de 20%: Applicable aux revenus à haute valeur ajoutée au Portugal.\n• Exonération de Revenus Étrangers: Prévention de la double imposition selon les conventions internationales.",

        jovem_title: "🎓 IRS Jovem (Avantages fiscaux)",
        jovem_desc: "• Exonération Progressive d'Impôt: Pour les jeunes actifs après leurs études jusqu'à 35 ans.\n• Économies Majeures: Économisez des milliers d'euros d'impôts sur les premières années d'activité.",

        pension_title: "👴 Retraités & Pensions",
        pension_desc: "• Déduction de Base sur les Pensions: Déduction légale garantie sur la Retraite.\n• Exonération jusqu'à 11.480 €: Pensions annuelles inférieures à ce montant sont totalement exonérées.",

        investor_title: "📈 Investisseurs & Crypto",
        investor_desc: "• Plus-values Immobilières & Mobilières: Taux d'imposition forfaitaire de 28% ou option de cumul.\n• Cryptomonnaies: Exonérées si détenues plus de 365 jours.",

        expat_title: "🏛️ Expatriés & Double Imposition",
        expat_desc: "• Crédit d'Impôt International: Évitez de payer deux fois si vous avez payé des impôts à l'étranger.\n• Conventions Fiscales: Appliquez les traités signés entre le Portugal et votre pays d'origine.",

        calendar_title: "📅 Calendrier Officiel IRS 2026",
        calendar_desc: "• Janvier à Février: Validation des factures sur e-fatura.\n• 1er Avril au 30 Juin: Soumission obligatoire de la Déclaration IRS (Modèle 3).\n• Juillet à Août: Réception des remboursements et avis d'imposition.",

        hack_efatura_title: "⚡ Astuces e-fatura",
        hack_efatura_desc: "N'oubliez pas d'insérer votre NIF sur chaque achat de santé, éducation, loyer ou restaurant et de valider les catégories sur l'application e-fatura avant la date limite.",

        hack_nif_title: "✅ Validation du NIF",
        hack_nif_desc: "Vérifiez que votre NIF est correctement associé à votre adresse fiscale au Portugal pour éviter d'être imposé au taux forfaitaire de non-résident.",

        mode_auto_title: "🤖 IRS Automatique",
        mode_auto_desc: "Idéal pour les salariés sans situations complexes. Soumission en un seul clic.",

        mode_manual_title: "📝 IRS Manuel (Modèle 3)",
        mode_manual_desc: "Requis pour les travailleurs indépendants, investisseurs ou revenus de l'étranger.",

        consign_title: "🎁 Consignation d'Impôt (0,5% Gratuit)",
        consign_desc: "Faites don de 0,5% de votre impôt à une association caritative sans rien débourser de votre remboursement.",

        address_trap: "🏠 Piège de l'Adresse Fiscale",
        address_trap_desc: "Mettez à jour votre adresse fiscale sur le Portal das Finanças dès votre installation au Portugal.",

        divergences: "⚠️ Divergences & Contrôles",
        divergences_desc: "Vérifiez toujours la Déclaration de Revenus transmise par votre employeur avant de soumettre.",

        next: "Continuer",
        back: "Retour",
        reset: "Réinitialiser",
        portal_btn: "Aller sur Portal das Finanças",
        disclaimer: "Information à titre indicatif basée sur la législation fiscale en vigueur au Portugal."
    }
};

const renderContentWithLinks = (text: string, lang: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
        const trimmed = line.trim();
        
        // Parse bold markdown **text**
        let content: React.ReactNode = line;
        const boldRegex = /\*\*(.*?)\*\*/g;
        if (boldRegex.test(line)) {
            const parts = line.split(boldRegex);
            content = parts.map((part, partIdx) => {
                if (partIdx % 2 === 1) {
                    return <strong key={partIdx} className="text-slate-950 font-black">{part}</strong>;
                }
                return part;
            });
        }

        if (trimmed.startsWith('🔗')) {
            const withoutEmoji = trimmed.substring(1).trim();
            const colonIdx = withoutEmoji.indexOf(':');
            let label = '';
            let url = '';
            if (colonIdx !== -1) {
                label = withoutEmoji.substring(0, colonIdx).trim();
                url = withoutEmoji.substring(colonIdx + 1).trim();
            } else {
                url = withoutEmoji.trim();
            }
            const cleanUrl = url.startsWith('http') ? url : `https://${url}`;
            return (
                <div key={idx} className="flex flex-wrap items-center gap-1.5 mt-2.5 mb-1.5 p-3 bg-red-500/5 border border-red-500/10 rounded-[1.25rem] w-full">
                    <span className="text-red-500 text-sm shrink-0">🔗</span>
                    {label && <span className="font-extrabold text-slate-900 text-[10px] uppercase tracking-wide shrink-0">{label}:</span>}
                    <a
                        href={cleanUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-600 hover:text-red-700 underline font-black inline-flex items-center gap-1 break-all text-[10.5px]"
                    >
                        {url.replace(/^https?:\/\/(www\.)?/, '')}
                        <ExternalLink size={10} className="shrink-0 ml-0.5 text-red-500" />
                    </a>
                </div>
            );
        }
        if (trimmed.startsWith('📍')) {
            const withoutEmoji = trimmed.substring(1).trim();
            const colonIdx = withoutEmoji.indexOf(':');
            let label = '';
            let pathText = '';
            if (colonIdx !== -1) {
                label = withoutEmoji.substring(0, colonIdx).trim();
                pathText = withoutEmoji.substring(colonIdx + 1).trim();
            } else {
                pathText = withoutEmoji;
            }
            return (
                <div key={idx} className="mt-2.5 mb-2.5 p-3.5 bg-slate-100 border border-slate-200/60 rounded-[1.25rem] text-slate-700 font-medium w-full">
                    <div className="flex items-center gap-1.5 mb-1.5 text-slate-800">
                        <span className="text-red-500 text-sm">📍</span>
                        <strong className="text-slate-950 font-black uppercase text-[9px] tracking-wider">
                            {lang === 'pt' || lang === 'br' ? 'Como Encontrar (Caminho)' : lang === 'es' ? 'Cómo Encontrar (Ruta)' : 'How to Find (Path)'}
                        </strong>
                    </div>
                    <span className="text-[10.5px] leading-relaxed block text-slate-800 font-semibold">{pathText.trim()}</span>
                </div>
            );
        }
        return (
            <span key={idx} className="block min-h-[0.5rem] leading-relaxed text-slate-700 text-[11px] font-semibold">
                {content}
            </span>
        );
    });
};

export const IrsWizard: React.FC<IrsWizardProps> = ({ language, onBack, onSelectTemplate }) => {
    const [step, setStep] = useState<1 | 2>(1);
    const [activeProfile, setActiveProfile] = useState<'dep' | 'ind' | 'rnh' | 'jovem' | 'pension' | 'investor' | 'expat' | null>(null);
    const lang = language.toLowerCase() === 'fr' ? 'fr' : language.toLowerCase() === 'es' ? 'es' : language.toLowerCase() === 'en' ? 'en' : 'pt';
    
    const tLocal = (key: string) => LOCAL_TRANS[lang]?.[key] || LOCAL_TRANS['pt'][key] || key;

    const handleProfileSelect = (profileId: 'dep' | 'ind' | 'rnh' | 'jovem' | 'pension' | 'investor' | 'expat') => {
        audioService.playClick();
        setActiveProfile(profileId);
        setStep(2);
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(1);
            setActiveProfile(null);
        } else {
            onBack();
        }
    };

    const profiles = [
        { id: 'dep' as const, label: tLocal('profile_dep'), emoji: '🧑‍💼' },
        { id: 'ind' as const, label: tLocal('profile_ind'), emoji: '💻' },
        { id: 'rnh' as const, label: tLocal('profile_rnh'), emoji: '✈️' },
        { id: 'jovem' as const, label: tLocal('profile_jovem'), emoji: '🎓' },
        { id: 'pension' as const, label: tLocal('profile_pension'), emoji: '👴' },
        { id: 'investor' as const, label: tLocal('profile_investor'), emoji: '📈' },
        { id: 'expat' as const, label: tLocal('profile_expat'), emoji: '🌍' },
    ];

    return (
        <div className="relative h-full flex flex-col bg-slate-950 text-white select-none overflow-hidden">
            {/* ── STICKY HERO BANNER ─────────────────────────────────────────── */}
            <div className="relative shrink-0 overflow-hidden bg-gradient-to-b from-slate-950 via-red-950/25 to-slate-950 px-6 pt-5 pb-8 border-b border-white/5">
                {/* Background Glassmorphism Blobs */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-[90px] -mr-32 -mt-32 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-rose-500/10 rounded-full blur-[80px] -ml-24 -mb-24 pointer-events-none" />
                
                {/* Sticky Header Nav Row */}
                <div className="relative z-10 flex items-center justify-between mb-8">
                    <button
                        onClick={handleBack}
                        className="w-10 h-10 rounded-2xl bg-white/10 text-white flex items-center justify-center border border-white/10 active:scale-90 transition-all hover:bg-white/20"
                    >
                        <ArrowLeft size={16} />
                    </button>

                    <StepDots total={2} current={step} />

                    <div className="flex items-center gap-1">
                        <Sparkles size={12} className="text-red-400 animate-pulse" />
                        <span className="text-[10px] font-black text-red-400 uppercase tracking-widest bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
                            🎯 {step}/2
                        </span>
                    </div>
                </div>

                {/* Hero Title & Description */}
                <div className="relative z-10 space-y-4">
                    <div className="flex justify-between items-start">
                        <BadgePill
                            icon={<Calculator size={10} />}
                            text={tLocal('title')}
                        />
                    </div>

                    {step === 1 ? (
                        <div className="animate-in slide-in-from-bottom-2 duration-400">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">
                                {tLocal('profile_title')}
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                {tLocal('profile_subtitle')}
                            </p>
                        </div>
                    ) : (
                        <div className="animate-in slide-in-from-bottom-2 duration-400">
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight">
                                {tLocal('title')}
                            </h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                                {tLocal('subtitle')}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── SCROLLABLE BODY ──────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto bg-slate-50 no-scrollbar">
                <div className="p-5 space-y-5 pb-12">
                    
                    {/* STEP 1: Profile Selection Grid */}
                    {step === 1 && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="space-y-3">
                                {profiles.map((prof) => (
                                    <button
                                        key={prof.id}
                                        onClick={() => handleProfileSelect(prof.id)}
                                        className="group w-full bg-white border border-slate-100 rounded-[2.25rem] p-5 flex items-center gap-4 text-left transition-all duration-500 hover:border-red-400/30 hover:shadow-2xl hover:shadow-red-500/5 active:scale-[0.97]"
                                    >
                                        <div className="relative w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 group-hover:bg-white transition-all duration-500">
                                            {prof.emoji}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider border rounded-full bg-red-500/10 text-red-600 border-red-500/20">
                                                    {prof.id === 'rnh' ? 'RNH' : prof.id === 'jovem' ? 'IRS JOVEM' : prof.id === 'expat' ? 'EXPAT' : 'PADRÃO'}
                                                </span>
                                            </div>
                                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight leading-tight group-hover:text-slate-950 transition-colors">
                                                {prof.label}
                                            </h4>
                                        </div>
                                        <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900 transition-all duration-300 shrink-0">
                                            <ChevronRight size={14} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Full Content Guide based on selected profile */}
                    {step === 2 && activeProfile && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                            
                            {/* Selected Profile Detail Card */}
                            {activeProfile === 'dep' && (
                                <AccordionCard title={tLocal('catA_title')} icon={<User size={15} />} defaultOpen={true}>
                                    <div className="text-slate-700 font-semibold space-y-2">
                                        {renderContentWithLinks(tLocal('catA_desc'), lang)}
                                    </div>
                                </AccordionCard>
                            )}
                            {activeProfile === 'ind' && (
                                <AccordionCard title={tLocal('catB_title')} icon={<Briefcase size={15} />} defaultOpen={true}>
                                    <div className="text-slate-700 font-semibold space-y-2">
                                        {renderContentWithLinks(tLocal('catB_desc'), lang)}
                                    </div>
                                </AccordionCard>
                            )}
                            {activeProfile === 'rnh' && (
                                <AccordionCard title={tLocal('rnh_title')} icon={<ShieldCheck size={15} />} defaultOpen={true}>
                                    <div className="text-slate-700 font-semibold space-y-2">
                                        {renderContentWithLinks(tLocal('rnh_desc'), lang)}
                                    </div>
                                </AccordionCard>
                            )}
                            {activeProfile === 'jovem' && (
                                <AccordionCard title={tLocal('jovem_title')} icon={<GraduationCap size={15} />} defaultOpen={true}>
                                    <div className="text-slate-700 font-semibold space-y-2">
                                        {renderContentWithLinks(tLocal('jovem_desc'), lang)}
                                    </div>
                                </AccordionCard>
                            )}
                            {activeProfile === 'pension' && (
                                <AccordionCard title={tLocal('pension_title')} icon={<User size={15} />} defaultOpen={true}>
                                    <div className="text-slate-700 font-semibold space-y-2">
                                        {renderContentWithLinks(tLocal('pension_desc'), lang)}
                                    </div>
                                </AccordionCard>
                            )}
                            {activeProfile === 'investor' && (
                                <AccordionCard title={tLocal('investor_title')} icon={<TrendingUp size={15} />} defaultOpen={true}>
                                    <div className="text-slate-700 font-semibold space-y-2">
                                        {renderContentWithLinks(tLocal('investor_desc'), lang)}
                                    </div>
                                </AccordionCard>
                            )}
                            {activeProfile === 'expat' && (
                                <AccordionCard title={tLocal('expat_title')} icon={<Landmark size={15} />} defaultOpen={true}>
                                    <div className="text-slate-700 font-semibold space-y-2">
                                        {renderContentWithLinks(tLocal('expat_desc'), lang)}
                                    </div>
                                </AccordionCard>
                            )}

                            <div className="my-8 h-px bg-slate-200/50" />

                            {/* Calendar & Invoice Hacks */}
                            <AccordionCard title={tLocal('calendar_title')} icon={<Landmark size={15} />} defaultOpen={false}>
                                <div className="text-slate-700 font-semibold space-y-2">
                                    {renderContentWithLinks(tLocal('calendar_desc'), lang)}
                                </div>
                            </AccordionCard>

                            <AccordionCard title={tLocal('hack_efatura_title')} icon={<Sparkles size={15} />} defaultOpen={false}>
                                <div className="text-slate-700 font-semibold space-y-2">
                                    {renderContentWithLinks(tLocal('hack_efatura_desc'), lang)}
                                </div>
                            </AccordionCard>

                            <AccordionCard title={tLocal('hack_nif_title')} icon={<CheckCircle2 size={15} />} defaultOpen={false}>
                                <div className="text-slate-700 font-semibold space-y-2">
                                    {renderContentWithLinks(tLocal('hack_nif_desc'), lang)}
                                </div>
                            </AccordionCard>

                            <div className="my-8 h-px bg-slate-200/50" />

                            {/* Modos de Declaração */}
                            <AccordionCard title={tLocal('mode_auto_title')} icon={<AlertTriangle size={15} />} defaultOpen={false}>
                                <div className="text-slate-700 font-semibold space-y-2">
                                    {renderContentWithLinks(tLocal('mode_auto_desc'), lang)}
                                </div>
                            </AccordionCard>

                            <AccordionCard title={tLocal('mode_manual_title')} icon={<Calculator size={15} />} defaultOpen={false}>
                                <div className="text-slate-700 font-semibold space-y-2">
                                    {renderContentWithLinks(tLocal('mode_manual_desc'), lang)}
                                </div>
                            </AccordionCard>

                            <AccordionCard title={tLocal('joint_filing_title')} icon={<ShieldCheck size={15} />} defaultOpen={false}>
                                <div className="text-slate-700 font-semibold space-y-2">
                                    {renderContentWithLinks(tLocal('joint_filing_desc'), lang)}
                                </div>
                            </AccordionCard>

                            <div className="my-8 h-px bg-slate-200/50" />

                            {/* Segredos do Reembolso */}
                            <AccordionCard title={tLocal('refund_explanation')} icon={<Info size={15} />} defaultOpen={false}>
                                <div className="text-slate-700 font-semibold space-y-2">
                                    {renderContentWithLinks(tLocal('refund_desc'), lang)}
                                </div>
                            </AccordionCard>

                            <AccordionCard title={tLocal('exist_minimum')} icon={<ShieldCheck size={15} />} defaultOpen={false}>
                                <div className="text-slate-700 font-semibold space-y-2">
                                    {renderContentWithLinks(tLocal('exist_minimum_desc'), lang)}
                                </div>
                            </AccordionCard>

                            <AccordionCard title={tLocal('refund_speed')} icon={<Sparkles size={15} />} defaultOpen={false}>
                                <div className="text-slate-700 font-semibold space-y-2">
                                    {renderContentWithLinks(tLocal('refund_speed_desc'), lang)}
                                </div>
                            </AccordionCard>

                            <div className="my-8 h-px bg-slate-200/50" />

                            {/* Consignação Avançada & Portal Finanças */}
                            <AccordionCard title={tLocal('consign_sec')} icon={<Gift size={15} />} defaultOpen={false}>
                                <div className="text-slate-700 font-semibold space-y-2">
                                    {renderContentWithLinks(tLocal('consign_desc'), lang)}
                                </div>
                            </AccordionCard>

                            <div className="bg-white border border-slate-100 rounded-[2rem] p-5 shadow-sm space-y-3">
                                <div className="flex items-start gap-3.5">
                                    <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                                        <Landmark size={18} />
                                    </div>
                                    <div className="space-y-1 flex-1">
                                        <h4 className="text-[10px] font-black text-red-600 uppercase tracking-widest">
                                            Autoridade Tributária
                                        </h4>
                                        <p className="text-xs text-slate-500 font-bold leading-relaxed">
                                            Submeta diretamente no Portal das Finanças oficial.
                                        </p>
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-slate-100 mt-2">
                                    <a
                                        href="https://www.portaldasfinancas.gov.pt"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-red-600 text-[9px] font-black uppercase tracking-widest hover:text-red-700 transition-colors"
                                    >
                                        {tLocal('portal_btn')}
                                        <ExternalLink size={10} />
                                    </a>
                                </div>
                            </div>

                            <div className="my-8 h-px bg-slate-200/50" />

                            {/* Evitar Problemas Graves */}
                            <AccordionCard title={tLocal('address_trap')} icon={<AlertTriangle size={15} />} defaultOpen={false}>
                                <div className="text-slate-700 font-semibold space-y-2">
                                    {renderContentWithLinks(tLocal('address_trap_desc'), lang)}
                                </div>
                            </AccordionCard>

                            <AccordionCard title={tLocal('divergences')} icon={<HelpCircle size={15} />} defaultOpen={false}>
                                <div className="text-slate-700 font-semibold space-y-2">
                                    {renderContentWithLinks(tLocal('divergences_desc'), lang)}
                                </div>
                            </AccordionCard>

                            {onSelectTemplate && (
                                <div className="space-y-3 mt-8">
                                    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] border-l-4 border-red-500 pl-3">
                                        {lang === 'pt' ? 'Minutas e Documentos Disponíveis' : (lang === 'es' ? 'Minutas y Documentos Disponibles' : lang === 'fr' ? 'Modèles et Documents Disponibles' : 'Available Templates & Documents')}
                                    </h3>
                                    <div className="grid gap-3">
                                        {(() => {
                                            const docIds = activeProfile === 'expat' 
                                                ? ['at_alteracao_morada_estrangeiro', 'at_reclamacao_graciosa_irs']
                                                : activeProfile === 'rnh'
                                                ? ['at_isencao_rnh_req']
                                                : ['at_reclamacao_graciosa_irs'];
                                            
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
                                                            hover:border-red-400 hover:shadow-xl hover:shadow-red-500/8
                                                            active:scale-[0.98] transition-all shadow-sm text-left
                                                        "
                                                    >
                                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                                            <div className="p-3 bg-red-50 text-red-500 rounded-2xl border border-red-100/50 group-hover:bg-red-500 group-hover:text-white transition-colors shrink-0">
                                                                <FileText size={17} />
                                                            </div>
                                                            <div className="flex flex-col gap-0.5 min-w-0">
                                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                                                    {lang === 'pt' ? 'Preencher Documento' : (lang === 'es' ? 'Rellenar Documento' : lang === 'fr' ? 'Remplir le document' : 'Fill Document')}
                                                                </span>
                                                                <span className="text-[10px] font-extrabold text-slate-700 uppercase tracking-tight whitespace-normal break-words leading-tight group-hover:text-red-500 transition-colors">
                                                                    <TranslatedText
                                                                        text={template.title}
                                                                        language={language}
                                                                        shouldTranslate={language?.toUpperCase() !== 'PT' && language?.toUpperCase() !== 'BR'}
                                                                    />
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="w-8 h-8 rounded-xl bg-slate-55 border border-slate-100/50 flex items-center justify-center text-slate-400 group-hover:bg-red-500 group-hover:text-white group-hover:border-red-500 transition-colors duration-300 shrink-0 ml-3">
                                                            <ChevronRight size={14} />
                                                        </div>
                                                    </button>
                                                );
                                            });
                                        })()}
                                    </div>
                                </div>
                            )}

                            {/* Disclaimer */}
                            <div className="p-4 bg-red-50/50 border border-red-100 rounded-2xl">
                                <p className="text-[10px] text-red-800/70 font-bold leading-relaxed text-center italic">
                                    {tLocal('disclaimer')}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};
