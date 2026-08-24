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
    const btnGoogleCadastro = document.getElementById('btnGoogleCadastro');

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
                const response = await fetch('http://127.0.0.1:8000/api/cadastro', {
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

    if (btnGoogleCadastro) {
        btnGoogleCadastro.addEventListener('click', () => {
            feedback.textContent = 'Redirecionando para os servidores do Google para identificação...';
            feedback.className = 'mt-4 text-center text-sm text-blue-600 dark:text-blue-400 block';
            alert('O fluxo de cadastro/login com Google será unificado pela API.');
        });
    }
});