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
            const userId = this.controller.getUserIdFromRequest(req);
            console.log(`🔍 CalendarRoute - UserId: ${userId}`);
            
            const isAuth = userId ? await this.controller.service.checkAuthentication(userId) : false;
            console.log(`🔐 CalendarRoute - isAuth: ${isAuth}`);
            
            if (!isAuth) {
                console.log(`❌ Não autenticado, redirecionando para /calendar/auth`);
                res.writeHead(302, { Location: '/calendar/auth' });
                return res.end();
            }
            // Se autenticado, mostra informações do calendário
            console.log(`✅ Autenticado! Mostrando menu`);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ 
                status: 'authenticated',
                message: 'Calendar API ready',
                userId: userId,
                availableRoutes: [
                    'GET /calendar/events - Lista eventos',
                    'GET /calendar/check - Verifica status',
                    'GET /calendar/logout - Faz logout'
                ]
            }));
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
        res.end(JSON.stringify({ error: `Calendar route not found ${pathname}` }));
    }
}