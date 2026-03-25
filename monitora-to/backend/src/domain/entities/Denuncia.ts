/**
 * Entidade Denuncia - Domain Layer
 * Representa uma denúncia ou sugestão sobre uma obra
 */

export enum DenunciaStatus {
  ABERTA = 'ABERTA',
  EM_ANALISE = 'EM_ANALISE',
  RESOLVIDA = 'RESOLVIDA',
  REJEITADA = 'REJEITADA',
}

export enum DenunciaTipo {
  ATRASO = 'ATRASO',
  QUALIDADE = 'QUALIDADE',
  SEGURANCA = 'SEGURANCA',
  OUTRO = 'OUTRO',
}

export interface IDenunciaProps {
  id: string;
  usuarioId: string;
  obraId: string;
  titulo: string;
  descricao: string;
  tipo: DenunciaTipo;
  imagemUrl?: string;
  status: DenunciaStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class Denuncia implements IDenunciaProps {
  id: string;
  usuarioId: string;
  obraId: string;
  titulo: string;
  descricao: string;
  tipo: DenunciaTipo;
  imagemUrl?: string;
  status: DenunciaStatus;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: IDenunciaProps) {
    this.validarConstruction(props);

    this.id = props.id;
    this.usuarioId = props.usuarioId;
    this.obraId = props.obraId;
    this.titulo = props.titulo;
    this.descricao = props.descricao;
    this.tipo = props.tipo;
    this.imagemUrl = props.imagemUrl;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  private validarConstruction(props: IDenunciaProps): void {
    if (!props.titulo || props.titulo.trim().length === 0) {
      throw new Error('Título da denúncia é obrigatório');
    }

    if (!props.descricao || props.descricao.trim().length < 10) {
      throw new Error('Descrição deve ter pelo menos 10 caracteres');
    }

    if (props.descricao.length > 2000) {
      throw new Error('Descrição não pode exceder 2000 caracteres');
    }
  }

  /**
   * Muda o status da denúncia
   */
  mudarStatus(novoStatus: DenunciaStatus): void {
    const transicoes: Record<DenunciaStatus, DenunciaStatus[]> = {
      [DenunciaStatus.ABERTA]: [DenunciaStatus.EM_ANALISE, DenunciaStatus.REJEITADA],
      [DenunciaStatus.EM_ANALISE]: [DenunciaStatus.RESOLVIDA, DenunciaStatus.REJEITADA],
      [DenunciaStatus.RESOLVIDA]: [],
      [DenunciaStatus.REJEITADA]: [DenunciaStatus.ABERTA],
    };

    if (!transicoes[this.status].includes(novoStatus)) {
      throw new Error(`Não é possível mudar de ${this.status} para ${novoStatus}`);
    }

    this.status = novoStatus;
    this.updatedAt = new Date();
  }

  /**
   * Anexa uma imagem à denúncia
   */
  anexarImagem(imagemUrl: string): void {
    if (!imagemUrl || imagemUrl.trim().length === 0) {
      throw new Error('URL da imagem é inválida');
    }
    this.imagemUrl = imagemUrl;
    this.updatedAt = new Date();
  }

  /**
   * Valida o tipo de denúncia
   */
  static isTipoValido(tipo: string): boolean {
    return Object.values(DenunciaTipo).includes(tipo as DenunciaTipo);
  }
}
