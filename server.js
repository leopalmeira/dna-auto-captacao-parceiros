require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const { initDb } = require('./src/config/database');
const apiRoutes = require('./src/routes/api.routes');
const adminRoutes = require('./src/routes/admin.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurações de segurança com Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

app.use(cors());
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));
app.use(cookieParser());

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// Rotas da API
app.use('/api', apiRoutes);
app.use('/admin/api', adminRoutes);

// Rotas de páginas estáticas amigáveis
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin.html'));
});

app.get('/politica-de-privacidade', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/politicas-privacidade.html'));
});

// Fallback para SPA ou página inicial
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Middleware global de tratamento de erros amigável e seguro (sem vazamento de pilha)
app.use((err, req, res, next) => {
  console.error('[Servidor Error]:', err.message);
  res.status(err.status || 500).json({
    sucesso: false,
    mensagem: 'Ocorreu um erro interno ao processar a solicitação.'
  });
});

async function startServer() {
  try {
    await initDb();
    const server = app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`  🚀 DNA Auto - Captação de Parceiros Operacional!`);
      console.log(`  🌐 Landing Page: http://localhost:${PORT}`);
      console.log(`  🔒 Painel Admin: http://localhost:${PORT}/admin`);
      console.log(`  🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`=======================================================`);
    });
    return server;
  } catch (error) {
    console.error('Falha crítica ao iniciar o servidor:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
