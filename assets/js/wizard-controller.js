/**
 * Controlador do Wizard - FGTS
 * 
 * Gerencia a navegação entre as etapas do wizard,
 * validando os dados e exibindo feedback para o usuário
 */

class WizardController {
    constructor() {
        // Estado do wizard
        this.currentStep = 1;
        this.totalSteps = 6;
        this.validationState = {
            step1: false,
            step2: false,
            step3: false,
            step4: false,
            step5: false,
            step6: true // A última etapa (confirmação) está sempre validada
        };
        
        // Referências aos elementos HTML
        this.prevBtn = document.getElementById("prevStepBtn");
        this.nextBtn = document.getElementById("nextStepBtn");
        this.submitBtn = document.getElementById("enviarSolicitacaoBtn");
        
        // Inicialização
        this.init();
    }
    
    /**
     * Inicializa o controlador do wizard
     */
    init() {
        // Inicializa eventos dos botões de navegação
        this.prevBtn.addEventListener("click", () => this.prevStep());
        this.nextBtn.addEventListener("click", () => this.nextStep());
        
        // Inicializa eventos das abas
        document.querySelectorAll(".nav-link").forEach(tab => {
            tab.addEventListener("click", (e) => {
                const stepNumber = parseInt(e.currentTarget.dataset.step);
                if (this.canNavigateToStep(stepNumber)) {
                    this.goToStep(stepNumber);
                }
            });
        });
        
        // Atualiza o estado inicial dos botões
        this.updateButtonsState();
        
        // Bloqueia envio do formulário para que seja controlado pelo wizard
        document.getElementById("form-debito-fgts").addEventListener("submit", (e) => {
            e.preventDefault();
            if (this.currentStep === this.totalSteps && this.validateAllSteps()) {
                window.submitForm(); // Função de envio definida em debito-fgts.js
            }
        });
    }
    
    /**
     * Navega para a etapa anterior
     */
    prevStep() {
        if (this.currentStep > 1) {
            this.goToStep(this.currentStep - 1);
        }
    }
    
    /**
     * Navega para a próxima etapa
     */
    nextStep() {
        if (this.validateCurrentStep()) {
            // Marca a etapa atual como completa
            document.getElementById(`step${this.currentStep}-tab`).classList.add("completed");
            
            if (this.currentStep < this.totalSteps) {
                this.goToStep(this.currentStep + 1);
            }
        } else {
            this.showValidationErrors();
        }
    }
    
    /**
     * Navega para uma etapa específica
     */
    goToStep(stepNumber) {
        if (stepNumber >= 1 && stepNumber <= this.totalSteps) {
            // Oculta a etapa atual
            document.getElementById(`step${this.currentStep}`).classList.add("d-none");
            document.getElementById(`step${this.currentStep}-tab`).classList.remove("active");
            
            // Mostra a nova etapa
            document.getElementById(`step${stepNumber}`).classList.remove("d-none");
            document.getElementById(`step${stepNumber}-tab`).classList.add("active");
            
            // Atualiza a etapa atual
            this.currentStep = stepNumber;
            
            // Atualiza a barra de progresso
            this.updateProgress();
            
            // Atualiza o estado dos botões
            this.updateButtonsState();
            
            // Se for a última etapa, gera o resumo
            if (this.currentStep === this.totalSteps) {
                this.generateSummary();
            }
            
            // Se for a etapa 5 (Contas FGTS), renderiza as contas
            if (this.currentStep === 5) {
                this.renderContasFGTS();
            }
            
            // Rola para o topo do formulário
            window.scrollTo({
                top: document.querySelector('.wizard-navigation').offsetTop - 20,
                behavior: 'smooth'
            });
        }
    }
    
    /**
     * Atualiza a barra de progresso
     */
    updateProgress() {
        const progressPercentage = ((this.currentStep - 1) / (this.totalSteps - 1)) * 100;
        document.querySelector('.wizard-navigation .progress-bar').style.width = `${progressPercentage}%`;
    }
    
    /**
     * Atualiza o estado dos botões de navegação
     */
    updateButtonsState() {
        // Botão Anterior
        this.prevBtn.disabled = this.currentStep === 1;
        
        // Botão Próximo
        if (this.currentStep === this.totalSteps) {
            this.nextBtn.style.display = "none";
            this.submitBtn.parentElement.classList.remove("d-none");
        } else {
            this.nextBtn.style.display = "block";
            this.submitBtn.parentElement.classList.add("d-none");
        }
    }
    
    /**
     * Verifica se pode navegar para uma etapa específica
     */
    canNavigateToStep(stepNumber) {
        // Sempre pode voltar para etapas anteriores
        if (stepNumber < this.currentStep) {
            return true;
        }
        
        // Só pode avançar para etapas subsequentes se todas as anteriores forem válidas
        for (let i = 1; i < stepNumber; i++) {
            if (!this.validationState[`step${i}`]) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Valida a etapa atual
     */
    validateCurrentStep() {
        switch(this.currentStep) {
            case 1:
                return this.validateStep1();
            case 2:
                return this.validateStep2();
            case 3:
                return this.validateStep3();
            case 4:
                return this.validateStep4();
            case 5:
                return this.validateStep5();
            case 6:
                return true; // Step 6 is always valid (confirmation step)
            default:
                return false;
        }
    }
    
    /**
     * Valida todas as etapas
     */
    validateAllSteps() {
        for (let i = 1; i <= this.totalSteps; i++) {
            if (!this.validationState[`step${i}`]) {
                this.showStatus(`Por favor, complete corretamente a Etapa ${i} antes de prosseguir.`, 'danger');
                return false;
            }
        }
        return true;
    }
    
    /**
     * Valida a Etapa 1 - Identificação
     */
    validateStep1() {
        // A etapa 1 é principalmente informativa, sempre válida
        this.validationState.step1 = true;
        return true;
    }
    
    /**
     * Valida a Etapa 2 - Tipo de Processamento
     */
    validateStep2() {
        const selectedBotType = document.getElementById("selectedBotType").value;
        
        if (!selectedBotType) {
            this.showStatus("Por favor, selecione um tipo de processamento.", "danger");
            document.querySelector('.bot-selector').classList.add('border', 'border-danger', 'rounded', 'p-2');
            setTimeout(() => {
                document.querySelector('.bot-selector').classList.remove('border', 'border-danger', 'rounded', 'p-2');
            }, 1500);
            this.validationState.step2 = false;
            return false;
        }
        
        this.validationState.step2 = true;
        return true;
    }
    
    /**
     * Valida a Etapa 3 - Dados do Imóvel
     */
    validateStep3() {
        let isValid = true;
        
        // Campos obrigatórios
        const requiredFields = [
            { id: 'fgtsAgencia', label: 'Agência Vinculada' },
            { id: 'fgtsContrato', label: 'Nº Contrato Financiamento' },
            { id: 'fgtsMatriculaImovel', label: 'Matrícula do Imóvel' },
            { id: 'fgtsTipoComplemento', label: 'Tipo Complemento Imóvel' }
        ];
        
        // Verifica cada campo obrigatório
        for (const field of requiredFields) {
            const element = document.getElementById(field.id);
            if (!element.value) {
                this.markFieldAsInvalid(element, `O campo ${field.label} é obrigatório`);
                isValid = false;
            } else {
                this.markFieldAsValid(element);
            }
        }
        
        this.validationState.step3 = isValid;
        return isValid;
    }
    
    /**
     * Valida a Etapa 4 - Proponentes
     */
    validateStep4() {
        let isValid = true;
        
        // Verifica se há pelo menos um proponente
        const proponentes = document.querySelectorAll('#proponentesContainer .proponente-card');
        if (proponentes.length === 0) {
            this.showStatus("É necessário adicionar pelo menos um proponente.", "danger");
            isValid = false;
            return false;
        }
        
        // Valida os dados de cada proponente
        proponentes.forEach((proponente, index) => {
            const numeroProponente = index + 1;
            
            // Campos obrigatórios do proponente
            const camposProponente = [
                { selector: '.proponente-nome', label: 'Nome Completo' },
                { selector: '.proponente-cpf', label: 'CPF' },
                { selector: '.proponente-pis', label: 'PIS/PASEP' },
                { selector: '.proponente-nascimento', label: 'Data de Nascimento' },
                { selector: '.proponente-carteira', label: 'Nº Carteira Trabalho' },
                { selector: '.proponente-serie', label: 'Série Carteira Trabalho' }
            ];
            
            // Verifica cada campo
            for (const campo of camposProponente) {
                const elemento = proponente.querySelector(campo.selector);
                if (!elemento.value) {
                    this.markFieldAsInvalid(elemento, `O campo ${campo.label} é obrigatório`);
                    isValid = false;
                } else {
                    this.markFieldAsValid(elemento);
                }
            }
            
            // Valida CPF
            const cpfInput = proponente.querySelector('.proponente-cpf');
            const cpf = cpfInput.value.replace(/\D/g, '');
            
            if (cpf && !this.isValidCPF(cpf)) {
                this.markFieldAsInvalid(cpfInput, 'CPF inválido');
                isValid = false;
            }
        });
        
        this.validationState.step4 = isValid;
        return isValid;
    }
    
    /**
     * Valida a Etapa 5 - Contas FGTS
     */
    validateStep5() {
        let isValid = true;
        
        // Verifica se cada proponente tem pelo menos uma conta FGTS
        const proponentes = document.querySelectorAll('#contasFGTSContainer .proponente-fgts');
        
        proponentes.forEach((proponente) => {
            const proponenteId = proponente.dataset.proponenteId;
            const contas = proponente.querySelectorAll('.conta-fgts-card');
            
            if (contas.length === 0) {
                this.showStatus(`O proponente ${proponente.dataset.proponenteNumero} precisa ter pelo menos uma conta FGTS.`, "danger");
                isValid = false;
                return;
            }
            
            // Valida cada conta FGTS
            contas.forEach((conta) => {
                // Campos obrigatórios da conta
                const camposConta = [
                    { selector: '.conta-situacao', label: 'Situação da Conta' },
                    { selector: '.conta-estabelecimento', label: 'Código do Estabelecimento' },
                    { selector: '.conta-numero', label: 'Código do Empregado' },
                    { selector: '.conta-sureg', label: 'SUREG' },
                    { selector: '.conta-valor', label: 'Valor a Debitar' }
                ];
                
                // Verifica cada campo
                for (const campo of camposConta) {
                    const elemento = conta.querySelector(campo.selector);
                    if (!elemento.value) {
                        this.markFieldAsInvalid(elemento, `O campo ${campo.label} é obrigatório`);
                        isValid = false;
                    } else {
                        this.markFieldAsValid(elemento);
                    }
                }
                
                // Valida valor da conta
                const valorInput = conta.querySelector('.conta-valor');
                const valor = parseFloat(valorInput.value);
                
                if (isNaN(valor) || valor <= 0) {
                    this.markFieldAsInvalid(valorInput, 'O valor deve ser maior que zero');
                    isValid = false;
                }
            });
        });
        
        this.validationState.step5 = isValid;
        return isValid;
    }
    
    /**
     * Renderiza as contas FGTS na etapa 5
     */
    renderContasFGTS() {
        const container = document.getElementById('contasFGTSContainer');
        container.innerHTML = '';
        
        // Obtém todos os proponentes
        const proponentes = document.querySelectorAll('#proponentesContainer .proponente-card');
        
        // Para cada proponente, cria um card com suas contas FGTS
        proponentes.forEach((proponente, index) => {
            const proponenteNumero = index + 1;
            const proponenteNome = proponente.querySelector('.proponente-nome').value || `Proponente ${proponenteNumero}`;
            const proponenteId = proponente.dataset.id || `proponente-${proponenteNumero}`;
            
            // Cria o elemento para o proponente
            const proponenteElement = document.createElement('div');
            proponenteElement.className = 'card mb-4 proponente-fgts';
            proponenteElement.dataset.proponenteId = proponenteId;
            proponenteElement.dataset.proponenteNumero = proponenteNumero;
            
            // Cabeçalho do card
            proponenteElement.innerHTML = `
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Contas FGTS - ${proponenteNome}</h5>
                    <button type="button" class="btn btn-sm btn-primary adicionar-conta-btn" data-proponente-id="${proponenteId}">
                        <i class="fas fa-plus me-1"></i> Nova Conta
                    </button>
                </div>
                <div class="card-body">
                    <div class="contas-container" id="contas-${proponenteId}">
                        <!-- As contas FGTS serão adicionadas aqui -->
                    </div>
                </div>
            `;
            
            // Adiciona o proponente ao container
            container.appendChild(proponenteElement);
            
            // Verifica se já existem contas para este proponente
            const contasExistentes = window.getContasFGTSByProponente(proponenteId);
            
            if (contasExistentes && contasExistentes.length > 0) {
                // Adiciona as contas existentes
                contasExistentes.forEach((conta, i) => {
                    this.adicionarContaFGTSNaInterface(proponenteId, conta, i + 1);
                });
            } else {
                // Adiciona uma conta em branco
                this.adicionarContaFGTSNaInterface(proponenteId, null, 1);
            }
        });
        
        // Adiciona listeners para os botões de adicionar conta
        document.querySelectorAll('.adicionar-conta-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const proponenteId = e.currentTarget.dataset.proponenteId;
                const contasContainer = document.getElementById(`contas-${proponenteId}`);
                const contaNumero = contasContainer.children.length + 1;
                
                this.adicionarContaFGTSNaInterface(proponenteId, null, contaNumero);
            });
        });
    }
    
    /**
     * Adiciona uma conta FGTS na interface da etapa 5
     */
    adicionarContaFGTSNaInterface(proponenteId, conta, numero) {
        const contasContainer = document.getElementById(`contas-${proponenteId}`);
        
        // Clone o template da conta
        const contaTemplate = document.getElementById('conta-fgts-template').cloneNode(true);
        contaTemplate.id = '';
        contaTemplate.style.display = 'block';
        
        // Atualiza o número da conta
        contaTemplate.querySelector('.conta-numero-label').textContent = `Conta FGTS ${numero}`;
        
        // Adiciona um ID para a conta
        contaTemplate.dataset.contaId = `conta-${proponenteId}-${numero}`;
        
        // Preenche os dados se existirem
        if (conta) {
            contaTemplate.querySelector('.conta-situacao').value = conta.situacao || '';
            contaTemplate.querySelector('.conta-estabelecimento').value = conta.estabelecimento || '';
            contaTemplate.querySelector('.conta-numero').value = conta.numero || '';
            contaTemplate.querySelector('.conta-sureg').value = conta.sureg || '';
            contaTemplate.querySelector('.conta-empregador').value = conta.empregador || '';
            contaTemplate.querySelector('.conta-valor').value = conta.valor || '';
        }
        
        // Adiciona um listener para o botão de remover
        contaTemplate.querySelector('.remover-conta-btn').addEventListener('click', (e) => {
            // Verifica se é a única conta
            if (contasContainer.children.length > 1) {
                // Animação de remoção
                contaTemplate.style.transition = 'all 0.3s ease';
                contaTemplate.style.opacity = '0';
                contaTemplate.style.transform = 'translateY(10px)';
                
                setTimeout(() => {
                    contaTemplate.remove();
                    
                    // Renumera as contas
                    Array.from(contasContainer.children).forEach((contaEl, idx) => {
                        contaEl.querySelector('.conta-numero-label').textContent = `Conta FGTS ${idx + 1}`;
                        contaEl.dataset.contaId = `conta-${proponenteId}-${idx + 1}`;
                    });
                    
                    // Atualiza os dados no estado
                    window.atualizarContasFGTS();
                }, 300);
            } else {
                this.showStatus("Pelo menos uma conta FGTS deve ser mantida para cada proponente.", "warning");
            }
        });
        
        // Adiciona listeners para os campos da conta
        contaTemplate.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('change', () => {
                window.atualizarContasFGTS();
            });
        });
        
        // Adiciona a conta ao container
        contasContainer.appendChild(contaTemplate);
        
        // Atualiza os dados no estado
        window.atualizarContasFGTS();
    }
    
    /**
     * Gera o resumo da operação para a etapa de confirmação
     */
    generateSummary() {
        const resumoContainer = document.getElementById('resumoOperacao');
        const formatCurrency = value => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
        
        // Dados básicos da operação
        const operacao = {
            id: document.getElementById('dealId').textContent,
            nome: document.getElementById('dealName').textContent,
            cliente: document.getElementById('contactName').textContent,
            valorFinanciamento: document.getElementById('valorFinanciamento').textContent,
            valorCompraVenda: document.getElementById('valorCompraVenda').textContent,
            valorFGTS: document.getElementById('valorFGTSDebitar').textContent,
            tipoProcessamento: document.querySelector('.bot-option.selected h6').textContent,
            agencia: document.getElementById('fgtsAgencia').value,
            contrato: document.getElementById('fgtsContrato').value,
            matricula: document.getElementById('fgtsMatriculaImovel').value,
            tipoComplemento: document.getElementById('fgtsTipoComplemento').value,
            numeroComplemento: document.getElementById('fgtsNumeroComplemento').value,
            blocoTorre: document.getElementById('fgtsBlocoComplemento').value,
            bairro: document.getElementById('fgtsBairro').value
        };
        
        // Construir o HTML de resumo
        let html = `
            <div class="card mb-3">
                <div class="card-header bg-light">
                    <h6 class="mb-0">Dados da Operação</h6>
                </div>
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <p class="mb-1"><strong>ID:</strong> ${operacao.id}</p>
                            <p class="mb-1"><strong>Nome:</strong> ${operacao.nome}</p>
                            <p class="mb-1"><strong>Cliente:</strong> ${operacao.cliente}</p>
                            <p class="mb-3"><strong>Processamento:</strong> ${operacao.tipoProcessamento}</p>
                            
                            <p class="mb-1"><strong>Valor Financiamento:</strong> ${operacao.valorFinanciamento}</p>
                            <p class="mb-1"><strong>Valor Compra/Venda:</strong> ${operacao.valorCompraVenda}</p>
                            <p class="mb-1"><strong>Valor FGTS a Debitar:</strong> ${operacao.valorFGTS}</p>
                        </div>
                        <div class="col-md-6">
                            <p class="mb-1"><strong>Agência:</strong> ${operacao.agencia}</p>
                            <p class="mb-1"><strong>Contrato:</strong> ${operacao.contrato}</p>
                            <p class="mb-1"><strong>Matrícula:</strong> ${operacao.matricula}</p>
                            <p class="mb-1"><strong>Tipo:</strong> ${operacao.tipoComplemento}</p>
                            <p class="mb-1"><strong>Nº Complemento:</strong> ${operacao.numeroComplemento || 'N/A'}</p>
                            <p class="mb-1"><strong>Bloco/Torre:</strong> ${operacao.blocoTorre || 'N/A'}</p>
                            <p class="mb-1"><strong>Bairro:</strong> ${operacao.bairro || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Adiciona resumo dos proponentes e suas contas
        const proponentes = document.querySelectorAll('#proponentesContainer .proponente-card');
        let totalFGTS = 0;
        
        proponentes.forEach((proponente, index) => {
            const nome = proponente.querySelector('.proponente-nome').value;
            const cpf = proponente.querySelector('.proponente-cpf').value;
            const proponenteId = proponente.dataset.id || `proponente-${index + 1}`;
            
            // Obtém as contas FGTS deste proponente
            const contas = window.getContasFGTSByProponente(proponenteId);
            
            html += `
                <div class="card mb-3">
                    <div class="card-header bg-light">
                        <h6 class="mb-0">Proponente ${index + 1} - ${nome}</h6>
                    </div>
                    <div class="card-body">
                        <p class="mb-3"><strong>CPF:</strong> ${cpf}</p>
                        <h6 class="mb-2">Contas FGTS</h6>
                        <div class="table-responsive">
                            <table class="table table-sm table-bordered">
                                <thead class="table-light">
                                    <tr>
                                        <th>#</th>
                                        <th>Situação</th>
                                        <th>Estabelecimento</th>
                                        <th>Cód. Empregado</th>
                                        <th>SUREG</th>
                                        <th>Valor</th>
                                    </tr>
                                </thead>
                                <tbody>
            `;
            
            let proponenteTotal = 0;
            
            contas.forEach((conta, contaIdx) => {
                const valorConta = parseFloat(conta.valor) || 0;
                proponenteTotal += valorConta;
                totalFGTS += valorConta;
                
                html += `
                    <tr>
                        <td>${contaIdx + 1}</td>
                        <td>${conta.situacao}</td>
                        <td>${conta.estabelecimento}</td>
                        <td>${conta.numero}</td>
                        <td>${conta.sureg}</td>
                        <td class="text-end">${formatCurrency(valorConta)}</td>
                    </tr>
                `;
            });
            
            html += `
                                </tbody>
                                <tfoot class="table-light">
                                    <tr>
                                        <td colspan="5" class="text-end"><strong>Total do Proponente:</strong></td>
                                        <td class="text-end"><strong>${formatCurrency(proponenteTotal)}</strong></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            `;
        });
        
        // Adiciona o total geral
        html += `
            <div class="card">
                <div class="card-body bg-light">
                    <div class="d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">Valor Total FGTS a Debitar</h5>
                        <h5 class="mb-0 text-primary">${formatCurrency(totalFGTS)}</h5>
                    </div>
                </div>
            </div>
        `;
        
        // Atualiza o container com o resumo
        resumoContainer.innerHTML = html;
    }
    
    /**
     * Exibe mensagem de status
     */
    showStatus(message, type = 'info', autoHide = true) {
        const statusDiv = document.getElementById('status-envio');
        
        // Configura a classe correta para o tipo de mensagem
        statusDiv
            .removeClass('d-none alert-info alert-success alert-warning alert-danger')
            .addClass(`alert-${type === 'error' ? 'danger' : type}`)
            .html(message);
        
        // Auto-esconde a mensagem após um tempo, se solicitado
        if (autoHide) {
            setTimeout(() => {
                statusDiv.classList.add('d-none');
            }, 5000);
        }
    }
    
    /**
     * Marca um campo como inválido
     */
    markFieldAsInvalid(field, message) {
        field.classList.add('is-invalid');
        field.classList.remove('is-valid');
        
        // Verifica se já existe mensagem de erro
        let feedback = field.nextElementSibling;
        if (!feedback || !feedback.classList.contains('invalid-feedback')) {
            // Cria elemento de feedback
            feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            field.parentNode.insertBefore(feedback, field.nextSibling);
        }
        
        feedback.textContent = message;
    }
    
    /**
     * Marca um campo como válido
     */
    markFieldAsValid(field) {
        field.classList.remove('is-invalid');
        field.classList.add('is-valid');
    }
    
    /**
     * Exibe todos os erros de validação da etapa atual
     */
    showValidationErrors() {
        // Mostra mensagem geral
        this.showStatus(`Por favor, corrija os erros indicados antes de continuar.`, 'danger');
        
        // Foca no primeiro campo inválido
        const firstInvalidField = document.querySelector(`#step${this.currentStep} .is-invalid`);
        if (firstInvalidField) {
            firstInvalidField.focus();
            window.scrollTo({
                top: firstInvalidField.getBoundingClientRect().top + window.pageYOffset - 100,
                behavior: 'smooth'
            });
        }
    }
    
    /**
     * Valida um CPF
     */
    isValidCPF(cpf) {
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
}

// Inicializa o controlador do wizard quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    window.wizardController = new WizardController();
});
