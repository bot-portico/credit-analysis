/**
 * formatter.js - Biblioteca avançada de formatação para aplicações financeiras
 * Versão 2.0
 */

// Utilizando padrão de módulo para evitar poluição do escopo global
const Formatter = (function() {
  'use strict';

  // Configurações
  const config = {
    locale: 'pt-BR',
    currency: 'BRL',
    dateFormat: 'dd/MM/yyyy',
    phoneFormat: '(99) 99999-9999'
  };

  /**
   * Formata valores monetários com suporte a valores negativos e grandes
   * @param {string|number} value - Valor a ser formatado
   * @param {boolean} showSymbol - Se deve mostrar o símbolo da moeda (padrão: true)
   * @returns {string} - Valor formatado como moeda
   */
  function formatMoney(value, showSymbol = true) {
    if (value === null || value === undefined || value === '') return showSymbol ? 'R$ 0,00' : '0,00';
    
    // Converte para string e limpa caracteres não numéricos (mantendo '-' para negativos)
    let isNegative = false;
    let valueStr = String(value);
    
    if (valueStr.startsWith('-')) {
      isNegative = true;
      valueStr = valueStr.substring(1);
    }

    // Remove caracteres não numéricos
    const digits = valueStr.replace(/\D/g, '');
    
    if (!digits) return showSymbol ? 'R$ 0,00' : '0,00';
    
    // Converte para número com 2 casas decimais
    const digitsAsNumber = parseInt(digits, 10) / 100;
    
    // Formata usando Intl.NumberFormat para garantir suporte a números grandes
    const formatter = new Intl.NumberFormat(config.locale, {
      style: showSymbol ? 'currency' : 'decimal',
      currency: config.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return isNegative ? '-' + formatter.format(Math.abs(digitsAsNumber)) : formatter.format(digitsAsNumber);
  }

  /**
   * Formata valores monetários enquanto o usuário digita, preservando a posição do cursor
   * @param {HTMLInputElement} inputElement - Elemento de input
   */
  function applyMoneyMask(inputElement) {
    if (!inputElement) return;
    
    const value = inputElement.value;
    const cursorPosition = inputElement.selectionStart;
    
    // Conta dígitos antes da posição do cursor
    const digitsBefore = (value.substring(0, cursorPosition).match(/\d/g) || []).length;
    
    // Formata o valor sem o símbolo da moeda para uso dentro do input
    const formatted = formatMoney(value, false);
    inputElement.value = formatted;
    
    // Recalcula posição do cursor
    const formattedSubstring = formatted.substring(0, formatted.length);
    let newCursorPos = 0;
    let digitCount = 0;
    
    for (let i = 0; i < formattedSubstring.length; i++) {
      if (/\d/.test(formattedSubstring[i])) {
        digitCount++;
      }
      if (digitCount === digitsBefore) {
        newCursorPos = i + 1;
        break;
      }
    }
    
    // Posiciona o cursor
    setTimeout(() => {
      try {
        inputElement.setSelectionRange(newCursorPos, newCursorPos);
      } catch (e) {
        console.warn('Erro ao definir posição do cursor:', e);
      }
    }, 0);
  }

  /**
   * Converte valores formatados em moeda para números
   * @param {string} formattedValue - Valor formatado
   * @returns {number} - Valor numérico
   */
  function parseMoneyToNumber(formattedValue) {
    if (!formattedValue) return 0;
    
    let isNegative = formattedValue.includes('-');
    let valueStr = formattedValue
      .replace(/\./g, '')          // Remove pontos de milhar
      .replace(',', '.')           // Substitui vírgula por ponto decimal
      .replace(/[^\d.-]/g, '');    // Remove caracteres não numéricos exceto ponto e hífen
    
    // Garante que o valor tenha apenas um ponto decimal
    const parts = valueStr.split('.');
    if (parts.length > 2) {
      valueStr = parts[0] + '.' + parts.slice(1).join('');
    }
    
    const number = parseFloat(valueStr) || 0;
    return isNegative ? -Math.abs(number) : number;
  }

  /**
   * Formata uma data para exibição no formato brasileiro
   * @param {string|Date} date - Data ou string de data
   * @param {string} format - Formato desejado (padrão é config.dateFormat)
   * @returns {string} - Data formatada
   */
  function formatDate(date, format = config.dateFormat) {
    if (!date) return '';
    
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Verifica se a data é válida
    if (isNaN(dateObj.getTime())) return '';
    
    // Implementação simples de formatação de data que suporta dd/MM/yyyy e yyyy-MM-dd
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    
    let formatted;
    switch (format) {
      case 'dd/MM/yyyy':
        formatted = `${day}/${month}/${year}`;
        break;
      case 'yyyy-MM-dd':
        formatted = `${year}-${month}-${day}`;
        break;
      case 'dd/MM/yy':
        formatted = `${day}/${month}/${String(year).slice(-2)}`;
        break;
      case 'dd de MMMM de yyyy':
        const months = [
          'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
          'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
        ];
        formatted = `${day} de ${months[dateObj.getMonth()]} de ${year}`;
        break;
      default:
        formatted = `${day}/${month}/${year}`;
    }
    
    return formatted;
  }

  /**
   * Converte uma data formatada para um objeto Date
   * @param {string} formattedDate - Data formatada (DD/MM/YYYY)
   * @returns {Date|null} - Objeto Date ou null se inválido
   */
  function parseDate(formattedDate) {
    if (!formattedDate) return null;
    
    // Detecta o formato da data
    let day, month, year;
    
    if (formattedDate.includes('/')) {
      // Formato DD/MM/YYYY
      const parts = formattedDate.split('/');
      if (parts.length !== 3) return null;
      
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1; // Mês começa em 0
      year = parseInt(parts[2], 10);
    } else if (formattedDate.includes('-')) {
      // Formato YYYY-MM-DD
      const parts = formattedDate.split('-');
      if (parts.length !== 3) return null;
      
      day = parseInt(parts[2], 10);
      month = parseInt(parts[1], 10) - 1; // Mês começa em 0
      year = parseInt(parts[0], 10);
    } else {
      return null;
    }
    
    // Valida os valores
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    if (day < 1 || day > 31 || month < 0 || month > 11) return null;
    
    const date = new Date(year, month, day);
    
    // Verifica se a data é válida
    if (isNaN(date.getTime())) return null;
    
    return date;
  }

  /**
   * Formata telefones com suporte a telefones fixos e celulares
   * @param {string} value - Número de telefone
   * @returns {string} - Telefone formatado
   */
  function formatPhone(value) {
    if (!value) return '';
    
    // Remove todos os caracteres não numéricos
    const digits = value.replace(/\D/g, '');
    
    if (digits.length === 0) return '';
    
    // Aplica a formatação adequada
    if (digits.length <= 2) {
      return `(${digits}`;
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    } else if (digits.length <= 10) {
      // Telefone fixo: (XX) XXXX-XXXX
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    } else {
      // Celular: (XX) XXXXX-XXXX
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
    }
  }

  /**
   * Formata um número de CPF
   * @param {string} value - CPF não formatado
   * @returns {string} - CPF formatado (XXX.XXX.XXX-XX)
   */
  function formatCPF(value) {
    if (!value) return '';
    
    // Remove caracteres não numéricos
    const digits = value.replace(/\D/g, '');
    
    if (digits.length === 0) return '';
    
    // Aplica a máscara
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    } else if (digits.length <= 9) {
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    } else {
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
    }
  }

  /**
   * Formata um número de CNPJ
   * @param {string} value - CNPJ não formatado
   * @returns {string} - CNPJ formatado (XX.XXX.XXX/XXXX-XX)
   */
  function formatCNPJ(value) {
    if (!value) return '';
    
    // Remove caracteres não numéricos
    const digits = value.replace(/\D/g, '');
    
    if (digits.length === 0) return '';
    
    // Aplica a máscara
    if (digits.length <= 2) {
      return digits;
    } else if (digits.length <= 5) {
      return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    } else if (digits.length <= 8) {
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    } else if (digits.length <= 12) {
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    } else {
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
    }
  }

  /**
   * Formata um CEP
   * @param {string} value - CEP não formatado
   * @returns {string} - CEP formatado (XXXXX-XXX)
   */
  function formatCEP(value) {
    if (!value) return '';
    
    // Remove caracteres não numéricos
    const digits = value.replace(/\D/g, '');
    
    if (digits.length === 0) return '';
    
    if (digits.length <= 5) {
      return digits;
    } else {
      return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
    }
  }

  /**
   * Formata um número com separadores de milhar e casas decimais
   * @param {string|number} value - Valor numérico
   * @param {number} decimals - Número de casas decimais (padrão: 2)
   * @returns {string} - Número formatado
   */
  function formatNumber(value, decimals = 2) {
    if (value === null || value === undefined || value === '') return '0';
    
    const number = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
    
    if (isNaN(number)) return '0';
    
    return number.toLocaleString(config.locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  /**
   * Formata um valor como percentual
   * @param {string|number} value - Valor a ser formatado
   * @param {number} decimals - Número de casas decimais (padrão: 2)
   * @returns {string} - Valor formatado como percentual
   */
  function formatPercent(value, decimals = 2) {
    if (value === null || value === undefined || value === '') return '0%';
    
    const number = typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value;
    
    if (isNaN(number)) return '0%';
    
    return number.toLocaleString(config.locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  /**
   * Valida um CPF
   * @param {string} cpf - CPF a ser validado
   * @returns {boolean} - true se o CPF for válido
   */
  function validateCPF(cpf) {
    if (!cpf) return false;
    
    // Remove caracteres não numéricos
    cpf = cpf.replace(/\D/g, '');
    
    if (cpf.length !== 11) return false;
    
    // Verifica CPFs conhecidos inválidos
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    // Validação do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    
    let remainder = sum % 11;
    let dv1 = remainder < 2 ? 0 : 11 - remainder;
    
    if (parseInt(cpf.charAt(9)) !== dv1) return false;
    
    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    
    remainder = sum % 11;
    let dv2 = remainder < 2 ? 0 : 11 - remainder;
    
    if (parseInt(cpf.charAt(10)) !== dv2) return false;
    
    return true;
  }

  /**
   * Valida um CNPJ
   * @param {string} cnpj - CNPJ a ser validado
   * @returns {boolean} - true se o CNPJ for válido
   */
  function validateCNPJ(cnpj) {
    if (!cnpj) return false;
    
    // Remove caracteres não numéricos
    cnpj = cnpj.replace(/\D/g, '');
    
    if (cnpj.length !== 14) return false;
    
    // Verifica CNPJs conhecidos inválidos
    if (/^(\d)\1{13}$/.test(cnpj)) return false;
    
    // Validação do primeiro dígito verificador
    let sum = 0;
    let weight = 5;
    
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cnpj.charAt(i)) * weight;
      weight = weight === 2 ? 9 : weight - 1;
    }
    
    let remainder = sum % 11;
    let dv1 = remainder < 2 ? 0 : 11 - remainder;
    
    if (parseInt(cnpj.charAt(12)) !== dv1) return false;
    
    // Validação do segundo dígito verificador
    sum = 0;
    weight = 6;
    
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cnpj.charAt(i)) * weight;
      weight = weight === 2 ? 9 : weight - 1;
    }
    
    remainder = sum % 11;
    let dv2 = remainder < 2 ? 0 : 11 - remainder;
    
    if (parseInt(cnpj.charAt(13)) !== dv2) return false;
    
    return true;
  }

  /**
   * Aplica as máscaras automáticas nos campos do formulário
   */
  function setupMasks() {
    // Máscaras de dinheiro
    document.querySelectorAll('.money-input').forEach(input => {
      input.addEventListener('input', () => applyMoneyMask(input));
      input.addEventListener('focus', () => {
        // Remove formatação ao focar para facilitar edição
        const value = parseMoneyToNumber(input.value);
        input.value = value ? (value * 100).toFixed(0) : '';
      });
      
      input.addEventListener('blur', () => {
        // Reaplica formatação ao perder o foco
        input.value = formatMoney(input.value, false);
      });
      
      // Aplica formatação inicial se houver valor
      if (input.value) {
        input.value = formatMoney(input.value, false);
      }
    });
    
    // Máscaras de telefone
    document.querySelectorAll('.phone-input').forEach(input => {
      input.addEventListener('input', function() {
        this.value = formatPhone(this.value);
      });
    });
    
    // Máscaras de CPF
    document.querySelectorAll('.cpf-input').forEach(input => {
      input.addEventListener('input', function() {
        this.value = formatCPF(this.value);
      });
      
      input.addEventListener('blur', function() {
        // Validação do CPF ao perder o foco
        if (this.value && !validateCPF(this.value)) {
          this.classList.add('border-red-500');
          
          // Adiciona mensagem de erro se não existir
          let errorMsg = this.nextElementSibling;
          if (!errorMsg || !errorMsg.classList.contains('error-message')) {
            errorMsg = document.createElement('p');
            errorMsg.className = 'error-message text-xs text-red-500 mt-1';
            this.parentNode.insertBefore(errorMsg, this.nextSibling);
          }
          errorMsg.textContent = 'CPF inválido';
        } else {
          this.classList.remove('border-red-500');
          
          // Remove mensagem de erro se existir
          const errorMsg = this.nextElementSibling;
          if (errorMsg && errorMsg.classList.contains('error-message')) {
            errorMsg.parentNode.removeChild(errorMsg);
          }
        }
      });
    });
    
    // Máscaras de CNPJ
    document.querySelectorAll('.cnpj-input').forEach(input => {
      input.addEventListener('input', function() {
        this.value = formatCNPJ(this.value);
      });
      
      input.addEventListener('blur', function() {
        // Validação do CNPJ ao perder o foco
        if (this.value && !validateCNPJ(this.value)) {
          this.classList.add('border-red-500');
          
          // Adiciona mensagem de erro se não existir
          let errorMsg = this.nextElementSibling;
          if (!errorMsg || !errorMsg.classList.contains('error-message')) {
            errorMsg = document.createElement('p');
            errorMsg.className = 'error-message text-xs text-red-500 mt-1';
            this.parentNode.insertBefore(errorMsg, this.nextSibling);
          }
          errorMsg.textContent = 'CNPJ inválido';
        } else {
          this.classList.remove('border-red-500');
          
          // Remove mensagem de erro se existir
          const errorMsg = this.nextElementSibling;
          if (errorMsg && errorMsg.classList.contains('error-message')) {
            errorMsg.parentNode.removeChild(errorMsg);
          }
        }
      });
    });
    
    // Máscaras de CEP
    document.querySelectorAll('.cep-input').forEach(input => {
      input.addEventListener('input', function() {
        this.value = formatCEP(this.value);
      });
      
      // Adiciona busca automática de endereço via CEP
      input.addEventListener('blur', async function() {
        if (this.value.replace(/\D/g, '').length === 8) {
          try {
            const response = await fetch(`https://viacep.com.br/ws/${this.value.replace(/\D/g, '')}/json/`);
            const data = await response.json();
            
            if (!data.erro) {
              // Dispara evento personalizado com os dados do endereço
              const event = new CustomEvent('cepfound', { detail: data });
              this.dispatchEvent(event);
            }
          } catch (error) {
            console.warn('Erro ao buscar CEP:', error);
          }
        }
      });
    });
    
    // Formata datas no padrão brasileiro
    document.querySelectorAll('input[type="date"]').forEach(input => {
      const originalValue = input.value;
      
      // Ao perder o foco, formata para exibição se necessário
      input.addEventListener('blur', function() {
        if (this.dataset.formatted === 'true') return;
        
        const dateValue = this.value;
        if (dateValue) {
          const formattedDate = formatDate(dateValue);
          
          // Se o input não for nativo de data, mostra formatado
          if (this.type !== 'date') {
            this.value = formattedDate;
            this.dataset.isoValue = dateValue; // Guarda o valor ISO
            this.dataset.formatted = 'true';
          }
        }
      });
      
      // Ao focar, volta para formato ISO para edição
      input.addEventListener('focus', function() {
        if (this.dataset.formatted === 'true') {
          this.value = this.dataset.isoValue || '';
          this.dataset.formatted = 'false';
        }
      });
      
      // Aplica formatação inicial se houver valor e não for um input nativo de data
      if (originalValue && input.type !== 'date') {
        input.value = formatDate(originalValue);
        input.dataset.isoValue = originalValue;
        input.dataset.formatted = 'true';
      }
    });
  }

  /**
   * Adiciona listeners para campos que precisam de cálculos automáticos
   * @param {Object} calcConfigs - Configurações dos cálculos
   */
  function setupCalculations(calcConfigs) {
    if (!calcConfigs) return;
    
    Object.keys(calcConfigs).forEach(targetId => {
      const config = calcConfigs[targetId];
      const targetElement = document.getElementById(targetId);
      
      if (!targetElement) return;
      
      // Configura os listeners nos campos de origem
      config.fields.forEach(fieldId => {
        const fieldElement = document.getElementById(fieldId);
        if (!fieldElement) return;
        
        fieldElement.addEventListener('input', () => {
          const result = config.calculate();
          
          if (targetElement.classList.contains('money-input')) {
            targetElement.value = formatMoney(result, false);
          } else {
            targetElement.value = result;
          }
          
          // Dispara evento de atualização
          const event = new Event('change');
          targetElement.dispatchEvent(event);
        });
      });
      
      // Calcula valor inicial
      const initialResult = config.calculate();
      if (targetElement.classList.contains('money-input')) {
        targetElement.value = formatMoney(initialResult, false);
      } else {
        targetElement.value = initialResult;
      }
    });
  }

  // Inicialização
  function init() {
    setupMasks();
    
    console.log('Formatter.js v2.0 iniciado');
  }

  // API pública do módulo
  return {
    init,
    formatMoney,
    parseMoneyToNumber,
    formatDate,
    parseDate,
    formatPhone,
    formatCPF,
    formatCNPJ,
    formatCEP,
    formatNumber,
    formatPercent,
    validateCPF,
    validateCNPJ,
    setupCalculations,
    setupMasks,
    config
  };
})();

// Inicializa as funcionalidades quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', Formatter.init);

// Exporta para uso global
window.Formatter = Formatter;
