import React from 'react';

const AcademyMinimal = () => {
  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#1e293b' }}>
      <div className="max-w-4xl mx-auto text-white">
        <h1 className="text-4xl font-bold mb-8 text-center" style={{ color: '#a855f7' }}>
          🎓 Academia de Trading
        </h1>
        
        <div className="text-center mb-8">
          <p className="text-xl mb-4">¡Funciona! Has llegado a la Academia.</p>
          <p className="text-gray-300">La navegación está operativa correctamente.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="p-6 rounded-lg" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
            <div className="text-3xl mb-3">📚</div>
            <h3 className="text-xl font-bold mb-2" style={{ color: '#a855f7' }}>Fundamentos del Trading</h3>
            <p className="text-gray-300">Aprende los conceptos básicos del trading</p>
          </div>

          <div className="p-6 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <div className="text-3xl mb-3">📊</div>
            <h3 className="text-xl font-bold mb-2" style={{ color: '#3b82f6' }}>Análisis Técnico</h3>
            <p className="text-gray-300">Domina las herramientas de análisis</p>
          </div>

          <div className="p-6 rounded-lg" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            <div className="text-3xl mb-3">🛡️</div>
            <h3 className="text-xl font-bold mb-2" style={{ color: '#f59e0b' }}>Gestión de Riesgo</h3>
            <p className="text-gray-300">Protege tu capital</p>
          </div>

          <div className="p-6 rounded-lg" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
            <div className="text-3xl mb-3">🤖</div>
            <h3 className="text-xl font-bold mb-2" style={{ color: '#8b5cf6' }}>Trading Algorítmico</h3>
            <p className="text-gray-300">Automatiza tus estrategias</p>
          </div>
        </div>

        <div className="mt-8 p-4 rounded-lg text-center" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
          <p style={{ color: '#22c55e' }}>✅ Sistema funcionando correctamente</p>
        </div>
      </div>
    </div>
  );
};

export default AcademyMinimal;