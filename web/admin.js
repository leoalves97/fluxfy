/*
 * admin.js
 * Lógica do Painel Administrativo: Busca os usuários pendentes na nova API unificada.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Verificação de Segurança
    const token = localStorage.getItem('tokenCantina');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // 2. Lógica do Menu Dropdown do Usuário
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');

    if (userMenuBtn && userDropdown) {
        // Alternar a exibição ao clicar no botão de perfil
        userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Impede que o clique se propague para o document
            userDropdown.classList.toggle('active');
        });

        // Fechar o dropdown ao clicar em qualquer lugar fora dele
        document.addEventListener('click', (e) => {
            if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.classList.remove('active');
            }
        });
    }

    // 3. Lógica de Logout
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('tokenCantina');
            window.location.href = 'index.html';
        });
    }

    // 3. Carrega os usuários pendentes
    carregarUsuariosPendentes();
});

async function carregarUsuariosPendentes() {
    const tabela = document.getElementById('tabelaUsuarios');
    const contador = document.getElementById('contadorPendentes');

    try {
        // Usa a nova rota filtrando apenas os pendentes
        const response = await fetch('https://3.21.52.233.nip.io/api/usuarios?filtro=pendentes');
        if (!response.ok) {
            throw new Error('Falha ao buscar os dados na API');
        }

        const data = await response.json();
        const usuariosPendentes = data.usuarios;

        tabela.innerHTML = '';
        contador.textContent = data.estatisticas.pendentes;

        if (usuariosPendentes.length === 0) {
            tabela.innerHTML = `
                <tr>
                    <td colspan="4" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        Nenhuma solicitação pendente no momento.
                    </td>
                </tr>`;
            return;
        }

        usuariosPendentes.forEach(user => {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors";

            // Formata a data de solicitação corrigida
            const dataExibicao = user.data_criacao ? new Date(user.data_criacao).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : '-';

            tr.innerHTML = `
                <td class="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">${user.nome}</td>
                <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">${user.email}</td>
                <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">${dataExibicao}</td>
                <td class="px-6 py-4 text-sm text-right space-x-2">
                    <button onclick="aprovarUsuario(${user.id})" class="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-md hover:bg-green-200 font-medium transition-colors">
                        Aprovar
                    </button>
                    <button onclick="rejeitarUsuario(${user.id})" class="inline-flex items-center px-3 py-1.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-md hover:bg-red-200 font-medium transition-colors">
                        Rejeitar
                    </button>
                </td>
            `;
            tabela.appendChild(tr);
        });

    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        tabela.innerHTML = `
            <tr>
                <td colspan="4" class="px-6 py-8 text-center text-red-500 dark:text-red-400">
                    Erro ao carregar os dados. Verifique a conexão com a API.
                </td>
            </tr>`;
    }
}

window.aprovarUsuario = async function (id) {
    try {
        const res = await fetch(`https://3.21.52.233.nip.io/api/usuarios/${id}/aprovar`, { method: 'PATCH' });
        if (res.ok) carregarUsuariosPendentes();
    } catch (err) {
        alert('Erro ao aprovar usuário');
    }
};

window.rejeitarUsuario = async function (id) {
    if (confirm('Tem certeza que deseja rejeitar esta solicitação?')) {
        try {
            const res = await fetch(`https://3.21.52.233.nip.io/api/usuarios/${id}`, { method: 'DELETE' });
            if (res.ok) carregarUsuariosPendentes();
        } catch (err) {
            alert('Erro ao rejeitar usuário');
        }
    }
};