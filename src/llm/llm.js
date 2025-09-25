// src/llm/llm.js

import { ChatGroq } from "@langchain/groq";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import dotenv from "dotenv";

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

// Exporta a função para criar o modelo da IA
export const createModel = (model_name, temperature) => new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: model_name,
    temperature: temperature,
});

// Exporta a função que faz a consulta
export async function consulta(sys_prompt, prompt, modelInstance) {
    // Invoca o modelo com a mensagem do sistema e a do usuário
    return await modelInstance.invoke([
        new SystemMessage(sys_prompt),
        new HumanMessage(prompt)
    ]);
}