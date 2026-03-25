/**
 * Controller: ObraController - Infrastructure Layer
 * Gerencia requisições HTTP relacionadas a obras
 */

import { Request, Response } from 'express';
import { ListarObrasProximasUseCase } from '@application/useCases';
import { Obra, ObraStatus } from '@domain/entities';
import { ObraResponseDTO } from '@application/dtos';
import { IObraRepository } from '@domain/repositories';

export class ObraController {
  constructor(
    private listarObrasProximasUseCase: ListarObrasProximasUseCase,
    private obraRepository: IObraRepository,
  ) {}

  /**
   * GET /api/obras
   * Lista todas as obras
   */
  async listar(req: Request, res: Response): Promise<void> {
    try {
      const page = this.parsePositiveInt(req.query.page as string, 1);
      const limit = this.parsePositiveInt(req.query.limit as string, 20, 100);
      const sortBy = this.parseSortBy(req.query.sortBy as string);
      const sortDirection = this.parseSortDirection(req.query.sortDirection as string);

      const { obras, total } = await this.obraRepository.buscarAtivasPaginadas({
        page,
        limit,
        sortBy,
        sortDirection,
      });

      res.status(200).json({
        success: true,
        data: obras.map((obra) => this.mapToResponseDTO(obra)),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        sortBy,
        sortDirection,
      });
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro desconhecido';

      res.status(500).json({
        success: false,
        error: mensagem,
      });
    }
  }

  /**
   * GET /api/obras/proximas?latitude=X&longitude=Y&raio=Z
   * Lista obras próximas à localização do usuário
   */
  async listarProximas(req: Request, res: Response): Promise<void> {
    try {
      const { latitude, longitude, raio, raioKm } = req.query;

      const lat = parseFloat(latitude as string);
      const lon = parseFloat(longitude as string);
      const raioBusca = raioKm
        ? parseFloat(raioKm as string)
        : (raio ? parseFloat(raio as string) : 10);

      const resultado = await this.listarObrasProximasUseCase.execute(lat, lon, raioBusca);

      res.status(200).json({
        success: true,
        data: resultado,
        total: resultado.length,
      });
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro desconhecido';

      res.status(400).json({
        success: false,
        error: mensagem,
      });
    }
  }

  /**
   * GET /api/obras/:id
   * Busca uma obra por ID
   */
  async buscarPorId(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const obra = await this.obraRepository.buscarPorId(id);

      if (!obra || obra.status === ObraStatus.CONCLUIDA) {
        res.status(404).json({
          success: false,
          error: 'Obra não encontrada',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: this.mapToResponseDTO(obra),
      });
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro desconhecido';

      res.status(500).json({
        success: false,
        error: mensagem,
      });
    }
  }

  private mapToResponseDTO(obra: Obra): ObraResponseDTO {
    return {
      id: obra.id,
      titulo: obra.titulo,
      descricao: obra.descricao,
      tipo: obra.tipo,
      latitude: obra.geolocation.latitude,
      longitude: obra.geolocation.longitude,
      endereco: obra.endereco,
      bairro: obra.bairro,
      status: obra.status,
      percentualProgresso: obra.percentualProgresso,
      dataInicio: obra.dataInicio,
      dataFimPrevista: obra.dataFimPrevista,
      dataFimReal: obra.dataFimReal,
      orcamentoEstimado: obra.orcamentoEstimado,
      createdAt: obra.createdAt,
      updatedAt: obra.updatedAt,
    };
  }

  private parsePositiveInt(value: string | undefined, defaultValue: number, max?: number): number {
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed <= 0) return defaultValue;
    if (max && parsed > max) return max;
    return parsed;
  }

  private parseSortBy(value: string | undefined): 'updatedAt' | 'createdAt' | 'percentualProgresso' | 'titulo' {
    if (
      value === 'updatedAt'
      || value === 'createdAt'
      || value === 'percentualProgresso'
      || value === 'titulo'
    ) {
      return value;
    }

    return 'updatedAt';
  }

  private parseSortDirection(value: string | undefined): 'asc' | 'desc' {
    return value === 'asc' ? 'asc' : 'desc';
  }
}
