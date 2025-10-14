import { CalendarController } from "../controllers/CalendarController.js";

export class CalendarRoute {
    constructor (config){
        this.controller = new CalendarController(config);
    }

    async handle(req, res){
        const url = new URL(req.url, `http://${req.headers.host}`);
        const pathname = url.pathname;
        const method = req.method;

        // Rota padrão do calendário - redireciona para auth se não autenticado
        if (pathname === '/calendar' && method === 'GET') {
            const isAuth = await this.controller.service.checkAuthentication();
            if (!isAuth) {
                res.writeHead(302, { Location: '/calendar/auth' });
                return res.end();
            }
            res.writeHead(302, { Location: '/calendar/events' });
            return res.end();
        }

        if (pathname === '/calendar/auth' && method === 'GET') {
            return await this.controller.initiateAuth(req, res);
        }

        if (pathname === '/calendar/oauth2callback' && method === 'GET'){
            return await this.controller.handleCallback(req, res);
        }

        if (pathname === '/calendar/events' && method === 'GET') {
            return await this.controller.listEvents(req, res);
        }

        if (pathname === '/calendar/check' && method === 'GET') {
            return await this.controller.checkStatus(req, res);
        }

        if (pathname === '/calendar/logout' && method === 'GET') {
            return await this.controller.logout(req, res)
        }

        // Rota não encontrada
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Calendar route not found' }));
    }
}