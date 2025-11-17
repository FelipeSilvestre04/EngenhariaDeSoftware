// src/index.js (Versão para PRODUÇÃO / RENDER)
import { AppRouter } from './app.js';
import { config } from './shared/config/index.js';
import express from 'express'; 
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLIENT_DIST_PATH = path.join(__dirname, '..', 'client', 'dist');


const app = express();
const appRouter = new AppRouter(config);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// --- 1. Servir Arquivos Estáticos do React (A MÁGICA) ---
// !!! DEVE ESTAR DESCOMENTADO PARA PRODUÇÃO !!!
app.use(express.static(CLIENT_DIST_PATH));


// --- 2. Roteador da API ---
app.use(async (req, res, next) => {
    if (req.url.startsWith('/llm') || req.url.startsWith('/calendar') || req.url.startsWith('/auth') || req.url === '/health') {
        await appRouter.handle(req, res);
        return;
    }
    next();
});

// --- 3. Fallback para Single Page Application (SPA) ---
// !!! DEVE ESTAR DESCOMENTADO PARA PRODUÇÃO !!!
app.get('*', (req, res) => {
    if (req.method === 'GET') {
        res.sendFile(path.join(CLIENT_DIST_PATH, 'index.html'));
    }
});


const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});