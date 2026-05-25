import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const AuthRedirect: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Si el usuario ya está autenticado y está en la página de auth, redirigir
  if (isAuthenticated && location.pathname === '/auth') {
    const from = location.state?.from?.pathname || '/trading';
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};