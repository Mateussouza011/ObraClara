/**
 * Teste Unitário: CriarDenunciaUseCase
 * Testa a lógica de negócio do caso de uso CriarDenuncia
 */

import { CriarDenunciaUseCase } from '@application/useCases/CriarDenunciaUseCase';
import { IDenunciaRepository, IUsuarioRepository, IObraRepository } from '@domain/repositories';
import { Usuario } from '@domain/entities/Usuario';
import { Obra, ObraStatus, ObraTipo, BairroPalmas } from '@domain/entities/Obra';
import { Geolocation } from '@domain/entities/Geolocation';
import { CriarDenunciaDTO } from '@application/dtos';

// Mock implementations
class MockDenunciaRepository implements IDenunciaRepository {
  async salvar(): Promise<void> {}
  async buscarPorId() {
    return null;
  }
  async buscarPorObra() {
    return [];
  }
  async buscarPorUsuario() {
    return [];
  }
  async buscarAberta() {
    return [];
  }
  async atualizar(): Promise<void> {}
  async deletar(): Promise<void> {}
}

class MockUsuarioRepository implements IUsuarioRepository {
  private usuarios: Map<string, Usuario> = new Map();

  constructor() {
    const usuario = new Usuario({
      id: 'user-1',
      email: 'morador@palmas.com.br',
      nome: 'João Silva',
      cpf: '12345678900',
      telefone: '6399999999',
      bairro: 'ARSE 12',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.usuarios.set('user-1', usuario);
  }

  async salvar(usuario: Usuario): Promise<void> {
    this.usuarios.set(usuario.id, usuario);
  }

  async buscarPorId(id: string) {
    return this.usuarios.get(id) || null;
  }

  async buscarPorEmail() {
    return null;
  }

  async buscarPorCPF() {
    return null;
  }

  async atualizar(): Promise<void> {}
  async deletar(): Promise<void> {}
}

class MockObraRepository implements IObraRepository {
  private obras: Map<string, Obra> = new Map();

  constructor() {
    const obra = new Obra({
      id: 'obra-1',
      titulo: 'Asfaltamento na ARSE 14',
      descricao: 'Recuperação de pavimentação',
      tipo: ObraTipo.ASFALTAMENTO,
      geolocation: new Geolocation({
        latitude: -10.21759,
        longitude: -48.30251,
      }),
      endereco: 'ARSE 14, Palmas - TO',
      bairro: BairroPalmas.ARSE_14,
      status: ObraStatus.EM_EXECUCAO,
      percentualProgresso: 45,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.obras.set('obra-1', obra);
  }

  async salvar(obra: Obra): Promise<void> {
    this.obras.set(obra.id, obra);
  }

  async buscarPorId(id: string) {
    return this.obras.get(id) || null;
  }

  async buscarTodas() {
    return Array.from(this.obras.values());
  }

  async buscarAtivasPaginadas() {
    const obras = Array.from(this.obras.values()).filter((obra) => obra.status !== ObraStatus.CONCLUIDA);
    return { obras, total: obras.length };
  }

  async buscarPorBairro() {
    return [];
  }

  async buscarProximas() {
    return [];
  }

  async atualizar(): Promise<void> {}
  async deletar(): Promise<void> {}
}

// Testes
describe('CriarDenunciaUseCase', () => {
  let useCase: CriarDenunciaUseCase;
  let denunciaRepository: MockDenunciaRepository;
  let usuarioRepository: MockUsuarioRepository;
  let obraRepository: MockObraRepository;

  beforeEach(() => {
    denunciaRepository = new MockDenunciaRepository();
    usuarioRepository = new MockUsuarioRepository();
    obraRepository = new MockObraRepository();

    useCase = new CriarDenunciaUseCase(denunciaRepository, usuarioRepository, obraRepository);
  });

  describe('execute', () => {
    it('deve criar uma denúncia com dados válidos', async () => {
      const input: CriarDenunciaDTO = {
        usuarioId: 'user-1',
        obraId: 'obra-1',
        titulo: 'Obra atrasada',
        descricao: 'A obra deveria ter terminado há uma semana',
        tipo: 'ATRASO',
      };

      const resultado = await useCase.execute(input);

      expect(resultado).toBeDefined();
      expect(resultado.titulo).toBe('Obra atrasada');
      expect(resultado.tipo).toBe('ATRASO');
      expect(resultado.status).toBe('ABERTA');
      expect(resultado.usuarioId).toBe('user-1');
      expect(resultado.obraId).toBe('obra-1');
    });

    it('deve lançar erro quando usuário não existe', async () => {
      const input: CriarDenunciaDTO = {
        usuarioId: 'user-inexistente',
        obraId: 'obra-1',
        titulo: 'Obra atrasada',
        descricao: 'A obra deveria ter terminado há uma semana',
        tipo: 'ATRASO',
      };

      await expect(useCase.execute(input)).rejects.toThrow('Usuário não encontrado');
    });

    it('deve lançar erro quando obra não existe', async () => {
      const input: CriarDenunciaDTO = {
        usuarioId: 'user-1',
        obraId: 'obra-inexistente',
        titulo: 'Obra atrasada',
        descricao: 'A obra deveria ter terminado há uma semana',
        tipo: 'ATRASO',
      };

      await expect(useCase.execute(input)).rejects.toThrow('Obra não encontrada');
    });

    it('deve lançar erro quando título está vazio', async () => {
      const input: CriarDenunciaDTO = {
        usuarioId: 'user-1',
        obraId: 'obra-1',
        titulo: '',
        descricao: 'A obra deveria ter terminado há uma semana',
        tipo: 'ATRASO',
      };

      await expect(useCase.execute(input)).rejects.toThrow(
        'Título da denúncia é obrigatório',
      );
    });

    it('deve lançar erro quando descrição é muito curta', async () => {
      const input: CriarDenunciaDTO = {
        usuarioId: 'user-1',
        obraId: 'obra-1',
        titulo: 'Obra atrasada',
        descricao: 'Curta',
        tipo: 'ATRASO',
      };

      await expect(useCase.execute(input)).rejects.toThrow(
        'Descrição deve ter no mínimo 10 caracteres',
      );
    });

    it('deve lançar erro quando tipo é inválido', async () => {
      const input: CriarDenunciaDTO = {
        usuarioId: 'user-1',
        obraId: 'obra-1',
        titulo: 'Obra atrasada',
        descricao: 'A obra deveria ter terminado há uma semana',
        tipo: 'TIPO_INVALIDO',
      };

      await expect(useCase.execute(input)).rejects.toThrow('Tipo de denúncia inválido');
    });

    it('deve anexar imagem quando fornecida', async () => {
      const input: CriarDenunciaDTO = {
        usuarioId: 'user-1',
        obraId: 'obra-1',
        titulo: 'Obra atrasada',
        descricao: 'A obra deveria ter terminado há uma semana',
        tipo: 'ATRASO',
        imagemUrl: 'https://exemplo.com/imagem.jpg',
      };

      const resultado = await useCase.execute(input);

      expect(resultado.imagemUrl).toBe('https://exemplo.com/imagem.jpg');
    });
  });
});
