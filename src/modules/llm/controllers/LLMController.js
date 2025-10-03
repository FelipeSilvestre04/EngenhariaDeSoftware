import {LLMService} from "../services/LLMService.js"
// o controller recebe a requisição HTTP e trata ela executando o serviço e entregando
// a resposta que vem desse serviço.
// importante saber: protocolo HTTP

export class LLMController{
    constructor(config){
        this.llmService = new LLMService(config.llm.apiKey);
        this.llmService.createModel(config.llm.defaultTemperature, config.llm.defaultModel);
    }

    async handleConsulta(req, res){
        try {
            // aqui é uma extração de dados qualquer da requisição. nesse caso 
            // pegando o nome do cara q fez a request.
            const url = new URL(req.url, `http://${req.headers.host}`);
            const name = url.searchParams.get('name') || 'Tasso';

            const result = await this.llmService.checaAgenda(name);

            // cria resposta http
            if (result.success) {
                res.writeHead(200, { 'Content-Type': 'application/json'});
                res.end(JSON.stringify({
                    question: `Como está a agenda do ${name}`,
                    answer: result.content
                }));
            } else {
                res.writeHead(500, { 'Content-Type': 'application/json'});
                res.end(JSON.stringify({error: result.error}));
            }

        } catch (error) {
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({error: error.message}))
        }

    }
}