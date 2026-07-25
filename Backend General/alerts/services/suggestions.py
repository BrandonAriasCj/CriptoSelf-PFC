"""Sugerencias de mercado a partir de indicadores de Binance (vía PriceFeed).

V1 detecta **cruce de medias móviles** (SMA rápida vs lenta) sobre velas
cerradas:
- golden cross: la media rápida cruza por ENCIMA de la lenta → sesgo alcista.
- death cross:  la media rápida cruza por DEBAJO de la lenta → sesgo bajista.

`analyze_crossover` siempre devuelve un dict con el estado actual (incluso sin
cruce: informa el sesgo vigente), y marca `crossed=True` solo cuando el cruce
ocurrió en la última vela cerrada — eso lo usa el escaneo periódico para no
re-alertar mientras la señal persiste.
"""

from __future__ import annotations

import logging
from typing import Optional

from .price_feed import PriceFeed
from . import templates

logger = logging.getLogger(__name__)

# Símbolos que escanea la tarea periódica de sugerencias.
SYMBOLS_TO_SCAN = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT']

# Parámetros por defecto del cruce de medias.
DEFAULT_TIMEFRAME = '1h'
DEFAULT_FAST = 9
DEFAULT_SLOW = 21


def _sma(values: list[float]) -> float:
    return sum(values) / len(values)


def analyze_crossover(
    symbol: str,
    feed: PriceFeed,
    timeframe: str = DEFAULT_TIMEFRAME,
    fast: int = DEFAULT_FAST,
    slow: int = DEFAULT_SLOW,
) -> Optional[dict]:
    """Analiza el cruce de medias para `symbol`. None si no hay datos suficientes."""

    if fast >= slow:
        fast, slow = DEFAULT_FAST, DEFAULT_SLOW

    series = feed.get_ohlcv_series(symbol, timeframe, limit=slow + 6)
    if not series or len(series) < slow + 2:
        return None

    # Descartamos la última vela (en formación) para trabajar con cerradas.
    closed = series[:-1]
    closes = [float(c[4]) for c in closed]
    if len(closes) < slow + 1:
        return None

    cur_fast = _sma(closes[-fast:])
    cur_slow = _sma(closes[-slow:])
    prev_fast = _sma(closes[-fast - 1:-1])
    prev_slow = _sma(closes[-slow - 1:-1])

    crossed_up = prev_fast <= prev_slow and cur_fast > cur_slow
    crossed_down = prev_fast >= prev_slow and cur_fast < cur_slow

    if crossed_up:
        signal = 'golden'
    elif crossed_down:
        signal = 'death'
    elif cur_fast > cur_slow:
        signal = 'bullish'
    else:
        signal = 'bearish'

    return {
        'symbol': symbol,
        'timeframe': timeframe,
        'fast': fast,
        'slow': slow,
        'fast_ma': round(cur_fast, 2),
        'slow_ma': round(cur_slow, 2),
        'price': round(closes[-1], 2),
        'signal': signal,
        'crossed': crossed_up or crossed_down,
        'candle_ts': int(closed[-1][0]),
    }


def build_suggestion_message(analysis: dict) -> dict:
    """Convierte el análisis en `{title, body, severity, payload}` para dispatch."""

    title, body = templates.suggestion_message(analysis)
    # Un cruce fresco es más accionable → warning; el sesgo vigente → info.
    severity = 'warning' if analysis.get('crossed') else 'info'
    return {
        'title': title,
        'body': body,
        'severity': severity,
        'payload': {
            'kind': 'suggestion',
            'symbol': analysis['symbol'],
            'timeframe': analysis['timeframe'],
            'signal': analysis['signal'],
            'crossed': analysis['crossed'],
            'fast_ma': analysis['fast_ma'],
            'slow_ma': analysis['slow_ma'],
            'price': analysis['price'],
            'indicator': f"SMA {analysis['fast']}/{analysis['slow']}",
            'deep_link': 'alerts/notifications',
        },
    }
