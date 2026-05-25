from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import StudentEnrollment, LessonProgress, StudentGroup, StudentNote

User = get_user_model()


class LessonProgressSerializer(serializers.ModelSerializer):
    """Progreso de un estudiante en una lección específica"""
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)
    percentage_score = serializers.ReadOnlyField()

    class Meta:
        model = LessonProgress
        fields = [
            'id', 'lesson', 'lesson_title',
            'status', 'progress_percentage', 'time_spent_minutes',
            'score', 'max_score', 'percentage_score', 'attempts',
            'started_at', 'completed_at', 'last_accessed',
        ]
        read_only_fields = ['id', 'started_at', 'completed_at', 'last_accessed']


class StudentEnrollmentSerializer(serializers.ModelSerializer):
    """Inscripción completa de un estudiante (lectura)"""
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_email = serializers.EmailField(source='student.email', read_only=True)
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)
    completion_percentage = serializers.ReadOnlyField()
    performance_level = serializers.ReadOnlyField()
    is_at_risk = serializers.ReadOnlyField()
    lesson_progress = LessonProgressSerializer(many=True, read_only=True)

    class Meta:
        model = StudentEnrollment
        fields = [
            'id', 'student', 'student_name', 'student_email',
            'organization', 'organization_name',
            'course', 'course_name',
            'institutional_id', 'enrollment_date', 'expected_graduation',
            'status', 'overall_grade', 'lessons_completed',
            'quizzes_passed', 'backtests_performed', 'time_spent_minutes',
            'completion_percentage', 'performance_level', 'is_at_risk',
            'lesson_progress',
            'instructor_notes', 'custom_settings',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'enrollment_date', 'created_at', 'updated_at',
            'completion_percentage', 'performance_level', 'is_at_risk',
        ]


class StudentEnrollmentCreateSerializer(serializers.ModelSerializer):
    """Crear inscripción de estudiante"""

    class Meta:
        model = StudentEnrollment
        fields = [
            'student', 'organization', 'course',
            'institutional_id', 'expected_graduation',
            'custom_settings', 'instructor_notes',
        ]

    def validate(self, attrs):
        # Evitar duplicados
        qs = StudentEnrollment.objects.filter(
            student=attrs['student'],
            organization=attrs['organization'],
            course=attrs.get('course'),
        )
        if qs.exists():
            raise serializers.ValidationError(
                'Este estudiante ya está inscrito en este curso de la organización.'
            )
        return attrs


class StudentEnrollmentUpdateSerializer(serializers.ModelSerializer):
    """Actualizar estado/calificación de un estudiante"""

    class Meta:
        model = StudentEnrollment
        fields = [
            'status', 'overall_grade', 'lessons_completed',
            'quizzes_passed', 'backtests_performed', 'time_spent_minutes',
            'expected_graduation', 'instructor_notes', 'custom_settings',
        ]


class StudentSummarySerializer(serializers.ModelSerializer):
    """Resumen ligero para listados de gestión"""
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_email = serializers.EmailField(source='student.email', read_only=True)
    completion_percentage = serializers.ReadOnlyField()
    performance_level = serializers.ReadOnlyField()
    is_at_risk = serializers.ReadOnlyField()

    class Meta:
        model = StudentEnrollment
        fields = [
            'id', 'student', 'student_name', 'student_email',
            'institutional_id', 'status', 'overall_grade',
            'lessons_completed', 'completion_percentage',
            'performance_level', 'is_at_risk',
            'enrollment_date',
        ]


class StudentGroupSerializer(serializers.ModelSerializer):
    """Grupo de estudiantes"""
    students_count = serializers.ReadOnlyField()
    average_performance = serializers.ReadOnlyField()
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = StudentGroup
        fields = [
            'id', 'organization', 'course',
            'name', 'description',
            'students', 'students_count', 'average_performance',
            'is_active', 'created_by', 'created_by_name', 'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'created_by']

    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class StudentNoteSerializer(serializers.ModelSerializer):
    """Nota sobre un estudiante"""
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)

    class Meta:
        model = StudentNote
        fields = [
            'id', 'enrollment', 'author', 'author_name',
            'note_type', 'title', 'content',
            'is_private', 'is_important',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'author', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)
