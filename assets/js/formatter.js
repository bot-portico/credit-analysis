/**
 * Formata valores monetários enquanto o usuário digita
 * @param {string} value - Valor atual do campo
 * @returns {string} - Valor formatado
 */
function formatMoney(value) {
    const digits = value.replace(/\D/g, '');
    const digitsAsNumber = parseInt(digits) / 100;
    return digitsAsNumber.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

/**
 * Formata datas para exibição
 * @param {string} dateString - Data no formato ISO (YYYY-MM-DD)
 * @returns {string} - Data formatada (DD/MM/YYYY)
 */
function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

/**
 * Formata telefones enquanto o usuário digita
 * @param {string} value - Valor atual do campo
 * @returns {string} - Telefone formatado
 */
function formatPhone(value) {
    const digits = value.replace(/\D/g, '');
    
    if (digits.length <= 2) {
        return `(${digits}`;
    } else if (digits.length <= 6) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    } else if (digits.length <= 10) {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    } else {
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
    }
}

/**
 * Converte valores formatados para números
 * @param {string} formattedValue - Valor formatado
 * @returns {number} - Valor numérico
 */
function parseMoneyToNumber(formattedValue) {
    return parseFloat(formattedValue.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '')) || 0;
}

// Adicionar máscara aos campos monetários quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    // Aplicar máscara em todos os campos com classe money-input
    document.querySelectorAll('.money-input').forEach(function(input) {
        input.addEventListener('input', function() {
            const cursorPosition = this.selectionStart;
            const originalLength = this.value.length;
            
            this.value = formatMoney(this.value);
            
            // Ajustar posição do cursor após formatação
            const newLength = this.value.length;
            const newPosition = cursorPosition + (newLength - originalLength);
            this.setSelectionRange(newPosition, newPosition);
        });
    });
    
    // Aplicar máscara no telefone
    const phoneInput = document.getElementById('telefone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            this.value = formatPhone(this.value);
        });
    }
});
