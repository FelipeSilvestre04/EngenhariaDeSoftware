import express from 'express';
import { CalendarController } from "../controllers/CalendarController.js";

export class CalendarRoute {
    constructor (config){
        this.controller = new CalendarController(config);
        this.router = express.Router();
        this.setupRoutes();
    }

    setupRoutes() {
        // Rota padrão do calendário
        this.router.get('/', async (req, res) => {
            const userId = this.controller.getUserIdFromRequest(req);
            console.log(`🔍 CalendarRoute - UserId: ${userId}`);
            
            const isAuth = userId ? await this.controller.service.checkAuthentication(userId) : false;
            console.log(`🔐 CalendarRoute - isAuth: ${isAuth}`);
            
            if (!isAuth) {
                console.log(`❌ Não autenticado, redirecionando para /calendar/auth`);
                return res.redirect('/calendar/auth');
            }
            
            console.log(`✅ Autenticado! Mostrando menu`);
            res.json({ 
                status: 'authenticated',
                message: 'Calendar API ready',
                userId: userId,
                availableRoutes: [
                    'GET /calendar/events - Lista eventos',
                    'GET /calendar/check - Verifica status',
                    'GET /calendar/logout - Faz logout'
                ]
            });
        });

        this.router.get('/auth', (req, res) => this.controller.initiateAuth(req, res));
        this.router.get('/oauth2callback', (req, res) => this.controller.handleCallback(req, res));
        this.router.get('/events', (req, res) => this.controller.listEvents(req, res));
        this.router.get('/check', (req, res) => this.controller.checkStatus(req, res));
        this.router.get('/logout', (req, res) => this.controller.logout(req, res));
    }

    getRouter() {
        return this.router;
    }
}