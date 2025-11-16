// fazer bearer token jwt
import crypto from 'crypto';
export class AuthController {
    constructor(authService) {
        this.authService = authService;
    }

    async initiateAuth(req, res) {
        try{
            const authUrl = this.authService.getAuthenticationUrl();
            res.writeHead(302, { Location: authUrl });
            res.end();
        } catch(error) {
            res.writeHead(500, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({ error: "Erro ao iniciar autenticação", message: error.message }));
        }
    }
    
    async handleCallback(req, res) {
        try {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const code = url.searchParams.get('code');

            if (!code) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Código de autorização não fornecido' }));
                return;
            }

            const response = await this.authService.handleOauthCallback(code);
            if (!response.success){
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Falha na autenticação' }));
                return;
            }

            const userId = crypto.randomUUID();
            const tokens = await this.authService.generateTokenPair({ userId });

            // Define o cookie com o userId 
            const cookieOptions = [
                `token=${tokens.accessToken}`,
                'Path=/',
                'HttpOnly',
                'SameSite=Lax',
                'Max-Age=2592000' // 30 dias
            ].join('; ');

            // Redireciona de volta para a aplicação React após a autenticação
            res.writeHead(200, { 'Content-Type': 'application/json' , 'Set-Cookie': cookieOptions });
            res.end(JSON.stringify(tokens));
                
            
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end(`<h1>Erro na autenticação</h1><p>${error.message}</p>`);
        }
    }

    async authenticate(req, res) {
        try {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const token = url.searchParams.get('token');

            if (!token) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Token não fornecido' }));
                return;
            }

            const isValid = await this.authService.verifyToken(token);

            if (isValid) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ authenticated: true }));
            } else {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ authenticated: false }));
            }
        } catch (error) {
            console.error("Erro na autenticação:", error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Erro interno do servidor' }));
        }
    }

    async generateTokenPair(req, res) {
        try {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });

            req.on('end', async () => {
                try {
                    const data = JSON.parse(body);
                    const payload = data.payload || {};

                    const tokens = await this.authService.generateTokenPair(payload);

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(tokens));
                } catch (error) {
                    console.error("Erro ao gerar par de tokens:", error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Erro ao gerar par de tokens' }));
                }
            });
        } catch (error) {
            console.error("Erro no servidor:", error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Erro interno do servidor' }));
        }
    }

    async generateToken(req, res) {
        try {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });

            req.on('end', async () => {
                try {
                    const data = JSON.parse(body);
                    const payload = data.payload || {};
                    const expiresIn = data.expiresIn || '1h';

                    const token = await this.authService.generateToken(payload, expiresIn);

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ token }));
                } catch (error) {
                    console.error("Erro ao gerar token:", error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Erro ao gerar token' }));
                }
            });
        } catch (error) {
            console.error("Erro no servidor:", error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Erro interno do servidor' }));
        }
    }

    async decodeToken(req, res) {
        try {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            
            req.on('end', async () => {
                try {
                    const data = JSON.parse(body);
                    const token = data.token;
                    if (!token) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Token não fornecido' }));
                        return;
                    }

                    const decoded = await this.authService.decodeToken(token);

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ decoded }));
                } catch (error) {
                    console.error("Erro ao decodificar token:", error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Erro ao decodificar token' }));
                }
            });
        } catch (error) {
            console.error("Erro no servidor:", error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Erro interno do servidor' }));
        }
    }

    async refreshToken(req, res) {
        try {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });

            req.on('end', async () => {
                try {
                    const data = JSON.parse(body);
                    const refreshToken = data.refreshToken;
                    
                    if (!refreshToken) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Refresh token não fornecido' }));
                        return;
                    }

                    const tokens = await this.authService.refreshAccessToken(refreshToken);

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(tokens));
                } catch (error) {
                    console.error("Erro ao atualizar token:", error);
                    res.writeHead(401, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        error: 'Refresh token inválido ou expirado',
                        message: error.message 
                    }));
                }
            });
        } catch (error) {
            console.error("Erro no servidor:", error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Erro interno do servidor' }));
        }
    }

    async verifyToken(req, res) {
        try {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });

            req.on('end', async () => {
                try {
                    const data = JSON.parse(body);
                    const token = data.token;
                    
                    if (!token) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Token não fornecido' }));
                        return;
                    }

                    const decoded = await this.authService.verifyToken(token);

                    if (decoded) {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ 
                            valid: true, 
                            decoded 
                        }));
                    } else {
                        res.writeHead(401, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ 
                            valid: false,
                            error: 'Token inválido ou expirado' 
                        }));
                    }
                } catch (error) {
                    console.error("Erro ao verificar token:", error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Erro ao verificar token' }));
                }
            });
        } catch (error) {
            console.error("Erro no servidor:", error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Erro interno do servidor' }));
        }
    }
}