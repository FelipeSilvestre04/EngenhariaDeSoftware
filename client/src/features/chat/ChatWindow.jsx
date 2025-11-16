// client/src/features/chat/ChatWindow.jsx
import { useState, useEffect, useRef } from 'react';
import sendpath from '../../assets/send.svg';

export function ChatWindow( {theme} ) {

  const [messages, setMessages] = useState([]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesAreaRef = useRef(null);
  const messagesEndRef = useRef(null);

  const handleSubmit = async () => {
    if (!input) return; // Não faz nada se o input estiver vazio

    const userMessage = {
      id: Date.now(),
      text: input,
      sender: 'user'
    };
    setMessages(prevMessages => [...prevMessages, userMessage]);

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

      const aiMessage = {
        id: Date.now() + 1, 
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]); 

return (
    // O container principal do chat
    <div className="chat-window-container">

      {/* 4. LÓGICA DE EXIBIÇÃO:
          Verifica se o array de 'messages' está vazio 
      */}
      {messages.length === 0 ? (

        /* --- ESTADO VAZIO (o que você quer) --- */
        <div className="empty-chat-container">
          <h2 className="empty-chat-title">Por onde começamos?</h2>
        </div>

        ) : (

        <>
          <div className="messages-area" ref={messagesAreaRef}>
            {messages.map(message => (
              <div
                key={message.id}
                className={`message ${message.sender === 'ai' ? 'ai-message' : 'user-message'}`}
                style={{ color: message.isError ? 'red' : 'inherit' }}
              >
                {message.text}
              </div>
            ))}
            {isLoading && <div className="ai-message">...</div>}
            <div ref={messagesEndRef} /> {/* O marcador de rolagem */}
          </div>
        </>
      )}

      {/* A ÁREA DE INPUT fica sempre no final, independente do estado */}
      <div className="input-area">
        <input
          type="text"
          placeholder="Pergunte sobre sua agenda..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          disabled={isLoading}
        />
        <button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? '...' : <img className={`send-button-img ${theme === 'dark' ? 'invert' : ''}`}
                                    src={sendpath} 
                                    alt="Enviar"
            />
            }
        </button>
      </div>

    </div>
  );
}