// src/shared/middleware/authMiddleware.js
import { AuthService } from '../../modules/auth/auth.service.js';

export class AuthMiddleware {
    constructor(config) {
        this.authService = new AuthService(undefined, config);
    }

    getAccessToken(req) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }

        const cookies = req.headers.cookie?.split('; ') || [];
        const accessTokenCookie = cookies.find(c => c.startsWith('accessToken='));
        return accessTokenCookie ? accessTokenCookie.split('=')[1] : null;
    }

    getUserId(req) {
        const cookies = req.headers.cookie?.split('; ') || [];
        const userIdCookie = cookies.find(c => c.startsWith('userId='));
        return userIdCookie ? userIdCookie.split('=')[1] : null;
    }

    authenticate() {
        return async (req, res, next) => {
            try {
                const token = this.getAccessToken(req);

                if (!token) {
                    return res.status(401).json({
                        success: false,
                        error: 'Token de autenticação não fornecido',
                        code: 'NO_TOKEN'
                    });
                }

                const decoded = await this.authService.verifyToken(token);

                if (!decoded) {
                    return res.status(401).json({
                        success: false,
                        error: 'Token inválido ou expirado',
                        code: 'INVALID_TOKEN'
                    });
                }

                // Adiciona os dados do usuário decodificados na requisição
                req.user = decoded;
                req.userId = decoded.userId || this.getUserId(req);

                next();
            } catch (error) {
                console.error('Erro na autenticação:', error);
                return res.status(401).json({
                    success: false,
                    error: 'Falha na autenticação',
                    code: 'AUTH_ERROR'
                });
            }
        };
    }

    optionalAuthenticate() {
        return async (req, res, next) => {
            try {
                const token = this.getAccessToken(req);

                if (token) {
                    const decoded = await this.authService.verifyToken(token);
                    if (decoded) {
                        req.user = decoded;
                        req.userId = decoded.userId || this.getUserId(req);
                    }
                }

                next();
            } catch (error) {
                console.warn('Erro na autenticação opcional:', error.message);
                next();
            }
        };
    }

    requireGoogleAuth() {
        return async (req, res, next) => {
            try {
                const userId = req.userId || this.getUserId(req);

                if (!userId) {
                    return res.status(401).json({
                        success: false,
                        error: 'Usuário não identificado',
                        code: 'NO_USER_ID'
                    });
                }

                const isGoogleAuth = await this.authService.checkGoogleAuthentication(userId);

                if (!isGoogleAuth) {
                    return res.status(401).json({
                        success: false,
                        error: 'Autenticação Google não encontrada ou expirada',
                        code: 'GOOGLE_AUTH_REQUIRED',
                        authUrl: '/calendar/auth'
                    });
                }

                next();
            } catch (error) {
                console.error('Erro ao verificar autenticação Google:', error);
                return res.status(500).json({
                    success: false,
                    error: 'Erro ao verificar autenticação Google',
                    code: 'GOOGLE_AUTH_ERROR'
                });
            }
        };
    }
}

export function createAuthMiddleware(config) {
    return new AuthMiddleware(config);
}
