import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, Award, TrendingUp, Users, Star, AlertCircle } from 'lucide-react';
import api from '../services/api';

interface LessonCategory {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  lessons_count: number;
}

const AcademyDebug: React.FC = () => {
  const [categories, setCategories] = useState<LessonCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<string>('Checking...');

  useEffect(() => {
    loadAcademyData();
  }, []);

  const loadAcademyData = async () => {
    try {
      setApiStatus('Connecting to API...');
      
      // Primero probar una llamada simple
      const healthCheck = await api.get('/health/');
      setApiStatus('API connection successful');
      
      // Luego probar las categorías
      const categoriesRes = await api.get('/lessons/categories/');
      setCategories(categoriesRes.data);
      setApiStatus(`Loaded ${categoriesRes.data.length} categories`);
      
    } catch (error: any) {
      console.error('Error loading academy data:', error);
      setError(`API Error: ${error.message || 'Unknown error'}`);
      setApiStatus('API connection failed');
      
      // Datos de fallback para testing
      setCategories([
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
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-xl">Cargando Academia...</p>
          <p className="text-sm text-gray-400 mt-2">{apiStatus}</p>
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
              Academia de Trading (Debug)
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Versión de debug para identificar problemas de conectividad
            </p>
          </div>
        </div>
      </div>

      {/* Status Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
            <TrendingUp className="mr-3 text-green-400" />
            Estado de la Conexión
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {apiStatus}
              </div>
              <div className="text-gray-300">Estado de API</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {categories.length}
              </div>
              <div className="text-gray-300">Categorías Cargadas</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {error ? 'Error' : 'OK'}
              </div>
              <div className="text-gray-300">Estado General</div>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-600/20 rounded-lg border border-red-400/30 flex items-start">
              <AlertCircle className="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-red-200 font-semibold">Error detectado:</p>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Categories Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {categories.map((category, index) => (
            <div
              key={category.id}
              className="group cursor-pointer hover:scale-105 transition-transform duration-200"
              onClick={() => {
                if (!error) {
                  window.location.href = `/academy/category/${category.id}`;
                } else {
                  alert('No se puede navegar debido a errores de API');
                }
              }}
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
                </div>

                {/* Description */}
                <p className="text-gray-300 mb-6 leading-relaxed">
                  {category.description}
                </p>

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
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Debug Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-600/30">
          <h3 className="text-lg font-bold text-white mb-4">🔧 Información de Debug</h3>
          <div className="text-sm text-gray-300 space-y-2">
            <p><strong>API Base URL:</strong> {import.meta.env.VITE_PREFIX || '/api'} en seccion api</p>
            <p><strong>Categorías cargadas:</strong> {categories.length}</p>
            <p><strong>Estado de error:</strong> {error || 'Ninguno'}</p>
            <p><strong>Estado de carga:</strong> {loading ? 'Cargando' : 'Completado'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademyDebug;