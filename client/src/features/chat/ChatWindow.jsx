// client/src/features/chat/ChatWindow.jsx
import { useState, useEffect, useRef } from 'react';
import styles from './ChatWindow.module.css';
import sendpath from '../../assets/send.svg';

export function ChatWindow({ theme, projectName, projectId, onEmailDraftCreated }) {

  // Persist messages na sessão por projeto para reabrir o chat mantendo histórico
  const storageKey = projectName ? `chatMessages:${projectName}` : 'chatMessages:default';

  const [messages, setMessages] = useState(() => {
    if (typeof sessionStorage === 'undefined') return [];
    try {
      const saved = sessionStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (err) {
      console.warn('Não foi possível carregar mensagens salvas:', err);
      return [];
    }
  });

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

    // Detectar comando /email
    if (input.trim().startsWith('/email')) {
      console.log('📧 [ChatWindow] Comando /email detectado');

      // Formato: /email destinatario@exemplo.com | Assunto | Corpo da mensagem
      const parts = input.substring(6).split('|').map(p => p.trim());

      if (parts.length === 3) {
        const [to, subject, body] = parts;

        // Criar draft diretamente
        const draft = { to, subject, body };
        console.log('📧 [ChatWindow] Draft criado via comando:', draft);

        if (onEmailDraftCreated) {
          onEmailDraftCreated(draft);
        }

        // Adicionar mensagem de confirmação ao chat
        const confirmMessage = {
          id: Date.now(),
          text: `✅ Rascunho de email criado!\n\nPara: ${to}\nAssunto: ${subject}\n\nO rascunho foi preenchido na caixa de email abaixo.`,
          sender: 'ai'
        };
        setMessages(prevMessages => [...prevMessages, confirmMessage]);
        setInput('');
        return;
      } else {
        const errorMessage = {
          id: Date.now(),
          text: '❌ Formato incorreto. Use: /email destinatario@exemplo.com | Assunto | Corpo da mensagem',
          sender: 'ai',
          isError: true
        };
        setMessages(prevMessages => [...prevMessages, errorMessage]);
        setInput('');
        return;
      }
    }

    const userMessage = {
      id: Date.now(),
      text: input,
      sender: 'user'
    };
    setMessages(prevMessages => [...prevMessages, userMessage]);

    setInput('');
    setIsLoading(true);

    try {
      // Inclui projectName e projectId para o backend da LLM
      const params = new URLSearchParams();
      if (projectName) params.append('project', projectName);
      if (projectId) params.append('projectId', projectId);

      const query = params.toString() ? `?${params.toString()}` : '';

      const res = await fetch(`/llm/query${query}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input }),
      });

      if (!res.ok) throw new Error(`Erro na rede: ${res.statusText}`);

      const data = await res.json();
      console.log('📦 [ChatWindow] Dados recebidos da API:', data);

      // Detectar comando /email na resposta da LLM
      let answerText = data.answer;
      if (answerText && answerText.includes('/email')) {
        console.log('📧 [ChatWindow] Comando /email detectado na resposta da LLM');

        // Extrair o comando /email da resposta
        const emailCommandRegex = /\/email\s+([^\s|]+)\s*\|\s*([^|]+)\s*\|\s*(.+)/;
        const match = answerText.match(emailCommandRegex);

        if (match) {
          const [, to, subject, body] = match;
          const draft = {
            to: to.trim(),
            subject: subject.trim(),
            body: body.trim()
          };

          console.log('📧 [ChatWindow] Draft extraído da resposta:', draft);

          if (onEmailDraftCreated) {
            onEmailDraftCreated(draft);
          }

          // Mostrar mensagem de sucesso bonita
          answerText = `✅ **Rascunho de email criado com sucesso!**\n\n📧 **Para:** ${draft.to}\n📋 **Assunto:** ${draft.subject}\n\n_O rascunho está disponível na caixa de email abaixo para você revisar e enviar._`;
        }
      }

      // Verificar se a resposta contém um rascunho de email (método antigo com hasDraft)
      if (data.hasDraft && data.draft && onEmailDraftCreated) {
        console.log('📧 [ChatWindow] Rascunho de email detectado via hasDraft');
        console.log('📧 [ChatWindow] Draft data:', data.draft);
        onEmailDraftCreated(data.draft);
      }

      const aiMessage = {
        id: Date.now() + 1,
        text: answerText,
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

  // Sempre que o projeto mudar, recarrega o histórico salvo daquela sessão
  useEffect(() => {
    if (typeof sessionStorage === 'undefined') {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    try {
      const saved = sessionStorage.getItem(storageKey);
      setMessages(saved ? JSON.parse(saved) : []);
    } catch (err) {
      console.warn('Não foi possível carregar mensagens salvas:', err);
      setMessages([]);
    }

    setIsLoading(false);
  }, [projectName, storageKey]);

  // Salva as mensagens atuais no sessionStorage para persistir enquanto a aba estiver aberta
  useEffect(() => {
    if (typeof sessionStorage === 'undefined') return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (err) {
      console.warn('Não foi possível salvar mensagens:', err);
    }
  }, [messages, storageKey]);

  return (
    <div className="chat-window-container">

      {messages.length === 0 ? (

        <div className="empty-chat-container">
          <h2
            className="empty-chat-title"
            onMouseMove={handleMouseMove}>{projectName ? `O que deseja saber de ${projectName}?` : "Por onde começamos?"}</h2>
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
            {isLoading && (
              <div>
                <span className={styles['dot-typing']}>
                  <span>.</span><span>.</span><span>.</span>
                </span>
              </div>
            )}

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