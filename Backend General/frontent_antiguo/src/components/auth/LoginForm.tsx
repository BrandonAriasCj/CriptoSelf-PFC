import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { googleAuth, githubAuth } from '../../services/api';
import { toast } from 'sonner';

interface LoginFormProps {
  onToggleMode: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onToggleMode }) => {
  const { login, loginWithSocial, isLoading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(formData.email, formData.password);
    } catch (error) {
      // Error ya manejado en el contexto
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    try {
      let authUrl: string;

      if (provider === 'google') {
        authUrl = googleAuth.getAuthUrl();
      } else {
        authUrl = githubAuth.getAuthUrl();
      }

      // Abrir ventana popup para autenticación
      const popup = window.open(
        authUrl,
        `${provider}-auth`,
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      // Escuchar el mensaje del popup
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === `${provider}-auth-success`) {
          const { code } = event.data;
          console.log(`✅ Código de ${provider} recibido:`, code.substring(0, 20) + '...');
          popup?.close();

          try {
            if (provider === 'google') {
              // Google: intercambio seguro en el backend
              console.log(`🔄 Enviando código al backend para intercambio seguro...`);
              const authData = await googleAuth.handleCallback(code);

              // Guardar token y usuario en localStorage
              localStorage.setItem('access_token', authData.access_token);
              if (authData.user) {
                localStorage.setItem('user', JSON.stringify(authData.user));
              }

              console.log(`✅ Autenticación con Google completada exitosamente`);
              toast.success('Sesión iniciada con Google');

              // Recargar la página para que el AuthContext recoja los tokens guardados
              // El useEffect en AuthContext (línea 30-44) detectará los tokens y cargará el usuario
              window.location.href = '/trading';
            } else {
              // GitHub: flujo anterior (puedes actualizarlo después)
              console.log(`🔄 Intercambiando código por token de ${provider}...`);
              const accessToken = await githubAuth.handleCallback(code);

              console.log(`✅ Token de ${provider} obtenido:`, accessToken.substring(0, 20) + '...');
              console.log(`🔄 Enviando token al backend para autenticación...`);

              await loginWithSocial(provider, accessToken);

              console.log(`✅ Autenticación con ${provider} completada exitosamente`);
            }
          } catch (error: any) {
            console.error(`❌ Error en autenticación ${provider}:`, error);
            console.error('Detalles del error:', {
              message: error.message,
              response: error.response?.data,
              status: error.response?.status
            });

            // Manejar error de usuario no registrado
            if (error.response?.status === 404 && error.response?.data?.error === 'Usuario no registrado') {
              toast.error(
                error.response.data.message || 'Este correo no está registrado. Por favor, regístrate primero.',
                { duration: 5000 }
              );
            } else {
              toast.error(error.response?.data?.error || `Error en la autenticación con ${provider}`);
            }
          }
        }

        if (event.data.type === `${provider}-auth-error`) {
          console.error(`❌ Error de ${provider}:`, event.data.error);
          popup?.close();
          toast.error(`Error en la autenticación con ${provider}`);
        }
      };

      window.addEventListener('message', handleMessage);

      // Limpiar listener cuando se cierre el popup
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          window.removeEventListener('message', handleMessage);
          clearInterval(checkClosed);
        }
      }, 1000);

    } catch (error) {
      console.error(`Error iniciando autenticación ${provider}:`, error);
      toast.error(`Error iniciando autenticación con ${provider}`);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Iniciar Sesión</CardTitle>
        <CardDescription className="text-center">
          Ingresa tus credenciales para acceder a tu cuenta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Autenticación Social */}
        <div className="space-y-2">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => handleSocialLogin('google')}
            disabled={isLoading}
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continuar con Google
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => handleSocialLogin('github')}
            disabled={isLoading}
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            Continuar con GitHub
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              O continúa con email
            </span>
          </div>
        </div>

        {/* Formulario tradicional */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="tu@ejemplo.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>
        </form>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">¿No tienes una cuenta? </span>
          <Button
            variant="link"
            className="p-0 h-auto font-normal"
            onClick={onToggleMode}
          >
            Regístrate aquí
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};