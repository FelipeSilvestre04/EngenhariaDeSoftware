// src/modules/calendar/models/CalendarModel.js
import { google } from 'googleapis';
import { config } from '../../../shared/config/index.js';
import { TokenStorage } from '../storage/TokenStorage.js';
import crypto from 'crypto';

// funcoes basicas do calendar tool
export class CalendarModel {
    constructor() {
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

    getAuthUrl() {
        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                ...config.googleCalendar.scopes,
            ],
            prompt: 'consent'
        });
    }

    async isAuthenticated(userId = 'default') {
        return await this.tokenStorage.hasTokens(userId);
    }

    async authenticateWithCode(code) {
        try {
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
    }

    async getEvents(maxResults = 10) {
        if (!this.calendar) {
            throw new Error("Usuário não autenticado! Autenticar primeiro.");
        }

        try {
            // Buscar eventos a partir do início do mês atual
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
            const response = await this.calendar.events.list({
                calendarId: 'primary',
                timeMin: startOfMonth.toISOString(),
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

    async insertEvent({ summary, description, location, startDateTime, endDateTime }) {
        if (!this.calendar) {
            throw new Error("Usuário não autenticado! Autenticar primeiro.");
        }
        try {
            const event = {
                summary: summary,
                description: description,
                location: location,
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

    async deleteEvent(eventId) {
        if (!this.calendar) {
            throw new Error("Usuário não autenticado! Autenticar primeiro.");
        }

        try {
            await this.calendar.events.delete({
                calendarId: 'primary',
                eventId: eventId
            });

            return { success: true, eventId };
        } catch (error) {
            throw new Error(`Não foi possível deletar o evento! Erro: ${error.message}`);
        }
    }

    async updateEvent(eventId, { summary, description, location, startDateTime, endDateTime }) {
        if (!this.calendar) {
            throw new Error("Usuário não autenticado! Autenticar primeiro.");
        }

        try {
            // Primeiro buscar o evento existente
            const existingEvent = await this.calendar.events.get({
                calendarId: 'primary',
                eventId: eventId
            });

            // Atualizar apenas os campos fornecidos
            const updatedEvent = {
                summary: summary || existingEvent.data.summary,
                description: description !== undefined ? description : existingEvent.data.description,
                location: location !== undefined ? location : existingEvent.data.location,
                start: startDateTime ? {
                    dateTime: startDateTime,
                    timeZone: 'America/Sao_Paulo'
                } : existingEvent.data.start,
                end: endDateTime ? {
                    dateTime: endDateTime,
                    timeZone: 'America/Sao_Paulo'
                } : existingEvent.data.end
            };

            const response = await this.calendar.events.update({
                calendarId: 'primary',
                eventId: eventId,
                resource: updatedEvent
            });

            return response.data;
        } catch (error) {
            throw new Error(`Não foi possível atualizar o evento! Erro: ${error.message}`);
        }
    }

    async logout(userId = 'default') {
        await this.tokenStorage.deleteTokens(userId);
        this.oauth2Client.setCredentials({});
        this.calendar = null;
        this.currentUserId = null;
    }
}