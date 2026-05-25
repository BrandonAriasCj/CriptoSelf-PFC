from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db.models import Q, Avg, Sum, Count
from django.utils import timezone
from oauth2_provider.contrib.rest_framework import TokenHasScope

from authentication.permissions import IsOrganizationAdmin
from organizations.models import Organization
from .models import StudentEnrollment, LessonProgress, StudentGroup, StudentNote
from .serializers import (
    StudentEnrollmentSerializer, StudentEnrollmentCreateSerializer,
    StudentEnrollmentUpdateSerializer, StudentSummarySerializer,
    LessonProgressSerializer, StudentGroupSerializer, StudentNoteSerializer,
)


# ── Inscripciones ────────────────────────────────────────────────────────────

class StudentEnrollmentListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/enterprise/students/           → listar estudiantes de mis organizaciones
    POST /api/enterprise/students/           → inscribir estudiante
    """
    permission_classes = [TokenHasScope, IsOrganizationAdmin]
    required_scopes = ['read']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return StudentEnrollmentCreateSerializer
        return StudentSummarySerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            qs = StudentEnrollment.objects.select_related(
                'student', 'organization', 'course'
            ).all()
        else:
            qs = StudentEnrollment.objects.select_related(
                'student', 'organization', 'course'
            ).filter(organization__admins__user=user).distinct()

        # Filtros
        organization_id = self.request.query_params.get('organization')
        course_id = self.request.query_params.get('course')
        enrollment_status = self.request.query_params.get('status')
        at_risk = self.request.query_params.get('at_risk')
        search = self.request.query_params.get('search')

        if organization_id:
            qs = qs.filter(organization_id=organization_id)
        if course_id:
            qs = qs.filter(course_id=course_id)
        if enrollment_status:
            qs = qs.filter(status=enrollment_status)
        if search:
            qs = qs.filter(
                Q(student__first_name__icontains=search) |
                Q(student__last_name__icontains=search) |
                Q(student__email__icontains=search) |
                Q(institutional_id__icontains=search)
            )

        return qs

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        enrollment = serializer.save(status='enrolled')
        return Response(
            StudentEnrollmentSerializer(enrollment).data,
            status=status.HTTP_201_CREATED
        )


class StudentEnrollmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/enterprise/students/<uuid>/
    PATCH  /api/enterprise/students/<uuid>/
    DELETE /api/enterprise/students/<uuid>/  → dar de baja al estudiante
    """
    permission_classes = [TokenHasScope, IsOrganizationAdmin]
    required_scopes = ['read']

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return StudentEnrollmentUpdateSerializer
        return StudentEnrollmentSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return StudentEnrollment.objects.all()
        return StudentEnrollment.objects.filter(
            organization__admins__user=user
        ).distinct()

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        enrollment = serializer.save()
        return Response(StudentEnrollmentSerializer(enrollment).data)

    def destroy(self, request, *args, **kwargs):
        enrollment = self.get_object()
        enrollment.status = 'dropped'
        enrollment.save(update_fields=['status'])
        return Response(
            {'message': 'Estudiante dado de baja exitosamente.'},
            status=status.HTTP_200_OK
        )


# ── Progreso por lección ──────────────────────────────────────────────────────

class LessonProgressListView(generics.ListAPIView):
    """
    GET /api/enterprise/students/<uuid>/progress/  → progreso en lecciones
    """
    serializer_class = LessonProgressSerializer
    permission_classes = [TokenHasScope, IsOrganizationAdmin]
    required_scopes = ['read']

    def get_queryset(self):
        enrollment = get_object_or_404(
            StudentEnrollment, pk=self.kwargs['enrollment_pk']
        )
        return LessonProgress.objects.filter(enrollment=enrollment)


@api_view(['POST'])
@permission_classes([TokenHasScope, IsOrganizationAdmin])
def update_lesson_progress(request, enrollment_pk):
    """
    POST /api/enterprise/students/<uuid>/progress/update/
    Actualiza el progreso de un estudiante en una lección concreta.

    Body: { lesson_id, status, progress_percentage, time_spent_minutes, score }
    """
    enrollment = get_object_or_404(StudentEnrollment, pk=enrollment_pk)
    lesson_id = request.data.get('lesson_id')

    if not lesson_id:
        return Response(
            {'error': 'El campo "lesson_id" es requerido.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    progress, created = LessonProgress.objects.get_or_create(
        enrollment=enrollment,
        lesson_id=lesson_id,
    )

    serializer = LessonProgressSerializer(progress, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)

    if request.data.get('status') == 'completed' and not progress.completed_at:
        progress.completed_at = timezone.now()
    if created:
        progress.started_at = timezone.now()

    serializer.save()

    # Actualizar contadores del enrollment
    enrollment.lessons_completed = LessonProgress.objects.filter(
        enrollment=enrollment, status='completed'
    ).count()
    enrollment.save(update_fields=['lessons_completed', 'updated_at'])

    return Response(serializer.data)


# ── Grupos de estudiantes ─────────────────────────────────────────────────────

class StudentGroupListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/enterprise/groups/   → listar grupos
    POST /api/enterprise/groups/   → crear grupo
    """
    serializer_class = StudentGroupSerializer
    permission_classes = [TokenHasScope, IsOrganizationAdmin]
    required_scopes = ['read']

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return StudentGroup.objects.all()
        return StudentGroup.objects.filter(
            organization__admins__user=user
        ).distinct()


class StudentGroupDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET/PUT/PATCH/DELETE /api/enterprise/groups/<id>/
    """
    serializer_class = StudentGroupSerializer
    permission_classes = [TokenHasScope, IsOrganizationAdmin]
    required_scopes = ['read']

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return StudentGroup.objects.all()
        return StudentGroup.objects.filter(
            organization__admins__user=user
        ).distinct()


# ── Notas de estudiantes ──────────────────────────────────────────────────────

class StudentNoteListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/enterprise/students/<uuid>/notes/
    POST /api/enterprise/students/<uuid>/notes/
    """
    serializer_class = StudentNoteSerializer
    permission_classes = [TokenHasScope, IsOrganizationAdmin]
    required_scopes = ['read']

    def get_queryset(self):
        enrollment = get_object_or_404(
            StudentEnrollment, pk=self.kwargs['enrollment_pk']
        )
        user = self.request.user
        # Notas privadas solo visibles para su autor (excepto superuser)
        qs = StudentNote.objects.filter(enrollment=enrollment)
        if not user.is_superuser:
            qs = qs.filter(Q(is_private=False) | Q(author=user))
        return qs

    def perform_create(self, serializer):
        enrollment = get_object_or_404(
            StudentEnrollment, pk=self.kwargs['enrollment_pk']
        )
        serializer.save(enrollment=enrollment, author=self.request.user)


# ── Analytics de empresa ──────────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([TokenHasScope, IsOrganizationAdmin])
def company_analytics(request, organization_id):
    """
    GET /api/enterprise/organizations/<uuid>/analytics/
    Métricas avanzadas para el dashboard de empresa.
    """
    organization = get_object_or_404(Organization, pk=organization_id)
    now = timezone.now()

    from enterprise_courses.models import Course
    from datetime import timedelta

    enrollments = StudentEnrollment.objects.filter(organization=organization)
    active_enrollments = enrollments.filter(status='active').select_related(
        'student', 'course'
    )
    courses = Course.objects.filter(organization=organization)

    # Rendimiento general
    avg_grade = active_enrollments.aggregate(avg=Avg('overall_grade'))['avg'] or 0

    # Agregados en una sola pasada por la lista activa
    avg_completion = 0
    students_at_risk = 0
    completed_at_least_one = 0
    at_risk_list = []
    performance_distribution = {
        'excellent': 0, 'good': 0, 'satisfactory': 0,
        'needs_improvement': 0, 'poor': 0,
    }
    grade_histogram = [
        {'range': f'{b*10}-{b*10+10}', 'count': 0} for b in range(10)
    ]

    for e in active_enrollments:
        comp = e.completion_percentage
        avg_completion += comp
        if e.lessons_completed > 0:
            completed_at_least_one += 1

        performance_distribution[e.performance_level] += 1

        bucket = min(int(e.overall_grade // 10), 9)
        grade_histogram[bucket]['count'] += 1

        if e.is_at_risk:
            students_at_risk += 1
            if len(at_risk_list) < 10:
                at_risk_list.append({
                    'id': str(e.id),
                    'student_name': e.student.get_full_name() or e.student.username,
                    'student_email': e.student.email,
                    'overall_grade': round(e.overall_grade, 1),
                    'completion_percentage': comp,
                    'lessons_completed': e.lessons_completed,
                    'time_spent_minutes': e.time_spent_minutes,
                    'course_name': e.course.name if e.course else None,
                })

    total_active = active_enrollments.count()
    avg_completion = round(avg_completion / total_active, 1) if total_active else 0
    completion_rate = (
        round((completed_at_least_one / total_active) * 100, 1)
        if total_active else 0
    )

    # Totales agregados de actividad
    activity_aggregates = active_enrollments.aggregate(
        total_time=Sum('time_spent_minutes'),
        total_quizzes=Sum('quizzes_passed'),
        total_backtests=Sum('backtests_performed'),
    )
    total_time = activity_aggregates['total_time'] or 0
    total_quizzes = activity_aggregates['total_quizzes'] or 0
    total_backtests = activity_aggregates['total_backtests'] or 0
    avg_time_per_student = round(total_time / total_active, 1) if total_active else 0

    # Top performers (top 5 por nota, requiere al menos una lección completada)
    top_qs = active_enrollments.filter(lessons_completed__gt=0).order_by(
        '-overall_grade', '-lessons_completed'
    )[:5]
    top_performers = [
        {
            'id': str(e.id),
            'student_name': e.student.get_full_name() or e.student.username,
            'student_email': e.student.email,
            'overall_grade': round(e.overall_grade, 1),
            'completion_percentage': e.completion_percentage,
            'lessons_completed': e.lessons_completed,
            'quizzes_passed': e.quizzes_passed,
            'course_name': e.course.name if e.course else None,
        }
        for e in top_qs
    ]

    # Desempeño por curso
    course_performance = []
    for c in courses:
        c_enrollments = active_enrollments.filter(course=c)
        c_count = c_enrollments.count()
        if c_count == 0:
            continue
        c_avg_grade = c_enrollments.aggregate(avg=Avg('overall_grade'))['avg'] or 0
        c_avg_completion = sum(
            ce.completion_percentage for ce in c_enrollments
        ) / c_count
        course_performance.append({
            'course_id': str(c.id),
            'course_name': c.name,
            'course_code': c.code,
            'students_count': c_count,
            'average_grade': round(c_avg_grade, 1),
            'average_completion': round(c_avg_completion, 1),
        })
    # Orden descendente por nota
    course_performance.sort(key=lambda x: x['average_grade'], reverse=True)

    # Inscripciones por mes (últimos 6 meses)
    monthly_enrollments = []
    for i in range(5, -1, -1):
        month_start = (now - timedelta(days=30 * i)).replace(
            day=1, hour=0, minute=0, second=0, microsecond=0
        )
        month_end = (month_start + timedelta(days=32)).replace(day=1)
        count = enrollments.filter(
            enrollment_date__gte=month_start,
            enrollment_date__lt=month_end
        ).count()
        monthly_enrollments.append({
            'month': month_start.strftime('%Y-%m'),
            'count': count,
        })

    return Response({
        'organization': organization.name,
        'summary': {
            'total_students': enrollments.count(),
            'active_students': total_active,
            'total_courses': courses.count(),
            'active_courses': courses.filter(status='published', is_active=True).count(),
            'students_at_risk': students_at_risk,
            'average_grade': round(avg_grade, 1),
            'average_completion': avg_completion,
            'completion_rate': completion_rate,
            'total_time_invested_minutes': total_time,
            'average_time_per_student_minutes': avg_time_per_student,
            'total_quizzes_passed': total_quizzes,
            'total_backtests_performed': total_backtests,
        },
        'performance_distribution': performance_distribution,
        'grade_histogram': grade_histogram,
        'top_performers': top_performers,
        'at_risk_students': at_risk_list,
        'course_performance': course_performance,
        'monthly_enrollments': monthly_enrollments,
        'subscription': {
            'plan': organization.subscription_plan,
            'days_until_expiration': organization.days_until_expiration,
            'is_trial': organization.is_trial,
            'max_students': organization.max_students,
            'max_instructors': organization.max_instructors,
        },
    })


# TokenHasScope necesita required_scopes en la vista. Con @api_view, queda en la
# clase wrapper expuesta como `.cls`.
company_analytics.cls.required_scopes = ['read']
update_lesson_progress.cls.required_scopes = ['write']
