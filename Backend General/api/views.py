from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import Task
from .serializers import TaskSerializer


from rest_framework.views import APIView


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Endpoint para verificar que la API está funcionando"""
    return Response({
        'status': 'ok',
        'message': 'API funcionando correctamente'
    })


class TaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet para manejar operaciones CRUD de tareas
    """
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({'username': user.username, 'email': user.email})
    