# 💡 Exemplos Práticos - Monitora TO

## 🔴 Exemplo 1: Criar Denúncia (Backend)

### 1. Entidade do Domínio (`domain/entities/Denuncia.ts`)
```typescript
export class Denuncia implements IDenunciaProps {
  // ... propriedades
  
  mudarStatus(novoStatus: DenunciaStatus): void {
    const transicoes: Record<DenunciaStatus, DenunciaStatus[]> = {
      ABERTA: [EM_ANALISE, REJEITADA],
      EM_ANALISE: [RESOLVIDA, REJEITADA],
      RESOLVIDA: [],
      REJEITADA: [ABERTA],
    };

    if (!transicoes[this.status].includes(novoStatus)) {
      throw new Error(`Não é possível mudar de ${this.status} para ${novoStatus}`);
    }

    this.status = novoStatus;
    this.updatedAt = new Date();
  }
}
```

### 2. UseCase (`application/useCases/CriarDenunciaUseCase.ts`)
```typescript
export class CriarDenunciaUseCase {
  async execute(input: CriarDenunciaDTO): Promise<DenunciaResponseDTO> {
    // ✅ Validações
    if (!Denuncia.isTipoValido(input.tipo)) {
      throw new Error('Tipo inválido');
    }

    // ✅ Verificar pré-requisitos
    const usuario = await this.usuarioRepository.buscarPorId(input.usuarioId);
    if (!usuario) throw new Error('Usuário não encontrado');

    // ✅ Criar entidade com lógica de negócio
    const denuncia = new Denuncia({
      id: uuidv4(),
      usuarioId: input.usuarioId,
      obraId: input.obraId,
      titulo: input.titulo,
      descricao: input.descricao,
      tipo: input.tipo as DenunciaTipo,
      imagemUrl: input.imagemUrl,
      status: DenunciaStatus.ABERTA,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // ✅ Persistir
    await this.denunciaRepository.salvar(denuncia);

    // ✅ Retornar DTO
    return this.mapToResponseDTO(denuncia);
  }
}
```

### 3. Controller HTTP (`infrastructure/http/controllers/DenunciaController.ts`)
```typescript
async criar(req: Request, res: Response): Promise<void> {
  try {
    const { usuarioId, obraId, titulo, descricao, tipo } = req.body;

    const resultado = await this.criarDenunciaUseCase.execute({
      usuarioId,
      obraId,
      titulo,
      descricao,
      tipo,
    });

    res.status(201).json({
      success: true,
      data: resultado,
      message: 'Denúncia criada com sucesso',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
}
```

### 4. Rota (`main.ts`)
```typescript
app.post('/api/denuncias', (req, res) => denunciaController.criar(req, res));
```

---

## 📱 Exemplo 2: Listar Obras no Mapa (Mobile)

### 1. Model (`mobile/src/models/Obra.ts`)
```typescript
export interface Obra {
  id: string;
  titulo: string;
  localizacao: Coordenada;
  status: ObraStatusEnum;
  percentualProgresso: number;
  // ...
}

// Helpers
export function estaAtrasada(obra: Obra): boolean {
  if (!obra.dataFimPrevista) return false;
  return new Date() > new Date(obra.dataFimPrevista) && 
         obra.status !== ObraStatusEnum.CONCLUIDA;
}
```

### 2. ViewModel Hook (`mobile/src/viewModels/useObraViewModel.ts`)
```typescript
export function useObraViewModel(): UseObraViewModelReturn {
  const [obras, setObras] = useState<Obra[]>([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    obterLocalizacao();
  }, []);

  const obterLocalizacao = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const loc = await Location.getCurrentPositionAsync({});
      setLocalizacaoUsuario(...)
      carregarObrasProximas();
    }
  };

  const carregarObrasProximas = async (raio = 10) => {
    setCarregando(true);
    try {
      const obrasCarregadas = await obraApi.listarProximas(
        latitude,
        longitude,
        raio
      );
      // Mapear e adicionar distância
      const comDistancia = obrasCarregadas.map(obra => ({
        ...obra,
        distancia: calcularDistancia(...),
      }));
      setObras(comDistancia);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  return {
    obras,        // lê do View
    carregando,   // lê do View
    carregarObrasProximas, // método para View chamar
    filtrarPorStatus,      // métodos utilitários
    obterObraOrdenada,
  };
}
```

### 3. View (Screen) (`mobile/src/views/MapaObrasScreen.tsx`)
```typescript
export function MapaObrasScreen(): JSX.Element {
  // ✅ Usa hook para lógica
  const { obras, carregando, carregarObrasProximas, filtrarPorStatus } = 
    useObraViewModel();

  return (
    <View style={styles.container}>
      {/* MAPA COM MARCADORES */}
      <MapView>
        {obras.map(obra => (
          <Marker
            key={obra.id}
            coordinate={obra.localizacao}
            title={obra.titulo}
          />
        ))}
      </MapView>

      {/* LISTA DE OBRAS */}
      <View style={styles.painel}>
        {carregando ? (
          <ActivityIndicator />
        ) : (
          <FlatList
            data={obras}
            renderItem={({ item }) => (
              <ObraCard obra={item} />
            )}
            keyExtractor={item => item.id}
          />
        )}
      </View>
    </View>
  );
}
```

---

## 🧪 Exemplo 3: Teste Unitário

### Teste do UseCase
```typescript
describe('CriarDenunciaUseCase', () => {
  let useCase: CriarDenunciaUseCase;
  let denunciaRepo: IDenunciaRepository;

  beforeEach(() => {
    denunciaRepo = new MockDenunciaRepository();
    useCase = new CriarDenunciaUseCase(denunciaRepo, ...);
  });

  // ✅ Teste case-by-case
  it('deve criar denúncia com dados válidos', async () => {
    const resultado = await useCase.execute({
      usuarioId: 'user-1',
      obraId: 'obra-1',
      titulo: 'Obra atrasada',
      descricao: 'A obra deveria ter terminado há uma semana',
      tipo: 'ATRASO',
    });

    expect(resultado.status).toBe('ABERTA');
    expect(resultado.titulo).toBe('Obra atrasada');
  });

  it('deve validar tipo de denúncia', async () => {
    await expect(
      useCase.execute({
        usuarioId: 'user-1',
        obraId: 'obra-1',
        titulo: 'Test',
        descricao: 'Descrição válida aqui',
        tipo: 'TIPO_INVALIDO',
      })
    ).rejects.toThrow('Tipo de denúncia inválido');
  });
});
```

---

## 🔄 Exemplo 4: Fluxo Completo - Usuário reporta problema

### Sequência de eventos:

**1️⃣ Usuário abre app e vê mapa**
```
MapaObrasScreen monta
  ↓ chama
useObraViewModel()
  ↓ pede localização
expo-location (permissão)
  ↓ 
carregarObrasProximas(-10.2, -48.3)
  ↓
obraApi.listarProximas(...)
  ↓
GET /api/obras/proximas
  ↓
maps renderiza com obras
```

**2️⃣ Usuário toca em uma obra e clica "Denunciar"**
```
CriarDenunciaScreen abre (props: obraId)
  ↓
usuário preenche:
- tipo: "ATRASO"
- título: "Obra parada"
- descrição: "Sem atividade há dias"
- foto: captura câmera
```

**3️⃣ Usuário clica "Enviar"**
```
handleEnviar()
  ↓
criarDenuncia(input) via ViewModel
  ↓
denunciaApi.criar({...})
  ↓
POST /api/denuncias
  ↓
DenunciaController.criar()
  ↓
CriarDenunciaUseCase.execute()
  ↓
Valida Denuncia entity
  ↓
DenunciaRepository.salvar() (Prisma)
  ↓
INSERT INTO denuncias
  ↓
Response 201 Created + data
  ↓
Alert "Denúncia criada com sucesso!"
  ↓
Tela volta ao mapa
```

---

## 📊 Exemplo 5: Adicionar novo filtro

### Adicionar filtro por status de obra

**Backend:** ✅ Já existe em `Obra` entity
```typescript
obra.status // "EM_EXECUCAO", "CONCLUIDA", etc
```

**Mobile:** Adicionar método ao ViewModel
```typescript
const filtrarPorStatus = (status: ObraStatusEnum) => {
  return obras.filter(obra => obra.status === status);
};
```

**View:** Render botões de filtro
```typescript
<View style={styles.filtros}>
  {['EM_EXECUCAO', 'CONCLUIDA', 'PAUSADA'].map(status => (
    <TouchableOpacity
      key={status}
      onPress={() => setFiltroSelecionado(status)}
      style={[
        styles.botao,
        filtroSelecionado === status && styles.botaoAtivo
      ]}
    >
      <Text>{status}</Text>
    </TouchableOpacity>
  ))}
</View>

<FlatList
  data={filtrarPorStatus(filtroSelecionado)}
  // ...
/>
```

---

## 🚀 Exemplo 6: Deploy em Docker

### Build e run
```bash
# Construir imagem
docker build -t monitora-to-api:latest ./backend

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@db:5432/obem" \
  -e JWT_SECRET="seu-secret-key" \
  monitora-to-api:latest
```

### Com docker-compose (recomendado)
```bash
docker-compose build
docker-compose up -d

# Verificar logs
docker-compose logs -f api
```

---

## 🔐 Exemplo 7: Adicionar Autenticação

### 1. Criar UseCase de Login
```typescript
export class LoginUseCase {
  constructor(private usuarioRepository: IUsuarioRepository) {}

  async execute(email: string, senha: string): Promise<LoginResponseDTO> {
    const usuario = await this.usuarioRepository.buscarPorEmail(email);
    if (!usuario) throw new Error('Usuário não encontrado');

    if (!await bcrypt.compare(senha, usuario.senha)) {
      throw new Error('Senha incorreta');
    }

    const token = jwt.sign(
      { usuarioId: usuario.id, email: usuario.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    return { token, usuario: this.mapToDTO(usuario) };
  }
}
```

### 2. Middleware no Controller
```typescript
function autenticar(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Token required' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

// Usar
app.post('/api/denuncias', autenticar, (req, res) => controller.criar(req, res));
```

### 3. Mobile: Armazenar token
```typescript
async function fazerLogin(email: string, senha: string) {
  const { token } = await loginApi.login(email, senha);
  
  // Armazenar
  await AsyncStorage.setItem('auth_token', token);
  
  // Usar em próximas requisiçoes
  apiClient.setToken(token);
}
```

---

## 📈 Quick Reference

| Tarefa | Onde fazer | Exemplo |
|--------|-----------|---------|
| Adicionar nova entidade | `domain/entities/` | `class Usuario` |
| Adicionar novo UseCase | `application/useCases/` | `CriarXUseCase` |
| Adicionar novo controller | `infrastructure/http/controllers/` | `XController` |
| Adicionar nova screen | `mobile/src/views/` | `XScreen.tsx` |
| Adicionar novo hook | `mobile/src/viewModels/` | `useXViewModel.ts` |
| Adicionar tipo | `mobile/src/models/` | `interface X` |
| Adicionar helper | `mobile/src/utils/` | `export function X()` |
| Escrever teste | `backend/tests/` | `.spec.ts` |

