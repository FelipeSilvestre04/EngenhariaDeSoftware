import {StateGraph} from "@langchain/langgraph";
import {ChatGroq} from "@langchain/groq";
import {HumanMessage, SystemMessage} from "@langchain/core/messages";
import dotenv from "dotenv";

dotenv.config();


export const createModel = (model_name, temperature) => new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: model_name,
    temperature: temperature,
});

export async function consulta(sys_prompt, prompt, modelInstance){
    return await modelInstance.invoke([
        new SystemMessage(sys_prompt),
        new HumanMessage(prompt)
    ])
}

