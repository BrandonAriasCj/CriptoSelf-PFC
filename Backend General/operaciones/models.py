from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
from decimal import Decimal
from backtesting.models import Criptoactivo


# ─── Tasas de costos simulados para Perú ───────────────────────────────────
# Representan los costos reales que tendría un usuario peruano en un exchange real.
# Se aplican solo a la simulación para fines educativos.
TRADING_FEE_RATE       = Decimal('0.001')   # 0.10% — fee estándar de exchange (ej. Binance)
CONVERSION_FEE_RATE    = Decimal('0.015')   # 1.50% — conversión PEN → USD (promedio bancos peruanos)
TOTAL_SIMULATED_FEE    = TRADING_FEE_RATE + CONVERSION_FEE_RATE  # 1.60% total


class Operacion(models.Model):
    """
    Modelo para registrar operaciones de compra/venta de criptoactivos.
    
    La comisión se calcula automáticamente en save() simulando los costos
    reales que enfrentaría un usuario peruano al operar en un exchange real:
      - Fee de exchange (trading fee): 0.10%
      - Conversión PEN → USD:         1.50%
      - Total simulado:                1.60% del monto_total
    """
    TIPO_OPERACION_CHOICES = [
        ('compra', _('Compra')),
        ('venta', _('Venta')),
    ]

    ESTADO_CHOICES = [
        ('completada', _('Completada')),
        ('pendiente', _('Pendiente')),
        ('cancelada', _('Cancelada')),
    ]

    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='operaciones')
    criptoactivo = models.ForeignKey(Criptoactivo, on_delete=models.CASCADE, related_name='operaciones')
    
    tipo_operacion = models.CharField(_('tipo de operación'), max_length=10, choices=TIPO_OPERACION_CHOICES)
    cantidad = models.DecimalField(_('cantidad'), max_digits=20, decimal_places=10, help_text="Cantidad de criptomonedas")
    precio_promedio = models.DecimalField(_('precio promedio'), max_digits=20, decimal_places=8, help_text="Precio en USD por unidad")
    monto_total = models.DecimalField(_('monto total'), max_digits=20, decimal_places=2, help_text="Total en USD (cantidad × precio)")
    comision = models.DecimalField(
        _('comisión simulada'),
        max_digits=20,
        decimal_places=8,
        default=0,
        help_text="Fee calculado automáticamente: 0.1% exchange + 1.5% conversión PEN→USD (solo simulación educativa)"
    )
    
    fecha_operacion = models.DateTimeField(_('fecha de operación'))
    estado = models.CharField(_('estado'), max_length=20, choices=ESTADO_CHOICES, default='completada')
    notas = models.TextField(_('notas'), blank=True)

    created_at = models.DateTimeField(_('creado el'), auto_now_add=True)
    updated_at = models.DateTimeField(_('actualizado el'), auto_now=True)

    class Meta:
        verbose_name = _('Operación')
        verbose_name_plural = _('Operaciones')
        ordering = ['-fecha_operacion']

    def save(self, *args, **kwargs):
        """
        Calcula automáticamente la comisión simulada antes de persistir.
        Representa los costos reales que tiene un usuario peruano al operar
        en exchanges de criptomonedas (fines educativos/simulación).
        """
        if self.monto_total and self.monto_total > 0:
            self.comision = Decimal(str(self.monto_total)) * TOTAL_SIMULATED_FEE
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.get_tipo_operacion_display()} {self.criptoactivo.symbol} - {self.cantidad}"
