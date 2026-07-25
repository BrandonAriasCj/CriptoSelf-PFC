"""Plantillas de frases para alertas (PRICE_THRESHOLD, PRICE_CHANGE_PCT, digests).

Objetivo: que las notificaciones no se sientan generadas por una sola plantilla
sterile. Las funciones de este módulo eligen entre varias frases equivalentes
según el contexto — magnitud del movimiento, dirección, si todos suben o bajan —
para que el mensaje resulte natural y menos repetitivo.

La selección usa ``random.choice`` directo; no hay test determinista que dependa
del texto exacto, así que aceptamos variabilidad real entre notificaciones.
"""

from __future__ import annotations

import random
from typing import Optional


# Mapa BASE -> nombre largo. Caemos al ticker si no está acá.
_FRIENDLY_NAMES = {
    'BTC': 'Bitcoin',
    'ETH': 'Ethereum',
    'SOL': 'Solana',
    'ADA': 'Cardano',
    'XRP': 'XRP',
    'DOGE': 'Dogecoin',
    'BNB': 'BNB',
    'AVAX': 'Avalanche',
    'DOT': 'Polkadot',
    'MATIC': 'Polygon',
    'LINK': 'Chainlink',
    'LTC': 'Litecoin',
    'ATOM': 'Cosmos',
}


def _short(symbol: str) -> str:
    return symbol.split('/')[0].upper()


def friendly_name(symbol: str) -> str:
    short = _short(symbol)
    return _FRIENDLY_NAMES.get(short, short)


def _format_price(price: float) -> str:
    if price >= 1000:
        return f'${price:,.0f}'
    if price >= 1:
        return f'${price:,.2f}'
    return f'${price:,.4f}'


# ---------------------------------------------------------------------------
# PRICE_THRESHOLD
# ---------------------------------------------------------------------------

_THRESHOLD_UP_TITLES = [
    '{name} superó los {threshold}',
    '{name} cruzó al alza los {threshold}',
    '{name} alcanzó tu objetivo de {threshold}',
    '{symbol} llegó a los {threshold}',
    '{name} rompió el techo de {threshold}',
]

_THRESHOLD_DOWN_TITLES = [
    '{name} cayó por debajo de {threshold}',
    '{name} perdió el soporte de {threshold}',
    '{name} bajó al nivel de {threshold}',
    '{symbol} retrocedió bajo los {threshold}',
    '{name} quebró la barrera de {threshold}',
]

_THRESHOLD_BODIES = [
    'Precio actual: {price}',
    'Cotiza ahora en {price}',
    'Marca {price} en este momento',
    'Ultimo trade en {price}',
]


def threshold_message(symbol: str, operator: str, threshold: float, price: float) -> tuple[str, str]:
    """Devuelve ``(title, body)`` para una alerta PRICE_THRESHOLD."""

    name = friendly_name(symbol)
    short = _short(symbol)
    pool = _THRESHOLD_UP_TITLES if operator == '>=' else _THRESHOLD_DOWN_TITLES
    title = random.choice(pool).format(
        name=name,
        symbol=short,
        threshold=_format_price(threshold),
    )
    body = random.choice(_THRESHOLD_BODIES).format(price=_format_price(price))
    return title, body


# ---------------------------------------------------------------------------
# PRICE_CHANGE_PCT
# ---------------------------------------------------------------------------

# Verbos agrupados por intensidad — frases más fuertes para movimientos > 5%,
# medianas para 1-5%, suaves para < 1%.
_VERBS_UP_STRONG = ['se disparó', 'se infla', 'pega un salto de', 'explotó']
_VERBS_UP_MEDIUM = ['subió', 'avanzó', 'repuntó', 'sumó']
_VERBS_UP_SOFT = ['se movió al alza', 'ganó', 'avanzó levemente']

_VERBS_DOWN_STRONG = ['se desplomó', 'se hundió', 'pega una caída de', 'colapsó']
_VERBS_DOWN_MEDIUM = ['cayó', 'retrocedió', 'bajó', 'restó']
_VERBS_DOWN_SOFT = ['se movió a la baja', 'cedió levemente', 'aflojó']

_CHANGE_PATTERNS = [
    '{name} {verb} {pct:.2f}% en {window}',
    'En {window}, {name} {verb} {pct:.2f}%',
    '{symbol} {verb} {pct:.2f}% en la última ventana de {window}',
    '{verb_cap} {pct:.2f}% en {window}: {name}',
]


def _pick_change_verb(change_pct: float) -> str:
    mag = abs(change_pct)
    if change_pct >= 0:
        if mag >= 5:
            return random.choice(_VERBS_UP_STRONG)
        if mag >= 1:
            return random.choice(_VERBS_UP_MEDIUM)
        return random.choice(_VERBS_UP_SOFT)
    if mag >= 5:
        return random.choice(_VERBS_DOWN_STRONG)
    if mag >= 1:
        return random.choice(_VERBS_DOWN_MEDIUM)
    return random.choice(_VERBS_DOWN_SOFT)


def change_pct_message(symbol: str, window: str, change_pct: float) -> str:
    """Frase para una alerta PRICE_CHANGE_PCT, ej. 'Bitcoin se disparó 5.20% en 1h'."""

    name = friendly_name(symbol)
    short = _short(symbol)
    verb = _pick_change_verb(change_pct)
    pattern = random.choice(_CHANGE_PATTERNS)
    return pattern.format(
        name=name,
        symbol=short,
        verb=verb,
        verb_cap=verb[0].upper() + verb[1:],
        pct=abs(change_pct),
        window=window,
    )


# ---------------------------------------------------------------------------
# MARKET_DIGEST
# ---------------------------------------------------------------------------

_HEADLINE_ALL_UP = [
    'Sesión alcista — {leader} lidera con +{pct:.1f}%',
    'Mercado en verde — todos los principales suben, {leader} al frente',
    'Día positivo en cripto, {leader} marca el ritmo (+{pct:.1f}%)',
]

_HEADLINE_ALL_DOWN = [
    'Mercado en rojo — los principales caen, {leader} encabeza la baja ({pct:.1f}%)',
    'Sesión bajista — {leader} es el más castigado ({pct:.1f}%)',
    'Cripto en corrección, {leader} retrocede {abs_pct:.1f}%',
]

_HEADLINE_MIXED_BULL = [
    'Sesión mixta — {leader} empuja al alza (+{pct:.1f}%)',
    'Cripto dividido, {leader} es lo más destacado (+{pct:.1f}%)',
    'Mercado mixto con sesgo alcista: {leader} +{pct:.1f}%',
]

_HEADLINE_MIXED_BEAR = [
    'Sesión mixta — predominan las caídas, {leader} cede {abs_pct:.1f}%',
    'Mercado dividido, {leader} pesa con {pct:.1f}%',
    'Cripto mixto con sesgo bajista: {leader} {pct:.1f}%',
]

_HEADLINE_FLAT = [
    'Mercado tranquilo — variaciones leves en los principales',
    'Sesión sin grandes sobresaltos en cripto',
    'Mercado plano — movimientos menores al 1%',
]


# ---------------------------------------------------------------------------
# SUGERENCIAS (cruce de medias)
# ---------------------------------------------------------------------------

_SUGGESTION_GOLDEN_TITLES = [
    '{name}: cruce alcista de medias (golden cross)',
    '{name} forma un golden cross — señal alcista',
    'Señal en {name}: la media rápida cruza al alza',
]

_SUGGESTION_DEATH_TITLES = [
    '{name}: cruce bajista de medias (death cross)',
    '{name} forma un death cross — señal bajista',
    'Señal en {name}: la media rápida cruza a la baja',
]

_SUGGESTION_BULLISH_TITLES = [
    '{name}: sesgo alcista en las medias',
    '{name} se mantiene sobre su media lenta',
]

_SUGGESTION_BEARISH_TITLES = [
    '{name}: sesgo bajista en las medias',
    '{name} cotiza por debajo de su media lenta',
]


def suggestion_message(analysis: dict) -> tuple[str, str]:
    """Devuelve ``(title, body)`` para una sugerencia de cruce de medias."""

    name = friendly_name(analysis['symbol'])
    signal = analysis['signal']
    indicator = f"SMA {analysis['fast']}/{analysis['slow']}"

    if signal == 'golden':
        title = random.choice(_SUGGESTION_GOLDEN_TITLES).format(name=name)
    elif signal == 'death':
        title = random.choice(_SUGGESTION_DEATH_TITLES).format(name=name)
    elif signal == 'bullish':
        title = random.choice(_SUGGESTION_BULLISH_TITLES).format(name=name)
    else:
        title = random.choice(_SUGGESTION_BEARISH_TITLES).format(name=name)

    body = (
        f"{indicator} en {analysis['timeframe']} · "
        f"rápida {_format_price(analysis['fast_ma'])} vs lenta {_format_price(analysis['slow_ma'])} · "
        f"precio {_format_price(analysis['price'])}. "
        'Esto es una señal técnica informativa, no una recomendación de inversión.'
    )
    return title, body


def digest_headline(items: list[dict]) -> Optional[str]:
    """Devuelve una frase contextual para encabezar el digest.

    Asume que ``items`` ya trae ``symbol``, ``price`` y ``change_pct``. Filtramos
    aquí los que no tengan ``change_pct`` para que el digest funcione aunque
    algún símbolo haya fallado parcialmente.
    """

    usable = [it for it in items if it.get('change_pct') is not None]
    if not usable:
        return None

    changes = [it['change_pct'] for it in usable]
    pos = [c for c in changes if c >= 0]
    neg = [c for c in changes if c < 0]

    leader_up = max(usable, key=lambda x: x['change_pct'])
    leader_down = min(usable, key=lambda x: x['change_pct'])

    max_mag = max(abs(c) for c in changes)
    if max_mag < 1.0:
        return random.choice(_HEADLINE_FLAT)

    if not neg:
        return random.choice(_HEADLINE_ALL_UP).format(
            leader=friendly_name(leader_up['symbol']),
            pct=leader_up['change_pct'],
        )

    if not pos:
        return random.choice(_HEADLINE_ALL_DOWN).format(
            leader=friendly_name(leader_down['symbol']),
            pct=leader_down['change_pct'],
            abs_pct=abs(leader_down['change_pct']),
        )

    # Mixto: cuál movimiento manda en magnitud.
    if abs(leader_up['change_pct']) >= abs(leader_down['change_pct']):
        return random.choice(_HEADLINE_MIXED_BULL).format(
            leader=friendly_name(leader_up['symbol']),
            pct=leader_up['change_pct'],
        )
    return random.choice(_HEADLINE_MIXED_BEAR).format(
        leader=friendly_name(leader_down['symbol']),
        pct=leader_down['change_pct'],
        abs_pct=abs(leader_down['change_pct']),
    )
