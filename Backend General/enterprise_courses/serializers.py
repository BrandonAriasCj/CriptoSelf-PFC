from rest_framework import serializers
from .models import Course, CourseLessonConfig, CourseTemplate, TemplateLessonConfig


class CourseLessonConfigSerializer(serializers.ModelSerializer):
    """Configuración de una lección dentro de un curso enterprise"""
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)
    lesson_duration = serializers.IntegerField(source='lesson.duration_minutes', read_only=True)

    class Meta:
        model = CourseLessonConfig
        fields = [
            'id', 'lesson', 'lesson_title', 'lesson_duration',
            'order', 'is_required', 'unlock_after_lesson',
            'custom_passing_score', 'max_attempts',
            'available_from', 'available_until',
        ]


class CourseSerializer(serializers.ModelSerializer):
    """Serializer completo de un curso (lectura)"""
    total_lessons = serializers.ReadOnlyField()
    estimated_duration_hours = serializers.ReadOnlyField()
    enrolled_students_count = serializers.ReadOnlyField()
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    instructor_name = serializers.CharField(source='instructor.get_full_name', read_only=True)
    course_lessons = CourseLessonConfigSerializer(many=True, read_only=True)

    class Meta:
        model = Course
        fields = [
            'id', 'organization', 'organization_name',
            'name', 'code', 'description',
            'instructor', 'instructor_name',
            'semester', 'credits',
            'start_date', 'end_date', 'enrollment_deadline',
            'allow_backtesting', 'backtesting_symbols', 'max_backtesting_period',
            'passing_grade', 'max_quiz_attempts',
            'status', 'is_active',
            'total_lessons', 'estimated_duration_hours', 'enrolled_students_count',
            'course_lessons',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CourseCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para crear y actualizar cursos"""

    class Meta:
        model = Course
        fields = [
            'organization', 'name', 'code', 'description',
            'instructor', 'semester', 'credits',
            'start_date', 'end_date', 'enrollment_deadline',
            'allow_backtesting', 'backtesting_symbols', 'max_backtesting_period',
            'passing_grade', 'max_quiz_attempts',
            'status', 'is_active', 'settings',
        ]

    def validate(self, attrs):
        if attrs.get('start_date') and attrs.get('end_date'):
            if attrs['start_date'] >= attrs['end_date']:
                raise serializers.ValidationError(
                    'La fecha de inicio debe ser anterior a la fecha de fin.'
                )
        return attrs


class CourseSummarySerializer(serializers.ModelSerializer):
    """Resumen ligero para listados"""
    total_lessons = serializers.ReadOnlyField()
    enrolled_students_count = serializers.ReadOnlyField()

    class Meta:
        model = Course
        fields = [
            'id', 'name', 'code', 'status', 'is_active',
            'start_date', 'end_date',
            'total_lessons', 'enrolled_students_count',
        ]


class TemplateLessonConfigSerializer(serializers.ModelSerializer):
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)

    class Meta:
        model = TemplateLessonConfig
        fields = ['id', 'lesson', 'lesson_title', 'order', 'is_required', 'week_number']


class CourseTemplateSerializer(serializers.ModelSerializer):
    template_lessons = TemplateLessonConfigSerializer(many=True, read_only=True)

    class Meta:
        model = CourseTemplate
        fields = [
            'id', 'name', 'description', 'template_type',
            'default_duration_weeks', 'default_credits', 'default_passing_grade',
            'is_active', 'template_lessons',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
