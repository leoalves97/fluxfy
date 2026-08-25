import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Carrega as configurações do arquivo .env
load_dotenv()

# Pega a URL de conexão do arquivo .env
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# Cria o "motor" que gerencia a comunicação física com o banco
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Cria a fábrica de sessões (cada requisição na API abrirá uma sessão nova)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para criarmos as nossas tabelas do sistema de caixa no futuro
Base = declarative_base()