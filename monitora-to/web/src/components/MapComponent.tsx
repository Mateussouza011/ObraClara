import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import { Obra } from '@models/Obra';
import './MapComponent.css';

interface MapComponentProps {
  obras: Obra[];
  userLocation: { latitude: number; longitude: number } | null;
  raioKm: number;
  accuracyMeters?: number | null;
  selectedObraId?: string | null;
  onObraSelect?: (obra: Obra) => void;
}

function FocusObraOnMap({
  selectedObraId,
  obras,
}: {
  selectedObraId?: string | null;
  obras: Obra[];
}) {
  const map = useMap();

  useEffect(() => {
    if (!selectedObraId) {
      return;
    }

    const obraSelecionada = obras.find((obra) => obra.id === selectedObraId);
    if (!obraSelecionada) {
      return;
    }

    map.flyTo([obraSelecionada.latitude, obraSelecionada.longitude], Math.max(map.getZoom(), 15), {
      animate: true,
      duration: 0.8,
    });
  }, [map, obras, selectedObraId]);

  return null;
}

export function MapComponent({
  obras,
  userLocation,
  raioKm,
  accuracyMeters,
  selectedObraId,
  onObraSelect,
}: MapComponentProps) {
  if (!userLocation) {
    return <div className="map-loading">Carregando mapa...</div>;
  }

  const center: LatLngExpression = [userLocation.latitude, userLocation.longitude];

  return (
    <MapContainer center={center} zoom={13} className="map-container">
      <FocusObraOnMap selectedObraId={selectedObraId} obras={obras} />

      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      {/* Marcador de posição do usuário */}
      <Marker position={center}>
        <Popup>
          <div className="popup-content">
            <p className="popup-title">Sua Localização</p>
            <p className="popup-text">
              Lat: {userLocation.latitude.toFixed(4)}
            </p>
            <p className="popup-text">
              Lon: {userLocation.longitude.toFixed(4)}
            </p>
            <p className="popup-text">Raio visual: {raioKm} km</p>
            {typeof accuracyMeters === 'number' && (
              <p className="popup-text">Precisão GPS: ±{Math.round(accuracyMeters)} m</p>
            )}
          </div>
        </Popup>
      </Marker>

      {typeof accuracyMeters === 'number' && accuracyMeters > 0 && accuracyMeters <= 300 && (
        <Circle
          center={center}
          radius={accuracyMeters}
          pathOptions={{
            color: '#0ea5e9',
            weight: 1,
            fillColor: '#7dd3fc',
            fillOpacity: 0.15,
            dashArray: '4 6',
          }}
        />
      )}

      {/* Círculo dinâmico do raio selecionado */}
      <Circle
        center={center}
        radius={raioKm * 1000}
        pathOptions={{
          color: '#2563eb',
          weight: 2,
          fillColor: '#60a5fa',
          fillOpacity: 0.12,
        }}
      />

      {/* Marcadores de obras */}
      {obras.map((obra) => (
        <Marker
          key={obra.id}
          position={[obra.latitude, obra.longitude]}
          eventHandlers={{
            click: () => onObraSelect?.(obra),
          }}
        >
          <Popup>
            <div className="popup-content">
              <p className="popup-title">{obra.titulo}</p>
              <p className="popup-text">{obra.bairro}</p>
              <p className="popup-text">Status: {obra.status}</p>
              <p className="popup-text">Progresso: {obra.percentualProgresso}%</p>
              <p className="popup-text" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                {(obra as any).distancia?.toFixed(2) || '?'} km
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
