/**
 * Módulo de Débito FGTS - Sistema de Análise de Crédito
 * Versão 2.1.5
 * 
 * Integração com n8n e bots FGTS para processamento e geração de DAMP
 * (Documento de Autorização para Movimentação da Conta Vinculada do FGTS)
 */
$(document).ready(function() {
    // Configurações
    const config = {
        // Webhook principal do n8n (será completado com o tipo de bot selecionado)
        n8nWebhookBaseUrl: 'https://suportico.app.n8n.cloud/webhook-test/fgts/',
        
        // URLs específicas para cada tipo de bot
        botTypeUrls: {
            'BotIndividual': 'bot-individual',
            'BotDampManual': 'bot-damp-manual',
            'botConsultaOperacao': 'bot-consulta-operacao',
            'botDampCIWEB': 'bot-damp-ciweb',
            'BotEmpreendimento': 'bot-empreendimento'
        },
        
        // Tempos estimados de processamento por tipo de bot (em minutos)
        botProcessingTimes: {
            'BotIndividual': '3-5',
            'BotDampManual': '1-2',
            'botConsultaOperacao': '1-3',
            'botDampCIWEB': '4-6',
            'BotEmpreendimento': '5-8'
        },
        
        // Configurações gerais
        autoSave: true,
        autoSaveInterval: 30000, // 30 segundos
        errorTimeout: 5000,      // Tempo para exibição de mensagens de erro (ms)
        validateOnBlur: true,    // Validação ao sair do campo
        
        // Simulação de progresso
        progressUpdateInterval: 1000, // Atualização de progresso a cada 1 segundo
        progressMaxTime: 300000       // Tempo máximo de processamento (5 minutos em ms)
    };
    
    // Estado da aplicação
    window.state = {
        dealId: null,
        dealData: null,
        formModified: false,
        isSubmitting: false,
        autosaveTimer: null,
        selectedBotType: null,
        processingStartTime: null,
        processingTimer: null,
        downloadedFiles: []
    };

    // --- Inicialização ---
    initializePage();

    // --- Event Listeners ---
    // Botão Voltar ao Dashboard
    $('#voltarDashboardBtn').on('click', function() {
        // Verifica se há dados não salvos
        if (state.formModified) {
            saveFormDataToLocalStorage();
        }
        
        // Redireciona para o dashboard
        window.location.href = `dashboard.html?dealId=${state.dealId}`;
    });

    // Seleção de tipo de bot
    $('.bot-option').on('click', function() {
        // Remove a classe 'selected' de todas as opções
        $('.bot-option').removeClass('selected');
        
        // Adiciona a classe 'selected' à opção clicada
        $(this).addClass('selected');
        
        // Atualiza o valor no campo hidden e o estado
        const botType = $(this).data('bot-type');
        $('#selectedBotType').val(botType);
        state.selectedBotType = botType;
        
        // Atualiza mensagem de tempo estimado
        $('#estimated-time').text(config.botProcessingTimes[botType] || '3-5');
        
        // Marca o formulário como modificado
        state.formModified = true;
    });

    // Manipulador de envio do formulário
    $('#form-debito-fgts').on('submit', function(event) {
        event.preventDefault();
        
        // Valida o formulário
        if (!validateForm()) {
            showStatus('Por favor, corrija os erros no formulário antes de enviar.', 'danger');
            return;
        }
        
        // Coleta os dados
        const payload = gatherFormData();
        
        // Confirmação final antes do envio
        const botName = $('.bot-option.selected').find('h6').text();
        if (confirm(`Deseja gerar a DAMP utilizando o processador "${botName}"?`)) {
            // Envia os dados
            sendToN8N(payload);
        }
    });

    /**
     * Inicializa a página
     */
    function initializePage() {
        // Recupera o ID da operação a partir da URL
        const urlParams = new URLSearchParams(window.location.search);
        const dealId = urlParams.get('dealId');
        
        if (!dealId) {
            showStatus('Erro: ID da Operação não encontrado na URL.', 'danger', false);
            $('#enviarSolicitacaoBtn').prop('disabled', true);
            return;
        }
        
        state.dealId = dealId;
        $('#dealId').text(dealId);
        
        // Tenta carregar dados salvos no localStorage
        if (loadSavedData()) {
            console.log('Dados recuperados do localStorage');
        } else {
            // Se não encontrar no localStorage, busca do Ploomes
            fetchPloomesData(dealId);
        }
        
        // Configura autosave se habilitado
        if (config.autoSave) {
            setupAutosave();
        }
        
        // Define o ano atual no footer
        $('#current-year').text(new Date().getFullYear());
        
        // Inicializa tooltips
        initTooltips();
    }

    /**
     * Inicializa tooltips
     */
    function initTooltips() {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }

    /**
     * Busca dados do Ploomes para a operação especificada
     */
    async function fetchPloomesData(dealId) {
        toggleLoading(true, 'Carregando dados do Ploomes...');
        console.log(`Buscando dados do Ploomes para Deal ID: ${dealId}`);
        
        try {
            // Simula busca de dados do Ploomes (em produção, isso seria substituído por uma chamada real à API)
            // Aqui estamos simulando um atraso de rede e um objeto de resposta
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const dealData = {
                value: [{
                    Id: dealId,
                    Name: "Financiamento Imobiliário - Maria Oliveira",
                    Amount: 450000,
                    Contact: {
                        Name: "Maria Oliveira Santos",
                        Id: "12345",
                        OtherProperties: [
                            { FieldKey: "FieldKey_CPF", StringValue: "123.456.789-00" }
                        ]
                    },
                    OtherProperties: [
                        { FieldKey: "FieldKey_ValorCompraVenda", DecimalValue: 550000 },
                        { FieldKey: "FieldKey_ValorFGTS", DecimalValue: 40000 },
                        { FieldKey: "FieldKey_ValorSubsidio", DecimalValue: 20000 },
                        { FieldKey: "FieldKey_NumeroAgenciaVinculada", StringValue: "1234" },
                        { FieldKey: "FieldKey_NumeroContratoFinanciamento", StringValue: "84480000123456" },
                        { FieldKey: "FieldKey_MatriculaImovel", StringValue: "98765" },
                        { FieldKey: "FieldKey_Bairro", StringValue: "Jardim América" }
                    ]
                }]
            };
            
            // Armazena os dados para uso posterior
            state.dealData = dealData;
            
            // Exibe os dados na interface
            displayPloomesData(dealData.value[0]);
            
            showStatus('Dados carregados com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao buscar dados do Ploomes:', error);
            showStatus(`Erro ao buscar dados: ${error.message}`, 'danger');
            $('#enviarSolicitacaoBtn').prop('disabled', true);
        } finally {
            toggleLoading(false);
        }
    }
    
    /**
     * Exibe dados do Ploomes na interface
     */
    function displayPloomesData(deal) {
        if (!deal) return;
        
        // Informações básicas da operação
        $('#dealName').text(deal.Name || 'Sem nome');
        
        // Informações do cliente
        if (deal.Contact) {
            $('#contactName').text(deal.Contact.Name || 'Sem nome');
            
            // Iniciais do cliente
            const nameParts = (deal.Contact.Name || 'SN').split(' ');
            const initials = nameParts.length > 1 
                ? `${nameParts[0][0]}${nameParts[nameParts.length-1][0]}`
                : nameParts[0].substring(0, 2);
            $('#clientInitials').text(initials.toUpperCase());
            
            // CPF
            const cpfPropertyKey = "FieldKey_CPF";
            const cpfProp = deal.Contact.OtherProperties?.find(prop => prop.FieldKey === cpfPropertyKey);
            const cpf = cpfProp?.StringValue || '';
            $('#contactCPF').text(formatCPF(cpf));
        }
        
        // Valores do negócio
        const formatCurrency = (value) => {
            return new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
            }).format(value || 0);
        };
        
        $('#valorFinanciamento').text(formatCurrency(deal.Amount));
        
        // Valores customizados das propriedades
        const getPropertyValue = (fieldKey) => {
            const prop = deal.OtherProperties?.find(p => p.FieldKey === fieldKey);
            return prop?.DecimalValue || prop?.IntValue || 0;
        };
        
        $('#valorCompraVenda').text(formatCurrency(getPropertyValue('FieldKey_ValorCompraVenda')));
        $('#valorFGTSDebitar').text(formatCurrency(getPropertyValue('FieldKey_ValorFGTS')));
        
        // Pré-preenche campos do formulário
        $('#fgtsAgencia').val(getPropertyStringValue(deal, 'FieldKey_NumeroAgenciaVinculada'));
        $('#fgtsContrato').val(getPropertyStringValue(deal, 'FieldKey_NumeroContratoFinanciamento'));
        $('#fgtsMatriculaImovel').val(getPropertyStringValue(deal, 'FieldKey_MatriculaImovel'));
        $('#fgtsBairro').val(getPropertyStringValue(deal, 'FieldKey_Bairro'));
        
        // Pré-preenche o primeiro proponente se os dados existirem
        populateFirstProponent(deal);
    }
    
    /**
     * Obtém valor de string de uma propriedade personalizada
     */
    function getPropertyStringValue(deal, fieldKey) {
        const prop = deal?.OtherProperties?.find(p => p.FieldKey === fieldKey);
        return prop?.StringValue || '';
    }
    
    /**
     * Pré-preenche o primeiro proponente com os dados do contato principal
     */
    function populateFirstProponent(deal) {
        if (!deal || !deal.Contact) return;
        
        // Aguarda até que o primeiro proponente esteja disponível
        const checkForProponenteCard = setInterval(() => {
            const firstProponenteCard = $("#proponentesContainer .proponente-card").first();
            
            if (firstProponenteCard.length > 0) {
                clearInterval(checkForProponenteCard);
                
                // Preenche os dados do contato principal
                firstProponenteCard.find(".proponente-nome").val(deal.Contact.Name || '');
                
                // CPF
                const cpfPropertyKey = "FieldKey_CPF";
                const cpfProp = deal.Contact.OtherProperties?.find(prop => prop.FieldKey === cpfPropertyKey);
                if (cpfProp?.StringValue) {
                    firstProponenteCard.find(".proponente-cpf").val(cpfProp.StringValue);
                }
            }
        }, 100);
    }
    
    /**
     * Formata um CPF
     */
    function formatCPF(cpf) {
        if (!cpf) return '';
        
        // Remove caracteres não numéricos
        cpf = cpf.replace(/\D/g, '');
        
        if (cpf.length !== 11) return cpf;
        
        // Formata como XXX.XXX.XXX-XX
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    /**
     * Configura autosave
     */
    function setupAutosave() {
        // Limpa timer existente
        if (state.autosaveTimer) {
            clearInterval(state.autosaveTimer);
        }
        
        // Configura novo timer de autosave
        state.autosaveTimer = setInterval(() => {
            if (state.formModified) {
                saveFormDataToLocalStorage();
                state.formModified = false;
            }
        }, config.autoSaveInterval);
        
        // Salva também antes de fechar/recarregar a página
        window.addEventListener('beforeunload', () => {
            if (state.formModified) {
                saveFormDataToLocalStorage();
            }
        });
    }
    
    /**
     * Salva dados do formulário no localStorage
     */
    function saveFormDataToLocalStorage() {
        try {
            const formData = {
                dealId: state.dealId,
                timestamp: new Date().toISOString(),
                selectedBotType: state.selectedBotType,
                generalData: {
                    numeroContato: $('#fgtsNumeroContato').val(),
                    agencia: $('#fgtsAgencia').val(),
                    contrato: $('#fgtsContrato').val(),
                    matricula: $('#fgtsMatriculaImovel').val(),
                    tipoComplemento: $('#fgtsTipoComplemento').val(),
                    numeroComplemento: $('#fgtsNumeroComplemento').val(),
                    blocoComplemento: $('#fgtsBlocoComplemento').val(),
                    bairro: $('#fgtsBairro').val()
                },
                proponentes: []
            };
            
            // Coleta dados dos proponentes e suas contas
            $("#proponentesContainer .proponente-card").each(function() {
                const proponenteCard = $(this);
                
                const proponente = {
                    nome: proponenteCard.find(".proponente-nome").val(),
                    cpf: proponenteCard.find(".proponente-cpf").val(),
                    pis: proponenteCard.find(".proponente-pis").val(),
                    nascimento: proponenteCard.find(".proponente-nascimento").val(),
                    carteira: proponenteCard.find(".proponente-carteira").val(),
                    serie: proponenteCard.find(".proponente-serie").val(),
                    contas: []
                };
                
                // Coleta dados das contas
                proponenteCard.find(".contas-fgts-container .conta-fgts-card").each(function() {
                    const contaCard = $(this);
                    
                    const conta = {
                        situacao: contaCard.find(".conta-situacao").val(),
                        estabelecimento: contaCard.find(".conta-estabelecimento").val(),
                        numero: contaCard.find(".conta-numero").val(),
                        sureg: contaCard.find(".conta-sureg").val(),
                        valor: contaCard.find(".conta-valor").val(),
                        empregador: contaCard.find(".conta-empregador").val()
                    };
                    
                    proponente.contas.push(conta);
                });
                
                formData.proponentes.push(proponente);
            });
            
            // Salva no localStorage
            localStorage.setItem(`fgts_form_${state.dealId}`, JSON.stringify(formData));
            console.log('Dados salvos no localStorage');
            
            return true;
        } catch (error) {
            console.error('Erro ao salvar dados no localStorage:', error);
            return false;
        }
    }
    
    /**
     * Carrega dados salvos no localStorage
     */
    function loadSavedData() {
        try {
            const savedData = localStorage.getItem(`fgts_form_${state.dealId}`);
            
            if (!savedData) {
                return false;
            }
            
            const formData = JSON.parse(savedData);
            
            // Verifica se os dados são do mesmo negócio
            if (formData.dealId !== state.dealId) {
                return false;
            }
            
            // Preenche dados gerais
            $('#fgtsNumeroContato').val(formData.generalData.numeroContato || '');
            $('#fgtsAgencia').val(formData.generalData.agencia || '');
            $('#fgtsContrato').val(formData.generalData.contrato || '');
            $('#fgtsMatriculaImovel').val(formData.generalData.matricula || '');
            $('#fgtsTipoComplemento').val(formData.generalData.tipoComplemento || '');
            $('#fgtsNumeroComplemento').val(formData.generalData.numeroComplemento || '');
            $('#fgtsBlocoComplemento').val(formData.generalData.blocoComplemento || '');
            $('#fgtsBairro').val(formData.generalData.bairro || '');
            
            // Seleciona o tipo de bot
            if (formData.selectedBotType) {
                state.selectedBotType = formData.selectedBotType;
                $('#selectedBotType').val(formData.selectedBotType);
                $(`.bot-option[data-bot-type="${formData.selectedBotType}"]`).addClass('selected');
            }
            
            // Remove quaisquer proponentes que tenham sido adicionados automaticamente
            $("#proponentesContainer").empty();
            
            // Carrega proponentes
            if (formData.proponentes && formData.proponentes.length > 0) {
                formData.proponentes.forEach(proponenteData => {
                    // Adiciona um novo proponente
                    const proponenteCard = adicionarProponente();
                    
                    // Preenche os dados do proponente
                    proponenteCard.find(".proponente-nome").val(proponenteData.nome || '');
                    proponenteCard.find(".proponente-cpf").val(proponenteData.cpf || '');
                    proponenteCard.find(".proponente-pis").val(proponenteData.pis || '');
                    proponenteCard.find(".proponente-nascimento").val(proponenteData.nascimento || '');
                    proponenteCard.find(".proponente-carteira").val(proponenteData.carteira || '');
                    proponenteCard.find(".proponente-serie").val(proponenteData.serie || '');
                    
                    // Remove a primeira conta adicionada automaticamente
                    proponenteCard.find(".contas-fgts-container").empty();
                    
                    // Carrega as contas
                    if (proponenteData.contas && proponenteData.contas.length > 0) {
                        proponenteData.contas.forEach(contaData => {
                            // Adiciona uma nova conta
                            const contaCard = adicionarContaFGTS(proponenteCard);
                            
                            // Preenche os dados da conta
                            contaCard.find(".conta-situacao").val(contaData.situacao || '');
                            contaCard.find(".conta-estabelecimento").val(contaData.estabelecimento || '');
                            contaCard.find(".conta-numero").val(contaData.numero || '');
                            contaCard.find(".conta-sureg").val(contaData.sureg || '');
                            contaCard.find(".conta-valor").val(contaData.valor || '');
                            contaCard.find(".conta-empregador").val(contaData.empregador || '');
                        });
                    } else {
                        // Adiciona pelo menos uma conta vazia
                        adicionarContaFGTS(proponenteCard);
                    }
                });
            } else {
                // Se não houver proponentes salvos, adiciona um proponente vazio
                adicionarProponente();
            }
            
            showStatus('Seus dados não enviados foram restaurados.', 'info');
            
            return true;
        } catch (error) {
            console.error('Erro ao carregar dados do localStorage:', error);
            return false;
        }
    }
    
    /**
     * Limpa dados salvos no localStorage
     */
    function clearSavedData() {
        try {
            localStorage.removeItem(`fgts_form_${state.dealId}`);
            return true;
        } catch (error) {
            console.error('Erro ao limpar dados do localStorage:', error);
            return false;
        }
    }
    
    /**
     * Valida o formulário antes de enviar
     */
    function validateForm() {
        let isValid = true;
        let firstInvalidField = null;
        
        // Valida se um tipo de bot foi selecionado
        if (!state.selectedBotType) {
            showStatus('Selecione um tipo de processamento antes de continuar.', 'danger');
            $('.bot-selector').addClass('border border-danger rounded p-2');
            setTimeout(() => {
                $('.bot-selector').removeClass('border border-danger rounded p-2');
            }, 1500);
            return false;
        }
        
        // Valida campos obrigatórios gerais
        const camposObrigatorios = [
            { id: 'fgtsAgencia', label: 'Agência Vinculada' },
            { id: 'fgtsContrato', label: 'Nº Contrato Financiamento' },
            { id: 'fgtsMatriculaImovel', label: 'Matrícula do Imóvel' },
            { id: 'fgtsTipoComplemento', label: 'Tipo Complemento Imóvel' }
        ];
        
        for (const campo of camposObrigatorios) {
            const elemento = $(`#${campo.id}`);
            const valor = elemento.val();
            
            if (!valor || valor === '') {
                markFieldAsInvalid(elemento, `O campo ${campo.label} é obrigatório`);
                isValid = false;
                
                if (!firstInvalidField) {
                    firstInvalidField = elemento;
                }
            } else {
                markFieldAsValid(elemento);
            }
        }
        
        // Valida dados dos proponentes
        $("#proponentesContainer .proponente-card").each(function() {
            const proponenteCard = $(this);
            const proponenteNumero = proponenteCard.find('.proponente-numero').text();
            
            // Verifica campos obrigatórios do proponente
            const camposProponente = [
                { selector: '.proponente-nome', label: 'Nome Completo' },
                { selector: '.proponente-cpf', label: 'CPF' },
                { selector: '.proponente-pis', label: 'PIS/PASEP' },
                { selector: '.proponente-nascimento', label: 'Data de Nascimento' },
                { selector: '.proponente-carteira', label: 'Nº Carteira Trabalho' },
                { selector: '.proponente-serie', label: 'Série Carteira Trabalho' }
            ];
            
            for (const campo of camposProponente) {
                const elemento = proponenteCard.find(campo.selector);
                const valor = elemento.val();
                
                if (!valor || valor === '') {
                    markFieldAsInvalid(elemento, `${campo.label} é obrigatório`);
                    isValid = false;
                    
                    if (!firstInvalidField) {
                        firstInvalidField = elemento;
                    }
                } else {
                    markFieldAsValid(elemento);
                }
            }
            
            // Valida CPF
            const cpfInput = proponenteCard.find('.proponente-cpf');
            const cpf = cpfInput.val().replace(/\D/g, '');
            
            if (cpf && !isValidCPF(cpf)) {
                markFieldAsInvalid(cpfInput, 'CPF inválido');
                isValid = false;
                
                if (!firstInvalidField) {
                    firstInvalidField = cpfInput;
                }
            }
            
            // Valida contas FGTS
            const contasContainer = proponenteCard.find('.contas-fgts-container');
            const contas = contasContainer.find('.conta-fgts-card');
            
            if (contas.length === 0) {
                showStatus(`O proponente ${proponenteNumero} precisa ter pelo menos uma conta FGTS.`, 'danger');
                isValid = false;
                
                const addButton = proponenteCard.find('.adicionar-conta-btn');
                addButton.addClass('btn-danger').removeClass('btn-outline-primary');
                setTimeout(() => {
                    addButton.removeClass('btn-danger').addClass('btn-outline-primary');
                }, 1500);
                
                return;
            }
            
            // Valida cada conta FGTS
            contas.each(function() {
                const contaCard = $(this);
                const contaNumero = contaCard.find('.conta-numero-label').text();
                
                const camposConta = [
                    { selector: '.conta-situacao', label: 'Situação da Conta' },
                    { selector: '.conta-estabelecimento', label: 'Código do Estabelecimento' },
                    { selector: '.conta-numero', label: 'Código do Empregado' },
                    { selector: '.conta-sureg', label: 'SUREG' },
                    { selector: '.conta-valor', label: 'Valor a Debitar' }
                ];
                
                for (const campo of camposConta) {
                    const elemento = contaCard.find(campo.selector);
                    const valor = elemento.val();
                    
                    if (!valor || valor === '') {
                        markFieldAsInvalid(elemento, `${campo.label} é obrigatório`);
                        isValid = false;
                        
                        if (!firstInvalidField) {
                            firstInvalidField = elemento;
                        }
                    } else {
                        markFieldAsValid(elemento);
                    }
                }
                
                // Valida valor da conta
                const valorInput = contaCard.find('.conta-valor');
                const valor = parseFloat(valorInput.val());
                
                if (isNaN(valor) || valor <= 0) {
                    markFieldAsInvalid(valorInput, 'O valor deve ser maior que zero');
                    isValid = false;
                    
                    if (!firstInvalidField) {
                        firstInvalidField = valorInput;
                    }
                }
            });
        });
        
        // Foca no primeiro campo inválido encontrado
        if (firstInvalidField) {
            firstInvalidField.focus();
            
            // Rola para o primeiro campo inválido
            $('html, body').animate({
                scrollTop: firstInvalidField.offset().top - 150
            }, 500);
        }
        
        return isValid;
    }
    
    /**
     * Marca um campo como inválido
     */
    function markFieldAsInvalid(field, message) {
        $(field).addClass('is-invalid').removeClass('is-valid');
        
        // Verifica se já existe mensagem de erro
        let feedback = $(field).siblings('.invalid-feedback');
        if (feedback.length === 0) {
            // Cria elemento de feedback
            feedback = $('<div class="invalid-feedback"></div>');
            $(field).after(feedback);
        }
        
        feedback.text(message);
    }
    
    /**
     * Marca um campo como válido
     */
    function markFieldAsValid(field) {
        $(field).removeClass('is-invalid').addClass('is-valid');
    }
    
    /**
     * Valida um CPF
     */
    function isValidCPF(cpf) {
        // CPF deve ter 11 dígitos
        if (cpf.length !== 11) return false;
        
        // Verifica se todos os dígitos são iguais
        if (/^(\d)\1+$/.test(cpf)) return false;
        
        // Validação do primeiro dígito verificador
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cpf.charAt(i)) * (10 - i);
        }
        
        let remainder = sum % 11;
        const dv1 = remainder < 2 ? 0 : 11 - remainder;
        
        if (parseInt(cpf.charAt(9)) !== dv1) return false;
        
        // Validação do segundo dígito verificador
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cpf.charAt(i)) * (11 - i);
        }
        
        remainder = sum % 11;
        const dv2 = remainder < 2 ? 0 : 11 - remainder;
        
        return parseInt(cpf.charAt(10)) === dv2;
    }
    
    /**
     * Coleta todos os dados do formulário para envio
     */
    function gatherFormData() {
        // Dados básicos da operação
        const payload = {
            botType: state.selectedBotType,
            dealId: state.dealId,
            status: "Pendente",
            dataHoraEntrada: new Date().toLocaleString("pt-BR"),
            matricula: $('#fgtsMatriculaImovel').val(),
            tipoComplemento: $('#fgtsTipoComplemento').val(),
            aptoCasa: $('#fgtsNumeroComplemento').val(),
            blocoTorre: $('#fgtsBlocoComplemento').val(),
            bairro: $('#fgtsBairro').val(),
            agencia: $('#fgtsAgencia').val(),
            contrato: $('#fgtsContrato').val(),
            numeroContatoFGTS: $('#fgtsNumeroContato').val(),
            
            // Obter proponentes e contas FGTS da função auxiliar
            pessoas: window.coletarDadosProponentesEContas()
        };
        
        // Adiciona dados do Ploomes, se disponíveis
        if (state.dealData && state.dealData.value && state.dealData.value.length > 0) {
            const deal = state.dealData.value[0];
            
            // Função auxiliar para obter valores de propriedades
            const getPropertyValue = (fieldKey, defaultValue = '') => {
                const prop = deal.OtherProperties?.find(p => p.FieldKey === fieldKey);
                if (!prop) return defaultValue;
                
                return prop.StringValue || 
                       prop.DecimalValue?.toString() || 
                       prop.IntValue?.toString() || 
                       defaultValue;
            };
            
            // Adiciona campos complementares
            payload.valorCompraVenda = getPropertyValue('FieldKey_ValorCompraVenda', '0');
            payload.valorFinanciamento = deal.Amount?.toString() || '0';
            payload.valorFGTS = getPropertyValue('FieldKey_ValorFGTS', '0');
            payload.subsidio = getPropertyValue('FieldKey_ValorSubsidio', '0');
            payload.cep = getPropertyValue('FieldKey_CEP', '');
            payload.logradouro = getPropertyValue('FieldKey_Logradouro', '');
            payload.numero = getPropertyValue('FieldKey_Numero', '');
            payload.complemento = getPropertyValue('FieldKey_Complemento', '');
            payload.ordemServico = getPropertyValue('FieldKey_OrdemServico', '');
        }
        
        // Adiciona metadados
        payload.metadata = {
            timestamp: new Date().toISOString(),
            browser: navigator.userAgent,
            version: '2.1.5'
        };
        
        console.log("Payload completo:", payload);
        return payload;
    }
    
    /**
     * Envia os dados para o n8n
     */
    async function sendToN8N(payload) {
        if (state.isSubmitting) return;
        
        // Validação extra: verificar se a soma dos valores das contas FGTS corresponde ao total
        const valorTotalFGTS = parseFloat(payload.valorFGTS) || 0;
        
        let somaValoresContas = 0;
        payload.pessoas.forEach(pessoa => {
            pessoa.contas.forEach(conta => {
                somaValoresContas += parseFloat(conta.valor) || 0;
            });
        });
        
        // Tolerância de centavos para evitar problemas de arredondamento
        const diferenca = Math.abs(valorTotalFGTS - somaValoresContas);
        
        if (diferenca > 0.02) {  // tolerância de 2 centavos
            if (!confirm(`O valor total de FGTS (R$ ${valorTotalFGTS.toFixed(2)}) não corresponde à soma dos valores das contas (R$ ${somaValoresContas.toFixed(2)}). Deseja continuar mesmo assim?`)) {
                return;
            }
        }
        
        state.isSubmitting = true;
        
        // Prepara a URL do webhook com base no tipo de bot selecionado
        const webhookUrl = `${config.n8nWebhookBaseUrl}${config.botTypeUrls[payload.botType]}`;
        
        // Desabilita o botão de envio e mostra indicador de carregamento
        $('#enviarSolicitacaoBtn')
            .prop('disabled', true)
            .html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processando...');
        
        // Mostra o indicador de carregamento com progresso
        toggleLoading(true, 'Iniciando processamento da DAMP...');
        startProgressSimulation();
        
        try {
            // Simula o envio para a API
            // Em produção, isso seria substituído por uma chamada real
            console.log(`Enviando para URL: ${webhookUrl}`);
            console.log('Payload:', payload);
            
            // Simulação de um tempo de resposta da API
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // Simula uma resposta com documentos gerados
            const result = {
                success: true,
                message: "DAMP gerada com sucesso",
                status: "CONCLUÍDO",
                documents: [
                    {
                        fileName: "DAMP_" + payload.pessoas[0].nome.replace(/\s+/g, "_") + ".pdf",
                        base64: "data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKNSAwIG9iago8PCAvVHlwZSAvUGFnZSAvUGFyZW50IDEgMCBSIC9MYXN0TW9kaWZpZWQgKEQ6MjAyM...",
                        url: null
                    },
                    {
                        fileName: "Resumo_" + new Date().toISOString().split('T')[0] + ".pdf",
                        base64: "data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKNSAwIG9iago8PCAvVHlwZSAvUGFnZSAvUGFyZW50IDEgMCBSIC9MYXN0TW9kaWZpZWQgKEQ6MjAyM...",
                        url: null
                    }
                ]
            };
            
            // Simula sucesso na operação
            handleSuccessResponse(result);
        } catch (error) {
            // Simula falha na operação
            handleErrorResponse(error);
        }
    }
    
    /**
     * Lida com a resposta de sucesso do envio
     */
    function handleSuccessResponse(result) {
        // Completa o progresso
        completeProgress();
        
        // Processa documentos gerados e exibe área de download
        processDocuments(result.documents);
        
        // Exibe mensagem de sucesso
        showStatus('DAMP gerada com sucesso! Os documentos estão disponíveis para download.', 'success');
        
        // Atualiza o status da operação
        $('#operation-status')
            .removeClass('pending error')
            .addClass('success')
            .html('<i class="fas fa-check-circle"></i> Processado');
            
        // Limpa dados salvos no localStorage após envio bem-sucedido
        clearSavedData();
        
        // Desabilita o formulário para evitar envios duplicados
        disableForm();
        
        // Reabilita o botão de envio (caso o usuário queira reenviar por algum motivo)
        $('#enviarSolicitacaoBtn')
            .prop('disabled', false)
            .html('<i class="fas fa-paper-plane me-2"></i> Gerar DAMP');
            
        state.isSubmitting = false;
    }
    
    /**
     * Lida com a resposta de erro do envio
     */
    function handleErrorResponse(error) {
        console.error('Erro ao enviar para o n8n:', error);
        
        // Exibe mensagem de erro
        showStatus(`Erro ao gerar DAMP: ${error.message || 'Falha na comunicação com o servidor'}. Por favor, tente novamente.`, 'danger');
        
        // Atualiza o status da operação
        $('#operation-status')
            .removeClass('pending success')
            .addClass('error')
            .html('<i class="fas fa-times-circle"></i> Erro no processamento');
            
        // Interrompe simulação de progresso
        clearInterval(state.processingTimer);
        
        // Esconde o loading
        toggleLoading(false);
        
        // Reabilita o botão de envio
        $('#enviarSolicitacaoBtn')
            .prop('disabled', false)
            .html('<i class="fas fa-paper-plane me-2"></i> Gerar DAMP');
            
        state.isSubmitting = false;
    }
    
    /**
     * Processa documentos recebidos da API
     */
    function processDocuments(documents) {
        if (!documents || documents.length === 0) {
            $('#download-area').removeClass('d-none').html(`
                <div class="text-center">
                    <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                    <h4 class="mb-2">Nenhum documento foi gerado</h4>
                    <p class="text-muted">A operação foi concluída, mas nenhum documento foi retornado.</p>
                    <button type="button" class="btn btn-primary mt-3" onclick="window.location.reload()">Tentar Novamente</button>
                </div>
            `);
            return;
        }
        
        // Armazena os documentos no estado
        state.downloadedFiles = documents;
        
        // Limpa área de download
        $('#download-buttons').empty();
        
        // Exibe a área de download
        $('#download-area').removeClass('d-none');
        
        // Adiciona botões para cada documento
        documents.forEach((doc, index) => {
            const fileName = doc.fileName || `DAMP_${index + 1}.pdf`;
            
            const downloadBtn = $(`
                <a href="#" class="download-btn" data-index="${index}">
                    <i class="fas fa-download"></i> ${fileName}
                </a>
            `);
            
            // Adiciona ação de download
            downloadBtn.on('click', function(e) {
                e.preventDefault();
                downloadDocument(index);
            });
            
            $('#download-buttons').append(downloadBtn);
        });
    }
    
    /**
     * Realiza o download de um documento
     */
    function downloadDocument(index) {
        const doc = state.downloadedFiles[index];
        if (!doc) return;
        
        const fileName = doc.fileName || `DAMP_${index + 1}.pdf`;
        
        // Se for URL direta
        if (doc.url) {
            // Cria um link temporário para download
            const tempLink = document.createElement('a');
            tempLink.href = doc.url;
            tempLink.target = '_blank';
            tempLink.download = fileName;
            document.body.appendChild(tempLink);
            tempLink.click();
            document.body.removeChild(tempLink);
            return;
        }
        
        // Se for base64
        if (doc.base64) {
            // Remove header base64 se existir (ex: "data:application/pdf;base64,")
            let base64Data = doc.base64;
            if (base64Data.includes(',')) {
                base64Data = base64Data.split(',')[1];
            }
            
            // Determina o tipo MIME
            let mimeType = 'application/pdf';
            if (fileName.toLowerCase().endsWith('.png')) mimeType = 'image/png';
            if (fileName.toLowerCase().endsWith('.jpg') || fileName.toLowerCase().endsWith('.jpeg')) mimeType = 'image/jpeg';
            
            try {
                // Cria Blob e URL para download
                const byteCharacters = atob(base64Data);
                const byteArrays = [];
                
                for (let offset = 0; offset < byteCharacters.length; offset += 512) {
                    const slice = byteCharacters.slice(offset, offset + 512);
                    
                    const byteNumbers = new Array(slice.length);
                    for (let i = 0; i < slice.length; i++) {
                        byteNumbers[i] = slice.charCodeAt(i);
                    }
                    
                    const byteArray = new Uint8Array(byteNumbers);
                    byteArrays.push(byteArray);
                }
                
                const blob = new Blob(byteArrays, {type: mimeType});
                const blobUrl = URL.createObjectURL(blob);
                
                // Cria link para download
                const tempLink = document.createElement('a');
                tempLink.href = blobUrl;
                tempLink.download = fileName;
                document.body.appendChild(tempLink);
                tempLink.click();
                
                // Limpa recursos
                setTimeout(() => {
                    document.body.removeChild(tempLink);
                    window.URL.revokeObjectURL(blobUrl);
                }, 100);
            } catch (e) {
                console.error('Erro ao processar base64:', e);
                alert('Erro ao processar o arquivo. Por favor, tente novamente.');
            }
        }
    }
    
    /**
     * Desabilita o formulário após envio bem-sucedido
     */
    function disableForm() {
        $('#form-debito-fgts input, #form-debito-fgts select, #form-debito-fgts button:not(#voltarDashboardBtn)').prop('disabled', true);
        $('.bot-option').css({
            'pointer-events': 'none',
            'opacity': '0.7'
        });
        
        // Mostra mensagem sugerindo voltar ao dashboard
        showStatus('Para iniciar um novo débito FGTS, volte ao Dashboard.', 'info', false);
    }
    
    /**
     * Inicia o progresso simulado
     */
    function startProgressSimulation() {
        // Reseta o progresso
        const progressBar = $('#processing-progress');
        progressBar.css('width', '0%');
        
        // Registra o momento de início
        state.processingStartTime = new Date();
        
        // Calcula o tempo total estimado com base no tipo de bot
        const timeEstimate = config.botProcessingTimes[state.selectedBotType] || '3-5';
        const [minMinutes, maxMinutes] = timeEstimate.split('-').map(t => parseInt(t.trim()));
        
        // Escolhe um tempo aleatório entre min e max (em ms)
        const processingTime = (Math.random() * (maxMinutes - minMinutes) + minMinutes) * 60 * 1000;
        
        // Atualiza a mensagem de tempo estimado
        $('#estimated-time').text(timeEstimate);
        
        // Define o intervalo para atualizar o progresso
        state.processingTimer = setInterval(() => {
            updateProgressBar(processingTime);
        }, config.progressUpdateInterval);
    }
    
    /**
     * Atualiza a barra de progresso
     */
    function updateProgressBar(totalTime) {
        const now = new Date();
        const elapsedTime = now - state.processingStartTime;
        const progressPercent = Math.min(Math.round((elapsedTime / totalTime) * 100), 99); // Máximo 99% até completar
        
        // Atualiza a barra de progresso
        $('#processing-progress').css('width', `${progressPercent}%`);
        
        // Se o tempo estimado for atingido mas o webhook ainda não retornou,
        // mantém o progresso em 99% até o retorno
        if (progressPercent >= 99) {
            // Atualiza a mensagem
            $('#loading-message').text('Finalizando processamento...');
            clearInterval(state.processingTimer);
        } else {
            // Calcula o tempo restante estimado
            const remainingMs = totalTime - elapsedTime;
            const remainingMinutes = Math.ceil(remainingMs / 60000);
            
            // Atualiza a mensagem
            $('#loading-message').text(`Processando DAMP... (${progressPercent}%)`);
            $('#processing-time').text(`Tempo restante estimado: aproximadamente ${remainingMinutes} ${remainingMinutes === 1 ? 'minuto' : 'minutos'}`);
        }
    }
    
    /**
     * Finaliza o processamento com sucesso
     */
    function completeProgress() {
        // Interrompe a simulação de progresso
        clearInterval(state.processingTimer);
        
        // Define o progresso como 100%
        $('#processing-progress').css('width', '100%');
        $('#loading-message').text('Processamento concluído!');
        
        // Esconde o loading após um momento
        setTimeout(() => {
            toggleLoading(false);
        }, 1000);
    }
    
    /**
     * Exibe ou oculta o indicador de carregamento
     */
    function toggleLoading(show, message = 'Processando...') {
        const loading = $('#loading');
        const loadingText = $('#loading-message');
        
        if (loadingText) {
            loadingText.text(message);
        }
        
        if (show) {
            loading.removeClass('hidden');
        } else {
            loading.addClass('hidden');
        }
    }
    
    /**
     * Exibe uma mensagem de status
     */
    function showStatus(message, type = 'info', autoHide = true) {
        const statusDiv = $('#status-envio');
        
        // Configura a classe correta para o tipo de mensagem
        statusDiv
            .removeClass('d-none alert-info alert-success alert-warning alert-danger')
            .addClass(`alert-${type === 'error' ? 'danger' : type}`)
            .html(message);
        
        // Auto-esconde a mensagem após um tempo, se solicitado
        if (autoHide) {
            setTimeout(() => {
                statusDiv.fadeOut(() => statusDiv.addClass('d-none').show());
            }, config.errorTimeout);
        }
    }
});
