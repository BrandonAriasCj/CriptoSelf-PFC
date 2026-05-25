from django.shortcuts import render
from django.http import JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import backtrader as bt
import json
import io
import sys
import os
from contextlib import redirect_stdout
from decimal import Decimal
from .demo import ScalpingStrategy, PatronVela, get_ccxt_data
from .custom_strategy import CustomScalpingStrategy
from .models import BacktestResult
import datetime
import ccxt
import pandas as pd

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import permission_classes


def _safe_decimal(value, default='0'):
    """Convierte a Decimal de forma segura. NaN/inf → default. Trunca a 4 decimales."""
    try:
        d = Decimal(str(value if value is not None else default))
        if not d.is_finite():
            d = Decimal(default)
        return d.quantize(Decimal('0.0001'))
    except Exception:
        return Decimal(default)


def _persist_backtest_result(request, *, backtest_type, symbol, timeframe,
                             fecha_inicio, fecha_fin, resumen, parametros=None):
    """
    Crea un BacktestResult si el request viene autenticado.
    Silencioso en caso de error — no debe romper la respuesta del backtest.
    """
    import logging
    log = logging.getLogger(__name__)

    user = getattr(request, 'user', None)
    if not user or not user.is_authenticated:
        return None
    try:
        return BacktestResult.objects.create(
            usuario=user,
            backtest_type=backtest_type,
            symbol=symbol,
            timeframe=timeframe,
            fecha_inicio=str(fecha_inicio),
            fecha_fin=str(fecha_fin),
            capital_inicial=_safe_decimal(resumen.get('capital_inicial')),
            capital_final=_safe_decimal(resumen.get('capital_final')),
            ganancia_perdida=_safe_decimal(resumen.get('ganancia_perdida')),
            rentabilidad_porcentaje=_safe_decimal(resumen.get('rentabilidad_porcentaje')),
            operaciones_totales=int(resumen.get('operaciones_totales') or 0),
            operaciones_ganadas=int(resumen.get('operaciones_ganadas') or 0),
            operaciones_perdidas=int(resumen.get('operaciones_perdidas') or 0),
            tasa_acierto=_safe_decimal(resumen.get('tasa_acierto')),
            racha_perdidas=int(resumen.get('racha_perdidas') or 0),
            velas_negativas=int(resumen.get('velas_negativas') or 0),
            parametros=parametros or {},
        )
    except Exception:
        log.exception('Error al persistir BacktestResult')
        return None


@api_view(['GET'])
@permission_classes([AllowAny])
def run_backtesting_demo(request):
    """
    Ejecuta el demo de backtesting y retorna los resultados
    """
    try:
        # Capturar la salida del print
        output_buffer = io.StringIO()
        
        with redirect_stdout(output_buffer):
            # Crear instancia de cerebro
            cerebro = bt.Cerebro()
            cerebro.addstrategy(ScalpingStrategy)
            cerebro.addindicator(PatronVela)

            # Generar datos
            symbol = 'BTC/USDT'
            timeframe = '5m'
            tiempo = '2025-01-01T00:00:00Z'
            since = ccxt.kraken().parse8601(tiempo)
            data_df = get_ccxt_data(symbol, timeframe, since)

            data = bt.feeds.PandasData(
                dataname=data_df,
                timeframe=bt.TimeFrame.Minutes,
                compression=5,
                fromdate=datetime.datetime(2025, 1, 1),
                todate=datetime.datetime(2025, 9, 5)
            )

            cerebro.adddata(data)
            cerebro.broker.set_cash(100)

            capital_inicial = cerebro.broker.getvalue()
            print(f"Capital inicial: {capital_inicial:.2f}")
            
            # Ejecutar backtesting
            instancia = cerebro.run()[0]

            data = cerebro.datas[0]
            estrategia = cerebro.runstrats[0][0]

            # Extraer datos correctamente de las líneas de Backtrader
            fechas = [bt.num2date(x) for x in data.lines.datetime.array]
            precios = list(data.lines.close.array)  # Usar .array para obtener todos los valores
            indi = list(estrategia.patronVela1.lines.status.array)  # Usar la línea status del indicador
            volma = list(estrategia.vol_ma.lines.sma.array)  # Usar la línea sma del indicador vol_ma
            historico_vol_max = list(estrategia.vol_ma_values)
            datas_close_list = list(estrategia.datas_close)
            
            # Debug: Imprimir información sobre los datos extraídos
            print(f"DEBUG - Fechas extraídas: {len(fechas)}")
            print(f"DEBUG - Precios extraídos: {len(precios)}")
            print(f"DEBUG - Primeros 3 precios: {precios[:3] if len(precios) > 3 else precios}")
            print(f"DEBUG - Últimos 3 precios: {precios[-3:] if len(precios) > 3 else precios}")
            print(f"DEBUG - Indicadores extraídos: {len(indi)}")
            print(f"DEBUG - Volumen MA extraído: {len(volma)}")

            # Convertir NaN a None para JSON válido
            import math
            indi_clean = [None if (isinstance(x, float) and math.isnan(x)) else x for x in indi]
            volma_clean = [None if (isinstance(x, float) and math.isnan(x)) else x for x in volma]
            precios_clean = [None if (isinstance(x, float) and math.isnan(x)) else x for x in precios]

            print(f"DEBUG - Precios después de limpiar: {len(precios_clean)}")
            print(f"DEBUG - Primeros 3 precios limpios: {precios_clean[:3] if len(precios_clean) > 3 else precios_clean}")

            capital_final = cerebro.broker.getvalue()
            print(f"Capital final: {capital_final:.2f}")
            print(f"Cerradas Totales: {instancia.cnt}")
            print(f"Ganadas: {instancia.ganadas}")
            print(f"Perdidas: {instancia.perdidas}")
            print(f"Velas negativas: {instancia.vNegativas}")

        # Obtener la salida capturada
        output_text = output_buffer.getvalue()
        
        # Preparar respuesta estructurada

        # Calcular métricas de rendimiento
        ganancia_perdida = capital_final - capital_inicial
        rentabilidad_porcentaje = ((capital_final - capital_inicial) / capital_inicial) * 100 if capital_inicial > 0 else 0
        tasa_acierto = (instancia.ganadas / instancia.cnt * 100) if instancia.cnt > 0 else 0

        resumen = {
            "capital_inicial": capital_inicial,
            "capital_final": capital_final,
            "ganancia_perdida": ganancia_perdida,
            "rentabilidad_porcentaje": rentabilidad_porcentaje,
            "operaciones_totales": instancia.cnt,
            "operaciones_ganadas": instancia.ganadas,
            "operaciones_perdidas": instancia.perdidas,
            "tasa_acierto": tasa_acierto,
            "racha_perdidas": getattr(instancia, 'loss_streak', 0),
            "velas_negativas": getattr(instancia, 'vNegativas', 0)
        }

        _persist_backtest_result(
            request,
            backtest_type='demo',
            symbol=symbol,
            timeframe=timeframe,
            fecha_inicio=tiempo,
            fecha_fin='2025-09-05',
            resumen=resumen,
        )

        respuesta_json = JsonResponse({
                "fechas": [f.strftime("%Y-%m-%d %H:%M:%S") for f in fechas],
                "precio": precios_clean,
                "patronVela": indi_clean,
                "volma": volma_clean,
                "historial": historico_vol_max,
                "datas closed": datas_close_list,
                "resumen": resumen,
         })

        data = respuesta_json
        print("data: ", data.content)
        return respuesta_json
        #return Response(resultado, status=status.HTTP_200_OK)
        
    except Exception as e:
        import traceback as _tb
        print('=' * 80)
        print('[run-custom] EXCEPCIÓN no manejada:')
        _tb.print_exc()
        print('=' * 80)
        return Response({
            'status': 'error',
            'message': str(e),
            'error_type': type(e).__name__,
            'traceback': _tb.format_exc(),
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def run_custom_backtesting(request):
    """
    Ejecuta backtesting con parámetros personalizados
    """
    try:
        # Obtener parámetros del request
        data = request.data
        #print(data)
        symbol = data.get('symbol', 'BTC/USDT')
        timeframe = data.get('timeframe', '5m')
        fecha_inicio = data.get('fecha_inicio', '2025-01-01')
        fecha_fin = data.get('fecha_fin', '2025-09-05')
        capital_inicial = data.get('capital_inicial', 1000)
        only_plot = data.get('only_plot', False)
        
        # Parámetros de estrategia
        ema_fast = data.get('ema_fast', 9)
        ema_slow = data.get('ema_slow', 21)
        rsi_period = data.get('rsi_period', 14)
        stop_loss_mult = data.get('stop_loss_mult', 2.0)
        take_profit_mult = data.get('take_profit_mult', 4.0)
        risk_per_trade = data.get('risk_per_trade', 0.02)
        min_volume = data.get('min_volume', 5)
        adx_threshold = data.get('adx_threshold', 25)
        bollinger_period = data.get('bollinger_period', 20)
        atr_period = data.get('atr_period', 14)
        
        # Validar fechas
        try:
            fecha_inicio_dt = datetime.datetime.strptime(fecha_inicio, '%Y-%m-%d')
            fecha_fin_dt = datetime.datetime.strptime(fecha_fin, '%Y-%m-%d')
            
            # Autocorrección de timeframe para periodos largos (evitar que CCXT se quede a medias)
            delta_dias = (fecha_fin_dt - fecha_inicio_dt).days
            if delta_dias > 800:
                timeframe = '1d'
            elif delta_dias > 200:
                timeframe = '4h'
            elif delta_dias > 60:
                timeframe = '1h'
            elif delta_dias > 20:
                timeframe = '15m'
                
        except ValueError:
            return Response({
                'status': 'error',
                'message': 'Formato de fecha inválido. Use YYYY-MM-DD'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Logs de diagnóstico ANTES de capturar stdout
        print("=" * 80)
        print("🚀 INICIANDO BACKTESTING PERSONALIZADO")
        print(f"  Symbol: {symbol}")
        print(f"  Timeframe: {timeframe}")
        print(f"  Fecha inicio: {fecha_inicio}")
        print(f"  Fecha fin: {fecha_fin}")
        print(f"  Capital inicial: {capital_inicial}")
        print("=" * 80)
        
        # Generar datos ANTES del redirect_stdout
        tiempo = f'{fecha_inicio}T00:00:00Z'
        tiempo_fin = f'{fecha_fin}T23:59:59Z'
        
        # ccxt.binance() en lugar de kraken para extraer bien el historial
        since = ccxt.binance().parse8601(tiempo)
        fetch_until = ccxt.binance().parse8601(tiempo_fin)
        
        print(f"📡 Solicitando datos de Binance con timeframe adaptado a {timeframe}...")
        print(f"  Since timestamp: {since} | Until: {fetch_until}")
        
        data_df = get_ccxt_data(symbol, timeframe, since, fetch_until=fetch_until)
        
        print(f"✅ Datos recibidos de Binance:")
        print(f"  Total de velas: {len(data_df)}")
        if len(data_df) > 0:
            print(f"  Primera fecha: {data_df.index[0]}")
            print(f"  Última fecha: {data_df.index[-1]}")
            print(f"  Primeras 3 velas:")
            print(data_df.head(3))
        else:
            print("  ⚠️ NO SE RECIBIERON DATOS DE BINANCE")
            return Response({
                'status': 'error',
                'message': 'No se pudieron obtener datos históricos para el período especificado'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        if only_plot:
            fechas = [fecha.to_pydatetime().strftime("%Y-%m-%d %H:%M:%S") for fecha in data_df.index]
            import math
            precios = [None if (isinstance(x, float) and math.isnan(x)) else float(x) if x is not None else None for x in data_df['close'].tolist()]

            resumen_plot = {
                "capital_inicial": capital_inicial,
                "capital_final": capital_inicial,
                "ganancia_perdida": 0,
                "rentabilidad_porcentaje": 0,
                "operaciones_totales": 0,
                "operaciones_ganadas": 0,
                "operaciones_perdidas": 0,
                "tasa_acierto": 0,
                "racha_perdidas": 0,
                "velas_negativas": 0
            }
            # Cuenta como un backtest ejecutado para gamificación (modo "solo gráfica").
            _persist_backtest_result(
                request,
                backtest_type='custom',
                symbol=symbol,
                timeframe=timeframe,
                fecha_inicio=fecha_inicio,
                fecha_fin=fecha_fin,
                resumen=resumen_plot,
                parametros={'modo': 'solo_graficar', 'symbol': symbol, 'timeframe': timeframe},
            )

            return JsonResponse({
                "fechas": fechas,
                "precio": precios,
                "patronVela": [0] * len(precios),
                "volma": [None] * len(precios),
                "historial": [],
                "datas closed": [],
                "resumen": resumen_plot,
                "parametros_utilizados": {
                    "symbol": symbol,
                    "timeframe": timeframe,
                    "fecha_inicio": fecha_inicio,
                    "fecha_fin": fecha_fin,
                    "modo": 'solo_graficar'
                }
            })
        
        # Capturar la salida del print solo para backtrader
        output_buffer = io.StringIO()
        
        # TEMPORALMENTE DESHABILITADO para ver logs
        # with redirect_stdout(output_buffer):
        if True:  # Simular el with para mantener la indentación
            # Crear instancia de cerebro
            cerebro = bt.Cerebro()
            
            # Usar estrategia personalizada con parámetros
            cerebro.addstrategy(
                CustomScalpingStrategy,
                ema_fast=ema_fast,
                ema_slow=ema_slow,
                rsi_period=rsi_period,
                stop_loss_mult=stop_loss_mult,
                take_profit_mult=take_profit_mult,
                risk_per_trade=risk_per_trade,
                min_volume=min_volume,
                adx_threshold=adx_threshold,
                bollinger_period=bollinger_period,
                atr_period=atr_period
            )
            cerebro.addindicator(PatronVela)

            # Mapear timeframe elegido a los parámetros de Backtrader
            tf_map = {
                '1m':  (bt.TimeFrame.Minutes, 1),
                '5m':  (bt.TimeFrame.Minutes, 5),
                '15m': (bt.TimeFrame.Minutes, 15),
                '1h':  (bt.TimeFrame.Minutes, 60),
                '4h':  (bt.TimeFrame.Minutes, 240),
                '1d':  (bt.TimeFrame.Days, 1),
            }
            tf, comp = tf_map.get(timeframe, (bt.TimeFrame.Minutes, 5))

            data = bt.feeds.PandasData(
                dataname=data_df,
                timeframe=tf,
                compression=comp,
                fromdate=fecha_inicio_dt,
                todate=fecha_fin_dt
            )

            cerebro.adddata(data)
            cerebro.broker.set_cash(capital_inicial)

            capital_inicial_real = cerebro.broker.getvalue()
            print(f"Capital inicial: {capital_inicial_real:.2f}")
            
            # Ejecutar backtesting
            try:
                print(f"Iniciando backtesting con {len(data_df)} velas de datos")
                print(f"Rango de fechas: {data_df.index[0]} a {data_df.index[-1]}")
                print(f"Primeras 5 velas:")
                print(data_df.head())
                
                instancia = cerebro.run()[0]
                print("Backtest terminado correctamente.")
            except IndexError as e:
                print("=" * 80)
                print("ERROR DE ÍNDICE EN BACKTRADER:")
                print(f"Mensaje: {e}")
                print(f"Datos disponibles: {len(data_df)} velas")
                print(f"Configuración:")
                print(f"  - Symbol: {symbol}")
                print(f"  - Timeframe: {timeframe}")
                print(f"  - Fecha inicio: {fecha_inicio}")
                print(f"  - Fecha fin: {fecha_fin}")
                import traceback
                traceback.print_exc()
                print("=" * 80)
                raise
            except Exception as e:
                print("=" * 80)
                print("ERROR GENERAL EN BACKTRADER:")
                print(f"Tipo: {type(e).__name__}")
                print(f"Mensaje: {e}")
                import traceback
                traceback.print_exc()
                print("=" * 80)
                raise

            #import winsound; winsound.Beep(500, 500);

            data = cerebro.datas[0]
            estrategia = cerebro.runstrats[0][0]

            # Extraer datos correctamente de las líneas de Backtrader
            print("Extrayendo datos del backtesting...")
            
            # IMPORTANTE: Usar get() en lugar de array para obtener todos los datos
            fechas = []
            precios = []
            indi = []
            volma = []
            
            # Iterar sobre todos los datos disponibles
            for i in range(len(data)):
                try:
                    fechas.append(bt.num2date(data.datetime[i]))
                    precios.append(data.close[i])
                    
                    # Intentar obtener el indicador si existe
                    try:
                        indi.append(estrategia.patronVela1.lines.status[i])
                    except:
                        indi.append(0)
                    
                    # Intentar obtener el volumen MA si existe
                    try:
                        volma.append(estrategia.vol_ma.lines.sma[i])
                    except:
                        volma.append(None)
                except:
                    break
            
            historico_vol_max = list(estrategia.vol_ma_values)
            datas_close_list = list(estrategia.datas_close)
            
            print(f"Datos extraídos del loop:")
            print(f"  Fechas: {len(fechas)}")
            print(f"  Precios: {len(precios)}")
            print(f"  Indicador: {len(indi)}")
            print(f"  Volumen MA: {len(volma)}")
            print(f"  Historial: {len(historico_vol_max)}")
            print(f"  Datas closed: {len(datas_close_list)}")
            
            # USAR LOS DATOS GUARDADOS POR LA ESTRATEGIA
            if len(datas_close_list) > len(precios):
                print(f"⚠️ Usando datos guardados por la estrategia en lugar del loop")
                precios = datas_close_list
                volma = historico_vol_max
                
                # Intentar extraer el indicador correctamente
                indi = []
                try:
                    # Acceder al indicador desde la estrategia
                    for i in range(len(precios)):
                        try:
                            valor = estrategia.patronVela1.lines.status[i]
                            indi.append(float(valor) if valor is not None else 0)
                        except:
                            indi.append(0)
                    
                    patrones_encontrados = sum(1 for x in indi if x > 0)
                    print(f"📊 Patrones encontrados: {patrones_encontrados} de {len(indi)}")
                except Exception as e:
                    print(f"⚠️ Error extrayendo indicador: {e}")
                    indi = [0] * len(precios)
                
                # Generar fechas desde el DataFrame
                fechas = [fecha.to_pydatetime() for fecha in data_df.index[:len(precios)]]
                
                print(f"✅ Datos corregidos:")
                print(f"  Fechas: {len(fechas)}")
                print(f"  Precios: {len(precios)}")
                print(f"  Indicador: {len(indi)}")
                print(f"  Volumen MA: {len(volma)}")
            
            # Convertir NaN a None para JSON válido
            import math
            indi_clean = [None if (isinstance(x, float) and math.isnan(x)) else float(x) if x is not None else 0 for x in indi]
            volma_clean = [None if (isinstance(x, float) and math.isnan(x)) else float(x) if x is not None else None for x in volma]
            precios_clean = [None if (isinstance(x, float) and math.isnan(x)) else float(x) if x is not None else None for x in precios]


            capital_final = cerebro.broker.getvalue()
            print(f"Capital final: {capital_final:.2f}")
            print(f"Cerradas Totales: {instancia.cnt}")
            print(f"Ganadas: {instancia.ganadas}")
            print(f"Perdidas: {instancia.perdidas}")

        # Obtener la salida capturada
        output_text = output_buffer.getvalue()
        
        # Calcular métricas de rendimiento
        ganancia_perdida = capital_final - capital_inicial_real
        rentabilidad_porcentaje = ((capital_final - capital_inicial_real) / capital_inicial_real) * 100 if capital_inicial_real > 0 else 0
        tasa_acierto = (instancia.ganadas / instancia.cnt * 100) if instancia.cnt > 0 else 0

        resumen = {
            "capital_inicial": capital_inicial_real,
            "capital_final": capital_final,
            "ganancia_perdida": ganancia_perdida,
            "rentabilidad_porcentaje": rentabilidad_porcentaje,
            "operaciones_totales": instancia.cnt,
            "operaciones_ganadas": instancia.ganadas,
            "operaciones_perdidas": instancia.perdidas,
            "tasa_acierto": tasa_acierto,
            "racha_perdidas": getattr(instancia, 'loss_streak', 0),
            "velas_negativas": getattr(instancia, 'vNegativas', 0)
        }

        parametros_utilizados = {
            "symbol": symbol,
            "timeframe": timeframe,
            "fecha_inicio": fecha_inicio,
            "fecha_fin": fecha_fin,
            "capital_inicial": capital_inicial,
            "ema_fast": ema_fast,
            "ema_slow": ema_slow,
            "rsi_period": rsi_period,
            "stop_loss_mult": stop_loss_mult,
            "take_profit_mult": take_profit_mult,
            "risk_per_trade": risk_per_trade
        }

        _persist_backtest_result(
            request,
            backtest_type='custom',
            symbol=symbol,
            timeframe=timeframe,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            resumen=resumen,
            parametros=parametros_utilizados,
        )

        return JsonResponse({
            "fechas": [f.strftime("%Y-%m-%d %H:%M:%S") for f in fechas],
            "precio": precios_clean,
            "patronVela": indi_clean,
            "volma": volma_clean,
            "historial": historico_vol_max,
            "datas closed": datas_close_list,
            "resumen": resumen,
            "parametros_utilizados": parametros_utilizados,
        })
        
    except Exception as e:
        import traceback as _tb
        print('=' * 80)
        print('[run-custom] EXCEPCIÓN no manejada:')
        _tb.print_exc()
        print('=' * 80)
        return Response({
            'status': 'error',
            'message': str(e),
            'error_type': type(e).__name__,
            'traceback': _tb.format_exc(),
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_strategy_info(request):
    """
    Retorna información sobre la estrategia de backtesting
    """
    try:
        strategy_info = {
            'strategy_name': 'ScalpingStrategy',
            'indicators': [
                'PatronVela (Indicador personalizado)',
                'EMA Fast (9)',
                'EMA Slow (21)',
                'MACD (12, 26, 9)',
                'RSI (7)',
                'Bollinger Bands (20)',
                'ATR (14)',
                'ADX (14)'
            ],
            'parameters': {
                'ema_fast': 9,
                'ema_slow': 21,
                'macd1': 12,
                'macd2': 26,
                'macdsig': 9,
                'rsi_period': 7,
                'bollinger_period': 20,
                'atr_period': 14,
                'stop_loss_mult': 0.5,
                'take_profit_mult': 4.0,
                'risk_per_trade': 0.02,
                'min_volume': 5,
                'adx_period': 14,
                'adx_threshold': 20
            },
            'patron_vela_methods': [
                'next1: Patrón de 2 velas (positiva y negativa)',
                'next: Patrón de 3 velas envolvente',
                'next3: Velas con poco cuerpo',
                'next4: Velas doji',
                'next5: Martillo rojo',
                'next6: Martillo verde',
                'next7: Martillo invertido',
                'next8: Velas neutrales'
            ]
        }
        
        return Response(strategy_info, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_historical_events(request):
    """
    Retorna la lista de eventos históricos para el backtesting
    """
    try:
        # Construir la ruta al archivo JSON local
        file_path = os.path.join(os.path.dirname(__file__), 'historical_events.json')
        
        with open(file_path, 'r', encoding='utf-8') as f:
            events_data = json.load(f)
            
        return Response(events_data, status=status.HTTP_200_OK)
        
    except FileNotFoundError:
        return Response({
            'status': 'error',
            'message': 'No se encontró el archivo de eventos históricos'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)




