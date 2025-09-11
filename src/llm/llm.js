import {StateGraph} from "@langchain/langgraph";
import {ChatGroq} from "@langchain/groq";
import {HumanMessage} from "@langchain/core/messages";
import dotenv from "dotenv";

dotenv.config();

const model = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: "openai/gpt-oss-120b",
    temperature: 0.4
});

const response = await model.invoke([
    new HumanMessage("O que o Groq faz?")
]);

console.log(response.content);
