# 🚀 Fluxfy - Sistema de Caixa

Este repositório contém o código do Front-end (HTML/JS/Tailwind) e da API Back-end (FastAPI) para o sistema de solicitação de acesso e login do Fluxfy.

## 🛠️ Tecnologias Utilizadas

* **Back-end:** Python, FastAPI, SQLAlchemy, Passlib (Bcrypt)
* **Banco de Dados:** PostgreSQL (Hospedado no Supabase)
* **Front-end:** HTML, CSS, JavaScript (Vanilla), Tailwind CSS

## ⚙️ Pré-requisitos

Antes de começar, você precisará ter instalado em sua máquina:

* [Git](https://git-scm.com/)
* [Python 3.8+](https://www.python.org/downloads/)
* Uma extensão como *Live Server* no VS Code (opcional, mas recomendado para o Front-end)

---

## 💻 Como rodar o projeto localmente

### 1. Clone o repositório

Abra o seu terminal e rode o comando abaixo para baixar o código:

```bash
git clone [https://github.com/SEU-USUARIO/fluxfy.git](https://github.com/SEU-USUARIO/fluxfy.git)
cd fluxfy

2. Configure o Banco de Dados (Variáveis de Ambiente)
Nunca comitamos o arquivo .env com senhas reais. Por isso:

Dentro da pasta api, faça uma cópia do arquivo .env-example e renomeie a cópia para .env.

Peça a Connection String do banco de dados para a administradora do projeto e cole dentro do arquivo .env:

DATABASE_URL="postgresql://postgres:SENHA_AQUI@db...supabase.co:5432/postgres"

3. Configure e rode o Back-end (API)
Abra um terminal, navegue até a pasta da API e configure o ambiente virtual Python:

No Windows:

cd api
python -m venv .venv
.\.venv\Scripts\activate

No Mac/Linux:

cd api
python3 -m venv .venv
source .venv/bin/activate

Com o ambiente ativado (você verá um (.venv) no terminal), instale as dependências e rode o servidor:

pip install -r requirements.txt
python -m uvicorn main:app --reload

A API estará rodando em: http://127.0.0.1:8000.
Nota: Ao iniciar o servidor pela primeira vez, as tabelas do banco de dados serão recriadas/atualizadas automaticamente.

4. Rode o Front-end
Com a API rodando no terminal, abra uma nova aba do VS Code ou seu gerenciador de arquivos.

Navegue até a raiz do projeto (onde estão os arquivos .html).

Abra o arquivo index.html no seu navegador (arrastando para o browser ou usando a extensão Live Server no VS Code).

Faça o login com as credenciais de teste configuradas no banco.

📌 Rotas da API disponíveis
POST /api/cadastro: Recebe nome, email e password. Cria a solicitação de acesso (requer aprovação).

POST /api/login: Recebe email e password. Valida o hash da senha e status de aprovação.

GET /docs: Acessando esta rota no navegador, você abre a documentação interativa automática do Swagger gerada pelo FastAPI.

***

Agora está pronto para copiar e colar diretamente no seu editor de código!

Quando seu colega subir a tela de admin, o que devemos focar a seguir? Integrar a aprovação de acesso usando n8n, ou começar a trabalhar na criação dos produtos no banco de dados?