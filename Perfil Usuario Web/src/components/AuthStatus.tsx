import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const AuthStatus: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="bg-blue-600/20 backdrop-blur-lg rounded-lg p-4 border border-blue-400/30 mb-4">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400 mr-3"></div>
          <span className="text-blue-200">Verificando autenticación...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-red-600/20 backdrop-blur-lg rounded-lg p-4 border border-red-400/30 mb-4">
        <div className="flex items-center">
          <XCircle className="w-5 h-5 text-red-400 mr-3" />
          <span className="text-red-200">No autenticado - Redirigiendo al login...</span>
        </div>
      </div>
    );
  }

  const token = localStorage.getItem('access_token');
  const hasToken = !!token;

  return (
    <div className="bg-green-600/20 backdrop-blur-lg rounded-lg p-4 border border-green-400/30 mb-4">
      <div className="space-y-2">
        <div className="flex items-center">
          <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
          <span className="text-green-200 font-semibold">Estado de Autenticación</span>
        </div>
        
        <div className="ml-8 space-y-1 text-sm">
          <div className="flex items-center">
            {isAuthenticated ? (
              <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
            ) : (
              <XCircle className="w-4 h-4 text-red-400 mr-2" />
            )}
            <span className="text-gray-300">
              Usuario autenticado: {isAuthenticated ? 'Sí' : 'No'}
            </span>
          </div>
          
          <div className="flex items-center">
            {hasToken ? (
              <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
            ) : (
              <XCircle className="w-4 h-4 text-red-400 mr-2" />
            )}
            <span className="text-gray-300">
              Token disponible: {hasToken ? 'Sí' : 'No'}
            </span>
          </div>
          
          {user && (
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
              <span className="text-gray-300">
                Usuario: {user.username} ({user.email})
              </span>
            </div>
          )}
          
          {token && (
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 text-yellow-400 mr-2" />
              <span className="text-gray-300 text-xs">
                Token: {token.substring(0, 20)}...
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthStatus;