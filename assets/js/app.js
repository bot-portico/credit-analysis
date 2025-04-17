// assets/js/app.js - Versão superinteligente

/**
 * Sistema de Análise de Crédito - Dashboard
 * Versão aprimorada com recursos inteligentes
 */

// Design Pattern - Module Pattern para encapsulamento
const CreditAnalysis = (function() {
  // Estado da aplicação
  const state = {
    formData: {
      personal: { proponentes: [] },
      property: {},
      simulation: {},
      income: {},
      constructor: {}
    },
    originalData: null,
    currentSection: 'personal',
    formProgress: 0,
    formModified: false,
    formErrors: {},
    apiCache: {}
  };

  // Cache para APIs
  const apiCache = new Map();
  
  // Configurações
  const config = {
    apiBaseUrl: 'https://suportico.app.n8n.cloud/webhook-test',
    autoSaveInterval: 30000, // 30 segundos
    sections: ['personal', 'property-simulation', 'income', 'constructor', 'summary'],
    requiredFields: {
      personal: ['nome', 'cpf', 'profissao', 'rendaPrincipal'],
      'property-simulation': ['valorCompraVenda', 'valorFinanciamento', 'statusAnalise'],
      income: ['rendaFamiliarTotal'],
      constructor: ['construtora', 'empreendimento'],
      summary: []
    }
  };
  
  // Inicialização
  function init() {
    // Verifica dados no localStorage
    loadDataFromStorage();
    
    // Setup de eventos
    setupEventListeners();
    
    // Inicializa validações
    initValidation();
    
    // Inicializa autosave
    initAutoSave();

    // Calcula valores iniciais
    calculateDerivedValues();
    
    // Atualiza UI
    updateUI();
    
    // Esconde overlay de carregamento
    hideLoading();
    
    // Log de inicialização
    console.log('CreditAnalysis v2.0 initialized');
  }
  
  // Carrega dados do localStorage
  function loadDataFromStorage() {
    const dataStr = localStorage.getItem('customerData');
    const cpf = localStorage.getItem('customerCPF');
    
    if (!dataStr || !cpf) {
      window.location.href = 'index.html';
      return;
    }
    
    try {
      state.formData = JSON.parse(dataStr);
      state.originalData = JSON.parse(dataStr); // Backup original para comparações
      
      // Preenche dados nos campos
      populateFormFields();
      
      // Atualiza informações do header
      updateHeaderInfo(cpf);
    } catch (error) {
      console.error('Error loading data:', error);
      showNotification('Erro ao carregar dados', 'error');
      // Redireciona após erro
      setTimeout(() => window.location.href = 'index.html', 3000);
    }
  }
  
  // Popula campos do formulário com os dados carregados
  function populateFormFields() {
    // Popula dados pessoais
    populatePersonalData();
    
    // Popula dados do imóvel e simulação
    populatePropertySimData();
    
    // Popula dados de renda
    populateIncomeData();
    
    // Popula dados da construtora
    populateConstructorData();
    
    // Atualiza o resumo
    updateSummary();
  }
  
  // Popula dados pessoais
  function populatePersonalData() {
    if (!state.formData.personal || !state.formData.personal.proponentes) return;
    
    const proponentes = state.formData.personal.proponentes;
    
    // Primeiro proponente
    if (proponentes.length > 0) {
      const p1 = proponentes[0];
      setFieldValue('nome', p1.nome || '');
      setFieldValue('cpf', p1.cpf || localStorage.getItem('customerCPF') || '');
      setFieldValue('dataNascimento', p1.dataNascimento || '');
      setFieldValue('rg', p1.rg || '');
      setFieldValue('email', p1.email || '');
      setFieldValue('telefone', p1.telefone || '');
      setFieldValue('profissao', p1.profissao || '');
      setFieldValue('rendaPrincipal', formatMoney(p1.renda?.toString() || '0'));
    }
    
    // Segundo proponente
    if (proponentes.length > 1) {
      const p2 = proponentes[1];
      setFieldValue('hasSecondProponent', true);
      toggleSecondProponent(true);
      
      setFieldValue('nomeSegundo', p2.nome || '');
      setFieldValue('cpfSegundo', p2.cpf || '');
      setFieldValue('dataNascimentoSegundo', p2.dataNascimento || '');
      setFieldValue('rgSegundo', p2.rg || '');
      setFieldValue('emailSegundo', p2.email || '');
      setFieldValue('telefoneSegundo', p2.telefone || '');
      setFieldValue('profissaoSegundo', p2.profissao || '');
      setFieldValue('rendaSegundo', formatMoney(p2.renda?.toString() || '0'));
    }
  }
  
  // Popula dados do imóvel e simulação
  function populatePropertySimData() {
    if (!state.formData.property) return;
    
    const prop = state.formData.property;
    const sim = state.formData.simulation || {};
    
    // Dados do imóvel
    setFieldValue('valorCompraVenda', formatMoney(prop.valorCompraVenda?.toString() || '0'));
    setFieldValue('subsidio', formatMoney(prop.subsidio?.toString() || '0'));
    setFieldValue('valorFinanciamento', formatMoney(prop.valorFinanciamento?.toString() || '0'));
    
    // FGTS
    if (prop.utilizaFGTS) {
      setFieldValue('utilizaFGTS', true);
      toggleFGTSFields(true);
      setFieldValue('valorFGTS', formatMoney(prop.valorFGTS?.toString() || '0'));
    }
    
    // Dados da simulação
    setFieldValue('statusAnalise', sim.statusAnalise || '');
    setFieldValue('prazoFinanciamento', sim.prazoFinanciamento || '');
    setFieldValue('dataVencimentoAnalise', sim.dataVencimento || '');
    setFieldValue('sistemaAmortizacao', sim.sistemaAmortizacao || '');
    setFieldValue('indexador', sim.indexador || '');
    setFieldValue('valorPrimeiraParcela', formatMoney(sim.valorPrimeiraParcela?.toString() || '0'));
    setFieldValue('valorParceladoSIRIC', formatMoney(sim.valorParceladoSIRIC?.toString() || '0'));
    setFieldValue('modalidadeFinanciamento', sim.modalidadeFinanciamento || '');
    
    // Financiamento de custas
    if (sim.financiamentoCustas) {
      setFieldValue('financiamentoCustas', true);
      toggleCustasFields(true);
      setFieldValue('valorCustas', formatMoney(sim.valorCustas?.toString() || '0'));
    }

    /**
 * Configura o botão de leitura de simulação e integração com a função de extração
 */
function setupSimulationReader() {
  const fileInput = document.getElementById('uploadSimulacao');
  const readButton = document.getElementById('btn-ler-simulacao');
  
  if (!fileInput || !readButton) return;
  
  // Atualiza o estado do botão com base na seleção de arquivo
  fileInput.addEventListener('change', function() {
    // Habilita o botão apenas se um arquivo for selecionado
    readButton.disabled = !this.files || this.files.length === 0;
    
    if (this.files && this.files.length > 0) {
      // Atualiza o status para "aguardando processamento"
      Integration.updateSimulationStatus('waiting', 'Arquivo selecionado. Clique em "Ler Simulação"');
    } else {
      // Esconde o status se não houver arquivo
      const statusElement = document.getElementById('simulacao-status');
      if (statusElement) statusElement.classList.add('hidden');
    }
  });
  
  // Configura o evento de clique no botão
  readButton.addEventListener('click', async function() {
    if (!fileInput.files || fileInput.files.length === 0) {
      Integration.showNotification('Selecione um arquivo de simulação primeiro', 'warning');
      return;
    }
    
    try {
      // Desabilita o botão durante o processamento
      readButton.disabled = true;
      
      // Processa o arquivo
      const simulationData = await Integration.readSimulationFile(fileInput.files[0]);
      
      // Preenche os campos do formulário com os dados extraídos
      fillSimulationFields(simulationData);
      
      // Notifica o sucesso
      Integration.showNotification('Simulação processada com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao processar simulação:', error);
      Integration.showNotification('Erro ao processar simulação: ' + error.message, 'error');
    } finally {
      // Reabilita o botão
      readButton.disabled = false;
    }
  });
}

/**
 * Preenche os campos do formulário com os dados extraídos da simulação
 * @param {Object} data - Dados extraídos da simulação
 */
function fillSimulationFields(data) {
  // Mapeamento dos campos da API para os IDs dos campos no formulário
  const fieldMapping = {
    // Campos da simulação
    'valorFinanciamento': 'valorFinanciamento',
    'prazoFinanciamento': 'prazoFinanciamento',
    'sistemaAmortizacao': 'sistemaAmortizacao',
    'indexador': 'indexador',
    'valorPrimeiraParcela': 'valorPrimeiraParcela',
    'valorParceladoSIRIC': 'valorParceladoSIRIC',
    'modalidadeFinanciamento': 'modalidadeFinanciamento',
    'dataVencimento': 'dataVencimentoAnalise',
    'valorCustas': 'valorCustas',
    'financiamentoCustas': 'financiamentoCustas',
    'valorImovel': 'valorCompraVenda',
    'rendaFamiliar': 'rendaFamiliarTotal'
  };
  
  // Preenche cada campo disponível
  for (const [apiField, formField] of Object.entries(fieldMapping)) {
    if (data[apiField] !== undefined) {
      const element = document.getElementById(formField);
      
      if (element) {
        // Caso específico para checkbox
        if (element.type === 'checkbox') {
          element.checked = !!data[apiField];
          
          // Dispara evento para mostrar/esconder campos relacionados
          const event = new Event('change');
          element.dispatchEvent(event);
        } 
        // Caso específico para campos monetários
        else if (element.classList.contains('money-input') && typeof data[apiField] === 'number') {
          element.value = Formatter.formatMoney(data[apiField], false);
        }
        // Outros campos
        else {
          element.value = data[apiField];
        }
        
        // Destaca o campo preenchido brevemente
        highlightUpdatedField(element);
        
        // Dispara evento de mudança para acionar cálculos automáticos
        const event = new Event('change');
        element.dispatchEvent(event);
      }
    }
  }
  
  // Se houver dados de financiamento de custas, trata especialmente
  if (data.financiamentoCustas) {
    const custasCheckbox = document.getElementById('financiamentoCustas');
    if (custasCheckbox) {
      custasCheckbox.checked = true;
      
      // Torna o campo de custas visível
      const custasFields = document.getElementById('custas-fields');
      if (custasFields) {
        custasFields.classList.remove('hidden');
      }
      
      // Preenche o valor das custas se disponível
      if (data.valorCustas !== undefined) {
        const valorCustasElement = document.getElementById('valorCustas');
        if (valorCustasElement) {
          valorCustasElement.value = Formatter.formatMoney(data.valorCustas, false);
          highlightUpdatedField(valorCustasElement);
        }
      }
    }
  }
  
  // Recalcula os valores derivados
  calculateRecursosProprios();
  updateSummary();
}

/**
 * Destaca brevemente um campo que foi atualizado automaticamente
 * @param {HTMLElement} element - Elemento a ser destacado
 */
function highlightUpdatedField(element) {
  if (!element) return;
  
  // Adiciona classe de destaque
  element.classList.add('bg-blue-50', 'transition-colors', 'duration-500');
  
  // Remove o destaque após alguns segundos
  setTimeout(() => {
    element.classList.remove('bg-blue-50');
  }, 2000);
}
    
    // Calcula recursos próprios
    calculateRecursosProprios();
  }
  
  // Popula dados de renda
  function populateIncomeData() {
    if (!state.formData.income) return;
    
    const income = state.formData.income;
    
    // Define formas de comprovação (array para select múltiplo)
    if (income.formasComprovacao && Array.isArray(income.formasComprovacao)) {
      const selectElement = document.getElementById('formaComprovacaoRenda');
      if (selectElement) {
        Array.from(selectElement.options).forEach(option => {
          option.selected = income.formasComprovacao.includes(option.value);
        });
      }
    }
    
    // Atualiza renda familiar total (calculada automaticamente)
    calculateTotalIncome();
  }
  
  // Popula dados da construtora
  function populateConstructorData() {
    if (!state.formData.constructor) return;
    
    const cons = state.formData.constructor;
    
    setFieldValue('construtora', cons.construtora || '');
    setFieldValue('empreendimento', cons.empreendimento || '');
    setFieldValue('unidade', cons.unidade || '');
    setFieldValue('bloco', cons.bloco || '');
    
    // Busca o endereço se tiver empreendimento
    if (cons.empreendimento) {
      fetchEndereco(cons.empreendimento);
    }
  }
  
  // Atualiza informações do cabeçalho
  function updateHeaderInfo(cpf) {
    if (!state.formData.personal || !state.formData.personal.proponentes || state.formData.personal.proponentes.length === 0) return;
    
    const proponente = state.formData.personal.proponentes[0];
    const name = proponente.nome || 'Cliente';
    
    // Atualiza elementos do header
    const headerNameElement = document.getElementById('header-customer-name');
    const headerCpfElement = document.getElementById('header-customer-cpf');
    const customerInitials = document.getElementById('customer-initials');
    
    if (headerNameElement) headerNameElement.textContent = name;
    if (headerCpfElement) headerCpfElement.textContent = formatCPF(cpf);
    if (customerInitials) customerInitials.textContent = getInitials(name);
  }
  
  // Obter iniciais do nome
  function getInitials(name) {
    if (!name) return 'C';
    return name.split(' ').map(n => n[0]).join('').substr(0, 2).toUpperCase();
  }
  
  // Configuração de listeners de eventos
  function setupEventListeners() {
    // Navegação de tabs
    setupTabNavigation();
    
    // Botões de navegação
    setupNavigationButtons();
    
    // Campos do formulário
    setupFormFields();
    
    // Botões de envio
    setupSubmitButtons();
    
    // Listener para mudanças no formulário
    setupFormChangeListeners();
  }
  
  // Configuração da navegação por tabs
  function setupTabNavigation() {
    const tabs = document.querySelectorAll('#section-tabs button[data-section]');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const section = tab.getAttribute('data-section');
        
        // Verifica se pode avançar (validação)
        if (canAdvanceToSection(section)) {
          switchToSection(section);
        } else {
          // Mostra erros e notificação se não puder avançar
          highlightErrors();
          showNotification('Por favor, preencha os campos obrigatórios', 'warning');
        }
      });
    });
  }
  
  // Configura botões de navegação (anterior/próximo)
  function setupNavigationButtons() {
    const prevButton = document.getElementById('prev-section');
    const nextButton = document.getElementById('next-section');
    
    if (prevButton) {
      prevButton.addEventListener('click', () => {
        const currentIndex = config.sections.indexOf(state.currentSection);
        if (currentIndex > 0) {
          switchToSection(config.sections[currentIndex - 1]);
        }
      });
    }
    
    if (nextButton) {
      nextButton.addEventListener('click', () => {
        const currentIndex = config.sections.indexOf(state.currentSection);
        if (currentIndex < config.sections.length - 1) {
          const nextSection = config.sections[currentIndex + 1];
          
          // Verifica se pode avançar (validação)
          if (canAdvanceToSection(nextSection)) {
            switchToSection(nextSection);
          } else {
            // Mostra erros e notificação
            highlightErrors();
            showNotification('Por favor, preencha os campos obrigatórios', 'warning');
          }
        }
      });
    }
  }
  
  // Configura campos do formulário com validação e eventos
  function setupFormFields() {
    // Toggle de segundo proponente
    const hasSecondProponent = document.getElementById('hasSecondProponent');
    if (hasSecondProponent) {
      hasSecondProponent.addEventListener('change', () => {
        toggleSecondProponent(hasSecondProponent.checked);
      });
    }
    
    // Toggle de FGTS
    const utilizaFGTS = document.getElementById('utilizaFGTS');
    if (utilizaFGTS) {
      utilizaFGTS.addEventListener('change', () => {
        toggleFGTSFields(utilizaFGTS.checked);
      });
    }
    
    // Toggle de financiamento de custas
    const financiamentoCustas = document.getElementById('financiamentoCustas');
    if (financiamentoCustas) {
      financiamentoCustas.addEventListener('change', () => {
        toggleCustasFields(financiamentoCustas.checked);
      });
    }
    
    // Campos de valor com cálculos automáticos
    setupCalculationFields();
    
    // Formatação de campos monetários
    setupMoneyFields();
    
    // Busca de endereço via API
    setupAddressLookup();
  }
  
  // Configura campos que envolvem cálculos automáticos
  function setupCalculationFields() {
    // Campos para cálculo de recursos próprios
    const calcFields = ['valorCompraVenda', 'valorFinanciamento', 'subsidio', 'valorFGTS'];
    
    calcFields.forEach(field => {
      const element = document.getElementById(field);
      if (element) {
        element.addEventListener('input', () => {
          calculateRecursosProprios();
          markFormAsModified();
        });
      }
    });
    
    // Campos para cálculo de renda familiar total
    const rendaFields = ['rendaPrincipal', 'rendaSegundo'];
    
    rendaFields.forEach(field => {
      const element = document.getElementById(field);
      if (element) {
        element.addEventListener('input', () => {
          calculateTotalIncome();
          markFormAsModified();
        });
      }
    });
  }
  
  // Configuração de campos monetários
  function setupMoneyFields() {
    const moneyFields = document.querySelectorAll('.money-input');
    
    moneyFields.forEach(field => {
      field.addEventListener('focus', function() {
        this.value = this.value.replace(/[^\d]/g, '');
      });
      
      field.addEventListener('blur', function() {
        this.value = formatMoney(this.value);
      });
      
      field.addEventListener('input', markFormAsModified);
    });
  }
  
  // Configuração de busca de endereço
  function setupAddressLookup() {
    const btnBuscar = document.getElementById('btn-buscar-endereco');
    const empreendimentoField = document.getElementById('empreendimento');
    
    if (btnBuscar && empreendimentoField) {
      btnBuscar.addEventListener('click', () => {
        const empreendimento = empreendimentoField.value.trim();
        if (empreendimento) {
          fetchEndereco(empreendimento);
        } else {
          showNotification('Digite o nome do empreendimento', 'warning');
        }
      });
    }
  }
  
  // Configura botões de submissão
  function setupSubmitButtons() {
    const submitButton = document.getElementById('submit-button');
    const sideSubmitButton = document.getElementById('side-submit-button');
    const debitoFGTSButton = document.querySelectorAll('a[href="debito-fgts.html"]');
    
    if (submitButton) {
      submitButton.addEventListener('click', handleSubmit);
    }
    
    if (sideSubmitButton) {
      sideSubmitButton.addEventListener('click', handleSubmit);
    }
    
    debitoFGTSButton.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        // Previne navegação imediata
        e.preventDefault();
        
        // Salva os dados atuais antes de navegar
        await saveFormData();
        
        // Navega para a página de débito FGTS
        window.location.href = 'debito-fgts.html';
      });
    });
  }
  
  // Configura listeners para mudanças no formulário
  function setupFormChangeListeners() {
    // Todos os inputs, selects e textareas
    const formElements = document.querySelectorAll('input, select, textarea');
    
    formElements.forEach(element => {
      element.addEventListener('change', () => {
        // Marca o formulário como modificado
        markFormAsModified();
        
        // Atualiza o resumo ao modificar
        if (element.id !== 'summary') {
          updateSummary();
        }
        
        // Valida o campo se não for readonly
        if (!element.readOnly) {
          validateField(element);
        }
        
        // Atualiza barra de progresso
        updateProgressBar();
      });
    });
  }
  
  // Marca o formulário como modificado (para autosave)
  function markFormAsModified() {
    state.formModified = true;
  }
  
  // Cálculo de recursos próprios
  function calculateRecursosProprios() {
    const valorCompraVenda = parseMoneyToNumber(getFieldValue('valorCompraVenda'));
    const valorFinanciamento = parseMoneyToNumber(getFieldValue('valorFinanciamento'));
    const subsidio = parseMoneyToNumber(getFieldValue('subsidio'));
    const fgts = parseMoneyToNumber(getFieldValue('valorFGTS'));
    
    // Valor dos recursos próprios
    const recursos = Math.max(0, valorCompraVenda - valorFinanciamento - subsidio - fgts);
    
    // Define o valor no campo
    setFieldValue('recursosProprios', formatMoney(recursos.toString()));
    
    // Calcula o valor total do imóvel (soma)
    const valorTotal = valorFinanciamento + subsidio + fgts + recursos;
    setFieldValue('valorTotalImovel', formatMoney(valorTotal.toString()));
    
    // Atualiza o resumo
    updateSummary();
  }
  
  // Calcula a renda familiar total
  function calculateTotalIncome() {
    const rendaPrincipal = parseMoneyToNumber(getFieldValue('rendaPrincipal'));
    const rendaSegundo = parseMoneyToNumber(getFieldValue('rendaSegundo'));
    
    const total = rendaPrincipal + rendaSegundo;
    
    // Define o valor no campo
    setFieldValue('rendaFamiliarTotal', formatMoney(total.toString()));
    
    // Atualiza o resumo
    updateSummary();
  }
  
  // Calcula valores derivados no carregamento
  function calculateDerivedValues() {
    calculateRecursosProprios();
    calculateTotalIncome();
  }
  
  // Busca endereço do empreendimento pela API
  async function fetchEndereco(empreendimento) {
    if (!empreendimento) return;
    
    // Verifica cache primeiro
    const cacheKey = `address_${empreendimento}`;
    if (apiCache.has(cacheKey)) {
      const cachedData = apiCache.get(cacheKey);
      setFieldValue('endereco', cachedData.enderecoCompleto);
      return;
    }
    
    // Mostra loading
    showLoading();
    
    try {
      const response = await fetch(`${config.apiBaseUrl}/get-endereco?empreendimento=${encodeURIComponent(empreendimento)}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar endereço');
      }
      
      const data = await response.json();
      
      // Salva no cache
      apiCache.set(cacheKey, data);
      
      // Define o valor no campo
      setFieldValue('endereco', data.enderecoCompleto);
      
      showNotification('Endereço encontrado!', 'success');
    } catch (error) {
      console.error('Erro ao buscar endereço:', error);
      showNotification('Erro ao buscar endereço', 'error');
    } finally {
      hideLoading();
    }
  }
  
  // Envia os dados da análise
  async function handleSubmit() {
    // Valida o formulário completo
    if (!validateForm()) {
      showNotification('Por favor, corrija os erros antes de enviar', 'error');
      return;
    }
    
    // Mostra loading
    showLoading();
    
    try {
      // Coleta todos os dados do formulário
      const formData = collectFormData();
      
      // Envia para a API
      await submitAnalysis(formData);
      
      // Salva no localStorage
      localStorage.setItem('analysisSent', 'true');
      
      // Redireciona para página de sucesso
      window.location.href = 'success.html';
    } catch (error) {
      console.error('Erro ao enviar análise:', error);
      showNotification('Erro ao enviar: ' + error.message, 'error');
      hideLoading();
    }
  }
  
  // Envia a análise para a API
  async function submitAnalysis(formData) {
    const response = await fetch(`${config.apiBaseUrl}/submit-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
      // Extrai mensagem de erro da resposta, se houver
      let errorMessage = 'Erro ao enviar dados';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // Ignora erro ao processar resposta
      }
      
      throw new Error(errorMessage);
    }
    
    return await response.json();
  }
  
  // Coleta todos os dados do formulário
  function collectFormData() {
    const formData = {
      personal: { proponentes: [] },
      property: {},
      simulation: {},
      income: {},
      constructor: {}
    };
    
    // Dados do proponente principal
    const proponentePrincipal = {
      nome: getFieldValue('nome'),
      cpf: getFieldValue('cpf'),
      dataNascimento: getFieldValue('dataNascimento'),
      rg: getFieldValue('rg'),
      email: getFieldValue('email'),
      telefone: getFieldValue('telefone'),
      profissao: getFieldValue('profissao'),
      renda: parseMoneyToNumber(getFieldValue('rendaPrincipal'))
    };
    
    formData.personal.proponentes.push(proponentePrincipal);
    
    // Dados do segundo proponente, se existir
    if (getFieldValue('hasSecondProponent')) {
      const segundoProponente = {
        nome: getFieldValue('nomeSegundo'),
        cpf: getFieldValue('cpfSegundo'),
        dataNascimento: getFieldValue('dataNascimentoSegundo'),
        rg: getFieldValue('rgSegundo'),
        email: getFieldValue('emailSegundo'),
        telefone: getFieldValue('telefoneSegundo'),
        profissao: getFieldValue('profissaoSegundo'),
        renda: parseMoneyToNumber(getFieldValue('rendaSegundo'))
      };
      
      formData.personal.proponentes.push(segundoProponente);
    }
    
    // Dados do imóvel
    formData.property = {
      valorCompraVenda: parseMoneyToNumber(getFieldValue('valorCompraVenda')),
      valorTotalImovel: parseMoneyToNumber(getFieldValue('valorTotalImovel')),
      subsidio: parseMoneyToNumber(getFieldValue('subsidio')),
      valorFinanciamento: parseMoneyToNumber(getFieldValue('valorFinanciamento')),
      recursosProprios: parseMoneyToNumber(getFieldValue('recursosProprios')),
      utilizaFGTS: getFieldValue('utilizaFGTS'),
      valorFGTS: parseMoneyToNumber(getFieldValue('valorFGTS'))
    };
    
    // Dados da simulação
    formData.simulation = {
      statusAnalise: getFieldValue('statusAnalise'),
      prazoFinanciamento: getFieldValue('prazoFinanciamento'),
      dataVencimento: getFieldValue('dataVencimentoAnalise'),
      sistemaAmortizacao: getFieldValue('sistemaAmortizacao'),
      indexador: getFieldValue('indexador'),
      valorPrimeiraParcela: parseMoneyToNumber(getFieldValue('valorPrimeiraParcela')),
      financiamentoCustas: getFieldValue('financiamentoCustas'),
      valorCustas: parseMoneyToNumber(getFieldValue('valorCustas')),
      valorParceladoSIRIC: parseMoneyToNumber(getFieldValue('valorParceladoSIRIC')),
      modalidadeFinanciamento: getFieldValue('modalidadeFinanciamento')
    };
    
    // Dados de renda
    formData.income = {
      rendaFamiliarTotal: parseMoneyToNumber(getFieldValue('rendaFamiliarTotal')),
      formasComprovacao: getMultiSelectValues('formaComprovacaoRenda')
    };
    
    // Dados da construtora
    formData.constructor = {
      construtora: getFieldValue('construtora'),
      empreendimento: getFieldValue('empreendimento'),
      unidade: getFieldValue('unidade'),
      bloco: getFieldValue('bloco'),
      endereco: getFieldValue('endereco')
    };
    
    return formData;
  }
  
  // Inicializa validação de formulário
  function initValidation() {
    // Adiciona listeners para validação em tempo real
    const requiredFields = getAllRequiredFields();
    
    requiredFields.forEach(fieldId => {
      const element = document.getElementById(fieldId);
      if (element) {
        element.addEventListener('blur', () => {
          validateField(element);
        });
      }
    });
  }
  
  // Obtém todos os campos obrigatórios
  function getAllRequiredFields() {
    const fields = [];
    Object.values(config.requiredFields).forEach(sectionFields => {
      fields.push(...sectionFields);
    });
    return fields;
  }
  
  // Valida um campo específico
  function validateField(element) {
    const fieldId = element.id;
    const value = element.value.trim();
    
    // Verifica se é um campo obrigatório
    const isRequired = getAllRequiredFields().includes(fieldId);
    
    if (isRequired && !value) {
      // Campo obrigatório vazio
      markFieldAsInvalid(element, 'Este campo é obrigatório');
      return false;
    }
    
    // Validações específicas por tipo de campo
    if (fieldId === 'cpf' && value) {
      if (!validateCPF(value)) {
        markFieldAsInvalid(element, 'CPF inválido');
        return false;
      }
    }
    
    if (fieldId === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        markFieldAsInvalid(element, 'E-mail inválido');
        return false;
      }
    }
    
    if (fieldId === 'telefone' && value) {
      const phoneRegex = /^\(\d{2}\) \d{4,5}-\d{4}$/;
      if (!phoneRegex.test(value)) {
        markFieldAsInvalid(element, 'Telefone inválido');
        return false;
      }
    }
    
    // Se chegou aqui, o campo é válido
    markFieldAsValid(element);
    return true;
  }
  
  // Valida todos os campos de uma seção
  function validateSection(section) {
    const requiredFieldsInSection = config.requiredFields[section] || [];
    let isValid = true;
    
    requiredFieldsInSection.forEach(fieldId => {
      const element = document.getElementById(fieldId);
      if (element) {
        if (!validateField(element)) {
          isValid = false;
        }
      }
    });
    
    return isValid;
  }
  
  // Valida o formulário completo
  function validateForm() {
    let isValid = true;
    
    // Valida cada seção
    config.sections.forEach(section => {
      if (!validateSection(section)) {
        isValid = false;
      }
    });
    
    return isValid;
  }
  
  // Marca um campo como inválido
  function markFieldAsInvalid(element, message) {
    element.classList.add('border-red-500');
    element.classList.remove('border-green-500', 'focus:border-blue-500');
    
    // Adiciona mensagem de erro
    let errorElement = element.nextElementSibling;
    if (!errorElement || !errorElement.classList.contains('error-message')) {
      errorElement = document.createElement('p');
      errorElement.className = 'error-message text-xs text-red-500 mt-1';
      element.parentNode.insertBefore(errorElement, element.nextSibling);
    }
    
    errorElement.textContent = message;
    
    // Adiciona ao estado de erros
    state.formErrors[element.id] = message;
  }
  
  // Marca um campo como válido
  function markFieldAsValid(element) {
    element.classList.remove('border-red-500');
    element.classList.add('border-green-500', 'focus:border-blue-500');
    
    // Remove mensagem de erro
    const errorElement = element.nextElementSibling;
    if (errorElement && errorElement.classList.contains('error-message')) {
      errorElement.parentNode.removeChild(errorElement);
    }
    
    // Remove do estado de erros
    delete state.formErrors[element.id];
  }
  
  // Destaca todos os erros
  function highlightErrors() {
    // Verifica os campos da seção atual
    const requiredFieldsInSection = config.requiredFields[state.currentSection] || [];
    
    requiredFieldsInSection.forEach(fieldId => {
      const element = document.getElementById(fieldId);
      if (element) {
        validateField(element);
      }
    });
    
    // Rola até o primeiro erro
    const firstErrorElement = document.querySelector('.border-red-500');
    if (firstErrorElement) {
      firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
  
  // Verifica se pode avançar para uma seção
  function canAdvanceToSection(targetSection) {
    // Para ir para o resumo, todas as seções anteriores devem estar válidas
    if (targetSection === 'summary') {
      return validateForm();
    }
    
    // Para voltar para seções anteriores, sempre permite
    const currentIndex = config.sections.indexOf(state.currentSection);
    const targetIndex = config.sections.indexOf(targetSection);
    
    if (targetIndex < currentIndex) {
      return true;
    }
    
    // Para avançar, valida a seção atual
    return validateSection(state.currentSection);
  }
  
  // Troca para uma seção específica
  function switchToSection(section) {
    // Esconde todas as seções
    document.querySelectorAll('.section-content').forEach(element => {
      element.classList.add('hidden');
    });
    
    // Mostra a seção selecionada
    const sectionElement = document.getElementById(`section-${section}`);
    if (sectionElement) {
      sectionElement.classList.remove('hidden');
    }
    
    // Atualiza as tabs
    document.querySelectorAll('#section-tabs button').forEach(button => {
      const buttonSection = button.getAttribute('data-section');
      
      if (buttonSection === section) {
        button.classList.add('bg-blue-100', 'text-blue-700', 'font-medium');
        button.classList.remove('text-gray-700', 'hover:bg-gray-100');
      } else {
        button.classList.remove('bg-blue-100', 'text-blue-700', 'font-medium');
        button.classList.add('text-gray-700', 'hover:bg-gray-100');
      }
    });
    
    // Atualiza o estado
    state.currentSection = section;
    
    // Atualiza barra de progresso
    updateProgressBar();
  }
  
  // Habilita/desabilita seção de segundo proponente
  function toggleSecondProponent(show) {
    const secondProponentFields = document.getElementById('second-proponent-fields');
    if (secondProponentFields) {
      if (show) {
        secondProponentFields.classList.remove('hidden');
      } else {
        secondProponentFields.classList.add('hidden');
      }
    }
  }
  
  // Habilita/desabilita campos de FGTS
  function toggleFGTSFields(show) {
    const fgtsFields = document.getElementById('fgts-fields');
    if (fgtsFields) {
      if (show) {
        fgtsFields.classList.remove('hidden');
      } else {
        fgtsFields.classList.add('hidden');
      }
    }
    
    // Recalcula recursos próprios
    calculateRecursosProprios();
  }
  
  // Habilita/desabilita campos de custas
  function toggleCustasFields(show) {
    const custasFields = document.getElementById('custas-fields');
    if (custasFields) {
      if (show) {
        custasFields.classList.remove('hidden');
      } else {
        custasFields.classList.add('hidden');
      }
    }
  }
  
  // Atualiza a barra de progresso
  function updateProgressBar() {
    // Calcula porcentagem preenchida
    const totalFields = getAllRequiredFields().length;
    const filledFields = getAllRequiredFields().filter(field => {
      const element = document.getElementById(field);
      return element && element.value.trim() !== '';
    }).length;
    
    const percentage = Math.round((filledFields / totalFields) * 100);
    
    // Atualiza a largura da barra
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) {
      progressBar.style.width = `${percentage}%`;
    }
    
    // Atualiza o texto de porcentagem
    const progressText = document.getElementById('progress-percentage');
    if (progressText) {
      progressText.textContent = `${percentage}%`;
    }
    
    // Atualiza estado
    state.formProgress = percentage;
  }
  
  // Atualiza resumo com informações preenchidas
  function updateSummary() {
    // Proponente principal
    setSummaryValue('summary-nome', getFieldValue('nome'));
    setSummaryValue('summary-cpf', getFieldValue('cpf'));
    setSummaryValue('summary-profissao', getFieldValue('profissao'));
    setSummaryValue('summary-renda', getFieldValue('rendaPrincipal'));
    
    // Proponente secundário (condicional)
    const hasSecondProponent = getFieldValue('hasSecondProponent');
    const summarySecondSection = document.getElementById('summary-segundo-proponente');
    
    if (summarySecondSection) {
      if (hasSecondProponent) {
        summarySecondSection.classList.remove('hidden');
        setSummaryValue('summary-nome-segundo', getFieldValue('nomeSegundo'));
        setSummaryValue('summary-cpf-segundo', getFieldValue('cpfSegundo'));
        setSummaryValue('summary-profissao-segundo', getFieldValue('profissaoSegundo'));
        setSummaryValue('summary-renda-segundo', getFieldValue('rendaSegundo'));
      } else {
        summarySecondSection.classList.add('hidden');
      }
    }
    
    // Imóvel e financiamento
    setSummaryValue('summary-valor-compra-venda', getFieldValue('valorCompraVenda'));
    setSummaryValue('summary-valor-financiamento', getFieldValue('valorFinanciamento'));
    setSummaryValue('summary-subsidio', getFieldValue('subsidio'));
    setSummaryValue('summary-fgts', getFieldValue('utilizaFGTS') ? getFieldValue('valorFGTS') : 'Não utilizado');
    setSummaryValue('summary-recursos-proprios', getFieldValue('recursosProprios'));
    setSummaryValue('summary-status-analise', getFieldValue('statusAnalise'));
    setSummaryValue('summary-modalidade', getFieldValue('modalidadeFinanciamento'));
    setSummaryValue('summary-sistema-amortizacao', getFieldValue('sistemaAmortizacao'));
    
    // Renda
    setSummaryValue('summary-renda-total', getFieldValue('rendaFamiliarTotal'));
    setSummaryValue('summary-comprovacao-renda', getMultiSelectValues('formaComprovacaoRenda').join(', '));
    
    // Construtora
    setSummaryValue('summary-construtora', getFieldValue('construtora'));
    setSummaryValue('summary-empreendimento', getFieldValue('empreendimento'));
    setSummaryValue('summary-unidade', getFieldValue('unidade'));
    setSummaryValue('summary-bloco', getFieldValue('bloco'));
    setSummaryValue('summary-endereco', getFieldValue('endereco'));
    
    // Lateral (resumo rápido)
    document.getElementById('side-nome')?.textContent = getFieldValue('nome') || '-';
    document.getElementById('side-cpf')?.textContent = getFieldValue('cpf') || '-';
    document.getElementById('side-renda')?.textContent = getFieldValue('rendaPrincipal') || '-';
    document.getElementById('side-financiamento')?.textContent = getFieldValue('valorFinanciamento') || '-';
    document.getElementById('side-modalidade')?.textContent = getFieldValue('modalidadeFinanciamento') || '-';
    
    // Status de crédito
    updateStatusIndicator();
  }
  
  // Atualiza o indicador de status
  function updateStatusIndicator() {
    const statusIndicator = document.getElementById('status-indicator');
    const statusValue = getFieldValue('statusAnalise');
    
    if (statusIndicator && statusValue) {
      statusIndicator.textContent = statusValue;
      
      // Remove classes anteriores
      statusIndicator.classList.remove(
        'bg-green-100', 'text-green-800',
        'bg-red-100', 'text-red-800',
        'bg-yellow-100', 'text-yellow-800',
        'bg-gray-100', 'text-gray-800'
      );
      
      // Adiciona classe de acordo com o status
      switch (statusValue) {
        case 'APROVADO':
          statusIndicator.classList.add('bg-green-100', 'text-green-800');
          break;
        case 'REPROVADO':
          statusIndicator.classList.add('bg-red-100', 'text-red-800');
          break;
        case 'CONDICIONADO':
          statusIndicator.classList.add('bg-yellow-100', 'text-yellow-800');
          break;
        default:
          statusIndicator.classList.add('bg-gray-100', 'text-gray-800');
      }
    }
  }
  
  // Inicializa autosave
  function initAutoSave() {
    // Verifica a cada X segundos se houve modificação
    setInterval(async () => {
      if (state.formModified) {
        await saveFormData();
        state.formModified = false;
      }
    }, config.autoSaveInterval);
    
    // Salva antes de fechar/recarregar a página
    window.addEventListener('beforeunload', async (e) => {
      if (state.formModified) {
        await saveFormData();
      }
    });
  }
  
  // Salva os dados do formulário
  async function saveFormData() {
    try {
      const formData = collectFormData();
      localStorage.setItem('customerData', JSON.stringify(formData));
      
      return true;
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      return false;
    }
  }
  
  // Utilitários
  
  // Mostrar notificação
  function showNotification(message, type = 'info') {
    // Remove notificações existentes
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
      notification.remove();
    });
    
    // Cria elemento de notificação
    const notification = document.createElement('div');
    notification.className = 'notification fixed top-20 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-500 transform translate-x-full';
    
    // Define estilo baseado no tipo
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
      notification.classList.remove('translate-x-full');
      notification.classList.add('translate-x-0');
    }, 10);
    
    // Remove após alguns segundos
    setTimeout(() => {
      notification.classList.add('translate-x-full');
      setTimeout(() => {
        notification.remove();
      }, 500);
    }, 5000);
  }
  
  // Mostra overlay de carregamento
  function showLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.classList.remove('hidden');
    }
  }
  
  // Esconde overlay de carregamento
  function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.classList.add('hidden');
    }
  }
  
  // Obtenção de valor de um campo
  function getFieldValue(fieldId) {
    const element = document.getElementById(fieldId);
    
    if (!element) return '';
    
    if (element.type === 'checkbox') {
      return element.checked;
    }
    
    return element.value;
  }
  
  // Definição de valor em um campo
  function setFieldValue(fieldId, value) {
    const element = document.getElementById(fieldId);
    
    if (!element) return;
    
    if (element.type === 'checkbox') {
      element.checked = Boolean(value);
    } else {
      element.value = value;
    }
  }
  
  // Obtenção de valores de um select múltiplo
  function getMultiSelectValues(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return [];
    
    return Array.from(select.selectedOptions).map(option => option.value);
  }
  
  // Definição de valor em um campo de resumo
  function setSummaryValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = value || '-';
    }
  }
  
  // Formatação de valores monetários
  function formatMoney(value) {
    if (!value) return 'R$ 0,00';
    
    const number = parseFloat(value.replace(/\D/g, '')) / 100;
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(number);
  }
  
  // Converte string de dinheiro para número
  function parseMoneyToNumber(value) {
    if (!value) return 0;
    
    // Remove todos os caracteres não numéricos
    const numericValue = value.replace(/\D/g, '');
    
    // Converte para número (considerando os centavos)
    return numericValue ? parseInt(numericValue, 10) / 100 : 0;
  }
  
  // Formata CPF
  function formatCPF(cpf) {
    if (!cpf) return '';
    
    const numericCPF = cpf.replace(/\D/g, '');
    
    if (numericCPF.length !== 11) return cpf;
    
    return numericCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  
  // Valida CPF
  function validateCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    
    if (cpf.length !== 11) return false;
    
    // Verifica CPFs inválidos conhecidos
    if (/^(\d)\1+$/.test(cpf)) return false;
    
    // Validação dos dígitos verificadores
    let sum = 0;
    let remainder;
    
    // Primeiro dígito
    for (let i = 1; i <= 9; i++) {
      sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }
    
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(9, 10))) return false;
    
    // Segundo dígito
    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }
    
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.substring(10, 11))) return false;
    
    return true;
  }
  
  // API pública do módulo
  return {
    init,
    switchToSection,
    calculateRecursosProprios,
    calculateTotalIncome,
    updateSummary,
    validateForm,
    showNotification
  };
})();

// Inicializa o aplicativo quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', CreditAnalysis.init);
