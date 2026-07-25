import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { googleAuth, githubAuth } from '../../services/api';
import { toast } from 'sonner';

interface RegisterFormProps {
  onToggleMode: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onToggleMode }) => {
  const { register, loginWithSocial, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password_confirm: formData.confirmPassword,
        first_name: formData.first_name,
        last_name: formData.last_name,
      });
    } catch (error) {
      // Error ya manejado en el contexto
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    try {
      let authUrl: string;

      if (provider === 'google') {
        console.log("registrar con google")
        authUrl = googleAuth.getAuthUrl();
      } else {
        authUrl = githubAuth.getAuthUrl();
      }

      console.log("1");
      // Abrir ventana popup para autenticación
      const popup = window.open(
        authUrl,
        `${provider}-auth`,
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );
      console.log("2");


      // Escuchar el mensaje del popup
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === `${provider}-auth-success`) {
          const { code } = event.data;
          popup?.close();

          try {
            if (provider === 'google') {
              // Google: registro de nuevo usuario
              console.log(`🔄 Registrando nuevo usuario con Google...`);
              console.log("asdfadsf")
              const authData = await googleAuth.handleRegister(code);
              console.log("asdfadsf")
              
              // Guardar token y usuario
              localStorage.setItem('access_token', authData.access_token);
              if (authData.user) {
                localStorage.setItem('user', JSON.stringify(authData.user));
              }
              
              console.log(`✅ Registro con Google completado exitosamente`);
              toast.success('¡Cuenta creada exitosamente con Google!');
              window.location.href = '/trading';
            } else {
              // GitHub: flujo anterior
              const accessToken = await githubAuth.handleCallback(code);
              await loginWithSocial(provider, accessToken);
            }
          } catch (error: any) {
            console.error(`❌ Error en registro con ${provider}:`, error);
            console.error('Detalles del error:', {
              message: error.message,
              response: error.response?.data,
              status: error.response?.status
            });
            
            // Manejar error de usuario ya registrado
            if (error.response?.status === 409 && error.response?.data?.error === 'Usuario ya registrado') {
              toast.error(
                error.response.data.message || 'Este correo ya está registrado. Por favor, inicia sesión.',
                { duration: 5000 }
              );
            } else {
              toast.error(error.response?.data?.error || `Error en el registro con ${provider}`);
            }
          }
        }

        if (event.data.type === `${provider}-auth-error`) {
          popup?.close();
          toast.error(`Error en la autenticación con ${provider}`);
        }
      };


      console.log("3");

      window.addEventListener('message', handleMessage);

      console.log("4");
      // Limpiar listener cuando se cierre el popup
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          window.removeEventListener('message', handleMessage);
          clearInterval(checkClosed);
        }
      }, 1000);
      console.log("5");

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
        <CardTitle className="text-2xl text-center">Crear Cuenta</CardTitle>
        <CardDescription className="text-center">
          Regístrate para comenzar a usar la plataforma
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
            Registrarse con Google
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              O regístrate con email
            </span>
          </div>
        </div>

        {/* Formulario tradicional */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Nombre</Label>
              <Input
                id="first_name"
                name="first_name"
                type="text"
                placeholder="Juan"
                value={formData.first_name}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Apellido</Label>
              <Input
                id="last_name"
                name="last_name"
                type="text"
                placeholder="Pérez"
                value={formData.last_name}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Nombre de usuario</Label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="juanperez"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="juan@ejemplo.com"
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

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
          </Button>
        </form>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">¿Ya tienes una cuenta? </span>
          <Button
            variant="link"
            className="p-0 h-auto font-normal"
            onClick={onToggleMode}
          >
            Inicia sesión aquí
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};