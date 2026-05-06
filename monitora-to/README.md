# Monitora TO - Plataforma de Controle Social

Uma aplicação completa para monitoramento de obras de infraestrutura e construção em Palmas, Tocantins. Permite que moradores acompanhem o progresso das obras, reportem problemas e façam sugestões.

## 📋 Índice

- [Estrutura do Projeto](#estrutura-do-projeto)
- [Tecnologias](#tecnologias)
- [Instalação e Setup](#instalação-e-setup)
- [Arquitetura](#arquitetura)
- [Como Usar](#como-usar)
- [Desenvolvimento](#desenvolvimento)

---

## 📁 Estrutura do Projeto

```
monitora-to/
├── backend/                           # API Node.js/TypeScript
│   ├── src/
│   │   ├── domain/                   # Camada de Domínio
│   │   │   ├── entities/            # Entidades principais
│   │   │   │   ├── Usuario.ts
│   │   │   │   ├── Obra.ts
│   │   │   │   ├── Denuncia.ts
│   │   │   │   └── Geolocation.ts
│   │   │   └── repositories/        # Interfaces de repositórios
│   │   ├── application/             # Camada de Aplicação
│   │   │   ├── useCases/           # Casos de uso (orquestração)
│   │   │   │   ├── CriarDenunciaUseCase.ts
│   │   │   │   └── ListarObrasProximasUseCase.ts
│   │   │   └── dtos/               # Data Transfer Objects
│   │   └── infrastructure/          # Camada de Infraestrutura
│   │       ├── http/               # Controllers HTTP
│   │       ├── persistence/        # Implementações de repositórios
│   │       └── config/             # Configurações
│   ├── tests/                       # Testes unitários
│   ├── prisma/
│   │   └── schema.prisma           # Schema do banco de dados
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── mobile/                           # App React Native
│   ├── src/
│   │   ├── models/                 # Modelos de dados
│   │   │   ├── Obra.ts
│   │   │   └── Denuncia.ts
│   │   ├── viewModels/            # Custom Hooks (MVVM)
│   │   │   ├── useObraViewModel.ts
│   │   │   └── useDenunciaViewModel.ts
│   │   ├── views/                 # Telas (componentes React)
│   │   │   ├── MapaObrasScreen.tsx
│   │   │   └── CriarDenunciaScreen.tsx
│   │   ├── services/              # Serviços (API client)
│   │   │   └── api.ts
│   │   ├── components/            # Componentes reutilizáveis
│   │   ├── utils/                 # Utilitários
│   │   └── App.tsx               # Ponto de entrada
│   ├── package.json
│   └── tsconfig.json
│
├── web/                              # App React (Vite)
├── scripts/                          # Scripts utilitários
├── docker-compose.yml                # Orquestração (Postgres + Redis + API)
└── .env.example                      # Variáveis do Docker Compose (exemplo)
```

---

## 🛠 Tecnologias

### Backend
- **Runtime:** Node.js 20+ com TypeScript
- **Framework:** Express (com estrutura limpa)
- **Banco de Dados:** PostgreSQL com PostGIS (geolocalização)
- **ORM:** Prisma
- **Validação:** Zod, class-validator
- **Cache:** Redis
- **Autenticação:** JWT
- **Testes:** Jest

### Mobile
- **Framework:** React Native com Expo
- **Linguagem:** TypeScript
- **Navigator:** React Navigation
- **Estado:** Custom Hooks (MVVM pattern)
- **HTTP Client:** Axios
- **Localização:** Expo Location
- **Mapas:** react-native-maps

### DevOps
- **Containerização:** Docker + Docker Compose
- **Banco:** PostgreSQL 15 + PostGIS
- **Cache:** Redis 7

---

## 🚀 Instalação e Setup

### Pré-requisitos
- Node.js 20+
- Docker e Docker Compose
- Git

### 1. Clone e Configure

```bash
cd monitora-to

# Copie o arquivo de ambiente
cp backend/.env.example backend/.env

# Configure as variáveis conforme necessário
nano backend/.env
```

### 2. Inicie a Infraestrutura

```bash
# Suba PostgreSQL, Redis e a API
docker compose up -d

# Verifique os logs
docker compose logs -f api

# (Primeira vez) aplique migrações e seed dentro do container da API
docker compose exec api npm run db:migrate
docker compose exec api npm run db:seed
```

### 3. Rodando Localmente (sem Docker)

> Para rodar **sem Docker**, você precisa ter **PostgreSQL (com PostGIS)** e **Redis** disponíveis localmente e configurar o `backend/.env` apontando para esses serviços.

**Backend:**
```bash
cd backend
npm install
npm run db:migrate  # Aplica migrações Prisma
npm run dev         # Inicia em http://localhost:3000
```

**Mobile:**
```bash
cd mobile
npm install
npm run dev       # Inicia Expo
# Use QR code para conectar no celular ou emulador
```

**Web:**
```bash
cd web
npm install
npm run dev       # Inicia em http://localhost:5173
```

---

## 🏛️ Arquitetura

### Padrões
- **Clean Architecture:** Separação em camadas (Domain, Application, Infrastructure)
- **SOLID:** Princípios de design
- **MVVM:** No mobile (Models, Views, ViewModels via hooks customizados)
- **Repository Pattern:** Abstração de dados
- **Use Cases:** Orquestração de negócio

### Camadas do Backend

```
┌─────────────────────────────────┐
│   HTTP Controllers              │ ← Requisições
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│      Use Cases (Application)    │ ← Lógica de negócio
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│      Domain (Entidades)         │ ← Regras de negócio
└──────────────┬──────────────────┘
               │
┌──────────────▼──────────────────┐
│  Repositories (Persistência)    │ ← Dados
└─────────────────────────────────┘
```

### Exemplo: UseCase CriarDenúncia

1. **Controller** recebe requisição HTTP
2. **UseCase** valida e orquestra a operação
3. **Entidades** aplicam lógica de negócio
4. **Repositories** persistem no banco

---

## 💻 Como Usar

### Backend API

#### Listar obras próximas
```bash
GET /api/obras/proximas?latitude=-10.2&longitude=-48.3&raio=10
```

**Resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "obra-1",
      "titulo": "Asfaltamento na ARSE 14",
      "bairro": "ARSE 14",
      "status": "EM_EXECUCAO",
      "percentualProgresso": 45,
      "localizacao": {
        "latitude": -10.21759,
        "longitude": -48.30251
      }
    }
  ],
  "total": 1
}
```

#### Criar denúncia
```bash
POST /api/denuncias
Content-Type: application/json

{
  "usuarioId": "user-123",
  "obraId": "obra-1",
  "titulo": "Obra atrasada",
  "descricao": "A obra deveria ter terminado há uma semana",
  "tipo": "ATRASO",
  "imagemUrl": "https://..."
}
```

### Mobile App

1. **Abrir app** → Requisita permissão de localização
2. **Explorar mapa** → Vê obras próximas em tempo real
3. **Filtrar** → Por distância, status ou bairro
4. **Denunciar** → Criar denúncia com foto
5. **Acompanhar** → Ver status das denúncias

---

## 🔧 Desenvolvimento

### Adicionar novo UseCase

1. **Criar em `src/application/useCases/`:**
```typescript
export class MeuNovoUseCaseUseCase {
  constructor(private repository: IMeuRepository) {}
  
  async execute(input: MeuInputDTO): Promise<MeuOutputDTO> {
    // Lógica aqui
  }
}
```

2. **Injetar em controller:**
```typescript
const meuUseCase = new MeuNovoUseCaseUseCase(repository);
```

### Adicionar nova View Mobile

1. **Criar em `src/views/MinhaNovaScreen.tsx`:**
```typescript
export function MinhaNovaScreen(): JSX.Element {
  const viewModel = useMeuViewModel();
  
  return (
    <View>
      {/* Renderização focada em UI */}
    </View>
  );
}
```

2. **Criar hook em `src/viewModels/useMeuViewModel.ts`:**
```typescript
export function useMeuViewModel() {
  // Estado e lógica aqui
  return { /* ... */ };
}
```

### Rodar Testes

```bash
cd backend

# Testes unitários
npm test

# Com cobertura
npm run test:cov

# Em modo watch
npm run test:watch
```

---

## 📍 Referências Geográficas de Palmas

Bairros inclusos:
- **ARSE 12, 14, 104 Sul**
- **Aureny III, IV**
- **Taquaralto**
- **Centro norte, sul**

Tipos de obras:
- Asfaltamento
- Drenagem
- Construção
- Iluminação
- Saneamento

---

## 📄 Licença

MIT

---

## 👥 Contribuindo

Sinta-se livre para abrir issues e PRs!

