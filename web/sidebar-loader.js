document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("sidebar-container");
    if (!container) return;

    // Regra: Para telas de celulares e tablets (< 1024px), força o menu recolhido.
    const isMobileOrTablet = window.innerWidth < 1024;
    let isCollapsed = isMobileOrTablet ? true : (localStorage.getItem("sidebar-collapsed") === "true");

    // Define as classes dinâmicas com base no estado inicial
    const asideWidth = isCollapsed ? "w-20" : "w-64";
    const textHiddenClass = isCollapsed ? "hidden" : "inline";
    const footerTextClass = isCollapsed ? "hidden" : "block";
    const logoClass = isCollapsed ? "h-16 w-auto object-contain max-w-[60px]" : "h-20 w-auto object-contain max-w-[150px]";

    container.innerHTML = `
        <aside id="app-sidebar" class="${asideWidth} flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-screen transition-all duration-300 relative">
            <!-- Topo: Botão da Logo -->
            <div id="sidebarToggleBtn" class="h-28 flex items-center justify-center px-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors" title="Recolher / Expandir Menu">
                <img src="assets/logo.png" alt="Logo Fluxfy" id="sidebarLogoImg" class="transition-all duration-300 ${logoClass}">
            </div>
            <!-- Navegação -->
            <nav class="flex-1 p-3 space-y-2 overflow-y-auto no-scrollbar">
                <a href="admin.html" class="flex items-center gap-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-3 rounded-lg font-medium transition-colors" data-page="admin.html" title="Visão Geral">
                    <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                    <span class="sidebar-text ${textHiddenClass} transition-opacity duration-300">Visão Geral</span>
                </a>
                <a href="aprovacoes.html" class="flex items-center gap-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-3 rounded-lg font-medium transition-colors" data-page="aprovacoes.html" title="Aprovações">
                    <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                    <span class="sidebar-text ${textHiddenClass} transition-opacity duration-300">Aprovações</span>
                </a>
                <a href="estoque.html" class="flex items-center gap-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-3 rounded-lg font-medium transition-colors" data-page="estoque.html" title="Estoque">
                    <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                    <span class="sidebar-text ${textHiddenClass} transition-opacity duration-300">Estoque</span>
                </a>
            </nav>
        </aside>
    `;

    // Marca o item ativo da página atual
    const pathSegments = window.location.pathname.split("/");
    const currentPage = pathSegments[pathSegments.length - 1] || "admin.html";
    const activeItem = container.querySelector(`[data-page="${currentPage}"]`);
    if (activeItem) {
        activeItem.className = "flex items-center gap-3 bg-fluxfy-yellow/10 dark:bg-fluxfy-yellow/20 text-fluxfy-dark dark:text-fluxfy-yellow px-3 py-3 rounded-lg font-medium transition-colors";
    }

    // Lógica do botão de alternar expansão/recolhimento (Apenas para telas grandes)
    const toggleBtn = document.getElementById("sidebarToggleBtn");
    const sidebar = document.getElementById("app-sidebar");
    const logoImg = document.getElementById("sidebarLogoImg");
    const sidebarTexts = container.querySelectorAll(".sidebar-text");
    const sidebarFooter = container.querySelector(".sidebar-footer");

    if (toggleBtn && sidebar && logoImg) {
        toggleBtn.addEventListener("click", () => {
            // Impede a expansão se estiver em dispositivos móveis/tablets
            if (window.innerWidth < 1024) return;

            const currentlyCollapsed = sidebar.classList.contains("w-20");
            if (currentlyCollapsed) {
                // Expandir
                sidebar.classList.remove("w-20");
                sidebar.classList.add("w-64");
                logoImg.className = "transition-all duration-300 h-20 w-auto object-contain max-w-[150px]";
                setTimeout(() => {
                    sidebarTexts.forEach(el => el.classList.remove("hidden"));
                    if (sidebarFooter) sidebarFooter.classList.remove("hidden");
                }, 150);
                localStorage.setItem("sidebar-collapsed", "false");
            } else {
                // Recolher
                sidebar.classList.remove("w-64");
                sidebar.classList.add("w-20");
                logoImg.className = "transition-all duration-300 h-16 w-auto object-contain max-w-[60px]";
                sidebarTexts.forEach(el => el.classList.add("hidden"));
                if (sidebarFooter) sidebarFooter.classList.add("hidden");
                localStorage.setItem("sidebar-collapsed", "true");
            }
        });
    }
});