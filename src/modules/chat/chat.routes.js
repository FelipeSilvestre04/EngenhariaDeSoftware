import express from 'express';
import { ChatController } from './chat.controller.js';
import { createAuthMiddleware } from '../../shared/middleware/authMiddleware.js';

export class ChatRoutes {
    constructor(config) {
        this.router = express.Router();
        this.controller = new ChatController();
        this.auth = createAuthMiddleware(config);
        this.setupRoutes();
    }

    setupRoutes() {
        // Rota protegida para buscar histórico
        // Ex: GET /api/chat/history?projectId=1 (Projeto)
        // Ex: GET /api/chat/history (Geral)
        this.router.get('/history', 
            this.auth.authenticate(), 
            (req, res) => this.controller.getHistory(req, res)
        );
    }

    getRouter() { return this.router; }
}