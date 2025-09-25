// client/src/App.jsx

import { useState } from 'react';
import './App.css'; // Pode estilizar aqui depois

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // **AQUI VEM A MÁGICA DA COMUNICAÇÃO (ver Passo 4)**
    // Por enquanto, vamos simular uma resposta
    setTimeout(() => {
      const botMessage = { text: `Resposta da IA para: "${input}"`, sender: 'bot' };
      setMessages(prev => [...prev, botMessage]);
    }, 1000);
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
      </div>
      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button onClick={handleSend}>Enviar</button>
      </div>
    </div>
  );
}

export default App;