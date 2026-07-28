import { useState } from 'react';
import { Plus, Trash2, FileSpreadsheet, Calculator } from 'lucide-react';
import type { Stakeholder, EstagioFunil, PapelSBCE, PosicaoRelacionamento, StakeholderType } from './types';

interface DataEntryTableProps {
  data: Stakeholder[];
  onUpdate: (newData: Stakeholder[]) => void;
}

// ── Column definition ──────────────────────────────────────────────────────────
interface Col {
  key: keyof Stakeholder | '_score' | '_delete';
  label: string;
  title?: string;
  width: number;
  type: 'text' | 'number' | 'select' | 'textarea' | 'readonly' | 'action' | 'score';
  options?: string[];
  min?: number;
  max?: number;
}

const COLS: Col[] = [
  { key: '_delete',                    label: '',                              width: 48,  type: 'action' },
  { key: 'id',                         label: 'ID',                            width: 90,  type: 'readonly' },

  // ── IDENTIFICAÇÃO
  { key: 'name',                       label: 'Stakeholder',                   width: 240, type: 'text' },
  { key: 'tipoRegistro',               label: 'Tipo',                          width: 120, type: 'select',
    options: ['Instituição', 'Unidade', 'Pessoa'] },
  { key: 'papelSBCE',                  label: 'Papel SBCE',                    width: 130, type: 'select',
    options: ['Regulador', 'Regulado', 'Intermediário', 'Afetado', 'Legitimador', 'Outro'] },

  // ── TAXONOMIA
  { key: 'camada1',                    label: 'Camada 1',                      width: 130, type: 'text' },
  { key: 'camada2',                    label: 'Camada 2',                      width: 130, type: 'text' },
  { key: 'camada3',                    label: 'Camada 3',                      width: 130, type: 'text' },
  { key: 'camada4',                    label: 'Camada 4',                      width: 150, type: 'text' },
  { key: 'camada5',                    label: 'Camada 5',                      width: 150, type: 'text' },

  // ── CONTATOS
  { key: 'contatoPrincipal',           label: 'Contato Principal',             width: 160, type: 'text' },
  { key: 'cargo',                      label: 'Cargo',                         width: 160, type: 'text' },
  { key: 'contatoSecundario',          label: 'Contato Secundário',            width: 160, type: 'text' },
  { key: 'email',                      label: 'E-mail',                        width: 200, type: 'text' },
  { key: 'telefone',                   label: 'Telefone',                      width: 150, type: 'text' },

  // ── ATRIBUTOS DE INTELIGÊNCIA (1–5)
  { key: 'influenciaInstitucional',    label: 'Influência',   title: 'Influência Institucional (1–5)',   width: 90,  type: 'number', min: 1, max: 5 },
  { key: 'exposicaoSBCE',             label: 'Exposição',    title: 'Exposição SBCE (1–5)',              width: 90,  type: 'number', min: 1, max: 5 },
  { key: 'urgencia',                  label: 'Urgência',     title: 'Urgência (1–5)',                    width: 80,  type: 'number', min: 1, max: 5 },
  { key: 'potencialBloqueio',         label: 'Bloqueio',     title: 'Potencial de Bloqueio / Risco (1–5)', width: 90, type: 'number', min: 1, max: 5 },
  { key: 'legitimidade',              label: 'Legitimidade', title: 'Legitimidade (1–5)',                width: 100, type: 'number', min: 1, max: 5 },
  { key: 'capacidadeMobilizacao',     label: 'Mobilização',  title: 'Capacidade de Mobilização (1–5)',   width: 100, type: 'number', min: 1, max: 5 },
  { key: 'aberturaDialogo',           label: 'Abertura',     title: 'Abertura ao Diálogo (1–5)',         width: 90,  type: 'number', min: 1, max: 5 },
  { key: 'sensibilidadePolitica',     label: 'Sens. Pol.',   title: 'Sensibilidade Política (1–5)',      width: 90,  type: 'number', min: 1, max: 5 },

  // ── SCORE (fórmula calculada — somente leitura)
  { key: '_score',                     label: 'SCORE',        title: 'Influência + Exposição + Urgência + Bloqueio', width: 80, type: 'score' },

  // ── POSICIONAMENTO
  { key: 'posicaoAtual',              label: 'Posição',                        width: 150, type: 'select',
    options: ['Oposição', 'Neutro', 'Aliado Potencial', 'Aliado Ativo', 'Defensor'] },
  { key: 'jornadaEstagio',            label: 'Estágio Jornada',                width: 180, type: 'select',
    options: ['Identificado','Qualificado','Priorizado','Abordado','Engajado','Feedback registrado','Aliado potencial','Aliado ativo','Defensor do SBCE','Opositor','Cético'] },
  { key: 'estrategia',               label: 'Estratégia',                      width: 220, type: 'textarea' },
  { key: 'proximaAcao',              label: 'Próxima Ação',                    width: 200, type: 'textarea' },
  { key: 'objetivoAcao',             label: 'Objetivo da Ação',                width: 200, type: 'textarea' },

  // ── GOVERNANÇA
  { key: 'ownerInterno',             label: 'Owner Interno',                   width: 160, type: 'text' },
  { key: 'dataUltimoContato',        label: 'Último Contato',                  width: 130, type: 'text' },
  { key: 'tipoInteracaoUltimoContato', label: 'Tipo Interação',               width: 150, type: 'text' },
  { key: 'resumoUltimoContato',      label: 'Resumo do Contato',               width: 260, type: 'textarea' },
  { key: 'proximoContatoPrevisto',   label: 'Próx. Contato Previsto',          width: 150, type: 'text' },
  { key: 'frequenciaContatoRecomendada', label: 'Freq. Contato',              width: 130, type: 'text' },
  { key: 'participacaoEventos',      label: 'Participação em Eventos',         width: 200, type: 'textarea' },

  // ── TEMAS
  { key: 'temaPrincipal',            label: 'Tema Principal',                  width: 170, type: 'text' },
  { key: 'temaSBCESecundario',       label: 'Tema Secundário SBCE',            width: 180, type: 'text' },
  { key: 'janelaRegulatoria',        label: 'Janela Regulatória',              width: 130, type: 'text' },

  // ── METADADOS
  { key: 'dataAtualizacao',          label: 'Data Atualização',                width: 130, type: 'text' },
  { key: 'atualizadoPor',            label: 'Atualizado Por',                  width: 130, type: 'text' },
  { key: 'fonteInformacao',          label: 'Fonte de Informação',             width: 180, type: 'textarea' },
];

// ── Score formula (matches App.tsx) ───────────────────────────────────────────
const calcScore = (s: Stakeholder) =>
  (s.influenciaInstitucional || 0) + (s.exposicaoSBCE || 0) + (s.urgencia || 0) + (s.potencialBloqueio || 0);

// ── Empty row factory ──────────────────────────────────────────────────────────
const makeNewRow = (idx: number): Stakeholder => ({
  id: `STK-${String(idx).padStart(3, '0')}`,
  name: '',
  tipoRegistro: 'Instituição' as StakeholderType,
  papelSBCE: 'Outro' as PapelSBCE,
  camada1: '', camada2: '', camada3: '', camada4: '', camada5: '',
  contatoPrincipal: '', cargo: '',
  contatoSecundario: '', telefone: '', email: '',
  influenciaInstitucional: 3,
  exposicaoSBCE: 3,
  legitimidade: 3,
  urgencia: 3,
  capacidadeMobilizacao: 3,
  aberturaDialogo: 3,
  sensibilidadePolitica: 3,
  potencialBloqueio: 3,
  posicaoAtual: 'Neutro' as PosicaoRelacionamento,
  jornadaEstagio: 'Identificado' as EstagioFunil,
  estrategia: '',
  proximaAcao: '',
  objetivoAcao: '',
  ownerInterno: '',
  dataUltimoContato: '',
  tipoInteracaoUltimoContato: '',
  resumoUltimoContato: '',
  proximoContatoPrevisto: '',
  frequenciaContatoRecomendada: '',
  participacaoEventos: '',
  temaPrincipal: '',
  temaSBCESecundario: '',
  janelaRegulatoria: '',
  dataAtualizacao: new Date().toISOString().split('T')[0],
  atualizadoPor: 'DSMT',
  fonteInformacao: '',
});

// ── Component ──────────────────────────────────────────────────────────────────
export function DataEntryTable({ data, onUpdate }: DataEntryTableProps) {
  const [activeCell, setActiveCell] = useState<string | null>(null);

  const handleUpdate = (id: string, field: keyof Stakeholder, value: any) => {
    onUpdate(data.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const addRow = () => {
    const newRow = makeNewRow(data.length + 1);
    onUpdate([newRow, ...data]);
  };

  const removeRow = (id: string) => onUpdate(data.filter(s => s.id !== id));

  // Render a single editable cell
  const renderCell = (s: Stakeholder, col: Col) => {
    const cellId = `${s.id}-${col.key}`;
    const isActive = activeCell === cellId;

    if (col.key === '_delete') {
      return (
        <td key={col.key} className="excel-cell" style={{ textAlign: 'center', width: col.width, padding: '0 8px' }}>
          <button
            onClick={() => removeRow(s.id)}
            title="Remover linha"
            style={{ color: 'var(--danger)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
          >
            <Trash2 size={15} />
          </button>
        </td>
      );
    }

    if (col.key === '_score') {
      const score = calcScore(s);
      return (
        <td key={col.key} className="excel-cell" style={{ width: col.width, padding: '0', textAlign: 'center', background: 'rgba(0,0,0,0.3)' }}
            title="Fórmula: Influência + Exposição + Urgência + Bloqueio">
          <div style={{
            padding: '10px 8px',
            fontWeight: 900,
            fontFamily: "'Outfit', sans-serif",
            fontSize: '15px',
            color: score >= 15 ? '#EF4444' : score >= 12 ? '#F59E0B' : '#00F2FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}>
            <Calculator size={11} style={{ opacity: 0.6 }} />
            {score}<span style={{ fontSize: '9px', opacity: 0.5 }}>/20</span>
          </div>
        </td>
      );
    }

    if (col.key === 'id') {
      return (
        <td key={col.key} className="excel-cell" style={{ width: col.width, padding: '0 12px', color: 'var(--text-muted)', fontWeight: 800, fontSize: '11px', whiteSpace: 'nowrap' }}>
          {s.id}
        </td>
      );
    }

    const rawValue = s[col.key as keyof Stakeholder];
    const value = rawValue === undefined || rawValue === null ? '' : rawValue;

    if (col.type === 'select') {
      return (
        <td key={col.key} className="excel-cell" style={{ width: col.width, padding: 0 }}
            onClick={() => setActiveCell(cellId)}>
          <select
            className="excel-select"
            style={{ minWidth: col.width }}
            value={value as string}
            onChange={e => handleUpdate(s.id, col.key as keyof Stakeholder, e.target.value)}
            onFocus={() => setActiveCell(cellId)}
            onBlur={() => setActiveCell(null)}
          >
            {col.options!.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </td>
      );
    }

    if (col.type === 'number') {
      return (
        <td key={col.key} className="excel-cell" title={col.title}
            style={{ width: col.width, padding: 0, background: isActive ? 'rgba(0,242,255,0.06)' : undefined }}
            onClick={() => setActiveCell(cellId)}>
          <input
            type="number"
            min={col.min}
            max={col.max}
            className="excel-input"
            style={{ minWidth: col.width, textAlign: 'center', fontWeight: 700, fontSize: '14px', color: '#00F2FF' }}
            value={value as number}
            onChange={e => handleUpdate(s.id, col.key as keyof Stakeholder, parseInt(e.target.value) || 0)}
            onFocus={() => setActiveCell(cellId)}
            onBlur={() => setActiveCell(null)}
          />
        </td>
      );
    }

    if (col.type === 'textarea') {
      return (
        <td key={col.key} className="excel-cell"
            style={{ width: col.width, padding: 0, background: isActive ? 'rgba(0,242,255,0.06)' : undefined }}
            onClick={() => setActiveCell(cellId)}>
          <textarea
            className="excel-input"
            style={{ minWidth: col.width, minHeight: '54px', resize: 'vertical', lineHeight: 1.4, fontSize: '12px', paddingTop: '10px' }}
            value={value as string}
            onChange={e => handleUpdate(s.id, col.key as keyof Stakeholder, e.target.value)}
            onFocus={() => setActiveCell(cellId)}
            onBlur={() => setActiveCell(null)}
          />
        </td>
      );
    }

    // default: text
    return (
      <td key={col.key} className="excel-cell"
          style={{ width: col.width, padding: 0, background: isActive ? 'rgba(0,242,255,0.06)' : undefined }}
          onClick={() => setActiveCell(cellId)}>
        <input
          className="excel-input"
          style={{ minWidth: col.width }}
          value={value as string}
          onChange={e => handleUpdate(s.id, col.key as keyof Stakeholder, e.target.value)}
          onFocus={() => setActiveCell(cellId)}
          onBlur={() => setActiveCell(null)}
        />
      </td>
    );
  };

  // ── Column groups for visual header separation ───────────────────────────────
  const colGroups = [
    { label: 'Identificação',       cols: ['_delete','id','name','tipoRegistro','papelSBCE'], color: 'var(--accent-cyan)' },
    { label: 'Taxonomia',           cols: ['camada1','camada2','camada3','camada4','camada5'], color: '#8b5cf6' },
    { label: 'Contatos',            cols: ['contatoPrincipal','cargo','contatoSecundario','email','telefone'], color: '#3b82f6' },
    { label: 'Atributos (1–5)',     cols: ['influenciaInstitucional','exposicaoSBCE','urgencia','potencialBloqueio','legitimidade','capacidadeMobilizacao','aberturaDialogo','sensibilidadePolitica'], color: '#f59e0b' },
    { label: 'SCORE',               cols: ['_score'], color: '#EF4444' },
    { label: 'Posicionamento',      cols: ['posicaoAtual','jornadaEstagio','estrategia','proximaAcao','objetivoAcao'], color: '#10b981' },
    { label: 'Governança',          cols: ['ownerInterno','dataUltimoContato','tipoInteracaoUltimoContato','resumoUltimoContato','proximoContatoPrevisto','frequenciaContatoRecomendada','participacaoEventos'], color: '#06b6d4' },
    { label: 'Temas SBCE',          cols: ['temaPrincipal','temaSBCESecundario','janelaRegulatoria'], color: '#6d28d9' },
    { label: 'Metadados',           cols: ['dataAtualizacao','atualizadoPor','fonteInformacao'], color: '#64748b' },
  ];

  return (
    <div className="glass-panel" style={{ padding: 'var(--space-card)', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)', minHeight: '400px' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontFamily: "'Outfit', sans-serif" }}>
            <FileSpreadsheet color="var(--accent-cyan)" size={24} />
            Editor de Base · Excel Mode
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>
            {COLS.filter(c => c.type !== 'action' && c.key !== '_score').length} colunas · {data.length} registros · Score calculado ao vivo (Influência + Exposição + Urgência + Bloqueio)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
          <button
            onClick={addRow}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(0,242,255,0.1)', color: 'var(--accent-cyan)',
              border: '1px solid rgba(0,242,255,0.25)', borderRadius: '10px',
              padding: '10px 18px', cursor: 'pointer', fontWeight: 700, fontSize: '13px',
              transition: 'all 0.2s',
            }}
          >
            <Plus size={16} /> Adicionar Linha
          </button>
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ flex: 1, overflow: 'auto', border: '1px solid var(--border)', borderRadius: '12px', background: 'rgba(0,0,0,0.25)' }}>
        <table className="excel-table" style={{ borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 20 }}>
            {/* Group row */}
            <tr style={{ background: '#060910' }}>
              {colGroups.map(grp => {
                const span = grp.cols.length;
                return (
                  <th
                    key={grp.label}
                    colSpan={span}
                    style={{
                      padding: '6px 12px',
                      fontSize: '9px',
                      fontWeight: 900,
                      letterSpacing: '1.5px',
                      textTransform: 'uppercase',
                      color: grp.color,
                      borderBottom: `2px solid ${grp.color}44`,
                      borderRight: '1px solid rgba(255,255,255,0.05)',
                      background: `${grp.color}0d`,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {grp.label}
                  </th>
                );
              })}
            </tr>
            {/* Column labels */}
            <tr style={{ background: '#0a0d14' }}>
              {COLS.map(col => (
                <th
                  key={col.key}
                  className="excel-header"
                  title={col.title || col.label}
                  style={{ width: col.width, minWidth: col.width, position: 'sticky', top: 0 }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((s, idx) => (
              <tr
                key={s.id}
                style={{
                  background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,242,255,0.03)')}
                onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)')}
              >
                {COLS.map(col => renderCell(s, col))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
