import React from 'react';
import { BookOpen } from 'lucide-react';

const AcademySimple: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center text-white">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-purple-400" />
          <h1 className="text-4xl font-bold mb-4">Academia de Trading</h1>
          <p className="text-xl text-gray-300 mb-8">
            ¡Bienvenido a la Academia! Esta es una versión de prueba.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-bold mb-2">📚 Fundamentos del Trading</h3>
              <p className="text-gray-300">Aprende los conceptos básicos del trading</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-bold mb-2">📊 Análisis Técnico</h3>
              <p className="text-gray-300">Domina las herramientas de análisis</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-bold mb-2">🛡️ Gestión de Riesgo</h3>
              <p className="text-gray-300">Protege tu capital con estrategias probadas</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-bold mb-2">🤖 Trading Algorítmico</h3>
              <p className="text-gray-300">Automatiza tus estrategias de trading</p>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-blue-600/20 rounded-lg border border-blue-400/30">
            <p className="text-blue-200">
              🔧 Esta es una versión simplificada para testing. 
              Si ves esto, la navegación está funcionando correctamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademySimple;