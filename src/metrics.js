const client = require('prom-client');

// Registro centralizado
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Histogram para medir duração de requisições HTTP
const httpRequests = new client.Histogram({
  name: 'http_requests_duration_seconds',
  help: 'Duração das requisições HTTP em segundos',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

// Factory para criar contadores
const createCounter = (name, help, labelNames) => {
  return new client.Counter({
    name,
    help,
    labelNames,
    registers: [register],
  });
};

// Métricas globais
const metrics = {
  httpRequests, // Agora é um Histogram!
  userOperations: createCounter(
    'user_operations_total',
    'Total de operações CRUD de usuários',
    ['operation', 'status']
  ),
  dbOperations: createCounter(
    'db_operations_total',
    'Operações no banco de dados',
    ['type', 'table']
  ),
};

// Middleware de tracking de requests
const metricsMiddleware = (req, res, next) => {
  const end = metrics.httpRequests.startTimer();

  res.on('finish', () => {
    const route = req.route?.path || req.baseUrl || 'unknown';
    end({
      method: req.method,
      route,
      status: res.statusCode,
    });
  });

  next();
};

// Endpoint de métricas
const metricsEndpoint = async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error.message);
  }
};

// API segura para operações
const recordOperation = (operation, status = 'success') => {
  if (metrics.userOperations) {
    metrics.userOperations.inc({ operation, status });
  }
};

module.exports = {
  metricsMiddleware,
  metricsEndpoint,
  recordOperation,
  metrics
};