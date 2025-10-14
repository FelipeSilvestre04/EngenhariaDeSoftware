import { CalendarService } from "../services/CalendarService.js";

export class CalendarController {
    constructor(config){
        this.service = new CalendarService(config);
        this.service.initialize();
    }

    async initiateAuth(req, res){
        try{
            const authUrl = this.service.getAuthenticationUrl();

            res.writeHead(302, { Location: authUrl });
            res.end();
        } catch(error) {
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({
                error: "Erro ao iniciar autenticação",
                message: error.message
            }));
        }
    }

    async handleCallback(req, res){
        try {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const code = url.searchParams.get('code');
            const error = url.searchParams.get('error');

            if (error){
                res.writeHead(403, { 'Content-Type': 'text/html'});
                res.end('<h1>Acesso Negado!</h1><p>Você precisa permitir acesso ao Google Calendar!</p>');
                return;
            }

            const result = await this.service.handleOauthCallback(code);

            if (result.success){
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.end(`
                    <h1>✅ Autenticação realizada com sucesso!</h1>
                    <p>Você já pode acessar seus eventos.</p>
                    <a href="/calendar/events">Ver meus eventos</a>
                `);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end(`<h1>Erro na autenticação</h1><p>${error.message}</p>`);
        }
    }

    async listEvents(req, res){
        try{
            const isAuth = await this.service.checkAuthentication();

            if(!isAuth){
                res.writeHead(302, { Location: '/calendar/auth'});
                res.end();
                return;
            }

            const events = await this.service.listEvents();

            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({
                success: true,
                count: events.length,
                events: events
            }));
        } catch (error) {
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({
                error: 'Erro ao buscar eventos',
                message: error.message
            }))
        }
    }

    async checkStatus(req, res){
        try{
            const isAuth = this.service.checkAuthentication();

            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({
                authenticated: isAuth,
                message: isAuth ? 'Usuário autenticado' : 'Usuário não autenticado'
            }));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json'});
            res.end(JSON.stringify({ error: error.message }));
        }
    }

    async logout(request, response) {
        try {
            await this.calendarService.logout();
            
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ 
                success: true,
                message: 'Logout realizado com sucesso' 
            }));
        } catch (error) {
            response.writeHead(500, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: error.message }));
        }
    }
    
}