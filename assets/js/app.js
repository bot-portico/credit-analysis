// assets/js/app.js

document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
  // Verifica dados no localStorage
  const dataStr = localStorage.getItem('customerData');
  const cpf = localStorage.getItem('customerCPF');
  if (!dataStr || !cpf) {
    window.location.href = 'index.html';
    return;
  }

  const data = JSON.parse(dataStr);

  // Header
  document.getElementById('header-customer-name').textContent = data.personal.proponentes[0].nome;
  document.getElementById('header-customer-cpf').textContent = cpf;
  document.getElementById('customer-initials').textContent = data.personal.proponentes[0].nome.charAt(0);

  // Preenche blocos
  populatePersonal(data.personal.proponentes, cpf);
  populatePropertySim(data.property);
  populateSimulation(data.simulation);
  populateIncome(data.personal.proponentes);
  populateConstructor(data.constructor);

  // Busca endereço do empreendimento
  fetchEndereco(data.constructor.empreendimento);

  // Setup
  setupTabNavigation();
  setupNextArrow();
  setupFormValidations();
  setupSubmitButtons();

  // Esconde overlay
  document.getElementById('loading')?.classList.add('hidden');
}

function populatePersonal(proponentes, cpf) {
  // Primeiro proponente
  const p1 = proponentes[0];
  document.getElementById('nome').value = p1.nome;
  document.getElementById('cpf').value = cpf;
  document.getElementById('profissao1').value = p1.profissao;
  document.getElementById('renda1').value = formatMoney(p1.renda.toString());

  // Segundo proponente, se existir
  if (proponentes.length > 1) {
    const p2 = proponentes[1];
    const template = document.getElementById('proponente-template');
    const grid = document.querySelector('#section-personal .grid');
    const clone = template.content.cloneNode(true);
    grid.appendChild(clone);
    document.getElementById('nome2').value = p2.nome;
    document.getElementById('cpf2').value = p2.cpf;
    document.getElementById('profissao2').value = p2.profissao;
    document.getElementById('renda2').value = formatMoney(p2.renda.toString());
  }
}

function populatePropertySim(prop) {
  document.getElementById('valorCompraVenda').value = formatMoney(prop.valorCompraVenda.toString());
  document.getElementById('subsidio').value = formatMoney(prop.subsidio.toString());
  document.getElementById('valorFGTS').value = formatMoney(prop.valorFGTS.toString());
  document.getElementById('valorFinanciamento').value = formatMoney(prop.valorFinanciamento.toString());
  calculateRecursosProprios();
}

function populateSimulation(sim) {
  if (!sim) return;
  document.getElementById('statusAnalise').value = sim.statusAnalise || '';
  document.getElementById('prazoFinanciamento').value = sim.prazo || '';
  document.getElementById('dataVencimento').value = sim.dataVencimento || '';
  document.getElementById('sistemaAmortizacao').value = sim.sistemaAmortizacao || '';
  document.getElementById('indexador').value = sim.indexador || '';
  document.getElementById('parcelaInicial').value = formatMoney(sim.parcela.toString());
  document.getElementById('financiaCustas').checked = sim.financiaCustas;
  toggleCustasField();
  if (sim.financiaCustas) document.getElementById('valorCustas').value = formatMoney(sim.valorCustas.toString());
  document.getElementById('valorSiric').value = formatMoney(sim.valorSiric.toString());
  document.getElementById('modalidade').value = sim.modalidade || '';
}

function populateIncome(proponentes) {
  const total = proponentes.reduce((sum, p) => sum + (p.renda || 0), 0);
  document.getElementById('rendaFamiliar').value = formatMoney(total.toString());
}

function populateConstructor(cons) {
  document.getElementById('nomeConstrutora').value = cons.nome;
  document.getElementById('empreendimento').value = cons.empreendimento;
  document.getElementById('unidade').value = cons.unidade;
  document.getElementById('blocoTorre').value = cons.bloco;
}

function fetchEndereco(empreendimento) {
  fetch(`https://suportico.app.n8n.cloud/webhook-test/get-endereco?empreendimento=${encodeURIComponent(empreendimento)}`)
    .then(r => r.json())
    .then(json => {
      document.getElementById('enderecoEmpreendimento').value = json.enderecoCompleto;
    })
    .catch(console.error);
}

function calculateRecursosProprios() {
  const cv = parseMoneyToNumber(document.getElementById('valorCompraVenda').value);
  const sub = parseMoneyToNumber(document.getElementById('subsidio').value);
  const fgts = parseMoneyToNumber(document.getElementById('valorFGTS').value);
  const fin = parseMoneyToNumber(document.getElementById('valorFinanciamento').value);
  const recursos = cv - sub - fgts - fin;
  document.getElementById('recursosProprios').value = formatMoney(recursos.toString());
}

function setupFormValidations() {
  document.getElementById('valorCompraVenda').addEventListener('input', calculateRecursosProprios);
  document.getElementById('subsidio').addEventListener('input', calculateRecursosProprios);
  document.getElementById('valorFGTS').addEventListener('input', calculateRecursosProprios);
  // Toggle custas
  document.getElementById('financiaCustas').addEventListener('change', toggleCustasField);
}

function toggleCustasField() {
  const box = document.getElementById('custas-field');
  if (document.getElementById('financiaCustas').checked) box.classList.remove('hidden');
  else box.classList.add('hidden');
}

function setupTabNavigation() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(btn => btn.addEventListener('click', () => switchSection(btn.dataset.section)));
}

function switchSection(section) {
  document.querySelectorAll('main section').forEach(sec => sec.classList.add('hidden'));
  document.getElementById(`section-${section}`).classList.remove('hidden');
  updateProgressBar();
  // Atualiza active tab
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.section === section));
}

function setupNextArrow() {
  document.getElementById('next-section').addEventListener('click', () => {
    const tabs = Array.from(document.querySelectorAll('.tab-btn'));
    const currentIndex = tabs.findIndex(b => b.classList.contains('active'));
    const next = tabs[currentIndex+1] || tabs[0];
    switchSection(next.dataset.section);
  });
}

function updateProgressBar() {
  const sections = document.querySelectorAll('main section');
  const total = sections.length;
  const visible = Array.from(sections).filter(sec => !sec.classList.contains('hidden')).length;
  const percent = ((total - visible) / (total - 1)) * 100;
  document.getElementById('progress-bar').style.width = `${percent}%`;
}

function setupSubmitButtons() {
  const btns = [document.getElementById('submit-button'), document.getElementById('side-submit-button')];
  btns.forEach(btn => btn?.addEventListener('click', submitAnalysisHandler));
  document.getElementById('debitofgts')?.addEventListener('click', () => window.location.href = 'debito-fgts.html');
}

function submitAnalysisHandler() {
  document.getElementById('loading')?.classList.remove('hidden');
  // coletar dados simplificado
  const formData = { personal: {}, property: {}, simulation: {}, income: {}, constructor: {} };
  // ... montando o formData conforme IDs
  submitAnalysis(formData)
    .then(() => window.location.href = 'success.html')
    .catch(e => { alert(e.message); document.getElementById('loading')?.classList.add('hidden'); });
}
