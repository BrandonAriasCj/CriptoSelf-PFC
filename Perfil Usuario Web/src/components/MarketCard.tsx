import React from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { type BinanceTicker } from '../hooks/useBinance';

interface MarketCardProps {
  pair: string;
  ticker?: BinanceTicker;
  isSelected: boolean;
  onSelect: () => void;
}

export default function MarketCard({ pair, ticker, isSelected, onSelect }: MarketCardProps) {
  const priceText = ticker?.price.toFixed(2) ?? '--';
  const changePercent = ticker?.priceChangePercent ?? 0;

  return (
    <Card
      onClick={onSelect}
      className={`cursor-pointer border transition-colors ${
        isSelected ? 'border-primary bg-primary/10' : 'border-transparent'
      } hover:bg-muted/20`}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-semibold">{pair}</h3>
            <p className="font-mono text-lg">${priceText}</p>
          </div>
          <Badge variant={changePercent >= 0 ? 'default' : 'destructive'} className="text-xs">
            {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
