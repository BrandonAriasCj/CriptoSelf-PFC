import React from 'react';
import { Button } from '../ui/button';
import { LogOut, X } from 'lucide-react';

interface SimpleLogoutConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName?: string;
}

export const SimpleLogoutConfirmation: React.FC<SimpleLogoutConfirmationProps> = ({
  isOpen,
  onClose,
  onConfirm,
  userName
}) => {
  if (!isOpen) return null;

  return (
    <div className="flex">
    <div className="fixed flex-1 inset-0 z-50 flex items-center justify-center sm:p-0 md:p-6 lg:p-10">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-card border border-border rounded-lg shadow-brand p-6 w-full max-w-md mx-6 transition-theme">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <LogOut className="h-5 w-5 text-icon-destructive" />
            <h2 className="text-lg font-semibold text-primary-adaptive">Cerrar Sesión</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-sm text-secondary-adaptive">
            {userName ? (
              <>¿Estás seguro de que quieres cerrar la sesión de <strong className="text-high-contrast">{userName}</strong>?</>
            ) : (
              '¿Estás seguro de que quieres cerrar la sesión?'
            )}
          </p>
          <p className="text-sm text-secondary-adaptive mt-2">
            Tendrás que volver a iniciar sesión para acceder a tu cuenta.
          </p>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground-adaptive transition-theme"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </div>
    </div>
  );
};