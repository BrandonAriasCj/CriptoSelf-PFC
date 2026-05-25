import React, { useState } from 'react';
import { Button } from '../ui/button';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { LogoutConfirmation } from './LogoutConfirmation';

export const QuickLogout: React.FC = () => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = () => {
    setShowConfirmation(true);
  };

  const confirmLogout = () => {
    logout();
    setShowConfirmation(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="fixed bottom-4 right-4 z-50 bg-destructive/10 border-destructive/30 text-destructive-adaptive hover:bg-destructive/20 hover:border-destructive/50 shadow-brand transition-theme"
        onClick={handleLogout}
      >
        <LogOut className="w-4 h-4 mr-2" />
        Logout
      </Button>

      <LogoutConfirmation
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={confirmLogout}
        userName={user?.first_name && user?.last_name 
          ? `${user.first_name} ${user.last_name}` 
          : user?.username}
      />
    </>
  );
};