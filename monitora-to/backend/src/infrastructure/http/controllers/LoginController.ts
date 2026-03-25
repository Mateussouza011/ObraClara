/**
 * Controller: LoginController - Infrastructure Layer
 * Responsável por: Receber requisições HTTP de login
 * Dependências: LoginUseCase
 */

import { Request, Response } from 'express';
import { LoginUseCase, LoginInput } from '@application/useCases/LoginUseCase';

export class LoginController {
  constructor(private loginUseCase: LoginUseCase) {}

  async handle(req: Request, res: Response): Promise<void> {
    try {
      const { email, senha } = req.body as LoginInput;

      const resultado = await this.loginUseCase.execute({
        email,
        senha,
      });

      res.status(200).json({
        success: true,
        message: 'Login realizado com sucesso',
        data: resultado,
      });
    } catch (error: any) {
      const statusCode =
        error.message.includes('Email ou senha inválidos') ? 401 : 400;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Erro ao fazer login',
      });
    }
  }
}
