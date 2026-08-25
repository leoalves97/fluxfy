/*
 * script.js
 * Arquivo responsável pela lógica de front-end e comunicação HTTP com a API.
 */

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const btnGoogle = document.getElementById('btnGoogle');
    const feedback = document.getElementById('feedbackMessage');
    const emailInput = document.getElementById('email'); 

    if (emailInput) {
        emailInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^a-zA-Z0-9.\-_@]/g, '');
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            const email = emailInput.value.trim();
            const password = document.getElementById('password').value;
            const btnSubmit = document.getElementById('btnSubmit');

            // SIMULAÇÃO PROVISÓRIA DE LOGIN (Apague quando a API estiver pronta)
            if (email === "testeadm@fluxfy.com" && password === "123456") {
            localStorage.setItem('tokenCantina', 'token-falso-de-teste');
            window.location.href = 'admin.html';
            return; // O return impede que o código continue e tente chamar a API
            } else if (email === "testecaixa@fluxfy.com" && password === "123456") {
                localStorage.setItem('tokenCantina', 'token-colaborador');
                window.location.href = 'abertura-caixa.html';
                return; 
            }

            const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

            if (!emailRegex.test(email)) {
                feedback.textContent = 'Por favor, insira um e-mail com formato válido.';
                feedback.className = 'mt-4 text-center text-sm text-red-600 dark:text-red-400 block';
                emailInput.classList.add('border-red-500', 'ring-red-500', 'focus:ring-red-500', 'focus:border-red-500');
                emailInput.classList.remove('border-gray-300', 'focus:ring-fluxfy-yellow', 'focus:border-fluxfy-yellow', 'dark:border-gray-600');
                return;
            }

            emailInput.classList.remove('border-red-500', 'ring-red-500', 'focus:ring-red-500', 'focus:border-red-500');
            emailInput.classList.add('border-gray-300', 'focus:ring-fluxfy-yellow', 'focus:border-fluxfy-yellow', 'dark:border-gray-600');

            btnSubmit.textContent = 'Processando...';
            btnSubmit.disabled = true;
            feedback.classList.add('hidden');

            try {
                const response = await fetch('https://api-da-karol.onrender.com/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email, password: password })
                });

                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem('tokenCantina', data.token);
                    feedback.textContent = 'Login aprovado! Redirecionando...';
                    feedback.className = 'mt-4 text-center text-sm text-green-600 dark:text-green-400 block';
                    window.location.href = '/admin.html'; 
                } else {
                    let errorMessage = 'Erro ao processar o login. Tente novamente.';
                    if (response.status === 404) {
                        errorMessage = 'Cadastro não localizado. Verifique o e-mail ou solicite acesso.';
                    } else if (response.status === 401) {
                        errorMessage = 'E-mail e senha não conferem.';
                    } else if (response.status === 403) {
                        errorMessage = 'Acesso negado: Seu cadastro ainda aguarda aprovação do administrador.';
                    }
                    feedback.textContent = errorMessage;
                    feedback.className = 'mt-4 text-center text-sm text-red-600 dark:text-red-400 block';
                }
            } catch (error) {
                console.error('Erro na requisição HTTP:', error);
                feedback.textContent = 'Erro de conexão com o servidor. Verifique sua internet ou tente novamente em instantes.';
                feedback.className = 'mt-4 text-center text-sm text-red-600 dark:text-red-400 block';
            } finally {
                btnSubmit.textContent = 'Entrar com E-mail';
                btnSubmit.disabled = false;
            }
        });
    }

    if (btnGoogle) {
        btnGoogle.addEventListener('click', () => {
            feedback.textContent = 'Redirecionando para os servidores do Google...';
            feedback.className = 'mt-4 text-center text-sm text-blue-600 dark:text-blue-400 block';
            alert('A integração real com o Google OAuth será conectada à API nesta etapa.');
        });
    }
});