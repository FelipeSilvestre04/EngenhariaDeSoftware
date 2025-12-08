import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// DEBUG: Verificar DATABASE_URL
const dbUrl = process.env.DATABASE_URL;
console.log(`🔍 [DB] DATABASE_URL definida: ${dbUrl ? 'Sim' : 'NÃO!'}`);
if (dbUrl) {
    // Mostra apenas o host (oculta senha)
    const match = dbUrl.match(/@([^/]+)/);
    console.log(`🔍 [DB] Host do banco: ${match ? match[1] : 'não identificado'}`);
}

// Configuração do pool de conexão
const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    // SSL sempre ativo para funcionar com Render (exige conexão segura)
    ssl: { rejectUnauthorized: false }
});

// Função auxiliar para logs
pool.on('connect', () => {
    // console.log('Base de Dados conectada com sucesso!');
});

pool.on('error', (err) => {
    console.error('Erro inesperado no cliente ocioso', err);
    process.exit(-1);
});

export const db = {
    query: (text, params) => pool.query(text, params),
};