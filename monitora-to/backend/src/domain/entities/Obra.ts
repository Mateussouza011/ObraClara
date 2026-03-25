/**
 * Entidade Obra - Domain Layer
 * Representa uma obra de infraestrutura ou construção em Palmas
 * Lida com validações e lógica de negócio relacionada ao ciclo de vida da obra
 */

import { Geolocation } from './Geolocation';

export enum ObraStatus {
  PLANEJADA = 'PLANEJADA',
  EM_EXECUCAO = 'EM_EXECUCAO',
  PAUSADA = 'PAUSADA',
  CONCLUIDA = 'CONCLUIDA',
}

export enum ObraTipo {
  ASFALTAMENTO = 'Asfaltamento',
  DRENAGEM = 'Drenagem',
  CONSTRUCAO = 'Construção',
  ILUMINACAO = 'Iluminação',
  SANEAMENTO = 'Saneamento',
  OUTRO = 'Outro',
}

export enum BairroPalmas {
  ARSE_12 = 'ARSE 12',
  ARSE_14 = 'ARSE 14',
  CENRO_104_SUL = '104 Sul',
  AURENY_III = 'Aureny III',
  AURENY_IV = 'Aureny IV',
  TAQUARALTO = 'Taquaralto',
}

export interface IObraProps {
  id: string;
  titulo: string;
  descricao: string;
  tipo: ObraTipo;
  geolocation: Geolocation;
  endereco: string;
  bairro: BairroPalmas;
  status: ObraStatus;
  dataInicio?: Date;
  dataFimPrevista?: Date;
  dataFimReal?: Date;
  percentualProgresso: number;
  orcamentoEstimado?: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Obra implements IObraProps {
  id: string;
  titulo: string;
  descricao: string;
  tipo: ObraTipo;
  geolocation: Geolocation;
  endereco: string;
  bairro: BairroPalmas;
  status: ObraStatus;
  dataInicio?: Date;
  dataFimPrevista?: Date;
  dataFimReal?: Date;
  percentualProgresso: number;
  orcamentoEstimado?: number;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: IObraProps) {
    this.validarConstruction(props);
    
    this.id = props.id;
    this.titulo = props.titulo;
    this.descricao = props.descricao;
    this.tipo = props.tipo;
    this.geolocation = props.geolocation;
    this.endereco = props.endereco;
    this.bairro = props.bairro;
    this.status = props.status;
    this.dataInicio = props.dataInicio;
    this.dataFimPrevista = props.dataFimPrevista;
    this.dataFimReal = props.dataFimReal;
    this.percentualProgresso = props.percentualProgresso;
    this.orcamentoEstimado = props.orcamentoEstimado;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * Validações de negócio
   */
  private validarConstruction(props: IObraProps): void {
    if (!props.titulo || props.titulo.trim().length === 0) {
      throw new Error('Título da obra é obrigatório');
    }

    if (!props.descricao || props.descricao.trim().length === 0) {
      throw new Error('Descrição da obra é obrigatória');
    }

    if (props.percentualProgresso < 0 || props.percentualProgresso > 100) {
      throw new Error('Percentual de progresso deve estar entre 0 e 100');
    }

    if (props.dataFimPrevista && props.dataInicio && props.dataFimPrevista < props.dataInicio) {
      throw new Error('Data fim prevista não pode ser anterior à data de início');
    }
  }

  /**
   * Atualiza o status da obra com validações
   */
  atualizarStatus(novoStatus: ObraStatus): void {
    const transicoes: Record<ObraStatus, ObraStatus[]> = {
      [ObraStatus.PLANEJADA]: [ObraStatus.EM_EXECUCAO],
      [ObraStatus.EM_EXECUCAO]: [ObraStatus.PAUSADA, ObraStatus.CONCLUIDA],
      [ObraStatus.PAUSADA]: [ObraStatus.EM_EXECUCAO, ObraStatus.CONCLUIDA],
      [ObraStatus.CONCLUIDA]: [],
    };

    if (!transicoes[this.status].includes(novoStatus)) {
      throw new Error(
        `Transição inválida: não é possível ir de ${this.status} para ${novoStatus}`,
      );
    }

    this.status = novoStatus;
    this.updatedAt = new Date();
  }

  /**
   * Atualiza o percentual de progresso com validações
   */
  atualizarProgresso(novoPercentual: number): void {
    if (novoPercentual < 0 || novoPercentual > 100) {
      throw new Error('Percentual deve estar entre 0 e 100');
    }

    if (novoPercentual < this.percentualProgresso) {
      throw new Error('O progresso não pode diminuir');
    }

    this.percentualProgresso = novoPercentual;

    // Se atingiu 100%, ofereça para marcar como concluída
    if (novoPercentual === 100 && this.status === ObraStatus.EM_EXECUCAO) {
      this.status = ObraStatus.CONCLUIDA;
      this.dataFimReal = new Date();
    }

    this.updatedAt = new Date();
  }

  /**
   * Verifica se a obra está atrasada (data fim prevista passou)
   */
  estaAtrasada(): boolean {
    if (!this.dataFimPrevista || !this.dataInicio) return false;
    return new Date() > this.dataFimPrevista && this.status !== ObraStatus.CONCLUIDA;
  }

  /**
   * Calcula dias restantes até a data prevista
   */
  diasRestantes(): number | null {
    if (!this.dataFimPrevista) return null;
    const agora = new Date();
    const diferenca = this.dataFimPrevista.getTime() - agora.getTime();
    return Math.ceil(diferenca / (1000 * 60 * 60 * 24));
  }
}
