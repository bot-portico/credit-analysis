/**
 * CPF Validator - Biblioteca avançada para validação e formatação de CPF
 * Versão 2.0
 */

// Usando Module Pattern para encapsulamento e evitar poluição do escopo global
const CPFValidator = (function() {
  'use strict';
  
  // Cache para validações - melhora performance para CPFs verificados repetidamente
  const validationCache = new Map();
  
  // Lista de CPFs conhecidos como inválidos (todos dígitos iguais + outros casos especiais)
  const knownInvalidCPFs = [
    '00000000000', '11111111111', '22222222222', '33333333333', 
    '44444444444', '55555555555', '66666666666', '77777777777', 
    '88888888888', '99999999999', '12345678909'
  ];
  
  /**
   * Limpa um CPF, removendo caracteres não numéricos
   * @param {string} cpf - CPF para limpar
   * @returns {string} - CPF contendo apenas dígitos
   */
  function cleanCPF(cpf) {
    return typeof cpf === 'string' ? cpf.replace(/\D/g, '') : '';
  }
  
  /**
   * Formata um CPF enquanto o usuário digita
   * @param {string} value - Valor atual do campo
   * @param {boolean} partialFormat - Se true, formata CPFs incompletos
   * @returns {string} - CPF formatado
   */
  function formatCPF(value, partialFormat = true) {
    if (!value) return '';
    
    const digits = cleanCPF(value);
    
    // Formato parcial durante digitação
    if (partialFormat) {
      if (digits.length <= 3) {
        return digits;
      } else if (digits.length <= 6) {
        return `${digits.slice(0, 3)}.${digits.slice(3)}`;
      } else if (digits.length <= 9) {
        return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
      }
    }
    
    // Garante que usamos apenas os primeiros 11 dígitos (caso o input tenha mais)
    const cpfDigits = digits.slice(0, 11);
    
    // Formato completo (XXX.XXX.XXX-XX)
    if (cpfDigits.length >= 9) {
      return `${cpfDigits.slice(0, 3)}.${cpfDigits.slice(3, 6)}.${cpfDigits.slice(6, 9)}${cpfDigits.length > 9 ? '-' + cpfDigits.slice(9, 11) : ''}`;
    }
    
    return cpfDigits; // Retorna dígitos sem formatação se não couberem no padrão
  }
  
  /**
   * Valida um CPF
   * @param {string} cpf - CPF para validar
   * @returns {boolean} - true se CPF for válido
   */
  function isValidCPF(cpf) {
    // Verifica se o CPF está definido
    if (!cpf) return false;
    
    const cleanedCPF = cleanCPF(cpf);
    
    // Verifica se tem 11 dígitos
    if (cleanedCPF.length !== 11) return false;
    
    // Verifica se está no cache
    if (validationCache.has(cleanedCPF)) {
      return validationCache.get(cleanedCPF);
    }
    
    // Verifica se é um dos CPFs conhecidos como inválidos
    if (knownInvalidCPFs.includes(cleanedCPF)) {
      validationCache.set(cleanedCPF, false);
      return false;
    }
    
    // Verifica se todos os dígitos são iguais (caso inválido)
    if (/^(\d)\1+$/.test(cleanedCPF)) {
      validationCache.set(cleanedCPF, false);
      return false;
    }
    
    // Cálculo do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanedCPF.charAt(i)) * (10 - i);
    }
    
    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;
    
    if (parseInt(cleanedCPF.charAt(9)) !== digit1) {
      validationCache.set(cleanedCPF, false);
      return false;
    }
    
    // Cálculo do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanedCPF.charAt(i)) * (11 - i);
    }
    
    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;
    
    if (parseInt(cleanedCPF.charAt(10)) !== digit2) {
      validationCache.set(cleanedCPF, false);
      return false;
    }
    
    // Se chegou até aqui, o CPF é válido
    validationCache.set(cleanedCPF, true);
    return true;
  }
  
  /**
   * Gera um número de CPF válido (para testes)
   * @returns {string} - CPF válido formatado
   */
  function generateValidCPF() {
    // Gera 9 números aleatórios
    const numbers = [];
    for (let i = 0; i < 9; i++) {
      numbers.push(Math.floor(Math.random() * 10));
    }
    
    // Calcula o primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += numbers[i] * (10 - i);
    }
    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;
    
    // Adiciona o primeiro dígito verificador
    numbers.push(digit1);
    
    // Calcula o segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += numbers[i] * (11 - i);
    }
    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;
    
    // Adiciona o segundo dígito verificador
    numbers.push(digit2);
    
    // Converte para string e formata
    const cpf = numbers.join('');
    return formatCPF(cpf, false);
  }
  
  /**
   * Verifica a validez do CPF e retorna informações detalhadas
   * @param {string} cpf - CPF para analisar
   * @returns {Object} - Objeto com detalhes da validação
   */
  function validateCPFWithDetails(cpf) {
    const cleanedCPF = cleanCPF(cpf);
    
    // Resultado base
    const result = {
      value: cleanedCPF,
      formatted: formatCPF(cleanedCPF, false),
      isValid: false,
      errors: []
    };
    
    // Verifica se está vazio
    if (!cleanedCPF) {
      result.errors.push('CPF não informado');
      return result;
    }
    
    // Verifica o tamanho
    if (cleanedCPF.length !== 11) {
      result.errors.push(`CPF deve ter 11 dígitos (encontrado: ${cleanedCPF.length})`);
      return result;
    }
    
    // Verifica se é um dos CPFs conhecidos como inválidos
    if (knownInvalidCPFs.includes(cleanedCPF)) {
      result.errors.push('CPF inválido (sequência conhecida)');
      return result;
    }
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cleanedCPF)) {
      result.errors.push('CPF inválido (dígitos repetidos)');
      return result;
    }
    
    // Verificação do primeiro dígito
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanedCPF.charAt(i)) * (10 - i);
    }
    
    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;
    
    if (parseInt(cleanedCPF.charAt(9)) !== digit1) {
      result.errors.push('Primeiro dígito verificador inválido');
      return result;
    }
    
    // Verificação do segundo dígito
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanedCPF.charAt(i)) * (11 - i);
    }
    
    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;
    
    if (parseInt(cleanedCPF.charAt(10)) !== digit2) {
      result.errors.push('Segundo dígito verificador inválido');
      return result;
    }
    
    // Se chegou até aqui, o CPF é válido
    result.isValid = true;
    return result;
  }
  
  /**
   * Aplica máscaras em campos de CPF para formatação automática
   * @param {string|HTMLElement} selector - Seletor CSS ou elemento HTML
   * @param {Object} options - Opções de configuração
   */
  function applyMask(selector, options = {}) {
    const defaults = {
      validateOnBlur: true,     // Valida quando o campo perde o foco
      formatOnInput: true,      // Formata enquanto digita
      errorClass: 'cpf-error',  // Classe CSS para erros
      validClass: 'cpf-valid',  // Classe CSS para CPF válido
      onValid: null,            // Callback quando CPF é válido
      onInvalid: null,          // Callback quando CPF é inválido
      allowEmpty: true          // Se false, campo vazio é considerado inválido
    };
    
    const settings = { ...defaults, ...options };
    
    // Seleciona elementos
    const elements = typeof selector === 'string' 
      ? document.querySelectorAll(selector) 
      : [selector];
    
    elements.forEach(element => {
      if (!element || element.nodeName !== 'INPUT') return;
      
      // Input mask
      if (settings.formatOnInput) {
        element.addEventListener('input', function() {
          const cursorPos = this.selectionStart;
          const oldLength = this.value.length;
          
          this.value = formatCPF(this.value);
          
          // Restaura posição do cursor
          if (this.value.length !== oldLength) {
            const newPos = Math.min(
              cursorPos + (this.value.length - oldLength),
              this.value.length
            );
            this.setSelectionRange(newPos, newPos);
          }
        });
      }
      
      // Validação no blur
      if (settings.validateOnBlur) {
        element.addEventListener('blur', function() {
          const value = this.value;
          
          if (!value && settings.allowEmpty) {
            // Remove classes de erro se o campo estiver vazio e for permitido
            this.classList.remove(settings.errorClass, settings.validClass);
            return;
          }
          
          const isValid = isValidCPF(value);
          
          // Aplica classes CSS
          this.classList.toggle(settings.errorClass, !isValid);
          this.classList.toggle(settings.validClass, isValid);
          
          // Executa callbacks
          if (isValid && typeof settings.onValid === 'function') {
            settings.onValid(value, this);
          } else if (!isValid && typeof settings.onInvalid === 'function') {
            settings.onInvalid(value, this);
          }
          
          // Formata completamente o CPF se for válido
          if (isValid) {
            this.value = formatCPF(value, false);
          }
        });
      }
    });
  }
  
  /**
   * Limpa o cache de validação
   */
  function clearCache() {
    validationCache.clear();
  }
  
  // API pública
  return {
    format: formatCPF,
    isValid: isValidCPF,
    validate: validateCPFWithDetails,
    generate: generateValidCPF,
    applyMask: applyMask,
    clearCache: clearCache
  };
})();

// Aplicar máscaras automaticamente em elementos com a classe 'cpf-input'
document.addEventListener('DOMContentLoaded', function() {
  CPFValidator.applyMask('.cpf-input', {
    onValid: function(value, element) {
      // Remove mensagens de erro
      const errorMsg = element.parentNode.querySelector('.error-message');
      if (errorMsg) errorMsg.remove();
    },
    onInvalid: function(value, element) {
      // Adiciona mensagem de erro
      let errorMsg = element.parentNode.querySelector('.error-message');
      
      if (!errorMsg) {
        errorMsg = document.createElement('div');
        errorMsg.className = 'error-message text-xs text-red-500 mt-1';
        element.parentNode.insertBefore(errorMsg, element.nextSibling);
      }
      
      errorMsg.textContent = 'CPF inválido';
    }
  });
});

// Expõe globalmente para uso em outros scripts
window.CPFValidator = CPFValidator;
