# 🚀 PRÓXIMOS PASSOS - AÇÃO RÁPIDA

**Tempo estimado para estar rodando:** 10 minutos

---

## 1️⃣ Leia isto primeiro (2 min)

```bash
cat QUICKSTART.md
```

Ou abra em seu editor:
```bash
code QUICKSTART.md
```

---

## 2️⃣ Inicie a infraestrutura (3 min)

```bash
# Certifique-se que você está na pasta do projeto
cd /home/mateus/Documentos/GitHub/ObraClara/monitora-to

# Inicie Docker
docker-compose up -d

# Aguarde ~30 segundos...
sleep 30

# Verifique se tudo está rodando
docker-compose ps

# Esperado:
# STATUS: healthy (todos os 3 services)
```

---

## 3️⃣ Teste se a API está respondendo (1 min)

```bash
# Em outro terminal
curl http://localhost:3000/health

# Esperado resposta:
# {"status":"ok","timestamp":"2026-03-25T..."}
```

---

## 4️⃣ Explore a arquitetura (4 min)

Abra estes arquivos para entender:

```bash
# A entidade principal (Obra)
code backend/src/domain/entities/Obra.ts

# Um Use Case completo (criar denúncia)
code backend/src/application/useCases/CriarDenunciaUseCase.ts

# Um Hook completo (listar obras)
code mobile/src/viewModels/useObraViewModel.ts

# A tela principal (mapa)
code mobile/src/views/MapaObrasScreen.tsx
```

---

## 5️⃣ Próximas ações

### Se quer aprender mais:
```bash
# Ver todos os exemplos de código
code EXEMPLOS.md

# Entender a estrutura de pastas
code ESTRUTURA.md

# Aprender os padrões
code DEVELOPMENT.md

# Ver mapa mental
code MAPA_MENTAL.md
```

### Se quer começar a programar:
1. **Autenticação (PRIORITY #1)**
   - Abrir: `backend/src/infrastructure/persistence/`
   - Criar: `UsuarioRepository.ts`
   - Padrão segue: `ObraRepository.ts`
   - Dica: Ver exemplo em `EXEMPLOS.md` seção 7

2. **Upload de Imagens (PRIORITY #2)**
   - Integrar AWS S3 ou Cloudinary
   - Ajustar: `CriarDenunciaUseCase.ts`
   - Ajustar: `CriarDenunciaScreen.tsx` (já tem picker)

3. **Testes (PRIORITY #3)**
   - Copiar padrão de: `tests/application/useCases/CriarDenunciaUseCase.spec.ts`
   - Rodar: `npm test`

---

## 📊 Status Atual

```
✅ Arquitetura: COMPLETA
✅ Database: PRONTO
✅ API: RESPONDENDO
✅ Mobile skeleton: PRONTO
✅ Documentação: COMPLETA

⏳ Próximo: Autenticação
⏳ Depois: Upload de imagens
⏳ E: Features avançadas
```

---

## 🔥 Quick Links

| Quero... | Vou em... | Tempo |
|----------|-----------|-------|
| Rodar rápido | QUICKSTART.md | 5 min |
| Ver código | EXEMPLOS.md | 20 min |
| Entender tudo | DEVELOPMENT.md | 30 min |
| Visualizar | MAPA_MENTAL.md | 10 min |
| Checklist completo | ENTREGA_FINAL.md | 15 min |
| Navegar tudo | INDEX.md | 5 min |

---

## 💡 Dicas Importantes

### Docker
```bash
# Ver logs
docker-compose logs -f api

# Parar tudo
docker-compose down

# Remover volumes (CUIDADO!)
docker-compose down -v

# Rebuildar
docker-compose up -d --build
```

### Backend
```bash
# Rodar local (sem Docker)
npm install
npm run dev

# Testes
npm test

# Lint
npm run lint
```

### Mobile
```bash
# Dentro da pasta mobile/
npm install
npm start

# Scanar QR code com seu phone
# ou rodar em emulador Android/iOS
```

---

## 🎯 Se algo der errado

### "Connection refused on 3000"
```bash
# A API não iniciou. Verifique logs:
docker-compose logs api
```

### "Port already in use"
```bash
# Algo está usando a porta. Escolha outra:
docker-compose down  # Para tudo
lsof -i :3000       # Vê o que está usando
kill -9 <PID>       # Mata o processo
docker-compose up -d  # Reinicia
```

### "Database connection failed"
```bash
# Aguarde um pouco mais (DB leva tempo)
sleep 60
docker-compose ps  # Vê status
```

---

## 📚 Documentação Completa Disponível

```
📁 monitora-to/
├── README.md ..................... Visão geral
├── QUICKSTART.md ................. Comece por AQUI ⭐
├── DEVELOPMENT.md ................ Padrões & architecture
├── ESTRUTURA.md .................. Árvore de pastas
├── EXEMPLOS.md ................... 7 exemplos de código
├── INDEX.md ...................... Índice de tudo
├── MAPA_MENTAL.md ................ Diagramas visuais
├── ENTREGA_FINAL.md .............. Checklist completo
├── PROXIMO_PASSO.md .............. Este arquivo
│
└── 🔲 CÓDIGO
    ├── backend/ (Node.js + Express)
    ├── mobile/ (React Native + Expo)
    ├── docker-compose.yml
    └── ... (59 arquivos no total)
```

---

## ⏱️ Timeline Sugerido

```
MIN 0-5:   Ler QUICKSTART.md
MIN 5-8:   docker-compose up -d
MIN 8-10:  curl /health
MIN 10-15: Explorar código
MIN 15-30: Ler DEVELOPMENT.md
MIN 30+:   Começar a programar
```

---

## ✅ Você está pronto!

Tudo está:
- ✅ Estruturado
- ✅ Documentado
- ✅ Comentado
- ✅ Testado  
- ✅ Pronto para desenvolvimen

### Próxima ação?

```
👉 docker-compose up -d
👉 curl http://localhost:3000/health
👉 code DEVELOPMENT.md
👉 Comece a codar! 🚀
```

---

<details>
<summary>🎓 Precisa de um "curso rápido" sobre Clean Architecture?</summary>

## Clean Architecture em 2 minutos

```
┌─────────────────────────────────────────┐
│ SUA APLICAÇÃO É ASSIM:              │
├─────────────────────────────────────────┤
│                                     │
│  1. Domain Layer (Regras de negócio)   │
│     → Aqui vivem as entidades        │
│     → Aqui estão as validações       │
│     → Independente de BE/Front       │
│                                     │
│  2. Application Layer (Orquestração)   │
│     → Use Cases coordenam operações   │
│     → Dependem de Domain              │
│     → Injetam dependências            │
│                                     │
│  3. Infrastructure Layer (Técnica)  │
│     → Controllers recebem requests    │
│     → Repositories acessam DB         │
│     → Dependem de Application         │
│                                     │
└─────────────────────────────────────────┘

FLUXO TÍPICO:
Request → Controller → UseCase → Entity → Validation
                      ↑          ↓
              Repository → Database
```

</details>

---

<details>
<summary>🔥 Precisa ver o código em ação?</summary>

## Primeiro Use Case (criar denúncia)

```typescript
// 1. Request chega
POST /api/denuncias
{
  "titulo": "Buraco na Avenida Teotônio",
  "descricao": "Há uma semana tem esse buraco...",
  "tipo": "ATRASO",
  "obraId": "obra-123",
  "usuarioId": "user-456"
}

// 2. Controller recebe e chama UseCase
const useCase = new CriarDenunciaUseCase(
  denunciaRepository,
  usuarioRepository,
  obraRepository
);

// 3. UseCase valida TUDO
if (!titulo || titulo.length < 5) throw Error("...")
if (!usuarioRepository.findById(usuarioId)) throw Error("...")
if (!obraRepository.findById(obraId)) throw Error("...")

// 4. UseCase cria a Entity (com regras)
const denuncia = new Denuncia({
  titulo: "Buraco na Avenida...",
  tipo: DenunciaTipo.ATRASO,
  status: DenunciaStatus.ABERTA,
  // ... outras validações automáticas
});

// 5. Repository salva no banco
await denunciaRepository.salvar(denuncia);

// 6. Response volta com sucesso
201 Created
{
  "success": true,
  "data": { "id": "denuncia-789", ... }
}
```

Veja o código real em: `backend/src/application/useCases/CriarDenunciaUseCase.ts`

</details>

---

**Feliz codificação!** 🎉

