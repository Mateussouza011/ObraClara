import { progressColor } from '@models/Obra';
import './ProgressBar.css';

interface ProgressBarProps {
  value: number;
}

export function ProgressBar({ value }: ProgressBarProps) {
  const percentage = Math.min(Math.max(value, 0), 100);
  const color = progressColor(percentage);

  return (
    <div className="progress-bar-container">
      <div
        className="progress-bar-fill"
        style={{
          width: `${percentage}%`,
          backgroundColor: color,
        }}
      />
    </div>
  );
}
