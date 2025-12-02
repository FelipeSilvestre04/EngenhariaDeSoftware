import express from 'express';
import { LLMController } from '../controllers/LLMController.js';
import { createAuthMiddleware } from '../../../shared/middleware/authMiddleware.js';

export class LLMRoutes {
    constructor(config, calendarService) {
        this.llmController = new LLMController(config, calendarService);
        this.authMiddleware = createAuthMiddleware(config);
        this.router = express.Router();
        this.setupRoutes();
    }

    setupRoutes() {
        this.router.post('/consulta', 
            this.authMiddleware.authenticate(),
            this.authMiddleware.requireGoogleAuth(),
            (req, res) => this.llmController.handleConsulta(req, res)
        );
        
        this.router.post('/query', 
            this.authMiddleware.authenticate(),
            this.authMiddleware.requireGoogleAuth(),
            (req, res) => this.llmController.handleConsulta(req, res)
        );
    }

    getRouter() {
        return this.router;
    }
}