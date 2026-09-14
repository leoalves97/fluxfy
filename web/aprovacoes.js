/*
 * aprovacoes.js
 * Lógica da tela de aprovações: Filtros por cards, listagem e ações em dropdown expansível.
 */

let filtroAtual = 'todos';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Verificação de Segurança
    const token = localStorage.getItem('tokenCantina');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // 2. Logout
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('tokenCantina');
            window.location.href = 'index.html';
        });
    }

    // 3. Fechar todos os dropdowns de ação ao clicar fora deles
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.action-dropdown-container')) {
            document.querySelectorAll('.action-dropdown-menu').forEach(menu => {
                menu.classList.add('hidden');
            });
        }
    });

    // 4. Carrega os dados iniciais
    carregarUsuarios(filtroAtual);
});

// Função global para alternar o filtro através dos cards
window.filtrar = function (tipo) {
    filtroAtual = tipo;

    // Atualiza o título visual da tabela
    const titulo = document.getElementById('tituloTabela');
    if (tipo === 'todos') titulo.textContent = 'Lista de Usuários (Todos)';
    if (tipo === 'pendentes') titulo.textContent = 'Usuários Pendentes de Aprovação';
    if (tipo === 'aprovados') titulo.textContent = 'Usuários Aprovados';

    carregarUsuarios(filtroAtual);
};

// Função global para abrir/fechar o menu de ações específico da linha
window.toggleAcoesMenu = function (id, event) {
    event.stopPropagation();

    // Fecha qualquer outro menu aberto
    document.querySelectorAll('.action-dropdown-menu').forEach(menu => {
        if (menu.id !== `acoes-menu-${id}`) {
            menu.classList.add('hidden');
        }
    });

    // Alterna o menu atual
    const menuAtual = document.getElementById(`acoes-menu-${id}`);
    if (menuAtual) {
        menuAtual.classList.toggle('hidden');
    }
};

// Busca os usuários na API considerando o filtro selecionado
async function carregarUsuarios(filtro) {
    const tabela = document.getElementById('tabelaUsuarios');
    const contadorTotal = document.getElementById('contadorTotal');
    const contadorPendentes = document.getElementById('contadorPendentes');
    const contadorAprovados = document.getElementById('contadorAprovados');

    try {
        const response = await fetch(`https://3.21.52.233.nip.io/api/usuarios?filtro=${filtro}`);
        if (!response.ok) throw new Error('Erro ao buscar dados da API');

        const data = await response.json();

        // Atualiza os contadores dos cards no topo
        contadorTotal.textContent = data.estatisticas.total;
        contadorPendentes.textContent = data.estatisticas.pendentes;
        contadorAprovados.textContent = data.estatisticas.aprovados;

        tabela.innerHTML = '';

        if (data.usuarios.length === 0) {
            tabela.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        Nenhum usuário encontrado para este filtro.
                    </td>
                </tr>`;
            return;
        }

        data.usuarios.forEach(user => {
            const tr = document.createElement('tr');
            tr.className = "hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors";

            // Formata a data de solicitação corretamente
            const dataExibicao = user.data_criacao ? new Date(user.data_criacao).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : '-';

            // Define os emblemas visuais de status e papel
            const statusBadge = user.aprovado
                ? '<span class="px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">Aprovado</span>'
                : '<span class="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">Pendente</span>';

            const papelBadge = user.papel === 'admin'
                ? '<span class="px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-full ml-1">Admin</span>'
                : '<span class="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 rounded-full ml-1">Operador</span>';

            tr.innerHTML = `
                <td class="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">${user.nome}</td>
                <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">${user.email}</td>
                <td class="px-6 py-4 text-sm">
                    <div class="flex flex-wrap gap-1.5 items-center">
                        ${statusBadge}
                        ${papelBadge}
                    </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">${dataExibicao}</td>
                <td class="px-6 py-4 text-sm text-right relative">
                    <!-- Botão de Ações / Dropdown -->
                    <div class="action-dropdown-container inline-block text-left">
                        <button onclick="toggleAcoesMenu(${user.id}, event)" class="inline-flex items-center justify-center px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md font-medium text-sm transition-colors">
                            Ações 
                            <svg class="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                        </button>
                        
                        <div id="acoes-menu-${user.id}" class="action-dropdown-menu hidden absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 dark:ring-gray-700 z-50 divide-y divide-gray-100 dark:divide-gray-700">
                            <div class="py-1">
                                ${!user.aprovado ? `<button onclick="aprovar(${user.id})" class="w-full text-left px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">Aprovar</button>` : ''}
                                <button onclick="alternarAdmin(${user.id})" class="w-full text-left px-4 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">
                                    ${user.papel === 'admin' ? 'Remover Admin' : 'Tornar Admin'}
                                </button>
                            </div>
                            <div class="py-1">
                                <button onclick="excluir(${user.id})" class="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center">Excluir</button>
                            </div>
                        </div>
                    </div>
                </td>
            `;
            tabela.appendChild(tr);
        });

    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        tabela.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-8 text-center text-red-500 dark:text-red-400">
                    Erro ao carregar dados do servidor.
                </td>
            </tr>`;
    }
}

// Funções de Ação (Aprovar, Alterar Papel Admin, Excluir)
window.aprovar = async function (id) {
    try {
        const res = await fetch(`https://3.21.52.233.nip.io/api/usuarios/${id}/aprovar`, { method: 'PATCH' });
        if (res.ok) carregarUsuarios(filtroAtual);
    } catch (err) {
        alert('Erro ao aprovar usuário');
    }
};

window.alternarAdmin = async function (id) {
    try {
        const res = await fetch(`https://3.21.52.233.nip.io/api/usuarios/${id}/admin`, { method: 'PATCH' });
        if (res.ok) carregarUsuarios(filtroAtual);
    } catch (err) {
        alert('Erro ao alterar papel do usuário');
    }
};

window.excluir = async function (id) {
    if (confirm('Tem certeza que deseja excluir/recusar este usuário?')) {
        try {
            const res = await fetch(`https://3.21.52.233.nip.io/api/usuarios/${id}`, { method: 'DELETE' });
            if (res.ok) carregarUsuarios(filtroAtual);
        } catch (err) {
            alert('Erro ao excluir usuário');
        }
    }
};