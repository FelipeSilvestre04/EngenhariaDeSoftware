// fazer bearer token jwt
export class AuthController {
    constructor(authService) {
        this.authService = authService;
    }

    async initiateAuth(req, res) {
        try {
            const authUrl = this.authService.getAuthUrl();
            res.redirect(authUrl);
        } catch (error) {
            console.error("Erro ao iniciar autenticação:", error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    async handleCallback(req, res) {
        try {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const code = url.searchParams.get('code');

            if (!code) throw new Error("Código de autorização não encontrado.");

            console.log("🟢 Callback recebido, código:", code.substring(0, 10) + "...");
            const result = await this.authService.handleOAuthCallback(code);
            console.log("🟢 Result success:", result.success);

            if (!result.success) {
                console.error("🔴 Falha na autenticação:", result.message);
                return res.status(500).json({
                    error: 'Falha na autenticação OAuth',
                    message: result.message
                });
            }

            console.log("🟢 Definindo cookies...");
            console.log("🟢 AccessToken length:", result.tokens?.accessToken?.length);
            console.log("🟢 RefreshToken length:", result.tokens?.refreshToken?.length);

            // Usar res.cookie() do Express em vez de res.setHeader()
            res.cookie('userId', result.userId, {
                path: '/',
                httpOnly: true,
                sameSite: 'lax',
                maxAge: 604800000 // 7 dias em ms
            });

            res.cookie('accessToken', result.tokens.accessToken, {
                path: '/',
                httpOnly: true,
                sameSite: 'lax',
                maxAge: 900000 // 15 minutos em ms
            });

            res.cookie('refreshToken', result.tokens.refreshToken, {
                path: '/',
                httpOnly: true,
                sameSite: 'lax',
                maxAge: 604800000 // 7 dias em ms
            });

            const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
            console.log("🟢 Redirecionando para:", clientUrl);

            // Usar res.redirect() do Express
            res.redirect(clientUrl);

        } catch (error) {
            console.error("🔴 Erro na autenticação OAuth:", error);
            res.status(500).send(`<h1>Erro na autenticação</h1><p>${error.message}</p>`);
        }
    }

    getUserIdFromRequest(req) {
        // Express já parseia cookies com cookie-parser
        return req.cookies?.userId || null;
    }

    getAccessTokenFromRequest(req) {
        // Express já parseia cookies com cookie-parser
        return req.cookies?.accessToken || null;
    }

    async verifyTokenRequest(req, _res) {
        console.log("--- Verificando Token na Requisição ---");
        console.log("Headers Cookie:", req.headers.cookie);
        console.log("Parsed Cookies:", req.cookies);

        const token = this.getAccessTokenFromRequest(req);
        console.log("Token extraído:", token ? "Sim (oculto)" : "Não encontrado");

        if (!token) {
            console.log("❌ Token não fornecido");
            return { valid: false, error: 'Token não fornecido' };
        }

        const decode = await this.authService.verifyToken(token);
        if (!decode) {
            console.log("❌ Token inválido ou expirado");
            return { valid: false, error: 'Token inválido ou expirado' };
        }

        console.log("✅ Token válido para usuário:", decode.email);
        return { authenticated: true, decoded: decode };
    }

    async decodeToken(req, res) {
        try {
            const { token } = req.body;
            if (!token) {
                return res.status(400).json({ error: 'Token não fornecido' });
            }

            const decoded = await this.authService.decodeToken(token);
            return res.status(200).json({ decoded });
        } catch (error) {
            console.error("Erro ao decodificar token:", error);
            return res.status(500).json({ error: 'Erro ao decodificar token' });
        }
    }

    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({ error: 'Refresh token não fornecido' });
            }

            const tokens = await this.authService.refreshAccessToken(refreshToken);
            return res.status(200).json(tokens);
        } catch (error) {
            console.error("Erro ao atualizar token:", error);
            return res.status(401).json({
                error: 'Refresh token inválido ou expirado',
                message: error.message
            });
        }
    }

    async verifyToken(req, res) {
        try {
            const token = req.body.token || req.query.token;

            if (!token) {
                return res.status(400).json({ error: 'Token não fornecido' });
            }

            const decoded = await this.authService.verifyToken(token);

            if (decoded) {
                return res.status(200).json({
                    valid: true,
                    decoded
                });
            } else {
                return res.status(401).json({
                    valid: false,
                    error: 'Token inválido ou expirado'
                });
            }
        } catch (error) {
            console.error("Erro ao verificar token:", error);
            return res.status(500).json({ error: 'Erro ao verificar token' });
        }
    }

    async logout(req, res) {
        try {
            const userId = this.getUserIdFromRequest(req);

            if (!userId) {
                return res.status(400).json({ error: 'Usuário não autenticado' });
            }

            // Remove tokens do Google armazenados
            await this.authService.logout(userId);

            // Limpa os cookies usando Express
            res.clearCookie('userId', { path: '/' });
            res.clearCookie('accessToken', { path: '/' });
            res.clearCookie('refreshToken', { path: '/' });

            return res.status(200).json({
                success: true,
                message: 'Logout realizado com sucesso'
            });
        } catch (error) {
            return res.status(500).json({
                error: 'Erro ao fazer logout',
                message: error.message
            });
        }
    }
}