import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { ObraStatus } from '@domain/entities';
import { ObraSyncService, createFingerprintHash } from '@infrastructure/services/ObraSyncService';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ObraSyncService', () => {
  const sourceUrl = 'http://fonte-teste.local/noticias';

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OBRA_SYNC_SOURCES = sourceUrl;
    process.env.OBRA_SYNC_INTERVAL_MS = '60000';
  });

  afterEach(() => {
    delete process.env.OBRA_SYNC_SOURCES;
    delete process.env.OBRA_SYNC_INTERVAL_MS;
  });

  it('deve deduplicar no mesmo ciclo e ignorar obras concluidas', async () => {
    const html = `
      <a href="/n1">Obra de asfalto na 104 Sul em andamento 30%</a>
      <a href="/n2">Obra de asfalto na 104 Sul em andamento 30%</a>
      <a href="/n3">Obra de drenagem em Taquaralto concluida e entregue 100%</a>
    `;

    mockedAxios.get.mockResolvedValue({
      data: html,
      headers: { 'content-type': 'text/html' },
    } as any);

    const prismaMock = {
      obra: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue(undefined),
        update: jest.fn().mockResolvedValue(undefined),
      },
    };

    const service = new ObraSyncService(prismaMock as unknown as PrismaClient);
    const resultado = await service.syncNow('manual');

    expect(resultado.fetched).toBe(3);
    expect(resultado.inserted).toBe(1);
    expect(resultado.updated).toBe(0);
    expect(resultado.ignored).toBe(2);
    expect(prismaMock.obra.create).toHaveBeenCalledTimes(1);

    const createArgs = (prismaMock.obra.create as jest.Mock).mock.calls[0][0];
    expect(createArgs.data.fingerprint).toHaveLength(64);
    expect(createArgs.data.status).toBe(ObraStatus.EM_EXECUCAO);
  });

  it('deve atualizar registro existente ao encontrar o mesmo fingerprint', async () => {
    const titulo = 'Obra de asfalto em taquaralto em andamento 60%';
    const bairro = 'Taquaralto';
    const endereco = `${bairro}, Palmas - TO`;
    const fingerprint = createFingerprintHash({ titulo, bairro, endereco });

    mockedAxios.get.mockResolvedValue({
      data: `<a href="/n1">${titulo}</a>`,
      headers: { 'content-type': 'text/html' },
    } as any);

    const prismaMock = {
      obra: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'obra-existente',
            fingerprint,
            titulo,
            bairro,
            endereco,
            descricao: 'Descricao anterior sem url de fonte',
            percentualProgresso: 10,
            status: ObraStatus.EM_EXECUCAO,
            tipo: 'Asfaltamento',
          },
        ]),
        create: jest.fn().mockResolvedValue(undefined),
        update: jest.fn().mockResolvedValue(undefined),
      },
    };

    const service = new ObraSyncService(prismaMock as unknown as PrismaClient);
    const resultado = await service.syncNow('manual');

    expect(resultado.inserted).toBe(0);
    expect(resultado.updated).toBe(1);
    expect(prismaMock.obra.create).not.toHaveBeenCalled();
    expect(prismaMock.obra.update).toHaveBeenCalledTimes(1);

    const updateArgs = (prismaMock.obra.update as jest.Mock).mock.calls[0][0];
    expect(updateArgs.where.id).toBe('obra-existente');
    expect(updateArgs.data.fingerprint).toBe(fingerprint);
  });
});
