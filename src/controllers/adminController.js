const crypto = require('crypto');
const LeadModel = require('../models/leadModel');
const {
  SESSION_COOKIE_NAME,
  gerarTokenSessao
} = require('../middleware/auth');

class AdminController {
  static async login(req, res) {
    try {
      const { username, password } = req.body;
      const expectedUser = process.env.ADMIN_USERNAME || 'admin';
      const expectedPass = process.env.ADMIN_PASSWORD || 'dna_auto_parceiros_2026!';

      if (!username || !password) {
        return res.status(400).json({
          sucesso: false,
          mensagem: 'Usuário e senha são obrigatórios.'
        });
      }

      // Comparação segura contra timing attack
      const userMatch = crypto.timingSafeEqual(
        Buffer.from(String(username).padEnd(64, ' ')),
        Buffer.from(String(expectedUser).padEnd(64, ' '))
      );
      const passMatch = crypto.timingSafeEqual(
        Buffer.from(String(password).padEnd(64, ' ')),
        Buffer.from(String(expectedPass).padEnd(64, ' '))
      );

      if (!userMatch || !passMatch) {
        return res.status(401).json({
          sucesso: false,
          mensagem: 'Credenciais administrativas inválidas.'
        });
      }

      const token = gerarTokenSessao(username);

      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 8 * 60 * 60 * 1000 // 8 horas
      });

      return res.json({
        sucesso: true,
        mensagem: 'Autenticação realizada com sucesso!',
        user: username,
        token // Também retornado para cabeçalho Authorization se preferir
      });
    } catch (err) {
      console.error('[AdminController.login] Erro:', err.message);
      return res.status(500).json({ sucesso: false, mensagem: 'Erro interno de autenticação.' });
    }
  }

  static logout(req, res) {
    res.clearCookie(SESSION_COOKIE_NAME);
    return res.json({ sucesso: true, mensagem: 'Sessão encerrada com sucesso.' });
  }

  static checkAuth(req, res) {
    return res.json({
      sucesso: true,
      autenticado: true,
      user: req.adminUser
    });
  }

  static async getDashboard(req, res) {
    try {
      const metricas = await LeadModel.obterMetricas();
      return res.json({ sucesso: true, metricas });
    } catch (err) {
      console.error('[AdminController.getDashboard] Erro:', err.message);
      return res.status(500).json({ sucesso: false, mensagem: 'Erro ao carregar métricas.' });
    }
  }

  static async listarLeads(req, res) {
    try {
      const { busca, status, municipio, bairro, dataInicio, dataFim, pagina = 1, limite = 20 } = req.query;
      const offset = (parseInt(pagina, 10) - 1) * parseInt(limite, 10);

      const resultado = await LeadModel.listarComFiltros({
        busca,
        status,
        municipio,
        bairro,
        dataInicio,
        dataFim,
        limite: parseInt(limite, 10),
        offset
      });

      return res.json({
        sucesso: true,
        total: resultado.total,
        pagina: parseInt(pagina, 10),
        limite: parseInt(limite, 10),
        totalPaginas: Math.ceil(resultado.total / parseInt(limite, 10)),
        leads: resultado.leads
      });
    } catch (err) {
      console.error('[AdminController.listarLeads] Erro:', err.message);
      return res.status(500).json({ sucesso: false, mensagem: 'Erro ao listar pré-cadastros.' });
    }
  }

  static async obterLeadDetalhes(req, res) {
    try {
      const { id } = req.params;
      const lead = await LeadModel.buscarPorId(id);
      if (!lead) {
        return res.status(404).json({ sucesso: false, mensagem: 'Pré-cadastro não encontrado.' });
      }

      const historico = await LeadModel.obterHistoricoNotas(id);
      return res.json({ sucesso: true, lead, historico });
    } catch (err) {
      console.error('[AdminController.obterLeadDetalhes] Erro:', err.message);
      return res.status(500).json({ sucesso: false, mensagem: 'Erro ao buscar detalhes do lead.' });
    }
  }

  static async atualizarStatus(req, res) {
    try {
      const { id } = req.params;
      const { novoStatus, nota } = req.body;

      const statusValidos = [
        'Novo pré-cadastro',
        'Em contato',
        'Aguardando retorno',
        'Interessado',
        'Credenciamento em negociação',
        'Credenciado',
        'Não interessado'
      ];

      if (!statusValidos.includes(novoStatus)) {
        return res.status(400).json({ sucesso: false, mensagem: 'Status comercial inválido.' });
      }

      const atualizado = await LeadModel.atualizarStatus(id, novoStatus, req.adminUser, nota);
      if (!atualizado) {
        return res.status(404).json({ sucesso: false, mensagem: 'Pré-cadastro não encontrado.' });
      }

      return res.json({
        sucesso: true,
        mensagem: 'Status atualizado com sucesso!',
        lead: atualizado
      });
    } catch (err) {
      console.error('[AdminController.atualizarStatus] Erro:', err.message);
      return res.status(500).json({ sucesso: false, mensagem: 'Erro ao atualizar status.' });
    }
  }

  static async adicionarNota(req, res) {
    try {
      const { id } = req.params;
      const { texto } = req.body;

      if (!texto || texto.trim().length < 2) {
        return res.status(400).json({ sucesso: false, mensagem: 'O texto da observação é obrigatório.' });
      }

      const nota = await LeadModel.adicionarNota(id, req.adminUser, texto.trim());
      return res.json({ sucesso: true, mensagem: 'Anotação comercial salva com sucesso!', nota });
    } catch (err) {
      console.error('[AdminController.adicionarNota] Erro:', err.message);
      return res.status(500).json({ sucesso: false, mensagem: 'Erro ao salvar anotação.' });
    }
  }

  static async exportarCSV(req, res) {
    try {
      const leads = await LeadModel.exportarTodos();

      const headers = [
        'ID',
        'Responsavel',
        'Nome Fantasia',
        'CNPJ',
        'WhatsApp',
        'Municipio',
        'Bairro',
        'Tipo',
        'Email',
        'Faixa Veiculos',
        'Status Comercial',
        'Data Cadastro',
        'Ultimo Contato',
        'Origem Campanha',
        'UTM Source',
        'UTM Medium',
        'UTM Campaign'
      ];

      const csvRows = [headers.join(';')];

      for (const l of leads) {
        const row = [
          l.id,
          `"${(l.nome_responsavel || '').replace(/"/g, '""')}"`,
          `"${(l.nome_fantasia || '').replace(/"/g, '""')}"`,
          `"${l.cnpj_formatado || ''}"`,
          `"${l.whatsapp_formatado || ''}"`,
          `"${(l.municipio || '').replace(/"/g, '""')}"`,
          `"${(l.bairro || '').replace(/"/g, '""')}"`,
          `"${(l.tipo_estabelecimento || '').replace(/"/g, '""')}"`,
          `"${(l.email || '').replace(/"/g, '""')}"`,
          `"${(l.faixa_veiculos || '').replace(/"/g, '""')}"`,
          `"${(l.status_comercial || '').replace(/"/g, '""')}"`,
          l.data_cadastro || '',
          l.data_ultimo_contato || '',
          `"${(l.origem_campanha || '').replace(/"/g, '""')}"`,
          `"${(l.utm_source || '').replace(/"/g, '""')}"`,
          `"${(l.utm_medium || '').replace(/"/g, '""')}"`,
          `"${(l.utm_campaign || '').replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(';'));
      }

      const csvContent = '\uFEFF' + csvRows.join('\r\n'); // BOM UTF-8 para Excel abrir sem quebra de acentos
      const filename = `dna_auto_leads_${new Date().toISOString().slice(0, 10)}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(csvContent);
    } catch (err) {
      console.error('[AdminController.exportarCSV] Erro:', err.message);
      return res.status(500).json({ sucesso: false, mensagem: 'Erro ao gerar arquivo CSV.' });
    }
  }

  // Endpoint seguro para futura sincronização com o DNA Auto principal
  static async integracaoListar(req, res) {
    try {
      const { desde } = req.query;
      let sql = 'SELECT * FROM leads';
      const params = [];
      if (desde) {
        sql += ' WHERE data_atualizacao >= $1';
        params.push(desde);
      }
      sql += ' ORDER BY data_atualizacao ASC LIMIT 100;';
      const { query } = require('../config/database');
      const result = await query(sql, params);
      return res.json({
        sucesso: true,
        total: result.rowCount,
        leads: result.rows
      });
    } catch (err) {
      return res.status(500).json({ sucesso: false, mensagem: 'Erro na API de integração.' });
    }
  }
}

module.exports = AdminController;
