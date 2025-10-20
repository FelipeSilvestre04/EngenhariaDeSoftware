import { LLM } from '@langchain/core/language_models/llms'
import {LLMController} from '../controllers/LLMController.js'

// aqui ele mapeia o metodo enviado na req http pro metodo certo no controller.
// é a porta de entrada pro modulo.
// identifica por exemplo se o metodo é GET e se requisita o resultado de uma consulta

export class LLMRoutes {
    constructor(config, calendarService) {
        this.llmController = new LLMController(config, calendarService);
    }

    async handle(req, res){
        // descubro o caminho e o metodo
        const url = new URL(req.url, `http://${req.headers.host}`);
        const pathname = url.pathname;
        const method = req.method;

        if (pathname === '/llm/consulta' && method === 'POST'){
            return await this.llmController.handleConsulta(req, res);
        }
        //if (pathname === 'llm/query' && method === 'POST'){ return await this.llmController.handleQuery(req, res); }
        
        res.writeHead(404, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({error: 'Route not found'}));
    }

}