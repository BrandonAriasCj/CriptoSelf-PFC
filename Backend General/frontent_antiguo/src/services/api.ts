import axios, { AxiosResponse } from 'axios';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  User,
  ChangePasswordRequest,
  SocialAuthRequest,
} from '../types/auth';

// Configuración base de Axios
const api = axios.create({
  baseURL: `${import.meta.env.VITE_PREFIX}/api` || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Importante para CORS con credenciales
});

// Interceptor para agregar token automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log(`🔐 Request to ${config.url} with token: ${token.substring(0, 20)}...`);
  } else {
    console.warn(`⚠️ Request to ${config.url} WITHOUT token`);
  }
  return config;
});

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('API Error:', error.response?.status, error.response?.data);

    if (error.response?.status === 401) {
      // 🔍 DEBUG: Log detallado del error 401
      console.group('🔴 ERROR 401 - No Autorizado');
      console.log('🌐 URL que falló:', error.config?.url);
      console.log('📋 Método:', error.config?.method?.toUpperCase());
      console.log('📦 Headers enviados:', {
        ...error.config?.headers,
        Authorization: error.config?.headers?.Authorization
          ? `Bearer ${error.config?.headers?.Authorization.substring(7, 20)}...`
          : 'No token'
      });
      console.log('⚠️ Respuesta del servidor:', error.response?.data);
      console.log('🔑 Token en localStorage:', localStorage.getItem('access_token')
        ? `${localStorage.getItem('access_token')?.substring(0, 20)}...`
        : 'No hay token');
      console.groupEnd();

      // Solo hacer logout automático si no estamos en páginas de auth o logout
      const currentPath = window.location.pathname;
      const isAuthPage = currentPath === '/auth' || currentPath === '/login' || currentPath === '/register';
      const isLogoutRequest = error.config?.url?.includes('/logout/');

      if (!isAuthPage && !isLogoutRequest) {
        console.warn('⏰ Cerrando sesión automáticamente en 2 segundos...');
        console.warn('💡 Si esto es un error, revisa los logs arriba');

        // Limpiar storage de forma segura
        try {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
        } catch (e) {
          console.warn('Error limpiando localStorage:', e);
        }

        // Ejecutar logout forzado instantáneamente en lugar de dar 2 segundos de visualización "fantasma"
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);

// Configuración OAuth2
const getOAuthConfig = () => ({
  client_id: import.meta.env.VITE_OAUTH_CLIENT_ID || 'your-client-id',
  client_secret: import.meta.env.VITE_OAUTH_CLIENT_SECRET || 'your-client-secret',
});

// Servicios de Autenticación Tradicional
export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response: AxiosResponse<LoginResponse> = await api.post('/auth/token/', {
      username: email,
      password,
      ...getOAuthConfig(),
    });
    return response.data;
  },

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    console.log("a123")
    const response: AxiosResponse<RegisterResponse> = await api.post('/auth/register/', data);
    console.log("b123")
    return response.data;
  },

  async getProfile(): Promise<User> {
    const response: AxiosResponse<User> = await api.get('/auth/profile/');
    return response.data;
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    console.log('🔄 Actualizando perfil con datos:', data);
    console.log('🔑 Token:', localStorage.getItem('access_token')?.substring(0, 20) + '...');
    console.log('🌐 URL:', `${api.defaults.baseURL}/auth/profile/`);

    try {
      const response: AxiosResponse<User> = await api.patch('/auth/profile/', data);
      console.log('✅ Perfil actualizado exitosamente:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error actualizando perfil:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
      });
      throw error;
    }
  },

  async changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await api.post('/auth/change-password/', data);
    return response.data;
  },

  async logout(): Promise<{ message: string }> {
    const response: AxiosResponse<{ message: string }> = await api.post('/auth/logout/');
    return response.data;
  },

  async getUserInfo(): Promise<{ user: User; scopes: string[] }> {
    const response: AxiosResponse<{ user: User; scopes: string[] }> = await api.get('/auth/user-info/');
    return response.data;
  },
};

// Servicios de Autenticación Social
export const socialAuthService = {
  async loginWithGoogle(accessToken: string): Promise<LoginResponse> {
    const response: AxiosResponse<LoginResponse> = await api.post('/auth/social/', {
      provider: 'google',
      access_token: accessToken,
    });
    console.log("a");
    return response.data;
  },

  async loginWithGitHub(accessToken: string): Promise<LoginResponse> {
    const response: AxiosResponse<LoginResponse> = await api.post('/auth/social/', {
      provider: 'github',
      access_token: accessToken,
    });
    return response.data;
  },

  // Función genérica para cualquier proveedor social
  async loginWithProvider(data: SocialAuthRequest): Promise<LoginResponse> {
    const response: AxiosResponse<LoginResponse> = await api.post('/auth/social/', data);
    return response.data;
  },
};

// Servicio de salud de la API
export const healthService = {
  async checkHealth(): Promise<{ status: string; message: string }> {
    const response: AxiosResponse<{ status: string; message: string }> = await api.get('/health/');
    return response.data;
  },
};

// Funciones auxiliares para OAuth2 social
export const googleAuth = {
  getAuthUrl(): string {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const scope = 'openid email profile';

    return `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `response_type=code&` +
      `access_type=offline&` +
      `prompt=select_account&` + // Fuerza mostrar selector de cuentas
      `include_granted_scopes=true`; // Mejora la experiencia de selección
  },

  async handleCallback(code: string): Promise<LoginResponse> {
    console.log('🔄 Google: Enviando código al backend para intercambio seguro...');

    // Enviar código al backend para que lo intercambie de forma segura
    const response: AxiosResponse<LoginResponse> = await api.post('/auth/google/exchange-code/', {
      code,
    });

    console.log('✅ Autenticación con Google completada exitosamente');
    return response.data;
  },

  async handleRegister(code: string): Promise<LoginResponse> {
    console.log('🔄 Google: Registrando nuevo usuario...');

    // Enviar código al backend para registrar nuevo usuario
    const response: AxiosResponse<LoginResponse> = await api.post('/auth/google/register/', {
      code,
    });

    console.log('✅ Registro con Google completado exitosamente');
    return response.data;
  },
};

export const githubAuth = {
  getAuthUrl(): string {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/github/callback`;
    const scope = 'user:email';

    return `https://github.com/login/oauth/authorize?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}`;
  },

  async handleCallback(code: string): Promise<string> {
    // Intercambiar código por token de acceso
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: import.meta.env.VITE_GITHUB_CLIENT_ID,
        client_secret: import.meta.env.VITE_GITHUB_CLIENT_SECRET || '',
        code,
      }),
    });

    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
  },
};

export default api;