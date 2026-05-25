import React from 'react';
import { motion } from 'framer-motion';
import './QuizCard.css';

const QuizCard = ({ question, onAnswer, currentQuestion, totalQuestions }) => {
  return (
    <motion.div
      className="quiz-card"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.5 }}
    >
      <div className="quiz-header">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${(currentQuestion / totalQuestions) * 100}%` }}
          />
        </div>
        <span className="question-counter">
          {currentQuestion} de {totalQuestions}
        </span>
      </div>

      <div className="question-content">
        <h2 className="question-title">{question.title}</h2>
        
        <div className="options-container">
          {question.options.map((option, index) => (
            <motion.button
              key={option.id}
              className="option-button"
              onClick={() => onAnswer(option)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <span className="option-letter">{option.id.toUpperCase()}</span>
              <span className="option-text">{option.text}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default QuizCard;