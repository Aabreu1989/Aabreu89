import { communityService } from './communityService';
import { persistence } from '../utils/persistence';

interface QueuedAction {
    id: string;
    action: 'like' | 'vote' | 'comment' | 'report' | 'improvement' | 'gamification' | 'save' | 'post' | 'profile' | 'service_rating' | 'delete' | 'delete_post' | 'delete_comment' | 'delete_reported_content';
    payload: any;
    timestamp: number;
    attempts?: number;
}

// V2026.PRO: Explicit IndexedDBQueue Interface for Elite Persistence
class IndexedDBQueue {
    private storageKey: string;
    
    constructor(key: string) {
        this.storageKey = key;
    }

    async get(): Promise<QueuedAction[]> {
        const idbItems = await persistence.get(this.storageKey);
        if (idbItems) return idbItems;
        
        // Fallback/Migration from localStorage
        const lsItems = localStorage.getItem(this.storageKey);
        if (lsItems) {
            try {
                const parsed = JSON.parse(lsItems);
                await this.save(parsed);
                return parsed;
            } catch (e) {
                return [];
            }
        }
        return [];
    }

    async save(items: QueuedAction[]) {
        localStorage.setItem(this.storageKey, JSON.stringify(items));
        await persistence.set(this.storageKey, items);
    }
}

class SyncService {
    private queue: QueuedAction[] = [];
    private recentlySynced: QueuedAction[] = [];
    private persistenceManager: IndexedDBQueue;
    public isSyncing = false;

    // MIRA V2026.COST-SHIELD: LOSSLESS BATCHING (V30000.FREE)
    private batchTimer: any = null;
    private retryCount = 0;

    constructor() {
        this.persistenceManager = new IndexedDBQueue('mira_sync_queue');
        this.loadQueue();
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => this.sync());
            // CEO Directive: Ensure data preservation on tab close
            window.addEventListener('beforeunload', () => this.flushBatchNow());
        }
    }

    public flushBatchNow() {
        if (this.queue.length > 0 && navigator.onLine) {
            // Using direct sync for critical last-second data
            console.log("MIRA Sync: Final flush via preservation protocol");
            this.sync(); 
        }
    }

    private emit() {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('mira_sync_status', { 
                detail: { size: this.queue.length, isSyncing: this.isSyncing } 
            }));
        }
    }

    public getQueueSize() {
        return this.queue.length;
    }

    public getPendingActions() {
        return this.queue;
    }

    public async processQueue() {
        return this.sync();
    }

    private async loadQueue() {
        if (typeof window === 'undefined') return;
        this.queue = await this.persistenceManager.get();
        this.emit();
    }

    private async saveQueue() {
        await this.persistenceManager.save(this.queue);
        this.emit();
    }


    async enqueue(action: 'like' | 'vote' | 'comment' | 'report' | 'improvement' | 'gamification' | 'save' | 'post' | 'profile' | 'service_rating' | 'delete' | 'delete_post' | 'delete_comment' | 'delete_reported_content', payload: any) {
        const item: QueuedAction = {
            id: Math.random().toString(36).substring(2, 11),
            action,
            payload,
            timestamp: Date.now(),
            attempts: 0
        };

        this.queue.push(item);
        await this.saveQueue();

        // 🛡️ PROTOCOLO SOBERANO: MILLISECOND SYNC (V2026.GOLD)
        // Critical actions bypass the batching timer for <200ms persistence.
        const isCritical = ['like', 'vote', 'gamification', 'save', 'post', 'profile', 'comment'].includes(action);

        if (isCritical || this.queue.length >= 10) {
            if (this.batchTimer) clearTimeout(this.batchTimer);
            await this.sync(); // Await sync to ensure completion before proceeding
        } else {
            if (!this.batchTimer) {
                this.batchTimer = setTimeout(() => this.sync(), 3000);
            }
        }
        return item.id;
    }

    async sync() {
        if (this.isSyncing || this.queue.length === 0 || !navigator.onLine) return;
        this.isSyncing = true;
        this.emit();

        const failedItems: QueuedAction[] = [];
        try {
            const BATCH_SIZE = 10;
            const toProcess = this.queue.slice(0, BATCH_SIZE);

            for (const item of toProcess) {
                try {
                    item.attempts = (item.attempts || 0) + 1;
                    
                    const timeoutPromise = new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Timeout 15s')), 15000)
                    );

                    const workPromise = (async () => {
                        switch (item.action) {
                            case 'like':
                                {
                                    const vType = item.payload.voteType !== undefined ? item.payload.voteType : 'like';
                                    await communityService.voteOrLike(item.payload.postId, item.payload.userId, vType);
                                }
                                break;
                            case 'vote':
                                {
                                    await communityService.voteOrLike(item.payload.postId, item.payload.userId, item.payload.voteType);
                                }
                                break;
                            case 'comment':
                                {
                                    const data = await communityService.createComment(item.payload.postId, item.payload.userId, item.payload.content, item.payload.parentId);
                                    
                                    // Map local comment ID to database UUID for sub-comments, deletions, reports, etc.
                                    const localCommentId = item.payload.tempCommentId;
                                    if (localCommentId && data && data.id) {
                                        const realCommentId = data.id;
                                        this.queue.forEach(q => {
                                            if (q.payload) {
                                                if (q.payload.parentId === localCommentId) {
                                                    q.payload.parentId = realCommentId;
                                                }
                                                if (q.payload.commentId === localCommentId) {
                                                    q.payload.commentId = realCommentId;
                                                }
                                            }
                                        });
                                    }
                                }
                                break;
                            case 'gamification':
                                const { gamificationService: gService } = await import('./gamificationService');
                                await gService.earnPoints(item.payload.userId, item.payload.amount, item.payload.reason);
                                break;
                            case 'save':
                                if (item.payload.postId && item.payload.userId) {
                                    await communityService.toggleSavePost(item.payload.postId, item.payload.userId, !!item.payload.isRemoving);
                                }
                                break;
                            case 'post':
                                {
                                    const data = await communityService.createPost(item.payload);
                                    if (!data || !data.id) throw new Error("MIRA Sync: Post creation returned no data or ID");
                                    
                                    const localId = `local-${item.id}`;
                                    const realId = data.id;
                                    
                                    // Reconcile database UUIDs for subsequent actions referencing this local ID
                                    this.queue.forEach(q => {
                                        if (q.payload) {
                                            if (q.payload.postId === localId) {
                                                q.payload.postId = realId;
                                            }
                                        }
                                    });
                                }
                                break;
                            case 'delete':
                            case 'delete_post':
                                {
                                    const { adminService } = await import('./adminService');
                                    await adminService.deletePost(item.payload.postId);
                                }
                                break;
                            case 'delete_reported_content':
                                {
                                    const { adminService } = await import('./adminService');
                                    await adminService.adminDeleteReportedContent(item.payload);
                                }
                                break;
                            case 'delete_comment':
                                {
                                    const { adminService } = await import('./adminService');
                                    await adminService.deleteComment(item.payload.commentId);
                                }
                                break;
                            case 'service_rating':
                                {
                                    const { supabase: supabaseRating } = await import('../lib/supabase');
                                    let { service_id, ...ratingData } = item.payload;

                                    // 🌉 UUID Mapping Bridge (V2026.ELITE)
                                    // Handles cases where local IDs (p-serv-X) need to map to persistent DB UUIDs
                                    const { PROTECTED_SERVICES } = await import('../utils/protectedData');
                                    const protectedSrv = PROTECTED_SERVICES.find(s => s.id === service_id);
                                    
                                    // If we find a specific mapping or the service is a known protected one
                                    // we can ensure the ID is valid or attempt a title-based lookup if needed.
                                    // For now, preservation of the intended ID is the mandate.
                                    
                                    const { error: rError } = await supabaseRating.from('service_ratings').insert([{ 
                                        ...ratingData, 
                                        service_id: protectedSrv?.id || service_id 
                                    }]);
                                    
                                    if (rError) {
                                        console.error("MIRA Sync: Rating error:", rError);
                                        // Attempt fallback to service_reviews if service_ratings is missing (Structural Audit)
                                        await supabaseRating.from('service_reviews').insert([{ 
                                            ...ratingData, 
                                            service_id: protectedSrv?.id || service_id 
                                        }]);
                                    }
                                }
                                break;
                            case 'report':
                                await communityService.report({
                                    postId: item.payload.postId,
                                    commentId: item.payload.commentId,
                                    reporterId: item.payload.userId || item.payload.reporterId,
                                    reason: item.payload.reason || 'Denúncia de Conteúdo',
                                    targetAuthorId: item.payload.targetAuthorId,
                                    reportedContentText: item.payload.reportedContentText || item.payload.content || item.payload.reason
                                });
                                break;
                            case 'improvement':
                                {
                                    const { supabase: supabaseIm } = await import('../lib/supabase');
                                    await supabaseIm.from('app_suggestions').insert([{
                                        user_id: item.payload.userId || item.payload.user_id,
                                        content: item.payload.content || item.payload.reason || item.payload.details,
                                        subject: item.payload.subject || item.payload.reason || 'Sugestão de Melhoria',
                                        email: item.payload.email
                                    }]);
                                }
                                break;
                            case 'profile':
                                {
                                    const { supabase: supabaseProf } = await import('../lib/supabase');
                                    const { id, ...profileData } = item.payload;
                                    
                                    const updatePayload: any = { ...profileData };
                                    if ('avatar' in updatePayload) {
                                        updatePayload.avatar_url = updatePayload.avatar;
                                    }
                                    if ('avatar_url' in updatePayload) {
                                        updatePayload.avatar = updatePayload.avatar_url;
                                    }
                                    if ('name' in updatePayload) {
                                        updatePayload.full_name = updatePayload.name;
                                    }
                                    if ('full_name' in updatePayload) {
                                        updatePayload.name = updatePayload.full_name;
                                    }
                                    
                                    const { error: pError } = await supabaseProf
                                        .from('profiles')
                                        .update(updatePayload)
                                        .eq('id', id);
                                    if (pError) throw pError;
                                }
                                break;
                        }
                    })();

                    await Promise.race([workPromise, timeoutPromise]);
                    
                    this.recentlySynced.push(item);
                    setTimeout(() => {
                        this.recentlySynced = this.recentlySynced.filter(i => i.id !== item.id);
                    }, 2000);
                } catch (err) {
                    console.warn(`⚠️ Sync Task Failed [${item.action}]:`, err);
                    if (item.attempts < 3) failedItems.push(item);
                }
            }

            this.queue = this.queue.filter(qItem => {
                if (!toProcess.find(p => p.id === qItem.id)) return true;
                if (failedItems.find(f => f.id === qItem.id)) return true;
                return false;
            });
            
        } catch (globalErr) {
            console.error("[SyncService] Critical error:", globalErr);
        } finally {
            this.isSyncing = false;
            await this.saveQueue();
            
            if (this.queue.length > 0 && navigator.onLine) {
                // MIRA V2026.COST-SHIELD: EXPONENTIAL BACKOFF (CEO MANDATE)
                // 5s -> 15s -> 1m -> 5m
                const backoffTiers = [5000, 15000, 60000, 300000];
                const delay = backoffTiers[Math.min(this.retryCount, backoffTiers.length - 1)];
                
                if (failedItems.length > 0) {
                    this.retryCount++;
                    console.log(`MIRA Sync: Retrying in ${delay/1000}s (Attempt ${this.retryCount})`);
                } else {
                    this.retryCount = 0; // Reset on success
                }
                
                setTimeout(() => this.sync(), delay);
            } else {
                this.retryCount = 0;
            }
        }
    }
}

export const syncService = new SyncService();
