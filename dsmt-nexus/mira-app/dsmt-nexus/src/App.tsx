import { useState, useMemo, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Database, Grid, Zap, Activity, Search, GitBranch, AlertTriangle, ShieldAlert, PieChart as PieChartIcon, CheckSquare, FileSpreadsheet
} from 'lucide-react';

type ViewType = 'dashboard' | 'database' | 'funil' | 'matrix' | 'governance' | 'risks' | 'themes' | 'editor';

const NAV_ITEMS: { id: ViewType; label: string; shortLabel: string; icon: React.ReactNode }[] = [
  { id: 'dashboard',  label: 'Dashboard',       shortLabel: 'Home',    icon: <LayoutDashboard size={20} /> },
  { id: 'database',   label: 'Registry',         shortLabel: 'Base',    icon: <Database size={20} /> },
  { id: 'risks',      label: 'Matriz de Risco',  shortLabel: 'Risco',   icon: <ShieldAlert size={20} /> },
  { id: 'themes',     label: 'Temático',         shortLabel: 'Temas',   icon: <PieChartIcon size={20} /> },
  { id: 'governance', label: 'Governança',       shortLabel: 'Gov.',    icon: <CheckSquare size={20} /> },
  { id: 'editor',     label: 'Editor Excel',     shortLabel: 'Editor',  icon: <FileSpreadsheet size={20} /> },
  { id: 'funil',      label: 'Segmentação',      shortLabel: 'Funil',   icon: <GitBranch size={20} /> },
  { id: 'matrix',     label: 'Jornada',          shortLabel: 'Jornada', icon: <Grid size={20} /> },
];
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ScatterChart, Scatter, ZAxis, PieChart, Pie, Legend, LabelList, CartesianGrid
} from 'recharts';
import { mockStakeholders } from './data';
import type { Stakeholder, EstagioFunil } from './types';
import { JornadaStakeholder } from './JornadaStakeholder';
import { DataEntryTable } from './DataEntryTable';

// Funil Definição Oficial SBCE
const FUNIL_DEFINITION: { estagio: EstagioFunil; definicao: string; evidencia: string; proximo: string; cor: string; foraFunil?: boolean }[] = [
  { estagio: 'Identificado',         definicao: 'Stakeholder mapeado',                  evidencia: 'Nome da instituição + classificação mínima',               proximo: 'Completar perfil',               cor: '#64748b' },
  { estagio: 'Qualificado',          definicao: 'Perfil básico preenchido',              evidencia: 'Contato, cargo, papel no SBCE, tema de interesse',         proximo: 'Avaliar prioridade',             cor: '#3b82f6' },
  { estagio: 'Priorizado',           definicao: 'Stakeholder ranqueado',                 evidencia: 'Score de prioridade + owner interno',                     proximo: 'Planejar abordagem',             cor: '#8b5cf6' },
  { estagio: 'Abordado',             definicao: 'Primeiro contato realizado',            evidencia: 'Data, canal e resumo do contato',                         proximo: 'Registrar reação',               cor: '#f59e0b' },
  { estagio: 'Engajado',             definicao: 'Houve interação substantiva',           evidencia: 'Participação em reunião/evento/consulta',                  proximo: 'Capturar feedback',              cor: '#10b981' },
  { estagio: 'Feedback registrado',  definicao: 'Posição e sinais capturados',           evidencia: 'Campo de percepção + encaminhamento',                     proximo: 'Definir follow-up',              cor: '#06b6d4' },
  { estagio: 'Aliado potencial',     definicao: 'Há abertura clara',                     evidencia: 'Posição favorável ou neutra com abertura',                 proximo: 'Intensificar relação',           cor: '#16a34a' },
  { estagio: 'Aliado ativo',         definicao: 'Já colabora ou responde bem',           evidencia: 'Participação recorrente / retorno qualificado',            proximo: 'Consolidar parceria',            cor: '#0891b2' },
  { estagio: 'Defensor do SBCE',     definicao: 'Ajuda a sustentar a agenda',            evidencia: 'Apoio público/técnico/relacional ao sistema',              proximo: 'Manter e mobilizar',             cor: '#6d28d9' },
  { estagio: 'Opositor',             definicao: 'Critica/joga contra',                   evidencia: 'Já fez críticas abertas ou à interlocutores próximos',     proximo: 'Estratégia comunicação específica', cor: '#dc2626', foraFunil: true },
  { estagio: 'Cético',               definicao: 'Em dúvida sobre impacto e se vai funcionar', evidencia: 'Silencia ou emite opiniões controversas',            proximo: 'Estratégia comunicação específica', cor: '#ea580c', foraFunil: true },
];

function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>(mockStakeholders);
  const [searchTerm, setSearchTerm] = useState('');

  // FÓRMULA OFICIAL: Influência + Exposição ao SBCE + Urgência + Potencial de Bloqueio
  const processedStakeholders = useMemo(() => {
    return stakeholders.map(s => {
      const score = s.influenciaInstitucional + s.exposicaoSBCE + s.urgencia + s.potencialBloqueio;
      return { ...s, prioridadeScore: score };
    });
  }, [stakeholders]);

  const funnelData = useMemo(() => {
    const stages: EstagioFunil[] = ['Identificado', 'Qualificado', 'Priorizado', 'Abordado', 'Engajado', 'Feedback registrado', 'Aliado potencial', 'Aliado ativo', 'Defensor do SBCE'];
    return stages.map(stage => ({
      name: stage,
      value: processedStakeholders.filter(s => s.jornadaEstagio === stage).length,
      cor: FUNIL_DEFINITION.find(f => f.estagio === stage)?.cor || '#00F2FF'
    })).reverse();
  }, [processedStakeholders]);

  const stats = useMemo(() => {
    const total = processedStakeholders.length;
    const highRisk = processedStakeholders.filter(s => s.potencialBloqueio >= 4).length;
    const criticals = processedStakeholders.filter(s => (s.prioridadeScore || 0) >= 15).length;
    const defenders = processedStakeholders.filter(s => ['Aliado ativo', 'Defensor do SBCE'].includes(s.jornadaEstagio)).length;
    
    // Data Quality KPIs
    const completeContact = processedStakeholders.filter(s => s.contatoPrincipal && s.cargo && s.email).length;
    const roleDefined = processedStakeholders.filter(s => s.papelSBCE && s.papelSBCE !== 'Outro').length;
    const ownerDefined = processedStakeholders.filter(s => s.ownerInterno).length;
    const historyStandardized = processedStakeholders.filter(s => s.dataUltimoContato && s.tipoInteracaoUltimoContato && s.resumoUltimoContato).length;
    
    return { 
      total, highRisk, defenders, criticals,
      dqContact: Math.round((completeContact / total) * 100) || 0,
      dqRole: Math.round((roleDefined / total) * 100) || 0,
      dqOwner: Math.round((ownerDefined / total) * 100) || 0,
      dqHistory: Math.round((historyStandardized / total) * 100) || 0
    };
  }, [processedStakeholders]);

  const filteredStakeholders = useMemo(() => processedStakeholders.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contatoPrincipal.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.temaPrincipal.toLowerCase().includes(searchTerm.toLowerCase())
  ), [processedStakeholders, searchTerm]);

  const radarData = useMemo(() => {
    const avg = (key: keyof Stakeholder) =>
      processedStakeholders.reduce((acc, s) => acc + ((s[key] as number) || 0), 0) / processedStakeholders.length;
    return [
      { subject: 'Influência', A: avg('influenciaInstitucional') * 20, fullMark: 100 },
      { subject: 'Mobilização', A: avg('capacidadeMobilizacao') * 20, fullMark: 100 },
      { subject: 'Urgência', A: avg('urgencia') * 20, fullMark: 100 },
      { subject: 'Exposição SBCE', A: avg('exposicaoSBCE') * 20, fullMark: 100 },
      { subject: 'Legitimidade', A: avg('legitimidade') * 20, fullMark: 100 },
    ];
  }, [processedStakeholders]);

  const renderDashboard = () => (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}>
      <div style={{ marginBottom: 'var(--space-section)' }}>
        <h1 className="text-gradient-cyan">Dynamic Stakeholder Management Tool</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(13px,2vw,16px)' }}>Análise de Prioridade e Risco Regulatório SBCE · MF</p>
      </div>
      <div className="kpi-grid">
        <div className="glass-panel kpi-card red">
          <div className="kpi-label">Prioridade Crítica (≥15)</div>
          <div className="kpi-value">{stats.criticals}</div>
        </div>
        <div className="glass-panel kpi-card orange">
          <div className="kpi-label">Alto Potencial de Bloqueio</div>
          <div className="kpi-value">{stats.highRisk}</div>
        </div>
        <div className="glass-panel kpi-card green">
          <div className="kpi-label">Defensores do SBCE</div>
          <div className="kpi-value">{stats.defenders}</div>
        </div>
        <div className="glass-panel kpi-card cyan">
          <div className="kpi-label">Total Mapeado</div>
          <div className="kpi-value">{stats.total}</div>
        </div>
      </div>
      
      {/* Data Quality Section */}
      <h3 className="section-title" style={{ marginBottom: '14px', color: 'var(--text-secondary)', fontSize: 'clamp(11px,1.5vw,14px)', textTransform: 'uppercase', letterSpacing: '1px' }}>Governança de Dados da Base</h3>
      <div className="kpi-grid" style={{ marginBottom: 'var(--space-section)' }}>
        <div className="glass-panel kpi-card">
          <div className="kpi-label">Contato Completo</div>
          <div className="kpi-value" style={{ color: stats.dqContact > 80 ? 'var(--success)' : 'var(--warning)' }}>{stats.dqContact}%</div>
        </div>
        <div className="glass-panel kpi-card">
          <div className="kpi-label">Papel SBCE Definido</div>
          <div className="kpi-value" style={{ color: stats.dqRole > 80 ? 'var(--success)' : 'var(--warning)' }}>{stats.dqRole}%</div>
        </div>
        <div className="glass-panel kpi-card">
          <div className="kpi-label">Owner Interno</div>
          <div className="kpi-value" style={{ color: stats.dqOwner > 80 ? 'var(--success)' : 'var(--warning)' }}>{stats.dqOwner}%</div>
        </div>
        <div className="glass-panel kpi-card">
          <div className="kpi-label">Histórico Padronizado</div>
          <div className="kpi-value" style={{ color: stats.dqHistory > 80 ? 'var(--success)' : 'var(--danger)' }}>{stats.dqHistory}%</div>
        </div>
      </div>
      <div className="responsive-grid-2" style={{ marginTop: 'var(--space-section)' }}>
        <div className="glass-panel" style={{ padding: 'var(--space-card)' }}>
          <h3 style={{ marginBottom: '18px' }}>Distribuição Atributiva (Média de Rede)</h3>
          <div style={{ height: 'clamp(240px, 35vw, 350px)' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.05)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <Radar name="Média" dataKey="A" stroke="var(--accent-cyan)" fill="var(--accent-cyan)" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: 'var(--space-card)' }}>
          <h3 style={{ marginBottom: '18px' }}>Estado do Funil SBCE</h3>
          <div style={{ height: 'clamp(240px, 35vw, 350px)' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={funnelData}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} width={120} />
                <Tooltip contentStyle={{ background: '#12192D', border: '1px solid var(--border)', borderRadius: '8px' }} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                  {funnelData.map((entry, idx) => <Cell key={idx} fill={entry.cor} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderDatabase = () => (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <div style={{ marginBottom: 'var(--space-section)' }}>
        <h1 className="text-gradient-cyan">SBCE Official Registry</h1>
        <p style={{ color: 'var(--text-muted)' }}>Score: Influência + Exposição + Urgência + Potencial de Bloqueio</p>
      </div>
      <div className="glass-panel" style={{ padding: 'var(--space-card)' }}>

        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Stakeholder</th>
                <th>Score</th>
                <th>Bloqueio</th>
                <th>Exposição</th>
                <th>Jornada</th>
                <th>Próxima Ação</th>
              </tr>
            </thead>
            <tbody>
              {filteredStakeholders.map(s => {
                const estagioInfo = FUNIL_DEFINITION.find(f => f.estagio === s.jornadaEstagio);
                return (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{s.name}</div>
                      <div style={{ fontSize: '10px', color: 'var(--accent-cyan)' }}>{s.contatoPrincipal} · {s.cargo}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '22px', fontWeight: 900, color: (s.prioridadeScore || 0) >= 15 ? '#EF4444' : '#00F2FF' }}>
                        {s.prioridadeScore}<span style={{ fontSize: '12px', opacity: 0.5 }}>/20</span>
                      </div>
                    </td>
                    <td><div style={{ color: s.potencialBloqueio >= 4 ? '#EF4444' : 'var(--text-muted)' }}>{s.potencialBloqueio}/5</div></td>
                    <td>{s.exposicaoSBCE}/5</td>
                    <td>
                      <span style={{ padding: '4px 8px', borderRadius: '4px', background: `${estagioInfo?.cor}22`, color: estagioInfo?.cor, fontSize: '10px', fontWeight: 800, whiteSpace: 'nowrap' }}>
                        {s.jornadaEstagio}
                      </span>
                    </td>
                    <td><div style={{ fontSize: '11px' }}>{s.proximaAcao}</div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );

  const renderFunil = () => (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}>
      <div style={{ marginBottom: 'var(--space-section)' }}>
        <h1 className="text-gradient-cyan">Funil de Engajamento SBCE</h1>
        <p style={{ color: 'var(--text-muted)' }}>Jornada de conversão · Definições, evidências e próximos passos</p>
      </div>

      {/* Estágios Dentro do Funil */}
      <div className="glass-panel" style={{ padding: 'var(--space-card)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <Activity color="var(--accent-cyan)" size={20} />
          <h3>Estágios do Funil</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '150px' }}>Estágio</th>
                <th>Definição Objetiva</th>
                <th>Evidência Mínima na Base</th>
                <th>Próximo Passo Esperado</th>
                <th style={{ width: '80px' }}>Ativos</th>
              </tr>
            </thead>
            <tbody>
              {FUNIL_DEFINITION.filter(f => !f.foraFunil).map((f) => {
                const count = processedStakeholders.filter(s => s.jornadaEstagio === f.estagio).length;
                return (
                  <tr key={f.estagio}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: f.cor, boxShadow: `0 0 8px ${f.cor}` }} />
                        <span style={{ fontWeight: 700, fontSize: '13px' }}>{f.estagio}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{f.definicao}</td>
                    <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{f.evidencia}</td>
                    <td>
                      <span style={{ padding: '4px 10px', borderRadius: '4px', background: `${f.cor}22`, color: f.cor, fontSize: '11px', fontWeight: 600 }}>
                        {f.proximo}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontWeight: 900, fontSize: '18px', color: count > 0 ? f.cor : 'var(--text-muted)' }}>{count}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fora do Funil */}
      <div className="glass-panel" style={{ padding: 'var(--space-card)', border: '1px solid rgba(239,68,68,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <AlertTriangle color="#EF4444" size={20} />
          <h3 style={{ color: '#EF4444' }}>Fora do Funil · Estratégia Específica</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Definição</th>
                <th>Evidência</th>
                <th>Abordagem Recomendada</th>
                <th>Ativos</th>
              </tr>
            </thead>
            <tbody>
              {FUNIL_DEFINITION.filter(f => f.foraFunil).map((f) => {
                const count = processedStakeholders.filter(s => s.jornadaEstagio === f.estagio).length;
                return (
                  <tr key={f.estagio}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: f.cor }} />
                        <span style={{ fontWeight: 700, color: f.cor }}>{f.estagio}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{f.definicao}</td>
                    <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{f.evidencia}</td>
                    <td><span style={{ padding: '4px 10px', borderRadius: '4px', background: `${f.cor}22`, color: f.cor, fontSize: '11px' }}>{f.proximo}</span></td>
                    <td style={{ textAlign: 'center', fontWeight: 900, fontSize: '18px', color: count > 0 ? f.cor : 'var(--text-muted)' }}>{count}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );

  // ============ JORNADA DO STAKEHOLDER (Visual Redesign) ============

  const renderMatrix = () => <JornadaStakeholder stakeholders={processedStakeholders} />;

  // ============ NEW: GOVERNANÇA DE DADOS ============
  const renderGovernance = () => {
    return (
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}>
        <div style={{ marginBottom: 'var(--space-section)' }}>
          <h1 className="text-gradient-cyan">Governança e Operações</h1>
          <p style={{ color: 'var(--text-muted)' }}>Métricas de qualidade, atualização e acionabilidade da base de contatos</p>
        </div>
        <div className="kpi-grid" style={{ marginBottom: 'var(--space-section)' }}>
          <div className="glass-panel kpi-card green">
            <div className="kpi-label">Contato Completo</div>
            <div className="kpi-value">{stats.dqContact}%</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Nome + Cargo + Email</div>
          </div>
          <div className="glass-panel kpi-card cyan">
            <div className="kpi-label">Papel SBCE Definido</div>
            <div className="kpi-value">{stats.dqRole}%</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Alinhamento estrutural completo</div>
          </div>
          <div className="glass-panel kpi-card orange">
            <div className="kpi-label">Owner Interno</div>
            <div className="kpi-value">{stats.dqOwner}%</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Registros com responsável MF</div>
          </div>
          <div className="glass-panel kpi-card purple">
            <div className="kpi-label">Histórico Padronizado</div>
            <div className="kpi-value">{stats.dqHistory}%</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Data + Tipo + Resumo</div>
          </div>
        </div>
        <div className="glass-panel" style={{ padding: 'var(--space-card)' }}>
          <h3 style={{ marginBottom: '20px', color: 'var(--danger)' }}>⚠️ Ação Necessária: Registros Desatualizados ou Incompletos</h3>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Stakeholder</th>
                <th>Pendência Principal</th>
                <th>Último Contato</th>
                <th>Owner</th>
              </tr>
            </thead>
            <tbody>
              {processedStakeholders.filter(s => !s.contatoPrincipal || !s.email || !s.ownerInterno || !s.dataUltimoContato).map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 700 }}>{s.name}</td>
                  <td style={{ color: 'var(--danger)' }}>
                    {!s.email ? 'Falta E-mail; ' : ''}
                    {!s.ownerInterno ? 'Sem Owner; ' : ''}
                    {!s.dataUltimoContato ? 'Sem histórico de contato' : ''}
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{s.dataUltimoContato || 'Nunca contatado'}</td>
                  <td>{s.ownerInterno || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    );
  };

  // ============ NEW: MATRIZ DE RISCO ============
  const renderRisks = () => {
    // scatter data: x = influencia, y = risco
    const scatterData = processedStakeholders.map(s => ({
      name: s.name,
      x: s.influenciaInstitucional || 1,
      y: s.potencialBloqueio || 1,
      z: s.prioridadeScore || 10
    }));

    return (
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}>
        <div style={{ marginBottom: 'var(--space-section)' }}>
          <h1 className="text-gradient-purple">Matriz de Risco Institucional</h1>
          <p style={{ color: 'var(--text-muted)' }}>Potencial de Bloqueio vs Capacidade de Influência</p>
        </div>
        <div className="glass-panel risk-matrix-panel" style={{ padding: 'var(--space-card)', height: 'clamp(320px,50vw,500px)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '24px' }}>Mapeamento de Ameaças (Quadrante Crítico: Superior Direito)</h3>
          <div style={{ flex: 1 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <PolarGrid />
                <XAxis type="number" dataKey="x" name="Influência" tickCount={5} domain={[0, 5]} label={{ value: 'Influência Institucional (0-5)', position: 'insideBottom', offset: -10, fill: 'var(--text-muted)' }} stroke="var(--border)" tick={{fill: 'var(--text-muted)'}} />
                <YAxis type="number" dataKey="y" name="Risco/Bloqueio" tickCount={5} domain={[0, 5]} label={{ value: 'Potencial de Bloqueio (0-5)', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)' }} stroke="var(--border)" tick={{fill: 'var(--text-muted)'}} />
                <ZAxis type="number" dataKey="z" range={[100, 500]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: '#12192D', border: '1px solid var(--border)', borderRadius: '8px' }}
                  formatter={(value, name) => [value, name === 'x' ? 'Influência' : name === 'y' ? 'Bloqueio' : 'Score']} 
                />
                <Scatter name="Stakeholders" data={scatterData} fill="var(--danger)" opacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>
    );
  };

  // ============ NEW: INTELIGÊNCIA TEMÁTICA ============
  const renderThemes = () => {
    // agrupar por temaPrincipal
    const temas = processedStakeholders.reduce((acc, s) => {
      const tema = s.temaPrincipal || 'Geral';
      acc[tema] = (acc[tema] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const temasData = Object.entries(temas).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

    const papeis = processedStakeholders.reduce((acc, s) => {
      const papel = s.papelSBCE || 'Outro';
      acc[papel] = (acc[papel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const papeisData = Object.entries(papeis).map(([name, value]) => ({ name, value }));

    const PIE_COLORS = ['#00F2FF', '#7000FF', '#3B82F6', '#10B981', '#F59E0B', '#F43F5E'];

    return (
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}>
        <div style={{ marginBottom: 'var(--space-section)' }}>
          <h1 className="text-gradient-cyan">Inteligência Temática e Segmentação</h1>
          <p style={{ color: 'var(--text-muted)' }}>Análise de concentração de pautas e distribuição funcional no SBCE</p>
        </div>
        <div className="responsive-grid-half">
          <div className="glass-panel" style={{ padding: 'var(--space-card)' }}>
            <h3 style={{ marginBottom: '18px', fontWeight: 700 }}>Densidade por Tema Regulatório</h3>
            <div style={{ height: 'clamp(240px,35vw,350px)' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={temasData} margin={{ left: 0, right: 40, top: 10, bottom: 10 }}>
                  <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 600 }} width={180} />
                  <Tooltip contentStyle={{ background: '#0a0d14', border: '1px solid rgba(0, 242, 255, 0.2)', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={28}>
                    <LabelList dataKey="value" position="right" fill="var(--accent-cyan)" fontWeight={800} fontSize={14} />
                    {temasData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} style={{ filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.3))' }} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="glass-panel" style={{ padding: 'var(--space-card)' }}>
            <h3 style={{ marginBottom: '18px', fontWeight: 700 }}>Distribuição de Papéis no SBCE</h3>
            <div style={{ height: 'clamp(240px,35vw,350px)' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={papeisData}
                    cx="50%"
                    cy="45%"
                    innerRadius={85}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {papeisData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} style={{ filter: 'drop-shadow(0px 4px 10px rgba(0,0,0,0.3))' }} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0a0d14', border: '1px solid rgba(0, 242, 255, 0.2)', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }} itemStyle={{ color: 'white' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '13px', paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderEditor = () => (
    <DataEntryTable 
      data={stakeholders} 
      onUpdate={(newData) => setStakeholders(newData)} 
    />
  );

  return (
    <div className="app-container">
      {/* ── Desktop Sidebar ── */}
      <nav className="sidebar">
        <div className="sidebar-logo">
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Zap color="white" fill="white" size={22} />
          </div>
          <span style={{ fontSize: '15px', fontWeight: 800, lineHeight: 1.2 }}>DYNAMIC<br/><span style={{ color: 'var(--accent-cyan)' }}>STAKEHOLDER</span></span>
        </div>
        <div className="sidebar-nav">
          {NAV_ITEMS.map((item, i) => (
            <Fragment key={item.id}>
              {i === 6 && <div className="nav-divider" />}
              <div
                className={`nav-item ${currentView === item.id ? 'active' : ''}`}
                onClick={() => setCurrentView(item.id)}
              >
                {item.icon}
                <span className="nav-label">{item.label}</span>
              </div>
            </Fragment>
          ))}
        </div>
        <div className="sidebar-formula">
          <div style={{ color: 'var(--accent-cyan)', fontWeight: 800, marginBottom: '4px' }}>FÓRMULA ATIVA</div>
          Prioridade = Influência + Exposição + Urgência + Bloqueio
        </div>
      </nav>

      {/* ── Mobile Top Header ── */}
      <header className="mobile-top-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Zap color="white" fill="white" size={18} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, lineHeight: 1.1 }}>DYNAMIC <span style={{ color: 'var(--accent-cyan)' }}>STAKEHOLDER</span></div>
            <div style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>SBCE · Ministério da Fazenda</div>
          </div>
        </div>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', background: 'rgba(0,242,255,0.07)', border: '1px solid rgba(0,242,255,0.15)', borderRadius: '8px', padding: '4px 10px' }}>
          {stats.total} <span style={{ color: 'var(--accent-cyan)' }}>ativos</span>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="main-content">
        <div className="global-search-container">
          <div className="global-search-wrapper">
            <Search className="global-search-icon" size={18} />
            <input
              type="text"
              className="global-search-input"
              placeholder="Pesquisar stakeholders, contatos ou temas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <AnimatePresence mode="wait">
          {currentView === 'dashboard'  && renderDashboard()}
          {currentView === 'database'   && renderDatabase()}
          {currentView === 'risks'      && renderRisks()}
          {currentView === 'themes'     && renderThemes()}
          {currentView === 'governance' && renderGovernance()}
          {currentView === 'funil'      && renderFunil()}
          {currentView === 'matrix'     && renderMatrix()}
          {currentView === 'editor'     && renderEditor()}
        </AnimatePresence>
      </main>

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="mobile-bottom-nav">
        {NAV_ITEMS.map((item) => (
          <div
            key={item.id}
            className={`mobile-nav-item ${currentView === item.id ? 'active' : ''}`}
            onClick={() => setCurrentView(item.id)}
          >
            {item.icon}
            <span>{item.shortLabel}</span>
            <div className="mobile-nav-dot" />
          </div>
        ))}
      </nav>
    </div>
  );
}

export default App;
