import os
import logging
from dotenv import load_dotenv

# Diretórios e caminhos do arquivo .env
DIRETORIO_BASE = os.path.dirname(os.path.abspath(__file__))
CAMINHO_ENV = os.path.join(DIRETORIO_BASE, ".env")

# Definição das variáveis globais no escopo do módulo para suporte a IDEs e LSPs
WP_URL = ""
WP_USUARIO = ""
WP_SENHA_APLICATIVO = ""
FLASK_PORTA = 5000
FLASK_DEPURACAO = True

def carregar_configuracoes():
    """
    Carrega ou recarrega as variáveis de ambiente do arquivo .env absoluto, forçando o override.
    """
    load_dotenv(dotenv_path=CAMINHO_ENV, override=True)
    
    # Credenciais do WordPress
    global WP_URL, WP_USUARIO, WP_SENHA_APLICATIVO, FLASK_PORTA, FLASK_DEPURACAO
    
    WP_URL = os.getenv("WP_URL", "").rstrip("/")
    WP_USUARIO = os.getenv("WP_USER", "")
    WP_SENHA_APLICATIVO = os.getenv("WP_APP_PASSWORD", "")
    
    # Configurações do servidor Flask
    try:
        FLASK_PORTA = int(os.getenv("FLASK_PORT", 5000))
    except (ValueError, TypeError):
        FLASK_PORTA = 5000
        
    FLASK_DEPURACAO = os.getenv("FLASK_DEBUG", "True").lower() == "true"
    
    logging.info("Configurações locais carregadas com sucesso a partir do arquivo .env.")

# Inicializar configurações na carga do módulo
carregar_configuracoes()
