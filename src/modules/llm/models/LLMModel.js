/*import { BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatGroq } from "@langchain/groq";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { StateGraph, InMemoryStore } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { date } from "zod/v4";
import { config } from "../../../shared/config/index.js";
import { InferenceClient } from "@huggingface/inference";
// o modelo é a parte low level. ele vai ser executado para manipulação de dados e operações.



export class LLMModel {
    constructor(apiKey){
        this.apiKey = apiKey;
        this.modelInstance = null;
        this.agent = null;
        this.tools = null;
        this.store = new InMemoryStore();
        this.messageState = z.object({
            messages: z.array(z.any())
        });
        this.hfClient = new InferenceClient(config.llm.hfToken);
        this.embeddings = async (input) => {
            const res = await this.hfClient.featureExtraction({
                model: config.llm.modelHf,
                inputs: input
            });
            return Array.isArray(res[0]) ? res[0] : res;
        };
        
        const embeddingsObject = {
            embedQuery: this.embeddings,
            embedDocuments: async (documents) => {
                // Processar múltiplos documentos
                return await Promise.all(
                    documents.map(doc => this.embeddings(doc))
                );
            }
        };
        
        this.store = new InMemoryStore({
            index: {
                embeddings: embeddingsObject,
                dims: 384
            }
        });
    }

    initialize(modelName, temperature, tools){
        this.modelInstance = new ChatGroq({
            apiKey: this.apiKey,
            model: modelName,
            temperature: temperature
        });

        // Armazena tools se fornecidas
        if (tools && tools.length > 0){
            this.tools = tools;
        }
        
        // Agent é criado dinamicamente em queryWithTools() com as tools do usuário
    }

    async queryWithTools(systemPrompt, userPrompt, userName, projectName, tools){
        
        if (!this.modelInstance) {
            throw new Error("Model not initialized. Call initialize() first.");
        }
        if (!tools || tools.length === 0) {
            throw new Error("No tools provided for queryWithTools.");
        }

        const agent = createReactAgent({
            llm: this.modelInstance, 
            tools: tools,
            store: this.store,
        });


        // Use project-specific key path to simulate separate vector stores per project.
        // If projectName is not provided, fall back to the user's general memories.
        const keyPath = projectName ? ['memories', userName, projectName] : ['memories', userName];

        // fututamente salvar em um bd
        const related = await this.store.search(keyPath, {
            query: userPrompt,
            k: 3,
        });
        
        let contextText = '';
        for (const item of related){
            contextText += `Memory: ${item.value.text}\n`;
        }
        
        if (contextText.trim()) {
            userPrompt = `Here are some of your previous memories related to this project:\n${contextText}\nBased on these, respond to the following:\n${userPrompt}`;
        }
        const response = await agent.invoke({
            messages: [
                new SystemMessage(systemPrompt),
                new HumanMessage(userPrompt)
            ]
        });

        const messages = response.messages;
        const lastMessage = messages[messages.length - 1];

        const messageKey = Date.now().toString();
        await this.store.put(keyPath, messageKey, {
            text: lastMessage.content,
            metadata: {
                date: new Date(),
            }
        });

        const steps = messages
            .filter(msg => msg.tool_calls && msg.tool_calls.length > 0)
            .flatMap(msg => msg.tool_calls.map(toolCall => ({
                tool: toolCall.name,
                args: toolCall.args,
            })));
        
        return {
            content: lastMessage.content,
            steps: steps,
            totalToolCalls: steps.length
        }
    }

    async query(systemPrompt, userPrompt){
        return await this.modelInstance.invoke([
            new SystemMessage(systemPrompt),
            new HumanMessage(userPrompt)
        ]);
    }
}*/
import { BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatGroq } from "@langchain/groq";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { StateGraph, InMemoryStore } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { config } from "../../../shared/config/index.js";
import { InferenceClient } from "@huggingface/inference";

export class LLMModel {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.modelInstance = null;
        this.agent = null;
        this.tools = [];
        this.store = new InMemoryStore();
        this.messageState = z.object({
            messages: z.array(z.any())
        });

        // --- Mantendo a lógica original de memória (Sem Banco de Dados) ---
        this.hfClient = new InferenceClient(config.llm.hfToken);

        this.embeddings = async (input) => {
            try {
                const res = await this.hfClient.featureExtraction({
                    model: config.llm.modelHf,
                    inputs: input
                });
                return Array.isArray(res[0]) ? res[0] : res;
            } catch (e) {
                console.error("Erro ao gerar embedding:", e);
                return [];
            }
        };

        const embeddingsObject = {
            embedQuery: this.embeddings,
            embedDocuments: async (documents) => {
                return await Promise.all(
                    documents.map(doc => this.embeddings(doc))
                );
            }
        };

        this.store = new InMemoryStore({
            index: {
                embeddings: embeddingsObject,
                dims: 384
            }
        });
    }

    initialize(modelName, temperature, tools) {
        this.modelInstance = new ChatGroq({
            apiKey: this.apiKey,
            model: modelName,
            temperature: temperature
        });

        // CORREÇÃO: Não criamos o agente aqui porque as tools são dinâmicas (por usuário).
        // O agente será criado apenas na hora da consulta (queryWithTools).
        if (tools && tools.length > 0) {
            this.tools = tools;
        }
    }

    async queryWithTools(systemPrompt, userPrompt, userName, projectName, tools) {

        if (!this.modelInstance) {
            throw new Error("Model not initialized. Call initialize() first.");
        }

        // Cria o agente "on-the-fly" com as ferramentas deste usuário específico
        const agent = createReactAgent({
            llm: this.modelInstance,
            tools: tools || [], // Garante que não quebre se tools for null
            store: this.store,
        });

        if (!agent) {
            throw new Error("No agent initialized.");
        }

        // Lógica de Memória (RAG) usando InMemoryStore
        const keyPath = projectName ? ['memories', userName, projectName] : ['memories', userName];

        // Busca memórias relevantes
        const related = await this.store.search(keyPath, {
            query: userPrompt,
            k: 3,
        });

        let contextText = '';
        for (const item of related) {
            contextText += `Memory: ${item.value.text}\n`;
        }

        let finalPrompt = userPrompt;
        if (contextText.trim()) {
            finalPrompt = `Here are some of your previous memories related to this project:\n${contextText}\nBased on these, respond to the following:\n${userPrompt}`;
        }

        // Executa a IA
        const response = await agent.invoke({
            messages: [
                new SystemMessage(systemPrompt),
                new HumanMessage(finalPrompt)
            ]
        });

        const messages = response.messages;
        const lastMessage = messages[messages.length - 1];

        // Salva a nova memória
        const messageKey = Date.now().toString();
        await this.store.put(keyPath, messageKey, {
            text: lastMessage.content,
            metadata: {
                date: new Date(),
            }
        });

        // Processa os passos (tool calls) para o frontend
        const steps = messages
            .filter(msg => msg.tool_calls && msg.tool_calls.length > 0)
            .flatMap(msg => msg.tool_calls.map(toolCall => ({
                tool: toolCall.name,
                args: toolCall.args,
            })));

        return {
            content: lastMessage.content,
            steps: steps,
            totalToolCalls: steps.length
        }
    }

    async query(systemPrompt, userPrompt) {
        return await this.modelInstance.invoke([
            new SystemMessage(systemPrompt),
            new HumanMessage(userPrompt)
        ]);
    }
}