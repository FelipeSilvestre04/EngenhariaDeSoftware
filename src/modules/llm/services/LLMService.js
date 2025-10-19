// src/modules/llm/services/LLMService.js
import { LLMModel } from "../models/LLMModel.js";

export class LLMService {
    constructor(apiKey) {
        this.model = new LLMModel(apiKey);
    }

    createModel(temperature, modelName) {
        this.model.initialize(modelName, temperature);
    }

    async processConsulta(systemPrompt, userPrompt) {
        try {
            const response = await this.model.query(systemPrompt, userPrompt);
            let content = response.content;
            // Limpeza para remover tags de pensamento
            if (content.includes('</think>')) {
                content = content.split('</think>')[1].trim();
            }
            return { success: true, content: content };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // FERRAMENTA 1: Analisa a intenção e retorna JSON
    async analyzeIntent(userPrompt) {
        const currentDate = new Date().toISOString();
        const systemPrompt = `
            Sua tarefa é analisar o pedido do usuário e determinar a intenção.
            A data e hora atual é: ${currentDate}. Responda SEMPRE em formato JSON.
            Opções de intenção: 'CRIAR_EVENTO' ou 'RESPONDER_PERGUNTA'.
            Se a intenção for 'CRIAR_EVENTO', extraia "summary", "start_time" (ISO), e "end_time" (ISO).
            Se não houver end_time, assuma 1 hora após o início.
            Não inclua explicações ou tags <think> fora do objeto JSON.
        `;
        return await this.processConsulta(systemPrompt, userPrompt);
    }

    // FERRAMENTA 2: Gera uma resposta em português a partir de um contexto
    async generateNaturalResponse(contextualPrompt) {
        // A CORREÇÃO ESTÁ AQUI:
        const systemPrompt = `Você é um assistente pessoal prestativo e conciso. Responda à pergunta do usuário de forma direta, baseado apenas no contexto fornecido. Não use formatação Markdown, como asteriscos para negrito.`;
        return await this.processConsulta(systemPrompt, contextualPrompt);
    }
}