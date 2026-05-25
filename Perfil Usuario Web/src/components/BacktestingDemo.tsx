import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Play, BarChart3, TrendingUp, DollarSign, Activity, LineChart, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { BacktestingChart } from './BacktestingChart';
import { SimpleBacktestingChart } from './SimpleBacktestingChart';
import { BacktestingConfig, type BacktestingConfig as ConfigType } from './BacktestingConfig';



export function BacktestingDemo() {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [chartView, setChartView] = useState<'detailed' | 'simple'>('detailed');
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState<ConfigType | null>(null);

  const runDemo = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("Pasa por backesting demo, uno diferente");
      let prefix = process.env.PREFIX_ENDPOINTS_BACKEND
      let url = `${process.env.PREFIX_ENDPOINTS_BACKEND}/api/backtesting/run-demo/`;
      const token = localStorage.getItem('access_token');
      const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      let options: RequestInit = { method: 'GET', headers: authHeader };

      // Si hay configuración personalizada, usar el endpoint personalizado
      if (config) {
        url = `${prefix}/api/backtesting/run-custom/`;
        options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeader,
          },
          body: JSON.stringify(config)
        };
      }

      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const result = await response.json();
      console.log('Datos recibidos del backend:', result);
      console.log('Configuración usada:', config || 'Demo por defecto');
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigChange = (newConfig: ConfigType) => {
    setConfig(newConfig);
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Simulación de Backtesting</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Estrategia de Scalping con Patrón de Velas - BTC/USDT
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfig(!showConfig)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <Settings className="w-4 h-4" />
                Configurar
                {showConfig ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <button
                onClick={runDemo}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-4 h-4" />
                {isLoading ? 'Ejecutando...' : config ? 'Ejecutar Personalizado' : 'Ejecutar Demo'}
              </button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Configuration Panel */}
      {showConfig && (
        <BacktestingConfig 
          onConfigChange={handleConfigChange}
          isLoading={isLoading}
        />
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
          <CardContent className="p-4">
            <p className="text-red-600 dark:text-red-400">Error: {error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Ejecutando simulación...</p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {data && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Datos Procesados</p>
                  <p className="font-bold text-blue-900 dark:text-blue-100">
                    {data.fechas.length} velas
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-green-700 dark:text-green-300">Precio Final</p>
                  <p className="font-bold text-green-900 dark:text-green-100">
                    ${data.precio[data.precio.length - 1]?.toFixed(2) || '0'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-purple-700 dark:text-purple-300">Volumen Promedio</p>
                  <p className="font-bold text-purple-900 dark:text-purple-100">
                    {(data.volma.reduce((a, b) => a + b, 0) / data.volma.length).toFixed(0)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Debug Info */}
          <Card className="bg-gray-50 dark:bg-gray-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                🔍 Información de Debug
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs space-y-1 font-mono">
                <p>Fechas recibidas: {data.fechas?.length || 0}</p>
                <p>Precios recibidos: {data.precio?.length || 0}</p>
                <p>Primer precio: {data.precio?.[0] || 'N/A'}</p>
                <p>Último precio: {data.precio?.[data.precio?.length - 1] || 'N/A'}</p>
                <p>Tipo de datos precio: {typeof data.precio?.[0]}</p>
                <p>Volumen recibido: {data.volma?.length || 0}</p>
                <p>Patrones recibidos: {data.patronVela?.length || 0}</p>
              </div>
            </CardContent>
          </Card>

          {/* Data Display */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Datos de la Simulación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Price Data */}
                <div>
                  <h4 className="font-semibold mb-3 text-blue-600">Precios BTC/USDT</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {data.fechas.slice(0, 10).map((fecha: string, index: number) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <span className="text-sm text-muted-foreground">
                          {new Date(fecha).toLocaleDateString('es-ES', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <span className="font-mono font-semibold">
                          ${data.precio[index]?.toFixed(2) || 'N/A'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Mostrando primeros 10 de {data.fechas.length} registros
                  </p>
                </div>

                {/* Volume Data */}
                <div>
                  <h4 className="font-semibold mb-3 text-green-600">Volumen de Trading</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {data.volma.slice(0, 10).map((vol: number | null, index: number) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                        <span className="text-sm text-muted-foreground">
                          Vela {index + 1}
                        </span>
                        <span className="font-mono font-semibold">
                          {vol !== null && vol !== undefined ? vol.toFixed(0) : 'N/A'}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Promedio: {data.volma.filter((v: number | null) => v !== null && v !== undefined).length > 0
                      ? (data.volma.filter((v: number | null) => v !== null && v !== undefined)
                        .reduce((a: number, b: number) => a + b, 0) /
                        data.volma.filter((v: number | null) => v !== null && v !== undefined).length).toFixed(0)
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gráfico de Backtesting */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Gráfico de Simulación
                </CardTitle>
                <div className="flex gap-2">
                  <button
                    onClick={() => setChartView('detailed')}
                    className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-colors ${chartView === 'detailed'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    Completo
                  </button>
                  <button
                    onClick={() => setChartView('simple')}
                    className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-colors ${chartView === 'simple'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                  >
                    <LineChart className="w-4 h-4" />
                    Simple
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {chartView === 'detailed' ? (
                <BacktestingChart data={data} />
              ) : (
                <SimpleBacktestingChart data={data} />
              )}
            </CardContent>
          </Card>

          {/* Results Summary and Pattern Analysis */}
          <div className="flex flex-row gap-6">{/* Flexbox para forzar lado a lado */}
            {/* Pattern Analysis */}
            <Card className="flex-1 h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Análisis de Patrones de Velas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {data.patronVela.filter((p: any) => p > 0).length}
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Patrones Detectados
                    </p>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {((data.patronVela.filter((p: any) => p > 0).length / data.patronVela.length) * 100).toFixed(1)}%
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Tasa de Detección
                    </p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">
                      {data.fechas.length}
                    </p>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      Total de Velas
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trading Results Summary */}
            <Card className="flex-1 h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Resumen de Resultados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Capital */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
                        ${data.resumen?.capital_inicial?.toFixed(2) || '0.00'}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Capital Inicial
                      </p>
                    </div>
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
                        ${data.resumen?.capital_final?.toFixed(2) || '0.00'}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Capital Final
                      </p>
                    </div>
                  </div>

                  {/* Performance */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`text-center p-3 rounded-lg ${
                      (data.resumen?.ganancia_perdida || 0) >= 0 
                        ? 'bg-green-50 dark:bg-green-950/20' 
                        : 'bg-red-50 dark:bg-red-950/20'
                    }`}>
                      <p className={`text-lg font-bold ${
                        (data.resumen?.ganancia_perdida || 0) >= 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {(data.resumen?.ganancia_perdida || 0) >= 0 ? '+' : ''}
                        ${data.resumen?.ganancia_perdida?.toFixed(2) || '0.00'}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Ganancia/Pérdida
                      </p>
                    </div>
                    <div className={`text-center p-3 rounded-lg ${
                      (data.resumen?.rentabilidad_porcentaje || 0) >= 0 
                        ? 'bg-green-50 dark:bg-green-950/20' 
                        : 'bg-red-50 dark:bg-red-950/20'
                    }`}>
                      <p className={`text-lg font-bold ${
                        (data.resumen?.rentabilidad_porcentaje || 0) >= 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {(data.resumen?.rentabilidad_porcentaje || 0) >= 0 ? '+' : ''}
                        {data.resumen?.rentabilidad_porcentaje?.toFixed(2) || '0.00'}%
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Rentabilidad
                      </p>
                    </div>
                  </div>

                  {/* Operations */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <p className="text-lg font-bold text-blue-600">
                        {data.resumen?.operaciones_totales || 0}
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        Total
                      </p>
                    </div>
                    <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <p className="text-lg font-bold text-green-600">
                        {data.resumen?.operaciones_ganadas || 0}
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300">
                        Ganadas
                      </p>
                    </div>
                    <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                      <p className="text-lg font-bold text-red-600">
                        {data.resumen?.operaciones_perdidas || 0}
                      </p>
                      <p className="text-xs text-red-700 dark:text-red-300">
                        Perdidas
                      </p>
                    </div>
                  </div>

                  {/* Success Rate */}
                  <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">
                      {data.resumen?.tasa_acierto?.toFixed(1) || '0.0'}%
                    </p>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      Tasa de Acierto
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}