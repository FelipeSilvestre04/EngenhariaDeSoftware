import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatGroq } from "@langchain/groq";

// o modelo é a parte low level. ele vai ser executado para manipulação de dados e operações.

export class LLMModel {
    constructor(apiKey){
        this.apiKey = apiKey;
        this.modelInstance = null;
    }

    initialize(modelNmae, temperature){
        this.modelInstance = new ChatGroq({
            apiKey: this.apiKey,
            model: modelNmae,
            temperature: temperature
        });
    }

    async query(systemPrompt, userPrompt){
        return await this.modelInstance.invoke([
            new SystemMessage(systemPrompt),
            new HumanMessage(userPrompt)
        ]);
    }
}
