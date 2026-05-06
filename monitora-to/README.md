# Monitora TO - Plataforma de Controle Social

Uma aplicação completa para monitoramento de obras de infraestrutura e construção em Palmas, Tocantins. Permite que moradores acompanhem o progresso das obras, reportem problemas e façam sugestões.

---

## 📋 Índice

- [Estrutura do Projeto](#estrutura-do-projeto)
- [Tecnologias](#tecnologias)
- [Como Rodar Localmente (Setup)](#como-rodar-localmente-setup)
- [Arquitetura e Padrões](#arquitetura-e-padrões)
- [Como Usar (APIs Principais)](#como-usar-apis-principais)
- [Troubleshooting](#troubleshooting)
- [Desenvolvimento e Testes](#desenvolvimento-e-testes)

---

## 📁 Estrutura do Projeto

```
monitora-to/
├── backend/                           # API Node.js/TypeScript
│   ├── src/
│   │   ├── domain/                    # Entidades e Repositórios (Regras de negócio)
│   │   ├── application/               # Casos de uso (Orquestração)
│   │   └── infrastructure/            # Controllers HTTP, Prisma e Serviços Externos
│   ├── prisma/                        # Schema do banco de dados (PostgreSQL)
│   └── package.json
│
├── web/                               # App Web Frontend (React + Vite)
│   ├── src/
│   │   ├── models/                    # Interfaces de dados
│   │   ├── viewModels/                # Hooks customizados
│   │   ├── views/                     # Componentes e Páginas (Mapa, Denúncias)
│   │   └── services/                  # Comunicação com a API
│   └── package.json
│
├── mobile/                            # App React Native (Expo)
│   └── src/                           # Estrutura MVVM similar à web
│
└── docker-compose.yml                 # Orquestração (Postgres + Redis + API)
```

---

## 🛠 Tecnologias

### Backend
- **Runtime:** Node.js 20+ com TypeScript
- **Framework:** Express (Clean Architecture)
- **Banco de Dados:** PostgreSQL com PostGIS (geolocalização)
- **ORM:** Prisma
- **Cache:** Redis

### Web / Frontend
- **Framework:** React com Vite
- **Estilos:** Vanilla CSS com variáveis CSS modernas, Glassmorphism, e animações fluidas
- **Mapas:** Leaflet (react-leaflet)
- **Estado:** Custom Hooks (MVVM pattern)

### Mobile
- **Framework:** React Native com Expo
- **Navegação:** React Navigation

---

## 🚀 Como Rodar Localmente (Setup)

Você pode rodar o projeto inteiramente via Docker (mais fácil) ou rodar os serviços locais manualmente.

### Pré-requisitos
- Node.js 20+
- Docker e Docker Compose
- Git

### 1. Inicializando com Docker Compose (Recomendado para o Backend)

Este comando subirá o Banco de Dados (Postgres com PostGIS), o Redis, e a API em Node.js automaticamente.

```bash
cd monitora-to

# (Opcional) Copie o arquivo de ambiente para sobrescrever a porta da API caso a 3000 esteja ocupada
cp .env.example .env

# Suba os containers em background
docker compose up -d

# Aguarde 10-15 segundos para o banco inicializar
```

### 2. Configurando o Banco de Dados

Rode as migrações e o script de seed (para popular os dados iniciais) no contêiner da API:

```bash
docker compose exec api npm run db:migrate
docker compose exec api npm run db:seed
```

> **Nota:** O backend passará a responder em `http://127.0.0.1:3000` (ou na porta definida em `HOST_API_PORT` no arquivo `.env` da raiz).

### 3. Rodando o Frontend (Web)

Com o backend rodando via Docker, inicie a interface Web localmente para ver o mapa:

```bash
cd web
npm install

# (Opcional) Crie o .env caso a porta do backend não seja a padrão 3000
# echo "VITE_API_URL=http://localhost:3001" > .env

npm run dev
# Acesse no navegador em http://localhost:5173 (ou a porta sugerida no terminal)
```

### 4. Rodando Localmente sem Docker

Caso prefira não usar o contêiner do backend e queira rodá-lo localmente via `ts-node`:

```bash
cd backend
cp .env.example .env
npm install
npm run db:migrate
npm run dev         # Inicia o backend na porta 3000
```
*(Necessário ter um PostgreSQL com PostGIS e um Redis rodando localmente no host).*

---

## 🏛️ Arquitetura e Padrões

- **Clean Architecture:** O backend é estritamente separado em camadas lógicas (Domain, Application, Infrastructure).
- **MVVM:** No frontend (Web e Mobile), a lógica de estado e requisições fica nos *ViewModels* (`hooks`), separando completamente o visual das chamadas à API.
- **Integração Online:** A listagem de obras se comunica *em tempo real* (via `ObraSyncService`) com o portal oficial federal `ObrasGov` para recuperar dados atualizados do estado do Tocantins.

---

## 💻 Como Usar (APIs Principais)

### Obras (Sincronizadas com o portal oficial)
```bash
# Listar obras próximas filtradas (o raio em KM define o alcance de busca)
GET /api/obras/proximas?latitude=-10.2&longitude=-48.3&raio=900

# Buscar obra específica
GET /api/obras/{id}
```

### Denúncias
```bash
# Criar uma denúncia em uma obra
POST /api/denuncias
Content-Type: application/json

{
  "usuarioId": "user-123",
  "obraId": "obra-1",
  "titulo": "Obra parada e materiais abandonados",
  "descricao": "Nenhum trabalhador no local há mais de uma semana.",
  "tipo": "ATRASO"
}
```

---

## 🆘 Troubleshooting

### 1. "Port 3000 já em uso"
Se você tentou rodar `docker compose up -d` e acusou erro na porta 3000:
- Edite o arquivo `.env` na pasta principal `monitora-to` e altere para `HOST_API_PORT=3001` (por exemplo).
- Edite o arquivo `.env` dentro da pasta `web` apontando para a nova porta do backend: `VITE_API_URL=http://localhost:3001`.
- Reinicie os containers com `docker compose down` e `docker compose up -d`.

### 2. O Frontend só exibe um máximo de 20 obras
Certifique-se de que o backend que está sendo requisitado pelo frontend é de fato o backend do Docker com a limitação corrigida, e que você expandiu o slider de "Raio de Busca" no site para cobrir todo o estado.

### 3. "Erro de Conexão com o BD" (Prisma)
Ao rodar as migrations, pode ser que o Postgres ainda esteja iniciando. Aguarde mais 10 segundos e execute o `docker compose exec api npm run db:migrate` novamente.

---

## 🔧 Desenvolvimento e Testes

### Rodar Testes no Backend

```bash
cd backend
npm test               # Rodar todos os testes (Jest)
npm run test:watch     # Em modo watch (desenvolvimento)
npm run test:cov       # Relatório de cobertura
```

---

## 📄 Licença
MIT
