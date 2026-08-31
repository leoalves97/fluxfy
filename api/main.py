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

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

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

# --- CONFIGURAÇÕES DO GOOGLE E AMBIENTE ---
PRODUCTION_URL = os.getenv("VERCEL_URL") 

if PRODUCTION_URL:
    GOOGLE_REDIRECT_URI = f"https://{PRODUCTION_URL}/api/auth/google/callback"
    FRONTEND_URL = f"https://{PRODUCTION_URL}"
else:
    GOOGLE_REDIRECT_URI = "http://127.0.0.1:8000/api/auth/google/callback"
    FRONTEND_URL = "http://127.0.0.1:5500"

# Libera o CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://fluxfy-khaki.vercel.app/"], 
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
    usuario_existente = db.query(models.Usuario).filter(models.Usuario.email == usuario.email).first()
    if usuario_existente:
        raise HTTPException(status_code=409, detail="Este e-mail já possui uma solicitação.")

    senha_segura = pwd_context.hash(usuario.password)

    novo_usuario = models.Usuario(
        nome=usuario.nome,
        email=usuario.email,
        senha_hash=senha_segura,
        papel="user",
        aprovado=False
    )

    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)

    return {"status": "sucesso", "mensagem": "Solicitação enviada para análise."}

class UsuarioLogin(BaseModel):
    email: str
    password: str

@app.post("/api/login")
def login(usuario: UsuarioLogin, db = Depends(get_db)):
    db_user = db.query(models.Usuario).filter(models.Usuario.email == usuario.email).first()
    
    if not db_user:
        raise HTTPException(status_code=404, detail="Cadastro não localizado")
    
    senha_valida = pwd_context.verify(usuario.password, db_user.senha_hash)
    
    if not senha_valida:
        raise HTTPException(status_code=401, detail="E-mail e senha não conferem")
    
    if not db_user.aprovado:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    return {"token": "token_super_secreto_123"}

@app.get("/api/usuarios/pendentes")
def listar_pendentes(db = Depends(get_db)):
    usuarios_pendentes = db.query(models.Usuario).filter(models.Usuario.aprovado == False).all()
    return usuarios_pendentes

@app.get("/api/auth/google/login")
def google_login():
    url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"response_type=code&"
        f"client_id={os.getenv('GOOGLE_CLIENT_ID')}&"
        f"redirect_uri={GOOGLE_REDIRECT_URI}&"
        f"scope=openid%20profile%20email&"
        f"access_type=offline"
    )
    return RedirectResponse(url)

@app.get("/api/auth/google/callback")
async def google_callback(code: str, db = Depends(get_db)):
    token_url = "https://oauth2.googleapis.com/token"
    dados_token = {
        "code": code,
        "client_id": os.getenv("GOOGLE_CLIENT_ID"),
        "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }
    
    async with httpx.AsyncClient() as client:
        resposta_token = await client.post(token_url, data=dados_token)
        access_token = resposta_token.json().get("access_token")
        
        if not access_token:
            raise HTTPException(status_code=400, detail="Falha ao autenticar com o Google")

        user_info_url = "https://www.googleapis.com/oauth2/v1/userinfo"
        headers = {"Authorization": f"Bearer {access_token}"}
        resposta_usuario = await client.get(user_info_url, headers=headers)
        dados_usuario = resposta_usuario.json()

    email_google = dados_usuario.get("email")
    nome_google = dados_usuario.get("name")

    usuario_existente = db.query(models.Usuario).filter(models.Usuario.email == email_google).first()

    if usuario_existente:
        url_retorno = f"{FRONTEND_URL}/web/index.html?auth_status=sucesso&email={email_google}"
        return RedirectResponse(url=url_retorno)
    else:
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