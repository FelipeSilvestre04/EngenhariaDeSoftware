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

        if (tools && tools.length > 0){
            this.tools = tools;
        }

        this.agent = createReactAgent({
            llm: this.modelInstance,
            tools: this.tools,
            store: this.store,
        });

    }

    async queryWithTools(systemPrompt, userPrompt, userName, projectName, tools){
        
        const agent = createReactAgent({
            llm: this.modelInstance, 
            tools: tools,
            store: this.store,
        });

        if (!this.modelInstance) {
            throw new Error("Model not initialized. Call initialize() first.");
        }
        if (!this.tools || this.tools.length === 0) {
            throw new Error("No tools provided for LLMModel.");
        }

        if(!agent){
            throw new Error("No agent initialized.");
        }


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
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatGroq } from "@langchain/groq";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { db } from "../../../shared/database/index.js"; 
import { config } from "../../../shared/config/index.js";
import { InferenceClient } from "@huggingface/inference";

export class LLMModel {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.modelInstance = null;
        this.hfClient = new InferenceClient(config.llm.hfToken);
    }

    initialize(modelName, temperature, tools) {
        this.modelInstance = new ChatGroq({
            apiKey: this.apiKey,
            model: modelName,
            temperature: temperature
        });
        // Tools são passadas dinamicamente na query agora
    }

    // Gera o vetor para o banco de dados
    async generateEmbedding(text) {
        try {
            const output = await this.hfClient.featureExtraction({
                model: config.llm.modelHf,
                inputs: text,
            });
            const embedding = Array.isArray(output[0]) ? output[0] : output;
            // Formata array para string compatível com pgvector '[0.1, 0.2...]'
            return `[${embedding.join(',')}]`; 
        } catch (error) {
            console.error("Erro ao gerar embedding:", error);
            return null;
        }
    }

    // Salva mensagem no banco (Substitui store.put)
    async saveMessageToDB(userId, projectId, message, role) {
        if (!projectId) return; 

        try {
            // Adiciona prefixo para identificar quem falou no histórico
            const textToSave = `${role}: ${message}`;
            const vector = await this.generateEmbedding(textToSave);

            // Trigger do banco (Setup_BeforeInsertChat) calcula o Chat_ID automaticamente
            const query = `
                INSERT INTO chat (project_id, user_id, message, embedding)
                VALUES ($1, $2, $3, $4)
            `;
            await db.query(query, [projectId, userId, textToSave, vector]);
            // console.log(`💾 Mensagem salva no DB (Projeto: ${projectId})`);
        } catch (error) {
            console.error(`Erro ao salvar mensagem (${role}) no BD:`, error.message);
        }
    }

    // Busca contexto (Substitui store.search)
    async getContextFromDB(userId, projectId, queryVector) {
        if (!projectId || !queryVector) return "";

        try {
            // Busca as 3 mensagens mais similares
            const query = `
                SELECT message 
                FROM chat 
                WHERE project_id = $1 AND user_id = $2
                ORDER BY embedding <=> $3 ASC 
                LIMIT 3
            `;
            const result = await db.query(query, [projectId, userId, queryVector]);
            
            if (result.rows.length === 0) return "";

            let contextText = "CONTEXTO (Memórias anteriores do projeto):\n";
            result.rows.forEach(row => {
                contextText += `- ${row.message}\n`;
            });
            return contextText;

        } catch (error) {
            console.error("Erro ao buscar contexto no DB:", error);
            return "";
        }
    }

    async queryWithTools(systemPrompt, userPrompt, userName, projectName, tools, userId, projectId) {
        if (!this.modelInstance) {
            throw new Error("Model not initialized. Call initialize() first.");
        }

        // 1. Gera embedding da pergunta atual
        const vector = await this.generateEmbedding(userPrompt);

        // 2. Busca contexto no banco
        const dbContext = await this.getContextFromDB(userId, projectId, vector);

        // 3. Enriquece o prompt
        let finalUserPrompt = userPrompt;
        if (dbContext) {
            finalUserPrompt = `${dbContext}\n\nCom base nessas memórias e no pedido atual, responda:\n${userPrompt}`;
        }

        // 4. Salva a pergunta do usuário no Banco (Antes de processar)
        await this.saveMessageToDB(userId, projectId, userPrompt, "User");

        // 5. Cria agente e executa
        const agent = createReactAgent({
            llm: this.modelInstance,
            tools: tools || [],
        });

        const response = await agent.invoke({
            messages: [
                new SystemMessage(systemPrompt),
                new HumanMessage(finalUserPrompt)
            ]
        });

        const messages = response.messages;
        const lastMessage = messages[messages.length - 1];

        // 6. Salva a resposta da IA no Banco
        if (lastMessage && lastMessage.content) {
            await this.saveMessageToDB(userId, projectId, lastMessage.content, "AI");
        }

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
        };
    }
}