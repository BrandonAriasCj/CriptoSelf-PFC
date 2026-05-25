import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface BacktestResult {
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  volatility: number;
  calmarRatio: number;
}

interface EquityData {
  date: string;
  equity: number;
  drawdown: number;
  benchmark: number;
}

interface TradeData {
  trade: number;
  pnl: number;
  pnlPercent: number;
  category: string;
}

interface MonthlyData {
  month: string;
  return: number;
}

const mockBacktestResults: BacktestResult = {
  totalReturn: 23.45,
  sharpeRatio: 1.84,
  maxDrawdown: -8.32,
  winRate: 68.5,
  totalTrades: 147,
  profitFactor: 2.31,
  avgWin: 2.84,
  avgLoss: -1.23,
  largestWin: 12.45,
  largestLoss: -4.67,
  consecutiveWins: 8,
  consecutiveLosses: 3,
  volatility: 12.7,
  calmarRatio: 2.82
};

const generateEquityCurve = (): EquityData[] => {
  const data: EquityData[] = [];
  let equity = 10000;
  let drawdown = 0;
  let peak = equity;
  
  for (let i = 0; i < 100; i++) {
    const date = new Date(Date.now() - (99 - i) * 24 * 60 * 60 * 1000);
    const return_ = (Math.random() - 0.45) * 0.02; // Slight positive bias
    equity = equity * (1 + return_);
    
    if (equity > peak) {
      peak = equity;
      drawdown = 0;
    } else {
      drawdown = ((equity - peak) / peak) * 100;
    }
    
    data.push({
      date: date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
      equity: Math.round(equity),
      drawdown: drawdown,
      benchmark: 10000 * (1 + i * 0.001) // Simple benchmark
    });
  }
  return data;
};

const generateTradeDistribution = (): TradeData[] => {
  const data: TradeData[] = [];
  for (let i = 0; i < 50; i++) {
    const pnl = (Math.random() - 0.32) * 10; // Slight positive bias
    data.push({
      trade: i + 1,
      pnl: pnl,
      pnlPercent: pnl,
      category: pnl > 0 ? 'Ganancia' : 'Pérdida'
    });
  }
  return data.sort((a, b) => a.pnl - b.pnl);
};

const generateMonthlyReturns = (): MonthlyData[] => {
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return months.map(month => ({
    month,
    return: (Math.random() - 0.3) * 8 // Slight positive bias
  }));
};

export function BacktestResults() {
  const [equityCurve, setEquityCurve] = useState<EquityData[]>([]);
  const [tradeDistribution, setTradeDistribution] = useState<TradeData[]>([]);
  const [monthlyReturns, setMonthlyReturns] = useState<MonthlyData[]>([]);

  useEffect(() => {
    setEquityCurve(generateEquityCurve());
    setTradeDistribution(generateTradeDistribution());
    setMonthlyReturns(generateMonthlyReturns());
  }, []);

  const getPerformanceBadge = (value: number, goodThreshold: number, excellentThreshold: number) => {
    if (value >= excellentThreshold) return { variant: 'default', label: 'Excelente', color: 'bg-green-100 text-green-800' };
    if (value >= goodThreshold) return { variant: 'secondary', label: 'Bueno', color: 'bg-blue-100 text-blue-800' };
    return { variant: 'destructive', label: 'Mejorable', color: 'bg-red-100 text-red-800' };
  };

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200/50 dark:border-green-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Retorno Total</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  +{mockBacktestResults.totalReturn}%
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ratio de Sharpe</p>
                <p className="text-2xl font-bold">{mockBacktestResults.sharpeRatio}</p>
                <Badge className={getPerformanceBadge(mockBacktestResults.sharpeRatio, 1, 1.5).color}>
                  {getPerformanceBadge(mockBacktestResults.sharpeRatio, 1, 1.5).label}
                </Badge>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tasa de Acierto</p>
                <p className="text-2xl font-bold">{mockBacktestResults.winRate}%</p>
                <Progress value={mockBacktestResults.winRate} className="mt-2" />
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Drawdown Máx.</p>
                <p className="text-2xl font-bold text-red-600">{mockBacktestResults.maxDrawdown}%</p>
                <Badge variant={Math.abs(mockBacktestResults.maxDrawdown) < 10 ? 'default' : 'destructive'}>
                  {Math.abs(mockBacktestResults.maxDrawdown) < 10 ? 'Aceptable' : 'Alto'}
                </Badge>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Curva de Equity vs Benchmark</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={equityCurve}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickFormatter={(value: number) => `${(value/1000).toFixed(0)}K`} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      color: 'hsl(var(--foreground))'
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'equity' ? `${value.toLocaleString()}` : `${value.toLocaleString()}`,
                      name === 'equity' ? 'Estrategia' : 'Benchmark'
                    ]}
                  />
                  <Line type="monotone" dataKey="equity" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="benchmark" stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Métricas Clave</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Trades</span>
                <span className="font-semibold">{mockBacktestResults.totalTrades}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Factor de Beneficio</span>
                <span className="font-semibold">{mockBacktestResults.profitFactor}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Ganancia Promedio</span>
                <span className="font-semibold text-green-600">+{mockBacktestResults.avgWin}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pérdida Promedio</span>
                <span className="font-semibold text-red-600">{mockBacktestResults.avgLoss}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Mayor Ganancia</span>
                <span className="font-semibold text-green-600">+{mockBacktestResults.largestWin}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Mayor Pérdida</span>
                <span className="font-semibold text-red-600">{mockBacktestResults.largestLoss}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Volatilidad</span>
                <span className="font-semibold">{mockBacktestResults.volatility}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Ratio Calmar</span>
                <span className="font-semibold">{mockBacktestResults.calmarRatio}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Charts */}
      <Tabs defaultValue="distribution" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="distribution">Distribución de Trades</TabsTrigger>
          <TabsTrigger value="monthly">Retornos Mensuales</TabsTrigger>
          <TabsTrigger value="drawdown">Análisis de Drawdown</TabsTrigger>
        </TabsList>

        <TabsContent value="distribution" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Distribución de P&L por Trade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tradeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="trade" stroke="hsl(var(--foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickFormatter={(value: number) => `${value.toFixed(1)}%`} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                        color: 'hsl(var(--foreground))'
                      }}
                      formatter={(value: number) => [`${value.toFixed(2)}%`, 'P&L']}
                    />
                    <Bar 
                      dataKey="pnl" 
                      fill="hsl(var(--chart-1))"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Retornos Mensuales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyReturns}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickFormatter={(value: number) => `${value.toFixed(1)}%`} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                        color: 'hsl(var(--foreground))'
                      }}
                      formatter={(value: number) => [`${value.toFixed(2)}%`, 'Retorno']}
                    />
                    <Bar dataKey="return" fill="hsl(var(--chart-2))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drawdown" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Drawdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={equityCurve}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickFormatter={(value: number) => `${value.toFixed(1)}%`} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                        color: 'hsl(var(--foreground))'
                      }}
                      formatter={(value: number) => [`${value.toFixed(2)}%`, 'Drawdown']}
                    />
                    <Line type="monotone" dataKey="drawdown" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Risk Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            Evaluación de Riesgo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Fortalezas
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Ratio Sharpe superior a 1.5</li>
                <li>• Tasa de acierto del 68.5%</li>
                <li>• Factor de beneficio positivo</li>
                <li>• Drawdown controlado</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600" />
                Áreas de Mejora
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Volatilidad moderada (12.7%)</li>
                <li>• Rachas de pérdidas consecutivas</li>
                <li>• Dependencia del mercado alcista</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Recomendaciones
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Diversificar con más pares</li>
                <li>• Ajustar stop loss más estricto</li>
                <li>• Considerar filtros de volatilidad</li>
                <li>• Probar en diferentes condiciones de mercado</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}