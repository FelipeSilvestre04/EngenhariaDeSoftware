// client/src/features/EmailDraft/EmailDraftBox.jsx
import { useState, useEffect } from 'react';
import styles from './EmailDraftBox.module.css';

export function EmailDraftBox({ initialDraft, onDraftCleared }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [to, setTo] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    // Quando receber um rascunho da LLM, preencher e expandir
    useEffect(() => {
        if (initialDraft) {
            setTo(initialDraft.to || '');
            setSubject(initialDraft.subject || '');
            setBody(initialDraft.body || '');
            setIsExpanded(true); // Auto-expandir quando LLM criar rascunho
            setStatusMessage(''); // Limpar mensagens anteriores
        }
    }, [initialDraft]);

    const handleToggle = () => {
        setIsExpanded(!isExpanded);
    };

    const handleClear = () => {
        setTo('');
        setSubject('');
        setBody('');
        setStatusMessage('');
        if (onDraftCleared) {
            onDraftCleared();
        }
    };

    const handleSend = async () => {
        // Validação básica
        if (!to.trim()) {
            setStatusMessage('❌ Por favor, insira o destinatário');
            return;
        }
        if (!subject.trim()) {
            setStatusMessage('❌ Por favor, insira o assunto');
            return;
        }
        if (!body.trim()) {
            setStatusMessage('❌ Por favor, insira o conteúdo do email');
            return;
        }

        // Validação de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(to.trim())) {
            setStatusMessage('❌ Endereço de email inválido');
            return;
        }

        setIsSending(true);
        setStatusMessage('📤 Enviando...');

        try {
            const response = await fetch('/api/email/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: to.trim(),
                    subject: subject.trim(),
                    body: body.trim(),
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setStatusMessage('✅ Email enviado com sucesso!');
                // Limpar campos após 2 segundos
                setTimeout(() => {
                    handleClear();
                    setIsExpanded(false);
                }, 2000);
            } else {
                setStatusMessage(`❌ Erro: ${data.error || 'Falha ao enviar email'}`);
            }
        } catch (error) {
            console.error('Erro ao enviar email:', error);
            setStatusMessage('❌ Erro ao enviar email. Tente novamente.');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className={styles.emailDraftContainer}>
            <button
                className={styles.toggleButton}
                onClick={handleToggle}
                aria-label="Toggle email draft box"
            >
                <span className={styles.icon}>✉️</span>
                <span className={styles.label}>Rascunho de Email  </span>
                <span className={styles.arrow}>{isExpanded ? ' ▼' : ' ▲'}</span>
            </button>

            {isExpanded && (
                <div className={styles.emailForm}>
                    <button
                        className={styles.collapseButton}
                        onClick={handleToggle}
                        aria-label="Minimizar caixa de email"
                    >
                        ✕
                    </button>
                    <div className={styles.formGroup}>
                        <label htmlFor="email-to">Para:</label>
                        <input
                            id="email-to"
                            type="email"
                            placeholder="destinatario@exemplo.com"
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            disabled={isSending}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="email-subject">Assunto:</label>
                        <input
                            id="email-subject"
                            type="text"
                            placeholder="Assunto do email"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            disabled={isSending}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="email-body">Mensagem:</label>
                        <textarea
                            id="email-body"
                            placeholder="Escreva sua mensagem aqui..."
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            disabled={isSending}
                            rows={8}
                        />
                    </div>

                    {statusMessage && (
                        <div className={styles.statusMessage}>
                            {statusMessage}
                        </div>
                    )}

                    <div className={styles.buttonGroup}>
                        <button
                            className={styles.sendButton}
                            onClick={handleSend}
                            disabled={isSending}
                        >
                            {isSending ? 'Enviando...' : '📤 Enviar Email'}
                        </button>
                        <button
                            className={styles.clearButton}
                            onClick={handleClear}
                            disabled={isSending}
                        >
                            🗑️ Limpar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
