"""
URL configuration for backend project.
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),

    # API base
    path('api/', include('api.urls')),
    path('api/backtesting/', include('backtesting.urls')),
    path('api/lessons/', include('lessons.urls')),

    # Authentication (usuarios web + empresa web)
    path('api/auth/', include('authentication.urls')),

    # Alertas y notificaciones (in-app + WebSocket en tiempo real)
    path('api/alerts/', include('alerts.urls')),

    # API móvil para alertas (sin autenticación)
    path('api/mobile/', include('mobile_alerts.urls')),

    # ── Perfil Empresa Web ───────────────────────────────────────────────────
    # Organizaciones: /api/organizations/
    path('api/organizations/', include('organizations.urls')),

    # Cursos enterprise: /api/enterprise/courses/ + /api/enterprise/course-templates/
    path('api/enterprise/', include('enterprise_courses.urls')),

    # Gestión de estudiantes: /api/enterprise/students/ + /api/enterprise/groups/
    path('api/enterprise/', include('student_management.urls')),

    # Analytics de empresa: /api/enterprise/organizations/<uuid>/analytics/
    path('api/enterprise/organizations/', include('student_management.analytics_urls')),

    # Gamificación (retos + badges + leaderboard): /api/enterprise/...
    path('api/enterprise/', include('gamification.urls')),

    # Endpoints /api/me/* — lado usuario web (sus retos, gamificación, invitaciones)
    path('api/me/', include('gamification.me_urls')),

    # OAuth2 Provider (Django OAuth Toolkit)
    path('o/', include('oauth2_provider.urls', namespace='oauth2_provider_backend')),
]