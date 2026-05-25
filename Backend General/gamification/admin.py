from django.contrib import admin
from .models import (
    Badge, Challenge, ChallengeAssignment, MemberBadge,
    PointsTransaction, MemberGamificationProfile,
)


@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display  = ('icon', 'name', 'rarity', 'organization', 'is_system', 'created_at')
    list_filter   = ('rarity', 'is_system', 'organization')
    search_fields = ('name', 'description')
    readonly_fields = ('id', 'created_at')


@admin.register(Challenge)
class ChallengeAdmin(admin.ModelAdmin):
    list_display  = ('name', 'organization', 'metric', 'target_value', 'difficulty',
                     'status', 'is_global', 'start_date', 'end_date')
    list_filter   = ('status', 'difficulty', 'metric', 'is_global', 'organization')
    search_fields = ('name', 'description')
    readonly_fields = ('id', 'created_at', 'updated_at')
    raw_id_fields = ('organization', 'reward_badge', 'created_by')


@admin.register(ChallengeAssignment)
class ChallengeAssignmentAdmin(admin.ModelAdmin):
    list_display = ('member', 'challenge', 'progress_percentage', 'status',
                    'current_value', 'completed_at', 'last_evaluated_at')
    list_filter  = ('status', 'organization', 'challenge')
    search_fields = ('member__email', 'challenge__name')
    readonly_fields = ('id', 'created_at', 'updated_at', 'last_evaluated_at')


@admin.register(MemberBadge)
class MemberBadgeAdmin(admin.ModelAdmin):
    list_display = ('member', 'badge', 'organization', 'challenge', 'awarded_at')
    list_filter  = ('organization', 'badge__rarity')
    search_fields = ('member__email', 'badge__name')
    readonly_fields = ('id', 'awarded_at')


@admin.register(PointsTransaction)
class PointsTransactionAdmin(admin.ModelAdmin):
    list_display = ('member', 'organization', 'points', 'source', 'description', 'created_at')
    list_filter  = ('source', 'organization')
    search_fields = ('member__email', 'description', 'reference_id')
    readonly_fields = ('id', 'created_at')


@admin.register(MemberGamificationProfile)
class MemberGamificationProfileAdmin(admin.ModelAdmin):
    list_display = ('member', 'organization', 'total_points', 'current_streak_days',
                    'longest_streak_days', 'challenges_completed', 'last_activity_date')
    list_filter  = ('organization',)
    search_fields = ('member__email',)
    readonly_fields = ('id', 'created_at', 'updated_at')
