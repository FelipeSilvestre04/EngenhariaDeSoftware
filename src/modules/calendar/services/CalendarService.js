import { CalendarModel } from "../models/CalendarModel.js";

export class CalendarService {
    constructor(config){
        this.model = new CalendarModel(config);
    }

    async initialize(){
        return await this.model.initialize();
    }

    getAuthenticationUrl(){
        return this.model.getAuthUrl();
    }

    async handleOauthCallback(code){
        if (!code){
            throw new Error("Código de autorização não fornecido.");
        }

        try {
            await this.model.authenticateWithCode(code);
            return {
                success: true,
                message: 'Autenticação realizada com sucesso!'
            }
        } catch (error){
            return {
                success : false,
                message: error.message
            }
        }
    }

    async checkAuthentication() {
        return await this.model.isAutheticated();
    }

    async listEvents(maxResults= 10){
        const items = await this.model.getEvents(maxResults);
        console.log(items);
        return items;
    }   

    async logout(){
        try {
            this.model.logout();
        } catch (error) {
            throw new Error('Erro ao deslogar!');
        }
    }
}