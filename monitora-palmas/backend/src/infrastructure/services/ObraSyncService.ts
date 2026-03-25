import axios from 'axios';
import { createHash } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { ObraStatus, ObraTipo } from '@domain/entities';
import { v4 as uuidv4 } from 'uuid';
import { ObraResponseDTO } from '@application/dtos';

type SyncOrigin = 'startup' | 'interval' | 'manual';

interface ObraCandidate {
  titulo: string;
  descricao: string;
  fonteUrl: string;
  tipo: ObraTipo;
  status: ObraStatus;
  percentualProgresso: number;
  bairro: string;
  endereco: string;
  latitude: number;
  longitude: number;
}

interface LiveObra extends ObraResponseDTO {
  fonteUrl: string;
}

interface SyncRunSummary {
  origin: SyncOrigin;
  startedAt: string;
  finishedAt: string;
  fetched: number;
  inserted: number;
  updated: number;
  ignored: number;
}

interface ExistingObraRecord {
  id: string;
  fingerprint: string | null;
  titulo: string;
  bairro: string | null;
  endereco: string | null;
  descricao: string;
  percentualProgresso: number;
  status: ObraStatus;
  tipo: ObraTipo;
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

const DEFAULT_COORDS = { latitude: -10.184, longitude: -48.3336 };
const BAIRRO_COORDS: Record<string, { latitude: number; longitude: number }> = {
  '104 sul': { latitude: -10.204, longitude: -48.325 },
  'arse 12': { latitude: -10.198, longitude: -48.319 },
  'arse 14': { latitude: -10.205, longitude: -48.318 },
  'aureny iii': { latitude: -10.304, longitude: -48.302 },
  'aureny iv': { latitude: -10.312, longitude: -48.295 },
  taquaralto: { latitude: -10.295, longitude: -48.333 },
};

const OBRA_KEYWORDS = [
  'obra',
  'obras',
  'pavimenta',
  'asfalto',
  'recapeamento',
  'drenagem',
  'infraestrutura',
  'construcao',
  'construção',
  'reforma',
  'ponte',
  'avenida',
  'rua',
  'saneamento',
  'iluminacao',
  'iluminação',
  'ordem de servico',
  'ordem de serviço',
];

const CONCLUDED_KEYWORDS = ['conclu', 'entreg', 'inaugur', 'finaliz'];

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function inferTipo(texto: string): ObraTipo {
  const normalized = normalizeText(texto);
  if (normalized.includes('asfalto') || normalized.includes('pavimenta') || normalized.includes('recape')) {
    return ObraTipo.ASFALTAMENTO;
  }
  if (normalized.includes('drenagem')) {
    return ObraTipo.DRENAGEM;
  }
  if (normalized.includes('iluminacao') || normalized.includes('iluminação')) {
    return ObraTipo.ILUMINACAO;
  }
  if (normalized.includes('saneamento') || normalized.includes('esgoto')) {
    return ObraTipo.SANEAMENTO;
  }
  if (normalized.includes('construcao') || normalized.includes('construção') || normalized.includes('reforma')) {
    return ObraTipo.CONSTRUCAO;
  }
  return ObraTipo.OUTRO;
}

function inferStatus(texto: string): ObraStatus {
  const normalized = normalizeText(texto);
  if (CONCLUDED_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return ObraStatus.CONCLUIDA;
  }
  if (normalized.includes('ordem de servico') || normalized.includes('ordem de serviço') || normalized.includes('licitacao')) {
    return ObraStatus.PLANEJADA;
  }
  if (normalized.includes('paralisad') || normalized.includes('pausad')) {
    return ObraStatus.PAUSADA;
  }
  return ObraStatus.EM_EXECUCAO;
}

function inferPercentual(texto: string, status: ObraStatus): number {
  const normalized = normalizeText(texto);
  const percentualMatch = normalized.match(/(\d{1,3})\s?%/);
  if (percentualMatch) {
    return Math.max(0, Math.min(100, Number(percentualMatch[1])));
  }
  if (status === ObraStatus.PLANEJADA) return 0;
  if (status === ObraStatus.CONCLUIDA) return 100;
  if (status === ObraStatus.PAUSADA) return 50;
  return 25;
}

function inferBairro(texto: string): string {
  const normalized = normalizeText(texto);
  if (normalized.includes('104 sul')) return '104 Sul';
  if (normalized.includes('arse 12')) return 'ARSE 12';
  if (normalized.includes('arse 14')) return 'ARSE 14';
  if (normalized.includes('aureny iii')) return 'Aureny III';
  if (normalized.includes('aureny iv')) return 'Aureny IV';
  if (normalized.includes('taquaralto')) return 'Taquaralto';
  return 'Taquaralto';
}

function inferEndereco(texto: string, bairro: string): string {
  const ruaMatch = texto.match(/(Avenida|Av\.|Rua|Quadra)\s+[A-Za-z0-9\-\s]+/i);
  if (ruaMatch) return ruaMatch[0].trim();
  return `${bairro}, Palmas - TO`;
}

function inferCoords(bairro: string): { latitude: number; longitude: number } {
  const key = normalizeText(bairro);
  return BAIRRO_COORDS[key] || DEFAULT_COORDS;
}

export function createFingerprintHash(input: { titulo: string; bairro: string; endereco: string }): string {
  const normalized = [input.titulo, input.bairro, input.endereco]
    .map((chunk) => normalizeText(chunk))
    .join('|');

  return createHash('sha256').update(normalized).digest('hex');
}

function getDefaultSources(): string[] {
  return [
    'https://news.google.com/rss/search?q=obras+Palmas+TO&hl=pt-BR&gl=BR&ceid=BR:pt-419',
    'https://news.google.com/rss/search?q=infraestrutura+Palmas+TO&hl=pt-BR&gl=BR&ceid=BR:pt-419',
    'https://news.google.com/rss/search?q=site:to.gov.br+obras+Palmas&hl=pt-BR&gl=BR&ceid=BR:pt-419',
  ];
}

function parseEnvSources(): string[] {
  const envValue = process.env.OBRA_SYNC_SOURCES;
  if (!envValue) return getDefaultSources();

  return envValue
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function extractFromRss(xml: string, sourceUrl: string): Array<{ titulo: string; texto: string; url: string }> {
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];
  if (!items.length) return [];

  return items
    .map((item) => {
      const itemBody = item[1] || '';
      const title = (itemBody.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i)?.[1]
        || itemBody.match(/<title>([\s\S]*?)<\/title>/i)?.[1]
        || '')
        .trim();
      const description = (itemBody.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i)?.[1]
        || itemBody.match(/<description>([\s\S]*?)<\/description>/i)?.[1]
        || '')
        .trim();
      const link = (itemBody.match(/<link>([\s\S]*?)<\/link>/i)?.[1] || sourceUrl).trim();
      return {
        titulo: stripTags(title),
        texto: stripTags(description),
        url: link,
      };
    })
    .filter((item) => item.titulo.length > 0 || item.texto.length > 0);
}

function extractFromHtml(html: string, sourceUrl: string): Array<{ titulo: string; texto: string; url: string }> {
  const anchors = [...html.matchAll(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  const candidates = anchors.map((match) => {
    const href = match[1] || sourceUrl;
    const titleText = stripTags(match[2] || '');
    const absoluteUrl = href.startsWith('http') ? href : new URL(href, sourceUrl).toString();
    return {
      titulo: titleText,
      texto: titleText,
      url: absoluteUrl,
    };
  });

  return candidates.filter((item) => item.titulo.length > 20);
}

export class ObraSyncService {
  private readonly intervalMs: number;
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private lastRunAt?: string;
  private lastSuccessAt?: string;
  private lastError?: string;
  private stats = {
    fetched: 0,
    inserted: 0,
    updated: 0,
    ignored: 0,
  };

  constructor(private prisma: PrismaClient) {
    const parsedInterval = Number(process.env.OBRA_SYNC_INTERVAL_MS || '300000');
    this.intervalMs = Number.isFinite(parsedInterval) && parsedInterval >= 10000
      ? parsedInterval
      : 300000;
  }

  startPeriodicSync(): void {
    if (this.timer) return;

    this.timer = setInterval(() => {
      this.syncNow('interval').catch((error) => {
        this.lastError = error instanceof Error ? error.message : 'Falha desconhecida';
      });
    }, this.intervalMs);
  }

  stopPeriodicSync(): void {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  }

  async syncNow(origin: SyncOrigin): Promise<SyncRunSummary> {
    if (this.running) {
      throw new Error('Sincronização já está em execução');
    }

    this.running = true;
    this.lastRunAt = new Date().toISOString();

    const startedAt = new Date();
    const runStats = {
      fetched: 0,
      inserted: 0,
      updated: 0,
      ignored: 0,
    };

    try {
      const sources = parseEnvSources();
      const candidates = await this.collectCandidates(sources);
      runStats.fetched = candidates.length;

      const existing: ExistingObraRecord[] = await this.prisma.obra.findMany({
        select: {
          id: true,
          fingerprint: true,
          titulo: true,
          bairro: true,
          endereco: true,
          descricao: true,
          percentualProgresso: true,
          status: true,
          tipo: true,
        },
      }) as ExistingObraRecord[];

      const existingByFingerprint = new Map(
        existing.map((obra) => [
          obra.fingerprint || createFingerprintHash({
            titulo: obra.titulo,
            bairro: obra.bairro || '',
            endereco: obra.endereco || '',
          }),
          obra,
        ]),
      );

      const seenRunFingerprints = new Set<string>();

      for (const candidate of candidates) {
        if (candidate.status === ObraStatus.CONCLUIDA) {
          runStats.ignored += 1;
          continue;
        }

        const fingerprint = createFingerprintHash(candidate);

        if (seenRunFingerprints.has(fingerprint)) {
          runStats.ignored += 1;
          continue;
        }

        seenRunFingerprints.add(fingerprint);

        const existingRecord = existingByFingerprint.get(fingerprint);
        const descricaoComFonte = `${candidate.descricao}\n\nFonte automática: ${candidate.fonteUrl}`;

        if (!existingRecord) {
          await this.prisma.obra.create({
            data: {
              id: uuidv4(),
              titulo: candidate.titulo,
              descricao: descricaoComFonte,
              tipo: candidate.tipo,
              latitude: candidate.latitude,
              longitude: candidate.longitude,
              endereco: candidate.endereco,
              bairro: candidate.bairro,
              fingerprint,
              status: candidate.status,
              percentualProgresso: candidate.percentualProgresso,
              dataInicio: candidate.status === ObraStatus.PLANEJADA ? null : new Date(),
            },
          });

          runStats.inserted += 1;
          continue;
        }

        const hasChanges =
          existingRecord.percentualProgresso !== candidate.percentualProgresso
          || existingRecord.status !== candidate.status
          || normalizeText(existingRecord.descricao || '').includes(normalizeText(candidate.fonteUrl)) === false;

        if (!hasChanges) {
          runStats.ignored += 1;
          continue;
        }

        await this.prisma.obra.update({
          where: { id: existingRecord.id },
          data: {
            descricao: descricaoComFonte,
            fingerprint,
            status: candidate.status,
            percentualProgresso: candidate.percentualProgresso,
            updatedAt: new Date(),
          },
        });

        runStats.updated += 1;
      }

      this.lastSuccessAt = new Date().toISOString();
      this.stats = runStats;

      return {
        origin,
        startedAt: startedAt.toISOString(),
        finishedAt: new Date().toISOString(),
        fetched: runStats.fetched,
        inserted: runStats.inserted,
        updated: runStats.updated,
        ignored: runStats.ignored,
      };
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : 'Falha desconhecida';
      throw error;
    } finally {
      this.running = false;
    }
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

  async listarObrasAoVivo(params?: {
    latitude?: number;
    longitude?: number;
    raioKm?: number;
    page?: number;
    limit?: number;
    sortBy?: 'updatedAt' | 'createdAt' | 'percentualProgresso' | 'titulo';
    sortDirection?: 'asc' | 'desc';
  }): Promise<{ data: LiveObra[]; total: number }> {
    const candidates = await this.collectCandidates(parseEnvSources());
    const semConcluidas = candidates.filter((candidate) => candidate.status !== ObraStatus.CONCLUIDA);

    const uniqueByFingerprint = new Map<string, ObraCandidate>();
    semConcluidas.forEach((candidate) => {
      uniqueByFingerprint.set(createFingerprintHash(candidate), candidate);
    });

    let obras = Array.from(uniqueByFingerprint.values()).map((candidate) => this.mapCandidateToLiveObra(candidate));

    if (
      typeof params?.latitude === 'number'
      && typeof params?.longitude === 'number'
      && typeof params?.raioKm === 'number'
    ) {
      obras = obras.filter((obra) => {
        const distance = this.distanceInKm(params.latitude!, params.longitude!, obra.latitude, obra.longitude);
        return distance <= params.raioKm!;
      });
    }

    const sortBy = params?.sortBy || 'updatedAt';
    const sortDirection = params?.sortDirection || 'desc';
    obras.sort((a, b) => this.compareLiveObras(a, b, sortBy, sortDirection));

    const total = obras.length;
    const page = params?.page && params.page > 0 ? params.page : 1;
    const limit = params?.limit && params.limit > 0 ? params.limit : 20;
    const start = (page - 1) * limit;
    const paginated = obras.slice(start, start + limit);

    return {
      data: paginated,
      total,
    };
  }

  private async collectCandidates(sources: string[]): Promise<ObraCandidate[]> {
    const requests = sources.map(async (sourceUrl) => {
      try {
        const response = await axios.get<string>(sourceUrl, {
          timeout: 15000,
          responseType: 'text',
          headers: {
            'User-Agent': 'ObraClaraBot/1.0 (+https://localhost)',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
        });

        const contentTypeHeader = String(response.headers['content-type'] || '').toLowerCase();
        const body = response.data;
        const rawItems = contentTypeHeader.includes('xml')
          ? extractFromRss(body, sourceUrl)
          : extractFromHtml(body, sourceUrl);

        return rawItems
          .map((item) => this.toCandidate(item.titulo, item.texto, item.url || sourceUrl))
          .filter((item): item is ObraCandidate => item !== null);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'erro desconhecido';
        console.warn(`Falha ao buscar fonte ${sourceUrl}: ${message}`);
        return [];
      }
    });

    const results = await Promise.all(requests);
    return results.flat();
  }

  private toCandidate(tituloBruto: string, textoBruto: string, fonteUrl: string): ObraCandidate | null {
    const titulo = tituloBruto.trim().slice(0, 180);
    const texto = textoBruto.trim().slice(0, 1200);
    const aggregateText = `${titulo} ${texto}`.trim();
    const normalized = normalizeText(aggregateText);

    if (!aggregateText || aggregateText.length < 30) return null;
    if (!OBRA_KEYWORDS.some((keyword) => normalized.includes(keyword))) return null;

    const status = inferStatus(aggregateText);
    const tipo = inferTipo(aggregateText);
    const percentualProgresso = inferPercentual(aggregateText, status);
    const bairro = inferBairro(aggregateText);
    const endereco = inferEndereco(aggregateText, bairro);
    const coords = inferCoords(bairro);

    return {
      titulo,
      descricao: texto || titulo,
      fonteUrl,
      tipo,
      status,
      percentualProgresso,
      bairro,
      endereco,
      latitude: coords.latitude,
      longitude: coords.longitude,
    };
  }

  private mapCandidateToLiveObra(candidate: ObraCandidate): LiveObra {
    const now = new Date();
    return {
      id: createFingerprintHash(candidate),
      titulo: candidate.titulo,
      descricao: `${candidate.descricao}\n\nFonte automática: ${candidate.fonteUrl}`,
      tipo: candidate.tipo,
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      endereco: candidate.endereco,
      bairro: candidate.bairro,
      status: candidate.status,
      percentualProgresso: candidate.percentualProgresso,
      createdAt: now,
      updatedAt: now,
      fonteUrl: candidate.fonteUrl,
    };
  }

  private compareLiveObras(
    a: LiveObra,
    b: LiveObra,
    sortBy: 'updatedAt' | 'createdAt' | 'percentualProgresso' | 'titulo',
    sortDirection: 'asc' | 'desc',
  ): number {
    const direction = sortDirection === 'asc' ? 1 : -1;

    if (sortBy === 'titulo') {
      return a.titulo.localeCompare(b.titulo) * direction;
    }

    if (sortBy === 'percentualProgresso') {
      return (a.percentualProgresso - b.percentualProgresso) * direction;
    }

    const aDate = new Date(sortBy === 'createdAt' ? a.createdAt : a.updatedAt).getTime();
    const bDate = new Date(sortBy === 'createdAt' ? b.createdAt : b.updatedAt).getTime();
    return (aDate - bDate) * direction;
  }

  private distanceInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2)
      + Math.cos(lat1 * (Math.PI / 180))
      * Math.cos(lat2 * (Math.PI / 180))
      * Math.sin(dLon / 2)
      * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
