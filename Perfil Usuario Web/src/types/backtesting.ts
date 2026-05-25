export interface BacktestingData {
  fechas: string[];
  precio: number[];
  patronVela: number[];
  volma: number[];
  historial: number[];
  'datas closed': number[];
}

export interface BacktestingResult {
  status: 'success' | 'error';
  capital_inicial?: number;
  capital_final?: number;
  ganancia_perdida?: number;
  rentabilidad_porcentaje?: number;
  operaciones_totales?: number;
  operaciones_ganadas?: number;
  operaciones_perdidas?: number;
  tasa_acierto?: number;
  output_log?: string;
  parametros?: {
    symbol: string;
    timeframe: string;
    fecha_inicio: string;
    fecha_fin: string;
    capital_inicial: number;
  };
  message?: string;
  error_type?: string;
}

export interface StrategyInfo {
  strategy_name: string;
  indicators: string[];
  parameters: {
    [key: string]: number | string;
  };
  patron_vela_methods: string[];
}