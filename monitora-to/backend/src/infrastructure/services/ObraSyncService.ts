import axios from 'axios';

// O domínio principal do portal mudou para sistema.gov.br, mas a API parece ainda responder em gestao.gov.br
const OBRASGOV_BASE = 'https://api.obrasgov.gestao.gov.br/obrasgov/api';
const UF = 'TO';
const PAGE_SIZE = 100;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos de cache

// Cache de resultados para evitar chamadas repetidas ao governo
let projectsCache: { data: ObrasGovProjeto[]; timestamp: number } | null = null;
const geoCache = new Map<string, { latitude: number; longitude: number } | null>();

// Promessa para evitar múltiplas chamadas simultâneas (Singleton Promise)
let currentSyncPromise: Promise<ObrasGovProjeto[]> | null = null;

// Coordenadas padrão para o centro do Tocantins
const DEFAULT_COORDS = { latitude: -10.184, longitude: -48.3336 };

// ========== Interfaces ==========

interface ObrasGovProjeto {
  idUnico: string;
  nome: string;
  cep: string | null;
  endereco: string | null;
  descricao: string;
  funcaoSocial: string | null;
  metaGlobal: string | null;
  dataInicialPrevista: string | null;
  dataFinalPrevista: string | null;
  dataInicialEfetiva: string | null;
  dataFinalEfetiva: string | null;
  dataCadastro: string | null;
  especie: string | null;
  natureza: string | null;
  situacao: string;
  uf: string;
  populacaoBeneficiada: string | null;
  descPopulacaoBeneficiada: string | null;
  dataSituacao: string | null;
  tomadores: Array<{ nome: string; codigo: number }>;
  executores: Array<{ nome: string; codigo: number }>;
  repassadores: Array<{ nome: string; codigo: number }>;
  eixos: Array<{ id: number; descricao: string }>;
  tipos: Array<{ id: number; descricao: string; idEixo: number }>;
  subTipos: Array<{ id: number; descricao: string; idTipo: number }>;
  fontesDeRecurso: Array<{ origem: string; valorInvestimentoPrevisto: number }>;
}

interface ObrasGovGeometria {
  geometriaWkt: string;
  dataCriacao: string | null;
  origem: string | null;
  nomeAreaExecutora: string | null;
  enderecoAreaExecutora: string | null;
  cepAreaExecutora: string | null;
}

interface ObrasGovPageResponse {
  content: ObrasGovProjeto[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ObraOficial {
  id: string;
  titulo: string;
  descricao: string;
  esfera: 'Federal' | 'Estadual' | 'Municipal';
  situacao: string;
  especie: string;
  endereco: string;
  cidade: string;
  latitude: number;
  longitude: number;
  dataInicio: string | null;
  dataFimPrevista: string | null;
  valorInvestimento: number | null;
  executor: string;
  fonteUrl: string;
  dataCadastro: string | null;
}

export interface ObraSyncStatus {
  running: boolean;
  lastRunAt?: string;
  lastSuccessAt?: string;
  lastError?: string;
  intervalMs: number;
  stats: {
    fetched: number;
    inserted: number;
    updated: number;
    ignored: number;
  };
}

// ========== Helpers ==========

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function inferEsfera(projeto: ObrasGovProjeto): 'Federal' | 'Estadual' | 'Municipal' {
  const fontes = projeto.fontesDeRecurso || [];

  // Check source of funds
  for (const fonte of fontes) {
    const origem = (fonte.origem || '').toLowerCase();
    if (origem.includes('municipal')) return 'Municipal';
    if (origem.includes('estadual')) return 'Estadual';
  }

  // Check executores/tomadores for municipal hints
  const allEntities = [
    ...projeto.executores.map((e) => e.nome.toLowerCase()),
    ...projeto.tomadores.map((t) => t.nome.toLowerCase()),
    ...projeto.repassadores.map((r) => r.nome.toLowerCase()),
  ];

  for (const entity of allEntities) {
    if (
      entity.includes('prefeitura') ||
      entity.includes('fundo municipal') ||
      entity.includes('municipio') ||
      entity.includes('município')
    ) {
      return 'Municipal';
    }
    if (
      entity.includes('governo do estado') ||
      entity.includes('governo estadual') ||
      entity.includes('secretaria de estado') ||
      entity.includes('estado do tocantins')
    ) {
      return 'Estadual';
    }
  }

  return 'Federal';
}

function inferCidade(projeto: ObrasGovProjeto): string {
  // Try to extract city from the project name or description
  const texto = `${projeto.nome} ${projeto.descricao} ${projeto.funcaoSocial || ''}`.toLowerCase();

  const cidadesTocantins = [
    'Palmas', 'Araguaína', 'Gurupi', 'Porto Nacional', 'Paraíso do Tocantins',
    'Colinas do Tocantins', 'Guaraí', 'Dianópolis', 'Araguatins', 'Tocantinópolis',
    'Pedro Afonso', 'Formoso do Araguaia', 'Miracema do Tocantins', 'Taguatinga',
    'Augustinópolis', 'Xambioá', 'Nova Olinda', 'Lagoa da Confusão', 'Peixe',
    'Alvorada', 'Natividade', 'Arraias', 'Ponte Alta do Tocantins', 'Wanderlândia',
    'Itacajá', 'Ananás', 'Cristalândia', 'Miranorte', 'Goiatins', 'Filadélfia',
    'Axixá do Tocantins', 'Conceição do Tocantins', 'Novo Acordo', 'Pium',
    'Sandolândia', 'Dueré', 'Figueirópolis', 'Palmeirópolis', 'Brejinho de Nazaré',
    'Aliança do Tocantins', 'Santa Rosa do Tocantins', 'Tocantínia',
  ];

  for (const cidade of cidadesTocantins) {
    if (texto.includes(cidade.toLowerCase())) {
      return cidade;
    }
  }

  // Try tomadores/executores for municipal entities
  for (const entity of [...projeto.tomadores, ...projeto.executores]) {
    const nome = entity.nome;
    for (const cidade of cidadesTocantins) {
      if (nome.toLowerCase().includes(cidade.toLowerCase())) {
        return cidade;
      }
    }
  }

  return 'Tocantins';
}

function parseWktPoint(wkt: string): { latitude: number; longitude: number } | null {
  // Format: "POINT (-49.4466005 -11.4596773)"
  const match = wkt.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
  if (!match) return null;

  const longitude = parseFloat(match[1]);
  const latitude = parseFloat(match[2]);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;

  return { latitude, longitude };
}

function buildObraUrl(idUnico: string): string {
  // O domínio mudou para sistema.gov.br e o path para visao-geral-intervencao
  return `https://obrasgov.sistema.gov.br/cipi-frontend/acesso-livre/visao-geral-intervencao/${encodeURIComponent(idUnico)}`;
}

// ========== Service ==========

export class ObraSyncService {
  private readonly intervalMs: number;
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private lastRunAt?: string;
  private lastSuccessAt?: string;
  private lastError?: string;
  private stats = { fetched: 0, inserted: 0, updated: 0, ignored: 0 };

  // prisma is kept for signature compatibility, not used in this version
  constructor(private prisma: any) {
    const parsedInterval = Number(process.env.OBRA_SYNC_INTERVAL_MS || '300000');
    this.intervalMs = Number.isFinite(parsedInterval) && parsedInterval >= 10000
      ? parsedInterval
      : 300000;
  }

  startPeriodicSync(): void {
    // No-op: live data is fetched on demand
  }

  stopPeriodicSync(): void {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  }

  async syncNow(_origin: string): Promise<any> {
    // No-op: live mode only
    return {
      origin: _origin,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      fetched: 0,
      inserted: 0,
      updated: 0,
      ignored: 0,
    };
  }

  getStatus(): ObraSyncStatus {
    return {
      running: this.running,
      lastRunAt: this.lastRunAt,
      lastSuccessAt: this.lastSuccessAt,
      lastError: this.lastError,
      intervalMs: this.intervalMs,
      stats: this.stats,
    };
  }

  /**
   * Busca obras oficiais da API ObrasGov.br, filtra e retorna para o frontend.
   */
  async listarObrasAoVivo(params?: {
    latitude?: number;
    longitude?: number;
    raioKm?: number;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  }): Promise<{ data: any[]; total: number }> {
    // 0. Verificar Cache
    const nowTimestamp = Date.now();
    if (projectsCache && (nowTimestamp - projectsCache.timestamp < CACHE_TTL_MS)) {
      return this.processarProjetos(projectsCache.data, params);
    }

    // 1. Lidar com Concorrência (se já estiver baixando, espera)
    if (currentSyncPromise) {
      const data = await currentSyncPromise;
      return this.processarProjetos(data, params);
    }

    this.running = true;
    this.lastRunAt = new Date().toISOString();

    try {
      currentSyncPromise = (async () => {
        const response = await this.fetchWithRetry<ObrasGovPageResponse>(
          `${OBRASGOV_BASE}/projeto-investimento`,
          { uf: UF, page: 0, size: PAGE_SIZE },
        );
        return response.content || [];
      })();

      const allProjetos = await currentSyncPromise;
      
      // Atualizar Cache
      projectsCache = {
        data: allProjetos,
        timestamp: Date.now(),
      };

      return this.processarProjetos(allProjetos, params);
    } catch (error) {
      console.error('[ObraSyncService] Erro ao listar obras:', error);
      this.lastError = error instanceof Error ? error.message : 'Falha desconhecida';
      throw error;
    } finally {
      this.running = false;
      currentSyncPromise = null;
    }
  }

  private async processarProjetos(allProjetos: ObrasGovProjeto[], params: any): Promise<{ data: any[]; total: number }> {
    this.stats.fetched = allProjetos.length;

    // 2. Filter out concluded works — user only wants active/in-progress
    const ativos = allProjetos.filter((p) => {
      const sit = (p.situacao || '').toLowerCase();
      return !sit.includes('conclu');
    });
    this.stats.ignored = allProjetos.length - ativos.length;

    // 3. Enrich with coordinates
    const obras: ObraOficial[] = [];
    for (const projeto of ativos) {
      const coords = await this.fetchGeometria(projeto.idUnico);
      const esfera = inferEsfera(projeto);
      const cidade = inferCidade(projeto);
      const valorTotal = (projeto.fontesDeRecurso || []).reduce(
        (sum, f) => sum + (f.valorInvestimentoPrevisto || 0),
        0,
      );

      const executor = projeto.executores.length > 0
        ? projeto.executores[0].nome
        : (projeto.tomadores.length > 0 ? projeto.tomadores[0].nome : 'Não informado');

      obras.push({
        id: projeto.idUnico,
        titulo: projeto.nome,
        descricao: projeto.descricao || projeto.metaGlobal || projeto.funcaoSocial || '',
        esfera,
        situacao: projeto.situacao,
        especie: projeto.especie || 'Obra',
        endereco: projeto.endereco || `${cidade} - TO`,
        cidade,
        latitude: coords?.latitude ?? DEFAULT_COORDS.latitude,
        longitude: coords?.longitude ?? DEFAULT_COORDS.longitude,
        dataInicio: projeto.dataInicialEfetiva || projeto.dataInicialPrevista,
        dataFimPrevista: projeto.dataFinalPrevista,
        valorInvestimento: valorTotal > 0 ? valorTotal : null,
        executor,
        fonteUrl: buildObraUrl(projeto.idUnico),
        dataCadastro: projeto.dataCadastro,
      });
    }

    // 4. Filter by radius if provided
    let resultado = obras;
    if (
      typeof params?.latitude === 'number' &&
      typeof params?.longitude === 'number' &&
      typeof params?.raioKm === 'number'
    ) {
      resultado = resultado.filter((obra) => {
        const dist = this.distanceInKm(params.latitude!, params.longitude!, obra.latitude, obra.longitude);
        return dist <= params.raioKm!;
      });
    }

    // 5. Map to the frontend DTO format
    const now = new Date();
    const mappedData = resultado.map((obra) => ({
      id: obra.id,
      titulo: obra.titulo,
      descricao: obra.descricao,
      tipo: obra.especie,
      latitude: obra.latitude,
      longitude: obra.longitude,
      endereco: obra.endereco,
      bairro: obra.cidade,
      status: this.mapSituacaoToStatus(obra.situacao),
      percentualProgresso: 0,
      dataInicio: obra.dataInicio,
      dataFimPrevista: obra.dataFimPrevista,
      esfera: obra.esfera,
      fonteUrl: obra.fonteUrl,
      valorInvestimento: obra.valorInvestimento,
      executor: obra.executor,
      createdAt: now,
      updatedAt: now,
    }));

    const total = mappedData.length;
    const page = params?.page && params.page > 0 ? params.page : 1;
    const limit = params?.limit && params.limit > 0 ? params.limit : 100;
    const start = (page - 1) * limit;
    const paginated = mappedData.slice(start, start + limit);

    this.lastSuccessAt = new Date().toISOString();
    this.stats.inserted = ativos.length;

    return { data: paginated, total };
  }

  // ========== Private helpers ==========

  private async fetchWithRetry<T>(url: string, params: any): Promise<T> {
    let lastError: any;
    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        const response = await axios.get<T>(url, {
          params,
          timeout: 15000,
          headers: {
            Accept: 'application/json',
            'User-Agent': 'ObraClaraBot/2.0 (+https://github.com/Mateussouza011/ObraClara)',
          },
        });
        return response.data;
      } catch (error: any) {
        lastError = error;
        const status = error.response?.status;
        console.warn(`[ObraSyncService] Tentativa ${i + 1} falhou para ${url}: ${status || error.message}`);

        // Only retry on 5xx or network errors
        if (status && status < 500) break;

        if (i < MAX_RETRIES - 1) {
          await sleep(RETRY_DELAY_MS * (i + 1));
        }
      }
    }
    throw lastError;
  }

  private async fetchGeometria(idUnico: string): Promise<{ latitude: number; longitude: number } | null> {
    // Check cache
    if (geoCache.has(idUnico)) {
      return geoCache.get(idUnico) || null;
    }

    try {
      const geometrias = await this.fetchWithRetry<ObrasGovGeometria[]>(
        `${OBRASGOV_BASE}/geometria`,
        { idUnico },
      );

      if (Array.isArray(geometrias) && geometrias.length > 0) {
        for (const geo of geometrias) {
          if (geo.geometriaWkt) {
            const coords = parseWktPoint(geo.geometriaWkt);
            if (coords) {
              geoCache.set(idUnico, coords);
              return coords;
            }
          }
        }
      }

      geoCache.set(idUnico, null);
      return null;
    } catch {
      geoCache.set(idUnico, null);
      return null;
    }
  }

  private mapSituacaoToStatus(situacao: string): string {
    const s = situacao.toLowerCase();
    if (s.includes('execu')) return 'EM_EXECUCAO';
    if (s.includes('paralis') || s.includes('pausad')) return 'PAUSADA';
    if (s.includes('conclu')) return 'CONCLUIDA';
    return 'PLANEJADA';
  }

  private distanceInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
