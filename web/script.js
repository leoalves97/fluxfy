/*
 * script.js
 * Arquivo responsável pela lógica de front-end e comunicação HTTP com a API.
 */

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const feedback = document.getElementById('feedbackMessage');
    const emailInput = document.getElementById('email');

    // --- LÓGICA DO POPUP DO GOOGLE AUTH ---
    const params = new URLSearchParams(window.location.search);
    const authStatus = params.get('auth_status');

    if (authStatus) {
        // Verifica se essa tela foi aberta por outra (ou seja, se é um pop-up)
        if (window.opener) {
            // Envia os dados para a tela principal
            window.opener.postMessage({
                type: 'GOOGLE_AUTH_RESULT',
                status: authStatus,
                email: params.get('email')
            }, '*');

            // Fecha o pop-up
            window.close();
            return; // Para a execução do script aqui dentro do pop-up
        }
    }

    // A tela principal fica escutando as mensagens que chegam do Pop-up
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'GOOGLE_AUTH_RESULT') {
            if (event.data.status === 'pendente') {
                feedback.textContent = 'Cadastro via Google realizado! Aguardando aprovação do administrador.';
                feedback.className = 'mt-4 text-center text-sm text-yellow-600 dark:text-yellow-400 block';
                feedback.classList.remove('hidden');
            }
            else if (event.data.status === 'sucesso') {
                feedback.textContent = `Login aprovado para ${event.data.email}! Redirecionando...`;
                feedback.className = 'mt-4 text-center text-sm text-green-600 dark:text-green-400 block';
                feedback.classList.remove('hidden');

                setTimeout(() => {
                    window.location.href = 'admin.html';
                }, 2000);
            }
        }
    });

    // Captura o clique no botão para abrir o Pop-up
    const btnGoogle = document.getElementById('btnGoogle');
    if (btnGoogle) {
        btnGoogle.addEventListener('click', () => {
            // Configurações para abrir a janela centralizada
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

    if (loginForm) {
        loginForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            const email = emailInput.value.trim();
            const password = document.getElementById('password').value;
            const btnSubmit = document.getElementById('btnSubmit');

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
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email, password: password })
                });

                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem('tokenCantina', data.token);
                    feedback.textContent = 'Login aprovado! Redirecionando...';
                    feedback.className = 'mt-4 text-center text-sm text-green-600 dark:text-green-400 block';
                    window.location.href = 'admin.html';
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

});