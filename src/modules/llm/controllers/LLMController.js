// src/modules/llm/controllers/LLMController.js
import { LLMService } from "../services/LLMService.js";

export class LLMController {
    constructor(config) {
        this.llmService = new LLMService(config.llm.apiKey);
        this.llmService.createModel(config.llm.defaultTemperature, config.llm.defaultModel);
        this.calendarService = null;
    }

    setCalendarService(service) {
        this.calendarService = service;
    }

    async getBody(req) {
        return new Promise(resolve => {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', () => resolve(JSON.parse(body)));
        });
    }

    async handleQuery(req, res) {
        try {
            const { prompt } = await this.getBody(req);
            
            // 1. O controlador pergunta à IA qual é o plano de ação (a intenção)
            const intentResult = await this.llmService.analyzeIntent(prompt);
            if (!intentResult.success) throw new Error(intentResult.error);

            // Tenta interpretar a resposta da IA, que deve ser um JSON
            let llmResponse;
            try {
                // Remove quaisquer caracteres estranhos antes de tentar parsear o JSON
                const cleanJsonString = intentResult.content.substring(intentResult.content.indexOf('{'));
                llmResponse = JSON.parse(cleanJsonString);
            } catch (e) {
                // Se a IA não responder com um JSON (ex: uma saudação simples),
                // apenas retorne a resposta dela diretamente.
                res.writeHead(200, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ answer: intentResult.content }));
            }

            // 2. O Maestro lê o plano e age corretamente
            if (llmResponse.action === 'CRIAR_EVENTO' && llmResponse.details) {
                const { summary, start_time, end_time } = llmResponse.details;

                // Executa a ação de verdade!
                await this.calendarService.createEvent(summary, start_time, end_time);
                
                // Envia uma confirmação real para o usuário
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ answer: `Ok, agendei: "${summary}"` }));

            } else { // Se a ação for RESPONDER_PERGUNTA ou qualquer outra coisa
                const events = await this.calendarService.listEvents();
                const calendarContext = events.map(e => `- ${e.summary} (Início: ${new Date(e.start).toLocaleString()})`).join('\n');
                
                const finalPrompt = `
                    Contexto da Agenda:
                    ${calendarContext || "A agenda está vazia."}
                    ---
                    Pergunta do usuário: "${prompt}"
                `;
                
                const answerResult = await this.llmService.generateNaturalResponse(finalPrompt);
                if (!answerResult.success) throw new Error(answerResult.error);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ answer: answerResult.content }));
            }

        } catch (error) {
            console.error("Erro no handleQuery:", error);
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({ error: `Desculpe, algo deu errado: ${error.message}` }));
        }
    }
}