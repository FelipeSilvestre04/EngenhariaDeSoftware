import { google } from 'googleapis';
import { TokenStorage } from '../storage/TokenStorage.js';


// funcoes basicas do calendar tool
export class CalendarModel {
    constructor(config){
        // criar storage?
        this.tokenStorage = new TokenStorage();
        this.oauth2Client = new google.auth.OAuth2(
            config.googleCalendar.clientId,
            config.googleCalendar.clientSecret,
            config.googleCalendar.redirectUri
        );
        this.calendar = null;
        this.config = config;
    }

    getAuthUrl(){
        return this.oauth2Client.generateAuthUrl({
            acess_type: 'offline',
            scope: this.config.googleCalendar.scopes,
            prompt: 'consent',
        });
    }

    async isAutheticated(){
        return await this.tokenStorage.hasTokens();
    }

    async authenticateWithCode(code){
        try{
            const { tokens } = await this.oauth2Client.getToken(code);
            await this.tokenStorage.saveTokens(tokens);
            this.oauth2Client.setCredentials(tokens);
            this.calendar = google.calendar({
                version: 'v3',
                auth: this.oauth2Client
            });
            return tokens;

        } catch (error) {
            throw new Error(`Erro ao autenticar: ${error.message}`);
        }
    }

    async initialize(){
        try {
            const tokens = await this.tokenStorage.loadTokens();

            if (tokens){
                this.oauth2Client.setCredentials(tokens);
                this.calendar = google.calendar({
                    version: 'v3',
                    auth: this.oauth2Client
                });

                if (tokens.expiry_date && tokens.expiry_date < Date.now()){
                    await this.refreshToken();
                }

                return true;
            }

            return false;
        } catch (error) {
            console.log('⚠️ Não foi possível carregar tokens:', error.message);
            return false;
        }
    }

    async refreshToken(){
        try {
            const { credentials } = await this.oauth2Client.refreshAccessToken();
            await this.tokenStorage.saveTokens(credentials);
            this.oauth2Client.setCredentials(credentials);
            console.log(" Token renovado! ");

        } catch (error){
            console.error('Erro ao renovar token:', error.message);
            throw new Error('Token expirado. Faça login novamente.');
        }
    }

    async getEvents(maxResults = 10){
        if (!this.calendar) {
            throw new Error("Usuário não autenticado! Autenticar primeiro.");
        }

        try {
            const response = await this.calendar.events.list({
              calendarId: 'primary',
              timeMin: new Date().toISOString(),
              maxResults: maxResults,
              singleEvents: true,
              orderBy: 'startTime',  
            });

            const events = response.data.items || [];
            
            // Formatar os eventos para retornar dados mais limpos
            return events.map(event => ({
                id: event.id,
                summary: event.summary || 'Sem título',
                description: event.description || '',
                start: event.start.dateTime || event.start.date,
                end: event.end.dateTime || event.end.date,
                location: event.location || '',
                status: event.status,
                htmlLink: event.htmlLink,
                creator: event.creator?.email || '',
                attendees: event.attendees?.map(a => a.email) || []
            }));
        } catch (error) {
            throw new Error(`Não foi possível retornar lista de eventos! Erro: ${error.message}`);
        }
    }

    async logout(){
        await this.tokenStorage.deleteTokens();
        this.oauth2Client.setCredentials({});
        this.calendar = null;
    }
}