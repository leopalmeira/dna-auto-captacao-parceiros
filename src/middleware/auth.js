const crypto = require('crypto');

const SESSION_COOKIE_NAME = 'dna_admin_token';
const SESSION_SECRET = process.env.SESSION_SECRET || 'dna_fallback_secret_key_development_2026';

function gerarTokenSessao(username) {
  const payload = JSON.stringify({
    user: username,
    exp: Date.now() + (8 * 60 * 60 * 1000) // 8 horas de sessão
  });
  const hmac = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('hex');
  const token = Buffer.from(payload).toString('base64') + '.' + hmac;
  return token;
}

function verificarTokenSessao(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [b64Payload, signature] = parts;
  try {
    const payloadStr = Buffer.from(b64Payload, 'base64').toString('utf8');
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payloadStr).digest('hex');
    
    // Comparação em tempo constante para evitar timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }
    const data = JSON.parse(payloadStr);
    if (data.exp < Date.now()) return null; // Expirado
    return data;
  } catch (err) {
    return null;
  }
}

function requireAdminAuth(req, res, next) {
  const token = req.cookies ? req.cookies[SESSION_COOKIE_NAME] : null;
  const authHeader = req.headers['authorization'];

  let sessionUser = null;
  if (token) {
    sessionUser = verificarTokenSessao(token);
  } else if (authHeader && authHeader.startsWith('Bearer ')) {
    sessionUser = verificarTokenSessao(authHeader.substring(7));
  }

  if (!sessionUser) {
    return res.status(401).json({
      sucesso: false,
      mensagem: 'Acesso não autorizado. Por favor, autentique-se no painel administrativo.'
    });
  }

  req.adminUser = sessionUser.user;
  next();
}

function requireIntegrationAuth(req, res, next) {
  const expectedKey = process.env.INTEGRATION_API_KEY || 'dna_integration_key_secret_2026';
  const authHeader = req.headers['authorization'] || req.headers['x-api-key'];

  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (authHeader) {
    token = authHeader;
  }

  if (!token || token !== expectedKey) {
    return res.status(401).json({
      sucesso: false,
      mensagem: 'Chave de integração da API inválida ou ausente.'
    });
  }

  next();
}

module.exports = {
  SESSION_COOKIE_NAME,
  gerarTokenSessao,
  verificarTokenSessao,
  requireAdminAuth,
  requireIntegrationAuth
};
