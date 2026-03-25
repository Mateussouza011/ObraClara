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

export enum ObraTipoEnum {
  ASFALTAMENTO = 'Asfaltamento',
  DRENAGEM = 'Drenagem',
  CONSTRUCAO = 'Construção',
  ILUMINACAO = 'Iluminação',
  SANEAMENTO = 'Saneamento',
}

export interface Obra {
  id: string;
  titulo: string;
  descricao: string;
  tipo: ObraTipoEnum;
  latitude: number;
  longitude: number;
  endereco: string;
  bairro: string;
  status: ObraStatusEnum;
  dataInicio?: Date;
  dataFimPrevista?: Date;
  dataFimReal?: Date;
  percentualProgresso: number;
  orcamentoEstimado?: number;
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

export function progressColor(progress: number): string {
  if (progress < 30) return '#EF4444';
  if (progress < 70) return '#F97316';
  return '#10B981';
}
