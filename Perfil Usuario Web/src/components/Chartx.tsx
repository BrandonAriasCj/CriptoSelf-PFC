import React, { useEffect, useState } from "react";
const Plot = React.lazy(() => import('./PlotlyFactory'));

interface TradingData {
  timestamp: string;
  close: number;
  sma: number;
  rsi: number;
}

const TradingChartDark: React.FC = () => {
  const [data, setData] = useState<TradingData[]>([]);

  useEffect(() => {
    // Datos de demostración
    const demoData: TradingData[] = [
      { timestamp: "2025-10-01", close: 100, sma: 98, rsi: 45 },
      { timestamp: "2025-10-02", close: 102, sma: 99, rsi: 52 },
      { timestamp: "2025-10-03", close: 101, sma: 100, rsi: 48 },
      { timestamp: "2025-10-04", close: 105, sma: 101, rsi: 60 },
      { timestamp: "2025-10-05", close: 107, sma: 103, rsi: 65 },
      { timestamp: "2025-10-06", close: 104, sma: 104, rsi: 55 },
    ];
    setData(demoData);
  }, []);

  const priceTrace = {
    x: data.map((d) => d.timestamp),
    y: data.map((d) => d.close),
    type: "scatter" as const,
    mode: "lines+markers" as const,
    name: "Precio",
    line: { color: "#60a5fa", width: 2 },
  };

  const smaTrace = {
    x: data.map((d) => d.timestamp),
    y: data.map((d) => d.sma),
    type: "scatter" as const,
    mode: "lines" as const,
    name: "SMA",
    line: { color: "#facc15", dash: "dot" },
  };

  const rsiTrace = {
    x: data.map((d) => d.timestamp),
    y: data.map((d) => d.rsi),
    type: "scatter" as const,
    mode: "lines" as const,
    name: "RSI",
    yaxis: "y2",
    line: { color: "#34d399", width: 2 },
  };

  return (
    <React.Suspense fallback={<div className="h-[500px] w-full flex items-center justify-center text-gray-400 bg-gray-900/50 rounded-lg animate-pulse">Cargando gráfico...</div>}>
      <Plot
        data={[priceTrace, smaTrace, rsiTrace]}
        layout={{
          title: {
            text: "📈 Gráfico Trading (Tema Oscuro)",
            font: { color: "#e5e7eb" },
          },
          paper_bgcolor: "#111827", // fondo principal
          plot_bgcolor: "#111827", // fondo del gráfico
          font: { color: "#d1d5db" }, // color del texto
          xaxis: {
            title: { text: "Fecha" },
            gridcolor: "#374151",
            zerolinecolor: "#4b5563",
          },
          yaxis: {
            title: { text: "Precio" },
            gridcolor: "#374151",
            zerolinecolor: "#4b5563",
          },
          yaxis2: {
            title: "RSI",
            overlaying: "y",
            side: "right",
            range: [0, 100],
            showgrid: false,
          },
          legend: {
            orientation: "h",
            y: -0.2,
            font: { color: "#d1d5db" },
          },
          margin: { l: 50, r: 50, t: 60, b: 50 },
          autosize: true,
        }}
        useResizeHandler
        style={{ width: "100%", height: "500px" }}
        config={{ displayModeBar: true }}
      />
    </React.Suspense>
  );
};

export default TradingChartDark;
