from django.db import models
from django.conf import settings


class LessonCategory(models.Model):
    """Categorías de lecciones (Básico, Intermedio, Avanzado)"""
    name = models.CharField(max_length=100, verbose_name="Nombre")
    description = models.TextField(verbose_name="Descripción")
    order = models.IntegerField(default=0, verbose_name="Orden")
    icon = models.CharField(max_length=50, default="📚", verbose_name="Icono")
    color = models.CharField(max_length=7, default="#3B82F6", verbose_name="Color")
    
    class Meta:
        verbose_name = "Categoría de Lección"
        verbose_name_plural = "Categorías de Lecciones"
        ordering = ['order']
    
    def __str__(self):
        return self.name


class Lesson(models.Model):
    """Lecciones individuales del curso"""
    DIFFICULTY_CHOICES = [
        ('beginner', 'Principiante'),
        ('intermediate', 'Intermedio'),
        ('advanced', 'Avanzado'),
    ]
    
    TYPE_CHOICES = [
        ('theory', 'Teoría'),
        ('practical', 'Práctica'),
        ('quiz', 'Quiz'),
        ('simulation', 'Simulación'),
    ]
    
    category = models.ForeignKey(LessonCategory, on_delete=models.CASCADE, related_name='lessons')
    title = models.CharField(max_length=200, verbose_name="Título")
    description = models.TextField(verbose_name="Descripción")
    content = models.TextField(verbose_name="Contenido")
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, verbose_name="Dificultad")
    lesson_type = models.CharField(max_length=20, choices=TYPE_CHOICES, verbose_name="Tipo de Lección")
    duration_minutes = models.IntegerField(verbose_name="Duración (minutos)")
    order = models.IntegerField(default=0, verbose_name="Orden")
    is_active = models.BooleanField(default=True, verbose_name="Activa")
    
    # Contenido multimedia
    video_url = models.URLField(blank=True, null=True, verbose_name="URL del Video")
    image_url = models.URLField(blank=True, null=True, verbose_name="URL de Imagen")
    
    # Metadatos
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Lección"
        verbose_name_plural = "Lecciones"
        ordering = ['category__order', 'order']
    
    def __str__(self):
        return f"{self.category.name} - {self.title}"


class LessonProgress(models.Model):
    """Progreso del usuario en las lecciones"""
    STATUS_CHOICES = [
        ('not_started', 'No Iniciada'),
        ('in_progress', 'En Progreso'),
        ('completed', 'Completada'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='lesson_progress')
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='user_progress')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='not_started')
    progress_percentage = models.IntegerField(default=0, verbose_name="Progreso (%)")
    time_spent_minutes = models.IntegerField(default=0, verbose_name="Tiempo invertido (minutos)")
    
    # Puntuación para quizzes
    score = models.FloatField(null=True, blank=True, verbose_name="Puntuación")
    max_score = models.FloatField(null=True, blank=True, verbose_name="Puntuación Máxima")
    
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = "Progreso de Lección"
        verbose_name_plural = "Progreso de Lecciones"
        unique_together = ['user', 'lesson']
    
    def __str__(self):
        return f"{self.user.username} - {self.lesson.title} ({self.status})"


class Quiz(models.Model):
    """Quizzes para evaluar conocimientos"""
    lesson = models.OneToOneField(Lesson, on_delete=models.CASCADE, related_name='quiz')
    title = models.CharField(max_length=200, verbose_name="Título del Quiz")
    description = models.TextField(verbose_name="Descripción")
    passing_score = models.FloatField(default=70.0, verbose_name="Puntuación Mínima (%)")
    time_limit_minutes = models.IntegerField(null=True, blank=True, verbose_name="Límite de Tiempo (minutos)")
    
    class Meta:
        verbose_name = "Quiz"
        verbose_name_plural = "Quizzes"
    
    def __str__(self):
        return f"Quiz: {self.title}"


class QuizQuestion(models.Model):
    """Preguntas de los quizzes"""
    QUESTION_TYPES = [
        ('multiple_choice', 'Opción Múltiple'),
        ('true_false', 'Verdadero/Falso'),
        ('text', 'Texto Libre'),
    ]
    
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField(verbose_name="Pregunta")
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES, verbose_name="Tipo de Pregunta")
    points = models.FloatField(default=1.0, verbose_name="Puntos")
    order = models.IntegerField(default=0, verbose_name="Orden")
    
    class Meta:
        verbose_name = "Pregunta de Quiz"
        verbose_name_plural = "Preguntas de Quiz"
        ordering = ['order']
    
    def __str__(self):
        return f"{self.quiz.title} - Pregunta {self.order}"


class QuizAnswer(models.Model):
    """Respuestas posibles para preguntas de opción múltiple"""
    question = models.ForeignKey(QuizQuestion, on_delete=models.CASCADE, related_name='answers')
    answer_text = models.TextField(verbose_name="Respuesta")
    is_correct = models.BooleanField(default=False, verbose_name="Es Correcta")
    order = models.IntegerField(default=0, verbose_name="Orden")
    
    class Meta:
        verbose_name = "Respuesta de Quiz"
        verbose_name_plural = "Respuestas de Quiz"
        ordering = ['order']
    
    def __str__(self):
        return f"{self.question} - {self.answer_text[:50]}"


class UserQuizAttempt(models.Model):
    """Intentos de quiz por usuario"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='quiz_attempts')
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='attempts')
    score = models.FloatField(verbose_name="Puntuación Obtenida")
    max_score = models.FloatField(verbose_name="Puntuación Máxima")
    percentage = models.FloatField(verbose_name="Porcentaje")
    passed = models.BooleanField(verbose_name="Aprobado")
    time_taken_minutes = models.IntegerField(verbose_name="Tiempo Utilizado (minutos)")
    
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Intento de Quiz"
        verbose_name_plural = "Intentos de Quiz"
        ordering = ['-completed_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.quiz.title} ({self.percentage:.1f}%)"