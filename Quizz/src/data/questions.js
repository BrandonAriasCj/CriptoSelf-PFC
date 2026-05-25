export const questions = [
  {
    id: 1,
    title: "¿Cuál es tu experiencia en inversión cripto? 2",
    options: [
      { id: "a", text: "Soy completamente nuevo en cripto", points: { conservative: 3, moderate: 2, aggressive: 1 } },
      { id: "b", text: "He comprado algunas criptos por curiosidad", points: { conservative: 2, moderate: 3, aggressive: 2 } },
      { id: "c", text: "Llevo tiempo invirtiendo y entiendo los ciclos del mercado", points: { conservative: 1, moderate: 3, aggressive: 3 } },
      { id: "d", text: "Soy un inversor experimentado en DeFi, NFTs o trading activo", points: { conservative: 1, moderate: 2, aggressive: 4 } }
    ]
  },
  {
    id: 2,
    title: "¿Con qué frecuencia revisas el mercado cripto?",
    options: [
      { id: "a", text: "Una vez a la semana o menos", points: { conservative: 3, moderate: 2, aggressive: 1 } },
      { id: "b", text: "Algunos días a la semana", points: { conservative: 2, moderate: 3, aggressive: 2 } },
      { id: "c", text: "Todos los días", points: { conservative: 1, moderate: 2, aggressive: 3 } },
      { id: "d", text: "Varias veces al día", points: { conservative: 1, moderate: 1, aggressive: 4 } }
    ]
  },
  {
    id: 3,
    title: "¿Qué haces cuando el mercado cae un 20%?",
    options: [
      { id: "a", text: "Vendo para evitar más pérdidas", points: { conservative: 4, moderate: 2, aggressive: 1 } },
      { id: "b", text: "Espero a que se recupere", points: { conservative: 3, moderate: 4, aggressive: 2 } },
      { id: "c", text: "Aprovecho para comprar más", points: { conservative: 2, moderate: 3, aggressive: 3 } },
      { id: "d", text: "Me emociona y busco apalancarme", points: { conservative: 1, moderate: 1, aggressive: 5 } }
    ]
  },
  {
    id: 4,
    title: "¿Qué porcentaje de tu portafolio planeas destinar a criptomonedas?",
    options: [
      { id: "a", text: "Menos del 5%", points: { conservative: 4, moderate: 2, aggressive: 1 } },
      { id: "b", text: "Entre 5% y 15%", points: { conservative: 3, moderate: 3, aggressive: 2 } },
      { id: "c", text: "Entre 15% y 40%", points: { conservative: 2, moderate: 3, aggressive: 3 } },
      { id: "d", text: "Más del 40%", points: { conservative: 1, moderate: 1, aggressive: 4 } }
    ]
  },
  {
    id: 5,
    title: "¿Qué tipo de proyectos cripto te llaman más la atención?",
    options: [
      { id: "a", text: "Bitcoin y criptos estables", points: { conservative: 4, moderate: 2, aggressive: 1 } },
      { id: "b", text: "Tokens sólidos con casos de uso claros (ETH, SOL, ADA…)", points: { conservative: 3, moderate: 4, aggressive: 2 } },
      { id: "c", text: "Nuevos proyectos con alto potencial (altcoins, layer 2…)", points: { conservative: 2, moderate: 3, aggressive: 3 } },
      { id: "d", text: "Memecoins, DeFi, NFTs y todo lo nuevo", points: { conservative: 1, moderate: 1, aggressive: 5 } }
    ]
  },
  {
    id: 6,
    title: "¿Cuál es tu objetivo principal al invertir en cripto?",
    options: [
      { id: "a", text: "Proteger mi dinero frente a la inflación", points: { conservative: 4, moderate: 2, aggressive: 1 } },
      { id: "b", text: "Generar ingresos pasivos (staking, farming)", points: { conservative: 3, moderate: 4, aggressive: 2 } },
      { id: "c", text: "Hacer crecer mi capital rápido", points: { conservative: 1, moderate: 2, aggressive: 4 } },
      { id: "d", text: "Buscar ganancias explosivas en el corto plazo", points: { conservative: 1, moderate: 1, aggressive: 5 } }
    ]
  }
];

export const profiles = {
  conservative: {
    title: "Inversor Cripto Conservador",
    subtitle: "El Guardián del Capital Digital",
    description: "Priorizas la seguridad y estabilidad. Prefieres mantenerte en criptos consolidadas con bajo riesgo.",
    characteristics: [
      "Prefiere Bitcoin, stablecoins o fondos indexados cripto",
      "Estrategia de largo plazo (HODL)",
      "Poca exposición a altcoins o DeFi",
      "Valora la seguridad por encima del rendimiento"
    ],
    recommendations: [
      "Bitcoin (BTC)",
      "Ethereum (ETH)",
      "Stablecoins (USDT, USDC)",
      "Staking en exchanges seguros"
    ],
    riskLevel: "Bajo",
    timeHorizon: "Largo plazo (3+ años)",
    color: "#10B981",
    icon: "🛡️"
  },
  moderate: {
    title: "Inversor Cripto Moderado",
    subtitle: "El Estratega Digital",
    description: "Buscas equilibrio entre seguridad y rentabilidad. Combinas criptos consolidadas con algunas apuestas prometedoras.",
    characteristics: [
      "Diversificación entre BTC, ETH y altcoins sólidas",
      "Aprovecha momentos del mercado sin arriesgar demasiado",
      "Puede usar staking o yield farming moderado",
      "Gestión prudente del riesgo"
    ],
    recommendations: [
      "BTC, ETH y Solana (SOL)",
      "Staking de tokens confiables",
      "Fondos cripto diversificados",
      "Uso moderado de DeFi"
    ],
    riskLevel: "Medio",
    timeHorizon: "Mediano plazo (1-3 años)",
    color: "#F59E0B",
    icon: "⚖️"
  },
  aggressive: {
    title: "Inversor Cripto Agresivo",
    subtitle: "El Cazador de Oportunidades",
    description: "Buscas altos rendimientos y no temes al riesgo. Te atraen las nuevas tendencias y el trading activo.",
    characteristics: [
      "Alta exposición a altcoins, DeFi o NFTs",
      "Participa en preventas, airdrops o nuevos proyectos",
      "Analiza y asume volatilidad extrema",
      "Optimiza rendimiento con trading o apalancamiento"
    ],
    recommendations: [
      "Altcoins emergentes (ARB, AVAX, OP, etc.)",
      "Yield farming o pools de liquidez",
      "Trading en futuros o apalancado",
      "NFTs y tokens de nuevos ecosistemas"
    ],
    riskLevel: "Alto",
    timeHorizon: "Corto plazo (semanas a meses)",
    color: "#EF4444",
    icon: "🚀"
  }
};
