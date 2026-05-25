import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { TradingChart } from './TradingChart';
import { BacktestingChart } from './BacktestingChart';
import { SimpleBacktestingChart } from './SimpleBacktestingChart';
import {
  TrendingUp,
  BarChart3,
  Zap,
  TestTube,
  Settings,
  ArrowLeft,
  Calendar,
  DollarSign,
  Clock,
  Target,
  Shield,
  ChevronDown,
  ChevronUp,
  LineChart
} from 'lucide-react';
import { ErrorBoundary } from './ErrorBoundary';
// import { toast } from 'sonner';

// Función temporal para toast hasta que se configure correctamente
const toast = {
  success: (message: string) => console.log('✅', message),
  error: (message: string) => console.log('❌', message)
};




interface BacktestingConfig {
  symbol: string;
  timeframe: string;
  fecha_inicio: string;
  fecha_fin: string;
  capital_inicial: number;
  ema_fast: number;
  ema_slow: number;
  rsi_period: number;
  stop_loss_mult: number;
  take_profit_mult: number;
  risk_per_trade: number;
  min_volume: number;
  adx_threshold: number;
  bollinger_period: number;
  atr_period: number;
}

const todayDate = new Date();
const lastYearDate = new Date();
lastYearDate.setFullYear(todayDate.getFullYear() - 1);

const defaultBacktestConfig: BacktestingConfig = {
  symbol: 'BTC/USDT',
  timeframe: '5m',
  fecha_inicio: lastYearDate.toISOString().split('T')[0],
  fecha_fin: todayDate.toISOString().split('T')[0],
  capital_inicial: 1000,
  ema_fast: 9,
  ema_slow: 21,
  rsi_period: 14,
  stop_loss_mult: 2.0,
  take_profit_mult: 4.0,
  risk_per_trade: 0.02,
  min_volume: 5,
  adx_threshold: 25,
  bollinger_period: 20,
  atr_period: 14
};

export function MyStrategy() {
  const [strategyName, setStrategyName] = useState('Mi Estrategia de Backtesting');
  const [showTradingChart, setShowTradingChart] = useState(false);
  const [showBacktesting, setShowBacktesting] = useState(false);
  const [showBacktestConfig, setShowBacktestConfig] = useState(false);
  const [backtestConfig, setBacktestConfig] = useState<BacktestingConfig>(defaultBacktestConfig);
  const [backtestData, setBacktestData] = useState(null);
  const [isBacktesting, setIsBacktesting] = useState(false);
  const [backtestError, setBacktestError] = useState(null);
  const [chartView, setChartView] = useState<'detailed' | 'simple'>('detailed');
  const [configTab, setConfigTab] = useState<'basic' | 'strategy' | 'advanced'>('basic');

  const prefix = import.meta.env.VITE_PREFIX;
  const handleBacktest = async (onlyPlot: boolean = false) => {
    setIsBacktesting(true);
    setBacktestError(null);
    setShowBacktesting(true);

    try {
      console.log(prefix);
      const response = await fetch(`${prefix}/api/backtesting/run-custom/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...backtestConfig,
          only_plot: onlyPlot
        })
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const result = await response.json();
      setBacktestData(result);
      toast.success('Backtesting completado exitosamente');
    } catch (err) {
      setBacktestError(err instanceof Error ? err.message : 'Error desconocido');
      toast.error('Error en el backtesting');
    } finally {
      setIsBacktesting(false);
    }
  };

  const updateBacktestConfig = (key: keyof BacktestingConfig, value: string | number) => {
    setBacktestConfig(prev => ({ ...prev, [key]: value }));
  };

  const setDateRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

    // Calcula sugerencia de timeframe basado en días
    let suggestedTimeframe = backtestConfig.timeframe;
    if (days <= 7) suggestedTimeframe = '5m';
    else if (days <= 30) suggestedTimeframe = '15m';
    else if (days <= 90) suggestedTimeframe = '1h';
    else if (days <= 180) suggestedTimeframe = '4h';
    else suggestedTimeframe = '1d';

    setBacktestConfig(prev => ({
      ...prev,
      fecha_inicio: start.toISOString().split('T')[0],
      fecha_fin: end.toISOString().split('T')[0],
      timeframe: suggestedTimeframe
    }));
  };

  const applyPreset = (preset: 'conservative' | 'aggressive' | 'scalping') => {
    const presets = {
      conservative: {
        ...defaultBacktestConfig,
        stop_loss_mult: 1.5,
        take_profit_mult: 3.0,
        risk_per_trade: 0.01,
        rsi_period: 21,
        adx_threshold: 30
      },
      aggressive: {
        ...defaultBacktestConfig,
        stop_loss_mult: 3.0,
        take_profit_mult: 6.0,
        risk_per_trade: 0.05,
        rsi_period: 7,
        adx_threshold: 20
      },
      scalping: {
        ...defaultBacktestConfig,
        timeframe: '1m',
        ema_fast: 5,
        ema_slow: 13,
        stop_loss_mult: 0.5,
        take_profit_mult: 1.5,
        risk_per_trade: 0.01
      }
    };

    setBacktestConfig(presets[preset]);
    toast.success(`Preset ${preset} aplicado`);
  };



  // Si se debe mostrar el gráfico de trading, renderizar ese componente
  if (showTradingChart) {
    return <TradingChart onClose={() => setShowTradingChart(false)} />;
  }

  // Si se debe mostrar el backtesting, renderizar la interfaz de backtesting
  if (showBacktesting) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header del Backtesting */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBacktesting(false)}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver a Estrategia
                </Button>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <TestTube className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Backtesting: {strategyName}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Análisis histórico de rendimiento
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowBacktestConfig(!showBacktestConfig)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configurar
                  {showBacktestConfig ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                </Button>
                <Button
                  onClick={() => handleBacktest(true)}
                  disabled={isBacktesting}
                  variant="outline"
                  className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/40"
                >
                  <LineChart className="w-4 h-4 mr-2" />
                  Solo Graficar
                </Button>
                <Button
                  onClick={() => handleBacktest(false)}
                  disabled={isBacktesting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  {isBacktesting ? 'Ejecutando...' : 'Ejecutar Backtesting'}
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Panel de Configuración */}
        {showBacktestConfig && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configuración de Backtesting
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Presets */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold mb-3">🎯 Presets Rápidos</h4>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => applyPreset('conservative')}
                    className="p-4 h-auto flex-col items-start"
                  >
                    <Shield className="w-5 h-5 text-blue-600 mb-2" />
                    <div className="text-left">
                      <p className="font-medium">Conservador</p>
                      <p className="text-xs text-muted-foreground">Bajo riesgo, SL ajustado</p>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => applyPreset('aggressive')}
                    className="p-4 h-auto flex-col items-start"
                  >
                    <Zap className="w-5 h-5 text-red-600 mb-2" />
                    <div className="text-left">
                      <p className="font-medium">Agresivo</p>
                      <p className="text-xs text-muted-foreground">Alto riesgo, TP amplio</p>
                    </div>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => applyPreset('scalping')}
                    className="p-4 h-auto flex-col items-start"
                  >
                    <Clock className="w-5 h-5 text-green-600 mb-2" />
                    <div className="text-left">
                      <p className="font-medium">Scalping</p>
                      <p className="text-xs text-muted-foreground">1m, EMAs rápidas</p>
                    </div>
                  </Button>
                </div>
              </div>

              {/* Tabs de Configuración */}
              <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                {[
                  { id: 'basic', label: 'Básico', icon: Calendar },
                  { id: 'strategy', label: 'Estrategia', icon: TrendingUp },
                  { id: 'advanced', label: 'Avanzado', icon: BarChart3 }
                ].map(({ id, label, icon: Icon }) => (
                  <Button
                    key={id}
                    variant="ghost"
                    onClick={() => setConfigTab(id as any)}
                    className={`flex items-center gap-2 border-b-2 rounded-none ${configTab === id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Button>
                ))}
              </div>

              {/* Configuración Básica */}
              {configTab === 'basic' && (
                <div className="space-y-6">
                  {/* Quick Ranges */}
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/40">
                    <Label className="block font-semibold mb-3 text-blue-800 dark:text-blue-300">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Selección Rápida de Fechas
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" className="text-xs" onClick={() => setDateRange(7)}>Última Semana</Button>
                      <Button variant="outline" className="text-xs" onClick={() => setDateRange(30)}>Último Mes</Button>
                      <Button variant="outline" className="text-xs" onClick={() => setDateRange(90)}>Últimos 3 Meses</Button>
                      <Button variant="outline" className="text-xs" onClick={() => setDateRange(180)}>Últimos 6 Meses</Button>
                      <Button variant="outline" className="text-xs" onClick={() => setDateRange(365)}>Último Año</Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>Par de Trading</Label>
                      <Select
                        value={backtestConfig.symbol}
                        onValueChange={(value) => updateBacktestConfig('symbol', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BTC/USDT">BTC/USDT</SelectItem>
                          <SelectItem value="ETH/USDT">ETH/USDT</SelectItem>
                          <SelectItem value="ADA/USDT">ADA/USDT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Timeframe</Label>
                      <Select
                        value={backtestConfig.timeframe}
                        onValueChange={(value) => updateBacktestConfig('timeframe', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1m">1 Minuto</SelectItem>
                          <SelectItem value="5m">5 Minutos</SelectItem>
                          <SelectItem value="15m">15 Minutos</SelectItem>
                          <SelectItem value="1h">1 Hora</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Fecha Inicio</Label>
                      <Input
                        type="date"
                        value={backtestConfig.fecha_inicio}
                        onChange={(e) => updateBacktestConfig('fecha_inicio', e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Fecha Fin</Label>
                      <Input
                        type="date"
                        value={backtestConfig.fecha_fin}
                        onChange={(e) => updateBacktestConfig('fecha_fin', e.target.value)}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label>Capital Inicial: ${backtestConfig.capital_inicial}</Label>
                      <input
                        type="range"
                        min="100"
                        max="100000"
                        step="100"
                        value={backtestConfig.capital_inicial}
                        onChange={(e) => updateBacktestConfig('capital_inicial', Number(e.target.value))}
                        className="w-full mt-2"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Configuración de Estrategia */}
              {configTab === 'strategy' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>EMA Rápida: {backtestConfig.ema_fast}</Label>
                    <input
                      type="range"
                      min="3"
                      max="50"
                      value={backtestConfig.ema_fast}
                      onChange={(e) => updateBacktestConfig('ema_fast', Number(e.target.value))}
                      className="w-full mt-2"
                    />
                  </div>

                  <div>
                    <Label>EMA Lenta: {backtestConfig.ema_slow}</Label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={backtestConfig.ema_slow}
                      onChange={(e) => updateBacktestConfig('ema_slow', Number(e.target.value))}
                      className="w-full mt-2"
                    />
                  </div>

                  <div>
                    <Label>Stop Loss: {backtestConfig.stop_loss_mult}x</Label>
                    <input
                      type="range"
                      min="0.5"
                      max="5"
                      step="0.1"
                      value={backtestConfig.stop_loss_mult}
                      onChange={(e) => updateBacktestConfig('stop_loss_mult', Number(e.target.value))}
                      className="w-full mt-2"
                    />
                  </div>

                  <div>
                    <Label>Take Profit: {backtestConfig.take_profit_mult}x</Label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="0.1"
                      value={backtestConfig.take_profit_mult}
                      onChange={(e) => updateBacktestConfig('take_profit_mult', Number(e.target.value))}
                      className="w-full mt-2"
                    />
                  </div>

                  <div>
                    <Label>RSI Período: {backtestConfig.rsi_period}</Label>
                    <input
                      type="range"
                      min="7"
                      max="30"
                      value={backtestConfig.rsi_period}
                      onChange={(e) => updateBacktestConfig('rsi_period', Number(e.target.value))}
                      className="w-full mt-2"
                    />
                  </div>

                  <div>
                    <Label>Riesgo por Trade: {(backtestConfig.risk_per_trade * 100).toFixed(1)}%</Label>
                    <input
                      type="range"
                      min="0.005"
                      max="0.1"
                      step="0.005"
                      value={backtestConfig.risk_per_trade}
                      onChange={(e) => updateBacktestConfig('risk_per_trade', Number(e.target.value))}
                      className="w-full mt-2"
                    />
                  </div>
                </div>
              )}

              {/* Configuración Avanzada */}
              {configTab === 'advanced' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Volumen Mínimo: {backtestConfig.min_volume}</Label>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={backtestConfig.min_volume}
                      onChange={(e) => updateBacktestConfig('min_volume', Number(e.target.value))}
                      className="w-full mt-2"
                    />
                  </div>

                  <div>
                    <Label>ADX Threshold: {backtestConfig.adx_threshold}</Label>
                    <input
                      type="range"
                      min="15"
                      max="40"
                      value={backtestConfig.adx_threshold}
                      onChange={(e) => updateBacktestConfig('adx_threshold', Number(e.target.value))}
                      className="w-full mt-2"
                    />
                  </div>

                  <div>
                    <Label>Bollinger Bands: {backtestConfig.bollinger_period}</Label>
                    <input
                      type="range"
                      min="10"
                      max="50"
                      value={backtestConfig.bollinger_period}
                      onChange={(e) => updateBacktestConfig('bollinger_period', Number(e.target.value))}
                      className="w-full mt-2"
                    />
                  </div>

                  <div>
                    <Label>ATR Período: {backtestConfig.atr_period}</Label>
                    <input
                      type="range"
                      min="7"
                      max="30"
                      value={backtestConfig.atr_period}
                      onChange={(e) => updateBacktestConfig('atr_period', Number(e.target.value))}
                      className="w-full mt-2"
                    />
                  </div>
                </div>
              )}

              {/* Risk/Reward Visualization */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="text-sm font-semibold mb-3">📊 Métricas de Riesgo</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-red-600">
                      1:{(backtestConfig.take_profit_mult / backtestConfig.stop_loss_mult).toFixed(1)}
                    </p>
                    <p className="text-xs text-muted-foreground">Risk/Reward</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {((1 / (1 + backtestConfig.stop_loss_mult / backtestConfig.take_profit_mult)) * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Win Rate Necesario</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      ${(backtestConfig.capital_inicial * backtestConfig.risk_per_trade).toFixed(0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Riesgo por Trade</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isBacktesting && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Ejecutando backtesting...</p>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {backtestError && (
          <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
            <CardContent className="p-4">
              <p className="text-red-600 dark:text-red-400">Error: {backtestError}</p>
            </CardContent>
          </Card>
        )}

        {/* Resultados del Backtesting */}
        {backtestData && (
          <>


            {/* Gráfico */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Gráfico de Backtesting
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant={chartView === 'detailed' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setChartView('detailed')}
                    >
                      <BarChart3 className="w-4 h-4 mr-1" />
                      Completo
                    </Button>
                    <Button
                      variant={chartView === 'simple' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setChartView('simple')}
                    >
                      <LineChart className="w-4 h-4 mr-1" />
                      Simple
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="min-h-[500px]">
                  <ErrorBoundary>
                    {chartView === 'detailed' ? (
                      <BacktestingChart data={backtestData} />
                    ) : (
                      <SimpleBacktestingChart data={backtestData} />
                    )}
                  </ErrorBoundary>
                </div>
              </CardContent>
            </Card>


          </>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Strategy Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center">
                <TestTube className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">{strategyName}</CardTitle>
                <p className="text-sm text-muted-foreground">Prueba y optimiza tu estrategia con datos históricos</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label>Nombre de la Estrategia</Label>
              <Input
                value={strategyName}
                onChange={(e) => setStrategyName(e.target.value)}
                className="mt-1"
                placeholder="Ej: Estrategia EMA + RSI"
              />
            </div>
            <div className="flex gap-2 items-end">
              <Button
                onClick={() => handleBacktest(true)}
                variant="outline"
                className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-900/40"
              >
                <LineChart className="w-4 h-4 mr-2" />
                Solo Graficar
              </Button>
              <Button
                onClick={() => handleBacktest(false)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <TestTube className="w-4 h-4 mr-2" />
                Ejecutar Backtesting
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-card border-blue-500/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2">¿Qué es el Backtesting?</h3>
              <p className="text-sm text-muted-foreground mb-3">
                El backtesting te permite probar tu estrategia de trading con datos históricos reales del mercado.
                Esto te ayuda a evaluar el rendimiento potencial antes de arriesgar capital real.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-sm">Datos históricos reales</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-sm">Múltiples indicadores</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-sm">Análisis detallado</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}