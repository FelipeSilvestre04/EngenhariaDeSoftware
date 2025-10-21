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
    }    // ...existing code...
        async createEvent(event) {
            if (!this.calendar) {
                throw new Error("Usuário não autenticado!");
            }
    
            // Normaliza o evento para o formato esperado pela API
            const resource = { ...event };
            const tz = this.config?.googleCalendar?.timeZone || 'UTC';
    
            // Summary padrão
            if (!resource.summary) resource.summary = 'Sem título';
    
            // Normaliza attendees: aceita ['a@b.com'] ou [{ email: 'a@b.com' }, ...]
            if (Array.isArray(resource.attendees)) {
                resource.attendees = resource.attendees.map(a => {
                    if (typeof a === 'string') return { email: a };
                    if (a && a.email) return a;
                    return null;
                }).filter(Boolean);
            }
    
            // Normaliza start
            if (resource.start) {
                if (typeof resource.start === 'string') {
                    resource.start = { dateTime: resource.start, timeZone: tz };
                } else if (resource.start.date) {
                    resource.start = { date: resource.start.date }; // all-day
                } else if (resource.start.dateTime) {
                    resource.start.timeZone = resource.start.timeZone || tz;
                }
            }
    
            // Normaliza end
            if (resource.end) {
                if (typeof resource.end === 'string') {
                    resource.end = { dateTime: resource.end, timeZone: tz };
                } else if (resource.end.date) {
                    resource.end = { date: resource.end.date }; // all-day
                } else if (resource.end.dateTime) {
                    resource.end.timeZone = resource.end.timeZone || tz;
                }
            }
    
            try {
                const response = await this.calendar.events.insert({
                    calendarId: 'primary',
                    resource,
                });
                return response.data;
            } catch (error) {
                // Tenta extrair detalhe da resposta da API para facilitar o debug
                const details = error?.response?.data || error?.errors || error?.message || error;
                throw new Error(`Não foi possível criar o evento: ${JSON.stringify(details)}`);
            }
        }
    // ...existing code...

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
    async createEvent(event) {
    if (!this.calendar) {
        throw new Error("Usuário não autenticado!");
    }
    try {
        const response = await this.calendar.events.insert({
            calendarId: 'primary',
            resource: event,
        });
        return response.data;
    } catch (error) {
        throw new Error(`Não foi possível criar o evento: ${error.message}`);
    }
}
}