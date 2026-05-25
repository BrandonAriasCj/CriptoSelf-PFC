import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react';

interface Asset {
  symbol: string;
  name: string;
  amount: number;
  value: number;
  change24h: number;
  allocation: number;
}

const Portfolio: React.FC = () => {
  const totalValue = 125430.50;
  const totalChange = 2.34;
  const totalChangeValue = 2890.45;

  const assets: Asset[] = [
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      amount: 2.5,
      value: 87500.00,
      change24h: 3.2,
      allocation: 69.8
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      amount: 15.8,
      value: 31600.00,
      change24h: -1.5,
      allocation: 25.2
    },
    {
      symbol: 'ADA',
      name: 'Cardano',
      amount: 12000,
      value: 4800.00,
      change24h: 5.7,
      allocation: 3.8
    },
    {
      symbol: 'DOT',
      name: 'Polkadot',
      amount: 250,
      value: 1530.50,
      change24h: -2.1,
      allocation: 1.2
    }
  ];

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            <div className={`flex items-center text-xs ${totalChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalChange >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {totalChange >= 0 ? '+' : ''}{totalChange}% (+${totalChangeValue.toLocaleString()})
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">24h Change</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {totalChange >= 0 ? '+' : ''}{totalChange}%
            </div>
            <p className="text-xs text-muted-foreground">
              ${totalChangeValue.toLocaleString()} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assets.length}</div>
            <p className="text-xs text-muted-foreground">
              Different cryptocurrencies
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Holdings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Holdings</CardTitle>
            <Button variant="outline" size="sm">
              Add Asset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assets.map((asset) => (
              <div key={asset.symbol} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-transparent rounded-full flex items-center justify-center">
                    <span className="font-semibold text-sm">{asset.symbol}</span>
                  </div>
                  <div>
                    <div className="font-medium">{asset.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {asset.amount.toLocaleString()} {asset.symbol}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-medium">${asset.value.toLocaleString()}</div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={asset.change24h >= 0 ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {asset.change24h >= 0 ? '+' : ''}{asset.change24h}%
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {asset.allocation}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Allocation Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
            <p className="text-muted-foreground">Portfolio allocation chart will be displayed here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Portfolio;