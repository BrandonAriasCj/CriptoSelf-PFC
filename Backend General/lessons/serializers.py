from rest_framework import serializers
from .models import (
    LessonCategory, Lesson, LessonProgress, 
    Quiz, QuizQuestion, QuizAnswer, UserQuizAttempt
)


class LessonCategorySerializer(serializers.ModelSerializer):
    lessons_count = serializers.SerializerMethodField()
    
    class Meta:
        model = LessonCategory
        fields = ['id', 'name', 'description', 'order', 'icon', 'color', 'lessons_count']
    
    def get_lessons_count(self, obj):
        return obj.lessons.filter(is_active=True).count()


class QuizAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizAnswer
        fields = ['id', 'answer_text', 'order']
        # No incluimos is_correct por seguridad


class QuizQuestionSerializer(serializers.ModelSerializer):
    answers = QuizAnswerSerializer(many=True, read_only=True)
    
    class Meta:
        model = QuizQuestion
        fields = ['id', 'question_text', 'question_type', 'points', 'order', 'answers']


class QuizSerializer(serializers.ModelSerializer):
    questions = QuizQuestionSerializer(many=True, read_only=True)
    questions_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Quiz
        fields = ['id', 'title', 'description', 'passing_score', 'time_limit_minutes', 'questions_count', 'questions']
    
    def get_questions_count(self, obj):
        return obj.questions.count()


class LessonProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonProgress
        fields = ['id', 'status', 'progress_percentage', 'time_spent_minutes', 'score', 'max_score', 'started_at', 'completed_at']


class LessonSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_icon = serializers.CharField(source='category.icon', read_only=True)
    quiz = QuizSerializer(read_only=True)
    user_progress = serializers.SerializerMethodField()
    
    class Meta:
        model = Lesson
        fields = [
            'id', 'title', 'description', 'content', 'difficulty', 'lesson_type',
            'duration_minutes', 'order', 'video_url', 'image_url',
            'category_name', 'category_icon', 'quiz', 'user_progress'
        ]
    
    def get_user_progress(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                progress = LessonProgress.objects.get(user=request.user, lesson=obj)
                return LessonProgressSerializer(progress).data
            except LessonProgress.DoesNotExist:
                return None
        return None


class UserQuizAttemptSerializer(serializers.ModelSerializer):
    quiz_title = serializers.CharField(source='quiz.title', read_only=True)
    
    class Meta:
        model = UserQuizAttempt
        fields = ['id', 'quiz_title', 'score', 'max_score', 'percentage', 'passed', 'time_taken_minutes', 'completed_at']


class QuizSubmissionSerializer(serializers.Serializer):
    """Serializer para enviar respuestas de quiz"""
    answers = serializers.DictField(
        child=serializers.ListField(child=serializers.IntegerField()),
        help_text="Diccionario con question_id como clave y lista de answer_ids como valor"
    )
    time_taken_minutes = serializers.IntegerField(min_value=0)