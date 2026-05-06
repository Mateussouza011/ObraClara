# Guia de Desenvolvimento - Monitora TO

## 🎯 Princípios de Código

### Clean Code
- Nomes descritivos e significativos
- Funções pequenas com responsabilidade única
- Sem code smells (dead code, magic numbers, etc)
- Comments apenas para "por quê", não "o quê"

### SOLID
- **S**ingle Responsibility: Uma classe, uma razão para mudar
- **O**pen/Closed: Aberto para extensão, fechado para modificação
- **L**iskov Substitution: Use abstrações, não implementações
- **I**nterface Segregation: Interfaces específicas, não genéricas
- **D**ependency Inversion: Dependa de abstrações, não de concretos

---

## 🏗️ Estrutura de Pastas - Backend

```
backend/
├── src/
│   ├── domain/           # Regras de negócio puras
│   │   ├── entities/    # Classes de negócio
│   │   └── repositories/ # Interfaces
│   ├── application/      # Orquestração
│   │   ├── useCases/    # Casos de uso
│   │   └── dtos/        # Transferência de dados
│   ├── infrastructure/   # Detalhes técnicos
│   │   ├── http/        # Controllers
│   │   ├── persistence/ # Implementações ORM
│   │   └── config/      # Setup
│   └── shared/          # Código compartilhado
├── tests/               # Testes
└── prisma/             # Database schema
```

### O que vai em cada camada?

**Domain:**
- Entidades: `Usuario`, `Obra`, `Denuncia`
- Value Objects: `Geolocation`
- Lógica de validação de negócio
- Interfaces de repositórios

**Application:**
- UseCases: `CriarDenunciaUseCase`, `ListarObrasProximasUseCase`
- DTOs: transferência de dados
- Mappers: conversão entre entidades e DTOs

**Infrastructure:**
- Controllers HTTP
- Implementações de repositórios Prisma
- Configurações de servidor

---

## 📱 Estrutura de Pastas - Mobile

```
mobile/src/
├── models/          # Tipos de dados (interfaces, enums)
├── viewModels/      # Custom Hooks (lógica)
├── views/           # Componentes/Telas (renderização)
├── services/        # Cliente HTTP, APIs
├── components/      # Componentes reutilizáveis
├── utils/           # Helpers e formatadores
└── App.tsx         # Entrada principal
```

### Fluxo MVVM

```
View (Screen)
    ↓
usesHook ↓
    ↓
ViewModel (Custom Hook)
    ↓ fetches/updates
    ↓
Model (Interface)
    ↓
API Service
```

---

## 📝 Exemplo Prático: Implementar novo UseCase

### 1. Criar a Entidade (domain/entities)

```typescript
export interface IListarDenunciasInput {
  obraId: string;
  status?: DenunciaStatus;
}

export class ListarDenunciasResult {
  constructor(
    public denuncias: Denuncia[],
    public total: number
  ) {}
}
```

### 2. Criar o UseCase (application/useCases)

```typescript
export class ListarDenunciasUseCase {
  constructor(private denunciaRepository: IDenunciaRepository) {}

  async execute(input: IListarDenunciasInput): Promise<ListarDenunciasResult> {
    const denuncias = await this.denunciaRepository.buscarPorObra(input.obraId);
    
    const filtradas = input.status
      ? denuncias.filter(d => d.status === input.status)
      : denuncias;
    
    return new ListarDenunciasResult(filtradas, filtradas.length);
  }
}
```

### 3. Injetar no Controller

```typescript
export class DenunciaController {
  constructor(private listarDenunciasUseCase: ListarDenunciasUseCase) {}

  async listar(req: Request, res: Response): Promise<void> {
    try {
      const { obraId, status } = req.query;
      const resultado = await this.listarDenunciasUseCase.execute({
        obraId: obraId as string,
        status: status as DenunciaStatus | undefined,
      });

      res.json({
        success: true,
        data: resultado.denuncias,
        total: resultado.total,
      });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}
```

### 4. Criar rota

```typescript
app.get('/api/denuncias/obra/:obraId', (req, res) => 
  denunciaController.listar(req, res)
);
```

---

## 📱 Exemplo Mobile: Nova Tela

### 1. Criar ViewModel Hook

```typescript
// viewModels/useMeusGraficosViewModel.ts
import { useState, useEffect } from 'react';
import { obraApi } from '@services/api';

export function useMeusGraficosViewModel() {
  const [estatisticas, setEstatisticas] = useState({
    totalObras: 0,
    emProgresso: 0,
    concluidas: 0,
  });
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    carregarEstatisticas();
  }, []);

  async function carregarEstatisticas() {
    setCarregando(true);
    try {
      const obras = await obraApi.listarTodas();
      const total = obras.length;
      const emProgresso = obras.filter(o => 
        o.status === 'EM_EXECUCAO'
      ).length;
      const concluidas = obras.filter(o => 
        o.status === 'CONCLUIDA'
      ).length;

      setEstatisticas({ totalObras: total, emProgresso, concluidas });
    } finally {
      setCarregando(false);
    }
  }

  return { estatisticas, carregando };
}
```

### 2. Criar Tela

```typescript
// views/GraficosScreen.tsx
import { useMeusGraficosViewModel } from '@viewModels/useMeusGraficosViewModel';

export function GraficosScreen(): JSX.Element {
  const { estatisticas, carregando } = useMeusGraficosViewModel();

  if (carregando) return <ActivityIndicator />;

  return (
    <View style={styles.container}>
      <Card titulo="Total de Obras" valor={estatisticas.totalObras} />
      <Card titulo="Em Andamento" valor={estatisticas.emProgresso} cor="blue" />
      <Card titulo="Concluídas" valor={estatisticas.concluidas} cor="green" />
    </View>
  );
}
```

### 3. Adicionar à Navegação

```typescript
// App.tsx
<Stack.Screen
  name="Graficos"
  component={GraficosScreen}
  options={{ title: 'Dashboards' }}
/>
```

---

## ✅ Testes Unitários

### Estrutura de Teste

```typescript
describe('CriarDenunciaUseCase', () => {
  let useCase: CriarDenunciaUseCase;
  let repository: MockRepository;

  beforeEach(() => {
    repository = new MockRepository();
    useCase = new CriarDenunciaUseCase(repository);
  });

  it('deve criar denúncia com dados válidos', async () => {
    const resultado = await useCase.execute({
      obraId: 'obra-1',
      titulo: 'Test',
      descricao: 'A valid description here',
      tipo: 'ATRASO',
    });

    expect(resultado).toBeDefined();
    expect(resultado.status).toBe('ABERTA');
  });

  it('deve rejeitar descrição vazia', async () => {
    await expect(
      useCase.execute({
        obraId: 'obra-1',
        titulo: 'Test',
        descricao: '',
        tipo: 'ATRASO',
      })
    ).rejects.toThrow('Descrição inválida');
  });
});
```

---

## 🚢 Deploy

### Variáveis de Ambiente

```bash
# .env (production)
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
API_PORT=3000
JWT_SECRET=very-secure-key-here
```

### Build Docker

```bash
docker compose build
docker compose up -d
```

---

## 🐛 Debugging

### Backend

```typescript
// Logar dados
console.log('Estado:', { obraId, status });

// VS Code Debugger
// Adicionar breakpoint (F9)
// Run > Start Debugging
```

### Mobile

```typescript
// Logar
console.log('ViewModel state:', { obras, estado });

// Expo Devtools
// Shaky device or press Cmd+D (iOS) / Cmd+M (Android)
```

---

## 📚 Referências

- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Prisma Docs](https://www.prisma.io/docs/)
- [React Native Docs](https://reactnative.dev/)

