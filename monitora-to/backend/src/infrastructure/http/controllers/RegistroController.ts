/**
 * Controller: RegistroController - Infrastructure Layer
 * Responsável por: Receber requisições HTTP de registro
 * Dependências: RegistroUseCase
 */

import { Request, Response } from 'express';
import { RegistroUseCase, RegistroInput } from '@application/useCases/RegistroUseCase';

export class RegistroController {
  constructor(private registroUseCase: RegistroUseCase) {}

  async handle(req: Request, res: Response): Promise<void> {
    try {
      const {
        email,
        senha,
        confirmarSenha,
        nome,
        cpf,
        telefone,
        bairro,
      } = req.body as RegistroInput;

      const resultado = await this.registroUseCase.execute({
        email,
        senha,
        confirmarSenha,
        nome,
        cpf,
        telefone,
        bairro,
      });

      res.status(201).json({
        success: true,
        message: resultado.message,
        data: resultado.usuario,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao registrar usuário',
      });
    }
  }
}
