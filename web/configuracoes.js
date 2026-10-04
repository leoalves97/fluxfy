/*
 * configuracoes.js
 * Gerenciamento e persistência das configurações de negócio do Fluxfy.
 */
document.addEventListener('DOMContentLoaded', () => {
    const configPadrao = {
        nomeEmpresa: "Minha Empresa",
        cnpjEmpresa: "",
        mensagemRecibo: "Obrigado pela preferência!",
        alertaEstoqueAtivo: true,
        limiteEstoqueBaixo: 5,
        alertaSangriaAtivo: true,
        valorLimiteSangria: 500.00
    };

    const configSalva = JSON.parse(localStorage.getItem('fluxfy_config')) || configPadrao;

    document.getElementById('nomeEmpresa').value = configSalva.nomeEmpresa;
    document.getElementById('cnpjEmpresa').value = configSalva.cnpjEmpresa;
    document.getElementById('mensagemRecibo').value = configSalva.mensagemRecibo;
    document.getElementById('alertaEstoqueAtivo').checked = configSalva.alertaEstoqueAtivo;
    document.getElementById('limiteEstoqueBaixo').value = configSalva.limiteEstoqueBaixo;
    document.getElementById('alertaSangriaAtivo').checked = configSalva.alertaSangriaAtivo;
    document.getElementById('valorLimiteSangria').value = parseFloat(configSalva.valorLimiteSangria).toFixed(2);

    const form = document.getElementById('formConfiguracoes');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const novasConfig = {
                nomeEmpresa: document.getElementById('nomeEmpresa').value.trim(),
                cnpjEmpresa: document.getElementById('cnpjEmpresa').value.trim(),
                mensagemRecibo: document.getElementById('mensagemRecibo').value.trim(),
                alertaEstoqueAtivo: document.getElementById('alertaEstoqueAtivo').checked,
                limiteEstoqueBaixo: parseInt(document.getElementById('limiteEstoqueBaixo').value),
                alertaSangriaAtivo: document.getElementById('alertaSangriaAtivo').checked,
                valorLimiteSangria: parseFloat(document.getElementById('valorLimiteSangria').value)
            };
            localStorage.setItem('fluxfy_config', JSON.stringify(novasConfig));
            alert('Configurações do sistema salvas com sucesso!');
        });
    }

    renderizarCategorias();
});

function obterCategorias() {
    const defaultCategorias = [
        { nome: 'Bebidas', ativa: true }, 
        { nome: 'Lanches', ativa: true }, 
        { nome: 'Sobremesas', ativa: true }
    ];
    let salvas = JSON.parse(localStorage.getItem('fluxfy_categorias')) || defaultCategorias;
    
    // Tratamento de compatibilidade para formatos antigos (array de strings)
    if (salvas.length > 0 && typeof salvas[0] === 'string') {
        salvas = salvas.map(c => ({ nome: c, ativa: true }));
    }
    return salvas;
}

function salvarCategorias(categorias) {
    localStorage.setItem('fluxfy_categorias', JSON.stringify(categorias));
}

window.adicionarCategoria = function() {
    const input = document.getElementById('novaCategoria');
    const nome = input.value.trim();
    
    if (!nome) return;

    let categorias = obterCategorias();
    
    if (categorias.some(c => c.nome.toLowerCase() === nome.toLowerCase())) {
        alert('Esta categoria já existe!');
        return;
    }

    categorias.push({ nome: nome, ativa: true });
    salvarCategorias(categorias);
    input.value = '';
    renderizarCategorias();
}

window.alternarStatusCategoria = function(index) {
    let categorias = obterCategorias();
    categorias[index].ativa = !categorias[index].ativa;
    salvarCategorias(categorias);
    renderizarCategorias();
}

window.removerCategoria = function(index) {
    let categorias = obterCategorias();
    const nome = categorias[index].nome;
    if (confirm(`Deseja realmente remover a categoria "${nome}"?`)) {
        categorias.splice(index, 1);
        salvarCategorias(categorias);
        renderizarCategorias();
    }
}

function renderizarCategorias() {
    const lista = document.getElementById('listaCategorias');
    const categorias = obterCategorias();
    
    lista.innerHTML = '';
    
    if (categorias.length === 0) {
        lista.innerHTML = `<li class="p-4 text-sm text-gray-500 text-center dark:text-gray-400">Nenhuma categoria cadastrada.</li>`;
        return;
    }

    categorias.forEach((cat, index) => {
        const li = document.createElement('li');
        li.className = `flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${cat.ativa ? '' : 'opacity-60'}`;
        
        const badgeClass = cat.ativa ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400";
        const badgeText = cat.ativa ? "Ativa" : "Inativa";

        li.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="font-medium text-gray-800 dark:text-gray-200 ${!cat.ativa ? 'line-through' : ''}">${cat.nome}</span>
                <span class="text-xs px-2 py-1 rounded-full font-semibold ${badgeClass}">${badgeText}</span>
            </div>
            <div class="flex gap-2">
                <button onclick="alternarStatusCategoria(${index})" class="text-sm px-3 py-1 rounded-md transition-colors ${cat.ativa ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-500' : 'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-500'}">
                    ${cat.ativa ? 'Desativar' : 'Ativar'}
                </button>
                <button onclick="removerCategoria(${index})" class="text-sm text-red-500 hover:text-red-700 bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-md transition-colors">Excluir</button>
            </div>
        `;
        lista.appendChild(li);
    });
}