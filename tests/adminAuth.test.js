process.env.NODE_ENV = 'test';
process.env.ADMIN_USERNAME = 'testadmin';
process.env.ADMIN_PASSWORD = 'supersecretpass2026';
process.env.INTEGRATION_API_KEY = 'test_integration_token';

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

describe('Painel Administrativo - Segurança e Gestão', () => {
  let adminToken = '';
  let cookieHeader = '';

  test('deve bloquear acesso não autenticado a rotas administrativas', async () => {
    const res = await fetch(`${baseUrl}/admin/api/leads`);
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.sucesso, false);
  });

  test('deve rejeitar credenciais incorretas no login', async () => {
    const res = await fetch(`${baseUrl}/admin/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testadmin',
        password: 'wrong_password'
      })
    });

    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.sucesso, false);
  });

  test('deve permitir login com credenciais válidas e retornar token/cookie', async () => {
    const res = await fetch(`${baseUrl}/admin/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testadmin',
        password: 'supersecretpass2026'
      })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.sucesso, true);
    assert.ok(body.token);
    adminToken = body.token;

    const rawCookies = res.headers.get('set-cookie');
    assert.ok(rawCookies);
    cookieHeader = rawCookies.split(';')[0];
  });

  test('deve permitir consultar leads com autenticação via Cookie ou Bearer Token', async () => {
    const res = await fetch(`${baseUrl}/admin/api/leads`, {
      headers: {
        'Cookie': cookieHeader,
        'Authorization': `Bearer ${adminToken}`
      }
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.sucesso, true);
    assert.ok(Array.isArray(body.leads));
  });

  test('deve carregar métricas do dashboard', async () => {
    const res = await fetch(`${baseUrl}/admin/api/dashboard`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.sucesso, true);
    assert.ok(body.metricas);
    assert.strictEqual(typeof body.metricas.total, 'number');
  });

  test('deve exportar CSV de leads', async () => {
    const res = await fetch(`${baseUrl}/admin/api/export/csv`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    assert.strictEqual(res.status, 200);
    const contentType = res.headers.get('content-type');
    assert.ok(contentType.includes('text/csv'));
    const text = await res.text();
    assert.ok(text.includes('Responsavel;Nome Fantasia;CNPJ'));
  });

  test('deve validar acesso à API de integração futura com chave segura', async () => {
    // 1. Sem token -> 401
    const resSemToken = await fetch(`${baseUrl}/api/integration/leads`);
    assert.strictEqual(resSemToken.status, 401);

    // 2. Com token correto -> 200
    const resComToken = await fetch(`${baseUrl}/api/integration/leads`, {
      headers: { 'Authorization': 'Bearer test_integration_token' }
    });
    assert.strictEqual(resComToken.status, 200);
    const body = await resComToken.json();
    assert.strictEqual(body.sucesso, true);
  });
});
