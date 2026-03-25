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
      return distancia <= raioEmKm;
    });
  }, [localizacao, obrasOrdenadas, raioFiltro]);

  return (
    <Layout>
      <div className="map-page">
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
            <h2>Obras Próximas</h2>
            <p className="sidebar-subtitle">
              {obrasNoRaioAtual.length} obra{obrasNoRaioAtual.length !== 1 ? 's' : ''} encontrada
              {obrasNoRaioAtual.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="filters">
            <div className="filter-group">
              <label htmlFor="raio-slider">Raio (km)</label>
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
              <div className="raio-slider-marks" aria-hidden="true">
                <span>1 km</span>
                <span>Todo o TO</span>
              </div>
              <div className="raio-slider-value" aria-live="polite">
                <span className="raio-slider-label">Raio atual</span>
                <span className="raio-slider-number">
                  {raioFiltro >= TOCANTINS_WIDE_RADIUS_KM
                    ? 'Todo o TO'
                    : `${raioFiltro} km`}
                </span>
              </div>
            </div>

            <div className="filter-group">
              <label>Ordenar por</label>
              <select
                value={ordenacao}
                onChange={(e) =>
                  setOrdenacao(e.target.value as 'distancia' | 'titulo')
                }
              >
                <option value="distancia">Distância</option>
                <option value="titulo">Título</option>
              </select>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
          {loading && <div className="loading-message">Carregando...</div>}

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
