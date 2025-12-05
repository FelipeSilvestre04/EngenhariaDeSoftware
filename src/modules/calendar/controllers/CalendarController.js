// src/modules/calendar/controllers/CalendarController.js
import { CalendarService } from "../services/CalendarService.js";

export class CalendarController {
    constructor(config) {
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

    async initiateAuth(req, res) {
        try {
            const authUrl = this.service.getAuthenticationUrl();
            res.writeHead(302, { Location: authUrl });
            res.end();
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: "Erro ao iniciar autenticação", message: error.message }));
        }
    }

    async handleCallback(req, res) {
        try {
            console.log("🌟 CalendarController.handleCallback iniciado");
            const url = new URL(req.url, `http://${req.headers.host}`);
            const code = url.searchParams.get('code');
            if (!code) throw new Error("Código de autorização não encontrado.");

            const result = await this.service.handleOauthCallback(code);
            console.log("🌟 Callback processado, result.tokens existe?", !!result.tokens);

            if (!result.tokens) {
                console.error("❌ result.tokens está vazio!");
                throw new Error("Tokens JWT não foram gerados");
            }

            console.log("🌟 Definindo 3 cookies: userId, accessToken, refreshToken");
            console.log("🌟 AccessToken length:", result.tokens.accessToken?.length);
            console.log("🌟 RefreshToken length:", result.tokens.refreshToken?.length);

            // Define TODOS os cookies (userId, accessToken, refreshToken)
            const cookies = [
                `userId=${result.userId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`,
                `accessToken=${result.tokens.accessToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=900`,
                `refreshToken=${result.tokens.refreshToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`
            ];

            // Redireciona de volta para a aplicação React após a autenticação
            const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
            console.log("🌟 Redirecionando para:", clientUrl);

            res.writeHead(302, {
                Location: clientUrl,
                'Set-Cookie': cookies
            });
            res.end();

        } catch (error) {
            console.error("🔴 Erro no handleCallback:", error);
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end(`<h1>Erro na autenticação</h1><p>${error.message}</p>`);
        }
    }

    async listEvents(req, res) {
        try {
            // Usa req.userId populado pelo middleware de autenticação, ou fallback para cookie
            const userId = req.userId || this.getUserIdFromRequest(req);

            if (!userId) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: false, error: 'Usuário não autenticado' }));
            }

            // Verifica autenticação com o userId
            const isAuth = await this.service.checkAuthentication(userId);

            if (!isAuth) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: false, error: 'Usuário não autenticado no Google' }));
            }

            const events = await this.service.listEvents(400);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, count: events.length, events: events }));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Erro ao buscar eventos', message: error.message }));
        }
    }

    async checkStatus(req, res) {
        try {
            // Usa req.userId populado pelo middleware de autenticação, ou fallback para cookie
            const userId = req.userId || this.getUserIdFromRequest(req);
            const isAuth = userId ? await this.service.checkAuthentication(userId) : false;

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ authenticated: isAuth, userId: userId || null }));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
    }

    async logout(req, res) {
        try {
            // Usa req.userId populado pelo middleware de autenticação, ou fallback para cookie
            const userId = req.userId || this.getUserIdFromRequest(req);

            if (!userId) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({
                    success: false,
                    error: 'Nenhum usuário autenticado'
                }));
            }

            await this.service.logout(userId);

            // Remove os cookies de autenticação
            const expiredCookies = [
                'userId=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
                'accessToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
                'refreshToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
            ];

            res.writeHead(200, {
                'Content-Type': 'application/json',
                'Set-Cookie': expiredCookies
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