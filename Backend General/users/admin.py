from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User, UserProfile, CompanyProfile


class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Perfil Personal'
    fields = (
        ('company', 'job_title'),
        'website',
        ('linkedin_url', 'github_url', 'twitter_url'),
        ('preferred_currency', 'risk_tolerance'),
        ('email_notifications', 'sms_notifications', 'push_notifications'),
    )


class CompanyProfileInline(admin.StackedInline):
    model = CompanyProfile
    can_delete = False
    verbose_name_plural = 'Perfil de Empresa'
    extra = 0
    fields = (
        'company_name',
        ('tax_id', 'industry', 'company_size'),
        ('company_website', 'company_logo'),
        'company_address',
        ('company_country', 'company_city'),
        ('notify_reports', 'notify_students'),
    )


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline, CompanyProfileInline)

    list_display = (
        'email', 'username', 'first_name', 'last_name',
        'profile_type', 'is_verified', 'email_verified', 'is_staff', 'date_joined'
    )
    list_filter = (
        'profile_type', 'is_staff', 'is_superuser', 'is_active',
        'is_verified', 'email_verified', 'date_joined'
    )
    search_fields = ('email', 'username', 'first_name', 'last_name')
    ordering = ('-date_joined',)

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        (_('Información personal'), {
            'fields': (
                'first_name', 'last_name', 'email',
                'phone_number', 'date_of_birth', 'avatar', 'bio'
            )
        }),
        (_('Tipo de perfil'), {
            'fields': ('profile_type',),
            'description': 'Indica qué cliente usa esta cuenta: web_user, mobile_user o company.'
        }),
        (_('Permisos'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        (_('Verificación'), {
            'fields': ('is_verified', 'email_verified', 'phone_verified'),
        }),
        (_('Privacidad'), {
            'fields': ('is_public_profile', 'allow_notifications'),
        }),
        (_('Fechas importantes'), {
            'fields': ('last_login', 'date_joined', 'last_login_ip'),
        }),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'profile_type'),
        }),
    )

    readonly_fields = ('date_joined', 'last_login', 'last_login_ip')


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'company', 'job_title', 'preferred_currency', 'risk_tolerance')
    list_filter = ('risk_tolerance', 'preferred_currency', 'email_notifications')
    search_fields = ('user__email', 'user__username', 'company', 'job_title')
    raw_id_fields = ('user',)


@admin.register(CompanyProfile)
class CompanyProfileAdmin(admin.ModelAdmin):
    list_display = (
        'company_name', 'user', 'industry', 'company_size',
        'company_country', 'company_city', 'created_at'
    )
    list_filter = ('company_size', 'industry', 'company_country')
    search_fields = (
        'company_name', 'tax_id',
        'user__email', 'user__username',
        'company_city', 'company_country'
    )
    raw_id_fields = ('user',)
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (_('Usuario'), {'fields': ('user',)}),
        (_('Identidad corporativa'), {
            'fields': ('company_name', 'tax_id', 'industry', 'company_size', 'company_logo')
        }),
        (_('Presencia digital'), {
            'fields': ('company_website',)
        }),
        (_('Ubicación'), {
            'fields': ('company_address', 'company_country', 'company_city')
        }),
        (_('Notificaciones'), {
            'fields': ('notify_reports', 'notify_students')
        }),
        (_('Auditoría'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )