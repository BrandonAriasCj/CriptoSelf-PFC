from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import Course, CourseLessonConfig, CourseTemplate, TemplateLessonConfig


class CourseLessonConfigInline(admin.TabularInline):
    model = CourseLessonConfig
    extra = 0
    fields = ('lesson', 'order', 'is_required', 'custom_passing_score', 'max_attempts')
    ordering = ('order',)


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    inlines = [CourseLessonConfigInline]
    list_display = (
        'name', 'code', 'organization', 'instructor',
        'status', 'is_active', 'enrolled_students_count',
        'start_date', 'end_date',
    )
    list_filter = ('status', 'is_active', 'organization', 'allow_backtesting')
    search_fields = ('name', 'code', 'organization__name', 'instructor__email')
    raw_id_fields = ('organization', 'instructor')
    readonly_fields = ('id', 'created_at', 'updated_at')
    date_hierarchy = 'start_date'

    fieldsets = (
        (_('Identificación'), {
            'fields': ('id', 'organization', 'name', 'code', 'description')
        }),
        (_('Académico'), {
            'fields': ('instructor', 'semester', 'credits', 'passing_grade', 'max_quiz_attempts')
        }),
        (_('Fechas'), {
            'fields': ('start_date', 'end_date', 'enrollment_deadline')
        }),
        (_('Backtesting'), {
            'fields': ('allow_backtesting', 'backtesting_symbols', 'max_backtesting_period'),
            'classes': ('collapse',),
        }),
        (_('Estado'), {
            'fields': ('status', 'is_active')
        }),
        (_('Auditoría'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )


class TemplateLessonConfigInline(admin.TabularInline):
    model = TemplateLessonConfig
    extra = 0
    fields = ('lesson', 'order', 'is_required', 'week_number')
    ordering = ('order',)


@admin.register(CourseTemplate)
class CourseTemplateAdmin(admin.ModelAdmin):
    inlines = [TemplateLessonConfigInline]
    list_display = ('name', 'template_type', 'default_duration_weeks', 'default_credits', 'is_active')
    list_filter = ('template_type', 'is_active')
    search_fields = ('name', 'description')
