from django.urls import path
from student_management.views import company_analytics

urlpatterns = [
    # GET /api/enterprise/organizations/<uuid>/analytics/
    path(
        '<uuid:organization_id>/analytics/',
        company_analytics,
        name='company-analytics',
    ),
]
