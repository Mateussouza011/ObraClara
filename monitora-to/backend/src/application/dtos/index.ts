/**
 * DTOs (Data Transfer Objects) - Application Layer
 * Define a estrutura dos dados transferidos entre camadas
 */

// ========== DENUNCIA ==========

export interface CriarDenunciaDTO {
  usuarioId: string;
  obraId: string;
  titulo: string;
  descricao: string;
  tipo: string; // ATRASO, QUALIDADE, SEGURANCA, OUTRO
  imagemUrl?: string;
}

export interface DenunciaResponseDTO {
  id: string;
  usuarioId: string;
  obraId: string;
  titulo: string;
  descricao: string;
  tipo: string;
  imagemUrl?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

// ========== OBRA ==========

export interface CriarObraDTO {
  titulo: string;
  descricao: string;
  tipo: string;
  latitude: number;
  longitude: number;
  endereco: string;
  bairro: string;
  dataInicio?: Date;
  dataFimPrevista?: Date;
  orcamentoEstimado?: number;
}

export interface AtualizarObraDTO {
  titulo?: string;
  descricao?: string;
  status?: string;
  percentualProgresso?: number;
  dataFimPrevista?: Date;
  dataFimReal?: Date;
}

export interface ObraResponseDTO {
  id: string;
  titulo: string;
  descricao: string;
  tipo: string;
  latitude: number;
  longitude: number;
  endereco: string;
  bairro: string;
  status: string;
  percentualProgresso: number;
  dataInicio?: Date;
  dataFimPrevista?: Date;
  dataFimReal?: Date;
  orcamentoEstimado?: number;
  createdAt: Date;
  updatedAt: Date;
}

// ========== USUARIO ==========

export interface RegistrarUsuarioDTO {
  email: string;
  senha: string;
  nome: string;
  cpf: string;
  telefone?: string;
  bairro?: string;
}

export interface UsuarioResponseDTO {
  id: string;
  email: string;
  nome: string;
  cpf: string;
  telefone?: string;
  bairro?: string;
  createdAt: Date;
}

export interface LoginDTO {
  email: string;
  senha: string;
}

export interface LoginResponseDTO {
  token: string;
  usuario: UsuarioResponseDTO;
}
