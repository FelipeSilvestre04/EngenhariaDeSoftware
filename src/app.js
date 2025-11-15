// src/app.js
import { LLMRoutes } from "./modules/llm/index.js";
import { CalendarRoute } from "./modules/calendar/routes/CalendarRoute.js";
import { AuthRoute } from "./modules/auth/auth.route.js";

export class AppRouter {
    constructor(config){
        this.config = config;
        this.modules = this.initializeModules();
        this.routes = {
            llm: '/llm',
            calendar: '/calendar',
            auth: '/auth',
        };
    }

    initializeModules(){
        const calendar = new CalendarRoute(this.config);
        const llm = new LLMRoutes(this.config, calendar.controller.service);
        const auth = new AuthRoute();
        
        return {
            llm: llm,
            calendar: calendar,
            auth: auth,
        };
    }

    getUserIdFromCookie(req) {
        return this.modules.calendar.controller.getUserIdFromRequest(req)
    }

    async handle(req, res){
        
        var pathname = new URL(req.url, `http://${req.headers.host}`).pathname;
        
        // Rota de health check (sem /api)
        if (pathname === '/health' || pathname === '/api/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ 
                status: 'ok', 
                message: 'Server is running',
                timestamp: new Date().toISOString()
            }));
        }

        // EXCEÇÃO: Permite rotas de OAuth direto na porta 10000 (com ou sem /api)
        if (pathname === '/calendar/oauth2callback' || pathname === '/calendar/auth' ||
            pathname === '/api/calendar/oauth2callback' || pathname === '/api/calendar/auth') {
            // Remove /api se presente para passar para o módulo
            if (pathname.startsWith('/api')) {
                req.url = pathname.substring(4) + new URL(req.url, `http://${req.headers.host}`).search;
            }
            return await this.modules.calendar.handle(req, res);
        }

        // Raiz redireciona para o frontend (será servido pelo nginx)
        if (pathname === '/' || pathname === '') {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ 
                error: 'Not found',
                message: 'API routes should start with /api'
            }));
        }

        // Remove o prefixo /api se presente
        let apiPath = pathname;
        if (pathname.startsWith('/api')) {
            apiPath = pathname.substring(4); // Remove '/api'
        } else {
            // Se não começar com /api, retorna 404
            res.writeHead(404, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ 
                error: 'Not found',
                message: 'API routes should start with /api'
            }));
        }

        // Modifica req.url para remover o prefixo /api antes de passar para os módulos
        if (pathname.startsWith('/api')) {
            const url = new URL(req.url, `http://${req.headers.host}`);
            req.url = url.pathname.substring(4) + url.search; // Remove '/api' mas mantém query string
        }

        if (apiPath.startsWith('/calendar')) {
            // Rotas públicas (não precisam de inicialização)
            const publicRoutes = ['/calendar/auth', '/calendar/oauth2callback'];
            const isPublicRoute = publicRoutes.some(route => apiPath === route);

            if (!isPublicRoute) {
                // Rotas protegidas - inicializa calendar
                const userId = this.getUserIdFromCookie(req);
                console.log(`🔍 UserId do cookie: ${userId}`);
                
                if (userId) {
                    try {
                        await this.modules.calendar.controller.service.initialize(userId);
                        console.log(`✅ Calendar inicializado para: ${userId}`);
                    } catch (error) {
                        console.error(`❌ Erro ao inicializar calendar: ${error.message}`);
                    }
                } else {
                    console.log(`⚠️ Nenhum userId encontrado no cookie`);
                }
            }

            return await this.modules.calendar.handle(req, res);
        }
        if (apiPath.startsWith('/llm')) {
            // Inicializa calendar para o LLM poder usar
            const userId = this.getUserIdFromCookie(req);
            if (userId) {
                try {
                    await this.modules.calendar.controller.service.initialize(userId);
                    console.log(`✅ Calendar inicializado para LLM: ${userId}`);
                } catch (error) {
                    console.error(`❌ Erro ao inicializar calendar para LLM: ${error.message}`);
                }
            }
            
            return await this.modules.llm.handle(req, res);
        }
        if (apiPath.startsWith('/auth')) {
            return await this.modules.auth.handle(req, res);
        }
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Route not found' }));
    }
}