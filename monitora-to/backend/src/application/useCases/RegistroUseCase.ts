/**
 * UseCase: RegistroUseCase - Application Layer
 * Responsável por: Registrar novo usuário
 * Dependências: UsuarioRepository
 */

import * as bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import { Usuario } from '@domain/entities/Usuario';
import { IUsuarioRepository } from '@infrastructure/persistence/UsuarioRepository';

export interface RegistroInput {
  email: string;
  senha: string;
  confirmarSenha: string;
  nome: string;
  cpf: string;
  telefone?: string;
  bairro?: string;
}

export interface RegistroOutput {
  usuario: {
    id: string;
    email: string;
    nome: string;
    cpf: string;
  };
  message: string;
}

export class RegistroUseCase {
  constructor(private usuarioRepository: IUsuarioRepository) {}

  async execute(input: RegistroInput): Promise<RegistroOutput> {
    // VALIDAR ENTRADA
    this.validarEntrada(input);

    // VERIFICAR SE EMAIL JÁ EXISTE
    const usuarioComEmail = await this.usuarioRepository.buscarPorEmail(
      input.email
    );
    if (usuarioComEmail) {
      throw new Error('Email já cadastrado');
    }

    // VERIFICAR SE CPF JÁ EXISTE
    const usuarioComCPF = await this.usuarioRepository.buscarPorCPF(
      input.cpf
    );
    if (usuarioComCPF) {
      throw new Error('CPF já cadastrado');
    }

    // VALIDAR CPF (algoritmo simples)
    if (!this.validarCPF(input.cpf)) {
      throw new Error('CPF inválido');
    }

    // CRIAR ENTIDADE
    const usuario = new Usuario({
      id: uuid(),
      email: input.email.toLowerCase(),
      nome: input.nome.trim(),
      cpf: input.cpf.replace(/\D/g, ''),
      telefone: input.telefone?.trim(),
      bairro: input.bairro?.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // CRIPTOGRAFAR SENHA
    const senhaHash = await bcrypt.hash(input.senha, 10);

    // SALVAR NO BANCO
    await this.usuarioRepository.salvar(usuario, senhaHash);

    // RETORNAR
    return {
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nome: usuario.nome,
        cpf: usuario.cpf,
      },
      message: 'Usuário registrado com sucesso. Faça login para continuar.',
    };
  }

  private validarEntrada(input: RegistroInput): void {
    if (!input.email || !input.email.trim()) {
      throw new Error('Email é obrigatório');
    }

    if (!input.senha || input.senha.length < 6) {
      throw new Error('Senha é obrigatória e deve ter no mínimo 6 caracteres');
    }

    if (input.senha !== input.confirmarSenha) {
      throw new Error('As senhas não conferem');
    }

    if (!input.nome || input.nome.length < 3) {
      throw new Error('Nome é obrigatório e deve ter no mínimo 3 caracteres');
    }

    if (!input.cpf || input.cpf.length < 11) {
      throw new Error('CPF é obrigatório');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email)) {
      throw new Error('Email inválido');
    }
  }

  /**
   * Validação simples de CPF
   * Em produção, usar biblioteca validadora
   */
  private validarCPF(cpf: string): boolean {
    const cpfLimpo = cpf.replace(/\D/g, '');

    // Deve ter 11 dígitos
    if (cpfLimpo.length !== 11) {
      return false;
    }

    // Não pode ser tudo igual (111.111.111-11, etc)
    if (/^(\d)\1+$/.test(cpfLimpo)) {
      return false;
    }

    // Validar primeiro dígito verificador
    let soma = 0;
    let resto;
    for (let i = 1; i <= 9; i++) {
      soma += parseInt(cpfLimpo.substring(i - 1, i), 10) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) {
      resto = 0;
    }
    if (resto !== parseInt(cpfLimpo.substring(9, 10), 10)) {
      return false;
    }

    // Validar segundo dígito verificador
    soma = 0;
    for (let i = 1; i <= 10; i++) {
      soma += parseInt(cpfLimpo.substring(i - 1, i), 10) * (12 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) {
      resto = 0;
    }
    if (resto !== parseInt(cpfLimpo.substring(10, 11), 10)) {
      return false;
    }

    return true;
  }
}
