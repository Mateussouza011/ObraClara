/**
 * Implementação: DenunciaRepository - Infrastructure Layer
 */

import { PrismaClient } from '@prisma/client';
import { Denuncia, DenunciaStatus, DenunciaTipo } from '@domain/entities/Denuncia';
import { IDenunciaRepository } from '@domain/repositories';

export class DenunciaRepository implements IDenunciaRepository {
  constructor(private prisma: PrismaClient) {}

  async salvar(denuncia: Denuncia): Promise<void> {
    await this.prisma.denuncia.create({
      data: {
        id: denuncia.id,
        usuarioId: denuncia.usuarioId,
        obraId: denuncia.obraId,
        titulo: denuncia.titulo,
        descricao: denuncia.descricao,
        tipo: denuncia.tipo,
        imagemUrl: denuncia.imagemUrl,
        status: denuncia.status,
        createdAt: denuncia.createdAt,
        updatedAt: denuncia.updatedAt,
      },
    });
  }

  async buscarPorId(id: string): Promise<Denuncia | null> {
    const denunciaRecord = await this.prisma.denuncia.findUnique({
      where: { id },
    });

    if (!denunciaRecord) return null;

    return this.toDomain(denunciaRecord);
  }

  async buscarPorObra(obraId: string): Promise<Denuncia[]> {
    const denuncias = await this.prisma.denuncia.findMany({
      where: { obraId },
      orderBy: { createdAt: 'desc' },
    });

    return denuncias.map((d: any) => this.toDomain(d));
  }

  async buscarPorUsuario(usuarioId: string): Promise<Denuncia[]> {
    const denuncias = await this.prisma.denuncia.findMany({
      where: { usuarioId },
      orderBy: { createdAt: 'desc' },
    });

    return denuncias.map((d: any) => this.toDomain(d));
  }

  async buscarAberta(): Promise<Denuncia[]> {
    const denuncias = await this.prisma.denuncia.findMany({
      where: { status: DenunciaStatus.ABERTA },
      orderBy: { createdAt: 'asc' },
    });

    return denuncias.map((d: any) => this.toDomain(d));
  }

  async atualizar(denuncia: Denuncia): Promise<void> {
    await this.prisma.denuncia.update({
      where: { id: denuncia.id },
      data: {
        titulo: denuncia.titulo,
        descricao: denuncia.descricao,
        tipo: denuncia.tipo,
        imagemUrl: denuncia.imagemUrl,
        status: denuncia.status,
        updatedAt: new Date(),
      },
    });
  }

  async deletar(id: string): Promise<void> {
    await this.prisma.denuncia.delete({
      where: { id },
    });
  }

  private toDomain(record: any): Denuncia {
    return new Denuncia({
      id: record.id,
      usuarioId: record.usuarioId,
      obraId: record.obraId,
      titulo: record.titulo,
      descricao: record.descricao,
      tipo: record.tipo as DenunciaTipo,
      imagemUrl: record.imagemUrl,
      status: record.status as DenunciaStatus,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
