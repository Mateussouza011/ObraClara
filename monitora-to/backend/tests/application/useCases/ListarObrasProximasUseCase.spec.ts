import { ListarObrasProximasUseCase } from '@application/useCases/ListarObrasProximasUseCase';
import { IObraRepository } from '@domain/repositories';
import { BairroPalmas, Obra, ObraStatus, ObraTipo } from '@domain/entities/Obra';
import { Geolocation } from '@domain/entities/Geolocation';

class MockObraRepository implements IObraRepository {
  constructor(private obras: Obra[]) {}

  async salvar(): Promise<void> {}

  async buscarPorId(id: string): Promise<Obra | null> {
    return this.obras.find((obra) => obra.id === id) || null;
  }

  async buscarTodas(): Promise<Obra[]> {
    return this.obras;
  }

  async buscarAtivasPaginadas(): Promise<{ obras: Obra[]; total: number }> {
    const ativas = this.obras.filter((obra) => obra.status !== ObraStatus.CONCLUIDA);
    return { obras: ativas, total: ativas.length };
  }

  async buscarPorBairro(): Promise<Obra[]> {
    return [];
  }

  async buscarProximas(): Promise<Obra[]> {
    return this.obras;
  }

  async atualizar(): Promise<void> {}

  async deletar(): Promise<void> {}
}

function criarObra(id: string, status: ObraStatus): Obra {
  return new Obra({
    id,
    titulo: `Obra ${id}`,
    descricao: 'Execucao de infraestrutura urbana em Palmas',
    tipo: ObraTipo.CONSTRUCAO,
    geolocation: new Geolocation({ latitude: -10.2, longitude: -48.3 }),
    endereco: 'Avenida Teotonio Segurado',
    bairro: BairroPalmas.TAQUARALTO,
    status,
    percentualProgresso: status === ObraStatus.CONCLUIDA ? 100 : 45,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('ListarObrasProximasUseCase', () => {
  it('deve excluir obras concluidas do resultado', async () => {
    const obraAtiva = criarObra('obra-ativa', ObraStatus.EM_EXECUCAO);
    const obraConcluida = criarObra('obra-concluida', ObraStatus.CONCLUIDA);

    const repository = new MockObraRepository([obraAtiva, obraConcluida]);
    const useCase = new ListarObrasProximasUseCase(repository);

    const resultado = await useCase.execute(-10.2, -48.3, 10);

    expect(resultado).toHaveLength(1);
    expect(resultado[0].id).toBe('obra-ativa');
  });

  it('deve validar raio de busca', async () => {
    const repository = new MockObraRepository([]);
    const useCase = new ListarObrasProximasUseCase(repository);

    await expect(useCase.execute(-10.2, -48.3, 0)).rejects.toThrow(
      'Raio deve estar entre 0 e 100 km',
    );
  });
});
