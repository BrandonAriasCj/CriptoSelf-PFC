import api from './api';

// Tipos para la API de operaciones
export interface Operation {
    id?: number;
    usuario?: number;
    criptoactivo: number;
    criptoactivo_details?: {
        id: number;
        symbol: string;
        name: string;
    };
    tipo_operacion: 'compra' | 'venta';
    cantidad: string | number;
    precio_promedio: string | number;
    monto_total: string | number;
    comision?: string | number;
    fecha_operacion: string;
    estado: 'completada' | 'pendiente' | 'cancelada';
    notas?: string;
    created_at?: string;
    updated_at?: string;
}

// Servicio para operaciones
export const operationsService = {
    /**
     * Listar todas las operaciones del usuario
     */
    async list(filters?: {
        criptoactivo?: number;
        tipo_operacion?: 'compra' | 'venta';
        estado?: string;
        ordering?: string;
    }): Promise<Operation[]> {
        const params = new URLSearchParams();

        if (filters?.criptoactivo) params.append('criptoactivo', filters.criptoactivo.toString());
        if (filters?.tipo_operacion) params.append('tipo_operacion', filters.tipo_operacion);
        if (filters?.estado) params.append('estado', filters.estado);
        if (filters?.ordering) params.append('ordering', filters.ordering);

        const response = await api.get<any>(`/operaciones/?${params.toString()}`);

        // Django REST Framework devuelve un objeto paginado con 'results'
        // Si es un array directamente, usarlo; si es objeto, extraer 'results'
        if (Array.isArray(response.data)) {
            return response.data;
        } else if (response.data && Array.isArray(response.data.results)) {
            return response.data.results;
        } else {
            console.error('Formato de respuesta inesperado:', response.data);
            return [];
        }
    },

    /**
     * Crear una nueva operación
     */
    async create(operation: Omit<Operation, 'id' | 'created_at' | 'updated_at'>): Promise<Operation> {
        const response = await api.post<Operation>('/operaciones/', operation);
        return response.data;
    },

    /**
     * Obtener una operación específica
     */
    async get(id: number): Promise<Operation> {
        const response = await api.get<Operation>(`/operaciones/${id}/`);
        return response.data;
    },

    /**
     * Actualizar una operación
     */
    async update(id: number, data: Partial<Operation>): Promise<Operation> {
        const response = await api.patch<Operation>(`/operaciones/${id}/`, data);
        return response.data;
    },

    /**
     * Eliminar una operación
     */
    async delete(id: number): Promise<void> {
        await api.delete(`/operaciones/${id}/`);
    },

    /**
     * Obtener historial de operaciones completadas
     */
    async getHistory(): Promise<Operation[]> {
        return this.list({
            estado: 'completada',
            ordering: '-fecha_operacion'
        });
    },

    /**
     * Obtener posiciones abiertas (pendientes)
     */
    async getOpenPositions(cryptoId?: number): Promise<Operation[]> {
        const filters: any = {
            estado: 'pendiente',
            ordering: '-fecha_operacion'
        };

        if (cryptoId) {
            filters.criptoactivo = cryptoId;
        }

        return this.list(filters);
    },
};

export default operationsService;
