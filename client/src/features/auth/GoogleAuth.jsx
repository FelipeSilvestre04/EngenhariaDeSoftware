// client/src/features/auth/GoogleAuth.jsx
import { useState, useEffect } from 'react';

export function GoogleAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // useEffect é um gancho que executa o código depois que o componente é montado na tela.
  // O array vazio `[]` no final faz com que ele rode apenas uma vez.
  useEffect(() => {
    // Função para verificar o status da autenticação com o backend
    const checkAuthStatus = async () => {
      try {
        const res = await fetch('/calendar/check');
        const data = await res.json();
        setIsAuthenticated(data.authenticated);
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        setIsAuthenticated(false); // Assume não autenticado em caso de erro
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Se ainda estiver carregando, mostra uma mensagem
  if (isLoading) {
    return <div className="auth-container"><p>Verificando autenticação...</p></div>;
  }

  // O link do botão de login aponta para a rota do NOSSO backend, não do Google!
  const handleLogin = () => {
    window.location.href = 'http://localhost:10000/calendar/auth';
  };

  const handleLogout = async () => {
  await fetch('/calendar/logout');
  setIsAuthenticated(false); // Atualiza o estado no frontend para mostrar o botão de login
};

return (
  <div className="auth-container">
    {isAuthenticated ? (
      <div>
        <p>✅ Conectado ao Google Calendar!</p>
        {/* ATUALIZE O BOTÃO AQUI */}
        <button onClick={handleLogout}>Desconectar</button>
      </div>
    ) : (
      <div>
        <p>Conecte sua conta para ver seus eventos.</p>
        <button onClick={handleLogin}>Conectar com Google</button>
      </div>
    )}
  </div>
)

  return (
    <div className="auth-container">
      {isAuthenticated ? (
        <div>
          <p>✅ Conectado ao Google Calendar!</p>
          {/* No futuro, o botão de logout chamará a rota /calendar/logout */}
          <button>Desconectar</button>
        </div>
      ) : (
        <div>
          <p>Conecte sua conta para ver seus eventos.</p>
          <button onClick={handleLogin}>Conectar com Google</button>
        </div>
      )}
    </div>
  );
}