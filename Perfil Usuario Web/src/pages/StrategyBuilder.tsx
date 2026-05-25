import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Plus, 
  Trash2, 
  Play, 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Zap,
  Target,
  AlertTriangle,
  Settings
} from 'lucide-react';

interface Condition {
  id: string;
  indicator: string;
  operator: string;
  value: number;
  period?: number;
}

interface Strategy {
  name: string;
  description: string;
  entryConditions: Condition[];
  exitConditions: Condition[];
  riskManagement: {
    stopLoss: number;
    takeProfit: number;
    maxPositionSize: number;
    riskPerTrade: number;
  };
  parameters: {
    capital: number;
    timeframe: string;
    pair: string;
  };
}

const indicators = [
  { id: 'rsi', name: 'RSI', category: 'momentum', description: 'Relative Strength Index' },
  { id: 'macd', name: 'MACD', category: 'momentum', description: 'Moving Average Convergence Divergence' },
  { id: 'bb', name: 'Bollinger Bands', category: 'volatility', description: 'Bandas de Bollinger' },
  { id: 'atr', name: 'ATR', category: 'volatility', description: 'Average True Range' },
  { id: 'vix', name: 'VIX', category: 'volatility', description: 'Volatility Index' },
  { id: 'sma', name: 'SMA', category: 'trend', description: 'Simple Moving Average' },
  { id: 'ema', name: 'EMA', category: 'trend', description: 'Exponential Moving Average' },
  { id: 'vol', name: 'Volume', category: 'volume', description: 'Trading Volume' },
  { id: 'price', name: 'Price', category: 'price', description: 'Asset Price' },
  { id: 'stoch', name: 'Stochastic', category: 'momentum', description: 'Stochastic Oscillator' },
];

const operators = [
  { id: '>', name: 'Mayor que (>)' },
  { id: '<', name: 'Menor que (<)' },
  { id: '>=', name: 'Mayor o igual (>=)' },
  { id: '<=', name: 'Menor o igual (<=)' },
  { id: '==', name: 'Igual (==)' },
  { id: 'cross_above', name: 'Cruza por encima' },
  { id: 'cross_below', name: 'Cruza por debajo' },
];

export function StrategyBuilder() {
  const [strategy, setStrategy] = useState<Strategy>({
    name: '',
    description: '',
    entryConditions: [],
    exitConditions: [],
    riskManagement: {
      stopLoss: 2,
      takeProfit: 4,
      maxPositionSize: 10,
      riskPerTrade: 1
    },
    parameters: {
      capital: 10000,
      timeframe: '1h',
      pair: 'BTC/USDT'
    }
  });

  const [activeTab, setActiveTab] = useState('entry');

  const addCondition = (type: 'entry' | 'exit') => {
    const newCondition: Condition = {
      id: Date.now().toString(),
      indicator: 'rsi',
      operator: '>',
      value: 70,
      period: 14
    };

    if (type === 'entry') {
      setStrategy(prev => ({
        ...prev,
        entryConditions: [...prev.entryConditions, newCondition]
      }));
    } else {
      setStrategy(prev => ({
        ...prev,
        exitConditions: [...prev.exitConditions, newCondition]
      }));
    }
  };

  const removeCondition = (id: string, type: 'entry' | 'exit') => {
    if (type === 'entry') {
      setStrategy(prev => ({
        ...prev,
        entryConditions: prev.entryConditions.filter(c => c.id !== id)
      }));
    } else {
      setStrategy(prev => ({
        ...prev,
        exitConditions: prev.exitConditions.filter(c => c.id !== id)
      }));
    }
  };

  const updateCondition = (id: string, field: string, value: any, type: 'entry' | 'exit') => {
    const updateArray = type === 'entry' ? 'entryConditions' : 'exitConditions';
    setStrategy(prev => ({
      ...prev,
      [updateArray]: prev[updateArray].map(c => 
        c.id === id ? { ...c, [field]: value } : c
      )
    }));
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'momentum': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'volatility': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'trend': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'volume': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'price': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const handleSaveStrategy = () => {
    if (!strategy.name) {
      alert('Por favor ingresa un nombre para la estrategia');
      return;
    }
    if (strategy.entryConditions.length === 0) {
      alert('Agrega al menos una condición de entrada');
      return;
    }
    alert('Estrategia guardada exitosamente');
  };

  const handleRunBacktest = () => {
    if (strategy.entryConditions.length === 0) {
      alert('Configura las condiciones de entrada primero');
      return;
    }
    alert('Iniciando backtesting de la estrategia...');
  };

  const ConditionBuilder = ({ 
    conditions, 
    type 
  }: { 
    conditions: Condition[], 
    type: 'entry' | 'exit' 
  }) => (
    <div className="space-y-4">
      {conditions.map((condition) => (
        <Card key={condition.id} className="border-dashed border-2 hover:border-solid transition-all duration-200">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
              <div>
                <Label className="text-xs">Indicador</Label>
                <Select 
                  value={condition.indicator} 
                  onValueChange={(value) => updateCondition(condition.id, 'indicator', value, type)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {indicators.map((indicator) => (
                      <SelectItem key={indicator.id} value={indicator.id}>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`text-xs ${getCategoryColor(indicator.category)}`}>
                            {indicator.category}
                          </Badge>
                          {indicator.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(['rsi', 'sma', 'ema', 'atr', 'stoch'].includes(condition.indicator)) && (
                <div>
                  <Label className="text-xs">Período</Label>
                  <Input
                    type="number"
                    value={condition.period || 14}
                    onChange={(e) => updateCondition(condition.id, 'period', parseInt(e.target.value), type)}
                    className="h-9"
                  />
                </div>
              )}

              <div>
                <Label className="text-xs">Operador</Label>
                <Select 
                  value={condition.operator} 
                  onValueChange={(value) => updateCondition(condition.id, 'operator', value, type)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {operators.map((operator) => (
                      <SelectItem key={operator.id} value={operator.id}>
                        {operator.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Valor</Label>
                <Input
                  type="number"
                  value={condition.value}
                  onChange={(e) => updateCondition(condition.id, 'value', parseFloat(e.target.value), type)}
                  className="h-9"
                  step="0.01"
                />
              </div>

              <div className="md:col-span-2 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeCondition(condition.id, type)}
                  className="h-9 flex-1"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Eliminar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button
        variant="outline"
        onClick={() => addCondition(type)}
        className="w-full h-12 border-2 border-dashed border-primary/30 hover:border-primary/50 bg-transparent"
      >
        <Plus className="w-4 h-4 mr-2" />
        Agregar Condición {type === 'entry' ? 'de Entrada' : 'de Salida'}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Strategy Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Nombre de la Estrategia</Label>
          <Input
            placeholder="Ej: Estrategia RSI + Bollinger Bands"
            value={strategy.name}
            onChange={(e) => setStrategy(prev => ({ ...prev, name: e.target.value }))}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Descripción</Label>
          <Input
            placeholder="Describe tu estrategia cuantitativa"
            value={strategy.description}
            onChange={(e) => setStrategy(prev => ({ ...prev, description: e.target.value }))}
            className="mt-1"
          />
        </div>
      </div>

      {/* Parameters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Parámetros de la Estrategia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Par de Trading</Label>
              <Select 
                value={strategy.parameters.pair} 
                onValueChange={(value) => setStrategy(prev => ({
                  ...prev,
                  parameters: { ...prev.parameters, pair: value }
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BTC/USDT">BTC/USDT</SelectItem>
                  <SelectItem value="ETH/USDT">ETH/USDT</SelectItem>
                  <SelectItem value="ADA/USDT">ADA/USDT</SelectItem>
                  <SelectItem value="SOL/USDT">SOL/USDT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Timeframe</Label>
              <Select 
                value={strategy.parameters.timeframe} 
                onValueChange={(value) => setStrategy(prev => ({
                  ...prev,
                  parameters: { ...prev.parameters, timeframe: value }
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">1 Minuto</SelectItem>
                  <SelectItem value="5m">5 Minutos</SelectItem>
                  <SelectItem value="15m">15 Minutos</SelectItem>
                  <SelectItem value="1h">1 Hora</SelectItem>
                  <SelectItem value="4h">4 Horas</SelectItem>
                  <SelectItem value="1d">1 Día</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Capital Inicial</Label>
              <Input
                type="number"
                value={strategy.parameters.capital}
                onChange={(e) => setStrategy(prev => ({
                  ...prev,
                  parameters: { ...prev.parameters, capital: parseFloat(e.target.value) }
                }))}
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full">
                <BarChart3 className="w-4 h-4 mr-2" />
                Vista Previa
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conditions */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="entry" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Entrada
          </TabsTrigger>
          <TabsTrigger value="exit" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Salida
          </TabsTrigger>
          <TabsTrigger value="risk" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Gestión de Riesgo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entry" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Condiciones de Entrada
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Define las condiciones que deben cumplirse para abrir una posición
              </p>
            </CardHeader>
            <CardContent>
              <ConditionBuilder conditions={strategy.entryConditions} type="entry" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exit" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-red-600" />
                Condiciones de Salida
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Define las condiciones que deben cumplirse para cerrar una posición
              </p>
            </CardHeader>
            <CardContent>
              <ConditionBuilder conditions={strategy.exitConditions} type="exit" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Gestión de Riesgo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Stop Loss (%)</Label>
                    <div className="mt-2">
                      <Slider
                        value={[strategy.riskManagement.stopLoss]}
                        onValueChange={([value]) => setStrategy(prev => ({
                          ...prev,
                          riskManagement: { ...prev.riskManagement, stopLoss: value }
                        }))}
                        max={10}
                        min={0.5}
                        step={0.1}
                        className="mb-2"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>0.5%</span>
                        <span className="font-medium text-foreground">{strategy.riskManagement.stopLoss}%</span>
                        <span>10%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Take Profit (%)</Label>
                    <div className="mt-2">
                      <Slider
                        value={[strategy.riskManagement.takeProfit]}
                        onValueChange={([value]) => setStrategy(prev => ({
                          ...prev,
                          riskManagement: { ...prev.riskManagement, takeProfit: value }
                        }))}
                        max={20}
                        min={1}
                        step={0.1}
                        className="mb-2"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>1%</span>
                        <span className="font-medium text-foreground">{strategy.riskManagement.takeProfit}%</span>
                        <span>20%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Tamaño Máximo de Posición (%)</Label>
                    <div className="mt-2">
                      <Slider
                        value={[strategy.riskManagement.maxPositionSize]}
                        onValueChange={([value]) => setStrategy(prev => ({
                          ...prev,
                          riskManagement: { ...prev.riskManagement, maxPositionSize: value }
                        }))}
                        max={50}
                        min={1}
                        step={1}
                        className="mb-2"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>1%</span>
                        <span className="font-medium text-foreground">{strategy.riskManagement.maxPositionSize}%</span>
                        <span>50%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Riesgo por Trade (%)</Label>
                    <div className="mt-2">
                      <Slider
                        value={[strategy.riskManagement.riskPerTrade]}
                        onValueChange={([value]) => setStrategy(prev => ({
                          ...prev,
                          riskManagement: { ...prev.riskManagement, riskPerTrade: value }
                        }))}
                        max={5}
                        min={0.1}
                        step={0.1}
                        className="mb-2"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>0.1%</span>
                        <span className="font-medium text-foreground">{strategy.riskManagement.riskPerTrade}%</span>
                        <span>5%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-800 dark:text-amber-200">Ratio Riesgo/Recompensa</h4>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                      Ratio actual: 1:{(strategy.riskManagement.takeProfit / strategy.riskManagement.stopLoss).toFixed(2)}
                      {strategy.riskManagement.takeProfit / strategy.riskManagement.stopLoss >= 2 
                        ? ' ✅ Excelente ratio' 
                        : ' ⚠️ Considera mejorar el ratio'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button onClick={handleSaveStrategy} className="flex-1">
          <Zap className="w-4 h-4 mr-2" />
          Guardar Estrategia
        </Button>
        <Button onClick={handleRunBacktest} variant="outline" className="flex-1">
          <Play className="w-4 h-4 mr-2" />
          Ejecutar Backtesting
        </Button>
        <Button variant="outline">
          <Activity className="w-4 h-4 mr-2" />
          Simular en Vivo
        </Button>
      </div>
    </div>
  );
}