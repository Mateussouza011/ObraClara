/**
 * Controller: DenunciaController - Infrastructure Layer
 * Camada HTTP que orquestra requisições e respostas
 * Não deve conter lógica de negócio
 */

import { Request, Response } from 'express';
import { CriarDenunciaUseCase } from '@application/useCases/CriarDenunciaUseCase';
import { CriarDenunciaDTO } from '@application/dtos';

export class DenunciaController {
  constructor(private criarDenunciaUseCase: CriarDenunciaUseCase) {}

  /**
   * POST /api/denuncias
   * Cria uma nova denúncia
   */
  async criar(req: Request, res: Response): Promise<void> {
    try {
      const { usuarioId, obraId, titulo, descricao, tipo, imagemUrl } = req.body;

      const input: CriarDenunciaDTO = {
        usuarioId,
        obraId,
        titulo,
        descricao,
        tipo,
        imagemUrl,
      };

      const resultado = await this.criarDenunciaUseCase.execute(input);

      res.status(201).json({
        success: true,
        data: resultado,
        message: 'Denúncia criada com sucesso',
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
   * GET /api/denuncias/:id
   * Busca uma denúncia por ID
   */
  async buscarPorId(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // TODO: Implementar lógica de busca (UseCase)

      res.status(200).json({
        success: true,
        message: 'Funcionalidade ainda não implementada',
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
   * PATCH /api/denuncias/:id/status
   * Atualiza o status de uma denúncia
   */
  async atualizarStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { novoStatus } = req.body;

      // TODO: Implementar lógica de atualização (UseCase)

      res.status(200).json({
        success: true,
        message: 'Status atualizado com sucesso',
      });
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro desconhecido';

      res.status(400).json({
        success: false,
        error: mensagem,
      });
    }
  }
}
