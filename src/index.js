// src/index.js (Versão Final com Express)
import { AppRouter } from './app.js';
import { config } from './shared/config/index.js';
import express from 'express'; // Novo: Usamos Express
import path from 'path';
import { fileURLToPath } from 'url';

// Configurações de diretório para servir arquivos estáticos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// O Dockerfile coloca os arquivos de build do React em 'client/dist'
const CLIENT_DIST_PATH = path.join(__dirname, '..', 'client', 'dist');


const app = express();
const appRouter = new AppRouter(config);

// Middlewares do Express para parsear JSON (necessário para o chat da LLM)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// --- 1. Servir Arquivos Estáticos do React (A MÁGICA) ---
// Qualquer requisição que não for de API será tratada como um arquivo (HTML, JS, CSS)
app.use(express.static(CLIENT_DIST_PATH));


// --- 2. Roteador da API ---
app.use(async (req, res, next) => {
    // Chamamos o AppRouter (lógica antiga) APENAS para as rotas da API
    if (req.url.startsWith('/llm') || req.url.startsWith('/calendar') || req.url.startsWith('/auth') || req.url === '/health') {
        await appRouter.handle(req, res);
        return;
    }
    // Se não for API, passa para o próximo middleware (o Fallback)
    next();
});

// --- 3. Fallback para Single Page Application (SPA) ---
// Qualquer rota GET que não for API (ex: /app/projetos)
// deve servir o index.html para o React Router (frontend) assumir.
app.get('*', (req, res) => {
    if (req.method === 'GET') {
        res.sendFile(path.join(CLIENT_DIST_PATH, 'index.html'));
    }
});


const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});