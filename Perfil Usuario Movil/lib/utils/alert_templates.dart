/// Plantillas variadas para alertas de mercado.
///
/// Espejo en Dart del módulo `alerts/services/templates.py` del backend. Se usa
/// como fallback cuando una notificación no trae `payload.headline` (digests
/// generados antes de habilitar headlines en el servidor).
///
/// El "seed" usado para elegir entre las variantes es el id de la notificación
/// — así la misma notificación muestra siempre la misma frase entre renders.

const Map<String, String> _friendlyNames = {
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
};

String friendlyName(String symbol) {
  final short = symbol.split('/').first.toUpperCase();
  return _friendlyNames[short] ?? short;
}

String formatPrice(num price) {
  if (price >= 1000) return '\$${price.toStringAsFixed(0)}';
  if (price >= 1) return '\$${price.toStringAsFixed(2)}';
  return '\$${price.toStringAsFixed(4)}';
}

class DigestItem {
  final String symbol;
  final num? price;
  final num? changePct;
  final String? window;

  const DigestItem({
    required this.symbol,
    this.price,
    this.changePct,
    this.window,
  });

  factory DigestItem.fromJson(Map<String, dynamic> json) => DigestItem(
        symbol: json['symbol'] as String,
        price: json['price'] as num?,
        changePct: json['change_pct'] as num?,
        window: json['window'] as String?,
      );

  bool get hasData => price != null && changePct != null;
}

/// Devuelve la lista de items del digest si el payload los trae, o `null`.
List<DigestItem>? digestItemsFromPayload(Map<String, dynamic>? payload) {
  if (payload == null) return null;
  final raw = payload['items'];
  if (raw is! List || raw.isEmpty) return null;
  return raw
      .whereType<Map<String, dynamic>>()
      .map(DigestItem.fromJson)
      .toList(growable: false);
}

/// `true` si todos los items del digest están sin datos. Se usa para filtrar
/// notificaciones viejas que el backend generó cuando no podía traer precios.
bool isFailedDigest(Map<String, dynamic>? payload) {
  final items = digestItemsFromPayload(payload);
  if (items == null) return false;
  return items.every((it) => !it.hasData);
}

// --- Plantillas de headlines (digest) ---------------------------------------

typedef _HeadlineFn = String Function(String leader, num pct);

final List<_HeadlineFn> _headlineAllUp = [
  (l, p) => 'Sesión alcista — $l lidera con +${p.toStringAsFixed(1)}%',
  (l, _) => 'Mercado en verde — todos los principales suben, $l al frente',
  (l, p) => 'Día positivo en cripto, $l marca el ritmo (+${p.toStringAsFixed(1)}%)',
];

final List<_HeadlineFn> _headlineAllDown = [
  (l, p) =>
      'Mercado en rojo — los principales caen, $l encabeza la baja (${p.toStringAsFixed(1)}%)',
  (l, p) => 'Sesión bajista — $l es el más castigado (${p.toStringAsFixed(1)}%)',
  (l, p) => 'Cripto en corrección, $l retrocede ${p.abs().toStringAsFixed(1)}%',
];

final List<_HeadlineFn> _headlineMixedBull = [
  (l, p) => 'Sesión mixta — $l empuja al alza (+${p.toStringAsFixed(1)}%)',
  (l, p) => 'Cripto dividido, $l es lo más destacado (+${p.toStringAsFixed(1)}%)',
  (l, p) => 'Mercado mixto con sesgo alcista: $l +${p.toStringAsFixed(1)}%',
];

final List<_HeadlineFn> _headlineMixedBear = [
  (l, p) =>
      'Sesión mixta — predominan las caídas, $l cede ${p.abs().toStringAsFixed(1)}%',
  (l, p) => 'Mercado dividido, $l pesa con ${p.toStringAsFixed(1)}%',
  (l, p) => 'Cripto mixto con sesgo bajista: $l ${p.toStringAsFixed(1)}%',
];

const List<String> _headlineFlat = [
  'Mercado tranquilo — variaciones leves en los principales',
  'Sesión sin grandes sobresaltos en cripto',
  'Mercado plano — movimientos menores al 1%',
];

/// Devuelve un headline contextual para un digest dado.
///
/// [seed] estabiliza la selección entre renders (ej. id de la notificación).
String? computeDigestHeadline(List<DigestItem> items, int seed) {
  final usable = items.where((it) => it.changePct != null).toList();
  if (usable.isEmpty) return null;

  T pick<T>(List<T> arr) => arr[seed % arr.length];

  final changes = usable.map((it) => it.changePct!).toList();
  final pos = changes.where((c) => c >= 0).toList();
  final neg = changes.where((c) => c < 0).toList();

  final leaderUp = usable.reduce((a, b) => a.changePct! > b.changePct! ? a : b);
  final leaderDown = usable.reduce((a, b) => a.changePct! < b.changePct! ? a : b);

  final maxMag = changes.map((c) => c.abs()).reduce((a, b) => a > b ? a : b);
  if (maxMag < 1.0) return pick(_headlineFlat);

  if (neg.isEmpty) {
    return pick(_headlineAllUp)(friendlyName(leaderUp.symbol), leaderUp.changePct!);
  }
  if (pos.isEmpty) {
    return pick(_headlineAllDown)(friendlyName(leaderDown.symbol), leaderDown.changePct!);
  }
  if (leaderUp.changePct!.abs() >= leaderDown.changePct!.abs()) {
    return pick(_headlineMixedBull)(friendlyName(leaderUp.symbol), leaderUp.changePct!);
  }
  return pick(_headlineMixedBear)(friendlyName(leaderDown.symbol), leaderDown.changePct!);
}
