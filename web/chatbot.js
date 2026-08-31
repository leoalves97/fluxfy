/*
 * chatbot.js
 * Widget de chat flutuante do Fluxfy.
 * Arquivo independente: não altera nenhum outro .js do projeto.
 * Para ativar em uma página, basta adicionar:
 *   <script src="chatbot.js" defer></script>
 * logo abaixo dos outros <script> do <head>.
 */

const CHATBOT_API_URL = "http://127.0.0.1:8000/api/chatbot";

document.addEventListener("DOMContentLoaded", () => {
    injectChatbotUI();
    setupChatbotEvents();
});

function injectChatbotUI() {
    const wrapper = document.createElement("div");
    wrapper.id = "fluxfy-chatbot-root";
    wrapper.innerHTML = `
        <!-- Botão flutuante -->
        <button id="chatbot-toggle"
            class="fixed bottom-5 right-5 z-50 bg-fluxfy-yellow hover:bg-fluxfy-dark text-fluxfy-black rounded-full w-14 h-14 shadow-lg flex items-center justify-center transition-colors"
            aria-label="Abrir chat de ajuda">
            <svg id="chatbot-icon-open" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.8L3 20l1.3-3.9A7.9 7.9 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <svg id="chatbot-icon-close" class="w-6 h-6 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>

        <!-- Painel do chat -->
        <div id="chatbot-panel"
            class="hidden fixed bottom-24 right-5 z-50 w-80 max-w-[90vw] h-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden transition-colors">

            <div class="bg-fluxfy-yellow text-fluxfy-black px-4 py-3 font-bold flex items-center justify-between">
                <span>Assistente Fluxfy</span>
            </div>

            <div id="chatbot-messages"
                class="flex-1 overflow-y-auto p-3 space-y-2 text-sm bg-gray-50 dark:bg-gray-900 transition-colors">
                <div class="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 max-w-[85%] shadow-sm">
                    Oi! Eu sou o assistente do Fluxfy. Como posso ajudar? 😊
                </div>
            </div>

            <form id="chatbot-form" class="flex border-t border-gray-200 dark:border-gray-700">
                <input id="chatbot-input" type="text" placeholder="Digite sua pergunta..."
                    class="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none"
                    autocomplete="off" />
                <button type="submit"
                    class="px-4 bg-fluxfy-yellow hover:bg-fluxfy-dark text-fluxfy-black text-sm font-semibold transition-colors">
                    Enviar
                </button>
            </form>
        </div>
    `;
    document.body.appendChild(wrapper);
}

function setupChatbotEvents() {
    const toggleBtn = document.getElementById("chatbot-toggle");
    const panel = document.getElementById("chatbot-panel");
    const iconOpen = document.getElementById("chatbot-icon-open");
    const iconClose = document.getElementById("chatbot-icon-close");
    const form = document.getElementById("chatbot-form");
    const input = document.getElementById("chatbot-input");
    const messages = document.getElementById("chatbot-messages");

    toggleBtn.addEventListener("click", () => {
        panel.classList.toggle("hidden");
        iconOpen.classList.toggle("hidden");
        iconClose.classList.toggle("hidden");
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;

        addMessage(messages, text, "user");
        input.value = "";

        const typingEl = addMessage(messages, "Digitando...", "bot", true);

        try {
            const resposta = await fetchChatbotReply(text);
            typingEl.textContent = resposta;
        } catch (err) {
            typingEl.textContent = "Não consegui falar com o servidor. A API está rodando?";
        }
    });
}

function addMessage(container, text, sender, isTemp = false) {
    const bubble = document.createElement("div");
    bubble.textContent = text;

    if (sender === "user") {
        bubble.className =
            "ml-auto bg-fluxfy-yellow text-fluxfy-black rounded-lg px-3 py-2 max-w-[85%] shadow-sm";
    } else {
        bubble.className =
            "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg px-3 py-2 max-w-[85%] shadow-sm" +
            (isTemp ? " opacity-60 italic" : "");
    }

    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
    return bubble;
}

async function fetchChatbotReply(message) {
    const response = await fetch(CHATBOT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
    });

    if (!response.ok) throw new Error("Erro na API do chatbot");

    const data = await response.json();
    return data.reply;
}
