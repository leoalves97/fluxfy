/*
 * configuracoes.js
 * Gerenciamento e persistência das configurações de negócio do Fluxfy.
 */
document.addEventListener('DOMContentLoaded', () => {

    // Carrega configurações existentes ou define os valores padrão
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

    // Preenche os campos da tela com os dados carregados
    document.getElementById('nomeEmpresa').value = configSalva.nomeEmpresa;
    document.getElementById('cnpjEmpresa').value = configSalva.cnpjEmpresa;
    document.getElementById('mensagemRecibo').value = configSalva.mensagemRecibo;
    document.getElementById('alertaEstoqueAtivo').checked = configSalva.alertaEstoqueAtivo;
    document.getElementById('limiteEstoqueBaixo').value = configSalva.limiteEstoqueBaixo;
    document.getElementById('alertaSangriaAtivo').checked = configSalva.alertaSangriaAtivo;
    document.getElementById('valorLimiteSangria').value = parseFloat(configSalva.valorLimiteSangria).toFixed(2);

    // Evento de envio do formulário
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

            // Salva no LocalStorage
            localStorage.setItem('fluxfy_config', JSON.stringify(novasConfig));
            alert('Configurações do sistema salvas com sucesso!');
        });
    }
});