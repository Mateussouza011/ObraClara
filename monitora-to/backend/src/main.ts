/**
 * Arquivo Principal - Application Server
 * Ponto de entrada da aplicação
 */

import 'express-async-errors';
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';

// Infrastructure
import { ObraRepository } from '@infrastructure/persistence/ObraRepository';
import { DenunciaRepository } from '@infrastructure/persistence/DenunciaRepository';
import { UsuarioRepository } from '@infrastructure/persistence/UsuarioRepository';
import { ObraController } from '@infrastructure/http/controllers/ObraController';
import { DenunciaController, LoginController, RegistroController } from '@infrastructure/http/controllers';
import { ObraSyncService } from '@infrastructure/services/ObraSyncService';

// UseCases
import { ListarObrasProximasUseCase, CriarDenunciaUseCase, LoginUseCase, RegistroUseCase } from '@application/useCases';

// ========== INICIALIZAÇÃO ==========

const app: Express = express();
const prisma = new PrismaClient();
let databaseReady = false;

// ========== MIDDLEWARE ==========

// Segurança
app.use(helmet());
app.use(cors());

// Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request Logger
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ========== CONFIGURAÇÃO DE DEPENDÊNCIAS ==========

// Repositories
const obraRepository = new ObraRepository(prisma);
const denunciaRepository = new DenunciaRepository(prisma);
const usuarioRepository = new UsuarioRepository(prisma);

// UseCases
const listarObrasProximasUseCase = new ListarObrasProximasUseCase(obraRepository);
const criarDenunciaUseCase = new CriarDenunciaUseCase(
  denunciaRepository,
  usuarioRepository,
  obraRepository,
);
const loginUseCase = new LoginUseCase(usuarioRepository);
const registroUseCase = new RegistroUseCase(usuarioRepository);

// Controllers
const obraController = new ObraController(listarObrasProximasUseCase, obraRepository);
const denunciaController = new DenunciaController(criarDenunciaUseCase);
const loginController = new LoginController(loginUseCase);
const registroController = new RegistroController(registroUseCase);
const obraSyncService = new ObraSyncService(prisma);

// ========== ROTAS ==========

app.use('/api', async (req: Request, res: Response, next: NextFunction) => {
  // Sempre serve dados ao vivo para obras (pesquisa online em tempo real)
  if (req.path === '/obras' || req.path === '/obras/proximas') {
    try {
      const page = parsePositiveInt(req.query.page as string, 1);
      const limit = parsePositiveInt(req.query.limit as string, 1000, 2000);
      const sortBy = parseSortBy(req.query.sortBy as string);
      const sortDirection = parseSortDirection(req.query.sortDirection as string);

      const latitude = parseOptionalFloat(req.query.latitude as string);
      const longitude = parseOptionalFloat(req.query.longitude as string);
      const raioKm = parseOptionalFloat((req.query.raioKm as string) || (req.query.raio as string));

      const live = await obraSyncService.listarObrasAoVivo({
        page,
        limit,
        sortBy,
        sortDirection,
        latitude,
        longitude,
        raioKm,
      });

      res.status(200).json({
        success: true,
        data: live.data,
        total: live.total,
        page,
        limit,
        totalPages: Math.ceil(live.total / limit),
        sortBy,
        sortDirection,
        message: 'Dados ao vivo pesquisados online em tempo real.',
      });
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao buscar dados ao vivo';
      res.status(502).json({
        success: false,
        error: message,
      });
      return;
    }
  }

  if (req.path.startsWith('/obras/')) {
    try {
      const live = await obraSyncService.listarObrasAoVivo({
        page: 1,
        limit: 500,
      });
      const obra = live.data.find((item) => item.id === req.path.split('/').pop());

      if (!obra) {
        res.status(404).json({ success: false, error: 'Obra não encontrada' });
        return;
      }

      res.status(200).json({ success: true, data: obra });
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao buscar obra ao vivo';
      res.status(502).json({ success: false, error: message });
      return;
    }
  }

  if (databaseReady) {
    next();
    return;
  }

  res.status(503).json({
    success: false,
    error: 'Banco de dados indisponivel. Configure DATABASE_URL.',
  });
});

// Health Check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    databaseReady,
  });
});

// Autenticação
app.post('/api/auth/login', (req, res) => loginController.handle(req, res));
app.post('/api/auth/registro', (req, res) => registroController.handle(req, res));

// Obras
app.get('/api/obras', (req, res) => obraController.listar(req, res));
app.get('/api/obras/proximas', (req, res) => obraController.listarProximas(req, res));
app.get('/api/obras/:id', (req, res) => obraController.buscarPorId(req, res));
app.post('/api/obras/sync', async (_req, res) => {
  try {
    const summary = await obraSyncService.syncNow('manual');
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao sincronizar obras';
    res.status(409).json({ success: false, error: message });
  }
});
app.get('/api/obras/sync/status', (_req, res) => {
  res.status(200).json({ success: true, data: obraSyncService.getStatus() });
});

// Denúncias
app.post('/api/denuncias', (req, res) => denunciaController.criar(req, res));
app.get('/api/denuncias/:id', (req, res) => denunciaController.buscarPorId(req, res));
app.patch('/api/denuncias/:id/status', (req, res) => denunciaController.atualizarStatus(req, res));

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada',
  });
});

// Error Handler
app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Erro não tratado:', error);

  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined,
  });
});

// ========== INICIALIZAÇÃO DO SERVIDOR ==========

const PORT = process.env.API_PORT || 3000;

async function bootstrap() {
  try {
    if (!process.env.DATABASE_URL) {
      console.warn('⚠ DATABASE_URL ausente: iniciando em modo degradado sem banco de dados.');
    } else {
      // Verificar conexão com BD
      await prisma.$connect();
      databaseReady = true;
      console.log('✓ Conectado ao banco de dados');

      try {
        const syncSummary = await obraSyncService.syncNow('startup');
        console.log('✓ Sincronização inicial de obras concluída', syncSummary);
      } catch (syncError) {
        const message = syncError instanceof Error ? syncError.message : 'falha desconhecida';
        console.warn(`⚠ Falha na sincronização inicial de obras: ${message}`);
      }

      obraSyncService.startPeriodicSync();
    }

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`✓ Servidor rodando em http://localhost:${PORT}`);
      console.log(`✓ Ambiente: ${process.env.NODE_ENV || 'development'}`);
      if (!databaseReady) {
        console.log('⚠ API ativa em modo degradado (sem banco de dados)');
      }
    });
  } catch (error) {
    console.error('✗ Falha ao conectar no banco de dados. Iniciando API em modo degradado:', error);

    app.listen(PORT, () => {
      console.log(`✓ Servidor rodando em http://localhost:${PORT}`);
      console.log(`✓ Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log('⚠ API ativa em modo degradado (sem banco de dados)');
    });
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM recebido, encerrando...');
  obraSyncService.stopPeriodicSync();
  if (databaseReady) {
    await prisma.$disconnect();
  }
  process.exit(0);
});

bootstrap();

export default app;

function parsePositiveInt(value: string | undefined, defaultValue: number, max?: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return defaultValue;
  if (max && parsed > max) return max;
  return parsed;
}

function parseOptionalFloat(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function parseSortBy(value: string | undefined): 'updatedAt' | 'createdAt' | 'percentualProgresso' | 'titulo' {
  if (
    value === 'updatedAt'
    || value === 'createdAt'
    || value === 'percentualProgresso'
    || value === 'titulo'
  ) {
    return value;
  }

  return 'updatedAt';
}

function parseSortDirection(value: string | undefined): 'asc' | 'desc' {
  return value === 'asc' ? 'asc' : 'desc';
}
