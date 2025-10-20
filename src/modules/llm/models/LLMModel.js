import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatGroq } from "@langchain/groq";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

// o modelo é a parte low level. ele vai ser executado para manipulação de dados e operações.

export class LLMModel {
    constructor(apiKey){
        this.apiKey = apiKey;
        this.modelInstance = null;
        this.agent = null;
        this.tools = null
    }

    initialize(modelName, temperature, tools){
        this.modelInstance = new ChatGroq({
            apiKey: this.apiKey,
            model: modelName,
            temperature: temperature
        });

        this.tools = tools;

        this.agent = createReactAgent({
            llm: this.modelInstance,
            tools: this.tools
        });
    }

    async queryWithTools(systemPrompt, userPrompt){
        if (!this.modelInstance) {
            throw new Error("Model not initialized. Call initialize() first.");
        }

        if (!this.tools || this.tools.length === 0) {
            throw new Error("No tools provided for LLLModel.");
        }

        if(!this.agent){
            throw new Error("No agent initialized.");
        }

        const response = await this.agent.invoke({
            messages: [
                new SystemMessage(systemPrompt),
                new HumanMessage(userPrompt)
            ]
        });
        

        const messages = response.messages;
        const lastMessage = messages[messages.length - 1];

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
