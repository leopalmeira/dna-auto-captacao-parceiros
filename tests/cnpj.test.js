const { test, describe } = require('node:test');
const assert = require('node:assert');
const {
  validarCNPJ,
  formatarCNPJ,
  validarWhatsApp,
  formatarWhatsApp
} = require('../src/utils/validators');

describe('Validação e Formatação de CNPJ', () => {
  test('deve validar CNPJs reais e válidos', () => {
    // Exemplos de CNPJs válidos com dígitos verificadores corretos
    const cnpjsValidos = [
      '11.222.333/0001-81',
      '11222333000181',
      '00.000.000/0001-91', // Banco do Brasil
      '00000000000191',
      '33.000.167/0001-01', // Petrobras
      '33000167000101'
    ];

    for (const cnpj of cnpjsValidos) {
      assert.strictEqual(validarCNPJ(cnpj), true, `Deveria ser válido: ${cnpj}`);
    }
  });

  test('deve rejeitar CNPJs com dígitos verificadores incorretos', () => {
    const cnpjsInvalidos = [
      '11.222.333/0001-82', // Último dígito errado
      '11.222.333/0001-99',
      '33.000.167/0001-00'
    ];

    for (const cnpj of cnpjsInvalidos) {
      assert.strictEqual(validarCNPJ(cnpj), false, `Deveria ser inválido: ${cnpj}`);
    }
  });

  test('deve rejeitar sequências repetidas ou tamanhos inválidos', () => {
    const repetidos = [
      '00000000000000',
      '11111111111111',
      '99999999999999',
      '123',
      '',
      null,
      undefined
    ];

    for (const item of repetidos) {
      assert.strictEqual(validarCNPJ(item), false);
    }
  });

  test('deve formatar CNPJ corretamente', () => {
    assert.strictEqual(formatarCNPJ('11222333000181'), '11.222.333/0001-81');
    assert.strictEqual(formatarCNPJ('33000167000101'), '33.000.167/0001-01');
  });
});

describe('Validação e Formatação de WhatsApp', () => {
  test('deve validar telefones e celulares brasileiros válidos com DDD', () => {
    assert.strictEqual(validarWhatsApp('(21) 98888-7777'), true);
    assert.strictEqual(validarWhatsApp('21988887777'), true);
    assert.strictEqual(validarWhatsApp('24999991111'), true);
    assert.strictEqual(validarWhatsApp('2122223333'), true); // Fixo comercial
  });

  test('deve rejeitar telefones inválidos', () => {
    assert.strictEqual(validarWhatsApp('123'), false);
    assert.strictEqual(validarWhatsApp('00988887777'), false); // DDD 00 inválido
    assert.strictEqual(validarWhatsApp('21188887777'), false); // Celular 11 dígitos iniciando com 1 em vez de 9
    assert.strictEqual(validarWhatsApp(''), false);
    assert.strictEqual(validarWhatsApp(null), false);
  });

  test('deve formatar WhatsApp corretamente', () => {
    assert.strictEqual(formatarWhatsApp('21988887777'), '(21) 98888-7777');
    assert.strictEqual(formatarWhatsApp('2122223333'), '(21) 2222-3333');
  });
});
