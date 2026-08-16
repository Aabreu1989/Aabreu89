// src/services/legalDeadlineService.ts
/**
 * ════════════════════════════════════════════════════════════════════════════════
 * MOTOR NORMATIVO DE CÁLCULO DE PRAZOS ADMINISTRATIVOS & JUDICIAIS (AIMA / CPA / CPTA)
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * Implementa o Código do Procedimento Administrativo (DL n.º 4/2015),
 * o Código de Processo nos Tribunais Administrativos (Lei n.º 15/2002),
 * e diplomas especiais reguladores da imigração e asilo.
 */

import { NORMATIVE_2026 } from '../config/normativeRules2026';

export type ProcedimentoTipo = 
  | 'audiencia_previa_cpa'
  | 'aperfeicoamento_aima'
  | 'recurso_hierarquico_cpa'
  | 'impugnacao_judicial_cpta'
  | 'procedimento_asilo';

export interface ProcedimentoNormativoDef {
  id: ProcedimentoTipo;
  nome: string;
  baseLegal: string;
  prazoPadrao: number;
  unidade: 'dias_uteis' | 'dias_corridos' | 'meses';
  termoInicialDescricao: string;
  regraContagem: string;
  temSuspensaoFeriasJudiciais: boolean;
  excecoes: string;
  fonteOficial: string;
}

export interface DeadlineCalculationInputs {
  procedimentoId: ProcedimentoTipo;
  dataNotificacao: string; // YYYY-MM-DD
  prazoPersonalizado?: number;
  isEnvioPostal?: boolean; // Se true, calcula a presunção do 3.º dia útil (Art. 113.º CPA)
}

export interface DeadlineCalculationResult {
  procedimento: ProcedimentoNormativoDef;
  dataNotificacaoEfetiva: string;
  dataTermoInicial: string;
  dataTermoFinal: string;
  diasCorridosTotais: number;
  diasUteisTotais: number;
  diasSuspensaoJudicial: number;
  avisoLegal: string;
}

export const PROCEDIMENTOS_CATALOGO: Record<ProcedimentoTipo, ProcedimentoNormativoDef> = {
  audiencia_previa_cpa: {
    id: 'audiencia_previa_cpa',
    nome: 'Audiência dos Interessados / Audiência Prévia (CPA)',
    baseLegal: 'Artigos 121.º e 122.º do CPA (Decreto-Lei n.º 4/2015)',
    prazoPadrao: 10,
    unidade: 'dias_uteis',
    termoInicialDescricao: '1.º dia útil seguinte ao da notificação postal/eletrónica (Art. 87.º, al. b)',
    regraContagem: 'Não se incluem na contagem sábados, domingos nem feriados nacionais (Art. 87.º, al. e)',
    temSuspensaoFeriasJudiciais: false,
    excecoes: 'O órgão instrutor pode fixar prazo superior até 15 dias no despacho de audiência prévia',
    fonteOficial: 'Diário da República — Decreto-Lei n.º 4/2015',
  },
  aperfeicoamento_aima: {
    id: 'aperfeicoamento_aima',
    nome: 'Notificação para Aperfeiçoamento de Pedido / Juntada de Documentos (AIMA)',
    baseLegal: 'Artigo 117.º do CPA e Lei n.º 23/2007',
    prazoPadrao: 10,
    unidade: 'dias_uteis',
    termoInicialDescricao: '1.º dia útil seguinte ao da receção da notificação',
    regraContagem: 'Contagem contínua em dias úteis administrativos',
    temSuspensaoFeriasJudiciais: false,
    excecoes: 'Prazos especiais concedidos expressamente no despacho instrutório (ex: 20 dias úteis)',
    fonteOficial: 'Diário da República — CPA / Lei n.º 23/2007',
  },
  recurso_hierarquico_cpa: {
    id: 'recurso_hierarquico_cpa',
    nome: 'Recurso Hierárquico de Decisão da AIMA',
    baseLegal: 'Artigo 193.º do Código do Procedimento Administrativo',
    prazoPadrao: 30,
    unidade: 'dias_corridos',
    termoInicialDescricao: 'Dia seguinte ao da notificação da decisão administrativa',
    regraContagem: 'Contagem contínua nos termos do Art. 279.º do Código Civil; se terminar em fim de semana ou feriado, transfere-se para o 1.º dia útil',
    temSuspensaoFeriasJudiciais: false,
    excecoes: 'Prazos especiais previstos em leis orgânicas sectoriais',
    fonteOficial: 'Diário da República — CPA (DL n.º 4/2015)',
  },
  impugnacao_judicial_cpta: {
    id: 'impugnacao_judicial_cpta',
    nome: 'Ação Administrativa / Impugnação Judicial no Tribunal Administrativo (TAC)',
    baseLegal: 'Artigos 58.º e 69.º do CPTA (Lei n.º 15/2002)',
    prazoPadrao: 3,
    unidade: 'meses',
    termoInicialDescricao: 'Data da notificação do ato administrativo impugnado',
    regraContagem: 'Meses civis; suspende-se obrigatoriamente durante as férias judiciais',
    temSuspensaoFeriasJudiciais: true,
    excecoes: 'Atos nulos podem ser impugnados a todo o tempo (Art. 58.º, n.º 1)',
    fonteOficial: 'Diário da República — Lei n.º 15/2002',
  },
  procedimento_asilo: {
    id: 'procedimento_asilo',
    nome: 'Procedimento Especial de Asilo e Proteção Internacional',
    baseLegal: 'Lei n.º 27/2008 (Lei de Asilo), Artigo 24.º',
    prazoPadrao: 5,
    unidade: 'dias_corridos',
    termoInicialDescricao: 'Dia seguinte ao da notificação do relatório preliminar',
    regraContagem: 'Contagem urgente sem dilação supletiva',
    temSuspensaoFeriasJudiciais: false,
    excecoes: 'Procedimentos especiais de fronteira (prazo reduzido a 48 horas)',
    fonteOficial: 'Diário da República — Lei n.º 27/2008',
  },
};

export class LegalDeadlineService {
  /**
   * Verifica se uma determinada data cai num fim de semana (Sábado ou Domingo).
   */
  public static isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 = Domingo, 6 = Sábado
  }

  /**
   * Verifica se uma determinada data é feriado nacional oficial em Portugal (2026).
   */
  public static isHoliday(date: Date): boolean {
    const pad = (n: number) => n < 10 ? `0${n}` : `${n}`;
    const dateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    return NORMATIVE_2026.NATIONAL_HOLIDAYS_2026.includes(dateStr);
  }

  /**
   * Verifica se uma data é dia útil (nem fim de semana nem feriado nacional).
   */
  public static isBusinessDay(date: Date): boolean {
    return !this.isWeekend(date) && !this.isHoliday(date);
  }

  /**
   * Verifica se uma data cai dentro de um período oficial de férias judiciais.
   */
  public static isJudicialVacation(date: Date): boolean {
    const time = date.getTime();
    for (const vac of NORMATIVE_2026.JUDICIAL_VACATIONS_2026) {
      const start = new Date(vac.inicio).getTime();
      const end = new Date(vac.fim).getTime();
      if (time >= start && time <= end) {
        return true;
      }
    }
    return false;
  }

  /**
   * Adiciona N dias úteis a uma data, respeitando fins de semana e feriados nacionais.
   */
  public static addBusinessDays(startDate: Date, businessDaysCount: number): Date {
    const current = new Date(startDate.getTime());
    let added = 0;
    while (added < businessDaysCount) {
      current.setDate(current.getDate() + 1);
      if (this.isBusinessDay(current)) {
        added++;
      }
    }
    return current;
  }

  /**
   * Calcula a presunção postal do 3.º dia útil (Art. 113.º, n.º 1 do CPA).
   */
  public static calculatePostalPresumption(dispatchDate: Date): Date {
    return this.addBusinessDays(dispatchDate, 3);
  }

  /**
   * Executa o cálculo exato do prazo legal para o procedimento solicitado.
   */
  public static calculateDeadline(inputs: DeadlineCalculationInputs): DeadlineCalculationResult {
    const proc = PROCEDIMENTOS_CATALOGO[inputs.procedimentoId] || PROCEDIMENTOS_CATALOGO.audiencia_previa_cpa;
    const baseDate = new Date(inputs.dataNotificacao);
    
    // 1. Apuração da Data de Notificação Efetiva (Postal vs Direta)
    let notifDate = new Date(baseDate.getTime());
    if (inputs.isEnvioPostal) {
      notifDate = this.calculatePostalPresumption(baseDate);
    }

    const prazo = inputs.prazoPersonalizado || proc.prazoPadrao;
    let termoInicial = new Date(notifDate.getTime());
    let termoFinal = new Date(notifDate.getTime());
    let diasSuspensao = 0;

    if (proc.unidade === 'dias_uteis') {
      // Inicia no 1.º dia útil seguinte (Art. 87.º, al. b CPA)
      termoInicial.setDate(termoInicial.getDate() + 1);
      while (!this.isBusinessDay(termoInicial)) {
        termoInicial.setDate(termoInicial.getDate() + 1);
      }
      termoFinal = this.addBusinessDays(notifDate, prazo);
    } else if (proc.unidade === 'dias_corridos') {
      // Inicia no dia seguinte (Art. 279.º Código Civil)
      termoInicial.setDate(termoInicial.getDate() + 1);
      termoFinal.setDate(termoFinal.getDate() + prazo);
      // Se terminar em dia não útil, transfere-se para o 1.º dia útil seguinte
      while (!this.isBusinessDay(termoFinal)) {
        termoFinal.setDate(termoFinal.getDate() + 1);
      }
    } else if (proc.unidade === 'meses') {
      // Meses civis com suspensão de férias judiciais (Art. 58.º CPTA)
      termoInicial.setDate(termoInicial.getDate() + 1);
      
      // Data base de término antes de suspensões
      const targetMonth = termoFinal.getMonth() + prazo;
      termoFinal.setMonth(targetMonth);

      // Aplicação da suspensão judicial dia a dia
      if (proc.temSuspensaoFeriasJudiciais) {
        const cursor = new Date(notifDate.getTime());
        cursor.setDate(cursor.getDate() + 1);
        while (cursor <= termoFinal) {
          if (this.isJudicialVacation(cursor)) {
            diasSuspensao++;
            termoFinal.setDate(termoFinal.getDate() + 1);
          }
          cursor.setDate(cursor.getDate() + 1);
        }
      }

      // Se o termo final cair em dia não útil, passa para o 1.º dia útil seguinte
      while (!this.isBusinessDay(termoFinal)) {
        termoFinal.setDate(termoFinal.getDate() + 1);
      }
    }

    const pad = (n: number) => n < 10 ? `0${n}` : `${n}`;
    const formatDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    const diffTime = termoFinal.getTime() - notifDate.getTime();
    const diasCorridosTotais = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    return {
      procedimento: proc,
      dataNotificacaoEfetiva: formatDate(notifDate),
      dataTermoInicial: formatDate(termoInicial),
      dataTermoFinal: formatDate(termoFinal),
      diasCorridosTotais,
      diasUteisTotais: prazo,
      diasSuspensaoJudicial: diasSuspensao,
      avisoLegal: `Cálculo efetuado com base no ${proc.baseLegal}. Verifique sempre a data expressa na carta/notificação oficial da AIMA.`,
    };
  }
}
