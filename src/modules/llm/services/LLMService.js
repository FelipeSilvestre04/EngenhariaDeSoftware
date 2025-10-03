import {LLMModel} from "../models/LLMModel.js"

export class LLMService{
    constructor(apiKey){
        this.model = new LLMModel(apiKey);
    }

    createModel(temperature, modelName){
        this.model.initialize(modelName, temperature);
    }

    async processConsulta(systemPrompt, userPrompt){
        try {
            const response = await this.model.query(systemPrompt, userPrompt);
            
            return {
                success: true,
                content: response.content,
                metaData: {
                    timeStamp: new Date().toISOString()
                }
            };
        } catch (error){
            return {
                success: false,
                error: error.message
            }
        }
    }

    // aqui implementar os serviços que vao utilizar processConsulta.
}