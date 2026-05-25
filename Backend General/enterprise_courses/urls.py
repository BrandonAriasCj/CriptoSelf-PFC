from django.urls import path
from . import views

urlpatterns = [
    # ── Cursos ──────────────────────────────────────────────────────────────
    # GET  /api/enterprise/courses/              → listar cursos
    # POST /api/enterprise/courses/              → crear curso
    path('courses/', views.CourseListCreateView.as_view(), name='course-list'),

    # GET/PUT/PATCH/DELETE /api/enterprise/courses/<uuid>/
    path('courses/<uuid:pk>/', views.CourseDetailView.as_view(), name='course-detail'),

    # POST /api/enterprise/courses/<uuid>/publish/  → cambiar estado
    path('courses/<uuid:pk>/publish/', views.CoursePublishView.as_view(), name='course-publish'),

    # ── Lecciones de un curso ────────────────────────────────────────────────
    # GET  /api/enterprise/courses/<uuid>/lessons/
    # POST /api/enterprise/courses/<uuid>/lessons/
    path('courses/<uuid:pk>/lessons/', views.CourseLessonConfigView.as_view(), name='course-lessons'),

    # GET/PUT/PATCH/DELETE /api/enterprise/courses/<uuid>/lessons/<id>/
    path(
        'courses/<uuid:course_pk>/lessons/<int:pk>/',
        views.CourseLessonConfigDetailView.as_view(),
        name='course-lesson-detail',
    ),

    # ── Plantillas ────────────────────────────────────────────────────────────
    # GET /api/enterprise/course-templates/
    path('course-templates/', views.CourseTemplateListView.as_view(), name='course-template-list'),

    # POST /api/enterprise/course-templates/<id>/create-course/
    path(
        'course-templates/<int:template_id>/create-course/',
        views.create_course_from_template,
        name='course-from-template',
    ),
]
