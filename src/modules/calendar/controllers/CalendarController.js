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

            const result = await this.service.handleOauthCallback(code);

            // Determina a URL do cliente
            const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || req.headers.referer || 'http://localhost:5173';
            
            // Verifica se estamos em localhost (desenvolvimento)
            const isLocalhost = clientUrl.includes('localhost') || clientUrl.includes('127.0.0.1');
            
            // Define o cookie userId no navegador
            const cookieParts = [
                `userId=${result.userId}`,
                'Path=/',
                'HttpOnly',
                'Max-Age=2592000' // 30 dias
            ];
            
            // Em localhost, usa SameSite=Lax (não precisa Secure)
            // Em produção, usa SameSite=None com Secure
            if (isLocalhost) {
                cookieParts.push('SameSite=Lax');
            } else {
                cookieParts.push('SameSite=None');
                cookieParts.push('Secure');
            }
            
            const cookieOptions = cookieParts.join('; ');
            
            console.log('🍪 Definindo cookie:', cookieOptions);
            console.log('🔄 Redirecionando para:', clientUrl);
            
            res.writeHead(302, { 
                Location: clientUrl,
                'Set-Cookie': cookieOptions
            }); 
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
                res.writeHead(401, {'Content-Type': 'application/json'});
                return res.end(JSON.stringify({ success: false, error: 'Usuário não autenticado' }));
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
            console.log('🔍 Check Status - UserId do cookie:', userId);
            console.log('🔍 Check Status - Cookies recebidos:', req.headers.cookie);
            
            const isAuth = userId ? await this.service.checkAuthentication(userId) : false;
            
            console.log('✅ Check Status - Autenticado?', isAuth);

            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({ authenticated: isAuth }));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json'});
            res.end(JSON.stringify({ error: error.message }));
        }
    }

    async logout(req, res) {
        try {
            const userId = this.getUserIdFromRequest(req);
            
            if (!userId) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ 
                    success: false,
                    error: 'Nenhum usuário autenticado' 
                }));
            }

            await this.service.logout(userId);
            
            // Remove o cookie userId
            res.writeHead(200, { 
                'Content-Type': 'application/json',
                'Set-Cookie': 'userId=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
            });
            res.end(JSON.stringify({ 
                success: true,
                message: 'Logout realizado com sucesso' 
            }));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                success: false,
                error: error.message 
            }));
        }
    }
}