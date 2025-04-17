/**
 * Simula busca de dados do cliente com base no CPF
 * Em produção, esta função faria uma requisição real ao Ploomes
 * @param {string} cpf - CPF do cliente
 * @returns {Promise} - Promise com os dados do cliente
 */
function fetchCustomerData(cpf) {
    return new Promise((resolve, reject) => {
        // Simulação de atraso na resposta (como uma chamada real de API)
        setTimeout(() => {
            // Em produção, esta seria uma chamada real à API
            // fetch('https://api.ploomes.com/clientes?cpf=' + cpf, {
            //     headers: {
            //         'User-Key': 'SUA_CHAVE_API_PLOOMES'
            //     }
            // })
            
            // Dados simulados para demonstração
            const mockData = {
                personal: {
                    nome: 'Maria Oliveira Santos',
                    dataNascimento: '1985-06-15',
                    rg: '28.123.456-7',
                    email: 'maria.oliveira@email.com',
                    telefone: '(11) 98765-4321'
                },
                property: {
                    valorImovel: 560000,
                    valorCompraVenda: 550000,
                    subsidio: 20000,
                    valorFinanciamento: 530000,
                    utilizaFGTS: true,
                    valorFGTS: 40000
                },
                simulation: {
                    sistemaAmortizacao: 'PRICE',
                    indexador: 'IPCA',
                    prazo: 360,
                    parcela: 4250.75
                },
                income: {
                    rendaTotal: 15000,
                    tipoRenda: ['Renda Principal', 'Renda Complementar']
                },
                constructor: {
                    nome: 'Construtora Horizonte',
                    empreendimento: 'Residencial Villa Verde',
                    unidade: 'Bloco A - Apto 502'
                }
            };
            
            resolve(mockData);
            
            // Simular erro (para teste)
            // reject(new Error('Erro ao buscar dados do cliente'));
        }, 1500);
    });
}

/**
 * Simula envio de dados para o Ploomes e SAP
 * Em produção, esta função enviaria os dados reais
 * @param {Object} formData - Dados do formulário
 * @returns {Promise} - Promise com resultado do envio
 */
function submitAnalysis(formData) {
    return new Promise((resolve, reject) => {
        // Simulação de atraso na resposta (como uma chamada real de API)
        setTimeout(() => {
            console.log('Dados enviados:', formData);
            
            // Em produção, esta seria uma chamada real à API
            // fetch('https://sua-api-n8n.com/webhook/analise-credito', {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json'
            //     },
            //     body: JSON.stringify(formData)
            // })
            
            // Simulação de sucesso
            resolve({
                success: true,
                message: 'Análise enviada com sucesso!',
                protocol: 'AC-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0')
            });
            
            // Simular erro (para teste)
            // reject(new Error('Erro ao enviar análise'));
        }, 2000);
    });
}