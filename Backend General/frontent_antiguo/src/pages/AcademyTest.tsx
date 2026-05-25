import React from 'react';

const AcademyTest: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e293b 0%, #7c3aed 50%, #1e293b 100%)',
      padding: '2rem',
      color: 'white',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '3rem',
          marginBottom: '1rem',
          background: 'linear-gradient(45deg, #a855f7, #3b82f6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          🎓 Academia de Trading
        </h1>
        
        <p style={{
          fontSize: '1.2rem',
          marginBottom: '2rem',
          opacity: 0.9
        }}>
          ¡Funciona! La navegación a la Academia está operativa.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginTop: '3rem'
        }}>
          {[
            { icon: '📚', title: 'Fundamentos', desc: 'Conceptos básicos del trading' },
            { icon: '📊', title: 'Análisis Técnico', desc: 'Herramientas de análisis' },
            { icon: '🛡️', title: 'Gestión de Riesgo', desc: 'Protege tu capital' },
            { icon: '🤖', title: 'Trading Algorítmico', desc: 'Automatiza tus estrategias' }
          ].map((item, index) => (
            <div key={index} style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '1rem',
              padding: '1.5rem',
              cursor: 'pointer',
              transition: 'transform 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onClick={() => alert(`Módulo: ${item.title}\nEsta funcionalidad estará disponible pronto.`)}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                {item.icon}
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#a855f7' }}>
                {item.title}
              </h3>
              <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: '3rem',
          padding: '1.5rem',
          background: 'rgba(34, 197, 94, 0.2)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: '1rem'
        }}>
          <h3 style={{ color: '#22c55e', marginBottom: '0.5rem' }}>
            ✅ Estado del Sistema
          </h3>
          <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>
            • Navegación: Funcionando<br/>
            • Componentes: Cargados<br/>
            • Rutas: Configuradas<br/>
            • Backend: Disponible en localhost:8000
          </p>
        </div>

        <button 
          style={{
            marginTop: '2rem',
            padding: '1rem 2rem',
            background: 'linear-gradient(45deg, #7c3aed, #3b82f6)',
            border: 'none',
            borderRadius: '0.5rem',
            color: 'white',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'transform 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onClick={() => {
            console.log('Testing API connection...');
            fetch('/api/lessons/categories/')
              .then(response => response.json())
              .then(data => {
                console.log('API Response:', data);
                alert(`API funciona! Encontradas ${data.length} categorías`);
              })
              .catch(error => {
                console.error('API Error:', error);
                alert('Error de API: ' + error.message);
              });
          }}
        >
          🔧 Probar Conexión API
        </button>
      </div>
    </div>
  );
};

export default AcademyTest;