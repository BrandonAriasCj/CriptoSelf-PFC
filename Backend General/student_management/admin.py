from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import StudentEnrollment, LessonProgress, StudentGroup, StudentNote


class LessonProgressInline(admin.TabularInline):
    model = LessonProgress
    extra = 0
    readonly_fields = ('lesson', 'status', 'progress_percentage', 'score', 'attempts', 'completed_at')
    fields = ('lesson', 'status', 'progress_percentage', 'score', 'attempts', 'completed_at')
    can_delete = False


class StudentNoteInline(admin.StackedInline):
    model = StudentNote
    extra = 0
    fields = ('note_type', 'title', 'content', 'is_private', 'is_important', 'author')
    raw_id_fields = ('author',)


@admin.register(StudentEnrollment)
class StudentEnrollmentAdmin(admin.ModelAdmin):
    inlines = [LessonProgressInline, StudentNoteInline]
    list_display = (
        'student', 'organization', 'course',
        'institutional_id', 'status', 'overall_grade',
        'lessons_completed', 'enrollment_date',
    )
    list_filter = ('status', 'organization', 'course')
    search_fields = (
        'student__email', 'student__first_name', 'student__last_name',
        'institutional_id', 'organization__name', 'course__name',
    )
    raw_id_fields = ('student', 'organization', 'course')
    readonly_fields = ('id', 'enrollment_date', 'created_at', 'updated_at')
    date_hierarchy = 'enrollment_date'

    fieldsets = (
        (_('Identificación'), {
            'fields': ('id', 'student', 'organization', 'course', 'institutional_id')
        }),
        (_('Estado'), {
            'fields': ('status', 'enrollment_date', 'expected_graduation')
        }),
        (_('Rendimiento'), {
            'fields': (
                'overall_grade', 'lessons_completed',
                'quizzes_passed', 'backtests_performed', 'time_spent_minutes',
            )
        }),
        (_('Notas y configuración'), {
            'fields': ('instructor_notes', 'custom_settings'),
            'classes': ('collapse',),
        }),
        (_('Auditoría'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )


@admin.register(StudentGroup)
class StudentGroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'organization', 'course', 'students_count', 'is_active', 'created_at')
    list_filter = ('organization', 'is_active')
    search_fields = ('name', 'organization__name')
    raw_id_fields = ('organization', 'course', 'created_by')


@admin.register(StudentNote)
class StudentNoteAdmin(admin.ModelAdmin):
    list_display = ('title', 'enrollment', 'author', 'note_type', 'is_important', 'created_at')
    list_filter = ('note_type', 'is_private', 'is_important')
    search_fields = ('title', 'enrollment__student__email', 'author__email')
    raw_id_fields = ('enrollment', 'author')
