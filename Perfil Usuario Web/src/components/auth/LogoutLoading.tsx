import React from 'react';

export const LogoutLoading: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg p-6 shadow-brand border border-border transition-theme">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-destructive"></div>
          <span className="text-sm font-medium text-primary-adaptive">Cerrando sesión...</span>
        </div>
      </div>
    </div>
  );
};