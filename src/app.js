import { LLMRoutes } from "./modules/llm/index.js";

export class AppRouter {
    constructor(config){
        this.config = config;
        this.modules = this.initializeModules();
    }

    initializeModules(){
        return {
            llm: new LLMRoutes(this.config),
        };
    }

    async handle(req, res){
        const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;

        // Rota de health check
        if (pathname === '/' || pathname === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ 
                status: 'ok', 
                message: 'Server is running',
                timestamp: new Date().toISOString()
            }));
        }

        if (pathname.startsWith('/llm')) {
            return await this.modules.llm.handle(req, res);
        }

        // Rota padrão para requisições não encontradas
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Route not found' }));
    }
}