// src/index.js

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
// Importa as "ferramentas" que preparamos no llm.js
import { createModel, consulta } from './llm/llm.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middlewares (Ajudantes) ---
// O cors() permite que nosso frontend (ex: localhost:5173) converse com nosso backend (localhost:3000)
app.use(cors());
// O express.json() ensina nosso servidor a entender os "pacotes" de dados (JSON) que o frontend vai enviar
app.use(express.json());

// --- Nosso "Balcão de Atendimento" (API) ---
app.post('/api/chat', async (req, res) => {
  try {
    // 1. Pega a mensagem do usuário que veio no "pacote"
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Mensagem não pode ser vazia.' });
    }

    // 2. Prepara e usa nosso "Especialista em IA"
    const llmModel = createModel("llama3-8b-8192", 0.2); // Usando um modelo rápido
    const response = await consulta("Você é um assistente prestativo.", message, llmModel);

    // 3. Devolve a resposta da IA para o frontend
    res.json({ reply: response.content });

  } catch (error) {
    console.error("Erro no endpoint do chat:", error);
    res.status(500).json({ error: 'Ocorreu um erro ao processar sua mensagem.' });
  }
});

// --- Servindo o Frontend (Entregando o "Cardápio") ---
// Essas linhas ajudam a encontrar a pasta do nosso frontend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Avisa ao Express para usar os arquivos da pasta 'client/dist' como arquivos estáticos (CSS, JS, imagens)
app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));

// Rota "Coringa": Se a requisição não for para a API, mande o arquivo principal do React
// Rota "Coringa": Se a requisição não for para a API, mande o arquivo principal do React
app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
});


// --- Liga o Servidor ---
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}!`);
});