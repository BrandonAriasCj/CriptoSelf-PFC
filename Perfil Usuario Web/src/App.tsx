import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { NotificationBell } from './components/NotificationBell';
import { AuthPage } from './pages/AuthPage';
import { GoogleCallback } from './pages/GoogleCallback';
import { GitHubCallback } from './pages/GitHubCallback';
import { SimpleLogoutConfirmation } from './components/auth/SimpleLogoutConfirmation';
import { useLogout } from './hooks/useLogout';
import {
  TradingDashboard,
  Portfolio,
  StrategyBuilder,
  BacktestResults,
  MyStrategy,
  Settings
} from './pages';
import { PortfolioStats } from './components/PortfolioStats';
import { MyProfile } from './components/MyProfile';
import Alerts from './pages/Alerts';
import MyChallenges from './pages/MyChallenges';
import { Button } from './components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from './components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './components/ui/dropdown-menu';
import { Toaster } from './components/ui/sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './components/ui/tooltip';
import { ThemeProvider } from './components/theme/ThemeProvider';
import { ThemeToggle } from './components/theme/ThemeToggle';
import {
  Bot,
  Settings as SettingsIcon,
  Activity,
  Menu,
  Zap,
  TrendingUp,
  Target,
  LogOut,
  User,
  Bell
} from 'lucide-react';
import { cn } from './components/ui/utils';
import { useLocation, useNavigate } from 'react-router-dom';

type Tab = 'trading' | 'portfolio' | 'strategy-builder' | 'backtest' | 'my-strategy' | 'activity' | 'alerts' | 'settings' | 'profile' | 'my-challenges';

// Componente protegido que requiere autenticación
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-loading-adaptive">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Guardar la ubicación actual para redirigir después del login
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Componente principal de la aplicación
const MainApp: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const { user } = useAuth();
  const handleLogoutAction = useLogout();

  // Determinar la pestaña activa basada en la URL
  const getActiveTabFromPath = (pathname: string): Tab => {
    const path = pathname.substring(1); // Remover el '/' inicial

    const validTabs: Tab[] = ['trading', 'portfolio', 'strategy-builder', 'backtest', 'my-strategy', 'activity', 'alerts', 'settings', 'profile', 'my-challenges'];
    return validTabs.includes(path as Tab) ? (path as Tab) : 'trading';
  };

  const [activeTab, setActiveTab] = useState<Tab>(getActiveTabFromPath(location.pathname));

  // Actualizar activeTab cuando cambie la URL
  React.useEffect(() => {
    setActiveTab(getActiveTabFromPath(location.pathname));
  }, [location.pathname]);

  // Atajo de teclado para logout (Ctrl+Shift+L)
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'L') {
        event.preventDefault();
        handleLogout();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Función para cambiar de pestaña y navegar
  const handleTabChange = (tabId: Tab) => {
    setActiveTab(tabId);
    navigate(`/${tabId}`);
    setIsMobileMenuOpen(false);
  };

  // Función para manejar el logout con confirmación
  const handleLogout = () => {
    setShowLogoutConfirmation(true);
  };

  const confirmLogout = async () => {
    setShowLogoutConfirmation(false);
    try {
      await handleLogoutAction();
    } catch (error) {
      console.error('Error during logout confirmation:', error);
      // En caso de error, forzar la navegación
      window.location.href = '/auth';
    }
  };

  const tabs = [
    { id: 'trading' as Tab, label: 'Trading', icon: TrendingUp },
    { id: 'my-strategy' as Tab, label: 'Backtesting', icon: Target },
    { id: 'my-challenges' as Tab, label: 'Mis Retos', icon: Target },
    { id: 'activity' as Tab, label: 'Portafolio', icon: Activity },
    { id: 'alerts' as Tab, label: 'Alertas', icon: Bell },
    { id: 'settings' as Tab, label: 'Configuración', icon: SettingsIcon },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'trading':
        return <TradingDashboard />;
      case 'portfolio':
        return <Portfolio />;
      case 'strategy-builder':
        return <StrategyBuilder />;
      case 'backtest':
        return <BacktestResults />;
      case 'my-strategy':
        return <MyStrategy />;
      case 'activity':
        return <PortfolioStats />;
      case 'my-challenges':
        return <MyChallenges />;
      case 'alerts':
        return <Alerts />;
      case 'settings':
        return <Settings />;
      case 'profile':
        return <MyProfile />;
      default:
        return <TradingDashboard />;
    }
  };

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Bot className="w-6 h-6 text-gradient-overlay" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <Zap className="w-2.5 h-2.5 text-gradient-overlay" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary-adaptive">
              CriptoSelf
            </h1>
            <p className="text-sm text-secondary-adaptive">Simulador de cripto</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <Button
              key={tab.id}
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 h-12 rounded-xl transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border border-blue-200/50 dark:border-blue-800/50 text-blue-700 dark:text-blue-300 shadow-sm"
                  : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
              )}
              onClick={() => handleTabChange(tab.id)}
            >
              <Icon className={cn("w-5 h-5", isActive ? "text-icon-active" : "text-icon-adaptive")} />
              <span className="font-medium">{tab.label}</span>
            </Button>
          );
        })}
      </nav>

      {/* User Info and Logout */}
      <div className="p-4 border-t border-border/50 space-y-3">
        {/* User Info */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted-alpha-30 transition-theme">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.avatar} alt={user?.username} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-avatar-overlay">
              {(user?.first_name?.[0] || '') + (user?.last_name?.[0] || '') || user?.username?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-high-contrast truncate">
              {user?.first_name && user?.last_name
                ? `${user.first_name} ${user.last_name}`
                : user?.username}
            </p>
            <p className="text-xs text-secondary-adaptive truncate">
              {user?.email}
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-11 rounded-xl text-destructive-adaptive hover:text-destructive-adaptive hover:bg-destructive-subtle transition-theme"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Cerrar Sesión</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Atajo: Ctrl+Shift+L</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background transition-theme">
      {/* Mobile Header */}
      <div className="lg:hidden bg-card-alpha-80 backdrop-blur-theme border-b border-border-alpha-50 sticky top-0 z-50 transition-theme">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-gradient-overlay" />
            </div>
            <h1 className="text-lg font-bold text-primary-adaptive">CriptoSelf</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Notificaciones */}
            <NotificationBell />

            {/* User Avatar - Mobile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar} alt={user?.username} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-avatar-overlay text-xs">
                      {(user?.first_name?.[0] || '') + (user?.last_name?.[0] || '') || user?.username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none text-high-contrast">
                      {user?.first_name && user?.last_name
                        ? `${user.first_name} ${user.last_name}`
                        : user?.username}
                    </p>
                    <p className="text-xs leading-none text-secondary-adaptive">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleTabChange("profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Mi Perfil</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive-adaptive focus:text-destructive-adaptive focus:bg-destructive-subtle transition-theme"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Menu Button */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="p-2">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>

              <SheetContent side="left" className="p-0 w-80">
                <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
                <SheetDescription className="sr-only">
                  Accede a las diferentes secciones de la aplicación
                </SheetDescription>
                <div className="flex flex-col h-full">
                  <SidebarContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      <div className="flex min-h-screen lg:min-h-screen">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex w-80 bg-sidebar backdrop-blur-theme border-r border-sidebar flex-col shadow-sm transition-theme">
          <SidebarContent />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Desktop Header */}
          <div className="hidden lg:block bg-header backdrop-blur-theme border-b border-border-alpha-50 sticky top-0 z-40 transition-theme">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-primary-adaptive">
                    {tabs.find((tab) => tab.id === activeTab)?.label}
                  </h2>
                  <p className="text-sm text-secondary-adaptive mt-1">
                    {activeTab === "trading"
                      ? "Panel de trading en tiempo real con gráficos y órdenes"
                      : activeTab === "portfolio"
                        ? "Gestiona tu cartera de criptomonedas y activos"
                        : activeTab === "strategy-builder"
                          ? "Crea estrategias de trading cuantitativas"
                          : activeTab === "backtest"
                            ? "Resultados y análisis de backtesting"
                            : activeTab === "my-strategy"
                              ? "Gestiona tus estrategias de trading"
                              : activeTab === "activity"
                                ? "Resumen de tu portafolio y estadísticas de rendimiento"
                                : activeTab === "alerts"
                                  ? "Alertas, señales y notificaciones en tiempo real"
                                : activeTab === "profile"
                                  ? "Tu perfil personal y configuración de cuenta"
                                  : "Configuración y preferencias del sistema"}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-secondary-adaptive">
                      Mercado Abierto
                    </span>
                  </div>

                  {/* Notificaciones */}
                  <NotificationBell />

                  {/* Theme Toggle */}
                  <ThemeToggle />

                  {/* User Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user?.avatar} alt={user?.username} />
                          <AvatarFallback>
                            {(user?.first_name?.[0] || '') + (user?.last_name?.[0] || '') || user?.username?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {user?.first_name && user?.last_name
                              ? `${user.first_name} ${user.last_name}`
                              : user?.username}
                          </p>
                          <p className="text-xs leading-none text-secondary-adaptive">
                            {user?.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>

                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleTabChange("profile")}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Mi Perfil</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleTabChange("settings")}>
                        <SettingsIcon className="mr-2 h-4 w-4" />
                        <span>Configuración</span>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="text-destructive-adaptive focus:text-destructive-adaptive focus:bg-destructive-subtle transition-theme"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Cerrar sesión</span>
                        <span className="ml-auto text-xs text-low-contrast">
                          Ctrl+Shift+L
                        </span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-transparent">{renderContent()}</div>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <div className="p-6">
        <SimpleLogoutConfirmation
          isOpen={showLogoutConfirmation}
          onClose={() => setShowLogoutConfirmation(false)}
          onConfirm={confirmLogout}
          userName={
            user?.first_name && user?.last_name
              ? `${user.first_name} ${user.last_name}`
              : user?.username
          }
        />
      </div>
    </div>

  );
}

// Componente raíz con Router y AuthProvider
export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="criptoself-theme">
      <Router future={{ v7_relativeSplatPath: true }}>
        <AuthProvider>
          <NotificationsProvider>
            <div className="min-h-screen">
              <Routes>
              {/* Rutas públicas */}
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/auth/google/callback" element={<GoogleCallback />} />
              <Route path="/auth/github/callback" element={<GitHubCallback />} />

              {/* Rutas protegidas principales */}
              <Route
                path="/trading"
                element={
                  <ProtectedRoute>
                    <MainApp />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/portfolio"
                element={
                  <ProtectedRoute>
                    <MainApp />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/strategy-builder"
                element={
                  <ProtectedRoute>
                    <MainApp />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/backtest"
                element={
                  <ProtectedRoute>
                    <MainApp />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-strategy"
                element={
                  <ProtectedRoute>
                    <MainApp />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/activity"
                element={
                  <ProtectedRoute>
                    <MainApp />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/alerts"
                element={
                  <ProtectedRoute>
                    <MainApp />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-challenges"
                element={
                  <ProtectedRoute>
                    <MainApp />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <MainApp />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <MainApp />
                  </ProtectedRoute>
                }
              />

              {/* Redirección por defecto */}
              <Route path="/" element={<Navigate to="/trading" replace />} />
            </Routes>

            {/* Toast notifications */}
            <Toaster />
            </div>
          </NotificationsProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}