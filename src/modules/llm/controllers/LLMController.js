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
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (error) {
                    reject(new Error("Corpo da requisição inválido. Esperado um JSON."));
                }
            });
        });
    }

    async handleQuery(req, res) {
        try {
            const { prompt } = await this.getBody(req);
            
            const intentResult = await this.llmService.analyzeIntent(prompt);
            if (!intentResult.success) throw new Error(intentResult.error);

            let llmResponse;
            try {
                const jsonMatch = intentResult.content.match(/\{[\s\S]*\}/);
                
                if (!jsonMatch) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ answer: intentResult.content }));
                }

                llmResponse = JSON.parse(jsonMatch[0]);

            } catch (e) {
                console.error("Falha ao parsear JSON da IA. Resposta original:", intentResult.content);
                const fallbackAnswer = await this.llmService.generateNaturalResponse(prompt);
                const answer = (fallbackAnswer.success && fallbackAnswer.content) 
                               ? fallbackAnswer.content 
                               : "Desculpe, não consegui entender sua solicitação.";

                res.writeHead(200, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ answer: answer }));
            }

            if (llmResponse.action === 'CRIAR_EVENTO' && llmResponse.details) {
                if (!this.calendarService) {
                    throw new Error("O serviço de calendário não está disponível para criar o evento.");
                }
                
                const { summary, start_time, end_time } = llmResponse.details;

                console.log(`LOG: [LLMController] Intenção de criar evento recebida. Chamando calendarService.createEvent com:`, { summary, start_time, end_time });

                await this.calendarService.createEvent(summary, start_time, end_time);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ answer: `Ok, agendei: "${summary}"` }));

            } else { 
                if (!this.calendarService) {
                    throw new Error("O serviço de calendário não está disponível para responder a pergunta.");
                }

                const events = await this.calendarService.listEvents();
                const calendarContext = events.map(e => `- ${e.summary} (Início: ${new Date(e.start).toLocaleString()})`).join('\n');
                
                const finalPrompt = `
                    Contexto da Agenda do Usuário:
                    ${calendarContext || "A agenda do usuário está vazia."}
                    ---
                    Pergunta do usuário: "${prompt}"
                `;
                
                const answerResult = await this.llmService.generateNaturalResponse(finalPrompt);
                if (!answerResult.success) throw new Error(answerResult.error);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ answer: answerResult.content }));
            }

        } catch (error) {
            console.error("Erro detalhado no handleQuery:", error);
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({ error: `Desculpe, algo deu errado: ${error.message}` }));
        }
    }
}