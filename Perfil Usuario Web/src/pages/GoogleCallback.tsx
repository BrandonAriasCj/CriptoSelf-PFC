import React, { useEffect } from 'react';

export const GoogleCallback: React.FC = () => {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    console.log('🔍 GoogleCallback - URL params:', { code: code?.substring(0, 20), error });

    if (error) {
      console.error('❌ Google auth error:', error);
      // Enviar mensaje de error al padre
      if (window.opener) {
        window.opener.postMessage({
          type: 'google-auth-error',
          error,
        }, window.location.origin);
        
        // Cerrar después de un pequeño delay
        setTimeout(() => window.close(), 500);
      }
    } else if (code) {
      console.log('✅ Google code recibido, enviando al padre...');
      // Enviar código al padre
      if (window.opener) {
        window.opener.postMessage({
          type: 'google-auth-success',
          code,
        }, window.location.origin);
        
        // Cerrar después de un pequeño delay para asegurar que el mensaje se envíe
        setTimeout(() => window.close(), 500);
      } else {
        console.error('❌ No hay window.opener disponible');
      }
    } else {
      console.error('❌ No se recibió código ni error de Google');
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-secondary-adaptive">Procesando autenticación con Google...</p>
      </div>
    </div>
  );
};