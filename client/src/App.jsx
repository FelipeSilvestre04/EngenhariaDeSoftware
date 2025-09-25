// client/src/App.jsx

import { useState } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  // Novo: estado para saber se estamos aguardando uma resposta
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    // Não envia se já estiver carregando ou se o input estiver vazio
    if (!input.trim() || isLoading) return;

    const userMessage = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true); // Começa a carregar

    try {
      // --- A CONEXÃO ACONTECE AQUI ---
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST', // Estamos enviando dados
        headers: {
          'Content-Type': 'application/json', // Avisa que estamos enviando em formato JSON
        },
        // Transforma nosso objeto JS em texto JSON para enviar
        body: JSON.stringify({ message: currentInput }),
      });

      if (!response.ok) { // Verifica se o servidor respondeu com sucesso
        throw new Error('A resposta do servidor não foi boa.');
      }

      const data = await response.json(); // Pega a resposta do servidor
      const botMessage = { text: data.reply, sender: 'bot' };
      setMessages(prev => [...prev, botMessage]); // Adiciona a resposta da IA no chat

    } catch (error) {
      console.error("Erro ao conectar com o backend:", error);
      const errorMessage = { text: "Deu ruim, não consegui falar com o servidor. Tente de novo.", sender: 'bot' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false); // Para de carregar, independente se deu certo ou erro
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
        {/* Mostra um "Digitando..." enquanto espera */}
        {isLoading && <div className="message bot">Digitando...</div>}
      </div>
      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={isLoading ? "Aguarde..." : "Digite sua mensagem..."}
          disabled={isLoading}
        />
        <button onClick={handleSend} disabled={isLoading}>
          {isLoading ? '...' : 'Enviar'}
        </button>
      </div>
    </div>
  );
}

export default App;