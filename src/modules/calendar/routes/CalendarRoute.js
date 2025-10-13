import { CalendarController } from "../controllers/CalendarController.js";

export class CalendarRoute {
    constructor (config){
        this.controller = new CalendarController(config);
    }

    async handle(req, res){
        const url = new URL(req.url, `http://${req.headers.host}`);
        const pathname = url.pathname;
        const method = url.method;

        if (pathname === '/calendar/auth' && method === 'GET') {
            return await this.controller.initiateAuth(req, res);
        }

        if (pathname === '/calendar/oauth2callback' && method === 'GET'){
            return await this.controller.handleCallback(req, res);
        }

        if (pathname === '/calendar/events' && method === 'GET') {

        }
    }
}