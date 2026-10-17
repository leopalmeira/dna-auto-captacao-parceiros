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

describe('Rotas e Ativos Estáticos do Frontend', () => {
  test('deve servir a landing page pública com cabeçalhos de segurança e elementos críticos', async () => {
    const res = await fetch(`${baseUrl}/`);
    assert.strictEqual(res.status, 200);
    const html = await res.text();

    assert.ok(html.includes('DNA Auto | Seja uma Oficina Parceira') || html.includes('DNA Auto'));
    assert.ok(html.includes('SUA OFICINA CONECTADA AO FUTURO DA MANUTENÇÃO AUTOMOTIVA') || html.includes('SUA OFICINA CONECTADA'));
    assert.ok(html.includes('id="cadastro"'));
    assert.ok(html.includes('id="como-funciona"'));
    assert.ok(html.includes('id="programa"') || html.includes('id="credenciamento"'));
    assert.ok(html.includes('id="faq"'));
    assert.ok(html.includes('R$ 299'));

    // Verifica cabeçalhos de segurança (Helmet)
    assert.ok(res.headers.get('x-content-type-options'));
  });

  test('deve servir o painel administrativo em /admin', async () => {
    const res = await fetch(`${baseUrl}/admin`);
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('DNA Auto Partner Hub'));
    assert.ok(html.includes('id="loginForm"'));
    assert.ok(html.includes('id="leadsTableBody"'));
  });

  test('deve servir a página de política de privacidade LGPD', async () => {
    const res = await fetch(`${baseUrl}/politica-de-privacidade`);
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('Política de Privacidade e Tratamento de Dados'));
    assert.ok(html.includes('Lei nº 13.709/2018'));
  });

  test('deve servir arquivos estáticos CSS e JS com sucesso', async () => {
    const assets = [
      '/css/styles.css',
      '/css/admin.css',
      '/js/landing.js',
      '/js/admin.js'
    ];

    for (const asset of assets) {
      const res = await fetch(`${baseUrl}${asset}`);
      assert.strictEqual(res.status, 200, `Ativo não encontrado: ${asset}`);
      const text = await res.text();
      assert.ok(text.length > 50, `Ativo vazio: ${asset}`);
    }
  });
});
