// fazer bearer token jwt
export class AuthController {
    constructor(authService) {
        this.authService = authService;
    }

    async initiateAuth(req, res) {
        try{
            const authUrl = this.authService.getAuthUrl();
            res.writeHead(302, { 'Location': authUrl });
            res.end();

        } catch (error) {
            console.error("Erro ao iniciar autenticação:", error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Erro interno do servidor' }));
        }
    }

    async handleCallback(req, res) {
        try {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const code = url.searchParams.get('code');

            if (!code) throw new Error("Código de autorização não encontrado.");

            const result = await this.authService.handleOAuthCallback(code);

            if (!result.success) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    error: 'Falha na autenticação OAuth', 
                    message: result.message 
                }));
                return;
            }

            const cookies = [
                `userId=${result.userId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`,
                `accessToken=${result.tokens.accessToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=900`,
                `refreshToken=${result.tokens.refreshToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`
            ];

            const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
            res.writeHead(302, { 
                'Location': clientUrl,
                'Set-Cookie': cookies
            });
            res.end();

        } catch (error) {
            console.error("Erro na autenticação OAuth:", error);
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end(`<h1>Erro na autenticação</h1><p>${error.message}</p>`);
        }
    }
    
    getUserIdFromRequest(req) {
        const cookies = req.headers.cookie?.split('; ') || [];
        const userIdCookie = cookies.find(c => c.startsWith('userId='));
        return userIdCookie ? userIdCookie.split('=')[1] : null;
    }

    getAccessTokenFromRequest(req) {
        const cookies = req.headers.cookie?.split('; ') || [];
        const accessTokenCookie = cookies.find(c => c.startsWith('accessToken='));
        return accessTokenCookie ? accessTokenCookie.split('=')[1] : null;
    }

    async verifyTokenRequest(req, _res) {
        const token = this.getAccessTokenFromRequest(req);
        if (!token) {
            return { valid: false, error: 'Token não fornecido' };
        }

        const decode = await this.authService.verifyToken(token);
        if (!decode) {
            return { valid: false, error: 'Token inválido ou expirado' };
        }
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

            // Limpa os cookies
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