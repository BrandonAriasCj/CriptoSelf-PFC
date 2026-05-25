from decimal import Decimal
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Badge, Challenge, ChallengeAssignment, MemberBadge,
    MemberGamificationProfile, level_for_points,
)

User = get_user_model()


# ── Badges ─────────────────────────────────────────────────────────────────
class BadgeSerializer(serializers.ModelSerializer):
    holders_count = serializers.SerializerMethodField()
    organization_id = serializers.UUIDField(source='organization.id', read_only=True, allow_null=True)

    class Meta:
        model = Badge
        fields = ['id', 'name', 'description', 'icon', 'rarity', 'criteria',
                  'is_system', 'organization_id', 'holders_count', 'created_at']
        read_only_fields = ['id', 'is_system', 'organization_id', 'holders_count', 'created_at']

    def get_holders_count(self, obj):
        return obj.member_awards.count()


class BadgeCreateSerializer(serializers.ModelSerializer):
    """Solo para badges custom de organización."""
    class Meta:
        model = Badge
        fields = ['name', 'description', 'icon', 'rarity', 'criteria']


# ── Member representation ──────────────────────────────────────────────────
class _MemberMiniSerializer(serializers.Serializer):
    id = serializers.IntegerField(source='pk')
    name = serializers.SerializerMethodField()
    email = serializers.EmailField()

    def get_name(self, obj):
        full = (obj.get_full_name() or '').strip()
        return full or obj.username or obj.email


# ── Challenge ──────────────────────────────────────────────────────────────
class ChallengeSerializer(serializers.ModelSerializer):
    reward_badge_id = serializers.PrimaryKeyRelatedField(
        source='reward_badge', queryset=Badge.objects.all(),
        required=False, allow_null=True,
    )
    total_participants = serializers.SerializerMethodField()
    completed_count    = serializers.SerializerMethodField()
    in_progress_count  = serializers.SerializerMethodField()
    average_progress   = serializers.SerializerMethodField()
    assigned_member_ids = serializers.SerializerMethodField()

    class Meta:
        model = Challenge
        fields = [
            'id', 'name', 'description', 'metric', 'target_value', 'unit',
            'reward_points', 'reward_badge_id', 'difficulty', 'status',
            'is_global', 'start_date', 'end_date', 'created_at',
            'assigned_member_ids',
            'total_participants', 'completed_count', 'in_progress_count', 'average_progress',
        ]
        read_only_fields = ['id', 'created_at', 'total_participants',
                            'completed_count', 'in_progress_count', 'average_progress',
                            'assigned_member_ids']

    def _assignments(self, obj):
        # Cache local en self.context para evitar N queries cuando se serializa una lista.
        cache = self.context.setdefault('_assignment_cache', {})
        if obj.id not in cache:
            cache[obj.id] = list(obj.assignments.all())
        return cache[obj.id]

    def get_total_participants(self, obj):
        return len(self._assignments(obj))

    def get_completed_count(self, obj):
        return sum(1 for a in self._assignments(obj) if a.status == 'completed')

    def get_in_progress_count(self, obj):
        return sum(1 for a in self._assignments(obj) if a.status == 'in_progress')

    def get_average_progress(self, obj):
        ass = self._assignments(obj)
        if not ass:
            return 0
        return int(round(sum(float(a.progress_percentage) for a in ass) / len(ass)))

    def get_assigned_member_ids(self, obj):
        return [str(a.member_id) for a in self._assignments(obj)]


class ChallengeCreateSerializer(serializers.ModelSerializer):
    reward_badge_id = serializers.PrimaryKeyRelatedField(
        source='reward_badge', queryset=Badge.objects.all(),
        required=False, allow_null=True,
    )

    class Meta:
        model = Challenge
        fields = ['name', 'description', 'metric', 'target_value', 'unit',
                  'reward_points', 'reward_badge_id', 'difficulty', 'status',
                  'is_global', 'start_date', 'end_date']


# ── ChallengeAssignment (participantes) ────────────────────────────────────
class ChallengeAssignmentSerializer(serializers.ModelSerializer):
    member_id    = serializers.IntegerField(source='member.pk', read_only=True)
    member_name  = serializers.SerializerMethodField()
    member_email = serializers.EmailField(source='member.email', read_only=True)
    rank         = serializers.SerializerMethodField()

    class Meta:
        model = ChallengeAssignment
        fields = ['id', 'member_id', 'member_name', 'member_email',
                  'current_value', 'progress_percentage', 'status',
                  'completed_at', 'last_evaluated_at', 'rank']

    def get_member_name(self, obj):
        m = obj.member
        return (m.get_full_name() or '').strip() or m.username or m.email

    def get_rank(self, obj):
        # Lo computa el view al ordenar. Si no se pasó, se calcula naïvemente.
        ranks = self.context.get('ranks', {})
        return ranks.get(str(obj.id))


# ── Leaderboard ────────────────────────────────────────────────────────────
class LeaderboardEntrySerializer(serializers.Serializer):
    rank          = serializers.IntegerField()
    member_id     = serializers.IntegerField()
    member_name   = serializers.CharField()
    member_email  = serializers.EmailField()
    total_points  = serializers.IntegerField()
    level         = serializers.IntegerField()
    level_name    = serializers.CharField()
    badges_count  = serializers.IntegerField()
    current_streak_days = serializers.IntegerField()
    rank_change   = serializers.IntegerField(required=False, allow_null=True)


# ── MemberStats (detalle por miembro) ──────────────────────────────────────
class MemberBadgeSerializer(serializers.ModelSerializer):
    badge_id = serializers.UUIDField(source='badge.id', read_only=True)
    badge    = BadgeSerializer(read_only=True)

    class Meta:
        model = MemberBadge
        fields = ['badge_id', 'badge', 'awarded_at']


class MemberStatsSerializer(serializers.Serializer):
    """
    No es un ModelSerializer porque agrega datos de varios modelos.
    El view lo arma manualmente.
    """
    member_id    = serializers.IntegerField()
    member_name  = serializers.CharField()
    member_email = serializers.EmailField()
    total_points = serializers.IntegerField()
    level                       = serializers.IntegerField()
    level_name                  = serializers.CharField()
    points_to_next_level        = serializers.IntegerField()
    level_progress_percentage   = serializers.IntegerField()
    current_streak_days         = serializers.IntegerField()
    longest_streak_days         = serializers.IntegerField()
    badges                      = MemberBadgeSerializer(many=True)
    challenges_completed        = serializers.IntegerField()
    challenges_in_progress      = serializers.IntegerField()
    rank                        = serializers.IntegerField(required=False)
    total_pnl                   = serializers.DecimalField(max_digits=18, decimal_places=4)
    win_rate                    = serializers.DecimalField(max_digits=6,  decimal_places=2)
    total_trades                = serializers.IntegerField()
    total_backtests             = serializers.IntegerField()


# ── TeamRecord (computado en el view) ──────────────────────────────────────
class TeamRecordSerializer(serializers.Serializer):
    id              = serializers.CharField()
    category        = serializers.CharField()
    category_label  = serializers.CharField()
    member_id       = serializers.IntegerField()
    member_name     = serializers.CharField()
    value           = serializers.DecimalField(max_digits=18, decimal_places=4)
    unit            = serializers.CharField()
    achieved_at     = serializers.DateTimeField()
    icon            = serializers.CharField()


# ── Assign challenge to members ────────────────────────────────────────────
class AssignChallengeRequestSerializer(serializers.Serializer):
    member_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False,
    )
