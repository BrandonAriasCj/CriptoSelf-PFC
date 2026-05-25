import backtrader as bt
from .demo import PatronVela

class CustomScalpingStrategy(bt.Strategy):
    params = dict(
        ema_fast=9,
        ema_slow=21,
        rsi_period=14,
        stop_loss_mult=2.0,
        take_profit_mult=4.0,
        risk_per_trade=0.02,
        min_volume=5,
        adx_threshold=25,
        bollinger_period=20,
        atr_period=14
    )

    def __init__(self):
        self.loss_streak = 0
        self.cnt = 0
        self.ganadas = 0
        self.perdidas = 0
        self.vNegativas = 0

        # Indicadores personalizables
        self.patronVela1 = PatronVela(self.data)
        self.vol_ma_values = []
        self.datas_close = []
        self.vol_ma = bt.indicators.SimpleMovingAverage(self.data.volume, period=10)
        
        # EMAs personalizables
        self.ema_fast = bt.indicators.ExponentialMovingAverage(
            self.data.close, period=self.params.ema_fast
        )
        self.ema_slow = bt.indicators.ExponentialMovingAverage(
            self.data.close, period=self.params.ema_slow
        )
        
        # RSI personalizable
        self.rsi = bt.indicators.RSI(
            self.data.close, period=self.params.rsi_period
        )
        
        # Bollinger Bands personalizables
        self.bollinger = bt.indicators.BollingerBands(
            self.data.close, period=self.params.bollinger_period
        )
        
        # ATR personalizable
        self.atr = bt.indicators.ATR(
            self.data, period=self.params.atr_period
        )

        self.order = None
        self.entry_bar = None
        self.entry_price = None

    def next(self):
        self.vol_ma_values.append(self.vol_ma[0])
        self.datas_close.append(self.data.close[0])
        
        # Filtros de volumen
        if self.vol_ma[0] < self.params.min_volume:
            return
            
        # Filtros de RSI
        if self.rsi[0] > 70 or self.rsi[0] < 30:  # Evitar zonas de sobrecompra/sobreventa
            return

        if not self.position:
            # Señal de entrada: Patrón de vela + cruce de EMAs
            if (self.patronVela1.status[0] == 1 and 
                self.ema_fast[0] > self.ema_slow[0] and
                self.data.close[0] > self.bollinger.lines.mid[0]):  # Precio sobre media de Bollinger
                
                # Calcular tamaño de posición basado en riesgo
                risk_amount = self.broker.getvalue() * self.params.risk_per_trade
                atr_value = self.atr[0]
                stop_distance = atr_value * self.params.stop_loss_mult
                
                if stop_distance > 0:
                    size = risk_amount / stop_distance
                    size = max(0.001, min(size, 1.0))  # Limitar tamaño
                    
                    self.entry_price = self.data.close[0]
                    stop_price = self.entry_price - stop_distance
                    limit_price = self.entry_price + (atr_value * self.params.take_profit_mult)
                    
                    # Orden bracket con SL y TP personalizables
                    self.buy_bracket(
                        size=size,
                        price=self.entry_price,
                        stopprice=stop_price,
                        limitprice=limit_price
                    )
                    
                    self.entry_bar = len(self)
                    
        elif self.position and self.entry_bar and len(self) >= self.entry_bar + 5:
            # Salida por tiempo (5 velas después de entrada)
            self.close()

    def notify_trade(self, trade):
        if trade.isclosed:
            self.cnt += 1
            resultado = trade.pnl
            if resultado > 0:
                self.ganadas += 1
                self.loss_streak = 0
            else:
                self.perdidas += 1
                self.loss_streak += 1
                
            print(f"📅 Fecha: {self.data.datetime.date(0)}, "
                  f"Resultado: {round(resultado, 3)}, "
                  f"Precio entrada: {round(self.entry_price or 0, 2)}")