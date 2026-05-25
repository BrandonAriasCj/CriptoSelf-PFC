"""URLs /api/me/* (lado usuario web)."""
from django.urls import path
from . import me_views as v

urlpatterns = [
    path('organizations/',                                v.MyOrganizationsView.as_view(),  name='me-orgs'),
    path('organizations/invitations/',                    v.MyInvitationsView.as_view(),    name='me-invitations'),
    path('organizations/invitations/<uuid:token>/accept/',  v.accept_invitation,             name='me-invitation-accept'),
    path('organizations/invitations/<uuid:token>/decline/', v.decline_invitation,            name='me-invitation-decline'),
    path('challenges/',                                   v.MyChallengesView.as_view(),     name='me-challenges'),
    path('gamification/',                                 v.MyGamificationView.as_view(),   name='me-gamification'),
    path('badges/',                                       v.MyBadgesView.as_view(),         name='me-badges'),
]
