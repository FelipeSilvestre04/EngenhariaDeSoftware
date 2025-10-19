// client/src/features/chat/ChatWindow.jsx
export function ChatWindow() {
  return (
    <div className="chat-window-container">
      <h2>Chat com IA</h2>
      <div className="messages-area">
        <div className="ai-message">Olá! Sou sua assistente de IA. Como posso ajudar você hoje?</div>
      </div>
      <div className="input-area">
        <input type="text" placeholder="Digite sua mensagem..." />
        <button>▶</button>
      </div>
    </div>
  );
}