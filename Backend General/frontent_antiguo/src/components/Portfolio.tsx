import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, DollarSign, Percent } from 'lucide-react';

const portfolioData = [
  { symbol: 'BTC', name: 'Bitcoin', amount: 0.5823, value: 25180.50, change: 2.45, allocation: 45.2 },
  { symbol: 'ETH', name: 'Ethereum', amount: 8.2341, value: 21785.30, change: -1.23, allocation: 39.1 },
  { symbol: 'ADA', name: 'Cardano', amount: 15420, value: 6970.50, change: 5.67, allocation: 12.5 },
  { symbol: 'SOL', name: 'Solana', amount: 18.5, value: 1820.25, change: 3.21, allocation: 3.2 }
];

const pieData = portfolioData.map(item => ({
  name: item.symbol,
  value: item.allocation,
  amount: item.value
}));

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

const performanceData = [
  { month: 'Ene', value: 45000 },
  { month: 'Feb', value: 48200 },
  { month: 'Mar', value: 46800 },
  { month: 'Abr', value: 52100 },
  { month: 'May', value: 49300 },
  { month: 'Jun', value: 55756 }
];

export function Portfolio() {
  const totalValue = portfolioData.reduce((sum, item) => sum + item.value, 0);
  const totalChange = portfolioData.reduce((sum, item) => sum + (item.value * item.change / 100), 0);
  const totalChangePercent = (totalChange / totalValue) * 100;

  return (
    <div className="p-6 space-y-6">
      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Valor Total</p>
                <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <Wallet className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">P&L Diario</p>
                <p className={`text-2xl font-bold ${totalChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${Math.abs(totalChange).toLocaleString()}
                </p>
              </div>
              <div className={`p-3 rounded-full ${totalChange >= 0 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                {totalChange >= 0 ? 
                  <TrendingUp className="w-6 h-6 text-green-600" /> : 
                  <TrendingDown className="w-6 h-6 text-red-600" />
                }
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">% Cambio</p>
                <p className={`text-2xl font-bold ${totalChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalChangePercent >= 0 ? '+' : ''}{totalChangePercent.toFixed(2)}%
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <Percent className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Balance USDT</p>
                <p className="text-2xl font-bold">$5,491.68</p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Holdings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Posiciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {portfolioData.map((asset) => (
                <div key={asset.symbol} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="font-bold text-primary text-sm">{asset.symbol}</span>
                    </div>
                    <div>
                      <p className="font-medium">{asset.name}</p>
                      <p className="text-sm text-muted-foreground">{asset.amount} {asset.symbol}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-semibold">${asset.value.toLocaleString()}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant={asset.change >= 0 ? "default" : "destructive"} className="text-xs">
                        {asset.change >= 0 ? '+' : ''}{asset.change}%
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {asset.allocation}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Allocation Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución del Portafolio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [`${value}%`, `${name} Allocation`]}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Rendimiento del Portafolio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--foreground))" />
                <YAxis 
                  stroke="hsl(var(--foreground))"
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip 
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Valor del Portafolio']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    color: 'hsl(var(--foreground))'
                  }}
                />
                <Bar dataKey="value" fill="hsl(var(--chart-1))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}