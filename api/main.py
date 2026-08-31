from fastapi import FastAPI, HTTPException, Depends
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