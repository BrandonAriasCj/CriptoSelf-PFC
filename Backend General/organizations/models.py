from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.utils.text import slugify
from django.core.validators import RegexValidator
import uuid


class Organization(models.Model):
    """
    Modelo para organizaciones/instituciones educativas
    """
    ORGANIZATION_TYPES = [
        ('university', _('Universidad')),
        ('business_school', _('Escuela de Negocios')),
        ('trading_academy', _('Academia de Trading')),
        ('corporate', _('Empresa Corporativa')),
        ('bootcamp', _('Bootcamp')),
        ('other', _('Otro')),
    ]
    
    SUBSCRIPTION_PLANS = [
        ('basic', _('Básico - 50 estudiantes')),
        ('standard', _('Estándar - 200 estudiantes')),
        ('premium', _('Premium - 500 estudiantes')),
        ('enterprise', _('Empresarial - Ilimitado')),
    ]
    
    # Identificación única
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Información básica
    name = models.CharField(_('nombre'), max_length=200)
    slug = models.SlugField(_('slug'), unique=True, max_length=200)
    organization_type = models.CharField(
        _('tipo de organización'), 
        max_length=20, 
        choices=ORGANIZATION_TYPES
    )
    
    # Contacto y ubicación
    email = models.EmailField(_('email'))
    phone = models.CharField(_('teléfono'), max_length=20, blank=True)
    website = models.URLField(_('sitio web'), blank=True)
    country = models.CharField(_('país'), max_length=100)
    city = models.CharField(_('ciudad'), max_length=100)
    address = models.TextField(_('dirección'), blank=True)
    
    # Configuración de la plataforma
    logo = models.ImageField(_('logo'), upload_to='organizations/logos/', blank=True)
    primary_color = models.CharField(
        _('color primario'), 
        max_length=7, 
        default='#3b82f6',
        validators=[RegexValidator(r'^#[0-9A-Fa-f]{6}$', 'Formato de color hexadecimal inválido')]
    )
    secondary_color = models.CharField(
        _('color secundario'), 
        max_length=7, 
        default='#1e40af',
        validators=[RegexValidator(r'^#[0-9A-Fa-f]{6}$', 'Formato de color hexadecimal inválido')]
    )
    custom_domain = models.CharField(
        _('dominio personalizado'), 
        max_length=100, 
        blank=True,
        help_text='Ej: trading.universidad.edu'
    )
    
    # Límites y configuración
    max_students = models.IntegerField(_('máximo estudiantes'), default=100)
    max_instructors = models.IntegerField(_('máximo instructores'), default=10)
    subscription_plan = models.CharField(
        _('plan de suscripción'),
        max_length=20,
        choices=SUBSCRIPTION_PLANS,
        default='basic'
    )
    
    # Fechas y estado
    created_at = models.DateTimeField(_('creado el'), auto_now_add=True)
    subscription_start = models.DateTimeField(_('inicio de suscripción'))
    subscription_end = models.DateTimeField(_('fin de suscripción'))
    is_active = models.BooleanField(_('activo'), default=True)
    trial_end_date = models.DateTimeField(_('fin de prueba'), null=True, blank=True)
    
    # Configuración adicional
    settings = models.JSONField(_('configuraciones'), default=dict, blank=True)
    
    class Meta:
        verbose_name = _('Organización')
        verbose_name_plural = _('Organizaciones')
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    @property
    def is_trial(self):
        """Verifica si la organización está en período de prueba"""
        from django.utils import timezone
        return self.trial_end_date and timezone.now() <= self.trial_end_date
    
    @property
    def days_until_expiration(self):
        """Días hasta que expire la suscripción"""
        from django.utils import timezone
        if self.subscription_end:
            delta = self.subscription_end - timezone.now()
            return delta.days if delta.days > 0 else 0
        return 0
    
    @property
    def current_students_count(self):
        """Número actual de estudiantes"""
        return self.student_enrollments.filter(status='active').count()
    
    @property
    def current_instructors_count(self):
        """Número actual de instructores"""
        return self.admins.filter(can_create_courses=True).count()


class OrganizationAdmin(models.Model):
    """
    Administradores de organizaciones con permisos específicos
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='organization_admin'
    )
    organization = models.ForeignKey(
        Organization, 
        on_delete=models.CASCADE,
        related_name='admins'
    )
    
    # Información del administrador
    title = models.CharField(_('título'), max_length=100, blank=True)
    department = models.CharField(_('departamento'), max_length=100, blank=True)
    employee_id = models.CharField(_('ID empleado'), max_length=50, blank=True)
    
    # Permisos específicos
    can_manage_students = models.BooleanField(_('gestionar estudiantes'), default=True)
    can_manage_instructors = models.BooleanField(_('gestionar instructores'), default=True)
    can_create_courses = models.BooleanField(_('crear cursos'), default=True)
    can_view_analytics = models.BooleanField(_('ver analytics'), default=True)
    can_manage_billing = models.BooleanField(_('gestionar facturación'), default=False)
    can_export_data = models.BooleanField(_('exportar datos'), default=True)
    can_manage_organization = models.BooleanField(_('gestionar organización'), default=False)
    
    # Configuración de notificaciones
    notify_new_students = models.BooleanField(_('notificar nuevos estudiantes'), default=True)
    notify_course_completion = models.BooleanField(_('notificar completación de cursos'), default=True)
    notify_low_performance = models.BooleanField(_('notificar bajo rendimiento'), default=True)
    weekly_reports = models.BooleanField(_('reportes semanales'), default=True)
    
    created_at = models.DateTimeField(_('creado el'), auto_now_add=True)
    is_primary_admin = models.BooleanField(_('administrador principal'), default=False)
    
    class Meta:
        verbose_name = _('Administrador de Organización')
        verbose_name_plural = _('Administradores de Organización')
        unique_together = ['user', 'organization']
    
    def __str__(self):
        return f"{self.user.get_full_name()} - {self.organization.name}"
    
    def save(self, *args, **kwargs):
        # Solo puede haber un administrador principal por organización
        if self.is_primary_admin:
            OrganizationAdmin.objects.filter(
                organization=self.organization,
                is_primary_admin=True
            ).exclude(pk=self.pk).update(is_primary_admin=False)
        super().save(*args, **kwargs)


class OrganizationInvitation(models.Model):
    """
    Invitaciones para unirse a una organización
    """
    INVITATION_TYPES = [
        ('admin', _('Administrador')),
        ('instructor', _('Instructor')),
        ('student', _('Estudiante')),
    ]
    
    STATUS_CHOICES = [
        ('pending', _('Pendiente')),
        ('accepted', _('Aceptada')),
        ('declined', _('Rechazada')),
        ('expired', _('Expirada')),
    ]
    
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='invitations'
    )
    email = models.EmailField(_('email'))
    invitation_type = models.CharField(
        _('tipo de invitación'),
        max_length=20,
        choices=INVITATION_TYPES
    )
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_invitations'
    )
    
    # Token único para la invitación
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    
    # Estado y fechas
    status = models.CharField(
        _('estado'),
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    created_at = models.DateTimeField(_('creado el'), auto_now_add=True)
    expires_at = models.DateTimeField(_('expira el'))
    accepted_at = models.DateTimeField(_('aceptado el'), null=True, blank=True)
    
    # Datos adicionales para la invitación
    message = models.TextField(_('mensaje'), blank=True)
    permissions = models.JSONField(_('permisos'), default=dict, blank=True)
    
    class Meta:
        verbose_name = _('Invitación de Organización')
        verbose_name_plural = _('Invitaciones de Organización')
        unique_together = ['organization', 'email', 'invitation_type']
    
    def __str__(self):
        return f"Invitación {self.get_invitation_type_display()} para {self.email} - {self.organization.name}"
    
    @property
    def is_expired(self):
        """Verifica si la invitación ha expirado"""
        from django.utils import timezone
        return timezone.now() > self.expires_at
    
    def accept(self, user):
        """Acepta la invitación y asigna el rol correspondiente"""
        from django.utils import timezone
        
        if self.is_expired:
            raise ValueError("La invitación ha expirado")
        
        if self.status != 'pending':
            raise ValueError("La invitación ya ha sido procesada")
        
        self.status = 'accepted'
        self.accepted_at = timezone.now()
        self.save()
        
        # Crear el rol correspondiente según el tipo de invitación
        if self.invitation_type == 'admin':
            OrganizationAdmin.objects.create(
                user=user,
                organization=self.organization,
                **self.permissions
            )
        elif self.invitation_type == 'student':
            from student_management.models import StudentEnrollment
            StudentEnrollment.objects.create(
                student=user,
                organization=self.organization,
                status='enrolled'
            )
        
        return True