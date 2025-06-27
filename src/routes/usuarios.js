const express = require('express');
const router = express.Router();
const usuarioModel = require('../models/usuarios');

router.post('/', async (req, res) => {
  try {
    const user = await usuarioModel.createUser(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const users = await usuarioModel.getUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

