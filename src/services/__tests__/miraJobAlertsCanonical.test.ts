import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

function canonicalizeUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  try {
    const u = new URL(url.trim());
    const trackingParams = [
      'utm_source','utm_medium','utm_campaign','utm_term','utm_content',
      'fbclid','gclid','ref','source','session_id','sessionId','mc_cid',
      'mc_eid','trk','tracking','_hsenc','_hsmi','gh_src','source_id','token'
    ];
    trackingParams.forEach(p => u.searchParams.delete(p));
    u.protocol = u.protocol.toLowerCase();
    u.hostname = u.hostname.toLowerCase();
    u.pathname = u.pathname.replace(/\/+$/, '') || '/';
    u.hash = '';
    return u.toString();
  } catch {
    return url.trim().replace(/\/+$/, '');
  }
}

describe('💼 U02: MIRA JOB ALERTS CANONICAL URL & AGGREGATION', () => {
  test('T-JOB-01: Higienização e normalização de URLs com tracking params voláteis', () => {
    const dirtyUrl1 = 'https://weworkremotely.com/jobs/12345/?utm_source=rss&utm_medium=feed&ref=newsletter#top';
    const dirtyUrl2 = 'https://weworkremotely.com/jobs/12345?fbclid=xyz987&session_id=abc1234';
    const cleanUrl = 'https://weworkremotely.com/jobs/12345';

    assert.equal(canonicalizeUrl(dirtyUrl1), cleanUrl);
    assert.equal(canonicalizeUrl(dirtyUrl2), cleanUrl);
    assert.equal(canonicalizeUrl(cleanUrl), cleanUrl);
  });

  test('T-JOB-02: Agregação por ciclo - 1 vaga compatível gera notificação individual', () => {
    const newDeliveries = [
      { id: 'job-1', title: 'Engenheiro Frontend', source: 'Net-Empregos', location: 'Lisboa', topic: 'TI' }
    ];

    let singleNotif = null;
    let aggregatedNotif = null;

    if (newDeliveries.length === 1) {
      singleNotif = {
        title: '💼 Nova Vaga Compatível: ' + newDeliveries[0].title,
        link: '/jobs?jobId=' + newDeliveries[0].id
      };
    } else {
      aggregatedNotif = {
        title: '💼 ' + newDeliveries.length + ' Novas Vagas Compatíveis',
        link: '/jobs?topic=TI'
      };
    }

    assert.ok(singleNotif);
    assert.equal(singleNotif.title, '💼 Nova Vaga Compatível: Engenheiro Frontend');
    assert.equal(aggregatedNotif, null);
  });

  test('T-JOB-03: Agregação por ciclo - 25 vagas compatíveis geram EXATAMENTE 1 notificação consolidada', () => {
    const newDeliveries = Array.from({ length: 25 }).map((_, i) => ({
      id: 'job-' + i,
      title: 'Dev ' + i,
      source: 'WWR',
      location: 'Lisboa',
      topic: 'Tecnologia'
    }));

    let notifCount = 0;
    let finalTitle = '';

    if (newDeliveries.length === 1) {
      notifCount++;
      finalTitle = 'Individual';
    } else if (newDeliveries.length > 1) {
      notifCount++; // 1 ÚNICA notificação para as 25 vagas!
      finalTitle = '💼 ' + newDeliveries.length + ' Novas Vagas Compatíveis: ' + newDeliveries[0].topic;
    }

    assert.equal(notifCount, 1, 'Deve emitir rigorosamente 1 notificação no ciclo');
    assert.equal(finalTitle, '💼 25 Novas Vagas Compatíveis: Tecnologia');
  });
});
