import { AppRouter } from './app.js';
import { config } from './shared/config/index.js';
import http from 'http';
import Env from './shared/utils/env.js';

const env = new Env();
const appRouter = new AppRouter(config);

const server = http.createServer((req, res) => {
    appRouter.handle(req, res);
});

const PORT = env.getEnvVar('PORT', 10000);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});