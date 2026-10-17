document.addEventListener('DOMContentLoaded', () => {
  const usuario = typeof AuthConfig !== 'undefined' ? AuthConfig.getUsuarioLogado() : null;
  if (!usuario || usuario.papel !== 'admin') {
    alert('Acesso negado. Apenas administradores.');
    window.location.href = 'abertura-caixa.html';
    return;
  }

  const saldos = JSON.parse(localStorage.getItem('fluxfy_saldos')) || { dinheiro: 0, pix: 0, cartao: 0 };
  const movimentos = JSON.parse(localStorage.getItem('fluxfy_movimentos')) || [];

  const faturamentoTotal = (saldos.dinheiro || 0) + (saldos.pix || 0) + (saldos.cartao || 0);

  document.getElementById('txtFaturamentoTotal').textContent = `R$ ${faturamentoTotal.toFixed(2).replace('.', ',')}`;
  document.getElementById('txtTotalPix').textContent = `R$ ${(saldos.pix || 0).toFixed(2).replace('.', ',')}`;
  document.getElementById('txtTotalDinheiro').textContent = `R$ ${(saldos.dinheiro || 0).toFixed(2).replace('.', ',')}`;
  document.getElementById('txtTotalCartao').textContent = `R$ ${(saldos.cartao || 0).toFixed(2).replace('.', ',')}`;

  const tbody = document.getElementById('tabelaMovimentosFinanceiros');
  tbody.innerHTML = '';

  if (movimentos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">Nenhuma movimentação registrada.</td></tr>`;
    return;
  }

  movimentos.slice().reverse().forEach(mov => {
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
});