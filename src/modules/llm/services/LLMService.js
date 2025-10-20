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
            if (content.includes('</think>')) {
                content = content.split('</think>')[1].trim();
            }
            return { success: true, content: content };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async analyzeIntent(userPrompt) {
        const currentDate = new Date().toISOString();
        const currentYear = new Date().getFullYear();

        // PROMPT FINAL COM AJUSTE DE FUSO HORÁRIO
        const systemPrompt = `
            Você é um especialista em analisar texto para extrair intenções e dados estruturados.
            A data de hoje é \${currentDate}. O ano atual é \${currentYear}.
            O fuso horário do usuário é 'America/Sao_Paulo' (UTC-3).

            Responda SEMPRE e APENAS com um objeto JSON válido. Não adicione nenhum texto ou explicação fora do JSON.

            As intenções possíveis são: 'CRIAR_EVENTO' ou 'RESPONDER_PERGUNTA'.

            1.  Se a intenção for 'CRIAR_EVENTO':
                - Extraia 'summary' (título do evento).
                - **IMPORTANTE**: Interprete os horários fornecidos pelo usuário como se estivessem no fuso 'America/Sao_Paulo'. Converta esses horários para o formato ISO 8601 em UTC (com 'Z' no final) para a resposta JSON.
                - Se o ano for omitido, use o ano atual (\${currentYear}). Se a data resultante já passou, use o próximo ano.
                - Se a hora de término for omitida, adicione 1 hora à hora de início.

            2.  Se for uma pergunta geral, use a intenção 'RESPONDER_PERGUNTA'.

            Exemplos de como você deve responder:
            - Usuário: "adicione dia 24/10 aniversário do gui, das 12h ate 19h" -> {"action":"CRIAR_EVENTO","details":{"summary":"Aniversário do Gui","start_time":"\${currentYear}-10-24T15:00:00.000Z","end_time":"\${currentYear}-10-24T22:00:00.000Z"}}
            - Usuário: "Reunião de equipe amanhã às 9h" -> {"action":"CRIAR_EVENTO","details":{"summary":"Reunião de equipe","start_time":"[data de amanhã]T12:00:00.000Z","end_time":"[data de amanhã]T13:00:00.000Z"}}
            - Usuário: "tem algo na agenda hoje?" -> {"action":"RESPONDER_PERGUNTA"}
        `;
        
        return await this.processConsulta(systemPrompt, userPrompt);
    }

    async generateNaturalResponse(contextualPrompt) {
        const systemPrompt = `Você é um assistente pessoal prestativo e conciso. Responda à pergunta do usuário de forma direta, baseado apenas no contexto fornecido. Não use formatação Markdown.`;
        return await this.processConsulta(systemPrompt, contextualPrompt);
    }
}