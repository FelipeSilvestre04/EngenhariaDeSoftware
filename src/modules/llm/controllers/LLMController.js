// src/modules/llm/controllers/LLMController.js
import { LLMService } from "../services/LLMService.js";

export class LLMController{
    constructor(config, calendarService){
        this.llmService = new LLMService(config.llm.apiKey, calendarService);
        this.llmService.createModel(config.llm.defaultTemperature, config.llm.defaultModel);
    }

    async handleConsulta(req, res){
        try {
            console.log('🔵 [LLMController] Recebendo requisição...');
            
            // Usa dados do usuário autenticado pelo middleware
            const user = req.user || {};
            const userId = req.userId;
            
            // Pega o nome do usuário autenticado ou fallback para query param
            const url = new URL(req.url, `http://${req.headers.host}`);
            const name = user.name || url.searchParams.get('name') || 'usuário';
            const projectName = url.searchParams.get('project') || 'projeto';
            
            console.log(`👤 [LLMController] Usuário autenticado: ${name} (${userId})`);
            
            // O Express já parseou o body, então usamos req.body diretamente
            const prompt = req.body.prompt;
            console.log('📝 [LLMController] Prompt recebido:', prompt);
            
            if (!prompt) {
                throw new Error('Prompt não fornecido');
            }
            
            console.log('⏳ [LLMController] Processando com LLM...');
            const result = await this.llmService.checaAgenda(name, prompt, projectName);
            console.log('✅ [LLMController] Resposta do LLM:', result);

            // cria resposta http
            if (result.success) {
                console.log('📤 [LLMController] Enviando resposta de sucesso');
                res.writeHead(200, { 'Content-Type': 'application/json'});
                res.end(JSON.stringify({
                    question: `${prompt}`,
                    answer: result.content,
                    user: { name: name, userId: userId }
                }));
            } else {
                console.log('❌ [LLMController] Erro no processamento:', result.error);
                res.writeHead(500, { 'Content-Type': 'application/json'});
                res.end(JSON.stringify({error: result.error}));
            }

        } catch (error) {
            console.error("❌ [LLMController] Erro detalhado no handleQuery:", error);
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({ error: `Desculpe, algo deu errado: ${error.message}` }));
        }
    }

}