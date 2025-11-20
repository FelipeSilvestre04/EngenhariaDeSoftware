// client/src/features/chat/ChatWindow.jsx
import { useState, useEffect, useRef } from 'react';
import sendpath from '../../assets/send.svg';

export function ChatWindow( {theme} ) {

  const [messages, setMessages] = useState([]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesAreaRef = useRef(null);
  const messagesEndRef = useRef(null);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    e.currentTarget.style.setProperty('--mouse-x', `${x}%`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}%`);
  };

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
      const res = await fetch(`/api/llm/query`, {
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
    <div className="chat-window-container">

      {messages.length === 0 ? (

        <div className="empty-chat-container">
          <h2 
            className="empty-chat-title"
            onMouseMove={handleMouseMove}>Por onde começamos?</h2>
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
            <div ref={messagesEndRef} /> 
          </div>
        </>
      )}

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