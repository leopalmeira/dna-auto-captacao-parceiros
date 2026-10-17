const { query } = require('../config/database');
const crypto = require('crypto');

class LeadModel {
  static async criar(dados) {
    const id = crypto.randomUUID();
    const sql = `
      INSERT INTO leads (
        id, nome_responsavel, nome_fantasia, cnpj, cnpj_formatado,
        whatsapp, whatsapp_formatado, municipio, bairro, tipo_estabelecimento,
        email, faixa_veiculos, observacoes, status_comercial,
        consentimento_lgpd, consentimento_promocional, versao_termos,
        origem_campanha, utm_source, utm_medium, utm_campaign, utm_content, utm_term,
        ip_origem, user_agent
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14,
        $15, $16, $17,
        $18, $19, $20, $21, $22, $23,
        $24, $25
      ) RETURNING *;
    `;

    const params = [
      id,
      dados.nome_responsavel,
      dados.nome_fantasia,
      dados.cnpj,
      dados.cnpj_formatado,
      dados.whatsapp,
      dados.whatsapp_formatado,
      dados.municipio,
      dados.bairro,
      dados.tipo_estabelecimento,
      dados.email || null,
      dados.faixa_veiculos || null,
      dados.observacoes || null,
      'Novo pré-cadastro',
      dados.consentimento_lgpd ? 1 : 0,
      dados.consentimento_promocional ? 1 : 0,
      dados.versao_termos || 'v1.0',
      dados.origem_campanha || null,
      dados.utm_source || null,
      dados.utm_medium || null,
      dados.utm_campaign || null,
      dados.utm_content || null,
      dados.utm_term || null,
      dados.ip_origem || null,
      dados.user_agent || null
    ];

    const result = await query(sql, params);
    return result.rows[0];
  }

  static async buscarPorCNPJ(cnpjNormalizado) {
    const sql = 'SELECT * FROM leads WHERE cnpj = $1 LIMIT 1;';
    const result = await query(sql, [cnpjNormalizado]);
    return result.rows[0] || null;
  }

  static async buscarPorId(id) {
    const sql = 'SELECT * FROM leads WHERE id = $1 LIMIT 1;';
    const result = await query(sql, [id]);
    return result.rows[0] || null;
  }

  static async listarComFiltros({ busca, status, municipio, bairro, dataInicio, dataFim, limite = 50, offset = 0 }) {
    let where = [];
    let params = [];
    let paramIndex = 1;

    if (busca) {
      where.push(`(cnpj LIKE $${paramIndex} OR LOWER(nome_fantasia) LIKE LOWER($${paramIndex}) OR LOWER(nome_responsavel) LIKE LOWER($${paramIndex}))`);
      params.push(`%${busca}%`);
      paramIndex++;
    }

    if (status && status !== 'todos') {
      where.push(`status_comercial = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (municipio && municipio !== 'todos') {
      where.push(`LOWER(municipio) = LOWER($${paramIndex})`);
      params.push(municipio);
      paramIndex++;
    }

    if (bairro) {
      where.push(`LOWER(bairro) LIKE LOWER($${paramIndex})`);
      params.push(`%${bairro}%`);
      paramIndex++;
    }

    if (dataInicio) {
      where.push(`data_cadastro >= $${paramIndex}`);
      params.push(dataInicio);
      paramIndex++;
    }

    if (dataFim) {
      where.push(`data_cadastro <= $${paramIndex}`);
      params.push(dataFim + ' 23:59:59');
      paramIndex++;
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';

    const countSql = `SELECT COUNT(*) as total FROM leads ${whereClause};`;
    const countRes = await query(countSql, params);
    const total = parseInt(countRes.rows[0].total, 10);

    const listSql = `
      SELECT id, nome_responsavel, nome_fantasia, cnpj_formatado, whatsapp_formatado,
             municipio, bairro, tipo_estabelecimento, email, faixa_veiculos,
             status_comercial, origem_campanha, utm_source, data_cadastro, data_ultimo_contato
      FROM leads
      ${whereClause}
      ORDER BY data_cadastro DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1};
    `;

    const listParams = [...params, limite, offset];
    const listRes = await query(listSql, listParams);

    return {
      total,
      leads: listRes.rows
    };
  }

  static async atualizarStatus(id, novoStatus, autor = 'admin', notaTexto = null) {
    const lead = await this.buscarPorId(id);
    if (!lead) return null;

    const statusAnterior = lead.status_comercial;
    const sql = `
      UPDATE leads 
      SET status_comercial = $1, 
          data_ultimo_contato = CURRENT_TIMESTAMP,
          data_atualizacao = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *;
    `;
    const res = await query(sql, [novoStatus, id]);

    if (notaTexto || statusAnterior !== novoStatus) {
      const notaId = crypto.randomUUID();
      const insertNotaSql = `
        INSERT INTO lead_notas (id, lead_id, autor, texto, status_anterior, status_novo)
        VALUES ($1, $2, $3, $4, $5, $6);
      `;
      await query(insertNotaSql, [
        notaId,
        id,
        autor,
        notaTexto || `Status alterado de "${statusAnterior}" para "${novoStatus}"`,
        statusAnterior,
        novoStatus
      ]);
    }

    return res.rows[0];
  }

  static async adicionarNota(leadId, autor, texto) {
    const notaId = crypto.randomUUID();
    const sql = `
      INSERT INTO lead_notas (id, lead_id, autor, texto, status_anterior, status_novo)
      VALUES ($1, $2, $3, $4, NULL, NULL)
      RETURNING *;
    `;
    const res = await query(sql, [notaId, leadId, autor, texto]);
    
    // Atualiza data_ultimo_contato
    await query('UPDATE leads SET data_ultimo_contato = CURRENT_TIMESTAMP WHERE id = $1;', [leadId]);

    return res.rows[0];
  }

  static async obterHistoricoNotas(leadId) {
    const sql = `
      SELECT id, autor, texto, status_anterior, status_novo, data_registro
      FROM lead_notas
      WHERE lead_id = $1
      ORDER BY data_registro DESC;
    `;
    const res = await query(sql, [leadId]);
    return res.rows;
  }

  static async obterMetricas() {
    const sqlTotal = 'SELECT COUNT(*) as total FROM leads;';
    const sqlStatus = 'SELECT status_comercial, COUNT(*) as qtd FROM leads GROUP BY status_comercial;';
    const sqlMunicipios = 'SELECT municipio, COUNT(*) as qtd FROM leads GROUP BY municipio ORDER BY qtd DESC LIMIT 5;';
    const sqlVeiculos = 'SELECT faixa_veiculos, COUNT(*) as qtd FROM leads GROUP BY faixa_veiculos;';

    const [resTotal, resStatus, resMunicipios, resVeiculos] = await Promise.all([
      query(sqlTotal),
      query(sqlStatus),
      query(sqlMunicipios),
      query(sqlVeiculos)
    ]);

    const statusCounts = {};
    resStatus.rows.forEach(r => { statusCounts[r.status_comercial] = parseInt(r.qtd, 10); });

    return {
      total: parseInt(resTotal.rows[0].total, 10),
      porStatus: statusCounts,
      topMunicipios: resMunicipios.rows,
      porFaixaVeiculos: resVeiculos.rows
    };
  }

  static async exportarTodos() {
    const sql = `
      SELECT id, nome_responsavel, nome_fantasia, cnpj_formatado, whatsapp_formatado,
             municipio, bairro, tipo_estabelecimento, email, faixa_veiculos, observacoes,
             status_comercial, consentimento_lgpd, consentimento_promocional,
             origem_campanha, utm_source, utm_medium, utm_campaign, data_cadastro, data_ultimo_contato
      FROM leads
      ORDER BY data_cadastro DESC;
    `;
    const res = await query(sql);
    return res.rows;
  }
}

module.exports = LeadModel;
