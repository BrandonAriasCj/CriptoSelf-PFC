import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Scatter, ComposedChart } from 'recharts';
import { 
  TrendingUp, 
  Volume2, 
  BarChart3, 
  Activity,
  Zap,
  ArrowUp,
  ArrowDown,
  Play,
  Pause,
  RotateCcw,
  Target,
  DollarSign
} from 'lucide-react';

interface TriggerEvent {
  id: string;
  timestamp: number;
  type: string;
  name: string;
  price: number;
  action: 'buy' | 'sell';
  pnl: number;
}

interface PriceData {
  timestamp: number;
  time: string;
  price: number;
  volume: number;
  ma_fast?: number;
  ma_slow?: number;
}

const generatePriceData = (): PriceData[] => {
  const data: PriceData[] = [];
  let price = 43000;
  const now = Date.now();
  
  for (let i = 50; i >= 0; i--) {
    const timestamp = now - (i * 60 * 60 * 1000);
    const change = (Math.random() - 0.5) * 500;
    price += change;
    
    data.push({
      timestamp,
      time: new Date(timestamp).toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit',
        day: '2-digit',
        month: 'short'
      }),
      price: Math.round(price),
      volume: Math.floor(Math.random() * 500000) + 250000,
      ma_fast: Math.round(price + (Math.random() - 0.5) * 200),
      ma_slow: Math.round(price + (Math.random() - 0.5) * 300)
    });
  }
  
  return data;
};

const generateTriggerEvents = (priceData: PriceData[]): TriggerEvent[] => {
  const events: TriggerEvent[] = [];
  
  const triggerTypes = [
    { type: 'ma_cross', name: 'MA Cross' },
    { type: 'volume_spike', name: 'Volume' },
    { type: 'rsi_level', name: 'RSI' },
    { type: 'price_breakout', name: 'Breakout' }
  ];
  
  for (let i = 5; i < priceData.length - 5; i += Math.floor(Math.random() * 8) + 3) {
    const trigger = triggerTypes[Math.floor(Math.random() * triggerTypes.length)];
    const dataPoint = priceData[i];
    
    events.push({
      id: `trigger_${i}`,
      timestamp: dataPoint.timestamp,
      type: trigger.type,
      name: trigger.name,
      price: dataPoint.price,
      action: Math.random() > 0.5 ? 'buy' : 'sell',
      pnl: (Math.random() - 0.3) * 300
    });
  }
  
  return events;
};

interface TradingChartProps {
  onClose?: () => void;
}

export function TradingChart({ onClose }: TradingChartProps) {
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [triggerEvents, setTriggerEvents] = useState<TriggerEvent[]>([]);
  const [selectedCrypto, setSelectedCrypto] = useState('BTC/USDT');
  const [showMA, setShowMA] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const data = generatePriceData();
    setPriceData(data);
    setTriggerEvents(generateTriggerEvents(data));
  }, [selectedCrypto]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const triggerAtPoint = triggerEvents.find(e => e.timestamp === data.timestamp);
      
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{label}</p>
          <p className="text-white">Precio: ${data.price.toLocaleString()}</p>
          {triggerAtPoint && (
            <div className="mt-2 pt-2 border-t border-gray-600">
              <p className="text-blue-400">{triggerAtPoint.name} - {triggerAtPoint.action.toUpperCase()}</p>
              <p className={triggerAtPoint.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                P&L: {triggerAtPoint.pnl >= 0 ? '+' : ''}${triggerAtPoint.pnl.toFixed(2)}
              </p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const TriggerMarker = ({ cx, cy, payload }: any) => {
    const trigger = triggerEvents.find(e => e.timestamp === payload.timestamp);
    if (!trigger) return null;

    return (
      <circle
        cx={cx}
        cy={cy}
        r="6"
        fill={trigger.action === 'buy' ? '#10B981' : '#EF4444'}
        stroke="#ffffff"
        strokeWidth="2"
      />
    );
  };

  const totalPnL = triggerEvents.reduce((sum, event) => sum + event.pnl, 0);
  const winRate = triggerEvents.filter(e => e.pnl > 0).length / triggerEvents.length * 100;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-full">
      {/* Header */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-6 h-6" />
                Backtesting - CriptoSelf
              </CardTitle>
            </div>
            <div className="flex items-center gap-3">
              {onClose && (
                <Button variant="outline" onClick={onClose} className="border-gray-600 text-gray-300">
                  Cerrar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Criptomoneda</label>
              <Select value={selectedCrypto} onValueChange={setSelectedCrypto}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="BTC/USDT">BTC/USDT</SelectItem>
                  <SelectItem value="ETH/USDT">ETH/USDT</SelectItem>
                  <SelectItem value="SOL/USDT">SOL/USDT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button
                onClick={() => setIsPlaying(!isPlaying)}
                className={isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
              >
                {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isPlaying ? 'Pausar' : 'Reproducir'}
              </Button>
              <Button
                onClick={() => {}}
                variant="outline"
                className="border-gray-600 text-gray-300"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => setShowMA(!showMA)}
                variant={showMA ? "default" : "outline"}
                size="sm"
              >
                Medias Móviles
              </Button>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">P&L Total</p>
              <p className={`font-bold ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Triggers</p>
                <p className="text-xl font-bold text-white">{triggerEvents.length}</p>
              </div>
              <Target className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Tasa Éxito</p>
                <p className="text-xl font-bold text-green-400">{winRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Mejor Trade</p>
                <p className="text-xl font-bold text-green-400">
                  +${Math.max(...triggerEvents.map(e => e.pnl)).toFixed(2)}
                </p>
              </div>
              <ArrowUp className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Peor Trade</p>
                <p className="text-xl font-bold text-red-400">
                  ${Math.min(...triggerEvents.map(e => e.pnl)).toFixed(2)}
                </p>
              </div>
              <ArrowDown className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Gráfico de Precio con Triggers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={priceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="time" 
                  stroke="#9CA3AF" 
                  fontSize={12}
                  interval="preserveStartEnd"
                />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                
                {showMA && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="ma_fast"
                      stroke="#3B82F6"
                      strokeWidth={1}
                      dot={false}
                      name="MA Rápida"
                    />
                    <Line
                      type="monotone"
                      dataKey="ma_slow"
                      stroke="#EF4444"
                      strokeWidth={1}
                      dot={false}
                      name="MA Lenta"
                    />
                  </>
                )}
                
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={false}
                  name="Precio"
                />
                
                <Scatter
                  dataKey="price"
                  shape={<TriggerMarker />}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Eventos de Triggers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {triggerEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    event.action === 'buy' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <p className="font-medium text-white">{event.name}</p>
                    <p className="text-sm text-gray-400">
                      {new Date(event.timestamp).toLocaleTimeString('es-ES')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className={event.action === 'buy' ? 'bg-green-600' : 'bg-red-600'}>
                    {event.action.toUpperCase()}
                  </Badge>
                  <p className={`text-sm mt-1 ${event.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {event.pnl >= 0 ? '+' : ''}${event.pnl.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}