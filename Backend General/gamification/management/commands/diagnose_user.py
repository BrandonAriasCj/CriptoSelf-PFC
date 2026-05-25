"""
Diagnóstico: muestra todo el estado de gamificación de un usuario.

Uso:
    python manage.py diagnose_user --email usuario.web@ejemplo.com
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone

from operaciones.models import Operacion
from backtesting.models import BacktestResult
from student_management.models import StudentEnrollment
from gamification.models import (
    Challenge, ChallengeAssignment, MemberBadge,
    MemberGamificationProfile,
)
from gamification.tasks import _value_for_metric

User = get_user_model()


class Command(BaseCommand):
    help = 'Imprime el estado de gamificación de un user para diagnosticar.'

    def add_arguments(self, parser):
        parser.add_argument('--email', required=True)

    def handle(self, *args, **opts):
        try:
            u = User.objects.get(email__iexact=opts['email'])
        except User.DoesNotExist:
            self.stderr.write(self.style.ERROR(f"No existe user {opts['email']}"))
            return

        out = self.stdout
        line = lambda s='': out.write(s)
        h = lambda s: out.write(self.style.MIGRATE_HEADING(f'\n── {s} ─────────────────────'))

        h(f'USER {u.email}  id={u.pk}  profile_type={getattr(u, "profile_type", "—")}')

        h('Operaciones')
        ops = Operacion.objects.filter(usuario=u).order_by('-fecha_operacion')
        line(f'  Total: {ops.count()}  |  Completadas: {ops.filter(estado="completada").count()}')
        for o in ops[:10]:
            line(f'   · {o.fecha_operacion:%Y-%m-%d %H:%M} {o.tipo_operacion} {o.criptoactivo.symbol} estado={o.estado}')

        h('Backtests')
        bts = BacktestResult.objects.filter(usuario=u).order_by('-created_at')
        line(f'  Total: {bts.count()}')
        for b in bts[:5]:
            line(f'   · {b.created_at:%Y-%m-%d %H:%M} {b.symbol} {b.backtest_type}')

        h('Enrollments (membresías a organizaciones)')
        ens = StudentEnrollment.objects.filter(student=u)
        line(f'  Total: {ens.count()}')
        for e in ens:
            line(f'   · org={e.organization.name} ({e.organization.id})  status={e.status}')

        h('Asignaciones de retos')
        ass = ChallengeAssignment.objects.filter(member=u).select_related('challenge')
        if not ass.exists():
            line('  ⚠ Sin asignaciones. El user no tiene ningún reto.')
        for a in ass:
            ch = a.challenge
            now = timezone.now()
            window_ok = ch.start_date <= now <= ch.end_date
            calc = _value_for_metric(u, ch.metric, ch.start_date, ch.end_date)
            line(f'   · "{ch.name}"  metric={ch.metric}  target={ch.target_value} {ch.unit}')
            line(f'       challenge.status={ch.status}  ventana_ok={window_ok}')
            line(f'       assignment.status={a.status}  progreso={a.progress_percentage}%  current={a.current_value}')
            line(f'       valor_recalculado_AHORA={calc}')
            if a.status == 'in_progress' and ch.status == 'active' and window_ok:
                expected = float(calc) / float(ch.target_value) * 100 if float(ch.target_value) > 0 else 0
                line(self.style.WARNING(f'       → debería avanzar a {expected:.1f}%'))

        h('Perfiles de gamificación')
        profs = MemberGamificationProfile.objects.filter(member=u)
        for p in profs:
            line(f'   · org={p.organization.name}  pts={p.total_points}  retos_completados={p.challenges_completed}')

        h('Retos activos en sus organizaciones')
        org_ids = ens.values_list('organization_id', flat=True)
        for org_id in org_ids:
            chs = Challenge.objects.filter(organization_id=org_id, status='active')
            line(f'  Org {org_id}:')
            for ch in chs:
                has_ass = ChallengeAssignment.objects.filter(challenge=ch, member=u).exists()
                tag = '✓' if has_ass else '✗ SIN ASIGNAR'
                line(f'    {tag} "{ch.name}"  is_global={ch.is_global}  metric={ch.metric}')

        line('\nListo.')
