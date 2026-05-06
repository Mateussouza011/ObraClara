import { useMemo, useState } from 'react';
import { useObraViewModel } from '@hooks/useObraViewModel';
import { MapComponent } from '@components/MapComponent';
import { ObraCard } from '@components/ObraCard';
import { Layout } from '@components/Layout';
import './MapPage.css';

const TOCANTINS_WIDE_RADIUS_KM = 900;

export function MapPage() {
  const {
    loading,
    error,
    localizacao,
    precisaoMetros,
    raioFiltro,
    setRaioFiltro,
    obterObraOrdenada,
  } = useObraViewModel();

  const [obrasSelecionada, setObraSelecionada] = useState<string | null>(null);
  const [ordenacao, setOrdenacao] = useState<'distancia' | 'titulo'>('distancia');
  const [statusFiltro] = useState<string>('EM_EXECUCAO');
  const [esferaFiltro, setEsferaFiltro] = useState<string>('TODOS');
  const [buscaNome, setBuscaNome] = useState('');

  const obrasOrdenadas = obterObraOrdenada(ordenacao);

  const obrasNoRaioAtual = useMemo(() => {
    if (!localizacao) {
      return [];
    }

    const raioEmKm = raioFiltro;

    return obrasOrdenadas.filter((obra) => {
      const distancia = calcularDistanciaEmKm(
        localizacao.latitude,
        localizacao.longitude,
        obra.latitude,
        obra.longitude
      );
      const noRaio = distancia <= raioEmKm;
      const statusOk = statusFiltro === 'TODOS' || obra.status === statusFiltro;
      const esferaOk = esferaFiltro === 'TODOS' || obra.esfera === esferaFiltro;
      
      const nomeOk = !buscaNome || 
        obra.titulo.toLowerCase().includes(buscaNome.toLowerCase()) || 
        (obra.bairro && obra.bairro.toLowerCase().includes(buscaNome.toLowerCase()));
      
      return noRaio && statusOk && esferaOk && nomeOk;
    });
  }, [localizacao, obrasOrdenadas, raioFiltro, statusFiltro, esferaFiltro, buscaNome]);

  return (
    <Layout>
      <div className="map-page">
        <div className="filter-bar">
          <div className="filter-item filter-slider-container">
            <label htmlFor="raio-slider">Raio de Busca</label>
            <div className="slider-controls">
              <input
                id="raio-slider"
                type="range"
                min={1}
                max={TOCANTINS_WIDE_RADIUS_KM}
                step={1}
                value={raioFiltro}
                onChange={(e) => setRaioFiltro(Number(e.target.value))}
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

          <div className="filter-item">
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

          <div className="filter-item">
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

          <div className="filter-stats">
            <span className="stats-number">{obrasNoRaioAtual.length}</span>
            <span className="stats-label">Obras encontradas</span>
          </div>
        </div>

        <div className="map-section">
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
            <p className="sidebar-subtitle">Tocantins em Foco</p>
            
            <div className="sidebar-search">
              <input
                type="text"
                placeholder="Buscar obra por nome ou bairro..."
                value={buscaNome}
                onChange={(e) => setBuscaNome(e.target.value)}
                className="search-input"
              />
              {buscaNome && (
                <button className="search-clear-btn" onClick={() => setBuscaNome('')}>
                  ✕
                </button>
              )}
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
          {loading && <div className="loading-message">Atualizando dados...</div>}

          <div className="obras-list">
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
                <p>Nenhuma obra encontrada neste raio.</p>
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
