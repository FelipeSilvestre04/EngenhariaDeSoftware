// src/modules/calendar/services/CalendarService.js
import { CalendarModel } from "../models/CalendarModel.js";

export class CalendarService {
    constructor(config){
        this.model = new CalendarModel(config);
        this.currentUserId = null; // Armazena o userId da sessão atual
    }

    async initialize(userId){
        if (userId) {
            this.currentUserId = userId;
        }
        return await this.model.initialize(userId || this.currentUserId);
    }

    getAuthenticationUrl(){
        return this.model.getAuthUrl();
    }

    async handleOauthCallback(code){
        if (!code){
            throw new Error("Código de autorização não fornecido.");
        }

        try {
            const result = await this.model.authenticateWithCode(code);
            
            // Armazena o userId na sessão
            this.currentUserId = result.userId;
            
            return {
                success: true,
                message: 'Autenticação realizada com sucesso!',
                userId: result.userId
            }
        } catch (error){
            return {
                success : false,
                message: error.message
            }
        }
    }

    async checkAuthentication(userId) {
        // Se não passou userId, usa o da sessão atual
        const userToCheck = userId || this.currentUserId;
        
        if (!userToCheck) {
            return false;
        }
        
        const hasTokens = await this.model.isAuthenticated(userToCheck);
        
        // Se tem tokens, inicializa o model com esse userId
        if (hasTokens && !this.model.calendar) {
            await this.model.initialize(userToCheck);
            this.currentUserId = userToCheck;
        }
        
        return hasTokens;
    }

    async listEvents(maxResults = 10){
        await this.ensureInitialized(); // Garante inicialização antes de listar
        console.log("LOG: [CalendarService] Buscando eventos...");
        const items = await this.model.getEvents(maxResults);
        return items;
    }   

    async createEvent({summary, description, location, startDateTime, endDateTime}){
        const event = await this.model.insertEvent({
            summary,
            description,
            location,
            startDateTime,
            endDateTime
        });
        return event;
    }

    async logout(userId){
        try {
            const userToLogout = userId || this.currentUserId;
            await this.model.logout(userToLogout);
            this.currentUserId = null;
            return { success: true, message: 'Logout realizado com sucesso' };
        } catch (error) {
            throw new Error('Erro ao deslogar!');
        }
    }
}