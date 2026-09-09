/* 
 * estoque.js 
 * Lógica do Gerenciamento de Estoque: Integração com a API, contadores e modais.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Verificação de Segurança (Proteger a Rota)
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

    // 4. Carregar os dados de estoque ao iniciar
    carregarEstoque();
});

// Função para buscar e renderizar o estoque da API
async function carregarEstoque() {
    const tabela = document.getElementById('tabelaEstoque');
    const totalProdutos = document.getElementById('totalProdutos');
    const totalBaixoEstoque = document.getElementById('totalBaixoEstoque');
    const valorTotalEstoque = document.getElementById('valorTotalEstoque');

    try {
        const response = await fetch('https://3.21.52.233.nip.io/api/produtos');
        if (!response.ok) throw new Error('Erro ao buscar estoque da API');

        const produtosEstoque = await response.json();
        tabela.innerHTML = '';

        let qtdBaixa = 0;
        let valorTotal = 0;

        if (produtosEstoque.length === 0) {
            tabela.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">Nenhum produto cadastrado no estoque.</td></tr>`;
            totalProdutos.textContent = 0;
            totalBaixoEstoque.textContent = 0;
            valorTotalEstoque.textContent = 'R$ 0,00';
            return;
        }

        produtosEstoque.forEach(prod => {
            const qtd = Number(prod.qtd);
            const preco = Number(prod.preco);
            valorTotal += qtd * preco;
            if (qtd <= 5) qtdBaixa++;

            const statusBadge = qtd > 5
                ? '<span class="px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">Normal</span>'
                : '<span class="px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">Baixo</span>';

            const tr = document.createElement('tr');
            tr.className = "hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors";
            tr.innerHTML = `
                <td class="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">${prod.nome}</td>
                <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">${prod.categoria}</td>
                <td class="px-6 py-4 text-sm font-semibold text-gray-800 dark:text-gray-200">${qtd} un.</td>
                <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">R$ ${preco.toFixed(2)}</td>
                <td class="px-6 py-4 text-sm">${statusBadge}</td>
                <td class="px-6 py-4 text-sm text-right space-x-2">
                    <button onclick="excluirProduto(${prod.id})" class="px-3 py-1.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-md hover:bg-red-200 font-medium transition-colors">Excluir</button>
                </td>
            `;
            tabela.appendChild(tr);
        });

        totalProdutos.textContent = produtosEstoque.length;
        totalBaixoEstoque.textContent = qtdBaixa;
        valorTotalEstoque.textContent = `R$ ${valorTotal.toFixed(2)}`;

    } catch (error) {
        console.error('Erro:', error);
        tabela.innerHTML = `<tr><td colspan="6" class="px-6 py-8 text-center text-red-500 dark:text-red-400">Erro ao carregar dados do servidor. Verifique a API.</td></tr>`;
    }
}

// Funções de Controle do Modal
window.abrirModalProduto = function () {
    document.getElementById('modalTitulo').textContent = 'Novo Produto';
    document.getElementById('formProduto').reset();
    document.getElementById('produtoId').value = '';
    document.getElementById('modalProduto').classList.remove('hidden');
}

window.fecharModalProduto = function () {
    document.getElementById('modalProduto').classList.add('hidden');
}

// Submissão do Formulário de Cadastro via API
document.addEventListener('submit', async (e) => {
    if (e.target && e.target.id === 'formProduto') {
        e.preventDefault();
        const nome = document.getElementById('nomeProduto').value.trim();
        const categoria = document.getElementById('categoriaProduto').value.trim();
        const qtd = parseInt(document.getElementById('qtdProduto').value);
        const preco = parseFloat(document.getElementById('precoProduto').value);

        try {
            const res = await fetch('https://3.21.52.233.nip.io/api/produtos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, categoria, qtd, preco })
            });

            if (res.ok) {
                fecharModalProduto();
                carregarEstoque();
            } else {
                alert('Erro ao salvar produto no banco de dados.');
            }
        } catch (err) {
            console.error('Erro de conexão:', err);
            alert('Erro de conexão com o servidor.');
        }
    }
});

// Função para Excluir Produto
window.excluirProduto = async function (id) {
    if (confirm('Deseja realmente excluir este produto do estoque?')) {
        try {
            const res = await fetch(`https://3.21.52.233.nip.io/api/produtos/${id}`, { method: 'DELETE' });
            if (res.ok) {
                carregarEstoque();
            } else {
                alert('Erro ao excluir produto.');
            }
        } catch (err) {
            console.error('Erro de conexão:', err);
            alert('Erro de conexão com o servidor.');
        }
    }
}

// Filtro de pesquisa de produtos em tempo real na tabela
document.addEventListener('input', (e) => {
    if (e.target && e.target.id === 'filtroProduto') {
        const termo = e.target.value.toLowerCase();
        const linhas = document.querySelectorAll('#tabelaEstoque tr');
        linhas.forEach(linha => {
            const texto = linha.textContent.toLowerCase();
            linha.style.display = texto.includes(termo) ? '' : 'none';
        });
    }
});