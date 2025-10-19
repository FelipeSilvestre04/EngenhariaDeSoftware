// src/app.js
import { LLMRoutes } from "./modules/llm/index.js";
import { CalendarRoute } from "./modules/calendar/routes/CalendarRoute.js";

export class AppRouter {
    constructor(config){
        this.config = config;
        this.modules = this.initializeModules();
    }

    initializeModules(){
        const llmRoutes = new LLMRoutes(this.config);
        const calendarRoute = new CalendarRoute(this.config);

        // Injeta o serviço de calendário no controlador da LLM
        llmRoutes.llmController.setCalendarService(calendarRoute.controller.service);

        return {
            llm: llmRoutes,
            calendar: calendarRoute,
        };
    }

    async handle(req, res){
        // ... (o resto do arquivo continua o mesmo)
        const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;

        if (pathname === '/' || pathname === '/health') { /* ... */ }
        if (pathname.startsWith('/calendar')){
            return await this.modules.calendar.handle(req, res);
        }
        if (pathname.startsWith('/llm')) {
            return await this.modules.llm.handle(req, res);
        }
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Route not found' }));
    }
}