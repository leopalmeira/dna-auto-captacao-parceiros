/**
 * Validador estrito de CNPJ brasileiro com cálculo dos dois dígitos verificadores
 */
function validarCNPJ(cnpj) {
  if (!cnpj) return false;
  const limpo = String(cnpj).replace(/\D/g, '');
  if (limpo.length !== 14) return false;

  // Rejeita sequências repetidas conhecidas
  if (/^(\d)\1{13}$/.test(limpo)) return false;

  // Cálculo do 1º Dígito Verificador
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

  // Cálculo do 2º Dígito Verificador
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

function formatarCNPJ(cnpj) {
  const limpo = String(cnpj).replace(/\D/g, '');
  if (limpo.length !== 14) return cnpj;
  return limpo.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

function validarWhatsApp(telefone) {
  if (!telefone) return false;
  const limpo = String(telefone).replace(/\D/g, '');
  // DDD brasileiro (2 dígitos de 11 a 99) + 8 ou 9 dígitos do número
  if (limpo.length < 10 || limpo.length > 11) return false;
  const ddd = parseInt(limpo.substring(0, 2), 10);
  if (ddd < 11 || ddd > 99) return false;
  // Se for celular (11 dígitos), o terceiro dígito deve ser 9
  if (limpo.length === 11 && limpo.charAt(2) !== '9') return false;
  return true;
}

function formatarWhatsApp(telefone) {
  const limpo = String(telefone).replace(/\D/g, '');
  if (limpo.length === 11) {
    return limpo.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  } else if (limpo.length === 10) {
    return limpo.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }
  return telefone;
}

function sanitizarTexto(texto) {
  if (typeof texto !== 'string') return '';
  return texto.trim().replace(/[<>]/g, '');
}

module.exports = {
  validarCNPJ,
  formatarCNPJ,
  validarWhatsApp,
  formatarWhatsApp,
  sanitizarTexto
};
