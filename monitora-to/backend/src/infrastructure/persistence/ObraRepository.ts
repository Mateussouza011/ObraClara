/**
 * Implementação: ObraRepository - Infrastructure Layer
 * Implementa o contrato do repositório Obra usando Prisma
 */

import { PrismaClient } from '@prisma/client';
import { Obra, ObraStatus, ObraTipo } from '@domain/entities/Obra';
import { Geolocation } from '@domain/entities/Geolocation';
import { IObraRepository } from '@domain/repositories';

export class ObraRepository implements IObraRepository {
  constructor(private prisma: PrismaClient) {}

  async salvar(obra: Obra): Promise<void> {
    await this.prisma.obra.create({
      data: {
        id: obra.id,
        titulo: obra.titulo,
        descricao: obra.descricao,
        tipo: obra.tipo,
        latitude: obra.geolocation.latitude,
        longitude: obra.geolocation.longitude,
        endereco: obra.endereco,
        bairro: obra.bairro,
        status: obra.status,
        dataInicio: obra.dataInicio,
        dataFimPrevista: obra.dataFimPrevista,
        dataFimReal: obra.dataFimReal,
        percentualProgresso: obra.percentualProgresso,
        orcamentoEstimado: obra.orcamentoEstimado,
        createdAt: obra.createdAt,
        updatedAt: obra.updatedAt,
      },
    });
  }

  async buscarPorId(id: string): Promise<Obra | null> {
    const obraRecord = await this.prisma.obra.findUnique({
      where: { id },
    });

    if (!obraRecord) return null;

    return this.toDomain(obraRecord);
  }

  async buscarTodas(): Promise<Obra[]> {
    const obras = await this.prisma.obra.findMany();
    return obras.map((obra: any) => this.toDomain(obra));
  }

  async buscarAtivasPaginadas(params: {
    page: number;
    limit: number;
    sortBy: 'updatedAt' | 'createdAt' | 'percentualProgresso' | 'titulo';
    sortDirection: 'asc' | 'desc';
  }): Promise<{ obras: Obra[]; total: number }> {
    const skip = (params.page - 1) * params.limit;

    const [total, obras] = await Promise.all([
      this.prisma.obra.count({
        where: { status: { not: ObraStatus.CONCLUIDA } },
      }),
      this.prisma.obra.findMany({
        where: { status: { not: ObraStatus.CONCLUIDA } },
        orderBy: {
          [params.sortBy]: params.sortDirection,
        },
        skip,
        take: params.limit,
      }),
    ]);

    return {
      obras: obras.map((obra: any) => this.toDomain(obra)),
      total,
    };
  }

  async buscarPorBairro(bairro: string): Promise<Obra[]> {
    const obras = await this.prisma.obra.findMany({
      where: { bairro },
    });
    return obras.map((obra: any) => this.toDomain(obra));
  }

  async buscarProximas(latitude: number, longitude: number, raioKm: number): Promise<Obra[]> {
    // Aproximação simples (em produção, usar query PostGIS)
    const todasObras = await this.buscarTodas();
    const userGeolocation = new Geolocation({ latitude, longitude });

    return todasObras.filter((obra) => userGeolocation.estaProxima(obra.geolocation, raioKm));
  }

  async atualizar(obra: Obra): Promise<void> {
    await this.prisma.obra.update({
      where: { id: obra.id },
      data: {
        titulo: obra.titulo,
        descricao: obra.descricao,
        tipo: obra.tipo,
        latitude: obra.geolocation.latitude,
        longitude: obra.geolocation.longitude,
        endereco: obra.endereco,
        bairro: obra.bairro,
        status: obra.status,
        dataInicio: obra.dataInicio,
        dataFimPrevista: obra.dataFimPrevista,
        dataFimReal: obra.dataFimReal,
        percentualProgresso: obra.percentualProgresso,
        orcamentoEstimado: obra.orcamentoEstimado,
        updatedAt: new Date(),
      },
    });
  }

  async deletar(id: string): Promise<void> {
    await this.prisma.obra.delete({
      where: { id },
    });
  }

  private toDomain(record: any): Obra {
    return new Obra({
      id: record.id,
      titulo: record.titulo,
      descricao: record.descricao,
      tipo: record.tipo as ObraTipo,
      geolocation: new Geolocation({
        latitude: record.latitude,
        longitude: record.longitude,
      }),
      endereco: record.endereco,
      bairro: record.bairro,
      status: record.status as ObraStatus,
      dataInicio: record.dataInicio,
      dataFimPrevista: record.dataFimPrevista,
      dataFimReal: record.dataFimReal,
      percentualProgresso: record.percentualProgresso,
      orcamentoEstimado: record.orcamentoEstimado,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
