import React, { useState, useEffect } from 'react';
import { BookOpen, AlertCircle, CheckCircle, Loader } from 'lucide-react';

const AcademyTest2: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiTests, setApiTests] = useState<any[]>([]);

  useEffect(() => {
    testApis();
  }, []);

  const testApis = async () => {
    const tests = [];
    setLoading(true);

    // Test 1: Categorías sin token
    try {
      const response = await fetch('/api/lessons/categories/');
      const result = {
        name: 'Categorías (sin token)',
        status: response.status,
        ok: response.ok,
        data: response.ok ? await response.json() : null,
        error: response.ok ? null : `HTTP ${response.status}`
      };
      tests.push(result);
      
      if (result.ok && result.data) {
        setCategories(result.data);
      }
    } catch (err: any) {
      tests.push({
        name: 'Categorías (sin token)',
        status: 0,
        ok: false,
        data: null,
        error: err.message
      });
    }

    // Test 2: Categorías con token
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const response = await fetch('/api/lessons/categories/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const result = {
          name: 'Categorías (con token)',
          status: response.status,
          ok: response.ok,
          data: response.ok ? await response.json() : null,
          error: response.ok ? null : `HTTP ${response.status}`
        };
        tests.push(result);
      } catch (err: any) {
        tests.push({
          name: 'Categorías (con token)',
          status: 0,
          ok: false,
          data: null,
          error: err.message
        });
      }

      // Test 3: Progreso del usuario
      try {
        const response = await fetch('/api/lessons/progress/summary/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const result = {
          name: 'Progreso del usuario',
          status: response.status,
          ok: response.ok,
          data: response.ok ? await response.json() : null,
          error: response.ok ? null : `HTTP ${response.status}`
        };
        tests.push(result);
      } catch (err: any) {
        tests.push({
          name: 'Progreso del usuario',
          status: 0,
          ok: false,
          data: null,
          error: err.message
        });
      }
    } else {
      tests.push({
        name: 'Token check',
        status: 0,
        ok: false,
        data: null,
        error: 'No hay token en localStorage'
      });
    }

    // Test 4: Health check general
    try {
      const response = await fetch('/api/health/');
      const result = {
        name: 'Health Check',
        status: response.status,
        ok: response.ok,
        data: response.ok ? await response.json() : null,
        error: response.ok ? null : `HTTP ${response.status}`
      };
      tests.push(result);
    } catch (err: any) {
      tests.push({
        name: 'Health Check',
        status: 0,
        ok: false,
        data: null,
        error: err.message
      });
    }

    setApiTests(tests);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🔧 Academia - Test de APIs
          </h1>
          <p className="text-gray-300">
            Diagnóstico completo de conectividad y autenticación
          </p>
        </div>

        {loading && (
          <div className="text-center py-8">
            <Loader className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
            <p className="text-gray-300">Ejecutando tests de API...</p>
          </div>
        )}

        {/* Resultados de Tests */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {apiTests.map((test, index) => (
            <div
              key={index}
              className={`p-6 rounded-xl border ${
                test.ok 
                  ? 'bg-green-600/20 border-green-400/30' 
                  : 'bg-red-600/20 border-red-400/30'
              }`}
            >
              <div className="flex items-center mb-3">
                {test.ok ? (
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
                )}
                <h3 className="font-semibold text-white">{test.name}</h3>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Status:</span>
                  <span className={test.ok ? 'text-green-400' : 'text-red-400'}>
                    {test.status} {test.ok ? 'OK' : 'ERROR'}
                  </span>
                </div>
                
                {test.error && (
                  <div className="text-red-300 text-xs">
                    Error: {test.error}
                  </div>
                )}
                
                {test.data && (
                  <div className="text-gray-400 text-xs">
                    Datos: {Array.isArray(test.data) ? `${test.data.length} items` : 'Object'}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Información del Token */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-8">
          <h3 className="text-xl font-bold text-white mb-4">🔑 Información de Autenticación</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Token presente:</span>
              <span className={localStorage.getItem('access_token') ? 'text-green-400' : 'text-red-400'}>
                {localStorage.getItem('access_token') ? 'Sí' : 'No'}
              </span>
            </div>
            
            {localStorage.getItem('access_token') && (
              <div className="text-xs text-gray-400 break-all">
                Token: {localStorage.getItem('access_token')?.substring(0, 50)}...
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Usuario en localStorage:</span>
              <span className={localStorage.getItem('user') ? 'text-green-400' : 'text-red-400'}>
                {localStorage.getItem('user') ? 'Sí' : 'No'}
              </span>
            </div>
          </div>
        </div>

        {/* Categorías Cargadas */}
        {categories.length > 0 && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">📚 Categorías Cargadas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((category) => (
                <div key={category.id} className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <span className="text-2xl mr-3">{category.icon}</span>
                    <div>
                      <h4 className="font-semibold text-white">{category.name}</h4>
                      <p className="text-sm text-gray-400">{category.lessons_count} lecciones</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-300">{category.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botón para reejecutar tests */}
        <div className="text-center mt-8">
          <button
            onClick={testApis}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            🔄 Reejecutar Tests
          </button>
        </div>
      </div>
    </div>
  );
};

export default AcademyTest2;