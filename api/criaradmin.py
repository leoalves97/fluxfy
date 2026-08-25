from database import SessionLocal
from models import Usuario
from passlib.context import CryptContext

# Configuração da criptografia (padrão de mercado bcrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def gerar_admin():
    # Abre a conexão (sessão) com o banco
    db = SessionLocal()
    
    email_admin = "admin@fluxfy.com"
    
    # Verifica se o admin já existe para evitar erros
    usuario_existente = db.query(Usuario).filter(Usuario.email == email_admin).first()
    if usuario_existente:
        print("O usuário admin já existe no banco!")
        db.close()
        return

    # Criptografa a senha que usaremos para testar
    senha_texto_puro = "senha123"
    senha_segura = pwd_context.hash(senha_texto_puro)

    # Cria o objeto do usuário com papel admin e já aprovado
    novo_admin = Usuario(
        nome="Administrador",
        email=email_admin,
        senha_hash=senha_segura,
        papel="admin",
        aprovado=True
        # id_painel_aws e aws_secret ficam vazios por enquanto
    )

    # Salva no banco de dados
    db.add(novo_admin)
    db.commit()
    db.close()
    
    print("Sucesso! Usuário Admin criado no Supabase com a senha criptografada.")

if __name__ == "__main__":
    gerar_admin()