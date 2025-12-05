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

// CORS para desenvolvimento (permite frontend em porta diferente)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
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

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});