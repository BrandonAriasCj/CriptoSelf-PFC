import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Download, Share2, RotateCcw } from 'lucide-react';
import html2canvas from 'html2canvas';
import './ResultCard.css';

const ResultCard = ({ profile, onRestart }) => {
  const cardRef = useRef(null);

  const downloadCard = async () => {
    if (cardRef.current) {
      try {
        const canvas = await html2canvas(cardRef.current, {
          backgroundColor: null,
          scale: 2,
          useCORS: true
        });
        
        const link = document.createElement('a');
        link.download = `perfil-trading-${profile.title.toLowerCase().replace(/\s+/g, '-')}.png`;
        link.href = canvas.toDataURL();
        link.click();
      } catch (error) {
        console.error('Error al generar la imagen:', error);
      }
    }
  };

  const shareResult = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Mi perfil de trading: ${profile.title}`,
          text: `Descubrí que soy un ${profile.title}! ${profile.description}`,
          url: window.location.href
        });
      } catch (error) {
        console.error('Error al compartir:', error);
      }
    } else {
      // Fallback para navegadores que no soportan Web Share API
      const text = `Mi perfil de trading: ${profile.title}\n${profile.description}\n${window.location.href}`;
      navigator.clipboard.writeText(text);
      alert('¡Enlace copiado al portapapeles!');
    }
  };

  return (
    <motion.div
      className="result-container"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div ref={cardRef} className="result-card" style={{ borderColor: profile.color }}>
        <div className="result-header">
          <div className="profile-icon" style={{ background: profile.color }}>
            {profile.icon}
          </div>
          <div className="profile-info">
            <h1 className="profile-title" style={{ color: profile.color }}>
              {profile.title}
            </h1>
            <p className="profile-subtitle">{profile.subtitle}</p>
          </div>
        </div>

        <div className="profile-description">
          <p>{profile.description}</p>
        </div>

        <div className="profile-details">
          <div className="detail-row">
            <span className="detail-label">Nivel de Riesgo:</span>
            <span className="detail-value" style={{ color: profile.color }}>
              {profile.riskLevel}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Horizonte Temporal:</span>
            <span className="detail-value">{profile.timeHorizon}</span>
          </div>
        </div>

        <div className="characteristics-section">
          <h3>Características Principales</h3>
          <ul className="characteristics-list">
            {profile.characteristics.map((char, index) => (
              <li key={index}>{char}</li>
            ))}
          </ul>
        </div>

        <div className="recommendations-section">
          <h3>Recomendaciones</h3>
          <ul className="recommendations-list">
            {profile.recommendations.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>

        <div className="branding">
          <p>Descubre tu perfil de trading</p>
        </div>
      </div>

      <div className="action-buttons">
        <motion.button
          className="action-btn download-btn"
          onClick={downloadCard}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Download size={20} />
          Descargar Cartilla
        </motion.button>

        <motion.button
          className="action-btn share-btn"
          onClick={shareResult}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Share2 size={20} />
          Compartir
        </motion.button>

        <motion.button
          className="action-btn restart-btn"
          onClick={onRestart}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <RotateCcw size={20} />
          Repetir Quiz
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ResultCard;