/*
 * admin.js
 * Lógica do Painel Administrativo: Busca cadastros pendentes e gerencia aprovações.
 */

document.addEventListener('DOMContentLoaded', () => {

    // 1. Verificação de Segurança (Proteger a Rota)
    // Se não houver token no LocalStorage, chuta o usuário de volta para o login.
    const token = localStorage.getItem('tokenCantina');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // 2. Lógica de Logout
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('tokenCantina');
            window.location.href = 'index.html';
        });
    }

    // 3. Renderização da Tabela de Usuários Pendentes
    carregarUsuariosPendentes();
});

/**
 * Função que busca os usuários pendentes na API
 */
async function carregarUsuariosPendentes() {
    const tabela = document.getElementById('tabelaUsuarios');
    const contador = document.getElementById('contadorPendentes');

    try {
        // Faz a requisição para o Back-end
        const response = await fetch('http://3.21.52.233.nip.io:8000/api/usuarios/pendentes');

        // Valida se a requisição deu erro (caso servidor desligado por exemplo
        if (!response.ok) {
            throw new Error('Falha ao buscar os dados na API');
        }

        // Converte a resposta para um array de objetos JavaScript
        const usuariosReais = await response.json();

        tabela.innerHTML = '';

        //Se o array vier vazio, mostra mensagem e zera o contador
        if (usuariosReais.length === 0) {
            contador.textContent = '0';
            tabela.innerHTML = `
                <tr>
                    <td colspan="4" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        Nenhuma solicitação pendente no momento.
                    </td>
                </tr>`;
            return;
        }

        // Atualiza o número de pendentes no card do apinel
        contador.textContent = usuariosReais.length;

        // Percorre cada usuário que veio do banco de dados e cria a linha
        usuariosReais.forEach(user => {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors";

            // Tratativa caso a coluna de data ainda não exista
            const dataExibicao = user.data_criacao ? new Date(user.data_criacao).toLocaleDateString('pt-BR') : '-';

            tr.innerHTML = `
                <td class="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">${user.nome}</td>
                <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">${user.email}</td>
                <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">${dataExibicao}</td>
                <td class="px-6 py-4 text-sm text-right space-x-2">
                    <button onclick="aprovarUsuario(${user.id})" class="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-md hover:bg-green-200 dark:hover:bg-green-900/50 font-medium transition-colors">
                        Aprovar
                    </button>
                    <button onclick="rejeitarUsuario(${user.id})" class="inline-flex items-center px-3 py-1.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 font-medium transition-colors">
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

// Funções de ação (Devem fazer chamadas PUT/DELETE para a API posteriormente)
window.aprovarUsuario = function (id) {
    alert(`Usuário ID ${id} aprovado com sucesso! (Integração pendente)`);
    // Após aprovar, chama carregarUsuariosPendentes() novamente para atualizar a tabela
};

window.rejeitarUsuario = function (id) {
    if (confirm('Tem certeza que deseja rejeitar esta solicitação?')) {
        alert(`Usuário ID ${id} rejeitado! (Integração pendente)`);
    }
};