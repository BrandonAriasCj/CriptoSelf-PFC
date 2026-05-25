import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Play, 
  CheckCircle, 
  Clock, 
  BookOpen, 
  Award,
  Lock,
  BarChart3
} from 'lucide-react';
import api from '../services/api';

interface Lesson {
  id: number;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  lesson_type: 'theory' | 'practical' | 'quiz' | 'simulation';
  duration_minutes: number;
  order: number;
  category_name: string;
  category_icon: string;
  user_progress?: {
    status: 'not_started' | 'in_progress' | 'completed';
    progress_percentage: number;
    score?: number;
    max_score?: number;
  };
  quiz?: {
    id: number;
    title: string;
    questions_count: number;
    passing_score: number;
  };
}

const CategoryLessons: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState('');

  useEffect(() => {
    if (categoryId) {
      loadLessons();
    }
  }, [categoryId]);

  const loadLessons = async () => {
    try {
      const response = await api.get(`/lessons/categories/${categoryId}/lessons/`);
      setLessons(response.data);
      if (response.data.length > 0) {
        setCategoryName(response.data[0].category_name);
      }
    } catch (error) {
      console.error('Error loading lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400 bg-green-400/20';
      case 'intermediate': return 'text-yellow-400 bg-yellow-400/20';
      case 'advanced': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'Principiante';
      case 'intermediate': return 'Intermedio';
      case 'advanced': return 'Avanzado';
      default: return difficulty;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'theory': return <BookOpen className="w-5 h-5" />;
      case 'practical': return <BarChart3 className="w-5 h-5" />;
      case 'quiz': return <Award className="w-5 h-5" />;
      case 'simulation': return <Play className="w-5 h-5" />;
      default: return <BookOpen className="w-5 h-5" />;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'theory': return 'Teoría';
      case 'practical': return 'Práctica';
      case 'quiz': return 'Quiz';
      case 'simulation': return 'Simulación';
      default: return type;
    }
  };

  const getStatusIcon = (lesson: Lesson) => {
    if (!lesson.user_progress) {
      return <div className="w-6 h-6 rounded-full border-2 border-gray-400"></div>;
    }

    switch (lesson.user_progress.status) {
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-400" />;
      case 'in_progress':
        return (
          <div className="w-6 h-6 rounded-full border-2 border-blue-400 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-blue-400"></div>
          </div>
        );
      default:
        return <div className="w-6 h-6 rounded-full border-2 border-gray-400"></div>;
    }
  };

  const isLessonLocked = (lesson: Lesson, index: number) => {
    if (index === 0) return false; // Primera lección siempre desbloqueada
    
    const previousLesson = lessons[index - 1];
    return !previousLesson.user_progress || previousLesson.user_progress.status !== 'completed';
  };

  const handleLessonClick = (lesson: Lesson, index: number) => {
    if (isLessonLocked(lesson, index)) {
      return; // No hacer nada si está bloqueada
    }
    
    navigate(`/academy/lesson/${lesson.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  const completedLessons = lessons.filter(l => l.user_progress?.status === 'completed').length;
  const progressPercentage = lessons.length > 0 ? (completedLessons / lessons.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => navigate('/academy')}
            className="flex items-center text-purple-400 hover:text-purple-300 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver a la Academia
          </button>

          <div className="flex items-center mb-4">
            {lessons[0]?.category_icon && (
              <span className="text-4xl mr-4">{lessons[0].category_icon}</span>
            )}
            <div>
              <h1 className="text-4xl font-bold text-white">{categoryName}</h1>
              <p className="text-gray-300 mt-2">
                {lessons.length} lecciones • {completedLessons} completadas
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-gray-700 rounded-full h-3 mb-4">
            <div
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-1000"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-400">
            Progreso: {progressPercentage.toFixed(1)}%
          </p>
        </div>

        {/* Lessons List */}
        <div className="space-y-4">
          {lessons.map((lesson, index) => {
            const isLocked = isLessonLocked(lesson, index);
            
            return (
              <div
                key={lesson.id}
                className={`
                  bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20
                  ${isLocked 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:border-purple-400/50 cursor-pointer hover:bg-white/15'
                  }
                  transition-all duration-300
                `}
                onClick={() => handleLessonClick(lesson, index)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Status Icon */}
                    <div className="mt-1">
                      {isLocked ? (
                        <Lock className="w-6 h-6 text-gray-500" />
                      ) : (
                        getStatusIcon(lesson)
                      )}
                    </div>

                    {/* Lesson Content */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold text-white">
                          {lesson.title}
                        </h3>
                        
                        {/* Lesson Type */}
                        <div className="flex items-center space-x-1 text-purple-400">
                          {getTypeIcon(lesson.lesson_type)}
                          <span className="text-sm">{getTypeText(lesson.lesson_type)}</span>
                        </div>
                      </div>

                      <p className="text-gray-300 mb-3 leading-relaxed">
                        {lesson.description}
                      </p>

                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        {/* Duration */}
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {lesson.duration_minutes} min
                        </div>

                        {/* Difficulty */}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(lesson.difficulty)}`}>
                          {getDifficultyText(lesson.difficulty)}
                        </span>

                        {/* Quiz Info */}
                        {lesson.quiz && (
                          <div className="flex items-center text-yellow-400">
                            <Award className="w-4 h-4 mr-1" />
                            Quiz ({lesson.quiz.questions_count} preguntas)
                          </div>
                        )}

                        {/* Score */}
                        {lesson.user_progress?.score !== undefined && (
                          <div className="text-green-400">
                            Puntuación: {lesson.user_progress.score}/{lesson.user_progress.max_score}
                          </div>
                        )}
                      </div>

                      {/* Progress Bar for In Progress Lessons */}
                      {lesson.user_progress?.status === 'in_progress' && (
                        <div className="mt-3">
                          <div className="bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${lesson.user_progress.progress_percentage}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            {lesson.user_progress.progress_percentage}% completado
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Lesson Number */}
                  <div className="text-2xl font-bold text-gray-500 ml-4">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {lessons.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              No hay lecciones disponibles
            </h3>
            <p className="text-gray-500">
              Las lecciones para esta categoría estarán disponibles pronto.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryLessons;