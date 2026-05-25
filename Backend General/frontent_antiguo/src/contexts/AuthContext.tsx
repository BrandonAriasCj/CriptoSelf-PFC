import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, AuthContextType, RegisterRequest, ChangePasswordRequest } from '../types/auth';
import { authService, socialAuthService } from '../services/api';
import { toast } from 'sonner';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// Función auxiliar para checar prematuramente si la sesión JWT prescribió (evitando flash de UI antigua)
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp) {
      // Compara la expiración con Date.now(), agregando 5 segundos de margen protector
      return (payload.exp * 1000) <= Date.now() + 5000;
    }
    return false;
  } catch (e) {
    return false; // Asumir válido (dejamos que el backend valide el JWT si no lo podemos parsear localmente)
  }
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Verificar si hay token guardado al cargar la app y revalidar proactivamente
  useEffect(() => {
    const checkAuthStatus = () => {
      const savedToken = localStorage.getItem('access_token');
      const savedUser = localStorage.getItem('user');

      if (savedToken) {
        if (isTokenExpired(savedToken)) {
          console.warn('Token expirado detectado, forzando limpieza local.');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        } else if (savedUser) {
          setToken(savedToken);
          try {
            setUser(JSON.parse(savedUser));
          } catch (error) {
            console.error('Error parsing saved user:', error);
            localStorage.removeItem('user');
          }
        }
      }
      setIsLoading(false);
    };

    checkAuthStatus();

    // Comprobar expiración cuando el usuario reactiva la pestaña tras mucho tiempo inactiva
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const currentToken = localStorage.getItem('access_token');
        if (currentToken && isTokenExpired(currentToken)) {
          console.warn('El JWT caducó en segundo plano (Sleep). Expulsando...');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
          window.location.href = '/auth'; // Redirige al log in forzando limpieza del árbol React
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Verificar token válido al cargar (solo una vez)
  useEffect(() => {
    if (token && !user && !isLoading) {
      loadUserProfile();
    }
  }, [token, user, isLoading]);

  const loadUserProfile = async () => {
    try {
      console.log('Cargando perfil de usuario...');
      const userProfile = await authService.getProfile();
      setUser(userProfile);
      localStorage.setItem('user', JSON.stringify(userProfile));
      console.log('Perfil cargado exitosamente:', userProfile);
    } catch (error: any) {
      console.error('Error loading user profile:', error);
      // Solo hacer logout si es un error de autenticación real
      if (error.response?.status === 401) {
        console.log('Token inválido, haciendo logout');
        logout();
      }
    }
  };

  // Autenticación tradicional (email/password)
  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      console.log('Iniciando login tradicional para:', email);
      const response = await authService.login(email, password);
      
      console.log('Login exitoso, guardando tokens...');
      // Guardar tokens
      localStorage.setItem('access_token', response.access_token);
      if (response.refresh_token) {
        localStorage.setItem('refresh_token', response.refresh_token);
      }
      localStorage.setItem('user', JSON.stringify(response.user));
      
      setToken(response.access_token);
      setUser(response.user);
      console.log('Usuario autenticado:', response.user);
      
      toast.success('¡Bienvenido de vuelta!');
      
      // Redirigir después del login exitoso con un pequeño delay
      setTimeout(() => {
        const from = location.state?.from?.pathname || '/trading';
        navigate(from, { replace: true });
      }, 100);
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.error || 'Error en el login');
      throw new Error(error.response?.data?.error || 'Error en el login');
    } finally {
      setIsLoading(false);
    }
  };

  // Autenticación social (Google/GitHub)
  const loginWithSocial = async (provider: 'google' | 'github', accessToken: string): Promise<void> => {
    try {
      setIsLoading(true);
      console.log(`🔄 Iniciando login social con ${provider}...`);
      console.log(`📤 Enviando token de ${provider} al backend...`);
      
      let response;
      if (provider === 'google') {
        console.log("a1");
        response = await socialAuthService.loginWithGoogle(accessToken);
        console.log("b1");
      } else {
        response = await socialAuthService.loginWithGitHub(accessToken);
      }
      
      console.log('✅ Respuesta del backend recibida:', {
        hasAccessToken: !!response.access_token,
        hasUser: !!response.user,
        user: response.user
      });
      
      if (!response.access_token) {
        throw new Error('No se recibió access_token del backend');
      }
      
      console.log('💾 Guardando tokens en localStorage...');
      // Guardar tokens
      localStorage.setItem('access_token', response.access_token);
      if (response.refresh_token) {
        localStorage.setItem('refresh_token', response.refresh_token);
      }
      localStorage.setItem('user', JSON.stringify(response.user));
      
      console.log('✅ Tokens guardados exitosamente');
      console.log('🔄 Actualizando estado de autenticación...');
      
      setToken(response.access_token);
      setUser(response.user);
      
      console.log('✅ Usuario autenticado con', provider, ':', response.user.email);
      
      toast.success(`¡Bienvenido ${response.user.first_name || response.user.username}!`);
      
      // Redirigir después del login social exitoso con un pequeño delay
      console.log('🔄 Redirigiendo a la aplicación...');
      setTimeout(() => {
        const from = location.state?.from?.pathname || '/trading';
        console.log('📍 Navegando a:', from);
        navigate(from, { replace: true });
      }, 100);
    } catch (error: any) {
      console.error(`❌ Error en login social con ${provider}:`, error);
      console.error('Detalles del error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error(error.response?.data?.error || `Error en el login con ${provider}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterRequest): Promise<void> => {
    try {
      setIsLoading(true);
      console.log('Registrando nuevo usuario:', data.email);
      const response = await authService.register(data);
      
      console.log('Registro exitoso, haciendo login automático...');
      // Después del registro, hacer login automático
      await login(data.email, data.password);
      
      toast.success('¡Cuenta creada exitosamente!');
    } catch (error: any) {
      console.error('Register error:', error);
      toast.error(error.response?.data?.message || 'Error en el registro');
      throw new Error(error.response?.data?.message || 'Error en el registro');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoggingOut(true);
      console.log('Iniciando logout...');
      
      if (token) {
        try {
          await authService.logout();
        } catch (error) {
          // Si falla el logout en el servidor, continuar con el logout local
          console.warn('Error en logout del servidor, continuando con logout local:', error);
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Limpiar estado local
      console.log('Limpiando estado local...');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      setIsLoggingOut(false);
      
      toast.success('Sesión cerrada correctamente');
      
      // Usar setTimeout para evitar problemas de renderizado
      setTimeout(() => {
        navigate('/auth', { replace: true });
      }, 100);
    }
  };

  const updateProfile = async (data: Partial<User>): Promise<void> => {
    try {
      const updatedUser = await authService.updateProfile(data);
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast.success('Perfil actualizado correctamente');
    } catch (error: any) {
      console.error('Update profile error:', error);
      toast.error(error.response?.data?.message || 'Error actualizando perfil');
      throw new Error(error.response?.data?.message || 'Error actualizando perfil');
    }
  };

  const changePassword = async (data: ChangePasswordRequest): Promise<void> => {
    try {
      await authService.changePassword(data);
      toast.success('Contraseña cambiada correctamente');
    } catch (error: any) {
      console.error('Change password error:', error);
      toast.error(error.response?.data?.error || 'Error cambiando contraseña');
      throw new Error(error.response?.data?.error || 'Error cambiando contraseña');
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    loginWithSocial,
    register,
    logout,
    updateProfile,
    changePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};