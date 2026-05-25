import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight,
  CheckCircle, 
  Clock, 
  BookOpen, 
  Award,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import api from '../services/api';
// import ReactMarkdown from 'react-markdown';

interface Lesson {
  id: number;
  title: string;
  description: string;
  content: string;
  difficulty: string;
  lesson_type: string;
  duration_minutes: number;
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
    questions: QuizQuestion[];
  };
}

interface QuizQuestion {
  id: number;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'text';
  points: number;
  answers: QuizAnswer[];
}

interface QuizAnswer {
  id: number;
  answer_text: string;
}

const LessonDetail: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number[]>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);

  useEffect(() => {
    if (lessonId) {
      loadLesson();
    }
  }, [lessonId]);

  useEffect(() => {
    let interval: number;
    
    if (isActive) {
      interval = setInterval(() => {
        setTimeSpent(prev => prev + 1);
        
        // Auto-update progress every 30 seconds
        if (timeSpent % 30 === 0 && timeSpent > 0) {
          updateProgress();
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeSpent]);

  const loadLesson = async () => {
    try {
      const response = await api.get(`/lessons/lessons/${lessonId}/`);
      setLesson(response.data);
      
      // Start lesson automatically
      await api.post(`/lessons/lessons/${lessonId}/start/`);
      setIsActive(true);
      
      // Set initial progress
      if (response.data.user_progress) {
        setProgress(response.data.user_progress.progress_percentage);
      }
    } catch (error) {
      console.error('Error loading lesson:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async () => {
    if (!lesson) return;

    try {
      const progressPercentage = Math.min(100, progress + 10);
      
      await api.post(`/lessons/lessons/${lesson.id}/progress/`, {
        progress_percentage: progressPercentage,
        time_spent_minutes: Math.floor(timeSpent / 60)
      });
      
      setProgress(progressPercentage);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const completeLesson = async () => {
    if (!lesson) return;

    try {
      await api.post(`/lessons/lessons/${lesson.id}/progress/`, {
        progress_percentage: 100,
        time_spent_minutes: Math.floor(timeSpent / 60)
      });
      
      setProgress(100);
      setIsActive(false);
      
      // Show quiz if available
      if (lesson.quiz) {
        setShowQuiz(true);
      }
    } catch (error) {
      console.error('Error completing lesson:', error);
    }
  };

  const handleQuizAnswer = (questionId: number, answerId: number) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: [answerId] // For now, single answer only
    }));
  };

  const submitQuiz = async () => {
    if (!lesson?.quiz) return;

    try {
      const response = await api.post(`/lessons/quizzes/${lesson.quiz.id}/submit/`, {
        answers: quizAnswers,
        time_taken_minutes: Math.floor(timeSpent / 60)
      });
      
      setQuizResult(response.data);
      setQuizSubmitted(true);
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Lección no encontrada</h2>
          <button
            onClick={() => navigate('/academy')}
            className="text-purple-400 hover:text-purple-300"
          >
            Volver a la Academia
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-purple-400 hover:text-purple-300 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver
          </button>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <span className="text-3xl mr-4">{lesson.category_icon}</span>
              <div>
                <h1 className="text-3xl font-bold text-white">{lesson.title}</h1>
                <p className="text-gray-300 mt-1">{lesson.category_name}</p>
              </div>
            </div>

            {/* Timer and Controls */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-2xl font-mono text-purple-400">
                  {formatTime(timeSpent)}
                </div>
                <div className="text-sm text-gray-400">
                  ~{lesson.duration_minutes} min
                </div>
              </div>
              
              <button
                onClick={() => setIsActive(!isActive)}
                className="p-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white transition-colors"
              >
                {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-gray-700 rounded-full h-3 mb-4">
            <div
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-400">
            <span>Progreso: {progress}%</span>
            <span>{progress === 100 ? 'Completada' : 'En progreso'}</span>
          </div>
        </div>

        {/* Lesson Content */}
        {!showQuiz && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20 mb-8">
            <div className="prose prose-invert prose-purple max-w-none">
              <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {lesson.content}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/20">
              <button
                onClick={() => setProgress(Math.min(100, progress + 25))}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Continuar
              </button>

              {progress >= 80 && (
                <button
                  onClick={completeLesson}
                  className="flex items-center px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Completar Lección
                </button>
              )}
            </div>
          </div>
        )}

        {/* Quiz Section */}
        {showQuiz && lesson.quiz && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20">
            <div className="flex items-center mb-6">
              <Award className="w-6 h-6 text-yellow-400 mr-3" />
              <h2 className="text-2xl font-bold text-white">{lesson.quiz.title}</h2>
            </div>

            {!quizSubmitted ? (
              <>
                <p className="text-gray-300 mb-6">
                  Responde las siguientes preguntas para completar la lección. 
                  Puntuación mínima requerida: {lesson.quiz.passing_score}%
                </p>

                <div className="space-y-6">
                  {lesson.quiz.questions.map((question, index) => (
                    <div key={question.id} className="bg-white/5 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">
                        {index + 1}. {question.question_text}
                      </h3>

                      <div className="space-y-3">
                        {question.answers.map((answer) => (
                          <label
                            key={answer.id}
                            className="flex items-center cursor-pointer hover:bg-white/5 p-3 rounded-lg transition-colors"
                          >
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              value={answer.id}
                              onChange={() => handleQuizAnswer(question.id, answer.id)}
                              className="mr-3 text-purple-600"
                            />
                            <span className="text-gray-300">{answer.answer_text}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center mt-8">
                  <button
                    onClick={() => setShowQuiz(false)}
                    className="flex items-center px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver al contenido
                  </button>

                  <button
                    onClick={submitQuiz}
                    disabled={Object.keys(quizAnswers).length < lesson.quiz.questions.length}
                    className="flex items-center px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Enviar Respuestas
                  </button>
                </div>
              </>
            ) : (
              /* Quiz Results */
              <div className="text-center">
                <div className={`text-6xl mb-4 ${quizResult.attempt.passed ? 'text-green-400' : 'text-red-400'}`}>
                  {quizResult.attempt.passed ? '🎉' : '😔'}
                </div>
                
                <h3 className={`text-2xl font-bold mb-4 ${quizResult.attempt.passed ? 'text-green-400' : 'text-red-400'}`}>
                  {quizResult.attempt.passed ? '¡Felicitaciones!' : 'No aprobaste'}
                </h3>
                
                <p className="text-gray-300 mb-6">
                  Obtuviste {quizResult.attempt.percentage.toFixed(1)}% 
                  ({quizResult.attempt.score}/{quizResult.attempt.max_score} puntos)
                </p>

                <div className="flex justify-center space-x-4">
                  {!quizResult.attempt.passed && (
                    <button
                      onClick={() => {
                        setQuizSubmitted(false);
                        setQuizAnswers({});
                        setQuizResult(null);
                      }}
                      className="flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Intentar de nuevo
                    </button>
                  )}
                  
                  <button
                    onClick={() => navigate('/academy')}
                    className="flex items-center px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Continuar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonDetail;