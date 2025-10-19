// client/src/features/chat/ChatWindow.jsx
import { useState } from 'react';

export function ChatWindow() {
  // Estados para controlar o input do usuário, a resposta, o loading e erros
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Função chamada ao clicar no botão
  const handleSubmit = async () => {
    if (!input) {
      setError('Por favor, digite um nome para consultar a agenda.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse('');

    try {
      // A chamada para o backend que já tínhamos feito
      const res = await fetch(`/llm/consulta?name=${input}`);

      if (!res.ok) {
        throw new Error(`Erro na rede: ${res.statusText}`);
      }

      const data = await res.json();
      setResponse(data.answer);

    } catch (err) {
      setError(`Falha ao buscar resposta: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-window-container">
      <h2>Chat com IA</h2>
      <div className="messages-area">
        {/* Mensagem inicial */}
        <div className="ai-message">Olá! Sou sua assistente de IA. Digite um nome para consultar a agenda.</div>

        {/* Mostra o status de carregamento */}
        {isLoading && <p>Consultando a agenda...</p>}
        
        {/* Mostra mensagens de erro */}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        
        {/* Mostra a resposta da IA quando ela chegar */}
        {response && (
          <div className="ai-message" style={{ marginTop: '1rem' }}>
            <p>{response}</p>
          </div>
        )}
      </div>
      <div className="input-area">
        <input
          type="text"
          placeholder="Digite um nome..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
        />
        <button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? '...' : '▶'}
        </button>
      </div>
    </div>
  );
}