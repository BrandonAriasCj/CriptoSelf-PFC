import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ApiError {
  message: string;
  status?: number;
}

interface UseAcademyApiResult<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

export function useAcademyApi<T = any>(): UseAcademyApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const { isAuthenticated } = useAuth();

  const execute = useCallback(async (apiCall: () => Promise<T>): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiCall();
      setData(result);
      return result;
    } catch (err: any) {
      console.error('Academy API Error:', err);
      
      const apiError: ApiError = {
        message: err.response?.data?.message || err.message || 'Error de conexión',
        status: err.response?.status
      };
      
      setError(apiError);
      
      // No redirigir automáticamente, solo loggear el error
      if (err.response?.status === 401) {
        console.warn('Error de autenticación en Academy API, pero no redirigiendo automáticamente');
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}

// Hook específico para categorías
export function useAcademyCategories() {
  const { execute, data, error, loading, reset } = useAcademyApi();
  
  const loadCategories = useCallback(async () => {
    const result = await execute(async () => {
      const response = await fetch('/api/lessons/categories/', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const jsonData = await response.json();
      
      // Si la respuesta tiene paginación, extraer los resultados
      if (jsonData && jsonData.results) {
        return jsonData.results;
      }
      
      // Si es un array directo, devolverlo
      if (Array.isArray(jsonData)) {
        return jsonData;
      }
      
      return [];
    });

    // Si falla la API, usar datos de fallback
    if (!result || result.length === 0) {
      const fallbackCategories = [
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
      
      return fallbackCategories;
    }

    return result;
  }, [execute]);

  return { 
    data: Array.isArray(data) ? data : [], 
    loading, 
    error, 
    loadCategories, 
    reset 
  };
}

// Hook específico para progreso del usuario
export function useUserProgress() {
  const { execute, ...rest } = useAcademyApi();
  
  const loadProgress = useCallback(async () => {
    try {
      return await execute(async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
          // Si no hay token, devolver progreso vacío
          return {
            total_lessons: 0,
            completed_lessons: 0,
            completion_percentage: 0,
            total_time_minutes: 0,
            categories_progress: []
          };
        }

        const response = await fetch('/api/lessons/progress/summary/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.status === 404 || response.status === 401) {
          // Usuario sin progreso aún o no autenticado
          return {
            total_lessons: 0,
            completed_lessons: 0,
            completion_percentage: 0,
            total_time_minutes: 0,
            categories_progress: []
          };
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response.json();
      });
    } catch (error) {
      console.error('Error loading progress:', error);
      return {
        total_lessons: 0,
        completed_lessons: 0,
        completion_percentage: 0,
        total_time_minutes: 0,
        categories_progress: []
      };
    }
  }, [execute]);

  return { loadProgress, ...rest };
}

// Hook específico para lecciones de categoría
export function useCategoryLessons() {
  const { execute, data, error, loading, reset } = useAcademyApi();
  
  const loadLessons = useCallback(async (categoryId: number) => {
    const result = await execute(async () => {
      const response = await fetch(`/api/lessons/categories/${categoryId}/lessons/`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const jsonData = await response.json();
      
      // Si la respuesta tiene paginación, extraer los resultados
      if (jsonData && jsonData.results) {
        return jsonData.results;
      }
      
      // Si es un array directo, devolverlo
      if (Array.isArray(jsonData)) {
        return jsonData;
      }
      
      return [];
    });

    // Si falla la API, usar datos de ejemplo
    if (!result || result.length === 0) {
      const fallbackLessons = [
        {
          id: 1,
          title: '¿Qué es el Trading?',
          description: 'Introducción al mundo del trading y los mercados financieros',
          difficulty: 'beginner',
          lesson_type: 'theory',
          duration_minutes: 15,
          order: 1,
          user_progress: { status: 'not_started', progress_percentage: 0 }
        },
        {
          id: 2,
          title: 'Terminología Básica del Trading',
          description: 'Aprende los términos más importantes que todo trader debe conocer',
          difficulty: 'beginner',
          lesson_type: 'quiz',
          duration_minutes: 20,
          order: 2,
          user_progress: { status: 'not_started', progress_percentage: 0 }
        }
      ];
      
      return fallbackLessons;
    }

    return result;
  }, [execute]);

  return { 
    data: Array.isArray(data) ? data : [], 
    loading, 
    error, 
    loadLessons, 
    reset 
  };
}