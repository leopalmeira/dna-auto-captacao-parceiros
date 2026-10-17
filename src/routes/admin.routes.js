const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const { loginRateLimiter } = require('../middleware/rateLimiter');
const { requireAdminAuth } = require('../middleware/auth');

// Rotas públicas de autenticação admin
router.post('/login', loginRateLimiter, AdminController.login);
router.post('/logout', AdminController.logout);

// Rotas protegidas da área administrativa
router.use(requireAdminAuth);

router.get('/check-auth', AdminController.checkAuth);
router.get('/dashboard', AdminController.getDashboard);
router.get('/leads', AdminController.listarLeads);
router.get('/leads/:id', AdminController.obterLeadDetalhes);
router.patch('/leads/:id/status', AdminController.atualizarStatus);
router.post('/leads/:id/notas', AdminController.adicionarNota);
router.get('/export/csv', AdminController.exportarCSV);

module.exports = router;
