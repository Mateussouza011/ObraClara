import { Obra, statusColor, statusLabel, esferaColor } from '@models/Obra';
import './ObraCard.css';

interface ObraCardProps {
  obra: Obra;
  distancia?: number;
  onClick?: () => void;
}

export function ObraCard({ obra, distancia, onClick }: ObraCardProps) {
  const dataInicioFormatada = obra.dataInicio
    ? new Date(obra.dataInicio).toLocaleDateString('pt-BR')
    : 'Não informado';

  const dataFimFormatada = obra.dataFimPrevista
    ? new Date(obra.dataFimPrevista).toLocaleDateString('pt-BR')
    : 'Não informado';

  const valorFormatado = obra.valorInvestimento
    ? obra.valorInvestimento.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : null;

  const handleClick = () => {
    if (onClick) onClick();
    if (obra.fonteUrl) {
      window.open(obra.fonteUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Helper to convert hex to rgba for light glows
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const statusBaseColor = statusColor(obra.status);
  const cardStyle = {
    '--status-color': statusBaseColor,
    '--status-color-light': hexToRgba(statusBaseColor, 0.2),
  } as React.CSSProperties;

  return (
    <div className="obra-card" onClick={handleClick} style={cardStyle}>
      <div className="obra-card-header">
        <h3 className="obra-card-title">{obra.titulo}</h3>
        <div className="obra-card-badges">
          <span
            className="obra-card-esfera"
            style={{ 
              '--badge-bg': hexToRgba(esferaColor(obra.esfera), 0.15),
              '--badge-color': esferaColor(obra.esfera) 
            } as React.CSSProperties}
          >
            {obra.esfera}
          </span>
          <span
            className="obra-card-status"
            style={{ 
              '--badge-bg': hexToRgba(statusBaseColor, 0.15),
              '--badge-color': statusBaseColor 
            } as React.CSSProperties}
          >
            {statusLabel(obra.status)}
          </span>
        </div>
      </div>

      <p className="obra-card-bairro">📍 {obra.bairro}</p>

      <div className="obra-card-content">
        <p className="obra-card-text">
          <strong>Tipo:</strong> {obra.tipo}
        </p>
        {obra.executor && (
          <p className="obra-card-text">
            <strong>Executor:</strong> {obra.executor}
          </p>
        )}
        <p className="obra-card-text">
          <strong>Início:</strong> {dataInicioFormatada}
        </p>
        <p className="obra-card-text">
          <strong>Término Previsto:</strong> {dataFimFormatada}
        </p>

        {valorFormatado && (
          <p className="obra-card-text obra-card-valor">
            <strong>Investimento:</strong> {valorFormatado}
          </p>
        )}

        {distancia !== undefined && (
          <p className="obra-card-text" style={{ marginTop: '0.5rem', color: 'var(--primary-strong)' }}>
            <strong>Distância:</strong> {distancia.toFixed(2)} km
          </p>
        )}
      </div>

      <div className="obra-card-footer">
        <span className="obra-card-fonte-link">
          🔗 Ver no portal oficial
        </span>
      </div>
    </div>
  );
}
