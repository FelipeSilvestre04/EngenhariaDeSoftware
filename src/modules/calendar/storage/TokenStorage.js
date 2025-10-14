import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class TokenStorage {
    constructor () {
        this.defaultUserId = 'default';
    }

    async saveTokens(userId = this.defaultUserId, tokens){
        const TOKEN_PATH = path.join(__dirname, `tokens-${userId}.json`);
        await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2));
        console.log(`✅ Tokens salvos para usuário: ${userId}`);
    }

    async loadTokens(userId = this.defaultUserId) {
        const TOKEN_PATH = path.join(__dirname, `tokens-${userId}.json`);
        
        try{
            const data = await fs.readFile(TOKEN_PATH, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') return null;
            throw error;
        }
    }

    async hasTokens(userId = this.defaultUserId) {
        const TOKEN_PATH = path.join(__dirname, `tokens-${userId}.json`);
        try {
            await fs.access(TOKEN_PATH);
            return true;
        } catch {
            return false;
        }
    }

    async deleteTokens(userId = this.defaultUserId){
        const TOKEN_PATH = path.join(__dirname, `tokens-${userId}.json`);

        if (await this.hasTokens(userId)){
            try{
                await fs.unlink(TOKEN_PATH);
                console.log(`✅ Tokens removidos para usuário: ${userId}`);
            } catch (error) {
                throw new Error(`Não foi possível deletar tokens. Erro: ${error.message}`);
            }
        }
    }
}