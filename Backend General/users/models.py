from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    """
    Modelo de usuario personalizado que extiende AbstractUser
    """
    PROFILE_TYPES = [
        ('web_user',    _('Usuario Web')),
        ('mobile_user', _('Usuario Móvil')),
        ('company',     _('Empresa Web')),
    ]

    email = models.EmailField(_('email address'), unique=True)
    first_name = models.CharField(_('first name'), max_length=150, blank=True)
    last_name = models.CharField(_('last name'), max_length=150, blank=True)
    phone_number = models.CharField(_('phone number'), max_length=20, blank=True)
    date_of_birth = models.DateField(_('date of birth'), null=True, blank=True)
    avatar = models.ImageField(_('avatar'), upload_to='avatars/', null=True, blank=True)
    bio = models.TextField(_('bio'), max_length=500, blank=True)

    # Tipo de perfil — diferencia el cliente que usa este usuario
    profile_type = models.CharField(
        _('profile type'),
        max_length=20,
        choices=PROFILE_TYPES,
        default='web_user'
    )
    
    # Configuración de cuenta
    is_verified = models.BooleanField(_('is verified'), default=False)
    email_verified = models.BooleanField(_('email verified'), default=False)
    phone_verified = models.BooleanField(_('phone verified'), default=False)
    
    # Configuración de privacidad
    is_public_profile = models.BooleanField(_('public profile'), default=True)
    allow_notifications = models.BooleanField(_('allow notifications'), default=True)
    
    # Timestamps
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    last_login_ip = models.GenericIPAddressField(_('last login IP'), null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        verbose_name = _('User')
        verbose_name_plural = _('Users')
        db_table = 'users_user'

    def __str__(self):
        return self.email

    @property
    def full_name(self):
        """Retorna el nombre completo del usuario"""
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def display_name(self):
        """Retorna el nombre para mostrar (nombre completo o username)"""
        return self.full_name if self.full_name else self.username


class UserProfile(models.Model):
    """
    Perfil extendido del usuario para información adicional
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    # Información profesional
    company = models.CharField(_('company'), max_length=100, blank=True)
    job_title = models.CharField(_('job title'), max_length=100, blank=True)
    website = models.URLField(_('website'), blank=True)
    
    # Redes sociales
    linkedin_url = models.URLField(_('LinkedIn URL'), blank=True)
    github_url = models.URLField(_('GitHub URL'), blank=True)
    twitter_url = models.URLField(_('Twitter URL'), blank=True)
    
    # Configuración de trading/backtesting
    preferred_currency = models.CharField(_('preferred currency'), max_length=10, default='USD')
    risk_tolerance = models.CharField(
        _('risk tolerance'),
        max_length=20,
        choices=[
            ('conservative', _('Conservative')),
            ('moderate', _('Moderate')),
            ('aggressive', _('Aggressive')),
        ],
        default='moderate'
    )
    
    # Configuración de notificaciones
    email_notifications = models.BooleanField(_('email notifications'), default=True)
    sms_notifications = models.BooleanField(_('SMS notifications'), default=False)
    push_notifications = models.BooleanField(_('push notifications'), default=True)
    
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('User Profile')
        verbose_name_plural = _('User Profiles')

    def __str__(self):
        return f"Profile of {self.user.email}"


class CompanyProfile(models.Model):
    """
    Perfil extendido para usuarios de tipo 'Empresa Web'.
    Almacena datos corporativos separados del perfil personal.
    """
    COMPANY_SIZES = [
        ('1-10',   _('Micro (1-10 empleados)')),
        ('11-50',  _('Pequeña (11-50 empleados)')),
        ('51-200', _('Mediana (51-200 empleados)')),
        ('200+',   _('Grande (200+ empleados)')),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='company_profile',
        verbose_name=_('usuario')
    )

    # Identidad corporativa
    company_name    = models.CharField(_('nombre de empresa'), max_length=200)
    tax_id          = models.CharField(_('RUC / NIF / Tax ID'), max_length=50, blank=True)
    industry        = models.CharField(_('industria'), max_length=100, blank=True)
    company_size    = models.CharField(
        _('tamaño de empresa'),
        max_length=20,
        choices=COMPANY_SIZES,
        default='1-10'
    )

    # Presencia digital
    company_website = models.URLField(_('sitio web corporativo'), blank=True)
    company_logo    = models.ImageField(
        _('logo de empresa'),
        upload_to='company_logos/',
        null=True,
        blank=True
    )

    # Ubicación
    company_address = models.TextField(_('dirección'), blank=True)
    company_country = models.CharField(_('país'), max_length=100, blank=True)
    company_city    = models.CharField(_('ciudad'), max_length=100, blank=True)

    # Configuración de notificaciones empresariales
    notify_reports  = models.BooleanField(_('notificaciones de reportes'), default=True)
    notify_students = models.BooleanField(_('notificaciones de estudiantes'), default=True)

    created_at = models.DateTimeField(_('creado el'), auto_now_add=True)
    updated_at = models.DateTimeField(_('actualizado el'), auto_now=True)

    class Meta:
        verbose_name = _('Perfil de Empresa')
        verbose_name_plural = _('Perfiles de Empresa')

    def __str__(self):
        return f"{self.company_name} ({self.user.email})"

    @property
    def display_name(self):
        """Nombre visible de la empresa"""
        return self.company_name or self.user.display_name