from django.urls import path
from . import views

app_name = 'lessons'

urlpatterns = [
    # Categorías y lecciones
    path('categories/', views.LessonCategoryListView.as_view(), name='categories'),
    path('categories/<int:category_id>/lessons/', views.LessonsByCategoryView.as_view(), name='lessons-by-category'),
    path('lessons/<int:pk>/', views.LessonDetailView.as_view(), name='lesson-detail'),
    
    # Progreso de lecciones
    path('lessons/<int:lesson_id>/start/', views.start_lesson, name='start-lesson'),
    path('lessons/<int:lesson_id>/progress/', views.update_lesson_progress, name='update-progress'),
    
    # Quizzes
    path('quizzes/<int:quiz_id>/submit/', views.submit_quiz, name='submit-quiz'),
    
    # Progreso del usuario
    path('progress/summary/', views.user_progress_summary, name='progress-summary'),
    path('recommendations/', views.lesson_recommendations, name='recommendations'),
]