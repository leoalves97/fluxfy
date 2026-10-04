/*
 * abertura-caixa.js
 * Lógica da Frente de Caixa (PDV), Máquina de Estados, Movimentações e Persistência.
 * Atualizado: Sessões isoladas por usuário logado.
 */
let carrinho = [];
let formaPagamentoSelecionada = null;
let produtosCatalogo = [];

// Função auxiliar para data local do Brasil
const obterDataHoje = () => new Date().toLocaleDateString('pt-BR');
const obterDataHora = () => new Date().toLocaleString('pt-BR');

// Função crucial: Isola as chaves do localStorage por e-mail do usuário logado
function getCaixaKey(baseKey) {
    const usuario = typeof AuthConfig !== 'undefined' ? AuthConfig.getUsuarioLogado() : null;
    const sufixo = usuario && usuario.email ? '_' + usuario.email : '';
    return baseKey + sufixo;
}

document.addEventListener('DOMContentLoaded', () => {
    verificarEstadoCaixa();
    
    // --- CORREÇÃO DE UX: Comportamento do campo Fundo de Troco ---
    const valorInicialInput = document.getElementById('valorInicial');
    if (valorInicialInput) {
        valorInicialInput.addEventListener('focus', function() {
            if (Number(this.value) === 0) {
                this.value = '';
            }
        });
        valorInicialInput.addEventListener('blur', function() {
            if (this.value.trim() === '') {
                this.value = '0.00';
            }
        });
    }
    
    const formAbertura = document.getElementById('formAbertura');
    if (formAbertura) {
        formAbertura.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const inputVal = document.getElementById('valorInicial').value;
            const valor = parseFloat(inputVal) || 0;
            
            localStorage.setItem(getCaixaKey('fluxfy_caixa_status'), 'aberto');
            localStorage.setItem(getCaixaKey('fluxfy_caixa_data'), obterDataHoje());
            localStorage.setItem(getCaixaKey('fluxfy_caixa_fundo'), valor.toFixed(2));
            localStorage.setItem(getCaixaKey('fluxfy_saldos'), JSON.stringify({ dinheiro: 0, pix: 0, cartao: 0 }));
            localStorage.setItem(getCaixaKey('fluxfy_carrinho'), JSON.stringify([]));
            localStorage.setItem(getCaixaKey('fluxfy_movimentos'), JSON.stringify([])); 
            
            if (!localStorage.getItem(getCaixaKey('fluxfy_comanda_atual'))) {
                localStorage.setItem(getCaixaKey('fluxfy_comanda_atual'), '1');
            }
            verificarEstadoCaixa();
        });
    }

    const buscaInput = document.getElementById('buscaPdv');
    if (buscaInput) {
        buscaInput.addEventListener('input', (e) => {
            renderizarGradeProdutos(e.target.value);
        });
    }
});

// ==========================================
// MÁQUINA DE ESTADOS DO CAIXA
// ==========================================
function verificarEstadoCaixa() {
    const statusFinal = localStorage.getItem(getCaixaKey('fluxfy_caixa_status'));
    
    ['estado-abertura', 'estado-pdv', 'estado-pausado', 'estado-encerrado'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.add('hidden');
            el.classList.remove('flex');
        }
    });

    if (statusFinal === 'aberto') {
        const pdv = document.getElementById('estado-pdv');
        pdv.classList.remove('hidden');
        pdv.classList.add('flex');
        iniciarPDV();
    }
    else if (statusFinal === 'pausado') {
        const pausado = document.getElementById('estado-pausado');
        pausado.classList.remove('hidden');
        pausado.classList.add('flex');
    }
    else if (statusFinal === 'encerrado') {
        const encerrado = document.getElementById('estado-encerrado');
        encerrado.classList.remove('hidden');
        encerrado.classList.add('flex');
        
        const usuarioLogado = typeof AuthConfig !== 'undefined' ? AuthConfig.getUsuarioLogado() : null;
        if (usuarioLogado && usuarioLogado.papel === 'admin') {
            document.getElementById('admin-override-container').classList.remove('hidden');
        }
    }
    else {
        const abertura = document.getElementById('estado-abertura');
        abertura.classList.remove('hidden');
        abertura.classList.add('flex');
    }
}

// ==========================================
// CONTROLES DE CAIXA E RELATÓRIOS
// ==========================================
window.pausarCaixa = function () {
    localStorage.setItem(getCaixaKey('fluxfy_caixa_status'), 'pausado');
    verificarEstadoCaixa();
}

window.retomarCaixa = function () {
    localStorage.setItem(getCaixaKey('fluxfy_caixa_status'), 'aberto');
    verificarEstadoCaixa();
}

window.prepararEncerramento = function() {
    const saldos = JSON.parse(localStorage.getItem(getCaixaKey('fluxfy_saldos'))) || { dinheiro: 0, pix: 0, cartao: 0 };
    const fundo = parseFloat(localStorage.getItem(getCaixaKey('fluxfy_caixa_fundo'))) || 0;
    const totalGeral = fundo + saldos.dinheiro + saldos.pix + saldos.cartao;
    const movimentos = JSON.parse(localStorage.getItem(getCaixaKey('fluxfy_movimentos'))) || [];

    document.getElementById('enc-fundo').textContent = `R$ ${fundo.toFixed(2).replace('.', ',')}`;
    document.getElementById('enc-dinheiro').textContent = `R$ ${saldos.dinheiro.toFixed(2).replace('.', ',')}`;
    document.getElementById('enc-pix').textContent = `R$ ${saldos.pix.toFixed(2).replace('.', ',')}`;
    document.getElementById('enc-cartao').textContent = `R$ ${saldos.cartao.toFixed(2).replace('.', ',')}`;
    document.getElementById('enc-total').textContent = `R$ ${totalGeral.toFixed(2).replace('.', ',')}`;

    const lista = document.getElementById('enc-movimentos-lista');
    lista.innerHTML = '';
    
    if (movimentos.length === 0) {
        lista.innerHTML = `<li class="text-sm text-gray-500 py-1">Nenhuma movimentação registrada.</li>`;
    } else {
        movimentos.forEach(m => {
            const linhaTraco = m.estornado ? 'text-red-500 line-through' : 'text-gray-700 dark:text-gray-300';
            lista.innerHTML += `<li class="text-sm border-b dark:border-gray-700 py-2 ${linhaTraco}">[${m.data}] Comanda #${m.comanda} - ${m.forma_pagamento.toUpperCase()} - R$ ${m.valor.toFixed(2).replace('.', ',')}</li>`;
        });
    }

    document.getElementById('modalEncerramento').classList.remove('hidden');
}

window.fecharModalEncerramento = function() {
    document.getElementById('modalEncerramento').classList.add('hidden');
}

window.confirmarEncerramento = function () {
    localStorage.setItem(getCaixaKey('fluxfy_caixa_status'), 'encerrado');
    fecharModalEncerramento();
    verificarEstadoCaixa();
}

window.adminForcarReabertura = function () {
    if (confirm("ADMINISTRADOR: Reabrir este caixa? O sistema resetará para uma nova abertura de caixa limpa.")) {
        localStorage.removeItem(getCaixaKey('fluxfy_caixa_status'));
        localStorage.removeItem(getCaixaKey('fluxfy_caixa_data'));
        localStorage.removeItem(getCaixaKey('fluxfy_saldos'));
        localStorage.removeItem(getCaixaKey('fluxfy_carrinho'));
        localStorage.removeItem(getCaixaKey('fluxfy_movimentos'));
        verificarEstadoCaixa();
    }
}

// ==========================================
// LÓGICA DE MOVIMENTAÇÕES E ESTORNO
// ==========================================
window.abrirModalMovimentos = function() {
    const tabela = document.getElementById('tabelaMovimentos');
    const movimentos = JSON.parse(localStorage.getItem(getCaixaKey('fluxfy_movimentos'))) || [];
    
    tabela.innerHTML = '';
    if (movimentos.length === 0) {
        tabela.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-500">Nenhum movimento registrado.</td></tr>`;
    } else {
        movimentos.reverse().forEach(m => {
            const tr = document.createElement('tr');
            tr.className = "border-b dark:border-gray-700";
            
            let acaoHTML = m.estornado 
                ? `<span class="text-xs text-red-500 font-bold">ESTORNADO</span>` 
                : `<button onclick="estornarMovimento(${m.id})" class="px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 text-xs font-bold">Estornar</button>`;
            
            const tracoClass = m.estornado ? "line-through text-gray-400" : "text-gray-800 dark:text-gray-200";

            tr.innerHTML = `
                <td class="p-3 ${tracoClass}">${m.data}</td>
                <td class="p-3 ${tracoClass}">#${m.comanda}</td>
                <td class="p-3 ${tracoClass} uppercase">${m.forma_pagamento}</td>
                <td class="p-3 ${tracoClass}">R$ ${m.valor.toFixed(2).replace('.', ',')}</td>
                <td class="p-3 text-right">${acaoHTML}</td>
            `;
            tabela.appendChild(tr);
        });
    }
    
    document.getElementById('modalMovimentos').classList.remove('hidden');
}

window.fecharModalMovimentos = function() {
    document.getElementById('modalMovimentos').classList.add('hidden');
}

window.estornarMovimento = function(id) {
    if(!confirm("Deseja realmente estornar este recebimento? O valor será abatido do saldo do caixa e marcado como cancelado.")) return;

    let movimentos = JSON.parse(localStorage.getItem(getCaixaKey('fluxfy_movimentos'))) || [];
    const index = movimentos.findIndex(m => m.id === id);
    
    if(index > -1 && !movimentos[index].estornado) {
        const mov = movimentos[index];
        mov.estornado = true;
        
        let saldos = JSON.parse(localStorage.getItem(getCaixaKey('fluxfy_saldos'))) || { dinheiro: 0, pix: 0, cartao: 0 };
        saldos[mov.forma_pagamento] -= mov.valor;
        
        localStorage.setItem(getCaixaKey('fluxfy_saldos'), JSON.stringify(saldos));
        localStorage.setItem(getCaixaKey('fluxfy_movimentos'), JSON.stringify(movimentos));
        
        alert(`Estorno de R$ ${mov.valor.toFixed(2)} registrado.`);
        abrirModalMovimentos(); 
    }
}

window.abrirModalResumo = function() {
    const saldos = JSON.parse(localStorage.getItem(getCaixaKey('fluxfy_saldos'))) || { dinheiro: 0, pix: 0, cartao: 0 };
    const fundo = parseFloat(localStorage.getItem(getCaixaKey('fluxfy_caixa_fundo'))) || 0;
    const totalGeral = fundo + saldos.dinheiro + saldos.pix + saldos.cartao;

    document.getElementById('res-fundo').textContent = `R$ ${fundo.toFixed(2).replace('.', ',')}`;
    document.getElementById('res-dinheiro').textContent = `R$ ${saldos.dinheiro.toFixed(2).replace('.', ',')}`;
    document.getElementById('res-pix').textContent = `R$ ${saldos.pix.toFixed(2).replace('.', ',')}`;
    document.getElementById('res-cartao').textContent = `R$ ${saldos.cartao.toFixed(2).replace('.', ',')}`;
    document.getElementById('res-total').textContent = `R$ ${totalGeral.toFixed(2).replace('.', ',')}`;

    document.getElementById('modalResumo').classList.remove('hidden');
}

window.fecharModalResumo = function() {
    document.getElementById('modalResumo').classList.add('hidden');
}

window.imprimirRelatorioCaixa = function() {
    const saldos = JSON.parse(localStorage.getItem(getCaixaKey('fluxfy_saldos'))) || { dinheiro: 0, pix: 0, cartao: 0 };
    const fundo = parseFloat(localStorage.getItem(getCaixaKey('fluxfy_caixa_fundo'))) || 0;
    const totalGeral = fundo + saldos.dinheiro + saldos.pix + saldos.cartao;
    const movimentos = JSON.parse(localStorage.getItem(getCaixaKey('fluxfy_movimentos'))) || [];
    const dataAbertura = localStorage.getItem(getCaixaKey('fluxfy_caixa_data')) || obterDataHoje();
    const usuario = typeof AuthConfig !== 'undefined' ? AuthConfig.getUsuarioLogado() : null;
    const emailOperador = usuario && usuario.email ? usuario.email : 'Não identificado';

    let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Relatório de Caixa - ${dataAbertura}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
                h2, h3 { color: #111; margin-bottom: 5px; }
                .resumo-box { border: 1px solid #ccc; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
                .resumo-box ul { list-style: none; padding: 0; }
                .resumo-box li { margin-bottom: 8px; font-size: 14px; }
                .destaque { font-size: 18px; font-weight: bold; border-top: 1px solid #000; padding-top: 10px; margin-top: 10px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f4f4f4; }
                .estornado { color: red; text-decoration: line-through; }
            </style>
        </head>
        <body>
            <h2>Fluxfy - Relatório de Fechamento de Caixa</h2>
            <p><strong>Data de Referência:</strong> ${dataAbertura}<br>
               <strong>Operador:</strong> ${emailOperador}</p>
            
            <div class="resumo-box">
                <h3>Resumo de Saldos</h3>
                <ul>
                    <li>Fundo Inicial: R$ ${fundo.toFixed(2)}</li>
                    <li>Dinheiro Recebido: R$ ${saldos.dinheiro.toFixed(2)}</li>
                    <li>PIX Recebido: R$ ${saldos.pix.toFixed(2)}</li>
                    <li>Cartão Recebido: R$ ${saldos.cartao.toFixed(2)}</li>
                    <li class="destaque">Total Esperado em Caixa: R$ ${totalGeral.toFixed(2)}</li>
                </ul>
            </div>

            <h3>Movimentações Cronológicas</h3>
            <table>
                <tr>
                    <th>Data/Hora</th>
                    <th>Comanda</th>
                    <th>Forma Pag.</th>
                    <th>Valor (R$)</th>
                    <th>Status</th>
                </tr>
                ${movimentos.length > 0 ? movimentos.map(m => `
                    <tr class="${m.estornado ? 'estornado' : ''}">
                        <td>${m.data}</td>
                        <td>#${m.comanda}</td>
                        <td style="text-transform: uppercase;">${m.forma_pagamento}</td>
                        <td>${m.valor.toFixed(2)}</td>
                        <td>${m.estornado ? 'Estornado' : 'Concluído'}</td>
                    </tr>
                `).join('') : '<tr><td colspan="5" style="text-align:center;">Nenhum registro encontrado.</td></tr>'}
            </table>
            
            <p style="margin-top: 40px; text-align: center; font-size: 12px;">____________________________________________________<br>Assinatura do Operador</p>
            <script>
                window.onload = function() { window.print(); }
            </script>
        </body>
        </html>
    `;

    let printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write(html);
    printWindow.document.close();
}


// ==========================================
// LÓGICA DO PDV E CARRINHO
// ==========================================
async function iniciarPDV() {
    atualizarNumeroComanda();
    
    const carrinhoSalvo = localStorage.getItem(getCaixaKey('fluxfy_carrinho'));
    if (carrinhoSalvo) carrinho = JSON.parse(carrinhoSalvo);
    
    atualizarCarrinho();
    
    try {
        const response = await fetch('https://3.21.52.233.nip.io/api/produtos');
        if (response.ok) {
            produtosCatalogo = await response.json();
        } else { throw new Error('API não retornou dados'); }
    } catch (error) {
        console.warn("Usando mock de produtos devido à falha na API.");
        produtosCatalogo = [
            { id: 1, nome: "Coca-Cola Lata", preco: 5.50, categoria: "Bebidas", imagem: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80" },
            { id: 2, nome: "Salgado Assado", preco: 7.00, categoria: "Lanches", imagem: "" }, 
            { id: 3, nome: "Bolo de Pote", preco: 8.50, categoria: "Sobremesas", imagem: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&q=80" },
            { id: 4, nome: "Suco Natural", preco: 6.00, categoria: "Bebidas", imagem: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=500&q=80" }
        ];
    }
    
    renderizarGradeProdutos();
}

function renderizarGradeProdutos(filtro = '') {
    const grade = document.getElementById('gradeProdutos');
    grade.innerHTML = '';
    
    const produtosFiltrados = produtosCatalogo.filter(p =>
        p.nome.toLowerCase().includes(filtro.toLowerCase()) ||
        p.categoria.toLowerCase().includes(filtro.toLowerCase())
    );
    
    if (produtosFiltrados.length === 0) {
        grade.innerHTML = `<p class="col-span-full text-center text-gray-500 mt-10">Nenhum produto encontrado.</p>`;
        return;
    }
    
    produtosFiltrados.forEach(prod => {
        const preco = Number(prod.preco).toFixed(2).replace('.', ',');
        const card = document.createElement('div');
        card.className = "bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl p-3 cursor-pointer hover:border-fluxfy-yellow hover:shadow-md transition-all group flex flex-col justify-between h-full";
        card.onclick = () => adicionarAoCarrinho(prod);
        
        const imagemHtml = prod.imagem 
            ? `<img src="${prod.imagem}" alt="${prod.nome}" class="w-full h-28 object-cover rounded-lg mb-3">`
            : `<div class="w-full h-28 bg-gray-200 dark:bg-gray-600 rounded-lg mb-3 flex items-center justify-center text-gray-400">
                 <svg class="w-8 h-8 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
               </div>`;
        
        card.innerHTML = `
            <div>
                ${imagemHtml}
                <span class="text-xs font-semibold text-fluxfy-dark bg-fluxfy-yellow/10 px-2 py-1 rounded mb-2 inline-block">${prod.categoria}</span>
                <h4 class="font-bold text-sm text-gray-800 dark:text-gray-100 leading-tight mb-1 group-hover:text-fluxfy-dark">${prod.nome}</h4>
            </div>
            <div class="mt-3 flex justify-between items-center">
                <span class="font-extrabold text-lg text-gray-900 dark:text-white">R$ ${preco}</span>
                <div class="w-8 h-8 rounded-full bg-white dark:bg-gray-600 flex items-center justify-center shadow-sm group-hover:bg-fluxfy-yellow group-hover:text-black transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                </div>
            </div>
        `;
        grade.appendChild(card);
    });
}

window.adicionarAoCarrinho = function (produto) {
    const item = carrinho.find(i => i.id === produto.id);
    if (item) item.quantidade += 1;
    else carrinho.push({ ...produto, quantidade: 1 });
    salvarCarrinho();
}

window.removerDoCarrinho = function (id) {
    const index = carrinho.findIndex(i => i.id === id);
    if (index > -1) {
        if (carrinho[index].quantidade > 1) carrinho[index].quantidade -= 1;
        else carrinho.splice(index, 1);
    }
    salvarCarrinho();
}

window.limparCarrinho = function () {
    if (carrinho.length > 0 && confirm("Deseja cancelar esta comanda?")) {
        carrinho = [];
        formaPagamentoSelecionada = null;
        atualizarBotoesPagamento();
        salvarCarrinho();
    }
}

function salvarCarrinho() {
    localStorage.setItem(getCaixaKey('fluxfy_carrinho'), JSON.stringify(carrinho));
    atualizarCarrinho();
}

function atualizarCarrinho() {
    const lista = document.getElementById('listaCarrinho');
    const spanTotal = document.getElementById('totalCarrinho');
    const btnFinalizar = document.getElementById('btnFinalizar');
    
    lista.innerHTML = '';
    let total = 0;
    
    if (carrinho.length === 0) {
        lista.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-gray-400 mt-10">
                <svg class="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                <p class="text-sm">Nenhum item adicionado</p>
            </div>
        `;
        spanTotal.textContent = "0,00";
        btnFinalizar.disabled = true;
        return;
    }
    
    carrinho.forEach(item => {
        const subtotal = item.preco * item.quantidade;
        total += subtotal;
        
        const div = document.createElement('div');
        div.className = "flex justify-between items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors border-b border-gray-100 dark:border-gray-700/50 last:border-0";
        
        div.innerHTML = `
            <div class="flex-1">
                <p class="text-sm font-bold text-gray-800 dark:text-gray-200">${item.nome}</p>
                <p class="text-xs text-gray-500">${item.quantidade}x R$ ${Number(item.preco).toFixed(2).replace('.', ',')}</p>
            </div>
            <div class="flex items-center gap-3">
                <span class="font-semibold text-gray-900 dark:text-white">R$ ${subtotal.toFixed(2).replace('.', ',')}</span>
                <button onclick="removerDoCarrinho(${item.id})" class="text-red-500 hover:text-red-700 p-1 bg-red-50 dark:bg-red-900/20 rounded">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path></svg>
                </button>
            </div>
        `;
        lista.appendChild(div);
    });
    
    spanTotal.textContent = total.toFixed(2).replace('.', ',');
    verificarBotaoFinalizar();
}

window.selecionarPagamento = function (metodo) {
    formaPagamentoSelecionada = metodo;
    atualizarBotoesPagamento();
    verificarBotaoFinalizar();
}

function atualizarBotoesPagamento() {
    document.querySelectorAll('.btn-pagamento').forEach(btn => {
        btn.classList.remove('bg-fluxfy-yellow', 'text-black', 'border-fluxfy-yellow');
        btn.classList.add('border-gray-300', 'dark:border-gray-600');
    });
    if (formaPagamentoSelecionada) {
        const btnAtivo = document.getElementById(`btn-pag-${formaPagamentoSelecionada}`);
        btnAtivo.classList.remove('border-gray-300', 'dark:border-gray-600');
        btnAtivo.classList.add('bg-fluxfy-yellow', 'text-black', 'border-fluxfy-yellow');
    }
}

function verificarBotaoFinalizar() {
    const btn = document.getElementById('btnFinalizar');
    btn.disabled = !(carrinho.length > 0 && formaPagamentoSelecionada);
}

window.finalizarPedido = async function () {
    const totalPedido = carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
    const numeroComandaStr = document.getElementById('numeroComanda').textContent;
    
    const dadosVenda = {
        comanda: numeroComandaStr,
        forma_pagamento: formaPagamentoSelecionada,
        total: totalPedido,
        itens: carrinho.map(i => ({ id: i.id, nome: i.nome, preco: i.preco, quantidade: i.quantidade }))
    };
    
    try {
        const response = await fetch('https://3.21.52.233.nip.io/api/vendas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosVenda)
        });
        
        if (!response.ok) {
            throw new Error('Erro ao registrar venda no servidor.');
        }
        
        let saldos = JSON.parse(localStorage.getItem(getCaixaKey('fluxfy_saldos'))) || { dinheiro: 0, pix: 0, cartao: 0 };
        saldos[formaPagamentoSelecionada] += totalPedido;
        localStorage.setItem(getCaixaKey('fluxfy_saldos'), JSON.stringify(saldos));

        let movimentos = JSON.parse(localStorage.getItem(getCaixaKey('fluxfy_movimentos'))) || [];
        movimentos.push({
            id: Date.now(),
            comanda: numeroComandaStr,
            valor: totalPedido,
            forma_pagamento: formaPagamentoSelecionada,
            data: obterDataHora(),
            estornado: false
        });
        localStorage.setItem(getCaixaKey('fluxfy_movimentos'), JSON.stringify(movimentos));
        
        alert(`Comanda #${numeroComandaStr} Finalizada!\nValor: R$ ${totalPedido.toFixed(2)}\nForma: ${formaPagamentoSelecionada.toUpperCase()}`);
        
        let numAtual = parseInt(localStorage.getItem(getCaixaKey('fluxfy_comanda_atual'))) || 1;
        localStorage.setItem(getCaixaKey('fluxfy_comanda_atual'), numAtual + 1);
        
        carrinho = [];
        formaPagamentoSelecionada = null;
        salvarCarrinho();
        atualizarBotoesPagamento();
        atualizarNumeroComanda();
    } catch (error) {
        console.error('Erro:', error);
        alert('Atenção: A venda foi finalizada localmente, mas houve uma falha ao registrar no servidor. Verifique sua conexão.');
    }
}

function atualizarNumeroComanda() {
    let numAtual = localStorage.getItem(getCaixaKey('fluxfy_comanda_atual')) || '1';
    document.getElementById('numeroComanda').textContent = String(numAtual).padStart(3, '0');
}