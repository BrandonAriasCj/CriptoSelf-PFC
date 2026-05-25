from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid


class StudentEnrollment(models.Model):
    """Inscripción de estudiantes en organizaciones y cursos"""
    STATUS_CHOICES = [
        ('enrolled', _('Inscrito')),
        ('active', _('Activo')),
        ('completed', _('Completado')),
        ('dropped', _('Retirado')),
        ('suspended', _('Suspendido')),
    ]
    
    # Identificación
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Relaciones principales
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='enrollments'
    )
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='student_enrollments'
    )
    course = models.ForeignKey(
        'enterprise_courses.Course',
        on_delete=models.CASCADE,
        related_name='enrollments',
        null=True,
        blank=True
    )
    
    # Información académica
    institutional_id = models.CharField(
        _('ID estudiantil'),
        max_length=50,
        help_text='ID institucional del estudiante'
    )
    enrollment_date = models.DateTimeField(_('fecha de inscripción'), auto_now_add=True)
    expected_graduation = models.DateTimeField(_('graduación esperada'), null=True, blank=True)
    
    # Estado y progreso
    status = models.CharField(
        _('estado'),
        max_length=20,
        choices=STATUS_CHOICES,
        default='enrolled'
    )
    
    # Métricas de rendimiento
    overall_grade = models.FloatField(
        _('calificación general'),
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(100.0)]
    )
    lessons_completed = models.IntegerField(_('lecciones completadas'), default=0)
    quizzes_passed = models.IntegerField(_('quizzes aprobados'), default=0)
    backtests_performed = models.IntegerField(_('backtests realizados'), default=0)
    time_spent_minutes = models.IntegerField(_('tiempo invertido (minutos)'), default=0)
    
    # Configuración personalizada
    custom_settings = models.JSONField(_('configuraciones personalizadas'), default=dict, blank=True)
    instructor_notes = models.TextField(_('notas'), blank=True, help_text='Notas del instructor')
    
    # Metadatos
    created_at = models.DateTimeField(_('creado el'), auto_now_add=True)
    updated_at = models.DateTimeField(_('actualizado el'), auto_now=True)
    
    class Meta:
        verbose_name = _('Inscripción de Estudiante')
        verbose_name_plural = _('Inscripciones de Estudiantes')
        unique_together = ['student', 'organization', 'course']
        ordering = ['-enrollment_date']
    
    def __str__(self):
        course_name = self.course.name if self.course else "Sin curso específico"
        return f"{self.student.get_full_name()} - {self.organization.name} - {course_name}"
    
    @property
    def completion_percentage(self):
        """Porcentaje de completación del curso"""
        if not self.course:
            return 0
        
        total_lessons = self.course.total_lessons
        if total_lessons == 0:
            return 0
        
        return round((self.lessons_completed / total_lessons) * 100, 1)
    
    @property
    def is_at_risk(self):
        """Determina si el estudiante está en riesgo de abandono"""
        # Lógica simple: bajo rendimiento y poca actividad
        return (
            self.overall_grade < 60 and 
            self.completion_percentage < 30 and
            self.time_spent_minutes < 120  # Menos de 2 horas
        )
    
    @property
    def performance_level(self):
        """Nivel de rendimiento del estudiante"""
        if self.overall_grade >= 90:
            return 'excellent'
        elif self.overall_grade >= 80:
            return 'good'
        elif self.overall_grade >= 70:
            return 'satisfactory'
        elif self.overall_grade >= 60:
            return 'needs_improvement'
        else:
            return 'poor'


class LessonProgress(models.Model):
    """Progreso del estudiante en lecciones específicas"""
    STATUS_CHOICES = [
        ('not_started', _('No Iniciada')),
        ('in_progress', _('En Progreso')),
        ('completed', _('Completada')),
        ('skipped', _('Omitida')),
    ]
    
    enrollment = models.ForeignKey(
        StudentEnrollment,
        on_delete=models.CASCADE,
        related_name='lesson_progress'
    )
    lesson = models.ForeignKey(
        'lessons.Lesson',
        on_delete=models.CASCADE,
        related_name='student_progress'
    )
    
    # Estado y progreso
    status = models.CharField(
        _('estado'),
        max_length=20,
        choices=STATUS_CHOICES,
        default='not_started'
    )
    progress_percentage = models.IntegerField(
        _('progreso (%)'),
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    time_spent_minutes = models.IntegerField(_('tiempo invertido (minutos)'), default=0)
    
    # Puntuación para quizzes
    score = models.FloatField(_('puntuación'), null=True, blank=True)
    max_score = models.FloatField(_('puntuación máxima'), null=True, blank=True)
    attempts = models.IntegerField(_('intentos'), default=0)
    
    # Fechas
    started_at = models.DateTimeField(_('iniciado el'), null=True, blank=True)
    completed_at = models.DateTimeField(_('completado el'), null=True, blank=True)
    last_accessed = models.DateTimeField(_('último acceso'), auto_now=True)
    
    class Meta:
        verbose_name = _('Progreso de Lección')
        verbose_name_plural = _('Progreso de Lecciones')
        unique_together = ['enrollment', 'lesson']
        ordering = ['lesson__order']
    
    def __str__(self):
        return f"{self.enrollment.student.get_full_name()} - {self.lesson.title} ({self.status})"
    
    @property
    def percentage_score(self):
        """Porcentaje de puntuación obtenida"""
        if self.score is not None and self.max_score and self.max_score > 0:
            return round((self.score / self.max_score) * 100, 1)
        return None


class StudentGroup(models.Model):
    """Grupos de estudiantes para organización y comunicación"""
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        related_name='student_groups'
    )
    course = models.ForeignKey(
        'enterprise_courses.Course',
        on_delete=models.CASCADE,
        related_name='student_groups',
        null=True,
        blank=True
    )
    
    name = models.CharField(_('nombre'), max_length=100)
    description = models.TextField(_('descripción'), blank=True)
    
    # Estudiantes en el grupo
    students = models.ManyToManyField(
        StudentEnrollment,
        related_name='groups',
        blank=True
    )
    
    # Configuración
    is_active = models.BooleanField(_('activo'), default=True)
    created_at = models.DateTimeField(_('creado el'), auto_now_add=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_groups'
    )
    
    class Meta:
        verbose_name = _('Grupo de Estudiantes')
        verbose_name_plural = _('Grupos de Estudiantes')
        unique_together = ['organization', 'name']
        ordering = ['name']
    
    def __str__(self):
        return f"{self.organization.name} - {self.name}"
    
    @property
    def students_count(self):
        """Número de estudiantes en el grupo"""
        return self.students.count()
    
    @property
    def average_performance(self):
        """Rendimiento promedio del grupo"""
        enrollments = self.students.all()
        if not enrollments:
            return 0
        
        total_grade = sum(e.overall_grade for e in enrollments)
        return round(total_grade / len(enrollments), 1)


class StudentNote(models.Model):
    """Notas sobre estudiantes por parte de instructores/administradores"""
    NOTE_TYPES = [
        ('academic', _('Académica')),
        ('behavioral', _('Comportamental')),
        ('attendance', _('Asistencia')),
        ('performance', _('Rendimiento')),
        ('general', _('General')),
    ]
    
    enrollment = models.ForeignKey(
        StudentEnrollment,
        on_delete=models.CASCADE,
        related_name='student_notes'
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='student_notes'
    )
    
    note_type = models.CharField(
        _('tipo de nota'),
        max_length=20,
        choices=NOTE_TYPES,
        default='general'
    )
    title = models.CharField(_('título'), max_length=200)
    content = models.TextField(_('contenido'))
    
    # Configuración
    is_private = models.BooleanField(_('privada'), default=False)
    is_important = models.BooleanField(_('importante'), default=False)
    
    created_at = models.DateTimeField(_('creado el'), auto_now_add=True)
    updated_at = models.DateTimeField(_('actualizado el'), auto_now=True)
    
    class Meta:
        verbose_name = _('Nota de Estudiante')
        verbose_name_plural = _('Notas de Estudiantes')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.enrollment.student.get_full_name()} - {self.title}"