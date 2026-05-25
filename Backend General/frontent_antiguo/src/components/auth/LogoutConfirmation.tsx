import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { LogOut } from 'lucide-react';

interface LogoutConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName?: string;
}

export const LogoutConfirmation: React.FC<LogoutConfirmationProps> = ({
  isOpen,
  onClose,
  onConfirm,
  userName
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5 text-icon-destructive" />
            Cerrar Sesión
          </AlertDialogTitle>
          <AlertDialogDescription>
            {userName ? (
              <>¿Estás seguro de que quieres cerrar la sesión de <strong>{userName}</strong>?</>
            ) : (
              '¿Estás seguro de que quieres cerrar la sesión?'
            )}
            <br />
            <br />
            Tendrás que volver a iniciar sesión para acceder a tu cuenta.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>
            Cancelarasdfasf
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-destructive hover:bg-destructive/90 focus:ring-destructive text-destructive-foreground-adaptive transition-theme"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Cerrar Sesión
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};