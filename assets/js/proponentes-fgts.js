/**
 * Gerenciamento de Proponentes e Contas FGTS
 * 
 * Versão atualizada para trabalhar com o fluxo de wizard
 */

// Configurações
const MAX_PROPONENTES = 10;
const MAX_CONTAS_POR_PROPONENTE = 20;

// Contador de proponentes
let proponenteCounter = 0;

// Estado global para armazenar os dados dos proponentes e contas FGTS
window.estado = {
    proponentes: [],
    contasFGTS: {}
};

$(document).ready(function() {
    // Adicionar proponente
    $("#adicionarProponenteBtn").click(function() {
        adicionarProponente();
    });
    
    // Delegar eventos para elementos dinâmicos
    $(document).on("click", ".remover-proponente-btn", function() {
        removerProponente(this);
    });
    
    // Formatar CPF
    $(document).on("blur", ".proponente-cpf", function() {
        formatarCPF(this);
    });
    
    // Formatar PIS/PASEP
    $(document).on("blur", ".proponente-pis", function() {
        formatarPIS(this);
    });
    
    // Formatar número da conta e estabelecimento
    $(document).on("input", ".conta-estabelecimento, .conta-numero", function() {
        $(this).val($(this).val().replace(/\D/g, ''));
    });
    
    // Formatar valores monetários
    $(document).on("blur", ".conta-valor", function() {
        formatarMoeda(this);
    });
    
    // Inicializar com um proponente após carregar os dados básicos
    setTimeout(() => {
        if (document.querySelectorAll('#proponentesContainer .proponente-card').length === 0) {
            adicionarProponente();
        }
    }, 500);
});

/**
 * Adiciona um novo proponente
 */
function adicionarProponente() {
    if (proponenteCounter >= MAX_PROPONENTES) {
        mostrarAlerta(`Máximo de ${MAX_PROPONENTES} proponentes atingido.`, 'warning');
        return;
    }
    
    proponenteCounter++;
    
    // Gera um ID único para o proponente
    const proponenteId = `proponente-${Date.now()}-${proponenteCounter}`;
    
    // Clonar o template
    const novoProponente = $("#proponente-template").clone();
    novoProponente.removeAttr("id").show();
    
    // Atualizar o número do proponente
    novoProponente.find(".proponente-numero").text(proponenteCounter);
    
    // Configurar o ID do proponente para referência
    novoProponente.attr('data-id', proponenteId);
    
    // Adicionar ao container
    $("#proponentesContainer").append(novoProponente);
    
    // Atualizar botões de remoção
    atualizarBotoesRemoverProponente();
    
    // Adiciona o proponente ao estado global
    window.estado.proponentes.push({
        id: proponenteId,
        numero: proponenteCounter,
        nome: '',
        cpf: '',
        pis: '',
        nascimento: '',
        carteira: '',
        serie: ''
    });
    
    // Inicializa o array de contas para este proponente
    window.estado.contasFGTS[proponenteId] = [];
    
    // Adiciona listeners para os campos do proponente
    novoProponente.find("input").on("change", function() {
        atualizarDadosProponente(proponenteId);
    });
    
    // Marca o formulário como modificado
    marcarFormularioModificado();
    
    return novoProponente;
}

/**
 * Remove um proponente
 */
function removerProponente(btn) {
    const proponenteCard = $(btn).closest(".card");
    const proponenteId = proponenteCard.data('id');
    
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
        
        // Remove o proponente do estado global
        window.estado.proponentes = window.estado.proponentes.filter(p => p.id !== proponenteId);
        delete window.estado.contasFGTS[proponenteId];
        
        // Marca o formulário como modificado
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
 * Atualiza os dados de um proponente no estado global
 */
function atualizarDadosProponente(proponenteId) {
    const proponenteCard = $(`.proponente-card[data-id="${proponenteId}"]`);
    
    if (proponenteCard.length) {
        const proponenteIndex = window.estado.proponentes.findIndex(p => p.id === proponenteId);
        
        if (proponenteIndex !== -1) {
            window.estado.proponentes[proponenteIndex] = {
                id: proponenteId,
                numero: parseInt(proponenteCard.find(".proponente-numero").text()),
                nome: proponenteCard.find(".proponente-nome").val(),
                cpf: proponenteCard.find(".proponente-cpf").val(),
                pis: proponenteCard.find(".proponente-pis").val(),
                nascimento: proponenteCard.find(".proponente-nascimento").val(),
                carteira: proponenteCard.find(".proponente-carteira").val(),
                serie: proponenteCard.find(".proponente-serie").val()
            };
        }
    }
    
    marcarFormularioModificado();
}

/**
 * Adiciona uma nova conta FGTS para um proponente
 */
function adicionarContaFGTS(proponenteId) {
    const contasProponente = window.estado.contasFGTS[proponenteId] || [];
    
    if (contasProponente.length >= MAX_CONTAS_POR_PROPONENTE) {
        mostrarAlerta(`Máximo de ${MAX_CONTAS_POR_PROPONENTE} contas FGTS por proponente atingido.`, 'warning');
        return null;
    }
    
    // Gera um ID único para a conta
    const contaId = `conta-${Date.now()}-${contasProponente.length + 1}`;
    
    // Cria a nova conta no estado global
    const novaConta = {
        id: contaId,
        proponenteId: proponenteId,
        numero: contasProponente.length + 1,
        situacao: '',
        estabelecimento: '',
        numero: '',
        sureg: '',
        valor: '',
        empregador: ''
    };
    
    // Adiciona ao estado global
    if (!window.estado.contasFGTS[proponenteId]) {
        window.estado.contasFGTS[proponenteId] = [];
    }
    
    window.estado.contasFGTS[proponenteId].push(novaConta);
    
    // Marca o formulário como modificado
    marcarFormularioModificado();
    
    return novaConta;
}

/**
 * Atualiza os dados das contas FGTS no estado global
 * a partir dos dados preenchidos na interface
 */
window.atualizarContasFGTS = function() {
    const contasContainer = document.getElementById('contasFGTSContainer');
    
    if (!contasContainer) return;
    
    // Para cada proponente no container de contas
    const proponentesElements = contasContainer.querySelectorAll('.proponente-fgts');
    
    proponentesElements.forEach(proponenteElement => {
        const proponenteId = proponenteElement.dataset.proponenteId;
        
        // Limpa o array de contas deste proponente
        window.estado.contasFGTS[proponenteId] = [];
        
        // Adiciona cada conta encontrada na interface
        const contasElements = proponenteElement.querySelectorAll('.conta-fgts-card');
        
        contasElements.forEach((contaElement, index) => {
            const conta = {
                id: contaElement.dataset.contaId,
                proponenteId: proponenteId,
                numero: index + 1,
                situacao: contaElement.querySelector('.conta-situacao').value,
                estabelecimento: contaElement.querySelector('.conta-estabelecimento').value,
                numero: contaElement.querySelector('.conta-numero').value,
                sureg: contaElement.querySelector('.conta-sureg').value,
                valor: contaElement.querySelector('.conta-valor').value,
                empregador: contaElement.querySelector('.conta-empregador').value
            };
            
            window.estado.contasFGTS[proponenteId].push(conta);
        });
    });
    
    marcarFormularioModificado();
};

/**
 * Retorna as contas FGTS de um proponente
 */
window.getContasFGTSByProponente = function(proponenteId) {
    return window.estado.contasFGTS[proponenteId] || [];
};

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
    
    // Atualiza o estado do proponente
    const proponenteCard = $(input).closest('.proponente-card');
    const proponenteId = proponenteCard.data('id');
    
    if (proponenteId) {
        atualizarDadosProponente(proponenteId);
    }
}

/**
 * Formata um PIS/PASEP
 */
function formatarPIS(input) {
    let value = $(input).val().replace(/\D/g, '');
    
    if (value.length > 11) {
        value = value.substring(0, 11);
    }
    
    // Aplica a máscara
    if (value.length > 9) {
        value = value.replace(/^(\d{3})(\d{5})(\d{2})(\d{1})$/, "$1.$2.$3-$4");
    } else if (value.length > 7) {
        value = value.replace(/^(\d{3})(\d{5})(\d{1,2})$/, "$1.$2.$3");
    } else if (value.length > 2) {
        value = value.replace(/^(\d{3})(\d{1,5})$/, "$1.$2");
    }
    
    $(input).val(value);
    
    // Atualiza o estado do proponente
    const proponenteCard = $(input).closest('.proponente-card');
    const proponenteId = proponenteCard.data('id');
    
    if (proponenteId) {
        atualizarDadosProponente(proponenteId);
    }
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
    if (window.wizardController) {
        window.wizardController.showStatus(mensagem, tipo);
    } else {
        alert(mensagem);
    }
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
window.coletarDadosProponentesEContas = function() {
    // Retorna os dados direto do estado global
    const pessoas = [];
    
    // Para cada proponente no estado
    window.estado.proponentes.forEach(proponente => {
        const contas = window.estado.contasFGTS[proponente.id] || [];
        
        const pessoa = {
            nome: proponente.nome,
            cpf: proponente.cpf.replace(/\D/g, ''),
            pis: proponente.pis,
            nascimento: proponente.nascimento,
            carteira: proponente.carteira,
            serie: proponente.serie,
            contas: []
        };
        
        // Adiciona cada conta do proponente
        contas.forEach(conta => {
            pessoa.contas.push({
                situacao: conta.situacao,
                estabelecimento: conta.estabelecimento,
                numero: conta.numero,
                sureg: conta.sureg,
                valor: parseFloat(conta.valor) || 0,
                empregador: conta.empregador || ''
            });
        });
        
        pessoas.push(pessoa);
    });
    
    return pessoas;
};
