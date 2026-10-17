const rateLimit = require('express-rate-limit');

// Rate limiter para envio do formulário de cadastro público: 5 envios a cada 15 min por IP
const cadastroRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    sucesso: false,
    mensagem: 'Muitas tentativas de cadastro a partir deste dispositivo. Por favor, aguarde alguns minutos antes de tentar novamente.'
  }
});

// Rate limiter para login administrativo: 5 tentativas por 15 min por IP (anti-força bruta)
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    sucesso: false,
    mensagem: 'Muitas tentativas de login incorretas. Acesso temporariamente bloqueado por 15 minutos para segurança.'
  }
});

module.exports = {
  cadastroRateLimiter,
  loginRateLimiter
};
