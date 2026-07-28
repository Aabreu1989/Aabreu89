export type EstagioFunil = 
  | 'Identificado' 
  | 'Qualificado' 
  | 'Priorizado' 
  | 'Abordado' 
  | 'Engajado' 
  | 'Feedback registrado' 
  | 'Aliado potencial' 
  | 'Aliado ativo' 
  | 'Defensor do SBCE'
  | 'Opositor'
  | 'Cético';

export type StakeholderType = 'Instituição' | 'Unidade' | 'Pessoa';
export type PosicaoRelacionamento = 'Oposição' | 'Neutro' | 'Aliado Potencial' | 'Aliado Ativo' | 'Defensor';
export type PapelSBCE = 'Regulado' | 'Regulador' | 'Intermediário' | 'Afetado' | 'Legitimador' | 'Outro';

export interface Stakeholder {
  id: string;
  name: string;
  tipoRegistro: StakeholderType;
  papelSBCE: PapelSBCE;
  
  // Taxonomia Institucional
  camada1: string;
  camada2: string;
  camada3: string;
  camada4: string;
  camada5: string;
  
  // Contatos
  contatoPrincipal: string;
  cargo: string;
  contatoSecundario?: string;
  telefone?: string;
  email?: string;
  
  // Inteligência de Atributos (ESCALA 1-5 conforme imagem oficial)
  influenciaInstitucional: number; // Poder (?)
  exposicaoSBCE: number; 
  legitimidade: number; 
  urgencia: number; 
  capacidadeMobilizacao: number; 
  aberturaDialogo: number; 
  sensibilidadePolitica: number; 
  potencialBloqueio: number; // Risco
  
  // Posicionamento e Estratégia
  posicaoAtual: PosicaoRelacionamento;
  jornadaEstagio: EstagioFunil;
  estrategia: string;
  proximaAcao: string;
  objetivoAcao: string;
  
  // Governança Interna
  ownerInterno: string;
  dataUltimoContato?: string;
  tipoInteracaoUltimoContato?: string;
  resumoUltimoContato?: string;
  proximoContatoPrevisto?: string;
  frequenciaContatoRecomendada?: string;
  participacaoEventos?: string; // string ou array de strings com Evento/Data
  
  // Temas SBCE
  temaPrincipal: string;
  temaSBCESecundario?: string;
  janelaRegulatoria?: string;
  
  // Metadados da Base
  dataAtualizacao?: string;
  atualizadoPor?: string;
  fonteInformacao?: string;
  
  // Campo Calculado no Sistema
  prioridadeScore?: number;
}

export const NEXUS_VERSION = "4.0.0-FINAL";
