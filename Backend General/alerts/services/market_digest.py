"""Constructor de digests periódicos de mercado.

`build_digest(cadence)` consulta el feed para un set fijo de símbolos y arma una
notificación lista para `dispatcher.dispatch`. Es agnóstico de quién la dispara
— las tareas Celery la usan, pero también sirve para tests manuales.
"""

from __future__ import annotations

import logging
from typing import Literal

from .price_feed import PriceFeed

logger = logging.getLogger(__name__)

Cadence = Literal['hourly', 'daily', 'weekly']

DIGEST_SYMBOLS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT']

_WINDOW_BY_CADENCE: dict[Cadence, str] = {
    'hourly': '1h',
    'daily': '1d',
    'weekly': '1w',
}

_TITLE_BY_CADENCE: dict[Cadence, str] = {
    'hourly': 'Resumen del mercado · última hora',
    'daily': 'Resumen del mercado · 24h',
    'weekly': 'Resumen del mercado · 7 días',
}


def _format_price(price: float) -> str:
    if price >= 1000:
        return f'${price:,.0f}'
    if price >= 1:
        return f'${price:,.2f}'
    return f'${price:,.4f}'


def build_digest(cadence: Cadence, feed: PriceFeed | None = None) -> dict:
    """Devuelve un dict con `title`, `body`, `severity`, `payload` listo para dispatch."""

    feed = feed or PriceFeed()
    window = _WINDOW_BY_CADENCE[cadence]

    items: list[dict] = []
    summary_parts: list[str] = []
    for symbol in DIGEST_SYMBOLS:
        try:
            price = feed.get_price(symbol)
        except Exception:
            logger.exception('Digest %s: error obteniendo precio %s', cadence, symbol)
            price = None
        try:
            change = feed.get_change_pct(symbol, window)
        except Exception:
            logger.exception('Digest %s: error obteniendo cambio %s/%s', cadence, symbol, window)
            change = None

        items.append({'symbol': symbol, 'price': price, 'change_pct': change, 'window': window})

        if price is not None and change is not None:
            sign = '+' if change >= 0 else ''
            short = symbol.split('/')[0]
            summary_parts.append(f'{short} {_format_price(price)} ({sign}{change:.1f}%)')

    body = (
        ' · '.join(summary_parts)
        if summary_parts
        else 'No fue posible obtener los precios para este resumen.'
    )

    return {
        'title': _TITLE_BY_CADENCE[cadence],
        'body': body,
        'severity': 'info',
        'payload': {
            'cadence': cadence,
            'window': window,
            'items': items,
            'deep_link': 'alerts/subscriptions',
        },
    }
