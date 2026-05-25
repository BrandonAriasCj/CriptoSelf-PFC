import { Operation } from '../services/operations';

// Criptoactivos disponibles (temporalmente hardcodeado, luego vendrá del backend)
export const CRYPTO_MAP: Record<string, number> = {
    'BTC/USDT': 1,
    'ETH/USDT': 2,
    'ADA/USDT': 3,
    'SOL/USDT': 4,
};

// Tipo Position del UI
export interface Position {
    id: string;
    type: 'long' | 'short';
    pair: string;
    size: number;
    entryPrice: number;
    leverage: number;
    margin: number;
    stopLoss?: number;
    takeProfit?: number;
    timestamp: Date;
    status: 'open' | 'closed';
    pnl: number;
    unrealizedPnL: number;
}

// Position mapeada con ID de operación
export interface MappedPosition extends Position {
    operationId?: number; // ID de la operación en el backend
}

/**
 * Convierte una Operation del backend a Position del UI
 */
export function mapOperationToPosition(operation: Operation): MappedPosition {
    const pair = Object.keys(CRYPTO_MAP).find(
        key => CRYPTO_MAP[key] === operation.criptoactivo
    ) || 'BTC/USDT';

    const type = operation.tipo_operacion === 'compra' ? 'long' : 'short';
    const size = typeof operation.cantidad === 'string'
        ? parseFloat(operation.cantidad)
        : operation.cantidad;
    const entryPrice = typeof operation.precio_promedio === 'string'
        ? parseFloat(operation.precio_promedio)
        : operation.precio_promedio;

    // Intentar extraer el P&L de las notas si la operación está completada
    let pnl = 0;
    if (operation.estado === 'completada' && operation.notas) {
        const pnlMatch = operation.notas.match(/P&L:\s*\$?(-?\d+\.?\d*)/);
        if (pnlMatch) {
            pnl = parseFloat(pnlMatch[1]);
        }
    }

    return {
        id: operation.id?.toString() || `temp_${Date.now()}`,
        operationId: operation.id,
        type,
        pair,
        size,
        entryPrice,
        leverage: 1, // Por ahora no guardamos leverage en el backend
        margin: 0, // Calculado localmente
        timestamp: new Date(operation.fecha_operacion),
        status: operation.estado === 'completada' ? 'closed' : 'open',
        pnl, // Extraído de las notas si está disponible
        unrealizedPnL: 0, // Solo para posiciones abiertas
    };
}

export function mapPositionToOperation(
    position: Position,
    pair: string
): Omit<Operation, 'id' | 'created_at' | 'updated_at'> {
    const cryptoId = CRYPTO_MAP[pair] || 1;
    const montoTotal = position.size * position.entryPrice;

    return {
        usuario: 1, // Usuario por defecto para testing (sin autenticación)
        criptoactivo: cryptoId,
        tipo_operacion: position.type === 'long' ? 'compra' : 'venta',
        cantidad: position.size.toString(),
        precio_promedio: position.entryPrice.toString(),
        monto_total: montoTotal.toFixed(2), // Redondear a 2 decimales
        comision: '0',
        fecha_operacion: position.timestamp.toISOString(),
        estado: position.status === 'open' ? 'pendiente' : 'completada',
        notas: `${position.type.toUpperCase()} ${pair} - Leverage: ${position.leverage}x`,
    };
}
