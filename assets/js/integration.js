/**
 * integration.js - Sistema de Análise de Crédito
 * Integração com n8n e APIs externas
 */

// Utilizando padrão de módulo para organização e encapsulamento
const Integration = (function() {
  'use strict';

  // Configurações da integração
  const config = {
    apiBaseUrl: 'https://suportico.app.n8n.cloud/webhook-test',
    endpoints: {
      consultaCliente: '/consulta-cpf-deal', // URL real do webhook
      getEndereco: '/get-endereco',
      analiseCredito: '/analise-credito',
      debitoFgts: '/debito-fgts',
      readSimulation: '/read-simulation'
    },
    timeouts: {
      default: 30000,     // 30 segundos
      submit: 60000,      // 60 segundos
      simulation: 120000  // 2 minutos para processamento de imagens/OCR
    },
    retryAttempts: 2
  };

  // Cache para armazenar resultados de APIs
  const apiCache = new Map();

  /**
   * Busca dados do cliente via webhook n8n/Ploomes
   * @param {string} cpf - CPF formatado ou não formatado
   * @returns {Promise<Object>} - Promise que resolve com os dados do cliente
   */
  async function fetchCustomerData(cpf) {
    try {
      // Remove caracteres não numéricos do CPF
      const cpfNumerico = cpf.replace(/\D/g, '');
      
      // Verifica o cache
      const cacheKey = `customer_${cpfNumerico}`;
      if (apiCache.has(cacheKey)) {
        console.log('Obtendo dados do cliente do cache');
        return apiCache.get(cacheKey);
      }
      
      // Mostra indicador de carregamento
      document.getElementById('loading')?.classList.remove('hidden');
      
      // Prepara a URL da API (endpoint do webhook n8n)
      const url = `${config.apiBaseUrl}${config.endpoints.consultaCliente}`;
      
      // Configura o timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeouts.default);
      
      // Faz a requisição - NOTA: Enviamos o CPF no corpo como JSON, conforme esperado pelo webhook
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ cpf: cpfNumerico }),
        signal: controller.signal
      });
      
      // Limpa o timeout
      clearTimeout(timeoutId);
      
      // Verifica a resposta
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao buscar dados do cliente: ${response.status} - ${errorText}`);
      }
      
      // Processa os dados - já vem formatado do n8n conforme o formato esperado pelo frontend
      const data = await response.json();
      
      // Armazena no cache
      apiCache.set(cacheKey, data);
      
      return data;
    } catch (error) {
      // Em caso de timeout ou erro de conexão, usa dados mockados para desenvolvimento
      if (error.name === 'AbortError' || error.message.includes('Failed to fetch')) {
        console.warn('Timeout ou erro de conexão. Usando dados mockados para desenvolvimento.');
        return getMockCustomerData(cpf);
      }
      
      // Loga o erro para diagnóstico
      console.error('Erro ao buscar dados do cliente:', error);
      
      // Repropaga o erro para tratamento no nível superior
      throw error;
    } finally {
      // Esconde indicador de carregamento
      document.getElementById('loading')?.classList.add('hidden');
    }
  }

  /**
   * Gera dados mockados para desenvolvimento e testes
   * @param {string} cpf - CPF do cliente
   * @returns {Object} - Dados mockados
   */
  function getMockCustomerData(cpf) {
    return {
      personal: {
        proponentes: [
          {
            nome: 'Maria Oliveira Santos',
            cpf: cpf,
            dataNascimento: '1985-06-15',
            rg: '28.123.456-7',
            email: 'maria.oliveira@email.com',
            telefone: '(11) 98765-4321',
            profissao: 'Engenheira Civil',
            renda: 9500
          },
          {
            nome: 'João Carlos Santos',
            cpf: '987.654.321-00',
            dataNascimento: '1983-09-22',
            rg: '32.456.789-1',
            email: 'joao.santos@email.com',
            telefone: '(11) 91234-5678',
            profissao: 'Médico',
            renda: 12000
          }
        ]
      },
      property: {
        valorCompraVenda: 550000,
        subsidio: 20000,
        valorFinanciamento: 450000,
        utilizaFGTS: true,
        valorFGTS: 40000,
        recursosProprios: 40000
      },
      simulation: {
        statusAnalise: 'APROVADO',
        prazoFinanciamento: 360,
        dataVencimento: '2025-06-15',
        sistemaAmortizacao: 'PRICE',
        indexador: 'IPCA',
        valorPrimeiraParcela: 4250.75,
        financiamentoCustas: true,
        valorCustas: 8500,
        valorParceladoSIRIC: 458500,
        modalidadeFinanciamento: 'MCMV - IMÓVEL NA PLANTA'
      },
      income: {
        rendaFamiliarTotal: 21500,
        formasComprovacao: ['Contracheque/Holerite', 'Declaração de IRPF']
      },
      constructor: {
        construtora: 'Construtora Horizonte',
        empreendimento: 'Residencial Villa Verde',
        unidade: 'Apto 502',
        bloco: 'Bloco A',
        endereco: 'Av. das Palmeiras, 1500, Jardim Europa, São Paulo - SP'
      }
    };
  }

  /**
   * Busca o endereço do empreendimento via API n8n
   * @param {string} empreendimento - Nome do empreendimento
   * @returns {Promise<Object>} - Promise que resolve com o endereço
   */
  async function fetchEndereco(empreendimento) {
    if (!empreendimento) {
      throw new Error('Nome do empreendimento não informado');
    }
    
    try {
      // Verifica o cache
      const cacheKey = `address_${empreendimento}`;
      if (apiCache.has(cacheKey)) {
        return apiCache.get(cacheKey);
      }
      
      // Indicador de carregamento
      const btnBuscar = document.getElementById('btn-buscar-endereco');
      if (btnBuscar) {
        btnBuscar.disabled = true;
        btnBuscar.textContent = 'Buscando...';
      }
      
      // Prepara a URL da API
      const url = `${config.apiBaseUrl}${config.endpoints.getEndereco}`;
      
      // Faz a requisição - enviando o nome do empreendimento como JSON no corpo
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ empreendimento })
      });
      
      // Verifica a resposta
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao buscar endereço: ${response.status} - ${errorText}`);
      }
      
      // Processa os dados
      const data = await response.json();
      
      // Armazena no cache
      apiCache.set(cacheKey, data);
      
      return data;
    } catch (error) {
      // Em caso de erro, retorna um objeto vazio com mensagem de erro
      console.error('Erro ao buscar endereço:', error);
      showNotification('Não foi possível encontrar o endereço. Preencha manualmente.', 'error');
      
      return { 
        enderecoCompleto: '',
        erro: error.message
      };
    } finally {
      // Restaura o botão
      const btnBuscar = document.getElementById('btn-buscar-endereco');
      if (btnBuscar) {
        btnBuscar.disabled = false;
        btnBuscar.textContent = 'Buscar';
      }
    }
  }

  /**
   * Envia os dados do formulário para o webhook do n8n (análise de crédito)
   * @param {Object} formData - Dados coletados do formulário
   * @returns {Promise<Object>} - Promise que resolve com a resposta JSON do n8n
   */
  async function submitAnalysis(formData) {
    try {
      // Mostra indicador de carregamento
      document.getElementById('loading')?.classList.remove('hidden');
      
      // Prepara a URL da API
      const url = `${config.apiBaseUrl}${config.endpoints.analiseCredito}`;
      
      // Adiciona timestamp de envio
      const dataToSend = {
        ...formData,
        metadata: {
          timestamp: new Date().toISOString(),
          origin: window.location.origin
        }
      };
      
      console.log('Enviando dados para análise:', dataToSend);
      
      // Configura o timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeouts.submit);
      
      // Faz a requisição
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend),
        signal: controller.signal
      });
      
      // Limpa o timeout
      clearTimeout(timeoutId);
      
      // Verifica a resposta
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao enviar análise: ${response.status} - ${errorText}`);
      }
      
      // Processa os dados
      const data = await response.json();
      console.log('Resposta da análise:', data);
      return data;
    } catch (error) {
      // Em caso de timeout, tenta novamente
      if (error.name === 'AbortError') {
        console.warn('Timeout ao enviar análise. Tentando novamente...');
        return retrySubmit(formData, 1);
      }
      
      console.error('Erro ao enviar análise:', error);
      throw error;
    } finally {
      // Esconde indicador de carregamento (caso o erro seja tratado no nível superior)
      // Geralmente mantemos isso comentado pois o redirecionamento após sucesso irá limpar a página
      // document.getElementById('loading')?.classList.add('hidden');
    }
  }

  /**
   * Tenta reenviar a análise após falha
   * @param {Object} formData - Dados do formulário
   * @param {number} attempt - Número da tentativa atual
   * @returns {Promise<Object>} - Promise com resultado da submissão
   */
  async function retrySubmit(formData, attempt) {
    if (attempt > config.retryAttempts) {
      throw new Error(`Falha após ${config.retryAttempts} tentativas de envio`);
    }
    
    try {
      // Espera um pouco antes da próxima tentativa (tempo crescente)
      const delay = attempt * 2000; // 2 segundos, 4 segundos, etc.
      await new Promise(resolve => setTimeout(resolve, delay));
      
      console.log(`Tentativa ${attempt+1} de envio...`);
      
      // Cria uma cópia dos dados com informação da tentativa
      const retryData = {
        ...formData,
        metadata: {
          ...(formData.metadata || {}),
          retryAttempt: attempt
        }
      };
      
      // Tenta enviar novamente
      return await submitAnalysis(retryData);
    } catch (error) {
      if (error.name === 'AbortError') {
        // Se foi timeout novamente, tenta mais uma vez
        return retrySubmit(formData, attempt + 1);
      }
      
      // Se foi outro erro, propaga
      throw error;
    }
  }

  /**
   * Envia solicitação de débito FGTS para o n8n
   * @param {Object} fgtsData - Dados do débito FGTS
   * @returns {Promise<Object>} - Promise que resolve com a resposta do n8n
   */
  async function submitFGTSDebito(fgtsData) {
    try {
      // Mostra indicador de carregamento
      document.getElementById('loading')?.classList.remove('hidden');
      
      // Prepara a URL da API
      const url = `${config.apiBaseUrl}${config.endpoints.debitoFgts}`;
      
      // Adiciona timestamp de envio
      const dataToSend = {
        ...fgtsData,
        metadata: {
          timestamp: new Date().toISOString(),
          origin: window.location.origin
        }
      };
      
      // Faz a requisição
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });
      
      // Verifica a resposta
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao enviar débito FGTS: ${response.status} - ${errorText}`);
      }
      
      // Processa os dados
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao enviar débito FGTS:', error);
      throw error;
    } finally {
      // Esconde indicador de carregamento
      document.getElementById('loading')?.classList.add('hidden');
    }
  }

  /**
   * Envia o arquivo de simulação para o n8n/mostqi e obtém os dados extraídos
   * @param {File} file - Arquivo de simulação para análise
   * @returns {Promise<Object>} - Promise que resolve com os dados extraídos da simulação
   */
  async function readSimulationFile(file) {
    try {
      // Verifica se o arquivo foi fornecido
      if (!file) {
        throw new Error('Nenhum arquivo fornecido');
      }
      
      // Atualiza status visual
      updateSimulationStatus('processing', 'Processando arquivo...');
      
      // Prepara a URL da API
      const url = `${config.apiBaseUrl}${config.endpoints.readSimulation}`;
      
      // Prepara o FormData para envio do arquivo
      const formData = new FormData();
      formData.append('simulationFile', file);
      
      // Configura timeout mais longo para processamento de arquivos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeouts.simulation);
      
      console.log('Enviando arquivo para processamento:', file.name);
      
      // Faz a requisição
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
      
      // Limpa o timeout
      clearTimeout(timeoutId);
      
      // Verifica a resposta
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao processar arquivo: ${response.status} - ${errorText}`);
      }
      
      // Processa os dados retornados
      const data = await response.json();
      console.log('Dados extraídos da simulação:', data);
      
      // Atualiza status visual
      updateSimulationStatus('success', 'Dados extraídos com sucesso!');
      
      return data;
    } catch (error) {
      console.error('Erro ao ler arquivo de simulação:', error);
      
      // Atualiza status visual
      updateSimulationStatus('error', error.message || 'Erro ao processar arquivo');
      
      throw error;
    }
  }

  /**
   * Atualiza o status visual do processamento da simulação
   * @param {string} status - Status atual (waiting, processing, success, error)
   * @param {string} message - Mensagem a ser exibida
   */
  function updateSimulationStatus(status, message) {
    const statusElement = document.getElementById('simulacao-status');
    const statusDot = statusElement?.querySelector('span:first-child');
    const statusText = statusElement?.querySelector('.status-text');
    
    if (!statusElement || !statusDot || !statusText) return;
    
    // Remove classes anteriores
    statusDot.classList.remove(
      'bg-gray-400', 'bg-blue-500', 'bg-green-500', 'bg-red-500',
      'animate-pulse'
    );
    
    // Exibe o elemento de status
    statusElement.classList.remove('hidden');
    statusElement.classList.add('flex');
    
    // Aplica estilo de acordo com o status
    switch (status) {
      case 'waiting':
        statusDot.classList.add('bg-gray-400');
        break;
      case 'processing':
        statusDot.classList.add('bg-blue-500', 'animate-pulse');
        break;
      case 'success':
        statusDot.classList.add('bg-green-500');
        break;
      case 'error':
        statusDot.classList.add('bg-red-500');
        break;
      default:
        statusDot.classList.add('bg-gray-400');
    }
    
    // Atualiza o texto
    statusText.textContent = message;
  }

  /**
   * Mostra uma notificação na tela
   * @param {string} message - Mensagem da notificação
   * @param {string} type - Tipo de notificação (success, error, warning, info)
   */
  function showNotification(message, type = 'info') {
    // Remove notificações existentes
    const existingNotifications = document.querySelectorAll('.notification-toast');
    existingNotifications.forEach(notification => {
      notification.remove();
    });
    
    // Cria o elemento de notificação
    const notification = document.createElement('div');
    notification.className = 'notification-toast fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-opacity duration-300 opacity-0';
    
    // Define a cor baseada no tipo
    switch (type) {
      case 'success':
        notification.classList.add('bg-green-500', 'text-white');
        break;
      case 'error':
        notification.classList.add('bg-red-500', 'text-white');
        break;
      case 'warning':
        notification.classList.add('bg-yellow-500', 'text-white');
        break;
      default:
        notification.classList.add('bg-blue-500', 'text-white');
    }
    
    notification.textContent = message;
    
    // Adiciona ao DOM
    document.body.appendChild(notification);
    
    // Anima entrada
    setTimeout(() => {
      notification.classList.replace('opacity-0', 'opacity-100');
    }, 10);
    
    // Remove após 5 segundos
    setTimeout(() => {
      notification.classList.replace('opacity-100', 'opacity-0');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 5000);
  }

  /**
   * Salva os dados da análise no localStorage para uso em outras páginas
   * @param {Object} analysisData - Dados completos da análise
   */
  function saveAnalysisData(analysisData) {
    try {
      localStorage.setItem('customerData', JSON.stringify(analysisData));
      
      // Salva também o CPF principal para referência rápida
      if (analysisData.personal && 
          analysisData.personal.proponentes && 
          analysisData.personal.proponentes.length > 0) {
        localStorage.setItem('customerCPF', analysisData.personal.proponentes[0].cpf);
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao salvar dados no localStorage:', error);
      return false;
    }
  }

  /**
   * Carrega os dados da análise do localStorage
   * @returns {Object|null} - Dados da análise ou null se não existir
   */
  function loadAnalysisData() {
    try {
      const dataStr = localStorage.getItem('customerData');
      if (!dataStr) return null;
      
      return JSON.parse(dataStr);
    } catch (error) {
      console.error('Erro ao carregar dados do localStorage:', error);
      return null;
    }
  }

  /**
   * Limpa o cache da API
   * @param {string} key - Chave específica para limpar (opcional)
   */
  function clearCache(key) {
    if (key) {
      apiCache.delete(key);
    } else {
      apiCache.clear();
    }
    
    console.log('Cache limpo:', key || 'todos');
  }

  // API pública do módulo
  return {
    fetchCustomerData,
    fetchEndereco,
    submitAnalysis,
    submitFGTSDebito,
    readSimulationFile,
    updateSimulationStatus,
    showNotification,
    saveAnalysisData,
    loadAnalysisData,
    clearCache
  };
})();

// Exporta para uso global
window.Integration = Integration;
