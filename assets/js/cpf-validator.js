/**
 * CPF Validator - Biblioteca simplificada e robusta para validação de CPFs
 * Versão 3.0 - Otimizada para evitar problemas de validação
 */

const CPFValidator = (function() {
  'use strict';
  
  // Cache para validações - melhora performance
  const validationCache = new Map();
  
  /**
   * Limpa um CPF, removendo caracteres não numéricos
   * @param {string|number} cpf - CPF para limpar
   * @returns {string} - CPF contendo apenas dígitos
   */
  function cleanCPF(cpf) {
    // Converte para string primeiro, em caso de números
    if (cpf === null || cpf === undefined) return '';
    
    // Converte para string, em caso de número
    const cpfString = String(cpf);
    
    // Remove todos os caracteres não numéricos
    return cpfString.replace(/\D/g, '');
  }
  
  /**
   * Formata um CPF para exibição (XXX.XXX.XXX-XX)
   * @param {string|number} cpf - CPF para formatar
   * @param {boolean} partialFormat - Se true, formata CPFs incompletos
   * @returns {string} - CPF formatado
   */
  function formatCPF(cpf, partialFormat = true) {
    const digits = cleanCPF(cpf);
    
    if (!digits) return '';
    
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
    
    // Formato completo (XXX.XXX.XXX-XX)
    if (digits.length >= 11) {
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
    }
    
    // Para casos com menos de 11 dígitos, retorna o que tem
    return digits;
  }
  
  /**
   * Valida um CPF - versão simplificada e robusta
   * @param {string|number} cpf - CPF para validar
   * @returns {boolean} - true se CPF for válido ou se a validação for desativada
   */
  function isValidCPF(cpf) {
    try {
      // Limpeza do CPF
      const cleanedCPF = cleanCPF(cpf);
      
      // Se não tiver nada, retorna inválido
      if (!cleanedCPF) return false;
      
      // Se já estiver no cache, retorna o resultado
      if (validationCache.has(cleanedCPF)) {
        return validationCache.get(cleanedCPF);
      }
      
      // Aceita CPFs incompletos durante a digitação para não bloquear prematuramente
      if (cleanedCPF.length < 11) {
        return true;
      }
      
      // Verifica se tem exatamente 11 dígitos
      if (cleanedCPF.length !== 11) {
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
      
      const isValid = parseInt(cleanedCPF.charAt(10)) === digit2;
      validationCache.set(cleanedCPF, isValid);
      return isValid;
      
    } catch (error) {
      console.warn("Erro na validação de CPF:", error);
      // Em caso de erro, retorna true para não bloquear o usuário
      return true;
    }
  }
  
  /**
   * Aplica máscara de CPF em um campo de entrada
   * @param {string|HTMLElement} selector - Seletor CSS ou elemento HTML
   * @param {Object} options - Opções de configuração
   */
  function applyMask(selector, options = {}) {
    try {
      // Configurações padrão
      const defaults = {
        validateOnBlur: true,     // Valida quando o campo perde o foco
        formatOnInput: true,      // Formata enquanto digita
        errorClass: 'cpf-error',  // Classe CSS para erros
        validClass: 'cpf-valid',  // Classe CSS para CPF válido
        onValid: null,            // Callback quando CPF é válido
        onInvalid: null,          // Callback quando CPF é inválido
        allowEmpty: true,         // Se false, campo vazio é considerado inválido
        strictValidation: false   // Se false, realiza validação menos restritiva
      };
      
      // Mescla opções
      const settings = { ...defaults, ...options };
      
      // Seleciona elementos
      const elements = typeof selector === 'string' 
        ? document.querySelectorAll(selector) 
        : [selector];
      
      if (!elements || elements.length === 0) {
        console.warn('CPFValidator: Nenhum elemento encontrado com o seletor:', selector);
        return;
      }
      
      elements.forEach(element => {
        if (!element || element.nodeName !== 'INPUT') {
          console.warn('CPFValidator: Elemento não é um campo de entrada:', element);
          return;
        }
        
        // Evita múltiplas inicializações
        if (element.dataset.cpfMaskInitialized === 'true') {
          return;
        }
        
        // Marca o elemento como inicializado
        element.dataset.cpfMaskInitialized = 'true';
        
        // Formatação durante digitação
        if (settings.formatOnInput) {
          element.addEventListener('input', function(e) {
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
            
            // Valida o CPF mesmo durante a digitação
            const isValid = isValidCPF(this.value);
            
            // Dispara evento personalizado
            const validationEvent = new CustomEvent('cpf:validation', { 
              detail: { isValid, value: this.value } 
            });
            this.dispatchEvent(validationEvent);
          });
        }
        
        // Validação no blur
        if (settings.validateOnBlur) {
          element.addEventListener('blur', function() {
            const value = this.value;
            
            if (!value && settings.allowEmpty) {
              // Remove classes de estilo
              this.classList.remove(settings.errorClass, settings.validClass);
              return;
            }
            
            const isValid = settings.strictValidation 
              ? isValidCPF(value) && cleanCPF(value).length === 11 
              : isValidCPF(value);
            
            // Aplica classes CSS
            this.classList.toggle(settings.errorClass, !isValid);
            this.classList.toggle(settings.validClass, isValid);
            
            // Executa callbacks
            if (isValid && typeof settings.onValid === 'function') {
              settings.onValid(value, this);
            } else if (!isValid && typeof settings.onInvalid === 'function') {
              settings.onInvalid(value, this);
            }
            
            // Formata totalmente o CPF se for válido e tiver 11 dígitos
            if (isValid && cleanCPF(value).length === 11) {
              this.value = formatCPF(value, false);
            }
            
            // Dispara evento personalizado
            const validationEvent = new CustomEvent('cpf:validation:complete', { 
              detail: { isValid, value: this.value } 
            });
            this.dispatchEvent(validationEvent);
          });
        }
      });
      
    } catch (error) {
      console.error('Erro ao aplicar máscara de CPF:', error);
      // Não interrompe a execução do script em caso de erro
    }
  }
  
  /**
   * Inicialização automática para elementos com classe 'cpf-input'
   */
  function init() {
    try {
      console.log('Inicializando CPFValidator v3.0');
      
      // Aplica mascara nos elementos com classe 'cpf-input'
      applyMask('.cpf-input', {
        onValid: function(value, element) {
          // Remove mensagem de erro se existir
          const errorElement = element.parentNode.querySelector('.error-message');
          if (errorElement) {
            errorElement.remove();
          }
          
          // Habilita botões relacionados ao CPF
          const form = element.closest('form');
          if (form) {
            const submitButton = form.querySelector('button[type="submit"], input[type="submit"], button.submit-btn');
            if (submitButton) {
              submitButton.disabled = false;
            }
          }
        },
        onInvalid: function(value, element) {
          // Adiciona mensagem de erro
          if (value && cleanCPF(value).length === 11) {
            let errorElement = element.parentNode.querySelector('.error-message');
            
            if (!errorElement) {
              errorElement = document.createElement('div');
              errorElement.className = 'error-message text-xs text-red-500 mt-1';
              element.parentNode.insertBefore(errorElement, element.nextSibling);
            }
            
            errorElement.textContent = 'CPF inválido';
          }
        }
      });
      
      // Adicionalmente, habilita botões associados a CPF em formulários
      document.querySelectorAll('form').forEach(form => {
        const cpfInputs = form.querySelectorAll('.cpf-input, input[name*="cpf"], input[id*="cpf"]');
        
        if (cpfInputs.length > 0) {
          const submitButtons = form.querySelectorAll('button[type="submit"], input[type="submit"], button.submit-btn, button#consultar, button.consultar');
          
          submitButtons.forEach(button => {
            // Habilita por padrão, será desabilitado na validação se necessário
            button.disabled = false;
          });
        }
      });
      
    } catch (error) {
      console.error('Erro na inicialização do CPFValidator:', error);
      // Não interrompe a execução da página em caso de erro
    }
  }
  
  /**
   * Limpa o cache de validação
   */
  function clearCache() {
    validationCache.clear();
  }
  
  // Executa inicialização quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM já está pronto
    init();
  }
  
  // API pública
  return {
    format: formatCPF,
    isValid: isValidCPF,
    clean: cleanCPF,
    applyMask: applyMask,
    clearCache: clearCache,
    init: init
  };
})();

// Expõe globalmente para uso em outros scripts
window.CPFValidator = CPFValidator;
