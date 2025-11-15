// fazer bearer token jwt

export class AuthController {
    constructor(authService) {
        this.authService = authService;
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