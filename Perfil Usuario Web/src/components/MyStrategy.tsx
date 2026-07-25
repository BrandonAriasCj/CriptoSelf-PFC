import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { BacktestingChart } from './BacktestingChart';
import { SimpleBacktestingChart } from './SimpleBacktestingChart';
import {
  BarChart3,
  Calendar,
  Coins,
  LineChart,
  History,
  Globe
} from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';

// Función temporal para toast hasta que se configure correctamente
const toast = {
  success: (message: string) => console.log('✅', message),
  error: (message: string) => console.log('❌', message)
};

interface AnalysisConfig {
  symbol: string;
  timeframe: string;
  fecha_inicio: string;
  fecha_fin: string;
}

// Monedas disponibles para el análisis histórico.
const AVAILABLE_COINS = [
  { value: 'BTC/USDT', label: 'Bitcoin (BTC)' },
  { value: 'ETH/USDT', label: 'Ethereum (ETH)' },
  { value: 'BNB/USDT', label: 'BNB (BNB)' },
  { value: 'SOL/USDT', label: 'Solana (SOL)' },
  { value: 'XRP/USDT', label: 'XRP (XRP)' },
  { value: 'ADA/USDT', label: 'Cardano (ADA)' },
  { value: 'DOGE/USDT', label: 'Dogecoin (DOGE)' }
];

const todayDate = new Date();
const lastYearDate = new Date();
lastYearDate.setFullYear(todayDate.getFullYear() - 1);

const defaultConfig: AnalysisConfig = {
  symbol: 'BTC/USDT',
  timeframe: '1d',
  fecha_inicio: lastYearDate.toISOString().split('T')[0],
  fecha_fin: todayDate.toISOString().split('T')[0]
};

export function MyStrategy() {
  const [config, setConfig] = useState<AnalysisConfig>(defaultConfig);
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartView, setChartView] = useState<'detailed' | 'simple'>('detailed');
  // Moneda con la que se generó el gráfico actual (para los títulos del chart).
  const [analyzedSymbol, setAnalyzedSymbol] = useState(defaultConfig.symbol);

  const prefix = import.meta.env.VITE_PREFIX;

  const updateConfig = (key: keyof AnalysisConfig, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const setDateRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

    // Sugerir una granularidad de vela acorde al período seleccionado.
    let suggestedTimeframe = config.timeframe;
    if (days <= 7) suggestedTimeframe = '15m';
    else if (days <= 30) suggestedTimeframe = '1h';
    else if (days <= 180) suggestedTimeframe = '4h';
    else suggestedTimeframe = '1d';

    setConfig(prev => ({
      ...prev,
      fecha_inicio: start.toISOString().split('T')[0],
      fecha_fin: end.toISOString().split('T')[0],
      timeframe: suggestedTimeframe
    }));
  };

  const handleAnalizar = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${prefix}/api/backtesting/run-custom/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          symbol: config.symbol,
          timeframe: config.timeframe,
          fecha_inicio: config.fecha_inicio,
          fecha_fin: config.fecha_fin,
          // Modo "solo gráfica": traemos el precio histórico real sin ejecutar
          // ninguna estrategia técnica. El foco es el análisis del pasado.
          only_plot: true
        })
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const result = await response.json();
      setChartData(result);
      setAnalyzedSymbol(config.symbol);
      toast.success('Análisis histórico generado');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      toast.error('Error al generar el análisis');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center">
              <History className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Análisis Histórico del Mercado</CardTitle>
              <p className="text-sm text-muted-foreground">
                Observa el comportamiento pasado de una moneda y los eventos fundamentales que lo explican
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Configuración: Moneda + Período */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="w-5 h-5" />
            ¿Qué quieres analizar?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Moneda */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Coins className="w-4 h-4" />
              Moneda
            </Label>
            <Select
              value={config.symbol}
              onValueChange={(value) => updateConfig('symbol', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_COINS.map((coin) => (
                  <SelectItem key={coin.value} value={coin.value}>
                    {coin.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Período - selección rápida */}
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/40">
            <Label className="flex items-center gap-2 mb-3 font-semibold text-blue-800 dark:text-blue-300">
              <Calendar className="w-4 h-4" />
              Período de tiempo
            </Label>
            <div className="flex flex-wrap gap-2 mb-4">
              <Button variant="outline" className="text-xs" onClick={() => setDateRange(7)}>Última Semana</Button>
              <Button variant="outline" className="text-xs" onClick={() => setDateRange(30)}>Último Mes</Button>
              <Button variant="outline" className="text-xs" onClick={() => setDateRange(90)}>Últimos 3 Meses</Button>
              <Button variant="outline" className="text-xs" onClick={() => setDateRange(180)}>Últimos 6 Meses</Button>
              <Button variant="outline" className="text-xs" onClick={() => setDateRange(365)}>Último Año</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs">Fecha Inicio</Label>
                <Input
                  type="date"
                  value={config.fecha_inicio}
                  onChange={(e) => updateConfig('fecha_inicio', e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Fecha Fin</Label>
                <Input
                  type="date"
                  value={config.fecha_fin}
                  onChange={(e) => updateConfig('fecha_fin', e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Granularidad</Label>
                <Select
                  value={config.timeframe}
                  onValueChange={(value) => updateConfig('timeframe', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15m">15 Minutos</SelectItem>
                    <SelectItem value="1h">1 Hora</SelectItem>
                    <SelectItem value="4h">4 Horas</SelectItem>
                    <SelectItem value="1d">1 Día</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Button
            onClick={handleAnalizar}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <LineChart className="w-4 h-4 mr-2" />
            {isLoading ? 'Analizando...' : 'Analizar Período'}
          </Button>
        </CardContent>
      </Card>

      {/* Info: análisis fundamental */}
      {!chartData && !isLoading && (
        <Card className="bg-card border-blue-500/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Globe className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">¿Qué es el análisis del pasado?</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Revisa el precio histórico real de una moneda y descubre <strong>por qué</strong> se movió:
                  guerras, conflictos geopolíticos, decisiones de gobiernos, crisis financieras y otros
                  eventos de análisis fundamental aparecen marcados sobre el gráfico.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-sm">Precio histórico real</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-sm">Eventos geopolíticos y económicos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <span className="text-sm">Causas detrás de cada movimiento</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando datos históricos...</p>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
          <CardContent className="p-4">
            <p className="text-red-600 dark:text-red-400">Error: {error}</p>
          </CardContent>
        </Card>
      )}

      {/* Resultado: gráfico con eventos fundamentales */}
      {chartData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Histórico de {analyzedSymbol}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={chartView === 'detailed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartView('detailed')}
                >
                  <BarChart3 className="w-4 h-4 mr-1" />
                  Con eventos
                </Button>
                <Button
                  variant={chartView === 'simple' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartView('simple')}
                >
                  <LineChart className="w-4 h-4 mr-1" />
                  Solo precio
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="min-h-[500px]">
              <ErrorBoundary>
                {chartView === 'detailed' ? (
                  <BacktestingChart data={chartData} symbol={analyzedSymbol} />
                ) : (
                  <SimpleBacktestingChart data={chartData} symbol={analyzedSymbol} />
                )}
              </ErrorBoundary>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
