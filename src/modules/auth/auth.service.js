import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { TokenStorage } from '../calendar/storage/TokenStorage.js';
import { google } from 'googleapis';
import { db } from '../../shared/database/index.js';
import crypto from 'crypto';

export class AuthService {
    constructor(jwtLibrary = jwt, config) {
        this.jwtLibrary = jwtLibrary;
        this.tokenStorage = new TokenStorage();
        this.config = config;

        this.oauth2Client = new google.auth.OAuth2(
            config?.googleCalendar.clientId,
            config?.googleCalendar.clientSecret,
            config?.googleCalendar.redirectUri
        )
    }

    getAuthUrl() {
        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: [
                ...this.config.googleCalendar.scopes,
            ],
            prompt: 'consent'
        });
    }

    async handleOAuthCallback(code) {
        if (!code) {
            throw new Error("Código de autorização não fornecido.");
        }

        console.log(`🔍 [AuthService] Iniciando OAuth callback. RedirectURL configurada: ${this.config.googleCalendar.redirectUri}`);

        try {
            // Create a new client instance to avoid race conditions with the singleton this.oauth2Client
            const oauth2Client = new google.auth.OAuth2(
                this.config.googleCalendar.clientId,
                this.config.googleCalendar.clientSecret,
                this.config.googleCalendar.redirectUri
            );

            console.log("🔄 [AuthService] Trocando code por tokens...");
            const { tokens } = await oauth2Client.getToken(code);

            if (!tokens) {
                throw new Error("Falha ao obter tokens OAuth2.");
            }
            console.log("✅ [AuthService] Tokens obtidos com sucesso.");

            oauth2Client.setCredentials(tokens);

            const oauth2 = google.oauth2({
                auth: oauth2Client,
                version: 'v2'
            });

            console.log("🔄 [AuthService] Buscando info do usuário...");
            const { data } = await oauth2.userinfo.get();

            if (!data || !data.email) {
                throw new Error("Falha ao obter informações do usuário.");
            }
            console.log(`✅ [AuthService] Usuário encontrado no Google: ${data.email}`);

            const query = `SELECT Check_User($1, $2) as "userId"`;
            const dbResult = await db.query(query, [data.name, data.email]);

            // O ID agora é um NÚMERO (INT) vindo do banco
            const realUserId = dbResult.rows[0].userId;

            console.log(`✅ Usuário logado/criado no BD: ${data.email} (ID: ${realUserId})`);

            await this.tokenStorage.saveTokens(realUserId.toString(), tokens);

            const payload = {
                userId: realUserId,
                email: data.email,
                name: data.name,
                picture: data.picture,
            }

            const jwtTokens = await this.generateTokenPair(payload);

            return {
                success: true,
                message: 'Autenticação bem-sucedida',
                userId: realUserId,
                userInfo: {
                    email: data.email,
                    name: data.name
                },
                tokens: jwtTokens
            };
        } catch (error) {
            console.error("❌ [AuthService] Erro CRÍTICO no OAuth:", error);

            let errorMessage = error.message;
            if (error.response && error.response.data) {
                console.error("❌ [AuthService] Detalhes do erro Google:", JSON.stringify(error.response.data));
                errorMessage = JSON.stringify(error.response.data);
            }

            return {
                success: false,
                message: `Erro OAuth2 Detalhado: ${errorMessage}`
            };
        }
    }

    async checkGoogleAuthentication(userId) {
        if (!userId) return false;

        const hasTokens = await this.tokenStorage.hasTokens(userId);
        if (!hasTokens) return false;

        const tokens = await this.tokenStorage.loadTokens(userId);
        if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
            try {
                await this.refreshGoogleToken(userId);
                return true;
            } catch (error) {
                console.error("Erro ao atualizar token do Google:", error);
                return false;
            }
        }

        return true;
    }

    async refreshGoogleToken(userId) {
        const tokens = await this.tokenStorage.loadTokens(userId);
        if (!tokens || !tokens.refresh_token) {
            throw new Error("Nenhum token de atualização disponível.");
        }

        const oauth2Client = new google.auth.OAuth2(
            this.config.googleCalendar.clientId,
            this.config.googleCalendar.clientSecret,
            this.config.googleCalendar.redirectUri
        );

        oauth2Client.setCredentials(tokens);

        const newTokens = await oauth2Client.refreshAccessToken();
        await this.tokenStorage.saveTokens(userId, newTokens.credentials);
    }

    async verifyToken(token) {
        try {
            const decoded = await this.jwtLibrary.verify(token, process.env.JWT_SECRET);

            return decoded;
        } catch (error) {
            console.error("Erro ao verificar token:", error);
            return false;
        }
    }

    async generateToken(payload, expiresIn = '3d') {
        try {
            const token = await this.jwtLibrary.sign(payload, process.env.JWT_SECRET, { expiresIn });
            return token;
        } catch (error) {
            console.error("Erro ao gerar token:", error);
            throw new Error("Não foi possível gerar o token");
        }
    }

    async generateRefreshToken(payload, expiresIn = '15d') {
        try {
            const refreshToken = await this.jwtLibrary.sign({ ...payload, type: 'refresh' },
                process.env.JWT_REFRESH_SECRET,
                { expiresIn });
            return refreshToken;
        } catch (error) {
            console.error("Erro ao gerar refresh token:", error);
            throw new Error("Não foi possível gerar o refresh token");
        }
    }

    async generateTokenPair(payload) {
        try {
            delete payload.password;

            const accessToken = await this.generateToken(payload, '2d');
            const refreshToken = await this.generateRefreshToken(payload, '7d');

            return { accessToken, refreshToken, expiresIn: 900 };
        } catch (error) {
            console.error("Erro ao gerar par de tokens:", error);
            throw new Error("Não foi possível gerar o par de tokens");
        }
    }

    async decodeToken(token) {
        try {
            const decoded = await this.jwtLibrary.decode(token);
            return decoded;
        } catch (error) {
            console.error("Erro ao decodificar token:", error);
            throw new Error("Não foi possível decodificar o token");
        }
    }

    async refreshAccessToken(refreshToken) {
        try {
            const decoded = await this.jwtLibrary.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

            if (!decoded || decoded.type !== 'refresh') {
                throw new Error("Refresh token inválido");
            }

            const { type, iat, exp, ...payload } = decoded;
            const accessToken = await this.generateToken(payload, '2d');

            return {
                accessToken,
                refreshToken,
                expiresIn: 900
            };

        } catch (error) {
            console.error("Erro ao atualizar token:", error);
            throw new Error("Não foi possível atualizar o token");
        }
    }

    async logout(userId) {
        try {
            const hasTokens = await this.tokenStorage.hasTokens(userId);
            await this.tokenStorage.deleteTokens(userId);
            console.log(`✅ Logout realizado para usuário: ${userId}`);
        } catch (error) {
            throw new Error(`Erro ao fazer logout: ${error.message}`);
        }
    }
}