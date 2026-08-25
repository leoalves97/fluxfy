from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from passlib.context import CryptContext
from database import engine, SessionLocal
import models

# Recria as tabelas no Supabase
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Fluxfy API")

# Libera o CORS para o frontend local conseguir se comunicar
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class UsuarioCreate(BaseModel):
    nome: str
    email: str
    password: str

@app.post("/api/cadastro")
def cadastrar_usuario(usuario: UsuarioCreate):
    print(f"UHUL! Chegou do front: Nome={usuario.nome}, Email={usuario.email}")
    return {"status": "sucesso"}

# Configuração para verificar a senha criptografada
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Melhor prática: Função que abre e fecha o banco de dados com segurança
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
    # 1. Tenta encontrar o usuário pelo e-mail
    db_user = db.query(models.Usuario).filter(models.Usuario.email == usuario.email).first()
    
    # Se não encontrar, retorna o Erro 404 (que o front-end mapeou)
    if not db_user:
        raise HTTPException(status_code=404, detail="Cadastro não localizado")
    
    # 2. Compara a senha digitada com o hash salvo no banco
    senha_valida = pwd_context.verify(usuario.password, db_user.senha_hash)
    
    # Se for inválida, retorna o Erro 401
    if not senha_valida:
        raise HTTPException(status_code=401, detail="E-mail e senha não conferem")
    
    # 3. Verifica se o administrador aprovou o cadastro
    if not db_user.aprovado:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    # 4. Tudo certo! Retorna um token para o frontend salvar
    # (Usaremos um token fictício agora, no futuro implementamos um JWT real)
    return {"token": "token_super_secreto_123"}