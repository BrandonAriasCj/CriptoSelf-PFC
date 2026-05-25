import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Clock, 
  Award, 
  TrendingUp, 
  Users, 
  Star, 
  AlertCircle, 
  CheckCircle,
  Play,
  Lock,
  BarChart3,
  Target,
  Shield
} from 'lucide-react';
import { useAcademyCategories, useUserProgress, useCategoryLessons } from '../hooks/useAcademyApi';
import LessonViewer from '../components/LessonViewer';
import ProgressStats from '../components/ProgressStats';

interface LessonCategory {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  lessons_count: number;
}

interface UserProgress {
  total_lessons: number;
  completed_lessons: number;
  completion_percentage: number;
  total_time_minutes: number;
  categories_progress: Array<{
    category: LessonCategory;
    total_lessons: number;
    completed_lessons: number;
    progress_percentage: number;
  }>;
}

interface Lesson {
  id: number;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  lesson_type: 'theory' | 'practical' | 'quiz' | 'simulation';
  duration_minutes: number;
  order: number;
  user_progress?: {
    status: 'not_started' | 'in_progress' | 'completed';
    progress_percentage: number;
  };
}

const Academy: React.FC = () => {
  const navigate = useNavigate();
  
  // Hooks para API
  const { 
    data: categories, 
    loading: categoriesLoading, 
    error: categoriesError, 
    loadCategories 
  } = useAcademyCategories();
  
  const { 
    data: userProgress, 
    loading: progressLoading, 
    error: progressError, 
    loadProgress 
  } = useUserProgress();
  
  const { 
    data: categoryLessons, 
    loading: lessonsLoading, 
    error: lessonsError, 
    loadLessons,
    reset: resetLessons
  } = useCategoryLessons();

  // Estados locales
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<number | null>(null);
  const [view, setView] = useState<'dashboard' | 'category' | 'lesson'>('dashboard');
  
  // Estados derivados
  const loading = categoriesLoading || progressLoading || lessonsLoading;
  const error = categoriesError?.message || progressError?.message || lessonsError?.message;

  useEffect(() => {
    loadAcademyData();
  }, []);

  const loadAcademyData = async () => {
    try {
      // Cargar categorías (siempre funciona, usa fallback si falla)
      await loadCategories();
      
      // Cargar progreso del usuario (puede fallar si es usuario nuevo)
      await loadProgress();
    } catch (error) {
      console.error('Error loading academy data:', error);
    }
  };

  const loadCategoryLessons = async (categoryId: number) => {
    await loadLessons(categoryId);
    setSelectedCategory(categoryId);
    setView('category');
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-chart-2 bg-chart-2/10 border border-chart-2/20';
      case 'intermediate': return 'text-chart-4 bg-chart-4/10 border border-chart-4/20';
      case 'advanced': return 'text-destructive bg-destructive/10 border border-destructive/20';
      default: return 'text-muted-foreground bg-muted border border-border';
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
      case 'theory': return <BookOpen className="w-4 h-4" />;
      case 'practical': return <BarChart3 className="w-4 h-4" />;
      case 'quiz': return <Award className="w-4 h-4" />;
      case 'simulation': return <Play className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (lesson: Lesson) => {
    if (!lesson.user_progress) {
      return <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30"></div>;
    }

    switch (lesson.user_progress.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-chart-2" />;
      case 'in_progress':
        return (
          <div className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
          </div>
        );
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30"></div>;
    }
  };

  const handleLessonClick = (lesson: Lesson) => {
    setSelectedLesson(lesson.id);
    setView('lesson');
  };

  const handleBackToDashboard = () => {
    setView('dashboard');
    setSelectedCategory(null);
    setSelectedLesson(null);
    resetLessons(); // Reset de los hooks
  };

  const handleBackToCategory = () => {
    setView('category');
    setSelectedLesson(null);
  };

  const handleLessonComplete = async () => {
    console.log(`Lección ${selectedLesson} completada`);
    
    // Recargar progreso del usuario
    await loadProgress();
    
    // Recargar lecciones de la categoría para actualizar el estado
    if (selectedCategory) {
      await loadLessons(selectedCategory);
    }
    
    // Volver a la vista de categoría
    handleBackToCategory();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Cargando Academia...</h2>
          <p className="text-muted-foreground text-sm">Preparando tu experiencia de aprendizaje</p>
        </div>
      </div>
    );
  }

  // Vista de lección individual
  if (view === 'lesson' && selectedLesson) {
    return (
      <LessonViewer
        lessonId={selectedLesson}
        onBack={handleBackToCategory}
        onComplete={handleLessonComplete}
      />
    );
  }

  // Vista de categoría (lista de lecciones)
  if (view === 'category' && selectedCategory) {
    const category = Array.isArray(categories) ? categories.find(c => c.id === selectedCategory) : null;
    const lessons = Array.isArray(categoryLessons) ? categoryLessons : [];
    const completedLessons = lessons.filter(l => l.user_progress?.status === 'completed').length;
    const progressPercentage = lessons.length > 0 ? (completedLessons / lessons.length) * 100 : 0;

    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={handleBackToDashboard}
              className="flex items-center text-primary hover:text-primary/80 mb-6 transition-colors text-sm font-medium"
            >
              ← Volver a la Academia
            </button>

            <div className="flex items-center gap-3 mb-4">
              {category && (
                <>
                  <span className="text-3xl">{category.icon}</span>
                  <div>
                    <h1 className="text-3xl font-bold text-foreground">{category.name}</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                      {lessons.length} lecciones • {completedLessons} completadas
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Progress Bar */}
            <div className="bg-muted rounded-full h-2 mb-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-1000"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-muted-foreground">
              Progreso: {progressPercentage.toFixed(1)}%
            </p>
          </div>

          {/* Lessons List */}
          <div className="space-y-3">
            {lessons.map((lesson, index) => (
              <div
                key={lesson.id}
                className="bg-card rounded-xl p-5 border border-border hover:border-primary/50 cursor-pointer hover:shadow-md transition-all duration-200"
                onClick={() => handleLessonClick(lesson)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Status Icon */}
                    <div className="mt-0.5">
                      {getStatusIcon(lesson)}
                    </div>

                    {/* Lesson Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="text-lg font-semibold text-foreground">
                          {lesson.title}
                        </h3>
                        
                        {/* Lesson Type */}
                        <div className="flex items-center text-primary">
                          {getTypeIcon(lesson.lesson_type)}
                        </div>
                      </div>

                      <p className="text-muted-foreground text-sm mb-3 leading-relaxed">
                        {lesson.description}
                      </p>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {/* Duration */}
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {lesson.duration_minutes} min
                        </div>

                        {/* Difficulty */}
                        <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${getDifficultyColor(lesson.difficulty)}`}>
                          {getDifficultyText(lesson.difficulty)}
                        </span>

                        {/* Type */}
                        <span className="text-primary">
                          {lesson.lesson_type === 'theory' ? 'Teoría' :
                           lesson.lesson_type === 'practical' ? 'Práctica' :
                           lesson.lesson_type === 'quiz' ? 'Quiz' : 'Simulación'}
                        </span>
                      </div>

                      {/* Progress Bar for In Progress Lessons */}
                      {lesson.user_progress?.status === 'in_progress' && (
                        <div className="mt-2.5">
                          <div className="bg-muted rounded-full h-1.5">
                            <div
                              className="bg-primary h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${lesson.user_progress.progress_percentage}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {lesson.user_progress.progress_percentage}% completado
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Lesson Number */}
                  <div className="text-xl font-bold text-muted-foreground/50 ml-3">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Vista principal del dashboard
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Academia de Trading
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Aprende trading desde cero hasta nivel avanzado con nuestro programa académico completo.
              Teoría, práctica y evaluaciones para convertirte en un trader exitoso.
            </p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-destructive/10 rounded-lg p-4 border border-destructive/20 flex items-center">
            <AlertCircle className="w-5 h-5 text-destructive mr-3 flex-shrink-0" />
            <p className="text-destructive text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Progress Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ProgressStats userProgress={userProgress} />
      </div>

      {/* Categories Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.isArray(categories) && categories.map((category, index) => {
            const categoryProgress = userProgress?.categories_progress.find(
              cp => cp.category.id === category.id
            );
            
            return (
              <div
                key={category.id}
                className="group cursor-pointer transition-all duration-200"
                onClick={() => loadCategoryLessons(category.id)}
              >
                <div className="bg-card rounded-xl p-6 border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300">
                  {/* Category Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div 
                        className="text-3xl p-2.5 rounded-lg"
                        style={{ backgroundColor: `${category.color}15` }}
                      >
                        {category.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                          {category.name}
                        </h3>
                        <p className="text-muted-foreground text-sm mt-0.5">
                          {category.lessons_count} lecciones
                        </p>
                      </div>
                    </div>
                    
                    {categoryProgress && (
                      <div className="text-right">
                        <div className="text-xl font-bold text-chart-2">
                          {categoryProgress.progress_percentage.toFixed(0)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {categoryProgress.completed_lessons}/{categoryProgress.total_lessons}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                    {category.description}
                  </p>

                  {/* Progress Bar */}
                  {categoryProgress && (
                    <div className="mb-4">
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full transition-all duration-500"
                          style={{
                            width: `${categoryProgress.progress_percentage}%`,
                            backgroundColor: category.color
                          }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Category Stats */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      {category.lessons_count} lecciones
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      ~{category.lessons_count * 20} min
                    </div>
                    
                    {categoryProgress && categoryProgress.progress_percentage === 100 && (
                      <div className="flex items-center gap-1 text-chart-2">
                        <Award className="w-3.5 h-3.5" />
                        Completado
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-3">
            ¿Por qué elegir nuestra Academia?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Metodología probada, contenido actualizado y enfoque práctico para tu éxito en trading
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <BookOpen className="w-6 h-6" />,
              title: "Contenido Estructurado",
              description: "Programa académico diseñado progresivamente desde conceptos básicos hasta estrategias avanzadas"
            },
            {
              icon: <Users className="w-6 h-6" />,
              title: "Evaluaciones Prácticas",
              description: "Quizzes y ejercicios prácticos para validar tu comprensión y progreso"
            },
            {
              icon: <Star className="w-6 h-6" />,
              title: "Certificaciones",
              description: "Obtén certificados al completar cada módulo y demuestra tus conocimientos"
            }
          ].map((feature, index) => (
            <div
              key={index}
              className="bg-card rounded-xl p-6 border border-border"
            >
              <div className="text-primary mb-3">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Academy;
