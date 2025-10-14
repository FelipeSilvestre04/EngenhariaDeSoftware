import { CalendarService } from "../services/CalendarService.js";
import { SessionManager } from "../utils/SessionManager.js";

export class CalendarController {
    constructor(config){
        this.service = new CalendarService(config);
        this.sessionManager = new SessionManager();
        this.service.initialize();
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
        const sessionId = cookies.sessionId;
        
        if (!sessionId) return null;
        
        const session = this.sessionManager.getSession(sessionId);
        return session?.userId || null;
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
                // Cria sessão com o userId (email)
                const sessionId = this.sessionManager.createSession(result.userId);
                
                // Define cookie com sessionId
                res.writeHead(200, {
                    'Content-Type': 'text/html',
                    'Set-Cookie': `sessionId=${sessionId}; HttpOnly; Path=/; Max-Age=604800` // 7 dias
                });
                res.end(`
                    <h1>✅ Autenticação realizada com sucesso!</h1>
                    <p>Bem-vindo, ${result.userId}!</p>
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
            // Pega userId da sessão
            const userId = this.getUserIdFromRequest(req);
            
            if (!userId) {
                res.writeHead(302, { Location: '/calendar/auth'});
                res.end();
                return;
            }

            // Verifica autenticação com o userId
            const isAuth = await this.service.checkAuthentication(userId);

            if(!isAuth){
                res.writeHead(302, { Location: '/calendar/auth'});
                res.end();
                return;
            }

            const events = await this.service.listEvents();

            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({
                success: true,
                userId: userId,
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
            const userId = this.getUserIdFromRequest(req);
            const isAuth = userId ? await this.service.checkAuthentication(userId) : false;

            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({
                authenticated: isAuth,
                userId: userId,
                message: isAuth ? 'Usuário autenticado' : 'Usuário não autenticado'
            }));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json'});
            res.end(JSON.stringify({ error: error.message }));
        }
    }

    async logout(request, response) {
        try {
            const userId = this.getUserIdFromRequest(request);
            const cookies = this.parseCookies(request.headers.cookie);
            const sessionId = cookies.sessionId;
            
            // Remove tokens do usuário
            if (userId) {
                await this.service.logout(userId);
            }
            
            // Remove sessão
            if (sessionId) {
                this.sessionManager.deleteSession(sessionId);
            }
            
            // Remove cookie
            response.writeHead(200, {
                'Content-Type': 'application/json',
                'Set-Cookie': 'sessionId=; HttpOnly; Path=/; Max-Age=0' // Remove cookie
            });
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