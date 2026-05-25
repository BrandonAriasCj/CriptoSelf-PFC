"""URLs de gamificación — lado empresa.

Montadas en backend/urls.py bajo /api/enterprise/.
Las URLs de usuario web (/api/me/...) están en gamification.me_urls.
"""
from django.urls import path
from . import views

urlpatterns = [
    # Org-scoped
    path('organizations/<uuid:organization_id>/challenges/',
         views.OrgChallengeListCreateView.as_view(),
         name='org-challenges'),
    path('organizations/<uuid:organization_id>/leaderboard/',
         views.OrgLeaderboardView.as_view(),
         name='org-leaderboard'),
    path('organizations/<uuid:organization_id>/member-stats/',
         views.OrgMemberStatsView.as_view(),
         name='org-member-stats'),
    path('organizations/<uuid:organization_id>/gamification-records/',
         views.OrgRecordsView.as_view(),
         name='org-records'),
    path('organizations/<uuid:organization_id>/badges/',
         views.OrgBadgesView.as_view(),
         name='org-badges'),

    # Challenge-scoped
    path('challenges/<uuid:challenge_id>/',
         views.ChallengeDetailView.as_view(),
         name='challenge-detail'),
    path('challenges/<uuid:challenge_id>/publish/',
         views.publish_challenge,
         name='challenge-publish'),
    path('challenges/<uuid:challenge_id>/assignments/',
         views.ChallengeAssignmentsView.as_view(),
         name='challenge-assignments'),
    path('challenges/<uuid:challenge_id>/assign/',
         views.assign_challenge,
         name='challenge-assign'),
]
