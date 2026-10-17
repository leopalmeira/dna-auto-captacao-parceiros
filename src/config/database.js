const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

let pgPool = null;
let sqliteDb = null;
let isPostgres = false;

const isTest = process.env.NODE_ENV === 'test';
const dbUrl = process.env.DATABASE_URL;

if (dbUrl && !isTest) {
  isPostgres = true;
  pgPool = new Pool({
    connectionString: dbUrl,
    ssl: dbUrl.includes('localhost') ? false : { rejectUnauthorized: false }
  });
} else {
  // Use node:sqlite
  const { DatabaseSync } = require('node:sqlite');
  const dbPath = isTest ? ':memory:' : path.join(__dirname, '../../data/leads.db');
  if (!isTest) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  sqliteDb = new DatabaseSync(dbPath);
}

async function query(sql, params = []) {
  if (isPostgres) {
    const res = await pgPool.query(sql, params);
    return { rows: res.rows, rowCount: res.rowCount };
  } else {
    // Map $1, $2, etc., to a flattened array of values matching the question marks
    const sqliteParams = [];
    const sqliteSql = sql.replace(/\$(\d+)/g, (_, index) => {
      const idx = parseInt(index, 10) - 1;
      sqliteParams.push(params[idx]);
      return '?';
    });
    
    // Check if query is SELECT or returns rows
    const trimmed = sqliteSql.trim().toUpperCase();
    if (trimmed.startsWith('SELECT') || trimmed.includes('RETURNING')) {
      const stmt = sqliteDb.prepare(sqliteSql);
      const rows = stmt.all(...sqliteParams);
      return { rows, rowCount: rows.length };
    } else {
      const stmt = sqliteDb.prepare(sqliteSql);
      const info = stmt.run(...sqliteParams);
      return { rows: [], rowCount: info.changes };
    }
  }
}

async function initDb() {
  const leadsTableSql = isPostgres ? `
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      nome_responsavel TEXT NOT NULL,
      nome_fantasia TEXT NOT NULL,
      cnpj TEXT NOT NULL UNIQUE,
      cnpj_formatado TEXT NOT NULL,
      whatsapp TEXT NOT NULL,
      whatsapp_formatado TEXT NOT NULL,
      municipio TEXT NOT NULL,
      bairro TEXT NOT NULL,
      tipo_estabelecimento TEXT NOT NULL,
      email TEXT,
      faixa_veiculos TEXT,
      observacoes TEXT,
      status_comercial TEXT NOT NULL DEFAULT 'Novo pré-cadastro',
      consentimento_lgpd INTEGER NOT NULL DEFAULT 1,
      consentimento_promocional INTEGER NOT NULL DEFAULT 0,
      versao_termos TEXT NOT NULL DEFAULT 'v1.0',
      origem_campanha TEXT,
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      utm_content TEXT,
      utm_term TEXT,
      ip_origem TEXT,
      user_agent TEXT,
      data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      data_ultimo_contato TIMESTAMP WITH TIME ZONE,
      data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_leads_cnpj ON leads(cnpj);
    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status_comercial);
    CREATE INDEX IF NOT EXISTS idx_leads_municipio ON leads(municipio);
    CREATE INDEX IF NOT EXISTS idx_leads_data_cadastro ON leads(data_cadastro);

    CREATE TABLE IF NOT EXISTS lead_notas (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      autor TEXT NOT NULL,
      texto TEXT NOT NULL,
      status_anterior TEXT,
      status_novo TEXT,
      data_registro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_lead_notas_lead_id ON lead_notas(lead_id);
  ` : `
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      nome_responsavel TEXT NOT NULL,
      nome_fantasia TEXT NOT NULL,
      cnpj TEXT NOT NULL UNIQUE,
      cnpj_formatado TEXT NOT NULL,
      whatsapp TEXT NOT NULL,
      whatsapp_formatado TEXT NOT NULL,
      municipio TEXT NOT NULL,
      bairro TEXT NOT NULL,
      tipo_estabelecimento TEXT NOT NULL,
      email TEXT,
      faixa_veiculos TEXT,
      observacoes TEXT,
      status_comercial TEXT NOT NULL DEFAULT 'Novo pré-cadastro',
      consentimento_lgpd INTEGER NOT NULL DEFAULT 1,
      consentimento_promocional INTEGER NOT NULL DEFAULT 0,
      versao_termos TEXT NOT NULL DEFAULT 'v1.0',
      origem_campanha TEXT,
      utm_source TEXT,
      utm_medium TEXT,
      utm_campaign TEXT,
      utm_content TEXT,
      utm_term TEXT,
      ip_origem TEXT,
      user_agent TEXT,
      data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
      data_ultimo_contato DATETIME,
      data_atualizacao DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_leads_cnpj ON leads(cnpj);
    CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status_comercial);
    CREATE INDEX IF NOT EXISTS idx_leads_municipio ON leads(municipio);
    CREATE INDEX IF NOT EXISTS idx_leads_data_cadastro ON leads(data_cadastro);

    CREATE TABLE IF NOT EXISTS lead_notas (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      autor TEXT NOT NULL,
      texto TEXT NOT NULL,
      status_anterior TEXT,
      status_novo TEXT,
      data_registro DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_lead_notas_lead_id ON lead_notas(lead_id);
  `;

  if (isPostgres) {
    await pgPool.query(leadsTableSql);
  } else {
    sqliteDb.exec(leadsTableSql);
  }
  console.log(`[Database] Inicializado com sucesso (${isPostgres ? 'PostgreSQL' : 'SQLite'})`);
}

module.exports = {
  query,
  initDb,
  isPostgres: () => isPostgres
};
