const { pool } = require('../db');
const { recordOperation, metrics } = require('../metrics');

const safeDbOperation = async (query, params, operation) => {
  try {
    const start = Date.now();
    const result = await pool.query(query, params);

    recordOperation(operation, 'success');

    // Tempo de execução pode ser usado com outro histogram futuramente
    const duration = Date.now() - start;

    if (metrics?.dbOperations) {
      metrics.dbOperations.inc({
        type: operation,
        table: 'usuarios' // ✅ nome da tabela corrigido
      });
    }

    return result;
  } catch (error) {
    recordOperation(operation, 'error');
    throw error;
  }
};

const createUser = async (user) => {
  const { nome, cpf, email, data_nascimento } = user;
  const query = `
    INSERT INTO usuarios
    (nome, cpf, email, data_nascimento)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const result = await safeDbOperation(
    query,
    [nome, cpf, email, data_nascimento],
    'create'
  );
  return result.rows[0];
};

const getUsers = async () => {
  const result = await safeDbOperation(
    'SELECT * FROM usuarios', // ✅ também corrigido
    [],
    'read'
  );
  return result.rows;
};

module.exports = { createUser, getUsers };