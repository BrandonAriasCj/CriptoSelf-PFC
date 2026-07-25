import React from 'react';

interface FundamentalEventsGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FundamentalEventsGuide: React.FC<FundamentalEventsGuideProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const eventTypes = [
    {
      category: "⚔️ Conflictos Bélicos y Guerras",
      description: "Guerras y conflictos armados que reordenan el equilibrio mundial",
      examples: [
        "Guerra Rusia-Ucrania",
        "Guerra en Gaza (Israel-Hamás)",
        "Escalada militar Israel-Irán",
        "Conflictos regionales en Medio Oriente"
      ],
      impact: "Genera fuerte volatilidad y aversión al riesgo en los mercados globales"
    },
    {
      category: "🏛️ Decisiones de Gobiernos",
      description: "Acciones directas de Estados que afectan a la economía mundial",
      examples: [
        "Prohibiciones (China prohíbe las criptomonedas)",
        "Confinamientos y cierres por la pandemia COVID-19",
        "Política monetaria y subidas de tasas",
        "Nacionalizaciones e intervenciones estatales"
      ],
      impact: "Suelen tener gran impacto por su alcance legal y económico"
    },
    {
      category: "🗳️ Eventos Políticos",
      description: "Cambios de gobierno y procesos electorales clave",
      examples: [
        "Elecciones presidenciales en EE.UU.",
        "Cambios de liderazgo en grandes potencias",
        "Referendos y crisis institucionales",
        "Giros en la política económica"
      ],
      impact: "Expectativa y volatilidad ante posibles cambios de rumbo"
    },
    {
      category: "🛃 Tensiones Comerciales y Sanciones",
      description: "Guerras comerciales y sanciones entre países",
      examples: [
        "Aranceles entre EE.UU. y China",
        "Sanciones internacionales a Rusia",
        "Restricciones a la exportación de tecnología",
        "Bloqueos comerciales"
      ],
      impact: "Aversión al riesgo y reordenamiento del comercio mundial"
    },
    {
      category: "🛢️ Crisis Energéticas y de Recursos",
      description: "Disrupciones en el suministro de energía y materias primas",
      examples: [
        "Sabotaje de gasoductos (Nord Stream)",
        "Cortes de gas como arma geopolítica",
        "Shocks en el precio del petróleo",
        "Bloqueos de rutas comerciales"
      ],
      impact: "Disparan la inflación y condicionan la política de los bancos centrales"
    },
    {
      category: "🌍 Crisis Globales",
      description: "Eventos de alcance mundial que afectan a todas las economías",
      examples: [
        "Pandemias (COVID-19)",
        "Catástrofes naturales de gran escala",
        "Crisis migratorias",
        "Inestabilidad geopolítica generalizada"
      ],
      impact: "Pánico inicial y huida hacia activos considerados refugio"
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              🌍 Guía de Eventos Geopolíticos
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="mb-6 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-300 mb-2">
              💡 ¿Por qué importan los eventos geopolíticos?
            </h3>
            <p className="text-gray-300 text-sm">
              El precio de un activo no se mueve solo por gráficos: guerras, decisiones de gobiernos, elecciones
              y tensiones internacionales explican <strong>por qué</strong> ocurren los grandes movimientos.
              Entender estas causas geopolíticas te permite leer el pasado del mercado con contexto real, más
              allá de lo que muestran los indicadores técnicos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {eventTypes.map((type, index) => (
              <div key={index} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {type.category}
                </h3>
                <p className="text-gray-300 text-sm mb-3">
                  {type.description}
                </p>
                
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Ejemplos:</h4>
                  <ul className="text-xs text-gray-300 space-y-1">
                    {type.examples.map((example, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-blue-400 mt-1">•</span>
                        <span>{example}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-2 bg-gray-700/50 rounded text-xs text-gray-300">
                  <strong>Impacto típico:</strong> {type.impact}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-green-900/20 border border-green-700/50 rounded-lg">
            <h3 className="text-lg font-semibold text-green-300 mb-2">
              📚 Cómo leer estos eventos
            </h3>
            <div className="text-gray-300 text-sm space-y-2">
              <p><strong>1. Contexto histórico:</strong> Observa cómo conflictos o decisiones similares afectaron el precio en el pasado</p>
              <p><strong>2. Timing:</strong> Los efectos pueden ser inmediatos (pánico) o prolongados (guerras, sanciones)</p>
              <p><strong>3. Causa y efecto:</strong> Relaciona cada movimiento del precio con el evento geopolítico que lo explica</p>
              <p><strong>4. Anticipación:</strong> Identifica eventos conocidos (elecciones, escaladas) que suelen mover el mercado</p>
            </div>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};