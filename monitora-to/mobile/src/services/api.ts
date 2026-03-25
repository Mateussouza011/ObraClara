/**
 * Serviço de API - Camada de Infraestrutura
 * Cliente HTTP centralizado usando Axios
 * Implementa validação e transformação de dados
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

// Configuração base
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const REQUEST_TIMEOUT = 10000;

/**
 * Interface para respostas da API
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Classe de erro customizado para a API
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public originalError?: AxiosError,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Cliente HTTP singleton
 */
class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptador para adicionar token
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Interceptador para erros
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expirado
          this.token = null;
          // Disparar evento de logout
        }
        throw error;
      },
    );
  }

  /**
   * Define o token JWT
   */
  setToken(token: string): void {
    this.token = token;
  }

  /**
   * Remove o token
   */
  clearToken(): void {
    this.token = null;
  }

  /**
   * GET request
   */
  async get<T>(url: string, config?: any): Promise<T> {
    try {
      const response = await this.client.get<ApiResponse<T>>(url, config);
      if (!response.data.success) {
        throw new ApiError(response.status, response.data.error || 'Erro desconhecido');
      }
      return response.data.data as T;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * POST request
   */
  async post<T>(url: string, data?: any, config?: any): Promise<T> {
    try {
      const response = await this.client.post<ApiResponse<T>>(url, data, config);
      if (!response.data.success) {
        throw new ApiError(response.status, response.data.error || 'Erro desconhecido');
      }
      return response.data.data as T;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * PATCH request
   */
  async patch<T>(url: string, data?: any, config?: any): Promise<T> {
    try {
      const response = await this.client.patch<ApiResponse<T>>(url, data, config);
      if (!response.data.success) {
        throw new ApiError(response.status, response.data.error || 'Erro desconhecido');
      }
      return response.data.data as T;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string, config?: any): Promise<T> {
    try {
      const response = await this.client.delete<ApiResponse<T>>(url, config);
      if (!response.data.success) {
        throw new ApiError(response.status, response.data.error || 'Erro desconhecido');
      }
      return response.data.data as T;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Tratamento centralizado de erros
   */
  private handleError(error: any): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status || 500;
      const mensagem = error.response?.data?.error || error.message || 'Erro na requisição';
      return new ApiError(statusCode, mensagem, error);
    }

    return new ApiError(500, 'Erro desconhecido', error);
  }
}

// Singleton
export const apiClient = new ApiClient();

/**
 * Serviço de API específico para Obras
 */
export const obraApi = {
  /**
   * Lista todas as obras
   */
  async listarTodas() {
    return apiClient.get('/api/obras');
  },

  /**
   * Lista obras próximas à localização
   */
  async listarProximas(latitude: number, longitude: number, raioKm: number = 10) {
    return apiClient.get('/api/obras/proximas', {
      params: { latitude, longitude, raio: raioKm },
    });
  },

  /**
   * Busca obra por ID
   */
  async buscarPorId(id: string) {
    return apiClient.get(`/api/obras/${id}`);
  },
};

/**
 * Serviço de API específico para Denúncias
 */
export const denunciaApi = {
  /**
   * Cria uma nova denúncia
   */
  async criar(obraId: string, titulo: string, descricao: string, tipo: string, imagemUrl?: string) {
    return apiClient.post('/api/denuncias', {
      obraId,
      titulo,
      descricao,
      tipo,
      imagemUrl,
    });
  },

  /**
   * Busca denúncia por ID
   */
  async buscarPorId(id: string) {
    return apiClient.get(`/api/denuncias/${id}`);
  },

  /**
   * Atualiza status de uma denúncia
   */
  async atualizarStatus(id: string, novoStatus: string) {
    return apiClient.patch(`/api/denuncias/${id}/status`, {
      novoStatus,
    });
  },
};
