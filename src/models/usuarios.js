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
        table: 'usuarios'
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
    'SELECT * FROM usuarios ORDER BY id ASC', // Adicionado ORDER BY para consistência
    [],
    'read'
  );
  return result.rows;
};

// NOVO: Função para atualizar um usuário
const updateUser = async (id, userData) => {
  const fields = Object.keys(userData);
  const values = Object.values(userData);

  // Impede a execução se não houver dados para atualizar
  if (fields.length === 0) {
    throw new Error("Nenhum dado fornecido para atualização.");
  }

  // Monta a parte SET da query dinamicamente
  const setClause = fields
    .map((field, index) => `"${field}" = $${index + 1}`)
    .join(', ');

  const query = `
    UPDATE usuarios
    SET ${setClause}, updated_at = CURRENT_TIMESTAMP
    WHERE id = $${fields.length + 1}
    RETURNING *
  `;

  const params = [...values, id];
  const result = await safeDbOperation(query, params, 'update');

  // Retorna o usuário atualizado ou null se não for encontrado
  return result.rows[0] || null;
};

// NOVO: Função para deletar um usuário
const deleteUser = async (id) => {
  const query = 'DELETE FROM usuarios WHERE id = $1';
  const result = await safeDbOperation(query, [id], 'delete');
  // Retorna o número de linhas afetadas (0 ou 1)
  return result.rowCount;
};


module.exports = {
  createUser,
  getUsers,
  updateUser, // Exporta a nova função
  deleteUser  // Exporta a nova função
};