import React, { useState } from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import { RegisterForm } from '../components/auth/RegisterForm';
import { AuthRedirect } from '../components/auth/AuthRedirect';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  const toggleMode = () => {
    setIsLogin(!isLogin);
  };

  return (
    <AuthRedirect>
      <div className="min-h-screen flex items-center justify-center bg-gradient-brand-subtle p-4 transition-theme">
        <div className="w-full max-w-md">
          {isLogin ? (
            <LoginForm onToggleMode={toggleMode} />
          ) : (
            <RegisterForm onToggleMode={toggleMode} />
          )}
        </div>
      </div>
    </AuthRedirect>
  );
};