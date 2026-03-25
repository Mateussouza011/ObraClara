import { Obra, statusColor, statusLabel, progressColor } from '@models/Obra';
import { ProgressBar } from './ProgressBar';
import './ObraCard.css';

interface ObraCardProps {
  obra: Obra;
  distancia?: number;
  onClick?: () => void;
}

export function ObraCard({ obra, distancia, onClick }: ObraCardProps) {
  const dataFimFormatada = obra.dataFimPrevista
    ? new Date(obra.dataFimPrevista).toLocaleDateString('pt-BR')
    : 'Não definido';

  const descricaoOriginal = obra.descricao || '';
  const temHtmlBruto = /<\/?[a-z][\s\S]*?>/i.test(descricaoOriginal);
  const temHtmlEscapado = /&lt;\/?[a-z][\s\S]*?&gt;/i.test(descricaoOriginal);

  const descricaoLimpa = descricaoOriginal
    .replace(/<[^>]*>/g, ' ')
    .replace(/&lt;[^&]*&gt;/gi, ' ')
    .replace(/&(?:nbsp|amp|quot|#39);/gi, ' ')
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const textoDescricaoBase = temHtmlBruto || temHtmlEscapado
    ? 'Detalhes indisponíveis no momento.'
    : (descricaoLimpa || 'Sem descrição.');

  const textoDescricao = textoDescricaoBase.length > 100
    ? `${textoDescricaoBase.substring(0, 100)}...`
    : textoDescricaoBase;

  return (
    <div className="obra-card" onClick={onClick}>
      <div className="obra-card-header">
        <h3 className="obra-card-title">{obra.titulo}</h3>
        <span
          className="obra-card-status"
          style={{ backgroundColor: statusColor(obra.status) }}
        >
          {statusLabel(obra.status)}
        </span>
      </div>

      <p className="obra-card-bairro">📍 {obra.bairro}</p>

      <div className="obra-card-content">
        <p className="obra-card-text">
          <strong>Tipo:</strong> {obra.tipo}
        </p>
        <p className="obra-card-text">
          <strong>Fim previsto:</strong> {dataFimFormatada}
        </p>

        {distancia !== undefined && (
          <p className="obra-card-text">
            <strong>Distância:</strong> {distancia.toFixed(2)} km
          </p>
        )}
      </div>

      <div className="obra-card-progress">
        <div className="progress-label">
          <span>Progresso</span>
          <span style={{ color: progressColor(obra.percentualProgresso) }}>
            {obra.percentualProgresso}%
          </span>
        </div>
        <ProgressBar value={obra.percentualProgresso} />
      </div>

      <div className="obra-card-description">
        <p>{textoDescricao}</p>
      </div>
    </div>
  );
}
