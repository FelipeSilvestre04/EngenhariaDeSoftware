// client/src/features/auth/GoogleAuth.jsx
import { useState, useEffect } from 'react';
import { CalendarView } from '../calendar/CalendarView';

export function GoogleAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const res = await fetch('/auth/check');
        const data = await res.json();
        console.log("Status de autenticação:", data);
        setIsAuthenticated(data.authenticated);
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuthStatus();
  }, []);

  const handleLogin = () => {
    window.location.href = '/auth/login';
  };

  const handleLogout = async () => {
    await fetch('/auth/logout');
    window.location.reload();
  };

  return (
    <div className="calendar-view-container">
      {isLoading && <p>Verificando autenticação...</p>}

      {!isLoading && isAuthenticated && (
        <>
          <CalendarView />
        </>
      )}

      {!isLoading && !isAuthenticated && (
        <div>
          <h3>Conectar Calendário</h3>
          <p>Conecte sua conta para ver seus eventos.</p>
          <button className="google-login-button" onClick={handleLogin}>Conectar com Google</button>
        </div>
      )}
    </div>
  );
}