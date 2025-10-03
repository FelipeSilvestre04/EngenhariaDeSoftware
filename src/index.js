import { AppRouter } from './app.js';
import { config } from './shared/config/index.js';
import http from 'http';

const appRouter = new AppRouter(config);

const server = http.createServer((req, res) => {
    appRouter.handle(req, res);
});