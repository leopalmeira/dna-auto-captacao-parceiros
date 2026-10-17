const LeadModel = require('../models/leadModel');
const {
  validarCNPJ,
  formatarCNPJ,
  validarWhatsApp,
  formatarWhatsApp,
  sanitizarTexto
} = require('../utils/validators');

class LeadController {
  static async criarPreCadastro(req, res) {
    try {
      const {
        nome_responsavel,
        nome_fantasia,
        cnpj,
        whatsapp,
        municipio,
        bairro,
        tipo_estabelecimento,
        email,
        faixa_veiculos,
        observacoes,
        consentimento_lgpd,
        consentimento_promocional,
        origem_campanha,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_content,
        utm_term
      } = req.body;

      // 1. Validações dos campos obrigatórios
      const erros = {};

      if (!nome_responsavel || sanitizarTexto(nome_responsavel).length < 3) {
        erros.nome_responsavel = 'Por favor, informe o nome completo do responsável (mínimo 3 caracteres).';
      }

      if (!nome_fantasia || sanitizarTexto(nome_fantasia).length < 2) {
        erros.nome_fantasia = 'Por favor, informe o nome fantasia da oficina ou auto center.';
      }

      if (!cnpj || !validarCNPJ(cnpj)) {
        erros.cnpj = 'CNPJ inválido. Verifique os números digitados.';
      }

      if (!whatsapp || !validarWhatsApp(whatsapp)) {
        erros.whatsapp = 'WhatsApp inválido. Informe o DDD e o número completo (ex: (21) 99999-9999).';
      }

      if (!municipio || sanitizarTexto(municipio).length < 2) {
        erros.municipio = 'Por favor, informe o município.';
      }

      if (!bairro || sanitizarTexto(bairro).length < 2) {
        erros.bairro = 'Por favor, informe o bairro.';
      }

      const tiposPermitidos = [
        'Oficina mecânica',
        'Auto center',
        'Centro automotivo especializado',
        'Outra atividade automotiva'
      ];
      if (!tipo_estabelecimento || !tiposPermitidos.includes(tipo_estabelecimento)) {
        erros.tipo_estabelecimento = 'Por favor, selecione um tipo de estabelecimento válido.';
      }

      if (!consentimento_lgpd) {
        erros.consentimento_lgpd = 'É necessário concordar com o tratamento de dados para contato comercial.';
      }

      if (email && email.trim() !== '') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
          erros.email = 'E-mail em formato inválido.';
        }
      }

      if (Object.keys(erros).length > 0) {
        return res.status(400).json({
          sucesso: false,
          mensagem: 'Por favor, corrija os erros apontados no formulário.',
          erros
        });
      }

      const cnpjNormalizado = String(cnpj).replace(/\D/g, '');
      const whatsappNormalizado = String(whatsapp).replace(/\D/g, '');

      // 2. Verificação de duplicidade de CNPJ no servidor
      const leadExistente = await LeadModel.buscarPorCNPJ(cnpjNormalizado);
      if (leadExistente) {
        return res.status(409).json({
          sucesso: false,
          duplicado: true,
          mensagem: 'Este CNPJ já possui um pré-cadastro registrado em nossa base. Nossa equipe comercial já dispõe de seus dados para contato oportuno.'
        });
      }

      // 3. Captura de IP e User-Agent de forma segura (sem expor em logs)
      const ipOrigem = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
      const userAgent = req.headers['user-agent'] || '';

      // 4. Persistência no banco
      const novoLead = await LeadModel.criar({
        nome_responsavel: sanitizarTexto(nome_responsavel),
        nome_fantasia: sanitizarTexto(nome_fantasia),
        cnpj: cnpjNormalizado,
        cnpj_formatado: formatarCNPJ(cnpjNormalizado),
        whatsapp: whatsappNormalizado,
        whatsapp_formatado: formatarWhatsApp(whatsappNormalizado),
        municipio: sanitizarTexto(municipio),
        bairro: sanitizarTexto(bairro),
        tipo_estabelecimento,
        email: email ? sanitizarTexto(email) : null,
        faixa_veiculos: faixa_veiculos || 'Prefiro informar depois',
        observacoes: observacoes ? sanitizarTexto(observacoes) : null,
        consentimento_lgpd: true,
        consentimento_promocional: !!consentimento_promocional,
        versao_termos: 'v1.0',
        origem_campanha: origem_campanha || 'web_landing_page',
        utm_source: utm_source || null,
        utm_medium: utm_medium || null,
        utm_campaign: utm_campaign || null,
        utm_content: utm_content || null,
        utm_term: utm_term || null,
        ip_origem: ipOrigem.substring(0, 50),
        user_agent: userAgent.substring(0, 255)
      });

      // Retorno estritamente limitado: NUNCA expõe outros dados nem lista de interessados
      return res.status(201).json({
        sucesso: true,
        mensagem: 'Pré-cadastro recebido com sucesso!',
        protocolo: novoLead.id.substring(0, 8).toUpperCase()
      });
    } catch (error) {
      console.error('[LeadController.criarPreCadastro] Erro:', error.message);
      return res.status(500).json({
        sucesso: false,
        mensagem: 'Ocorreu uma instabilidade momentânea ao salvar seu pré-cadastro. Por favor, tente novamente.'
      });
    }
  }
}

module.exports = LeadController;
