"""
Signals de gamificación.

Cuando un usuario se inscribe a una organización (StudentEnrollment.post_save):
  - Le creamos ChallengeAssignment para cada reto global activo de esa org.
  - Aseguramos su MemberGamificationProfile.
"""
import logging
from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

from student_management.models import StudentEnrollment
from operaciones.models import Operacion
from backtesting.models import BacktestResult
from .models import Challenge, ChallengeAssignment, MemberGamificationProfile

_log = logging.getLogger(__name__)


def _safe_evaluate_after_commit(user):
    """Defer la evaluación hasta después del commit del request actual.

    Esto evita que un error dentro del evaluador (ej. transacciones rotas
    por nested atomic) rompa el guardado de la Operacion/BacktestResult
    que disparó el signal.
    """
    def _run():
        try:
            from .tasks import evaluate_for_user
            evaluate_for_user(user)
        except Exception:
            _log.exception('evaluate_for_user falló para %s', user)
    try:
        transaction.on_commit(_run)
    except Exception:
        _log.exception('No se pudo programar evaluate_for_user')


@receiver(post_save, sender=StudentEnrollment)
def assign_active_global_challenges(sender, instance, created, **kwargs):
    """Al inscribir un miembro, lo enrolamos en los retos globales activos."""
    if not created:
        return
    if instance.status not in ('active', 'enrolled'):
        return

    org = instance.organization
    user = instance.student

    # Profile vacío para que aparezca en leaderboard con 0 pts.
    MemberGamificationProfile.objects.get_or_create(member=user, organization=org)

    now = timezone.now()
    active_globals = Challenge.objects.filter(
        organization=org, status='active', is_global=True,
        start_date__lte=now, end_date__gte=now,
    )
    existing = set(ChallengeAssignment.objects
                   .filter(member=user, challenge__in=active_globals)
                   .values_list('challenge_id', flat=True))
    to_create = [
        ChallengeAssignment(challenge=ch, member=user, organization=org)
        for ch in active_globals if ch.id not in existing
    ]
    if to_create:
        ChallengeAssignment.objects.bulk_create(to_create)


@receiver(post_save, sender=Operacion)
def evaluate_on_operation(sender, instance, created, **kwargs):
    """Cuando un user crea/actualiza una operación, re-evalúa sus retos."""
    if not instance.usuario_id or instance.estado != 'completada':
        return
    _safe_evaluate_after_commit(instance.usuario)


@receiver(post_save, sender=BacktestResult)
def evaluate_on_backtest(sender, instance, created, **kwargs):
    """Cuando un user corre un backtest persistido, re-evalúa sus retos."""
    if not instance.usuario_id:
        return
    _safe_evaluate_after_commit(instance.usuario)
