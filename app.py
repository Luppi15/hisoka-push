import logging
from flask import Flask
import configuracao
from rotas.geral import bp_geral
from rotas.publicacao import bp_publicacao
from rotas.configuracao import bp_configuracao
from rotas.categorias import bp_categorias

# Configuração de logging profissional
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Inicializar Flask com as pastas personalizadas e traduzidas
app = Flask(
    __name__,
    template_folder='modelos',
    static_folder='estatico',
    static_url_path='/estatico'
)

# Registrar Blueprints das rotas modularizadas
app.register_blueprint(bp_geral)
app.register_blueprint(bp_publicacao)
app.register_blueprint(bp_configuracao)
app.register_blueprint(bp_categorias)

if __name__ == "__main__":
    logging.info(f"Iniciando o servidor local do Hisoka Push V2 na porta {configuracao.FLASK_PORTA}...")
    app.run(host="127.0.0.1", port=configuracao.FLASK_PORTA, debug=configuracao.FLASK_DEPURACAO)
