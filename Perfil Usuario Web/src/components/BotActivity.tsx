import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Clock,
  Target,
  BarChart3
} from 'lucide-react';

const recentTrades = [
  {
    id: 1,
    pair: 'BTC/USDT',
    type: 'buy',
    price: 43250,
    amount: 0.025,
    time: '14:32',
    pnl: 125.50,
    strategy: 'MA Cross'
  },
  {
    id: 2,
    pair: 'ETH/USDT',
    type: 'sell',
    price: 2680,
    amount: 0.5,
    time: '13:45',
    pnl: -45.20,
    strategy: 'RSI Signal'
  },
  {
    id: 3,
    pair: 'BTC/USDT',
    type: 'buy',
    price: 43100,
    amount: 0.030,
    time: '12:15',
    pnl: 89.75,
    strategy: 'MA Cross'
  },
  {
    id: 4,
    pair: 'SOL/USDT',
    type: 'sell',
    price: 98.5,
    amount: 10,
    time: '11:22',
    pnl: 234.80,
    strategy: 'Volume Spike'
  }
];

const stats = [
  {
    title: 'P&L Total',
    value: '+$1,247.85',
    change: '+12.4%',
    icon: DollarSign,
    color: 'text-green-400'
  },
  {
    title: 'Trades Hoy',
    value: '8',
    change: '4 ganadores',
    icon: Activity,
    color: 'text-blue-400'
  },
  {
    title: 'Tasa Éxito',
    value: '67%',
    change: '+5% vs ayer',
    icon: Target,
    color: 'text-purple-400'
  },
  {
    title: 'Sharpe Ratio',
    value: '1.85',
    change: 'Excelente',
    icon: BarChart3,
    color: 'text-orange-400'
  }
];

export function BotActivity() {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <Card className="bg-gradient-to-r from-emerald-900/20 to-blue-900/20 border-emerald-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Activity className="w-6 h-6" />
                Actividad del Bot
              </CardTitle>
              <p className="text-muted-foreground">Monitoreo en tiempo real de tu estrategia</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-400">Bot Activo</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.change}</p>
                  </div>
                  <Icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Trades */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Trades Recientes</CardTitle>
            <Button variant="outline" size="sm">
              Ver Todo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentTrades.map((trade) => (
              <div
                key={trade.id}
                className="flex items-center justify-between p-4 bg-muted rounded-lg border"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    trade.type === 'buy' ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    {trade.type === 'buy' ? (
                      <TrendingUp className="w-5 h-5 text-green-400" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{trade.pair}</span>
                      <Badge className={trade.type === 'buy' ? 'bg-green-600' : 'bg-red-600'}>
                        {trade.type.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {trade.amount} @ ${trade.price.toLocaleString()} • {trade.strategy}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-medium ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {trade.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bot Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Estado del Bot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Estado</span>
              <Badge className="bg-green-600">Ejecutándose</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Estrategia Activa</span>
              <span>MA Cross + RSI</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Próxima Verificación</span>
              <span>2 min</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Capital Asignado</span>
              <span>$10,000</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Controles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="destructive" className="w-full">
              Pausar Bot
            </Button>
            <Button variant="outline" className="w-full">
              Reiniciar Estrategia
            </Button>
            <Button variant="outline" className="w-full">
              Descargar Logs
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}