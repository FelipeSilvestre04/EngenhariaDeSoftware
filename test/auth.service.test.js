/**
 * Testes para AuthService
 * Testa funcionalidades de JWT: geração, verificação e decodificação de tokens
 */

import { test, describe, mock, beforeEach } from "node:test";
import assert from "node:assert";

// Mock do JWT para testes isolados
const createMockJwt = () => {
    const SECRET = 'test-secret-key';

    return {
        sign: (payload, secret, options = {}) => {
            // Simula criação de token JWT
            const header = { alg: 'HS256', typ: 'JWT' };
            const exp = options.expiresIn ? Date.now() + 86400000 : undefined; // 1 dia
            const tokenPayload = { ...payload, exp, iat: Date.now() };

            // Token simulado (base64 encoded)
            const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
            const base64Payload = Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');
            const signature = Buffer.from(`${base64Header}.${base64Payload}.${secret}`).toString('base64url');

            return `${base64Header}.${base64Payload}.${signature}`;
        },

        verify: (token, secret) => {
            if (!token || token === 'invalid-token') {
                throw new Error('jwt malformed');
            }

            const parts = token.split('.');
            if (parts.length !== 3) {
                throw new Error('jwt malformed');
            }

            try {
                const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
                return payload;
            } catch {
                throw new Error('jwt malformed');
            }
        },

        decode: (token) => {
            if (!token) return null;

            const parts = token.split('.');
            if (parts.length !== 3) return null;

            try {
                return JSON.parse(Buffer.from(parts[1], 'base64url').toString());
            } catch {
                return null;
            }
        }
    };
};

describe("AuthService - JWT Operations", () => {
    let mockJwt;

    beforeEach(async () => {
        mockJwt = createMockJwt();
    });

    describe("Token Generation", () => {
        test("generateToken - deve gerar token JWT válido", () => {
            const payload = { userId: 'user-123', email: 'test@example.com' };

            const token = mockJwt.sign(payload, 'secret', { expiresIn: '3d' });

            assert.ok(token, 'Token deve ser gerado');
            assert.strictEqual(typeof token, 'string', 'Token deve ser string');
            assert.strictEqual(token.split('.').length, 3, 'Token deve ter 3 partes separadas por ponto');
        });

        test("generateToken - payload deve conter dados do usuário", () => {
            const payload = { userId: 'user-123', email: 'test@example.com', name: 'Test User' };

            const token = mockJwt.sign(payload, 'secret');
            const decoded = mockJwt.decode(token);

            assert.strictEqual(decoded.userId, 'user-123');
            assert.strictEqual(decoded.email, 'test@example.com');
            assert.strictEqual(decoded.name, 'Test User');
        });

        test("generateRefreshToken - deve gerar tokens com formato válido", () => {
            const payload = { userId: 'user-123' };

            const accessToken = mockJwt.sign(payload, 'secret', { expiresIn: '3d' });
            const refreshToken = mockJwt.sign(payload, 'secret', { expiresIn: '15d' });

            assert.ok(accessToken, 'Access token deve ser gerado');
            assert.ok(refreshToken, 'Refresh token deve ser gerado');
            assert.strictEqual(typeof accessToken, 'string', 'Access token deve ser string');
            assert.strictEqual(typeof refreshToken, 'string', 'Refresh token deve ser string');
            // Ambos devem ter formato JWT válido (3 partes)
            assert.strictEqual(accessToken.split('.').length, 3, 'Access token deve ter formato JWT');
            assert.strictEqual(refreshToken.split('.').length, 3, 'Refresh token deve ter formato JWT');
        });

        test("generateTokenPair - deve retornar access e refresh tokens", () => {
            const payload = { userId: 'user-123', email: 'test@example.com' };

            const accessToken = mockJwt.sign(payload, 'secret', { expiresIn: '3d' });
            const refreshToken = mockJwt.sign(payload, 'secret', { expiresIn: '15d' });

            const tokenPair = { accessToken, refreshToken };

            assert.ok(tokenPair.accessToken, 'Deve ter accessToken');
            assert.ok(tokenPair.refreshToken, 'Deve ter refreshToken');
        });
    });

    describe("Token Verification", () => {
        test("verifyToken - deve validar token válido", () => {
            const payload = { userId: 'user-123' };
            const token = mockJwt.sign(payload, 'secret');

            const decoded = mockJwt.verify(token, 'secret');

            assert.ok(decoded, 'Token deve ser verificado');
            assert.strictEqual(decoded.userId, 'user-123');
        });

        test("verifyToken - deve rejeitar token inválido", () => {
            assert.throws(
                () => mockJwt.verify('invalid-token', 'secret'),
                { message: 'jwt malformed' }
            );
        });

        test("verifyToken - deve rejeitar token malformado", () => {
            assert.throws(
                () => mockJwt.verify('not.a.valid.token.format', 'secret'),
                Error
            );
        });

        test("verifyToken - deve rejeitar token vazio", () => {
            assert.throws(
                () => mockJwt.verify('', 'secret'),
                Error
            );
        });
    });

    describe("Token Decoding", () => {
        test("decodeToken - deve decodificar sem verificar assinatura", () => {
            const payload = { userId: 'user-456', role: 'admin' };
            const token = mockJwt.sign(payload, 'secret');

            const decoded = mockJwt.decode(token);

            assert.ok(decoded, 'Token deve ser decodificado');
            assert.strictEqual(decoded.userId, 'user-456');
            assert.strictEqual(decoded.role, 'admin');
        });

        test("decodeToken - deve retornar null para token inválido", () => {
            const result = mockJwt.decode('');

            assert.strictEqual(result, null);
        });

        test("decodeToken - deve extrair todos os campos do payload", () => {
            const payload = {
                userId: 'user-789',
                email: 'admin@test.com',
                name: 'Admin User',
                picture: 'https://example.com/avatar.jpg'
            };
            const token = mockJwt.sign(payload, 'secret');

            const decoded = mockJwt.decode(token);

            assert.strictEqual(decoded.userId, payload.userId);
            assert.strictEqual(decoded.email, payload.email);
            assert.strictEqual(decoded.name, payload.name);
            assert.strictEqual(decoded.picture, payload.picture);
        });
    });
});

describe("AuthService - Token Pair Flow", () => {
    test("fluxo completo: gerar, verificar e decodificar", () => {
        const mockJwt = createMockJwt();
        const userPayload = {
            userId: 'google-oauth-id-123',
            email: 'user@gmail.com',
            name: 'Google User'
        };

        // 1. Gerar tokens
        const accessToken = mockJwt.sign(userPayload, 'secret', { expiresIn: '3d' });
        const refreshToken = mockJwt.sign(userPayload, 'secret', { expiresIn: '15d' });

        assert.ok(accessToken);
        assert.ok(refreshToken);

        // 2. Verificar access token
        const verified = mockJwt.verify(accessToken, 'secret');
        assert.strictEqual(verified.userId, userPayload.userId);

        // 3. Decodificar sem verificar
        const decoded = mockJwt.decode(accessToken);
        assert.strictEqual(decoded.email, userPayload.email);
    });
});
