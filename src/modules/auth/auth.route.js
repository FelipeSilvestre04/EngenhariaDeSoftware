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
            console.log("⭐ ROTA /auth/login FOI CHAMADA");
            await this.controller.initiateAuth(req, res);
        });

        this.router.get('/callback', async (req, res) => {
            console.log("\n\n⭐⭐⭐ ROTA /auth/callback FOI CHAMADA ⭐⭐⭐\n");
            console.log("URL completa:", req.url);
            console.log("Query params:", req.query);
            await this.controller.handleCallback(req, res);
        });

        // Verifica se o usuário está autenticado baseado nos cookies (accessToken)
        this.router.get('/check', async (req, res) => {
            try {
                const result = await this.controller.verifyTokenRequest(req, res);
                if (result && result.authenticated) {
                    return res.status(200).json({ authenticated: true, decoded: result.decoded || null });
                } else {
                    return res.status(200).json({ authenticated: false, error: result && result.error ? result.error : 'Not authenticated' });
                }
            } catch (error) {
                return res.status(500).json({ error: 'Erro ao verificar autenticação', message: error.message });
            }
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
            console.log("❌ Rota auth não encontrada:", req.path);
            res.status(404).json({ error: 'Auth route not found' });
        });
    }

    getRouter() {
        return this.router;
    }
}