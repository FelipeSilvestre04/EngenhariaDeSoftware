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

    async getEvents(maxResults = 10, query = null, timeMin = null, timeMax = null) {
        if (!this.calendar) {
            throw new Error("Usuário não autenticado! Autenticar primeiro.");
        }

        try {
            // Se timeMin não for fornecido, usa o início do dia atual
            let startDateTime;
            if (timeMin) {
                startDateTime = new Date(timeMin);
            } else {
                const now = new Date();
                startDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            }
            
            const params = {
                calendarId: 'primary',
                timeMin: startDateTime.toISOString(),
                maxResults: maxResults,
                singleEvents: true,
                orderBy: 'startTime',
            };

            if (timeMax) {
                params.timeMax = new Date(timeMax).toISOString();
            }

            if (query) {
                params.q = query;
            }

            const response = await this.calendar.events.list(params);

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

    async getEventById(eventId) {
        if (!this.calendar) {
            throw new Error("Usuário não autenticado! Autenticar primeiro.");
        }

        try {
            const response = await this.calendar.events.get({
                calendarId: 'primary',
                eventId: eventId
            });
            return response.data;
        } catch (error) {
            throw new Error(`Não foi possível encontrar o evento! Erro: ${error.message}`);
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

    // ========================================
    // GMAIL METHODS
    // ========================================

    async listEmails(maxResults = 10) {
        if (!this.oauth2Client.credentials || !this.oauth2Client.credentials.access_token) {
            throw new Error("Usuário não autenticado! Autenticar primeiro.");
        }

        try {
            const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

            // Lista IDs das mensagens
            const response = await gmail.users.messages.list({
                userId: 'me',
                maxResults: maxResults,
                labelIds: ['INBOX']
            });

            const messages = response.data.messages || [];

            if (messages.length === 0) {
                return [];
            }

            // Busca detalhes de cada mensagem
            const detailedMessages = await Promise.all(
                messages.map(async (message) => {
                    const details = await gmail.users.messages.get({
                        userId: 'me',
                        id: message.id,
                        format: 'metadata',
                        metadataHeaders: ['From', 'Subject', 'Date']
                    });

                    const headers = details.data.payload.headers;
                    const from = headers.find(h => h.name === 'From')?.value || '';
                    const subject = headers.find(h => h.name === 'Subject')?.value || '(sem assunto)';
                    const date = headers.find(h => h.name === 'Date')?.value || '';

                    return {
                        id: message.id,
                        from,
                        subject,
                        date,
                        snippet: details.data.snippet || ''
                    };
                })
            );

            return detailedMessages;
        } catch (error) {
            throw new Error(`Não foi possível listar emails! Erro: ${error.message}`);
        }
    }

    async sendEmail({ to, subject, body }) {
        if (!this.oauth2Client.credentials || !this.oauth2Client.credentials.access_token) {
            throw new Error("Usuário não autenticado! Autenticar primeiro.");
        }

        try {
            const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

            // Criar mensagem no formato RFC 2822
            const emailLines = [
                `To: ${to}`,
                `Subject: ${subject}`,
                'Content-Type: text/plain; charset=utf-8',
                '',
                body
            ];
            const email = emailLines.join('\r\n');

            // Codificar em base64url (sem padding)
            const encodedEmail = Buffer.from(email)
                .toString('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');

            // Enviar email
            const response = await gmail.users.messages.send({
                userId: 'me',
                requestBody: {
                    raw: encodedEmail
                }
            });

            return {
                success: true,
                messageId: response.data.id,
                to,
                subject
            };
        } catch (error) {
            throw new Error(`Não foi possível enviar email! Erro: ${error.message}`);
        }
    }
}