document.addEventListener('DOMContentLoaded', async () => {
  const usuario = typeof AuthConfig !== 'undefined' ? AuthConfig.getUsuarioLogado() : null;
  if (!usuario || usuario.papel !== 'admin') {
    alert('Acesso negado. Apenas administradores.');
    window.location.href = 'abertura-caixa.html';
    return;
  }

  try {
    const response = await fetch('https://3.21.52.233.nip.io/api/financeiro/extrato');
    if (!response.ok) throw new Error('Erro ao buscar dados financeiros');

    const data = await response.json();
    const saldos = data.saldos;
    const movimentos = data.movimentos;

    // Atualiza os Cards com os dados vindos do Banco
    document.getElementById('txtFaturamentoTotal').textContent = `R$ ${saldos.faturamento_total.toFixed(2).replace('.', ',')}`;
    document.getElementById('txtTotalPix').textContent = `R$ ${saldos.pix.toFixed(2).replace('.', ',')}`;
    document.getElementById('txtTotalDinheiro').textContent = `R$ ${saldos.dinheiro.toFixed(2).replace('.', ',')}`;
    document.getElementById('txtTotalCartao').textContent = `R$ ${saldos.cartao.toFixed(2).replace('.', ',')}`;

    const tbody = document.getElementById('tabelaMovimentosFinanceiros');
    tbody.innerHTML = '';

    if (movimentos.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">Nenhuma movimentação registrada.</td></tr>`;
      return;
    }

    // Preenche a tabela com as vendas vindas do banco
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

  } catch (error) {
    console.error('Erro:', error);
    document.getElementById('tabelaMovimentosFinanceiros').innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-red-500">Erro ao carregar dados do servidor.</td></tr>`;
  }
});