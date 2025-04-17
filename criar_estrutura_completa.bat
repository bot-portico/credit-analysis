@echo off
setlocal EnableDelayedExpansion

REM ----------------------------
REM 1) Definir pasta raiz
set "ROOT=C:\Users\gusta\Downloads\SuPortico\credit-analysis"

REM ----------------------------
REM 2) Criar diretórios
md "%ROOT%"           >nul 2>&1
md "%ROOT%\assets\css" >nul 2>&1
md "%ROOT%\assets\js"  >nul 2>&1
md "%ROOT%\assets\img" >nul 2>&1

REM ----------------------------
REM 3) index.html (Login CPF)
(
  echo ^<!DOCTYPE html^>
  echo ^<html lang="pt-BR"^>
  echo ^<head^>
  echo     ^<meta charset="UTF-8"^>
  echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
  echo     ^<title^>Análise de Crédito - Login^</title^>
  echo     ^<link href="assets/css/tailwind.min.css" rel="stylesheet"^>
  echo     ^<link href="assets/css/main.css" rel="stylesheet"^>
  echo     ^<script src="https://unpkg.com/framer-motion@10.12.16/dist/framer-motion.js"^>^</script^>
  echo ^</head^>
  echo ^<body class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50"^>
  echo     ^<div id="cpf-entry" class="flex flex-col items-center justify-center min-h-screen p-6"^>
  echo         ^<div class="w-full max-w-md"^>
  echo             ^<div class="text-center mb-10"^>
  echo                 ^<div class="inline-block p-3 rounded-full bg-blue-600 text-white mb-4"^>
  echo                     ^<svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"^>
  echo                         ^<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"^>^</path^>
  echo                     ^</svg^>
  echo                 ^</div^>
  echo                 ^<h1 class="text-3xl font-bold text-gray-800 mb-2"^>Análise de Crédito^</h1^>
  echo                 ^<p class="text-gray-600"^>Informe o CPF para começarmos^</p^>
  echo             ^</div^>
  echo ^
  echo             ^<div class="bg-white rounded-2xl shadow-xl overflow-hidden"^>
  echo                 ^<div class="p-8"^>
  echo                     ^<div class="mb-6"^>
  echo                         ^<label class="block text-sm font-medium text-gray-700 mb-2" for="cpf"^>CPF do Cliente^</label^>
  echo                         ^<input type="text" id="cpf" placeholder="000.000.000-00" maxlength="14" class="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg transition-all"^> 
  echo                     ^</div^>
  echo ^
  echo                     ^<button id="fetch-data-btn" class="w-full py-3 px-4 rounded-lg text-white font-medium text-lg transition-all bg-gray-400 cursor-not-allowed" disabled^>Consultar^</button^>
  echo                 ^</div^>
  echo             ^</div^>
  echo         ^</div^>
  echo     ^</div^>
  echo ^
  echo     ^<div id="loading" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"^>
  echo         ^<div class="bg-white p-5 rounded-lg flex items-center"^>
  echo             ^<svg class="animate-spin h-5 w-5 text-blue-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"^>
  echo                 ^<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"^>^</circle^>
  echo                 ^<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"^>^</path^>
  echo             ^</svg^>
  echo             ^<span^>Consultando dados...^</span^>
  echo         ^</div^>
  echo     ^</div^>
  echo ^
  echo     ^<script src="assets/js/cpf-validator.js"^>^</script^>
  echo     ^<script src="assets/js/integration.js"^>^</script^>
  echo     ^<script^>
  echo         document.addEventListener('DOMContentLoaded', function() {
  echo             const cpfInput = document.getElementById('cpf');
  echo             const fetchButton = document.getElementById('fetch-data-btn');
  echo             cpfInput.addEventListener('input', function() {
  echo                 this.value = formatCPF(this.value);
  echo                 if (isValidCPF(this.value)) {
  echo                     fetchButton.disabled = false;
  echo                     fetchButton.classList.remove('bg-gray-400', 'cursor-not-allowed');
  echo                     fetchButton.classList.add('bg-blue-600', 'hover:bg-blue-700');
  echo                 } else {
  echo                     fetchButton.disabled = true;
  echo                     fetchButton.classList.add('bg-gray-400', 'cursor-not-allowed');
  echo                     fetchButton.classList.remove('bg-blue-600', 'hover:bg-blue-700');
  echo                 }
  echo             });
  echo             fetchButton.addEventListener('click', function() {
  echo                 const cpf = cpfInput.value;
  echo                 if (!isValidCPF(cpf)) return;
  echo                 document.getElementById('loading').classList.remove('hidden');
  echo                 fetchCustomerData(cpf)
  echo                     .then(data => {
  echo                         localStorage.setItem('customerData', JSON.stringify(data));
  echo                         localStorage.setItem('customerCPF', cpf);
  echo                         window.location.href = 'dashboard.html';
  echo                     })
  echo                     .catch(error => {
  echo                         console.error('Erro ao buscar dados:', error);
  echo                         alert('Erro ao buscar dados do cliente. Por favor, tente novamente.');
  echo                         document.getElementById('loading').classList.add('hidden');
  echo                     });
  echo             });
  echo         });
  echo     ^</script^>
  echo ^</body^>
  echo ^</html^>
)>"%ROOT%\index.html"

REM ----------------------------
REM 4) dashboard.html
(
  echo ^<!DOCTYPE html^>
  echo ^<html lang="pt-BR"^>
  echo ^<head^>
  echo     ^<meta charset="UTF-8"^>
  echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
  echo     ^<title^>Análise de Crédito - Dashboard^</title^>
  echo     ^<link href="assets/css/tailwind.min.css" rel="stylesheet"^>
  echo     ^<link href="assets/css/main.css" rel="stylesheet"^>
  echo ^</head^>
  echo ^<body class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50"^>
  echo     ^<header class="bg-gradient-to-r from-blue-600 to-indigo-700 text-white"^>
  echo         ^<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"^>
  echo             ^<div class="flex justify-between items-center py-4"^>
  echo                 ^<div class="flex items-center"^>
  echo                     ^<svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"^>
  echo                         ^<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"^>^</path^>
  echo                     ^</svg^>
  echo                     ^<h1 class="ml-3 text-xl font-bold"^>Análise de Crédito ^| ^<span id="header-customer-name"^>Carregando...^</span^>^</h1^>
  echo                 ^</div^>
  echo                 ^<div class="flex items-center space-x-4"^>
  echo                     ^<div class="text-sm"^>
  echo                         ^<span class="block text-white text-opacity-70"^>CPF^</span^>
  echo                         ^<span class="font-medium" id="header-customer-cpf"^>000.000.000-00^</span^>
  echo                     ^</div^>
  echo                     ^<div class="h-10 w-10 rounded-full bg-white text-blue-700 flex items-center justify-center font-bold" id="customer-initials"^>C^</div^>
  echo                 ^</div^>
  echo             ^</div^>
  echo         ^</div^>
  echo     ^</header^>
  echo ^
  echo     ^<div class="bg-white shadow"^>
  echo         ^<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"^>
  echo             ^<div class="flex overflow-x-auto py-3 gap-1" id="section-tabs"^>
  echo                 ^<button class="px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all bg-blue-100 text-blue-700 font-medium" data-section="personal"^>👤 Dados Pessoais^</button^>
  echo                 ^<button class="px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all text-gray-700 hover:bg-gray-100" data-section="property"^>🏠 Imóvel^</button^>
  echo                 ^<button class="px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all text-gray-700 hover:bg-gray-100" data-section="simulation"^>📊 Simulação^</button^>
  echo                 ^<button class="px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all text-gray-700 hover:bg-gray-100" data-section="income"^>💰 Renda^</button^>
  echo                 ^<button class="px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all text-gray-700 hover:bg-gray-100" data-section="constructor"^>🏗️ Construtora^</button^>
  echo                 ^<button class="px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all text-gray-700 hover:bg-gray-100" data-section="summary"^>📋 Resumo^</button^>
  echo             ^</div^>
  echo         ^</div^>
  echo     ^</div^>
  echo ^
  echo     ^<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"^>
  echo         ^<div class="grid grid-cols-1 lg:grid-cols-3 gap-8"^>
  echo             ^<div class="lg:col-span-2"^>
  echo                 ^<div id="section-personal" class="bg-white rounded-xl shadow-md overflow-hidden section-content"^>
  echo                     ^<div class="p-6"^>
  echo                         ^<h2 class="text-xl font-bold text-gray-800 mb-6"^>Dados Pessoais^</h2^>
  echo                         ^<div class="grid grid-cols-1 md:grid-cols-2 gap-6"^>
  echo                             ^<div^>
  echo                                 ^<label class="block text-sm font-medium text-gray-700 mb-1"^>Nome Completo^</label^>
  echo                                 ^<input type="text" id="nome" class="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"^> 
  echo                             ^</div^>
  echo                             ^<div^>
  echo                                 ^<label class="block text-sm font-medium text-gray-700 mb-1"^>CPF^</label^>
  echo                                 ^<input type="text" id="cpf" disabled class="w-full px-3 py-2 rounded-lg border bg-gray-50"^> 
  echo                             ^</div^>
  echo                             ^<div^>
  echo                                 ^<label class="block text-sm font-medium text-gray-700 mb-1"^>Data de Nascimento^</label^>
  echo                                 ^<input type="date" id="dataNascimento" class="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"^>
  echo                             ^</div^>
  echo                             ^<div^>
  echo                                 ^<label class="block text-sm font-medium text-gray-700 mb-1"^>RG^</label^>
  echo                                 ^<input type="text" id="rg" class="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"^>
  echo                             ^</div^>
  echo                             ^<div^>
  echo                                 ^<label class="block text-sm font-medium text-gray-700 mb-1"^>E-mail^</label^>
  echo                                 ^<input type="email" id="email" class="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"^>
  echo                             ^</div^>
  echo                             ^<div^>
  echo                                 ^<label class="block text-sm font-medium text-gray-700 mb-1"^>Telefone^</label^>
  echo                                 ^<input type="text" id="telefone" class="w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500"^>
  echo                             ^</div^>
  echo                         ^</div^>
  echo                     ^</div^>
  echo                 ^</div^>
  echo                 ^<div id="section-property" class="bg-white rounded-xl shadow-md overflow-hidden section-content hidden"^>
  echo                     ^<div class="p-6"^>
  echo                         ^<h2 class="text-xl font-bold text-gray-800 mb-6"^>Dados do Imóvel^</h2^>
  echo                         ^<div class="grid grid-cols-1 md:grid-cols-2 gap-6"^>
  echo                             ^<div^>
  echo                                 ^<label class="block text-sm font-medium text-gray-700 mb-1"^>Valor do Imóvel^</label^>
  echo                                 ^<div class="relative"^>
  echo                                     ^<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"^>
  echo                                         ^<span class="text-gray-500"^>R$^</span^>
  echo                                     ^</div^>
  echo                                     ^<input type="text" id="valorImovel" class="w-full pl-10 pr-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 money-input"^>
  echo                                 ^</div^>
  echo                             ^</div^>
  echo                             ^<div^>
  echo                                 ^<label class="block text-sm font-medium text-gray-700 mb-1"^>Valor de Compra e Venda^</label^>
  echo                                 ^<div class="relative"^>
  echo                                     ^<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"^>
  echo                                         ^<span class="text-gray-500"^>R$^</span^>
  echo                                     ^</div^>
  echo                                     ^<input type="text" id="valorCompraVenda" class="w-full pl-10 pr-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 money-input"^>
  echo                                 ^</div^>
  echo                             ^</div^>
  echo                             ^<div^>
  echo                                 ^<label class="block text-sm font-medium text-gray-700 mb-1"^>Subsídio^</label^>
  echo                                 ^<div class="relative"^>
  echo                                     ^<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"^>
  echo                                         ^<span class="text-gray-500"^>R$^</span^>
  echo                                     ^</div^>
  echo                                     ^<input type="text" id="subsidio" class="w-full pl-10 pr-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 money-input"^>
  echo                                 ^</div^>
  echo                             ^</div^>
  echo                             ^<div^>
  echo                                 ^<label class="block text-sm font-medium text-gray-700 mb-1"^>Valor de Financiamento^</label^>
  echo                                 ^<div class="relative"^>
  echo                                     ^<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"^>
  echo                                         ^<span class="text-gray-500"^>R$^</span^>
  echo                                     ^</div^>
  echo                                     ^<input type="text" id="valorFinanciamento" class="w-full pl-10 pr-3 py-2 rounded-lg border bg-gray-50 money-input" readonly^>
  echo                                 ^</div^>
  echo                             ^</div^>
  echo                             ^<div class="md:col-span-2"^>
  echo                                 ^<div class="flex items-center mb-4"^>
  echo                                     ^<input type="checkbox" id="utilizaFGTS" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"^>
  echo                                     ^<label for="utilizaFGTS" class="ml-2 block text-sm text-gray-700"^>Haverá utilização de FGTS?^</label^>
  echo                                 ^</div^>
  echo                                 ^<div id="fgts-fields" class="ml-6 hidden"^>
  echo                                     ^<label class="block text-sm font-medium text-gray-700 mb-1"^>Valor de FGTS^</label^>
  echo                                     ^<div class="relative"^>
  echo                                         ^<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"^>
  echo                                             ^<span class="text-gray-500"^>R$^</span^>
  echo                                         ^</div^>
  echo                                         ^<input type="text" id="valorFGTS" class="w-full pl-10 pr-3 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 money-input"^>
  echo                                     ^</div^>
  echo                                 ^</div^>
  echo                             ^</div^>
  echo                         ^</div^>
  echo                     ^</div^>
  echo                 ^</div^>
  echo                 ^<div id="section-summary" class="bg-white rounded-xl shadow-md overflow-hidden section-content hidden"^>
  echo                     ^<div class="p-6"^>
  echo                         ^<h2 class="text-xl font-bold text-gray-800 mb-6"^>Resumo da Análise^</h2^>
  echo                         ^<div class="space-y-6"^>
  echo                             ^<div^>
  echo                                 ^<h3 class="text-md font-semibold text-gray-700 mb-3 pb-2 border-b"^>Cliente^</h3^>
  echo                                 ^<div class="grid grid-cols-2 gap-4"^>
  echo                                     ^<div^>
  echo                                         ^<p class="text-xs text-gray-500"^>Nome^</p^>
  echo                                         ^<p class="text-sm font-medium" id="summary-nome"^>-^</p^>
  echo                                     ^</div^>
  echo                                     ^<div^>
  echo                                         ^<p class="text-xs text-gray-500"^>CPF^</p^>
  echo                                         ^<p class="text-sm font-medium" id="summary-cpf"^>-^</p^>
  echo                                     ^</div^>
  echo                                 ^</div^>
  echo                             ^</div^>
  echo                             ^<div class="pt-4 mt-8"^>
  echo                                 ^<div class="flex justify-center"^>
  echo                                     ^<button id="submit-button" class="px-8 py-3 rounded-lg text-white font-medium text-lg transition-all bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"^>Enviar para Ploomes & SAP^</button^>
  echo                                 ^</div^>
  echo                             ^</div^>
  echo                         ^</div^>
  echo                     ^</div^>
  echo                 ^</div^>
  echo             ^</div^>
  echo             ^<div class="lg:col-span-1"^>
  echo                 ^<div class="bg-white rounded-xl shadow-md overflow-hidden sticky top-6"^>
  echo                     ^<div class="p-6"^>
  echo                         ^<div class="flex justify-between items-center mb-6"^>
  echo                             ^<h3 class="text-lg font-bold text-gray-800"^>Resumo Rápido^</h3^>
  echo                             ^<div class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"^>Pré-aprovado^</div^>
  echo                         ^</div^>
  echo                         ^<div class="mb-6"^>
  echo                             ^<div class="w-full bg-gray-200 rounded-full h-2"^>
  echo                                 ^<div id="progress-bar" class="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full" style="width: 0%"^>^</div^>
  echo                             ^</div^>
  echo                             ^<div class="flex justify-between text-xs text-gray-500 mt-1"^>
  echo                                 ^<span^>Início^</span^>
  echo                                 ^<span^>Resumo^</span^>
  echo                             ^</div^>
  echo                         ^</div^>
  echo                         ^<div class="border-t pt-4 pb-4"^>
  echo                             ^<div class="flex items-center mb-3"^>
  echo                                 ^<span class="text-blue-500 mr-2"^>👤^</span^>
  echo                                 ^<h4 class="text-sm font-medium text-gray-700"^>Cliente^</h4^>
  echo                             ^</div^>
  echo                             ^<p class="text-sm font-medium" id="side-nome"^>-^</p^>
  echo                             ^<p class="text-xs text-gray-500" id="side-cpf"^>-^</p^>
  echo                         ^</div^>
  echo                         ^<div class="border-t pt-4"^>
  echo                             ^<div class="flex items-center mb-3"^>
  echo                                 ^<span class="text-blue-500 mr-2"^>⚡^</span^>
  echo                                 ^<h4 class="text-sm font-medium text-gray-700"^>Ações Rápidas^</h4^>
  echo                             ^</div^>
  echo                             ^<div class="space-y-2"^>
  echo                                 ^<button class="w-full py-2 px-3 text-sm text-left text-blue-700 hover:bg-blue-50 rounded-lg transition-colors" data-section="summary"^>Ver resumo completo^</button^>
  echo                                 ^<button id="side-submit-button" class="w-full py-2 px-3 text-sm text-left text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"^>Enviar análise agora^</button^>
  echo                             ^</div^>
  echo                         ^</div^>
  echo                     ^</div^>
  echo                 ^</div^>
  echo             ^</div^>
  echo         ^</div^>
  echo     ^</div^>
  echo ^
  echo     ^<div id="loading" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"^>
  echo         ^<div class="bg-white p-5 rounded-lg flex items-center"^>
  echo             ^<svg class="animate-spin h-5 w-5 text-blue-600 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"^>
  echo                 ^<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"^>^</circle^>
  echo                 ^<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"^>^</path^>
  echo             ^</svg^>
  echo             ^<span^>Processando dados...^</span^>
  echo         ^</div^>
  echo     ^</div^>
  echo ^
  echo     ^<script src="assets/js/formatter.js"^>^</script^>
  echo     ^<script src="assets/js/integration.js"^>^</script^>
  echo     ^<script src="assets/js/app.js"^>^</script^>
  echo ^</body^>
  echo ^</html^>
)>"%ROOT%\dashboard.html"

REM ----------------------------
REM 5) success.html
(
  echo ^<!DOCTYPE html^>
  echo ^<html lang="pt-BR"^>
  echo ^<head^>
  echo     ^<meta charset="UTF-8"^>
  echo     ^<meta name="viewport" content="width=device-width, initial-scale=1.0"^>
  echo     ^<title^>Análise de Crédito - Sucesso^</title^>
  echo     ^<link href="assets/css/tailwind.min.css" rel="stylesheet"^>
  echo     ^<link href="assets/css/main.css" rel="stylesheet"^>
  echo ^</head^>
  echo ^<body class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50"^>
  echo     ^<div class="flex flex-col items-center justify-center min-h-screen p-6"^>
  echo         ^<div class="w-full max-w-md text-center"^>
  echo             ^<div class="bg-white rounded-2xl shadow-xl overflow-hidden"^>
  echo                 ^<div class="p-8"^>
  echo                     ^<div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"^>
  echo                         ^<svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"^>
  echo                             ^<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"^>^</path^>
  echo                         ^</svg^>
  echo                     ^</div^>
  echo                     ^<h2 class="text-2xl font-bold text-gray-800 mb-2"^>Análise Enviada com Sucesso!^</h2^>
  echo                     ^<p class="text-gray-600 mb-6"^>Sua análise de crédito para ^<span id="success-customer-name"^>o cliente^</span^> foi enviada com sucesso para o Ploomes e o SAP.^</p^>
  echo                     ^<div class="bg-gray-50 p-4 rounded-lg mb-6"^>
  echo                         ^<p class="text-sm text-gray-500 mb-1"^>Número do protocolo^</p^>
  echo                         ^<p class="text-lg font-medium text-gray-800" id="protocol-number"^>AC-0000^</p^>
  echo                     ^</div^>
  echo                     ^<div class="flex flex-col space-y-3"^>
  echo                         ^<button id="new-analysis-btn" class="w-full py-3 px-4 rounded-lg text-white font-medium bg-blue-600 hover:bg-blue-700 transition-all"^>Nova Análise^</button^>
  echo                         ^<button id="ploomes-btn" class="w-full py-3 px-4 rounded-lg text-blue-700 font-medium border border-blue-300 hover:bg-blue-50 transition-all"^>Ver Detalhes no Ploomes^</button^>
  echo                     ^</div^>
  echo                 ^</div^>
  echo             ^</div^>
  echo         ^</div^>
  echo     ^</div^>
  echo ^
  echo     ^<script^>
  echo         document.addEventListener('DOMContentLoaded', function() {
  echo             const customerData = JSON.parse(localStorage.getItem('customerData'));
  echo             if (customerData && customerData.personal && customerData.personal.nome) {
  echo                 document.getElementById('success-customer-name').textContent = customerData.personal.nome;
  echo             }
  echo             const protocolNumber = 'AC-' + Math.floor(Math.random() * 10000).toString().padStart(4,'0');
  echo             document.getElementById('protocol-number').textContent = protocolNumber;
  echo             document.getElementById('new-analysis-btn').addEventListener('click', function(){
  echo                 localStorage.removeItem('customerData');
  echo                 localStorage.removeItem('customerCPF');
  echo                 window.location.href = 'index.html';
  echo             });
  echo             document.getElementById('ploomes-btn').addEventListener('click', function(){
  echo                 alert('Em produção redirecionaria para o registro no Ploomes.');
  echo             });
  echo         });
  echo     ^</script^>
  echo ^</body^>
  echo ^</html^>
)>"%ROOT%\success.html"

REM ----------------------------
REM 6) assets/js/cpf-validator.js
(
  echo /**^
  echo  * Formata um CPF enquanto o usuário digita^
  echo  * @param {string} value - Valor atual do campo^
  echo  * @returns {string} - CPF formatado^
  echo  **/^
  echo function formatCPF(value) {^
  echo     const digits = value.replace(/\\D/g, '');^
  echo     if (digits.length <= 3) { return digits; }^
  echo     else if (digits.length <= 6) { return `^%1`s??  ^^ nope
)>"%ROOT%\assets\js\cpf-validator.js"

endlocal
echo.
echo Todos os arquivos foram criados em %ROOT%
exit /b 0
