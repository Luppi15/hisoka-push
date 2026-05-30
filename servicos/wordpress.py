import logging
import requests
import xmlrpc.client
from datetime import datetime
from requests.auth import HTTPBasicAuth
import configuracao

def obter_ou_criar_tags(nomes_tags):
    """
    Busca os IDs das tags no WordPress. Se a tag não existir, ela é criada dinamicamente.
    """
    if not nomes_tags:
        return []
    
    # Importar credenciais atuais
    configuracao.carregar_configuracoes()
    auth = HTTPBasicAuth(configuracao.WP_USUARIO, configuracao.WP_SENHA_APLICATIVO)
    ids_tags = []
    
    for nome_tag in nomes_tags:
        nome_tag = nome_tag.strip()
        if not nome_tag:
            continue
            
        try:
            # 1. Procurar se a tag já existe
            url_busca = f"{configuracao.WP_URL}/wp-json/wp/v2/tags"
            resposta = requests.get(url_busca, auth=auth, params={"search": nome_tag})
            
            tags_existentes = resposta.json()
            correspondencia_exata = None
            if isinstance(tags_existentes, list):
                for t in tags_existentes:
                    if t.get("name", "").lower() == nome_tag.lower():
                        correspondencia_exata = t
                        break
                        
            if correspondencia_exata:
                logging.info(f"Tag existente encontrada: '{nome_tag}' (ID: {correspondencia_exata['id']})")
                ids_tags.append(correspondencia_exata["id"])
            else:
                # 2. Criar a nova tag
                logging.info(f"Tag '{nome_tag}' não encontrada. Criando nova tag...")
                resposta_criacao = requests.post(
                    f"{configuracao.WP_URL}/wp-json/wp/v2/tags",
                    auth=auth,
                    json={"name": nome_tag}
                )
                if resposta_criacao.status_code in [200, 201, 210]:
                    nova_tag = resposta_criacao.json()
                    logging.info(f"Tag '{nome_tag}' criada com sucesso! (ID: {nova_tag['id']})")
                    ids_tags.append(nova_tag["id"])
                else:
                    logging.error(f"Falha ao criar tag '{nome_tag}': {resposta_criacao.text}")
        except Exception as e:
            logging.error(f"Erro ao processar tag '{nome_tag}': {str(e)}")
            
    return ids_tags

def obter_ou_criar_categorias(nomes_categorias):
    """
    Busca os IDs das categorias no WordPress. Se a categoria não existir, ela é criada dinamicamente.
    """
    if not nomes_categorias:
        return []
    
    configuracao.carregar_configuracoes()
    auth = HTTPBasicAuth(configuracao.WP_USUARIO, configuracao.WP_SENHA_APLICATIVO)
    ids_categorias = []
    
    for nome_categoria in nomes_categorias:
        nome_categoria = nome_categoria.strip()
        if not nome_categoria:
            continue
            
        try:
            # 1. Procurar se a categoria já existe
            url_busca = f"{configuracao.WP_URL}/wp-json/wp/v2/categories"
            resposta = requests.get(url_busca, auth=auth, params={"search": nome_categoria})
            
            categorias_existentes = resposta.json()
            correspondencia_exata = None
            if isinstance(categorias_existentes, list):
                for c in categorias_existentes:
                    if c.get("name", "").lower() == nome_categoria.lower():
                        correspondencia_exata = c
                        break
                        
            if correspondencia_exata:
                logging.info(f"Categoria existente encontrada: '{nome_categoria}' (ID: {correspondencia_exata['id']})")
                ids_categorias.append(correspondencia_exata["id"])
            else:
                # 2. Criar a nova categoria
                logging.info(f"Categoria '{nome_categoria}' não encontrada. Criando nova categoria...")
                resposta_criacao = requests.post(
                    f"{configuracao.WP_URL}/wp-json/wp/v2/categories",
                    auth=auth,
                    json={"name": nome_categoria}
                )
                if resposta_criacao.status_code in [200, 201, 210]:
                    nova_categoria = resposta_criacao.json()
                    logging.info(f"Categoria '{nome_categoria}' criada com sucesso! (ID: {nova_categoria['id']})")
                    ids_categorias.append(nova_categoria["id"])
                else:
                    logging.error(f"Falha ao criar categoria '{nome_categoria}': {resposta_criacao.text}")
        except Exception as e:
            logging.error(f"Erro ao processar categoria '{nome_categoria}': {str(e)}")
            
    return ids_categorias

def buscar_todas_categorias():
    """
    Busca todas as categorias registradas no WordPress.
    """
    configuracao.carregar_configuracoes()
    if not configuracao.WP_URL or not configuracao.WP_USUARIO or not configuracao.WP_SENHA_APLICATIVO:
        logging.warning("Credenciais do WordPress ausentes para carregar categorias.")
        return []
        
    auth = HTTPBasicAuth(configuracao.WP_USUARIO, configuracao.WP_SENHA_APLICATIVO)
    url_categorias = f"{configuracao.WP_URL}/wp-json/wp/v2/categories"
    
    try:
        resposta = requests.get(
            url_categorias,
            auth=auth,
            params={"per_page": 100, "orderby": "name"},
            timeout=15
        )
        if resposta.status_code == 200:
            dados = resposta.json()
            if isinstance(dados, list):
                return [{"id": cat.get("id"), "name": cat.get("name")} for cat in dados]
        return []
    except Exception as e:
        logging.error(f"Erro ao buscar categorias do WordPress: {str(e)}")
        return []

def testar_conexao_wordpress(url, usuario, senha):
    """
    Realiza teste de conexão sem salvar na memória.
    """
    auth = HTTPBasicAuth(usuario, senha)
    url_teste = f"{url.rstrip('/')}/wp-json/wp/v2/users/me"
    
    try:
        resposta = requests.get(url_teste, auth=auth, timeout=15)
        if resposta.status_code == 200:
            dados_usuario = resposta.json()
            nome_usuario = dados_usuario.get("name", usuario)
            return True, f"Conexão bem-sucedida! Autenticado como '{nome_usuario}'."
        elif resposta.status_code == 401:
            return False, "Não autorizado. Verifique o Usuário e a Senha de Aplicativo."
        else:
            return False, f"Resposta do WordPress (Status {resposta.status_code}): {resposta.text[:200]}"
    except Exception as e:
        return False, f"Falha de conexão física com o host: {str(e)}"

def cadastrar_post(dados):
    """
    Publica ou agenda um artigo. Tenta via XML-RPC bypass e cai na REST API.
    """
    configuracao.carregar_configuracoes()
    if not configuracao.WP_URL or not configuracao.WP_USUARIO or not configuracao.WP_SENHA_APLICATIVO:
        return False, "Configurações do WordPress ausentes no arquivo .env local.", None, None, None

    titulo = dados.get("title", "").strip()
    slug = dados.get("slug", "").strip()
    conteudo = dados.get("content", "").strip()
    tags_raw = dados.get("tags", [])
    categorias_raw = dados.get("categories", [])
    meta_desc = dados.get("meta_description", "").strip()
    palavra_chave = dados.get("focus_keyword", "").strip()
    data_agendamento = dados.get("schedule_datetime", "").strip()
    status_escolhido = dados.get("post_status", "draft")

    if not titulo:
        return False, "Título é um campo obrigatório.", None, None, None

    # --- Estratégia 1: XML-RPC Bypass (Yoast SEO support) ---
    try:
        logging.info("Tentando cadastrar artigo via bypass XML-RPC (Yoast Meta)...")
        xmlrpc_url = f"{configuracao.WP_URL}/xmlrpc.php"
        servidor = xmlrpc.client.ServerProxy(xmlrpc_url)
        
        status = "publish"
        data_post = None
        
        if status_escolhido == "draft":
            status = "draft"
            if data_agendamento:
                dt = datetime.strptime(data_agendamento, "%Y-%m-%dT%H:%M")
                data_post = xmlrpc.client.DateTime(dt)
        elif data_agendamento:
            dt = datetime.strptime(data_agendamento, "%Y-%m-%dT%H:%M")
            data_post = xmlrpc.client.DateTime(dt)
            status = "future"
            
        custom_fields = []
        if palavra_chave:
            custom_fields.append({'key': '_yoast_wpseo_focuskw', 'value': palavra_chave})
        if meta_desc:
            custom_fields.append({'key': '_yoast_wpseo_metadesc', 'value': meta_desc})
            
        dados_post = {
            'post_title': titulo,
            'post_content': conteudo,
            'post_status': status,
            'terms_names': {
                'post_tag': tags_raw,
                'category': categorias_raw
            },
            'custom_fields': custom_fields
        }
        
        if slug:
            dados_post['post_name'] = slug
        if data_post:
            dados_post['post_date'] = data_post
            
        post_id = servidor.wp.newPost(0, configuracao.WP_USUARIO, configuracao.WP_SENHA_APLICATIVO, dados_post)
        post_criado = servidor.wp.getPost(0, configuracao.WP_USUARIO, configuracao.WP_SENHA_APLICATIVO, post_id)
        link_post = post_criado.get('link', f"{configuracao.WP_URL}/?p={post_id}")
        
        logging.info(f"Artigo publicado via XML-RPC com sucesso! ID: {post_id}")
        status_pt = "Agendado" if status == "future" else ("Rascunho" if status == "draft" else "Publicado")
        
        return True, f"Artigo '{titulo}' cadastrado com sucesso via bypass XML-RPC!", post_id, status_pt, link_post
        
    except Exception as xmlrpc_err:
        logging.warning(f"Bypass XML-RPC indisponível ({str(xmlrpc_err)}). Usando REST API...")

    # --- Estratégia 2: Fallback REST API ---
    ids_tags = obter_ou_criar_tags(tags_raw)
    ids_categorias = obter_ou_criar_categorias(categorias_raw)

    status = "publish"
    data_formatada = None

    if status_escolhido == "draft":
        status = "draft"
        if data_agendamento:
            try:
                dt = datetime.strptime(data_agendamento, "%Y-%m-%dT%H:%M")
                data_formatada = dt.strftime("%Y-%m-%dT%H:%M:%S")
            except ValueError:
                return False, "Formato de data/hora de agendamento inválido.", None, None, None
    elif data_agendamento:
        try:
            dt = datetime.strptime(data_agendamento, "%Y-%m-%dT%H:%M")
            data_formatada = dt.strftime("%Y-%m-%dT%H:%M:%S")
            status = "future"
        except ValueError:
            return False, "Formato de data/hora de agendamento inválido.", None, None, None

    payload = {
        "title": titulo,
        "content": conteudo,
        "status": status,
        "tags": ids_tags,
        "categories": ids_categorias,
        "meta": {
            "_yoast_wpseo_focuskw": palavra_chave,
            "_yoast_wpseo_metadesc": meta_desc
        }
    }

    if slug:
        payload["slug"] = slug
    if data_formatada:
        payload["date"] = data_formatada

    auth = HTTPBasicAuth(configuracao.WP_USUARIO, configuracao.WP_SENHA_APLICATIVO)
    url_posts = f"{configuracao.WP_URL}/wp-json/wp/v2/posts"

    try:
        resposta = requests.post(url_posts, auth=auth, json=payload)
        if resposta.status_code in [200, 201]:
            dados_retorno = resposta.json()
            status_pt = "Agendado" if status == "future" else ("Rascunho" if status == "draft" else "Publicado")
            return True, f"Artigo '{titulo}' cadastrado com sucesso (REST API)!", dados_retorno.get("id"), status_pt, dados_retorno.get("link")
        else:
            dados_erro = resposta.json() if 'application/json' in resposta.headers.get('content-type', '').lower() else {}
            msg_erro = dados_erro.get("message", resposta.text)
            return False, f"Erro retornado pelo WordPress: {msg_erro}", None, None, None
    except Exception as e:
        return False, f"Falha de conexão com a REST API: {str(e)}", None, None, None
