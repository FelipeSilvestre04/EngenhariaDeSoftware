// src/modules/calendar/controllers/CalendarController.js
import { CalendarService } from "../services/CalendarService.js";

export class CalendarController {
    constructor(config){
        this.service = new CalendarService(config);
    }

    // Helper para extrair cookies
    parseCookies(cookieHeader) {
        if (!cookieHeader) return {};
        
        return cookieHeader.split(';').reduce((cookies, cookie) => {
            const [name, value] = cookie.trim().split('=');
            cookies[name] = value;
            return cookies;
        }, {});
    }

    // Helper para pegar userId da sessão
    getUserIdFromRequest(req) {
        const cookies = this.parseCookies(req.headers.cookie);
        
        // Agora pegamos o userId diretamente do cookie (não mais sessionId)
        const userId = cookies.userId;
        
        return userId || null;
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
            const userId = this.getUserIdFromRequest(req);

            if(!userId){
                res.writeHead(302, { Location: '/calendar/auth'});
                res.end();
                return;
            }

            // Verifica autenticação com o userId
            const isAuth = await this.service.checkAuthentication(userId);

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
            const userId = this.getUserIdFromRequest(req);
            const isAuth = userId ? await this.service.checkAuthentication(userId) : false;

            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({ authenticated: isAuth }));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json'});
            res.end(JSON.stringify({ error: error.message }));
        }
    }

    async logout(req, res) {
        try {
            await this.calendarService.logout();
            
            response.writeHead(200, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ 
                success: true,
                message: 'Logout realizado com sucesso' 
            }));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
    }
}