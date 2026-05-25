import React, { useState, useEffect } from 'react';
import { FundamentalEventsGuide } from './FundamentalEventsGuide';
const Plot = React.lazy(() => import('./PlotlyFactory'));

interface HistoricalEvent {
  id: number;
  evento: string;
  tipo: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  impacto: string;
  descripcion: string;
  causa_fundamental?: string;
  color?: string;
  icono?: string;
}

interface BacktestingChartProps {
  data: {
    fechas: string[];
    precio: number[];
    patronVela: number[];
    volma: number[];
    historial: number[];
    'datas closed': number[];
  };
}

export const BacktestingChart: React.FC<BacktestingChartProps> = ({ data }) => {
  const [historicalEvents, setHistoricalEvents] = useState<HistoricalEvent[]>([]);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // @ts-ignore
        const prefix = import.meta.env.VITE_PREFIX || 'http://localhost:8000';
        const response = await fetch(`${prefix}/api/backtesting/events/`);
        if (response.ok) {
          const result = await response.json();
          setHistoricalEvents(result);
        } else {
          console.error('Error in response:', response.status);
        }
      } catch (error) {
        console.error('Error fetching historical events:', error);
      }
    };
    fetchEvents();
  }, []);

  // Preparar datos para el gráfico con mejor formato de fechas
  const chartData = (data?.fechas || []).map((fecha, index) => ({
    fecha: fecha, // Mantener formato original para mejor ordenamiento
    fechaDisplay: fecha ? new Date(fecha).toLocaleDateString('es-ES', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : '',
    precio: data.precio?.[index] ?? 0,
    volumen: data.volma?.[index] ?? 0,
    patron: data.patronVela?.[index] ?? 0,
    historial: data.historial?.[index] ?? 0
  })).filter(d => d.precio !== null && d.precio !== undefined && !isNaN(d.precio));

  if (!chartData.length) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-gray-900/50 rounded-lg border border-gray-800">
        <p className="text-gray-400">No hay datos suficientes para mostrar el gráfico</p>
      </div>
    );
  }

  // Calcular rangos para mejor visualización
  const precios = chartData.map(d => d.precio);
  const minPrecio = precios.length > 0 ? Math.min(...precios) : 0;
  const maxPrecio = precios.length > 0 ? Math.max(...precios) : 100;
  const rangoPrecio = maxPrecio - minPrecio;

  const volumenes = chartData.map(d => d.volumen);
  const maxVolumen = volumenes.length > 0 ? Math.max(...volumenes) : 100;

  // Trace para el precio
  const priceTrace = {
    x: chartData.map(d => d.fecha),
    y: chartData.map(d => d.precio),
    type: 'scatter' as const,
    mode: 'lines' as const,
    name: 'Precio BTC/USDT',
    line: { color: '#f59e0b', width: 3 },
    hovertemplate: '<b>%{text}</b><br>Precio: $%{y:.2f}<extra></extra>',
    text: chartData.map(d => d.fechaDisplay)
  };

  // Trace para el volumen (como barras)
  const volumeTrace = {
    x: chartData.map(d => d.fecha),
    y: chartData.map(d => d.volumen),
    type: 'bar' as const,
    name: 'Volumen',
    yaxis: 'y2',
    marker: { color: 'rgba(16, 185, 129, 0.6)' },
    hovertemplate: '<b>%{text}</b><br>Volumen: %{y:.0f}<extra></extra>',
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
      size: 12,
      symbol: 'triangle-up',
      line: { color: '#ffffff', width: 2 }
    },
    hovertemplate: '<b>%{text}</b><br>Señal: $%{y:.2f}<extra></extra>',
    text: patternsData.map(d => d.fechaDisplay)
  };

  // Filtrar eventos históricos relevantes para el rango del gráfico
  const minDate = chartData.length > 0 ? new Date(chartData[0].fecha).getTime() : 0;
  const maxDate = chartData.length > 0 ? new Date(chartData[chartData.length - 1].fecha).getTime() : 0;

  const relevantEvents = historicalEvents.filter(ev => {
    const evTime = new Date(ev.fecha_inicio).getTime();
    // Margen para no cortar eventos que caigan un poco fuera (± 15 días)
    return evTime >= minDate - (86400000 * 15) && evTime <= maxDate + (86400000 * 15);
  });

  const eventShapes = relevantEvents.map(event => ({
    type: 'line',
    x0: event.fecha_inicio,
    x1: event.fecha_inicio,
    y0: 0,
    y1: 1,
    yref: 'paper',
    line: {
      color: event.color || 'rgba(139, 92, 246, 0.8)',
      width: 3,
      dash: 'solid'
    }
  }));

  const eventAnnotations = relevantEvents.map((event, index) => ({
    x: event.fecha_inicio,
    y: 0.95 - (index % 3) * 0.1, // Escalonar verticalmente para evitar solapamiento
    yref: 'paper',
    text: `${event.icono || '🚩'} ${event.evento}`,
    hovertext: `<b>${event.evento}</b><br><br><b>🎯 Causa Fundamental:</b><br>${event.causa_fundamental || event.descripcion}<br><br><b>📊 Impacto:</b> ${event.impacto}<br><b>📅 Fecha:</b> ${new Date(event.fecha_inicio).toLocaleDateString('es-ES')}<br><b>🏷️ Tipo:</b> ${event.tipo}`,
    showarrow: true,
    arrowhead: 2,
    arrowsize: 1,
    arrowwidth: 2,
    arrowcolor: event.color || '#8b5cf6',
    ax: 0,
    ay: -30,
    xanchor: 'center',
    font: { 
      color: 'white', 
      size: 10,
      family: 'Arial, sans-serif'
    },
    bgcolor: event.color || 'rgba(139, 92, 246, 0.9)',
    borderpad: 6,
    bordercolor: event.color || '#8b5cf6',
    borderwidth: 2,
    opacity: 0.95
  }));

  return (
    <div className="w-full space-y-4">
      <React.Suspense fallback={<div className="h-[500px] w-full flex items-center justify-center text-gray-400 bg-gray-900/50 rounded-lg animate-pulse">Cargando gráfico...</div>}>
        <Plot
          data={[priceTrace, volumeTrace, patternTrace]}
          layout={{
            title: {
              text: 'Análisis de Backtesting - BTC/USDT con Eventos Fundamentales',
              font: { color: '#e5e7eb', size: 18 }
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
              side: 'left',
              range: [minPrecio - (rangoPrecio * 0.05), maxPrecio + (rangoPrecio * 0.05)]
            },
            yaxis2: {
              title: { text: 'Volumen', font: { color: '#10b981' } },
              overlaying: 'y',
              side: 'right',
              showgrid: false,
              range: [0, maxVolumen * 1.2]
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
            margin: { l: 70, r: 70, t: 80, b: 120 },
            shapes: eventShapes,
            annotations: eventAnnotations,
            autosize: true,
            hovermode: 'x unified',
            showlegend: true,
            dragmode: 'zoom'
          }}
          useResizeHandler
          style={{ width: '100%', height: '500px' }}
          config={{
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d', 'autoScale2d'],
            toImageButtonOptions: {
              format: 'png',
              filename: 'backtesting_chart',
              height: 500,
              width: 1000,
              scale: 1
            }
          }}
        />
      </React.Suspense>
      
      {/* Leyenda de Eventos Fundamentales */}
      {relevantEvents.length > 0 && (
        <div className="bg-gray-900/50 rounded-lg border border-gray-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              🎯 Eventos Fundamentales en el Período
            </h3>
            <button
              onClick={() => setShowGuide(true)}
              className="text-sm px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1"
            >
              📚 ¿Qué son?
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {relevantEvents.map((event) => (
              <div 
                key={event.id} 
                className="bg-gray-800/50 rounded-lg p-3 border-l-4 hover:bg-gray-800/70 transition-colors"
                style={{ borderLeftColor: event.color || '#8b5cf6' }}
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg">{event.icono || '🚩'}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white text-sm truncate">
                      {event.evento.replace(/^[🚩🦠⚡🚗🇨🇳🇸🇻⚔️💥🏦🏛️📈🇩🇪⚖️🚀]+\s*/, '')}
                    </h4>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(event.fecha_inicio).toLocaleDateString('es-ES')}
                    </p>
                    <p className="text-xs text-gray-300 mt-1 line-clamp-2">
                      <span className="font-medium">Causa:</span> {event.causa_fundamental || event.descripcion}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span 
                        className={`text-xs px-2 py-1 rounded-full ${
                          event.impacto.includes('Positivo') ? 'bg-green-900/50 text-green-300' :
                          event.impacto.includes('Negativo') ? 'bg-red-900/50 text-red-300' :
                          'bg-yellow-900/50 text-yellow-300'
                        }`}
                      >
                        {event.impacto}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-xs text-gray-500 text-center">
            💡 Los eventos fundamentales muestran las causas reales detrás de los movimientos de precio, más allá de los indicadores técnicos
          </div>
        </div>
      )}

      <FundamentalEventsGuide 
        isOpen={showGuide} 
        onClose={() => setShowGuide(false)} 
      />
    </div>
  );
};