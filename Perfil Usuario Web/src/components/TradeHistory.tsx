import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { CalendarDays, Download, Filter, Search } from 'lucide-react';

interface Trade {
  id: string;
  date: string;
  time: string;
  pair: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  total: number;
  fee: number;
  pnl?: number;
  status: 'completed' | 'pending' | 'cancelled';
  source: 'manual' | 'algo';
}

const mockTrades: Trade[] = [
  {
    id: 'TRD001',
    date: '2024-01-15',
    time: '14:30:25',
    pair: 'BTC/USDT',
    type: 'buy',
    amount: 0.0234,
    price: 43250.50,
    total: 1012.06,
    fee: 1.01,
    pnl: 45.20,
    status: 'completed',
    source: 'manual'
  },
  {
    id: 'TRD002',
    date: '2024-01-15',
    time: '16:45:10',
    pair: 'ETH/USDT',
    type: 'sell',
    amount: 0.8521,
    price: 2645.32,
    total: 2253.84,
    fee: 2.25,
    pnl: -12.50,
    status: 'completed',
    source: 'algo'
  },
  {
    id: 'TRD003',
    date: '2024-01-14',
    time: '09:15:33',
    pair: 'ADA/USDT',
    type: 'buy',
    amount: 2250,
    price: 0.4521,
    total: 1017.23,
    fee: 1.02,
    pnl: 89.75,
    status: 'completed',
    source: 'algo'
  },
  {
    id: 'TRD004',
    date: '2024-01-14',
    time: '11:22:18',
    pair: 'SOL/USDT',
    type: 'sell',
    amount: 12.5,
    price: 98.45,
    total: 1230.63,
    fee: 1.23,
    pnl: 25.80,
    status: 'completed',
    source: 'manual'
  },
  {
    id: 'TRD005',
    date: '2024-01-13',
    time: '13:45:22',
    pair: 'BTC/USDT',
    type: 'buy',
    amount: 0.0156,
    price: 42800.00,
    total: 667.68,
    fee: 0.67,
    status: 'pending',
    source: 'manual'
  }
];

export function TradeHistory() {
  const [trades] = useState<Trade[]>(mockTrades);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPair, setFilterPair] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredTrades = trades.filter(trade => {
    const matchesSearch = trade.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trade.pair.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPair = filterPair === 'all' || trade.pair === filterPair;
    const matchesType = filterType === 'all' || trade.type === filterType;
    const matchesStatus = filterStatus === 'all' || trade.status === filterStatus;
    
    return matchesSearch && matchesPair && matchesType && matchesStatus;
  });

  const totalPnL = trades
    .filter(trade => trade.pnl !== undefined)
    .reduce((sum, trade) => sum + (trade.pnl || 0), 0);

  const totalTrades = trades.length;
  const completedTrades = trades.filter(trade => trade.status === 'completed').length;
  const totalVolume = trades.reduce((sum, trade) => sum + trade.total, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Trades</p>
                <p className="text-2xl font-bold">{totalTrades}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                <CalendarDays className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Trades Completados</p>
                <p className="text-2xl font-bold">{completedTrades}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                <div className="w-6 h-6 rounded-full bg-green-600"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">P&L Total</p>
                <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
                </p>
              </div>
              <div className={`p-3 rounded-full ${totalPnL >= 0 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20'}`}>
                <div className={`w-6 h-6 rounded-full ${totalPnL >= 0 ? 'bg-green-600' : 'bg-red-600'}`}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Volumen Total</p>
                <p className="text-2xl font-bold">${totalVolume.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
                <div className="w-6 h-6 rounded-full bg-purple-600"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Historial de Transacciones
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Exportar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID o par..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            
            <Select value={filterPair} onValueChange={setFilterPair}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los pares</SelectItem>
                <SelectItem value="BTC/USDT">BTC/USDT</SelectItem>
                <SelectItem value="ETH/USDT">ETH/USDT</SelectItem>
                <SelectItem value="ADA/USDT">ADA/USDT</SelectItem>
                <SelectItem value="SOL/USDT">SOL/USDT</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="buy">Compra</SelectItem>
                <SelectItem value="sell">Venta</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="completed">Completado</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Trades Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Fecha/Hora</TableHead>
                  <TableHead>Par</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Fee</TableHead>
                  <TableHead>P&L</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Origen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrades.map((trade) => (
                  <TableRow key={trade.id}>
                    <TableCell className="font-mono text-sm">{trade.id}</TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm">{trade.date}</div>
                        <div className="text-xs text-muted-foreground">{trade.time}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{trade.pair}</TableCell>
                    <TableCell>
                      <Badge variant={trade.type === 'buy' ? 'default' : 'destructive'} className="capitalize">
                        {trade.type === 'buy' ? 'Compra' : 'Venta'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">{trade.amount}</TableCell>
                    <TableCell className="font-mono">${trade.price.toLocaleString()}</TableCell>
                    <TableCell className="font-mono">${trade.total.toFixed(2)}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      ${trade.fee.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {trade.pnl !== undefined ? (
                        <span className={`font-mono ${trade.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        trade.status === 'completed' ? 'default' : 
                        trade.status === 'pending' ? 'secondary' : 'destructive'
                      }>
                        {trade.status === 'completed' ? 'Completado' : 
                         trade.status === 'pending' ? 'Pendiente' : 'Cancelado'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {trade.source === 'manual' ? 'Manual' : 'Algoritmo'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredTrades.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron transacciones que coincidan con los filtros
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}