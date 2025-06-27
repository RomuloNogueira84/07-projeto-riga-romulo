const express = require('express');
const app = express();
const db = require('./db');
const {
  metricsMiddleware,
  metricsEndpoint
} = require('./metrics');
const usuarioRoutes = require('./routes/usuarios');

async function initializeServer() {
  await db.connect();
  console.log('✅ Conectado ao banco de dados');

  app.use(express.json());
  app.use(metricsMiddleware);

  app.get('/', (req, res) => res.send('API Operacional'));
  app.get('/metrics', metricsEndpoint);
  app.use('/api/usuarios', usuarioRoutes);

  app.use((err, req, res, next) => {
    console.error('🔥 Erro:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
  });
}

initializeServer().catch(err => {
  console.error('❌ Falha crítica na inicialização:', err);
  process.exit(1);
});