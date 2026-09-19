from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
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