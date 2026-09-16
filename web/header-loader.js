/*
 * header-loader.js
 * Injeta o cabeçalho superior, controle de dark mode, menu mobile e dropdown do usuário.
 */
document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("header-container");
    if (!container) return;

    const pathSegments = window.location.pathname.split("/");
    const currentPage = pathSegments[pathSegments.length - 1] || "admin.html";
    
    const titulos = {
        "admin.html": "Painel Administrativo",
        "aprovacoes.html": "Permissões de Usuários",
        "estoque.html": "Gestão de Estoque",
        "abertura-caixa.html": "Frente de Caixa (PDV)"
    };
    const tituloPagina = titulos[currentPage] || "Fluxfy";

    // Pega a inicial do usuário logado para colocar no botão (Avatar)
    let inicialUsuario = "U";
    if (typeof AuthConfig !== 'undefined') {
        const usuarioLogado = AuthConfig.getUsuarioLogado();
        if (usuarioLogado && usuarioLogado.email) {
            inicialUsuario = usuarioLogado.email.charAt(0).toUpperCase();
        }
    }

    container.innerHTML = `
        <header class="h-16 flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 md:px-6 transition-colors duration-300 w-full">
            
            <!-- Botão Menu Mobile & Título -->
            <div class="flex items-center gap-3">
                <button onclick="if(typeof toggleMobileMenu === 'function') toggleMobileMenu()" class="lg:hidden text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 p-2 rounded-lg focus:outline-none transition-colors">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                </button>
                <h1 class="text-lg md:text-xl font-bold text-gray-800 dark:text-white truncate">${tituloPagina}</h1>
            </div>
            
            <div class="flex items-center gap-3 md:gap-4 relative">
                <!-- Botão Dark Mode -->
                <button id="theme-toggle" type="button" class="text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm p-2 transition-colors cursor-pointer">
                    <svg id="theme-toggle-dark-icon" class="hidden w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg>
                    <svg id="theme-toggle-light-icon" class="hidden w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
                </button>
                
                <!-- Usuário -->
                <div class="relative">
                    <button id="userMenuBtn" class="h-8 w-8 rounded-full bg-fluxfy-yellow text-fluxfy-black flex items-center justify-center font-bold focus:outline-none hover:ring-2 hover:ring-offset-2 hover:ring-fluxfy-yellow transition-all cursor-pointer">
                        ${inicialUsuario}
                    </button>
                    <div id="userDropdown" class="dropdown-menu bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <ul class="py-1 text-sm text-gray-700 dark:text-gray-200">
                            <li><a href="#" class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Meu Perfil</a></li>
                            <li><a href="#" class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Configurações</a></li>
                            <li class="border-t border-gray-200 dark:border-gray-700 my-1"></li>
                            <li><button id="btnLogout" class="w-full text-left block px-4 py-2 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">Sair do Sistema</button></li>
                        </ul>
                    </div>
                </div>
            </div>
        </header>
    `;

    // Lógica do Dark Mode
    const themeToggleBtn = document.getElementById('theme-toggle');
    const darkIcon = document.getElementById('theme-toggle-dark-icon');
    const lightIcon = document.getElementById('theme-toggle-light-icon');
    
    if (localStorage.getItem('color-theme') === 'dark' || (!localStorage.getItem('color-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        if (lightIcon) lightIcon.classList.remove('hidden');
    } else {
        document.documentElement.classList.remove('dark');
        if (darkIcon) darkIcon.classList.remove('hidden');
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            darkIcon.classList.toggle('hidden');
            lightIcon.classList.toggle('hidden');
            document.documentElement.classList.toggle('dark');
            localStorage.setItem('color-theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
        });
    }

    // Dropdown de Usuário
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', (e) => { e.stopPropagation(); userDropdown.classList.toggle('active'); });
        document.addEventListener('click', (e) => { if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) userDropdown.classList.remove('active'); });
    }

    // Logout
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('tokenCantina');
            window.location.href = 'index.html';
        });
    }
});