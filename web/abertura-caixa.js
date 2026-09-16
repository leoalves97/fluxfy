/*
 * abertura-caixa.js
 * Lógica da Frente de Caixa (PDV), Máquina de Estados e Persistência.
 */

let carrinho = [];
let formaPagamentoSelecionada = null;
let produtosCatalogo = [];

// Função auxiliar para data local do Brasil
const obterDataHoje = () => new Date().toLocaleDateString('pt-BR');

document.addEventListener('DOMContentLoaded', () => {
    verificarEstadoCaixa();

    const formAbertura = document.getElementById('formAbertura');
    if (formAbertura) {
        formAbertura.addEventListener('submit', (e) => {
            e.preventDefault();
            const valor = parseFloat(document.getElementById('valorInicial').value);
            
            // Salva status, fundo, data local e zera os saldos e o carrinho
            localStorage.setItem('fluxfy_caixa_status', 'aberto');
            localStorage.setItem('fluxfy_caixa_data', obterDataHoje());
            localStorage.setItem('fluxfy_caixa_fundo', valor.toFixed(2));
            localStorage.setItem('fluxfy_saldos', JSON.stringify({ dinheiro: 0, pix: 0, cartao: 0 }));
            localStorage.setItem('fluxfy_carrinho', JSON.stringify([]));
            
            if(!localStorage.getItem('fluxfy_comanda_atual')) {
                localStorage.setItem('fluxfy_comanda_atual', '1');
            }

            verificarEstadoCaixa();
        });
    }

    const buscaInput = document.getElementById('buscaPdv');
    if(buscaInput) {
        buscaInput.addEventListener('input', (e) => {
            renderizarGradeProdutos(e.target.value);
        });
    }
});

// ==========================================
// MÁQUINA DE ESTADOS DO CAIXA
// ==========================================
function verificarEstadoCaixa() {
    const statusFinal = localStorage.getItem('fluxfy_caixa_status');

    // Esconde todas as telas inicialmente para evitar sobreposição
    ['estado-abertura', 'estado-pdv', 'estado-pausado', 'estado-encerrado'].forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            el.classList.add('hidden');
            el.classList.remove('flex');
        }
    });

    // Mostra a tela correta baseada no status persistido
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
        
        // Mostra botão de override se for Admin
        const usuarioLogado = typeof AuthConfig !== 'undefined' ? AuthConfig.getUsuarioLogado() : null;
        if (usuarioLogado && usuarioLogado.papel === 'admin') {
            document.getElementById('admin-override-container').classList.remove('hidden');
        }
    } 
    else {
        // null ou vazio = não abriu ainda
        const abertura = document.getElementById('estado-abertura');
        abertura.classList.remove('hidden');
        abertura.classList.add('flex');
    }
}

// ==========================================
// CONTROLES DE PAUSA E ENCERRAMENTO
// ==========================================
window.pausarCaixa = function() {
    localStorage.setItem('fluxfy_caixa_status', 'pausado');
    verificarEstadoCaixa();
}

window.retomarCaixa = function() {
    localStorage.setItem('fluxfy_caixa_status', 'aberto');
    verificarEstadoCaixa();
}

window.encerrarCaixaDefinitivo = function() {
    const saldos = JSON.parse(localStorage.getItem('fluxfy_saldos')) || { dinheiro: 0, pix: 0, cartao: 0 };
    const fundo = parseFloat(localStorage.getItem('fluxfy_caixa_fundo')) || 0;
    const dataAbertura = localStorage.getItem('fluxfy_caixa_data') || obterDataHoje();
    
    const totalGeral = fundo + saldos.dinheiro + saldos.pix + saldos.cartao;

    const mensagemResumo = `📊 RESUMO DO CAIXA (${dataAbertura})\n\n` +
                           `💵 Fundo Inicial: R$ ${fundo.toFixed(2)}\n` +
                           `💰 Vendas Dinheiro: R$ ${saldos.dinheiro.toFixed(2)}\n` +
                           `📱 Vendas PIX: R$ ${saldos.pix.toFixed(2)}\n` +
                           `💳 Vendas Cartão: R$ ${saldos.cartao.toFixed(2)}\n` +
                           `---------------------------\n` +
                           `🔴 TOTAL EM CAIXA: R$ ${totalGeral.toFixed(2)}\n\n` +
                           `ATENÇÃO: Deseja realizar o fechamento definitivo?`;

    if(confirm(mensagemResumo)) {
        localStorage.setItem('fluxfy_caixa_status', 'encerrado');
        verificarEstadoCaixa();
    }
}

window.adminForcarReabertura = function() {
    if(confirm("ADMINISTRADOR: Reabrir este caixa? O sistema resetará para uma nova abertura de caixa limpa.")) {
        localStorage.removeItem('fluxfy_caixa_status');
        localStorage.removeItem('fluxfy_caixa_data');
        localStorage.removeItem('fluxfy_saldos');
        localStorage.removeItem('fluxfy_carrinho');
        verificarEstadoCaixa();
    }
}

// ==========================================
// LÓGICA DO PDV E PERSISTÊNCIA DE CARRINHO
// ==========================================
async function iniciarPDV() {
    atualizarNumeroComanda();
    
    const carrinhoSalvo = localStorage.getItem('fluxfy_carrinho');
    if (carrinhoSalvo) carrinho = JSON.parse(carrinhoSalvo);
    
    atualizarCarrinho();

    try {
        const response = await fetch('https://3.21.52.233.nip.io/api/produtos');
        if (response.ok) {
            produtosCatalogo = await response.json();
        } else { throw new Error('API não retornou dados'); }
    } catch (error) {
        console.warn("Usando mock de produtos devido a falha na API.");
        produtosCatalogo = [
            { id: 1, nome: "Coca-Cola Lata", preco: 5.50, categoria: "Bebidas" },
            { id: 2, nome: "Salgado Assado", preco: 7.00, categoria: "Lanches" },
            { id: 3, nome: "Bolo de Pote", preco: 8.50, categoria: "Sobremesas" },
            { id: 4, nome: "Suco Natural", preco: 6.00, categoria: "Bebidas" }
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
        card.className = "bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl p-4 cursor-pointer hover:border-fluxfy-yellow hover:shadow-md transition-all group flex flex-col justify-between";
        card.onclick = () => adicionarAoCarrinho(prod);
        
        card.innerHTML = `
            <div>
                <span class="text-xs font-semibold text-fluxfy-dark bg-fluxfy-yellow/10 px-2 py-1 rounded mb-2 inline-block">${prod.categoria}</span>
                <h4 class="font-bold text-gray-800 dark:text-gray-100 leading-tight mb-1 group-hover:text-fluxfy-dark">${prod.nome}</h4>
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

window.adicionarAoCarrinho = function(produto) {
    const item = carrinho.find(i => i.id === produto.id);
    if (item) item.quantidade += 1;
    else carrinho.push({ ...produto, quantidade: 1 });
    salvarCarrinho();
}

window.removerDoCarrinho = function(id) {
    const index = carrinho.findIndex(i => i.id === id);
    if (index > -1) {
        if (carrinho[index].quantidade > 1) carrinho[index].quantidade -= 1;
        else carrinho.splice(index, 1);
    }
    salvarCarrinho();
}

window.limparCarrinho = function() {
    if(carrinho.length > 0 && confirm("Deseja cancelar esta comanda?")) {
        carrinho = [];
        formaPagamentoSelecionada = null;
        atualizarBotoesPagamento();
        salvarCarrinho();
    }
}

function salvarCarrinho() {
    localStorage.setItem('fluxfy_carrinho', JSON.stringify(carrinho));
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

window.selecionarPagamento = function(metodo) {
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

window.finalizarPedido = function() {
    const totalPedido = carrinho.reduce((acc, item) => acc + (item.preco * item.quantidade), 0);
    
    // Atualiza os saldos financeiros
    let saldos = JSON.parse(localStorage.getItem('fluxfy_saldos')) || { dinheiro: 0, pix: 0, cartao: 0 };
    saldos[formaPagamentoSelecionada] += totalPedido;
    localStorage.setItem('fluxfy_saldos', JSON.stringify(saldos));

    alert(`Comanda #${document.getElementById('numeroComanda').textContent} Finalizada!\nValor: R$ ${totalPedido.toFixed(2)}\nForma: ${formaPagamentoSelecionada.toUpperCase()}`);
    
    let numAtual = parseInt(localStorage.getItem('fluxfy_comanda_atual')) || 1;
    localStorage.setItem('fluxfy_comanda_atual', numAtual + 1);
    
    carrinho = [];
    formaPagamentoSelecionada = null;
    salvarCarrinho();
    atualizarBotoesPagamento();
    atualizarNumeroComanda();
}

function atualizarNumeroComanda() {
    let numAtual = localStorage.getItem('fluxfy_comanda_atual') || '1';
    document.getElementById('numeroComanda').textContent = String(numAtual).padStart(3, '0');
}