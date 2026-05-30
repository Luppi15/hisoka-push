import logging
from flask import Blueprint, request, jsonify
import configuracao
from servicos.wordpress import testar_conexao_wordpress

bp_configuracao = Blueprint('configuracao_rotas', __name__)

@bp_configuracao.route("/settings", methods=["GET", "POST"])
def gerenciar_configuracoes():
    """
    GET: Retorna as configurações atuais.
    POST: Salva novas configurações no arquivo .env local e recarrega na memória.
    """
    configuracao.carregar_configuracoes()
    
    if request.method == "POST":
        dados = request.get_json()
        if not dados:
            return jsonify({"success": False, "message": "Nenhum dado recebido."}), 400
            
        wp_url = dados.get("wp_url", "").strip().rstrip("/")
        wp_usuario = dados.get("wp_user", "").strip()
        wp_senha = dados.get("wp_app_password", "").strip()
        
        if not wp_url or not wp_usuario or not wp_senha:
            return jsonify({"success": False, "message": "Todos os campos de credenciais são obrigatórios."}), 400
            
        try:
            # Sobrescrever o arquivo .env absoluto
            with open(configuracao.CAMINHO_ENV, "w", encoding="utf-8") as f:
                f.write("# Configurações do WordPress\n")
                f.write(f"WP_URL={wp_url}\n")
                f.write(f"WP_USER={wp_usuario}\n")
                f.write(f"WP_APP_PASSWORD={wp_senha}\n\n")
                f.write("# Configurações do Servidor Local\n")
                f.write(f"FLASK_PORT={configuracao.FLASK_PORTA}\n")
                f.write(f"FLASK_DEBUG={str(configuracao.FLASK_DEPURACAO)}\n")
                
            # Forçar o recarregamento em memória
            configuracao.carregar_configuracoes()
            
            logging.info("Novas credenciais salvas no arquivo .env e recarregadas na memória.")
            return jsonify({
                "success": True,
                "message": "Configurações salvas e aplicadas com sucesso!"
            })
        except Exception as e:
            logging.error(f"Erro ao salvar .env: {str(e)}")
            return jsonify({
                "success": False,
                "message": f"Falha ao gravar arquivo .env local: {str(e)}"
            }), 500
            
    # GET: Retorna dados configurados
    return jsonify({
        "wp_url": configuracao.WP_URL,
        "wp_user": configuracao.WP_USUARIO,
        "wp_app_password": configuracao.WP_SENHA_APLICATIVO
    })

@bp_configuracao.route("/test-connection", methods=["POST"])
def testar_conexao():
    """
    Testa a conexão física com o host do WordPress usando as credenciais enviadas (sem salvar).
    """
    dados = request.get_json()
    if not dados:
        return jsonify({"success": False, "message": "Dados inválidos."}), 400
        
    wp_url = dados.get("wp_url", "").strip().rstrip("/")
    wp_usuario = dados.get("wp_user", "").strip()
    wp_senha = dados.get("wp_app_password", "").strip()
    
    if not wp_url or not wp_usuario or not wp_senha:
        return jsonify({"success": False, "message": "Preencha todos os campos para testar."}), 400
        
    sucesso, mensagem = testar_conexao_wordpress(wp_url, wp_usuario, wp_senha)
    
    status_code = 200 if sucesso else 401
    return jsonify({
        "success": sucesso,
        "message": mensagem
    }), status_code
