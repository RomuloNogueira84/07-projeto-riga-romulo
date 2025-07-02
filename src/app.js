const express = require('express');
const db = require('./db');
const { metricsMiddleware, metricsEndpoint } = require('./metrics');
const usuarioRoutes = require('./routes/usuarios');

const app = express();

app.use(express.json());
app.use(metricsMiddleware);

app.get('/', (req, res) => res.send('API Operacional'));
app.get('/metrics', metricsEndpoint);
app.use('/api/usuarios', usuarioRoutes); // 👈 já inclui as rotas de endereços

app.use((err, req, res, next) => {
  console.error('🔥 Erro:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

module.exports = app;
