/**
 * Módulo de Débito FGTS - Sistema de Análise de Crédito
 * Versão 2.1.5
 * 
 * Sistema reorganizado com fluxo de wizard para melhor experiência do usuário
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
        $('#estimated-processing-time').text(config.botProcessingTimes[botType] || '3-5');
        
        // Marca o formulário como modificado
        state.formModified = true;
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
        
        // Exporta a função de envio para o wizard
        window.submitForm = submitForm;
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
        
        // Prepara os dados para o primeiro proponente (será criado em proponentes-fgts.js)
        window.primeiroProponenteData = {
            nome: deal.Contact?.Name || '',
            cpf: cpfProp?.StringValue || ''
        };
    }
    
    /**
     * Obtém valor de string de uma propriedade personalizada
     */
    function getPropertyStringValue(deal, fieldKey) {
        const prop = deal?.OtherProperties?.find(p => p.FieldKey === fieldKey);
        return prop?.StringValue || '';
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
                proponentes: window.estado.proponentes,
                contasFGTS: window.estado.contasFGTS
            };
            
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
                $('#estimated-processing-time').text(config.botProcessingTimes[formData.selectedBotType] || '3-5');
            }
            
            // Carrega proponentes e contas FGTS
            if (formData.proponentes) {
                window.estado.proponentes = formData.proponentes;
            }
            
            if (formData.contasFGTS) {
                window.estado.contasFGTS = formData.contasFGTS;
            }
            
            // Os proponentes serão recriados na interface quando o usuário 
            // chegar à etapa correspondente no wizard
            
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
     * Função principal de envio do formulário
     */
    function submitForm() {
        if (state.isSubmitting) return;
        
        // Coleta os dados
        const payload = gatherFormData();
        
        // Validação extra: verificar se a soma dos valores das contas FGTS corresponde ao total
        validateFGTSValues(payload)
            .then(isValid => {
                if (isValid) {
                    // Inicia o envio
                    sendToN8N(payload);
                }
            });
    }
    
    /**
     * Valida a soma dos valores das contas FGTS
     */
    async function validateFGTSValues(payload) {
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
            return new Promise(resolve => {
                // Pergunta ao usuário se deseja continuar mesmo com a diferença
                if (confirm(`O valor total de FGTS (R$ ${valorTotalFGTS.toFixed(2)}) não corresponde à soma dos valores das contas (R$ ${somaValoresContas.toFixed(2)}). Deseja continuar mesmo assim?`)) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            });
        }
        
        return Promise.resolve(true);
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
        $('#wizard-navigation a').css('pointer-events', 'none');
        $('#prevStepBtn, #nextStepBtn').prop('disabled', true);
        
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
