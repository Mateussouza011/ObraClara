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
import { Obra, ObraResponseDTO, ObraStatusEnum, ObraTipoEnum } from '@models/Obra';
import { Denuncia, CriarDenunciaDTO } from '@models/Denuncia';

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

const TOCANTINS_COORDS_BY_NAME: Record<string, { latitude: number; longitude: number }> = {
  palmas: { latitude: -10.184, longitude: -48.3336 },
  araguaina: { latitude: -7.1926, longitude: -48.2044 },
  gurupi: { latitude: -11.7279, longitude: -49.068 },
  'porto nacional': { latitude: -10.7081, longitude: -48.4172 },
  'paraiso do tocantins': { latitude: -10.1753, longitude: -48.8822 },
  'colinas do tocantins': { latitude: -8.0576, longitude: -48.4757 },
  'guarai': { latitude: -8.8354, longitude: -48.5114 },
  dianopolis: { latitude: -11.6237, longitude: -46.8198 },
  araguatins: { latitude: -5.6466, longitude: -48.1238 },
  tocantinopolis: { latitude: -6.3258, longitude: -47.4198 },
  '104 sul': { latitude: -10.204, longitude: -48.325 },
  'arse 12': { latitude: -10.198, longitude: -48.319 },
  'arse 14': { latitude: -10.205, longitude: -48.318 },
  'aureny iii': { latitude: -10.304, longitude: -48.302 },
  'aureny iv': { latitude: -10.312, longitude: -48.295 },
  taquaralto: { latitude: -10.295, longitude: -48.333 },
};

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

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

function inferCoordsFromText(chunks: Array<string | undefined>): { latitude: number; longitude: number } {
  const text = normalizeText(chunks.filter(Boolean).join(' '));

  for (const [name, coords] of Object.entries(TOCANTINS_COORDS_BY_NAME)) {
    if (text.includes(name)) {
      return coords;
    }
  }

  return TOCANTINS_DEFAULT_COORDS;
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

  return inferCoordsFromText([dto.bairro, dto.endereco, dto.titulo, dto.descricao]);
}

function mapObraFromDTO(dto: ObraResponseDTO): Obra {
  const coords = resolveObraCoordinates(dto);

  return {
    id: dto.id,
    titulo: dto.titulo,
    descricao: dto.descricao,
    tipo: dto.tipo as ObraTipoEnum,
    latitude: coords.latitude,
    longitude: coords.longitude,
    endereco: dto.endereco,
    bairro: dto.bairro,
    status: dto.status as ObraStatusEnum,
    dataInicio: (dto as any).dataInicio ? new Date((dto as any).dataInicio) : undefined,
    dataFimPrevista: (dto as any).dataFimPrevista
      ? new Date((dto as any).dataFimPrevista)
      : undefined,
    dataFimReal: (dto as any).dataFimReal ? new Date((dto as any).dataFimReal) : undefined,
    percentualProgresso: dto.percentualProgresso,
    orcamentoEstimado: (dto as any).orcamentoEstimado,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
  };
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
      (error: AxiosError<ApiResponse<any>>) => Promise.reject(error)
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

  // Denúncias
  async criarDenuncia(denuncia: CriarDenunciaDTO): Promise<Denuncia | null> {
    try {
      const response = await this.client.post<ApiResponse<Denuncia>>(
        '/denuncias',
        denuncia
      );
      return response.data.data || null;
    } catch {
      return null;
    }
  }

  async listarDenuncias(): Promise<Denuncia[]> {
    try {
      const response = await this.client.get<ApiResponse<Denuncia[]>>(
        '/denuncias'
      );
      return response.data.data || [];
    } catch {
      return [];
    }
  }

  async buscarDenunciaPorId(id: string): Promise<Denuncia | null> {
    try {
      const response = await this.client.get<ApiResponse<Denuncia>>(
        `/denuncias/${id}`
      );
      return response.data.data || null;
    } catch {
      return null;
    }
  }

  async atualizarStatusDenuncia(
    id: string,
    novoStatus: string
  ): Promise<Denuncia | null> {
    try {
      const response = await this.client.patch<ApiResponse<Denuncia>>(
        `/denuncias/${id}/status`,
        { status: novoStatus }
      );
      return response.data.data || null;
    } catch {
      return null;
    }
  }
}

export { APIClient };

