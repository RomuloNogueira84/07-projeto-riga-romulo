const { Pool } = require('pg');

const config = {
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  max: 20, 
  connectionTimeoutMillis: 2000,
  idleTimeoutMillis: 30000
};

const pool = new Pool(config);

pool.on('error', (err) => {
  console.error('⚠️ Erro inesperado no pool do PostgreSQL:', err.message);
});

const connect = async (retries = 5, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS usuarios (
          id SERIAL PRIMARY KEY,
          nome VARCHAR(100) NOT NULL,
          cpf VARCHAR(11) UNIQUE NOT NULL,
          email VARCHAR(100) UNIQUE NOT NULL,
          data_nascimento DATE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ Banco de dados conectado e tabela verificada');
      return;
    } catch (error) {
      console.error(`⚠️ Tentativa ${i+1}/${retries}:`, error.message);
      if (i === retries - 1) throw error;
      await new Promise(res => setTimeout(res, delay));
    }
  }
};

module.exports = { pool, connect };
