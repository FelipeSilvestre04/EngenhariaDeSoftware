// client/src/features/auth/GoogleAuth.jsx
import { useState, useEffect } from 'react';
import { CalendarView } from '../calendar/CalendarView';

export function GoogleAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Este useEffect roda uma vez quando o componente carrega para verificar o status do login
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

  // Função para redirecionar o usuário para a rota de autenticação do nosso backend
  const handleLogin = () => {
    window.location.href = 'http://localhost:10000/calendar/auth';
  };

  // Função para chamar a rota de logout do backend e recarregar a página
  const handleLogout = async () => {
    await fetch('/calendar/logout');
    window.location.reload();
  };

  // Enquanto verifica o status, mostra uma mensagem de carregamento
  if (isLoading) {
    return (
      <div className="calendar-view-container">
        <p>Verificando autenticação...</p>
      </div>
    );
  }

  // Se o usuário estiver autenticado, mostra o calendário e o botão de logout
  if (isAuthenticated) {
    return (
      <div className="calendar-view-container">
        <div style={{ flexGrow: 1 }}> {/* Div para dar altura ao calendário */}
          <CalendarView />
        </div>
        <button onClick={handleLogout} style={{ marginTop: '1rem', flexShrink: 0 }}>
          Desconectar do Google
        </button>
      </div>
    );
  }

  // Se não estiver autenticado, mostra a tela para fazer o login
  return (
    <div className="calendar-view-container">
      <h3>Conectar Calendário</h3>
      <p>Conecte sua conta para ver seus eventos.</p>
      <button onClick={handleLogin}>Conectar com Google</button>
    </div>
  );
}