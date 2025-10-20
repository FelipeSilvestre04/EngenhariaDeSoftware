// src/modules/calendar/services/CalendarService.js
import { CalendarModel } from "../models/CalendarModel.js";

export class CalendarService {
    constructor(config){
        this.model = new CalendarModel(config);
        this.isInitialized = false; // Flag para controlar o estado
    }

    // NOVA FUNÇÃO: Garante que a inicialização ocorreu
    async ensureInitialized() {
        if (!this.isInitialized) {
            console.log("LOG: [CalendarService] Inicializando o serviço...");
            this.isInitialized = await this.model.initialize();
            if (this.isInitialized) {
                console.log("LOG: [CalendarService] Serviço inicializado com sucesso.");
            } else {
                console.error("LOG: [CalendarService] FALHA na inicialização. Verifique os tokens.");
            }
        }
    }

    getAuthenticationUrl(){
        return this.model.getAuthUrl();
    }

    async handleOauthCallback(code){
        // ... (código existente)
        const result = await this.model.authenticateWithCode(code);
        this.isInitialized = true; // Marca como inicializado após o callback
        return { success: true, message: 'Autenticação realizada com sucesso!' };
    }

    async checkAuthentication() {
        await this.ensureInitialized(); // Garante que está checado
        return await this.model.isAutheticated();
    }

    async listEvents(maxResults = 10){
        await this.ensureInitialized(); // Garante inicialização antes de listar
        console.log("LOG: [CalendarService] Buscando eventos...");
        const items = await this.model.getEvents(maxResults);
        return items;
    }   

    async logout(){
        console.log("LOG: [CalendarService] Realizando logout...");
        await this.model.logout();
        this.isInitialized = false; // Reseta o estado
    }

    async createEvent(summary, start, end) {
        await this.ensureInitialized(); // Garante inicialização antes de criar
        console.log(`LOG: [CalendarService] Criando evento: "${summary}"`);
        const event = {
            summary: summary,
            start: { dateTime: start, timeZone: 'America/Sao_Paulo' },
            end: { dateTime: end, timeZone: 'America/Sao_Paulo' },
        };
        return await this.model.createEvent(event);
    }
}