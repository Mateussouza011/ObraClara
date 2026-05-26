import { useMemo, useState } from 'react';
import { useObraViewModel } from '@hooks/useObraViewModel';
import { MapComponent } from '@components/MapComponent';
import { ObraCard } from '@components/ObraCard';
import { Layout } from '@components/Layout';
import type { TutorialStep } from '@components/InteractiveTutorial';
import { CIDADES_TO } from '@models';
import './MapPage.css';

const TOCANTINS_WIDE_RADIUS_KM = 900;

const mapTutorialSteps: TutorialStep[] = [
  {
    title: 'Bem-vindo ao mapa',
    message:
      'Oi! Eu sou seu guia. Vou te mostrar como encontrar obras no Tocantins, filtrar resultados e abrir os canais oficiais quando precisar denunciar.',
    target: '[data-tutorial="map-area"]',
  },
  {
    title: 'Ajuste o raio de cobertura',
    message:
      'Aqui você escolhe quantos quilômetros quer analisar. Ao mudar o raio, o mapa se aproxima ou afasta e a lista mostra só as obras dentro da área.',
    target: '[data-tutorial="coverage-filter"]',
  },
  {
    title: 'Organize e filtre as obras',
    message:
      'Use a ordenação para ver primeiro as obras mais próximas ou em ordem alfabética. A esfera separa obras federais, estaduais e municipais.',
    target: '[data-tutorial="classification-filters"]',
  },
  {
    title: 'Explore o mapa',
    message:
      'Cada marcador representa uma obra. Clique no marcador para ver bairro, status, progresso, distância e o link do portal oficial.',
    target: '[data-tutorial="map-area"]',
  },
  {
    title: 'Filtre pela cidade',
    message:
      'Use esta lista para escolher a cidade. Assim o resultado fica limitado às obras daquela localidade.',
    target: '[data-tutorial="city-filter"]',
  },
  {
    title: 'Busque pelo nome',
    message:
      'Se souber o nome da obra, digite aqui. Este campo busca somente pelo nome; cidade fica no filtro acima.',
    target: '[data-tutorial="sidebar-search"]',
  },
  {
    title: 'Abra os detalhes oficiais',
    message:
      'Os cards mostram investimento, executor, datas e distância. Ao clicar em uma obra com fonte oficial, o sistema abre o portal de origem.',
    target: '[data-tutorial="obras-list"]',
  },
  {
    title: 'Canais de denúncia',
    message:
      'Quando precisar registrar uma manifestação, entre em Denúncias. Lá você escolhe a esfera da obra e encontra o canal oficial correto.',
    target: '[data-tutorial="nav-denuncias"]',
  },
];

export function MapPage() {
  const [obrasSelecionada, setObraSelecionada] = useState<string | null>(null);
  const [ordenacao, setOrdenacao] = useState<'distancia' | 'titulo'>('distancia');
  const [statusFiltro] = useState<string>('EM_EXECUCAO');
  const [esferaFiltro, setEsferaFiltro] = useState<string>('TODOS');
  const [cidadeFiltro, setCidadeFiltro] = useState<string>('TODAS');
  const [buscaNome, setBuscaNome] = useState('');
  const buscaAtiva = buscaNome.trim().length > 0;
  const cidadeFiltroAtivo = cidadeFiltro !== 'TODAS';

  const {
    loading,
    error,
    localizacao,
    precisaoMetros,
    raioFiltro,
    setRaioFiltro,
    obterObraOrdenada,
  } = useObraViewModel(buscaAtiva || cidadeFiltroAtivo ? TOCANTINS_WIDE_RADIUS_KM : undefined);

  const obrasOrdenadas = obterObraOrdenada(ordenacao);

  const obrasNoRaioAtual = useMemo(() => {
    if (!localizacao) {
      return [];
    }

    const termoBusca = normalizarTexto(buscaNome);
    const cidadeSelecionada = cidadeFiltroAtivo ? normalizarTexto(cidadeFiltro) : '';

    return obrasOrdenadas.filter((obra) => {
      const distancia = calcularDistanciaEmKm(
        localizacao.latitude,
        localizacao.longitude,
        obra.latitude,
        obra.longitude
      );

      const statusOk = statusFiltro === 'TODOS' || obra.status === statusFiltro;
      const esferaOk = esferaFiltro === 'TODOS' || obra.esfera === esferaFiltro;
      const cidadeOk =
        !cidadeFiltroAtivo ||
        obraPertenceACidade(obra, cidadeSelecionada);
      const nomeOk = !termoBusca || normalizarTexto(obra.titulo).includes(termoBusca);
      const raioOk = buscaAtiva || cidadeFiltroAtivo || distancia <= raioFiltro;

      return raioOk && statusOk && esferaOk && cidadeOk && nomeOk;
    });
  }, [
    localizacao,
    obrasOrdenadas,
    raioFiltro,
    statusFiltro,
    esferaFiltro,
    cidadeFiltroAtivo,
    cidadeFiltro,
    buscaNome,
    buscaAtiva,
  ]);

  return (
    <Layout
      tutorialSteps={mapTutorialSteps}
      tutorialStorageKey="monitora-map-tutorial-v1"
    >
      <div className="map-page">
        <div className="filter-bar" data-tutorial="filters-bar">
          <div className="filter-item filter-slider-container" data-tutorial="coverage-filter">
            <label htmlFor="raio-slider">Raio de cobertura</label>
            <div className="slider-controls">
              <input
                id="raio-slider"
                type="range"
                min={1}
                max={TOCANTINS_WIDE_RADIUS_KM}
                step={1}
                value={raioFiltro}
                onChange={(e) => {
                  setRaioFiltro(Number(e.target.value));
                }}
                className="raio-slider"
              />
              <div className="raio-input-wrapper">
                <input
                  type="number"
                  min={1}
                  max={TOCANTINS_WIDE_RADIUS_KM}
                  value={raioFiltro || ''}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val > TOCANTINS_WIDE_RADIUS_KM) {
                      setRaioFiltro(TOCANTINS_WIDE_RADIUS_KM);
                    } else {
                      setRaioFiltro(val);
                    }
                  }}
                  onBlur={() => {
                    if (!raioFiltro || raioFiltro < 1) {
                      setRaioFiltro(1);
                    }
                  }}
                  className="raio-manual-input"
                />
                <span className="raio-unit">km</span>
              </div>
            </div>
          </div>

          <div className="filter-separator" />

          <div className="filter-item" data-tutorial="classification-filters">
            <label htmlFor="sort-select">Ordenar por</label>
            <select
              id="sort-select"
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value as 'distancia' | 'titulo')}
            >
              <option value="distancia">Proximidade</option>
              <option value="titulo">Ordem Alfabética</option>
            </select>
          </div>

          <div className="filter-separator" />

          <div className="filter-item" data-tutorial="classification-filters">
            <label htmlFor="esfera-select">Esfera</label>
            <select
              id="esfera-select"
              value={esferaFiltro}
              onChange={(e) => setEsferaFiltro(e.target.value)}
            >
              <option value="TODOS">Todas</option>
              <option value="Estadual">Estadual (TO)</option>
              <option value="Federal">Federal</option>
              <option value="Municipal">Municipal</option>
            </select>
          </div>

          <div className="filter-separator" />

          <div className="filter-stats" data-tutorial="results-count">
            <span className="stats-number">{obrasNoRaioAtual.length}</span>
            <span className="stats-label">Obras encontradas</span>
          </div>
        </div>

        <div className="map-section" data-tutorial="map-area">
          {localizacao && (
            <MapComponent
              obras={obrasNoRaioAtual}
              userLocation={localizacao}
              raioKm={raioFiltro}
              accuracyMeters={precisaoMetros}
              selectedObraId={obrasSelecionada}
              onObraSelect={(obra) => setObraSelecionada(obra.id)}
            />
          )}
        </div>

        <div className="sidebar">
          <div className="sidebar-header">
            <h2>Lista de Obras</h2>

            <label className="search-label" htmlFor="cidade-filter">
              Filtrar por cidade
            </label>

            <div className="sidebar-search" data-tutorial="city-filter">
              <select
                id="cidade-filter"
                value={cidadeFiltro}
                onChange={(e) => setCidadeFiltro(e.target.value)}
                className="search-input city-filter-select"
              >
                <option value="TODAS">Todas as cidades</option>
                {CIDADES_TO.map((cidade) => (
                  <option key={cidade} value={cidade}>
                    {cidade}
                  </option>
                ))}
              </select>
            </div>

            <label className="search-label" htmlFor="obras-search">
              Buscar por nome da obra
            </label>

            <div className="sidebar-search" data-tutorial="sidebar-search">
              <input
                id="obras-search"
                type="text"
                placeholder="Digite o nome da obra..."
                value={buscaNome}
                onChange={(e) => setBuscaNome(e.target.value)}
                className="search-input"
              />
              {buscaNome && (
                <button
                  className="search-clear-btn"
                  onClick={() => setBuscaNome('')}
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
          {loading && <div className="loading-message">Atualizando dados...</div>}

          <div className="obras-list" data-tutorial="obras-list">
            {obrasNoRaioAtual.map((obra) => (
              <div
                key={obra.id}
                className={obrasSelecionada === obra.id ? 'selected' : ''}
              >
                <ObraCard
                  obra={obra}
                  distancia={(obra as any).distancia}
                  onClick={() => setObraSelecionada(obra.id)}
                />
              </div>
            ))}

            {obrasNoRaioAtual.length === 0 && !loading && (
              <div className="no-results">
                <p>Nenhuma obra encontrada com os filtros atuais.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function calcularDistanciaEmKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const raioTerraKm = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return raioTerraKm * c;
}

function normalizarTexto(valor?: string | null): string {
  return String(valor ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function obraPertenceACidade(obra: { bairro?: string; endereco?: string }, cidadeBusca: string): boolean {
  const localidades = [
    normalizarTexto(obra.bairro),
    extrairCidadeDoEndereco(obra.endereco),
  ].filter(Boolean);

  return localidades.some((localidade) => localidade === cidadeBusca);
}

function extrairCidadeDoEndereco(endereco?: string | null): string {
  const enderecoNormalizado = normalizarTexto(endereco);
  if (!enderecoNormalizado) {
    return '';
  }

  const semUf = enderecoNormalizado.replace(/\s*-\s*to\b.*$/, '').trim();
  const partes = semUf
    .split(',')
    .map((parte) => parte.trim())
    .filter(Boolean);

  return partes[partes.length - 1] || semUf;
}
