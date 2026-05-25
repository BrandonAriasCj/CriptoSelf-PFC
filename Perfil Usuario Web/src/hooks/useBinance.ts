import { useState, useEffect, useRef } from 'react';

export interface BinanceTicker {
    symbol: string;
    price: number;
    priceChange: number;
    priceChangePercent: number;
    weightedAvgPrice: number;
    prevClosePrice: number;
    lastPrice: number;
    lastQty: number;
    bidPrice: number;
    bidQty: number;
    askPrice: number;
    askQty: number;
    openPrice: number;
    highPrice: number;
    lowPrice: number;
    volume: number;
    quoteVolume: number;
    openTime: number;
    closeTime: number;
    firstId: number;
    lastId: number;
    count: number;
}

const parseTickerData = (data: any): BinanceTicker => ({
    symbol: data.s,
    price: parseFloat(data.c),
    lastPrice: parseFloat(data.c),
    priceChange: parseFloat(data.p),
    priceChangePercent: parseFloat(data.P),
    weightedAvgPrice: parseFloat(data.w),
    prevClosePrice: parseFloat(data.x),
    lastQty: parseFloat(data.Q),
    bidPrice: parseFloat(data.b),
    bidQty: parseFloat(data.B),
    askPrice: parseFloat(data.a),
    askQty: parseFloat(data.A),
    openPrice: parseFloat(data.o),
    highPrice: parseFloat(data.h),
    lowPrice: parseFloat(data.l),
    volume: parseFloat(data.v),
    quoteVolume: parseFloat(data.q),
    openTime: data.O,
    closeTime: data.C,
    firstId: data.F,
    lastId: data.L,
    count: data.n
});

export const useBinanceTicker = (symbol: string) => {
    const [ticker, setTicker] = useState<BinanceTicker | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);

    const normalizedSymbol = symbol.replace('/', '').toLowerCase();

    useEffect(() => {
        if (wsRef.current) {
            wsRef.current.close();
        }

        const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${normalizedSymbol}@ticker`);
        wsRef.current = ws;

        ws.onopen = () => {
            // console.log(`Connected to Binance ticker for ${symbol}`);
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setTicker(parseTickerData(data));
            } catch (error) {
                console.error('Error parsing Binance ticker data:', error);
            }
        };

        ws.onclose = () => setIsConnected(false);
        ws.onerror = (error) => {
            console.error('Binance WebSocket error:', error);
            setIsConnected(false);
        };

        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, [normalizedSymbol]);

    return { ticker, isConnected };
};

export const useBinanceTickers = (symbols: string[]) => {
    const [tickers, setTickers] = useState<Record<string, BinanceTicker>>({});
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);

    // Create stream string: btcusdt@ticker/ethusdt@ticker
    const streams = symbols.map(s => `${s.replace('/', '').toLowerCase()}@ticker`).join('/');

    useEffect(() => {
        if (wsRef.current) wsRef.current.close();
        if (symbols.length === 0) return;

        const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
        wsRef.current = ws;

        ws.onopen = () => setIsConnected(true);

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                // Combined stream format: { "stream": "<streamName>", "data": { ...tickerData } }
                if (message.data) {
                    const ticker = parseTickerData(message.data);
                    // Store by original symbol format if possible, or we map back?
                    // The data.s is "BTCUSDT". We want "BTC/USDT".
                    // Let's iterate symbols to find match
                    const originalSymbol = symbols.find(s => s.replace('/', '') === ticker.symbol) || ticker.symbol;

                    setTickers(prev => ({
                        ...prev,
                        [originalSymbol]: ticker
                    }));
                }
            } catch (error) {
                console.error('Error parsing Binance multi-ticker data:', error);
            }
        };

        ws.onclose = () => setIsConnected(false);
        ws.onerror = (error) => {
            console.error('Binance Multi-WebSocket error:', error);
            setIsConnected(false);
        };

        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, [streams]);

    return { tickers, isConnected };
};
