/*
 * script.js
 * Arquivo responsável pela lógica de front-end e comunicação HTTP com a API.
 */

const AuthConfig = {
    getUsuarioLogado: function() {
        try {
            const userData = localStorage.getItem('fluxfy_user');
            if (!userData) return null;
            return JSON.parse(userData);
        } catch (e) {
            return null;
        }
    },

    protegerRota: function(papeisPermitidos) {
        const token = localStorage.getItem('tokenCantina');
        const usuario = this.getUsuarioLogado();

        if (!token || !usuario || !papeisPermitidos.includes(usuario.papel)) {
            console.warn(`Acesso negado. Papel insuficiente ou usuário não logado.`);
            
            if (usuario && usuario.papel === 'operador') {
                window.location.replace('estoque.html'); 
            } else {
                window.location.replace('index.html'); 
            }
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const feedback = document.getElementById('feedbackMessage');
    const emailInput = document.getElementById('email');

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
                feedback.textContent = 'Por favor, insira um e-mail válido.';
                feedback.className = 'mt-4 text-center text-sm text-red-600 block';
                return;
            }
            
            btnSubmit.textContent = 'Processando...';
            btnSubmit.disabled = true;
            feedback.classList.add('hidden');
            
            try {
                const response = await fetch('https://3.21.52.233.nip.io/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email, password: password })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    
                    // ==========================================
                    // DEBUG PARA O DESENVOLVEDOR (Ver no F12 -> Console)
                    console.log("=== DEBUG DA API ===");
                    console.log("Resposta bruta da API:", data);
                    // ==========================================

                    localStorage.setItem('tokenCantina', data.token);
                    let role = "operador"; // Fallback seguro

                    // Tenta decodificar o token para achar a permissão
                    if (data.token) {
                        try {
                            const payloadBase64 = data.token.split('.')[1];
                            const payloadDecoded = JSON.parse(atob(payloadBase64)); 
                            console.log("Payload do Token JWT decodificado:", payloadDecoded);
                            
                            // Procura o papel em possíveis chaves
                            role = payloadDecoded.role || payloadDecoded.papel || payloadDecoded.tipo || "operador";
                        } catch (e) {
                            console.warn("Aviso: O token não é um JWT padrão ou está sem payload legível.");
                        }
                    }

                    // ==========================================
                    // BYPASS TEMPORÁRIO PARA TESTES FRONTEND
                    // Substitua 'admin@admin.com' pelo e-mail que você usa para testar o painel
                    if (email === 'admin@admin.com' || email === 'admin@fluxfy.com') {
                        console.warn("Bypass ativado: Forçando acesso de Admin para este e-mail.");
                        role = 'admin';
                    }
                    // ==========================================
                    
                    localStorage.setItem('fluxfy_user', JSON.stringify({ email: email, papel: role }));
                    
                    feedback.textContent = 'Login aprovado! Redirecionando...';
                    feedback.className = 'mt-4 text-center text-sm text-green-600 block';
                    
                    if (role === 'admin') {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'estoque.html';
                    }
                } else {
                    feedback.textContent = 'Acesso negado. Verifique credenciais.';
                    feedback.className = 'mt-4 text-center text-sm text-red-600 block';
                }
            } catch (error) {
                feedback.textContent = 'Erro de conexão com o servidor.';
                feedback.className = 'mt-4 text-center text-sm text-red-600 block';
            } finally {
                btnSubmit.textContent = 'Entrar com E-mail';
                btnSubmit.disabled = false;
            }
        });
    }
});