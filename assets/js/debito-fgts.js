/**
 * Módulo de Débito FGTS
 * Sistema de Análise de Crédito - Versão 2.1.5
 * Integração com n8n para processamento de débito FGTS
 */
$(document).ready(function() {
    // Elementos principais
    const proponentesContainer = $('#proponentes-container');
    const templateProponente = $('#proponente-template');
    const templateConta = $('#conta-fgts-template');
    
    // Configurações
    const config = {
        n8nWebhookUrl: 'https://suportico.app.n8n.cloud/webhook-test/debito-fgts', // URL do webhook n8n
        minContasPerProponente: 1, // Mínimo de contas por proponente
        maxProponentes: 10, // Máximo de proponentes permitidos
        autoSave: true, // Salvamento automático no localStorage
        autoSaveInterval: 30000, // 30 segundos
        retryAttempts: 2, // Tentativas de reenvio em caso de erro
        errorTimeout: 5000, // Tempo para exibição de mensagens de erro (ms)
        validateOnBlur: true // Validação ao sair do campo
    };
    
    // Estado da aplicação
    const state = {
        dealId: null,
        dealData: null,
        proponenteCounter: 0,
        formModified: false,
        isSubmitting: false,
        autosaveTimer: null,
        proponentesData: [] // Para armazenar dados dos proponentes e suas contas
    };

    // --- Inicialização ---
    function initializePage() {
        // Recupera o ID da operação a partir da URL
        const urlParams = new URLSearchParams(window.location.search);
        const dealId = urlParams.get('dealId');
        
        if (!dealId) {
            showStatus('Erro: ID da Operação não encontrado na URL.', 'danger');
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
        
        // Adiciona o primeiro proponente automaticamente
        addProponentSection();
        
        // Configura a validação de formulário
        setupValidation();
        
        // Configura autosave se habilitado
        if (config.autoSave) {
            setupAutosave();
        }
        
        // Atualiza contadores
        updateContadores();
    }

    // --- Interação com Ploomes ---
    async function fetchPloomesData(dealId) {
        toggleLoading(true, 'Carregando dados do Ploomes...');
        console.log(`Buscando dados do Ploomes para Deal ID: ${dealId}`);
        
        try {
            // Busca dados do Ploomes
            const dealData = await buscarDadosPloomesPorId(dealId);
            console.log("Dados recebidos do Ploomes:", dealData);
            
            if (!dealData || !dealData.value || dealData.value.length === 0) {
                throw new Error('Dados não encontrados no Ploomes');
            }
            
            // Armazena os dados para uso posterior
            state.dealData = dealData;
            
            // Exibe os dados na interface
            displayPloomesData(dealData.value[0]);
            
            // Pré-preenche o primeiro proponente se os dados existirem
            populateFirstProponent(dealData.value[0]);
            
            showStatus('Dados carregados com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao buscar dados do Ploomes:', error);
            showStatus(`Erro ao buscar dados: ${error.message}`, 'danger');
            $('#enviarSolicitacaoBtn').prop('disabled', true);
        } finally {
            toggleLoading(false);
        }
    }
    
    // Exibe dados do Ploomes na interface
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
                ? `${nameParts[0][0]}${nameParts[1][0]}`
                : nameParts[0].substring(0, 2);
            $('#clientInitials').text(initials.toUpperCase());
            
            // CPF
            const cpfPropertyKey = "FieldKey_CPF"; // << Substituir pelo FieldKey correto
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
        
        // Atualiza o status da operação
        const status = getPropertyStringValue(deal, 'FieldKey_StatusAnalise');
        updateOperationStatus(status);
    }
    
    // Obtém valor de string de uma propriedade personalizada
    function getPropertyStringValue(deal, fieldKey) {
        const prop = deal?.OtherProperties?.find(p => p.FieldKey === fieldKey);
        return prop?.StringValue || '';
    }
    
    // Atualiza indicador de status da operação
    function updateOperationStatus(status) {
        const statusElement = $('#operation-status');
        
        statusElement.removeClass('pending success error');
        
        switch(status?.toUpperCase()) {
            case 'APROVADO':
                statusElement.addClass('success').html('<i class="fas fa-check-circle"></i> Aprovado');
                break;
            case 'REPROVADO':
                statusElement.addClass('error').html('<i class="fas fa-times-circle"></i> Reprovado');
                break;
            case 'CONDICIONADO':
                statusElement.addClass('pending').html('<i class="fas fa-exclamation-circle"></i> Condicionado');
                break;
            default:
                statusElement.addClass('pending').html('<i class="fas fa-clock"></i> Em processamento');
        }
    }
    
    // Pré-preenche o primeiro proponente
    function populateFirstProponent(deal) {
        if (!deal || !deal.Contact) return;
        
        const firstProponentSection = proponentesContainer.find('.proponente-section:not(#proponente-template)').first();
        
        if (firstProponentSection.length === 0) return;
        
        // Dados básicos do proponente
        firstProponentSection.find('.proponente-nome').val(deal.Contact.Name || '');
        
        // CPF
        const cpfPropertyKey = "FieldKey_CPF"; // << Substituir pelo FieldKey correto
        const cpfProp = deal.Contact.OtherProperties?.find(prop => prop.FieldKey === cpfPropertyKey);
        firstProponentSection.find('.proponente-cpf').val(cpfProp?.StringValue || '');
        
        // Busca dados complementares se disponíveis
        const pisPasepKey = "FieldKey_PIS"; // << Substituir pelo FieldKey correto
        const pisProp = deal.Contact.OtherProperties?.find(prop => prop.FieldKey === pisPasepKey);
        if (pisProp?.StringValue) {
            firstProponentSection.find('.proponente-pis').val(pisProp.StringValue);
        }
        
        const nascimentoKey = "FieldKey_DataNascimento"; // << Substituir pelo FieldKey correto
        const nascimentoProp = deal.Contact.OtherProperties?.find(prop => prop.FieldKey === nascimentoKey);
        if (nascimentoProp?.DateTimeValue) {
            // Converte para o formato YYYY-MM-DD
            const date = new Date(nascimentoProp.DateTimeValue);
            const formattedDate = date.toISOString().split('T')[0];
            firstProponentSection.find('.proponente-nascimento').val(formattedDate);
        }
    }
    
    // Formatação de CPF
    function formatCPF(cpf) {
        if (!cpf) return '';
        
        // Remove caracteres não numéricos
        cpf = cpf.replace(/\D/g, '');
        
        if (cpf.length !== 11) return cpf;
        
        // Formata como XXX.XXX.XXX-XX
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    // --- Manipulação Dinâmica do Formulário ---
    function addProponentSection() {
        if (state.proponenteCounter >= config.maxProponentes) {
            showStatus(`Máximo de ${config.maxProponentes} proponentes atingido.`, 'warning');
            return;
        }
        
        state.proponenteCounter++;
        const newSection = templateProponente.clone();
        
        // Configura o novo proponente
        newSection.attr('id', `proponente-section-${state.proponenteCounter}`);
        newSection.find('.proponente-numero').text(state.proponenteCounter);
        
        // Limpa valores de input e configura IDs únicos
        newSection.find('input, select').each(function() {
            const oldId = $(this).attr('id');
            if (oldId) {
                $(this).attr('id', `${oldId}-${state.proponenteCounter}`);
            }
            $(this).val('');
        });
        
        // Limpa o container de contas (remove o template)
        newSection.find('.contas-fgts-container').empty();
        
        // Exibe a nova seção
        newSection.show().addClass('fade-in');
        proponentesContainer.append(newSection);
        
        // Adiciona a primeira conta automaticamente
        addAccountSection(newSection.find('.contas-fgts-container'));
        
        // Atualiza o estado dos botões de remoção
        updateRemoveProponenteButtons();
        
        // Atualiza contadores
        updateContadores();
        
        // Marca o formulário como modificado
        markFormAsModified();
        
        return newSection;
    }
    
    function removeProponentSection(button) {
        const section = $(button).closest('.proponente-section');
        
        // Animação de saída
        section.css({
            'transition': 'all 0.3s ease',
            'opacity': '0',
            'transform': 'translateY(10px)'
        });
        
        // Remove após a animação
        setTimeout(() => {
            section.remove();
            
            // Renumera os proponentes
            state.proponenteCounter = 0;
            proponentesContainer.find('.proponente-section:not(#proponente-template)').each(function() {
                state.proponenteCounter++;
                $(this).find('.proponente-numero').text(state.proponenteCounter);
                $(this).attr('id', `proponente-section-${state.proponenteCounter}`);
            });
            
            // Atualiza os botões de remoção
            updateRemoveProponenteButtons();
            
            // Atualiza contadores
            updateContadores();
            
            // Marca o formulário como modificado
            markFormAsModified();
        }, 300);
    }
    
    function updateRemoveProponenteButtons() {
        const sections = proponentesContainer.find('.proponente-section:not(#proponente-template)');
        
        if (sections.length <= 1) {
            sections.find('.remover-proponente-btn').hide();
        } else {
            sections.find('.remover-proponente-btn').show();
        }
    }
    
    function addAccountSection(container, data = null) {
        // Verifica se já existe o número máximo de contas
        const contasExistentes = $(container).find('.conta-fgts-section:not(#conta-fgts-template)').length;
        if (contasExistentes >= 15) { // Limita a 15 contas por proponente
            showStatus('Número máximo de contas FGTS atingido para este proponente.', 'warning');
            return null;
        }
        
        const newAccount = templateConta.clone();
        
        // Configura a nova conta
        newAccount.attr('id', ''); // Remove ID do template
        newAccount.find('.conta-titulo').text(`Conta FGTS ${contasExistentes + 1}`);
        
        // Limpa valores ou preenche com dados caso fornecidos
        if (data) {
            newAccount.find('.conta-situacao').val(data.situacao || '');
            newAccount.find('.conta-estabelecimento').val(data.estabelecimento || '');
            newAccount.find('.conta-numero').val(data.numero || '');
            newAccount.find('.conta-sureg').val(data.sureg || '');
            newAccount.find('.conta-valor').val(data.valor || '');
            newAccount.find('.conta-empregador').val(data.empregador || '');
            
            if (data.dataAdmissao) {
                newAccount.find('.conta-admissao').val(data.dataAdmissao);
            }
        } else {
            newAccount.find('input, select').val(''); // Limpa valores
        }
        
        // Exibe a nova conta com animação
        newAccount.show().addClass('fade-in');
        $(container).append(newAccount);
        
        // Atualiza os botões de remoção
        updateRemoveAccountButtons(container);
        
        // Atualiza contadores
        updateContadores();
        
        // Marca o formulário como modificado
        markFormAsModified();
        
        return newAccount;
    }
    
    function removeAccountSection(button) {
        const container = $(button).closest('.contas-fgts-container');
        const section = $(button).closest('.conta-fgts-section');
        
        // Animação de saída
        section.css({
            'transition': 'all 0.3s ease',
            'opacity': '0',
            'transform': 'translateY(5px)'
        });
        
        // Remove após a animação
        setTimeout(() => {
            section.remove();
            
            // Renumera as contas
            let contaCounter = 0;
            container.find('.conta-fgts-section:not(#conta-fgts-template)').each(function() {
                contaCounter++;
                $(this).find('.conta-titulo').text(`Conta FGTS ${contaCounter}`);
            });
            
            // Atualiza os botões de remoção
            updateRemoveAccountButtons(container);
            
            // Atualiza contadores
            updateContadores();
            
            // Marca o formulário como modificado
            markFormAsModified();
        }, 300);
    }
    
    function updateRemoveAccountButtons(container) {
        const sections = $(container).find('.conta-fgts-section:not(#conta-fgts-template)');
        const proponenteSection = $(container).closest('.proponente-section');
        
        // Verifica se deve mostrar ou esconder os botões de remoção
        if (sections.length <= config.minContasPerProponente) {
            sections.find('.remover-conta-btn').hide();
        } else {
            sections.find('.remover-conta-btn').show();
        }
        
        // Atualiza o contador de contas
        proponenteSection.find('.contas-counter').text(sections.length);
    }
    
    // --- Contadores e estatísticas ---
    function updateContadores() {
        // Conta o número total de proponentes
        const totalProponentes = proponentesContainer.find('.proponente-section:not(#proponente-template)').length;
        
        // Conta o número total de contas FGTS
        let totalContas = 0;
        proponentesContainer.find('.contas-fgts-container').each(function() {
            const contasProponente = $(this).find('.conta-fgts-section:not(#conta-fgts-template)').length;
            totalContas += contasProponente;
        });
        
        // Calcula valor total do FGTS
        let valorTotal = 0;
        proponentesContainer.find('.conta-valor').each(function() {
            const valor = parseFloat($(this).val()) || 0;
            valorTotal += valor;
        });
        
        // Atualiza interface (se tiver elementos para isso)
        // Esta parte pode ser expandida conforme necessário
        
        // Retorna estatísticas para uso em outras funções
        return {
            proponentes: totalProponentes,
            contas: totalContas,
            valorTotal: valorTotal
        };
    }

    // --- Coleta e Validação de Dados ---
    function setupValidation() {
        if (!config.validateOnBlur) return;
        
        // Validação para campos obrigatórios no blur
        $(document).on('blur', '.form-control[required], .form-select[required]', function() {
            validateField(this);
        });
        
        // Validação especial para CPF
        $(document).on('blur', '.proponente-cpf', function() {
            validateCPF(this);
        });
        
        // Validação especial para valores monetários
        $(document).on('blur', '.conta-valor', function() {
            validateMoneyField(this);
        });
        
        // Formata campos monetários
        $(document).on('blur', '.money-input', function() {
            formatMoneyField(this);
        });
    }
    
    function validateField(field) {
        const $field = $(field);
        const value = $field.val().trim();
        
        if ($field.prop('required') && !value) {
            markInvalid($field, 'Este campo é obrigatório');
            return false;
        }
        
        markValid($field);
        return true;
    }
    
    function validateCPF(field) {
        const $field = $(field);
        const value = $field.val().trim().replace(/\D/g, '');
        
        if ($field.prop('required') && !value) {
            markInvalid($field, 'CPF é obrigatório');
            return false;
        }
        
        if (value && value.length !== 11) {
            markInvalid($field, 'CPF deve ter 11 dígitos');
            return false;
        }
        
        if (value && !isValidCPF(value)) {
            markInvalid($field, 'CPF inválido');
            return false;
        }
        
        markValid($field);
        return true;
    }
    
    function validateMoneyField(field) {
        const $field = $(field);
        const value = parseFloat($field.val());
        
        if ($field.prop('required') && (isNaN(value) || value <= 0)) {
            markInvalid($field, 'Informe um valor válido maior que zero');
            return false;
        }
        
        markValid($field);
        return true;
    }
    
    function formatMoneyField(field) {
        const $field = $(field);
        const value = $field.val();
        
        if (!value) return;
        
        // Converte para número
        const numValue = parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.'));
        
        if (isNaN(numValue)) {
            $field.val('');
            return;
        }
        
        // Formata com duas casas decimais
        $field.val(numValue.toFixed(2));
    }
    
    function markInvalid($field, message) {
        $field.addClass('is-invalid').removeClass('is-valid');
        
        // Verifica se já existe feedback
        let $feedback = $field.next('.invalid-feedback');
        if ($feedback.length === 0) {
            $feedback = $('<div class="invalid-feedback"></div>');
            $field.after($feedback);
        }
        
        $feedback.text(message);
    }
    
    function markValid($field) {
        $field.removeClass('is-invalid').addClass('is-valid');
    }
    
    function isValidCPF(cpf) {
        // Remove caracteres não numéricos
        cpf = cpf.replace(/\D/g, '');
        
        if (cpf.length !== 11) return false;
        
        // Verifica se todos os dígitos são iguais
        if (/^(\d)\1+$/.test(cpf)) return false;
        
        // Validação do primeiro dígito verificador
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cpf.charAt(i)) * (10 - i);
        }
        
        let remainder = sum % 11;
        let digit1 = remainder < 2 ? 0 : 11 - remainder;
        
        if (parseInt(cpf.charAt(9)) !== digit1) return false;
        
        // Validação do segundo dígito verificador
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cpf.charAt(i)) * (11 - i);
        }
        
        remainder = sum % 11;
        let digit2 = remainder < 2 ? 0 : 11 - remainder;
        
        return parseInt(cpf.charAt(10)) === digit2;
    }
    
    function validateForm() {
        let isValid = true;
        let firstInvalidField = null;
        
        // Valida campos gerais
        $('#form-debito-fgts .form-control[required], #form-debito-fgts .form-select[required]').each(function() {
            if (!validateField(this) && !firstInvalidField) {
                firstInvalidField = this;
                isValid = false;
            }
        });
        
        // Valida se há pelo menos um proponente
        if (proponentesContainer.find('.proponente-section:not(#proponente-template)').length === 0) {
            showStatus('É necessário adicionar pelo menos um proponente.', 'danger');
            return false;
        }
        
        // Valida CPFs
        $('.proponente-cpf').each(function() {
            if (!validateCPF(this) && !firstInvalidField) {
                firstInvalidField = this;
                isValid = false;
            }
        });
        
        // Valida valores monetários
        $('.conta-valor').each(function() {
            if (!validateMoneyField(this) && !firstInvalidField) {
                firstInvalidField = this;
                isValid = false;
            }
        });
        
        // Valida se cada proponente tem pelo menos uma conta
        proponentesContainer.find('.proponente-section:not(#proponente-template)').each(function() {
            const proponenteId = $(this).attr('id');
            const contasCount = $(this).find('.conta-fgts-section:not(#conta-fgts-template)').length;
            
            if (contasCount === 0) {
                showStatus(`O proponente ${$(this).find('.proponente-numero').text()} precisa ter pelo menos uma conta FGTS.`, 'danger');
                isValid = false;
                
                // Destaca o botão de adicionar conta
                const addButton = $(this).find('.adicionar-conta-btn');
                addButton.addClass('btn-danger').removeClass('btn-add-conta');
                setTimeout(() => {
                    addButton.removeClass('btn-danger').addClass('btn-add-conta');
                }, 2000);
            }
        });
        
        // Rola para o primeiro campo inválido
        if (firstInvalidField) {
            $(firstInvalidField).focus();
            $('html, body').animate({
                scrollTop: $(firstInvalidField).offset().top - 100
            }, 500);
        }
        
        return isValid;
    }
    
    // Coleta dados do formulário em um objeto estruturado
    function gatherFormData() {
        // Dados básicos da operação
        const payload = {
            status: "Pendente",
            id: parseInt(state.dealId) || null,
            dataHoraEntrada: new Date().toLocaleString("pt-BR"),
            matricula: $('#fgtsMatriculaImovel').val(),
            tipoComplemento: $('#fgtsTipoComplemento').val(),
            aptoCasa: $('#fgtsNumeroComplemento').val(),
            blocoTorre: $('#fgtsBlocoComplemento').val(),
            bairro: $('#fgtsBairro').val(),
            agencia: $('#fgtsAgencia').val(),
            contrato: $('#fgtsContrato').val(),
            numeroContatoFGTS: $('#fgtsNumeroContato').val(),
            pessoas: []
        };
        
        // Informações complementares do Ploomes (se disponíveis)
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
        
        // Coleta dados dos proponentes e suas contas
        proponentesContainer.find('.proponente-section:not(#proponente-template)').each(function() {
            const proponenteSection = $(this);
            
            const pessoa = {
                nome: proponenteSection.find('.proponente-nome').val(),
                cpf: proponenteSection.find('.proponente-cpf').val().replace(/\D/g, ''),
                pis: proponenteSection.find('.proponente-pis').val(),
                nascimento: proponenteSection.find('.proponente-nascimento').val(),
                carteira: proponenteSection.find('.proponente-carteira').val(),
                serie: proponenteSection.find('.proponente-serie').val(),
                contas: []
            };
            
            // Coleta dados das contas FGTS
            proponenteSection.find('.contas-fgts-container .conta-fgts-section:not(#conta-fgts-template)').each(function() {
                const contaSection = $(this);
                
                const conta = {
                    situacao: contaSection.find('.conta-situacao').val(),
                    estabelecimento: contaSection.find('.conta-estabelecimento').val(),
                    numero: contaSection.find('.conta-numero').val(),
                    sureg: contaSection.find('.conta-sureg').val(),
                    valor: parseFloat(contaSection.find('.conta-valor').val()) || 0,
                    admissao: contaSection.find('.conta-admissao').val() || null,
                    empregador: contaSection.find('.conta-empregador').val() || ''
                };
                
                pessoa.contas.push(conta);
            });
            
            payload.pessoas.push(pessoa);
        });
        
        // Adiciona metadados
        payload.metadata = {
            timestamp: new Date().toISOString(),
            browser: navigator.userAgent,
            version: '2.1.5'
        };
        
        console.log("Payload preparado:", payload);
        return payload;
    }

    // --- Envio de Dados e Integração ---
    async function sendToN8N(payload) {
        if (state.isSubmitting) return;
        
        state.isSubmitting = true;
        showStatus('Enviando solicitação...', 'info', false);
        toggleLoading(true, 'Processando solicitação de débito FGTS...');
        
        // Desabilita o botão de envio e mostra indicador de carregamento
        $('#enviarSolicitacaoBtn')
            .prop('disabled', true)
            .html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enviando...');
        
        try {
            const response = await fetch(config.n8nWebhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                // Tenta extrair mensagem de erro da resposta
                let errorBody = 'Erro desconhecido';
                try {
                    errorBody = await response.text();
                } catch(e) {
                    /* ignora erro na leitura do body */
                }
                
                throw new Error(`Erro na comunicação: ${response.status} ${response.statusText}. Detalhes: ${errorBody}`);
            }

            // Processa a resposta de sucesso
            const result = await response.json();
            console.log('Resposta do n8n:', result);

            // Exibe mensagem de sucesso e possível link para documento
            let successMessage = result.message || 'Solicitação de débito FGTS enviada com sucesso!';
            
            if (result.documentUrl) {
                successMessage += ` <a href="${result.documentUrl}" target="_blank" class="fw-bold text-decoration-none"><i class="fas fa-external-link-alt me-1"></i>Ver Documento</a>`;
            }
            
            // Exibe um status de sucesso
            showStatus(successMessage, 'success');
            
            // Atualiza o status da operação
            $('#operation-status')
                .removeClass('pending error')
                .addClass('success')
                .html('<i class="fas fa-check-circle"></i> Processado');
                
            // Limpa dados salvos no localStorage após envio bem-sucedido
            clearSavedData();
            
            // Desabilita o formulário para evitar envios duplicados
            disableForm();
            
            // Opção para voltar ao dashboard após alguns segundos
            setTimeout(() => {
                if (confirm('Débito FGTS processado com sucesso! Deseja voltar ao Dashboard?')) {
                    window.location.href = `dashboard.html?dealId=${state.dealId}`;
                }
            }, 3000);

        } catch (error) {
            console.error('Erro ao enviar para o n8n:', error);
            showStatus(`Erro ao enviar solicitação: ${error.message}. Tente novamente.`, 'danger');
            
            // Atualiza o status da operação
            $('#operation-status')
                .removeClass('pending success')
                .addClass('error')
                .html('<i class="fas fa-times-circle"></i> Erro no processamento');
        } finally {
            // Reabilita o botão de envio
            $('#enviarSolicitacaoBtn')
                .prop('disabled', false)
                .html('<i class="fas fa-paper-plane me-2"></i> Enviar Solicitação de Débito');
                
            state.isSubmitting = false;
            toggleLoading(false);
        }
    }
    
    // Desabilita todo o formulário após envio bem-sucedido
    function disableForm() {
        $('#form-debito-fgts input, #form-debito-fgts select, #form-debito-fgts button').prop('disabled', true);
        $('#voltarDashboardBtn').prop('disabled', false); // Mantém o botão de voltar habilitado
    }

    // --- Autosave e Gerenciamento de Estado ---
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
    
    // Marca o formulário como modificado para acionar autosave
    function markFormAsModified() {
        state.formModified = true;
    }
    
    // Salva dados do formulário no localStorage
    function saveFormDataToLocalStorage() {
        try {
            const formData = {
                dealId: state.dealId,
                timestamp: new Date().toISOString(),
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
            proponentesContainer.find('.proponente-section:not(#proponente-template)').each(function() {
                const proponenteSection = $(this);
                
                const proponente = {
                    nome: proponenteSection.find('.proponente-nome').val(),
                    cpf: proponenteSection.find('.proponente-cpf').val(),
                    pis: proponenteSection.find('.proponente-pis').val(),
                    nascimento: proponenteSection.find('.proponente-nascimento').val(),
                    carteira: proponenteSection.find('.proponente-carteira').val(),
                    serie: proponenteSection.find('.proponente-serie').val(),
                    contas: []
                };
                
                // Coleta dados das contas
                proponenteSection.find('.contas-fgts-container .conta-fgts-section:not(#conta-fgts-template)').each(function() {
                    const contaSection = $(this);
                    
                    const conta = {
                        situacao: contaSection.find('.conta-situacao').val(),
                        estabelecimento: contaSection.find('.conta-estabelecimento').val(),
                        numero: contaSection.find('.conta-numero').val(),
                        sureg: contaSection.find('.conta-sureg').val(),
                        valor: contaSection.find('.conta-valor').val(),
                        admissao: contaSection.find('.conta-admissao').val(),
                        empregador: contaSection.find('.conta-empregador').val()
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
    
    // Carrega dados salvos no localStorage
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
            
            // Remove o primeiro proponente adicionado automaticamente
            proponentesContainer.find('.proponente-section:not(#proponente-template)').remove();
            
            // Carrega proponentes
            if (formData.proponentes && formData.proponentes.length > 0) {
                formData.proponentes.forEach(proponenteData => {
                    // Adiciona um novo proponente
                    const proponenteSection = addProponentSection();
                    
                    // Preenche os dados do proponente
                    proponenteSection.find('.proponente-nome').val(proponenteData.nome || '');
                    proponenteSection.find('.proponente-cpf').val(proponenteData.cpf || '');
                    proponenteSection.find('.proponente-pis').val(proponenteData.pis || '');
                    proponenteSection.find('.proponente-nascimento').val(proponenteData.nascimento || '');
                    proponenteSection.find('.proponente-carteira').val(proponenteData.carteira || '');
                    proponenteSection.find('.proponente-serie').val(proponenteData.serie || '');
                    
                    // Remove a primeira conta adicionada automaticamente
                    proponenteSection.find('.contas-fgts-container').empty();
                    
                    // Carrega as contas
                    if (proponenteData.contas && proponenteData.contas.length > 0) {
                        proponenteData.contas.forEach(contaData => {
                            // Adiciona uma nova conta
                            addAccountSection(proponenteSection.find('.contas-fgts-container'), contaData);
                        });
                    } else {
                        // Adiciona pelo menos uma conta vazia
                        addAccountSection(proponenteSection.find('.contas-fgts-container'));
                    }
                });
            } else {
                // Se não houver proponentes salvos, adiciona um proponente vazio
                addProponentSection();
            }
            
            // Atualiza contadores e UI
            updateRemoveProponenteButtons();
            updateContadores();
            
            // Exibe mensagem de restauração
            showStatus('Seus dados não enviados foram restaurados.', 'info');
            
            return true;
        } catch (error) {
            console.error('Erro ao carregar dados do localStorage:', error);
            return false;
        }
    }
    
    // Limpa dados salvos no localStorage
    function clearSavedData() {
        try {
            localStorage.removeItem(`fgts_form_${state.dealId}`);
            return true;
        } catch (error) {
            console.error('Erro ao limpar dados do localStorage:', error);
            return false;
        }
    }

    // --- Helpers e Utilitários ---
    function showStatus(message, type = 'info', autoHide = true) {
        const statusDiv = $('#status-envio');
        
        // Configura a classe correta para o tipo de mensagem
        statusDiv.removeClass('alert-info alert-success alert-warning alert-danger d-none')
                 .addClass(`alert-${type === 'error' ? 'danger' : type}`)
                 .html(message)
                 .fadeIn();
        
        // Auto-esconde a mensagem após um tempo, se solicitado
        if (autoHide) {
            setTimeout(() => {
                statusDiv.fadeOut(() => statusDiv.addClass('d-none'));
            }, config.errorTimeout);
        }
    }
    
    function toggleLoading(show, message = 'Processando...') {
        const loading = $('#loading');
        const loadingText = loading.find('p');
        
        loadingText.text(message);
        
        if (show) {
            loading.removeClass('hidden');
        } else {
            loading.addClass('hidden');
        }
    }

    // --- Event Listeners ---
    // Botão Adicionar Proponente
    $('#adicionar-proponente-btn').on('click', addProponentSection);
    
    // Botões dinâmicos (usando delegação de eventos)
    // Remover Proponente
    $(document).on('click', '.remover-proponente-btn', function() {
        removeProponentSection(this);
    });
    
    // Adicionar Conta
    $(document).on('click', '.adicionar-conta-btn', function() {
        const container = $(this).siblings('.contas-fgts-container');
        addAccountSection(container);
    });
    
    // Remover Conta
    $(document).on('click', '.remover-conta-btn', function() {
        removeAccountSection(this);
    });
    
    // Marcar como modificado para todos os campos de entrada
    $(document).on('change', 'input, select, textarea', function() {
        markFormAsModified();
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
        if (confirm('Confirma o envio da solicitação de débito FGTS?')) {
            // Envia os dados
            sendToN8N(payload);
        }
    });
    
    // Botão Voltar ao Dashboard
    $('#voltarDashboardBtn').on('click', function() {
        // Verifica se há dados não salvos
        if (state.formModified) {
            saveFormDataToLocalStorage();
        }
        
        // Redireciona para o dashboard
        window.location.href = `dashboard.html?dealId=${state.dealId}`;
    });

    // --- Inicialização ---
    // Inicia a página
    initializePage();
});
