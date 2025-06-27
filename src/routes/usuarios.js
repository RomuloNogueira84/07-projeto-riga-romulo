const express = require('express');
const router = express.Router();
const usuarioModel = require('../models/usuarios');
const { isValidCPF } = require('../utils/validators'); // Importa o validador

// Rota POST: Criar um novo usuário
router.post('/', async (req, res) => {
  try {
    // VALIDAÇÃO: Verifica se o CPF é válido antes de prosseguir
    const { cpf } = req.body;
    if (!cpf || !isValidCPF(cpf)) {
      return res.status(400).json({ error: 'CPF inválido.' });
    }

    const user = await usuarioModel.createUser(req.body);
    res.status(201).json(user);
  } catch (err) {
    // Trata erros de duplicação (ex: CPF ou email já existem)
    if (err.code === '23505') { // Código de erro do PostgreSQL para unique violation
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

// NOVO - Rota PUT: Atualizar um usuário pelo ID
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userData = req.body;

    // VALIDAÇÃO: Se o CPF estiver sendo atualizado, valida o novo valor
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

// NOVO - Rota DELETE: Deletar um usuário pelo ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCount = await usuarioModel.deleteUser(id);

    if (deletedCount === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // Status 204 (No Content) é a resposta padrão para delete bem-sucedido
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;

