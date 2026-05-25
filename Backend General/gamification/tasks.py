"""
Tasks Celery para gamificación.

`evaluate_challenges` recorre todos los retos activos y recalcula el progreso
de cada ChallengeAssignment a partir de Operacion y BacktestResult. Cuando un
asignación alcanza el 100%, otorga puntos y badge.

Schedule sugerido (en backend/celery.py): cada 5 minutos.
"""
from decimal import Decimal
from celery import shared_task
from django.db.models import Sum, Count, F
from django.utils import timezone

from operaciones.models import Operacion
from backtesting.models import BacktestResult
from .models import (
    Challenge, ChallengeAssignment, MemberBadge,
    MemberGamificationProfile,
)


def _activity_dates(user, start, end):
    """Set de date() distintos donde el user tuvo actividad (ops o backtests)."""
    ops = Operacion.objects.filter(
        usuario=user, estado='completada',
        fecha_operacion__gte=start, fecha_operacion__lte=end,
    ).values_list('fecha_operacion', flat=True)
    bts = BacktestResult.objects.filter(
        usuario=user, created_at__gte=start, created_at__lte=end,
    ).values_list('created_at', flat=True)
    return {d.date() for d in ops} | {d.date() for d in bts}


def _longest_streak(dates: set) -> int:
    """Días consecutivos más largos en un set de fechas."""
    if not dates:
        return 0
    sorted_dates = sorted(dates)
    longest = current = 1
    for prev, curr in zip(sorted_dates, sorted_dates[1:]):
        if (curr - prev).days == 1:
            current += 1
            longest = max(longest, current)
        else:
            current = 1
    return longest


def _value_for_metric(user, metric, start, end):
    """Calcula el valor actual de la métrica para un user en [start, end]."""
    if metric == 'trades':
        return Decimal(Operacion.objects.filter(
            usuario=user, estado='completada',
            fecha_operacion__gte=start, fecha_operacion__lte=end,
        ).count())

    if metric == 'backtests':
        return Decimal(BacktestResult.objects.filter(
            usuario=user, created_at__gte=start, created_at__lte=end,
        ).count())

    if metric == 'active_days':
        return Decimal(len(_activity_dates(user, start, end)))

    if metric == 'streak_days':
        return Decimal(_longest_streak(_activity_dates(user, start, end)))

    if metric == 'distinct_assets':
        return Decimal(Operacion.objects.filter(
            usuario=user, estado='completada',
            fecha_operacion__gte=start, fecha_operacion__lte=end,
        ).values('criptoactivo_id').distinct().count())

    if metric == 'win_rate':
        agg = BacktestResult.objects.filter(
            usuario=user, created_at__gte=start, created_at__lte=end,
        ).aggregate(w=Sum('operaciones_ganadas'), l=Sum('operaciones_perdidas'))
        wins = agg['w'] or 0
        losses = agg['l'] or 0
        total = wins + losses
        return Decimal(wins) / Decimal(total) * Decimal(100) if total else Decimal('0')

    if metric == 'sharpe_ratio':
        best = (BacktestResult.objects.filter(
            usuario=user, created_at__gte=start, created_at__lte=end,
            sharpe_ratio__isnull=False,
        ).order_by('-sharpe_ratio').values_list('sharpe_ratio', flat=True).first())
        return best or Decimal('0')

    # Legacy monetarias (PnL/ROI) — se mantienen por compatibilidad pero no son
    # recomendadas para retos de engagement.
    if metric == 'pnl':
        agg = BacktestResult.objects.filter(
            usuario=user, created_at__gte=start, created_at__lte=end,
        ).aggregate(s=Sum('ganancia_perdida'))
        return agg['s'] or Decimal('0')

    if metric == 'roi':
        agg = BacktestResult.objects.filter(
            usuario=user, created_at__gte=start, created_at__lte=end,
        ).aggregate(s=Sum('rentabilidad_porcentaje'), c=Count('id'))
        if not agg['c']:
            return Decimal('0')
        return (agg['s'] or Decimal('0')) / Decimal(agg['c'])

    return Decimal('0')


def _award(assignment: ChallengeAssignment):
    """Otorga puntos y badge si corresponde, y marca completed."""
    challenge = assignment.challenge
    profile, _ = MemberGamificationProfile.objects.get_or_create(
        member=assignment.member,
        organization=assignment.organization,
    )

    # Puntos
    if challenge.reward_points:
        profile.add_points(
            challenge.reward_points,
            source='challenge_completion',
            description=f'Completó reto «{challenge.name}»',
            reference_id=str(challenge.id),
        )

    # Badge
    if challenge.reward_badge_id:
        MemberBadge.objects.get_or_create(
            member=assignment.member,
            badge_id=challenge.reward_badge_id,
            organization=assignment.organization,
            defaults={'challenge': challenge},
        )

    # Incrementar challenges_completed del perfil
    MemberGamificationProfile.objects.filter(pk=profile.pk).update(
        challenges_completed=F('challenges_completed') + 1,
    )


def _evaluate_assignment(a: ChallengeAssignment, now=None):
    """Recalcula una asignación específica. Otorga premio si llega a 100%."""
    now = now or timezone.now()
    challenge = a.challenge
    value = _value_for_metric(a.member, challenge.metric,
                              challenge.start_date, challenge.end_date)
    target = Decimal(challenge.target_value)
    progress = Decimal('0') if target == 0 else min(
        Decimal('100'), (Decimal(value) / target * Decimal(100)).quantize(Decimal('0.01'))
    )
    a.current_value = value
    a.progress_percentage = progress
    a.last_evaluated_at = now
    if progress >= Decimal('100'):
        a.status = 'completed'
        a.completed_at = now
        a.save()
        _award(a)
        return True
    a.save(update_fields=['current_value', 'progress_percentage', 'last_evaluated_at'])
    return False


def evaluate_for_user(user):
    """
    Evalúa SOLO los retos activos asignados al user dado.
    Pensado para invocarse desde signals (post_save Operacion / BacktestResult).
    """
    now = timezone.now()
    assignments = (ChallengeAssignment.objects
                   .filter(member=user, status='in_progress',
                           challenge__status='active',
                           challenge__start_date__lte=now,
                           challenge__end_date__gte=now)
                   .select_related('challenge'))
    completed = 0
    for a in assignments:
        if _evaluate_assignment(a, now):
            completed += 1
    return completed


@shared_task(name='gamification.evaluate_challenges')
def evaluate_challenges():
    """
    Recorre retos activos globales y recalcula progreso de todos los assignments.
    Útil como fallback periódico (Celery beat). Para feedback inmediato,
    `evaluate_for_user` se llama desde signals de Operacion y BacktestResult.
    """
    now = timezone.now()
    active = Challenge.objects.filter(
        status='active', start_date__lte=now, end_date__gte=now,
    )
    evaluated = completed = 0
    for challenge in active.iterator():
        assignments = ChallengeAssignment.objects.filter(
            challenge=challenge, status='in_progress',
        ).select_related('member')
        for a in assignments:
            if _evaluate_assignment(a, now):
                completed += 1
            evaluated += 1
        # Marcar retos vencidos sin completar como failed
        ChallengeAssignment.objects.filter(
            challenge=challenge, status='in_progress',
        ).filter(challenge__end_date__lt=now).update(status='failed')
    return {'evaluated': evaluated, 'completed': completed}
