/*
 * perfil.js
 * Lógica da tela de perfil do usuário (edição de dados e segurança).
 */
document.addEventListener('DOMContentLoaded', () => {
    // Carrega os dados salvos do usuário logado no localStorage
    const usuario = AuthConfig.getUsuarioLogado();
    if (usuario) {
        document.getElementById('perfilEmail').value = usuario.email || '';
        document.getElementById('perfilPapel').value = usuario.papel === 'admin' ? 'Administrador' : 'Operador de Caixa';

        // Se houver nome salvo, preenche (ou usa o e-mail como base visual inicial)
        document.getElementById('perfilNome').value = usuario.nome || usuario.email.split('@')[0];
    }

    // Salvar alterações de perfil
    const formPerfil = document.getElementById('formPerfil');
    if (formPerfil) {
        formPerfil.addEventListener('submit', (e) => {
            e.preventDefault();
            const novoNome = document.getElementById('perfilNome').value.trim();

            // Atualiza no localStorage atual
            if (usuario) {
                usuario.nome = novoNome;
                localStorage.setItem('fluxfy_user', JSON.stringify(usuario));
            }
            alert('Alterações salvas com sucesso!');
        });
    }

    // Alteração de senha
    const formSenha = document.getElementById('formSenha');
    if (formSenha) {
        formSenha.addEventListener('submit', (e) => {
            e.preventDefault();
            const atual = document.getElementById('senhaAtual').value;
            const nova = document.getElementById('novaSenha').value;
            const confirma = document.getElementById('confirmaSenha').value;

            if (nova !== confirma) {
                alert('A nova senha e a confirmação não coincidem.');
                return;
            }

            if (nova.length < 6) {
                alert('A nova senha precisa ter pelo menos 6 caracteres.');
                return;
            }

            // Simulação de sucesso para este baby step (pode ser conectado à API posteriormente)
            alert('Senha alterada com sucesso!');
            formSenha.reset();
        });
    }
});