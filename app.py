import os
import logging
from datetime import datetime
import requests
import xmlrpc.client
from requests.auth import HTTPBasicAuth
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv

# Obter o caminho absoluto do diretório onde o app.py está localizado
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, ".env")

# Carregar variáveis de ambiente do arquivo .env absoluto, forçando o override
load_dotenv(dotenv_path=ENV_PATH, override=True)

# Configuração de logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__)

# Configurações do WordPress obtidas do .env
WP_URL = os.getenv("WP_URL", "").rstrip("/")
WP_USER = os.getenv("WP_USER", "")
WP_APP_PASSWORD = os.getenv("WP_APP_PASSWORD", "")
FLASK_PORT = int(os.getenv("FLASK_PORT", 5000))
FLASK_DEBUG = os.getenv("FLASK_DEBUG", "True").lower() == "true"

def get_or_create_tags(tag_names):
    """
    Busca os IDs das tags no WordPress. Se a tag não existir, ela é criada dinamicamente.
    """
    if not tag_names:
        return []
    
    auth = HTTPBasicAuth(WP_USER, WP_APP_PASSWORD)
    tag_ids = []
    
    for tag_name in tag_names:
        tag_name = tag_name.strip()
        if not tag_name:
            continue
            
        try:
            # 1. Procurar se a tag já existe no WordPress
            search_url = f"{WP_URL}/wp-json/wp/v2/tags"
            response = requests.get(search_url, auth=auth, params={"search": tag_name})
            
            existing_tags = response.json()
            # Encontrar correspondência exata de nome (case-insensitive)
            exact_match = None
            if isinstance(existing_tags, list):
                for t in existing_tags:
                    if t.get("name", "").lower() == tag_name.lower():
                        exact_match = t
                        break
                        
            if exact_match:
                logging.info(f"Tag existente encontrada: '{tag_name}' (ID: {exact_match['id']})")
                tag_ids.append(exact_match["id"])
            else:
                # 2. Se não existir, criar a nova tag
                logging.info(f"Tag '{tag_name}' não encontrada. Criando nova tag...")
                create_response = requests.post(
                    f"{WP_URL}/wp-json/wp/v2/tags",
                    auth=auth,
                    json={"name": tag_name}
                )
                if create_response.status_code in [200, 210, 201]:
                    new_tag = create_response.json()
                    logging.info(f"Tag '{tag_name}' criada com sucesso! (ID: {new_tag['id']})")
                    tag_ids.append(new_tag["id"])
                else:
                    logging.error(f"Falha ao criar tag '{tag_name}': {create_response.text}")
        except Exception as e:
            logging.error(f"Erro ao processar tag '{tag_name}': {str(e)}")
            
    return tag_ids

def get_or_create_categories(category_names):
    """
    Busca os IDs das categorias no WordPress. Se a categoria não existir, ela é criada dinamicamente.
    """
    if not category_names:
        return []
    
    auth = HTTPBasicAuth(WP_USER, WP_APP_PASSWORD)
    category_ids = []
    
    for category_name in category_names:
        category_name = category_name.strip()
        if not category_name:
            continue
            
        try:
            # 1. Procurar se a categoria já existe no WordPress
            search_url = f"{WP_URL}/wp-json/wp/v2/categories"
            response = requests.get(search_url, auth=auth, params={"search": category_name})
            
            existing_categories = response.json()
            # Encontrar correspondência exata de nome (case-insensitive)
            exact_match = None
            if isinstance(existing_categories, list):
                for c in existing_categories:
                    if c.get("name", "").lower() == category_name.lower():
                        exact_match = c
                        break
                        
            if exact_match:
                logging.info(f"Categoria existente encontrada: '{category_name}' (ID: {exact_match['id']})")
                category_ids.append(exact_match["id"])
            else:
                # 2. Se não existir, criar a nova categoria
                logging.info(f"Categoria '{category_name}' não encontrada. Criando nova categoria...")
                create_response = requests.post(
                    f"{WP_URL}/wp-json/wp/v2/categories",
                    auth=auth,
                    json={"name": category_name}
                )
                if create_response.status_code in [200, 210, 201]:
                    new_category = create_response.json()
                    logging.info(f"Categoria '{category_name}' criada com sucesso! (ID: {new_category['id']})")
                    category_ids.append(new_category["id"])
                else:
                    logging.error(f"Falha ao criar categoria '{category_name}': {create_response.text}")
        except Exception as e:
            logging.error(f"Erro ao processar categoria '{category_name}': {str(e)}")
            
    return category_ids

@app.route("/")
def home():
    """Renderiza a página principal do dashboard."""
    # Passamos as credenciais configuradas apenas para indicar o status na tela
    wp_configured = bool(WP_URL and WP_USER and WP_APP_PASSWORD)
    return render_template("index.html", wp_configured=wp_configured, wp_url=WP_URL)

@app.route("/publish", methods=["POST"])
def publish_post():
    """
    Recebe os dados do artigo do frontend e publica/agenda no WordPress.
    Tenta primeiro via XML-RPC (bypass para Yoast e tags/cats nativas) e cai no REST API de fallback.
    """
    if not WP_URL or not WP_USER or not WP_APP_PASSWORD:
        return jsonify({
            "success": False,
            "message": "Configurações do WordPress ausentes no arquivo .env local."
        }), 400

    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "Nenhum dado recebido."}), 400

    title = data.get("title", "").strip()
    slug = data.get("slug", "").strip()
    content_html = data.get("content", "").strip()
    tags_raw = data.get("tags", [])
    categories_raw = data.get("categories", [])
    meta_description = data.get("meta_description", "").strip()
    focus_keyword = data.get("focus_keyword", "").strip()
    schedule_datetime = data.get("schedule_datetime", "").strip()
    post_status_choice = data.get("post_status", "publish_schedule")

    if not title or not content_html:
        return jsonify({"success": False, "message": "Título e Conteúdo HTML são campos obrigatórios."}), 400

    # --------------------------------------------------------------------------
    # ESTRATÉGIA 1: TENTATIVA DE POSTAGEM VIA XML-RPC (BYPASS DE PROTEÇÃO DE POST META)
    # --------------------------------------------------------------------------
    try:
        logging.info("Tentando cadastrar artigo via bypass XML-RPC (Yoast Meta)...")
        xmlrpc_url = f"{WP_URL}/xmlrpc.php"
        server = xmlrpc.client.ServerProxy(xmlrpc_url)
        
        # Prepara o status e data no formato XML-RPC DateTime
        status = "publish"
        post_date = None
        
        if post_status_choice == "draft":
            status = "draft"
            if schedule_datetime:
                dt = datetime.strptime(schedule_datetime, "%Y-%m-%dT%H:%M")
                post_date = xmlrpc.client.DateTime(dt)
        elif schedule_datetime:
            dt = datetime.strptime(schedule_datetime, "%Y-%m-%dT%H:%M")
            post_date = xmlrpc.client.DateTime(dt)
            status = "future"
            
        custom_fields = []
        if focus_keyword:
            custom_fields.append({'key': '_yoast_wpseo_focuskw', 'value': focus_keyword})
        if meta_description:
            custom_fields.append({'key': '_yoast_wpseo_metadesc', 'value': meta_description})
            
        post_data = {
            'post_title': title,
            'post_content': content_html,
            'post_status': status,
            'terms_names': {
                'post_tag': tags_raw,
                'category': categories_raw
            },
            'custom_fields': custom_fields
        }
        
        if slug:
            post_data['post_name'] = slug
            
        if post_date:
            post_data['post_date'] = post_date
            
        # Parâmetros: blog_id (0), username, password, struct post
        post_id = server.wp.newPost(0, WP_USER, WP_APP_PASSWORD, post_data)
        
        # Busca o post para retornar o link completo
        created_post = server.wp.getPost(0, WP_USER, WP_APP_PASSWORD, post_id)
        post_link = created_post.get('link', f"{WP_URL}/?p={post_id}")
        
        logging.info(f"Artigo publicado via XML-RPC com sucesso! ID: {post_id}")
        status_pt = "Agendado" if status == "future" else ("Rascunho" if status == "draft" else "Publicado")
        return jsonify({
            "success": True,
            "message": f"Artigo '{title}' cadastrado com sucesso via bypass XML-RPC!",
            "post_id": post_id,
            "status": status_pt,
            "link": post_link
        })
        
    except Exception as xmlrpc_err:
        logging.warning(f"Bypass XML-RPC indisponível ou bloqueado pela hospedagem ({str(xmlrpc_err)}). Usando fallback REST API...")

    # --------------------------------------------------------------------------
    # ESTRATÉGIA 2: FALLBACK PARA A REST API PADRÃO DO WORDPRESS
    # --------------------------------------------------------------------------
    # Processar Tags e Categorias manualmente no REST API
    tag_ids = get_or_create_tags(tags_raw)
    category_ids = get_or_create_categories(categories_raw)

    status = "publish"
    formatted_date = None

    if post_status_choice == "draft":
        status = "draft"
        if schedule_datetime:
            try:
                dt = datetime.strptime(schedule_datetime, "%Y-%m-%dT%H:%M")
                formatted_date = dt.strftime("%Y-%m-%dT%H:%M:%S")
            except ValueError as ve:
                logging.error(f"Formato de data inválido: {schedule_datetime}. Erro: {ve}")
                return jsonify({"success": False, "message": "Formato de data/hora de agendamento inválido."}), 400
    elif schedule_datetime:
        try:
            dt = datetime.strptime(schedule_datetime, "%Y-%m-%dT%H:%M")
            formatted_date = dt.strftime("%Y-%m-%dT%H:%M:%S")
            status = "future"
        except ValueError as ve:
            logging.error(f"Formato de data inválido: {schedule_datetime}. Erro: {ve}")
            return jsonify({"success": False, "message": "Formato de data/hora de agendamento inválido."}), 400

    payload = {
        "title": title,
        "content": content_html,
        "status": status,
        "tags": tag_ids,
        "categories": category_ids,
        "meta": {
            "_yoast_wpseo_focuskw": focus_keyword,
            "_yoast_wpseo_metadesc": meta_description
        }
    }

    if slug:
        payload["slug"] = slug

    if formatted_date:
        payload["date"] = formatted_date

    auth = HTTPBasicAuth(WP_USER, WP_APP_PASSWORD)
    posts_url = f"{WP_URL}/wp-json/wp/v2/posts"

    try:
        logging.info(f"Enviando post '{title}' via REST API...")
        response = requests.post(posts_url, auth=auth, json=payload)
        
        if response.status_code in [200, 201]:
            post_data = response.json()
            logging.info(f"Post cadastrado via REST API! ID: {post_data.get('id')}")
            
            status_pt = "Agendado" if status == "future" else ("Rascunho" if status == "draft" else "Publicado")
            return jsonify({
                "success": True,
                "message": f"Artigo '{title}' cadastrado com sucesso (REST API)!",
                "post_id": post_data.get("id"),
                "status": status_pt,
                "link": post_data.get("link")
            })
        else:
            logging.error(f"Erro na resposta da REST API (Status {response.status_code}): {response.text}")
            error_data = response.json() if response.headers.get('content-type') == 'application/json' else {}
            err_message = error_data.get("message", response.text)
            
            return jsonify({
                "success": False,
                "message": f"Erro retornado pelo WordPress: {err_message}. Nota: Para gravar Yoast Meta via REST API, adicione o snippet PHP indicado nas instruções do console."
            }), response.status_code

    except Exception as e:
        logging.error(f"Erro de conexão na REST API: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Falha de conexão física com o WordPress: {str(e)}"
        }), 500

@app.route("/settings", methods=["GET", "POST"])
def manage_settings():
    """
    GET: Retorna as configurações atuais.
    POST: Grava as configurações novas no arquivo .env e atualiza na memória.
    """
    global WP_URL, WP_USER, WP_APP_PASSWORD
    
    if request.method == "POST":
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "Nenhum dado recebido."}), 400
            
        wp_url = data.get("wp_url", "").strip().rstrip("/")
        wp_user = data.get("wp_user", "").strip()
        wp_app_password = data.get("wp_app_password", "").strip()
        
        if not wp_url or not wp_user or not wp_app_password:
            return jsonify({"success": False, "message": "Todos os campos de credenciais são obrigatórios."}), 400
            
        try:
            # Escreve o arquivo .env absoluto
            with open(ENV_PATH, "w", encoding="utf-8") as f:
                f.write("# Configurações do WordPress\n")
                f.write(f"WP_URL={wp_url}\n")
                f.write(f"WP_USER={wp_user}\n")
                f.write(f"WP_APP_PASSWORD={wp_app_password}\n\n")
                f.write("# Configurações do Servidor Local\n")
                f.write(f"FLASK_PORT={FLASK_PORT}\n")
                f.write(f"FLASK_DEBUG={str(FLASK_DEBUG)}\n")
                
            # Atualiza variáveis na memória
            WP_URL = wp_url
            WP_USER = wp_user
            WP_APP_PASSWORD = wp_app_password
            
            logging.info("Novas credenciais salvas no .env e redefinidas na memória.")
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
        "wp_url": WP_URL,
        "wp_user": WP_USER,
        "wp_app_password": WP_APP_PASSWORD
    })

@app.route("/test-connection", methods=["POST"])
def test_connection():
    """
    Testa a conexão com as credenciais enviadas (sem salvar).
    """
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "Dados inválidos."}), 400
        
    wp_url = data.get("wp_url", "").strip().rstrip("/")
    wp_user = data.get("wp_user", "").strip()
    wp_app_password = data.get("wp_app_password", "").strip()
    
    if not wp_url or not wp_user or not wp_app_password:
        return jsonify({"success": False, "message": "Preencha todos os campos para testar."}), 400
        
    auth = HTTPBasicAuth(wp_user, wp_app_password)
    test_url = f"{wp_url}/wp-json/wp/v2/users/me"
    
    try:
        logging.info(f"Testando conexão com WordPress em {test_url}...")
        response = requests.get(test_url, auth=auth, timeout=15)
        
        if response.status_code == 200:
            user_data = response.json()
            user_name = user_data.get("name", wp_user)
            return jsonify({
                "success": True,
                "message": f"Conexão bem-sucedida! Autenticado como '{user_name}'."
            })
        elif response.status_code == 401:
            return jsonify({
                "success": False,
                "message": "Não autorizado. Verifique o Usuário e a Senha de Aplicativo."
            }), 401
        else:
            return jsonify({
                "success": False,
                "message": f"Resposta do WordPress (Status {response.status_code}): {response.text[:200]}"
            }), response.status_code
    except Exception as e:
        logging.error(f"Erro ao testar conexão: {str(e)}")
        return jsonify({
            "success": False,
            "message": f"Falha de conexão física com o host: {str(e)}"
        }), 500

@app.route("/wp-categories", methods=["GET"])
def get_wp_categories():
    """
    Busca as categorias do WordPress via REST API para preencher o dropdown.
    """
    if not WP_URL or not WP_USER or not WP_APP_PASSWORD:
        logging.warning("Credenciais do WordPress ausentes para buscar categorias.")
        return jsonify([])
        
    auth = HTTPBasicAuth(WP_USER, WP_APP_PASSWORD)
    categories_url = f"{WP_URL}/wp-json/wp/v2/categories"
    
    try:
        logging.info("Buscando lista de categorias do WordPress...")
        response = requests.get(
            categories_url,
            auth=auth,
            params={"per_page": 100, "orderby": "name"},
            timeout=15
        )
        
        if response.status_code == 200:
            categories_data = response.json()
            if isinstance(categories_data, list):
                simplified = [{"id": cat.get("id"), "name": cat.get("name")} for cat in categories_data]
                logging.info(f"{len(simplified)} categorias encontradas com sucesso.")
                return jsonify(simplified)
            
        logging.warning(f"Resposta inválida ao carregar categorias (Status {response.status_code}): {response.text[:200]}")
        return jsonify([])
    except Exception as e:
        logging.error(f"Erro de conexão ao buscar categorias do WordPress: {str(e)}")
        return jsonify([])

@app.route("/publish-bulk", methods=["POST"])
def publish_bulk():
    """
    Recebe uma lista de artigos e publica/agenda esboços rápidos (placeholders) em lote.
    """
    if not WP_URL or not WP_USER or not WP_APP_PASSWORD:
        return jsonify({
            "success": False,
            "message": "Configurações do WordPress ausentes no arquivo .env local."
        }), 400

    data = request.get_json()
    if not data or "articles" not in data:
        return jsonify({"success": False, "message": "Nenhum artigo recebido."}), 400

    articles = data.get("articles", [])
    if not isinstance(articles, list) or len(articles) == 0:
        return jsonify({"success": False, "message": "Lista de artigos inválida ou vazia."}), 400

    results = []
    auth = HTTPBasicAuth(WP_USER, WP_APP_PASSWORD)
    xmlrpc_url = f"{WP_URL}/xmlrpc.php"

    for index, art in enumerate(articles):
        title = art.get("title", "").strip()
        schedule_datetime = art.get("schedule_datetime", "").strip()
        
        if not title:
            results.append({
                "title": f"Artigo #{index+1}",
                "success": False,
                "message": "Título vazio."
            })
            continue

        # Conteúdo padrão do placeholder de rascunho
        placeholder_content = f"<!-- Esboço de artigo criado pelo WP Article Publisher. Cole seu HTML final aqui. -->\n<p>Este é um rascunho rápido para o artigo: <strong>{title}</strong>. Substitua este conteúdo no painel do WordPress.</p>"
        
        # --- Estratégia 1: XML-RPC ---
        success = False
        post_id = None
        err_msg = ""
        
        try:
            server = xmlrpc.client.ServerProxy(xmlrpc_url)
            post_date = None
            if schedule_datetime:
                dt = datetime.strptime(schedule_datetime, "%Y-%m-%dT%H:%M")
                post_date = xmlrpc.client.DateTime(dt)

            post_data = {
                'post_title': title,
                'post_content': placeholder_content,
                'post_status': 'draft',
                'custom_fields': []
            }
            if post_date:
                post_data['post_date'] = post_date

            post_id = server.wp.newPost(0, WP_USER, WP_APP_PASSWORD, post_data)
            success = True
            logging.info(f"[Bulk] Artigo '{title}' criado via XML-RPC. ID: {post_id}")
        except Exception as xml_err:
            err_msg = str(xml_err)
            logging.warning(f"[Bulk] Falha no XML-RPC para '{title}', tentando REST API... Erro: {err_msg}")

        # --- Estratégia 2: REST API (Fallback) ---
        if not success:
            try:
                formatted_date = None
                if schedule_datetime:
                    dt = datetime.strptime(schedule_datetime, "%Y-%m-%dT%H:%M")
                    formatted_date = dt.strftime("%Y-%m-%dT%H:%M:%S")

                payload = {
                    "title": title,
                    "content": placeholder_content,
                    "status": "draft"
                }
                if formatted_date:
                    payload["date"] = formatted_date

                posts_url = f"{WP_URL}/wp-json/wp/v2/posts"
                response = requests.post(posts_url, auth=auth, json=payload, timeout=15)
                
                if response.status_code in [200, 201]:
                    post_data = response.json()
                    post_id = post_data.get("id")
                    success = True
                    logging.info(f"[Bulk] Artigo '{title}' criado via REST API. ID: {post_id}")
                else:
                    error_json = response.json() if response.headers.get('content-type') == 'application/json' else {}
                    err_msg = error_json.get("message", response.text)
            except Exception as rest_err:
                err_msg = str(rest_err)
                logging.error(f"[Bulk] Falha total na criação do artigo '{title}': {err_msg}")

        results.append({
            "title": title,
            "success": success,
            "post_id": post_id,
            "message": "Esboço criado com sucesso." if success else f"Erro: {err_msg}"
        })

    return jsonify({
        "success": True,
        "message": f"{sum(1 for r in results if r['success'])} de {len(results)} rascunhos criados com sucesso.",
        "results": results
    })

if __name__ == "__main__":
    logging.info(f"Iniciando o servidor local na porta {FLASK_PORT}...")
    app.run(host="127.0.0.1", port=FLASK_PORT, debug=FLASK_DEBUG)
