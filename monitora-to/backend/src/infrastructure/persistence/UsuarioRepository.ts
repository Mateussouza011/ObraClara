/**
 * Implementação: UsuarioRepository - Infrastructure Layer
 * Implementa o contrato do repositório Usuario usando Prisma
 * Responsável por: CRUD de usuários no banco de dados
 */

import { PrismaClient } from '@prisma/client';
import { Usuario } from '@domain/entities/Usuario';

export interface IUsuarioRepository {
  salvar(usuario: Usuario, senhaHash?: string): Promise<void>;
  buscarPorId(id: string): Promise<(Usuario & { senhaHash?: string }) | null>;
  buscarPorEmail(email: string): Promise<(Usuario & { senhaHash?: string }) | null>;
  buscarPorCPF(cpf: string): Promise<Usuario | null>;
  buscarTodos(): Promise<Usuario[]>;
  atualizar(usuario: Usuario): Promise<void>;
  deletar(id: string): Promise<void>;
}

export class UsuarioRepository implements IUsuarioRepository {
  constructor(private prisma: PrismaClient) {}

  async salvar(usuario: Usuario, senhaHash?: string): Promise<void> {
    await this.prisma.usuario.create({
      data: {
        id: usuario.id,
        email: usuario.email,
        nome: usuario.nome,
        cpf: usuario.cpf,
        telefone: usuario.telefone,
        bairro: usuario.bairro,
        senha: senhaHash || '',
        createdAt: usuario.createdAt,
        updatedAt: usuario.updatedAt,
      },
    });
  }

  async buscarPorId(id: string): Promise<(Usuario & { senhaHash?: string }) | null> {
    const usuarioRecord = await this.prisma.usuario.findUnique({
      where: { id },
    });

    if (!usuarioRecord) return null;

    return this.toDomain(usuarioRecord);
  }

  async buscarPorEmail(email: string): Promise<(Usuario & { senhaHash?: string }) | null> {
    const usuarioRecord = await this.prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuarioRecord) return null;

    return this.toDomain(usuarioRecord);
  }

  async buscarPorCPF(cpf: string): Promise<Usuario | null> {
    const usuarioRecord = await this.prisma.usuario.findUnique({
      where: { cpf },
    });

    if (!usuarioRecord) return null;

    const domain = this.toDomain(usuarioRecord);
    // Retornar sem senhaHash
    const { senhaHash, ...usuarioSemSenha } = domain;
    return usuarioSemSenha as Usuario;
  }

  async buscarTodos(): Promise<Usuario[]> {
    const usuarios = await this.prisma.usuario.findMany();
    return usuarios.map((u) => {
      const domain = this.toDomain(u);
      // Remover senhaHash do resultado
      const { senhaHash, ...usuario } = domain;
      return usuario as Usuario;
    });
  }

  async atualizar(usuario: Usuario): Promise<void> {
    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        nome: usuario.nome,
        telefone: usuario.telefone,
        bairro: usuario.bairro,
        updatedAt: usuario.updatedAt,
      },
    });
  }

  async deletar(id: string): Promise<void> {
    await this.prisma.usuario.delete({
      where: { id },
    });
  }

  /**
   * Mapper: Prisma Record → Domain Entity
   */
  private toDomain(
    usuarioRecord: any
  ): Usuario & { senhaHash?: string } {
    const usuario = new Usuario({
      id: usuarioRecord.id,
      email: usuarioRecord.email,
      nome: usuarioRecord.nome,
      cpf: usuarioRecord.cpf,
      telefone: usuarioRecord.telefone,
      bairro: usuarioRecord.bairro,
      createdAt: usuarioRecord.createdAt,
      updatedAt: usuarioRecord.updatedAt,
    });

    return Object.assign(usuario, {
      senhaHash: usuarioRecord.senha, // Incluir hash para comparação em LoginUseCase
    });
  }
}
