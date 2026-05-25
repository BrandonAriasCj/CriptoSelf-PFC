from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth import get_user_model
from oauth2_provider.contrib.rest_framework import TokenHasScope
from .models import Operacion
from .serializers import OperacionSerializer

User = get_user_model()

class IsOwner(permissions.BasePermission):
    """
    Permiso para que solo el dueño pueda ver/editar sus operaciones
    """
    def has_object_permission(self, request, view, obj):
        return obj.usuario == request.user

class OperacionViewSet(viewsets.ModelViewSet):
    """
    CRUD completo para operaciones de criptoactivos.
    Solo muestra las operaciones del usuario autenticado.
    """
    serializer_class = OperacionSerializer
    permission_classes = [TokenHasScope, IsOwner]
    required_scopes = ['read']
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ['criptoactivo', 'tipo_operacion', 'estado']
    ordering_fields = ['fecha_operacion', 'created_at', 'monto_total']
    ordering = ['-fecha_operacion']
    search_fields = ['criptoactivo__symbol', 'notas']


    def get_queryset(self):
        """
        Retorna solo las operaciones del usuario autenticado
        """
        return Operacion.objects.filter(usuario=self.request.user)

    def perform_create(self, serializer):
        """
        Asigna automáticamente el usuario autenticado a la nueva operación
        """
        serializer.save(usuario=self.request.user)

