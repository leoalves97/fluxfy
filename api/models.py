from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from api.database import Base

class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String)
    email = Column(String, unique=True, index=True)
    senha_hash = Column(String)
         
    # Controle de acesso e data
    papel = Column(String, default="user") # 'admin' ou 'user'
    aprovado = Column(Boolean, default=False)
    data_criacao = Column(DateTime, default=datetime.utcnow) 
         
    # Campos para integração futura com n8n
    id_painel_aws = Column(String, index=True, nullable=True)
    aws_secret = Column(String, nullable=True)

class Categoria(Base):
    __tablename__ = "categorias"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, unique=True, nullable=False)
    descricao = Column(String, nullable=True)
    data_criacao = Column(DateTime, default=datetime.utcnow)

    # Relacionamento: Uma categoria possui vários produtos
    produtos = relationship("Produto", back_populates="categoria_rel")

class Produto(Base):
    __tablename__ = "produtos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    categoria = Column(String, nullable=False)  # Mantido para compatibilidade com o front atual
    categoria_id = Column(Integer, ForeignKey("categorias.id"), nullable=True) # Chave estrangeira ligando à tabela categorias
    qtd = Column(Integer, default=0)
    preco = Column(Numeric(10, 2), default=0.00)
    data_criacao = Column(DateTime, default=datetime.utcnow)

    # Relacionamento com categoria
    categoria_rel = relationship("Categoria", back_populates="produtos")

class Venda(Base):
    __tablename__ = "vendas"
    
    id = Column(Integer, primary_key=True, index=True)
    comanda = Column(String, nullable=False)
    forma_pagamento = Column(String, nullable=False)
    total = Column(Numeric(10, 2), nullable=False)
    data_criacao = Column(DateTime, default=datetime.utcnow)
    
    # Relacionamento com os itens da venda
    itens = relationship("ItemVenda", back_populates="venda", cascade="all, delete-orphan")

class ItemVenda(Base):
    __tablename__ = "itens_venda"
    
    id = Column(Integer, primary_key=True, index=True)
    venda_id = Column(Integer, ForeignKey("vendas.id"), nullable=False)
    produto_id = Column(Integer, nullable=False)
    nome_produto = Column(String, nullable=False)
    quantidade = Column(Integer, nullable=False)
    preco_unitario = Column(Numeric(10, 2), nullable=False)
    
    venda = relationship("Venda", back_populates="itens")