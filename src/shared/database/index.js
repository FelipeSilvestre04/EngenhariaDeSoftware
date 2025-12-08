import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Configuração do pool de conexão
const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
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