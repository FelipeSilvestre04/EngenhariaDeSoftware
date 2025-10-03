import { LLMRoutes } from "./modules/llm/index.js";

export class AppRouter {
    constructor(config){
        this.config = config;
        this.modules = this.initializeModules();
    }

    initializeModules(){
        return {
            llm: new LLMRoutes(this.config),
        };
    }

    async handle(req, res){
        const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;

        if (pathname.startsWith('/llm')) {
            return await this.modules.llm.handle(req, res);
        }
    }
}