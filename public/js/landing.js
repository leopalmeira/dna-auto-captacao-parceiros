/**
 * DNA AUTO — Script da Landing Page de Captação de Parceiros
 * Máscaras reativas, Validação de CNPJ e WhatsApp, Captura de UTMs e Envio Assíncrono
 */

document.addEventListener('DOMContentLoaded', () => {
  initMasks();
  initUtmCapture();
  initFormSubmit();
  initFaqAccordion();
  initSmoothScroll();
});

// 1. Captura de Parâmetros UTM e Origem da Campanha
function initUtmCapture() {
  const urlParams = new URLSearchParams(window.location.search);
  const utmFields = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'origem_campanha'];
  
  utmFields.forEach(field => {
    const val = urlParams.get(field);
    const inputEl = document.getElementById(field);
    if (val && inputEl) {
      inputEl.value = val;
    }
  });

  // Se houver referenciador externo e nenhum utm_source, registra o referrer
  const utmSourceInput = document.getElementById('utm_source');
  if (utmSourceInput && !utmSourceInput.value && document.referrer) {
    try {
      const refUrl = new URL(document.referrer);
      if (refUrl.hostname !== window.location.hostname) {
        utmSourceInput.value = 'ref_' + refUrl.hostname;
      }
    } catch (e) {}
  }
}

// 2. Máscaras Reativas de CNPJ e WhatsApp
function initMasks() {
  const cnpjInput = document.getElementById('cnpj');
  const whatsappInput = document.getElementById('whatsapp');

  if (cnpjInput) {
    cnpjInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length > 14) v = v.slice(0, 14);
      
      if (v.length > 12) {
        v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})$/, '$1.$2.$3/$4-$5');
      } else if (v.length > 8) {
        v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{1,4})$/, '$1.$2.$3/$4');
      } else if (v.length > 5) {
        v = v.replace(/^(\d{2})(\d{3})(\d{1,3})$/, '$1.$2.$3');
      } else if (v.length > 2) {
        v = v.replace(/^(\d{2})(\d{1,3})$/, '$1.$2');
      }
      e.target.value = v;
    });

    cnpjInput.addEventListener('blur', () => {
      const v = cnpjInput.value.replace(/\D/g, '');
      if (v.length > 0 && !validarCNPJFrontend(v)) {
        marcarErroCampo(cnpjInput, 'CNPJ inválido. Verifique os números digitados.');
      } else {
        limparErroCampo(cnpjInput);
      }
    });
  }

  if (whatsappInput) {
    whatsappInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      if (v.length > 11) v = v.slice(0, 11);

      if (v.length > 10) {
        // Celular: (XX) 9XXXX-XXXX
        v = v.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
      } else if (v.length > 6) {
        // Fixo ou celular digitando: (XX) XXXX-XXXX
        v = v.replace(/^(\d{2})(\d{4})(\d{1,4})$/, '($1) $2-$3');
      } else if (v.length > 2) {
        v = v.replace(/^(\d{2})(\d{1,5})$/, '($1) $2');
      }
      e.target.value = v;
    });

    whatsappInput.addEventListener('blur', () => {
      const v = whatsappInput.value.replace(/\D/g, '');
      if (v.length > 0 && (v.length < 10 || v.length > 11)) {
        marcarErroCampo(whatsappInput, 'Informe o DDD e o número completo do WhatsApp.');
      } else {
        limparErroCampo(whatsappInput);
      }
    });
  }
}

// Validação de CNPJ no frontend para feedback ágil
function validarCNPJFrontend(cnpj) {
  const limpo = String(cnpj).replace(/\D/g, '');
  if (limpo.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(limpo)) return false;

  let tamanho = limpo.length - 2;
  let numeros = limpo.substring(0, tamanho);
  let digitos = limpo.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0), 10)) return false;

  tamanho = tamanho + 1;
  numeros = limpo.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--;
    if (pos < 2) pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  return resultado === parseInt(digitos.charAt(1), 10);
}

// 3. Envio Assíncrono do Formulário
function initFormSubmit() {
  const form = document.getElementById('formPreCadastro');
  const submitBtn = document.getElementById('submitBtn');
  const formAlert = document.getElementById('formAlert');
  const successScreen = document.getElementById('successScreen');
  const formCardBody = document.getElementById('formCardBody');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    limparTodosErros();

    // Validação inicial dos campos obrigatórios
    let temErro = false;
    const obrigatorios = [
      { id: 'nome_responsavel', msg: 'Informe o nome completo do responsável.' },
      { id: 'nome_fantasia', msg: 'Informe o nome fantasia da oficina.' },
      { id: 'cnpj', msg: 'Informe um CNPJ válido.' },
      { id: 'whatsapp', msg: 'Informe o WhatsApp de contato com DDD.' },
      { id: 'municipio', msg: 'Informe o município da oficina.' },
      { id: 'bairro', msg: 'Informe o bairro da oficina.' },
      { id: 'tipo_estabelecimento', msg: 'Selecione o tipo de estabelecimento.' }
    ];

    obrigatorios.forEach(item => {
      const el = document.getElementById(item.id);
      if (!el || !el.value.trim()) {
        marcarErroCampo(el, item.msg);
        temErro = true;
      }
    });

    const cnpjEl = document.getElementById('cnpj');
    if (cnpjEl && !validarCNPJFrontend(cnpjEl.value)) {
      marcarErroCampo(cnpjEl, 'CNPJ inválido. Verifique os 14 números digitados.');
      temErro = true;
    }

    const consentLgpd = document.getElementById('consentimento_lgpd');
    if (!consentLgpd || !consentLgpd.checked) {
      exibirAlertaFormulario('É necessário aceitar os termos de tratamento de dados para efetuar o pré-cadastro.', 'warning');
      temErro = true;
    }

    if (temErro) {
      const primeiroErro = form.querySelector('.is-invalid');
      if (primeiroErro) {
        primeiroErro.scrollIntoView({ behavior: 'smooth', block: 'center' });
        primeiroErro.focus();
      }
      return;
    }

    // Coleta dos dados
    const formData = new FormData(form);
    const payload = {
      nome_responsavel: formData.get('nome_responsavel'),
      nome_fantasia: formData.get('nome_fantasia'),
      cnpj: formData.get('cnpj'),
      whatsapp: formData.get('whatsapp'),
      municipio: formData.get('municipio'),
      bairro: formData.get('bairro'),
      tipo_estabelecimento: formData.get('tipo_estabelecimento'),
      email: formData.get('email') || null,
      faixa_veiculos: formData.get('faixa_veiculos') || 'Prefiro informar depois',
      observacoes: formData.get('observacoes') || null,
      consentimento_lgpd: consentLgpd.checked,
      consentimento_promocional: !!document.getElementById('consentimento_promocional')?.checked,
      origem_campanha: formData.get('origem_campanha') || 'web_landing_page',
      utm_source: formData.get('utm_source') || null,
      utm_medium: formData.get('utm_medium') || null,
      utm_campaign: formData.get('utm_campaign') || null,
      utm_content: formData.get('utm_content') || null,
      utm_term: formData.get('utm_term') || null
    };

    // Estado de carregamento e prevenção contra múltiplos envios
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    ocultarAlertaFormulario();

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.status === 201 && data.sucesso) {
        // Sucesso: transição suave para tela de confirmação
        if (formCardBody && successScreen) {
          formCardBody.style.display = 'none';
          const protoEl = document.getElementById('protocoloNumero');
          if (protoEl) protoEl.textContent = data.protocolo || 'CONFIRMADO';
          successScreen.classList.add('show');
          successScreen.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else if (response.status === 409) {
        // CNPJ duplicado
        exibirAlertaFormulario(data.mensagem || 'Este CNPJ já possui um pré-cadastro registrado em nossa base. Nossa equipe comercial entrará em contato em breve.', 'warning');
      } else if (response.status === 400 && data.erros) {
        // Erros de validação do servidor
        Object.keys(data.erros).forEach(campoId => {
          const el = document.getElementById(campoId);
          if (el) marcarErroCampo(el, data.erros[campoId]);
        });
        exibirAlertaFormulario(data.mensagem || 'Por favor, revise os campos destacados abaixo.', 'danger');
      } else if (response.status === 429) {
        exibirAlertaFormulario(data.mensagem || 'Muitas tentativas a partir deste dispositivo. Por favor, aguarde alguns minutos.', 'warning');
      } else {
        exibirAlertaFormulario(data.mensagem || 'Não foi possível concluir o envio no momento. Seus dados foram preservados. Tente novamente.', 'danger');
      }
    } catch (err) {
      console.error('[Landing Submit Error]:', err);
      exibirAlertaFormulario('Houve uma falha de conexão com o servidor. Verifique sua conexão e tente novamente. Seus dados foram preservados.', 'danger');
    } finally {
      submitBtn.disabled = false;
      submitBtn.classList.remove('loading');
    }
  });
}

function marcarErroCampo(inputEl, mensagem) {
  if (!inputEl) return;
  inputEl.classList.add('is-invalid');
  const parent = inputEl.closest('.form-group');
  if (parent) {
    let errEl = parent.querySelector('.error-feedback');
    if (!errEl) {
      errEl = document.createElement('span');
      errEl.className = 'error-feedback';
      parent.appendChild(errEl);
    }
    errEl.textContent = mensagem;
    errEl.classList.add('show');
  }
}

function limparErroCampo(inputEl) {
  if (!inputEl) return;
  inputEl.classList.remove('is-invalid');
  const parent = inputEl.closest('.form-group');
  if (parent) {
    const errEl = parent.querySelector('.error-feedback');
    if (errEl) errEl.classList.remove('show');
  }
}

function limparTodosErros() {
  document.querySelectorAll('.form-control.is-invalid').forEach(el => el.classList.remove('is-invalid'));
  document.querySelectorAll('.error-feedback.show').forEach(el => el.classList.remove('show'));
  ocultarAlertaFormulario();
}

function exibirAlertaFormulario(msg, tipo = 'danger') {
  const alertEl = document.getElementById('formAlert');
  if (!alertEl) return;
  alertEl.className = `form-alert alert-${tipo} show`;
  alertEl.textContent = msg;
  alertEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function ocultarAlertaFormulario() {
  const alertEl = document.getElementById('formAlert');
  if (alertEl) {
    alertEl.className = 'form-alert';
    alertEl.textContent = '';
  }
}

// 4. FAQ Acordeão
function initFaqAccordion() {
  const items = document.querySelectorAll('.accordion-item');
  items.forEach(item => {
    const header = item.querySelector('.accordion-header');
    const content = item.querySelector('.accordion-content');
    if (!header || !content) return;

    header.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Fecha outros itens
      items.forEach(other => {
        if (other !== item) {
          other.classList.remove('active');
          const otherContent = other.querySelector('.accordion-content');
          if (otherContent) otherContent.style.maxHeight = null;
        }
      });

      if (!isActive) {
        item.classList.add('active');
        content.style.maxHeight = content.scrollHeight + 'px';
      } else {
        item.classList.remove('active');
        content.style.maxHeight = null;
      }
    });
  });
}

// 5. Scroll Suave para Links Ancorados
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#' || targetId === '') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Se for o formulário, foca no primeiro campo após a rolagem
        if (targetId === '#cadastro') {
          setTimeout(() => {
            const firstInput = document.getElementById('nome_responsavel');
            if (firstInput) firstInput.focus();
          }, 450);
        }
      }
    });
  });
}
