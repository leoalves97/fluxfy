import os
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from passlib.context import CryptContext
from api.database import engine, SessionLocal
from api import models
from api.chatbot import router as chatbot_router
from datetime import datetime

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Fluxfy API")

# Configurações de ambiente
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://fluxfy-one.vercel.app").rstrip("/")

# Libera CORS de forma ampla para o frontend no Vercel
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
    usuario_existente = db.query(models.Usuario).filter(models.Usuario.email == usuario.email).first()
    if usuario_existente:
        raise HTTPException(status_code=409, detail="Este e-mail já possui uma solicitação.")

    senha_segura = pwd_context.hash(usuario.password)

    novo_usuario = models.Usuario(
        nome=usuario.nome,
        email=usuario.email,
        senha_hash=senha_segura,
        papel="user",
        aprovado=False,
        data_criacao=datetime.utcnow()
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

@app.get("/api/usuarios")
def listar_usuarios(filtro: str = "todos", db = Depends(get_db)):
    query = db.query(models.Usuario)
    if filtro == "pendentes":
        query = query.filter(models.Usuario.aprovado == False)
    elif filtro == "aprovados":
        query = query.filter(models.Usuario.aprovado == True)
    
    usuarios = query.all()
    
    total = db.query(models.Usuario).count()
    pendentes = db.query(models.Usuario).filter(models.Usuario.aprovado == False).count()
    aprovados = db.query(models.Usuario).filter(models.Usuario.aprovado == True).count()
    
    return {
        "estatisticas": {
            "total": total,
            "pendentes": pendentes,
            "aprovados": aprovados
        },
        "usuarios": usuarios
    }

@app.patch("/api/usuarios/{usuario_id}/aprovar")
def aprovar_usuario(usuario_id: int, db = Depends(get_db)):
    user = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    user.aprovado = True
    db.commit()
    return {"mensagem": "Usuário aprovado com sucesso"}

@app.patch("/api/usuarios/{usuario_id}/admin")
def alternar_admin(usuario_id: int, db = Depends(get_db)):
    user = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    user.papel = "admin" if user.papel != "admin" else "user"
    db.commit()
    return {"mensagem": f"Papel do usuário alterado para {user.papel}"}

@app.delete("/api/usuarios/{usuario_id}")
def excluir_usuario(usuario_id: int, db = Depends(get_db)):
    user = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    db.delete(user)
    db.commit()
    return {"mensagem": "Usuário excluído/recusado com sucesso"}