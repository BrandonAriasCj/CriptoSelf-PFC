from decimal import Decimal
from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid


# ── Niveles ────────────────────────────────────────────────────────────────
# Thresholds en puntos por nivel (idx 0 = nivel 1, etc).
LEVEL_THRESHOLDS = [0, 500, 1500, 3000, 5500, 9000, 14000]
LEVEL_NAMES = ['Iniciado', 'Aprendiz', 'Operador', 'Trader', 'Estratega', 'Maestro']


def level_for_points(points: int) -> dict:
    level = 1
    for i in range(1, len(LEVEL_THRESHOLDS)):
        if points >= LEVEL_THRESHOLDS[i]:
            level = i + 1
    level = min(level, len(LEVEL_NAMES))
    current_min = LEVEL_THRESHOLDS[level - 1]
    next_min = LEVEL_THRESHOLDS[level] if level < len(LEVEL_THRESHOLDS) else current_min + 5000
    span = next_min - current_min if next_min > current_min else 1
    progress = max(0, min(100, int(round((points - current_min) / span * 100))))
    return {
        'level': level,
        'name': LEVEL_NAMES[level - 1],
        'points_to_next': max(0, next_min - points),
        'progress_percentage': progress,
    }


# ── Badge ───────────────────────────────────────────────────────────────────
class Badge(models.Model):
    """
    Insignia que un integrante puede ganar. Globales (organization=None)
    o custom de una organización.
    """
    RARITY_CHOICES = [
        ('common',    _('Común')),
        ('rare',      _('Raro')),
        ('epic',      _('Épico')),
        ('legendary', _('Legendario')),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='custom_badges',
        null=True, blank=True,
        help_text=_('NULL = badge global del sistema'),
    )
    name        = models.CharField(_('nombre'), max_length=80)
    description = models.CharField(_('descripción'), max_length=240)
    icon        = models.CharField(_('icono'), max_length=8, help_text=_('emoji o caracter'))
    rarity      = models.CharField(_('rareza'), max_length=12, choices=RARITY_CHOICES, default='common')
    criteria    = models.CharField(_('criterio en lenguaje humano'), max_length=240)
    is_system   = models.BooleanField(_('badge del sistema'), default=False)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Badge')
        verbose_name_plural = _('Badges')
        ordering = ['organization_id', 'rarity', 'name']

    def __str__(self):
        scope = self.organization.name if self.organization else 'global'
        return f'{self.icon} {self.name} ({scope})'


# ── Challenge ──────────────────────────────────────────────────────────────
class Challenge(models.Model):
    METRIC_CHOICES = [
        # Métricas de engagement / avance (recomendadas)
        ('trades',          _('Operaciones realizadas')),
        ('backtests',       _('Backtests realizados')),
        ('active_days',     _('Días activos')),
        ('streak_days',     _('Días consecutivos')),
        ('distinct_assets', _('Criptoactivos distintos operados')),
        ('win_rate',        _('Win Rate (%)')),
        ('sharpe_ratio',    _('Sharpe ratio')),
        # Monetarias (legacy, no recomendadas para gamificación de engagement)
        ('pnl',             _('PnL acumulado')),
        ('roi',             _('ROI')),
        ('custom',          _('Personalizado')),
    ]

    DIFFICULTY_CHOICES = [
        ('easy',   _('Fácil')),
        ('medium', _('Medio')),
        ('hard',   _('Difícil')),
        ('epic',   _('Épico')),
    ]

    STATUS_CHOICES = [
        ('draft',     _('Borrador')),
        ('active',    _('Activo')),
        ('completed', _('Completado')),
        ('archived',  _('Archivado')),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='challenges',
    )
    name         = models.CharField(_('nombre'), max_length=120)
    description  = models.TextField(_('descripción'), blank=True)
    metric       = models.CharField(_('métrica'), max_length=20, choices=METRIC_CHOICES)
    target_value = models.DecimalField(_('valor objetivo'), max_digits=18, decimal_places=4)
    unit         = models.CharField(_('unidad'), max_length=20, blank=True)
    reward_points = models.PositiveIntegerField(_('puntos de recompensa'), default=0)
    reward_badge  = models.ForeignKey(
        Badge, on_delete=models.SET_NULL, related_name='reward_in_challenges',
        null=True, blank=True,
    )
    difficulty = models.CharField(_('dificultad'), max_length=10, choices=DIFFICULTY_CHOICES, default='medium')
    status     = models.CharField(_('estado'), max_length=12, choices=STATUS_CHOICES, default='draft')
    is_global  = models.BooleanField(_('asignar a toda la org'), default=True)

    start_date = models.DateTimeField(_('fecha inicio'))
    end_date   = models.DateTimeField(_('fecha fin'))

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name='created_challenges',
        null=True, blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Reto')
        verbose_name_plural = _('Retos')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization', 'status']),
            models.Index(fields=['status', 'end_date']),
        ]

    def __str__(self):
        return f'{self.name} ({self.organization.name})'

    def is_currently_active(self) -> bool:
        from django.utils import timezone
        now = timezone.now()
        return self.status == 'active' and self.start_date <= now <= self.end_date


# ── ChallengeAssignment ────────────────────────────────────────────────────
class ChallengeAssignment(models.Model):
    """
    Participación de un integrante en un reto.
    Se crea automáticamente para retos `is_global` o vía endpoint de asignación.
    """
    STATUS_CHOICES = [
        ('in_progress', _('En progreso')),
        ('completed',   _('Completado')),
        ('failed',      _('No completado')),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    challenge = models.ForeignKey(
        Challenge, on_delete=models.CASCADE,
        related_name='assignments',
    )
    member = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='challenge_assignments',
    )
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='challenge_assignments',
    )
    current_value       = models.DecimalField(_('valor actual'), max_digits=18, decimal_places=4, default=Decimal('0'))
    progress_percentage = models.DecimalField(_('progreso %'), max_digits=6, decimal_places=2, default=Decimal('0'),
                                              validators=[MinValueValidator(0), MaxValueValidator(100)])
    status     = models.CharField(_('estado'), max_length=12, choices=STATUS_CHOICES, default='in_progress')
    completed_at = models.DateTimeField(_('completado en'), null=True, blank=True)
    last_evaluated_at = models.DateTimeField(_('última evaluación'), null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('Asignación de reto')
        verbose_name_plural = _('Asignaciones de retos')
        unique_together = ('challenge', 'member')
        ordering = ['-progress_percentage', 'created_at']
        indexes = [
            models.Index(fields=['member', 'status']),
            models.Index(fields=['challenge', 'status']),
        ]

    def __str__(self):
        return f'{self.member.email} → {self.challenge.name} ({self.progress_percentage}%)'


# ── MemberBadge ────────────────────────────────────────────────────────────
class MemberBadge(models.Model):
    """Badge otorgado a un integrante en el contexto de una organización."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    member = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='earned_badges',
    )
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE, related_name='member_awards')
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='member_badges',
    )
    challenge = models.ForeignKey(
        Challenge, on_delete=models.SET_NULL, related_name='awards',
        null=True, blank=True,
        help_text=_('Reto que originó el otorgamiento, si aplica'),
    )
    awarded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Badge de integrante')
        verbose_name_plural = _('Badges de integrantes')
        unique_together = ('member', 'badge', 'organization')
        ordering = ['-awarded_at']

    def __str__(self):
        return f'{self.member.email} ← {self.badge.name}'


# ── PointsTransaction ──────────────────────────────────────────────────────
class PointsTransaction(models.Model):
    """Audit trail de cada cambio de puntos. Sumar todas = total_points."""
    SOURCE_CHOICES = [
        ('challenge_completion', _('Reto completado')),
        ('badge_award',          _('Badge otorgado')),
        ('manual_adjustment',    _('Ajuste manual')),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    member = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='points_transactions',
    )
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='points_transactions',
    )
    points = models.IntegerField(_('puntos (+/-)'))
    source = models.CharField(_('origen'), max_length=24, choices=SOURCE_CHOICES)
    reference_id = models.CharField(_('referencia (uuid)'), max_length=40, blank=True)
    description  = models.CharField(_('descripción'), max_length=200, blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Transacción de puntos')
        verbose_name_plural = _('Transacciones de puntos')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['member', 'organization']),
        ]

    def __str__(self):
        sign = '+' if self.points >= 0 else ''
        return f'{self.member.email}: {sign}{self.points} pts ({self.source})'


# ── MemberGamificationProfile ──────────────────────────────────────────────
class MemberGamificationProfile(models.Model):
    """
    Stats agregados de gamificación por (miembro, organización).
    `total_points` se mantiene como contador denormalizado; auditoría en PointsTransaction.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    member = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='gamification_profiles',
    )
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='gamification_profiles',
    )
    total_points       = models.PositiveIntegerField(_('puntos totales'), default=0)
    current_streak_days = models.PositiveIntegerField(_('racha actual (días)'), default=0)
    longest_streak_days = models.PositiveIntegerField(_('racha más larga'), default=0)
    last_activity_date  = models.DateField(_('última actividad'), null=True, blank=True)
    challenges_completed = models.PositiveIntegerField(_('retos completados'), default=0)
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('Perfil de gamificación')
        verbose_name_plural = _('Perfiles de gamificación')
        unique_together = ('member', 'organization')
        ordering = ['-total_points']

    def __str__(self):
        return f'{self.member.email} @ {self.organization.name}: {self.total_points} pts'

    @property
    def level_info(self) -> dict:
        return level_for_points(self.total_points)

    def add_points(self, amount: int, source: str, description: str = '', reference_id: str = ''):
        """Suma puntos atómicamente y crea PointsTransaction."""
        from django.db import transaction
        with transaction.atomic():
            PointsTransaction.objects.create(
                member=self.member,
                organization=self.organization,
                points=amount,
                source=source,
                reference_id=reference_id,
                description=description,
            )
            # Recargar y actualizar
            type(self).objects.filter(pk=self.pk).update(
                total_points=models.F('total_points') + amount
            )
            self.refresh_from_db(fields=['total_points'])
