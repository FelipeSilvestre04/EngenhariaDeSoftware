// client/src/features/chat/ChatWindow.jsx
import { useState } from 'react';

export function ChatWindow() {
  // 1. MUDANÇA PRINCIPAL: "messages" agora é um array de objetos.
  // Começamos com a mensagem inicial da IA.
  const [messages, setMessages] = useState([
    { id: 1, text: 'Olá! Sou sua assistente de IA. Faça uma pergunta sobre sua agenda.', sender: 'ai' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!input) return; // Não faz nada se o input estiver vazio

    // 2. ADICIONA A MENSAGEM DO USUÁRIO NA TELA IMEDIATAMENTE
    const userMessage = {
      id: Date.now(),
      text: input,
      sender: 'user'
    };
    setMessages(prevMessages => [...prevMessages, userMessage]);

    // 3. LIMPA O INPUT
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`/llm/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input }),
      });

      if (!res.ok) throw new Error(`Erro na rede: ${res.statusText}`);

      const data = await res.json();

      // 4. ADICIONA A RESPOSTA DA IA NA TELA
      const aiMessage = {
        id: Date.now() + 1, // id ligeiramente diferente para evitar colisões
        text: data.answer,
        sender: 'ai'
      };
      setMessages(prevMessages => [...prevMessages, aiMessage]);

    } catch (err) {
      const errorMessage = {
        id: Date.now() + 1,
        text: `Desculpe, ocorreu um erro: ${err.message}`,
        sender: 'ai',
        isError: true
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-window-container">
      <h2>Chat com IA</h2>
      <div className="messages-area">
        {/* 5. RENDERIZA TODAS AS MENSAGENS DO ARRAY */}
        {messages.map(message => (
          <div
            key={message.id}
            className={`message ${message.sender === 'ai' ? 'ai-message' : 'user-message'}`}
            style={{ color: message.isError ? 'red' : 'inherit' }}
          >
            {message.text}
          </div>
        ))}
        {/* Mostra um indicador de "digitando..." */}
        {isLoading && <div className="ai-message">...</div>}
      </div>
      <div className="input-area">
        <input
          type="text"
          placeholder="Pergunte sobre sua agenda..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          // Permite enviar com a tecla Enter
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          disabled={isLoading}
        />
        <button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? '...' : '▶'}
        </button>
      </div>
    </div>
  );
}