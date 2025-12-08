import { ChatService } from './chat.service.js';

export class ChatController {
    constructor() {
        this.chatService = new ChatService();
    }

    async getHistory(req, res) {
        try {
            const userId = req.userId;
            // Se vier ?projectId=123 usa ele, se não vier (undefined) o service busca o Fantasma
            const projectId = req.query.projectId ? parseInt(req.query.projectId) : null;

            const messages = await this.chatService.getHistory(userId, projectId);
            
            res.status(200).json(messages);
        } catch (error) {
            console.error("Erro ao buscar histórico:", error);
            res.status(500).json({ error: error.message });
        }
    }
}