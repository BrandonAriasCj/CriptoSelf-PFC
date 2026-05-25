from django.urls import path, include
from rest_framework.routers import SimpleRouter
from .views import OperacionViewSet

router = SimpleRouter()
router.register(r'', OperacionViewSet, basename='operacion')

urlpatterns = [
    path('', include(router.urls)),
]
