import { LLMController } from '../controllers/LLMController.js';

export class LLMRoutes {
    constructor(config, calendarService) {
        this.llmController = new LLMController(config, calendarService);
    }

    async handle(req, res) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const pathname = url.pathname;
        const method = req.method;

        if (pathname === '/llm/consulta' && method === 'POST'){
            return await this.llmController.handleConsulta(req, res);
        }
        
        res.writeHead(404, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({error: 'Route not found'}));
    }

}