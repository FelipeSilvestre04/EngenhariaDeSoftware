import express from 'express';
import { LLMController } from '../controllers/LLMController.js';

export class LLMRoutes {
    constructor(config, calendarService) {
        this.llmController = new LLMController(config, calendarService);
        this.router = express.Router();
        this.setupRoutes();
    }

    setupRoutes() {
        // Aceita tanto /consulta quanto /query
        this.router.post('/consulta', (req, res) => this.llmController.handleConsulta(req, res));
        this.router.post('/query', (req, res) => this.llmController.handleConsulta(req, res));
    }

    getRouter() {
        return this.router;
    }
}