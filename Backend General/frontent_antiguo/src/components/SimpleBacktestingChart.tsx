import React from 'react';
const Plot = React.lazy(() => import('./PlotlyFactory'));

interface SimpleBacktestingChartProps {
  data: {
    fechas: string[];
    precio: number[];
    patronVela: number[];
    volma: number[];
    historial: number[];
    'datas closed': number[];
  };
}

export const SimpleBacktestingChart: React.FC<SimpleBacktestingChartProps> = ({ data }) => {
  // Preparar datos para el gráfico
  const chartData = (data?.fechas || []).map((fecha, index) => ({
    fecha: fecha,
    fechaDisplay: fecha ? new Date(fecha).toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : '',
    precio: data.precio?.[index] ?? 0,
    patron: data.patronVela?.[index] ?? 0
  })).filter(d => d.precio !== null && d.precio !== undefined && !isNaN(d.precio));

  if (!chartData.length) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-gray-900/50 rounded-lg border border-gray-800">
        <p className="text-gray-400">No hay datos suficientes para mostrar el gráfico</p>
      </div>
    );
  }

  // Calcular rango de precios para mejor visualización
  const precios = chartData.map(d => d.precio);
  const minPrecio = precios.length > 0 ? Math.min(...precios) : 0;
  const maxPrecio = precios.length > 0 ? Math.max(...precios) : 100;
  const rangoPrecio = maxPrecio - minPrecio;

  // Trace para el precio
  const priceTrace = {
    x: chartData.map(d => d.fecha),
    y: chartData.map(d => d.precio),
    type: 'scatter' as const,
    mode: 'lines' as const,
    name: 'Precio BTC/USDT',
    line: { color: '#f59e0b', width: 3 },
    fill: 'tozeroy',
    fillcolor: 'rgba(245, 158, 11, 0.1)',
    hovertemplate: '<b>%{text}</b><br>Precio: $%{y:.2f}<extra></extra>',
    text: chartData.map(d => d.fechaDisplay)
  };

  // Trace para patrones de velas (solo puntos donde hay patrón)
  const patternsData = chartData.filter(d => d.patron > 0);
  const patternTrace = {
    x: patternsData.map(d => d.fecha),
    y: patternsData.map(d => d.precio),
    type: 'scatter' as const,
    mode: 'markers' as const,
    name: 'Señales de Trading',
    marker: {
      color: '#ef4444',
      size: 14,
      symbol: 'triangle-up',
      line: { color: '#ffffff', width: 2 }
    },
    hovertemplate: '<b>%{text}</b><br>Señal: $%{y:.2f}<extra></extra>',
    text: patternsData.map(d => d.fechaDisplay)
  };

  return (
    <div className="w-full">
      <React.Suspense fallback={<div className="h-[400px] w-full flex items-center justify-center text-gray-400 bg-gray-900/50 rounded-lg animate-pulse">Cargando gráfico...</div>}>
        <Plot
          data={[priceTrace, patternTrace]}
          layout={{
            title: {
              text: '💹 Precio BTC/USDT con Señales de Trading',
              font: { color: '#e5e7eb', size: 16 }
            },
            paper_bgcolor: '#111827',
            plot_bgcolor: '#1f2937',
            font: { color: '#d1d5db' },
            xaxis: {
              title: { text: 'Tiempo', font: { color: '#9ca3af' } },
              gridcolor: '#374151',
              zerolinecolor: '#4b5563',
              tickangle: -45,
              type: 'date'
            },
            yaxis: {
              title: { text: 'Precio (USDT)', font: { color: '#f59e0b' } },
              gridcolor: '#374151',
              zerolinecolor: '#4b5563',
              range: [minPrecio - (rangoPrecio * 0.02), maxPrecio + (rangoPrecio * 0.02)]
            },
            legend: {
              orientation: 'h',
              y: -0.2,
              x: 0.5,
              xanchor: 'center',
              font: { color: '#d1d5db', size: 12 },
              bgcolor: 'rgba(17, 24, 39, 0.9)',
              bordercolor: '#374151',
              borderwidth: 1
            },
            margin: { l: 70, r: 60, t: 60, b: 100 },
            autosize: true,
            hovermode: 'x unified',
            showlegend: true,
            dragmode: 'zoom'
          }}
          useResizeHandler
          style={{ width: '100%', height: '400px' }}
          config={{
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d', 'autoScale2d'],
            toImageButtonOptions: {
              format: 'png',
              filename: 'simple_backtesting_chart',
              height: 400,
              width: 800,
              scale: 1
            }
          }}
        />
      </React.Suspense>
    </div>
  );
};