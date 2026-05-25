from django.urls import path, include
from . import views

urlpatterns = [
    # ── Perfil Usuario Web ──────────────────────────────────────────
    path('register/', views.RegisterView.as_view(), name='register'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change_password'),

    # ── Perfil Empresa Web ──────────────────────────────────────────
    # POST /api/auth/company/register/  → crear cuenta de empresa
    path('company/register/', views.RegisterCompanyView.as_view(), name='company_register'),
    # GET/PUT/PATCH /api/auth/company/profile/  → ver y editar perfil de empresa
    path('company/profile/', views.CompanyProfileView.as_view(), name='company_profile'),

    # ── OAuth2 ──────────────────────────────────────────────────────
    path('token/', views.oauth_token, name='oauth_token'),
    path('logout/', views.logout, name='logout'),
    path('user-info/', views.user_info, name='user_info'),

    # ── Autenticación social ─────────────────────────────────────────
    path('social/', views.SocialAuthView.as_view(), name='social_auth'),
    path('google/exchange-code/', views.google_exchange_code, name='google_exchange_code'),
    path('google/register/', views.google_register, name='google_register'),

    # ── Django Allauth ───────────────────────────────────────────────
    path('accounts/', include('allauth.urls')),

    # ── Test ─────────────────────────────────────────────────────────
    path('test/', views.test_auth, name='test_auth'),
]