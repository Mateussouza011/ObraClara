/**
 * Interfaces de Repositórios - Domain Layer
 * Define os contratos que a infraestrutura deve implementar
 */

import { Obra, Usuario, Denuncia } from '@domain/entities';

export interface IObraRepository {
  salvar(obra: Obra): Promise<void>;
  buscarPorId(id: string): Promise<Obra | null>;
  buscarTodas(): Promise<Obra[]>;
  buscarAtivasPaginadas(params: {
    page: number;
    limit: number;
    sortBy: 'updatedAt' | 'createdAt' | 'percentualProgresso' | 'titulo';
    sortDirection: 'asc' | 'desc';
  }): Promise<{ obras: Obra[]; total: number }>;
  buscarPorBairro(bairro: string): Promise<Obra[]>;
  buscarProximas(latitude: number, longitude: number, raioKm: number): Promise<Obra[]>;
  atualizar(obra: Obra): Promise<void>;
  deletar(id: string): Promise<void>;
}

export interface IUsuarioRepository {
  salvar(usuario: Usuario, senhaHash?: string): Promise<void>;
  buscarPorId(id: string): Promise<Usuario | null>;
  buscarPorEmail(email: string): Promise<Usuario | null>;
  buscarPorCPF(cpf: string): Promise<Usuario | null>;
  atualizar(usuario: Usuario): Promise<void>;
  deletar(id: string): Promise<void>;
}

export interface IDenunciaRepository {
  salvar(denuncia: Denuncia): Promise<void>;
  buscarPorId(id: string): Promise<Denuncia | null>;
  buscarPorObra(obraId: string): Promise<Denuncia[]>;
  buscarPorUsuario(usuarioId: string): Promise<Denuncia[]>;
  buscarAberta(): Promise<Denuncia[]>;
  atualizar(denuncia: Denuncia): Promise<void>;
  deletar(id: string): Promise<void>;
}
