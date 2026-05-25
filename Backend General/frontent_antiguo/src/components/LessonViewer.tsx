import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  ArrowLeft, 
  ArrowRight,
  CheckCircle, 
  Award,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

interface LessonViewerProps {
  lessonId: number;
  onBack: () => void;
  onComplete?: () => void;
}

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
  quiz?: {
    id: number;
    title: string;
    questions: QuizQuestion[];
    passing_score: number;
  };
}

interface QuizQuestion {
  id: number;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false';
  answers: QuizAnswer[];
}

interface QuizAnswer {
  id: number;
  answer_text: string;
}

const LessonViewer: React.FC<LessonViewerProps> = ({ lessonId, onBack, onComplete }) => {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    loadLesson();
  }, [lessonId]);

  useEffect(() => {
    let interval: number;
    
    if (isActive) {
      interval = setInterval(() => {
        setTimeSpent(prev => {
          const newTime = prev + 1;
          
          // Auto-update progress every 3 seconds (más rápido para testing)
          if (newTime % 3 === 0 && newTime > 0) {
            setProgress(currentProgress => {
              const newProgress = Math.min(100, currentProgress + 10);
              updateProgressInBackend(newProgress);
              return newProgress;
            });
          }
          
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]);

  const updateProgressInBackend = async (progressPercentage: number) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      await fetch(`/api/lessons/lessons/${lessonId}/progress/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          progress_percentage: progressPercentage,
          time_spent_minutes: Math.floor(timeSpent / 60)
        })
      });
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const loadLesson = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('access_token');
      
      // Intentar cargar desde la API
      if (token) {
        try {
          const response = await fetch(`/api/lessons/lessons/${lessonId}/`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const apiLesson = await response.json();
            setLesson(apiLesson);
            
            // Cargar progreso existente
            if (apiLesson.user_progress) {
              const existingProgress = apiLesson.user_progress.progress_percentage || 0;
              setProgress(existingProgress);
              setTimeSpent((apiLesson.user_progress.time_spent_minutes || 0) * 60);
              
              // Si ya tiene progreso, marcar como iniciado
              if (existingProgress > 0) {
                setHasStarted(true);
              }
            }
            
            // Iniciar la lección en el backend
            await fetch(`/api/lessons/lessons/${lessonId}/start/`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
            
            setIsActive(true);
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error('Error loading from API, using fallback:', error);
        }
      }
      
      // Fallback: Datos de ejemplo para la lección
      const mockLesson: Lesson = {
        id: lessonId,
        title: lessonId === 1 ? '¿Qué es el Trading?' : 'Terminología Básica del Trading',
        description: lessonId === 1 
          ? 'Introducción al mundo del trading y los mercados financieros'
          : 'Aprende los términos más importantes que todo trader debe conocer',
        content: lessonId === 1 ? `
# ¿Qué es el Trading?

El **trading** es la compra y venta de instrumentos financieros con el objetivo de obtener beneficios a corto plazo. A diferencia de la inversión a largo plazo, el trading se centra en aprovechar las fluctuaciones de precios en períodos más cortos.

## Conceptos Clave

### 1. Mercados Financieros
Los mercados financieros son plataformas donde se negocian activos como:
- **Acciones**: Participaciones en empresas
- **Forex**: Divisas internacionales
- **Criptomonedas**: Monedas digitales como Bitcoin, Ethereum
- **Commodities**: Materias primas como oro, petróleo

### 2. Tipos de Trading
- **Day Trading**: Operaciones que se abren y cierran el mismo día
- **Swing Trading**: Operaciones que duran días o semanas
- **Scalping**: Operaciones muy rápidas, minutos o segundos
- **Position Trading**: Operaciones a largo plazo

### 3. Participantes del Mercado
- **Retail Traders**: Traders individuales
- **Institucionales**: Bancos, fondos de inversión
- **Market Makers**: Proveedores de liquidez

## Ventajas y Riesgos

### Ventajas
✅ Potencial de ganancias rápidas
✅ Flexibilidad horaria
✅ Acceso global a mercados
✅ Apalancamiento disponible

### Riesgos
⚠️ Pérdidas pueden ser significativas
⚠️ Requiere conocimiento y experiencia
⚠️ Estrés emocional
⚠️ Costos de transacción

## Conclusión
El trading puede ser una actividad lucrativa, pero requiere educación, práctica y una gestión adecuada del riesgo.
        ` : `
# Terminología Básica del Trading

## Términos Fundamentales

### Posiciones
- **Long (Compra)**: Apostar a que el precio subirá
- **Short (Venta)**: Apostar a que el precio bajará
- **Posición Abierta**: Operación activa en el mercado
- **Posición Cerrada**: Operación finalizada

### Precios
- **Bid**: Precio de compra (lo que pagan por tu activo)
- **Ask**: Precio de venta (lo que pagas por el activo)
- **Spread**: Diferencia entre Bid y Ask
- **Slippage**: Diferencia entre precio esperado y ejecutado

### Órdenes
- **Market Order**: Orden a precio de mercado (inmediata)
- **Limit Order**: Orden a precio específico
- **Stop Loss**: Orden para limitar pérdidas
- **Take Profit**: Orden para asegurar ganancias

### Análisis
- **Soporte**: Nivel donde el precio tiende a rebotar hacia arriba
- **Resistencia**: Nivel donde el precio tiende a rebotar hacia abajo
- **Tendencia**: Dirección general del precio (alcista, bajista, lateral)
- **Volatilidad**: Medida de variación del precio

## Consejos Importantes
1. **Nunca inviertas más de lo que puedes permitirte perder**
2. **La educación es tu mejor inversión**
3. **Practica con cuentas demo antes de usar dinero real**
4. **Mantén un diario de trading**
        `,
        difficulty: 'beginner',
        lesson_type: lessonId === 2 ? 'quiz' : 'theory',
        duration_minutes: lessonId === 1 ? 15 : 20,
        category_name: 'Fundamentos del Trading',
        category_icon: '📚',
        quiz: lessonId === 2 ? {
          id: 1,
          title: 'Quiz: Terminología Básica',
          passing_score: 70,
          questions: [
            {
              id: 1,
              question_text: '¿Qué significa "Long" en trading?',
              question_type: 'multiple_choice',
              answers: [
                { id: 1, answer_text: 'Apostar a que el precio bajará' },
                { id: 2, answer_text: 'Apostar a que el precio subirá' },
                { id: 3, answer_text: 'Mantener una posición por mucho tiempo' }
              ]
            },
            {
              id: 2,
              question_text: '¿Qué es el "Spread"?',
              question_type: 'multiple_choice',
              answers: [
                { id: 4, answer_text: 'La diferencia entre Bid y Ask' },
                { id: 5, answer_text: 'El apalancamiento máximo' },
                { id: 6, answer_text: 'La volatilidad del mercado' }
              ]
            }
          ]
        } : undefined
      };
      
      setLesson(mockLesson);
      setIsActive(true);
    } catch (error) {
      console.error('Error loading lesson:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeLesson = async () => {
    setProgress(100);
    setIsActive(false);
    
    // Actualizar progreso al 100% en el backend
    await updateProgressInBackend(100);
    
    if (lesson?.quiz) {
      setShowQuiz(true);
    } else {
      onComplete?.();
    }
  };

  const handleQuizAnswer = (questionId: number, answerId: number) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: answerId
    }));
  };

  const submitQuiz = async () => {
    const token = localStorage.getItem('access_token');
    
    if (token && lesson?.quiz) {
      try {
        // Convertir formato de respuestas para el backend
        const answers: Record<string, number[]> = {};
        Object.entries(quizAnswers).forEach(([questionId, answerId]) => {
          answers[questionId] = [answerId];
        });
        
        const response = await fetch(`/api/lessons/quizzes/${lesson.quiz.id}/submit/`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            answers,
            time_taken_minutes: Math.floor(timeSpent / 60)
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          setQuizResult({
            score: result.attempt.score,
            totalQuestions: result.attempt.max_score,
            percentage: result.attempt.percentage,
            passed: result.attempt.passed
          });
          setQuizSubmitted(true);
          
          if (result.attempt.passed) {
            onComplete?.();
          }
          return;
        }
      } catch (error) {
        console.error('Error submitting quiz, using fallback:', error);
      }
    }
    
    // Fallback: evaluación local
    const correctAnswers = { 1: 2, 2: 4 };
    let score = 0;
    const totalQuestions = Object.keys(correctAnswers).length;
    
    Object.entries(correctAnswers).forEach(([questionId, correctAnswerId]) => {
      if (quizAnswers[parseInt(questionId)] === correctAnswerId) {
        score++;
      }
    });
    
    const percentage = (score / totalQuestions) * 100;
    const passed = percentage >= (lesson?.quiz?.passing_score || 70);
    
    setQuizResult({
      score,
      totalQuestions,
      percentage,
      passed
    });
    setQuizSubmitted(true);
    
    if (passed) {
      onComplete?.();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Lección no encontrada</h2>
          <button
            onClick={onBack}
            className="text-primary hover:text-primary/80"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center text-primary hover:text-primary/80 mb-6 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </button>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{lesson.category_icon}</span>
              <div>
                <h1 className="text-3xl font-bold text-foreground">{lesson.title}</h1>
                <p className="text-muted-foreground text-sm mt-1">{lesson.category_name}</p>
              </div>
            </div>

            {/* Timer and Controls */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-mono text-primary">
                  {formatTime(timeSpent)}
                </div>
                <div className="text-xs text-muted-foreground">
                  ~{lesson.duration_minutes} min
                </div>
              </div>
              
              <button
                onClick={() => setIsActive(!isActive)}
                className="p-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
              >
                {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-muted rounded-full h-2 mb-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progreso: {progress}%</span>
            <span>
              {progress === 0 ? 'No iniciada' : 
               progress === 100 ? '✅ Completada' : 
               progress >= 50 ? '🎯 Casi lista' : 
               '📖 En progreso'}
            </span>
          </div>
        </div>

        {/* Lesson Content */}
        {!showQuiz && (
          <div className="bg-card rounded-xl p-10 md:p-12 border border-border mb-8">
            <div className="prose prose-lg max-w-none
              prose-headings:text-foreground prose-headings:font-bold prose-headings:tracking-tight
              prose-h1:text-4xl prose-h1:mb-8 prose-h1:mt-0 prose-h1:pb-4 prose-h1:border-b-2 prose-h1:border-border
              prose-h2:text-3xl prose-h2:mb-6 prose-h2:mt-12 prose-h2:pb-3 prose-h2:border-b prose-h2:border-border/50
              prose-h3:text-2xl prose-h3:mb-5 prose-h3:mt-10 prose-h3:text-primary
              prose-h4:text-xl prose-h4:mb-4 prose-h4:mt-8
              prose-p:text-muted-foreground prose-p:leading-loose prose-p:mb-6 prose-p:text-base prose-p:indent-0
              prose-strong:text-foreground prose-strong:font-semibold
              prose-em:text-foreground prose-em:italic
              prose-ul:text-muted-foreground prose-ul:my-6 prose-ul:space-y-3 prose-ul:pl-6
              prose-ol:text-muted-foreground prose-ol:my-6 prose-ol:space-y-3 prose-ol:pl-6
              prose-li:my-2 prose-li:leading-loose prose-li:text-base prose-li:pl-2
              prose-li>ul:mt-3 prose-li>ul:mb-3 prose-li>ul:ml-6 prose-li>ul:pl-6
              prose-li>ol:mt-3 prose-li>ol:mb-3 prose-li>ol:ml-6 prose-li>ol:pl-6
              prose-code:text-primary prose-code:bg-muted prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-lg prose-pre:p-6 prose-pre:my-6 prose-pre:overflow-x-auto
              prose-blockquote:border-l-4 prose-blockquote:border-l-primary prose-blockquote:pl-6 prose-blockquote:py-4 prose-blockquote:my-6 prose-blockquote:italic prose-blockquote:text-muted-foreground prose-blockquote:bg-muted/30 prose-blockquote:rounded-r
              prose-a:text-primary prose-a:no-underline prose-a:font-medium hover:prose-a:underline hover:prose-a:text-primary/80
              prose-hr:border-border prose-hr:my-10
              prose-table:border-collapse prose-table:w-full prose-table:my-6
              prose-th:border prose-th:border-border prose-th:bg-muted prose-th:px-4 prose-th:py-3 prose-th:text-left prose-th:font-semibold prose-th:text-foreground
              prose-td:border prose-td:border-border prose-td:px-4 prose-td:py-3 prose-td:text-muted-foreground
              prose-img:rounded-lg prose-img:shadow-md prose-img:my-6
            ">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {lesson.content}
              </ReactMarkdown>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
              {!hasStarted ? (
                <button
                  onClick={() => {
                    setHasStarted(true);
                    setIsActive(true);
                    const newProgress = Math.max(10, progress);
                    setProgress(newProgress);
                    updateProgressInBackend(newProgress);
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors font-medium shadow-lg"
                >
                  <Play className="w-5 h-5" />
                  Comenzar Lección
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      const newProgress = Math.min(100, progress + 20);
                      setProgress(newProgress);
                      updateProgressInBackend(newProgress);
                    }}
                    disabled={progress >= 100}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground rounded-lg transition-colors text-sm font-medium"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Avanzar +20%
                  </button>

                  {progress >= 50 && progress < 100 && (
                    <button
                      onClick={completeLesson}
                      className="flex items-center gap-2 px-6 py-2 bg-chart-2 hover:bg-chart-2/90 text-white rounded-lg transition-colors text-sm font-medium shadow-lg"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Completar Lección
                    </button>
                  )}

                  {progress >= 100 && !lesson?.quiz && (
                    <button
                      onClick={onBack}
                      className="flex items-center gap-2 px-6 py-2 bg-chart-2 hover:bg-chart-2/90 text-white rounded-lg transition-colors text-sm font-medium shadow-lg"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Lección Completada - Volver
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Quiz Section */}
        {showQuiz && lesson.quiz && (
          <div className="bg-card rounded-xl p-8 border border-border">
            <div className="flex items-center gap-3 mb-6">
              <Award className="w-6 h-6 text-chart-4" />
              <h2 className="text-2xl font-bold text-foreground">{lesson.quiz.title}</h2>
            </div>

            {!quizSubmitted ? (
              <>
                <p className="text-muted-foreground mb-6 text-sm">
                  Responde las siguientes preguntas para completar la lección. 
                  Puntuación mínima requerida: {lesson.quiz.passing_score}%
                </p>

                <div className="space-y-4">
                  {lesson.quiz.questions.map((question, index) => (
                    <div key={question.id} className="bg-muted/30 rounded-lg p-5 border border-border">
                      <h3 className="text-base font-semibold text-foreground mb-4">
                        {index + 1}. {question.question_text}
                      </h3>

                      <div className="space-y-2">
                        {question.answers.map((answer) => (
                          <label
                            key={answer.id}
                            className="flex items-center cursor-pointer hover:bg-muted/50 p-3 rounded-lg transition-colors border border-transparent hover:border-border"
                          >
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              value={answer.id}
                              onChange={() => handleQuizAnswer(question.id, answer.id)}
                              className="mr-3 accent-primary"
                            />
                            <span className="text-foreground text-sm">{answer.answer_text}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center mt-8">
                  <button
                    onClick={() => setShowQuiz(false)}
                    className="flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Volver al contenido
                  </button>

                  <button
                    onClick={submitQuiz}
                    disabled={Object.keys(quizAnswers).length < lesson.quiz.questions.length}
                    className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground rounded-lg transition-colors text-sm font-medium"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Enviar Respuestas
                  </button>
                </div>
              </>
            ) : (
              /* Quiz Results */
              <div className="text-center">
                <div className={`text-6xl mb-4 ${quizResult.passed ? 'text-chart-2' : 'text-destructive'}`}>
                  {quizResult.passed ? '🎉' : '😔'}
                </div>
                
                <h3 className={`text-2xl font-bold mb-4 ${quizResult.passed ? 'text-chart-2' : 'text-destructive'}`}>
                  {quizResult.passed ? '¡Felicitaciones!' : 'No aprobaste'}
                </h3>
                
                <p className="text-muted-foreground mb-6">
                  Obtuviste {quizResult.percentage.toFixed(1)}% 
                  ({quizResult.score}/{quizResult.totalQuestions} correctas)
                </p>

                <div className="flex justify-center gap-4">
                  {!quizResult.passed && (
                    <button
                      onClick={() => {
                        setQuizSubmitted(false);
                        setQuizAnswers({});
                        setQuizResult(null);
                      }}
                      className="flex items-center gap-2 px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors text-sm font-medium"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Intentar de nuevo
                    </button>
                  )}
                  
                  <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-6 py-2 bg-chart-2 hover:bg-chart-2/90 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    <ArrowRight className="w-4 h-4" />
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

export default LessonViewer;