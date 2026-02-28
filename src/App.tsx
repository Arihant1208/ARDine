
import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import Toast from '@/shared/components/Toast';

const App: React.FC = () => {
  const restoreSession = useAuthStore((s) => s.restoreSession);

  // Restore JWT + user from localStorage on app startup
  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  return (
    <>
      <Outlet />
      <Toast />
    </>
  );
};

export default App;
