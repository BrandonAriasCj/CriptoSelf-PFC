"""Eventos integrados de fábrica.

V1: tres tipos:
- PRICE_THRESHOLD — cruce de precio absoluto
- PRICE_CHANGE_PCT — cambio porcentual en una ventana
- SYSTEM_BROADCAST — mensaje del sistema (no se evalúa; se dispara a mano)
"""

from __future__ import annotations

from .base import EventType
from .registry import register


@register
class PriceThresholdEvent(EventType):
    code = 'PRICE_THRESHOLD'
    label = 'Precio cruza umbral'
    description = (
        'Notifica cuando el precio del símbolo cruza un valor de referencia '
        'en la dirección indicada.'
    )
    severity_default = 'info'
    params_schema = [
        {
            'name': 'symbol',
            'type': 'string',
            'label': 'Símbolo (ej. BTC/USDT)',
            'required': True,
        },
        {
            'name': 'operator',
            'type': 'enum',
            'label': 'Condición',
            'options': ['>=', '<='],
            'required': True,
        },
        {
            'name': 'value',
            'type': 'number',
            'label': 'Valor de referencia',
            'required': True,
            'min': 0,
        },
    ]

    @classmethod
    def evaluate(cls, params, market_state):
        symbol = params['symbol']
        operator = params['operator']
        value = float(params['value'])
        price = market_state.get_price(symbol)
        if price is None:
            return None
        if operator == '>=' and price < value:
            return None
        if operator == '<=' and price > value:
            return None
        return {
            'title': f'{symbol} {operator} {value:g}',
            'body': f'Precio actual: {price:g}',
            'severity': cls.severity_default,
            'payload': {
                'symbol': symbol,
                'price': price,
                'threshold': value,
                'operator': operator,
                'deep_link': f'alerts/rule',
            },
        }


@register
class PriceChangePctEvent(EventType):
    code = 'PRICE_CHANGE_PCT'
    label = 'Cambio porcentual de precio'
    description = (
        'Notifica cuando el precio cambia más de N% en una ventana de tiempo. '
        'Usá un porcentaje negativo para caídas.'
    )
    severity_default = 'warning'
    params_schema = [
        {'name': 'symbol', 'type': 'string', 'label': 'Símbolo', 'required': True},
        {
            'name': 'window',
            'type': 'enum',
            'label': 'Ventana',
            'options': ['5m', '15m', '1h', '4h', '1d'],
            'required': True,
        },
        {
            'name': 'change_pct',
            'type': 'number',
            'label': 'Cambio % (positivo o negativo)',
            'required': True,
            'min': -100,
            'max': 1000,
        },
    ]

    @classmethod
    def evaluate(cls, params, market_state):
        symbol = params['symbol']
        window = params['window']
        threshold = float(params['change_pct'])
        change = market_state.get_change_pct(symbol, window)
        if change is None:
            return None
        # threshold positivo = subida; negativo = caída.
        if threshold >= 0 and change < threshold:
            return None
        if threshold < 0 and change > threshold:
            return None
        direction = 'subió' if change >= 0 else 'cayó'
        return {
            'title': f'{symbol} {direction} {abs(change):.2f}% en {window}',
            'body': '',
            'severity': cls.severity_default,
            'payload': {
                'symbol': symbol,
                'window': window,
                'change_pct': change,
                'threshold_pct': threshold,
                'deep_link': f'alerts/rule',
            },
        }


@register
class SystemBroadcastEvent(EventType):
    code = 'SYSTEM_BROADCAST'
    label = 'Mensaje del sistema'
    description = (
        'Notificación creada manualmente por el sistema o un admin. '
        'No se evalúa contra el mercado.'
    )
    severity_default = 'info'
    user_configurable = False
    evaluator_handles = False
    params_schema = []

    @classmethod
    def evaluate(cls, params, market_state):
        return None


# Suscripciones a digests de mercado. No requieren parámetros — el usuario sólo
# activa/desactiva via /api/alerts/subscriptions/. Las dispara una tarea Celery
# anclada a horarios fijos (top of hour, 09:00 UTC, lunes 09:00 UTC).
class _MarketDigestEvent(EventType):
    user_configurable = False
    evaluator_handles = False
    severity_default = 'info'
    params_schema = []

    @classmethod
    def evaluate(cls, params, market_state):
        return None


@register
class MarketDigestHourlyEvent(_MarketDigestEvent):
    code = 'MARKET_DIGEST_HOURLY'
    label = 'Resumen del mercado cada hora'
    description = 'Precios y cambios % de los símbolos principales en la última hora.'


@register
class MarketDigestDailyEvent(_MarketDigestEvent):
    code = 'MARKET_DIGEST_DAILY'
    label = 'Resumen diario del mercado'
    description = 'Precios y cambios % de los símbolos principales en las últimas 24h.'


@register
class MarketDigestWeeklyEvent(_MarketDigestEvent):
    code = 'MARKET_DIGEST_WEEKLY'
    label = 'Resumen semanal del mercado'
    description = 'Precios y cambios % de los símbolos principales en los últimos 7 días.'
