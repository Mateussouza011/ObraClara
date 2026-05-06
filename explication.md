# 📊 Explicação Completa: Arquitetura e Fluxo de Dados do Monitora TO

## 🎯 Visão Geral

O **Monitora TO** é uma plataforma de controle social que permite aos cidadãos monitorar obras de infraestrutura no Tocantins. A aplicação funciona em três camadas principais:

1. **Backend** (Node.js + Express + TypeScript)
2. **Frontend Web** (React + Vite)
3. **Frontend Mobile** (React Native + Expo)

---

## 🏛️ Arquitetura da Aplicação

### Backend: Clean Architecture

```
Backend/
├── domain/                    # Regras de negócio (Entidades e Interfaces)
│   ├── entities/             # Denuncia.ts, Obra.ts, Usuario.ts, Geolocation.ts
│   └── repositories/         # Contratos (interfaces) dos repositórios
│
├── application/              # Orquestração e Casos de Uso
│   ├── dtos/                # Data Transfer Objects (Dados entre camadas)
│   └── useCases/            # ListarObrasProximasUseCase, CriarDenunciaUseCase, etc
│
└── infrastructure/           # Implementação técnica
    ├── persistence/         # ObraRepository, DenunciaRepository (Conexão com BD)
    ├── http/               # Controllers e Rotas HTTP
    └── services/           # ObraSyncService (Sincronização externa)
```

---

## 📡 Fluxo de Dados: Onde Vêm os Dados

### 1️⃣ **Obras (Dados em Tempo Real)**

#### Origem dos Dados:
- **Fonte Principal:** Portal Oficial `ObrasGov` (Governo Federal)
- **URL:** `https://obrasgov.sistema.gov.br/cipi-backend/api`
- **Filtro:** Tocantins (UF ID: 17), Status "Em Execução" (Situação ID: 3)

#### Fluxo de Sincronização:

```
┌─────────────────────────────┐
│  Portal ObrasGov (Governo)  │ ← Fonte oficial de dados das obras
└──────────────┬──────────────┘
               │ (HTTPS Request)
               ▼
┌─────────────────────────────────────────┐
│     ObraSyncService (Backend)           │ ← Serviço que busca dados
│  • Cache de 5 minutos                   │
│  • Retry automático (até 3 tentativas)  │
│  • Extrai coordenadas (WKT POINT)       │
└──────────────┬──────────────────────────┘
               │ (Parsing e Transformação)
               ▼
┌──────────────────────────────┐
│   PostgreSQL + PostGIS       │ ← Armazena todas as obras
│   (Tabela: obras)            │
└──────────────┬───────────────┘
               │ (SELECT)
               ▼
┌─────────────────────────────┐
│  ListarObrasProximasUseCase │ ← Filtra por localização do usuário
│  • Por latitude/longitude   │
│  • Por raio em KM           │
└──────────────┬──────────────┘
               │ (JSON)
               ▼
┌──────────────────────────┐
│   Frontend (Web/Mobile)  │ ← Recebe as obras formatadas
│   API: GET /api/obras    │
└──────────────────────────┘
```

#### Dados de Uma Obra:
```json
{
  "id": "obra-001",
  "titulo": "Rodovia TO-010: Asfaltamento",
  "descricao": "Asfaltamento de 50 km da rodovia estadual",
  "tipo": "Asfaltamento",
  "latitude": -10.2,
  "longitude": -48.3,
  "endereco": "Rodovia TO-010",
  "bairro": "Zona Rural",
  "status": "EM_EXECUCAO",
  "esfera": "Estadual",
  "fonteUrl": "https://obrasgov.sistema.gov.br/...",
  "dataInicio": "2025-01-15",
  "dataFimPrevista": "2026-12-31",
  "valorInvestimento": 5000000,
  "executor": "Governo do Estado do Tocantins"
}
```

---

### 2️⃣ **Denúncias (Dados Locais)**

#### Origem dos Dados:
- **Fonte:** Criadas pelos usuários da plataforma
- **Armazenamento:** PostgreSQL (Tabela: denuncias)
- **Autenticação:** Usuário autenticado no sistema

#### Fluxo de Criação de Denúncia:

```
┌────────────────────────────────────────────────┐
│  Usuário no Frontend (Web/Mobile)              │
│  • Seleciona obra do mapa                      │
│  • Clica em "Criar Denúncia"                   │
└──────────────┬─────────────────────────────────┘
               │ (Preenche formulário)
               ▼
┌────────────────────────────────────────────────┐
│  useDenunciaViewModel (Hook do Frontend)       │
│  • Valida campos (título, descrição, tipo)     │
│  • Prepara DTO para envio                      │
└──────────────┬─────────────────────────────────┘
               │ (POST Request)
               ▼
┌────────────────────────────────────────────────┐
│  DenunciaController (Backend)                  │
│  POST /api/denuncias                           │
└──────────────┬─────────────────────────────────┘
               │ (Passa para useCase)
               ▼
┌────────────────────────────────────────────────┐
│  CriarDenunciaUseCase (Camada de Negócio)      │
│  • Valida usuário existe                       │
│  • Valida obra existe                          │
│  • Cria entidade Denuncia                      │
└──────────────┬─────────────────────────────────┘
               │ (Salva no BD)
               ▼
┌────────────────────────────────────────────────┐
│  DenunciaRepository (Persiste no PostgreSQL)   │
│  INSERT INTO denuncias (...)                   │
└──────────────┬─────────────────────────────────┘
               │ (Retorna denúncia criada)
               ▼
┌────────────────────────────────────────────────┐
│  Frontend recebe confirmação                   │
│  • Mostra mensagem de sucesso                  │
│  • Denúncia agora aparece no sistema           │
└────────────────────────────────────────────────┘
```

#### Dados de Uma Denúncia:
```json
{
  "id": "denuncia-001",
  "usuarioId": "user-123",
  "obraId": "obra-001",
  "titulo": "Obra parada há 2 semanas",
  "descricao": "Nenhum trabalhador no local desde o dia 15",
  "tipo": "ATRASO",
  "status": "ABERTA",
  "createdAt": "2026-05-06T10:30:00Z",
  "updatedAt": "2026-05-06T10:30:00Z"
}
```

---

### 3️⃣ **Canais de Denúncia (Dados Estáticos)**

#### Origem dos Dados:
- **Fonte:** Configuração interna da aplicação (Frontend)
- **Arquivo:** `web/src/models/CanaisDenuncia.ts`
- **Tipo:** Canais oficiais de cada esfera governamental

#### Categorias:
- **Federal:** Canais federais (Ministério Público Federal, etc)
- **Estadual:** Canais estaduais do Tocantins
- **Municipal:** Canais das prefeituras por cidade

---

## 🗺️ Fluxo de Navegação: Para Onde Redireciona

### Estrutura de Roteamento (Frontend Web)

```
App.tsx (BrowserRouter com React Router)
│
├─ / (HOME)
│   └─ MapPage
│       ├─ useObraViewModel (Gerencia estado das obras)
│       ├─ MapComponent (Exibe mapa com marcadores)
│       ├─ ObraCard (Card com detalhes da obra)
│       ├─ Filtros (Raio, Status, Esfera, Busca por nome)
│       └─ Links para:
│           ├─ /denuncias (Botão "Canais de Denúncia")
│           └─ Popup de criar denúncia (não muda rota)
│
└─ /denuncias
    └─ DenunciasPage
        ├─ Seletor de Esfera Governamental
        ├─ Seletor de Cidade (se Municipal)
        └─ Cards com Canais Oficiais
            └─ Links externos (target="_blank")
                ├─ Ouvidoria do Governo Federal
                ├─ Ouvidoria do Governo Estadual
                ├─ Portal da Prefeitura (por cidade)
                └─ Ministério Público Estadual
```

### Diagrama de Navegação:

```
┌──────────────────────────────────────────┐
│  Início: http://localhost:5173/          │
│  MapPage (Mapa com obras próximas)       │
└──────────┬───────────────────────────────┘
           │
           ├─ Clica em obra no mapa
           │  └─ Abre popup com detalhes
           │     └─ Botão "Criar Denúncia"
           │        └─ Modal com formulário (sem mudança de rota)
           │           └─ Envia para API backend
           │              └─ Salva no BD
           │
           ├─ Clica em "Canais de Denúncia"
           │  └─ Navega para /denuncias
           │     └─ DenunciasPage
           │        ├─ Seleciona esfera (Federal, Estadual, Municipal)
           │        ├─ Se Municipal: Seleciona cidade
           │        └─ Exibe canais oficiais
           │           └─ Clica em "Acessar Canal"
           │              └─ Abre link externo em nova aba
           │                 └─ Usuário faz denúncia no site oficial
           │
           └─ Filtros e buscas
              └─ Atualizam estado local (sem mudança de rota)
                 ├─ Slider de raio de busca
                 ├─ Filtro por status
                 ├─ Filtro por esfera
                 └─ Busca por nome/bairro
```

---

## 🔄 Fluxo Específico de Uso: Cenários Práticos

### 📍 Cenário 1: Usuário Quer Monitorar Obras Próximas

```
1. Abre a aplicação em http://localhost:5173
   ↓
2. Frontend solicita permissão de geolocalização do navegador
   ↓
3. Backend retorna as obras mais próximas (raio padrão: 2 km)
   ├─ Filtra por latitude/longitude do usuário
   ├─ Calcula distância para cada obra
   ├─ Retorna máximo 20 obras mais próximas
   └─ Exibe no mapa (Leaflet)
   ↓
4. Usuário ajusta filtros:
   ├─ Aumenta o raio de busca com o slider
   ├─ Filtra por esfera (Federal, Estadual, Municipal)
   ├─ Busca por nome de obra ou bairro
   └─ Mapa atualiza em tempo real (com debounce de 500ms)
   ↓
5. Usuário clica em uma obra no mapa
   ├─ Popup exibe informações
   ├─ Mostra: título, descrição, endereço, status
   ├─ Botão "Criar Denúncia"
   └─ Botão "Ver Canais de Denúncia"
```

### 🚨 Cenário 2: Usuário Quer Reportar um Problema

```
1. Usuário está na MapPage vendo uma obra
   ↓
2. Clica em "Criar Denúncia" (botão no ObraCard)
   ↓
3. Modal abre com formulário:
   ├─ Título da denúncia (mínimo 5 caracteres)
   ├─ Descrição (mínimo 10 caracteres)
   ├─ Tipo de denúncia (Atraso, Qualidade, Segurança, Outro)
   ├─ Botão "Enviar"
   └─ Botão "Cancelar"
   ↓
4. Frontend valida os campos
   ├─ Se inválido: Exibe erro
   └─ Se válido: Envia para API
   ↓
5. Backend recebe POST /api/denuncias
   ├─ Valida usuário
   ├─ Valida obra
   ├─ Cria denúncia no BD
   └─ Retorna confirmação
   ↓
6. Frontend exibe "Denúncia criada com sucesso!"
   ├─ Limpa formulário
   ├─ Fecha modal
   └─ Usuário pode criar nova denúncia
```

### 📢 Cenário 3: Usuário Quer Fazer Denúncia Oficial

```
1. Usuário está no mapa e vê uma obra
   ↓
2. Clica em "Canais de Denúncia"
   ├─ Frontend navega para http://localhost:5173/denuncias
   └─ DenunciasPage carrega
   ↓
3. Página exibe selector de esfera:
   ├─ 🏛️ Federal (Obras da União)
   ├─ 🏞️ Estadual (Obras do Tocantins)
   └─ 🏘️ Municipal (Prefeituras)
   ↓
4. Usuário seleciona esfera (ex: Estadual)
   ├─ Página filtra canais estaduais
   └─ Exibe cards com opções:
      ├─ Ouvidoria Geral do Tocantins
      ├─ Ministério Público Estadual
      └─ Cada um com seu link oficial
   ↓
5. Usuário clica em "Acessar Canal Oficial"
   ├─ Link abre em nova aba (target="_blank")
   ├─ Exemplo: https://www.tocantins.gov.br/ouvidoria
   └─ Usuário faz denúncia no site oficial
   ↓
6. Usuário pode voltar à aplicação
   ├─ Os dados podem ser síncronos com a plataforma
   └─ Ou consultar o status da denúncia
```

---

## 📊 Fluxo de Dados Completo: Diagrama

```
┌──────────────────────────────────────────────────────────────────┐
│                    EXTERIOR: ObrasGov                            │
│              (Portal Oficial do Governo Federal)                 │
└────────────────────┬─────────────────────────────────────────────┘
                     │ (HTTPS, a cada 5 min, com cache)
                     │ GET /cipi-backend/api/projetos
                     ▼
┌──────────────────────────────────────────────────────────────────┐
│                   BACKEND: Node.js/Express                       │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ ObraSyncService                                             │ │
│  │ • Fetch de obras do ObrasGov                               │ │
│  │ • Cache de 5 minutos                                       │ │
│  │ • Retry automático                                         │ │
│  │ • Transforma WKT POINT em lat/long                         │ │
│  └────────────────────┬────────────────────────────────────────┘ │
│                       │                                           │
│  ┌────────────────────▼────────────────────────────────────────┐ │
│  │ ObraRepository (Persiste no BD)                             │ │
│  │ INSERT/UPDATE: Obras no PostgreSQL                         │ │
│  └────────────────────┬────────────────────────────────────────┘ │
│                       │                                           │
│  ┌────────────────────▼────────────────────────────────────────┐ │
│  │ ListarObrasProximasUseCase                                  │ │
│  │ • Calcula distância por geolocalização                     │ │
│  │ • Filtra por raio                                          │ │
│  │ • Limita a 20 resultados                                   │ │
│  └────────────────────┬────────────────────────────────────────┘ │
│                       │                                           │
│  ┌────────────────────▼────────────────────────────────────────┐ │
│  │ ObraController                                              │ │
│  │ GET /api/obras/proximas?latitude=X&longitude=Y&raio=Z      │ │
│  └────────────────────┬────────────────────────────────────────┘ │
└───────────────────────┼────────────────────────────────────────────┘
                        │ (JSON Response)
                        │ [{obra1}, {obra2}, ...]
                        ▼
┌──────────────────────────────────────────────────────────────────┐
│                   FRONTEND: React + Vite                         │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ useObraViewModel (Custom Hook)                              │ │
│  │ • getCurrentPosition (Geolocalização do navegador)         │ │
│  │ • carregarObrasProximas (Faz requisição para API)          │ │
│  │ • Mantém estado de obras, localização, raio               │ │
│  └────────────────────┬────────────────────────────────────────┘ │
│                       │                                           │
│  ┌────────────────────▼────────────────────────────────────────┐ │
│  │ MapPage (Página Principal)                                  │ │
│  │ • Exibe mapa com marcadores (Leaflet)                      │ │
│  │ • Cards com obras                                          │ │
│  │ • Filtros dinâmicos                                        │ │
│  │ • Link para DenunciasPage                                  │ │
│  └────────────────────┬────────────────────────────────────────┘ │
│                       │                                           │
│  ┌────────────────────▼────────────────────────────────────────┐ │
│  │ DenunciasPage (Canais Oficiais)                             │ │
│  │ • Dados estáticos (CanaisDenuncia.ts)                      │ │
│  │ • Links externos para sites oficiais                       │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Autenticação e Autorização

### Fluxo de Autenticação:

```
┌──────────────────────────┐
│   Frontend (Login Page)  │
│   • Email                │
│   • Senha                │
└────────────┬─────────────┘
             │ (POST /api/login)
             ▼
┌──────────────────────────────────────────┐
│   LoginUseCase (Backend)                 │
│   • Valida credenciais                   │
│   • Gera token JWT (se aplicável)        │
│   • Retorna usuário                      │
└────────────┬─────────────────────────────┘
             │ (JSON Response)
             ▼
┌──────────────────────────────────────────┐
│   Frontend                               │
│   • Armazena token (localStorage/session)│
│   • Redireciona para MapPage             │
│   • Headers futuros incluem token        │
└──────────────────────────────────────────┘
```

---

## 🛣️ Rotas da API Backend

### Obras:
```
GET /api/obras/proximas
  Query: ?latitude=-10.2&longitude=-48.3&raio=50&limit=100
  Response: Array de obras
  
GET /api/obras/{id}
  Response: Dados completos de uma obra
```

### Denúncias:
```
POST /api/denuncias
  Body: {
    usuarioId: string,
    obraId: string,
    titulo: string,
    descricao: string,
    tipo: enum (ATRASO, QUALIDADE, SEGURANCA, OUTRO)
  }
  Response: Denúncia criada
  
GET /api/denuncias
  Response: Todas as denúncias
  
PATCH /api/denuncias/{id}/status
  Body: { status: enum (ABERTA, EM_ANALISE, RESOLVIDA, REJEITADA) }
  Response: Denúncia atualizada
```

### Autenticação:
```
POST /api/registro
  Body: { email: string, senha: string }
  Response: Usuário criado
  
POST /api/login
  Body: { email: string, senha: string }
  Response: Token JWT / Usuário autenticado
```

---

## 🗄️ Modelo de Dados (Banco de Dados)

### Tabela: obras
```sql
CREATE TABLE obras (
  id UUID PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  endereco VARCHAR(255),
  bairro VARCHAR(100),
  status ENUM('PLANEJADA', 'EM_EXECUCAO', 'PAUSADA', 'CONCLUIDA'),
  esfera ENUM('Federal', 'Estadual', 'Municipal'),
  fonteUrl TEXT,
  dataInicio DATE,
  dataFimPrevista DATE,
  dataFimReal DATE,
  valorInvestimento DECIMAL(15, 2),
  executor VARCHAR(255),
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

### Tabela: denuncias
```sql
CREATE TABLE denuncias (
  id UUID PRIMARY KEY,
  usuarioId UUID NOT NULL,
  obraId UUID NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT NOT NULL,
  tipo ENUM('ATRASO', 'QUALIDADE', 'SEGURANCA', 'OUTRO'),
  status ENUM('ABERTA', 'EM_ANALISE', 'RESOLVIDA', 'REJEITADA'),
  imagemUrl TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (usuarioId) REFERENCES usuarios(id),
  FOREIGN KEY (obraId) REFERENCES obras(id)
);
```

### Tabela: usuarios
```sql
CREATE TABLE usuarios (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL, -- Hashed
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

---

## 🚀 Fluxo de Deployment

```
┌─────────────────────────┐
│  Repositório Git (main) │
└────────────┬────────────┘
             │ (docker compose up -d)
             ▼
┌──────────────────────────────────────┐
│  Docker Compose Inicia:              │
│  1. PostgreSQL (Banco de Dados)      │
│  2. Redis (Cache)                    │
│  3. Node.js Backend (Express)        │
└────────────┬─────────────────────────┘
             │ (npm run db:migrate)
             │ (npm run db:seed)
             ▼
┌──────────────────────────────────────┐
│  Backend rodando em http://localhost │
│                                :3000 │
└────────────┬─────────────────────────┘
             │ (cd web && npm install && npm run dev)
             ▼
┌──────────────────────────────────────┐
│  Frontend rodando em http://localhost│
│                                :5173 │
└──────────────────────────────────────┘
```

---

## 📱 Diferenças entre Web e Mobile

### Web (React + Vite)
- **Acesso:** Navegador web
- **Mapa:** Leaflet (biblioteca web)
- **Estilos:** CSS nativo com variáveis
- **Estado:** Custom Hooks (MVVM)
- **Navegação:** React Router

### Mobile (React Native + Expo)
- **Acesso:** App nativo (iOS/Android)
- **Mapa:** React Native Maps
- **Estilos:** StyleSheet (React Native)
- **Estado:** Custom Hooks (mesma arquitetura que web)
- **Navegação:** React Navigation

Ambas compartilham:
- **Backend comum:** Mesma API Node.js
- **Modelos:** Mesmas DTOs/Interfaces
- **Lógica:** Mesmos ViewModels
- **Serviços:** Mesmo APIClient (Axios)

---

## 🔗 Integração Externa

### ObrasGov (Portal Oficial)

O backend sincroniza obras **em tempo real** com o portal oficial:

```
┌─────────────────────────────────────────┐
│  ObrasGov: Pesquisa Aberta              │
│  URL: obrasgov.sistema.gov.br           │
│  Endpoint: /cipi-backend/api            │
│  Filtros: UF=17 (Tocantins)            │
│           Situação=3 (Em Execução)      │
└─────────────────────────────────────────┘
         │
         ├─ Cache: 5 minutos
         ├─ Retry: até 3 tentativas
         └─ Atualização: Automática quando BD é consultado
```

---

## ✅ Resumo Rápido

| Aspecto | Detalhes |
|---------|----------|
| **Dados de Obras** | Sincronizados em tempo real do portal federal |
| **Dados de Denúncias** | Armazenados localmente no PostgreSQL |
| **Canais de Denúncia** | Configurados estaticamente no frontend |
| **Navegação Principal** | `/` (Mapa) e `/denuncias` (Canais) |
| **Geolocalização** | Usa Geolocation API do navegador |
| **Filtros** | Raio, Status, Esfera, Busca por nome (em tempo real) |
| **Criação de Denúncia** | Modal no mapa (não muda rota) |
| **Links Externos** | Abrem em nova aba (target="_blank") |
| **Backend** | Node.js com Clean Architecture |
| **Banco de Dados** | PostgreSQL com PostGIS |
| **Cache** | Redis (estruturado para escalabilidade) |

---

## 🎓 Conclusão

O **Monitora TO** é uma aplicação bem arquitetada que segue **Clean Architecture** no backend e **MVVM Pattern** no frontend. Os dados fluem de forma clara: desde o portal federal até o usuário final, passando por filtros, validações e transformações. A navegação é simples (apenas 2 rotas) e intuitiva, permitindo que o usuário explore obras e faça denúncias de forma eficiente.
