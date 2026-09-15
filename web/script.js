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
        } catch (e) { return null; }
    },
    protegerRota: function(papeisPermitidos) {
        const token = localStorage.getItem('tokenCantina');
        const usuario = this.getUsuarioLogado();
        
        // Em ambiente de desenvolvimento local, relaxamos a proteção temporariamente se não houver usuário definido
        const isLocalhost = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost';
        
        if (!token || !usuario || !papeisPermitidos.includes(usuario.papel)) {
            if (isLocalhost && !usuario) {
                console.warn("Proteger Rota: Ignorado devido ao ambiente de desenvolvimento (localhost).");
                return;
            }
            
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

    // --- Lógica do "Olhinho" da Senha ---
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            const icon = this.querySelector('svg');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />';
            } else {
                input.type = 'password';
                icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />';
            }
        });
    });

    if (emailInput) {
        emailInput.addEventListener('input', function () {
            this.value = this.value.replace(/[^a-zA-Z0-9.\-_@]/g, '');
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            const email = emailInput.value.trim().toLowerCase();
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
                    localStorage.setItem('tokenCantina', data.token);
                    
                    // ==========================================
                    // BYPASS DE ACESSO PARA DESENVOLVIMENTO
                    // ==========================================
                    const emailsAdmin = [ 
                        'admin@fluxfy.com'
                    ];
                    
                    let role = "operador";
                    
                    // Verifica se o email digitado está na lista de administradores
                    if (emailsAdmin.includes(email)) {
                        console.warn(`Bypass ativado: Acesso de Admin concedido para ${email}`);
                        role = "admin";
                    } else if (data.token) {
                        // Tenta extrair a role do JWT caso não seja bypass
                        try {
                            const payloadBase64 = data.token.split('.')[1];
                            const payloadDecoded = JSON.parse(atob(payloadBase64)); 
                            role = payloadDecoded.role || payloadDecoded.papel || "operador";
                        } catch (e) {}
                    }
                    // ==========================================
                    
                    localStorage.setItem('fluxfy_user', JSON.stringify({ email: email, papel: role }));
                    
                    feedback.textContent = 'Login aprovado! Redirecionando...';
                    feedback.className = 'mt-4 text-center text-sm text-green-600 block';
                    
                    window.location.href = role === 'admin' ? 'admin.html' : 'estoque.html';
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