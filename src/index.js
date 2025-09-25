import http from 'http';
import { createModel, consulta } from './llm/llm.js';
import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
  const llmModel = await createModel("openai/gpt-oss-120b", 0.4);
  const response = await consulta("Me responda sempre sim", "O Tasso é bom ou não é?", llmModel)
  console.log(response.content)
});

server.listen(PORT, () => {
  console.log(`Vamos ver se o tasso é bom mesmo!`);
});