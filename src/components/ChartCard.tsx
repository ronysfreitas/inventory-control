import { Chart, registerables, type ChartConfiguration } from 'chart.js';
import { useEffect, useRef } from 'preact/hooks';

Chart.register(...registerables);

interface ChartCardProps {
  title: string;
  description?: string;
  config: unknown;
  height?: number;
  hasData?: boolean;
  emptyMessage?: string;
}

export default function ChartCard({
  title,
  description,
  config,
  height = 320,
  hasData = true,
  emptyMessage = 'Sem dados suficientes para gerar este gráfico ainda.'
}: ChartCardProps) {
  const safeHeight = Math.min(height, 500);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !hasData) {
      return;
    }

    const chart = new Chart(
      canvasRef.current,
      JSON.parse(JSON.stringify(config)) as ChartConfiguration
    );

    return () => {
      chart.destroy();
    };
  }, [config, hasData]);

  return (
    <article class="card chart-card">
      <header class="card__header">
        <div>
          <h3>{title}</h3>
          {description ? <p>{description}</p> : null}
        </div>
      </header>

      {hasData ? (
        <div class="chart-card__canvas" style={{ maxHeight: `${safeHeight}px` }}>
          <canvas
            ref={canvasRef}
            height={safeHeight}
            style={{ maxHeight: `${safeHeight}px` }}
          />
        </div>
      ) : (
        <div class="empty-state empty-state--chart">
          <p>{emptyMessage}</p>
        </div>
      )}
    </article>
  );
}
