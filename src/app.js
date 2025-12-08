// src/app.js
import express from 'express';
import { LLMRoutes } from "./modules/llm/index.js";
import { CalendarRoute } from "./modules/calendar/routes/CalendarRoute.js";
import { AuthRoute } from "./modules/auth/auth.route.js";
import ProjectsRoute from "./modules/projects/projects.routes.js";
import TasksRoute from "./modules/tasks/tasks.routes.js";
import { EmailRoutes } from "./modules/email/email.routes.js";
import { createAuthMiddleware } from "./shared/middleware/authMiddleware.js";

export class AppRouter {
    constructor(config) {
        this.config = config;
        this.authMiddleware = createAuthMiddleware(config);
        this.modules = this.initializeModules();
    }

    initializeModules() {
        const calendar = new CalendarRoute(this.config);
        const llm = new LLMRoutes(this.config, calendar.controller.service);
        const auth = new AuthRoute(this.config);
        const projects = ProjectsRoute;
        const tasks = TasksRoute;
        const email = new EmailRoutes(calendar.controller.service);

        return {
            llm: llm,
            calendar: calendar,
            auth: auth,
            projects: projects,
            tasks: tasks,
            email: email,
        };
    }

    getUserIdFromCookie(req) {
        return this.modules.calendar.controller.getUserIdFromRequest(req)
    }

    // Middleware para inicializar calendar em rotas protegidas
    calendarInitMiddleware() {
        return async (req, res, next) => {
            const publicRoutes = ['/auth', '/oauth2callback'];
            const isPublicRoute = publicRoutes.some(route => req.path === route);

            if (!isPublicRoute) {
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
            next();
        };
    }

    // Middleware para inicializar calendar para LLM
    llmInitMiddleware() {
        return async (req, res, next) => {
            const userId = this.getUserIdFromCookie(req);
            if (userId) {
                try {
                    await this.modules.calendar.controller.service.initialize(userId);
                    console.log(`✅ Calendar inicializado para LLM: ${userId}`);
                } catch (error) {
                    console.error(`❌ Erro ao inicializar calendar para LLM: ${error.message}`);
                }
            }
            next();
        };
    }

    setupRoutes(app) {
        // Health check
        app.get('/health', async (req, res) => {
            let dbStatus = 'unknown';
            try {
                // Teste simples de conexão com o banco
                await import('./shared/database/index.js').then(async (module) => {
                    await module.db.query('SELECT 1');
                    dbStatus = 'connected';
                });
            } catch (error) {
                dbStatus = 'disconnected';
                console.error('Health check DB error:', error);
            }

            res.json({
                status: 'ok',
                message: 'Server is running',
                database: dbStatus,
                timestamp: new Date().toISOString()
            });
        });

        // Rotas dos módulos
        app.use('/calendar', this.calendarInitMiddleware(), this.modules.calendar.getRouter());
        app.use('/llm', this.llmInitMiddleware(), this.modules.llm.getRouter());
        app.use('/auth', this.modules.auth.getRouter());
        app.use('/api/projects', this.authMiddleware.authenticate(), this.modules.projects);
        app.use('/api/tasks', this.authMiddleware.authenticate(), this.modules.tasks);
        app.use('/api/email', this.calendarInitMiddleware(), this.modules.email.getRouter());
    }
}
