/**
 * Models: Obra
 * Tipos e interfaces da entidade Obra
 */

export enum ObraStatusEnum {
  PLANEJADA = 'PLANEJADA',
  EM_EXECUCAO = 'EM_EXECUCAO',
  PAUSADA = 'PAUSADA',
  CONCLUIDA = 'CONCLUIDA',
}

export type ObraEsfera = 'Federal' | 'Estadual' | 'Municipal';

export interface Obra {
  id: string;
  titulo: string;
  descricao: string;
  tipo: string;
  latitude: number;
  longitude: number;
  endereco: string;
  bairro: string;
  status: ObraStatusEnum;
  esfera: ObraEsfera;
  fonteUrl: string;
  dataInicio?: Date;
  dataFimPrevista?: Date;
  dataFimReal?: Date;
  valorInvestimento?: number;
  executor?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ObraResponseDTO {
  id: string;
  titulo: string;
  descricao: string;
  tipo: string;
  latitude: number;
  longitude: number;
  endereco: string;
  bairro: string;
  status: string;
  percentualProgresso: number;
  esfera?: string;
  fonteUrl?: string;
  valorInvestimento?: number;
  executor?: string;
  createdAt: string;
  updatedAt: string;
}

// Helper functions
export function statusColor(status: ObraStatusEnum): string {
  switch (status) {
    case ObraStatusEnum.PLANEJADA:
      return '#9CA3AF';
    case ObraStatusEnum.EM_EXECUCAO:
      return '#3B82F6';
    case ObraStatusEnum.PAUSADA:
      return '#F59E0B';
    case ObraStatusEnum.CONCLUIDA:
      return '#10B981';
    default:
      return '#6B7280';
  }
}

export function statusLabel(status: ObraStatusEnum): string {
  switch (status) {
    case ObraStatusEnum.PLANEJADA:
      return 'Planejada';
    case ObraStatusEnum.EM_EXECUCAO:
      return 'Em Execução';
    case ObraStatusEnum.PAUSADA:
      return 'Pausada';
    case ObraStatusEnum.CONCLUIDA:
      return 'Concluída';
    default:
      return status;
  }
}

export function esferaColor(esfera: ObraEsfera): string {
  switch (esfera) {
    case 'Federal':
      return '#2563EB';
    case 'Estadual':
      return '#059669';
    case 'Municipal':
      return '#D97706';
    default:
      return '#6B7280';
  }
}
