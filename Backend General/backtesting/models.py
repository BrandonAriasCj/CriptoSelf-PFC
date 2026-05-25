from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from decimal import Decimal
import django.core.validators

User = get_user_model()


# ============ TABLAS PADRE ============

class Criptoactivo(models.Model):
    """
    Modelo para representar criptoactivos (Bitcoin, Ethereum, etc.)
    """
    symbol = models.CharField(_('symbol'), max_length=20, unique=True, help_text="Ej: BTC, ETH, ADA")
    name = models.CharField(_('name'), max_length=100, help_text="Ej: Bitcoin, Ethereum")
    description = models.TextField(_('description'), blank=True)
    market_cap_rank = models.PositiveIntegerField(_('market cap rank'), null=True, blank=True)
    is_active = models.BooleanField(_('is active'), default=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('Criptoactivo')
        verbose_name_plural = _('Criptoactivos')
        ordering = ['market_cap_rank', 'symbol']

    def __str__(self):
        return f"{self.symbol} - {self.name}"


class Indicador(models.Model):
    """
    Modelo para indicadores técnicos (RSI, MACD, SMA, etc.)
    """
    TIPO_CHOICES = [
        ('trend', _('Tendencia')),
        ('momentum', _('Momentum')),
        ('volatility', _('Volatilidad')),
        ('volume', _('Volumen')),
        ('custom', _('Personalizado')),
    ]

    name = models.CharField(_('name'), max_length=100, unique=True)
    code = models.CharField(_('code'), max_length=20, unique=True, help_text="Ej: RSI, MACD, SMA")
    tipo = models.CharField(_('type'), max_length=20, choices=TIPO_CHOICES)
    description = models.TextField(_('description'), blank=True)
    parameters_schema = models.JSONField(_('parameters schema'), default=dict, blank=True, help_text="Esquema JSON de parámetros requeridos")
    is_active = models.BooleanField(_('is active'), default=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('Indicador')
        verbose_name_plural = _('Indicadores')
        ordering = ['tipo', 'name']

    def __str__(self):
        return f"{self.code} - {self.name}"


class Evento(models.Model):
    """
    Modelo para eventos de trading (señales de compra/venta)
    """
    TIPO_EVENTO_CHOICES = [
        ('buy_signal', _('Señal de Compra')),
        ('sell_signal', _('Señal de Venta')),
        ('stop_loss', _('Stop Loss')),
        ('take_profit', _('Take Profit')),
        ('entry_condition', _('Condición de Entrada')),
        ('exit_condition', _('Condición de Salida')),
    ]

    name = models.CharField(_('name'), max_length=100, blank=False, null=False)
    code = models.CharField(_('code'), max_length=50, unique=True)
    tipo_evento = models.CharField(_('event type'), max_length=20, choices=TIPO_EVENTO_CHOICES)
    description = models.TextField(_('description'), blank=True)
    condition_logic = models.TextField(_('condition logic'), help_text="Lógica de la condición en formato JSON o texto")
    priority = models.PositiveIntegerField(_('priority'), default=1, validators=[
        django.core.validators.MinValueValidator(1),
        django.core.validators.MaxValueValidator(10)
    ])
    is_active = models.BooleanField(_('is active'), default=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('Evento')
        verbose_name_plural = _('Eventos')
        ordering = ['tipo_evento', 'priority', 'name']

    def __str__(self):
        return f"{self.code} - {self.name}"


class Estrategia(models.Model):
    """
    Modelo para estrategias de trading
    """
    TIPO_ESTRATEGIA_CHOICES = [
        ('scalping', _('Scalping')),
        ('day_trading', _('Day Trading')),
        ('swing_trading', _('Swing Trading')),
        ('position_trading', _('Position Trading')),
        ('arbitrage', _('Arbitraje')),
        ('grid_trading', _('Grid Trading')),
        ('dca', _('Dollar Cost Averaging')),
        ('custom', _('Personalizada')),
    ]

    ESTADO_CHOICES = [
        ('draft', _('Borrador')),
        ('active', _('Activa')),
        ('paused', _('Pausada')),
        ('archived', _('Archivada')),
    ]

    name = models.CharField(_('name'), max_length=200)
    code = models.CharField(_('code'), max_length=50, unique=True)
    description = models.TextField(_('description'), blank=True)
    tipo_estrategia = models.CharField(_('strategy type'), max_length=20, choices=TIPO_ESTRATEGIA_CHOICES)
    estado = models.CharField(_('status'), max_length=20, choices=ESTADO_CHOICES, default='draft')
    max_risk_per_trade = models.DecimalField(
        _('max risk per trade (%)'),
        max_digits=5,
        decimal_places=2,
        default=Decimal('2.00'),
        validators=[
            django.core.validators.MinValueValidator(Decimal('0.01')),
            django.core.validators.MaxValueValidator(Decimal('100.00'))
        ]
    )
    max_drawdown = models.DecimalField(
        _('max drawdown (%)'),
        max_digits=5,
        decimal_places=2,
        default=Decimal('10.00'),
        validators=[
            django.core.validators.MinValueValidator(Decimal('0.01')),
            django.core.validators.MaxValueValidator(Decimal('100.00'))
        ]
    )
    timeframe = models.CharField(_('timeframe'), max_length=10, default='1h', help_text="Ej: 1m, 5m, 15m, 1h, 4h, 1d")
    is_public = models.BooleanField(_('is public'), default=False)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_strategies')
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('Estrategia')
        verbose_name_plural = _('Estrategias')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.code} - {self.name}"


# ============ TABLAS HIJA (RELACIONES) ============

class UsuarioEstrategiaCriptoactivo(models.Model):
    """
    Relación entre Usuario, Estrategia y Criptoactivo
    Representa qué estrategias usa cada usuario para qué criptoactivos
    """
    ESTADO_CHOICES = [
        ('active', _('Activa')),
        ('paused', _('Pausada')),
        ('stopped', _('Detenida')),
        ('backtesting', _('En Backtesting')),
    ]

    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='estrategias_criptoactivos')
    estrategia = models.ForeignKey(Estrategia, on_delete=models.CASCADE, related_name='usuarios_criptoactivos')
    criptoactivo = models.ForeignKey(Criptoactivo, on_delete=models.CASCADE, related_name='usuarios_estrategias')
    
    estado = models.CharField(_('status'), max_length=20, choices=ESTADO_CHOICES, default='active')
    capital_asignado = models.DecimalField(_('assigned capital'), max_digits=15, decimal_places=8, default=Decimal('0.00'))
    custom_risk_per_trade = models.DecimalField(_('custom risk per trade (%)'), max_digits=5, decimal_places=2, null=True, blank=True)
    fecha_inicio = models.DateTimeField(_('start date'), null=True, blank=True)
    fecha_fin = models.DateTimeField(_('end date'), null=True, blank=True)
    
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('Usuario Estrategia Criptoactivo')
        verbose_name_plural = _('Usuario Estrategias Criptoactivos')
        unique_together = [('usuario', 'estrategia', 'criptoactivo')]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.usuario.email} - {self.estrategia.code} - {self.criptoactivo.symbol}"


class DetalleEstrategia(models.Model):
    """
    Detalles específicos de cada estrategia
    """
    TIPO_DETALLE_CHOICES = [
        ('entry_rule', _('Regla de Entrada')),
        ('exit_rule', _('Regla de Salida')),
        ('risk_management', _('Gestión de Riesgo')),
        ('position_sizing', _('Tamaño de Posición')),
        ('filter', _('Filtro')),
        ('parameter', _('Parámetro')),
    ]

    estrategia = models.ForeignKey(Estrategia, on_delete=models.CASCADE, related_name='detalles')
    tipo_detalle = models.CharField(_('detail type'), max_length=20, choices=TIPO_DETALLE_CHOICES)
    name = models.CharField(_('name'), max_length=100)
    description = models.TextField(_('description'), blank=True)
    configuration = models.JSONField(_('configuration'), default=dict, help_text="Configuración específica en formato JSON")
    order = models.PositiveIntegerField(_('order'), default=1)
    is_active = models.BooleanField(_('is active'), default=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('Detalle de Estrategia')
        verbose_name_plural = _('Detalles de Estrategias')
        unique_together = [('estrategia', 'tipo_detalle', 'name')]
        ordering = ['estrategia', 'tipo_detalle', 'order']

    def __str__(self):
        return f"{self.estrategia.code} - {self.name}"


class EventoEstrategiaDetalle(models.Model):
    """
    Relación entre Eventos y Detalles de Estrategias
    Define qué eventos se usan en cada detalle de estrategia
    """
    evento = models.ForeignKey(Evento, on_delete=models.CASCADE, related_name='estrategia_detalles')
    detalle_estrategia = models.ForeignKey(DetalleEstrategia, on_delete=models.CASCADE, related_name='eventos')
    
    parameters = models.JSONField(_('parameters'), default=dict, help_text="Parámetros específicos del evento para este detalle")
    weight = models.DecimalField(
        _('weight'),
        max_digits=5,
        decimal_places=2,
        default=Decimal('1.00'),
        validators=[
            django.core.validators.MinValueValidator(Decimal('0.01')),
            django.core.validators.MaxValueValidator(Decimal('10.00'))
        ]
    )
    evaluation_order = models.PositiveIntegerField(_('evaluation order'), default=1)
    is_active = models.BooleanField(_('is active'), default=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('Evento Estrategia Detalle')
        verbose_name_plural = _('Eventos Estrategias Detalles')
        unique_together = [('evento', 'detalle_estrategia')]
        ordering = ['detalle_estrategia', 'evaluation_order']

    def __str__(self):
        return f"{self.detalle_estrategia.estrategia.code} - {self.evento.code}"


class IndicadorEvento(models.Model):
    """
    Relación entre Indicadores y Eventos
    Define qué indicadores se usan en cada evento
    """
    indicador = models.ForeignKey(Indicador, on_delete=models.CASCADE, related_name='eventos')
    evento = models.ForeignKey(Evento, on_delete=models.CASCADE, related_name='indicadores')
    
    parameters = models.JSONField(_('parameters'), default=dict, help_text="Parámetros específicos del indicador para este evento")
    threshold_value = models.DecimalField(
        _('threshold value'),
        max_digits=15,
        decimal_places=8,
        null=True,
        blank=True,
        help_text="Valor umbral para el indicador"
    )
    comparison_operator = models.CharField(
        _('comparison operator'),
        max_length=20,
        choices=[
            ('>', _('Mayor que')),
            ('<', _('Menor que')),
            ('>=', _('Mayor o igual que')),
            ('<=', _('Menor o igual que')),
            ('==', _('Igual a')),
            ('!=', _('Diferente de')),
            ('cross_above', _('Cruza por encima')),
            ('cross_below', _('Cruza por debajo')),
        ],
        default='>',
        help_text="Operador de comparación para evaluar el indicador"
    )
    weight = models.DecimalField(
        _('weight'),
        max_digits=5,
        decimal_places=2,
        default=Decimal('1.00'),
        validators=[
            django.core.validators.MinValueValidator(Decimal('0.01')),
            django.core.validators.MaxValueValidator(Decimal('10.00'))
        ]
    )
    evaluation_order = models.PositiveIntegerField(_('evaluation order'), default=1)
    is_active = models.BooleanField(_('is active'), default=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('Indicador Evento')
        verbose_name_plural = _('Indicadores Eventos')
        unique_together = [('indicador', 'evento')]
        ordering = ['evento', 'evaluation_order']

    def __str__(self):
        return f"{self.evento.code} - {self.indicador.code}"


# ============ RESULTADOS DE BACKTEST ============

class BacktestResult(models.Model):
    """
    Resultado persistido de un backtest corrido.
    `usuario` queda nullable porque las views actualmente aceptan AllowAny;
    cuando el request viene autenticado, se guarda quién lo corrió y queda
    disponible para gamificación / historial.
    """
    BACKTEST_TYPE_CHOICES = [
        ('demo',   _('Demo (parámetros fijos)')),
        ('custom', _('Personalizado')),
    ]

    usuario = models.ForeignKey(
        User, on_delete=models.SET_NULL, related_name='backtest_results',
        null=True, blank=True,
    )
    backtest_type = models.CharField(_('tipo'), max_length=10, choices=BACKTEST_TYPE_CHOICES)
    symbol      = models.CharField(_('símbolo'), max_length=20)
    timeframe   = models.CharField(_('timeframe'), max_length=10)
    fecha_inicio = models.CharField(_('fecha inicio del período'), max_length=20)
    fecha_fin    = models.CharField(_('fecha fin del período'), max_length=20)

    capital_inicial = models.DecimalField(_('capital inicial'), max_digits=18, decimal_places=4)
    capital_final   = models.DecimalField(_('capital final'),   max_digits=18, decimal_places=4)
    ganancia_perdida = models.DecimalField(_('PnL'),             max_digits=18, decimal_places=4)
    rentabilidad_porcentaje = models.DecimalField(_('rentabilidad %'), max_digits=10, decimal_places=4)

    operaciones_totales  = models.PositiveIntegerField(_('operaciones totales'),  default=0)
    operaciones_ganadas  = models.PositiveIntegerField(_('operaciones ganadas'),  default=0)
    operaciones_perdidas = models.PositiveIntegerField(_('operaciones perdidas'), default=0)
    tasa_acierto = models.DecimalField(_('tasa de acierto %'), max_digits=6, decimal_places=2, default=Decimal('0'))
    racha_perdidas  = models.PositiveIntegerField(_('racha de pérdidas'), default=0)
    velas_negativas = models.PositiveIntegerField(_('velas negativas'),   default=0)

    # Para gamificación. Si la estrategia no calcula sharpe/drawdown, queda null.
    sharpe_ratio = models.DecimalField(_('Sharpe ratio'),    max_digits=8, decimal_places=4, null=True, blank=True)
    max_drawdown = models.DecimalField(_('Max drawdown %'),  max_digits=8, decimal_places=4, null=True, blank=True)

    parametros = models.JSONField(_('parámetros utilizados'), default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Resultado de backtest')
        verbose_name_plural = _('Resultados de backtest')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['usuario', 'created_at']),
        ]

    def __str__(self):
        owner = self.usuario.email if self.usuario else 'anónimo'
        return f'{self.backtest_type} {self.symbol} @ {self.timeframe} — {owner}'