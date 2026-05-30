from flask import Blueprint, render_template
import configuracao

bp_geral = Blueprint('geral', __name__)

@bp_geral.route("/")
def home():
    """
    Renderiza a página principal do painel de administração local.
    """
    configuracao.carregar_configuracoes()
    wp_configurado = bool(configuracao.WP_URL and configuracao.WP_USUARIO and configuracao.WP_SENHA_APLICATIVO)
    return render_template("painel.html", wp_configured=wp_configurado, wp_url=configuracao.WP_URL)
