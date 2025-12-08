// src/index.js
import { AppRouter } from './app.js';
import { config } from './shared/config/index.js';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';

// Configurações de diretório para servir arquivos estáticos
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLIENT_DIST_PATH = path.join(__dirname, '..', 'client', 'dist');

const app = express();
const appRouter = new AppRouter(config);

// Middlewares do Express para parsear JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS para desenvolvimento e produção
app.use((req, res, next) => {
    const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:3000',
        process.env.CLIENT_URL
    ].filter(Boolean);

    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    } else if (!origin) {
        // Permite requisições sem origin (ex: mesmo domínio, curl, postman)
        // Não define header ou define como * se necessário, mas para same-origin não precisa
    }

    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');

    // Responde OPTIONS request (preflight)
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }

    next();
});

// --- 1. Configurar rotas da API (DEVE VIR PRIMEIRO) ---
appRouter.setupRoutes(app);

// --- 2. Servir Arquivos Estáticos do React (DEVE VIR DEPOIS DA API) ---
app.use(express.static(CLIENT_DIST_PATH));

// --- 3. Fallback para Single Page Application (SPA) (DEVE VIR POR ÚLTIMO) ---
app.use((req, res) => {
    res.sendFile(path.join(CLIENT_DIST_PATH, 'index.html'));
});

// Prioriza BACKEND_PORT (uso interno com Nginx) sobre PORT (uso externo do Render)
const PORT = process.env.BACKEND_PORT || process.env.PORT || 10000;

app.listen(PORT, () => {
    console.log(`=================================`);
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📂 Node Env: ${process.env.NODE_ENV}`);
    console.log(`🔌 Database URL exists: ${!!process.env.DATABASE_URL}`);
    console.log(`=================================`);
});