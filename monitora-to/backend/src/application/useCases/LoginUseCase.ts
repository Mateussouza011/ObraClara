/**
 * UseCase: LoginUseCase - Application Layer
 * Responsável por: Autenticar usuário e gerar token JWT
 * Dependências: UsuarioRepository
 */

import * as bcrypt from 'bcrypt';
import { Usuario } from '@domain/entities/Usuario';
import { IUsuarioRepository } from '@infrastructure/persistence/UsuarioRepository';

export interface LoginInput {
  email: string;
  senha: string;
}

export interface LoginOutput {
  usuario: {
    id: string;
    email: string;
    nome: string;
    cpf: string;
    bairro?: string;
  };
  token: string;
}

export class LoginUseCase {
  constructor(private usuarioRepository: IUsuarioRepository) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    // VALIDAR ENTRADA
    this.validarEntrada(input);

    // BUSCAR USUÁRIO
    const usuarioEncontrado = await this.usuarioRepository.buscarPorEmail(
      input.email
    );

    if (!usuarioEncontrado) {
      throw new Error('Email ou senha inválidos');
    }

    // COMPARAR SENHA
    const senhaValida = await bcrypt.compare(
      input.senha,
      usuarioEncontrado.senhaHash || ''
    );

    if (!senhaValida) {
      throw new Error('Email ou senha inválidos');
    }

    // GERAR TOKEN JWT
    const token = this.gerarToken(usuarioEncontrado);

    // RETORNAR RESPOSTA
    return {
      usuario: {
        id: usuarioEncontrado.id,
        email: usuarioEncontrado.email,
        nome: usuarioEncontrado.nome,
        cpf: usuarioEncontrado.cpf,
        bairro: usuarioEncontrado.bairro,
      },
      token,
    };
  }

  private validarEntrada(input: LoginInput): void {
    if (!input.email || !input.email.trim()) {
      throw new Error('Email é obrigatório');
    }

    if (!input.senha || input.senha.length < 6) {
      throw new Error('Senha é obrigatória e deve ter no mínimo 6 caracteres');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email)) {
      throw new Error('Email inválido');
    }
  }

  /**
   * Gera um token JWT simples
   * NOTA: Em produção, usar jwt library (jsonwebtoken)
   * Este é um exemplo simplificado
   */
  private gerarToken(usuario: any): string {
    // PLACEHOLDER: Implementar JWT real
    // const token = jwt.sign(
    //   { id: usuario.id, email: usuario.email },
    //   process.env.JWT_SECRET!,
    //   { expiresIn: '24h' }
    // );
    // return token;

    // Para agora, retornar um token simulado
    const payload = Buffer.from(
      JSON.stringify({
        id: usuario.id,
        email: usuario.email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 horas
      })
    ).toString('base64');

    return `Bearer ${payload}`;
  }
}
