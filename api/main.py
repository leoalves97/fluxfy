import os
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from passlib.context import CryptContext
from sqlalchemy import Column, Integer, String, Numeric, DateTime, func
from api.database import engine, SessionLocal
from api import models
from api.chatbot import router as chatbot_router
from datetime import datetime, date


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

# Libera CORS de forma ampla para o frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chatbot_router)

# --- MODELOS E ROTAS DE USUÁRIOS E AUTENTICAÇÃO ---
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
         
    return {"token": "token_super_secreto_123", "papel": db_user.papel}

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


# --- MODELO E ROTAS DE PRODUTOS (ESTOQUE) ---
class Produto(models.Base):
    __tablename__ = "produtos"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    categoria = Column(String, nullable=False)
    qtd = Column(Integer, default=0)
    preco = Column(Numeric(10, 2), default=0.00)
    data_criacao = Column(DateTime, default=datetime.utcnow)

class ProdutoCreate(BaseModel):
    nome: str
    categoria: str
    qtd: int
    preco: float

@app.get("/api/produtos")
def listar_produtos(db = Depends(get_db)):
    produtos = db.query(Produto).all()
    return produtos

@app.post("/api/produtos")
def criar_produto(produto: ProdutoCreate, db = Depends(get_db)):
    novo_produto = Produto(
        nome=produto.nome,
        categoria=produto.categoria,
        qtd=produto.qtd,
        preco=produto.preco,
        data_criacao=datetime.utcnow()
    )
    db.add(novo_produto)
    db.commit()
    db.refresh(novo_produto)
    return {"mensagem": "Produto cadastrado com sucesso", "id": novo_produto.id}

@app.delete("/api/produtos/{produto_id}")
def excluir_produto(produto_id: int, db = Depends(get_db)):
    prod = db.query(Produto).filter(Produto.id == produto_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    db.delete(prod)
    db.commit()
    return {"mensagem": "Produto excluído com sucesso"}

# --- MODELOS E ROTAS DE VENDAS ---
class ItemCarrinhoSchema(BaseModel):
    id: int
    nome: str
    preco: float
    quantidade: int

class VendaCreateSchema(BaseModel):
    comanda: str
    forma_pagamento: str
    total: float
    itens: List[ItemCarrinhoSchema]

@app.post("/api/vendas")
def finalizar_venda(venda_dados: VendaCreateSchema, db = Depends(get_db)):
    try:
        # 1. Cria o registro principal da venda
        nova_venda = models.Venda(
            comanda=venda_dados.comanda,
            forma_pagamento=venda_dados.forma_pagamento,
            total=venda_dados.total,
            data_criacao=datetime.utcnow()
        )
        db.add(nova_venda)
        db.commit()
        db.refresh(nova_venda)

        # 2. Registra os itens e desconta do estoque
        for item in venda_dados.itens:
            # Salva o item na tabela de itens da venda
            novo_item = models.ItemVenda(
                venda_id=nova_venda.id,
                produto_id=item.id,
                nome_produto=item.nome,
                quantidade=item.quantidade,
                preco_unitario=item.preco
            )
            db.add(novo_item)

            # Dá baixa automática no estoque do produto
            produto_db = db.query(Produto).filter(Produto.id == item.id).first()
            if produto_db:
                produto_db.qtd = max(0, produto_db.qtd - item.quantidade)

        db.commit()
        return {"status": "sucesso", "mensagem": "Venda registrada e estoque atualizado com sucesso!", "venda_id": nova_venda.id}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao processar venda: {str(e)}")

@app.get("/api/vendas/resumo")
def resumo_vendas(db = Depends(get_db)):
    try:
        hoje = date.today()
        
        # Soma o total das vendas de hoje
        vendas_hoje = db.query(func.sum(models.Venda.total))\
            .filter(func.date(models.Venda.data_criacao) == hoje)\
            .scalar() or 0.0

        # Soma o total geral de vendas
        vendas_total = db.query(func.sum(models.Venda.total)).scalar() or 0.0

        # Total de pedidos realizados
        total_pedidos = db.query(models.Venda).count()

        return {
            "vendas_hoje": float(vendas_hoje),
            "vendas_total": float(vendas_total),
            "total_pedidos": int(total_pedidos)
        }
    except Exception as e:
        return {
            "vendas_hoje": 0.0,
            "vendas_total": 0.0,
            "total_pedidos": 0
        }