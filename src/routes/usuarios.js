const express = require('express');
const router = express.Router();
const axios = require('axios');
const { pool } = require('../db');
const usuarioModel = require('../models/usuarios');
const { isValidCPF } = require('../utils/validators');

// Rota POST: Criar um novo usuário
router.post('/', async (req, res) => {
  try {
    const { cpf } = req.body;
    if (!cpf || !isValidCPF(cpf)) {
      return res.status(400).json({ error: 'CPF inválido.' });
    }

    const user = await usuarioModel.createUser(req.body);
    res.status(201).json(user);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: `Conflito: ${err.constraint} já existe.` });
    }
    res.status(400).json({ error: err.message });
  }
});

// Rota GET: Listar todos os usuários
router.get('/', async (req, res) => {
  try {
    const users = await usuarioModel.getUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rota PUT: Atualizar um usuário pelo ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userData = req.body;

    if (userData.cpf && !isValidCPF(userData.cpf)) {
      return res.status(400).json({ error: 'CPF inválido.' });
    }

    const updatedUser = await usuarioModel.updateUser(id, userData);

    if (!updatedUser) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    res.json(updatedUser);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: `Conflito: ${err.constraint} já existe.` });
    }
    res.status(400).json({ error: err.message });
  }
});

// Rota DELETE: Deletar um usuário pelo ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCount = await usuarioModel.deleteUser(id);

    if (deletedCount === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rota POST: Adicionar endereço via ViaCEP
router.post('/:id/enderecos', async (req, res) => {
  const usuario_id = req.params.id;
  const { cep, numero, complemento } = req.body;

  if (!cep || !numero) {
    return res.status(400).json({ error: 'Campos obrigatórios: cep e numero.' });
  }

  try {
    // Verifica se o usuário existe
    const userCheck = await pool.query('SELECT 1 FROM usuarios WHERE id = $1', [usuario_id]);
    if (userCheck.rowCount === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const viaCepResponse = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
    if (viaCepResponse.data.erro) {
      return res.status(404).json({ error: 'CEP não encontrado.' });
    }

    const { logradouro, bairro, localidade, uf } = viaCepResponse.data;

    const query = `
      INSERT INTO enderecos
        (usuario_id, cep, logradouro, numero, complemento, bairro, cidade, estado)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;

    const values = [
      usuario_id,
      cep,
      logradouro,
      numero,
      complemento,
      bairro,
      localidade,
      uf
    ];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('❌ Erro ao cadastrar endereço:', error);
    res.status(500).json({ error: 'Erro interno ao cadastrar endereço.' });
  }
});

// NOVO: Rota GET /usuarios/:id/enderecos — Listar endereços de um usuário
router.get('/:id/enderecos', async (req, res) => {
  const usuario_id = req.params.id;

  try {
    const result = await pool.query(
      'SELECT * FROM enderecos WHERE usuario_id = $1 ORDER BY id ASC;',
      [usuario_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Nenhum endereço encontrado para este usuário.' });
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('❌ Erro ao buscar endereços:', error);
    res.status(500).json({ error: 'Erro interno ao buscar endereços.' });
  }
});
// Rota PUT: Atualizar um endereço de um usuário
router.put('/:usuarioId/enderecos/:enderecoId', async (req, res) => {
  const { usuarioId, enderecoId } = req.params;
  const { cep, numero, complemento } = req.body;

  if (!cep || !numero) {
    return res.status(400).json({ error: 'Campos obrigatórios: cep e numero.' });
  }

  try {
    const enderecoCheck = await pool.query(
      'SELECT * FROM enderecos WHERE id = $1 AND usuario_id = $2;',
      [enderecoId, usuarioId]
    );

    if (enderecoCheck.rowCount === 0) {
      return res.status(404).json({ error: 'Endereço não encontrado para este usuário.' });
    }

    const viaCepResponse = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
    if (viaCepResponse.data.erro) {
      return res.status(404).json({ error: 'CEP não encontrado.' });
    }

    const { logradouro, bairro, localidade, uf } = viaCepResponse.data;

    const updateQuery = `
      UPDATE enderecos
      SET cep = $1,
          logradouro = $2,
          numero = $3,
          complemento = $4,
          bairro = $5,
          cidade = $6,
          estado = $7,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $8 AND usuario_id = $9
      RETURNING *;
    `;

    const values = [
      cep,
      logradouro,
      numero,
      complemento,
      bairro,
      localidade,
      uf,
      enderecoId,
      usuarioId
    ];

    const result = await pool.query(updateQuery, values);
    res.status(200).json(result.rows[0]);

  } catch (error) {
    console.error('❌ Erro ao atualizar endereço:', error);
    res.status(500).json({ error: 'Erro interno ao atualizar endereço.' });
  }
});


// Rota DELETE: Remover um endereço de um usuário
router.delete('/:usuarioId/enderecos/:enderecoId', async (req, res) => {
  const { usuarioId, enderecoId } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM enderecos WHERE id = $1 AND usuario_id = $2 RETURNING *;',
      [enderecoId, usuarioId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Endereço não encontrado para este usuário.' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('❌ Erro ao excluir endereço:', error);
    res.status(500).json({ error: 'Erro interno ao excluir endereço.' });
  }
});


module.exports = router;


