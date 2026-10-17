const express = require('express');
const router = express.Router();
const LeadController = require('../controllers/leadController');
const AdminController = require('../controllers/adminController');
const { cadastroRateLimiter } = require('../middleware/rateLimiter');
const { requireIntegrationAuth } = require('../middleware/auth');

// Endpoint público de captação de leads com proteção contra abuso
router.post('/leads', cadastroRateLimiter, LeadController.criarPreCadastro);

// Rota de integração futura para o ecossistema principal DNA Auto
router.get('/integration/leads', requireIntegrationAuth, AdminController.integracaoListar);

module.exports = router;
