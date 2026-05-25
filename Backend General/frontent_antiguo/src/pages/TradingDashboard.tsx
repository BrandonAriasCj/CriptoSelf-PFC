import { useState, useEffect, useRef } from 'react';
import PriceChart from '../components/PriceChart';
import { TradingPanel } from '../components/TradingPanel';
import { OrderBook } from '../components/OrderBook';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  BarChart3,
  DollarSign,
  Play,
  Pause,
  RotateCcw,
  Target,
  Wallet,
  TrendingUpDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Flame,
  Trophy,
  Brain,
  Shield,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import operationsService from '../services/operations';
import { mapOperationToPosition, mapPositionToOperation, CRYPTO_MAP, type MappedPosition } from '../types/operations';

// Datos iniciales de mercado (se actualizarán en tiempo real)
const initialMarketData = {
  'BTC/USDT': { price: 0, change: 0, volume: '1.2B', marketCap: '1.9T', volatility: 3.2, price24h: 0 },
  'ETH/USDT': { price: 0, change: 0, volume: '850M', marketCap: '438B', volatility: 4.1, price24h: 0 },
  'ADA/USDT': { price: 0, change: 0, volume: '320M', marketCap: '30B', volatility: 6.8, price24h: 0 },
  'SOL/USDT': { price: 0, change: 0, volume: '180M', marketCap: '92B', volatility: 7.2, price24h: 0 },
};

// Mapeo de pares a símbolos de Binance
const PAIR_TO_SYMBOL: Record<string, string> = {
  'BTC/USDT': 'btcusdt',
  'ETH/USDT': 'ethusdt',
  'ADA/USDT': 'adausdt',
  'SOL/USDT': 'solusdt',
};

// Helper para formatear precios según el par
const formatPrice = (price: number, pair: string): string => {
  if (price <= 0) return 'Cargando...';
  const decimals = pair === 'ADA/USDT' ? 4 : 2;
  return price.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

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

interface Order {
  id: string;
  type: 'market' | 'limit' | 'stop';
  side: 'buy' | 'sell';
  pair: string;
  size: number;
  price?: number;
  stopPrice?: number;
  leverage: number;
  timestamp: Date;
  status: 'pending' | 'filled' | 'cancelled' | 'rejected';
}

interface TradingAccount {
  balance: number;
  initialBalance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  totalPnL: number;
  unrealizedPnL: number;
  realizedPnL: number;
}

export function TradingDashboard() {
  const [selectedPair, setSelectedPair] = useState('BTC/USDT');
  const [marketData, setMarketData] = useState(initialMarketData);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceHistory, setPriceHistory] = useState<number[]>([]);
  const [positions, setPositions] = useState<MappedPosition[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  const INITIAL_BALANCE = 1000;

  // ─── Tasas de costos simulados (contexto Perú) ─────────────────────────────
  // Replican los costos reales que enfrenta un usuario peruano al operar en
  // un exchange de criptomonedas real. Solo aplican a la simulación.
  const TRADING_FEE_RATE    = 0.001;  // 0.10% — fee estándar de exchange (ej. Binance)
  const CONVERSION_FEE_RATE = 0.015;  // 1.50% — conversión PEN → USD (promedio bancos Perú)
  const TOTAL_FEE_RATE      = TRADING_FEE_RATE + CONVERSION_FEE_RATE; // 1.60%
  
  const [account, setAccount] = useState<TradingAccount>({
    balance: INITIAL_BALANCE,
    initialBalance: INITIAL_BALANCE,
    equity: INITIAL_BALANCE,
    margin: 0,
    freeMargin: INITIAL_BALANCE,
    marginLevel: 0,
    totalPnL: 0,
    unrealizedPnL: 0,
    realizedPnL: 0
  });

  // Trading form state
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop'>('market');
  const [orderSide, setOrderSide] = useState<'buy' | 'sell'>('buy');
  const [orderSize, setOrderSize] = useState<number>(0.01);
  const [orderPrice, setOrderPrice] = useState<number>(0);
  const [leverage, setLeverage] = useState<number>(1);
  const [stopLoss, setStopLoss] = useState<number | undefined>();
  const [takeProfit, setTakeProfit] = useState<number | undefined>();

  // Mantener refs actualizados
  useEffect(() => {
    selectedPairRef.current = selectedPair;
  }, [selectedPair]);

  useEffect(() => {
    orderTypeRef.current = orderType;
  }, [orderType]);

  const [notifications, setNotifications] = useState<Array<{ id: string, type: 'success' | 'error' | 'warning', message: string }>>([]);
  const wsRefs = useRef<Record<string, WebSocket>>({});
  const selectedPairRef = useRef(selectedPair);
  const orderTypeRef = useRef(orderType);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  // Loading states for API operations
  const [isLoadingPositions, setIsLoadingPositions] = useState(false);
  const [isSavingOperation, setIsSavingOperation] = useState(false);

  // Collapse states for panels
  const [isTradingPanelCollapsed, setIsTradingPanelCollapsed] = useState(false);
  const [isOpenPositionsCollapsed, setIsOpenPositionsCollapsed] = useState(false);
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false);

  // Conectar WebSockets para todos los pares en tiempo real
  useEffect(() => {
    const pairs = Object.keys(PAIR_TO_SYMBOL);
    let connectedCount = 0;

    const connectWebSocket = (pair: string) => {
      const symbol = PAIR_TO_SYMBOL[pair];
      const wsUrl = `wss://stream.binance.com:9443/ws/${symbol}@ticker`;

      try {
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          connectedCount++;
          if (connectedCount === 1) {
            setConnectionStatus('connected');
            addNotification('success', '🟢 Conectado al feed en tiempo real');
          }
          console.log(`✅ WebSocket conectado para ${pair}`);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.c && data.P !== undefined && data.o) {
              // c = precio actual, P = cambio porcentual 24h, o = precio de apertura 24h
              const newPrice = parseFloat(data.c);
              const change24h = parseFloat(data.P);
              const openPrice24h = parseFloat(data.o);

              // Validar que el precio sea razonable para este par
              const isValidPrice = (price: number, pair: string): boolean => {
                if (isNaN(price) || price <= 0) {
                  console.warn(`Precio inválido (NaN o <= 0) para ${pair}: ${price}`);
                  return false;
                }
                // Rangos aproximados de precios válidos
                let isValid = false;
                if (pair === 'BTC/USDT') {
                  isValid = price > 1000 && price < 200000;
                } else if (pair === 'ETH/USDT') {
                  isValid = price > 100 && price < 10000;
                } else if (pair === 'ADA/USDT') {
                  isValid = price > 0.1 && price < 10;
                } else if (pair === 'SOL/USDT') {
                  isValid = price > 10 && price < 1000;
                } else {
                  isValid = true;
                }
                
                if (!isValid) {
                  console.warn(`Precio fuera de rango para ${pair}: ${price} (esperado: ${pair === 'ADA/USDT' ? '0.1-10' : pair === 'BTC/USDT' ? '1000-200000' : pair === 'ETH/USDT' ? '100-10000' : '10-1000'})`);
                }
                return isValid;
              };

              if (!isValidPrice(newPrice, pair)) {
                return; // Ignorar este mensaje
              }

              // Actualizar datos de mercado para este par
              setMarketData(prev => ({
                ...prev,
                [pair]: {
                  ...prev[pair],
                  price: newPrice,
                  change: change24h,
                  price24h: openPrice24h,
                }
              }));

              // Si es el par seleccionado, actualizar también el precio actual
              // Usar refs para obtener los valores actuales
              if (pair === selectedPairRef.current) {
                setCurrentPrice(newPrice);
                setPriceHistory(prev => [...prev.slice(-99), newPrice]);
                updatePositionsPnL(newPrice);
                // Actualizar precio del formulario si es market order
                if (orderTypeRef.current === 'market') {
                  setOrderPrice(newPrice);
                }
              }
            }
          } catch (error) {
            console.error(`Error parsing WebSocket data para ${pair}:`, error);
          }
        };

        ws.onerror = (error) => {
          console.error(`Error en WebSocket para ${pair}:`, error);
          connectedCount--;
          if (connectedCount === 0) {
            setConnectionStatus('disconnected');
            addNotification('error', `🔴 Error de conexión para ${pair}`);
          }
        };

        ws.onclose = () => {
          console.log(`WebSocket cerrado para ${pair}, reconectando...`);
          connectedCount--;
          if (connectedCount === 0) {
            setConnectionStatus('disconnected');
          }
          // Reconectar después de 3 segundos
          setTimeout(() => connectWebSocket(pair), 3000);
        };

        wsRefs.current[pair] = ws;
      } catch (error) {
        console.error(`Error creando WebSocket para ${pair}:`, error);
      }
    };

    // Conectar todos los pares
    setConnectionStatus('connecting');
    pairs.forEach(pair => {
      connectWebSocket(pair);
    });

    // Cleanup: cerrar todas las conexiones
    return () => {
      Object.values(wsRefs.current).forEach(ws => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      });
      wsRefs.current = {};
    };
  }, []); // Solo ejecutar una vez al montar

  // Actualizar precio actual cuando cambia el par seleccionado
  useEffect(() => {
    // Resetear el historial y precio al cambiar de par para evitar que
    // los precios del par anterior contaminen la escala del nuevo par.
    setPriceHistory([]);
    setCurrentPrice(0);

    const pairData = marketData[selectedPair];
    if (pairData && pairData.price > 0) {
      // Validar que el precio sea razonable antes de actualizar
      const isValidPrice = (price: number, pair: string): boolean => {
        if (isNaN(price) || price <= 0) return false;
        if (pair === 'BTC/USDT') return price > 1000 && price < 200000;
        if (pair === 'ETH/USDT') return price > 100 && price < 10000;
        if (pair === 'ADA/USDT') return price > 0.1 && price < 10;
        if (pair === 'SOL/USDT') return price > 10 && price < 1000;
        return true;
      };

      if (isValidPrice(pairData.price, selectedPair)) {
        setCurrentPrice(pairData.price);
        if (orderType === 'market') {
          setOrderPrice(pairData.price);
        }
        setPriceHistory([pairData.price]);
        updatePositionsPnL(pairData.price);
      }
    }
  }, [selectedPair]); // Solo cuando cambia el par seleccionado


  // Cargar posiciones abiertas al cambiar de par
  useEffect(() => {
    loadOpenPositions();
  }, [selectedPair]);

  // Cargar también el historial al montar
  useEffect(() => {
    loadHistory();
  }, []);

  const loadOpenPositions = async () => {
    setIsLoadingPositions(true);
    try {
      const cryptoId = CRYPTO_MAP[selectedPair];
      const operations = await operationsService.getOpenPositions(cryptoId);
      console.log('📥 Operaciones abiertas recibidas:', operations);

      if (Array.isArray(operations)) {
        const mappedPositions = operations.map(mapOperationToPosition);
        setPositions(prev => {
          // Mantener las posiciones cerradas y agregar/actualizar las abiertas
          const closedPositions = prev.filter(p => p.status === 'closed');
          return [...closedPositions, ...mappedPositions];
        });
        console.log(`✅ Cargadas ${mappedPositions.length} posiciones abiertas para ${selectedPair}`);
      }
    } catch (error: any) {
      console.error('Error cargando posiciones abiertas:', error);
      addNotification('error', `❌ Error cargando posiciones: ${error.message || 'Error desconocido'}`);
    } finally {
      setIsLoadingPositions(false);
    }
  };

  const loadHistory = async () => {
    try {
      const operations = await operationsService.getHistory();
      if (Array.isArray(operations) && operations.length > 0) {
        const closedPositions = operations.map(mapOperationToPosition);
        setPositions(prev => {
          const newPositions = closedPositions.filter(
            cp => !prev.some(p => p.operationId === cp.operationId)
          );
          return [...prev, ...newPositions];
        });
      }
    } catch (error: any) {
      console.error('Error cargando historial:', error);
    }
  };


  // Update positions P&L in real-time
  const updatePositionsPnL = (price: number) => {
    setPositions(prev => prev.map(position => {
      if (position.status === 'open' && position.pair === selectedPair) {
        const priceDiff = position.type === 'long'
          ? price - position.entryPrice
          : position.entryPrice - price;

        const unrealizedPnL = (priceDiff * position.size * position.leverage);

        return {
          ...position,
          unrealizedPnL
        };
      }
      return position;
    }));

    // Update account equity
    const totalUnrealizedPnL = positions
      .filter(p => p.status === 'open')
      .reduce((sum, p) => sum + p.unrealizedPnL, 0);

    setAccount(prev => ({
      ...prev,
      unrealizedPnL: totalUnrealizedPnL,
      equity: prev.balance + totalUnrealizedPnL
    }));
  };

  // Execute manual trade
  const executeOrder = async () => {
    // Validation
    if (orderSize <= 0) {
      addNotification('error', '❌ Tamaño de orden inválido');
      return;
    }

    const tradeValue     = orderSize * currentPrice;
    const tradingFee     = tradeValue * TRADING_FEE_RATE;
    const conversionFee  = tradeValue * CONVERSION_FEE_RATE;
    const totalFees      = tradeValue * TOTAL_FEE_RATE;
    const requiredMargin = tradeValue / leverage;
    const totalCost      = requiredMargin + totalFees;

    if (totalCost > account.freeMargin) {
      addNotification('error', '❌ Margen + comisiones insuficientes');
      return;
    }

    setIsSavingOperation(true);

    try {
      // Create position locally
      const position: MappedPosition = {
        id: `pos_${Date.now()}`,
        type: orderSide === 'buy' ? 'long' : 'short',
        pair: selectedPair,
        size: orderSize,
        entryPrice: orderType === 'market' ? currentPrice : orderPrice,
        leverage,
        margin: requiredMargin,
        stopLoss,
        takeProfit,
        timestamp: new Date(),
        status: 'open',
        pnl: 0,
        unrealizedPnL: 0
      };

      // Save to backend
      const operation = mapPositionToOperation(position, selectedPair);
      console.log('📤 Enviando operación al backend:', operation);
      const savedOperation = await operationsService.create(operation);
      console.log('✅ Operación guardada:', savedOperation);

      // Update position with backend ID
      const mappedPosition: MappedPosition = {
        ...position,
        id: savedOperation.id?.toString() || position.id,
        operationId: savedOperation.id,
      };

      setPositions(prev => [...prev, mappedPosition]);

      // Update account — descontar margen + comisiones simuladas
      setAccount(prev => ({
        ...prev,
        margin: prev.margin + requiredMargin,
        freeMargin: prev.freeMargin - totalCost
      }));

      const leverageText = leverage > 1 ? ` (${leverage}x)` : '';
      addNotification('success',
        `✅ ${position.type.toUpperCase()} ${orderSize} ${selectedPair}${leverageText} @ $${position.entryPrice.toFixed(2)} • Comisión: $${totalFees.toFixed(4)}`
      );

      // Reset form
      setOrderSize(0.01);
      setStopLoss(undefined);
      setTakeProfit(undefined);
    } catch (error: any) {
      console.error('Error guardando operación:', error);
      addNotification('error', `❌ Error al guardar operación: ${error.response?.data?.detail || error.message || 'Error desconocido'}`);
    } finally {
      setIsSavingOperation(false);
    }
  };

  // Close position
  const closePosition = async (positionId: string) => {
    const position = positions.find(p => p.id === positionId);
    if (!position || position.status === 'closed') return;

    const priceDiff = position.type === 'long'
      ? currentPrice - position.entryPrice
      : position.entryPrice - currentPrice;

    const realizedPnL = (priceDiff * position.size * position.leverage);

    try {
      // Update in backend if we have an operationId
      if (position.operationId) {
        await operationsService.update(position.operationId, {
          estado: 'completada',
          notas: `Cerrado con P&L: $${realizedPnL.toFixed(2)} - Precio de cierre: $${currentPrice.toFixed(2)}`
        });
      }

      setPositions(prev => prev.map(p =>
        p.id === positionId
          ? { ...p, status: 'closed' as const, pnl: realizedPnL, unrealizedPnL: 0 }
          : p
      ));

      // Update account
      setAccount(prev => ({
        ...prev,
        balance: prev.balance + realizedPnL,
        margin: prev.margin - position.margin,
        freeMargin: prev.freeMargin + position.margin,
        realizedPnL: prev.realizedPnL + realizedPnL,
        totalPnL: prev.totalPnL + realizedPnL
      }));

      const emoji = realizedPnL > 0 ? '💰' : '📉';
      addNotification(
        realizedPnL > 0 ? 'success' : 'error',
        `${emoji} Posición cerrada - P&L: $${realizedPnL.toFixed(2)}`
      );
    } catch (error: any) {
      console.error('Error cerrando posición:', error);
      addNotification('error', `❌ Error al cerrar posición: ${error.message || 'Error desconocido'}`);
    }
  };

  const addNotification = (type: 'success' | 'error' | 'warning', message: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const resetAccount = () => {
    setAccount({
      balance: INITIAL_BALANCE,
      initialBalance: INITIAL_BALANCE,
      equity: INITIAL_BALANCE,
      margin: 0,
      freeMargin: INITIAL_BALANCE,
      marginLevel: 0,
      totalPnL: 0,
      unrealizedPnL: 0,
      realizedPnL: 0
    });
    setPositions([]);
    setOrders([]);
    addNotification('success', '🔄 Cuenta reiniciada');
  };

  // Calculate margin level
  const marginLevel = account.margin > 0 ? (account.equity / account.margin) * 100 : 0;

  // Calcular cambio de precio (usar cambio 24h del marketData)
  const priceChange = marketData[selectedPair]?.change || 0;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Market Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(marketData).map(([pair, data]) => (
          <Card
            key={pair}
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${selectedPair === pair
              ? 'ring-2 ring-primary shadow-lg bg-primary/5 border-primary/20'
              : 'hover:shadow-md bg-card/50 backdrop-blur-sm'
              }`}
            onClick={() => setSelectedPair(pair)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/20 backdrop-blur-sm border border-primary/30 rounded-lg flex items-center justify-center">
                    <span className="text-primary font-bold text-xs">{pair.split('/')[0].slice(0, 2)}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{pair}</h3>
                    <p className="text-xs text-muted-foreground">Vol: {data.volume}</p>
                  </div>
                </div>
                <Badge
                  variant={data.change >= 0 ? "default" : "destructive"}
                  className={`text-xs ${data.change >= 0 ? 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20' : ''}`}
                >
                  {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)}%
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-end gap-2">
                  <p className="text-lg font-bold">
                    ${formatPrice(data.price, pair)}
                  </p>
                  {pair === selectedPair && (
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  )}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Cap: {data.marketCap}</span>
                  <span>Vol: {data.volatility}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Pair Info */}
      <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/20 backdrop-blur-sm border border-primary/30 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-primary font-bold">{selectedPair.split('/')[0].slice(0, 3)}</span>
              </div>
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  {selectedPair}
                  {priceChange >= 0 ?
                    <TrendingUp className="w-6 h-6 text-green-600" /> :
                    <TrendingDown className="w-6 h-6 text-red-600" />
                  }
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Volatilidad: {marketData[selectedPair]?.volatility || 0}% •
                  Cap. de Mercado: {marketData[selectedPair]?.marketCap || 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="text-center md:text-right">
                <p className="text-3xl font-bold">
                  ${formatPrice(currentPrice, selectedPair)}
                </p>
                <p className={`text-sm font-medium ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                  <span className="text-xs text-muted-foreground ml-1">24h</span>
                </p>
              </div>
{/*               <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Zap className="w-4 h-4 mr-1" />
                  Alertas
                </Button>
                <Button variant="outline" size="sm">
                  <BarChart3 className="w-4 h-4 mr-1" />
                  Análisis
                </Button>
              </div> */}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Trading Interface */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Price Chart */}
        <div className="xl:col-span-3">
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted/30 backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Gráfico de Precios
                  <Badge variant="outline" className="ml-2">En Vivo</Badge>
                </CardTitle>
                <div className="flex flex-wrap gap-1">
                  {['5m'].map((timeframe) => (
                    <Button
                      key={timeframe}
                      variant="ghost"
                      size="sm"
                      className="h-8 px-3 text-xs hover:bg-primary/10"
                    >
                      {timeframe}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <PriceChart
                selectedPair={selectedPair}
                positions={positions}
                currentPrice={currentPrice}
              />
            </CardContent>
          </Card>
        </div>
        {/* Manual Trading Simulator */}
        <div className="xl:col-span-4 space-y-6">
          {/* Trading Panel */}
          <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 backdrop-blur-sm rounded-lg">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Simulador de Trading Manual</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Trading con apalancamiento, SL/TP y gestión de riesgo
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={connectionStatus === 'connected' ? 'default' : 'destructive'}
                    className={connectionStatus === 'connected' ? 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/20' : ''}
                  >
                    {connectionStatus === 'connected' ? '🟢 En Vivo' :
                      connectionStatus === 'connecting' ? '🟡 Conectando...' : '🔴 Desconectado'}
                  </Badge>
                  <Button 
                    onClick={() => setIsTradingPanelCollapsed(!isTradingPanelCollapsed)} 
                    variant="ghost" 
                    size="sm"
                  >
                    {isTradingPanelCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </CardHeader>
            {!isTradingPanelCollapsed && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Order Form */}
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      variant={orderSide === 'buy' ? 'default' : 'outline'}
                      onClick={() => setOrderSide('buy')}
                      className={orderSide === 'buy' ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                      BUY / LONG
                    </Button>
                    <Button
                      variant={orderSide === 'sell' ? 'default' : 'outline'}
                      onClick={() => setOrderSide('sell')}
                      className={orderSide === 'sell' ? 'bg-red-600 hover:bg-red-700' : ''}
                    >
                      SELL / SHORT
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {(['market', 'limit', 'stop'] as const).map((type) => (
                      <Button
                        key={type}
                        variant={orderType === type ? 'default' : 'outline'}
                        onClick={() => setOrderType(type)}
                        size="sm"
                      >
                        {type.toUpperCase()}
                      </Button>
                    ))}
                  </div>

                  <div>
                    <label className="text-sm font-medium">Tamaño</label>
                    <input
                      type="number"
                      step="0.001"
                      value={orderSize}
                      onChange={(e) => setOrderSize(Number(e.target.value))}
                      className="w-full mt-1 p-2 border rounded-lg"
                      placeholder="0.01"
                    />
                  </div>

                  {orderType !== 'market' && (
                    <div>
                      <label className="text-sm font-medium">Precio</label>
                      <input
                        type="number"
                        step="0.01"
                        value={orderPrice}
                        onChange={(e) => setOrderPrice(Number(e.target.value))}
                        className="w-full mt-1 p-2 border rounded-lg"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium">Apalancamiento: {leverage}x</label>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={leverage}
                      onChange={(e) => setLeverage(Number(e.target.value))}
                      className="w-full mt-1"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1x</span>
                      <span>100x</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium">Stop Loss</label>
                      <input
                        type="number"
                        step="0.01"
                        value={stopLoss || ''}
                        onChange={(e) => setStopLoss(e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full mt-1 p-2 border rounded-lg"
                        placeholder="Opcional"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Take Profit</label>
                      <input
                        type="number"
                        step="0.01"
                        value={takeProfit || ''}
                        onChange={(e) => setTakeProfit(e.target.value ? Number(e.target.value) : undefined)}
                        className="w-full mt-1 p-2 border rounded-lg"
                        placeholder="Opcional"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={executeOrder}
                    disabled={isSavingOperation || isLoadingPositions}
                    className={`w-full ${orderSide === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                  >
                    {isSavingOperation ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        {orderSide === 'buy' ? 'COMPRAR' : 'VENDER'} {selectedPair}
                      </>
                    )}
                  </Button>
                  
                  {/* Disclaimer de Simulación */}
                  <div className="flex items-start gap-2 p-3 mt-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-800 dark:text-blue-300">
                    <Activity className="w-4 h-4 mt-0.5 shrink-0" />
                    <p>
                      <strong>Entorno de Simulación:</strong> Las transacciones son virtuales (en USD simulados). 
                      No existen cobros reales, comisiones bancarias ni costos asociados por operar desde Perú ni de ningún otro país.
                    </p>
                  </div>
                </div>

                {/* Order Info */}
                <div className="space-y-4">
                  <div className="p-4 bg-muted/30 backdrop-blur-sm rounded-lg border border-border/50">
                    <h4 className="font-medium mb-3">Información de la Orden</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Precio actual:</span>
                        <span className="font-mono">${currentPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tamaño:</span>
                        <span className="font-mono">{orderSize} {selectedPair.split('/')[0]}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Valor nocional:</span>
                        <span className="font-mono">${(orderSize * currentPrice).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Margen requerido:</span>
                        <span className="font-mono">${((orderSize * currentPrice) / leverage).toFixed(2)}</span>
                      </div>
                      {leverage > 1 && (
                        <div className="flex justify-between text-orange-600">
                          <span>Apalancamiento:</span>
                          <span className="font-mono">{leverage}x</span>
                        </div>
                      )}

                      {/* Desglose de costos simulados para Perú */}
                      <div className="border-t border-border/40 pt-2 mt-2 space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Costos Simulados 🇵🇪</p>
                        <div className="flex justify-between text-orange-600 dark:text-orange-400">
                          <span>Fee de exchange (0.10%)</span>
                          <span className="font-mono">-${(orderSize * currentPrice * TRADING_FEE_RATE).toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between text-orange-600 dark:text-orange-400">
                          <span>Conversión PEN→USD (1.50%)</span>
                          <span className="font-mono">-${(orderSize * currentPrice * CONVERSION_FEE_RATE).toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between font-semibold border-t border-border/40 pt-1">
                          <span>Total comisiones (1.60%)</span>
                          <span className="font-mono text-red-600 dark:text-red-400">-${(orderSize * currentPrice * TOTAL_FEE_RATE).toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-foreground border-t border-border/40 pt-1">
                          <span>Costo efectivo total:</span>
                          <span className="font-mono">${((orderSize * currentPrice / leverage) + (orderSize * currentPrice * TOTAL_FEE_RATE)).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-muted/30 backdrop-blur-sm rounded-lg border border-border/50">
                    <h4 className="font-medium mb-3">Gestión de Riesgo</h4>
                    <div className="space-y-2 text-sm">
                      {stopLoss && (
                        <div className="flex justify-between text-red-600">
                          <span>Stop Loss:</span>
                          <span className="font-mono">${stopLoss.toFixed(2)}</span>
                        </div>
                      )}
                      {takeProfit && (
                        <div className="flex justify-between text-green-600">
                          <span>Take Profit:</span>
                          <span className="font-mono">${takeProfit.toFixed(2)}</span>
                        </div>
                      )}
                      {stopLoss && takeProfit && (
                        <div className="flex justify-between">
                          <span>Risk/Reward:</span>
                          <span className="font-mono">
                            1:{((Math.abs(takeProfit - currentPrice)) / Math.abs(stopLoss - currentPrice)).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            )}
          </Card>

          {/* Open Positions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Posiciones Abiertas
                  <Badge variant="outline">{positions.filter(p => p.status === 'open').length}</Badge>
                </CardTitle>
                <Button 
                  onClick={() => setIsOpenPositionsCollapsed(!isOpenPositionsCollapsed)} 
                  variant="ghost" 
                  size="sm"
                >
                  {isOpenPositionsCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </Button>
              </div>
            </CardHeader>
            {!isOpenPositionsCollapsed && (
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {positions.filter(p => p.status === 'open').length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No hay posiciones abiertas</p>
                    <p className="text-sm">Abre una posición para comenzar</p>
                  </div>
                ) : (
                  positions.filter(p => p.status === 'open').map((position) => (
                    <div key={position.id} className="p-3 bg-muted/30 backdrop-blur-sm rounded-lg border border-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`p-1 rounded backdrop-blur-sm ${position.type === 'long' ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                            {position.type === 'long' ?
                              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" /> :
                              <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                            }
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {position.type.toUpperCase()} {position.size} {position.pair}
                              {position.leverage > 1 && <span className="text-orange-600"> ({position.leverage}x)</span>}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Entrada: ${position.entryPrice.toFixed(2)} • {position.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => closePosition(position.id)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                        >
                          Cerrar
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="text-muted-foreground">P&L No Realizado</p>
                          <p className={`font-medium ${position.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {position.unrealizedPnL >= 0 ? '+' : ''}${position.unrealizedPnL.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Margen Usado</p>
                          <p className="font-medium">${position.margin.toFixed(2)}</p>
                        </div>
                        {position.stopLoss && (
                          <div>
                            <p className="text-muted-foreground">Stop Loss</p>
                            <p className="font-medium text-red-600">${position.stopLoss.toFixed(2)}</p>
                          </div>
                        )}
                        {position.takeProfit && (
                          <div>
                            <p className="text-muted-foreground">Take Profit</p>
                            <p className="font-medium text-green-600">${position.takeProfit.toFixed(2)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
            )}
          </Card>

          {/* Closed Positions History */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Historial de Posiciones
                  <Badge variant="outline">{positions.filter(p => p.status === 'closed').length}</Badge>
                </CardTitle>
                <Button 
                  onClick={() => setIsHistoryCollapsed(!isHistoryCollapsed)} 
                  variant="ghost" 
                  size="sm"
                >
                  {isHistoryCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </Button>
              </div>
            </CardHeader>
            {!isHistoryCollapsed && (
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {positions.filter(p => p.status === 'closed').length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay historial aún</p>
                  </div>
                ) : (
                  positions.filter(p => p.status === 'closed').slice(0, 5).map((position) => (
                    <div key={position.id} className="flex items-center justify-between p-2 bg-muted/20 backdrop-blur-sm rounded border border-border/30">
                      <div className="flex items-center gap-2">
                        <div className={`p-1 rounded backdrop-blur-sm ${position.type === 'long' ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                          {position.type === 'long' ?
                            <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" /> :
                            <TrendingDown className="w-3 h-3 text-red-600 dark:text-red-400" />
                          }
                        </div>
                        <div>
                          <p className="text-xs font-medium">
                            {position.type.toUpperCase()} {position.size} {position.pair}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {position.timestamp.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <p className={`text-xs font-medium ${position.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
            )}
          </Card>

          {/* Live Notifications */}
          {notifications.length > 0 && (
            <div className="fixed top-4 right-4 z-50 space-y-2">
              {notifications.map((notification) => (
                <Card key={notification.id} className={`w-80 ${notification.type === 'success' ? 'border-green-500 bg-green-50 dark:bg-green-950/20' :
                  notification.type === 'error' ? 'border-red-500 bg-red-50 dark:bg-red-950/20' :
                    'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
                  } animate-in slide-in-from-right duration-300`}>
                  <CardContent className="p-3">
                    <p className="text-sm font-medium">{notification.message}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}