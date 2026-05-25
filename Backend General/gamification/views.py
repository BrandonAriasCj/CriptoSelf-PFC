"""
Views de gamificación.

Convenciones:
- Endpoints de empresa viven bajo /api/enterprise/organizations/<org_id>/...
- Endpoints de usuario web viven bajo /api/me/... (en otro archivo de urls).
- Para acciones de empresa se verifica que el request.user es admin de la org
  vía la relación `Organization.admins`.
"""
from decimal import Decimal
from django.db.models import Sum, Count, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from oauth2_provider.contrib.rest_framework import TokenHasScope

from organizations.models import Organization
from student_management.models import StudentEnrollment
from operaciones.models import Operacion
from backtesting.models import BacktestResult

from .models import (
    Badge, Challenge, ChallengeAssignment, MemberBadge,
    MemberGamificationProfile, PointsTransaction, level_for_points,
)
from .serializers import (
    BadgeSerializer, BadgeCreateSerializer,
    ChallengeSerializer, ChallengeCreateSerializer,
    ChallengeAssignmentSerializer,
    LeaderboardEntrySerializer, MemberStatsSerializer,
    TeamRecordSerializer, AssignChallengeRequestSerializer,
)


# ── Helpers ────────────────────────────────────────────────────────────────
def _assert_org_admin(user, organization):
    """Lanza 403 si el user no es admin de la organización."""
    if user.is_superuser:
        return
    if not organization.admins.filter(user=user).exists():
        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied('No sos administrador de esta organización.')


def _members_of_org(org):
    """Usuarios activos que tienen al menos un enrollment vigente en la org."""
    user_ids = StudentEnrollment.objects.filter(
        organization=org,
        status__in=['active', 'enrolled'],
    ).values_list('student_id', flat=True).distinct()
    from django.contrib.auth import get_user_model
    User = get_user_model()
    return User.objects.filter(id__in=user_ids)


def _build_member_stats_payload(user, organization):
    """Arma el dict que MemberStatsSerializer espera para un miembro dado."""
    profile, _ = MemberGamificationProfile.objects.get_or_create(
        member=user, organization=organization,
    )
    lvl = level_for_points(profile.total_points)
    badges = list(
        MemberBadge.objects.filter(member=user, organization=organization)
        .select_related('badge')
    )
    # Métricas trading agregadas (independientes de la org — el usuario es el mismo).
    ops_qs = Operacion.objects.filter(usuario=user, estado='completada')
    total_trades = ops_qs.count()
    backtest_qs = BacktestResult.objects.filter(usuario=user)
    total_backtests = backtest_qs.count()
    total_pnl = backtest_qs.aggregate(s=Sum('ganancia_perdida'))['s'] or Decimal('0')
    # win_rate aproximado desde backtests (promedio ponderado de tasa_acierto)
    if total_backtests:
        agg = backtest_qs.aggregate(
            wins=Sum('operaciones_ganadas'),
            losses=Sum('operaciones_perdidas'),
        )
        wins = agg['wins'] or 0
        losses = agg['losses'] or 0
        total = wins + losses
        win_rate = round(Decimal(wins) / Decimal(total) * 100, 2) if total else Decimal('0')
    else:
        win_rate = Decimal('0')

    challenges_completed = profile.challenges_completed
    challenges_in_progress = ChallengeAssignment.objects.filter(
        member=user, organization=organization, status='in_progress',
    ).count()

    return {
        'member_id': user.pk,
        'member_name': (user.get_full_name() or '').strip() or user.username or user.email,
        'member_email': user.email,
        'total_points': profile.total_points,
        'level': lvl['level'],
        'level_name': lvl['name'],
        'points_to_next_level': lvl['points_to_next'],
        'level_progress_percentage': lvl['progress_percentage'],
        'current_streak_days': profile.current_streak_days,
        'longest_streak_days': profile.longest_streak_days,
        'badges': badges,
        'challenges_completed': challenges_completed,
        'challenges_in_progress': challenges_in_progress,
        'total_pnl': total_pnl,
        'win_rate': win_rate,
        'total_trades': total_trades,
        'total_backtests': total_backtests,
    }


# ── Challenges (CRUD) ─────────────────────────────────────────────────────
class OrgChallengeListCreateView(generics.ListCreateAPIView):
    permission_classes = [TokenHasScope]
    required_scopes = ['read', 'write']

    def get_serializer_class(self):
        return ChallengeCreateSerializer if self.request.method == 'POST' else ChallengeSerializer

    def _get_org(self):
        org = get_object_or_404(Organization, id=self.kwargs['organization_id'])
        _assert_org_admin(self.request.user, org)
        return org

    def get_queryset(self):
        org = self._get_org()
        qs = Challenge.objects.filter(organization=org).prefetch_related('assignments')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    def perform_create(self, serializer):
        org = self._get_org()
        challenge = serializer.save(organization=org, created_by=self.request.user)
        # Si es global y activo, auto-crear assignments para todos los miembros.
        if challenge.is_global and challenge.status == 'active':
            _ensure_global_assignments(challenge)


class ChallengeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Challenge.objects.all().prefetch_related('assignments')
    permission_classes = [TokenHasScope]
    required_scopes = ['read', 'write']
    lookup_url_kwarg = 'challenge_id'

    def get_serializer_class(self):
        return ChallengeCreateSerializer if self.request.method in ('PATCH', 'PUT') else ChallengeSerializer

    def get_object(self):
        challenge = super().get_object()
        _assert_org_admin(self.request.user, challenge.organization)
        return challenge


@api_view(['POST'])
@permission_classes([TokenHasScope])
def publish_challenge(request, challenge_id):
    """Cambia status del reto (publish/archive/draft) — body: {action}."""
    challenge = get_object_or_404(Challenge, id=challenge_id)
    _assert_org_admin(request.user, challenge.organization)
    action = request.data.get('action')
    mapping = {'publish': 'active', 'archive': 'archived', 'draft': 'draft'}
    if action not in mapping:
        return Response({'error': 'action inválido'}, status=400)
    challenge.status = mapping[action]
    challenge.save(update_fields=['status', 'updated_at'])
    if mapping[action] == 'active' and challenge.is_global:
        _ensure_global_assignments(challenge)
    return Response(ChallengeSerializer(challenge).data)


def _ensure_global_assignments(challenge: Challenge):
    """Crea ChallengeAssignment para cada miembro activo de la org si falta."""
    members = _members_of_org(challenge.organization)
    existing = set(
        ChallengeAssignment.objects.filter(challenge=challenge)
        .values_list('member_id', flat=True)
    )
    to_create = [
        ChallengeAssignment(
            challenge=challenge,
            member=m,
            organization=challenge.organization,
        )
        for m in members if m.id not in existing
    ]
    if to_create:
        ChallengeAssignment.objects.bulk_create(to_create)


# ── Challenge assignments ──────────────────────────────────────────────────
class ChallengeAssignmentsView(APIView):
    """GET: lista participantes con su progreso."""
    permission_classes = [TokenHasScope]
    required_scopes = ['read']

    def get(self, request, challenge_id):
        challenge = get_object_or_404(Challenge, id=challenge_id)
        _assert_org_admin(request.user, challenge.organization)
        assignments = list(
            ChallengeAssignment.objects.filter(challenge=challenge)
            .select_related('member')
            .order_by('-progress_percentage', 'created_at')
        )
        ranks = {str(a.id): idx + 1 for idx, a in enumerate(assignments)}
        ser = ChallengeAssignmentSerializer(
            assignments, many=True, context={'ranks': ranks}
        )
        return Response(ser.data)


@api_view(['POST'])
@permission_classes([TokenHasScope])
def assign_challenge(request, challenge_id):
    """Asigna un reto no-global a una lista de miembros."""
    challenge = get_object_or_404(Challenge, id=challenge_id)
    _assert_org_admin(request.user, challenge.organization)
    ser = AssignChallengeRequestSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    member_ids = ser.validated_data['member_ids']
    # Solo aceptamos miembros que ya tienen enrollment en la org.
    valid_ids = set(
        StudentEnrollment.objects
        .filter(organization=challenge.organization, student_id__in=member_ids)
        .values_list('student_id', flat=True)
    )
    existing = set(
        ChallengeAssignment.objects.filter(challenge=challenge)
        .values_list('member_id', flat=True)
    )
    to_create = [
        ChallengeAssignment(challenge=challenge, member_id=mid, organization=challenge.organization)
        for mid in valid_ids if mid not in existing
    ]
    ChallengeAssignment.objects.bulk_create(to_create)
    return Response({
        'assigned': len(to_create),
        'skipped': len(member_ids) - len(to_create),
    }, status=201)


# ── Leaderboard / Stats / Records ──────────────────────────────────────────
class OrgLeaderboardView(APIView):
    permission_classes = [TokenHasScope]
    required_scopes = ['read']

    def get(self, request, organization_id):
        org = get_object_or_404(Organization, id=organization_id)
        _assert_org_admin(request.user, org)

        members = list(_members_of_org(org))
        profiles = {
            p.member_id: p for p in
            MemberGamificationProfile.objects.filter(organization=org, member__in=members)
        }
        # Asegurar profile para todos
        for m in members:
            if m.id not in profiles:
                profile = MemberGamificationProfile.objects.create(member=m, organization=org)
                profiles[m.id] = profile

        badges_count = dict(
            MemberBadge.objects.filter(organization=org, member__in=members)
            .values('member_id').annotate(c=Count('id'))
            .values_list('member_id', 'c')
        )

        entries = []
        for m in members:
            p = profiles[m.id]
            lvl = level_for_points(p.total_points)
            entries.append({
                'member_id': m.pk,
                'member_name': (m.get_full_name() or '').strip() or m.username or m.email,
                'member_email': m.email,
                'total_points': p.total_points,
                'level': lvl['level'],
                'level_name': lvl['name'],
                'badges_count': badges_count.get(m.id, 0),
                'current_streak_days': p.current_streak_days,
                'rank_change': None,
            })
        entries.sort(key=lambda e: (-e['total_points'], e['member_id']))
        for i, e in enumerate(entries):
            e['rank'] = i + 1

        return Response(LeaderboardEntrySerializer(entries, many=True).data)


class OrgMemberStatsView(APIView):
    permission_classes = [TokenHasScope]
    required_scopes = ['read']

    def get(self, request, organization_id):
        org = get_object_or_404(Organization, id=organization_id)
        _assert_org_admin(request.user, org)
        members = list(_members_of_org(org))
        stats_payloads = [_build_member_stats_payload(u, org) for u in members]
        stats_payloads.sort(key=lambda s: -s['total_points'])
        for i, s in enumerate(stats_payloads):
            s['rank'] = i + 1
        return Response(MemberStatsSerializer(stats_payloads, many=True).data)


class OrgRecordsView(APIView):
    """Records computados al vuelo a partir de BacktestResult y Operacion."""
    permission_classes = [TokenHasScope]
    required_scopes = ['read']

    def get(self, request, organization_id):
        org = get_object_or_404(Organization, id=organization_id)
        _assert_org_admin(request.user, org)
        members = list(_members_of_org(org))
        member_ids = [m.id for m in members]
        if not member_ids:
            return Response([])

        # 1. Best PnL acumulado (suma de backtests)
        best_pnl = (
            BacktestResult.objects.filter(usuario_id__in=member_ids)
            .values('usuario_id').annotate(total=Sum('ganancia_perdida'))
            .order_by('-total').first()
        )
        # 2. Más trades (operaciones completadas)
        most_trades = (
            Operacion.objects.filter(usuario_id__in=member_ids, estado='completada')
            .values('usuario_id').annotate(c=Count('id'))
            .order_by('-c').first()
        )
        # 3. Mejor win-rate (entre quienes hicieron ≥20 trades acumulados en backtests)
        best_wr = (
            BacktestResult.objects.filter(usuario_id__in=member_ids)
            .values('usuario_id')
            .annotate(w=Sum('operaciones_ganadas'), l=Sum('operaciones_perdidas'))
        )
        wr_winner = None
        wr_value = Decimal('0')
        for row in best_wr:
            total = (row['w'] or 0) + (row['l'] or 0)
            if total >= 20:
                rate = Decimal(row['w'] or 0) / Decimal(total) * 100
                if rate > wr_value:
                    wr_value = rate
                    wr_winner = row['usuario_id']
        # 4. Racha más larga (longest_streak en MemberGamificationProfile)
        longest_streak = (
            MemberGamificationProfile.objects
            .filter(organization=org, member_id__in=member_ids)
            .order_by('-longest_streak_days').first()
        )

        records = []
        user_map = {m.id: m for m in members}

        def _user_label(uid):
            u = user_map.get(uid)
            return (u.get_full_name() or '').strip() or u.username or u.email if u else 'N/A'

        now = timezone.now()
        if best_pnl and best_pnl['total'] is not None:
            records.append({
                'id': 'best_pnl',
                'category': 'best_pnl',
                'category_label': 'Mejor PnL acumulado',
                'member_id': best_pnl['usuario_id'],
                'member_name': _user_label(best_pnl['usuario_id']),
                'value': best_pnl['total'],
                'unit': 'USD',
                'achieved_at': now,
                'icon': '💰',
            })
        if longest_streak and longest_streak.longest_streak_days:
            records.append({
                'id': 'longest_streak',
                'category': 'longest_streak',
                'category_label': 'Racha más larga',
                'member_id': longest_streak.member_id,
                'member_name': _user_label(longest_streak.member_id),
                'value': Decimal(longest_streak.longest_streak_days),
                'unit': 'días',
                'achieved_at': now,
                'icon': '🔥',
            })
        if most_trades and most_trades['c']:
            records.append({
                'id': 'most_trades',
                'category': 'most_trades',
                'category_label': 'Más operaciones',
                'member_id': most_trades['usuario_id'],
                'member_name': _user_label(most_trades['usuario_id']),
                'value': Decimal(most_trades['c']),
                'unit': 'trades',
                'achieved_at': now,
                'icon': '⚡',
            })
        if wr_winner is not None:
            records.append({
                'id': 'highest_win_rate',
                'category': 'highest_win_rate',
                'category_label': 'Mayor win rate (20+ ops)',
                'member_id': wr_winner,
                'member_name': _user_label(wr_winner),
                'value': wr_value.quantize(Decimal('0.01')),
                'unit': '%',
                'achieved_at': now,
                'icon': '🎯',
            })

        return Response(TeamRecordSerializer(records, many=True).data)


# ── Badges (visibles para la org) ──────────────────────────────────────────
class OrgBadgesView(generics.ListCreateAPIView):
    """GET: badges globales + custom de la org. POST: crear badge custom."""
    permission_classes = [TokenHasScope]
    required_scopes = ['read', 'write']

    def get_serializer_class(self):
        return BadgeCreateSerializer if self.request.method == 'POST' else BadgeSerializer

    def _get_org(self):
        org = get_object_or_404(Organization, id=self.kwargs['organization_id'])
        _assert_org_admin(self.request.user, org)
        return org

    def get_queryset(self):
        org = self._get_org()
        return Badge.objects.filter(Q(organization=org) | Q(organization__isnull=True))

    def perform_create(self, serializer):
        org = self._get_org()
        serializer.save(organization=org, is_system=False)
