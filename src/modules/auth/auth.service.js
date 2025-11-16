import 'dotenv/config';
import jwt from 'jsonwebtoken';

export class AuthService {
    constructor(jwtLibrary = jwt) {
        this.jwtLibrary = jwtLibrary;
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

    async generateToken(payload, expiresIn = '15m') {
        try {
            const token = await this.jwtLibrary.sign(payload, process.env.JWT_SECRET, { expiresIn });
            return token;
        } catch (error) {
            console.error("Erro ao gerar token:", error);
            throw new Error("Não foi possível gerar o token");
        }
    }

    async generateRefreshToken(payload, expiresIn = '7d') {
        try {
            const refreshToken = await this.jwtLibrary.sign({...payload, type: 'refresh'},
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
            if (payload.password) {
                delete payload.password;
            }
            
            const accessToken = await this.generateToken(payload, '15m');
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

    async refreshToken(token) {
        try {
            const decoded = await this.verifyToken(token);
            if (!decoded) {
                throw new Error("Token inválido ou expirado");
            }

            const {type, ...payload} = decoded;
            if (type !== 'refresh') {
                throw new Error("Token fornecido não é um refresh token");
            }

            return await this.generateTokenPair(payload);

        } catch (error) {
            console.error("Erro ao atualizar token:", error);
            throw new Error("Não foi possível atualizar o token");
        }
    }
}