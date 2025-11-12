// src/shared/middleware/cors.js
import Env from '../utils/env.js';

export class CorsMiddleware {
    constructor() {
        const env = new Env();
        this.allowedOrigins = [
            env.getEnvVar('FRONTEND_URL', 'http://localhost:5173'),
            'http://localhost:5173',
            'http://localhost:3000'
        ].filter(Boolean);
    }

    handle(req, res) {
        const origin = req.headers.origin;
        
        // Se a origem está na lista de permitidas, adiciona os headers CORS
        if (this.allowedOrigins.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
        } else if (process.env.NODE_ENV !== 'production') {
            // Em desenvolvimento, permite qualquer origem
            res.setHeader('Access-Control-Allow-Origin', origin || '*');
        }
        
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        
        // Handle preflight request
        if (req.method === 'OPTIONS') {
            res.writeHead(204);
            res.end();
            return true; // Indica que a requisição foi tratada
        }
        
        return false; // Continua o processamento normal
    }
}
