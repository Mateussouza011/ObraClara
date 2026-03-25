# 📁 Estrutura Completa do Projeto Monitora TO

## Visualização em Árvore

```
monitora-to/
│
├── 📄 README.md                         # Documentação principal
├── 📄 QUICKSTART.md                     # Início rápido
├── 📄 DEVELOPMENT.md                    # Guia de desenvolvimento
├── 📄 .gitignore                        # Git ignore
├── 🐳 docker-compose.yml                # Orquestração serviços
│
├── ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│   BACKEND - Node.js + TypeScript
│   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│
├── backend/
│   ├── 📄 package.json                  # Dependências
│   ├── 📄 tsconfig.json                 # Configuração TypeScript
│   ├── 📄 jest.config.js                # Configuração Jest
│   ├── 📄 .eslintrc.js                  # Configuração ESLint
│   ├── 📄 .env.example                  # Variáveis de exemplo
│   ├── 🐳 Dockerfile                    # Imagem Docker
│   │
│   ├── src/
│   │   ├── 🎯 main.ts                   # Ponto de entrada
│   │   │
│   │   ├── 🏛️ domain/                   # DOMAIN LAYER
│   │   │   │
│   │   │   ├── entities/
│   │   │   │   ├── Usuario.ts           # Entidade usuário
│   │   │   │   ├── Obra.ts              # Entidade obra
│   │   │   │   ├── Denuncia.ts          # Entidade denúncia
│   │   │   │   ├── Geolocation.ts       # Value Object
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   └── repositories/
│   │   │       └── index.ts             # Interfaces de repos
│   │   │
│   │   ├── 📱 application/              # APPLICATION LAYER
│   │   │   │
│   │   │   ├── useCases/
│   │   │   │   ├── CriarDenunciaUseCase.ts
│   │   │   │   ├── ListarObrasProximasUseCase.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   └── dtos/
│   │   │       └── index.ts             # All DTOs
│   │   │
│   │   ├── 🔧 infrastructure/           # INFRASTRUCTURE LAYER
│   │   │   │
│   │   │   ├── http/
│   │   │   │   └── controllers/
│   │   │   │       ├── DenunciaController.ts
│   │   │   │       ├── ObraController.ts
│   │   │   │       └── index.ts
│   │   │   │
│   │   │   ├── persistence/
│   │   │   │   ├── ObraRepository.ts    # Implementação Prisma
│   │   │   │   └── DenunciaRepository.ts
│   │   │   │
│   │   │   └── config/
│   │   │       └── database.ts          # Conexão BD
│   │   │
│   │   └── 🔄 shared/                   # CÓDIGO COMPARTILHADO
│   │       └── (não implementado)
│   │
│   ├── tests/
│   │   └── application/
│   │       └── useCases/
│   │           └── CriarDenunciaUseCase.spec.ts
│   │
│   └── prisma/
│       ├── schema.prisma                # Schema banco
│       ├── seed.ts                      # Seed data
│       └── migrations/                  # Migrações DB
│
│
├── ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│   MOBILE - React Native + TypeScript
│   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
│
├── mobile/
│   ├── 📄 package.json                  # Dependências
│   ├── 📄 tsconfig.json                 # Configuração TS
│   ├── 📄 app.json                      # Config Expo (não criado)
│   │
│   └── src/
│       ├── 📱 App.tsx                   # Entrada + Navegação
│       │
│       ├── 📦 models/                   # MODELOS
│       │   ├── Obra.ts                  # Interface Obra
│       │   ├── Denuncia.ts              # Interface Denuncia
│       │   └── index.ts
│       │
│       ├── 🧠 viewModels/               # VIEW MODELS (Hooks)
│       │   ├── useObraViewModel.ts      # Lógica obras
│       │   ├── useDenunciaViewModel.ts  # Lógica denúncias
│       │   └── index.ts
│       │
│       ├── 🎨 views/                    # VIEWS (Screens)
│       │   ├── MapaObrasScreen.tsx      # Tela mapa
│       │   ├── CriarDenunciaScreen.tsx  # Tela denúncia
│       │   └── (Outras telas em progress)
│       │
│       ├── 📡 services/                 # SERVIÇOS
│       │   ├── api.ts                   # Cliente HTTP
│       │   └── (Outros services)
│       │
│       ├── 🧩 components/               # COMPONENTES
│       │   └── (Componentes reutilizáveis)
│       │
│       └── 🛠️ utils/                    # UTILITÁRIOS
│           └── formatters.ts            # Helpers
```

---

## 📊 Resumo Estatístico

### Backend
| Camada | Arquivos | Responsabilidade |
|--------|----------|------------------|
| **Domain** | 5 | Regras de negócio puras |
| **Application** | 5 | Orquestração de UseCases |
| **Infrastructure** | 5 | Implementação técnica |
| **Tests** | 1 | Testes unitários |
| **Config** | 5+ | Configurações |
| **Total** | ~21+ | ✅ |

### Mobile
| Pasta | Arquivos | Responsabilidade |
|-------|----------|------------------|
| **Models** | 2 | Tipos e interfaces |
| **ViewModels** | 2 | Lógica (hooks customizados) |
| **Views** | 2+ | Renderização (telas) |
| **Services** | 1 | API client |
| **Utils** | 1 | Helpers e formatadores |
| **Components** | ? | Componentes reutilizáveis |
| **Total** | ~8+ | ✅ |

---

## 🔄 Fluxo de Dados

### Backend: Criar Denúncia

```
HTTP Request
    ↓
DenunciaController.criar()
    ↓
CriarDenunciaUseCase.execute()
    ↓
Denuncia (entidade) validações
    ↓
IDenunciaRepository.salvar()
    ↓
DenunciaRepository (Prisma)
    ↓
PostgreSQL
    ↓
HTTP Response
```

### Mobile: Listar Obras Próximas

```
useObraViewModel()
    ├─ estado inicial
    ├─ obterLocalizacao()
    │   └─ expo-location
    │
    └─ carregarObrasProximas()
        └─ obraApi.listarProximas()
            └─ axios GET request
                └─ API backend
                    └─ setObras()
                        └─ React re-render
                            └─ MapaObrasScreen renderiza
```

---

## 📋 Checklist de Implementação

### ✅ Concluído
- [x] Estrutura de pastas Clean Architecture
- [x] Entidades de domínio (Usuario, Obra, Denuncia)
- [x] Value Objects (Geolocation)
- [x] Repositórios interfaces
- [x] Implementação Prisma (ORA)
- [x] UseCases: CriarDenuncia, ListarObrasProximas
- [x] DTOs
- [x] Controllers HTTP
- [x] Testes unitários (exemplo)
- [x] Modelos mobile
- [x] ViewModels (hooks customizados)
- [x] Screens (MapaObras, CriarDenuncia)
- [x] Cliente API (axios)
- [x] Documentação

### 📝 Próximas Etapas
- [ ] Implementar UsuarioRepository
- [ ] Autenticação JWT
- [ ] Mais UseCases
- [ ] Componentes mobile adicionais
- [ ] Upload de imagens
- [ ] Real-time socket.io
- [ ] Notificações push
- [ ] Testes E2E

---

## 🎯 Principais Conceitos Implementados

### ✨ Clean Architecture
- Separação clara de camadas
- Dependências apontam para dentro
- Lógica de negócio isolada

### 🔷 Padrões SOLID
- **S**ingle Responsibility: Controllers, UseCases, Repositories
- **O**pen/Closed: Interfaces de repositórios permitem extensão
- **L**iskov: Use abstrações (IDenunciaRepository)
- **I**nterface Segregation: DTOs específicos por caso de uso
- **D**ependency Inversion: Injeção de dependências

### 📱 MVVM Mobile
- **Models:** Tipos TypeScript simples
- **ViewModels:** Custom hooks gerenciam estado
- **Views:** Componentes focam em renderização

### 🧪 Testabilidade
- Código desacoplado
- Fácil de mockar
- Exemplo de teste incluído

---

## 🚀 Como Usar Esta Estrutura

1. **Para Backend:** Adicione novo UseCase → Controller → Rota
2. **Para Mobile:** Novo ViewModel (hook) → View (screen) → Navegação
3. **Para DB:** Atualize Prisma schema → Crie migração → Seed

---

## 📞 Referências Rápidas

- **DB Schema:** `backend/prisma/schema.prisma`
- **Modelos API:** `backend/src/application/dtos/`
- **Exemplo UseCase:** `backend/src/application/useCases/CriarDenunciaUseCase.ts`
- **Exemplo Tela:** `mobile/src/views/MapaObrasScreen.tsx`
- **Exemplo Hook:** `mobile/src/viewModels/useObraViewModel.ts`

