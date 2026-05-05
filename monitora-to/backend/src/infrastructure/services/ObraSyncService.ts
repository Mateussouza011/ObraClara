import axios from 'axios';

// O portal "pesquisa aberta" usa o cipi-backend (mesmo host do frontend).
// Esse endpoint retorna a lista completa de projetos por UF + situação.
const CIPI_BACKEND_BASE = 'https://obrasgov.sistema.gov.br/cipi-backend/api';
// idUf do Tocantins no cipi-backend
const TO_UF_ID = 17;
// idSituacao "Em execução" no cipi-backend
const EM_EXECUCAO_SITUACAO_ID = 3;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos de cache

// Cache de resultados para evitar chamadas repetidas ao governo
let projectsCache: { data: CipiProjetoPesquisa[]; timestamp: number } | null = null;

// Promessa para evitar múltiplas chamadas simultâneas (Singleton Promise)
let currentSyncPromise: Promise<CipiProjetoPesquisa[]> | null = null;

// Coordenadas padrão para o centro do Tocantins
const DEFAULT_COORDS = { latitude: -10.184, longitude: -48.3336 };

// ========== Interfaces ==========

interface CipiProjetoPesquisa {
  id: string;
  nomeProjeto: string;
  orgaoExecutor: string[];
  pin: string; // WKT POINT (lon lat)
  naturezaProjeto: string;
  idUf: number;
  municipio: string;
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

function inferEsfera(projeto: { orgaoExecutor?: string[] } | any): 'Federal' | 'Estadual' | 'Municipal' {
  // Compat: a assinatura antiga era baseada no payload detalhado da API antiga.
  // Nesta versão ao vivo (cipi-backend) inferimos a esfera a partir do executor.
  const executor = (projeto as any)?.orgaoExecutor
    ? String(((projeto as any).orgaoExecutor || [])[0] || '').toLowerCase()
    : '';

  if (
    executor.includes('prefeitura')
    || executor.includes('municipio')
    || executor.includes('município')
    || executor.includes('fundo municipal')
  ) {
    return 'Municipal';
  }

  if (
    executor.includes('governo do estado')
    || executor.includes('governo estadual')
    || executor.includes('secretaria de estado')
    || executor.includes('estado do tocantins')
  ) {
    return 'Estadual';
  }

  return 'Federal';
}

function inferCidade(projeto: { nomeProjeto?: string; municipio?: string } | any): string {
  const municipio = String((projeto as any)?.municipio || '').trim();
  if (municipio) return municipio;

  // Try to extract city from the project name or municipality
  const nomeProjeto = String((projeto as any)?.nomeProjeto || (projeto as any)?.nome || '');
  const texto = `${nomeProjeto} ${municipio}`.toLowerCase();

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
        const response = await this.postWithRetry<CipiProjetoPesquisa[]>(
          `${CIPI_BACKEND_BASE}/public/pesquisa-aberta-projetos`,
          {
            idsRepassadores: [],
            idsEixos: [],
            idsTipos: [],
            idsSubtipos: [],
            idsSituacoes: [EM_EXECUCAO_SITUACAO_ID],
            idsTipoPpa: [],
            idsRps: [],
            idsUfs: TO_UF_ID,
            idsExecutores: [],
          },
        );

        return Array.isArray(response) ? response : [];
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

  private async processarProjetos(allProjetos: CipiProjetoPesquisa[], params: any): Promise<{ data: any[]; total: number }> {
    this.stats.fetched = allProjetos.length;

    // O endpoint já está filtrado para "Em execução".
    const ativos = allProjetos;
    this.stats.ignored = 0;

    // Enrich with coordinates + map para o formato interno
    const obras: ObraOficial[] = [];
    for (const projeto of ativos) {
      const coords = parseWktPoint(String(projeto.pin || ''));
      const esfera = inferEsfera(projeto as any);
      const cidade = inferCidade(projeto as any);

      const executor = Array.isArray(projeto.orgaoExecutor) && projeto.orgaoExecutor.length > 0
        ? projeto.orgaoExecutor[0]
        : 'Não informado';

      obras.push({
        id: projeto.id,
        titulo: projeto.nomeProjeto,
        descricao: '',
        esfera,
        situacao: 'Em execução',
        especie: projeto.naturezaProjeto || 'Obra',
        endereco: `${cidade} - TO`,
        cidade,
        latitude: coords?.latitude ?? DEFAULT_COORDS.latitude,
        longitude: coords?.longitude ?? DEFAULT_COORDS.longitude,
        dataInicio: null,
        dataFimPrevista: null,
        valorInvestimento: null,
        executor,
        fonteUrl: buildObraUrl(projeto.id),
        dataCadastro: null,
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

  private async postWithRetry<T>(url: string, body: any): Promise<T> {
    let lastError: any;

    for (let i = 0; i < MAX_RETRIES; i++) {
      try {
        const response = await axios.post<T>(url, body, {
          timeout: 20000,
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'ObraClaraBot/2.0 (+https://github.com/Mateussouza011/ObraClara)',
          },
        });
        return response.data;
      } catch (error: any) {
        lastError = error;
        const status = error.response?.status;
        console.warn(`[ObraSyncService] Tentativa ${i + 1} falhou para POST ${url}: ${status || error.message}`);

        if (status && status < 500) break;
        if (i < MAX_RETRIES - 1) {
          await sleep(RETRY_DELAY_MS * (i + 1));
        }
      }
    }

    throw lastError;
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
