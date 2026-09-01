from sqlalchemy import Column, Integer, String, Boolean
from api.database import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String)
    email = Column(String, unique=True, index=True)
    senha_hash = Column(String)
    
    # Novos campos para controle de acesso
    papel = Column(String, default="user") # Pode ser 'admin' ou 'user'
    aprovado = Column(Boolean, default=False)
    
    # Campos para integração futura com n8n
    id_painel_aws = Column(String, index=True, nullable=True)
    aws_secret = Column(String, nullable=True)