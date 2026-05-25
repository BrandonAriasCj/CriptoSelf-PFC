from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone
from oauth2_provider.contrib.rest_framework import TokenHasScope

from authentication.permissions import IsCompanyUser, IsOrganizationAdmin
from organizations.models import Organization
from .models import Course, CourseLessonConfig, CourseTemplate
from .serializers import (
    CourseSerializer, CourseCreateUpdateSerializer,
    CourseSummarySerializer, CourseTemplateSerializer,
    CourseLessonConfigSerializer,
)


class CourseListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/enterprise/courses/              → lista cursos de mis organizaciones
    POST /api/enterprise/courses/              → crea un nuevo curso
    """
    permission_classes = [TokenHasScope, IsOrganizationAdmin]
    required_scopes = ['read']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CourseCreateUpdateSerializer
        return CourseSummarySerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            qs = Course.objects.all()
        else:
            qs = Course.objects.filter(
                organization__admins__user=user
            ).distinct()

        # Filtros opcionales por query params
        organization_id = self.request.query_params.get('organization')
        status_filter = self.request.query_params.get('status')
        search = self.request.query_params.get('search')

        if organization_id:
            qs = qs.filter(organization_id=organization_id)
        if status_filter:
            qs = qs.filter(status=status_filter)
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(code__icontains=search))

        return qs

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        course = serializer.save()
        return Response(
            CourseSerializer(course).data,
            status=status.HTTP_201_CREATED
        )


class CourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/enterprise/courses/<uuid>/  → detalle de curso
    PUT    /api/enterprise/courses/<uuid>/  → actualizar curso
    PATCH  /api/enterprise/courses/<uuid>/  → actualizar parcial
    DELETE /api/enterprise/courses/<uuid>/  → eliminar curso
    """
    permission_classes = [TokenHasScope, IsOrganizationAdmin]
    required_scopes = ['read']

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return CourseCreateUpdateSerializer
        return CourseSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Course.objects.all()
        return Course.objects.filter(
            organization__admins__user=user
        ).distinct()

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        course = serializer.save()
        return Response(CourseSerializer(course).data)


class CoursePublishView(APIView):
    """
    POST /api/enterprise/courses/<uuid>/publish/  → publicar / despublicar curso
    """
    permission_classes = [TokenHasScope, IsOrganizationAdmin]
    required_scopes = ['write']

    def post(self, request, pk):
        course = get_object_or_404(Course, pk=pk)
        action = request.data.get('action', 'publish')  # publish | archive | draft

        if action not in ('publish', 'archive', 'draft'):
            return Response(
                {'error': 'Acción inválida. Use: publish, archive o draft.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        course.status = action
        course.save(update_fields=['status'])
        return Response({
            'message': f'Curso {course.name} ahora está en estado "{action}".',
            'course': CourseSerializer(course).data,
        })


class CourseLessonConfigView(generics.ListCreateAPIView):
    """
    GET  /api/enterprise/courses/<uuid>/lessons/  → lecciones del curso
    POST /api/enterprise/courses/<uuid>/lessons/  → añadir lección al curso
    """
    serializer_class = CourseLessonConfigSerializer
    permission_classes = [TokenHasScope, IsOrganizationAdmin]
    required_scopes = ['read']

    def get_queryset(self):
        return CourseLessonConfig.objects.filter(course_id=self.kwargs['pk'])

    def perform_create(self, serializer):
        course = get_object_or_404(Course, pk=self.kwargs['pk'])
        serializer.save(course=course)


class CourseLessonConfigDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Gestión de una lección específica dentro de un curso.
    """
    serializer_class = CourseLessonConfigSerializer
    permission_classes = [TokenHasScope, IsOrganizationAdmin]
    required_scopes = ['read']

    def get_queryset(self):
        return CourseLessonConfig.objects.filter(course_id=self.kwargs['course_pk'])


class CourseTemplateListView(generics.ListAPIView):
    """
    GET /api/enterprise/course-templates/  → plantillas disponibles de cursos
    """
    serializer_class = CourseTemplateSerializer
    permission_classes = [TokenHasScope]
    required_scopes = ['read']
    queryset = CourseTemplate.objects.filter(is_active=True)


@api_view(['POST'])
@permission_classes([TokenHasScope, IsOrganizationAdmin])
def create_course_from_template(request, template_id):
    """
    POST /api/enterprise/course-templates/<id>/create-course/
    Crea un curso rápidamente basándose en una plantilla existente.
    """
    template = get_object_or_404(CourseTemplate, pk=template_id, is_active=True)

    organization_id = request.data.get('organization')
    if not organization_id:
        return Response(
            {'error': 'El campo "organization" es requerido.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    organization = get_object_or_404(Organization, pk=organization_id)

    # Determinar fechas
    from datetime import timedelta
    start_date = timezone.now()
    end_date = start_date + timedelta(weeks=template.default_duration_weeks)

    course_data = {
        'organization': organization,
        'name': request.data.get('name', template.name),
        'code': request.data.get('code', f'{template.template_type[:3].upper()}-001'),
        'description': request.data.get('description', template.description),
        'credits': template.default_credits,
        'passing_grade': template.default_passing_grade,
        'start_date': start_date,
        'end_date': end_date,
        'enrollment_deadline': start_date + timedelta(weeks=2),
    }

    course = Course.objects.create(**course_data)

    # Clonar configuración de lecciones desde la plantilla
    for tl in template.template_lessons.all():
        CourseLessonConfig.objects.create(
            course=course,
            lesson=tl.lesson,
            order=tl.order,
            is_required=tl.is_required,
        )

    return Response({
        'message': f'Curso "{course.name}" creado exitosamente desde la plantilla.',
        'course': CourseSerializer(course).data,
    }, status=status.HTTP_201_CREATED)
