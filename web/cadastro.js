/*
 * cadastro.js
 * Arquivo responsável pela lógica de solicitação de acesso.
 */

document.addEventListener('DOMContentLoaded', () => {
    const cadastroForm = document.getElementById('cadastroForm');
    const feedback = document.getElementById('feedbackMessage');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const btnGoogle = document.getElementById('btnGoogle');

    // --- LÓGICA DO POPUP DO GOOGLE AUTH ---

    //  A tela principal de cadastro fica escutando as mensagens do Pop-up
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'GOOGLE_AUTH_RESULT') {
            if (event.data.status === 'pendente') {
                feedback.textContent = 'Cadastro via Google realizado! Aguardando aprovação do administrador.';
                feedback.className = 'mt-4 text-center text-sm font-semibold text-yellow-600 dark:text-yellow-400 block';
                feedback.classList.remove('hidden');
            }
            else if (event.data.status === 'sucesso') {
                feedback.textContent = `Login aprovado para ${event.data.email}! Redirecionando para o painel...`;
                feedback.className = 'mt-4 text-center text-sm font-semibold text-green-600 dark:text-green-400 block';
                feedback.classList.remove('hidden');

                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 2000);
            }
        }
    });

    // Captura o clique no botão de cadastro para abrir o Pop-up
    if (btnGoogle) {
        btnGoogle.addEventListener('click', () => {
            const largura = 500;
            const altura = 600;
            const left = (screen.width - largura) / 2;
            const top = (screen.height - altura) / 2;

            window.open(
                '/api/auth/google/login',
                'GoogleAuthWindow',
                `width=${largura},height=${altura},top=${top},left=${left}`
            );
        });
    }

    if (emailInput) {
        emailInput.addEventListener('input', function () {
            this.value = this.value.replace(/[^a-zA-Z0-9.\-_@]/g, '');
        });
    }

    if (cadastroForm) {
        cadastroForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            const nome = document.getElementById('nome').value.trim();
            const email = emailInput.value.trim();
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;
            const btnSubmit = document.getElementById('btnSubmit');

            if (password !== confirmPassword) {
                feedback.textContent = 'As senhas não coincidem. Tente novamente.';
                feedback.className = 'mt-4 text-center text-sm text-red-600 dark:text-red-400 block';
                confirmPasswordInput.classList.add('border-red-500', 'ring-red-500');
                return;
            }
            confirmPasswordInput.classList.remove('border-red-500', 'ring-red-500');

            const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
            if (!emailRegex.test(email)) {
                feedback.textContent = 'Por favor, insira um e-mail com formato válido.';
                feedback.className = 'mt-4 text-center text-sm text-red-600 dark:text-red-400 block';
                emailInput.classList.add('border-red-500', 'ring-red-500');
                return;
            }
            emailInput.classList.remove('border-red-500', 'ring-red-500');

            btnSubmit.textContent = 'Enviando solicitação...';
            btnSubmit.disabled = true;
            feedback.classList.add('hidden');

            try {
                const response = await fetch('/api/cadastro', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome: nome, email: email, password: password })
                });

                if (response.ok) {
                    feedback.textContent = 'Solicitação enviada com sucesso! Aguarde a aprovação do administrador.';
                    feedback.className = 'mt-4 text-center text-sm font-semibold text-green-600 dark:text-green-400 block';
                    cadastroForm.reset();
                } else {
                    let errorMessage = 'Erro ao solicitar cadastro. Tente novamente.';
                    if (response.status === 409) {
                        errorMessage = 'Este e-mail já possui uma solicitação ou cadastro ativo.';
                    }
                    feedback.textContent = errorMessage;
                    feedback.className = 'mt-4 text-center text-sm text-red-600 dark:text-red-400 block';
                }
            } catch (error) {
                console.error('Erro na requisição HTTP:', error);
                feedback.textContent = 'Erro de conexão com o servidor. Tente novamente em instantes.';
                feedback.className = 'mt-4 text-center text-sm text-red-600 dark:text-red-400 block';
            } finally {
                btnSubmit.textContent = 'Solicitar Acesso com E-mail';
                btnSubmit.disabled = false;
            }
        });
    }

});