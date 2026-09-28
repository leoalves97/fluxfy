"""
chatbot.py
Rota do assistente virtual do Fluxfy, usando a API do Claude (Anthropic).

Arquivo isolado: o main.py só precisa de 2 linhas novas para usar isso
(ver instruções no INSTRUCOES-CHATBOT.md). Nada do que já existe em
main.py, models.py ou database.py é alterado.

Requer:
- pacote "anthropic" instalado (adicionar ao requirements.txt)
- variável ANTHROPIC_API_KEY definida no .env da pasta api/
  (o mesmo .env que já guarda o DATABASE_URL)
"""
import logging
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
import anthropic

# Reaproveita o mesmo carregamento de .env que o database.py já usa
load_dotenv(override=True)

router = APIRouter()
logger = logging.getLogger("uvicorn.error")
logger.info("ANTHROPIC_API_KEY configurada: %s", bool(os.getenv("ANTHROPIC_API_KEY")))

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

MODELO = "claude-sonnet-5"

SYSTEM_PROMPT = (
    "Você é o assistente virtual do Fluxfy, um sistema de caixa (frente de loja/cantina). "
    "Responda em português do Brasil, de forma curta e direta (no máximo 3-4 frases). "
    "O sistema tem: tela de login (e-mail/senha), tela de cadastro (que precisa de aprovação "
    "de um administrador), tela de abertura de caixa, e um painel administrativo para gerenciar "
    "usuários e aprovações. Se a pergunta não tiver relação com o sistema, responda normalmente "
    "como um assistente educado, mas traga o foco de volta para como você pode ajudar com o Fluxfy."
)


class MensagemChat(BaseModel):
    message: str


def gerar_resposta(mensagem: str) -> str:
    """Chama a API do Claude e registra nos logs o motivo real de qualquer falha."""
    try:
        resposta = client.messages.create(
            model=MODELO,
            max_tokens=300,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": mensagem}],
        )
        return resposta.content[0].text
    except anthropic.AuthenticationError:
        logger.error("Chatbot: chave da API invalida ou expirada")
        return "A chave da API do Claude não foi configurada corretamente no servidor."
    except anthropic.RateLimitError:
        logger.warning("Chatbot: limite de requisicoes atingido")
        return "Muitas perguntas ao mesmo tempo. Tenta de novo em 1 minuto."
    except anthropic.APIStatusError as e:
        logger.error("Chatbot: erro da API %s - %s", e.status_code, e.message)
        return "Não consegui falar com a IA agora. Tenta de novo em instantes."
    except Exception:
        logger.exception("Chatbot: erro inesperado (chave ausente?)")
        return "Não consegui falar com a IA agora. Tenta de novo em instantes."


@router.post("/api/chatbot")
def responder_chat(dados: MensagemChat):
    if not dados.message.strip():
        raise HTTPException(status_code=400, detail="Mensagem vazia")
    resposta = gerar_resposta(dados.message)
    return {"reply": resposta}
