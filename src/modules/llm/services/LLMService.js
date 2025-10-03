import {LLMModel} from "../models/LLMModel.js"

// o serviço é o que vai ser usado pelo controller. ele executará o modelo 
// e irá usá-lo para entregar um serviço específico.

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
    async checaAgenda(name){
        const systemPrompt = "Faça a consulta na agenda do usuário e diga se está vazia, com tarefas ou lotada. Invente dados."
        const userPrompt = `Como está a agenda do ${name}?`
        return await this.processConsulta(systemPrompt, userPrompt);
    }

}