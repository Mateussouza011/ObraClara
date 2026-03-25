/**
 * Models: Denuncia
 * Tipos e interfaces da entidade Denuncia
 */

export enum DenunciaStatusEnum {
  ABERTA = 'ABERTA',
  EM_ANALISE = 'EM_ANALISE',
  RESOLVIDA = 'RESOLVIDA',
  REJEITADA = 'REJEITADA',
}

export enum DenunciaTipoEnum {
  ATRASO = 'Atraso',
  QUALIDADE = 'Qualidade',
  SEGURANCA = 'Segurança',
  OUTRO = 'Outro',
}

export interface Denuncia {
  id: string;
  titulo: string;
  descricao: string;
  tipo: DenunciaTipoEnum;
  status: DenunciaStatusEnum;
  obraId: string;
  usuarioId: string;
  imagemUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CriarDenunciaDTO {
  titulo: string;
  descricao: string;
  tipo: DenunciaTipoEnum;
  obraId: string;
  usuarioId: string;
  imagem?: File;
}

// Helper functions
export function statusColor(status: DenunciaStatusEnum): string {
  switch (status) {
    case DenunciaStatusEnum.ABERTA:
      return '#DC2626';
    case DenunciaStatusEnum.EM_ANALISE:
      return '#F59E0B';
    case DenunciaStatusEnum.RESOLVIDA:
      return '#10B981';
    case DenunciaStatusEnum.REJEITADA:
      return '#6B7280';
    default:
      return '#6B7280';
  }
}

export function statusLabel(status: DenunciaStatusEnum): string {
  switch (status) {
    case DenunciaStatusEnum.ABERTA:
      return 'Aberta';
    case DenunciaStatusEnum.EM_ANALISE:
      return 'Em Análise';
    case DenunciaStatusEnum.RESOLVIDA:
      return 'Resolvida';
    case DenunciaStatusEnum.REJEITADA:
      return 'Rejeitada';
    default:
      return status;
  }
}
