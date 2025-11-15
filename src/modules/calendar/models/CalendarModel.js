import { google } from 'googleapis';
import { config } from '../../../shared/config/index.js';
import { TokenStorage } from '../storage/TokenStorage.js';
import crypto from 'crypto';

// funcoes basicas do calendar tool
export class CalendarModel {
    constructor(){
        // criar storage?
        this.tokenStorage = new TokenStorage();
        this.oauth2Client = new google.auth.OAuth2(
            config.googleCalendar.clientId,
            config.googleCalendar.clientSecret,
            config.googleCalendar.redirectUri
        );
        this.calendar = null;
        this.currentUserId = null; // ← Armazena o userId atual
    }

    getAuthUrl(){
        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                ...config.googleCalendar.scopes,
            ],
            prompt: 'consent'
        });
    }

    async isAuthenticated(userId = 'default'){
        return await this.tokenStorage.hasTokens(userId);
    }

    async authenticateWithCode(code){
        try{
            const { tokens } = await this.oauth2Client.getToken(code);
            this.oauth2Client.setCredentials(tokens);

            // Buscar email do usuário
            const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });


            // Usar email como userId
            const userId = crypto.randomUUID();
            this.currentUserId = userId;
            await this.tokenStorage.saveTokens(userId, tokens);
            
            this.calendar = google.calendar({
                version: 'v3',
                auth: this.oauth2Client
            });
                        
            return { tokens, userId: userId };
        } catch (error) {
            throw new Error(`Erro ao autenticar: ${error.message}`);
        }
    }

    async initialize(userId = 'default') {
        const tokens = await this.tokenStorage.loadTokens(userId);
        
        if (tokens) {
            this.currentUserId = userId;
            this.oauth2Client.setCredentials(tokens);
            this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
            
            console.log(`✅ Tokens carregados para usuário: ${userId}`);
            
            if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
                console.log('⚠️  Token expirado, renovando...');
                await this.refreshToken(userId);
            }
            
            return true;
        }
        
        console.log('⚠️  Nenhum token encontrado. Usuário precisa autenticar.');
        return false;
    }

    async refreshToken(userId) {
        try {
            const { credentials } = await this.oauth2Client.refreshAccessToken();
            await this.tokenStorage.saveTokens(userId, credentials);
            this.oauth2Client.setCredentials(credentials);
        } catch (error) {
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

    async insertEvent({summary, description, location, startDateTime, endDateTime}){
        if (!this.calendar) {
            throw new Error("Usuário não autenticado! Autenticar primeiro.");
        }
        try {
            const event = {
                summary: summary,
                description: description
                , location: location,
                start: {
                    dateTime: startDateTime,
                    timeZone: 'America/Sao_Paulo'
                },
                end: {
                    dateTime: endDateTime,
                    timeZone: 'America/Sao_Paulo'
                }
            };
            const response = await this.calendar.events.insert({
                calendarId: 'primary',
                resource: event
            });
            return response.data;
        } catch (error) {
            throw new Error(`Não foi possível criar o evento! Erro: ${error.message}`);
        }
    }

    async logout(userId = 'default'){
        await this.tokenStorage.deleteTokens(userId);
        this.oauth2Client.setCredentials({});
        this.calendar = null;
        this.currentUserId = null;
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