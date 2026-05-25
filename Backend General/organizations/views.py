from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Count, Avg, Q
from django.utils import timezone
from datetime import timedelta
from oauth2_provider.contrib.rest_framework import TokenHasScope

from .models import Organization, OrganizationAdmin, OrganizationInvitation
from .serializers import (
    OrganizationSerializer, OrganizationCreateSerializer,
    OrganizationAdminSerializer, OrganizationInvitationSerializer,
    OrganizationStatsSerializer
)


class OrganizationListCreateView(generics.ListCreateAPIView):
    """Lista y crea organizaciones"""
    permission_classes = [TokenHasScope]
    required_scopes = ['read', 'write']
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return OrganizationCreateSerializer
        return OrganizationSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Organization.objects.all()
        
        # Solo organizaciones donde el usuario es administrador
        return Organization.objects.filter(
            admins__user=user
        ).distinct()


class OrganizationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Detalle, actualización y eliminación de organización"""
    serializer_class = OrganizationSerializer
    permission_classes = [TokenHasScope]
    required_scopes = ['read', 'write']
    
    def get_queryset(self):
        return Organization.objects.filter(
            admins__user=self.request.user
        ).distinct()


class OrganizationStatsView(APIView):
    """Estadísticas de la organización"""
    permission_classes = [TokenHasScope]
    required_scopes = ['read']
    
    def get(self, request, organization_id):
        organization = get_object_or_404(Organization, id=organization_id)
        
        # Calcular estadísticas
        from student_management.models import StudentEnrollment
        from enterprise_courses.models import Course
        
        now = timezone.now()
        last_month = now - timedelta(days=30)
        
        # Estudiantes
        total_students = StudentEnrollment.objects.filter(
            organization=organization
        ).count()
        
        active_students = StudentEnrollment.objects.filter(
            organization=organization,
            status='active'
        ).count()
        
        # Cursos
        total_courses = Course.objects.filter(
            organization=organization
        ).count()
        
        active_courses = Course.objects.filter(
            organization=organization,
            status='published',
            is_active=True
        ).count()
        
        # Progreso
        enrollments = StudentEnrollment.objects.filter(
            organization=organization,
            status='active'
        )
        
        total_lessons_completed = sum(e.lessons_completed for e in enrollments)
        
        if enrollments:
            avg_completion = sum(e.completion_percentage for e in enrollments) / len(enrollments)
            avg_grade = sum(e.overall_grade for e in enrollments) / len(enrollments)
        else:
            avg_completion = 0
            avg_grade = 0
        
        # Estudiantes en riesgo
        students_at_risk = sum(1 for e in enrollments if e.is_at_risk)
        
        # Inscripciones recientes
        recent_enrollments = StudentEnrollment.objects.filter(
            organization=organization,
            enrollment_date__gte=last_month
        ).count()
        
        # Usuarios activos mensuales
        monthly_active_users = StudentEnrollment.objects.filter(
            organization=organization,
            updated_at__gte=last_month
        ).count()
        
        stats = {
            'total_students': total_students,
            'active_students': active_students,
            'total_courses': total_courses,
            'active_courses': active_courses,
            'total_lessons_completed': total_lessons_completed,
            'average_completion_rate': round(avg_completion, 1),
            'average_grade': round(avg_grade, 1),
            'students_at_risk': students_at_risk,
            'recent_enrollments': recent_enrollments,
            'monthly_active_users': monthly_active_users,
        }
        
        serializer = OrganizationStatsSerializer(stats)
        return Response(serializer.data)


class OrganizationAdminListView(generics.ListCreateAPIView):
    """Lista y crea administradores de organización"""
    serializer_class = OrganizationAdminSerializer
    permission_classes = [TokenHasScope]
    required_scopes = ['read', 'write']
    
    def get_queryset(self):
        organization_id = self.kwargs['organization_id']
        return OrganizationAdmin.objects.filter(
            organization_id=organization_id
        )
    
    def perform_create(self, serializer):
        organization_id = self.kwargs['organization_id']
        organization = get_object_or_404(Organization, id=organization_id)
        serializer.save(organization=organization)


class OrganizationInvitationListView(generics.ListCreateAPIView):
    """Lista y crea invitaciones de organización"""
    serializer_class = OrganizationInvitationSerializer
    permission_classes = [TokenHasScope]
    required_scopes = ['read', 'write']
    
    def get_queryset(self):
        organization_id = self.kwargs['organization_id']
        return OrganizationInvitation.objects.filter(
            organization_id=organization_id
        )


class AcceptInvitationView(APIView):
    """Acepta una invitación de organización"""
    permission_classes = [TokenHasScope]
    required_scopes = ['write']
    
    def post(self, request, token):
        try:
            invitation = OrganizationInvitation.objects.get(
                token=token,
                status='pending'
            )
        except OrganizationInvitation.DoesNotExist:
            return Response({
                'error': 'Invitación no encontrada o ya procesada'
            }, status=status.HTTP_404_NOT_FOUND)
        
        if invitation.is_expired:
            return Response({
                'error': 'La invitación ha expirado'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            invitation.accept(request.user)
            return Response({
                'message': 'Invitación aceptada exitosamente',
                'organization': OrganizationSerializer(invitation.organization).data
            })
        except ValueError as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class OrganizationSettingsView(generics.RetrieveUpdateAPIView):
    """Configuraciones de la organización"""
    serializer_class = OrganizationSerializer
    permission_classes = [TokenHasScope]
    required_scopes = ['read', 'write']
    
    def get_queryset(self):
        return Organization.objects.filter(
            admins__user=self.request.user,
            admins__can_manage_organization=True
        ).distinct()


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def bulk_invite_students(request, organization_id):
    """Invitación masiva de estudiantes.

    Requiere que el request.user sea admin de la organización.
    """
    organization = get_object_or_404(Organization, id=organization_id)

    if not (request.user.is_superuser
            or organization.admins.filter(user=request.user).exists()):
        return Response(
            {'error': 'No sos administrador de esta organización.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    emails = request.data.get('emails') or []
    if isinstance(emails, str):
        emails = [emails]
    course_id = request.data.get('course_id')
    message = request.data.get('message', '') or ''

    if not emails:
        return Response(
            {'error': 'Lista de emails requerida'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    invitations_created = []
    errors = []

    for raw_email in emails:
        email = (raw_email or '').strip().lower()
        if not email or '@' not in email:
            errors.append({'email': raw_email, 'error': 'email inválido'})
            continue
        try:
            invitation, created = OrganizationInvitation.objects.get_or_create(
                organization=organization,
                email=email,
                invitation_type='student',
                defaults={
                    'invited_by': request.user,
                    'expires_at': timezone.now() + timedelta(days=7),
                    'message': message,
                    'permissions': {'course_id': course_id} if course_id else {},
                },
            )
            if created:
                invitations_created.append(email)
            else:
                errors.append({'email': email, 'error': 'ya tenía invitación pendiente'})
        except Exception as e:
            errors.append({'email': email, 'error': str(e)})

    return Response({
        'message': f'{len(invitations_created)} invitaciones enviadas',
        'invitations_created': invitations_created,
        'errors': errors,
    })


@api_view(['GET'])
@permission_classes([TokenHasScope])
def organization_dashboard(request, organization_id):
    """Dashboard principal de la organización"""
    required_scopes = ['read']
    
    organization = get_object_or_404(Organization, id=organization_id)
    
    # Datos básicos
    data = {
        'organization': OrganizationSerializer(organization).data,
        'user_role': 'admin' if hasattr(request.user, 'organization_admin') else 'member',
    }
    
    # Estadísticas si es administrador
    if hasattr(request.user, 'organization_admin'):
        admin = request.user.organization_admin
        if admin.can_view_analytics:
            # Reutilizar la lógica de OrganizationStatsView
            stats_view = OrganizationStatsView()
            stats_response = stats_view.get(request, organization_id)
            data['stats'] = stats_response.data
    
    return Response(data)