/**
 * Entidade Usuario - Domain Layer
 * Representa um usuário da plataforma de monitoramento
 * Responsabilidades: lógica de negócio relacionada ao usuário
 */

export interface IUsuario {
  id: string;
  email: string;
  nome: string;
  cpf: string;
  telefone?: string;
  bairro?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Usuario implements IUsuario {
  id: string;
  email: string;
  nome: string;
  cpf: string;
  telefone?: string;
  bairro?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(props: IUsuario) {
    this.id = props.id;
    this.email = props.email;
    this.nome = props.nome;
    this.cpf = props.cpf;
    this.telefone = props.telefone;
    this.bairro = props.bairro;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /**
   * Validação de CPF simples (apenas formato)
   */
  isValidCPF(): boolean {
    const cpf = this.cpf.replace(/\D/g, '');
    return cpf.length === 11 && /^\d+$/.test(cpf);
  }

  /**
   * Validação de email
   */
  isValidEmail(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.email);
  }

  /**
   * Verifica se o usuário é válido
   */
  isValid(): boolean {
    return this.isValidEmail() && this.isValidCPF() && this.nome.length > 0;
  }
}
