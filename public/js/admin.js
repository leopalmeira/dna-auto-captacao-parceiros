/**
 * DNA AUTO — Script do Painel Administrativo de Leads
 * Autenticação por Sessão HttpOnly, Dashboard de Métricas, Filtros, Atualização de Status e Exportação CSV
 */

let leadsData = [];
let currentPage = 1;
let currentLimit = 20;
let searchTimeout = null;
let currentLeadId = null;

document.addEventListener('DOMContentLoaded', () => {
  checkAuthentication();
  initLoginEvents();
  initControlsEvents();
  initModalEvents();
});

// 1. Verificação de Autenticação
async function checkAuthentication() {
  try {
    const res = await fetch('/admin/api/check-auth');
    if (res.ok) {
      const data = await res.json();
      if (data.autenticado) {
        exibirPainel(data.user);
        return;
      }
    }
    exibirLogin();
  } catch (err) {
    exibirLogin();
  }
}

function exibirLogin() {
  document.getElementById('loginContainer').style.display = 'flex';
  document.getElementById('adminLayout').classList.remove('active');
}

function exibirPainel(user) {
  document.getElementById('loginContainer').style.display = 'none';
  const layout = document.getElementById('adminLayout');
  layout.classList.add('active');
  document.getElementById('adminUserDisplay').textContent = user || 'Administrador';
  carregarMetricas();
  carregarLeads();
}

// 2. Eventos de Login e Logout
function initLoginEvents() {
  const loginForm = document.getElementById('loginForm');
  const loginBtn = document.getElementById('loginBtn');
  const loginError = document.getElementById('loginError');
  const logoutBtn = document.getElementById('logoutBtn');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      loginError.style.display = 'none';
      loginBtn.disabled = true;
      loginBtn.textContent = 'Autenticando...';

      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;

      try {
        const res = await fetch('/admin/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await res.json();

        if (res.ok && data.sucesso) {
          exibirPainel(data.user);
        } else {
          loginError.textContent = data.mensagem || 'Credenciais inválidas.';
          loginError.style.display = 'block';
        }
      } catch (err) {
        loginError.textContent = 'Falha de comunicação com o servidor.';
        loginError.style.display = 'block';
      } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Acessar Painel';
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await fetch('/admin/api/logout', { method: 'POST' });
      } catch (e) {}
      exibirLogin();
    });
  }
}

// 3. Carregamento de Métricas
async function carregarMetricas() {
  try {
    const res = await fetch('/admin/api/dashboard');
    if (!res.ok) return;
    const data = await res.json();
    if (!data.sucesso || !data.metricas) return;

    const m = data.metricas;
    document.getElementById('metricTotal').textContent = m.total;
    document.getElementById('metricNovos').textContent = m.porStatus['Novo pré-cadastro'] || 0;
    
    const emAtendimento = (m.porStatus['Em contato'] || 0) + (m.porStatus['Aguardando retorno'] || 0) + (m.porStatus['Interessado'] || 0) + (m.porStatus['Credenciamento em negociação'] || 0);
    document.getElementById('metricEmAtendimento').textContent = emAtendimento;
    
    document.getElementById('metricCredenciados').textContent = m.porStatus['Credenciado'] || 0;
  } catch (err) {
    console.error('Erro ao carregar métricas:', err);
  }
}

// 4. Carregamento e Listagem de Leads
async function carregarLeads() {
  const tbody = document.getElementById('leadsTableBody');
  const countDisplay = document.getElementById('leadsCountDisplay');
  tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #94a3b8;">Carregando registros...</td></tr>';

  const busca = document.getElementById('searchLeadInput').value.trim();
  const status = document.getElementById('filterStatus').value;
  const municipio = document.getElementById('filterMunicipio').value;

  const params = new URLSearchParams({
    pagina: currentPage,
    limite: currentLimit
  });

  if (busca) params.append('busca', busca);
  if (status && status !== 'todos') params.append('status', status);
  if (municipio && municipio !== 'todos') params.append('municipio', municipio);

  try {
    const res = await fetch(`/admin/api/leads?${params.toString()}`);
    if (!res.ok) {
      if (res.status === 401) return exibirLogin();
      throw new Error('Falha ao obter lista');
    }

    const data = await res.json();
    leadsData = data.leads || [];

    countDisplay.textContent = `${data.total} pré-cadastros encontrados (Página ${data.pagina} de ${data.totalPaginas || 1})`;

    if (leadsData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #94a3b8;">Nenhum pré-cadastro encontrado com os filtros aplicados.</td></tr>';
      return;
    }

    renderizarTabela(leadsData);
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #f87171;">Erro ao carregar pré-cadastros.</td></tr>';
  }
}

function renderizarTabela(leads) {
  const tbody = document.getElementById('leadsTableBody');
  tbody.innerHTML = '';

  leads.forEach(l => {
    const tr = document.createElement('tr');
    
    const statusClass = obterClasseStatus(l.status_comercial);
    const waLimpo = (l.whatsapp_formatado || '').replace(/\D/g, '');
    const waUrl = `https://wa.me/55${waLimpo}?text=Ol%C3%A1%20${encodeURIComponent(l.nome_responsavel)},%20sou%20da%20equipe%20DNA%20Auto.%20Recebemos%20seu%20pr%C3%A9-cadastro%20para%20a%20oficina%20${encodeURIComponent(l.nome_fantasia)}!`;

    const dataFormatada = formatarData(l.data_cadastro);

    tr.innerHTML = `
      <td>
        <div class="lead-name-cell">${escapeHtml(l.nome_fantasia)}</div>
        <div class="lead-sub-cell">Resp: ${escapeHtml(l.nome_responsavel)}</div>
      </td>
      <td>
        <span style="font-family: monospace; font-size: 0.85rem;">${escapeHtml(l.cnpj_formatado)}</span>
      </td>
      <td>
        <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="wa-btn" title="Conversar no WhatsApp">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.668-.699c.969.58 1.77.887 2.792.888 3.182 0 5.768-2.587 5.768-5.766.001-3.181-2.585-5.774-5.768-5.774zm7.999 5.764c0 4.41-3.589 7.997-7.999 7.997-1.378 0-2.678-.35-3.818-.967l-5.213 1.367 1.391-5.086c-.722-1.229-1.139-2.658-1.139-4.183 0-4.41 3.589-7.997 7.999-7.997 4.411 0 7.98 3.587 7.78 8.869z"/></svg>
          ${escapeHtml(l.whatsapp_formatado)}
        </a>
      </td>
      <td>
        <div>${escapeHtml(l.municipio)}</div>
        <div class="lead-sub-cell">${escapeHtml(l.bairro)}</div>
      </td>
      <td>
        <span class="status-badge ${statusClass}">${escapeHtml(l.status_comercial)}</span>
      </td>
      <td style="font-size: 0.82rem; color: #94a3b8;">
        ${dataFormatada}
      </td>
      <td>
        <button class="btn-details" onclick="abrirModalLead('${l.id}')">Gerenciar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function obterClasseStatus(status) {
  switch (status) {
    case 'Novo pré-cadastro': return 'status-novo';
    case 'Em contato': return 'status-contato';
    case 'Aguardando retorno': return 'status-aguardando';
    case 'Interessado': return 'status-interessado';
    case 'Credenciamento em negociação': return 'status-negociacao';
    case 'Credenciado': return 'status-credenciado';
    case 'Não interessado': return 'status-nao-interessado';
    default: return 'status-novo';
  }
}

// 5. Controles, Filtros e Busca com Debounce
function initControlsEvents() {
  const searchInput = document.getElementById('searchLeadInput');
  const filterStatus = document.getElementById('filterStatus');
  const filterMunicipio = document.getElementById('filterMunicipio');
  const refreshBtn = document.getElementById('refreshBtn');
  const exportCsvBtn = document.getElementById('exportCsvBtn');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        currentPage = 1;
        carregarLeads();
      }, 300);
    });
  }

  if (filterStatus) {
    filterStatus.addEventListener('change', () => {
      currentPage = 1;
      carregarLeads();
    });
  }

  if (filterMunicipio) {
    filterMunicipio.addEventListener('change', () => {
      currentPage = 1;
      carregarLeads();
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      carregarMetricas();
      carregarLeads();
    });
  }

  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
      window.location.href = '/admin/api/export/csv';
    });
  }
}

// 6. Modal de Detalhes e Acompanhamento
function initModalEvents() {
  const modal = document.getElementById('leadModal');
  const closeBtn = document.getElementById('modalCloseBtn');
  const statusForm = document.getElementById('modalStatusForm');
  const noteForm = document.getElementById('modalNoteForm');

  if (closeBtn) {
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  }

  window.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });

  if (statusForm) {
    statusForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentLeadId) return;

      const novoStatus = document.getElementById('modalNovoStatus').value;
      const nota = document.getElementById('modalStatusNota').value.trim();
      const btn = document.getElementById('btnAtualizarStatus');
      btn.disabled = true;

      try {
        const res = await fetch(`/admin/api/leads/${currentLeadId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ novoStatus, nota })
        });
        const data = await res.json();
        if (res.ok && data.sucesso) {
          document.getElementById('modalStatusNota').value = '';
          abrirModalLead(currentLeadId);
          carregarMetricas();
          carregarLeads();
        } else {
          alert(data.mensagem || 'Erro ao atualizar status.');
        }
      } catch (err) {
        alert('Erro ao comunicar com o servidor.');
      } finally {
        btn.disabled = false;
      }
    });
  }

  if (noteForm) {
    noteForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!currentLeadId) return;

      const texto = document.getElementById('modalNovaNota').value.trim();
      if (!texto) return;

      const btn = document.getElementById('btnSalvarNota');
      btn.disabled = true;

      try {
        const res = await fetch(`/admin/api/leads/${currentLeadId}/notas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texto })
        });
        const data = await res.json();
        if (res.ok && data.sucesso) {
          document.getElementById('modalNovaNota').value = '';
          abrirModalLead(currentLeadId);
          carregarLeads();
        } else {
          alert(data.mensagem || 'Erro ao salvar anotação.');
        }
      } catch (err) {
        alert('Erro de comunicação.');
      } finally {
        btn.disabled = false;
      }
    });
  }
}

async function abrirModalLead(id) {
  currentLeadId = id;
  const modal = document.getElementById('leadModal');

  try {
    const res = await fetch(`/admin/api/leads/${id}`);
    if (!res.ok) return alert('Não foi possível carregar os dados do interessado.');

    const data = await res.json();
    const l = data.lead;
    const historico = data.historico || [];

    document.getElementById('modalTitleFantasia').textContent = l.nome_fantasia;
    document.getElementById('modalResp').textContent = l.nome_responsavel;
    document.getElementById('modalCnpj').textContent = l.cnpj_formatado;
    document.getElementById('modalWhats').textContent = l.whatsapp_formatado;
    document.getElementById('modalEmail').textContent = l.email || 'Não informado';
    document.getElementById('modalLocal').textContent = `${l.municipio} / ${l.bairro}`;
    document.getElementById('modalTipo').textContent = l.tipo_estabelecimento;
    document.getElementById('modalVeiculos').textContent = l.faixa_veiculos || 'Não informado';
    document.getElementById('modalObs').textContent = l.observacoes || 'Nenhuma observação registrada no cadastro.';
    document.getElementById('modalData').textContent = formatarData(l.data_cadastro);
    document.getElementById('modalOrigem').textContent = l.origem_campanha || 'web_landing_page';
    document.getElementById('modalUtm').textContent = l.utm_source ? `Source: ${l.utm_source} | Campaign: ${l.utm_campaign || '-'}` : 'Tráfego direto / orgânico';
    
    document.getElementById('modalNovoStatus').value = l.status_comercial;

    // Histórico de notas
    const timelineContainer = document.getElementById('modalTimeline');
    timelineContainer.innerHTML = '';

    if (historico.length === 0) {
      timelineContainer.innerHTML = '<div style="color: #64748b; font-size: 0.85rem; font-style: italic;">Nenhum contato ou nota registrado ainda.</div>';
    } else {
      historico.forEach(h => {
        const item = document.createElement('div');
        item.className = 'timeline-item';
        item.innerHTML = `
          <div class="timeline-meta">
            <span>${escapeHtml(h.autor)}</span>
            <span>${formatarData(h.data_registro)}</span>
          </div>
          <div class="timeline-text">${escapeHtml(h.texto)}</div>
        `;
        timelineContainer.appendChild(item);
      });
    }

    modal.classList.add('active');
  } catch (err) {
    alert('Erro ao abrir detalhes.');
  }
}

// Utilitários
function formatarData(isoStr) {
  if (!isoStr) return '-';
  try {
    const d = new Date(isoStr);
    return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  } catch (e) {
    return isoStr;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
