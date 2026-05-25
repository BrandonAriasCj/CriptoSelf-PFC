import React from 'react';
import { motion } from 'framer-motion';
import { Coins, Shield, Zap } from 'lucide-react';
import './WelcomeScreen.css';

const WelcomeScreen = ({ onStart }) => {
  return (
    <motion.div
      className="welcome-screen"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="welcome-content">
        {/* Icono principal */}
        <motion.div
          className="welcome-icon"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        >
          <Coins size={48} />
        </motion.div>

        {/* Título principal */}
        <motion.h1
          className="welcome-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Descubre tu Perfil de Inversor Cripto
        </motion.h1>

        {/* Descripción */}
        <motion.p
          className="welcome-description"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          Responde 6 preguntas y descubre qué tipo de inversor eres en el mundo de las criptomonedas
        </motion.p>

        {/* Lista de características */}
        <motion.div
          className="features-list"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="feature-item">
            <Shield size={20} />
            <span>Evaluación de tu perfil de riesgo</span>
          </div>
          <div className="feature-item">
            <Zap size={20} />
            <span>Recomendaciones según tu estilo</span>
          </div>
          <div className="feature-item">
            <Coins size={20} />
            <span>Guía personalizada del mercado cripto</span>
          </div>
        </motion.div>

        {/* Botón de inicio */}
        <motion.button
          className="start-button"
          onClick={onStart}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Comenzar Quiz
        </motion.button>

        {/* Info adicional */}
        <motion.p
          className="quiz-info"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          ⏱️ Solo toma 2 minutos para conocer tu perfil cripto
        </motion.p>
      </div>
    </motion.div>
  );
};

export default WelcomeScreen;
