/*
 * sidebar-loader.js
 * Responsável por renderizar o menu lateral dinamicamente com base no papel do usuário.
 */
document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("sidebar-container");
    if (!container) return;

    // A regra de ouro: O Sidebar apenas LÊ o que foi definido no login. 
    // Nunca deve forçar papéis por conta própria. Fallback seguro é 'operador'.
    const usuarioLogado = typeof AuthConfig !== 'undefined' && AuthConfig.getUsuarioLogado() 
        ? AuthConfig.getUsuarioLogado() 
        : { papel: 'operador' };

    const isMobileOrTablet = window.innerWidth < 1024;
    let isCollapsed = isMobileOrTablet ? true : (localStorage.getItem("sidebar-collapsed") === "true");

    const asideWidth = isCollapsed ? "w-20" : "w-64";
    const textHiddenClass = isCollapsed ? "hidden" : "inline";
    const logoClass = isCollapsed ? "h-16 w-auto object-contain max-w-[60px]" : "h-20 w-auto object-contain max-w-[150px]";

    const icons = {
        painel: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>',
        usuarios: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>',
        estoque: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>',
        caixa: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>',
        config: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>'
    };

    const menuPermissions = {
        admin: [
            { url: 'admin.html', label: 'Painel Geral', svg: icons.painel },
            { url: 'abertura-caixa.html', label: 'Tela de Caixa', svg: icons.caixa },
            { url: 'estoque.html', label: 'Estoque', svg: icons.estoque },
            { url: 'aprovacoes.html', label: 'Permissões de Usuários', svg: icons.usuarios },
            { url: '#', label: 'Configurações / Perfil', svg: icons.config }
        ],
        operador: [
            { url: 'abertura-caixa.html', label: 'Tela de Caixa', svg: icons.caixa },
            { url: 'estoque.html', label: 'Estoque', svg: icons.estoque }
        ]
    };

    const itensPermitidos = menuPermissions[usuarioLogado.papel] || [];
    let menuHtml = '';

    itensPermitidos.forEach(item => {
        menuHtml += `
            <a href="${item.url}" class="flex items-center gap-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-3 rounded-lg font-medium transition-colors" data-page="${item.url}" title="${item.label}">
                <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">${item.svg}</svg>
                <span class="sidebar-text ${textHiddenClass} transition-opacity duration-300">${item.label}</span>
            </a>
        `;
    });

    container.innerHTML = `
        <aside id="app-sidebar" class="${asideWidth} flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-screen transition-all duration-300 relative">
            <div id="sidebarToggleBtn" class="h-28 flex items-center justify-center px-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors" title="Recolher / Expandir Menu">
                <img src="assets/logo.png" alt="Logo Fluxfy" id="sidebarLogoImg" class="transition-all duration-300 ${logoClass}">
            </div>
            <nav class="flex-1 p-3 space-y-2 overflow-y-auto no-scrollbar">
                ${menuHtml}
            </nav>
        </aside>
    `;

    const pathSegments = window.location.pathname.split("/");
    const currentPage = pathSegments[pathSegments.length - 1] || "admin.html";
    
    const activeItems = container.querySelectorAll(`[data-page="${currentPage}"]`);
    activeItems.forEach(item => {
        item.className = "flex items-center gap-3 bg-fluxfy-yellow/10 dark:bg-fluxfy-yellow/20 text-fluxfy-dark dark:text-fluxfy-yellow px-3 py-3 rounded-lg font-medium transition-colors";
    });

    const toggleBtn = document.getElementById("sidebarToggleBtn");
    const sidebar = document.getElementById("app-sidebar");
    const logoImg = document.getElementById("sidebarLogoImg");
    const sidebarTexts = container.querySelectorAll(".sidebar-text");

    if (toggleBtn && sidebar && logoImg) {
        toggleBtn.addEventListener("click", () => {
            if (window.innerWidth < 1024) return;
            const currentlyCollapsed = sidebar.classList.contains("w-20");
            if (currentlyCollapsed) {
                sidebar.classList.remove("w-20");
                sidebar.classList.add("w-64");
                logoImg.className = "transition-all duration-300 h-20 w-auto object-contain max-w-[150px]";
                setTimeout(() => { sidebarTexts.forEach(el => el.classList.remove("hidden")); }, 150);
                localStorage.setItem("sidebar-collapsed", "false");
            } else {
                sidebar.classList.remove("w-64");
                sidebar.classList.add("w-20");
                logoImg.className = "transition-all duration-300 h-16 w-auto object-contain max-w-[60px]";
                sidebarTexts.forEach(el => el.classList.add("hidden"));
                localStorage.setItem("sidebar-collapsed", "true");
            }
        });
    }
});