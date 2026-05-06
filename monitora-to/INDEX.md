# 📚 Índice Completo - Monitora TO

Bem-vindo ao projeto **Monitora TO**! Este é um guia para navegar toda a documentação.

---

## 🚀 Comece Aqui

1. **[PROXIMO_PASSO.md](./PROXIMO_PASSO.md)** ⭐⭐⭐ *10 minutos* [NOVO]
   - Roteiro executivo de ações
   - Comandos prontos para copiar-colar
   - Dicas rápidas de troubleshooting

2. **[QUICKSTART.md](./QUICKSTART.md)** ⭐ *5 minutos*
   - Inicie em 5 passos
   - Teste as APIs
   - Rode o mobile

3. **[MAPA_MENTAL.md](./MAPA_MENTAL.md)** *10 minutos* [NOVO]
   - Visualização gráfica da arquitetura
   - Fluxos de dados em ASCII
   - Diagramas de componentes

4. **[README.md](./README.md)**
   - Visão geral do projeto
   - Tecnologias utilizadas
   - Instalação completa

---

## 📖 Documentação Técnica

### Arquitetura & Estrutura

- **[ESTRUTURA.md](./ESTRUTURA.md)** - Visualização completa de pastas
  - Árvore de diretórios
  - Responsabilidades por camada
  - Checklist de implementação

- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Guia de desenvolvimento
  - Princípios de código (Clean Code, SOLID)
  - Como adicionar novo UseCase
  - Como criar nova tela mobile
  - Estrutura de testes

### Exemplos Práticos

- **[EXEMPLOS.md](./EXEMPLOS.md)** - Código-fonte comentado
  - Exemplo 1: Criar denúncia (completo)
  - Exemplo 2: Listar obras no mapa
  - Exemplo 3: Teste unitário
  - Exemplo 4: Fluxo ponta-a-ponta
  - Exemplo 5-7: Filtros, Docker, Autenticação

---

## 🏛️ Camadas Explicadas

### Backend - Clean Architecture

```
Domain Layer (src/domain/)
  → Entidades: Usuario, Obra, Denuncia
  → Lógica de negócio pura
  → Interfaces de repositórios

Application Layer (src/application/)
  → UseCases: orquestração
  → DTOs: transferência de dados

Infrastructure Layer (src/infrastructure/)
  → Controllers HTTP
  → Repositórios (Prisma)
  → Configurações
```

📄 Detalhes em → [DEVELOPMENT.md](./DEVELOPMENT.md#-estrutura-de-pastas---backend)

### Mobile - MVVM Pattern

```
Models (src/models/)
  → Tipos TypeScript (interfaces)

ViewModels (src/viewModels/)
  → Custom hooks com lógica
  → Estado e API calls

Views (src/views/)
  → Screens/Telas de UI
  → Renderização apenas

Services (src/services/)
  → Cliente HTTP (axios)
```

📄 Detalhes em → [DEVELOPMENT.md](./DEVELOPMENT.md#-estrutura-de-pastas---mobile)

---

## 🔧 How-To Rápido

### Adicionar novo UseCase
1. Criar entidade em `domain/entities/`
2. Criar UseCase em `application/useCases/`
3. Injetar em controller
4. Adicionar rota

📄 Exemplo completo → [EXEMPLOS.md#-exemplo-1-criar-denúncia-backend](./EXEMPLOS.md#-exemplo-1-criar-denúncia-backend)

### Criar nova Tela Mobile
1. Criar hook em `viewModels/useMeuViewModel.ts`
2. Criar screen em `views/MinhaScreen.tsx`
3. Adicionar à navegação em `App.tsx`

📄 Exemplo completo → [EXEMPLOS.md#-exemplo-2-listar-obras-no-mapa-mobile](./EXEMPLOS.md#-exemplo-2-listar-obras-no-mapa-mobile)

### Rodar Testes
```bash
cd backend
npm test
```

📄 Mais em → [DEVELOPMENT.md#-testes-unitários](./DEVELOPMENT.md#-testes-unitários)

---

## 📊 API Reference

### Obras
```
GET  /api/obras               - Listar todas
GET  /api/obras/:id           - Buscar por ID
GET  /api/obras/proximas?...  - Proximidade
```

### Denúncias
```
POST   /api/denuncias              - Criar
GET    /api/denuncias/:id          - Buscar
PATCH  /api/denuncias/:id/status   - Atualizar status
```

📄 Completo em → [EJEMPLOS.md#-exemplo-1-criar-denúncia-backend](./EXEMPLOS.md#-exemplo-1-criar-denúncia-backend)

---

## 🔍 Índice de Arquivos

### Documentação
```
├── README.md           ← Vista geral
├── QUICKSTART.md       ← Iniciante (RECOMENDADO)
├── DEVELOPMENT.md      ← DevOps/Arquitetura
├── ESTRUTURA.md        ← Pastas e organização
├── EXEMPLOS.md         ← Código comentado
└── INDEX.md            ← Este arquivo
```

### Backend
```
backend/
├── src/
│   ├── domain/entities/           ← Lógica de negócio
│   ├── application/useCases/      ← Orquestração
│   ├── infrastructure/http/       ← Controllers
│   └── main.ts                    ← Ponto entrada
├── tests/
│   └── .../*.spec.ts              ← Testes Jest
├── prisma/schema.prisma           ← DB schema
└── package.json
```

### Mobile
```
mobile/src/
├── models/              ← Tipos TS
├── viewModels/          ← Custom hooks
├── views/               ← Screens/Telas
├── services/            ← API client
├── utils/               ← Helpers
└── App.tsx              ← App + Navigation
```

---

## 🎓 Conceitos

### Clean Architecture
Separação em 3 camadas com dependências apontando para dentro:
- Domain (regras puras)
- Application (orquestração)
- Infrastructure (detalhes técnicos)

📚 Saiba mais: [DEVELOPMENT.md#-princípios-de-código](./DEVELOPMENT.md#-princípios-de-código)

### SOLID Principles
- **S**ingle Responsibility
- **O**pen/Closed
- **L**iskov Substitution
- **I**nterface Segregation
- **D**ependency Inversion

📚 Saiba mais: [DEVELOPMENT.md#solid](./DEVELOPMENT.md#solid)

### MVVM Pattern
Model-View-ViewModel para mobile:
- **Model**: Tipos de dados
- **View**: Renderização
- **ViewModel**: Lógica em hooks customizados

📚 Saiba mais: [DEVELOPMENT.md#-estrutura-de-pastas---mobile](./DEVELOPMENT.md#-estrutura-de-pastas---mobile)

---

## 🚀 Deployment

### Docker
```bash
docker compose up -d
```

### Variáveis de Ambiente
```bash
cp backend/.env.example backend/.env
# Editar .env com valores reais
```

📄 Detalhes em → [DEVELOPMENT.md#-deploy](./DEVELOPMENT.md#-deploy)
📄 Exemplo em → [EXEMPLOS.md#-exemplo-6-deploy-em-docker](./EXEMPLOS.md#-exemplo-6-deploy-em-docker)

---

## 🆘 Troubleshooting

Problema | Solução | Docs
---------|---------|------
Porta em uso | Mudar em .env | [QUICKSTART.md](./QUICKSTART.md#-troubleshooting)
BD não conecta | Aguardar 15s | [QUICKSTART.md](./QUICKSTART.md#-troubleshooting)
Imagem não found | Rebuild | [QUICKSTART.md](./QUICKSTART.md#-troubleshooting)

---

## 📞 Referências Rápidas

| Arquivo | O que fazer | Documento |
|---------|-------------|-----------|
| Adicionar entidade | domain/entities/ | [DEVELOPMENT.md](./DEVELOPMENT.md#-exemplo-prático-implementar-novo-usecase) |
| Novo UseCase | application/useCases/ | [EXEMPLOS.md](./EXEMPLOS.md) |
| Nova Tela | mobile/src/views/ | [EXEMPLOS.md](./EXEMPLOS.md#-exemplo-2-listar-obras-no-mapa-mobile) |
| Novo Hook | mobile/src/viewModels/ | [DEVELOPMENT.md](./DEVELOPMENT.md#-exemplo-mobile-nova-tela) |
| Teste | backend/tests/ | [EXEMPLOS.md](./EXEMPLOS.md#-exemplo-3-teste-unitário) |

---

## ✅ Checklist: Do Zero ao Deploy

- [ ] Ler [QUICKSTART.md](./QUICKSTART.md)
- [ ] `docker compose up -d`
- [ ] Testar `/health`
- [ ] Testar POST `/api/denuncias`
- [ ] `npm run dev` no mobile
- [ ] Escanear QR code
- [ ] Explorar o mapa
- [ ] Ler [DEVELOPMENT.md](./DEVELOPMENT.md)
- [ ] Entender a arquitetura
- [ ] Fazer seu primeiro UseCase
- [ ] Deploy em produção

---

## 🤝 Contribuindo

1. Criar feature branch: `git checkout -b feature/meu-recurso`
2. Commit com mensagem clara
3. Push e abrir pull request
4. Toda mudança deve ter testes

📚 Padrões em → [DEVELOPMENT.md](./DEVELOPMENT.md)

---

## 📄 Licença

MIT

---

## 🎯 Roadmap

- [ ] Autenticação JWT completa
- [ ] Upload de imagens (S3)
- [ ] Notificações push
- [ ] Real-time socket.io
- [ ] Offline-first (SQLite)
- [ ] Dashboard de admin
- [ ] Relatórios PDF
- [ ] Integração Google Maps API

---

## 📖 Leitura Recomendada

### 🚀 Início Imediato (10-30 min) ⭐
1. [PROXIMO_PASSO.md](./PROXIMO_PASSO.md) - **Roteiro de 10 minutos** (NOVO!)
2. [QUICKSTART.md](./QUICKSTART.md) - Setup em 5 minutos
3. [MAPA_MENTAL.md](./MAPA_MENTAL.md) - Visualizar arquitetura (NOVO!)

### Aprendizado profundo (2-3 horas)
1. [README.md](./README.md)
2. [DEVELOPMENT.md](./DEVELOPMENT.md)
3. [EXEMPLOS.md](./EXEMPLOS.md)

### Referência (consulta)
1. [ESTRUTURA.md](./ESTRUTURA.md) - quando perder em pastas
2. [DESENVOLVIMENTO.md](./DESENVOLVIMENTO.md) - padrões
3. [EXEMPLOS.md](./EXEMPLOS.md) - código real
4. [ENTREGA_FINAL.md](./ENTREGA_FINAL.md) - checklist completo (NOVO!)

---

## 📦 Todos os Documentos

| Doc | Tempo | Para Quem | Link |
|-----|-------|----------|------|
| **PROXIMO_PASSO** | 10 min | Qualquer um iniciando | [→](./PROXIMO_PASSO.md) ⭐⭐⭐ |
| **MAPA_MENTAL** | 10 min | Visual learners | [→](./MAPA_MENTAL.md) 🎨 |
| **QUICKSTART** | 5 min | Rápido | [→](./QUICKSTART.md) ⚡ |
| **README** | 20 min | Overview | [→](./README.md) 📖 |
| **DEVELOPMENT** | 30 min | DevOps | [→](./DEVELOPMENT.md) 🔧 |
| **ESTRUTURA** | 15 min | Exploração | [→](./ESTRUTURA.md) 📁 |
| **EXEMPLOS** | 45 min | Deep dive | [→](./EXEMPLOS.md) 💡 |
| **ENTREGA_FINAL** | 15 min | Checklist | [→](./ENTREGA_FINAL.md) ✅ |

---

**Última atualização:** 25 de março de 2026  
**Status:** ✅ Production-Ready v1.0
**Versão:** 1.0.0
**Status:** Pronto para desenvolvimento ✅

