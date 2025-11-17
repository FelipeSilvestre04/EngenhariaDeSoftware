// src/index.js (VERSÃO CORRIGIDA PARA PRODUÇÃO/RENDER)
import { AppRouter } from './app.js';
import { config } from './shared/config/index.js';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Configurações de diretório para servir arquivos estáticos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLIENT_DIST_PATH = path.join(__dirname, '..', 'client', 'dist');


const app = express();
const appRouter = new AppRouter(config);

// Middlewares do Express para parsear JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// --- 1. Roteador da API (DEVE VIR PRIMEIRO) ---
// Verifica se é uma rota de API antes de tentar servir arquivos
app.use(async (req, res, next) => {
    //
    if (req.url.startsWith('/llm') || req.url.startsWith('/calendar') || req.url.startsWith('/auth') || req.url === '/health') {
        await appRouter.handle(req, res);
        return; // Importante: para a execução aqui se for API
    }
    // Se não for API, passa para o próximo middleware (o de arquivos estáticos)
    next();
});


// --- 2. Servir Arquivos Estáticos do React (DEVE VIR DEPOIS DA API) ---
// Serve os arquivos do 'npm run build' (ex: main.js, main.css)
app.use(express.static(CLIENT_DIST_PATH)); //


// --- 3. Fallback para Single Page Application (SPA) (DEVE VIR POR ÚLTIMO) ---
// Qualquer rota GET que não for API ou arquivo estático, serve o index.html
// CORRIGIDO: Trocamos '*' por '/*' que é uma sintaxe mais segura
app.get('/*', (req, res) => { //
    if (req.method === 'GET') {
        res.sendFile(path.join(CLIENT_DIST_PATH, 'index.html'));
    }
});


const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});