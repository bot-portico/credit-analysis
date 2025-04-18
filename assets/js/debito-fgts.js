$(document).ready(function() {
    const proponentesContainer = $('#proponentes-container');
    const templateProponente = $('#proponente-template');
    const templateConta = $('#conta-fgts-template');
    const n8nWebhookUrl = 'URL_DO_SEU_WEBHOOK_N8N'; // <-- SUBSTITUIR PELA URL REAL
    let proponenteCounter = 0;

    // --- Inicialização ---
    function initializePage() {
        const urlParams = new URLSearchParams(window.location.search);
        const dealId = urlParams.get('dealId'); // Ou como você passa o ID

        if (dealId) {
            $('#dealId').val(dealId); // Mostra o ID na página
            fetchPloomesData(dealId);
        } else {
            showStatus('Erro: ID da Operação não encontrado na URL.', 'danger');
            $('#enviarSolicitacaoBtn').prop('disabled', true);
        }

        // Adiciona o primeiro proponente automaticamente
        addProponentSection();

        // Define o ano atual no footer
        $('#current-year').text(new Date().getFullYear());
    }

    // --- Interação com Ploomes ---
    async function fetchPloomesData(dealId) {
        console.log(`Buscando dados do Ploomes para Deal ID: ${dealId}`);
        try {
            // Substitua 'buscarDadosPloomesPorId' pela sua função real que busca dados no Ploomes
            const dealData = await buscarDadosPloomesPorId(dealId); // Adapte esta função
            console.log("Dados recebidos do Ploomes:", dealData);

            if (dealData && dealData.value && dealData.value.length > 0) {
                const deal = dealData.value[0];
                displayPloomesData(deal);

                // Pré-preenche o primeiro proponente se os dados existirem no Ploomes
                const firstProponentSection = proponentesContainer.find('.proponente-section:not(#proponente-template)').first();
                if (firstProponentSection.length > 0 && deal.Contact) {
                     firstProponentSection.find('.proponente-nome').val(deal.Contact.Name || '');
                     // Tenta buscar o CPF de OtherProperties do Contato
                     const cpfPropertyKey = "COLOQUE_A_FIELD_KEY_CPF_CONTATO_AQUI"; // <<< SUBSTITUA A FIELD KEY DO CPF DO CONTATO
                     const cpfProp = deal.Contact.OtherProperties?.find(prop => prop.FieldKey === cpfPropertyKey);
                     firstProponentSection.find('.proponente-cpf').val(cpfProp?.StringValue || '');
                     // Adicione outras pré-populações se necessário (PIS, Nascimento etc. se vierem do Ploomes)
                      // Pré-preenche campos gerais se existirem
                    $('#fgtsAgencia').val(getOtherPropertyValue(deal, 'deal_NumeroAgenciaVinculada')); // Ajuste o FieldKey
                    $('#fgtsContrato').val(getOtherPropertyValue(deal, 'deal_NumeroContratoFinanciamento')); // Ajuste o FieldKey
                    $('#fgtsMatriculaImovel').val(getOtherPropertyValue(deal, 'deal_MatriculaImovel')); // Ajuste o FieldKey
                    $('#valorFinanciamento').val(formatCurrency(deal.Amount || 0)); // Exemplo
                    $('#valorCompraVenda').val(formatCurrency(getOtherPropertyValue(deal, 'deal_ValorCompraVenda') || 0)); // Ajuste o FieldKey
                    $('#valorFGTSDebitar').val(formatCurrency(getOtherPropertyValue(deal, 'deal_ValorFGTS') || 0)); // Ajuste o FieldKey

                    //Exibe outros dados gerais da operação
                     $('#dealName').val(deal.Name || '');
                     $('#contactName').val(deal.Contact?.Name || '');


                }

            } else {
                showStatus('Dados da operação não encontrados no Ploomes.', 'warning');
            }
        } catch (error) {
            console.error('Erro ao buscar dados do Ploomes:', error);
            showStatus('Erro ao buscar dados do Ploomes. Verifique o console.', 'danger');
            $('#enviarSolicitacaoBtn').prop('disabled', true);
        }
    }

    function displayPloomesData(deal) {
        // Preenche campos readonly com dados básicos do Ploomes
        $('#dados-operacao [data-fieldkey]').each(function() {
            const key = $(this).data('fieldkey');
            let value = '';

            if (key === 'deal_Id') value = deal.Id;
            else if (key === 'deal_Name') value = deal.Name;
            else if (key === 'contact_Name') value = deal.Contact?.Name;
            else if (key === 'contact_CPF') {
                 const cpfPropertyKey = "COLOQUE_A_FIELD_KEY_CPF_CONTATO_AQUI"; // <<< SUBSTITUA A FIELD KEY DO CPF DO CONTATO
                 const cpfProp = deal.Contact?.OtherProperties?.find(prop => prop.FieldKey === cpfPropertyKey);
                 value = cpfProp?.StringValue || '';
            }
            else if (key === 'deal_ValorFinanciamento') value = formatCurrency(deal.Amount || 0);
            else if (key === 'deal_ValorCompraVenda') value = formatCurrency(getOtherPropertyValue(deal, 'deal_ValorCompraVenda') || 0); // Ajuste o FieldKey
            else if (key === 'deal_ValorFGTS') value = formatCurrency(getOtherPropertyValue(deal, 'deal_ValorFGTS') || 0); // Ajuste o FieldKey


            // Você pode adicionar mais 'else if' para outros campos que vêm diretamente
            // ou usar a função auxiliar getOtherPropertyValue para campos customizados
            else {
                 value = getOtherPropertyValue(deal, key); // Tenta buscar de OtherProperties
            }


            $(this).val(value);
        });
    }

    // Função auxiliar para buscar valor de OtherProperties
    function getOtherPropertyValue(deal, fieldKey) {
        const prop = deal?.OtherProperties?.find(p => p.FieldKey === fieldKey);
        // Adapte para outros tipos de valor se necessário (IntValue, DecimalValue, etc.)
        return prop?.StringValue || prop?.ObjectValueName || prop?.DecimalValue || prop?.IntValue || '';
    }

     // Função auxiliar para formatar moeda (simples)
    function formatCurrency(value) {
        const number = parseFloat(value) || 0;
        return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    // --- Manipulação Dinâmica do Formulário ---

    function addProponentSection() {
        proponenteCounter++;
        const newSection = templateProponente.clone();
        newSection.attr('id', `proponente-section-${proponenteCounter}`);
        newSection.find('.proponente-numero').text(proponenteCounter);
        newSection.find('input, select').each(function() {
            // Atualiza IDs e names para garantir unicidade se necessário (opcional, mas bom para forms complexos)
            const oldId = $(this).attr('id');
            if (oldId) {
                $(this).attr('id', `${oldId}-${proponenteCounter}`);
            }
            // Limpa valores clonados
            $(this).val('');
        });

        newSection.find('.contas-fgts-container').empty(); // Limpa contas template
        newSection.show();
        proponentesContainer.append(newSection);

        // Adiciona a primeira conta automaticamente para o novo proponente
        addAccountSection(newSection.find('.contas-fgts-container'));

        updateRemoveProponenteButtons();
    }

    function removeProponentSection(button) {
        $(button).closest('.proponente-section').remove();
        // Renumera os proponentes restantes
        proponenteCounter = 0;
        proponentesContainer.find('.proponente-section:not(#proponente-template)').each(function() {
            proponenteCounter++;
            $(this).find('.proponente-numero').text(proponenteCounter);
            $(this).attr('id', `proponente-section-${proponenteCounter}`);
             // Atualizar IDs internos se você os estiver usando consistentemente
        });
        updateRemoveProponenteButtons();
    }

    function updateRemoveProponenteButtons() {
        const sections = proponentesContainer.find('.proponente-section:not(#proponente-template)');
        if (sections.length <= 1) {
            sections.find('.remover-proponente-btn').hide();
        } else {
            sections.find('.remover-proponente-btn').show();
        }
    }


    function addAccountSection(container) {
        const newAccount = templateConta.clone();
        newAccount.attr('id', ''); // Remove ID do template
        newAccount.find('input, select').val(''); // Limpa valores
        newAccount.show();
        $(container).append(newAccount);
        updateRemoveAccountButtons(container);
    }

    function removeAccountSection(button) {
        const container = $(button).closest('.contas-fgts-container');
        $(button).closest('.conta-fgts-section').remove();
        updateRemoveAccountButtons(container);
    }

     function updateRemoveAccountButtons(container) {
        const sections = $(container).find('.conta-fgts-section');
        if (sections.length <= 1) {
            sections.find('.remover-conta-btn').hide();
        } else {
            sections.find('.remover-conta-btn').show();
        }
    }

    // --- Coleta de Dados e Envio ---

    function gatherFormData() {
        const dealId = $('#dealId').val();
        const payload = {
            status: "Pendente", // Status inicial para o bot
            id: parseInt(dealId) || null,
            dataHoraEntrada: new Date().toLocaleString("pt-BR"),
            matricula: $('#fgtsMatriculaImovel').val(),
            tipoComplemento: $('#fgtsTipoComplemento').val(),
            cep: getOtherPropertyValue(window.dealDataPloomes.value[0], 'deal_CEP'), // Assumindo que você armazena os dados completos do Ploomes globalmente ou busca novamente
            logradouro: getOtherPropertyValue(window.dealDataPloomes.value[0], 'deal_Logradouro'), // Ajuste FieldKey
            numero: getOtherPropertyValue(window.dealDataPloomes.value[0], 'deal_Numero'), // Ajuste FieldKey
            aptoCasa: $('#fgtsNumeroComplemento').val(),
            blocoTorre: $('#fgtsBlocoComplemento').val(),
            ordemServico: getOtherPropertyValue(window.dealDataPloomes.value[0], 'deal_OrdemServico'), // Ajuste FieldKey
            agencia: $('#fgtsAgencia').val(),
            valorCompraVenda: getOtherPropertyValue(window.dealDataPloomes.value[0], 'deal_ValorCompraVenda'), // Ajuste FieldKey
            valorFinanciamento: window.dealDataPloomes.value[0].Amount || '0', // Valor do negócio Ploomes
            valorFGTS: getOtherPropertyValue(window.dealDataPloomes.value[0], 'deal_ValorFGTS'), // Ajuste FieldKey
            subsidio: getOtherPropertyValue(window.dealDataPloomes.value[0], 'deal_ValorSubsidio'), // Ajuste FieldKey
            contrato: $('#fgtsContrato').val(),
            numeroContatoFGTS: $('#fgtsNumeroContato').val(), // Campo adicional mencionado
            pessoas: []
        };

        proponentesContainer.find('.proponente-section:not(#proponente-template)').each(function() {
            const proponentSection = $(this);
            const pessoa = {
                pis: proponentSection.find('.proponente-pis').val(),
                cpf: proponentSection.find('.proponente-cpf').val(),
                nome: proponentSection.find('.proponente-nome').val(),
                nascimento: proponentSection.find('.proponente-nascimento').val(), // Formato YYYY-MM-DD do input date
                carteira: proponentSection.find('.proponente-carteira').val(),
                serie: proponentSection.find('.proponente-serie').val(),
                contas: []
            };

            proponentSection.find('.contas-fgts-container .conta-fgts-section').each(function() {
                const contaSection = $(this);
                const conta = {
                    situacao: contaSection.find('.conta-situacao').val(),
                    estabelecimento: contaSection.find('.conta-estabelecimento').val(),
                    numero: contaSection.find('.conta-numero').val(),
                    sureg: contaSection.find('.conta-sureg').val(),
                    valor: contaSection.find('.conta-valor').val()
                };
                // Validação simples para não adicionar contas vazias (opcional)
                if (conta.estabelecimento || conta.numero || conta.valor) {
                     pessoa.contas.push(conta);
                }
            });

             // Validação simples para não adicionar proponentes vazios (opcional)
             if (pessoa.nome || pessoa.cpf || pessoa.pis) {
                 payload.pessoas.push(pessoa);
             }
        });

        console.log("Payload para n8n:", payload);
        return payload;
    }

    async function sendToN8N(payload) {
        showStatus('Enviando solicitação...', 'info', false);
        $('#enviarSolicitacaoBtn').prop('disabled', true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enviando...');

        try {
            const response = await fetch(n8nWebhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                // Tenta ler a resposta de erro, se houver
                let errorBody = 'Erro desconhecido';
                try {
                     errorBody = await response.text(); // ou response.json() se n8n retornar JSON no erro
                } catch(e) { /* ignora erro na leitura do body */ }
                 throw new Error(`Erro na rede: ${response.status} ${response.statusText}. Detalhe: ${errorBody}`);
            }

            const result = await response.json(); // Assume que n8n retorna JSON no sucesso
            console.log('Resposta do n8n:', result);

            // Tratar a resposta - Exemplo: mostrar mensagem de sucesso
            // Se o n8n/bot retornar algo útil (ID da solicitação, link do doc), use aqui.
            let successMessage = result.message || 'Solicitação de débito FGTS enviada com sucesso!';
             if(result.documentUrl) { // Exemplo se n8n retornar URL do doc
                 successMessage += ` <a href="${result.documentUrl}" target="_blank">Ver Documento</a>`;
             }
            showStatus(successMessage, 'success');
            $('#form-debito-fgts')[0].reset(); // Limpa o formulário
            // Talvez redirecionar ou apenas limpar?
            // window.location.href = 'dashboard.html?dealId=' + payload.id;


        } catch (error) {
            console.error('Erro ao enviar para o n8n:', error);
            showStatus(`Erro ao enviar solicitação: ${error.message}. Verifique o console.`, 'danger');
        } finally {
             $('#enviarSolicitacaoBtn').prop('disabled', false).html('<i class="fas fa-paper-plane"></i> Enviar Solicitação de Débito');
        }
    }

    function showStatus(message, type = 'info', fadeOut = true) {
        const statusDiv = $('#status-envio');
        statusDiv.removeClass('alert-info alert-success alert-warning alert-danger')
                 .addClass(`alert-${type}`)
                 .html(message) // Usar html() para permitir links
                 .fadeIn();

        if(fadeOut) {
             setTimeout(() => {
                 statusDiv.fadeOut();
             }, 5000); // Esconde após 5 segundos
        }
    }


    // --- Event Listeners ---
    $('#adicionar-proponente-btn').on('click', addProponentSection);

    // Usa delegação de eventos para botões adicionados dinamicamente
    proponentesContainer.on('click', '.remover-proponente-btn', function() {
        removeProponentSection(this);
    });

    proponentesContainer.on('click', '.adicionar-conta-btn', function() {
        const container = $(this).prev('.contas-fgts-container');
        addAccountSection(container);
    });

    proponentesContainer.on('click', '.remover-conta-btn', function() {
        removeAccountSection(this);
    });

    $('#form-debito-fgts').on('submit', function(event) {
        event.preventDefault(); // Previne o envio padrão do formulário
        const payload = gatherFormData();
        // Validação básica do payload (ex: tem pelo menos 1 proponente?)
        if (!payload.pessoas || payload.pessoas.length === 0) {
            showStatus('Erro: Adicione pelo menos um proponente.', 'warning');
            return;
        }
        let hasEmptyAccountValue = false;
         payload.pessoas.forEach(p => {
             p.contas.forEach(c => {
                 if (!c.valor || parseFloat(c.valor) <= 0) {
                     hasEmptyAccountValue = true;
                 }
             });
         });
         if (hasEmptyAccountValue) {
            showStatus('Erro: Verifique se todas as contas FGTS têm um valor a debitar maior que zero.', 'warning');
            return;
         }

        sendToN8N(payload);
    });

     $('#voltarDashboardBtn').on('click', function() {
        const dealId = $('#dealId').val();
        if (dealId) {
            window.location.href = `dashboard.html?dealId=${dealId}`; // Adapte se a URL for diferente
        } else {
            window.location.href = 'dashboard.html'; // Fallback
        }
    });

    // --- Inicia a página ---
    initializePage();

    // Armazena os dados do Ploomes globalmente para fácil acesso no gatherFormData
    // É uma abordagem simples, pode ser melhorada com gerenciamento de estado se necessário
    window.dealDataPloomes = {};
    const originalBuscarDados = window.buscarDadosPloomesPorId; // Salva a função original
     window.buscarDadosPloomesPorId = async function(dealId) { // Sobrescreve
         const data = await originalBuscarDados(dealId);
         window.dealDataPloomes = data; // Armazena os dados
         return data;
     };

});
