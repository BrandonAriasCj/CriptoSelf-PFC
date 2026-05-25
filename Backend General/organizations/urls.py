from django.urls import path
from . import views

urlpatterns = [
    # Organizaciones
    path('', views.OrganizationListCreateView.as_view(), name='organization-list'),
    path('<uuid:pk>/', views.OrganizationDetailView.as_view(), name='organization-detail'),
    path('<uuid:organization_id>/stats/', views.OrganizationStatsView.as_view(), name='organization-stats'),
    path('<uuid:organization_id>/dashboard/', views.organization_dashboard, name='organization-dashboard'),
    path('<uuid:organization_id>/settings/', views.OrganizationSettingsView.as_view(), name='organization-settings'),

    # Administradores
    path('<uuid:organization_id>/admins/', views.OrganizationAdminListView.as_view(), name='organization-admins'),

    # Invitaciones
    path('<uuid:organization_id>/invitations/', views.OrganizationInvitationListView.as_view(), name='organization-invitations'),
    path('invitations/<uuid:token>/accept/', views.AcceptInvitationView.as_view(), name='accept-invitation'),
    path('<uuid:organization_id>/bulk-invite-students/', views.bulk_invite_students, name='bulk-invite-students'),
]