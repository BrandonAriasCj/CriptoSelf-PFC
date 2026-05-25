from django.urls import path
from . import views

urlpatterns = [
    # ── Inscripciones de estudiantes ────────────────────────────────────────
    # GET  /api/enterprise/students/          → listar
    # POST /api/enterprise/students/          → inscribir
    path('students/', views.StudentEnrollmentListCreateView.as_view(), name='student-list'),

    # GET/PATCH/DELETE /api/enterprise/students/<uuid>/
    path('students/<uuid:pk>/', views.StudentEnrollmentDetailView.as_view(), name='student-detail'),

    # ── Progreso por lección ─────────────────────────────────────────────────
    # GET  /api/enterprise/students/<uuid>/progress/
    path(
        'students/<uuid:enrollment_pk>/progress/',
        views.LessonProgressListView.as_view(),
        name='student-progress',
    ),
    # POST /api/enterprise/students/<uuid>/progress/update/
    path(
        'students/<uuid:enrollment_pk>/progress/update/',
        views.update_lesson_progress,
        name='student-progress-update',
    ),

    # ── Notas ────────────────────────────────────────────────────────────────
    # GET  /api/enterprise/students/<uuid>/notes/
    # POST /api/enterprise/students/<uuid>/notes/
    path(
        'students/<uuid:enrollment_pk>/notes/',
        views.StudentNoteListCreateView.as_view(),
        name='student-notes',
    ),

    # ── Grupos ───────────────────────────────────────────────────────────────
    path('groups/', views.StudentGroupListCreateView.as_view(), name='group-list'),
    path('groups/<int:pk>/', views.StudentGroupDetailView.as_view(), name='group-detail'),
]
