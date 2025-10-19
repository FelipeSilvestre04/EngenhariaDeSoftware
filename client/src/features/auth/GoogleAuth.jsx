// client/src/features/auth/GoogleAuth.jsx
import { useState, useEffect } from 'react';
import { CalendarView } from '../calendar/CalendarView'; // O caminho ../ aqui está correto!

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
      } finally {
        setIsLoading(false);
      }
    };
    checkAuthStatus();
  }, []);

  const handleLogin = () => {
    window.location.href = 'http://localhost:10000/calendar/auth';
  };

  const handleLogout = async () => {
    await fetch('/calendar/logout');
    window.location.reload();
  };

  if (isLoading) {
    return <div className="calendar-view-container"><p>Verificando autenticação...</p></div>;
  }

  if (isAuthenticated) {
    return (
      <div className="calendar-view-container">
        <CalendarView />
        <button onClick={handleLogout} style={{ marginTop: '1rem', flexShrink: 0 }}>
          Desconectar do Google
        </button>
      </div>
    );
  }

  return (
    <div className="calendar-view-container">
      <h3>Conectar Calendário</h3>
      <p>Conecte sua conta para ver seus eventos.</p>
      <button onClick={handleLogin}>Conectar com Google</button>
    </div>
  );
}