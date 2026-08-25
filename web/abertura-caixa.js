/*
 * abertura-caixa.js
 * Lógica para registrar o troco inicial e liberar a tela do PDV.
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Verificação de Segurança (Proteger a Rota)
    const token = localStorage.getItem('tokenCantina');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // (Opcional) Simular busca do nome do operador no token/API
    const spanNome = document.getElementById('nomeOperador');
    if (spanNome) {
        spanNome.textContent = "Colaborador"; // Aqui a API devolveria o nome real
    }

    // 2. Lógica de Logout
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('tokenCantina');
            window.location.href = 'index.html';
        });
    }

    // 3. Submissão do Formulário de Abertura
    const aberturaForm = document.getElementById('aberturaForm');
    const feedback = document.getElementById('feedbackMessage');
    const btnAbrirCaixa = document.getElementById('btnAbrirCaixa');

    if (aberturaForm) {
        aberturaForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            const valorInicial = parseFloat(document.getElementById('valorInicial').value);

            if (isNaN(valorInicial) || valorInicial < 0) {
                feedback.textContent = 'Por favor, insira um valor válido (maior ou igual a zero).';
                feedback.className = 'mt-4 text-center text-sm text-red-600 dark:text-red-400 block';
                return;
            }

            btnAbrirCaixa.textContent = 'Abrindo caixa...';
            btnAbrirCaixa.disabled = true;
            feedback.classList.add('hidden');

            try {
                /*
                 * Integração com a API
                 * const response = await fetch('https://api-da-karol.onrender.com/api/caixa/abrir', {
                 *     method: 'POST',
                 *     headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                 *     body: JSON.stringify({ valor_inicial: valorInicial })
                 * });
                 */

                // Simulação de sucesso (Mock)
                setTimeout(() => {
                    // Salva no LocalStorage que o caixa está aberto para este turno
                    localStorage.setItem('caixaAberto', 'true');
                    localStorage.setItem('fundoCaixa', valorInicial.toFixed(2));
                    
                    feedback.textContent = 'Caixa aberto com sucesso! Carregando PDV...';
                    feedback.className = 'mt-4 text-center text-sm font-semibold text-green-600 dark:text-green-400 block';
                    
                    // Redireciona para a tela principal de vendas
                    window.location.href = 'pdv.html';
                }, 800); // Pequeno atraso para simular requisição

            } catch (error) {
                console.error('Erro na requisição HTTP:', error);
                feedback.textContent = 'Erro de conexão com o servidor. Tente novamente.';
                feedback.className = 'mt-4 text-center text-sm text-red-600 dark:text-red-400 block';
                btnAbrirCaixa.textContent = 'Confirmar e Abrir PDV';
                btnAbrirCaixa.disabled = false;
            }
        });
    }
});