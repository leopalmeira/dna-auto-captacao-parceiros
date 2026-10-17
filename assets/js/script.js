'use strict';

/**
 * MOBILE NAVBAR TOGGLE (ORIGINAL AUTOFIX)
 */
const navbar = document.querySelector("[data-navbar]");
const navToggler = document.querySelector("[data-nav-toggler]");

if (navToggler && navbar) {
  navToggler.addEventListener("click", function () {
    navbar.classList.toggle("active");
    this.classList.toggle("active");
  });
}

/**
 * MODAL DE PRÉ-CADASTRO DNA AUTO
 */
const modalBackdrop = document.getElementById("modalCadastro");
const openModalBtns = document.querySelectorAll("[data-open-modal], a[href='#cadastro']");
const closeModalBtns = document.querySelectorAll("[data-close-modal]");

function openModal() {
  if (modalBackdrop) {
    modalBackdrop.classList.add("active");
    document.body.style.overflow = "hidden";
    const firstInput = document.getElementById("nome_responsavel");
    if (firstInput) setTimeout(() => firstInput.focus(), 200);
  }
}

function closeModal() {
  if (modalBackdrop) {
    modalBackdrop.classList.remove("active");
    document.body.style.overflow = "";
  }
}

openModalBtns.forEach(btn => {
  btn.addEventListener("click", function (e) {
    e.preventDefault();
    openModal();
  });
});

closeModalBtns.forEach(btn => {
  btn.addEventListener("click", closeModal);
});

if (modalBackdrop) {
  modalBackdrop.addEventListener("click", function (e) {
    if (e.target === modalBackdrop) closeModal();
  });
}

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && modalBackdrop && modalBackdrop.classList.contains("active")) {
    closeModal();
  }
});

// Abre automaticamente se a URL tiver hash #cadastro
if (window.location.hash === "#cadastro") {
  setTimeout(openModal, 400);
}

/**
 * MÁSCARAS E VALIDAÇÃO CNPJ & WHATSAPP
 */
const cnpjInput = document.getElementById("cnpj");
const whatsappInput = document.getElementById("whatsapp");

if (cnpjInput) {
  cnpjInput.addEventListener("input", function (e) {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 14) v = v.slice(0, 14);

    if (v.length > 12) {
      v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})$/, "$1.$2.$3/$4-$5");
    } else if (v.length > 8) {
      v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{1,4})$/, "$1.$2.$3/$4");
    } else if (v.length > 5) {
      v = v.replace(/^(\d{2})(\d{3})(\d{1,3})$/, "$1.$2.$3");
    } else if (v.length > 2) {
      v = v.replace(/^(\d{2})(\d{1,3})$/, "$1.$2");
    }
    e.target.value = v;
  });
}

if (whatsappInput) {
  whatsappInput.addEventListener("input", function (e) {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);

    if (v.length > 10) {
      v = v.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
    } else if (v.length > 6) {
      v = v.replace(/^(\d{2})(\d{4})(\d{1,4})$/, "($1) $2-$3");
    } else if (v.length > 2) {
      v = v.replace(/^(\d{2})(\d{1,5})$/, "($1) $2");
    }
    e.target.value = v;
  });
}

function validarCNPJ(cnpj) {
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

/**
 * ENVIO DO FORMULÁRIO DE PRÉ-CADASTRO
 */
const form = document.getElementById("formPreCadastro");
const submitBtn = document.getElementById("submitBtn");
const formAlert = document.getElementById("formAlert");
const formCardBody = document.getElementById("formCardBody");
const successScreen = document.getElementById("successScreen");

function showAlert(msg, type = "danger") {
  if (formAlert) {
    formAlert.className = "form-alert " + type;
    formAlert.textContent = msg;
    formAlert.style.display = "block";
  }
}

function hideAlert() {
  if (formAlert) {
    formAlert.style.display = "none";
    formAlert.textContent = "";
  }
}

if (form) {
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    hideAlert();

    const nomeResp = document.getElementById("nome_responsavel");
    const nomeFant = document.getElementById("nome_fantasia");
    const cnpj = document.getElementById("cnpj");
    const whats = document.getElementById("whatsapp");
    const munic = document.getElementById("municipio");
    const bairro = document.getElementById("bairro");
    const tipo = document.getElementById("tipo_estabelecimento");
    const consentLgpd = document.getElementById("consentimento_lgpd");

    // Validações básicas
    if (!nomeResp.value.trim() || !nomeFant.value.trim() || !cnpj.value.trim() || !whats.value.trim() || !munic.value.trim() || !bairro.value.trim() || !tipo.value) {
      showAlert("Por favor, preencha todos os campos obrigatórios marcados com asterisco (*).", "danger");
      return;
    }

    if (!validarCNPJ(cnpj.value)) {
      showAlert("O CNPJ informado não é válido. Verifique os 14 dígitos digitados.", "danger");
      cnpj.focus();
      return;
    }

    if (!consentLgpd || !consentLgpd.checked) {
      showAlert("É necessário concordar com o tratamento de dados para enviar seu pré-cadastro.", "warning");
      return;
    }

    const payload = {
      nome_responsavel: nomeResp.value.trim(),
      nome_fantasia: nomeFant.value.trim(),
      cnpj: cnpj.value.trim(),
      whatsapp: whats.value.trim(),
      municipio: munic.value.trim(),
      bairro: bairro.value.trim(),
      tipo_estabelecimento: tipo.value,
      email: document.getElementById("email")?.value.trim() || null,
      faixa_veiculos: document.getElementById("faixa_veiculos")?.value || "Prefiro informar depois",
      observacoes: document.getElementById("observacoes")?.value.trim() || null,
      consentimento_lgpd: consentLgpd.checked,
      consentimento_promocional: !!document.getElementById("consentimento_promocional")?.checked,
      origem_campanha: "landing_page_autofix"
    };

    submitBtn.disabled = true;
    submitBtn.classList.add("loading");

    let endpoint = "/api/leads";
    if (window.location.hostname.includes("github.io")) {
      endpoint = "https://dna-auto-captacao-parceiros.onrender.com/api/leads";
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.status === 201 && data.sucesso) {
        if (formCardBody && successScreen) {
          formCardBody.style.display = "none";
          const protoEl = document.getElementById("protocoloNumero");
          if (protoEl) protoEl.textContent = data.protocolo || "CONFIRMADO";
          successScreen.classList.add("show");
        }
      } else if (response.status === 409) {
        showAlert(data.mensagem || "Este CNPJ já possui um pré-cadastro registrado em nossa base. Nossa equipe entrará em contato.", "warning");
      } else {
        showAlert(data.mensagem || "Não foi possível concluir o envio. Seus dados foram preservados. Tente novamente.", "danger");
      }
    } catch (err) {
      console.error("[Submit error]:", err);
      showAlert("Falha de conexão com o servidor. Seus dados foram preservados. Tente novamente em instantes.", "danger");
    } finally {
      submitBtn.disabled = false;
      submitBtn.classList.remove("loading");
    }
  });
}
