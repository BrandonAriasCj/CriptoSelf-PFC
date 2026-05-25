import React, { useState } from 'react';
import { StrategyBuilder } from './StrategyBuilder';
import { BacktestResults } from './BacktestResults';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { 
  Bot, 
  Play, 
  Pause, 
  TrendingUp, 
  Zap, 
  Target,
  BarChart3,
  PlusCircle,
  Settings,
  Activity,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

const volatilityIndicators = [
  { name: 'VIX', value: 18.4, change: -2.1, status: 'Moderado' },
  { name: 'ATR (BTC)', value: 1247.5, change: 5.3, status: 'Alto' },
  { name: 'BB Width', value: 0.034, change: -1.8, status: 'Bajo' },
  { name: 'Volatilidad Realizada', value: 0.62, change: 3.2, status: 'Medio' }
];

const activeStrategies = [
  {
    id: 1,
    name: 'Volatility Breakout Strategy',
    description: 'Estrategia basada en rupturas de volatilidad con ATR y Bollinger Bands',
    pair: 'BTC/USDT',
    type: 'Volatilidad',
    profit: 1247.50,
    profitPercent: 12.47,
    trades: 23,
    winRate: 73.9,
    sharpe: 1.82,
    maxDrawdown: -4.3,
    status: 'running',
    risk: 'Medio',
    indicators: ['ATR', 'Bollinger Bands', 'RSI']
  },
  {
    id: 2,
    name: 'Mean Reversion + VIX Filter',
    description: 'Reversión a la media con filtro de volatilidad VIX',
    pair: 'ETH/USDT',
    type: 'Reversión',
    profit: -156.20,
    profitPercent: -1.56,
    trades: 18,
    winRate: 55.6,
    sharpe: 0.34,
    maxDrawdown: -8.7,
    status: 'paused',
    risk: 'Alto',
    indicators: ['VIX', 'Stochastic', 'MACD']
  },
  {
    id: 3,
    name: 'Momentum + Low Volatility',
    description: 'Estrategia de momentum activa solo en períodos de baja volatilidad',
    pair: 'SOL/USDT',
    type: 'Momentum',
    profit: 892.75,
    profitPercent: 8.93,
    trades: 31,
    winRate: 67.7,
    sharpe: 1.45,
    maxDrawdown: -6.1,
    status: 'running',
    risk: 'Medio',
    indicators: ['ATR', 'EMA', 'Volume']
  }
];

export function AlgoTrading() {
  const [strategies, setStrategies] = useState(activeStrategies);
  const [activeTab, setActiveTab] = useState('overview');

  const toggleStrategy = (id: number) => {
    setStrategies(prev => prev.map(strategy => 
      strategy.id === id 
        ? { ...strategy, status: strategy.status === 'running' ? 'paused' : 'running' }
        : strategy
    ));
    toast.success('Estado de estrategia actualizado');
  };

  const totalProfit = strategies.reduce((sum, s) => sum + s.profit, 0);
  const avgWinRate = strategies.reduce((sum, s) => sum + s.winRate, 0) / strategies.length;
  const runningStrategies = strategies.filter(s => s.status === 'running').length;

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Bajo': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'Medio': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'Alto': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'running' 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Resumen</span>
          </TabsTrigger>
          <TabsTrigger value="builder" className="flex items-center gap-2">
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Constructor</span>
          </TabsTrigger>
          <TabsTrigger value="backtest" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Backtesting</span>
          </TabsTrigger>
          <TabsTrigger value="strategies" className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            <span className="hidden sm:inline">Estrategias</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Performance Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200/50 dark:border-blue-800/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Estrategias Activas</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{runningStrategies}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">de {strategies.length} totales</p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                    <Bot className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`bg-gradient-to-br ${totalProfit >= 0 ? 'from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200/50 dark:border-green-800/50' : 'from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border-red-200/50 dark:border-red-800/50'}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium ${totalProfit >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                      P&L Total Algoritmos
                    </p>
                    <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}`}>
                      {totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)}
                    </p>
                    <p className={`text-xs ${totalProfit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {((totalProfit / 30000) * 100).toFixed(2)}% retorno
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${totalProfit >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                    <TrendingUp className={`w-6 h-6 ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Tasa de Acierto</p>
                    <p className="text-2xl font-bold">{avgWinRate.toFixed(1)}%</p>
                    <Progress value={avgWinRate} className="mt-2 h-2" />
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                    <Target className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Trades Ejecutados</p>
                    <p className="text-2xl font-bold">{strategies.reduce((sum, s) => sum + s.trades, 0)}</p>
                    <p className="text-xs text-muted-foreground">Último: hace 12 min</p>
                  </div>
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                    <Zap className="w-6 h-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Volatility Indicators */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-orange-600" />
                Indicadores de Volatilidad del Mercado
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Monitoreo en tiempo real de indicadores clave para estrategias cuantitativas
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {volatilityIndicators.map((indicator, index) => (
                  <div key={index} className="p-4 bg-muted/30 rounded-xl border">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium text-sm">{indicator.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {indicator.status}
                      </Badge>
                    </div>
                    <p className="text-xl font-bold mb-1">
                      {typeof indicator.value === 'number' && indicator.value > 100 
                        ? indicator.value.toLocaleString() 
                        : indicator.value}
                    </p>
                    <p className={`text-sm ${indicator.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {indicator.change >= 0 ? '+' : ''}{indicator.change}%
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active Strategies Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Estrategias en Ejecución</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {strategies.map((strategy) => (
                  <div key={strategy.id} className="p-4 bg-gradient-to-r from-card to-muted/20 rounded-xl border shadow-sm">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-lg">{strategy.name}</h4>
                            <p className="text-sm text-muted-foreground mb-2">{strategy.description}</p>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline">{strategy.pair}</Badge>
                              <Badge className={getRiskColor(strategy.risk)}>{strategy.risk}</Badge>
                              <Badge className={getStatusColor(strategy.status)}>
                                {strategy.status === 'running' ? 'Activa' : 'Pausada'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mt-2">
                          {strategy.indicators.map((indicator, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {indicator}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:w-80">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">P&L</p>
                          <p className={`font-semibold ${strategy.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {strategy.profit >= 0 ? '+' : ''}${Math.abs(strategy.profit).toFixed(0)}
                          </p>
                          <p className={`text-xs ${strategy.profitPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {strategy.profitPercent >= 0 ? '+' : ''}{strategy.profitPercent}%
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Win Rate</p>
                          <p className="font-semibold">{strategy.winRate}%</p>
                          <div className="w-full bg-muted rounded-full h-1 mt-1">
                            <div 
                              className="bg-primary h-1 rounded-full" 
                              style={{ width: `${strategy.winRate}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Sharpe</p>
                          <p className="font-semibold">{strategy.sharpe}</p>
                          <Badge variant={strategy.sharpe > 1.5 ? 'default' : strategy.sharpe > 1 ? 'secondary' : 'destructive'} className="text-xs mt-1">
                            {strategy.sharpe > 1.5 ? 'Excelente' : strategy.sharpe > 1 ? 'Bueno' : 'Mejorar'}
                          </Badge>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Drawdown</p>
                          <p className="font-semibold text-red-600">{strategy.maxDrawdown}%</p>
                          <p className="text-xs text-muted-foreground">{strategy.trades} trades</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant={strategy.status === 'running' ? 'outline' : 'default'}
                          size="sm"
                          onClick={() => toggleStrategy(strategy.id)}
                          className="min-w-[80px]"
                        >
                          {strategy.status === 'running' ? (
                            <>
                              <Pause className="w-4 h-4 mr-1" />
                              Pausar
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-1" />
                              Iniciar
                            </>
                          )}
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="builder" className="mt-6">
          <StrategyBuilder />
        </TabsContent>

        <TabsContent value="backtest" className="mt-6">
          <BacktestResults />
        </TabsContent>

        <TabsContent value="strategies" className="mt-6">
          <div className="text-center py-12">
            <Bot className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Biblioteca de Estrategias</h3>
            <p className="text-muted-foreground mb-6">
              Explora y gestiona todas tus estrategias cuantitativas
            </p>
            <Button>
              <PlusCircle className="w-4 h-4 mr-2" />
              Importar Estrategia
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}