import express from 'express';
import { CalendarController } from "../controllers/CalendarController.js";
import { createAuthMiddleware } from "../../../shared/middleware/authMiddleware.js";

export class CalendarRoute {
    constructor (config){
        this.controller = new CalendarController(config);
        this.authMiddleware = createAuthMiddleware(config);
        this.router = express.Router();
        this.setupRoutes();
    }

    setupRoutes() {
        // Rotas públicas (não requerem autenticação JWT)
        this.router.get('/auth', (req, res) => this.controller.initiateAuth(req, res));
        this.router.get('/oauth2callback', (req, res) => this.controller.handleCallback(req, res));
        this.router.get('/check', (req, res) => this.controller.checkStatus(req, res));

        // Rota padrão do calendário (requer autenticação)
        this.router.get('/', 
            this.authMiddleware.authenticate(),
            this.authMiddleware.requireGoogleAuth(),
            async (req, res) => {
                const userId = req.userId || this.controller.getUserIdFromRequest(req);
                console.log(`🔍 CalendarRoute - UserId: ${userId}`);
                
                console.log(`✅ Autenticado! Mostrando menu`);
                res.json({ 
                    status: 'authenticated',
                    message: 'Calendar API ready',
                    userId: userId,
                    user: req.user,
                    availableRoutes: [
                        'GET /calendar/events - Lista eventos',
                        'GET /calendar/check - Verifica status',
                        'GET /calendar/logout - Faz logout'
                    ]
                });
            }
        );

        // Rotas protegidas (requerem autenticação JWT + Google Auth)
        this.router.get('/events', 
            this.authMiddleware.authenticate(),
            this.authMiddleware.requireGoogleAuth(),
            (req, res) => this.controller.listEvents(req, res)
        );
        
        this.router.get('/logout', 
            this.authMiddleware.authenticate(),
            (req, res) => this.controller.logout(req, res)
        );
    }

    getRouter() {
        return this.router;
    }
}