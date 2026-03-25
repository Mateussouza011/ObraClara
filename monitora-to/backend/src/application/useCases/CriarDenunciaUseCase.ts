/**
 * UseCase: CriarDenuncia - Application Layer
 * Implementa a orquestração de negócio para criar uma denúncia
 * Segue o padrão Clean Code e SOLID
 */

import { Denuncia, DenunciaTipo, DenunciaStatus } from '@domain/entities/Denuncia';
import { IDenunciaRepository, IUsuarioRepository, IObraRepository } from '@domain/repositories';
import { CriarDenunciaDTO, DenunciaResponseDTO } from '@application/dtos';
import { v4 as uuidv4 } from 'uuid';

export class CriarDenunciaUseCase {
  constructor(
    private denunciaRepository: IDenunciaRepository,
    private usuarioRepository: IUsuarioRepository,
    private obraRepository: IObraRepository,
  ) {}

  /**
   * Executa a criação de uma denúncia
   * @throws {Error} Se validações falharem
   */
  async execute(input: CriarDenunciaDTO): Promise<DenunciaResponseDTO> {
    // Validar entrada
    this.validarEntrada(input);

    // Validar se usuário existe
    const usuario = await this.usuarioRepository.buscarPorId(input.usuarioId);
    if (!usuario) {
      throw new Error('Usuário não encontrado');
    }

    // Validar se obra existe
    const obra = await this.obraRepository.buscarPorId(input.obraId);
    if (!obra) {
      throw new Error('Obra não encontrada');
    }

    // Validar tipo de denúncia
    if (!Denuncia.isTipoValido(input.tipo)) {
      throw new Error(`Tipo de denúncia inválido: ${input.tipo}`);
    }

    // Criar entidade de domínio
    const denuncia = new Denuncia({
      id: uuidv4(),
      usuarioId: input.usuarioId,
      obraId: input.obraId,
      titulo: input.titulo,
      descricao: input.descricao,
      tipo: input.tipo as DenunciaTipo,
      imagemUrl: input.imagemUrl,
      status: DenunciaStatus.ABERTA,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Persistir
    await this.denunciaRepository.salvar(denuncia);

    // Mapear para DTO de resposta
    return this.mapToResponseDTO(denuncia);
  }

  /**
   * Validações de entrada
   */
  private validarEntrada(input: CriarDenunciaDTO): void {
    if (!input.usuarioId || input.usuarioId.trim().length === 0) {
      throw new Error('ID do usuário é obrigatório');
    }

    if (!input.obraId || input.obraId.trim().length === 0) {
      throw new Error('ID da obra é obrigatório');
    }

    if (!input.titulo || input.titulo.trim().length === 0) {
      throw new Error('Título da denúncia é obrigatório');
    }

    if (!input.descricao || input.descricao.trim().length < 10) {
      throw new Error('Descrição deve ter no mínimo 10 caracteres');
    }

    if (!input.tipo || input.tipo.trim().length === 0) {
      throw new Error('Tipo de denúncia é obrigatório');
    }
  }

  /**
   * Mapeia entidade para DTO de resposta
   */
  private mapToResponseDTO(denuncia: Denuncia): DenunciaResponseDTO {
    return {
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
    };
  }
}
