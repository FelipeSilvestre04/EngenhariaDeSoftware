import { AuthController } from './auth.controller.js';

export class AuthRoute {
    constructor() {
        this.controller = new AuthController();
    }
    
    async handle(req, res) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const pathname = url.pathname;
        const method = req.method;

        // Rota para verificar token
        if (pathname === '/auth/verify-token' && method === 'POST') {
            return await this.controller.verifyToken(req, res);
        }

        // Rota para gerar token
        if (pathname === '/auth/generate-token' && method === 'POST') {
            return await this.controller.generateToken(req, res);
        }

        // Rota para decodificar token
        if (pathname === '/auth/decode-token' && method === 'POST') {
            return await this.controller.decodeToken(req, res);
        }

        if (pathname === '/auth/refresh-token' && method === 'POST') {
            return await this.controller.refreshToken(req, res);
        }

        // Rota não encontrada
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Auth route not found' }));
    }
}