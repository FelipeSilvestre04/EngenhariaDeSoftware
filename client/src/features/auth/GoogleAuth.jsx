// client/src/features/auth/GoogleAuth.jsx
import { useState, useEffect } from 'react';
import { CalendarView } from '../calendar/CalendarView';
import { Env } from '../../utils/env';

export function GoogleAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const res = await fetch('/calendar/check');
        const data = await res.json();
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
    const backendUrl = Env.getEnvVar('VITE_BACKEND_URL', 'http://localhost:10000');
    window.location.href = `${backendUrl}/calendar/auth`;
  };

  const handleLogout = async () => {
    await fetch('/calendar/logout');
    window.location.reload();
  };

  return (
    <div className="calendar-view-container">
      {isLoading && <p>Verificando autenticação...</p>}

      {!isLoading && isAuthenticated && (
        <>
          <CalendarView />
          <button onClick={handleLogout} style={{ marginTop: 'auto', width: '100%' }}>
            Desconectar do Google
          </button>
        </>
      )}

      {!isLoading && !isAuthenticated && (
        <div>
          <h3>Conectar Calendário</h3>
          <p>Conecte sua conta para ver seus eventos.</p>
          <button onClick={handleLogin}>Conectar com Google</button>
        </div>
      )}
    </div>
  );
}