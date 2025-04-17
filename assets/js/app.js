document.addEventListener('DOMContentLoaded', function() {
    // Verificar se temos dados de cliente no localStorage
    const customerDataStr = localStorage.getItem('customerData');
    const customerCPF = localStorage.getItem('customerCPF');
    
    if (!customerDataStr || !customerCPF) {
        // Redirecionar para a página inicial se não houver dados
        window.location.href = 'index.html';
        return;
    }
    
    const customerData = JSON.parse(customerDataStr);
    
    // Preencher dados básicos no cabeçalho
    document.getElementById('header-customer-name').textContent = customerData.personal.nome;
    document.getElementById('header-customer-cpf').textContent = customerCPF;
    document.getElementById('customer-initials').textContent = customerData.personal.nome.charAt(0);
    
    // Preencher dados no resumo lateral
    document.getElementById('side-nome').textContent = customerData.personal.nome;
    document.getElementById('side-cpf').textContent = customerCPF;
    
    // Preencher formulário com dados do cliente
    populateFormWithCustomerData(customerData, customerCPF);
    
    // Configurar navegação entre abas
    setupTabNavigation();
    
    // Configurar validações e cálculos dinâmicos
    setupFormValidations();
    
    // Configurar botões de envio
    setupSubmitButtons();
});

/**
 * Preenche o formulário com os dados do cliente
 */
function populateFormWithCustomerData(data, cpf) {
    // Preencher dados pessoais
    document.getElementById('nome').value = data.personal.nome;
    document.getElementById('cpf').value = cpf;
    document.getElementById('dataNascimento').value = data.personal.dataNascimento;
    document.getElementById('rg').value = data.personal.rg;
    document.getElementById('email').value = data.personal.email;
    document.getElementById('telefone').value = data.personal.telefone;
    
    // Preencher dados do imóvel
    document.getElementById('valorImovel').value = formatMoney(data.property.valorImovel.toString());
    document.getElementById('valorCompraVenda').value = formatMoney(data.property.valorCompraVenda.toString());
    document.getElementById('subsidio').value = formatMoney(data.property.subsidio.toString());
    document.getElementById('valorFinanciamento').value = formatMoney(data.property.valorFinanciamento.toString());
    
    document.getElementById('utilizaFGTS').checked = data.property.utilizaFGTS;
    if (data.property.utilizaFGTS) {
        document.getElementById('fgts-fields').classList.remove('hidden');
        document.getElementById('valorFGTS').value = formatMoney(data.property.valorFGTS.toString());
    }
    
    // Outros campos seriam preenchidos de forma semelhante
    
    // Preencher o resumo
    updateSummary();
}

/**
 * Configura navegação entre abas
 */
function setupTabNavigation() {
    const tabs = document.querySelectorAll('#section-tabs button');
    const sections = document.querySelectorAll('.section-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetSection = tab.getAttribute('data-section');
            
            // Atualizar abas
            tabs.forEach(t => {
                if (t.getAttribute('data-section') === targetSection) {
                    t.classList.add('bg-blue-100', 'text-blue-700', 'font-medium');
                    t.classList.remove('text-gray-700', 'hover:bg-gray-100');
                } else {
                    t.classList.remove('bg-blue-100', 'text-blue-700', 'font-medium');
                    t.classList.add('text-gray-700', 'hover:bg-gray-100');
                }
            });
            
            // Atualizar seções
            sections.forEach(section => {
                if (section.id === 'section-' + targetSection) {
                    section.classList.remove('hidden');
                } else {
                    section.classList.add('hidden');
                }
            });
            
            // Atualizar barra de progresso
            updateProgressBar(targetSection);
        });
    });
}

/**
 * Atualiza a barra de progresso com base na seção ativa
 */
function updateProgressBar(activeSection) {
    const sections = ['personal', 'property', 'simulation', 'income', 'constructor', 'summary'];
    const index = sections.indexOf(activeSection);
    const progressPercentage = (index / (sections.length - 1)) * 100;
    
    document.getElementById('progress-bar').style.width = `${progressPercentage}%`;
}

/**
 * Configura validações e cálculos dinâmicos do formulário
 */
function setupFormValidations() {
    // Mostrar/ocultar campos de FGTS quando o checkbox for clicado
    const fgtsCheckbox = document.getElementById('utilizaFGTS');
    const fgtsFields = document.getElementById('fgts-fields');
    
    fgtsCheckbox.addEventListener('change', function() {
        if (this.checked) {
            fgtsFields.classList.remove('hidden');
        } else {
            fgtsFields.classList.add('hidden');
            document.getElementById('valorFGTS').value = '0,00';
        }
        
        // Recalcular valor de financiamento
        calculateFinancingValue();
    });
    
    // Calcular valor de financiamento quando valores mudarem
    const valorCompraVenda = document.getElementById('valorCompraVenda');
    const subsidio = document.getElementById('subsidio');
    const valorFGTS = document.getElementById('valorFGTS');
    
    [valorCompraVenda, subsidio, valorFGTS].forEach(input => {
        if (input) {
            input.addEventListener('input', calculateFinancingValue);
        }
    });
}

/**
 * Calcula o valor de financiamento com base nos outros valores
 */
function calculateFinancingValue() {
    const valorCV = parseMoneyToNumber(document.getElementById('valorCompraVenda').value);
    const valorSubsidio = parseMoneyToNumber(document.getElementById('subsidio').value);
    
    let valorFGTS = 0;
    if (document.getElementById('utilizaFGTS').checked) {
        valorFGTS = parseMoneyToNumber(document.getElementById('valorFGTS').value);
    }
    
    // Valor Financiamento = Valor Compra e Venda - Subsídio - FGTS
    const valorFinanciamento = valorCV - valorSubsidio - valorFGTS;
    
    document.getElementById('valorFinanciamento').value = formatMoney(valorFinanciamento.toString());
    
    // Atualizar resumo
    updateSummary();
}

/**
 * Atualiza o resumo com os valores atuais do formulário
 */
function updateSummary() {
    // Atualizar resumo lateral e seção de resumo
    document.getElementById('summary-nome').textContent = document.getElementById('nome').value;
    document.getElementById('summary-cpf').textContent = document.getElementById('cpf').value;
    // Outros campos do resumo seriam atualizados de forma semelhante
}

/**
 * Configura os botões de envio
 */
function setupSubmitButtons() {
    const mainSubmitButton = document.getElementById('submit-button');
    const sideSubmitButton = document.getElementById('side-submit-button');
    
    const submitFunction = function() {
        document.getElementById('loading').classList.remove('hidden');
        
        // Coletar todos os dados do formulário
        const formData = {
            personal: {
                nome: document.getElementById('nome').value,
                cpf: document.getElementById('cpf').value,
                dataNascimento: document.getElementById('dataNascimento').value,
                rg: document.getElementById('rg').value,
                email: document.getElementById('email').value,
                telefone: document.getElementById('telefone').value
            },
            property: {
                valorImovel: parseMoneyToNumber(document.getElementById('valorImovel').value),
                valorCompraVenda: parseMoneyToNumber(document.getElementById('valorCompraVenda').value),
                subsidio: parseMoneyToNumber(document.getElementById('subsidio').value),
                valorFinanciamento: parseMoneyToNumber(document.getElementById('valorFinanciamento').value),
                utilizaFGTS: document.getElementById('utilizaFGTS').checked
            }
            // Outros dados seriam coletados de forma semelhante
        };
        
        if (formData.property.utilizaFGTS) {
            formData.property.valorFGTS = parseMoneyToNumber(document.getElementById('valorFGTS').value);
        }
        
        // Enviar dados
        submitAnalysis(formData)
            .then(response => {
                console.log('Resposta:', response);
                // Redirecionar para página de sucesso
                window.location.href = 'success.html';
            })
            .catch(error => {
                console.error('Erro:', error);
                alert('Ocorreu um erro ao enviar a análise. Por favor, tente novamente.');
                document.getElementById('loading').classList.add('hidden');
            });
    };
    
    mainSubmitButton.addEventListener('click', submitFunction);
    sideSubmitButton.addEventListener('click', submitFunction);
}