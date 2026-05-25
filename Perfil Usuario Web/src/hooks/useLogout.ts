import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const useLogout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      // La navegación ya se maneja en el AuthContext
    } catch (error) {
      console.error('Error during logout:', error);
      // En caso de error, forzar la navegación
      navigate('/auth', { replace: true });
    }
  }, [logout, navigate]);

  return handleLogout;
};