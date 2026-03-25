/**
 * Model: Obra - Camada de Modelo
 * Define a estrutura de dados de uma obra
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
  OUTRO = 'Outro',
}

export interface Coordenada {
  latitude: number;
  longitude: number;
}

export interface Obra {
  id: string;
  titulo: string;
  descricao: string;
  tipo: ObraTipoEnum;
  localizacao: Coordenada;
  endereco: string;
  bairro: string;
  status: ObraStatusEnum;
  percentualProgresso: number;
  dataInicio?: Date;
  dataFimPrevista?: Date;
  dataFimReal?: Date;
  orcamentoEstimado?: number;
  createdAt: Date;
  updatedAt: Date;
  distancia?: number; // Distância do usuário em km
}

/**
 * Helper: Obtém cor baseado no status da obra
 */
export function obterCorStatus(status: ObraStatusEnum): string {
  const cores: Record<ObraStatusEnum, string> = {
    [ObraStatusEnum.PLANEJADA]: '#9CA3AF',
    [ObraStatusEnum.EM_EXECUCAO]: '#3B82F6',
    [ObraStatusEnum.PAUSADA]: '#F59E0B',
    [ObraStatusEnum.CONCLUIDA]: '#10B981',
  };
  return cores[status] || '#6B7280';
}

/**
 * Helper: Obtém label em português do status
 */
export function obterLabelStatus(status: ObraStatusEnum): string {
  const labels: Record<ObraStatusEnum, string> = {
    [ObraStatusEnum.PLANEJADA]: 'Planejada',
    [ObraStatusEnum.EM_EXECUCAO]: 'Em Execução',
    [ObraStatusEnum.PAUSADA]: 'Pausada',
    [ObraStatusEnum.CONCLUIDA]: 'Concluída',
  };
  return labels[status] || 'Desconhecido';
}

/**
 * Helper: Verifica se a obra está atrasada
 */
export function estaAtrasada(obra: Obra): boolean {
  if (!obra.dataFimPrevista || obra.status === ObraStatusEnum.CONCLUIDA) {
    return false;
  }
  return new Date() > new Date(obra.dataFimPrevista);
}

/**
 * Helper: Calcula dias restantes
 */
export function diasRestantes(obra: Obra): number | null {
  if (!obra.dataFimPrevista) return null;
  const agora = new Date();
  const diferenca = new Date(obra.dataFimPrevista).getTime() - agora.getTime();
  return Math.ceil(diferenca / (1000 * 60 * 60 * 24));
}
