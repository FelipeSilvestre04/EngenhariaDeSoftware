import http from 'http';
import { createModel, consulta } from './llm/llm.js';
import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
    const llmModel = await createModel("openai/gpt-oss-120b", 0.2);
    const response = await consulta("Me responda apenas \"Sim\": ", "O Tasso é bom ou não é?", llmModel);
    
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`O Tasso é bom ou não é? ${response.content}`);
});

server.listen(PORT, () => {
  console.log(`Vamos ver se o tasso é bom mesmo!`);
});
