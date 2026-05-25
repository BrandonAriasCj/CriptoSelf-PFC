import React, { useEffect, useRef, useState } from "react";

interface Position {
  id: string;
  type: 'long' | 'short';
  pair: string;
  size: number;
  entryPrice: number;
  leverage: number;
  margin: number;
  stopLoss?: number;
  takeProfit?: number;
  timestamp: Date;
  status: 'open' | 'closed';
  pnl: number;
  unrealizedPnL: number;
}

interface PriceChartProps {
  selectedPair?: string;
  positions?: Position[];
  currentPrice?: number;
}

interface PriceData {
  time: string;
  timestamp?: number;
  price: number;
}

const PriceChart: React.FC<PriceChartProps> = ({ 
  selectedPair = 'BTC/USDT', 
  positions = [], 
  currentPrice: externalCurrentPrice 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredPosition, setHoveredPosition] = useState<Position | null>(null);
  const [mousePos, setMousePos] = useState<{x: number, y: number}>({x: 0, y: 0});
  const wsRef = useRef<WebSocket | null>(null);
  
  // Estados para indicadores técnicos
  const [showSMA, setShowSMA] = useState(true);
  const [showEMA, setShowEMA] = useState(false);
  const [smaPeriod, setSmaPeriod] = useState(20);
  const [emaPeriod, setEmaPeriod] = useState(20);

  // Estados para colapsar overlays
  const [isPriceInfoCollapsed, setIsPriceInfoCollapsed] = useState(false);
  const [isChartControlsCollapsed, setIsChartControlsCollapsed] = useState(false);
  const [isIndicatorsCollapsed, setIsIndicatorsCollapsed] = useState(false);
  const [isLegendCollapsed, setIsLegendCollapsed] = useState(false);

  // Constantes para la persistencia
  // 30 minutos: permite almacenar los 30 klines de Binance sin que cleanOldData los descarte
  const HISTORY_DURATION = 30 * 60 * 1000; // 30 minutos en milisegundos
  const STORAGE_KEY_PREFIX = 'priceChart_';

  // Mapear pares de trading a símbolos de Binance
  const getSymbolForPair = (pair: string): string => {
    const symbolMap: { [key: string]: string } = {
      'BTC/USDT': 'btcusdt',
      'ETH/USDT': 'ethusdt',
      'ADA/USDT': 'adausdt',
      'SOL/USDT': 'solusdt',
    };
    return symbolMap[pair] || 'btcusdt';
  };

  // Obtener datos históricos de Binance
  const fetchHistoricalData = async (pair: string, minutes: number = 5): Promise<PriceData[]> => {
    try {
      const symbol = getSymbolForPair(pair);
      // Obtener klines de 1 minuto de los últimos N minutos
      const limit = minutes;
      const endTime = Date.now();
      const startTime = endTime - (minutes * 60 * 1000);
      
      const url = `https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=1m&limit=${limit}&startTime=${startTime}&endTime=${endTime}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const klines = await response.json();
      
      // Convertir klines a PriceData
      const historicalData: PriceData[] = klines.map((kline: any[]) => ({
        time: new Date(kline[0]).toISOString(), // timestamp de apertura
        timestamp: kline[0],
        price: parseFloat(kline[4]), // precio de cierre
      }));
      
      return historicalData;
    } catch (error) {
      console.error(`Error fetching historical data for ${pair}:`, error);
      return [];
    }
  };

  // Funciones de persistencia
  const getStorageKey = (pair: string) => `${STORAGE_KEY_PREFIX}${pair}`;

  const saveDataToStorage = (pair: string, data: PriceData[]) => {
    try {
      const storageData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(getStorageKey(pair), JSON.stringify(storageData));
    } catch (error) {
      console.warn('Error saving price data to localStorage:', error);
    }
  };

  const loadDataFromStorage = (pair: string): PriceData[] => {
    try {
      const stored = localStorage.getItem(getStorageKey(pair));
      if (!stored) return [];

      const { data, timestamp } = JSON.parse(stored);
      const now = Date.now();

      // Si los datos son muy antiguos (más de 5 minutos), no los usar
      if (now - timestamp > HISTORY_DURATION) {
        localStorage.removeItem(getStorageKey(pair));
        return [];
      }

      // Filtrar datos que sean más antiguos de 5 minutos
      const cutoffTime = now - HISTORY_DURATION;
      return data.filter((point: PriceData) =>
        (point.timestamp || new Date(point.time).getTime()) > cutoffTime
      );
    } catch (error) {
      console.warn('Error loading price data from localStorage:', error);
      return [];
    }
  };

  const cleanOldData = (data: PriceData[]): PriceData[] => {
    const cutoffTime = Date.now() - HISTORY_DURATION;
    return data.filter(point =>
      (point.timestamp || new Date(point.time).getTime()) > cutoffTime
    );
  };

  // Generar datos simulados solo si no hay datos en storage
  const generateSimulatedData = (pair: string, currentPrice?: number): PriceData[] => {
    const data: PriceData[] = [];
    // Usar el precio actual si está disponible, sino usar precios base
    const basePrice = currentPrice && currentPrice > 0 ? currentPrice :
      pair === 'BTC/USDT' ? 55000 :
      pair === 'ETH/USDT' ? 2600 :
      pair === 'ADA/USDT' ? 0.45 : 98;

    const now = Date.now();

    // Variación máxima por paso para cada par (aumentada para más variación visual)
    const maxStepVariation = pair === 'ADA/USDT' ? 0.002 : // ±0.2% por paso para ADA
      pair === 'BTC/USDT' ? 0.001 : // ±0.1% por paso para BTC
        pair === 'ETH/USDT' ? 0.0015 : // ±0.15% por paso para ETH
          0.002; // ±0.2% por paso para otros

    let simulatedPrice = basePrice;

    // Generar puntos con continuidad (random walk) - más puntos para mejor visualización
    for (let i = 60; i >= 0; i--) {
      const stamp = now - i * 5000;
      const time = new Date(stamp).toISOString(); // 5 segundos por punto

      // Aplicar variación al precio anterior con tendencia suave
      const randomVariation = (Math.random() - 0.5) * maxStepVariation;
      // Agregar una pequeña tendencia aleatoria para evitar líneas completamente planas
      const trend = (Math.random() - 0.5) * 0.0001;
      simulatedPrice = simulatedPrice * (1 + randomVariation + trend);

      // Asegurar que el precio no sea negativo o cero
      if (simulatedPrice <= 0) {
        simulatedPrice = basePrice;
      }

      data.push({
        time,
        timestamp: stamp,
        price: Number(simulatedPrice.toFixed(pair === 'ADA/USDT' ? 4 : 2)),
      });
    }

    return data;
  };

  // Calcular Media Móvil Simple (SMA)
  const calculateSMA = (data: PriceData[], period: number): number[] => {
    const sma: number[] = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        sma.push(NaN); // No hay suficientes datos
      } else {
        const sum = data.slice(i - period + 1, i + 1).reduce((acc, d) => acc + d.price, 0);
        sma.push(sum / period);
      }
    }
    return sma;
  };

  // Calcular Media Móvil Exponencial (EMA)
  const calculateEMA = (data: PriceData[], period: number): number[] => {
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);
    
    for (let i = 0; i < data.length; i++) {
      if (i === 0) {
        ema.push(data[i].price); // Primer valor es el precio
      } else {
        const prevEMA = ema[i - 1];
        const currentPrice = data[i].price;
        const newEMA = (currentPrice - prevEMA) * multiplier + prevEMA;
        ema.push(newEMA);
      }
    }
    return ema;
  };

  // Calcular indicadores técnicos con uso de caché (useMemo)
  const smaValues = React.useMemo(() => {
    return showSMA ? calculateSMA(priceData, smaPeriod) : [];
  }, [priceData, showSMA, smaPeriod]);

  const emaValues = React.useMemo(() => {
    return showEMA ? calculateEMA(priceData, emaPeriod) : [];
  }, [priceData, showEMA, emaPeriod]);

  // Dibujar el gráfico de líneas en canvas
  const drawChart = () => {
    const canvas = canvasRef.current;
    if (!canvas || priceData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar canvas
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    // Configurar colores
    const lineColor = '#3b82f6';
    const fillColor = 'rgba(59, 130, 246, 0.1)';
    const gridColor = '#374151';
    const textColor = '#9ca3af';

    // smaValues y emaValues ya precalculados arriba.
    
    // Calcular rangos con zoom automático adaptativo (incluyendo indicadores)
    const prices = priceData.map((d: PriceData) => d.price);
    const allValues = [
      ...prices,
      ...smaValues.filter(v => !isNaN(v)),
      ...emaValues.filter(v => !isNaN(v))
    ];
    const rawMinPrice = Math.min(...allValues);
    const rawMaxPrice = Math.max(...allValues);
    const rawRange = rawMaxPrice - rawMinPrice;

    // Calcular el precio promedio para determinar el contexto
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;

    // Determinar el rango mínimo basado en el precio promedio y el par
    let minRangePercent: number;
    if (selectedPair === 'ADA/USDT') {
      minRangePercent = 0.002; // 0.2% para ADA (más sensible)
    } else if (selectedPair === 'BTC/USDT') {
      minRangePercent = 0.001; // 0.1% para BTC
    } else if (selectedPair === 'ETH/USDT') {
      minRangePercent = 0.0015; // 0.15% para ETH
    } else {
      minRangePercent = 0.002; // 0.2% para otros
    }

    const minRange = avgPrice * minRangePercent;

    // Si el rango real es muy pequeño, usar el rango mínimo
    const effectiveRange = Math.max(rawRange, minRange);

    // Calcular padding adicional (10% del rango efectivo)
    const padding_percent = 0.1;
    const rangePadding = effectiveRange * padding_percent;

    // Aplicar el rango con padding
    const minPrice = rawMinPrice - rangePadding;
    const maxPrice = rawMaxPrice + rangePadding;
    const priceRange = maxPrice - minPrice;

    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Dibujar grid
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;

    // Líneas horizontales
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();

      // Etiquetas de precio
      const price = maxPrice - (priceRange / 5) * i;
      ctx.fillStyle = textColor;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(price.toFixed(selectedPair === 'ADA/USDT' ? 4 : 2), padding - 5, y + 4);
    }

    // Líneas verticales (tiempo)
    const timeSteps = 6;
    for (let i = 0; i <= timeSteps; i++) {
      const x = padding + (chartWidth / timeSteps) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();

      // Etiquetas de tiempo
      if (i < priceData.length) {
        const dataIndex = Math.floor((priceData.length - 1) * (i / timeSteps));
        const timeStr = new Date(priceData[dataIndex].time).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        });
        ctx.fillStyle = textColor;
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(timeStr, x, height - padding + 15);
      }
    }

    // Crear path para el área bajo la línea
    ctx.beginPath();
    priceData.forEach((point: PriceData, index: number) => {
      const x = padding + (chartWidth / (priceData.length - 1)) * index;
      const y = padding + ((maxPrice - point.price) / priceRange) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    // Completar el área hasta el fondo
    if (priceData.length > 0) {
      const lastX = padding + chartWidth;
      const lastY = padding + ((maxPrice - priceData[priceData.length - 1].price) / priceRange) * chartHeight;
      ctx.lineTo(lastX, lastY);
      ctx.lineTo(lastX, height - padding);
      ctx.lineTo(padding, height - padding);
      ctx.closePath();

      // Rellenar área
      ctx.fillStyle = fillColor;
      ctx.fill();
    }

    // Dibujar Media Móvil Simple (SMA) si está activada
    if (showSMA && smaValues.length > 0) {
      ctx.beginPath();
      let hasStarted = false;
      
      priceData.forEach((point: PriceData, index: number) => {
        const smaValue = smaValues[index];
        if (!isNaN(smaValue)) {
          const x = padding + (chartWidth / (priceData.length - 1)) * index;
          const y = padding + ((maxPrice - smaValue) / priceRange) * chartHeight;

          if (!hasStarted) {
            ctx.moveTo(x, y);
            hasStarted = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      });

      ctx.strokeStyle = '#f59e0b'; // Color naranja para SMA
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]); // Línea punteada
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Dibujar Media Móvil Exponencial (EMA) si está activada
    if (showEMA && emaValues.length > 0) {
      ctx.beginPath();
      
      priceData.forEach((point: PriceData, index: number) => {
        const emaValue = emaValues[index];
        if (!isNaN(emaValue)) {
          const x = padding + (chartWidth / (priceData.length - 1)) * index;
          const y = padding + ((maxPrice - emaValue) / priceRange) * chartHeight;

          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
      });

      ctx.strokeStyle = '#8b5cf6'; // Color púrpura para EMA
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]); // Línea punteada más corta
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Dibujar línea principal del precio
    ctx.beginPath();
    priceData.forEach((point: PriceData, index: number) => {
      const x = padding + (chartWidth / (priceData.length - 1)) * index;
      const y = padding + ((maxPrice - point.price) / priceRange) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Dibujar puntos en la línea
    priceData.forEach((point: PriceData, index: number) => {
      const x = padding + (chartWidth / (priceData.length - 1)) * index;
      const y = padding + ((maxPrice - point.price) / priceRange) * chartHeight;

      ctx.beginPath();
      ctx.arc(x, y, 2, 0, 2 * Math.PI);
      ctx.fillStyle = lineColor;
      ctx.fill();
    });

    // Dibujar posiciones de trading
    if (positions && positions.length > 0) {
      positions.forEach((position: Position) => {
        if (position.pair !== selectedPair) return;

        const entryY = padding + ((maxPrice - position.entryPrice) / priceRange) * chartHeight;
        
        // Encontrar el punto temporal más cercano a la entrada
        const entryTime = position.timestamp.getTime();
        let entryX = padding;
        
        // Buscar la posición X basada en el tiempo de entrada
        const timeRange = priceData.length > 1 ? 
          ((priceData[priceData.length - 1].timestamp || new Date(priceData[priceData.length - 1].time).getTime()) - (priceData[0].timestamp || new Date(priceData[0].time).getTime())) : 
          300000; // 5 minutos por defecto
        
        if (timeRange > 0) {
          const timeFromStart = entryTime - (priceData[0]?.timestamp || new Date(priceData[0]?.time || Date.now()).getTime());
          const timeRatio = Math.max(0, Math.min(1, timeFromStart / timeRange));
          entryX = padding + (chartWidth * timeRatio);
        }

        // Línea horizontal de entrada
        ctx.strokeStyle = position.type === 'long' ? '#22c55e' : '#ef4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(entryX, entryY);
        ctx.lineTo(width - padding, entryY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Marcador de entrada
        ctx.beginPath();
        if (position.type === 'long') {
          // Triángulo hacia arriba para LONG
          ctx.moveTo(entryX, entryY - 8);
          ctx.lineTo(entryX - 6, entryY + 4);
          ctx.lineTo(entryX + 6, entryY + 4);
        } else {
          // Triángulo hacia abajo para SHORT
          ctx.moveTo(entryX, entryY + 8);
          ctx.lineTo(entryX - 6, entryY - 4);
          ctx.lineTo(entryX + 6, entryY - 4);
        }
        ctx.closePath();
        ctx.fillStyle = position.type === 'long' ? '#22c55e' : '#ef4444';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Etiqueta de la posición
        const labelText = `${position.type.toUpperCase()} ${position.size}`;
        const labelWidth = ctx.measureText(labelText).width + 16;
        const labelX = Math.min(entryX + 10, width - padding - labelWidth);
        const labelY = entryY - 20;

        ctx.fillStyle = position.type === 'long' ? '#22c55e' : '#ef4444';
        ctx.fillRect(labelX, labelY - 8, labelWidth, 16);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(labelText, labelX + 8, labelY + 2);

        // Dibujar Stop Loss si existe
        if (position.stopLoss) {
          const slY = padding + ((maxPrice - position.stopLoss) / priceRange) * chartHeight;
          ctx.strokeStyle = '#dc2626';
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(entryX, slY);
          ctx.lineTo(width - padding, slY);
          ctx.stroke();
          ctx.setLineDash([]);

          // Etiqueta SL
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(width - padding - 35, slY - 8, 30, 16);
          ctx.fillStyle = 'white';
          ctx.font = '9px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('SL', width - padding - 20, slY + 2);
        }

        // Dibujar Take Profit si existe
        if (position.takeProfit) {
          const tpY = padding + ((maxPrice - position.takeProfit) / priceRange) * chartHeight;
          ctx.strokeStyle = '#16a34a';
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(entryX, tpY);
          ctx.lineTo(width - padding, tpY);
          ctx.stroke();
          ctx.setLineDash([]);

          // Etiqueta TP
          ctx.fillStyle = '#16a34a';
          ctx.fillRect(width - padding - 35, tpY - 8, 30, 16);
          ctx.fillStyle = 'white';
          ctx.font = '9px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('TP', width - padding - 20, tpY + 2);
        }

        // Mostrar P&L no realizado para posiciones abiertas
        if (position.status === 'open' && position.unrealizedPnL !== 0) {
          const pnlColor = position.unrealizedPnL >= 0 ? '#22c55e' : '#ef4444';
          const pnlText = `${position.unrealizedPnL >= 0 ? '+' : ''}$${position.unrealizedPnL.toFixed(2)}`;
          
          ctx.fillStyle = pnlColor;
          ctx.fillRect(entryX + 50, entryY - 25, 60, 14);
          ctx.fillStyle = 'white';
          ctx.font = 'bold 9px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(pnlText, entryX + 80, entryY - 17);

          // Línea de P&L desde entrada hasta precio actual
          const currentPriceY = padding + ((maxPrice - (externalCurrentPrice || currentPrice)) / priceRange) * chartHeight;
          ctx.strokeStyle = pnlColor;
          ctx.lineWidth = 2;
          ctx.setLineDash([1, 3]);
          ctx.beginPath();
          ctx.moveTo(entryX, entryY);
          ctx.lineTo(width - padding - 10, currentPriceY);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });
    }

    // Mostrar precio actual
    const displayPrice = externalCurrentPrice || currentPrice;
    if (displayPrice > 0 && priceData.length > 0) {
      const currentY = padding + ((maxPrice - displayPrice) / priceRange) * chartHeight;

      // Línea horizontal del precio actual
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(padding, currentY);
      ctx.lineTo(width - padding, currentY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Punto del precio actual
      const lastX = padding + chartWidth;
      ctx.beginPath();
      ctx.arc(lastX, currentY, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#10b981';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Etiqueta del precio actual
      ctx.fillStyle = '#10b981';
      ctx.fillRect(width - padding - 80, currentY - 12, 75, 24);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(displayPrice.toFixed(selectedPair === 'ADA/USDT' ? 4 : 2), width - padding - 42, currentY + 4);
    }

    // Indicador de zoom adaptativo
    if (rawRange < minRange) {
      ctx.fillStyle = 'rgba(59, 130, 246, 0.8)';
      ctx.fillRect(padding + 10, padding + 10, 120, 25);
      ctx.fillStyle = 'white';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('🔍 Zoom adaptativo', padding + 15, padding + 27);
    }
  };





  // Configurar WebSocket
  useEffect(() => {
    // Cerrar WebSocket anterior
    if (wsRef.current) {
      wsRef.current.close();
    }

    setIsLoading(true);

    // Cargar datos iniciales inmediatamente (sin esperar async)
    // Esto evita que la gráfica se vea vacía mientras se cargan los datos históricos.
    // Guardar el flag ANTES de sobrescribir initialData con datos simulados,
    // para luego saber si los datos son reales o generados artificialmente.
    const storedData = loadDataFromStorage(selectedPair);
    const hadStoredData = storedData.length > 0;
    let initialData = storedData;
    
    // Si no hay datos en storage, generar datos simulados inmediatamente
    if (!hadStoredData) {
      initialData = generateSimulatedData(selectedPair, externalCurrentPrice);
      setPriceData(initialData);
      const initialPrice = externalCurrentPrice && externalCurrentPrice > 0 
        ? externalCurrentPrice 
        : (initialData[initialData.length - 1]?.price || 0);
      setCurrentPrice(initialPrice);
    } else {
      // Limpiar datos antiguos
      initialData = cleanOldData(initialData);
      setPriceData(initialData);
      const initialPrice = externalCurrentPrice && externalCurrentPrice > 0 
        ? externalCurrentPrice 
        : (initialData[initialData.length - 1]?.price || 0);
      setCurrentPrice(initialPrice);
    }

    // Función para actualizar con datos históricos reales (en background)
    const loadHistoricalData = async () => {
      // Verificar si necesitamos datos históricos:
      // - Si no había datos reales en storage (se usaron datos simulados) → siempre buscar
      // - Si había datos pero son antiguos (> 60 segundos) → también buscar
      const needsHistorical = !hadStoredData || 
        (hadStoredData && Date.now() - new Date(initialData[initialData.length - 1]?.time || 0).getTime() > 60000);
      
      if (needsHistorical) {
        console.log(`📊 Obteniendo datos históricos para ${selectedPair}...`);
        
        // Solicitar 30 klines de 1 minuto = 30 puntos históricos reales.
        // Con HISTORY_DURATION = 30 min estos datos NO serán descartados por cleanOldData.
        const historicalData = await fetchHistoricalData(selectedPair, 30);
        
        if (historicalData.length > 0) {
          console.log(`✅ Obtenidos ${historicalData.length} puntos históricos de Binance para ${selectedPair}`);
          const cleanedData = cleanOldData(historicalData);
          
          if (cleanedData.length > 0) {
            setPriceData((prev) => {
              // Si no había datos reales (hadStoredData=false), los datos actuales son
              // simulados con timestamps de 'ahora'. Siempre reemplazarlos con datos
              // reales de Binance, independientemente de qué timestamp sea más reciente.
              if (!hadStoredData) {
                return cleanedData;
              }
              // Si había datos reales, usar los más recientes entre ambos
              const lastPrevTime = prev.length > 0
                ? (prev[prev.length - 1].timestamp || new Date(prev[prev.length - 1].time).getTime())
                : 0;
              const lastHistoricalTime = cleanedData[cleanedData.length - 1].timestamp || new Date(cleanedData[cleanedData.length - 1].time).getTime();
              return lastHistoricalTime > lastPrevTime ? cleanedData : prev;
            });
            
            // Guardar en storage para uso futuro (próxima sesión)
            saveDataToStorage(selectedPair, cleanedData);
            
            const historicalPrice = externalCurrentPrice && externalCurrentPrice > 0 
              ? externalCurrentPrice 
              : (cleanedData[cleanedData.length - 1]?.price || 0);
            setCurrentPrice(historicalPrice);
          }
        }
      }
      
      setIsLoading(false);
    };

    // Cargar datos históricos en background (sin bloquear la UI)
    loadHistoricalData();

    // Configurar WebSocket inmediatamente (no esperar a datos históricos)
    const symbol = getSymbolForPair(selectedPair);
    // Usar @ticker para actualizaciones más frecuentes (cada segundo aproximadamente)
    const wsUrl = `wss://stream.binance.com:9443/ws/${symbol}@ticker`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsLoading(false);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          // @ticker devuelve 'c' como precio actual
          if (message.c) {
            const newPrice = parseFloat(message.c);
            if (!externalCurrentPrice) {
              setCurrentPrice(newPrice);
            }

            // Agregar nuevo punto de precio solo si ha pasado al menos 1 segundo desde el último punto
            // Esto evita saturar la gráfica con demasiados puntos
            setPriceData((prev: PriceData[]) => {
              // Si no hay datos previos, no hacer nada (dejar que se carguen primero)
              if (prev.length === 0) {
                return prev;
              }

              const now = Date.now();
              const lastPoint = prev[prev.length - 1];
              
              // Solo agregar si ha pasado al menos 1 segundo
              if (lastPoint && now - (lastPoint.timestamp || new Date(lastPoint.time).getTime()) >= 1000) {
                const newPricePoint: PriceData = {
                  time: new Date(now).toISOString(),
                  timestamp: now,
                  price: newPrice,
                };

                let updated = [...prev, newPricePoint];

                // Limitar el array para evitar crecer infinitamente la memoria
                if (updated.length > 2000) updated = updated.slice(-1800);

                // No guardamos localStorage por cada point de WS! Es destructivo de performance.

                return updated;
              }
              
              // Si no ha pasado suficiente tiempo, actualizar solo el precio del último punto (sin cambiar el tiempo)
              if (prev.length > 0) {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  price: newPrice,
                };
                // No guardar en storage en cada actualización para evitar sobrecarga
                return updated;
              }
              
              return prev;
            });
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = () => {
        setIsLoading(false);
      };

      ws.onclose = () => {
        setIsLoading(false);
      };

    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setIsLoading(false);
    }

    // Simulador de datos en tiempo real como fallback
    const simulateRealTimeData = () => {
      setPriceData((prev: PriceData[]) => {
        if (prev.length === 0) {
          // Si no hay datos, generar algunos iniciales
          const newData = generateSimulatedData(selectedPair, externalCurrentPrice);
          return newData;
        }

        // Usar el precio externo si está disponible, sino usar el último precio
        const basePrice = externalCurrentPrice && externalCurrentPrice > 0 
          ? externalCurrentPrice 
          : prev[prev.length - 1].price;

        // Variación más pequeña y realista
        const maxVariation = selectedPair === 'ADA/USDT' ? 0.002 : // ±0.2% para ADA
          selectedPair === 'BTC/USDT' ? 0.001 : // ±0.1% para BTC
            selectedPair === 'ETH/USDT' ? 0.0015 : // ±0.15% para ETH
              0.002; // ±0.2% para otros

        const variation = (Math.random() - 0.5) * maxVariation;
        const newPrice = basePrice * (1 + variation);

        if (!externalCurrentPrice) {
          setCurrentPrice(newPrice);
        }

        const newPricePoint: PriceData = {
          time: new Date().toISOString(),
          timestamp: Date.now(),
          price: Number(newPrice.toFixed(selectedPair === 'ADA/USDT' ? 4 : 2)),
        };

        let updated = [...prev];
        updated.push(newPricePoint);
        if (updated.length > 2000) updated = updated.slice(-1800);
        return updated;
      });
    };

    // Fallback: simular datos cada 2 segundos si no hay WebSocket o mientras espera conexión
    // Esto mantiene la gráfica animada mientras se conecta
    const fallbackInterval = setInterval(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        simulateRealTimeData();
      }
    }, 2000); // Reducido a 2 segundos para actualizaciones más frecuentes

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      clearInterval(fallbackInterval);
    };
  }, [selectedPair, externalCurrentPrice]);

  // Actualizar gráfica cuando cambia el precio externo (del TradingDashboard)
  // Solo actualizar si ya hay datos para evitar parpadeos
  useEffect(() => {
    if (externalCurrentPrice && externalCurrentPrice > 0) {
      setPriceData((prev: PriceData[]) => {
        // Si no hay datos, no hacer nada (dejar que el efecto principal los cargue)
        if (prev.length === 0) {
          return prev;
        }

        const now = Date.now();
        const lastPoint = prev[prev.length - 1];
        const timeSinceLastPoint = lastPoint 
          ? now - (lastPoint.timestamp || new Date(lastPoint.time).getTime()) 
          : Infinity;

        // Solo agregar nuevo punto si ha pasado al menos 1 segundo desde el último
        if (timeSinceLastPoint >= 1000) {
          const newPricePoint: PriceData = {
            time: new Date(now).toISOString(),
            timestamp: now,
            price: externalCurrentPrice,
          };

          let updated = [...prev, newPricePoint];
          if (updated.length > 2000) updated = updated.slice(-1800);
          return updated;
        } else {
          // Actualizar el último punto con el precio actual (sin cambiar la estructura)
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              price: externalCurrentPrice,
            };
          }
          return updated;
        }
      });

      setCurrentPrice(externalCurrentPrice);
    }
  }, [externalCurrentPrice, selectedPair]);

  // Limpiar datos antiguos periódicamente
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setPriceData(prev => {
        const cleaned = cleanOldData(prev);
        if (cleaned.length !== prev.length) {
          saveDataToStorage(selectedPair, cleaned);
        }
        return cleaned;
      });
    }, 30000); // Limpiar cada 30 segundos

    return () => clearInterval(cleanupInterval);
  }, [selectedPair]);

  // Dibujar cuando cambien los datos o los indicadores
  useEffect(() => {
    drawChart();
  }, [priceData, currentPrice, positions, externalCurrentPrice, showSMA, showEMA, smaPeriod, emaPeriod]);

  // Configurar canvas al montar
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = 400;
        drawChart();
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      setMousePos({x: event.clientX, y: event.clientY});

      // Verificar si el mouse está sobre alguna posición
      let foundPosition: Position | null = null;
      
      if (positions && positions.length > 0) {
        const padding = 40;
        const chartWidth = canvas.width - padding * 2;
        const chartHeight = canvas.height - padding * 2;
        
        if (priceData.length > 0) {
          const prices = priceData.map((d: PriceData) => d.price);
          const minPrice = Math.min(...prices) - (Math.max(...prices) - Math.min(...prices)) * 0.1;
          const maxPrice = Math.max(...prices) + (Math.max(...prices) - Math.min(...prices)) * 0.1;
          const priceRange = maxPrice - minPrice;

          positions.forEach((position: Position) => {
            if (position.pair !== selectedPair) return;

            const entryY = padding + ((maxPrice - position.entryPrice) / priceRange) * chartHeight;
            const entryTime = position.timestamp.getTime();
            
            let entryX = padding;
            const timeRange = priceData.length > 1 ? 
              ((priceData[priceData.length - 1].timestamp || new Date(priceData[priceData.length - 1].time).getTime()) - (priceData[0].timestamp || new Date(priceData[0].time).getTime())) : 
              300000;
            
            if (timeRange > 0) {
              const timeFromStart = entryTime - (priceData[0]?.timestamp || new Date(priceData[0]?.time || Date.now()).getTime());
              const timeRatio = Math.max(0, Math.min(1, timeFromStart / timeRange));
              entryX = padding + (chartWidth * timeRatio);
            }

            // Verificar si el mouse está cerca del marcador de posición
            if (Math.abs(x - entryX) < 15 && Math.abs(y - entryY) < 15) {
              foundPosition = position;
            }
          });
        }
      }

      setHoveredPosition(foundPosition);
    };

    const handleMouseLeave = () => {
      setHoveredPosition(null);
    };

    resizeCanvas();
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('resize', resizeCanvas);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [positions, priceData, selectedPair]);

  return (
    <div className="relative w-full h-[400px] bg-card">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span>Cargando gráfico de {selectedPair}...</span>
          </div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />

      {/* Controles Izquierdos Agrupados */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 items-start h-auto max-h-[calc(100%-2rem)] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>

      {/* Información del precio actual */}
      {(externalCurrentPrice || currentPrice) > 0 && (
        <div className="bg-background/90 backdrop-blur-sm rounded-lg border min-w-[160px] shadow-sm">
          <div className="flex items-center justify-between p-2 cursor-pointer" onClick={() => setIsPriceInfoCollapsed(!isPriceInfoCollapsed)}>
            <div className="text-xs font-semibold text-muted-foreground">Precio</div>
            <button className="text-muted-foreground hover:text-foreground">
              {isPriceInfoCollapsed ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              )}
            </button>
          </div>
          {!isPriceInfoCollapsed && (
            <div className="px-3 pb-3">
              <div className="text-sm text-muted-foreground">{selectedPair}</div>
              <div className="text-lg font-bold">
                ${(externalCurrentPrice || currentPrice).toFixed(selectedPair === 'ADA/USDT' ? 4 : 2)}
              </div>
              <div className="text-xs text-green-600">● En vivo</div>
              {positions.filter((p: Position) => p.status === 'open' && p.pair === selectedPair).length > 0 && (
                <div className="text-xs text-blue-600 mt-1">
                  {positions.filter((p: Position) => p.status === 'open' && p.pair === selectedPair).length} posición(es) activa(s)
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Controles del gráfico */}
      <div className="flex flex-col gap-2 min-w-[160px]">
        <div className="bg-background/90 backdrop-blur-sm rounded-lg border">
          <div className="flex items-center justify-between p-2 cursor-pointer" onClick={() => setIsChartControlsCollapsed(!isChartControlsCollapsed)}>
            <div className="text-xs font-semibold text-muted-foreground">Estadísticas</div>
            <button className="text-muted-foreground hover:text-foreground">
              {isChartControlsCollapsed ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              )}
            </button>
          </div>
          {!isChartControlsCollapsed && (
            <div className="flex gap-2 px-2 pb-2">
              <div className="bg-background/90 backdrop-blur-sm rounded-lg p-2 border">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-3 h-0.5 bg-blue-500"></div>
                  <span>Precio</span>
                </div>
              </div>
              {priceData.length > 0 && (
                <div className="bg-background/90 backdrop-blur-sm rounded-lg p-2 border">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>
                      {Math.round((Date.now() - new Date(priceData[0].time).getTime()) / 60000)}m historial
                    </span>
                  </div>
                </div>
              )}
              {priceData.length > 1 && (
                <div className="bg-background/90 backdrop-blur-sm rounded-lg p-2 border">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>
                      {(() => {
                        const prices = priceData.map(d => d.price);
                        const min = Math.min(...prices);
                        const max = Math.max(...prices);
                        const variation = ((max - min) / min * 100);
                        return `±${variation.toFixed(3)}%`;
                      })()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Controles de indicadores */}
        <div className="bg-background/90 backdrop-blur-sm rounded-lg border">
          <div className="flex items-center justify-between p-2 cursor-pointer" onClick={() => setIsIndicatorsCollapsed(!isIndicatorsCollapsed)}>
            <div className="text-xs font-semibold text-muted-foreground">Indicadores</div>
            <button className="text-muted-foreground hover:text-foreground">
              {isIndicatorsCollapsed ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              )}
            </button>
          </div>
          {!isIndicatorsCollapsed && (
            <div className="px-3 pb-3">
              {/* SMA Control */}
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  id="showSMA"
                  checked={showSMA}
                  onChange={(e) => setShowSMA(e.target.checked)}
                  className="w-4 h-4 rounded cursor-pointer"
                />
                <label htmlFor="showSMA" className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1">
                  <div className="w-3 h-0.5 bg-orange-500" style={{borderStyle: 'dashed', borderWidth: '1px 0'}}></div>
                  <span>SMA</span>
                </label>
                {showSMA && (
                  <select
                    value={smaPeriod}
                    onChange={(e) => setSmaPeriod(Number(e.target.value))}
                    className="ml-2 text-xs bg-background border rounded px-1 py-0.5 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                )}
              </div>
              
              {/* EMA Control */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showEMA"
                  checked={showEMA}
                  onChange={(e) => setShowEMA(e.target.checked)}
                  className="w-4 h-4 rounded cursor-pointer"
                />
                <label htmlFor="showEMA" className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1">
                  <div className="w-3 h-0.5 bg-purple-500" style={{borderStyle: 'dashed', borderWidth: '1px 0'}}></div>
                  <span>EMA</span>
                </label>
                {showEMA && (
                  <select
                    value={emaPeriod}
                    onChange={(e) => setEmaPeriod(Number(e.target.value))}
                    className="ml-2 text-xs bg-background border rounded px-1 py-0.5 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Leyenda de operaciones */}
        {positions && positions.some((p: Position) => p.pair === selectedPair) && (
          <div className="bg-background/90 backdrop-blur-sm rounded-lg border">
            <div className="flex items-center justify-between p-2 cursor-pointer" onClick={() => setIsLegendCollapsed(!isLegendCollapsed)}>
              <div className="text-xs font-semibold text-muted-foreground">Leyenda</div>
              <button className="text-muted-foreground hover:text-foreground">
                {isLegendCollapsed ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                )}
              </button>
            </div>
            {!isLegendCollapsed && (
              <div className="px-2 pb-2 space-y-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[6px] border-l-transparent border-r-transparent border-b-green-500"></div>
                  <span>Long</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-red-500"></div>
                  <span>Short</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-3 h-0.5 bg-red-600" style={{borderStyle: 'dashed', borderWidth: '1px 0'}}></div>
                  <span>SL/TP</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      </div>

      {/* Tooltip para posiciones */}
      {hoveredPosition && (
        <div 
          className="fixed z-50 bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg pointer-events-none"
          style={{
            left: mousePos.x + 10,
            top: mousePos.y - 10,
            transform: 'translateY(-100%)'
          }}
        >
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${hoveredPosition.type === 'long' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="font-semibold">
                {hoveredPosition.type.toUpperCase()} {hoveredPosition.size} {hoveredPosition.pair}
              </span>
            </div>
            <div className="text-muted-foreground">
              Entrada: ${hoveredPosition.entryPrice.toFixed(selectedPair === 'ADA/USDT' ? 4 : 2)}
            </div>
            {hoveredPosition.leverage > 1 && (
              <div className="text-orange-600">
                Apalancamiento: {hoveredPosition.leverage}x
              </div>
            )}
            {hoveredPosition.stopLoss && (
              <div className="text-red-600">
                Stop Loss: ${hoveredPosition.stopLoss.toFixed(selectedPair === 'ADA/USDT' ? 4 : 2)}
              </div>
            )}
            {hoveredPosition.takeProfit && (
              <div className="text-green-600">
                Take Profit: ${hoveredPosition.takeProfit.toFixed(selectedPair === 'ADA/USDT' ? 4 : 2)}
              </div>
            )}
            {hoveredPosition.status === 'open' && (
              <div className={`font-semibold ${hoveredPosition.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                P&L: {hoveredPosition.unrealizedPnL >= 0 ? '+' : ''}${hoveredPosition.unrealizedPnL.toFixed(2)}
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              {hoveredPosition.timestamp.toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceChart;
