import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import WelcomeScreen from './components/WelcomeScreen';
import QuizCard from './components/QuizCard';
import ResultCard from './components/ResultCard';
import { questions, profiles } from './data/questions';
import './App.css';

function App() {
  const [currentStep, setCurrentStep] = useState('welcome'); // 'welcome', 'quiz', 'result'
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [userProfile, setUserProfile] = useState(null);

  const startQuiz = () => {
    setCurrentStep('quiz');
    setCurrentQuestion(0);
    setAnswers([]);
  };

  const handleAnswer = (selectedOption) => {
    const newAnswers = [...answers, selectedOption];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calcular el perfil basado en las respuestas
      calculateProfile(newAnswers);
    }
  };

  const calculateProfile = (userAnswers) => {
    const scores = {
      conservative: 0,
      moderate: 0,
      aggressive: 0
    };

    // Sumar puntos de cada respuesta
    userAnswers.forEach(answer => {
      Object.keys(answer.points).forEach(profileType => {
        scores[profileType] += answer.points[profileType];
      });
    });

    // Encontrar el perfil con mayor puntuación
    const maxScore = Math.max(...Object.values(scores));
    const winningProfile = Object.keys(scores).find(
      profile => scores[profile] === maxScore
    );

    setUserProfile(profiles[winningProfile]);
    setCurrentStep('result');
  };

  const restartQuiz = () => {
    setCurrentStep('welcome');
    setCurrentQuestion(0);
    setAnswers([]);
    setUserProfile(null);
  };

  return (
    <div className="app">
      <AnimatePresence mode="wait">
        {currentStep === 'welcome' && (
          <WelcomeScreen key="welcome" onStart={startQuiz} />
        )}
        
        {currentStep === 'quiz' && (
          <QuizCard
            key={`question-${currentQuestion}`}
            question={questions[currentQuestion]}
            onAnswer={handleAnswer}
            currentQuestion={currentQuestion + 1}
            totalQuestions={questions.length}
          />
        )}
        
        {currentStep === 'result' && userProfile && (
          <ResultCard
            key="result"
            profile={userProfile}
            onRestart={restartQuiz}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;