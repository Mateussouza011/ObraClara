/**
 * Model: Denuncia - Camada de Modelo
 */

export enum DenunciaStatusEnum {
  ABERTA = 'ABERTA',
  EM_ANALISE = 'EM_ANALISE',
  RESOLVIDA = 'RESOLVIDA',
  REJEITADA = 'REJEITADA',
}

export enum DenunciaTipoEnum {
  ATRASO = 'ATRASO',
  QUALIDADE = 'QUALIDADE',
  SEGURANCA = 'SEGURANCA',
  OUTRO = 'OUTRO',
}

export interface Denuncia {
  id: string;
  usuarioId: string;
  obraId: string;
  titulo: string;
  descricao: string;
  tipo: DenunciaTipoEnum;
  imagemUrl?: string;
  status: DenunciaStatusEnum;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO para criar denúncia
 */
export interface CriarDenunciaInput {
  obraId: string;
  titulo: string;
  descricao: string;
  tipo: DenunciaTipoEnum;
  imagemUri?: string;
}

/**
 * Helper: Obtém label em português do tipo
 */
export function obterLabelTipo(tipo: DenunciaTipoEnum): string {
  const labels: Record<DenunciaTipoEnum, string> = {
    [DenunciaTipoEnum.ATRASO]: 'Atraso na Obra',
    [DenunciaTipoEnum.QUALIDADE]: 'Problema de Qualidade',
    [DenunciaTipoEnum.SEGURANCA]: 'Problema de Segurança',
    [DenunciaTipoEnum.OUTRO]: 'Outro',
  };
  return labels[tipo] || 'Desconhecido';
}

/**
 * Helper: Obtém cor baseado no status
 */
export function obterCorDenuncia(status: DenunciaStatusEnum): string {
  const cores: Record<DenunciaStatusEnum, string> = {
    [DenunciaStatusEnum.ABERTA]: '#EF4444',
    [DenunciaStatusEnum.EM_ANALISE]: '#F59E0B',
    [DenunciaStatusEnum.RESOLVIDA]: '#10B981',
    [DenunciaStatusEnum.REJEITADA]: '#6B7280',
  };
  return cores[status] || '#6B7280';
}
