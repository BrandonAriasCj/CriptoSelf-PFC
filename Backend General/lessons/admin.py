from django.contrib import admin
from .models import (
    LessonCategory, Lesson, LessonProgress, 
    Quiz, QuizQuestion, QuizAnswer, UserQuizAttempt
)


@admin.register(LessonCategory)
class LessonCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'order', 'icon', 'color']
    list_editable = ['order']
    ordering = ['order']


class QuizQuestionInline(admin.TabularInline):
    model = QuizQuestion
    extra = 1


class QuizAnswerInline(admin.TabularInline):
    model = QuizAnswer
    extra = 2


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ['title', 'lesson', 'passing_score', 'time_limit_minutes']
    list_filter = ['lesson__category', 'passing_score']
    inlines = [QuizQuestionInline]


@admin.register(QuizQuestion)
class QuizQuestionAdmin(admin.ModelAdmin):
    list_display = ['quiz', 'question_text', 'question_type', 'points', 'order']
    list_filter = ['question_type', 'quiz__lesson__category']
    inlines = [QuizAnswerInline]


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'difficulty', 'lesson_type', 'duration_minutes', 'order', 'is_active']
    list_filter = ['category', 'difficulty', 'lesson_type', 'is_active']
    list_editable = ['order', 'is_active']
    search_fields = ['title', 'description']
    ordering = ['category__order', 'order']


@admin.register(LessonProgress)
class LessonProgressAdmin(admin.ModelAdmin):
    list_display = ['user', 'lesson', 'status', 'progress_percentage', 'score']
    list_filter = ['status', 'lesson__category', 'lesson__difficulty']
    search_fields = ['user__username', 'lesson__title']


@admin.register(UserQuizAttempt)
class UserQuizAttemptAdmin(admin.ModelAdmin):
    list_display = ['user', 'quiz', 'percentage', 'passed', 'completed_at']
    list_filter = ['passed', 'quiz__lesson__category']
    search_fields = ['user__username', 'quiz__title']
    readonly_fields = ['started_at', 'completed_at']