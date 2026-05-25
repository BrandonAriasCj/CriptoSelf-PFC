import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { 
  Settings, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  BarChart3, 
  Clock, 
  Target,
  Shield,
  Zap,
  RefreshCw
} from 'lucide-react';

interface BacktestingConfigProps {
  onConfigChange: (config: BacktestingConfig) => void;
  isLoading: boolean;
}

export interface BacktestingConfig {
  // Configuración básica
  symbol: string;
  timeframe: string;
  fecha_inicio: string;
  fecha_fin: string;
  capital_inicial: number;
  
  // Parámetros de estrategia
  ema_fast: number;
  ema_slow: number;
  rsi_period: number;
  stop_loss_mult: number;
  take_profit_mult: number;
  risk_per_trade: number;
  
  // Configuración avanzada
  min_volume: number;
  adx_threshold: number;
  bollinger_period: number;
  atr_period: number;
}

const todayDate = new Date();
const lastYearDate = new Date();
lastYearDate.setFullYear(todayDate.getFullYear() - 1);

const defaultConfig: BacktestingConfig = {
  symbol: 'BTC/USDT',
  timeframe: '1d',
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

export const BacktestingConfig: React.FC<BacktestingConfigProps> = ({ 
  onConfigChange, 
  isLoading 
}) => {
  const [config, setConfig] = useState<BacktestingConfig>(defaultConfig);
  const [activeTab, setActiveTab] = useState<'basic' | 'strategy' | 'advanced'>('basic');

  const updateConfig = (key: keyof BacktestingConfig, value: string | number) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const setDateRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    
    const endStr = end.toISOString().split('T')[0];
    const startStr = start.toISOString().split('T')[0];
    
    // Calculamos si es necesario bajar el timeframe cuando elegimos rangos cortos
    let suggestedTimeframe = config.timeframe;
    if (days <= 7) suggestedTimeframe = '5m';
    else if (days <= 30) suggestedTimeframe = '15m';
    else if (days <= 90) suggestedTimeframe = '1h';
    else if (days <= 180) suggestedTimeframe = '4h';
    else suggestedTimeframe = '1d';

    const newConfig = { 
      ...config, 
      fecha_inicio: startStr, 
      fecha_fin: endStr,
      timeframe: suggestedTimeframe 
    };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const resetToDefaults = () => {
    setConfig(defaultConfig);
    onConfigChange(defaultConfig);
  };

  // Calcular timeframe efectivo segun el delta de fechas
  const getEffectiveTimeframe = () => {
    if (!config.fecha_inicio || !config.fecha_fin) return config.timeframe;
    const delta = (new Date(config.fecha_fin).getTime() - new Date(config.fecha_inicio).getTime()) / 86400000;
    if (delta > 800) return '1d (auto: rango > 800 días)';
    if (delta > 200) return '4h (auto: rango > 200 días)';
    if (delta > 60)  return '1h (auto: rango > 60 días)';
    if (delta > 20)  return '15m (auto: rango > 20 días)';
    return config.timeframe + ' (manual)';
  };
  const deltaDias = config.fecha_inicio && config.fecha_fin
    ? Math.round((new Date(config.fecha_fin).getTime() - new Date(config.fecha_inicio).getTime()) / 86400000)
    : 0;
  const autoOverride = deltaDias > 20;

  const presets = {
    conservative: {
      ...defaultConfig,
      stop_loss_mult: 1.5,
      take_profit_mult: 3.0,
      risk_per_trade: 0.01,
      rsi_period: 21,
      adx_threshold: 30
    },
    aggressive: {
      ...defaultConfig,
      stop_loss_mult: 3.0,
      take_profit_mult: 6.0,
      risk_per_trade: 0.05,
      rsi_period: 7,
      adx_threshold: 20
    },
    scalping: {
      ...defaultConfig,
      timeframe: '1m',
      ema_fast: 5,
      ema_slow: 13,
      stop_loss_mult: 0.5,
      take_profit_mult: 1.5,
      risk_per_trade: 0.01
    }
  };

  const applyPreset = (preset: keyof typeof presets) => {
    const newConfig = presets[preset];
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuración de Backtesting
          </CardTitle>
          <div className="flex gap-2">
            <button
              onClick={resetToDefaults}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Presets */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
            🎯 Presets Rápidos
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => applyPreset('conservative')}
              disabled={isLoading}
              className="p-3 text-left bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-950/30 disabled:opacity-50"
            >
              <Shield className="w-4 h-4 text-blue-600 mb-1" />
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Conservador</p>
              <p className="text-xs text-blue-600 dark:text-blue-400">Bajo riesgo, SL ajustado</p>
            </button>
            <button
              onClick={() => applyPreset('aggressive')}
              disabled={isLoading}
              className="p-3 text-left bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/30 disabled:opacity-50"
            >
              <Zap className="w-4 h-4 text-red-600 mb-1" />
              <p className="text-sm font-medium text-red-700 dark:text-red-300">Agresivo</p>
              <p className="text-xs text-red-600 dark:text-red-400">Alto riesgo, TP amplio</p>
            </button>
            <button
              onClick={() => applyPreset('scalping')}
              disabled={isLoading}
              className="p-3 text-left bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-950/30 disabled:opacity-50"
            >
              <Clock className="w-4 h-4 text-green-600 mb-1" />
              <p className="text-sm font-medium text-green-700 dark:text-green-300">Scalping</p>
              <p className="text-xs text-green-600 dark:text-green-400">1m, EMAs rápidas</p>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          {[
            { id: 'basic', label: 'Básico', icon: Calendar },
            { id: 'strategy', label: 'Estrategia', icon: TrendingUp },
            { id: 'advanced', label: 'Avanzado', icon: BarChart3 }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Basic Configuration */}
        {activeTab === 'basic' && (
          <div className="space-y-6">

            {/* Quick Ranges */}
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/40">
              <label className="block text-sm font-semibold mb-3 text-blue-800 dark:text-blue-300">
                <Calendar className="w-4 h-4 inline mr-2" />
                Selección Rápida de Fechas
              </label>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setDateRange(7)} disabled={isLoading} className="px-4 py-2 text-sm font-medium rounded-lg bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 transition-colors shadow-sm disabled:opacity-50">Última Semana</button>
                <button onClick={() => setDateRange(30)} disabled={isLoading} className="px-4 py-2 text-sm font-medium rounded-lg bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 transition-colors shadow-sm disabled:opacity-50">Último Mes</button>
                <button onClick={() => setDateRange(90)} disabled={isLoading} className="px-4 py-2 text-sm font-medium rounded-lg bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 transition-colors shadow-sm disabled:opacity-50">Últimos 3 Meses</button>
                <button onClick={() => setDateRange(180)} disabled={isLoading} className="px-4 py-2 text-sm font-medium rounded-lg bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 transition-colors shadow-sm disabled:opacity-50">Últimos 6 Meses</button>
                <button onClick={() => setDateRange(365)} disabled={isLoading} className="px-4 py-2 text-sm font-medium rounded-lg bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 transition-colors shadow-sm disabled:opacity-50">Último Año</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Par de Trading
                </label>
                <select
                  value={config.symbol}
                  onChange={(e) => updateConfig('symbol', e.target.value)}
                  disabled={isLoading}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 disabled:opacity-50"
                >
                  <option value="BTC/USDT">BTC/USDT</option>
                  <option value="ETH/USDT">ETH/USDT</option>
                  <option value="ADA/USDT">ADA/USDT</option>
                  <option value="SOL/USDT">SOL/USDT</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Timeframe
                </label>
                <select
                  value={config.timeframe}
                  onChange={(e) => updateConfig('timeframe', e.target.value)}
                  disabled={isLoading || autoOverride}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 disabled:opacity-50"
                >
                  <option value="1m">1 Minuto</option>
                  <option value="5m">5 Minutos</option>
                  <option value="15m">15 Minutos</option>
                  <option value="1h">1 Hora</option>
                  <option value="4h">4 Horas</option>
                  <option value="1d">1 Día</option>
                </select>
                {autoOverride && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    ⚠️ Timeframe ajustado automáticamente a <strong>{getEffectiveTimeframe()}</strong> por el rango de fechas ({deltaDias} días).
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={config.fecha_inicio}
                  min="2019-01-01"
                  max={config.fecha_fin || '2026-12-31'}
                  onChange={(e) => updateConfig('fecha_inicio', e.target.value)}
                  disabled={isLoading}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={config.fecha_fin}
                  min={config.fecha_inicio || '2019-01-01'}
                  max="2026-12-31"
                  onChange={(e) => updateConfig('fecha_fin', e.target.value)}
                  disabled={isLoading}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 disabled:opacity-50"
                />
                {deltaDias > 0 && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    📅 Rango seleccionado: <strong>{deltaDias} días</strong>
                    {deltaDias > 800 ? ' → timeframe: 1D' : deltaDias > 200 ? ' → timeframe: 4H' : deltaDias > 60 ? ' → timeframe: 1H' : deltaDias > 20 ? ' → timeframe: 15M' : ''}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Capital Inicial: ${config.capital_inicial}
                </label>
                <input
                  type="range"
                  min="100"
                  max="100000"
                  step="100"
                  value={config.capital_inicial}
                  onChange={(e) => updateConfig('capital_inicial', Number(e.target.value))}
                  disabled={isLoading}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 disabled:opacity-50"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>$100</span>
                  <span>$100,000</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Strategy Configuration */}
        {activeTab === 'strategy' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  EMA Rápida: {config.ema_fast}
                </label>
                <input
                  type="range"
                  min="3"
                  max="50"
                  value={config.ema_fast}
                  onChange={(e) => updateConfig('ema_fast', Number(e.target.value))}
                  disabled={isLoading}
                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>3</span>
                  <span>50</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  EMA Lenta: {config.ema_slow}
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={config.ema_slow}
                  onChange={(e) => updateConfig('ema_slow', Number(e.target.value))}
                  disabled={isLoading}
                  className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>10</span>
                  <span>100</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <Target className="w-4 h-4 inline mr-1" />
                  Stop Loss: {config.stop_loss_mult}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.1"
                  value={config.stop_loss_mult}
                  onChange={(e) => updateConfig('stop_loss_mult', Number(e.target.value))}
                  disabled={isLoading}
                  className="w-full h-2 bg-red-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0.5x</span>
                  <span>5x</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <TrendingUp className="w-4 h-4 inline mr-1" />
                  Take Profit: {config.take_profit_mult}x
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.1"
                  value={config.take_profit_mult}
                  onChange={(e) => updateConfig('take_profit_mult', Number(e.target.value))}
                  disabled={isLoading}
                  className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1x</span>
                  <span>10x</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  RSI Período: {config.rsi_period}
                </label>
                <input
                  type="range"
                  min="7"
                  max="30"
                  value={config.rsi_period}
                  onChange={(e) => updateConfig('rsi_period', Number(e.target.value))}
                  disabled={isLoading}
                  className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>7</span>
                  <span>30</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <Shield className="w-4 h-4 inline mr-1" />
                  Riesgo por Trade: {(config.risk_per_trade * 100).toFixed(1)}%
                </label>
                <input
                  type="range"
                  min="0.005"
                  max="0.1"
                  step="0.005"
                  value={config.risk_per_trade}
                  onChange={(e) => updateConfig('risk_per_trade', Number(e.target.value))}
                  disabled={isLoading}
                  className="w-full h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0.5%</span>
                  <span>10%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Configuration */}
        {activeTab === 'advanced' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Volumen Mínimo: {config.min_volume}
                </label>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={config.min_volume}
                  onChange={(e) => updateConfig('min_volume', Number(e.target.value))}
                  disabled={isLoading}
                  className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1</span>
                  <span>50</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  ADX Threshold: {config.adx_threshold}
                </label>
                <input
                  type="range"
                  min="15"
                  max="40"
                  value={config.adx_threshold}
                  onChange={(e) => updateConfig('adx_threshold', Number(e.target.value))}
                  disabled={isLoading}
                  className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>15</span>
                  <span>40</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Bollinger Bands: {config.bollinger_period}
                </label>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={config.bollinger_period}
                  onChange={(e) => updateConfig('bollinger_period', Number(e.target.value))}
                  disabled={isLoading}
                  className="w-full h-2 bg-pink-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>10</span>
                  <span>50</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  ATR Período: {config.atr_period}
                </label>
                <input
                  type="range"
                  min="7"
                  max="30"
                  value={config.atr_period}
                  onChange={(e) => updateConfig('atr_period', Number(e.target.value))}
                  disabled={isLoading}
                  className="w-full h-2 bg-teal-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>7</span>
                  <span>30</span>
                </div>
              </div>
            </div>

            {/* Risk/Reward Visualization */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <h4 className="text-sm font-semibold mb-3">📊 Ratio Riesgo/Beneficio</h4>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">
                    1:{(config.take_profit_mult / config.stop_loss_mult).toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-600">Risk/Reward</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {((1 / (1 + config.stop_loss_mult / config.take_profit_mult)) * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-gray-600">Win Rate Necesario</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    ${(config.capital_inicial * config.risk_per_trade).toFixed(0)}
                  </p>
                  <p className="text-xs text-gray-600">Riesgo por Trade</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};