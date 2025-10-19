import { LLMController } from '../controllers/LLMController.js';

export class LLMRoutes {
    constructor(config) {
        this.llmController = new LLMController(config);
    }

    async handle(req, res) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const pathname = url.pathname;
        const method = req.method;

        if (pathname === '/llm/query' && method === 'POST') {
            return await this.llmController.handleQuery(req, res);
        }
        
        res.writeHead(404, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({error: 'Route not found'}));
    }
}