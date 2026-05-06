# 🗺️ MAPA MENTAL - Monitora TO

## 🎯 VISÃO GERAL

```
┌─────────────────────────────────────────────────────┐
│          PLATAFORMA DE CONTROLE SOCIAL              │
│    Monitoramento de Obras em Palmas, Tocantins     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  📱 APPS MOBILE              ⚙️ BACKEND API         │
│  (React Native)              (Node.js + TS)        │
│  ├─ Mapa de Obras           ├─ Clean Architecture │
│  ├─ Criar Denúncias         ├─ SOLID Principles   │
│  ├─ Histórico               └─ Testes Jest        │
│  └─ Perfil do Usuário                             │
│                                                     │
│  🗄️ BANCO DE DADOS                                 │
│  └─ PostgreSQL + PostGIS                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 📂 ESTRUTURA

```
monitora-to/
│
├── 🐳 ORQUESTRAÇÃO
│   └── docker-compose.yml ............ PostgreSQL + Redis + API
│
├── 📘 DOCUMENTAÇÃO
│   ├── README.md .................... Visão geral
│   ├── QUICKSTART.md ................ Início rápido ⭐
│   ├── DEVELOPMENT.md ............... Padrões de código
│   ├── ESTRUTURA.md ................. Árvore de pastas
│   ├── EXEMPLOS.md .................. Código comentado
│   ├── INDEX.md ..................... Este mapa
│   └── MAPA_MENTAL.md ............... (este arquivo)
│
├── 🔲 BACKEND
│   │
│   ├── src/
│   │   ├── 🎯 domain/           [REGRAS DE NEGÓCIO]
│   │   │   ├── entities/        Usuario, Obra, Denuncia
│   │   │   └── repositories/    Interfaces (abstração)
│   │   │
│   │   ├── 📱 application/      [ORQUESTRAÇÃO]
│   │   │   ├── useCases/        CriarDenuncia, ListarObras
│   │   │   └── dtos/            Transfer objects
│   │   │
│   │   └── 🔧 infrastructure/   [IMPLEMENTAÇÃO]
│   │       ├── http/            Controllers
│   │       └── persistence/     Prisma
│   │
│   ├── tests/
│   │   └── .spec.ts ................. Jest tests
│   │
│   ├── prisma/
│   │   ├── schema.prisma ............ DB schema
│   │   └── seed.ts .................. Dados iniciais
│   │
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
└── 📱 MOBILE
    │
    ├── src/
    │   ├── 📦 models/          [TIPOS]
    │   │   ├── Obra.ts
    │   │   └── Denuncia.ts
    │   │
    │   ├── 🧠 viewModels/      [LÓGICA - Hooks Custom]
    │   │   ├── useObraViewModel.ts
    │   │   └── useDenunciaViewModel.ts
    │   │
    │   ├── 🎨 views/           [RENDERIZAÇÃO - Screens]
    │   │   ├── MapaObrasScreen.tsx
    │   │   └── CriarDenunciaScreen.tsx
    │   │
    │   ├── 📡 services/        [API CLIENT]
    │   │   └── api.ts
    │   │
    │   ├── 🧩 components/      [COMPONENTES REUTILIZÁVEIS]
    │   │
    │   ├── 🛠️ utils/           [HELPERS]
    │   │   └── formatters.ts
    │   │
    │   └── 📱 App.tsx          [NAVEGAÇÃO PRINCIPAL]
    │
    ├── package.json
    ├── tsconfig.json
    └── app.json
```

---

## 🔄 FLUXOS

### ➡️ Usuário abre app e vê mapa

```
┌──────────────────────────────────────────────────┐
│ MapaObrasScreen renderiza                        │
└────────────────────┬─────────────────────────────┘
                     │ chamada
                     ▼
         useObraViewModel() ← Custom Hook
                 │
             pede permissão
                 │
                 ▼
         Location.getCurrentPosition()
                 │
          obtém coordenadas
                 │
                 ▼
         carregarObrasProximas(lat, lon)
                 │
                 ▼
         obraApi.listarProximas()
                 │
                 ▼
    GET /api/obras/proximas?lat=X&lon=Y
                 │
                 ▼
    ListarObrasProximasUseCase.execute()
                 │
                 ▼
    ObraRepository.buscarProximas()
                 │
                 ▼
    SELECT * FROM obras WHERE ...
                 │
                 ▼
         [Obra1, Obra2, Obra3]
                 │
                 ▼
         MapView renderiza Markers
```

---

## 🔴 Usuário reporta problema

```
┌──────────────────────────────────────────────────┐
│ CriarDenunciaScreen (usuário preenche form)     │
└────────────────┬─────────────────────────────────┘
                 │ clica "Enviar"
                 ▼
      useDenunciaViewModel()
          criarDenuncia(input)
                 │
                 ▼
       denunciaApi.criar({...})
                 │
                 ▼
       POST /api/denuncias
                 │
                 ▼
       DenunciaController
                 │
                 ▼
    CriarDenunciaUseCase.execute()
                 │
     validações + criar entidade
     Denuncia { titulo, desc, tipo... }
                 │
                 ▼
    DenunciaRepository.salvar()
                 │
                 ▼
    INSERT INTO denuncias
                 │
                 ▼
    201 Created ✅
        + data
                 │
                 ▼
    Alert de sucesso
    Volta ao mapa
```

---

## 🎯 ARQUITETURA BACKEND

```
┌─────────────────────────────────┐
│    HTTP Request from Mobile     │
└────────────────┬────────────────┘
                 │
                 ▼
    ┌──────────────────────────────┐
    │   🌐 HTTP Controller         │
    │   (POST /api/denuncias)      │
    │   ✓ Recebe dados             │
    │   ✓ Faz parsing              │
    │   ✓ Chama UseCase            │
    └────────────┬─────────────────┘
                 │ input: DTO
                 ▼
    ┌──────────────────────────────┐
    │  🧠 UseCase                  │
    │  CriarDenunciaUseCase        │
    │  ✓ Valida entrada            │
    │  ✓ Verifica pré-requisitos   │
    │  ✓ Orquestra operação        │
    │  ✓ Aplica lógica negócio     │
    └────────────┬─────────────────┘
                 │ entidade Denuncia
                 ▼
    ┌──────────────────────────────┐
    │  🎯 Domain (Entidade)        │
    │  class Denuncia              │
    │  ✓ Validações               │
    │  ✓ Mutações seguras         │
    │  ✓ Rules of business logic  │
    │  ✓ Value Objects            │
    └────────────┬─────────────────┘
                 │ denuncia validada
                 ▼
    ┌──────────────────────────────┐
    │  💾 Repository               │
    │  DenunciaRepository          │
    │  ✓ Persiste no DB           │
    │  ✓ Implementa Prisma        │
    │  ✓ Transações               │
    └────────────┬─────────────────┘
                 │
                 ▼
    ┌──────────────────────────────┐
    │  🗄️  PostgreSQL              │
    │  INSERT INTO denuncias ...   │
    └────────────┬─────────────────┘
                 │
                 ▼
    ┌──────────────────────────────┐
    │  HTTP Response               │
    │  201 Created                 │
    │  { success, data, message }  │
    └──────────────────────────────┘
```

---

## 📱 MVVM PATTERN (Mobile)

```
┌─────────────────────────────────┐
│   🎨 VIEW (Screen)              │
│   ┌───────────────────────┐    │
│   │ MapaObrasScreen.tsx   │    │
│   │ - Renderiza JSX       │    │
│   │ - Lê data do hook     │    │
│   │ - Chama callbacks     │    │
│   └───────────────────────┘    │
│           △                     │
│           │ usa                │
│           │                    │
└───────────┼────────────────────┘
            │
    ┌───────▼───────┐
    │  🧠 VIEW MODEL │
    │ (Custom Hook) │
    │ useObraVM()   │
    │ ─────────────│
    │ State:       │
    │ • obras[]    │
    │ • carrégnd   │
    │ • erro       │
    │             │
    │ Actions:    │
    │ • carregar()│
    │ • filtrar() │
    │ • ordenar() │
    └───────┬──────┘
            │
            ▼
    ┌─────────────────┐
    │  📦 MODEL       │
    │ interface Obra  │
    │ {               │
    │  id: string     │
    │  titulo: str    │
    │  status: enum   │
    │  ...            │
    │ }               │
    │                 │
    │ + helpers:      │
    │ • estaAtrasada()│
    │ • diasRest()    │
    └────────────────┘
            │
            ▼
    ┌──────────────────┐
    │  📡 SERVICE      │
    │ obraApi          │
    │ • listarTodas()  │
    │ • listarProx()   │
    │ • buscarById()   │
    └──────────────────┘
```

---

## 🧪 TESTES

```
┌────────────────────────────────────┐
│  Teste Jest (.spec.ts)             │
└────────────────┬───────────────────┘
                 │
    ┌────────────▼────────────┐
    │ describe('UseCase') {   │
    │  it('should...') {      │
    │    // Arrange: setup    │
    │    // Act: executar     │
    │    // Assert: verificar │
    │  }                       │
    │ }                        │
    └────────────┬────────────┘
                 │
        ┌────────▼────────┐
        │  Mock           │
        │  Repositories   │
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │  Rodar teste    │
        │  npm test       │
        └────────┬────────┘
                 │
        ✅ PASSOU
        ├─ Regresses bloqueadas
        ├─ Código confiável
        └─ Refatoração segura
```

---

## 🚀 DEPLOYMENT

```
┌────────────────────────────────────────┐
│  Código Local                          │
│  git push origin main                  │
└────────────┬───────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│  GitHub Repository                     │
│  Triggers CI/CD                        │
└────────────┬───────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│  Docker Build                          │
│  docker build -t app:latest .          │
└────────────┬───────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│  Deploy (Docker Compose)               │
│  docker compose up -d                  │
└────────────┬───────────────────────────┘
             │
             ▼
┌────────────────────────────────────────┐
│  ✅ Rodando em Produção                │
│  http://api.monitorapalmas.com:3000    │
└────────────────────────────────────────┘
```

---

## 📊 COMPARAÇÃO ARQUITETURA

| Aspecto | Backend | Mobile |
|---------|---------|--------|
| **Padrão** | Clean Architecture | MVVM |
| **Camadas** | 3 (Domain, Apps, Infra) | 3 (Model, VM, View) |
| **Responsabilidade** | Separada/clara | Separada/clara |
| **Testabilidade** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Dependencies** | Injeção | Context/Props |
| **Estado** | BD (Postgres) | Hook (useState) |
| **Validação** | Entity + DTO | Model + Hook |

---

## 🎓 CONCEITOS-CHAVE

```
┌─ SOLID
│  ├─ Single Responsibility
│  ├─ Open/Closed
│  ├─ Liskov Substitution
│  ├─ Interface Segregation
│  └─ Dependency Inversion
│
├─ CLEAN CODE
│  ├─ Nomes descritivos
│  ├─ Funções pequenas
│  ├─ Comments explicativos
│  └─ DRY principle
│
├─ DESIGN PATTERNS
│  ├─ Repository
│  ├─ Value Object
│  ├─ UseCase
│  └─ DTO
│
└─ TESTING
   ├─ Unit Tests
   ├─ Integration Tests
   └─ E2E Tests
```

---

## 📈 FUNCIONALIDADES

```
✅ Mapas com geolocalização (PostGIS)
✅ Listagem de obras próximas
✅ Criar denúncias com foto
✅ Aval Acompanhamento de status
✅ Timeline de atualizações
✅ Filtros por status/bairro
✅ Dados de exemplo Palmas
✅ Testes unitários
✅ Clean Code
✅ Documentação completa

⏳ Em progresso:
  ⏳ Autenticação JWT
  ⏳ Upload de imagens
  ⏳ Notificações push
  ⏳ Relatórios
```

---

## 🚀 PRÓXIMOS PASSOS

1. **Ler documentação**
   - [QUICKSTART.md](./QUICKSTART.md) (5 min)
   - [DEVELOPMENT.md](./DEVELOPMENT.md) (30 min)

2. **Rodar localmente**
        - `docker compose up -d`
   - `npm run dev` (mobile)

3. **Explorar código**
   - Abrir um UseCase
   - Abrir uma Screen
   - Entender fluxo

4. **Adicionar feature**
   - Seguir padrões
   - Escrever testes
   - Fazer PR

---

## 🧠 Mnemônico RÁPIDO

```
BACKEND = CDD
  C = Clean Architecture
  D = Domain-Driven
  D = Dependency Injection

MOBILE = MVVM
  M = Models (tipos)
  V = Views (screens)
  V = ViewModels (hooks)
  M = Services/API calls

ESTRUTURA = 3 LAYERS
  1. Domain (regras)
  2. Application (orquestra)
  3. Infrastructure (técnica)

FLUXO = DDP
  D = Data (entrada)
  D = Domain (lógica)
  P = Persist (salva)
```

---

## 📞 Onde Encontrar?

| Preciso... | Vou em... |
|-----------|----------|
| Iniciar rápido | [QUICKSTART.md](./QUICKSTART.md) |
| Ver pastas | [ESTRUTURA.md](./ESTRUTURA.md) |
| Aprender padrões | [DEVELOPMENT.md](./DEVELOPMENT.md) |
| Ver código | [EXEMPLOS.md](./EXEMPLOS.md) |
| Tudo mapeado | [INDEX.md](./INDEX.md) |
| TL;DR com gráficos | Este arquivo 👈 |

---

**Status:** ✅ Pronto para desenvolver
**Versão:** 1.0.0
**Data:** 25/03/2026

