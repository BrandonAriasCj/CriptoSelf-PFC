from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid


class Course(models.Model):
    """Cursos personalizados por organización"""
    STATUS_CHOICES = [
        ('draft', _('Borrador')),
        ('published', _('Publicado')),
        ('archived', _('Archivado')),
    ]
    
    # Identificación
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='courses'
    )
    
    # Información del curso
    name = models.CharField(_('nombre'), max_length=200)
    code = models.CharField(_('código'), max_length=20)
    description = models.TextField(_('descripción'))
    
    # Configuración académica
    instructor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='taught_courses'
    )
    semester = models.CharField(_('semestre'), max_length=50, blank=True)
    credits = models.IntegerField(_('créditos'), default=3)
    
    # Fechas importantes
    start_date = models.DateTimeField(_('fecha de inicio'))
    end_date = models.DateTimeField(_('fecha de fin'))
    enrollment_deadline = models.DateTimeField(_('fecha límite de inscripción'))
    
    # Configuración de contenido
    enabled_lessons = models.ManyToManyField(
        'lessons.Lesson',
        through='CourseLessonConfig',
        related_name='enterprise_courses'
    )
    
    # Configuración de backtesting
    allow_backtesting = models.BooleanField(_('permitir backtesting'), default=True)
    backtesting_symbols = models.JSONField(
        _('símbolos de backtesting'),
        default=list,
        help_text='Lista de símbolos permitidos para backtesting'
    )
    max_backtesting_period = models.IntegerField(
        _('período máximo de backtesting (días)'),
        default=365
    )
    
    # Evaluación
    passing_grade = models.IntegerField(
        _('calificación mínima (%)'),
        default=70,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    max_quiz_attempts = models.IntegerField(
        _('máximo intentos de quiz'),
        default=3
    )
    
    # Estado y metadatos
    status = models.CharField(
        _('estado'),
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft'
    )
    is_active = models.BooleanField(_('activo'), default=True)
    created_at = models.DateTimeField(_('creado el'), auto_now_add=True)
    updated_at = models.DateTimeField(_('actualizado el'), auto_now=True)
    
    # Configuración adicional
    settings = models.JSONField(_('configuraciones'), default=dict, blank=True)
    
    class Meta:
        verbose_name = _('Curso')
        verbose_name_plural = _('Cursos')
        unique_together = ['organization', 'code']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.organization.name} - {self.name}"
    
    @property
    def total_lessons(self):
        """Número total de lecciones en el curso"""
        return self.course_lessons.count()
    
    @property
    def estimated_duration_hours(self):
        """Duración estimada total del curso en horas"""
        total_minutes = self.course_lessons.aggregate(
            total=models.Sum('lesson__duration_minutes')
        )['total'] or 0
        return round(total_minutes / 60, 1)
    
    @property
    def enrolled_students_count(self):
        """Número de estudiantes inscritos"""
        return self.enrollments.filter(status='active').count()


class CourseLessonConfig(models.Model):
    """Configuración de lecciones dentro de un curso"""
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='course_lessons'
    )
    lesson = models.ForeignKey(
        'lessons.Lesson',
        on_delete=models.CASCADE,
        related_name='course_configs'
    )
    
    # Configuración específica para este curso
    order = models.IntegerField(_('orden'))
    is_required = models.BooleanField(_('obligatoria'), default=True)
    unlock_after_lesson = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='unlocks'
    )
    
    # Configuración de evaluación
    custom_passing_score = models.IntegerField(
        _('puntuación mínima personalizada (%)'),
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    max_attempts = models.IntegerField(
        _('máximo intentos'),
        null=True,
        blank=True
    )
    
    # Fechas de disponibilidad
    available_from = models.DateTimeField(_('disponible desde'), null=True, blank=True)
    available_until = models.DateTimeField(_('disponible hasta'), null=True, blank=True)
    
    class Meta:
        verbose_name = _('Configuración de Lección en Curso')
        verbose_name_plural = _('Configuraciones de Lecciones en Cursos')
        unique_together = ['course', 'lesson']
        ordering = ['order']
    
    def __str__(self):
        return f"{self.course.name} - {self.lesson.title}"


class CourseTemplate(models.Model):
    """Plantillas predefinidas de cursos"""
    TEMPLATE_TYPES = [
        ('beginner', _('Principiante')),
        ('intermediate', _('Intermedio')),
        ('advanced', _('Avanzado')),
        ('specialized', _('Especializado')),
    ]
    
    name = models.CharField(_('nombre'), max_length=200)
    description = models.TextField(_('descripción'))
    template_type = models.CharField(
        _('tipo de plantilla'),
        max_length=20,
        choices=TEMPLATE_TYPES
    )
    
    # Configuración de la plantilla
    lessons = models.ManyToManyField(
        'lessons.Lesson',
        through='TemplateLessonConfig',
        related_name='templates'
    )
    
    # Configuración por defecto
    default_duration_weeks = models.IntegerField(_('duración por defecto (semanas)'), default=12)
    default_credits = models.IntegerField(_('créditos por defecto'), default=3)
    default_passing_grade = models.IntegerField(_('calificación mínima por defecto (%)'), default=70)
    
    # Metadatos
    is_active = models.BooleanField(_('activa'), default=True)
    created_at = models.DateTimeField(_('creado el'), auto_now_add=True)
    updated_at = models.DateTimeField(_('actualizado el'), auto_now=True)
    
    class Meta:
        verbose_name = _('Plantilla de Curso')
        verbose_name_plural = _('Plantillas de Cursos')
        ordering = ['template_type', 'name']
    
    def __str__(self):
        return f"{self.get_template_type_display()} - {self.name}"


class TemplateLessonConfig(models.Model):
    """Configuración de lecciones en plantillas"""
    template = models.ForeignKey(
        CourseTemplate,
        on_delete=models.CASCADE,
        related_name='template_lessons'
    )
    lesson = models.ForeignKey(
        'lessons.Lesson',
        on_delete=models.CASCADE,
        related_name='template_configs'
    )
    
    order = models.IntegerField(_('orden'))
    is_required = models.BooleanField(_('obligatoria'), default=True)
    week_number = models.IntegerField(_('semana'), default=1)
    
    class Meta:
        verbose_name = _('Configuración de Lección en Plantilla')
        verbose_name_plural = _('Configuraciones de Lecciones en Plantillas')
        unique_together = ['template', 'lesson']
        ordering = ['order']
    
    def __str__(self):
        return f"{self.template.name} - {self.lesson.title}"