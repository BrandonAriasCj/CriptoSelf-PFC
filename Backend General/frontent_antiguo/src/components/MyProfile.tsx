import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar,
  TrendingUp,
  Edit,
  Camera,
  Shield,
  Clock,
  Key
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

// TODO: Estas estadísticas deberían venir del backend
// const userStats = {
//   totalTrades: 234,
//   winRate: 68.5,
//   totalProfit: 12547.80,
//   activeStrategies: 3,
// };

export function MyProfile() {
  const { user, updateProfile, changePassword } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [userInfo, setUserInfo] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    phone_number: '',
  });

  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });

  // Cargar datos del usuario cuando el componente se monta
  useEffect(() => {
    if (user) {
      setUserInfo({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        username: user.username || '',
        phone_number: user.phone_number || '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateProfile({
        first_name: userInfo.first_name,
        last_name: userInfo.last_name,
        phone_number: userInfo.phone_number,
      });
      setIsEditing(false);
    } catch (error) {
      // Error ya manejado en el contexto
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (passwordData.new_password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    try {
      setIsSaving(true);
      await changePassword({
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
      });
      setIsChangingPassword(false);
      setPasswordData({
        old_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (error) {
      // Error ya manejado en el contexto
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[400px]">
        <p className="text-gray-400">Cargando perfil...</p>
      </div>
    );
  }

  const getInitials = () => {
    // Limpiar y validar first_name y last_name
    const firstName = (userInfo.first_name || '').trim();
    const lastName = (userInfo.last_name || '').trim();
    
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    
    if (firstName) {
      return firstName.substring(0, 2).toUpperCase();
    }
    
    if (lastName) {
      return lastName.substring(0, 2).toUpperCase();
    }
    
    // Fallback al username
    const username = (userInfo.username || '').trim();
    if (username.length >= 2) {
      return username.substring(0, 2).toUpperCase();
    }
    
    return 'US'; // Fallback final
  };

  const getFullName = () => {
    if (userInfo.first_name || userInfo.last_name) {
      return `${userInfo.first_name} ${userInfo.last_name}`.trim();
    }
    return userInfo.username;
  };

  const getMemberSince = () => {
    if (user.date_joined) {
      const date = new Date(user.date_joined);
      return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    }
    return 'Recientemente';
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Profile Header */}
      <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-emerald-500/20">
                <AvatarImage src="" alt="Profile" />
                <AvatarFallback className="bg-emerald-600 text-white text-xl">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                variant="outline"
                className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 bg-gray-800 border-gray-600"
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">{getFullName()}</h2>
                  <p className="text-gray-400">@{userInfo.username}</p>
                  <p className="text-sm text-gray-500">{userInfo.email}</p>
                  <div className="flex items-center gap-4 mt-2">
                    {user.is_verified && (
                      <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">
                        <Shield className="w-3 h-3 mr-1" />
                        Verificado
                      </Badge>
                    )}
                    <span className="text-sm text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Miembro desde {getMemberSince()}
                    </span>
                  </div>
                </div>
                
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  variant={isEditing ? "default" : "outline"}
                  className="self-start"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  {isEditing ? 'Cancelar' : 'Editar Perfil'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div>
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <User className="w-5 h-5" />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-white">Nombre</Label>
                    <Input
                      value={userInfo.first_name}
                      onChange={(e) => setUserInfo(prev => ({ ...prev, first_name: e.target.value }))}
                      className="bg-gray-800 border-gray-600 text-white"
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Apellido</Label>
                    <Input
                      value={userInfo.last_name}
                      onChange={(e) => setUserInfo(prev => ({ ...prev, last_name: e.target.value }))}
                      className="bg-gray-800 border-gray-600 text-white"
                      placeholder="Tu apellido"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Username</Label>
                    <Input
                      value={userInfo.username}
                      disabled
                      className="bg-gray-800 border-gray-600 text-gray-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">El username no se puede cambiar</p>
                  </div>
                  <div>
                    <Label className="text-white">Email</Label>
                    <Input
                      value={userInfo.email}
                      disabled
                      className="bg-gray-800 border-gray-600 text-gray-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">El email no se puede cambiar</p>
                  </div>
                  <div>
                    <Label className="text-white">Teléfono</Label>
                    <Input
                      value={userInfo.phone_number}
                      onChange={(e) => setUserInfo(prev => ({ ...prev, phone_number: e.target.value }))}
                      className="bg-gray-800 border-gray-600 text-white"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleSave} 
                      className="flex-1"
                      disabled={isSaving}
                    >
                      {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                    <Button 
                      onClick={() => setIsEditing(false)} 
                      variant="outline"
                      className="flex-1"
                      disabled={isSaving}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-400">Nombre Completo</p>
                      <p className="text-white">{getFullName()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-400">Email</p>
                      <p className="text-white">{userInfo.email}</p>
                      {user.email_verified && (
                        <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-xs mt-1">
                          Verificado
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-400">Teléfono</p>
                      <p className="text-white">{userInfo.phone_number || 'No especificado'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-400">Miembro desde</p>
                      <p className="text-white">{getMemberSince()}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Trading Statistics - TODO: Implementar con datos reales del backend */}
        <div>
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="w-5 h-5" />
                Estadísticas de Trading
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg text-center">
                <p className="text-sm text-gray-400">
                  Las estadísticas de trading estarán disponibles próximamente
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Aquí verás tu beneficio total, tasa de acierto, total de trades y estrategias activas
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Account Security */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Shield className="w-5 h-5" />
            Seguridad de la Cuenta
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isChangingPassword ? (
            <div className="space-y-4">
              <div>
                <Label className="text-white">Contraseña Actual</Label>
                <Input
                  type="password"
                  value={passwordData.old_password}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, old_password: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="Tu contraseña actual"
                />
              </div>
              <div>
                <Label className="text-white">Nueva Contraseña</Label>
                <Input
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
              <div>
                <Label className="text-white">Confirmar Nueva Contraseña</Label>
                <Input
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white"
                  placeholder="Repite la nueva contraseña"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleChangePassword} 
                  className="flex-1"
                  disabled={isSaving}
                >
                  {isSaving ? 'Cambiando...' : 'Cambiar Contraseña'}
                </Button>
                <Button 
                  onClick={() => {
                    setIsChangingPassword(false);
                    setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
                  }} 
                  variant="outline"
                  className="flex-1"
                  disabled={isSaving}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
                onClick={() => setIsChangingPassword(true)}
              >
                <Key className="w-4 h-4 mr-2" />
                Cambiar Contraseña
              </Button>
              <Button 
                variant="outline" 
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
                disabled
              >
                <Shield className="w-4 h-4 mr-2" />
                Autenticación 2FA
                <Badge variant="outline" className="ml-2 text-xs">Próximamente</Badge>
              </Button>
              <Button 
                variant="outline" 
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
                disabled
              >
                <Clock className="w-4 h-4 mr-2" />
                Sesiones Activas
                <Badge variant="outline" className="ml-2 text-xs">Próximamente</Badge>
              </Button>
              <Button 
                variant="outline" 
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
                disabled
              >
                <Calendar className="w-4 h-4 mr-2" />
                Historial de Acceso
                <Badge variant="outline" className="ml-2 text-xs">Próximamente</Badge>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}