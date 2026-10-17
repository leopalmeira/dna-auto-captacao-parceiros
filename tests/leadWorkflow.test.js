process.env.NODE_ENV = 'test';
process.env.ADMIN_USERNAME = 'admin_workflow';
process.env.ADMIN_PASSWORD = 'workflow_password_2026';

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const { app } = require('../server');
const { initDb } = require('../src/config/database');

let server;
let baseUrl;
let adminToken;

before(async () => {
  await initDb();
  await new Promise((resolve) => {
    server = http.createServer(app).listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });

  // Login admin para obter token
  const res = await fetch(`${baseUrl}/admin/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin_workflow',
      password: 'workflow_password_2026'
    })
  });
  const data = await res.json();
  adminToken = data.token;
});

after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

describe('Fluxo Comercial Completo do Lead', () => {
  let createdLeadId;

  test('deve registrar um novo lead com parâmetros UTM completos', async () => {
    const cnpj = '33.000.167/0001-01'; // Petrobras (CNPJ válido de teste)
    const payload = {
      nome_responsavel: 'Marcos Vinicius Pereira',
      nome_fantasia: 'Centro Automotivo Estrela da Barra',
      cnpj: cnpj,
      whatsapp: '(21) 98765-4321',
      municipio: 'Rio de Janeiro',
      bairro: 'Barra da Tijuca',
      tipo_estabelecimento: 'Centro automotivo especializado',
      email: 'marcos@estreladabarra.com.br',
      faixa_veiculos: 'De 101 a 300',
      observacoes: 'Temos interesse imediato na formação da rede no RJ',
      consentimento_lgpd: true,
      consentimento_promocional: false,
      utm_source: 'google_ads',
      utm_medium: 'cpc',
      utm_campaign: 'oficinas_barra_da_tijuca',
      utm_content: 'anuncio_troca_oleo'
    };

    const res = await fetch(`${baseUrl}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.sucesso, true);
    assert.ok(body.protocolo);
  });

  test('deve encontrar o lead recém-criado na listagem administrativa e filtrar por busca', async () => {
    const res = await fetch(`${baseUrl}/admin/api/leads?busca=Estrela`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.sucesso, true);
    assert.ok(body.leads.length >= 1);

    const lead = body.leads.find(l => l.nome_fantasia === 'Centro Automotivo Estrela da Barra');
    assert.ok(lead);
    assert.strictEqual(lead.status_comercial, 'Novo pré-cadastro');
    createdLeadId = lead.id;
  });

  test('deve consultar os detalhes completos do lead e verificar registro de UTMs', async () => {
    assert.ok(createdLeadId);
    const res = await fetch(`${baseUrl}/admin/api/leads/${createdLeadId}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.sucesso, true);
    assert.strictEqual(body.lead.utm_source, 'google_ads');
    assert.strictEqual(body.lead.utm_campaign, 'oficinas_barra_da_tijuca');
  });

  test('deve atualizar o status comercial para "Em contato" com nota de auditoria', async () => {
    const res = await fetch(`${baseUrl}/admin/api/leads/${createdLeadId}/status`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        novoStatus: 'Em contato',
        nota: 'Primeiro contato realizado via WhatsApp com o responsável Marcos.'
      })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.sucesso, true);
    assert.strictEqual(body.lead.status_comercial, 'Em contato');
  });

  test('deve adicionar uma anotação de histórico comercial', async () => {
    const res = await fetch(`${baseUrl}/admin/api/leads/${createdLeadId}/notas`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        texto: 'Responsável solicitou apresentação detalhada para segunda-feira às 14h.'
      })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.sucesso, true);

    // Verifica se histórico contém a nota
    const resDetalhes = await fetch(`${baseUrl}/admin/api/leads/${createdLeadId}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const bodyDetalhes = await resDetalhes.json();
    assert.ok(bodyDetalhes.historico.length >= 2);
  });
});
