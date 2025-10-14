import crypto from 'crypto';

export class SessionManager {
    constructor() {
        // Em produção, use Redis ou banco de dados
        this.sessions = new Map();
    }

    createSession(userId) {
        const sessionId = crypto.randomUUID();
        this.sessions.set(sessionId, {
            userId,
            createdAt: Date.now()
        });
        console.log(`✅ Sessão criada: ${sessionId} para usuário: ${userId}`);
        return sessionId;
    }

    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }

    deleteSession(sessionId) {
        const deleted = this.sessions.delete(sessionId);
        if (deleted) {
            console.log(`✅ Sessão removida: ${sessionId}`);
        }
        return deleted;
    }

    // Limpa sessões antigas (mais de 7 dias)
    cleanOldSessions() {
        const now = Date.now();
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        
        for (const [sessionId, session] of this.sessions.entries()) {
            if (now - session.createdAt > sevenDays) {
                this.deleteSession(sessionId);
            }
        }
    }
}
