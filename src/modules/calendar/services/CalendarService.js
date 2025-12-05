// src/modules/calendar/services/CalendarService.js
import { CalendarModel } from "../models/CalendarModel.js";
import { AuthService } from "../../auth/auth.service.js";

export class CalendarService {
    constructor(config) {
        this.model = new CalendarModel(config);
        this.authService = new AuthService(undefined, config);
        this.currentUserId = null; // Armazena o userId da sessão atual
    }

    async initialize(userId) {
        if (userId) {
            this.currentUserId = userId;
        }
        return await this.model.initialize(userId || this.currentUserId);
    }

    getAuthenticationUrl() {
        return this.model.getAuthUrl();
    }

    async handleOauthCallback(code) {
        if (!code) {
            throw new Error("Código de autorização não fornecido.");
        }

        try {
            console.log("📘 CalendarService.handleOauthCallback: Autenticando com código...");
            const result = await this.model.authenticateWithCode(code);
            console.log("📘 CalendarService: authenticateWithCode retornou userId:", result.userId);
            console.log("📘 CalendarService: userInfo:", result.userInfo);

            // Armazena o userId na sessão
            this.currentUserId = result.userId;

            // GERA TOKENS JWT COM INFORMAÇÕES DO USUÁRIO
            console.log("📘 CalendarService: Gerando tokens JWT...");
            const payload = {
                userId: result.userId,
                email: result.userInfo?.email,
                name: result.userInfo?.name,
                picture: result.userInfo?.picture
            };

            const jwtTokens = await this.authService.generateTokenPair(payload);
            console.log("📘 CalendarService: Tokens JWT gerados!");

            return {
                success: true,
                message: 'Autenticação realizada com sucesso!',
                userId: result.userId,
                tokens: jwtTokens  // RETORNA OS TOKENS!
            }
        } catch (error) {
            console.error("📘 CalendarService: Erro:", error);
            return {
                success: false,
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

    async ensureInitialized() {
        // Verifica se o calendar está inicializado
        if (!this.model.calendar && this.currentUserId) {
            console.log("⚠️ Calendar não inicializado, inicializando com userId:", this.currentUserId);
            await this.model.initialize(this.currentUserId);
        } else if (!this.model.calendar) {
            throw new Error("Calendar não pode ser inicializado: userId não definido");
        }
    }

    async listEvents(maxResults = 10) {
        await this.ensureInitialized(); // Garante inicialização antes de listar
        console.log("LOG: [CalendarService] Buscando eventos...");
        const items = await this.model.getEvents(maxResults);
        return items;
    }

    async createEvent({ summary, description, location, startDateTime, endDateTime }) {
        await this.ensureInitialized(); // Garante inicialização antes de criar evento
        console.log("🔧 [CalendarService] Criando evento:", {
            summary,
            description,
            location,
            startDateTime,
            endDateTime
        });

        const event = await this.model.insertEvent({
            summary,
            description,
            location,
            startDateTime,
            endDateTime
        });

        console.log("✅ [CalendarService] Evento criado:", event);
        return event;
    }

    async logout(userId) {
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