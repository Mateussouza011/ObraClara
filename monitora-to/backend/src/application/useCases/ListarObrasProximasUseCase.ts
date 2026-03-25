/**
 * UseCase: ListarObrasProximas - Application Layer
 * Busca obras próximas à localização do usuário
 */

import { Obra, ObraStatus } from '@domain/entities/Obra';
import { Geolocation } from '@domain/entities/Geolocation';
import { IObraRepository } from '@domain/repositories';
import { ObraResponseDTO } from '@application/dtos';

export class ListarObrasProximasUseCase {
  constructor(private obraRepository: IObraRepository) {}

  async execute(
    latitude: number,
    longitude: number,
    raioKm: number = 10,
  ): Promise<ObraResponseDTO[]> {
    this.validarCoordenadas(latitude, longitude);

    if (raioKm <= 0 || raioKm > 100) {
      throw new Error('Raio deve estar entre 0 e 100 km');
    }

    const obras = await this.obraRepository.buscarProximas(latitude, longitude, raioKm);
    const obrasNaoConcluidas = obras.filter((obra) => obra.status !== ObraStatus.CONCLUIDA);

    return obrasNaoConcluidas.map((obra) => this.mapToResponseDTO(obra));
  }

  private validarCoordenadas(latitude: number, longitude: number): void {
    if (latitude < -90 || latitude > 90) {
      throw new Error('Latitude inválida');
    }
    if (longitude < -180 || longitude > 180) {
      throw new Error('Longitude inválida');
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
}
