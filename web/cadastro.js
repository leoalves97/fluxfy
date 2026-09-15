/*
 * cadastro.js
 * Arquivo responsável pela lógica de solicitação de acesso e validação de senhas.
 */
document.addEventListener('DOMContentLoaded', () => {
    const cadastroForm = document.getElementById('cadastroForm');
    const feedback = document.getElementById('feedbackMessage');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    // Elementos da Força da Senha
    const strengthContainer = document.getElementById('password-strength-container');
    const strengthBar = document.getElementById('password-strength-bar');
    const strengthText = document.getElementById('password-strength-text');
    const matchText = document.getElementById('password-match-text');

    // --- Lógica do "Olhinho" das Senhas ---
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

    // --- Lógica da Força da Senha ---
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            const val = this.value;
            
            // Mostra o container se houver texto
            if (val.length > 0) {
                strengthContainer.classList.remove('hidden');
            } else {
                strengthContainer.classList.add('hidden');
                return;
            }

            let score = 0;
            if (val.match(/[a-zA-Z]/)) score += 1; // Tem letra
            if (val.match(/[0-9]/)) score += 1;    // Tem número
            if (val.match(/[^a-zA-Z0-9]/)) score += 1; // Tem caractere especial
            if (val.match(/[A-Z]/) && val.match(/[a-z]/)) score += 1; // Letra maiúscula e minúscula
            if (val.length >= 8) score += 1; // Tem 8 caracteres ou mais

            // Reseta classes
            strengthBar.className = 'h-full transition-all duration-300';
            
            if (score <= 2) {
                strengthBar.classList.add('w-1/3', 'bg-red-500');
                strengthText.textContent = 'Fraca';
                strengthText.className = 'text-xs mt-1 font-medium text-red-500';
            } else if (score === 3 || score === 4) {
                strengthBar.classList.add('w-2/3', 'bg-yellow-500');
                strengthText.textContent = 'Média';
                strengthText.className = 'text-xs mt-1 font-medium text-yellow-500';
            } else {
                strengthBar.classList.add('w-full', 'bg-green-500');
                strengthText.textContent = 'Forte';
                strengthText.className = 'text-xs mt-1 font-medium text-green-500';
            }
            
            validarIgualdadeSenhas(); // Revalida se o usuário alterar a primeira senha depois
        });
    }

    // --- Lógica de Validação de Senhas Iguais ---
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', validarIgualdadeSenhas);
    }

    function validarIgualdadeSenhas() {
        const pwd = passwordInput.value;
        const conf = confirmPasswordInput.value;
        
        if (conf.length > 0) {
            matchText.classList.remove('hidden');
            if (pwd === conf) {
                matchText.textContent = 'As senhas conferem';
                matchText.className = 'text-xs mt-2 font-medium text-green-500 block';
            } else {
                matchText.textContent = 'As senhas não conferem';
                matchText.className = 'text-xs mt-2 font-medium text-red-500 block';
            }
        } else {
            matchText.classList.add('hidden');
        }
    }

    if (emailInput) {
        emailInput.addEventListener('input', function () {
            this.value = this.value.replace(/[^a-zA-Z0-9.\-_@]/g, '');
        });
    }

    // --- Submissão do Formulário ---
    if (cadastroForm) {
        cadastroForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            const nome = document.getElementById('nome').value.trim();
            const email = emailInput.value.trim().toLowerCase();
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
                const response = await fetch('https://3.21.52.233.nip.io/api/cadastro', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome: nome, email: email, password: password })
                });

                if (response.ok) {
                    feedback.textContent = 'Solicitação enviada com sucesso! Aguarde a aprovação.';
                    feedback.className = 'mt-4 text-center text-sm font-semibold text-green-600 dark:text-green-400 block';
                    cadastroForm.reset();
                    strengthContainer.classList.add('hidden');
                    matchText.classList.add('hidden');
                } else {
                    let errorMessage = 'Erro ao solicitar cadastro. Tente novamente.';
                    if (response.status === 409) errorMessage = 'Este e-mail já possui uma solicitação ou cadastro ativo.';
                    
                    feedback.textContent = errorMessage;
                    feedback.className = 'mt-4 text-center text-sm text-red-600 dark:text-red-400 block';
                }
            } catch (error) {
                feedback.textContent = 'Erro de conexão com o servidor. Tente novamente em instantes.';
                feedback.className = 'mt-4 text-center text-sm text-red-600 dark:text-red-400 block';
            } finally {
                btnSubmit.textContent = 'Solicitar Acesso com E-mail';
                btnSubmit.disabled = false;
            }
        });
    }
});