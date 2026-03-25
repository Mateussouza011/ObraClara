# 🚀 Quick Start - Monitora TO

## ⚡ Iniciar em 5 minutos

### 1. Clone e Configure
```bash
cd monitora-to
cp backend/.env.example backend/.env
```

### 2. Inicie os Serviços (Docker)
```bash
docker-compose up -d
```

**Aguarde 10-15 segundos para BD inicializar...**

### 3. Configure o Banco
```bash
docker-compose exec api npm run db:migrate
docker-compose exec api npm run db:seed
```

### 4. Teste a API
```bash
# Health check
curl http://localhost:3000/health

# Listar obras próximas
curl "http://localhost:3000/api/obras/proximas?latitude=-10.2&longitude=-48.3&raio=10"
```

### 5. Inicie o Mobile (em outro terminal)
```bash
cd mobile
npm install
npm run dev

# Escaneie o QR code com seu celular
```

---

## 📊 Anatomia do Projeto

### Backend - Clean Architecture

```
┌─────────────────────────────────────┐
│ HTTP Layer (Controllers)            │
│ POST /api/denuncias                 │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Application Layer (UseCases)        │
│ CriarDenunciaUseCase.execute()      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Domain Layer (Business Logic)       │
│ new Denuncia({...}).validar()       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Infrastructure (Persistence)        │
│ denunciaRepository.salvar(...)      │
└─────────────────────────────────────┘
```

### Mobile - MVVM Pattern

```
┌──────────────────────────────────┐
│ View (Screen)                    │
│ <MapaObrasScreen />              │
│                                  │
│ renders data from               │
└──────────────┬───────────────────┘
               │
               ▼
┌──────────────────────────────────┐
│ ViewModel (Custom Hook)          │
│ const vm = useObraViewModel()    │
│ - state management              │
│ - API calls                     │
│ - filtering logic               │
└──────────────┬───────────────────┘
               │ fetches
               ▼
┌──────────────────────────────────┐
│ Services (API Client)            │
│ obraApi.listarProximas()        │
└─────────────────────────────────┘
```

---

## 📂 Estrutura Completa

```
monitora-to/
│
├── 🐳 docker-compose.yml           # PostgreSQL + Redis + API
│
├── 📘 README.md                     # Documentação geral
├── 📕 DEVELOPMENT.md                # Guia de desenvolvimento
├── ✨ QUICKSTART.md                 # Este arquivo
│
├── ⚙️ backend/
│   ├── src/
│   │   ├── 🎯 domain/              # Regras de negócio
│   │   │   ├── entities/           # Obra, Usuario, Denuncia
│   │   │   └── repositories/       # Interfaces repos
│   │   │
│   │   ├── 📱 application/         # Orquestração
│   │   │   ├── useCases/           # CriarDenuncia, ListarObras
│   │   │   └── dtos/               # Transfer objects
│   │   │
│   │   └── 🔧 infrastructure/      # Implementação técnica
│   │       ├── http/               # Controllers
│   │       └── persistence/        # Repos + Prisma
│   │
│   ├── tests/                       # Testes Jest
│   ├── prisma/schema.prisma         # Schema BD
│   ├── package.json
│   └── Dockerfile
│
└── 📱 mobile/
    ├── src/
    │   ├── 📦 models/              # Tipos (Obra, Denuncia)
    │   ├── 🧠 viewModels/          # Custom Hooks
    │   ├── 🎨 views/               # Screens/Telas
    │   ├── 📡 services/            # API client
    │   ├── 🧩 components/          # Componentes reutilizáveis
    │   └── 🛠️ utils/               # Helpers
    │
    ├── App.tsx                      # Entrada + Navegação
    ├── package.json
    └── tsconfig.json
```

---

## 🧪 Rodar Testes

```bash
cd backend

# Rodar testes
npm test

# Com cobertura
npm run test:cov

# Watch mode
npm run test:watch
```

**Resultado esperado:**
```
✓ CriarDenunciaUseCase
  ✓ deve criar denúncia com dados válidos
  ✓ deve rejeitar usuário inexistente
  ✓ deve rejeitar obra inexistente
  ✓ ... (4 testes)

Test Suites: 1 passed
Tests: 7 passed
```

---

## 🔗 APIs Principais

### Obras
```bash
# Listar próximas (10km)
GET /api/obras/proximas?latitude=-10.2&longitude=-48.3&raio=10

# Buscar por ID
GET /api/obras/{id}

# Listar todas
GET /api/obras
```

### Denúncias
```bash
# Criar
POST /api/denuncias
{
  "usuarioId": "user-1",
  "obraId": "obra-1",
  "titulo": "Obra parada",
  "descricao": "Sem atividade há dias",
  "tipo": "ATRASO"
}

# Listar por ID
GET /api/denuncias/{id}

# Atualizar status
PATCH /api/denuncias/{id}/status
{ "novoStatus": "EM_ANALISE" }
```

---

## 📍 Dados de Exemplo - Palmas

```typescript
// Bairros
"ARSE 12", "ARSE 14", "104 Sul", "Aureny III", "Aureny IV", "Taquaralto"

// Tipos de Obra
"Asfaltamento", "Drenagem", "Construção", "Iluminação", "Saneamento"

// Tipos de Denúncia
"ATRASO", "QUALIDADE", "SEGURANCA", "OUTRO"

// Status
"PLANEJADA", "EM_EXECUCAO", "PAUSADA", "CONCLUIDA"
```

---

## 🆘 Troubleshooting

### "Erro de conexão BD"
```bash
# Verifique se PostgreSQL iniciou
docker-compose logs postgres

# Aguarde 15s e tente migração novamente
docker-compose exec api npm run db:migrate
```

### "Port 3000 já em uso"
```bash
# Mude a porta em .env
API_PORT=3001

# Ou mate o processo
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### "Imagem não encontrada"
```bash
# Rebuildar containers
docker-compose build --no-cache
docker-compose up -d
```

---

## 📚 Próximos Passos

1. **Implementar autenticação** → JWT com UsuarioRepository
2. **Upload de imagens** → AWS S3 ou cloudinary
3. **Real-time** → WebSockets para notificações
4. **Offline-first** → Expo SQLite + sync
5. **Notificações push** → Firebase Cloud Messaging

---

## 💡 Dicas

- Use VS Code + REST Client extension para testar APIs
- Mantenhha o watch dos testes: `npm run test:watch`
- Use `prettier`: `npm run lint:fix`
- Commit com mensagens descritivas

---

## 🎓 Conceitos

- ✅ Clean Architecture
- ✅ SOLID Principles
- ✅ MVVM Pattern
- ✅ Domain-Driven Design
- ✅ Test-Driven Development
- ✅ Value Objects
- ✅ Repository Pattern

---

## 📞 Suporte

Documento de ajuda: ver [DEVELOPMENT.md](./DEVELOPMENT.md)

