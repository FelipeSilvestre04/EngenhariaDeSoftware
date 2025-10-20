// src/modules/calendar/controllers/CalendarController.js
import { CalendarService } from "../services/CalendarService.js";

export class CalendarController {
    constructor(config){
        this.service = new CalendarService(config);
        // A inicialização foi removida daqui para evitar problemas de concorrência.
        // O próprio serviço agora garante que está inicializado antes de cada ação.
    }

    async initiateAuth(req, res){
        try{
            const authUrl = this.service.getAuthenticationUrl();
            res.writeHead(302, { Location: authUrl });
            res.end();
        } catch(error) {
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({ error: "Erro ao iniciar autenticação", message: error.message }));
        }
    }

    async handleCallback(req, res){
        try {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const code = url.searchParams.get('code');
            if (!code) throw new Error("Código de autorização não encontrado.");

            await this.service.handleOauthCallback(code);

            // Redireciona de volta para a aplicação React após a autenticação
            res.writeHead(302, { Location: 'http://localhost:5173' }); 
            res.end();
            
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end(`<h1>Erro na autenticação</h1><p>${error.message}</p>`);
        }
    }

    async listEvents(req, res){
        try{
            const isAuth = await this.service.checkAuthentication();

            if(!isAuth){
                res.writeHead(401, {'Content-Type': 'application/json'});
                return res.end(JSON.stringify({ success: false, error: 'Usuário não autenticado' }));
            }

            const events = await this.service.listEvents();

            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({ success: true, count: events.length, events: events }));
        } catch (error) {
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({ error: 'Erro ao buscar eventos', message: error.message }));
        }
    }

    async checkStatus(req, res){
        try{
            const isAuth = await this.service.checkAuthentication();

            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({ authenticated: isAuth }));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json'});
            res.end(JSON.stringify({ error: error.message }));
        }
    }

    async logout(req, res) {
        try {
            await this.service.logout();
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Logout realizado com sucesso' }));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
    }
}