import { AppActivityLog } from '../types';
import { supabase } from '../lib/supabase';
import { isInternalOrAdmin } from '../utils/adminUtils';
import { normalizeCategory } from '../utils/categoryUtils';

// ╔══════════════════════════════════════════════════════════════╗
// ║   MIRA TELEMETRIA SOBERANA v2026.GOLD                       ║
// ║   Canal: RPC mira_track_event (SECURITY DEFINER)            ║
// ║   Garantia: Todos os eventos chegam ao Supabase             ║
// ║             independentemente de RLS ou autenticação         ║
// ║   🛡️ GUARDA SOBERANA: Bloqueio estrito de contas de Admin    ║
// ║      e testes para evitar poluição das métricas públicas    ║
// ╚══════════════════════════════════════════════════════════════╝

class AnalyticsService {
  private logs: AppActivityLog[] = [];
  private pendingQueue: Array<{ action: string; userId: string; category?: string; metadata?: any }> = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.loadLogs();
    // Flush pending queue on visibility restore (tab focus)
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') this.flushPending();
      });
    }
  }

  async loadLogs() {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) throw error;
      if (data) {
        this.logs = data.map((d: any) => ({
          id: d.id,
          userId: d.user_id,
          action: d.action,
          category: d.metadata?.category,
          timestamp: d.created_at,
          metadata: d.metadata
        }));
      }
    } catch (e) {
      console.warn('[MIRA Analytics] Could not load logs (RLS expected for guest)');
    }
  }

  logActivity(action: any, metadata?: any) {
    this.track(action as any, 'guest', undefined, metadata);
  }

  async track(
    action: AppActivityLog['action'],
    userId: string,
    category?: string,
    metadata?: any
  ) {
    // 🛡️ CLASSIFICAÇÃO SOBERANA DE POPULAÇÃO (REGISTAR != CONTABILIZAR NA MÉTRICA OFICIAL):
    // Identificar inequivocamente se a origem do evento é Admin ou Teste interno
    const isAdminActivity = isInternalOrAdmin(userId) || isInternalOrAdmin(metadata?.email) || isInternalOrAdmin(metadata?.user_email);

    let finalAction = action;
    let finalCategory = category;

    const enrichedMetadata = {
      ...(metadata || {}),
      is_admin_activity: isAdminActivity,
      is_internal: isAdminActivity
    };

    if (action === 'ai_query') {
      const isSystem = userId === 'system' || metadata?.guest_id === 'system' || metadata?.is_benchmark === true;
      const promptText = metadata?.prompt || metadata?.query || '';
      const hasValidPrompt = typeof promptText === 'string' && promptText.trim().length > 0;

      if (isSystem || !hasValidPrompt) {
        console.warn('[MIRA Analytics] Rejeitado registo de ai_query inválido ou de sistema (convertido para system_benchmark).');
        finalAction = 'system_benchmark';
      } else {
        // Normalização canónica obrigatória para toda consulta
        finalCategory = normalizeCategory(category, promptText);
        enrichedMetadata.category = finalCategory;
      }
    }

    // 1. Registo imediato em memória local
    const log: AppActivityLog = {
      id: Math.random().toString(36).substr(2, 9),
      userId: userId || 'guest',
      action: finalAction,
      category: finalCategory,
      timestamp: new Date().toISOString(),
      metadata: enrichedMetadata
    };
    this.logs.push(log);

    // 2. Enviar para Supabase via RPC SECURITY DEFINER (bypass RLS total)
    this.sendToSupabase(finalAction, userId, finalCategory, enrichedMetadata);
  }

  private async sendToSupabase(
    action: string,
    userId: string,
    category?: string,
    metadata?: any
  ) {
    const isValidUuid =
      typeof userId === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

    // CANAL PRIMÁRIO: RPC mira_track_event com SECURITY DEFINER
    // Funciona para utilizadores autenticados E guests — bypassa RLS
    const { error: rpcError } = await supabase.rpc('mira_track_event', {
      p_action: action,
      p_user_id: isValidUuid ? userId : null,
      p_category: category || null,
      p_metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null
    });

    if (!rpcError) return; // ✅ Sucesso

    // CANAL SECUNDÁRIO: INSERT direto (funciona se RLS INSERT policy existir)
    console.warn('[MIRA Telemetry] RPC falhou, tentando INSERT direto:', rpcError.message);
    const dbPayload: any = {
      action,
      metadata: {
        ...(metadata || {}),
        category: category || null,
        guest_id: !isValidUuid ? userId : undefined
      }
    };
    if (isValidUuid) dbPayload.user_id = userId;

    const { error: insertError } = await supabase.from('activity_logs').insert([dbPayload]);

    if (insertError) {
      // CANAL TERCIÁRIO: Fila pendente para retry na próxima oportunidade
      console.warn('[MIRA Telemetry] INSERT falhou, a adicionar à fila pendente:', insertError.message);
      this.pendingQueue.push({ action, userId, category, metadata });
      this.schedulePendingFlush();
    }
  }

  private schedulePendingFlush() {
    if (this.flushTimer) return;
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      this.flushPending();
    }, 30000); // Retry ao fim de 30 segundos
  }

  private async flushPending() {
    if (this.pendingQueue.length === 0) return;
    const toFlush = [...this.pendingQueue];
    this.pendingQueue = [];
    for (const item of toFlush) {
      await this.sendToSupabase(item.action, item.userId, item.category, item.metadata);
    }
  }

  getLocalAccessCount(): number {
    if (typeof window === 'undefined') return 0;
    try {
      return parseInt(localStorage.getItem('mira_realtime_accesses_count') || '0', 10);
    } catch (e) {
      return 0;
    }
  }

  getLogs() {
    return [...this.logs];
  }

  getLogsByTimeRange(range: string) {
    const now = new Date();
    const filterDate = new Date();

    if (range === 'day' || range === '24h') filterDate.setHours(now.getHours() - 24);
    else if (range === 'week' || range === '7d') filterDate.setDate(now.getDate() - 7);
    else if (range === 'month' || range === '30d') filterDate.setMonth(now.getMonth() - 1);
    else if (range === 'year') filterDate.setFullYear(now.getFullYear() - 1);

    return this.logs.filter(log => new Date(log.timestamp) >= filterDate);
  }

  // Retorna contagem de eventos no período (para dashboard local)
  getLocalCount(action: AppActivityLog['action'] | AppActivityLog['action'][]): number {
    const actions = Array.isArray(action) ? action : [action];
    return this.logs.filter(l => actions.includes(l.action as any)).length;
  }
}

export const analytics = new AnalyticsService();
export const analyticsService = analytics;

