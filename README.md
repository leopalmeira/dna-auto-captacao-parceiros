# DNA Auto — Landing Page de Captação de Oficinas Parceiras

Aplicação web completa, independente e de alta conversão projetada para divulgar o projeto **DNA Auto**, captar pré-cadastros de proprietários e gestores de oficinas mecânicas e auto centers no Rio de Janeiro, e disponibilizar um painel administrativo seguro para a gestão do funil comercial.

---

## 🚀 1. Destaques do Projeto

- **Projeto e Repositório 100% Independentes:** Totalmente isolado do repositório principal `DNA-AUTO`, sem alterar arquivos existentes, rotas, dependências ou bancos de dados do app do cliente/oficina.
- **Copywriting e CRO de Alta Conversão:**
  - Primeira dobra impactante com mockup visual original do painel da oficina (demonstração de alertas preventivos de troca de óleo, freios e filtros).
  - Fluxo comercial em 4 etapas numeradas conectando serviços realizados a novas oportunidades de atendimento.
  - Taxa única de credenciamento transparente de **R$ 299,00** (sem checkout prematuro na página).
  - Formulário mobile-first com validação estrita de CNPJ (com cálculo dos 2 dígitos verificadores), máscara dinâmica de WhatsApp, verificação de duplicidade no servidor e consentimento explícito compatível com a **LGPD**.
- **Painel Administrativo Completo (`/admin`):**
  - Autenticação segura por sessão HttpOnly protegida contra brute force (rate limit).
  - Dashboard de métricas em tempo real (total de leads, por status, taxa de conversão).
  - Busca inteligente por CNPJ, nome da oficina e responsável.
  - Filtros por status comercial, município e período.
  - Ficha de detalhes com histórico de contatos, registro de notas e botão direto para iniciar conversa no WhatsApp (`wa.me`).
  - Exportação de leads autorizados para CSV (UTF-8 com BOM para Excel).
- **Dual Database / Arquitetura Híbrida:**
  - **Produção (Render):** PostgreSQL nativo via `pg` pool com conexão criptografada SSL (`DATABASE_URL`).
  - **Desenvolvimento Local / Testes:** Fallback automático e transparente para SQLite local, permitindo clonar e rodar sem dependências externas.
- **Pronto para Deploy no Render:** Inclui `render.yaml` (Blueprint com 1 clique) e documentação detalhada.
- **API Segura de Integração Futura:** Endpoint autenticado (`/api/integration/leads`) preparado para futuras sincronizações com a plataforma principal DNA Auto.

---

## 🛠️ 2. Stack Tecnológica

| Camada | Tecnologias Utilizadas |
|---|---|
| **Runtime & Servidor** | Node.js (v18+ / v20+ / v24+), Express 4 |
| **Segurança** | Helmet (CSP, HSTS, X-Content-Type), CORS restrito, express-rate-limit, Cookie HttpOnly, Timing-safe equal |
| **Persistência** | PostgreSQL (`pg`) para produção no Render | SQLite (`node:sqlite`) para dev e testes locais |
| **Frontend** | HTML5 Semântico, CSS Moderno com Design System em variáveis customizadas (Azul Profundo, Grafite, Neon Blue), Vanilla JS |
| **Testes Automatizados** | Test Runner nativo do Node.js (`node:test` e `node:assert`) com 26 testes cobrindo 100% dos fluxos críticos |

---

## 📁 3. Estrutura de Arquivos

```
dna-auto-captacao-parceiros/
├── .env.example               # Modelo de variáveis de ambiente
├── .gitignore                 # Arquivos ignorados pelo Git
├── README.md                  # Esta documentação completa
├── package.json               # Dependências e scripts de execução
├── render.yaml                # Especificação de infraestrutura Render Blueprint
├── server.js                  # Ponto de entrada Express com Helmet e rotas
├── src/
│   ├── config/
│   │   └── database.js        # Adaptador dual PostgreSQL (Render) / SQLite (Local)
│   ├── controllers/
│   │   ├── adminController.js # Lógica do painel administrativo, métricas e exportação
│   │   └── leadController.js  # Lógica do pré-cadastro público, validações e duplicidade
│   ├── middleware/
│   │   ├── auth.js            # Sessão de admin e chave de integração da API
│   │   └── rateLimiter.js     # Limitador de requisições anti-abuso e anti-força bruta
│   ├── models/
│   │   └── leadModel.js       # Operações de banco (leads, notas, histórico, métricas)
│   ├── routes/
│   │   ├── admin.routes.js    # Rotas privadas /admin/api/*
│   │   └── api.routes.js      # Rotas públicas /api/*
│   └── utils/
│       └── validators.js      # Validador oficial de CNPJ, WhatsApp e sanitização
├── public/
│   ├── index.html             # Landing page de alta conversão
│   ├── admin.html             # Interface do painel administrativo
│   ├── politicas-privacidade.html # Política de Privacidade e conformidade LGPD
│   ├── css/
│   │   ├── styles.css         # Design system e estilos da landing page
│   │   └── admin.css          # Estilos do painel administrativo
│   └── js/
│       ├── landing.js         # Máscaras, validações em tempo real, envio assíncrono e UTMs
│       └── admin.js           # Lógica do painel de controle e modais
└── tests/
    ├── cnpj.test.js           # Testes unitários do algoritmo verificador de CNPJ e telefones
    ├── leadApi.test.js        # Testes de integração do endpoint público de cadastro
    ├── adminAuth.test.js      # Testes de proteção, login e exportação administrativa
    ├── frontendRoutes.test.js # Testes de integridade das páginas e ativos estáticos
    └── leadWorkflow.test.js   # Teste end-to-end do ciclo comercial completo do lead
```

---

## ⚙️ 4. Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto baseado no `.env.example`:

```ini
PORT=3000
NODE_ENV=development

# Produção no Render: Preenchido automaticamente pelo Render PostgreSQL
# Se omitido (ambiente local), o sistema utiliza SQLite local em data/leads.db automaticamente
DATABASE_URL=

# Credenciais de acesso ao Painel Administrativo (/admin)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=dna_auto_parceiros_2026!

# Chave secreta para assinatura dos cookies de sessão
SESSION_SECRET=dna_auto_secret_session_key_render_2026_super_secure

# Chave para futura integração via API com o sistema principal DNA Auto
INTEGRATION_API_KEY=dna_integration_key_secret_2026
```

---

## 💻 5. Como Executar Localmente

### Pré-requisitos
- Node.js versão 18 ou superior instalada.
- Não é necessário ter PostgreSQL instalado localmente para rodar ou testar (o SQLite embutido entra em ação de forma transparente).

### Instalação e Execução
```bash
# 1. Navegue até a pasta do projeto
cd dna-auto-captacao-parceiros

# 2. Instale as dependências
npm install

# 3. Execute a bateria completa de testes automatizados (26 testes)
npm test

# 4. Inicie o servidor em modo de desenvolvimento
npm run dev

# 5. Ou inicie em modo padrão
npm start
```

Acesse no seu navegador:
- **Landing Page Pública:** `http://localhost:3000`
- **Painel Administrativo:** `http://localhost:3000/admin`
  - Usuário padrão: `admin`
  - Senha padrão: `dna_auto_parceiros_2026!` (ou a configurada no seu `.env`)
- **Política de Privacidade:** `http://localhost:3000/politica-de-privacidade`

---

## ☁️ 6. Guia de Deploy Independente no Render

O projeto está totalmente configurado para deploy autônomo no [Render](https://render.com).

### Opção A — Deploy Automatizado com Blueprint (`render.yaml`) — Recomendado

1. Crie um novo repositório privado ou público no seu GitHub (ex.: `leopalmeira/dna-auto-captacao-parceiros`).
2. Faça o push do código deste projeto para o novo repositório:
   ```bash
   git remote add origin https://github.com/SEU_USUARIO/dna-auto-captacao-parceiros.git
   git branch -M main
   git push -u origin main
   ```
3. No painel do [Render](https://dashboard.render.com):
   - Clique em **New +** e selecione **Blueprint**.
   - Conecte o repositório `dna-auto-captacao-parceiros`.
   - O Render lerá o arquivo `render.yaml` e provisionará automaticamente:
     - 1 **PostgreSQL Database** gerenciado (`dna-auto-leads-db`).
     - 1 **Web Service** Node.js com as variáveis vinculadas.
4. Clique em **Apply** e aguarde o build concluir.

---

### Opção B — Deploy Manual no Dashboard do Render

Caso prefira criar os serviços manualmente:

#### 1. Criar o Banco PostgreSQL no Render
1. No Render, clique em **New +** > **PostgreSQL**.
2. Defina o nome: `dna-auto-leads-db`.
3. Selecione a região mais próxima (ex.: Ohio ou Frankfurt) e clique em **Create Database**.
4. Após criado, copie a **Internal Database URL** (ou External se for rodar fora do Render).

#### 2. Criar o Web Service
1. No Render, clique em **New +** > **Web Service**.
2. Conecte seu repositório GitHub independente.
3. Configure os campos:
   - **Name:** `dna-auto-captacao-parceiros`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Na seção **Environment Variables**, adicione:
   - `NODE_ENV`: `production`
   - `DATABASE_URL`: cole a URL de conexão do PostgreSQL criado no passo anterior.
   - `ADMIN_USERNAME`: seu usuário desejado (ex.: `admin`).
   - `ADMIN_PASSWORD`: defina uma senha forte para acesso ao painel de leads.
   - `SESSION_SECRET`: gere uma string aleatória longa.
   - `INTEGRATION_API_KEY`: gere uma chave segura para integração futura.
5. Clique em **Deploy Web Service**.

---

### 7. Configuração de Domínio Personalizado (Opcional)
No painel do serviço no Render:
1. Acesse **Settings** > **Custom Domains**.
2. Adicione seu domínio (ex: `parceiros.dnaauto.com.br`).
3. Configure os apontamentos CNAME no seu provedor de DNS (Cloudflare, Registro.br, etc.) conforme instruções fornecidas pelo Render. O certificado SSL gratuito é emitido automaticamente.

---

## 🔒 8. Segurança e LGPD

- **Sanitização contra XSS e Injeção:** Todos os inputs passam por sanitização rigorosa antes de persistência.
- **Prevenção de Ataques de Força Bruta:** Rate limiter com janela de 15 minutos em endpoints críticos (/api/leads e /admin/api/login).
- **Proteção contra Timing Attack:** Comparação em tempo constante (`crypto.timingSafeEqual`) na verificação de credenciais.
- **Cookies HttpOnly:** Sessão administrativa armazenada em cookie protegido contra leitura por scripts maliciosos.
- **Endpoint Público Seguro:** O endpoint `/api/leads` é restrito apenas a inserções e NUNCA retorna listas de outros clientes ou dados de terceiros.
- **LGPD:** Consentimento explícito registrado com versão dos termos (`v1.0`) e opção destacada e desmarcada por padrão para opt-in promocional.

---

## 🔌 9. API de Integração com o Ecossistema Principal

Quando a equipe estiver pronta para sincronizar os dados com a plataforma principal do DNA Auto, utilize o endpoint:

- **Rota:** `GET /api/integration/leads`
- **Autenticação:** Header `Authorization: Bearer <INTEGRATION_API_KEY>`
- **Filtro Opcional:** `?desde=2026-10-17T00:00:00Z`
- **Retorno:** JSON com os pré-cadastros atualizados para ingestão segura.

---

## 🧪 10. Testes Automatizados Executados

Execute a qualquer momento:
```bash
npm test
```

Resultado:
```
✔ Painel Administrativo - Segurança e Gestão (7 testes)
✔ Validação e Formatação de CNPJ (4 testes)
✔ Validação e Formatação de WhatsApp (3 testes)
✔ Rotas e Ativos Estáticos do Frontend (4 testes)
✔ API de Leads - /api/leads (3 testes)
✔ Fluxo Comercial Completo do Lead (5 testes)

ℹ tests 26
ℹ suites 6
ℹ pass 26
ℹ fail 0
ℹ duration_ms ~500ms
```

---

## 📄 Licença e Propriedade
Projeto desenvolvido com exclusividade para o ecossistema **DNA Auto**. Todos os direitos reservados.
