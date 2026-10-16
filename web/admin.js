/* 
 * admin.js 
 * Lógica do Painel Administrativo: Busca usuários pendentes, resumo de vendas e renderiza os gráficos do Dashboard.
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
        userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('active');
        });
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

    // 4. Carrega os usuários pendentes
    carregarUsuariosPendentes();

    // 5. Carrega o resumo de vendas no painel
    carregarResumoDashboard();

    // 6. Carrega os gráficos do dashboard
    carregarGraficosDashboard();
});

async function carregarUsuariosPendentes() {
    const tabela = document.getElementById('tabelaUsuarios');
    const contador = document.getElementById('contadorPendentes');

    try {
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
                <td class="px-6 py-4 text-sm text-right">
                    <div class="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-2">
                        <button onclick="aprovarUsuario(${user.id})" class="inline-flex justify-center items-center px-3 py-1.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-md hover:bg-green-200 font-medium transition-colors">
                            Aprovar
                        </button>
                        <button onclick="rejeitarUsuario(${user.id})" class="inline-flex justify-center items-center px-3 py-1.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-md hover:bg-red-200 font-medium transition-colors">
                            Rejeitar
                        </button>
                    </div>
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

async function carregarResumoDashboard() {
    try {
        const response = await fetch('https://3.21.52.233.nip.io/api/vendas/resumo');
        if (response.ok) {
            const dados = await response.json();
            const cardVendasHoje = document.getElementById('valorVendasHoje');
            if (cardVendasHoje) {
                cardVendasHoje.textContent = `R$ ${dados.vendas_hoje.toFixed(2).replace('.', ',')}`;
            }
        }
    } catch (error) {
        console.error('Erro ao carregar resumo de vendas:', error);
    }
}

async function carregarGraficosDashboard() {
    try {
        const response = await fetch('https://3.21.52.233.nip.io/api/vendas/graficos');
        if (!response.ok) return;
        const data = await response.json();

        // 1. Gráfico de Pagamentos (Rosca / Doughnut)
        const ctxPag = document.getElementById('graficoPagamentos').getContext('2d');
        new Chart(ctxPag, {
            type: 'doughnut',
            data: {
                labels: data.pagamentos.labels.length > 0 ? data.pagamentos.labels : ['Sem Vendas'],
                datasets: [{
                    data: data.pagamentos.valores.length > 0 ? data.pagamentos.valores : [1],
                    backgroundColor: ['#F5C71A', '#3B82F6', '#10B981', '#EF4444']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } }
            }
        });

        // 2. Gráfico de Evolução (Linha)
        const ctxEvol = document.getElementById('graficoEvolucao').getContext('2d');
        new Chart(ctxEvol, {
            type: 'line',
            data: {
                labels: data.evolucao.labels.length > 0 ? data.evolucao.labels : ['Hoje'],
                datasets: [{
                    label: 'Total de Vendas (R$)',
                    data: data.evolucao.valores.length > 0 ? data.evolucao.valores : [0],
                    borderColor: '#F5C71A',
                    backgroundColor: 'rgba(245, 199, 26, 0.1)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });

    } catch (err) {
        console.error("Erro ao carregar gráficos:", err);
    }
}