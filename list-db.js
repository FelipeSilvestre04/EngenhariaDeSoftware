// Script para listar tabelas e funções do banco
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function listDatabase() {
    console.log('🔍 Conectando ao banco...');
    const client = await pool.connect();

    try {
        // Listar tabelas
        console.log('\n📋 TABELAS:');
        const tables = await client.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        tables.rows.forEach(r => console.log(`  - ${r.table_name}`));

        // Listar funções
        console.log('\n📋 FUNÇÕES:');
        const functions = await client.query(`
            SELECT routine_name FROM information_schema.routines 
            WHERE routine_schema = 'public' 
            ORDER BY routine_name
        `);
        functions.rows.forEach(r => console.log(`  - ${r.routine_name}`));

        // Listar triggers
        console.log('\n📋 TRIGGERS:');
        const triggers = await client.query(`
            SELECT trigger_name, event_object_table 
            FROM information_schema.triggers 
            WHERE trigger_schema = 'public'
        `);
        triggers.rows.forEach(r => console.log(`  - ${r.trigger_name} (tabela: ${r.event_object_table})`));

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

listDatabase();
