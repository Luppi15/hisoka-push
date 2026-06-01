from flask import Blueprint, jsonify
from servicos.wordpress import buscar_todas_categorias

bp_categorias = Blueprint('categorias', __name__)

@bp_categorias.route("/wp-categories", methods=["GET"])
def carregar_categorias():
    """
    Busca a lista de categorias cadastradas no WordPress via REST API para carregar no dropdown.
    """
    categorias = buscar_todas_categorias()
    return jsonify(categorias)
