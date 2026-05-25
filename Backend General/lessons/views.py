from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Avg, Count, Q, Sum
from .models import (
    LessonCategory, Lesson, LessonProgress, 
    Quiz, QuizQuestion, QuizAnswer, UserQuizAttempt
)
from .serializers import (
    LessonCategorySerializer, LessonSerializer, LessonProgressSerializer,
    QuizSerializer, UserQuizAttemptSerializer, QuizSubmissionSerializer
)


class LessonCategoryListView(generics.ListAPIView):
    """Lista todas las categorías de lecciones"""
    queryset = LessonCategory.objects.all()
    serializer_class = LessonCategorySerializer
    permission_classes = []  # Permitir acceso sin autenticación para testing
    pagination_class = None  # Deshabilitar paginación


class LessonsByCategoryView(generics.ListAPIView):
    """Lista lecciones por categoría"""
    serializer_class = LessonSerializer
    permission_classes = []  # Permitir acceso sin autenticación para testing
    pagination_class = None  # Deshabilitar paginación
    
    def get_queryset(self):
        category_id = self.kwargs['category_id']
        return Lesson.objects.filter(category_id=category_id, is_active=True)


class LessonDetailView(generics.RetrieveAPIView):
    """Detalle de una lección específica"""
    queryset = Lesson.objects.filter(is_active=True)
    serializer_class = LessonSerializer
    permission_classes = []  # Permitir acceso sin autenticación para testing


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_lesson(request, lesson_id):
    """Iniciar una lección"""
    lesson = get_object_or_404(Lesson, id=lesson_id, is_active=True)
    
    progress, created = LessonProgress.objects.get_or_create(
        user=request.user,
        lesson=lesson,
        defaults={
            'status': 'in_progress',
            'started_at': timezone.now()
        }
    )
    
    if not created and progress.status == 'not_started':
        progress.status = 'in_progress'
        progress.started_at = timezone.now()
        progress.save()
    
    return Response({
        'message': 'Lección iniciada',
        'progress': LessonProgressSerializer(progress).data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_lesson_progress(request, lesson_id):
    """Actualizar progreso de una lección"""
    lesson = get_object_or_404(Lesson, id=lesson_id, is_active=True)
    progress, created = LessonProgress.objects.get_or_create(
        user=request.user,
        lesson=lesson
    )
    
    progress_percentage = request.data.get('progress_percentage', 0)
    time_spent = request.data.get('time_spent_minutes', 0)
    
    progress.progress_percentage = min(100, max(0, progress_percentage))
    # Reemplazar el tiempo en lugar de acumularlo (el frontend ya lleva el total)
    progress.time_spent_minutes = time_spent
    
    if progress.progress_percentage >= 100:
        progress.status = 'completed'
        progress.completed_at = timezone.now()
    elif progress.progress_percentage > 0:
        progress.status = 'in_progress'
    
    progress.save()
    
    return Response({
        'message': 'Progreso actualizado',
        'progress': LessonProgressSerializer(progress).data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_quiz(request, quiz_id):
    """Enviar respuestas de quiz"""
    quiz = get_object_or_404(Quiz, id=quiz_id)
    serializer = QuizSubmissionSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    answers = serializer.validated_data['answers']
    time_taken = serializer.validated_data['time_taken_minutes']
    
    # Calcular puntuación
    total_score = 0
    max_score = 0
    
    for question in quiz.questions.all():
        max_score += question.points
        question_id = str(question.id)
        
        if question_id in answers:
            user_answer_ids = answers[question_id]
            correct_answers = question.answers.filter(is_correct=True)
            user_answers = question.answers.filter(id__in=user_answer_ids)
            
            # Verificar si todas las respuestas correctas fueron seleccionadas
            if (set(correct_answers.values_list('id', flat=True)) == 
                set(user_answers.values_list('id', flat=True))):
                total_score += question.points
    
    percentage = (total_score / max_score * 100) if max_score > 0 else 0
    passed = percentage >= quiz.passing_score
    
    # Guardar intento
    attempt = UserQuizAttempt.objects.create(
        user=request.user,
        quiz=quiz,
        score=total_score,
        max_score=max_score,
        percentage=percentage,
        passed=passed,
        time_taken_minutes=time_taken
    )
    
    # Actualizar progreso de la lección
    lesson_progress, created = LessonProgress.objects.get_or_create(
        user=request.user,
        lesson=quiz.lesson
    )
    
    lesson_progress.score = total_score
    lesson_progress.max_score = max_score
    
    if passed:
        lesson_progress.status = 'completed'
        lesson_progress.progress_percentage = 100
        lesson_progress.completed_at = timezone.now()
    
    lesson_progress.save()
    
    return Response({
        'attempt': UserQuizAttemptSerializer(attempt).data,
        'message': 'Quiz completado' if passed else 'Quiz no aprobado'
    })


@api_view(['GET'])
def user_progress_summary(request):
    """Resumen del progreso del usuario"""
    # Si no está autenticado, devolver progreso vacío
    if not request.user.is_authenticated:
        return Response({
            'total_lessons': 0,
            'completed_lessons': 0,
            'completion_percentage': 0,
            'total_time_minutes': 0,
            'categories_progress': []
        })
    
    user = request.user
    
    # Estadísticas generales
    total_lessons = Lesson.objects.filter(is_active=True).count()
    completed_lessons = LessonProgress.objects.filter(
        user=user, 
        status='completed'
    ).count()
    
    in_progress_lessons = LessonProgress.objects.filter(
        user=user, 
        status='in_progress'
    ).count()
    
    # Progreso por categoría
    categories_progress = []
    for category in LessonCategory.objects.all():
        category_lessons = category.lessons.filter(is_active=True)
        category_completed = LessonProgress.objects.filter(
            user=user,
            lesson__in=category_lessons,
            status='completed'
        ).count()
        
        categories_progress.append({
            'category': LessonCategorySerializer(category).data,
            'total_lessons': category_lessons.count(),
            'completed_lessons': category_completed,
            'progress_percentage': (category_completed / category_lessons.count() * 100) if category_lessons.count() > 0 else 0
        })
    
    # Últimos intentos de quiz
    recent_attempts = UserQuizAttempt.objects.filter(user=user).order_by('-completed_at')[:5]
    
    # Tiempo total invertido
    total_time = LessonProgress.objects.filter(user=user).aggregate(
        total=Sum('time_spent_minutes')
    )['total'] or 0
    
    return Response({
        'total_lessons': total_lessons,
        'completed_lessons': completed_lessons,
        'in_progress_lessons': in_progress_lessons,
        'completion_percentage': (completed_lessons / total_lessons * 100) if total_lessons > 0 else 0,
        'total_time_minutes': total_time,
        'categories_progress': categories_progress,
        'recent_quiz_attempts': UserQuizAttemptSerializer(recent_attempts, many=True).data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def lesson_recommendations(request):
    """Recomendar próximas lecciones basadas en el progreso"""
    user = request.user
    
    # Obtener lecciones completadas
    completed_lessons = LessonProgress.objects.filter(
        user=user, 
        status='completed'
    ).values_list('lesson_id', flat=True)
    
    # Recomendar lecciones no completadas, priorizando por dificultad y orden
    recommended = Lesson.objects.filter(
        is_active=True
    ).exclude(
        id__in=completed_lessons
    ).order_by('difficulty', 'category__order', 'order')[:6]
    
    return Response({
        'recommended_lessons': LessonSerializer(recommended, many=True, context={'request': request}).data
    })