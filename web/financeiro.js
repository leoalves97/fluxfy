let dadosFinanceirosGlobais = { saldos: {}, movimentos: [] };

document.addEventListener('DOMContentLoaded', async () => {
  const usuario = typeof AuthConfig !== 'undefined' ? AuthConfig.getUsuarioLogado() : null;
  if (!usuario || usuario.papel !== 'admin') {
    alert('Acesso negado. Apenas administradores.');
    window.location.href = 'abertura-caixa.html';
    return;
  }

  await carregarDadosFinanceiros();
});

async function carregarDadosFinanceiros() {
  try {
    const response = await fetch('https://3.21.52.233.nip.io/api/financeiro/extrato');
    if (!response.ok) throw new Error('Erro ao buscar dados financeiros');

    dadosFinanceirosGlobais = await response.json();
    renderizarPainelFinanceiro(dadosFinanceirosGlobais.movimentos, dadosFinanceirosGlobais.saldos);

  } catch (error) {
    console.error('Erro:', error);
    document.getElementById('tabelaMovimentosFinanceiros').innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-red-500">Erro ao carregar dados do servidor.</td></tr>`;
  }
}

function renderizarPainelFinanceiro(movimentos, saldosPersonalizados = null) {
  let faturamentoTotal = 0;
  let totalPix = 0;
  let totalDinheiro = 0;
  let totalCartao = 0;

  movimentos.forEach(mov => {
    const valor = Number(mov.valor);
    faturamentoTotal += valor;
    const forma = mov.forma_pagamento.toLowerCase();
    if (forma.includes('pix')) totalPix += valor;
    else if (forma.includes('dinheiro')) totalDinheiro += valor;
    else if (forma.includes('cartao') || forma.includes('cartão')) totalCartao += valor;
  });

  const saldos = saldosPersonalizados || {
    faturamento_total: faturamentoTotal,
    pix: totalPix,
    dinheiro: totalDinheiro,
    cartao: totalCartao
  };

  // Atualiza os Cards
  document.getElementById('txtFaturamentoTotal').textContent = `R$ ${saldos.faturamento_total.toFixed(2).replace('.', ',')}`;
  document.getElementById('txtTotalPix').textContent = `R$ ${saldos.pix.toFixed(2).replace('.', ',')}`;
  document.getElementById('txtTotalDinheiro').textContent = `R$ ${saldos.dinheiro.toFixed(2).replace('.', ',')}`;
  document.getElementById('txtTotalCartao').textContent = `R$ ${saldos.cartao.toFixed(2).replace('.', ',')}`;

  const tbody = document.getElementById('tabelaMovimentosFinanceiros');
  tbody.innerHTML = '';

  if (movimentos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">Nenhuma movimentação encontrada para o período selecionado.</td></tr>`;
    return;
  }

  movimentos.forEach(mov => {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors';
    tr.innerHTML = `
            <td class="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-100">#${mov.comanda}</td>
            <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">${mov.data}</td>
            <td class="px-6 py-4 text-sm uppercase font-semibold text-gray-700 dark:text-gray-300">${mov.forma_pagamento}</td>
            <td class="px-6 py-4 text-sm text-right font-bold text-gray-900 dark:text-white">R$ ${Number(mov.valor).toFixed(2).replace('.', ',')}</td>
        `;
    tbody.appendChild(tr);
  });
}

window.filtrarFinanceiroPorPeriodo = function () {
  const dataInicioStr = document.getElementById('filtroDataInicio').value;
  const dataFimStr = document.getElementById('filtroDataFim').value;

  if (!dataInicioStr || !dataFimStr) {
    alert('Por favor, selecione a data inicial e a data final.');
    return;
  }

  const dataInicio = new Date(dataInicioStr);
  dataInicio.setHours(0, 0, 0, 0);

  const dataFim = new Date(dataFimStr);
  dataFim.setHours(23, 59, 59, 999);

  const movimentosFiltrados = dadosFinanceirosGlobais.movimentos.filter(mov => {
    // Converte o formato 'DD/MM/YYYY HH:MM' para objeto Date do JS
    const partes = mov.data.split(' ');
    const dataPartes = partes[0].split('/');
    const horaPartes = partes[1] ? partes[1].split(':') : [0, 0];

    const dataMov = new Date(dataPartes[2], dataPartes[1] - 1, dataPartes[0], horaPartes[0], horaPartes[1]);

    return dataMov >= dataInicio && dataMov <= dataFim;
  });

  renderizarPainelFinanceiro(movimentosFiltrados);
};

window.limparFiltroPeriodo = function () {
  document.getElementById('filtroDataInicio').value = '';
  document.getElementById('filtroDataFim').value = '';
  renderizarPainelFinanceiro(dadosFinanceirosGlobais.movimentos, dadosFinanceirosGlobais.saldos);
};