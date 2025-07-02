const request = require('supertest');
const app = require('../src/app');

describe('Testes da API de usuários', () => {
  it('Deve responder com status 200 no GET /', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('API Operacional');
  });

  it('Deve rejeitar CPF inválido na criação de usuário', async () => {
    const res = await request(app)
      .post('/api/usuarios')
      .send({
        nome: "Teste",
        cpf: "12345678900",
        email: "teste@teste.com",
        data_nascimento: "2000-01-01"
      });
    
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/CPF inválido/);
  });
});