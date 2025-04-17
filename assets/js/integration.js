/**
 * integration.js - Sistema de Análise de Crédito
 * Integração com APIs externas via n8n
 */

// Utilizando padrão de módulo para organização e encapsulamento
const Integration = (function() {
  'use strict';

  // Configurações da integração
  const config = {
    apiBaseUrl: 'https://suportico.app.n8n.cloud/webhook-test',
    timeouts: {
      default: 30000, // 30 segundos
      submit: 60000    // 60 segundos
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
      
      // Prepara a URL da API
      const url = `${config.apiBaseUrl}/cliente?cpf=${cpfNumerico}`;
      
      // Configura o timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeouts.default);
      
      // Faz a requisição
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      
      // Limpa o timeout
      clearTimeout(timeoutId);
      
      // Verifica a resposta
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao buscar dados do cliente: ${response.status} - ${errorText}`);
      }
      
      // Processa os dados
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
   * Busca o endereço do empreendimento via API
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
      const url = `${config.apiBaseUrl}/get-endereco?empreendimento=${encodeURIComponent(empreendimento)}`;
      
      // Faz a requisição
      const response = await fetch(url, {
        method: 'GET'
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
   * Envia os dados do formulário para o webhook do n8n
   * @param {Object} formData - Dados coletados do formulário
   * @returns {Promise<Object>} - Promise que resolve com a resposta JSON do n8n
   */
  async function submitAnalysis(formData) {
    try {
      // Mostra indicador de carregamento
      document.getElementById('loading')?.classList.remove('hidden');
      
      // Prepara a URL da API
      const url = `${config.apiBaseUrl}/analise-credito`;
      
      // Adiciona timestamp de envio
      const dataToSend = {
        ...formData,
        metadata: {
          timestamp: new Date().toISOString(),
          origin: window.location.origin
        }
      };
      
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
   * Busca dados de simulação para campos calculados
   * @param {Object} params - Parâmetros da simulação
   * @returns {Promise<Object>} - Resultados da simulação
   */
  async function fetchSimulationData(params) {
    try {
      // Prepara a URL da API
      const url = `${config.apiBaseUrl}/simulacao`;
      
      // Faz a requisição
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });
      
      // Verifica a resposta
      if (!response.ok) {
        throw new Error(`Erro na simulação: ${response.status}`);
      }
      
      // Processa os dados
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar simulação:', error);
      
      // Retorna valores estimados para não bloquear o fluxo
      return {
        valorParcela: params.valorFinanciamento * 0.01, // Estimativa simplificada de 1% do valor
        isEstimativa: true
      };
    }
  }

  /**
   * Busca construtoras e empreendimentos
   * @returns {Promise<Object>} - Lista de construtoras e empreendimentos
   */
  async function fetchConstructors() {
    try {
      // Verifica o cache
      const cacheKey = 'constructors_list';
      if (apiCache.has(cacheKey)) {
        return apiCache.get(cacheKey);
      }
      
      // Prepara a URL da API
      const url = `${config.apiBaseUrl}/construtoras`;
      
      // Faz a requisição
      const response = await fetch(url);
      
      // Verifica a resposta
      if (!response.ok) {
        throw new Error(`Erro ao buscar construtoras: ${response.status}`);
      }
      
      // Processa os dados
      const data = await response.json();
      
      // Armazena no cache
      apiCache.set(cacheKey, data);
      
      return data;
    } catch (error) {
      console.error('Erro ao buscar construtoras:', error);
      
      // Retorna dados mockados para desenvolvimento
      return {
        construtoras: [
          {
            id: 1,
            nome: 'Construtora Horizonte',
            empreendimentos: [
              { id: 101, nome: 'Residencial Villa Verde' },
              { id: 102, nome: 'Edifício Montanhas' }
            ]
          },
          {
            id: 2,
            nome: 'Incorporadora Solaris',
            empreendimentos: [
              { id: 201, nome: 'Condomínio Solar das Águas' },
              { id: 202, nome: 'Parque Residence' }
            ]
          },
          {
            id: 3,
            nome: 'MRV Engenharia',
            empreendimentos: [
              { id: 301, nome: 'Spazio Liberty' },
              { id: 302, nome: 'Grand Reserve' }
            ]
          }
        ]
      };
    }
  }

  /**
   * Busca unidades disponíveis de um empreendimento
   * @param {number} empreendimentoId - ID do empreendimento
   * @returns {Promise<Array>} - Lista de unidades disponíveis
   */
  async function fetchUnidades(empreendimentoId) {
    try {
      // Verifica o cache
      const cacheKey = `units_${empreendimentoId}`;
      if (apiCache.has(cacheKey)) {
        return apiCache.get(cacheKey);
      }
      
      // Prepara a URL da API
      const url = `${config.apiBaseUrl}/unidades?empreendimento=${empreendimentoId}`;
      
      // Faz a requisição
      const response = await fetch(url);
      
      // Verifica a resposta
      if (!response.ok) {
        throw new Error(`Erro ao buscar unidades: ${response.status}`);
      }
      
      // Processa os dados
      const data = await response.json();
      
      // Armazena no cache
      apiCache.set(cacheKey, data);
      
      return data;
    } catch (error) {
      console.error('Erro ao buscar unidades:', error);
      
      // Retorna dados mockados para desenvolvimento
      return {
        unidades: [
          { id: 1, bloco: 'A', numero: '101', area: 68, valor: 320000 },
          { id: 2, bloco: 'A', numero: '102', area: 68, valor: 325000 },
          { id: 3, bloco: 'A', numero: '201', area: 68, valor: 335000 },
          { id: 4, bloco: 'B', numero: '101', area: 72, valor: 350000 },
          { id: 5, bloco: 'B', numero: '102', area: 72, valor: 355000 }
        ]
      };
    }
  }

  /**
   * Verifica o status de débito do FGTS
   * @param {string} cpf - CPF do cliente
   * @returns {Promise<Object>} - Status do débito do FGTS
   */
  async function checkFGTSDebitoStatus(cpf) {
    try {
      // Prepara a URL da API
      const url = `${config.apiBaseUrl}/fgts-status?cpf=${cpf.replace(/\D/g, '')}`;
      
      // Faz a requisição
      const response = await fetch(url);
      
      // Verifica a resposta
      if (!response.ok) {
        throw new Error(`Erro ao verificar status do FGTS: ${response.status}`);
      }
      
      // Processa os dados
      return await response.json();
    } catch (error) {
      console.error('Erro ao verificar status do FGTS:', error);
      
      // Retorna dados mockados para desenvolvimento
      return {
        cpf: cpf,
        status: 'PENDENTE',
        saldoDisponivel: 42000,
        dataConsulta: new Date().toISOString().split('T')[0]
      };
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
    fetchSimulationData,
    fetchConstructors,
    fetchUnidades,
    checkFGTSDebitoStatus,
    clearCache,
    showNotification
  };
})();

// Exporta para uso global
window.Integration = Integration;
