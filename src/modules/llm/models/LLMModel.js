import { BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
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
        this.hfClient = new InferenceClient({
            apiKey: config.llm.hfToken
        });
        this.embeddings =async (input) => {
            const res = await this.hfClient.featureExtraction({
                model: config.llm.modelHf,
                inputs: input
            });
            return Array.isArray(res[0]) ? res[0] : res;
        };
        this.store = new InMemoryStore({
            index: {
                embeddings: this.embeddings,
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

    async queryWithTools(systemPrompt, userPrompt, userName, projectName){
        if (!this.modelInstance) {
            throw new Error("Model not initialized. Call initialize() first.");
        }
        if (!this.tools || this.tools.length === 0) {
            throw new Error("No tools provided for LLMModel.");
        }

        if(!this.agent){
            throw new Error("No agent initialized.");
        }


        // futuramente salvar em um bd
        const related = this.store.search(['memories', userName], {
            query: userPrompt,
            k: 3,
        });
        
        let contextText = '';
        for await (const item of related){
            contextText += `Memory: ${item.pageContent}\n`;
        }
        
        userPrompt = `Here are some of your previous memories:\n${contextText}\nBased on these, respond to the following:\n${userPrompt}`;
        const response = await this.agent.invoke({
            messages: [
                new SystemMessage(systemPrompt),
                new HumanMessage(userPrompt)
            ]
        });

        const messages = response.messages;
        const lastMessage = messages[messages.length - 1];

        await this.store.put(['memories', userName], projectName, {
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
}
