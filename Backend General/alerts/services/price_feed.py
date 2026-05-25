"""Cliente de precios para el evaluador de alertas.

Usa ccxt con fallback Binance → Kraken → KuCoin (mismo patrón que `backtesting/demo.py`),
y cachea respuestas en memoria del proceso para no martillar a los exchanges.

V1 expone:
- `get_price(symbol)`: precio actual (ticker).
- `get_change_pct(symbol, window)`: cambio % entre apertura y cierre de la última vela del timeframe.
"""

from __future__ import annotations

import logging
import time
from typing import Optional

import ccxt

logger = logging.getLogger(__name__)

EXCHANGE_FALLBACK = ['binance', 'kraken', 'kucoin']

# TTL del caché en segundos. Si el evaluador corre cada 30s y el ticker se cachea 25s,
# cada exchange recibe ~1 request por símbolo por minuto.
TICKER_TTL = 25
OHLCV_TTL = 55

_TIMEFRAME_MAP = {
    '5m': '5m',
    '15m': '15m',
    '1h': '1h',
    '4h': '4h',
    '1d': '1d',
    '1w': '1w',
}


def _normalize_symbol(symbol: str) -> str:
    # ccxt requiere BASE/QUOTE; aceptamos `BTC` como atajo de `BTC/USDT`.
    s = (symbol or '').strip().upper()
    return s if '/' in s else f'{s}/USDT'


class PriceFeed:
    def __init__(self):
        # symbol -> (price, expires_at)
        self._ticker_cache: dict[str, tuple[float, float]] = {}
        # (symbol, tf) -> (last_candle, expires_at)
        self._ohlcv_cache: dict[tuple[str, str], tuple[list, float]] = {}

    def get_price(self, symbol: str) -> Optional[float]:
        symbol = _normalize_symbol(symbol)
        now = time.time()
        cached = self._ticker_cache.get(symbol)
        if cached and cached[1] > now:
            return cached[0]

        for ex_name in EXCHANGE_FALLBACK:
            try:
                exchange = getattr(ccxt, ex_name)({'enableRateLimit': True})
                ticker = exchange.fetch_ticker(symbol)
                price = ticker.get('last') or ticker.get('close')
                if price is None:
                    continue
                price = float(price)
                self._ticker_cache[symbol] = (price, now + TICKER_TTL)
                return price
            except Exception as exc:
                logger.debug('get_price %s @ %s falló: %s', symbol, ex_name, exc)
                continue
        logger.warning('No se pudo obtener precio para %s en ningún exchange', symbol)
        return None

    def get_change_pct(self, symbol: str, window: str) -> Optional[float]:
        symbol = _normalize_symbol(symbol)
        tf = _TIMEFRAME_MAP.get(window)
        if tf is None:
            return None

        now = time.time()
        key = (symbol, tf)
        cached = self._ohlcv_cache.get(key)
        candle: list | None = cached[0] if cached and cached[1] > now else None

        if candle is None:
            for ex_name in EXCHANGE_FALLBACK:
                try:
                    exchange = getattr(ccxt, ex_name)({'enableRateLimit': True})
                    ohlcv = exchange.fetch_ohlcv(symbol, tf, limit=2)
                    if not ohlcv:
                        continue
                    candle = ohlcv[-1]  # [ts, open, high, low, close, volume]
                    self._ohlcv_cache[key] = (candle, now + OHLCV_TTL)
                    break
                except Exception as exc:
                    logger.debug('get_change_pct %s/%s @ %s falló: %s', symbol, tf, ex_name, exc)
                    continue
            if candle is None:
                logger.warning('No se pudo obtener OHLCV para %s/%s', symbol, tf)
                return None

        open_, close = float(candle[1]), float(candle[4])
        if open_ == 0:
            return None
        return (close - open_) / open_ * 100.0
