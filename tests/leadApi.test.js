process.env.NODE_ENV = 'test';
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const { app } = require('../server');
const { initDb } = require('../src/config/database');

let server;
let baseUrl;

before(async () => {
  await initDb();
  await new Promise((resolve) => {
    server = http.createServer(app).listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

describe('API de Leads - /api/leads', () => {
  test('deve rejeitar submissão com dados incompletos ou inválidos', async () => {
    const res = await fetch(`${baseUrl}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome_responsavel: '',
        cnpj: '123'
      })
    });

    const body = await res.json();
    assert.strictEqual(res.status, 400);
    assert.strictEqual(body.sucesso, false);
    assert.ok(body.erros);
    assert.ok(body.erros.nome_responsavel);
    assert.ok(body.erros.cnpj);
    assert.ok(body.erros.whatsapp);
  });

  test('deve cadastrar um novo lead com sucesso', async () => {
    const payload = {
      nome_responsavel: 'Carlos Eduardo da Silva',
      nome_fantasia: 'Auto Center Silva & Filhos',
      cnpj: '11.222.333/0001-81',
      whatsapp: '(21) 99876-5432',
      municipio: 'Rio de Janeiro',
      bairro: 'Barra da Tijuca',
      tipo_estabelecimento: 'Auto center',
      email: 'contato@autocentersilva.com.br',
      faixa_veiculos: 'De 101 a 300',
      observacoes: 'Gostaria de agilizar o retorno de trocas de óleo',
      consentimento_lgpd: true,
      consentimento_promocional: true,
      utm_source: 'instagram',
      utm_campaign: 'oficinas_rj'
    };

    const res = await fetch(`${baseUrl}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const body = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(body.sucesso, true);
    assert.ok(body.protocolo);
    // Não expõe lista nem dados sensíveis de terceiros
    assert.strictEqual(body.leads, undefined);
  });

  test('deve rejeitar cadastro duplicado pelo mesmo CNPJ', async () => {
    const payloadDuplicado = {
      nome_responsavel: 'Carlos Eduardo',
      nome_fantasia: 'Silva & Filhos Filial',
      cnpj: '11222333000181', // Mesmo CNPJ
      whatsapp: '(21) 99999-0000',
      municipio: 'Niterói',
      bairro: 'Icaraí',
      tipo_estabelecimento: 'Oficina mecânica',
      consentimento_lgpd: true
    };

    const res = await fetch(`${baseUrl}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadDuplicado)
    });

    const body = await res.json();
    assert.strictEqual(res.status, 409);
    assert.strictEqual(body.sucesso, false);
    assert.strictEqual(body.duplicado, true);
  });
});
