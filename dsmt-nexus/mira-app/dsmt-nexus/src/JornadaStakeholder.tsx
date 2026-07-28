import React from 'react';
import { motion } from 'framer-motion';
import type { Stakeholder, EstagioFunil } from './types';

const FUNIL_DEFINITION: { estagio: EstagioFunil; definicao: string; proximo: string; cor: string; foraFunil?: boolean }[] = [
  { estagio: 'Identificado',        definicao: 'Stakeholder mapeado',              proximo: 'Completar perfil',           cor: '#64748b' },
  { estagio: 'Qualificado',         definicao: 'Perfil básico preenchido',          proximo: 'Avaliar prioridade',         cor: '#3b82f6' },
  { estagio: 'Priorizado',          definicao: 'Stakeholder ranqueado',             proximo: 'Planejar abordagem',         cor: '#8b5cf6' },
  { estagio: 'Abordado',            definicao: 'Primeiro contato realizado',        proximo: 'Registrar reação',           cor: '#f59e0b' },
  { estagio: 'Engajado',            definicao: 'Houve interação substantiva',       proximo: 'Capturar feedback',          cor: '#10b981' },
  { estagio: 'Feedback registrado', definicao: 'Posição e sinais capturados',       proximo: 'Definir follow-up',          cor: '#06b6d4' },
  { estagio: 'Aliado potencial',    definicao: 'Há abertura clara',                 proximo: 'Intensificar relação',       cor: '#16a34a' },
  { estagio: 'Aliado ativo',        definicao: 'Já colabora ou responde bem',       proximo: 'Consolidar parceria',        cor: '#0891b2' },
  { estagio: 'Defensor do SBCE',    definicao: 'Ajuda a sustentar a agenda',        proximo: 'Manter e mobilizar',         cor: '#6d28d9' },
  { estagio: 'Opositor',            definicao: 'Critica/joga contra',               proximo: 'Estratégia específica',      cor: '#dc2626', foraFunil: true },
  { estagio: 'Cético',              definicao: 'Em dúvida sobre impacto',           proximo: 'Estratégia específica',      cor: '#ea580c', foraFunil: true },
];

const ICONS: Record<string, string> = {
  'Identificado': '🔍', 'Qualificado': '📋', 'Priorizado': '⭐',
  'Abordado': '📞', 'Engajado': '🤝', 'Feedback registrado': '💬',
  'Aliado potencial': '🎯', 'Aliado ativo': '✅', 'Defensor do SBCE': '🏆',
};

interface Props { stakeholders: (Stakeholder & { prioridadeScore?: number })[] }

export const JornadaStakeholder: React.FC<Props> = ({ stakeholders }) => {
  const total = Math.max(stakeholders.length, 1);
  const outOfFunnel = stakeholders.filter(s => s.jornadaEstagio === 'Opositor' || s.jornadaEstagio === 'Cético');
  const converted = stakeholders.filter(s => ['Aliado ativo', 'Defensor do SBCE'].includes(s.jornadaEstagio)).length;
  const funnelStages = FUNIL_DEFINITION.filter(f => !f.foraFunil);

  const stagesWithData = funnelStages.map((stage, idx) => {
    const count = stakeholders.filter(s => s.jornadaEstagio === stage.estagio).length;
    const barWidth = Math.max(100 - idx * (68 / (funnelStages.length - 1)), 32);
    return { ...stage, count, pct: Math.round((count / total) * 100), barWidth };
  });

  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 className="text-gradient-cyan">Jornada do Stakeholder</h1>
        <p style={{ color: 'var(--text-muted)' }}>Análise de conversão · Funil de engajamento SBCE · {total} entidades</p>
      </div>

      {/* KPI Strip */}
      <div className="jornada-kpi-grid">
        {[
          { label: 'No Funil',          value: total - outOfFunnel.length, color: '#00F2FF' },
          { label: 'Convertidos',        value: converted,                  color: '#7000FF' },
          { label: 'Taxa Conversão',     value: `${Math.round((converted / total) * 100)}%`, color: '#22C55E' },
          { label: 'Fora do Funil',      value: outOfFunnel.length,         color: '#EF4444' },
        ].map(kpi => (
          <div key={kpi.label} className="glass-panel" style={{ padding: 'var(--space-card)', borderLeft: `3px solid ${kpi.color}` }}>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '6px' }}>{kpi.label.toUpperCase()}</div>
            <div style={{ fontSize: 'clamp(20px, 4vw, 26px)', fontWeight: 900, color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Main Layout */}
      <div className="jornada-main-grid">

        {/* LEFT: Visual Funnel */}
        <div className="glass-panel" style={{ padding: 'var(--space-card)' }}>
          <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '2px', color: 'var(--text-muted)', marginBottom: '20px' }}>FUNIL DE CONVERSÃO SBCE</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center' }}>
            {stagesWithData.map((stage, idx) => (
              <motion.div key={stage.estagio} initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: idx * 0.07, duration: 0.5, ease: 'easeOut' }}
                style={{ width: `${stage.barWidth}%`, position: 'relative' }}>
                <div style={{
                  height: '36px', borderRadius: '4px',
                  background: `linear-gradient(90deg, ${stage.cor}55, ${stage.cor}18)`,
                  border: `1px solid ${stage.cor}55`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0 10px', overflow: 'hidden'
                }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg,transparent,${stage.cor}99,transparent)` }} />
                  <span style={{ fontSize: '10px', fontWeight: 700, color: stage.cor, whiteSpace: 'nowrap' }}>
                    {ICONS[stage.estagio] || ''} {stage.estagio}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 900, color: stage.count > 0 ? 'white' : 'rgba(255,255,255,0.2)' }}>
                    {stage.count || '—'}
                  </span>
                </div>
                {idx < stagesWithData.length - 1 && (
                  <div style={{ width: '2px', height: '5px', margin: '0 auto', background: `linear-gradient(180deg,${stage.cor}44,${stagesWithData[idx+1].cor}44)` }} />
                )}
              </motion.div>
            ))}
          </div>

          {/* Out of funnel warning */}
          {outOfFunnel.length > 0 && (
            <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px' }}>
              <div style={{ fontSize: '9px', fontWeight: 800, color: '#EF4444', letterSpacing: '1px', marginBottom: '8px' }}>⚠ FORA DO FUNIL</div>
              {outOfFunnel.map(s => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                  <span style={{ fontSize: '11px' }}>{s.name}</span>
                  <span style={{ fontSize: '10px', color: s.jornadaEstagio === 'Opositor' ? '#EF4444' : '#F97316' }}>{s.jornadaEstagio}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Stage Breakdown */}
        <div className="glass-panel" style={{ padding: 'var(--space-card)', overflowY: 'auto', maxHeight: 'clamp(400px, 70vh, 680px)' }}>
          <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '2px', color: 'var(--text-muted)', marginBottom: '20px' }}>ANÁLISE DETALHADA POR ESTÁGIO</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {stagesWithData.filter(s => s.count > 0).map(stage => {
              const items = stakeholders.filter(s => s.jornadaEstagio === stage.estagio);
              return (
                <motion.div key={stage.estagio} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ borderRadius: '10px', border: `1px solid ${stage.cor}33`, overflow: 'hidden' }}>
                  {/* Stage header */}
                  <div style={{ padding: '10px 16px', background: `linear-gradient(90deg,${stage.cor}22,transparent)`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px' }}>{ICONS[stage.estagio] || '●'}</span>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: stage.cor }}>{stage.estagio}</div>
                        <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{stage.definicao}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: stage.cor }}>{stage.count}</div>
                      <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{stage.pct}% do total</div>
                    </div>
                  </div>
                  {/* Items */}
                  <div style={{ padding: '8px 14px 10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {items.map(s => (
                      <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px', background: 'rgba(10,15,28,0.5)', borderRadius: '6px' }}>
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 600 }}>{s.name}</div>
                          <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{s.proximaAcao}</div>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 900, color: (s.prioridadeScore || 0) >= 15 ? '#EF4444' : stage.cor }}>{s.prioridadeScore}</span>
                      </div>
                    ))}
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontStyle: 'italic', paddingTop: '4px', paddingLeft: '4px' }}>
                      → Próximo: {stage.proximo}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
