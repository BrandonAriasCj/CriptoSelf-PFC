import React from 'react';

interface FundamentalEventsGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FundamentalEventsGuide: React.FC<FundamentalEventsGuideProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const eventTypes = [
    {
      category: "🏛️ Intervenciones Gubernamentales",
      description: "Acciones directas de gobiernos que afectan el mercado cripto",
      examples: [
        "Prohibiciones (China baneando Bitcoin)",
        "Adopción oficial (El Salvador)",
        "Liquidaciones masivas (Alemania vendiendo BTC incautado)",
        "Regulaciones nuevas (ETFs aprobados por SEC)"
      ],
      impact: "Suelen tener el mayor impacto por su alcance legal y económico"
    },
    {
      category: "🏦 Crisis del Sistema Financiero",
      description: "Fallos en el sistema bancario tradicional que benefician a Bitcoin",
      examples: [
        "Colapso de bancos (Silicon Valley Bank)",
        "Crisis de liquidez bancaria",
        "Inflación descontrolada",
        "Devaluaciones monetarias"
      ],
      impact: "Bitcoin tiende a subir como refugio de valor alternativo"
    },
    {
      category: "🏢 Adopción Institucional",
      description: "Grandes corporaciones o instituciones adoptando Bitcoin",
      examples: [
        "Tesla comprando $1.5B en Bitcoin",
        "ETFs institucionales (BlackRock, Fidelity)",
        "Bancos ofreciendo servicios cripto",
        "Países adoptando Bitcoin como reserva"
      ],
      impact: "Genera confianza y entrada masiva de capital"
    },
    {
      category: "⚔️ Eventos Geopolíticos",
      description: "Conflictos, guerras y tensiones internacionales",
      examples: [
        "Guerra Rusia-Ucrania",
        "Sanciones internacionales",
        "Conflictos en Medio Oriente",
        "Tensiones comerciales"
      ],
      impact: "Volatilidad inicial, luego Bitcoin como refugio ante sanciones"
    },
    {
      category: "💥 Crisis Internas del Cripto",
      description: "Fallos y fraudes dentro del ecosistema cripto",
      examples: [
        "Colapso de FTX (fraude)",
        "Caída de Terra/LUNA (fallo algorítmico)",
        "Hacks de exchanges",
        "Proyectos Ponzi revelados"
      ],
      impact: "Pérdida de confianza temporal, pero fortalece a Bitcoin a largo plazo"
    },
    {
      category: "⚡ Eventos Programados",
      description: "Eventos predecibles en el código de Bitcoin",
      examples: [
        "Halvings (reducción de recompensa)",
        "Actualizaciones de protocolo",
        "Dificultad de minería",
        "Fechas de vencimiento de derivados"
      ],
      impact: "Efectos predecibles basados en oferta y demanda"
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              🎯 Guía de Eventos Fundamentales
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
              💡 ¿Por qué son importantes los eventos fundamentales?
            </h3>
            <p className="text-gray-300 text-sm">
              Los indicadores técnicos (RSI, MACD, etc.) solo muestran <strong>qué</strong> está pasando con el precio, 
              pero los eventos fundamentales explican <strong>por qué</strong> está pasando. Entender las causas reales 
              te ayuda a tomar mejores decisiones de trading y no solo seguir señales técnicas ciegas.
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
              📚 Cómo usar esta información en trading
            </h3>
            <div className="text-gray-300 text-sm space-y-2">
              <p><strong>1. Contexto histórico:</strong> Observa cómo eventos similares afectaron el precio en el pasado</p>
              <p><strong>2. Timing:</strong> Los efectos pueden ser inmediatos (pánico) o a largo plazo (adopción)</p>
              <p><strong>3. Correlación:</strong> Combina análisis fundamental con técnico para mejores decisiones</p>
              <p><strong>4. Gestión de riesgo:</strong> Ajusta posiciones antes de eventos conocidos (regulaciones, halvings)</p>
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