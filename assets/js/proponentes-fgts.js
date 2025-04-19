/**
 * Gerenciamento de Proponentes e Contas FGTS
 * 
 * Este arquivo gerencia a adição/remoção dinâmica de proponentes e suas contas FGTS,
 * além de integrar os dados coletados ao payload enviado para o robô
 */

// Configurações
const MAX_PROPONENTES = 10;
const MAX_CONTAS_POR_PROPONENTE = 20;

// Contador de proponentes
let proponenteCounter = 0;

$(document).ready(function() {
    // Inicializa com um proponente
    adicionarProponente();
    
    // Adicionar proponente
    $("#adicionarProponenteBtn").click(function() {
        adicionarProponente();
    });
    
    // Delegar eventos para elementos dinâmicos
    $(document).on("click", ".remover-proponente-btn", function() {
        removerProponente(this);
    });
    
    $(document).on("click", ".adicionar-conta-btn", function() {
        const proponenteCard = $(this).closest(".card");
        adicionarContaFGTS(proponenteCard);
    });
    
    $(document).on("click", ".remover-conta-btn", function() {
        removerContaFGTS(this);
    });
    
    // Formatar CPF
    $(document).on("blur", ".proponente-cpf", function() {
        formatarCPF(this);
    });
    
    // Formatar número da conta e estabelecimento
    $(document).on("input", ".conta-estabelecimento, .conta-numero", function() {
        $(this).val($(this).val().replace(/\D/g, ''));
    });
    
    // Formatar valores monetários
    $(document).on("blur", ".conta-valor", function() {
        formatarMoeda(this);
    });
    
    // Inicializar tooltips
    inicializarTooltips();
});

/**
 * Inicializa tooltips para campos de informação
 */
function inicializarTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

/**
 * Adiciona um novo proponente
 */
function adicionarProponente() {
    if (proponenteCounter >= MAX_PROPONENTES) {
        mostrarAlerta(`Máximo de ${MAX_PROPONENTES} proponentes atingido.`, 'warning');
        return;
    }
    
    proponenteCounter++;
    
    // Clonar o template
    const novoProponente = $("#proponente-template").clone();
    novoProponente.removeAttr("id").show();
    
    // Atualizar o número do proponente
    novoProponente.find(".proponente-numero").text(proponenteCounter);
    
    // Adicionar ao container
    $("#proponentesContainer").append(novoProponente);
    
    // Adicionar primeira conta FGTS automaticamente
    adicionarContaFGTS(novoProponente);
    
    // Atualizar botões de remoção
    atualizarBotoesRemoverProponente();
    
    // Marcar o formulário como modificado
    marcarFormularioModificado();
    
    return novoProponente;
}

/**
 * Remove um proponente
 */
function removerProponente(btn) {
    const proponenteCard = $(btn).closest(".card");
    
    // Animação de remoção
    proponenteCard.css({
        'transition': 'all 0.3s ease',
        'opacity': '0',
        'transform': 'translateY(10px)'
    });
    
    // Remove após a animação
    setTimeout(() => {
        proponenteCard.remove();
        
        // Renumera os proponentes
        proponenteCounter = 0;
        $("#proponentesContainer .card").each(function() {
            proponenteCounter++;
            $(this).find(".proponente-numero").text(proponenteCounter);
        });
        
        // Atualiza os botões de remoção
        atualizarBotoesRemoverProponente();
        
        // Marcar o formulário como modificado
        marcarFormularioModificado();
    }, 300);
}

/**
 * Atualiza a visibilidade dos botões de remoção de proponentes
 */
function atualizarBotoesRemoverProponente() {
    const proponentes = $("#proponentesContainer .card");
    
    if (proponentes.length <= 1) {
        proponentes.find(".remover-proponente-btn").hide();
    } else {
        proponentes.find(".remover-proponente-btn").show();
    }
}

/**
 * Adiciona uma nova conta FGTS a um proponente
 */
function adicionarContaFGTS(proponenteCard) {
    const contasContainer = proponenteCard.find(".contas-fgts-container");
    const contasExistentes = contasContainer.children().length;
    
    if (contasExistentes >= MAX_CONTAS_POR_PROPONENTE) {
        mostrarAlerta(`Máximo de ${MAX_CONTAS_POR_PROPONENTE} contas FGTS por proponente atingido.`, 'warning');
        return;
    }
    
    // Clonar o template
    const novaConta = $("#conta-fgts-template").clone();
    novaConta.removeAttr("id");
    
    // Atualizar o número da conta
    novaConta.find(".conta-numero-label").text(`Conta FGTS ${contasExistentes + 1}`);
    
    // Exibir a nova conta com animação
    novaConta.css('display', 'none');
    contasContainer.append(novaConta);
    novaConta.fadeIn(300);
    
    // Atualizar o contador
    proponenteCard.find(".contas-counter").text(contasExistentes + 1);
    
    // Atualizar botões de remoção
    atualizarBotoesRemoverConta(contasContainer);
    
    // Marcar o formulário como modificado
    marcarFormularioModificado();
    
    // Inicializar tooltips para os novos elementos
    inicializarTooltips();
    
    return novaConta;
}

/**
 * Remove uma conta FGTS
 */
function removerContaFGTS(btn) {
    const contaCard = $(btn).closest(".conta-fgts-card");
    const contasContainer = contaCard.parent();
    const proponenteCard = contasContainer.closest(".card");
    
    // Animação de remoção
    contaCard.fadeOut(300, function() {
        $(this).remove();
        
        // Renumerar contas
        let contaCounter = 0;
        contasContainer.find(".conta-fgts-card").each(function() {
            contaCounter++;
            $(this).find(".conta-numero-label").text(`Conta FGTS ${contaCounter}`);
        });
        
        // Atualizar contador
        const contasCount = contasContainer.children().length;
        proponenteCard.find(".contas-counter").text(contasCount);
        
        // Atualizar botões de remoção
        atualizarBotoesRemoverConta(contasContainer);
        
        // Marcar o formulário como modificado
        marcarFormularioModificado();
    });
}

/**
 * Atualiza a visibilidade dos botões de remoção de contas
 */
function atualizarBotoesRemoverConta(contasContainer) {
    const contas = contasContainer.children();
    
    if (contas.length <= 1) {
        contas.find(".remover-conta-btn").hide();
    } else {
        contas.find(".remover-conta-btn").show();
    }
}

/**
 * Formata um CPF
 */
function formatarCPF(input) {
    let value = $(input).val().replace(/\D/g, '');
    
    if (value.length > 11) {
        value = value.substring(0, 11);
    }
    
    // Aplica a máscara
    if (value.length > 9) {
        value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{1,2})$/, "$1.$2.$3-$4");
    } else if (value.length > 6) {
        value = value.replace(/^(\d{3})(\d{3})(\d{1,3})$/, "$1.$2.$3");
    } else if (value.length > 3) {
        value = value.replace(/^(\d{3})(\d{1,3})$/, "$1.$2");
    }
    
    $(input).val(value);
}

/**
 * Formata valor monetário
 */
function formatarMoeda(input) {
    let value = $(input).val();
    
    if (!value) return;
    
    // Converte para número
    const numValue = parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.'));
    
    if (isNaN(numValue)) {
        $(input).val('');
    } else {
        // Formata com duas casas decimais
        $(input).val(numValue.toFixed(2));
    }
}

/**
 * Mostra um alerta temporário
 */
function mostrarAlerta(mensagem, tipo = 'info') {
    const alertEl = $('<div>')
        .addClass(`alert alert-${tipo} alert-dismissible fade show`)
        .attr('role', 'alert')
        .html(`
            ${mensagem}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
        `);
    
    // Adiciona o alerta na página
    $("#status-envio").html(alertEl).removeClass('d-none');
    
    // Remove após 3 segundos
    setTimeout(() => {
        alertEl.alert('close');
    }, 3000);
}

/**
 * Marca o formulário como modificado para salvar automaticamente
 */
function marcarFormularioModificado() {
    if (window.state) {
        window.state.formModified = true;
    }
}

/**
 * Coleta os dados de proponentes e contas FGTS para o payload
 * Esta função deve ser chamada pelo gatherFormData no código principal
 */
function coletarDadosProponentesEContas() {
    const pessoas = [];
    
    // Percorre cada proponente
    $("#proponentesContainer .card").each(function() {
        const proponenteCard = $(this);
        
        const pessoa = {
            nome: proponenteCard.find(".proponente-nome").val(),
            cpf: proponenteCard.find(".proponente-cpf").val().replace(/\D/g, ''),
            pis: proponenteCard.find(".proponente-pis").val(),
            nascimento: proponenteCard.find(".proponente-nascimento").val(),
            carteira: proponenteCard.find(".proponente-carteira").val(),
            serie: proponenteCard.find(".proponente-serie").val(),
            contas: []
        };
        
        // Percorre cada conta FGTS deste proponente
        proponenteCard.find(".contas-fgts-container .conta-fgts-card").each(function() {
            const contaCard = $(this);
            
            const conta = {
                situacao: contaCard.find(".conta-situacao").val(),
                estabelecimento: contaCard.find(".conta-estabelecimento").val(),
                numero: contaCard.find(".conta-numero").val(),
                sureg: contaCard.find(".conta-sureg").val(),
                valor: parseFloat(contaCard.find(".conta-valor").val()) || 0,
                empregador: contaCard.find(".conta-empregador").val() || ''
            };
            
            pessoa.contas.push(conta);
        });
        
        pessoas.push(pessoa);
    });
    
    return pessoas;
}

// Exportando a função para uso no debito-fgts.js
window.coletarDadosProponentesEContas = coletarDadosProponentesEContas;
