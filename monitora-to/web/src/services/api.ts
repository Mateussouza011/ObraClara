/**
 * Serviço de API HTTP
 * Cliente Axios pré-configurado com interceptadores
 * Padrão Singleton para garantir uma única instância
 */

import axios, {
  AxiosInstance,
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { Obra, ObraResponseDTO, ObraStatusEnum, ObraEsfera } from '@models/Obra';

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_BASE_URL = rawApiUrl.endsWith('/api')
  ? rawApiUrl
  : `${rawApiUrl}/api`;

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

const TOCANTINS_DEFAULT_COORDS = { latitude: -10.184, longitude: -48.3336 };

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function isValidCoordinatePair(latitude: number | null, longitude: number | null): boolean {
  if (latitude === null || longitude === null) {
    return false;
  }

  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

function resolveObraCoordinates(dto: ObraResponseDTO): { latitude: number; longitude: number } {
  const latitude = toFiniteNumber(dto.latitude);
  const longitude = toFiniteNumber(dto.longitude);

  if (isValidCoordinatePair(latitude, longitude)) {
    return {
      latitude: latitude!,
      longitude: longitude!,
    };
  }

  return TOCANTINS_DEFAULT_COORDS;
}

function mapObraFromDTO(dto: ObraResponseDTO): Obra {
  const coords = resolveObraCoordinates(dto);

  // Determine esfera from DTO
  const esfera: ObraEsfera = (dto as any).esfera === 'Estadual'
    ? 'Estadual'
    : (dto as any).esfera === 'Municipal'
      ? 'Municipal'
      : 'Federal';

  return {
    id: dto.id,
    titulo: dto.titulo,
    descricao: dto.descricao,
    tipo: dto.tipo,
    latitude: coords.latitude,
    longitude: coords.longitude,
    endereco: dto.endereco,
    bairro: dto.bairro,
    status: dto.status as ObraStatusEnum,
    esfera,
    fonteUrl: (dto as any).fonteUrl || '',
    dataInicio: (dto as any).dataInicio ? new Date((dto as any).dataInicio) : undefined,
    dataFimPrevista: (dto as any).dataFimPrevista
      ? new Date((dto as any).dataFimPrevista)
      : undefined,
    dataFimReal: (dto as any).dataFimReal ? new Date((dto as any).dataFimReal) : undefined,
    valorInvestimento: (dto as any).valorInvestimento || undefined,
    executor: (dto as any).executor || undefined,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
  };
}

function mapAxiosError(error: AxiosError<ApiResponse<any>>): Error | AxiosError<ApiResponse<any>> {
  const apiMessage = error.response?.data?.error || error.response?.data?.message;

  if (apiMessage) {
    return new Error(apiMessage);
  }

  if (!error.response) {
    return new Error(
      `Nao foi possivel conectar a API em ${API_BASE_URL}. Verifique se o backend esta rodando e se VITE_API_URL aponta para a porta correta.`
    );
  }

  return error;
}

class APIClient {
  private client: AxiosInstance;
  private static instance: APIClient;

  private constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request Interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => config,
      (error: AxiosError) => Promise.reject(error)
    );

    // Response Interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError<ApiResponse<any>>) => Promise.reject(mapAxiosError(error))
    );
  }

  static getInstance(): APIClient {
    if (!APIClient.instance) {
      APIClient.instance = new APIClient();
    }
    return APIClient.instance;
  }

  // Obras
  async listarObras(): Promise<Obra[]> {
    const response = await this.client.get<ApiResponse<ObraResponseDTO[]>>('/obras');
    return (response.data.data || []).map(mapObraFromDTO);
  }

  async listarObrasProximas(
    latitude: number,
    longitude: number,
    raioKm: number = 10
  ): Promise<Obra[]> {
    const response = await this.client.get<ApiResponse<ObraResponseDTO[]>>(
      `/obras/proximas`,
      {
        params: { latitude, longitude, raioKm },
      }
    );
    return (response.data.data || []).map(mapObraFromDTO);
  }

  async buscarObraPorId(id: string): Promise<Obra | null> {
    try {
      const response = await this.client.get<ApiResponse<ObraResponseDTO>>(
        `/obras/${id}`
      );
      return response.data.data ? mapObraFromDTO(response.data.data) : null;
    } catch {
      return null;
    }
  }
}

export { APIClient };
