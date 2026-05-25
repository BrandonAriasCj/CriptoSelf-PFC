import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, Award, TrendingUp, Users, Star, AlertCircle, CheckCircle } from 'lucide-react';

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
}

const AcademyFixed: React.FC = () => {
  const [categories, setCategories] = useState<LessonCategory[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Datos de ejemplo para mostrar inmediatamente
  const mockCategories: LessonCategory[] = [
    {
      id: 1,
      name: 'Fundamentos del Trading',
      description: 'Conceptos básicos y terminología del trading',
      icon: '📚',
      color: '#3B82F6',
      lessons_count: 2
    },
    {
      id: 2,
      name: 'Análisis Técnico',
      description: 'Herramientas y técnicas de análisis técnico',
      icon: '📊',
      color: '#10B981',
      lessons_count: 1
    },
    {
      id: 3,
      name: 'Gestión de Riesgo',
      description: 'Estrategias para gestionar el riesgo en trading',
      icon: '🛡️',
      color: '#F59E0B',
      lessons_count: 1
    },
    {
      id: 4,
      name: 'Trading Algorítmico',
      description: 'Automatización y backtesting de estrategias',
      icon: '🤖',
      color: '#8B5CF6',
      lessons_count: 1
    }
  ];

  const mockProgress: UserProgress = {
    total_lessons: 5,
    completed_lessons: 2,
    completion_percentage: 40,
    total_time_minutes: 45
  };

  useEffect(() => {
    // Simular carga de datos
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Simular delay de API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Intentar cargar datos reales de la API
        try {
          const response = await fetch('/api/lessons/categories/');
          if (response.ok) {
            const realCategories = await response.json();
            setCategories(realCategories);
          } else {
            throw new Error('API no disponible');
          }
        } catch (apiError) {
          console.log('API no disponible, usando datos de ejemplo');
          setCategories(mockCategories);
          setError('Usando datos de ejemplo - API no disponible');
        }
        
        setUserProgress(mockProgress);
        
      } catch (error) {
        console.error('Error loading data:', error);
        setCategories(mockCategories);
        setUserProgress(mockProgress);
        setError('Error de conexión - Mostrando datos de ejemplo');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const handleCategoryClick = (categoryId: number) => {
    // Por ahora, mostrar alerta en lugar de navegar
    alert(`Navegando a categoría ${categoryId}. Funcionalidad en desarrollo.`);
    // En el futuro: navigate(`/academy/category/${categoryId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold mb-2">Cargando Academia...</h2>
          <p className="text-gray-300">Preparando tu experiencia de aprendizaje</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-white mb-6">
              Academia de Trading
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              esde cero hasta nivel avanzado con nuestro programa académico completo.
              Teoría, práctica y evaluaciones para convertirte en un trader exitoso.
            </p>
          </div>
        </div>
      </div>

      {/* Status Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10 mb-8">
          <div className="bg-yellow-600/20 backdrop-blur-lg rounded-xl p-4 border border-yellow-400/30 flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-400 mr-3 flex-shrink-0" />
            <p className="text-yellow-200 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Progress Overview */}
      {userProgress && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <TrendingUp className="mr-3 text-green-400" />
              Tu Progreso
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400">
                  {userProgress.completion_percentage.toFixed(1)}%
                </div>
                <div className="text-gray-300">Completado</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">
                  {userProgress.completed_lessons}
                </div>
                <div className="text-gray-300">Lecciones Completadas</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">
                  {formatTime(userProgress.total_time_minutes)}
                </div>
                <div className="text-gray-300">Tiempo Invertido</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400">
                  {categories.length}
                </div>
                <div className="text-gray-300">Módulos Disponibles</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Categories Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {categories.map((category, index) => (
            <div
              key={category.id}
              className="group cursor-pointer hover:scale-105 transition-transform duration-200"
              onClick={() => handleCategoryClick(category.id)}
            >
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:border-purple-400/50 transition-all duration-300">
                {/* Category Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center">
                    <div 
                      className="text-4xl mr-4 p-3 rounded-xl"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      {category.icon}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white group-hover:text-purple-300 transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-gray-400 mt-1">
                        {category.lessons_count} lecciones
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-400">
                      {Math.floor(Math.random() * 100)}%
                    </div>
                    <div className="text-sm text-gray-400">
                      Progreso
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-300 mb-6 leading-relaxed">
                  {category.description}
                </p>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.floor(Math.random() * 100)}%`,
                        backgroundColor: category.color
                      }}
                    ></div>
                  </div>
                </div>

                {/* Category Stats */}
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div className="flex items-center">
                    <BookOpen className="w-4 h-4 mr-2" />
                    {category.lessons_count} lecciones
                  </div>
                  
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    ~{category.lessons_count * 20} min
                  </div>
                  
                  <div className="flex items-center text-green-400">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Disponible
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            ¿Por qué elegir nuestra Academia?
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Metodología probada, contenido actualizado y enfoque práctico para tu éxito en trading
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <BookOpen className="w-8 h-8" />,
              title: "Contenido Estructurado",
              description: "Programa académico diseñado progresivamente desde conceptos básicos hasta estrategias avanzadas"
            },
            {
              icon: <Users className="w-8 h-8" />,
              title: "Evaluaciones Prácticas",
              description: "Quizzes y ejercicios prácticos para validar tu comprensión y progreso"
            },
            {
              icon: <Star className="w-8 h-8" />,
              title: "Certificaciones",
              description: "Obtén certificados al completar cada módulo y demuestra tus conocimientos"
            }
          ].map((feature, index) => (
            <div
              key={index}
              className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10"
            >
              <div className="text-purple-400 mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-300">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl p-8 border border-purple-400/30 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">
            ¡Comienza tu Viaje de Aprendizaje Hoy!
          </h3>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Únete a miles de traders que han transformado su conocimiento con nuestra academia.
            Desde principiante hasta experto, tenemos el camino perfecto para ti.
          </p>
          <button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105">
            Explorar Lecciones
          </button>
        </div>
      </div>
    </div>
  );
};

export default AcademyFixed;