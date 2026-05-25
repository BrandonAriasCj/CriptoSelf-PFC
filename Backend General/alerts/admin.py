from django.contrib import admin

from .models import AlertRule, Notification, UserDevice


@admin.register(AlertRule)
class AlertRuleAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'event_type', 'enabled', 'is_system', 'last_triggered_at')
    list_filter = ('enabled', 'is_system', 'event_type')
    search_fields = ('name', 'user__email', 'user__username')
    readonly_fields = ('created_at', 'updated_at', 'last_triggered_at')


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'severity', 'rule', 'read_at', 'created_at')
    list_filter = ('severity', 'read_at')
    search_fields = ('title', 'body', 'user__email', 'user__username')
    readonly_fields = ('created_at',)


@admin.register(UserDevice)
class UserDeviceAdmin(admin.ModelAdmin):
    list_display = ('user', 'platform', 'name', 'enabled', 'last_seen_at')
    list_filter = ('platform', 'enabled')
    search_fields = ('user__email', 'user__username', 'name', 'token')
    readonly_fields = ('created_at', 'last_seen_at')
