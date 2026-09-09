from sqlalchemy import Column, Integer, String, Boolean, DateTime
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