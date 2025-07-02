const app = require('./app');
const db = require('./db');

async function initializeServer() {
  await db.connect();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
  });
}

initializeServer().catch(err => {
  console.error('❌ Falha crítica na inicialização:', err);
  process.exit(1);
});