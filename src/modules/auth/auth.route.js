import express from 'express';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

export class AuthRoute {
    constructor(config) {
        this.authService = new AuthService(undefined, config);
        this.controller = new AuthController(this.authService);
        this.router = express.Router();
        this.setupRoutes();
    }
    
    setupRoutes() {
        this.router.get('/login', async (req, res) => {
            await this.controller.initiateAuth(req, res);
        });

        this.router.get('/callback', async (req, res) => {
            await this.controller.handleCallback(req, res);
        });

        this.router.post('/verify-token', async (req, res) => {
            await this.controller.verifyToken(req, res);
        });

        this.router.post('/decode-token', async (req, res) => {
            await this.controller.decodeToken(req, res);
        });

        this.router.post('/refresh-token', async (req, res) => {
            await this.controller.refreshToken(req, res);
        });

        this.router.post('/logout', async (req, res) => {
            await this.controller.logout(req, res);
        });

        this.router.all('*', (req, res) => {
            res.status(404).json({ error: 'Auth route not found' });
        });
    }

    getRouter() {
        return this.router;
    }
}