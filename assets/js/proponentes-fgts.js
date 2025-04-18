// Configurações
const MAX_PROPONENTES = 10;
const MAX_CONTAS_POR_PROPONENTE = 20;

// Inicialização
let proponenteCounter = 0; // Começa com 0 e incrementa antes de adicionar

$(document).ready(function() {
    // Inicializa com um proponente
    adicionarProponente();
    
    // Botão de adicionar proponente
    $("#adicionarProponenteBtn").click(function() {
        adicionarProponente();
    });
    
    // Delegação de eventos para botões dinâmicos
    $(document).on("click", ".remover-proponente-btn", function() {
        removerProponente(this);
    });
    
    $(document).on("click", ".adicionar-conta-btn", function() {
        const proponenteCard = $(this).closest(".proponente-card");
        adicionarContaFGTS(proponenteCard);
    });
    
    $(document).on("click", ".remover-conta-btn", function() {
        removerContaFGTS(this);
    });

    // Conecta ao formulário principal para adicionar os dados ao envio
    $("#form-debito-fgts").submit(function(e) {
        e.preventDefault();
        submitForm();
    });
});

// Adiciona um novo proponente
function adicionarProponente() {
    if (proponenteCounter >= MAX_PROPONENTES) {
        alert(`Máximo de ${MAX_PROPONENTES} proponentes atingido.`);
        return;
    }
    
    proponenteCounter++;
    
    // Clona o template
    const novoProponente = $("#proponente-template").clone();
    novoProponente.removeAttr("id").show();
    
    // Atualiza o número do proponente
    novoProponente.find("h5").text(`Proponente ${proponenteCounter}`);
    
    // Adiciona à página
    $("#proponentesContainer").append(novoProponente);
    
    // Adiciona primeira conta FGTS automaticamente
    adicionarContaFGTS(novoProponente);
    
    // Atualiza os botões de remoção
    atualizarBotoesRemoverProponente();
}

// Remove um proponente
function removerProponente(btn) {
    $(btn).closest(".proponente-card").remove();
    
    // Renumera os proponentes
    $(".proponente-card").each(function(index) {
        $(this).find("h5").text(`Proponente ${index + 1}`);
    });
    
    proponenteCounter--;
    
    // Atualiza os botões de remoção
    atualizarBotoesRemoverProponente();
}

// Atualiza a visibilidade dos botões de remoção de proponentes
function atualizarBotoesRemoverProponente() {
    if ($(".proponente-card").length <= 1) {
        $(".remover-proponente-btn").hide();
    } else {
        $(".remover-proponente-btn").show();
    }
}

// Adiciona uma nova conta FGTS a um proponente
function adicionarContaFGTS(proponenteCard) {
    const container = proponenteCard.find(".contas-fgts-container");
    const contasCount = container.children().length;
    
    if (contasCount >= MAX_CONTAS_POR_PROPONENTE) {
        alert(`Máximo de ${MAX_CONTAS_POR_PROPONENTE} contas FGTS por proponente atingido.`);
        return;
    }
    
    // Clona o template
    const novaConta = $(".conta-fgts-template").children().first().clone();
    
    // Atualiza o número da conta
    novaConta.find(".conta-numero-label").text(`Conta FGTS ${contasCount + 1}`);
    
    // Adiciona ao container
    container.append(novaConta);
    
    // Atualiza o contador
    proponenteCard.find(".contas-counter").text(contasCount + 1);
    
    // Atualiza botões de remoção
    atualizarBotoesRemoverConta(container);
}

// Remove uma conta FGTS
function removerContaFGTS(btn) {
    const contaCard = $(btn).closest(".conta-fgts-card");
    const container = contaCard.parent();
    const proponenteCard = container.closest(".proponente-card");
    
    contaCard.remove();
    
    // Renumera as contas
    container.find(".conta-fgts-card").each(function(index) {
        $(this).find(".conta-numero-label").text(`Conta FGTS ${index + 1}`);
    });
    
    // Atualiza o contador
    const novoTotal = container.children().length;
    proponenteCard.find(".contas-counter").text(novoTotal);
    
    // Atualiza botões de remoção
    atualizarBotoesRemoverConta(container);
}

// Atualiza a visibilidade dos botões de remoção de contas
function atualizarBotoesRemoverConta(container) {
    if (container.children().length <= 1) {
        container.find(".remover-conta-btn").hide();
    } else {
        container.find(".remover-conta-btn").show();
    }
}

// Coleta os dados do formulário para envio
function submitForm() {
    // Cria o payload para envio
    const payload = {
        // Dados gerais (já devem estar sendo coletados pelo seu JS principal)
        botType: $("input[name='botType']:checked").val(),
        dealId: $("#dealId").text(),
        agencia: $("#agenciaVinculada").val(),
        contrato: $("#contratoFinanciamento").val(),
        matricula: $("#matriculaImovel").val(),
        tipoComplemento: $("#tipoComplemento").val(),
        aptoCasa: $("#numeroComplemento").val(),
        blocoTorre: $("#blocoTorre").val(),
        bairro: $("#bairro").val(),
        numeroContatoFGTS: $("#protocoloFGTS").val(),
        // Adiciona array de pessoas
        pessoas: []
    };
    
    // Coleta dados dos proponentes e suas contas
    $(".proponente-card:visible").each(function() {
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
        
        // Coleta dados das contas FGTS
        proponenteCard.find(".conta-fgts-card").each(function() {
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
        
        payload.pessoas.push(pessoa);
    });
    
    console.log("Payload completo:", payload);
    
    // A partir daqui, integre com sua função de envio existente
    // enviarSolicitacao(payload);
}
