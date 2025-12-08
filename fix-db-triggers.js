// Script para corrigir triggers com aspas erradas no banco PostgreSQL Render
// Execute com: node fix-db-triggers.js

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function fixTriggers() {
    console.log('🔧 Conectando ao banco de dados Render...');

    const client = await pool.connect();

    try {
        console.log('✅ Conectado! Corrigindo triggers...\n');

        // 1. Dropar a função antiga
        console.log('📌 Removendo função antiga setup_beforeinsertuser...');
        await client.query(`
            DROP FUNCTION IF EXISTS setup_beforeinsertuser() CASCADE;
        `);
        console.log('✅ Função removida\n');

        // 2. Recriar com aspas corretas
        console.log('📌 Recriando função com aspas corretas...');
        await client.query(`
            CREATE OR REPLACE FUNCTION setup_beforeinsertuser()
            RETURNS trigger AS $$
            BEGIN
                INSERT INTO Project("User_ID", "Name", "Color") 
                VALUES (NEW."User_ID", 'Projeto_Fantasma', 'ffffff');
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);
        console.log('✅ Função criada\n');

        // 3. Recriar a trigger
        console.log('📌 Recriando trigger...');
        await client.query(`
            DROP TRIGGER IF EXISTS setup_beforeinsertuser ON "Usuario";
            CREATE TRIGGER setup_beforeinsertuser
            BEFORE INSERT ON "Usuario"
            FOR EACH ROW EXECUTE FUNCTION setup_beforeinsertuser();
        `);
        console.log('✅ Trigger criada\n');

        console.log('🎉 CORREÇÃO CONCLUÍDA COM SUCESSO!');
        console.log('Agora tente fazer login novamente.\n');

    } catch (error) {
        console.error('❌ Erro ao corrigir:', error.message);
        console.error('Detalhes:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

fixTriggers();
