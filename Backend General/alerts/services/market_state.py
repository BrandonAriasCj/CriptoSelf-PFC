"""Vista de mercado compartida durante una pasada del evaluador.

Encapsula la fuente de precios y memoiza dentro de la pasada para que el costo
sea O(símbolos distintos) y no O(reglas).
"""

from __future__ import annotations

import logging
from typing import Optional

from .price_feed import PriceFeed

logger = logging.getLogger(__name__)


class MarketState:
    def __init__(self, feed: PriceFeed | None = None):
        self.feed = feed or PriceFeed()
        self._prices: dict[str, Optional[float]] = {}
        self._changes: dict[tuple[str, str], Optional[float]] = {}

    def get_price(self, symbol: str) -> Optional[float]:
        if symbol not in self._prices:
            self._prices[symbol] = self.feed.get_price(symbol)
        return self._prices[symbol]

    def get_change_pct(self, symbol: str, window: str) -> Optional[float]:
        key = (symbol, window)
        if key not in self._changes:
            self._changes[key] = self.feed.get_change_pct(symbol, window)
        return self._changes[key]
