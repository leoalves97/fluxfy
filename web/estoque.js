/*
 * estoque.js
 * Lógica do Gerenciamento de Estoque: Uploads Base64 Comprimidos, Relatórios PDF, Integração e Custos.
 */
let produtosLocais = [];

document.addEventListener('DOMContentLoaded', () => {
    carregarEstoque();
    configurarInputsDeImagem();
});

// Comprime a imagem no lado do cliente para evitar Payload Too Large na API
function configurarInputsDeImagem() {
    const inputNovo = document.getElementById('imagemUploadProduto');
    const inputAjuste = document.getElementById('ajusteImagemUpload');

    inputNovo.addEventListener('change', function() { 
        lerEComprimirImagem(this, 'imagemBase64Produto', 'previewNovoProduto'); 
    });
    inputAjuste.addEventListener('change', function() { 
        lerEComprimirImagem(this, 'ajusteImagemBase64', 'previewAjusteProduto'); 
    });
}

function lerEComprimirImagem(inputElement, hiddenElementId, previewElementId) {
    if (inputElement.files && inputElement.files[0]) {
        const file = inputElement.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                // Redimensiona para no máximo 500x500 mantendo proporção
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 500;
                const MAX_HEIGHT = 500;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Converte para JPEG com 70% de qualidade
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                
                document.getElementById(hiddenElementId).value = dataUrl;
                
                const preview = document.getElementById(previewElementId);
                preview.src = dataUrl;
                preview.classList.remove('hidden');
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function carregarCategoriasNosSelects() {
    const selectNovo = document.getElementById('categoriaProduto');
    const selectAjuste = document.getElementById('ajusteCategoria');
    
    const defaultCategorias = [
        { nome: 'Bebidas', ativa: true }, 
        { nome: 'Lanches', ativa: true }, 
        { nome: 'Sobremesas', ativa: true }
    ];
    
    let categorias = JSON.parse(localStorage.getItem('fluxfy_categorias')) || defaultCategorias;
    if (categorias.length > 0 && typeof categorias[0] === 'string') {
        categorias = categorias.map(c => ({ nome: c, ativa: true }));
    }
    
    const categoriasAtivas = categorias.filter(c => c.ativa === true);
    const optionsHTML = `<option value="" disabled selected>Selecione uma categoria...</option>` + 
                        categoriasAtivas.map(cat => `<option value="${cat.nome}">${cat.nome}</option>`).join('');
    
    selectNovo.innerHTML = optionsHTML;
    selectAjuste.innerHTML = optionsHTML;
}

async function carregarEstoque() {
    const tabela = document.getElementById('tabelaEstoque');
    const totalProdutos = document.getElementById('totalProdutos');
    const totalBaixoEstoque = document.getElementById('totalBaixoEstoque');
    const valorTotalEstoque = document.getElementById('valorTotalEstoque');
    
    try {
        const response = await fetch('https://3.21.52.233.nip.io/api/produtos');
        if (!response.ok) throw new Error('Erro ao buscar estoque da API');
        
        produtosLocais = await response.json(); 
        tabela.innerHTML = '';
        
        let qtdBaixa = 0;
        let valorTotal = 0;
        
        if (produtosLocais.length === 0) {
            tabela.innerHTML = `<tr><td colspan="7" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">Nenhum produto cadastrado no estoque.</td></tr>`;
            totalProdutos.textContent = 0;
            totalBaixoEstoque.textContent = 0;
            valorTotalEstoque.textContent = 'R$ 0,00';
            return;
        }
        
        produtosLocais.forEach(prod => {
            const qtd = Number(prod.qtd);
            const preco = Number(prod.preco);
            const custo = Number(prod.preco_compra || 0); 
            
            valorTotal += qtd * preco;
            if (qtd <= 5) qtdBaixa++;
            
            const statusBadge = qtd > 5
                ? '<span class="px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">Normal</span>'
                : '<span class="px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">Baixo</span>';
            
            const tr = document.createElement('tr');
            tr.className = "hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors";
            
            tr.innerHTML = `
                <td class="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">
                    <div class="flex items-center gap-3">
                        ${prod.imagem ? `<img src="${prod.imagem}" class="w-8 h-8 rounded object-cover border border-gray-200">` : `<div class="w-8 h-8 rounded bg-gray-200 flex items-center justify-center text-gray-400 text-xs">Sem</div>`}
                        <span>${prod.nome}</span>
                    </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">${prod.categoria}</td>
                <td class="px-6 py-4 text-sm font-semibold text-gray-800 dark:text-gray-200">${qtd} un.</td>
                <td class="px-6 py-4 text-sm text-red-600 dark:text-red-400">R$ ${custo.toFixed(2)}</td>
                <td class="px-6 py-4 text-sm text-green-600 dark:text-green-400">R$ ${preco.toFixed(2)}</td>
                <td class="px-6 py-4 text-sm">${statusBadge}</td>
                <td class="px-6 py-4 text-sm text-right space-x-2">
                    <button onclick="abrirModalAjuste(${prod.id})" class="px-3 py-1.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-md hover:bg-blue-200 font-medium transition-colors">Ajustar</button>
                    <button onclick="excluirProduto(${prod.id})" class="px-3 py-1.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-md hover:bg-red-200 font-medium transition-colors">Excluir</button>
                </td>
            `;
            tabela.appendChild(tr);
        });
        
        totalProdutos.textContent = produtosLocais.length;
        totalBaixoEstoque.textContent = qtdBaixa;
        valorTotalEstoque.textContent = `R$ ${valorTotal.toFixed(2)}`;
    } catch (error) {
        console.error('Erro:', error);
        tabela.innerHTML = `<tr><td colspan="7" class="px-6 py-8 text-center text-red-500 dark:text-red-400">Erro ao carregar dados do servidor. Verifique a API.</td></tr>`;
    }
}

// ==========================================
// MODAL DE NOVO PRODUTO
// ==========================================
window.abrirModalProduto = function () {
    document.getElementById('modalTitulo').textContent = 'Novo Produto';
    document.getElementById('formProduto').reset();
    document.getElementById('produtoId').value = '';
    
    // Reseta imagem e preview
    document.getElementById('imagemBase64Produto').value = '';
    const preview = document.getElementById('previewNovoProduto');
    preview.src = '';
    preview.classList.add('hidden');
    
    carregarCategoriasNosSelects();
    document.getElementById('modalProduto').classList.remove('hidden');
}

window.fecharModalProduto = function () {
    document.getElementById('modalProduto').classList.add('hidden');
}

document.addEventListener('submit', async (e) => {
    if (e.target && e.target.id === 'formProduto') {
        e.preventDefault();
        const nome = document.getElementById('nomeProduto').value.trim();
        const categoria = document.getElementById('categoriaProduto').value;
        const imagem = document.getElementById('imagemBase64Produto').value; 
        const qtd = parseInt(document.getElementById('qtdProduto').value);
        const preco_compra = parseFloat(document.getElementById('custoProduto').value);
        const preco = parseFloat(document.getElementById('precoProduto').value);
        
        try {
            const res = await fetch('https://3.21.52.233.nip.io/api/produtos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, categoria, imagem, qtd, preco_compra, preco })
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

// ==========================================
// MODAL DE AJUSTE RÁPIDO
// ==========================================
window.abrirModalAjuste = function(id) {
    const produto = produtosLocais.find(p => p.id === id);
    if (!produto) return;

    document.getElementById('ajusteProdutoId').value = produto.id;
    document.getElementById('ajusteProdutoNome').textContent = produto.nome;
    
    carregarCategoriasNosSelects(); 
    
    document.getElementById('ajusteCategoria').value = produto.categoria || '';
    
    // Configura Preview e Imagem Oculta
    document.getElementById('ajusteImagemUpload').value = ''; 
    document.getElementById('ajusteImagemBase64').value = produto.imagem || ''; 
    
    const preview = document.getElementById('previewAjusteProduto');
    if (produto.imagem) {
        preview.src = produto.imagem;
        preview.classList.remove('hidden');
    } else {
        preview.src = '';
        preview.classList.add('hidden');
    }
    
    document.getElementById('ajusteCusto').value = produto.preco_compra || 0;
    document.getElementById('ajustePreco').value = produto.preco || 0;
    
    document.getElementById('ajusteTipo').value = 'igualdade';
    document.getElementById('ajusteQtd').value = produto.qtd || 0; 
    document.getElementById('ajusteObservacao').value = "Ajuste de Saldo";
    
    document.getElementById('modalAjusteSaldo').classList.remove('hidden');
}

window.fecharModalAjuste = function() {
    document.getElementById('modalAjusteSaldo').classList.add('hidden');
}

document.getElementById('formAjusteSaldo').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('ajusteProdutoId').value;
    const categoria = document.getElementById('ajusteCategoria').value;
    const imagem = document.getElementById('ajusteImagemBase64').value; 
    
    const preco_compra = parseFloat(document.getElementById('ajusteCusto').value);
    const preco = parseFloat(document.getElementById('ajustePreco').value);

    const tipo = document.getElementById('ajusteTipo').value;
    const quantidade = parseInt(document.getElementById('ajusteQtd').value);
    const observacao = document.getElementById('ajusteObservacao').value.trim();

    try {
        const res = await fetch(`https://3.21.52.233.nip.io/api/produtos/${id}/ajuste`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tipo, quantidade, observacao, categoria, imagem, preco_compra, preco })
        });
        
        if (res.ok) {
            fecharModalAjuste();
            carregarEstoque();
            alert('Produto e saldo ajustados com sucesso!');
        } else {
            alert('Atenção: falha ao registrar o ajuste na API.');
            fecharModalAjuste();
        }
    } catch (err) {
        console.error('Erro de conexão:', err);
        alert('Erro de conexão com o servidor.');
    }
});

// ==========================================
// EXCLUSÃO E PESQUISA
// ==========================================
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

// ==========================================
// RELATÓRIOS (IMPRESSÃO/PDF)
// ==========================================
window.imprimirRelatorioProdutos = function() {
    const dataHora = new Date().toLocaleString('pt-BR');
    let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Catálogo de Produtos - ${dataHora}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
                h2 { color: #111; margin-bottom: 5px; }
                .subtitle { color: #666; font-size: 14px; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
                th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                th { background-color: #f4f4f4; }
                .badge { font-weight: bold; padding: 2px 5px; border-radius: 4px; font-size: 11px; }
                .badge-baixo { background: #fee2e2; color: #991b1b; }
            </style>
        </head>
        <body>
            <h2>Fluxfy - Catálogo de Produtos</h2>
            <div class="subtitle">Gerado em: ${dataHora} | Total de Itens: ${produtosLocais.length}</div>
            <table>
                <tr>
                    <th>Nome do Produto</th>
                    <th>Categoria</th>
                    <th>Custo (R$)</th>
                    <th>Venda (R$)</th>
                    <th>Estoque</th>
                </tr>
                ${produtosLocais.map(p => {
                    const alerta = p.qtd <= 5 ? '<span class="badge badge-baixo">Baixo</span>' : '';
                    return `
                    <tr>
                        <td>${p.nome}</td>
                        <td>${p.categoria}</td>
                        <td>${Number(p.preco_compra || 0).toFixed(2)}</td>
                        <td>${Number(p.preco).toFixed(2)}</td>
                        <td>${p.qtd} un.${alerta}</td>
                    </tr>`;
                }).join('')}
            </table>
            <script>window.onload = function() { window.print(); }</script>
        </body>
        </html>
    `;
    let printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
}

window.imprimirRelatorioBalancete = function() {
    const dataHora = new Date().toLocaleString('pt-BR');
    let totalCustoGlobal = 0;
    let totalVendaGlobal = 0;
    let totalLucroGlobal = 0;

    const linhas = produtosLocais.map(p => {
        const custoUnitario = Number(p.preco_compra || 0);
        const vendaUnitario = Number(p.preco);
        const qtd = Number(p.qtd);
        
        const lucroUnitario = vendaUnitario - custoUnitario;
        
        const totalCustoItem = custoUnitario * qtd;
        const totalVendaItem = vendaUnitario * qtd;
        const totalLucroItem = lucroUnitario * qtd;

        totalCustoGlobal += totalCustoItem;
        totalVendaGlobal += totalVendaItem;
        totalLucroGlobal += totalLucroItem;

        const classeLucro = lucroUnitario < 0 ? 'prejuizo' : (lucroUnitario === 0 ? 'zero' : 'lucro');

        return `
            <tr>
                <td>${p.nome}</td>
                <td>${qtd}</td>
                <td>${custoUnitario.toFixed(2)}</td>
                <td>${vendaUnitario.toFixed(2)}</td>
                <td class="${classeLucro}">${lucroUnitario.toFixed(2)}</td>
                <td class="${classeLucro} bold">${totalLucroItem.toFixed(2)}</td>
            </tr>
        `;
    }).join('');

    let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Balancete de Estoque - ${dataHora}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
                h2 { color: #111; margin-bottom: 5px; }
                .subtitle { color: #666; font-size: 14px; margin-bottom: 20px; }
                .resumo-box { border: 1px solid #ccc; padding: 15px; margin-bottom: 20px; border-radius: 5px; background: #f9fafb;}
                .resumo-box ul { list-style: none; padding: 0; margin:0; }
                .resumo-box li { margin-bottom: 8px; font-size: 14px; }
                .destaque { font-size: 18px; font-weight: bold; border-top: 1px solid #ddd; padding-top: 10px; margin-top: 10px; color: #047857; }
                table { width: 100%; border-collapse: collapse; font-size: 13px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                th { background-color: #f4f4f4; }
                th:first-child, td:first-child { text-align: left; }
                .lucro { color: #059669; }
                .prejuizo { color: #dc2626; }
                .zero { color: #6b7280; }
                .bold { font-weight: bold; }
            </style>
        </head>
        <body>
            <h2>Fluxfy - Balancete de Lucro e Prejuízo do Estoque</h2>
            <div class="subtitle">Posição de saldo gerada em: ${dataHora}</div>
            
            <div class="resumo-box">
                <h3 style="margin-top:0;">Resumo de Capital</h3>
                <ul>
                    <li>Custo Total do Estoque: R$ ${totalCustoGlobal.toFixed(2)}</li>
                    <li>Valor Total de Venda: R$ ${totalVendaGlobal.toFixed(2)}</li>
                    <li class="destaque">Lucro Potencial Total: R$ ${totalLucroGlobal.toFixed(2)}</li>
                </ul>
            </div>

            <table>
                <tr>
                    <th>Produto</th>
                    <th>Saldo Atual</th>
                    <th>Custo Unit. (R$)</th>
                    <th>Venda Unit. (R$)</th>
                    <th>Lucro Unit. (R$)</th>
                    <th>Lucro Total (R$)</th>
                </tr>
                ${linhas}
            </table>
            <script>window.onload = function() { window.print(); }</script>
        </body>
        </html>
    `;
    let printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
}