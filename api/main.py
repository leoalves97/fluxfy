import os
import httpx
from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from passlib.context import CryptContext
from database import engine, SessionLocal
import models
from chatbot import router as chatbot_router

# Função para criar uma sessão de banco de dados por requisição
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Recria as tabelas no Supabase
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Fluxfy API")

# --- CONFIGURAÇÕES DO GOOGLE ---
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = "http://127.0.0.1:8000/api/auth/google/callback"
FRONTEND_URL = "http://127.0.0.1:5500" # Altere se a porta do seu Live Server for diferente

# Libera o CORS para o frontend local conseguir se comunicar
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(chatbot_router)

class UsuarioCreate(BaseModel):
    nome: str
    email: str
    password: str

@app.post("/api/cadastro")
def cadastrar_usuario(usuario: UsuarioCreate, db = Depends(get_db)):
    # Verificar se o e-mail já está cadastrado
    usuario_existente = db.query(models.Usuario).filter(models.Usuario.email == usuario.email).first()
    if usuario_existente:
        #Se já tiver retorna 409 (conflito)
        raise HTTPException(status_code=409, detail="Este e-mail já possui uma solicitação.")

    # Criptografar a senha
    senha_segura = pwd_context.hash(usuario.password)

    # Preparar dados para salvar
    novo_usuario = models.Usuario(
        nome=usuario.nome,
        email=usuario.email,
        senha_hash=senha_segura,
        papel="user",  # Papel padrão para novos usuários
        aprovado=False
    )

    # Enviar para Supabase
    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario) # Atualizar a variavel com o id gerado peo banco

    return {"status": "sucesso", "mensagem": "Solicitaçao enviada para análise."}

# Configuração para verificar a senha criptografada
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Função que abre e fecha o banco de dados com segurança
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Molde dos dados que o frontend envia no login
class UsuarioLogin(BaseModel):
    email: str
    password: str

@app.post("/api/login")
def login(usuario: UsuarioLogin, db = Depends(get_db)):
    # Tenta encontrar o usuário pelo e-mail
    db_user = db.query(models.Usuario).filter(models.Usuario.email == usuario.email).first()
    
    # Se não encontrar, retorna o Erro 404 (que o front-end mapeou)
    if not db_user:
        raise HTTPException(status_code=404, detail="Cadastro não localizado")
    
    # Compara a senha digitada com o hash salvo no banco
    senha_valida = pwd_context.verify(usuario.password, db_user.senha_hash)
    
    # Se for inválida, retorna o Erro 401
    if not senha_valida:
        raise HTTPException(status_code=401, detail="E-mail e senha não conferem")
    
    # Verifica se o administrador aprovou o cadastro
    if not db_user.aprovado:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    # (Usaremos um token fictício agora, no futuro implementamos um JWT real)
    return {"token": "token_super_secreto_123"}


# Função para listar solicitações pendentes no banco de dados para apresentação no frontend
@app.get("/api/usuarios/pendentes")
def listar_pendentes(db = Depends(get_db)):
    # Faz um SELECT na tabela onde aprovado é False
    usuarios_pendentes = db.query(models.Usuario).filter(models.Usuario.aprovado == False).all()
    
    # O FastAPI converte automaticamente essa lista para JSON
    return usuarios_pendentes

@app.get("/api/auth/google/login")
def google_login():
    """Rota que envia o usuário para a tela oficial do Google"""
    url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"response_type=code&"
        f"client_id={GOOGLE_CLIENT_ID}&"
        f"redirect_uri={GOOGLE_REDIRECT_URI}&"
        f"scope=openid%20profile%20email&"
        f"access_type=offline"
    )
    return RedirectResponse(url)


@app.get("/api/auth/google/callback")
async def google_callback(code: str, db = Depends(get_db)):
    """Rota que o Google chama de volta enviando o código de autorização"""
    token_url = "https://oauth2.googleapis.com/token"
    dados_token = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }
    
    # Troca o código pelo token de acesso
    async with httpx.AsyncClient() as client:
        resposta_token = await client.post(token_url, data=dados_token)
        access_token = resposta_token.json().get("access_token")
        
        if not access_token:
            raise HTTPException(status_code=400, detail="Falha ao autenticar com o Google")

        # Pede os dados do usuário usando o token
        user_info_url = "https://www.googleapis.com/oauth2/v1/userinfo"
        headers = {"Authorization": f"Bearer {access_token}"}
        resposta_usuario = await client.get(user_info_url, headers=headers)
        dados_usuario = resposta_usuario.json()

    # Regras de Negócio no Banco de Dados
    email_google = dados_usuario.get("email")
    nome_google = dados_usuario.get("name")

    usuario_existente = db.query(models.Usuario).filter(models.Usuario.email == email_google).first()

    if usuario_existente:
        # Usuário já existe, manda de volta para o front avisando do sucesso
        url_retorno = f"{FRONTEND_URL}/web/index.html?auth_status=sucesso&email={email_google}"
        return RedirectResponse(url=url_retorno)
    
    else:
        # Novo usuário: cria com status aprovado=False
        senha_aleatoria = pwd_context.hash(f"google_{email_google}_{os.urandom(16)}")
        
        novo_usuario = models.Usuario(
            nome=nome_google,
            email=email_google,
            senha_hash=senha_aleatoria,
            papel="user",
            aprovado=False
        )
        db.add(novo_usuario)
        db.commit()
        
        url_retorno = f"{FRONTEND_URL}/web/index.html?auth_status=pendente"
        return RedirectResponse(url=url_retorno)