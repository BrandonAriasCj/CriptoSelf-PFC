import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Clock,
  Target,
  BarChart3,
  Wallet,
  TrendingUpDown,
  Trophy,
  Activity,
  Percent,
  Loader2
} from 'lucide-react';
import operationsService from '../services/operations';
import { mapOperationToPosition, type MappedPosition } from '../types/operations';

interface PortfolioMetrics {
  totalBalance: number;
  totalPnL: number;
  totalPnLPercent: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  largestWin: number;
  largestLoss: number;
  openPositions: number;
  closedPositions: number;
  totalVolume: number;
}

interface RecentTrade {
  id: string;
  pair: string;
  type: 'long' | 'short';
  entryPrice: number;
  size: number;
  time: string;
  pnl: number;
  status: 'open' | 'closed';
}

const INITIAL_BALANCE = 1000;

export function PortfolioStats() {
  const [metrics, setMetrics] = useState<PortfolioMetrics>({
    totalBalance: INITIAL_BALANCE,
    totalPnL: 0,
    totalPnLPercent: 0,
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    winRate: 0,
    averageWin: 0,
    averageLoss: 0,
    profitFactor: 0,
    largestWin: 0,
    largestLoss: 0,
    openPositions: 0,
    closedPositions: 0,
    totalVolume: 0
  });

  const [recentTrades, setRecentTrades] = useState<RecentTrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPortfolioData();
  }, []);

  const loadPortfolioData = async () => {
    setIsLoading(true);
    try {
      // Cargar todas las operaciones
      const allOperations = await operationsService.getHistory();
      
      if (!Array.isArray(allOperations) || allOperations.length === 0) {
        setIsLoading(false);
        return;
      }

      // Mapear operaciones a posiciones
      const positions: MappedPosition[] = allOperations.map(mapOperationToPosition);

      // Calcular métricas
      const closedPositions = positions.filter(p => p.status === 'closed');
      const openPositions = positions.filter(p => p.status === 'open');

      const totalPnL = closedPositions.reduce((sum, p) => sum + p.pnl, 0);
      const winningTrades = closedPositions.filter(p => p.pnl > 0);
      const losingTrades = closedPositions.filter(p => p.pnl < 0);

      const totalWins = winningTrades.reduce((sum, p) => sum + p.pnl, 0);
      const totalLosses = Math.abs(losingTrades.reduce((sum, p) => sum + p.pnl, 0));

      const averageWin = winningTrades.length > 0 ? totalWins / winningTrades.length : 0;
      const averageLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;

      const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;

      const largestWin = winningTrades.length > 0 
        ? Math.max(...winningTrades.map(p => p.pnl)) 
        : 0;
      
      const largestLoss = losingTrades.length > 0 
        ? Math.min(...losingTrades.map(p => p.pnl)) 
        : 0;

      const totalVolume = positions.reduce((sum, p) => sum + (p.size * p.entryPrice), 0);

      const totalBalance = INITIAL_BALANCE + totalPnL;
      const totalPnLPercent = (totalPnL / INITIAL_BALANCE) * 100;

      setMetrics({
        totalBalance,
        totalPnL,
        totalPnLPercent,
        totalTrades: closedPositions.length,
        winningTrades: winningTrades.length,
        losingTrades: losingTrades.length,
        winRate: closedPositions.length > 0 ? (winningTrades.length / closedPositions.length) * 100 : 0,
        averageWin,
        averageLoss,
        profitFactor,
        largestWin,
        largestLoss,
        openPositions: openPositions.length,
        closedPositions: closedPositions.length,
        totalVolume
      });

      // Preparar trades recientes (últimos 5)
      const recent = positions
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 5)
        .map(p => ({
          id: p.id,
          pair: p.pair,
          type: p.type,
          entryPrice: p.entryPrice,
          size: p.size,
          time: p.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          pnl: p.status === 'closed' ? p.pnl : p.unrealizedPnL,
          status: p.status
        }));

      setRecentTrades(recent);
    } catch (error) {
      console.error('Error cargando datos del portafolio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
        <Card>
          <CardContent className="p-12 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Cargando estadísticas del portafolio...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = [
    {
      title: 'Balance Total',
      value: `$${metrics.totalBalance.toFixed(2)}`,
      change: `${metrics.totalPnLPercent >= 0 ? '+' : ''}${metrics.totalPnLPercent.toFixed(2)}%`,
      icon: Wallet,
      color: metrics.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'
    },
    {
      title: 'P&L Total',
      value: `${metrics.totalPnL >= 0 ? '+' : ''}$${metrics.totalPnL.toFixed(2)}`,
      change: `${metrics.totalTrades} operaciones`,
      icon: TrendingUpDown,
      color: metrics.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'
    },
    {
      title: 'Tasa de Éxito',
      value: `${metrics.winRate.toFixed(1)}%`,
      change: `${metrics.winningTrades}W / ${metrics.losingTrades}L`,
      icon: Target,
      color: metrics.winRate >= 50 ? 'text-green-400' : 'text-orange-400'
    },
    {
      title: 'Profit Factor',
      value: metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor.toFixed(2),
      change: metrics.profitFactor >= 2 ? 'Excelente' : metrics.profitFactor >= 1.5 ? 'Bueno' : 'Regular',
      icon: BarChart3,
      color: metrics.profitFactor >= 2 ? 'text-purple-400' : metrics.profitFactor >= 1.5 ? 'text-blue-400' : 'text-orange-400'
    }
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <Card className="bg-gradient-to-r from-emerald-900/20 to-blue-900/20 border-emerald-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Wallet className="w-6 h-6" />
                Portafolio
              </CardTitle>
              <p className="text-muted-foreground">Resumen de tu rendimiento y operaciones</p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={loadPortfolioData} variant="outline" size="sm">
                <Activity className="w-4 h-4 mr-2" />
                Actualizar
              </Button>
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

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Métricas de Rendimiento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Ganancia Promedio</span>
              <span className="font-medium text-green-600">+${metrics.averageWin.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Pérdida Promedio</span>
              <span className="font-medium text-red-600">-${metrics.averageLoss.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Mayor Ganancia</span>
              <span className="font-medium text-green-600">+${metrics.largestWin.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Mayor Pérdida</span>
              <span className="font-medium text-red-600">${metrics.largestLoss.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Volumen Total</span>
              <span className="font-medium">${metrics.totalVolume.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Estado de Posiciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Posiciones Abiertas</span>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-300">
                {metrics.openPositions}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Posiciones Cerradas</span>
              <Badge variant="outline">
                {metrics.closedPositions}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total de Operaciones</span>
              <span className="font-medium">{metrics.totalTrades}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Operaciones Ganadoras</span>
              <span className="font-medium text-green-600">{metrics.winningTrades}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Operaciones Perdedoras</span>
              <span className="font-medium text-red-600">{metrics.losingTrades}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Trades */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Operaciones Recientes</CardTitle>
            <Button variant="outline" size="sm" onClick={loadPortfolioData}>
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentTrades.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No hay operaciones registradas</p>
              <p className="text-sm">Comienza a operar para ver tu historial aquí</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentTrades.map((trade) => (
                <div
                  key={trade.id}
                  className="flex items-center justify-between p-4 bg-muted rounded-lg border"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      trade.type === 'long' ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}>
                      {trade.type === 'long' ? (
                        <TrendingUp className="w-5 h-5 text-green-400" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{trade.pair}</span>
                        <Badge className={trade.type === 'long' ? 'bg-green-600' : 'bg-red-600'}>
                          {trade.type.toUpperCase()}
                        </Badge>
                        {trade.status === 'open' && (
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-300">
                            ABIERTA
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {trade.size} @ ${trade.entryPrice.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                      {trade.status === 'open' && <span className="text-xs ml-1">(no realizado)</span>}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {trade.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <Card className={`border-2 ${metrics.totalPnL >= 0 ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Resumen de Rendimiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Balance Inicial</p>
              <p className="text-2xl font-bold">${INITIAL_BALANCE.toLocaleString()}.00</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Balance Actual</p>
              <p className={`text-2xl font-bold ${metrics.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${metrics.totalBalance.toFixed(2)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Rendimiento</p>
              <p className={`text-2xl font-bold ${metrics.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {metrics.totalPnLPercent >= 0 ? '+' : ''}{metrics.totalPnLPercent.toFixed(2)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
