// src/components/RetirementWizard.tsx
import React, { useState, useMemo } from 'react';
import {
    ArrowLeft, ChevronRight, Sparkles, Calculator, ExternalLink,
    AlertTriangle, ShieldCheck, FileText, UserCheck, CreditCard,
    Calendar, Clock, ChevronDown, ChevronUp, TrendingUp, Award, Globe, Scale,
    HeartHandshake, Pill, Glasses, Zap, Home, CheckCircle2, Building2, AlertCircle
} from 'lucide-react';
import { audioService } from '../services/audioService';
import { templates } from '../utils/documentsDatabase';
import { t } from '../utils/translations';
import {
    calculateMiraRetirement,
    MiraRetirementAssessment,
    getLegalRetirementAge
} from '../services/miraRetirementEngine';

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
const AccordionCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean; id?: string }> = ({ title, icon, children, defaultOpen = false, id }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div id={id} className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden transition-all duration-300">
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
                <div className="px-6 pb-6 border-t border-slate-50 text-[11px] text-slate-600 font-semibold leading-relaxed space-y-3 bg-white animate-in slide-in-from-top-2 duration-300 pt-4">
                    {children}
                </div>
            )}
        </div>
    );
};

// ════════════════════════ Translations ═══════════════════════════════════════
type Lang = 'pt' | 'br' | 'es' | 'en' | 'fr';

const TRANS: Record<Lang, Record<string, string>> = {
    "pt": {
        "badge": "Reforma & Aposentadoria",
        "step1_q": "Qual é o seu perfil contributivo?",
        "step1_desc": "Selecione a opção que melhor descreve a sua situação profissional e histórico de contribuições.",
        "step2_h": "Guia Completo de Reforma",
        "step2_desc": "Pensão de Velhice da Segurança Social (DL 187/2007)",
        "opt_standard": "Trabalhador Padrão",
        "opt_standard_sub": "Descontos apenas em Portugal",
        "opt_expat": "Imigrante / Trabalhador Internacional",
        "opt_expat_sub": "Contribuições em Portugal e no estrangeiro (Pro Rata)",
        "opt_long_career": "Carreira Longa (+40 anos)",
        "opt_long_career_sub": "Idade bonificada sem penalizações",
        "opt_freelance": "Trabalhador Independente",
        "opt_freelance_sub": "Recibos Verdes / Empresário",
        "req_age_title": "📅 Idade Normal de Reforma (2026)",
        "req_age_desc": "• Idade normal de reforma em Portugal (2026): 66 anos e 9 meses (Portaria n.º 291/2024/1).\n• Bonificação por Carreira Longa (Art. 20.º, n.º 3 do DL 187/2007): a idade pessoal de reforma recua 4 meses por cada ano civil que exceda os 40 anos de carreira aos 65 anos.",
        "req_time_title": "⏳ Período de Garantia Obrigatório",
        "req_time_desc": "• Mínimo de 15 anos civis de registo de remunerações.\n• Totalização Internacional: Os anos de descontos no estrangeiro (Brasil, UE, etc.) somam-se aos anos em Portugal para abrir o direito à pensão!",
        "calc_title": "Simulador de Reforma (DL 187/2007)",
        "calc_age": "Idade Atual",
        "calc_pt_years": "Anos de Desconto em Portugal",
        "calc_foreign_years": "Anos de Desconto no Estrangeiro",
        "calc_salary": "Remuneração de Referência Mensal (€)",
        "calc_btn": "Calcular Reforma",
        "results_title": "Resultado da Simulação",
        "status_eligible_normal": "✅ Elegível para Reforma Normal (Sem cortes)",
        "status_eligible_early": "⚠️ Elegível para Reforma Antecipada (Com cortes legais)",
        "status_eligible_long": "🏆 Elegível por Carreira Longa (Sem cortes!)",
        "status_not_eligible": "❌ Não Elegível (Totalização inferior a 15 anos)",
        "status_too_young": "❌ Não Elegível (Idade inferior a 60 anos)",
        "ret_age_est": "Idade Pessoal de Reforma",
        "monthly_pension": "Pensão Proporcional a Pagar por Portugal",
        "how_request_title": "🏦 Como e Onde Solicitar a Pensão",
        "how_request_desc": "A submissão é efetuada online através da Segurança Social Direta ou nos balcões de atendimento.\n🔗 Pedido Online: https://app.seg-social.pt\n→ Caminho: SS Direta → Menu \"Pensões\" → \"Pensão de Velhice\".",
        "docs_title": "📋 Documentos Obrigatórios da Pensão",
        "docs_desc": "• Documento de Identificação (Cartão de Cidadão / Título de Residência válido).\n• NIF e NISS.\n• Comprovativo de IBAN em nome do beneficiário.\n• Formulários de Ligação Internacional (ex: Formulário I/PT 1 para o Brasil ou Modelo E205 na União Europeia).",
        "formula_title": "📊 Como é Calculada a Pensão?",
        "formula_desc": "O cálculo segue estritamente o Decreto-Lei n.º 187/2007:\n\n1. [Pensão Teórica Integral = Remuneração de Referência × Taxa Teórica Global]\n2. [Pensão Proporcional PT = Pensão Teórica Integral × (Anos PT ÷ Anos Totais)]\n\nSe a reforma for requerida antes da idade legal, aplicam-se a penalização por antecipação (0,5%/mês) e o Fator de Sustentabilidade (15,8% em 2026).",
        "min_pension_title": "🛡️ Garantia de Pensão Mínima & Salvaguarda Pro Rata",
        "min_pension_desc": "Portugal assegura valores mínimos para pensões de velhice consoante os anos de desconto.\n⚠️ Importante: Para carreiras mistas internacionais, o pro rata aplica-se sobre a pensão teórica; o complemento social depende de residência efetiva e prova de recursos.",
        "csi_title": "🏛️ Complemento Solidário para Idosos (CSI) — Apoio Social e Saúde",
        "csi_callout_title": "💡 Pensão Baixa ou Pro Rata Internacional? Conheça o CSI",
        "csi_callout_desc": "O Complemento Solidário para Idosos (CSI) é o principal mecanismo do Estado para nivelar os rendimentos até ao limiar legal de referência, garantindo medicamentos 100% gratuitos e tarifa social de energia.",
        "csi_badge": "Nivelador Social",
        "csi_what_title": "O Que É o Complemento Solidário para Idosos?",
        "csi_what_desc": "O Complemento Solidário para Idosos (CSI) é o principal mecanismo da Segurança Social para retirar pensionistas da zona de pobreza, funcionando como um nivelador de rendimentos: o Estado paga a diferença exata entre os recursos do idoso e o limiar de referência legal.",
        "csi_elig_title": "1. Condições Gerais de Elegibilidade",
        "csi_elig_age": "Idade: Ter atingido a idade normal de reforma da Segurança Social (66 anos e 9 meses em 2026).",
        "csi_elig_status": "Estatuto Contributivo: Ser pensionista de velhice ou sobrevivência (nacional ou estrangeira), ou residente sem pensão com mais de 15 anos de residência legal em Portugal.",
        "csi_elig_residence": "Residência Legal Obrigatória: Residir legalmente em território português há pelo menos 6 anos consecutivos à data do pedido.",
        "csi_elig_vpt": "Património Imobiliário: O Valor Patrimonial Tributário (VPT) dos imóveis do requerente ou casal não pode exceder os limites legais (excluída a habitação própria e permanente até aos limiares da lei).",
        "csi_means_title": "2. Condição de Recursos e Tetos Máximos",
        "csi_means_formula": "[Valor do CSI = Limiar Anual de Recursos − Rendimentos Anuais do Cidadão]",
        "csi_means_single": "Pessoa Isolada: Rendimentos anuais próprios inferiores ao limiar legal de referência do CSI.",
        "csi_means_couple": "Casal (Casados ou União de Facto): Os rendimentos do casal devem ser inferiores ao teto conjugal legal, e os rendimentos específicos do requerente não podem ultrapassar o limite individual.",
        "csi_means_children": "Desconsideração dos Rendimentos dos Filhos: Nas regras vigentes, os rendimentos dos descendentes (filhos e respetivos agregados) foram totalmente eliminados da avaliação da condição de recursos, tornando o acesso estritamente dependente da situação financeira direta do idoso (e cônjuge).",
        "csi_income_title": "3. Rendimentos Contabilizados na Avaliação",
        "csi_income_pensions": "Pensões auferidas: Segurança Social portuguesa, CGA e pensões pagas pelo estrangeiro via acordos bilaterais (ex.: INSS Brasil) ou comunitários (UE).",
        "csi_income_work": "Trabalho: Rendimentos de trabalho dependente (salários) ou trabalho independente (recibos verdes).",
        "csi_income_capital": "Capitais e Imóveis: Rendimentos de capitais (juros/dividendos) e prediais (rendas de imóveis arrendados).",
        "csi_income_assets": "Património Mobiliário: Valor presumido do património mobiliário (contas à ordem, depósitos a prazo, certificados do tesouro, carteiras de investimentos).",
        "csi_benefits_title": "4. Benefícios Adicionais Acoplados ao CSI",
        "csi_benefits_desc": "A atribuição do CSI desbloqueia automaticamente outros direitos de grande impacto no orçamento mensal do pensionista:",
        "csi_bam_title": "Medicamentos a 100% (BAM)",
        "csi_bam_desc": "Medicamentos prescritos comparticipados a 100% pelo SNS na parcela que caberia ao utente (isenção total de copagamento na farmácia).",
        "csi_glasses_title": "Óculos e Dentaduras",
        "csi_glasses_desc": "Comparticipação de despesas em óculos/lentes e próteses dentárias removíveis mediante apresentação de faturas no centro de saúde.",
        "csi_energy_title": "Tarifa Social de Energia",
        "csi_energy_desc": "Desconto automático nas faturas mensais de fornecimento de eletricidade e gás natural canalizado.",
        "csi_housing_title": "Habitação e Isenção de Taxas",
        "csi_housing_desc": "Isenção total de taxas moderadoras no SNS e elegibilidade prioritária em programas municipais de apoio ao arrendamento para idosos.",
        "csi_docs_title": "5. Documentação Necessária e Trâmite de Pedido",
        "csi_docs_forms": "Formulários Oficiais: Requerimento Mod. CSI 1-DGSS, acompanhado do anexo de rendimentos e património (Mod. CSI 1/1-DGSS se tiver cônjuge ou viver em união de facto).",
        "csi_docs_personal": "Documentos de Suporte: Cartão de Cidadão ou Título de Residência válido, NIF, NISS, comprovativo de IBAN, e última nota de liquidação de IRS ou certidão de dispensa de IRS da Autoridade Tributária.",
        "csi_docs_res_proof": "Comprovativo de Residência (6 Anos): Atestado emitido pela Junta de Freguesia a comprovar residência legal em território português há pelo menos 6 anos consecutivos.",
        "csi_docs_foreign_pension": "Carreiras Mistas com Pensões no Estrangeiro: Declaração oficial emitida pela instituição previdenciária estrangeira (ex.: extrato de pagamento do INSS no Brasil ou entidade da UE) com a discriminação do valor bruto da pensão auferida e conversão cambial oficial em euros.",
        "csi_docs_submission": "Onde Submeter: Presencialmente nos balcões da Segurança Social ou nas Lojas de Cidadão (mediante marcação prévia), ou via Segurança Social Direta com Chave Móvel Digital.",
        "bilateral_warning_badge": "Instrução Bilateral Obrigatória",
        "bilateral_warning_desc": "Processos com totalização de períodos no estrangeiro exigem instrução bilateral obrigatória (ex.: Formulário I/PT 1 para o Brasil, Modelo E205 na União Europeia) e validação manual entre os organismos de ligação, não sendo elegíveis para atribuição automática em 24h ('Pensão na Hora').",
        "instant_pension_badge": "Elegível para Pensão na Hora (24h)",
        "instant_pension_desc": "Para carreiras com descontos exclusivamente em Portugal que cumpram os requisitos, o pedido submetido online na Segurança Social Direta tem pré-aprovação rápida.",
        "min_pension_foreign_warning": "Atenção: A garantia do valor integral das pensões mínimas nacionais não se aplica automaticamente a pensões calculadas por pro rata internacional. O complemento social depende de prova rigorosa de recursos e condição de residência em Portugal.",
        "hack_work_title": "💡 Hack: Trabalhar e Receber Pensão?",
        "hack_work_desc": "Sim! Em Portugal é completamente legal trabalhar e receber salário em simultâneo com a pensão de velhice — sem cortes. As novas contribuições aumentam o valor da pensão no ano seguinte.",
        "hack_tax_title": "💡 Dica Fiscal: IRS sobre Pensões",
        "hack_tax_desc": "As pensões são tributadas como rendimentos de Categoria H em sede de IRS. Pensões anuais até ao limiar de existência estão isentas.",
        "comparison": "Se esperar até à idade normal de reforma:",
        "back": "Voltar",
        "base_pension_label": "Pensão Teórica Integral (Totalidade da Carreira)",
        "real_pension_label": "Pensão Mensal Proporcional PT (A Pagar por Portugal)",
        "explanation_title": "📜 Detalhamento do Cálculo Pro Rata e Regras Aplicadas",
        "early_penalty_reason": "Penalização por Antecipação",
        "early_penalty_desc": "Requerida {months} meses antes da idade legal/pessoal ({legalAge}). A lei aplica o corte de 0,5% por cada mês de antecipação.",
        "sustainability_reason": "Fator de Sustentabilidade 2026",
        "sustainability_desc": "Corte legal de 15,80% aplicado pela Segurança Social às pensões antecipadas.",
        "no_penalty_reason": "Sem Penalizações (100% da Pensão)",
        "no_penalty_desc": "Idade pessoal ou legal de reforma atingida ({legalAge}).",
        "min_applied_note": "Garantia de Pensão Mínima Nacional Ativada: O valor calculado foi ajustado para o piso mínimo de €{min}.",
        "total_cuts_label": "Total de Descontos Aplicados:",
        "accrual_rate_label": "Taxa Teórica Global",
        "prorata_ratio_label": "Fração Pro Rata Temporis"
    },
    "br": {
        "badge": "Reforma & Aposentadoria",
        "step1_q": "Qual é o seu perfil contributivo?",
        "step1_desc": "Selecione a opção que melhor descreve a sua situação profissional e histórico de contribuições.",
        "step2_h": "Guia Completo de Aposentadoria",
        "step2_desc": "Pensão de Velhice da Segurança Social Portuguesa (DL 187/2007)",
        "opt_standard": "Trabalhador Padrão",
        "opt_standard_sub": "Contribuições apenas em Portugal",
        "opt_expat": "Imigrante / Brasileiro em Portugal",
        "opt_expat_sub": "Contribuições no Brasil e em Portugal (Pro Rata)",
        "opt_long_career": "Carreira Longa (+40 anos)",
        "opt_long_career_sub": "Idade bonificada sem penalidades",
        "opt_freelance": "Trabalhador Autônomo",
        "opt_freelance_sub": "Freelancer / Recibos Verdes / Empresário",
        "req_age_title": "📅 Idade Normal de Aposentadoria (2026)",
        "req_age_desc": "• Idade normal em Portugal (2026): 66 anos e 9 meses (Portaria n.º 291/2024/1).\n• Carreira Longa: a idade pessoal de reforma recua 4 meses para cada ano de contribuição além dos 40 anos completados aos 65 anos.",
        "req_time_title": "⏳ Período de Garantia Obrigatório",
        "req_time_desc": "• Mínimo de 15 anos civis de registro de remunerações.\n• Acordo Bilateral Brasil-Portugal: os anos de contribuição do INSS somam-se aos de Portugal para assegurar o direito à aposentadoria!",
        "calc_title": "Simulador de Aposentadoria (DL 187/2007)",
        "calc_age": "Idade Atual",
        "calc_pt_years": "Anos de Contribuição em Portugal",
        "calc_foreign_years": "Anos de Contribuição no Estrangeiro (ex: Brasil)",
        "calc_salary": "Remuneração de Referência Mensal (€)",
        "calc_btn": "Calcular Aposentadoria",
        "results_title": "Resultado da Simulação",
        "status_eligible_normal": "✅ Elegível para Aposentadoria Normal (Sem cortes)",
        "status_eligible_early": "⚠️ Elegível para Aposentadoria Antecipada (Com cortes legais)",
        "status_eligible_long": "🏆 Elegível por Carreira Longa (Sem cortes!)",
        "status_not_eligible": "❌ Não Elegível (Totalização inferior a 15 anos)",
        "status_too_young": "❌ Não Elegível (Idade inferior a 60 anos)",
        "ret_age_est": "Idade Pessoal de Aposentadoria",
        "monthly_pension": "Valor Proporcional a Pagar por Portugal",
        "how_request_title": "🏦 Como e Onde Solicitar a Aposentadoria",
        "how_request_desc": "A solicitação é feita online pela Segurança Social Direta ou presencialmente.\n🔗 Pedido Online: https://app.seg-social.pt\n→ Caminho: SS Direta → Menu \"Pensões\" → \"Pensão de Velhice\".",
        "docs_title": "📋 Documentos Obrigatórios da Aposentadoria",
        "docs_desc": "• Documento de Identificação (Cartão de Cidadão / Título de Residência válido).\n• NIF e NISS.\n• Comprovante de IBAN em nome do titular.\n• Formulário I/PT 1 (para totalização com o INSS do Brasil).",
        "formula_title": "📊 Como é Calculada a Aposentadoria?",
        "formula_desc": "O cálculo segue rigorosamente o Decreto-Lei n.º 187/2007:\n\n1. [Pensão Teórica Integral = Remuneração de Referência × Taxa Teórica Global]\n2. [Pensão Proporcional PT = Pensão Teórica Integral × (Anos PT ÷ Anos Totais)]\n\nEm caso de pedido antecipado, incidem a penalidade por antecipação (0,5%/mês) e o Fator de Sustentabilidade (15,8% em 2026).",
        "min_pension_title": "🛡️ Garantia de Pensão Mínima & Salvaguarda Pro Rata",
        "min_pension_desc": "Portugal garante pisos mínimos conforme os anos de contribuição.\n⚠️ Importante: Para acordos bilaterais internacionais, Portugal paga a sua fração pro rata; o complemento social depende de comprovação de recursos e residência em Portugal.",
        "csi_title": "🏛️ Complemento Solidário para Idosos (CSI) — Apoio Social e Saúde",
        "csi_callout_title": "💡 Aposentadoria Baixa ou Pro Rata Brasil-Portugal? Conheça o CSI",
        "csi_callout_desc": "O Complemento Solidário para Idosos (CSI) paga a diferença exata entre os seus rendimentos e o teto legal de referência, além de garantir remédios 100% gratuitos no SNS e desconto na conta de luz.",
        "csi_badge": "Nivelador de Renda",
        "csi_what_title": "O Que É o Complemento Solidário para Idosos?",
        "csi_what_desc": "O Complemento Solidário para Idosos (CSI) é o principal mecanismo da Segurança Social para retirar aposentados da linha de pobreza, funcionando como um nivelador de renda: o Estado paga a diferença exata entre os recursos do idoso e o teto legal de referência.",
        "csi_elig_title": "1. Condições Gerais de Elegibilidade",
        "csi_elig_age": "Idade: Ter atingido a idade normal de aposentadoria da Segurança Social (66 anos e 9 meses em 2026).",
        "csi_elig_status": "Estatuto Contributivo: Ser aposentado por velhice ou pensionista por morte (do Brasil ou Portugal), ou residente sem benefício com mais de 15 anos de residência legal em Portugal.",
        "csi_elig_residence": "Residência Legal Obrigatória: Residir legalmente em território português há pelo menos 6 anos consecutivos na data do pedido.",
        "csi_elig_vpt": "Patrimônio Imobiliário: O Valor Patrimonial Tributário (VPT) dos imóveis do requerente ou casal não pode exceder os limites legais (excluído o imóvel de residência própria até aos tetos legais).",
        "csi_means_title": "2. Condição de Recursos e Tetos Máximos",
        "csi_means_formula": "[Valor do CSI = Teto Anual de Recursos − Rendimentos Anuais do Cidadão]",
        "csi_means_single": "Pessoa Solteira/Isolada: Rendimentos anuais próprios inferiores ao teto legal de referência do CSI.",
        "csi_means_couple": "Casal (Casados ou União Estável): A renda conjunta do casal deve ser inferior ao teto conjugal, e a renda específica do requerente não pode ultrapassar o limite individual.",
        "csi_means_children": "Eliminação da Renda dos Filhos: Nas regras atuais, os rendimentos dos filhos e netos foram totalmente excluídos da avaliação da renda familiar, dependendo o benefício exclusivamente da situação do próprio idoso (e cônjuge).",
        "csi_income_title": "3. Rendimentos Contabilizados na Avaliação",
        "csi_income_pensions": "Aposentadorias e Pensões: Segurança Social portuguesa, CGA e valores pagos pelo INSS no Brasil ou órgãos de previdência da UE.",
        "csi_income_work": "Trabalho: Salários de emprego formal ou rendimentos como autônomo (recibos verdes).",
        "csi_income_capital": "Investimentos e Aluguéis: Rendimentos de aplicações financeiras e aluguéis de imóveis.",
        "csi_income_assets": "Patrimônio Financeiro: Rendimento presumido de saldos bancários, poupança, certificados do tesouro e carteiras de investimento.",
        "csi_benefits_title": "4. Benefícios Adicionais Acoplados ao CSI",
        "csi_benefits_desc": "A concessão do CSI libera automaticamente direitos essenciais para o orçamento mensal do idoso:",
        "csi_bam_title": "Remédios a 100% Gratuitos (BAM)",
        "csi_bam_desc": "Remédios prescritos com cobertura de 100% pelo SNS na cota do paciente (isenção total de coparticipação na farmácia).",
        "csi_glasses_title": "Óculos e Próteses Dentárias",
        "csi_glasses_desc": "Reembolso e coparticipação em armações/lentes e dentaduras móveis mediante entrega de faturas no posto de saúde.",
        "csi_energy_title": "Tarifa Social de Energia",
        "csi_energy_desc": "Desconto automático nas contas de luz e gás natural canalizado.",
        "csi_housing_title": "Moradia e Isenção de Taxas",
        "csi_housing_desc": "Isenção total de taxas moderadoras nos hospitais do SNS e prioridade em programas municipais de aluguel social.",
        "csi_docs_title": "5. Documentos Obrigatórios e Como Solicitar",
        "csi_docs_forms": "Formulários Oficiais: Formulário Mod. CSI 1-DGSS, com anexo de patrimônio (Mod. CSI 1/1-DGSS para cônjuge ou companheiro em união estável).",
        "csi_docs_personal": "Documentos Pessoais: Cartão de Cidadão ou Título de Residência válido, NIF, NISS, comprovante de IBAN em seu nome, e declaração ou certidão de isenção de IRS.",
        "csi_docs_res_proof": "Comprovante de Moradia (6 Anos): Atestado da Junta de Freguesia comprovando residência legal em Portugal há pelo menos 6 anos ininterruptos.",
        "csi_docs_foreign_pension": "Aposentadorias no Exterior: Declaração e extrato oficial de pagamento do INSS (Brasil) ou da previdência da UE com discriminação do valor bruto e conversão cambial em euros.",
        "csi_docs_submission": "Onde Dar Entrada: Presencialmente nos balcões da Segurança Social ou Lojas de Cidadão (com agendamento), ou pela Segurança Social Direta com Chave Móvel Digital.",
        "bilateral_warning_badge": "Instrução Bilateral Obrigatória",
        "bilateral_warning_desc": "Processos com totalização de períodos no exterior (ex.: Brasil/INSS) exigem instrução bilateral (Formulário I/PT 1) e validação manual entre os países, não sendo elegíveis para aprovação automática em 24h ('Pensão na Hora').",
        "instant_pension_badge": "Elegível para Pensão na Hora (24h)",
        "instant_pension_desc": "Para carreiras exclusivamente em Portugal que cumpram os requisitos, o pedido submetido online na Segurança Social Direta tem pré-aprovação rápida.",
        "min_pension_foreign_warning": "Atenção: A garantia do valor integral das pensões mínimas nacionais não se aplica automaticamente a pensões calculadas por pro rata internacional. O complemento social depende de prova rigorosa de recursos e condição de residência em Portugal.",
        "hack_work_title": "💡 Hack: Trabalhar e Receber Pensão?",
        "hack_work_desc": "Sim! Em Portugal é totalmente legal trabalhar e receber salário ao mesmo tempo em que recebe a pensão de velhice — sem cortes.",
        "hack_tax_title": "💡 Dica Fiscal: Imposto sobre Pensões",
        "hack_tax_desc": "As pensões são tributadas como rendimentos de Categoria H no IRS português. Rendas baixas estão isentas.",
        "comparison": "Se aguardar até à idade normal de aposentadoria:",
        "back": "Voltar",
        "base_pension_label": "Pensão Teórica Integral (Totalidade da Carreira)",
        "real_pension_label": "Pensão Mensal Proporcional PT (A Pagar por Portugal)",
        "explanation_title": "📜 Detalhamento do Cálculo Pro Rata e Regras Aplicadas",
        "early_penalty_reason": "Penalidade por Antecipação",
        "early_penalty_desc": "Solicitada {months} meses antes da idade legal/pessoal ({legalAge}). Aplica-se o corte de 0,5% por mês antecipado.",
        "sustainability_reason": "Fator de Sustentabilidade 2026",
        "sustainability_desc": "Desconto legal de 15,80% aplicado pela Segurança Social às aposentadorias antecipadas.",
        "no_penalty_reason": "Sem Penalidades (100% do Valor)",
        "no_penalty_desc": "Idade pessoal ou legal atingida ({legalAge}).",
        "min_applied_note": "Garantia de Pensão Mínima Nacional Ativada: Valor ajustado para o piso mínimo de €{min}.",
        "total_cuts_label": "Total de Descontos Aplicados:",
        "accrual_rate_label": "Taxa Teórica Global",
        "prorata_ratio_label": "Fração Pro Rata Temporis"
    },
    "es": {
        "badge": "Jubilación y Pensión",
        "step1_q": "¿Cuál es su perfil contributivo?",
        "step1_desc": "Seleccione la opción que mejor describe su situación profesional e historial de cotizaciones.",
        "step2_h": "Guía Completa de Jubilación",
        "step2_desc": "Pensión de Vejez de la Seguridad Social (DL 187/2007)",
        "opt_standard": "Trabajador Estándar",
        "opt_standard_sub": "Cotizaciones solo en Portugal",
        "opt_expat": "Inmigrante / Internacional",
        "opt_expat_sub": "Cotizaciones en Portugal y en el extranjero (Pro Rata)",
        "opt_long_career": "Carrera Larga (+40 años)",
        "opt_long_career_sub": "Edad bonificada sin penalización",
        "opt_freelance": "Trabajador Autónomo",
        "opt_freelance_sub": "Recibos Verdes / Empresario",
        "req_age_title": "📅 Edad Normal de Jubilación (2026)",
        "req_age_desc": "• Edad legal en Portugal (2026): 66 años y 9 meses (Portaria n.º 291/2024/1).\n• Carrera Larga: la edad personal se reduce 4 meses por cada año de cotización que exceda los 40 años a los 65 años.",
        "req_time_title": "⏳ Período de Garantía Obligatorio",
        "req_time_desc": "• Mínimo de 15 años civiles de cotizaciones.\n• Totalización Internacional: Los años trabajados en el extranjero se suman a los de Portugal para abrir el derecho.",
        "calc_title": "Simulador de Jubilación (DL 187/2007)",
        "calc_age": "Edad Actual",
        "calc_pt_years": "Años de Cotización en Portugal",
        "calc_foreign_years": "Años de Cotización en el Extranjero",
        "calc_salary": "Remuneración de Referencia Mensual (€)",
        "calc_btn": "Calcular Jubilación",
        "results_title": "Resultado de la Simulación",
        "status_eligible_normal": "✅ Elegible para Jubilación Normal (Sin recortes)",
        "status_eligible_early": "⚠️ Elegible para Jubilación Anticipada (Con recortes)",
        "status_eligible_long": "🏆 Elegible por Carrera Larga (¡Sin recortes!)",
        "status_not_eligible": "❌ No Elegible (Menos de 15 años en total)",
        "status_too_young": "❌ No Elegible (Edad inferior a 60 años)",
        "ret_age_est": "Edad Personal de Jubilación",
        "monthly_pension": "Pensión Proporcional a Pagar por Portugal",
        "how_request_title": "🏦 Cómo y Dónde Solicitar la Pensión",
        "how_request_desc": "La solicitud se realiza online en la Seguridad Social Direta o en las oficinas oficiales.\n🔗 Solicitud Online: https://app.seg-social.pt",
        "docs_title": "📋 Documentos Obligatorios de la Pensión",
        "docs_desc": "• Documento de Identidad válido.\n• NIF y NISS.\n• Justificante de IBAN a su nombre.\n• Formularios de Enlace Internacional.",
        "formula_title": "📊 ¿Cómo se Calcula la Pensión?",
        "formula_desc": "El cálculo sigue el Decreto-Ley n.º 187/2007:\n\n1. [Pensión Teórica Global = Salario de Referencia × Tasa Teórica Global]\n2. [Pensión Real PT = Pensión Teórica Global × (Años PT ÷ Años Totales)]",
        "min_pension_title": "🛡️ Garantía de Pensión Mínima & Pro Rata",
        "min_pension_desc": "Portugal garantiza cuantías mínimas.\n⚠️ Las pensiones por pro rata internacional no acceden automáticamente al mínimo íntegro sin comprobación de residencia y recursos.",
        "csi_title": "🏛️ Complemento Solidario para Mayores (CSI) — Apoyo Social y Salud",
        "csi_callout_title": "💡 ¿Pensión Baja o Pro Rata Internacional? Conozca el CSI",
        "csi_callout_desc": "El CSI nivela sus ingresos hasta el umbral legal pagando la diferencia, además de otorgar medicamentos 100% gratuitos y tarifa social energética.",
        "csi_badge": "Nivelador Social",
        "csi_what_title": "¿Qué es el Complemento Solidario para Mayores?",
        "csi_what_desc": "El Complemento Solidario para Mayores (CSI) es el principal mecanismo de la Seguridad Social para sacar a los pensionistas de la pobreza, funcionando como un nivelador de ingresos: el Estado abona la diferencia exacta entre los recursos del mayor y el umbral legal de referencia.",
        "csi_elig_title": "1. Condiciones Generales de Elegibilidad",
        "csi_elig_age": "Edad: Haber alcanzado la edad legal de jubilación de la Seguridad Social (66 años y 9 meses en 2026).",
        "csi_elig_status": "Estatus Contributivo: Ser pensionista de vejez o supervivencia (nacional o extranjera), o residente sin pensión con más de 15 años de residencia legal en Portugal.",
        "csi_elig_residence": "Residencia Legal Obligatoria: Residir legalmente en territorio portugués durante al menos 6 años consecutivos en la fecha de solicitud.",
        "csi_elig_vpt": "Patrimonio Inmobiliario: El Valor Patrimonial Tributario (VPT) de los inmuebles no puede superar los límites legales (excluida la vivienda habitual hasta los topes legales).",
        "csi_means_title": "2. Condición de Recursos y Límites Máximos",
        "csi_means_formula": "[Importe del CSI = Umbral Anual de Recursos − Ingresos Anuales del Ciudadano]",
        "csi_means_single": "Persona Sola: Ingresos anuales propios inferiores al umbral legal de referencia del CSI.",
        "csi_means_couple": "Pareja (Casados o Unión de Hecho): Los ingresos de la pareja deben ser inferiores al tope conyugal, y los ingresos del solicitante no pueden superar el límite individual.",
        "csi_means_children": "Exclusión de Ingresos de los Hijos: En la normativa vigente, los ingresos de los descendientes (hijos y sus hogares) fueron eliminados por completo del cálculo, dependiendo el acceso únicamente de la situación financiera del mayor y su cónyuge.",
        "csi_income_title": "3. Ingresos Computables en la Evaluación",
        "csi_income_pensions": "Pensiones percibidas: Seguridad Social portuguesa, CGA y pensiones del extranjero mediante convenios bilaterales o comunitarios (UE).",
        "csi_income_work": "Trabajo: Salarios por cuenta ajena o ingresos por cuenta propia (recibos verdes).",
        "csi_income_capital": "Capital e Inmuebles: Rendimientos de capital mobiliario (intereses/dividendos) e inmobiliario (alquileres).",
        "csi_income_assets": "Patrimonio Financiero: Valor presunto de cuentas bancarias, depósitos a plazo, certificados del tesoro e inversiones.",
        "csi_benefits_title": "4. Beneficios Adicionales Vinculados al CSI",
        "csi_benefits_desc": "La concesión del CSI desbloquea automáticamente derechos de gran impacto en el presupuesto mensual del mayor:",
        "csi_bam_title": "Medicamentos al 100% (BAM)",
        "csi_bam_desc": "Medicamentos recetados cubiertos al 100% por el SNS en la cuota del usuario (exención total de copago en farmacias).",
        "csi_glasses_title": "Gafas y Prótesis Dentales",
        "csi_glasses_desc": "Reembolso y ayudas en gafas/lentes y dentaduras postizas previa presentación de facturas en el centro de salud.",
        "csi_energy_title": "Bono Social Energético",
        "csi_energy_desc": "Descuento automático en las facturas de suministro eléctrico y gas natural canalizado.",
        "csi_housing_title": "Vivienda y Exención de Tasas",
        "csi_housing_desc": "Exención total de copagos médicos del SNS y prioridad en programas municipales de ayuda al alquiler.",
        "csi_docs_title": "5. Documentación Necesaria y Trámite de Solicitud",
        "csi_docs_forms": "Formularios Oficiales: Solicitud Mod. CSI 1-DGSS, acompañada del anexo de ingresos y patrimonio (Mod. CSI 1/1-DGSS para cónyuge o pareja de hecho).",
        "csi_docs_personal": "Documentos Personales: Documento de Identidad o Título de Residencia en vigor, NIF, NISS, justificante de IBAN, y liquidación o exención de IRPF emitida por la AT.",
        "csi_docs_res_proof": "Justificante de Residencia (6 Años): Certificado expedido por la Junta de Freguesia que acredite residencia legal en Portugal durante al menos 6 años continuos.",
        "csi_docs_foreign_pension": "Pensiones del Extranjero: Certificado oficial del organismo de seguridad social de origen (ej.: extracto del INSS en Brasil o entidad de la UE) con desglose del importe bruto en euros.",
        "csi_docs_submission": "Dónde Presentar: Presencialmente en las oficinas de la Seguridad Social o Lojas de Cidadão (con cita previa), o por la Seguridad Social Direta con Chave Móvel Digital.",
        "bilateral_warning_badge": "Instrucción Bilateral Obligatoria",
        "bilateral_warning_desc": "Los procesos con totalización de períodos en el extranjero requieren tramitación bilateral obligatoria y validación manual entre organismos, no siendo elegibles para aprobación en 24h ('Pensión na Hora').",
        "instant_pension_badge": "Elegible para Pensión en 24h",
        "instant_pension_desc": "Para carreras exclusivamente cotizadas en Portugal que cumplan los requisitos, la solicitud online en la Seguridad Social Direta cuenta con preaprobación rápida.",
        "min_pension_foreign_warning": "Atención: La garantía de pensión mínima nacional íntegra no se aplica automáticamente al pro rata internacional. El complemento social requiere prueba de recursos y residencia en Portugal.",
        "hack_work_title": "💡 Hack: ¿Trabajar y Recibir Pensión?",
        "hack_work_desc": "¡Sí! En Portugal es legal trabajar y cobrar salario junto a la pensión de vejez sin penalizaciones.",
        "hack_tax_title": "💡 Consejo Fiscal: Impuesto sobre Pensiones",
        "hack_tax_desc": "Tributación en Categoría H en el IRPF.",
        "comparison": "Si espera hasta la edad legal de jubilación:",
        "back": "Volver",
        "base_pension_label": "Pensión Teórica Integral (Totalidad de la Carrera)",
        "real_pension_label": "Pensión Mensual Proporcional PT (A Pagar por Portugal)",
        "explanation_title": "📜 Desglose del Cálculo Pro Rata",
        "early_penalty_reason": "Penalización por Anticipación",
        "early_penalty_desc": "Solicitada {months} meses antes de la edad personal/legal ({legalAge}). Recorte legal del 0.5% por mes.",
        "sustainability_reason": "Factor de Sostenibilidad 2026",
        "sustainability_desc": "Deducción legal del 15.80% para jubilaciones anticipadas.",
        "no_penalty_reason": "Sin Penalizaciones (100% de la Pensión)",
        "no_penalty_desc": "Edad legal alcanzada ({legalAge}).",
        "min_applied_note": "Garantía de Pensão Mínima Nacional Activada: Se asegura el piso de €{min}.",
        "total_cuts_label": "Total de Descuentos Aplicados:",
        "accrual_rate_label": "Tasa Teórica Global",
        "prorata_ratio_label": "Fracción Pro Rata Temporis"
    },
    "en": {
        "badge": "Retirement & Pension",
        "step1_q": "What is your contribution profile?",
        "step1_desc": "Select the option that best describes your professional situation and contribution history.",
        "step2_h": "Full Retirement Guide",
        "step2_desc": "Social Security Old-Age Pension (DL 187/2007)",
        "opt_standard": "Standard Worker",
        "opt_standard_sub": "Contributions only in Portugal",
        "opt_expat": "Immigrant / International Worker",
        "opt_expat_sub": "Contributions in Portugal and abroad (Pro Rata)",
        "opt_long_career": "Long Career (+40 years)",
        "opt_long_career_sub": "Reduced retirement age without penalties",
        "opt_freelance": "Self-Employed / Freelancer",
        "opt_freelance_sub": "Green Receipts / Entrepreneur",
        "req_age_title": "📅 Normal Retirement Age (2026)",
        "req_age_desc": "• Normal retirement age in Portugal (2026): 66 years and 9 months (Ministerial Order 291/2024/1).\n• Long Career: Personal age is reduced by 4 months for each contribution year beyond 40 reached at age 65.",
        "req_time_title": "⏳ Mandatory Contribution Period",
        "req_time_desc": "• Minimum of 15 calendar years with registered contributions.\n• International Totalization: Contribution years from abroad are combined with Portugal to grant eligibility!",
        "calc_title": "Retirement Simulator (DL 187/2007)",
        "calc_age": "Current Age",
        "calc_pt_years": "Contribution Years in Portugal",
        "calc_foreign_years": "Contribution Years Abroad",
        "calc_salary": "Reference Monthly Earnings (€)",
        "calc_btn": "Calculate Retirement",
        "results_title": "Simulation Results",
        "status_eligible_normal": "✅ Eligible for Normal Retirement (No cuts)",
        "status_eligible_early": "⚠️ Eligible for Early Retirement (With statutory cuts)",
        "status_eligible_long": "🏆 Eligible by Long Career (No cuts!)",
        "status_not_eligible": "❌ Not Eligible (Totalization below 15 years)",
        "status_too_young": "❌ Not Eligible (Age below 60)",
        "ret_age_est": "Personal Retirement Age",
        "monthly_pension": "Proportional Pension Payable by Portugal",
        "how_request_title": "🏦 How and Where to Apply for Pension",
        "how_request_desc": "Apply online via Segurança Social Direta or at official customer service branches.\n🔗 Online Portal: https://app.seg-social.pt",
        "docs_title": "📋 Required Pension Documents",
        "docs_desc": "• Valid Identification Document.\n• NIF and NISS.\n• Proof of IBAN.\n• International Liaison Forms (e.g., Form I/PT 1 or EU Form E205).",
        "formula_title": "📊 How Is the Pension Calculated?",
        "formula_desc": "Calculation strictly governed by Decree-Law 187/2007:\n\n1. [Full Theoretical Pension = Reference Salary × Global Accrual Rate]\n2. [Real PT Pension = Full Theoretical Pension × (PT Years ÷ Total Years)]",
        "min_pension_title": "🛡️ Minimum Pension & Pro Rata Safeguards",
        "min_pension_desc": "Statutory minimum thresholds apply to national pensions.\n⚠️ Pro rata international pensions do not automatically receive the full national minimum without local residency and means-testing.",
        "csi_title": "🏛️ Solidarity Supplement for the Elderly (CSI) — Income & Health Support",
        "csi_callout_title": "💡 Low Pension or International Pro-Rata? Discover the CSI",
        "csi_callout_desc": "The CSI bridges the gap between your income and the legal reference threshold, providing 100% free prescription medicine on the NHS and discounted energy tariffs.",
        "csi_badge": "Social Equalizer",
        "csi_what_title": "What is the Solidarity Supplement for the Elderly?",
        "csi_what_desc": "The Solidarity Supplement for the Elderly (CSI) is Social Security's primary mechanism to lift pensioners out of poverty, functioning as an income equalizer: the State pays the exact difference between the elderly citizen's resources and the statutory reference threshold.",
        "csi_elig_title": "1. General Eligibility Criteria",
        "csi_elig_age": "Age: Must have reached the statutory retirement age of Social Security (66 years and 9 months in 2026).",
        "csi_elig_status": "Contributory Status: Be an old-age or survivor pensioner (Portuguese or foreign), or a non-pensioner resident with over 15 years of legal residence in Portugal.",
        "csi_elig_residence": "Mandatory Legal Residence: Legally residing in Portuguese territory for at least 6 consecutive years at the application date.",
        "csi_elig_vpt": "Real Estate Assets: The Tax Asset Value (VPT) of real estate owned by the applicant or couple cannot exceed statutory caps (excluding primary permanent residence up to statutory thresholds).",
        "csi_means_title": "2. Means Test and Maximum Thresholds",
        "csi_means_formula": "[CSI Value = Annual Statutory Resource Threshold − Citizen's Annual Income]",
        "csi_means_single": "Single Person: Own annual income must be below the statutory reference threshold of the CSI.",
        "csi_means_couple": "Couple (Married or De Facto Union): Joint income must be below the statutory couple cap, and the applicant's individual income cannot exceed the single threshold.",
        "csi_means_children": "Exclusion of Children's Income: Under current regulations, the income of descendants (children and their households) has been completely removed from the means-test, making eligibility solely dependent on the direct financial status of the elder (and spouse).",
        "csi_income_title": "3. Counted Income in the Assessment",
        "csi_income_pensions": "Pensions received: Portuguese Social Security, CGA, and foreign pensions via bilateral agreements (e.g. Brazilian INSS) or EU regulations.",
        "csi_income_work": "Employment: Wages from employment or earnings from freelance/self-employed activity (green receipts).",
        "csi_income_capital": "Capital & Rentals: Investment income (interest/dividends) and real estate rentals.",
        "csi_income_assets": "Movable Assets: Presumed yield from bank balances, fixed deposits, treasury certificates, and investment portfolios.",
        "csi_benefits_title": "4. Additional Benefits Linked to the CSI",
        "csi_benefits_desc": "CSI approval automatically unlocks significant cost-saving rights in the senior citizen's monthly budget:",
        "csi_bam_title": "100% Free Medication (BAM)",
        "csi_bam_desc": "Prescription drugs subsidized at 100% by the NHS for the patient copay share (zero out-of-pocket copayment at pharmacies).",
        "csi_glasses_title": "Eyeglasses & Dentures",
        "csi_glasses_desc": "Reimbursement support for eyeglasses, corrective lenses, and removable dental prostheses upon invoice submission at the local health center.",
        "csi_energy_title": "Social Energy Tariff",
        "csi_energy_desc": "Automatic statutory discounts applied directly to electricity and piped natural gas utility bills.",
        "csi_housing_title": "Housing & Fee Exemptions",
        "csi_housing_desc": "Full exemption from NHS user charges and prioritized access to municipal subsidized rental housing programs.",
        "csi_docs_title": "5. Required Documentation & Application Process",
        "csi_docs_forms": "Official Forms: Application Form Mod. CSI 1-DGSS, accompanied by income and asset annex (Mod. CSI 1/1-DGSS for spouse or cohabiting partner).",
        "csi_docs_personal": "Personal Identification: Citizen Card or valid Residence Permit, NIF, NISS, IBAN proof, and latest IRS tax assessment or IRS exemption certificate.",
        "csi_docs_res_proof": "Proof of Residence (6 Years): Certificate issued by the local civil parish (Junta de Freguesia) confirming at least 6 consecutive years of legal residence in Portugal.",
        "csi_docs_foreign_pension": "Mixed Careers with Foreign Pensions: Official statement from the foreign pension body (e.g. INSS statement from Brazil or EU counterpart) detailing the gross pension and exchange rate conversion into euros.",
        "csi_docs_submission": "Where to Submit: In person at Social Security offices or Citizen Stores (Lojas de Cidadão) by prior appointment, or online via Segurança Social Direta with Digital Mobile Key (CMD).",
        "bilateral_warning_badge": "Mandatory Bilateral Process",
        "bilateral_warning_desc": "Cases involving overseas contribution periods require bilateral procedures (e.g., Form I/PT 1, EU Form E205) and manual cross-border liaison, making them ineligible for automatic 24h approval.",
        "instant_pension_badge": "Eligible for 24h Instant Pension",
        "instant_pension_desc": "For careers with contributions exclusively in Portugal that meet the requirements, online applications on Segurança Social Direta benefit from expedited pre-approval.",
        "min_pension_foreign_warning": "Notice: The statutory national minimum pension guarantee does not apply automatically to international pro-rata pensions. Social supplements require strict means-testing and Portuguese residency.",
        "hack_work_title": "💡 Hack: Work While Retired?",
        "hack_work_desc": "Yes! In Portugal it is completely legal to work and receive a salary while simultaneously collecting old-age pension.",
        "hack_tax_title": "💡 Tax Tip: IRS on Pensions",
        "hack_tax_desc": "Pensions are taxed under Category H.",
        "comparison": "If you wait until legal retirement age:",
        "back": "Back",
        "base_pension_label": "Theoretical Full Pension (Unified Global Career)",
        "real_pension_label": "Real Proportional PT Pension (Payable by Portugal)",
        "explanation_title": "📜 Pro Rata Calculation Breakdown",
        "early_penalty_reason": "Early Retirement Penalty",
        "early_penalty_desc": "Requested {months} months prior to personal/legal age ({legalAge}). Statutory 0.5% deduction per month early.",
        "sustainability_reason": "2026 Sustainability Factor",
        "sustainability_desc": "Statutory 15.80% deduction applied to early pensions.",
        "no_penalty_reason": "No Penalties Applied (100% Pension)",
        "no_penalty_desc": "Personal or statutory age reached ({legalAge}).",
        "min_applied_note": "National Minimum Pension Guarantee Activated: Adjusted to threshold of €{min}.",
        "total_cuts_label": "Total Deductions Applied:",
        "accrual_rate_label": "Global Theoretical Accrual Rate",
        "prorata_ratio_label": "Pro Rata Temporis Ratio"
    },
    "fr": {
        "badge": "Retraite & Pension",
        "step1_q": "Quel est votre profil de cotisant?",
        "step1_desc": "Sélectionnez l'option qui décrit le mieux votre situation professionnelle et votre historique de cotisations.",
        "step2_h": "Guide Complet de Retraite",
        "step2_desc": "Pension de Vieillesse de la Sécurité Sociale (DL 187/2007)",
        "opt_standard": "Travailleur Standard",
        "opt_standard_sub": "Cotisations uniquement au Portugal",
        "opt_expat": "Immigré / Travailleur International",
        "opt_expat_sub": "Cotisations au Portugal et à l'étranger (Pro Rata)",
        "opt_long_career": "Carrière Longue (+40 ans)",
        "opt_long_career_sub": "Âge bonifié sans pénalité",
        "opt_freelance": "Travailleur Indépendant",
        "opt_freelance_sub": "Reçus Verts / Entrepreneur",
        "req_age_title": "📅 Âge Légal de Retraite (2026)",
        "req_age_desc": "• Âge légal au Portugal (2026): 66 ans et 9 mois (Arrêté 291/2024/1).\n• Carrière Longue: l'âge personnel est réduit de 4 mois par année au-delà de 40 ans cotisés à 65 ans.",
        "req_time_title": "⏳ Durée de Cotisation Obligatoire",
        "req_time_desc": "• Minimum de 15 années civiles de cotisations.\n• Totalisation Internationale: Vos années à l'étranger s'ajoutent à celles du Portugal.",
        "calc_title": "Simulateur de Retraite (DL 187/2007)",
        "calc_age": "Âge Actuel",
        "calc_pt_years": "Années au Portugal",
        "calc_foreign_years": "Années à l'Étranger",
        "calc_salary": "Rémunération de Référence (€)",
        "calc_btn": "Calculer la Retraite",
        "results_title": "Résultat de la Simulation",
        "status_eligible_normal": "✅ Éligible à la Retraite Normale (Sans décote)",
        "status_eligible_early": "⚠️ Éligible à la Retraite Anticipée (Avec décote)",
        "status_eligible_long": "🏆 Éligible par Carrière Longue (Sans décote!)",
        "status_not_eligible": "❌ Non Éligible (Moins de 15 ans au total)",
        "status_too_young": "❌ Non Éligible (Âge inférieur à 60 ans)",
        "ret_age_est": "Âge Personnel de Retraite",
        "monthly_pension": "Pension Proportionnelle Due par le Portugal",
        "how_request_title": "🏦 Comment et Où Demander la Pension",
        "how_request_desc": "Demande en ligne via Segurança Social Direta ou aux guichets officiels.\n🔗 Portail: https://app.seg-social.pt",
        "docs_title": "📋 Documents Obligatoires pour la Pension",
        "docs_desc": "• Pièce d'identité valide.\n• NIF et NISS.\n• Relevé d'identité bancaire (IBAN).\n• Formulaires de Liaison Internationale (ex: E205).",
        "formula_title": "📊 Comment la Pension est-elle Calculée?",
        "formula_desc": "Calcul selon le Décret-Loi 187/2007:\n\n1. [Pension Théorique = Salaire de Référence × Taux Théorique]\n2. [Pension Réelle PT = Pension Théorique × (Années PT ÷ Années Totales)]",
        "min_pension_title": "🛡️ Minimum de Pension & Pro Rata",
        "min_pension_desc": "Garanties minimales légales.\n⚠️ Le pro rata international ne bénéficie pas automatiquement du minimum intégral sans conditions de résidence et de ressources.",
        "csi_title": "🏛️ Complément Solidaire pour Personnes Âgées (CSI) — Soutien Social & Santé",
        "csi_callout_title": "💡 Pension Modeste ou Pro Rata International? Découvrez le CSI",
        "csi_callout_desc": "Le CSI compense l'écart entre vos ressources et le plafond légal de référence, assurant des médicaments 100% gratuits sur le SNS et le tarif social de l'énergie.",
        "csi_badge": "Égalisateur Social",
        "csi_what_title": "Qu'est-ce que le Complément Solidaire pour Personnes Âgées?",
        "csi_what_desc": "Le Complément Solidaire pour Personnes Âgées (CSI) est le principal dispositif de la Sécurité Sociale pour sortir les retraités de la pauvreté, agissant comme un égalisateur de revenus: l'État verse la différence exacte entre les ressources de la personne âgée et le seuil légal de référence.",
        "csi_elig_title": "1. Conditions Générales d'Éligibilité",
        "csi_elig_age": "Âge: Avoir atteint l'âge légal de la retraite de la Sécurité Sociale (66 ans et 9 mois en 2026).",
        "csi_elig_status": "Statut Cotisant: Être titulaire d'une pension de vieillesse ou de réversion (nationale ou étrangère), ou résident sans pension justifiant de plus de 15 ans de résidence légale au Portugal.",
        "csi_elig_residence": "Résidence Légale Obligatoire: Résider légalement sur le territoire portugais depuis au moins 6 années consécutives à la date de la demande.",
        "csi_elig_vpt": "Patrimoine Immobilier: La Valeur Patrimoniale Fiscale (VPT) des biens immobiliers ne doit pas dépasser les plafonds légaux (hors résidence principale jusqu'aux seuils réglementaires).",
        "csi_means_title": "2. Conditions de Ressources et Plafonds Maximaux",
        "csi_means_formula": "[Montant du CSI = Plafond Annuel de Ressources − Revenus Annuels du Demandeur]",
        "csi_means_single": "Personne Seule: Revenus annuels personnels inférieurs au seuil légal de référence du CSI.",
        "csi_means_couple": "Couple (Mariés ou Union de Fait): Les revenus du couple doivent être inférieurs au plafond conjugal, et les revenus du demandeur ne doivent pas dépasser le plafond individuel.",
        "csi_means_children": "Suppression de la Prise en Compte des Revenus des Enfants: Selon les règles actuelles, les revenus des descendants (enfants et leurs foyers) ont été totalement exclus de l'évaluation, l'accès dépendant exclusivement de la situation financière directe du senior (et de son conjoint).",
        "csi_income_title": "3. Revenus Pris en Compte dans l'Évaluation",
        "csi_income_pensions": "Pensions perçues: Sécurité Sociale portugaise, CGA et pensions de l'étranger via accords bilatéraux ou européens.",
        "csi_income_work": "Travail: Revenus d'activité salariée ou de travail indépendant (reçus verts).",
        "csi_income_capital": "Capitaux et Biens Immobiliers: Revenus de capitaux (intérêts/dividendes) et loyers immobiliers.",
        "csi_income_assets": "Patrimoine Mobilier: Valeur présumée des comptes courants, livrets d'épargne, certificats du trésor et placements financiers.",
        "csi_benefits_title": "4. Avantages Supplémentaires Liés au CSI",
        "csi_benefits_desc": "L'attribution du CSI débloque automatiquement des droits majeurs pour le budget mensuel du retraité:",
        "csi_bam_title": "Médicaments à 100% (BAM)",
        "csi_bam_desc": "Médicaments sur ordonnance pris en charge à 100% par le SNS pour la part usager (exonération totale de ticket modérateur en pharmacie).",
        "csi_glasses_title": "Lunettes et Prothèses Dentaires",
        "csi_glasses_desc": "Prise en charge partielle des lunettes/verres correcteurs et prothèses dentaires amovibles sur présentation des factures au centre de santé.",
        "csi_energy_title": "Tarif Social de l'Énergie",
        "csi_energy_desc": "Réduction automatique sur les factures d'électricité et de gaz naturel de réseau.",
        "csi_housing_title": "Logement et Exonérations",
        "csi_housing_desc": "Exonération totale des forfaits de soins SNS et priorité aux programmes municipaux d'aide au logement locatif.",
        "csi_docs_title": "5. Pièces Requises et Démarche de Demande",
        "csi_docs_forms": "Formulaires Officiels: Formulaire Mod. CSI 1-DGSS, accompagné de l'annexe de revenus et patrimoine (Mod. CSI 1/1-DGSS pour le conjoint ou partenaire pacsé).",
        "csi_docs_personal": "Pièces Justificatives: Titre de Séjour ou Carte d'Identité valide, NIF, NISS, RIB/IBAN, et dernier avis d'imposition IRS ou dispense fiscale.",
        "csi_docs_res_proof": "Justificatif de Domicile (6 Ans): Attestation délivrée par la mairie locale (Junta de Freguesia) prouvant au moins 6 ans de résidence légale ininterrompue.",
        "csi_docs_foreign_pension": "Pensions Étrangères: Attestation officielle de la caisse de retraite d'origine (ex.: relevé INSS Brésil ou organisme UE) détaillant le montant brut converti en euros.",
        "csi_docs_submission": "Où Déposer la Demande: Sur place aux guichets de la Sécurité Sociale ou aux Lojas de Cidadão (sur rendez-vous), ou en ligne via Segurança Social Direta avec la Clé Mobile Numérique (CMD).",
        "bilateral_warning_badge": "Procédure Bilatérale Obligatoire",
        "bilateral_warning_desc": "Les dossiers comportant des périodes cotisées à l'étranger nécessitent une instruction bilatérale (Formulaire E205 ou convention) et une validation manuelle, n'étant pas éligibles à l'approbation en 24h.",
        "instant_pension_badge": "Éligible à la Retraite en 24h",
        "instant_pension_desc": "Pour les carrières cotisées exclusivement au Portugal remplissant les conditions, la demande en ligne bénéficie d'un traitement rapide.",
        "min_pension_foreign_warning": "Attention: La garantie du minimum intégral ne s'applique pas automatiquement aux pensions pro rata internationales. Le complément social est soumis à conditions de ressources et de résidence.",
        "hack_work_title": "💡 Hack: Travailler et Toucher sa Retraite?",
        "hack_work_desc": "Oui! Au Portugal, le cumul emploi-retraite est légal et sans décote.",
        "hack_tax_title": "💡 Conseil Fiscal: Impôt sur les Pensions",
        "hack_tax_desc": "Imposition Catégorie H dans l'IRS.",
        "comparison": "Si vous attendez l'âge légal:",
        "back": "Retour",
        "base_pension_label": "Pension Théorique Intégrale (Carrière Unifiée)",
        "real_pension_label": "Pension Mensuelle Proportionnelle PT (Due par le Portugal)",
        "explanation_title": "📜 Détail du Calcul Pro Rata",
        "early_penalty_reason": "Pénalité pour Anticipation",
        "early_penalty_desc": "Demandée {months} mois avant l'âge légal ({legalAge}). Décote légale de 0.5% par mois.",
        "sustainability_reason": "Facteur de Durabilité 2026",
        "sustainability_desc": "Déduction de 15.80% pour départs anticipés.",
        "no_penalty_reason": "Sans Pénalités (100% de la Pension)",
        "no_penalty_desc": "Âge personnel ou légal atteint ({legalAge}).",
        "min_applied_note": "Minimum de Pension Garanti Activé: Ajusté au seuil de €{min}.",
        "total_cuts_label": "Total des Déductions Appliquées:",
        "accrual_rate_label": "Taux Théorique Global",
        "prorata_ratio_label": "Rapport Pro Rata Temporis"
    }
};

type Profile = 'standard' | 'expat' | 'long_career' | 'freelance';

// ════════════════════════ Main Component ══════════════════════════════════════
export const RetirementWizard: React.FC<RetirementWizardProps> = ({ language, onBack, onSelectTemplate }) => {
    const [step, setStep] = useState(1);
    const [profile, setProfile] = useState<Profile | null>(null);

    // Calculator state
    const [age, setAge] = useState(66);
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
        if (p === 'expat') {
            setForeignYears(prev => prev > 0 ? prev : 15);
            setPtYears(prev => prev > 0 ? prev : 5);
        } else {
            setForeignYears(0);
        }
        setStep(2);
    };

    const handleBack = () => {
        if (step > 1) { setStep(1); setShowResults(false); }
        else onBack();
    };

    // 🏛️ INVOCAÇÃO CANÓNICA DO MOTOR DE REFORMA (DL 187/2007)
    const results: MiraRetirementAssessment | null = useMemo(() => {
        if (!profile) return null;
        return calculateMiraRetirement({
            ageYears: age,
            yearsContributedPT: ptYears,
            yearsContributedForeign: profile === 'expat' ? foreignYears : 0,
            referenceMonthlyEarnings: salary,
            profile,
            referenceYear: 2026
        });
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
                                                {p.id === 'expat' ? (lang === 'en' ? 'BILATERAL / PRO RATA' : lang === 'es' ? 'CONVENIO / PRO RATA' : lang === 'fr' ? 'BILATÉRAL / PRO RATA' : 'ACORDO BILATERAL / PRO RATA') : p.id === 'long_career' ? (lang === 'en' ? 'LONG CAREER' : lang === 'es' ? 'CARRERA LARGA' : lang === 'fr' ? 'CARRIÈRE LONGUE' : 'CARREIRA LONGA') : p.id === 'freelance' ? (lang === 'en' ? 'SELF-EMPLOYED' : lang === 'es' ? 'AUTÓNOMO' : lang === 'fr' ? 'INDÉPENDANT' : 'INDEPENDENTE') : (lang === 'en' ? 'STANDARD' : lang === 'es' ? 'ESTÁNDAR' : lang === 'fr' ? 'STANDARD' : 'PADRÃO')}
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
                                    { label: tr.calc_age, value: age, min: 18, max: 85, setter: setAge },
                                    { label: tr.calc_pt_years, value: ptYears, min: 0, max: 50, setter: setPtYears },
                                    ...(profile === 'expat' ? [{ label: tr.calc_foreign_years, value: foreignYears, min: 0, max: 50, setter: setForeignYears }] : []),
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
                                            results.status === 'eligible_long_career' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                                            : results.status === 'eligible_normal' ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                                            : results.status === 'eligible_early' ? 'bg-orange-500/10 border-orange-500/20 text-orange-300'
                                            : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                                        }`}>
                                            {results.status === 'eligible_normal' && tr.status_eligible_normal}
                                            {results.status === 'eligible_early' && tr.status_eligible_early}
                                            {results.status === 'eligible_long_career' && tr.status_eligible_long}
                                            {results.status === 'not_eligible_years' && tr.status_not_eligible}
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
                                                        €{results.finalRealPortugueseMonthlyPension.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                    <span className="text-[10px] font-extrabold text-slate-300 block mt-1">
                                                        {lang === 'en' ? '/ month' : lang === 'es' ? '/ mes' : lang === 'fr' ? '/ mois' : '/ mês'}
                                                        {results.isInternationalMixedCareer && (
                                                            <span className="text-amber-300 ml-1">({results.proRataRatioLabel})</span>
                                                        )}
                                                    </span>
                                                </div>

                                                {/* Detalhamento Passo a Passo */}
                                                <div className="space-y-3 pt-2">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-white/10 pb-2">
                                                        {tr.explanation_title}
                                                    </p>

                                                    <div className="flex justify-between text-slate-400">
                                                        <span>{tr.ret_age_est}:</span>
                                                        <span className="text-white font-extrabold">{results.personalRetirementAgeLabel}</span>
                                                    </div>

                                                    <div className="flex justify-between text-slate-400">
                                                        <span>{tr.calc_salary}:</span>
                                                        <span className="text-white font-extrabold">€{salary.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</span>
                                                    </div>

                                                    {/* Taxa Teórica Global */}
                                                    <div className="flex justify-between text-slate-400">
                                                        <span>{tr.accrual_rate_label}:</span>
                                                        <span className="text-amber-300 font-extrabold">
                                                            {results.theoreticalGlobalAccrualPct.toFixed(2)}% ({results.totalUnifiedYears} {lang === 'en' ? 'unified years' : lang === 'es' ? 'años unificados' : lang === 'fr' ? 'années unifiées' : 'anos unificados'})
                                                        </span>
                                                    </div>

                                                    {/* Pensão Teórica Integral */}
                                                    <div className="flex justify-between text-slate-400">
                                                        <span>{tr.base_pension_label}:</span>
                                                        <span className="text-white font-extrabold">€{results.theoreticalFullMonthlyPension.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</span>
                                                    </div>

                                                    {/* Pro Rata Temporis (quando carreira internacional) */}
                                                    {results.isInternationalMixedCareer && (
                                                        <div className="flex justify-between text-slate-300 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl font-bold">
                                                            <span>⚖️ {tr.prorata_ratio_label}:</span>
                                                            <span className="text-amber-300 font-mono">
                                                                {results.proRataRatioLabel} ({ (results.proRataRatio * 100).toFixed(2) }%)
                                                            </span>
                                                        </div>
                                                    )}

                                                    {results.status === 'eligible_early' && (
                                                        <div className="space-y-2.5 pt-2 border-t border-white/10">
                                                            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-1">
                                                                <div className="flex justify-between text-rose-300 font-bold text-xs">
                                                                    <span>⚠️ {tr.early_penalty_reason} (-{results.anticipationPenaltyPct.toFixed(2)}%):</span>
                                                                    <span>-€{results.anticipationPenaltyEuros.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</span>
                                                                </div>
                                                                <p className="text-[9.5px] text-rose-200/80 leading-normal">
                                                                    {tr.early_penalty_desc
                                                                        .replace('{months}', String(results.ageDiffMonths))
                                                                        .replace('{legalAge}', results.personalRetirementAgeLabel)}
                                                                </p>
                                                            </div>

                                                            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-1">
                                                                <div className="flex justify-between text-rose-300 font-bold text-xs">
                                                                    <span>📉 {tr.sustainability_reason} (-{results.sustainabilityFactorCutPct.toFixed(2)}%):</span>
                                                                    <span>-€{results.sustainabilityFactorCutEuros.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</span>
                                                                </div>
                                                                <p className="text-[9.5px] text-rose-200/80 leading-normal">
                                                                    {tr.sustainability_desc}
                                                                </p>
                                                            </div>

                                                            <div className="flex justify-between text-rose-400 font-extrabold text-[11px] pt-1">
                                                                <span>{tr.total_cuts_label}</span>
                                                                <span>-€{results.totalCutsEuros.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} / {lang === 'en' ? 'mo' : lang === 'es' ? 'mes' : lang === 'fr' ? 'mois' : 'mês'}</span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {(results.status === 'eligible_normal' || results.status === 'eligible_long_career') && (
                                                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-1 mt-2">
                                                            <div className="text-emerald-300 font-bold text-xs">
                                                                ✅ {tr.no_penalty_reason}
                                                            </div>
                                                            <p className="text-[9.5px] text-emerald-200/80 leading-normal">
                                                                {tr.no_penalty_desc.replace('{legalAge}', results.personalRetirementAgeLabel)}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* Aviso de Instrução Bilateral Obrigatória */}
                                                    {results.bilateralNoticeRequired && (
                                                        <div className="p-3.5 bg-amber-500/15 border border-amber-500/30 rounded-xl text-[10px] text-amber-200 font-semibold leading-relaxed flex items-start gap-2.5">
                                                            <Globe size={16} className="shrink-0 mt-0.5 text-amber-400" />
                                                            <div>
                                                                <strong className="text-white block mb-0.5 uppercase tracking-wide">
                                                                    ⚠️ {tr.bilateral_warning_badge}
                                                                </strong>
                                                                <span>{tr.bilateral_warning_desc}</span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Aviso de Pensão Mínima em Pro Rata */}
                                                    {results.isInternationalMixedCareer && (
                                                        <div className="p-3 bg-slate-700/50 border border-slate-600 rounded-xl text-[9.5px] text-slate-300 leading-normal flex items-start gap-2">
                                                            <Scale size={14} className="shrink-0 mt-0.5 text-slate-400" />
                                                            <span>{tr.min_pension_foreign_warning}</span>
                                                        </div>
                                                    )}

                                                    {results.isNationalMinimumApplied && (
                                                        <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-[9.5px] text-cyan-200 leading-normal">
                                                            {tr.min_applied_note.replace('{min}', results.nationalMinimumThreshold.toFixed(2))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Callout CSI se pensão for baixa ou carreira pro rata */}
                                                {(results.isInternationalMixedCareer || results.finalRealPortugueseMonthlyPension < 650) && (
                                                    <div className="p-3.5 bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border border-cyan-500/30 rounded-2xl flex items-start gap-3 mt-2 shadow-sm">
                                                        <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0 mt-0.5">
                                                            <HeartHandshake size={16} />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <h5 className="text-[10px] font-black text-cyan-300 uppercase tracking-wider">
                                                                {tr.csi_callout_title}
                                                            </h5>
                                                            <p className="text-[9.5px] text-cyan-100/90 leading-relaxed font-normal">
                                                                {tr.csi_callout_desc}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {results.status === 'eligible_early' && (
                                            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-[10px] text-amber-300 font-semibold leading-relaxed flex items-start gap-2">
                                                <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-400" />
                                                <span>{tr.comparison} <strong className="text-white">€{results.projectedAtNormalAgeMonthlyPension.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}/{lang === 'en' ? 'mo' : lang === 'es' ? 'mes' : lang === 'fr' ? 'mois' : 'mês'}</strong> (+{results.ageDiffMonths} {lang === 'en' ? 'months' : lang === 'es' ? 'meses' : lang === 'fr' ? 'mois' : 'meses'}).</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="h-px bg-slate-200/70 my-4" />

                            {/* ══════════════════════════════════════════════════════════
                                🏛️ COMPLEMENTO SOLIDÁRIO PARA IDOSOS (CSI) - MULTI-IDIOMA
                                ══════════════════════════════════════════════════════════ */}
                            <AccordionCard 
                                id="csi-section"
                                title={tr.csi_title} 
                                icon={<HeartHandshake size={15} />} 
                                defaultOpen={profile === 'expat' || results?.isInternationalMixedCareer}
                            >
                                <div className="space-y-4 text-[11px] leading-relaxed">
                                    {/* Introdução / Conceito */}
                                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-slate-800 space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 text-[8px] font-black uppercase bg-amber-500 text-slate-950 rounded-full">{tr.csi_badge}</span>
                                            <strong className="text-xs text-slate-900 font-black">{tr.csi_what_title}</strong>
                                        </div>
                                        <p className="text-slate-700">
                                            {tr.csi_what_desc}
                                        </p>
                                    </div>

                                    {/* 1. Condições Gerais de Elegibilidade */}
                                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5">
                                        <div className="flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-tight">
                                            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                                            <span>{tr.csi_elig_title}</span>
                                        </div>
                                        <ul className="space-y-1.5 pl-1 text-slate-700 text-[10.5px]">
                                            <li>• {tr.csi_elig_age}</li>
                                            <li>• {tr.csi_elig_status}</li>
                                            <li>• {tr.csi_elig_residence}</li>
                                            <li>• {tr.csi_elig_vpt}</li>
                                        </ul>
                                    </div>

                                    {/* 2. Condição de Recursos & Regras de Cálculo */}
                                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5">
                                        <div className="flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-tight">
                                            <Scale size={15} className="text-indigo-600 shrink-0" />
                                            <span>{tr.csi_means_title}</span>
                                        </div>
                                        <p className="text-slate-700 font-mono bg-white p-2.5 rounded-xl border border-slate-200 text-[10px] text-center font-bold text-amber-800">
                                            {tr.csi_means_formula}
                                        </p>
                                        <ul className="space-y-1.5 pl-1 text-slate-700 text-[10.5px]">
                                            <li>• {tr.csi_means_single}</li>
                                            <li>• {tr.csi_means_couple}</li>
                                            <li className="p-2.5 bg-emerald-50 border border-emerald-200/80 rounded-xl text-emerald-950 font-bold">
                                                ⭐ {tr.csi_means_children}
                                            </li>
                                        </ul>
                                    </div>

                                    {/* 3. Rendimentos Contabilizados */}
                                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5">
                                        <div className="flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-tight">
                                            <Calculator size={15} className="text-amber-600 shrink-0" />
                                            <span>{tr.csi_income_title}</span>
                                        </div>
                                        <ul className="space-y-1.5 pl-1 text-slate-700 text-[10.5px]">
                                            <li>• {tr.csi_income_pensions}</li>
                                            <li>• {tr.csi_income_work}</li>
                                            <li>• {tr.csi_income_capital}</li>
                                            <li>• {tr.csi_income_assets}</li>
                                        </ul>
                                    </div>

                                    {/* 4. Benefícios Adicionais Acoplados ao CSI */}
                                    <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-3 shadow-md">
                                        <div className="flex items-center gap-2 font-black text-xs uppercase tracking-tight text-amber-400">
                                            <Sparkles size={15} className="shrink-0" />
                                            <span>{tr.csi_benefits_title}</span>
                                        </div>
                                        <p className="text-[10.5px] text-slate-300">
                                            {tr.csi_benefits_desc}
                                        </p>
                                        <div className="grid sm:grid-cols-2 gap-2.5 pt-1">
                                            <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl space-y-1">
                                                <div className="flex items-center gap-1.5 text-amber-300 font-bold text-[10.5px]">
                                                    <Pill size={14} />
                                                    <span>{tr.csi_bam_title}</span>
                                                </div>
                                                <p className="text-[9.5px] text-slate-300">
                                                    {tr.csi_bam_desc}
                                                </p>
                                            </div>

                                            <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl space-y-1">
                                                <div className="flex items-center gap-1.5 text-amber-300 font-bold text-[10.5px]">
                                                    <Glasses size={14} />
                                                    <span>{tr.csi_glasses_title}</span>
                                                </div>
                                                <p className="text-[9.5px] text-slate-300">
                                                    {tr.csi_glasses_desc}
                                                </p>
                                            </div>

                                            <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl space-y-1">
                                                <div className="flex items-center gap-1.5 text-amber-300 font-bold text-[10.5px]">
                                                    <Zap size={14} />
                                                    <span>{tr.csi_energy_title}</span>
                                                </div>
                                                <p className="text-[9.5px] text-slate-300">
                                                    {tr.csi_energy_desc}
                                                </p>
                                            </div>

                                            <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl space-y-1">
                                                <div className="flex items-center gap-1.5 text-amber-300 font-bold text-[10.5px]">
                                                    <Home size={14} />
                                                    <span>{tr.csi_housing_title}</span>
                                                </div>
                                                <p className="text-[9.5px] text-slate-300">
                                                    {tr.csi_housing_desc}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 5. Documentação e Trâmite de Pedido */}
                                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5">
                                        <div className="flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-tight">
                                            <FileText size={15} className="text-amber-600 shrink-0" />
                                            <span>{tr.csi_docs_title}</span>
                                        </div>
                                        <ul className="space-y-1.5 pl-1 text-slate-700 text-[10.5px]">
                                            <li>• {tr.csi_docs_forms}</li>
                                            <li>• {tr.csi_docs_personal}</li>
                                            <li>• {tr.csi_docs_res_proof}</li>
                                            <li className="p-2.5 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-950 font-bold">
                                                🌍 {tr.csi_docs_foreign_pension}
                                            </li>
                                            <li>• {tr.csi_docs_submission}</li>
                                        </ul>
                                    </div>
                                </div>
                            </AccordionCard>

                            <div className="h-px bg-slate-200/70 my-4" />

                            {/* How to apply */}
                            <AccordionCard title={tr.how_request_title} icon={<ExternalLink size={15} />} defaultOpen={false}>
                                {results?.bilateralNoticeRequired ? (
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl mb-3 text-amber-900 text-[10.5px]">
                                        <strong className="block mb-1">⚠️ {tr.bilateral_warning_badge}:</strong>
                                        {tr.bilateral_warning_desc}
                                    </div>
                                ) : (
                                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl mb-3 text-emerald-900 text-[10.5px]">
                                        <strong className="block mb-1">⚡ {tr.instant_pension_badge}:</strong>
                                        {tr.instant_pension_desc}
                                    </div>
                                )}
                                {(tr.how_request_desc || '').split('\n').map((line, i) => {
                                    if (line.startsWith('🔗')) {
                                        const url = line.replace(/^🔗 \S+ /, '').trim();
                                        return (
                                            <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white rounded-2xl hover:bg-amber-600 transition-colors font-bold uppercase tracking-widest text-[10px] my-2 shadow-sm">
                                                <ExternalLink size={11} /> {lang === 'en' ? 'Apply Online' : lang === 'es' ? 'Solicitar Online' : lang === 'fr' ? 'Postuler en Ligne' : 'Solicitar Online'}
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
                                {(tr.formula_desc || '').split('\n').map((line, i) => <p key={i} className="mb-1 last:mb-0 font-mono text-amber-700 bg-amber-50 rounded-lg px-2 py-1">{line.startsWith('[') || line.includes('=') ? line : <span className="font-semibold text-slate-600">{line}</span>}</p>)}
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
                                            const docIds = profile === 'expat'
                                                ? ['ss_pensao_velhice_req', 'ss_contagem_tempo_estrangeiro']
                                                : ['ss_pensao_velhice_req'];
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
                                                        <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500 transition-colors duration-300 shrink-0 ml-3">
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
