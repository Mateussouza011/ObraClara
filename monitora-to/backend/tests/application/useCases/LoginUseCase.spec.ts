/**
 * Testes: LoginUseCase - Application Layer
 * Testa a autenticação de usuários
 */

import { LoginUseCase } from '@application/useCases/LoginUseCase';
import { RegistroUseCase } from '@application/useCases/RegistroUseCase';
import { IUsuarioRepository } from '@infrastructure/persistence/UsuarioRepository';

// Mock do UsuarioRepository
class MockUsuarioRepository implements IUsuarioRepository {
  private usuarios: any[] = [];

  async salvar(usuario: any, senhaHash: string): Promise<void> {
    this.usuarios.push({ ...usuario, senhaHash });
  }

  async buscarPorId(id: string): Promise<any> {
    return this.usuarios.find((u) => u.id === id) || null;
  }

  async buscarPorEmail(email: string): Promise<any> {
    return this.usuarios.find((u) => u.email === email) || null;
  }

  async buscarPorCPF(cpf: string): Promise<any> {
    return this.usuarios.find((u) => u.cpf === cpf) || null;
  }

  async buscarTodos(): Promise<any[]> {
    return this.usuarios;
  }

  async atualizar(usuario: any): Promise<void> {
    const index = this.usuarios.findIndex((u) => u.id === usuario.id);
    if (index !== -1) {
      this.usuarios[index] = { ...this.usuarios[index], ...usuario };
    }
  }

  async deletar(id: string): Promise<void> {
    this.usuarios = this.usuarios.filter((u) => u.id !== id);
  }
}

describe('Autenticação', () => {
  let registroUseCase: RegistroUseCase;
  let loginUseCase: LoginUseCase;
  let mockRepository: MockUsuarioRepository;

  beforeEach(() => {
    mockRepository = new MockUsuarioRepository();
    registroUseCase = new RegistroUseCase(mockRepository);
    loginUseCase = new LoginUseCase(mockRepository);
  });

  describe('RegistroUseCase', () => {
    it('deve registrar um novo usuário com sucesso', async () => {
      const resultado = await registroUseCase.execute({
        email: 'mateus@example.com',
        senha: 'Senha123!',
        confirmarSenha: 'Senha123!',
        nome: 'Mateus Silva',
        cpf: '52998224725',
        telefone: '6399999999',
        bairro: 'ARSE 12',
      });

      expect(resultado.usuario.email).toBe('mateus@example.com');
      expect(resultado.usuario.nome).toBe('Mateus Silva');
      expect(resultado.message).toContain('sucesso');
    });

    it('deve falhar se email já existe', async () => {
      // Primeiro registro
      await registroUseCase.execute({
        email: 'duplicado@example.com',
        senha: 'Senha123!',
        confirmarSenha: 'Senha123!',
        nome: 'Usuario Um',
        cpf: '11144477735',
      });

      // Tentar registrar novamente com mesmo email
      await expect(
        registroUseCase.execute({
          email: 'duplicado@example.com',
          senha: 'Senha123!',
          confirmarSenha: 'Senha123!',
          nome: 'Usuario Dois',
          cpf: '12345678909',
        })
      ).rejects.toThrow('Email já cadastrado');
    });

    it('deve falhar se CPF já existe', async () => {
      // Primeiro registro
      await registroUseCase.execute({
        email: 'usuario1@example.com',
        senha: 'Senha123!',
        confirmarSenha: 'Senha123!',
        nome: 'Usuario Um',
        cpf: '52998224725',
      });

      // Tentar registrar novamente com mesmo CPF
      await expect(
        registroUseCase.execute({
          email: 'usuario2@example.com',
          senha: 'Senha123!',
          confirmarSenha: 'Senha123!',
          nome: 'Usuario Dois',
          cpf: '52998224725',
        })
      ).rejects.toThrow('CPF já cadastrado');
    });

    it('deve falhar se senhas não conferem', async () => {
      await expect(
        registroUseCase.execute({
          email: 'teste@example.com',
          senha: 'Senha123!',
          confirmarSenha: 'SenhaErrada!',
          nome: 'Teste',
          cpf: '11144477735',
        })
      ).rejects.toThrow('não conferem');
    });

    it('deve falhar se email inválido', async () => {
      await expect(
        registroUseCase.execute({
          email: 'email_invalido',
          senha: 'Senha123!',
          confirmarSenha: 'Senha123!',
          nome: 'Teste',
          cpf: '11144477735',
        })
      ).rejects.toThrow('Email inválido');
    });
  });

  describe('LoginUseCase', () => {
    beforeEach(async () => {
      // Registrar um usuário para testes
      await registroUseCase.execute({
        email: 'teste@example.com',
        senha: 'Senha123!',
        confirmarSenha: 'Senha123!',
        nome: 'Teste Usuario',
        cpf: '52998224725',
      });
    });

    it('deve fazer login com sucesso', async () => {
      const resultado = await loginUseCase.execute({
        email: 'teste@example.com',
        senha: 'Senha123!',
      });

      expect(resultado.usuario.email).toBe('teste@example.com');
      expect(resultado.token).toBeDefined();
      expect(resultado.token).toContain('Bearer');
    });

    it('deve falhar com email incorreto', async () => {
      await expect(
        loginUseCase.execute({
          email: 'errado@example.com',
          senha: 'Senha123!',
        })
      ).rejects.toThrow('Email ou senha inválidos');
    });

    it('deve falhar com senha incorreta', async () => {
      await expect(
        loginUseCase.execute({
          email: 'teste@example.com',
          senha: 'SenhaErrada!',
        })
      ).rejects.toThrow('Email ou senha inválidos');
    });

    it('deve falhar com email vazio', async () => {
      await expect(
        loginUseCase.execute({
          email: '',
          senha: 'Senha123!',
        })
      ).rejects.toThrow('Email é obrigatório');
    });
  });
});
