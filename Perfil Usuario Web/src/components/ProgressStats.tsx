import React from 'react';
import { TrendingUp, Clock, Award, Target, BookOpen, CheckCircle } from 'lucide-react';

interface ProgressStatsProps {
  userProgress?: {
    total_lessons: number;
    completed_lessons: number;
    completion_percentage: number;
    total_time_minutes: number;
    categories_progress: Array<{
      category: {
        id: number;
        name: string;
        icon: string;
        color: string;
      };
      total_lessons: number;
      completed_lessons: number;
      progress_percentage: number;
    }>;
  };
}

const ProgressStats: React.FC<ProgressStatsProps> = ({ userProgress }) => {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (!userProgress) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <TrendingUp className="mr-3 text-green-400" />
          Tu Progreso
        </h2>
        
        <div className="text-center py-8">
          <BookOpen className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">Comienza tu primera lección para ver tu progreso aquí</p>
        </div>
      </div>
    );
  }

  const completedModules = userProgress.categories_progress.filter(c => c.progress_percentage === 100).length;

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-8">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
        <TrendingUp className="mr-3 text-green-400" />
        Tu Progreso
      </h2>
      
      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
            {completedModules}
          </div>
          <div className="text-gray-300">Módulos Completados</div>
        </div>
      </div>

      {/* Progress by Category */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <Target className="mr-2 text-purple-400" />
          Progreso por Módulo
        </h3>
        
        <div className="space-y-4">
          {userProgress.categories_progress.map((categoryProgress) => (
            <div key={categoryProgress.category.id} className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{categoryProgress.category.icon}</span>
                  <div>
                    <h4 className="font-medium text-white">{categoryProgress.category.name}</h4>
                    <p className="text-sm text-gray-400">
                      {categoryProgress.completed_lessons}/{categoryProgress.total_lessons} lecciones
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-bold" style={{ color: categoryProgress.category.color }}>
                    {categoryProgress.progress_percentage.toFixed(0)}%
                  </div>
                  {categoryProgress.progress_percentage === 100 && (
                    <CheckCircle className="w-5 h-5 text-green-400 ml-auto" />
                  )}
                </div>
              </div>
              
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${categoryProgress.progress_percentage}%`,
                    backgroundColor: categoryProgress.category.color
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Achievements */}
      {completedModules > 0 && (
        <div className="mt-6 pt-6 border-t border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Award className="mr-2 text-yellow-400" />
            Logros Desbloqueados
          </h3>
          
          <div className="flex flex-wrap gap-3">
            {completedModules >= 1 && (
              <div className="bg-yellow-400/20 text-yellow-400 px-3 py-1 rounded-full text-sm flex items-center">
                <Award className="w-4 h-4 mr-1" />
                Primer Módulo Completado
              </div>
            )}
            
            {userProgress.completed_lessons >= 5 && (
              <div className="bg-blue-400/20 text-blue-400 px-3 py-1 rounded-full text-sm flex items-center">
                <BookOpen className="w-4 h-4 mr-1" />
                5 Lecciones Completadas
              </div>
            )}
            
            {userProgress.total_time_minutes >= 60 && (
              <div className="bg-green-400/20 text-green-400 px-3 py-1 rounded-full text-sm flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                1 Hora de Estudio
              </div>
            )}
            
            {completedModules >= 2 && (
              <div className="bg-purple-400/20 text-purple-400 px-3 py-1 rounded-full text-sm flex items-center">
                <Target className="w-4 h-4 mr-1" />
                Estudiante Dedicado
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressStats;