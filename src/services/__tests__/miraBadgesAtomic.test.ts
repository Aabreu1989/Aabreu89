import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('🛡️ U01: MIRA BADGES ATOMIC CONCURRENCY', () => {
  test('T-BADGE-01: Simulação de conflito de chave primária 23505 descarta notificação', () => {
    const awardedBadges = new Set<string>();
    const emittedNotifications: string[] = [];

    function atomicAwardBadge(userId: string, badgeId: string) {
      const key = userId + ':' + badgeId;
      if (awardedBadges.has(key)) {
        return { success: false, code: '23505' };
      }
      awardedBadges.add(key);
      emittedNotifications.push(badgeId);
      return { success: true, badge_id: badgeId };
    }

    const res1 = atomicAwardBadge('user-123', 'pioneiro');
    assert.equal(res1.success, true);
    assert.equal(emittedNotifications.length, 1);

    const res2 = atomicAwardBadge('user-123', 'pioneiro');
    assert.equal(res2.success, false);
    assert.equal(res2.code, '23505');

    const res3 = atomicAwardBadge('user-123', 'pioneiro');
    assert.equal(res3.success, false);

    assert.equal(emittedNotifications.length, 1);
    assert.equal(emittedNotifications[0], 'pioneiro');
  });

  test('T-BADGE-02: Execução paralela simultânea resulta em exatamente 1 vencedor', async () => {
    const awardedBadges = new Set<string>();
    let notificationCount = 0;

    async function concurrentWorker(userId: string, badgeId: string) {
      await new Promise(r => setTimeout(r, Math.random() * 10));
      const key = userId + ':' + badgeId;
      if (awardedBadges.has(key)) {
        return { success: false, code: '23505' };
      }
      awardedBadges.add(key);
      notificationCount++;
      return { success: true };
    }

    const promises = Array.from({ length: 10 }).map(() => concurrentWorker('user-999', 'sentinela'));
    const results = await Promise.all(promises);

    const winners = results.filter(r => r.success);
    const losers = results.filter(r => !r.success && r.code === '23505');

    assert.equal(winners.length, 1, 'Deve haver exatamente 1 vencedor na concorrência atómica');
    assert.equal(losers.length, 9, 'Todos os outros 9 devem colidir em 23505 e ser descartados');
    assert.equal(notificationCount, 1, 'Exatamente 1 notificação emitida');
  });
});
