// src/app.js
import { LLMRoutes } from "./modules/llm/index.js";
import { CalendarRoute } from "./modules/calendar/routes/CalendarRoute.js";

export class AppRouter {
    constructor(config){
        this.config = config;
        this.modules = this.initializeModules();
    }

    initializeModules(){
        const calendar = new CalendarRoute(this.config);
        const llm = new LLMRoutes(this.config, calendar.controller.service);
        
        return {
            llm: llm,
            calendar: calendar,
        };
    }

    getUserIdFromCookie(req) {
        return this.modules.calendar.controller.getUserIdFromRequest(req)
    }

    async handle(req, res){
        
        var pathname = new URL(req.url, `http://${req.headers.host}`).pathname;

        // Rota de health check
        if (pathname === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ 
                status: 'ok', 
                message: 'Server is running',
                timestamp: new Date().toISOString()
            }));
        }

        if (pathname === '/' || pathname === '') {
            res.writeHead(302, { Location: 'calendar'});
            return res.end();
        }

        if (pathname.startsWith('/calendar')) {
            // Rotas públicas (não precisam de inicialização)
            const publicRoutes = ['/calendar/auth', '/calendar/oauth2callback'];
            const isPublicRoute = publicRoutes.some(route => pathname === route);

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
        if (pathname.startsWith('/llm')) {
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
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Route not found' }));
    }
}