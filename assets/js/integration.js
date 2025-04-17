/**
 * Busca dados do cliente via webhook n8n/Ploomes
 * @param {string} cpf - CPF formatado (000.000.000-00)
 * @returns {Promise<Object>} - Promise que resolve com os dados do cliente
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
 * Envia os dados do formulário para o webhook do n8n
 * @param {Object} formData - Dados coletados do formulário
 * @returns {Promise} - Promise que resolve com a resposta JSON do n8n
 */
function submitAnalysis(formData) {
    return fetch('https://suportico.app.n8n.cloud/webhook-test/analise-credito', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    })
    .then(async response => {
      if (!response.ok) {
        // captura status e texto de erro, se houver
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }
      return response.json();
    });
  }
  