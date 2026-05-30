import logging
import xmlrpc.client
import time
import random
from datetime import datetime
from flask import Blueprint, request, jsonify
from requests.auth import HTTPBasicAuth
import requests
import configuracao
from servicos.wordpress import cadastrar_post, verificar_slug_existente

bp_publicacao = Blueprint('publicacao', __name__)

@bp_publicacao.route("/verificar-slug", methods=["GET"])
def verificar_slug():
    """
    Verifica se um slug já está em uso no WordPress.
    """
    slug = request.args.get("slug", "").strip()
    if not slug:
        return jsonify({"success": False, "message": "Parâmetro slug ausente."}), 400
        
    configuracao.carregar_configuracoes()
    if not configuracao.WP_URL or not configuracao.WP_USUARIO or not configuracao.WP_SENHA_APLICATIVO:
        return jsonify({
            "success": False,
            "message": "Configurações do WordPress ausentes."
        }), 400

    existe, titulo = verificar_slug_existente(slug)
    
    return jsonify({
        "success": True,
        "existe": existe,
        "titulo": titulo
    })

@bp_publicacao.route("/publish", methods=["POST"])
def publicar_artigo():
    """
    Recebe os dados do artigo em formato JSON e o cadastra no WordPress.
    """
    configuracao.carregar_configuracoes()
    if not configuracao.WP_URL or not configuracao.WP_USUARIO or not configuracao.WP_SENHA_APLICATIVO:
        return jsonify({
            "success": False,
            "message": "Configurações do WordPress ausentes no arquivo .env local."
        }), 400

    dados = request.get_json()
    if not dados:
        return jsonify({"success": False, "message": "Nenhum dado recebido."}), 400

    sucesso, mensagem, post_id, status, link = cadastrar_post(dados)
    
    if sucesso:
        return jsonify({
            "success": True,
            "message": mensagem,
            "post_id": post_id,
            "status": status,
            "link": link
        })
    else:
        return jsonify({
            "success": False,
            "message": mensagem
        }), 400

@bp_publicacao.route("/publish-bulk", methods=["POST"])
def publicar_em_lote():
    """
    Recebe uma lista de títulos e horários para agendar rascunhos em massa.
    """
    configuracao.carregar_configuracoes()
    if not configuracao.WP_URL or not configuracao.WP_USUARIO or not configuracao.WP_SENHA_APLICATIVO:
        return jsonify({
            "success": False,
            "message": "Configurações do WordPress ausentes no arquivo .env local."
        }), 400

    dados = request.get_json()
    if not dados or "articles" not in dados:
        return jsonify({"success": False, "message": "Nenhum artigo recebido."}), 400

    artigos = dados.get("articles", [])
    if not isinstance(artigos, list) or len(artigos) == 0:
        return jsonify({"success": False, "message": "Lista de artigos inválida ou vazia."}), 400

    resultados = []
    auth = HTTPBasicAuth(configuracao.WP_USUARIO, configuracao.WP_SENHA_APLICATIVO)
    xmlrpc_url = f"{configuracao.WP_URL}/xmlrpc.php"

    for indice, art in enumerate(artigos):
        titulo = art.get("title", "").strip()
        data_agendamento = art.get("schedule_datetime", "").strip()
        
        # Delay aleatório entre 10 e 15 segundos para humanização
        if indice > 0:
            delay = random.randint(10, 15)
            logging.info(f"[Lote] Aguardando delay anti-spam de {delay} segundos antes de enviar '{titulo}'...")
            time.sleep(delay)
            
        if not titulo:
            resultados.append({
                "title": f"Artigo #{indice+1}",
                "success": False,
                "message": "Título vazio."
            })
            continue

        conteudo_rascunho = f"<!-- Rascunho rápido criado via WP Article Publisher. Cole seu HTML final aqui. -->\n<p>Este é um rascunho temporário para o artigo: <strong>{titulo}</strong>. Substitua este conteúdo no WordPress.</p>"
        
        sucesso = False
        post_id = None
        msg_erro = ""
        
        # --- Estratégia 1: XML-RPC ---
        try:
            servidor = xmlrpc.client.ServerProxy(xmlrpc_url)
            data_post = None
            if data_agendamento:
                dt = datetime.strptime(data_agendamento, "%Y-%m-%dT%H:%M")
                data_post = xmlrpc.client.DateTime(dt)

            dados_post = {
                'post_title': titulo,
                'post_content': conteudo_rascunho,
                'post_status': 'draft',
                'custom_fields': []
            }
            if data_post:
                dados_post['post_date'] = data_post

            post_id = servidor.wp.newPost(0, configuracao.WP_USUARIO, configuracao.WP_SENHA_APLICATIVO, dados_post)
            sucesso = True
            logging.info(f"[Lote] Artigo '{titulo}' criado via XML-RPC. ID: {post_id}")
        except Exception as xml_err:
            msg_erro = str(xml_err)
            logging.warning(f"[Lote] Falha XML-RPC para '{titulo}', tentando REST API... Erro: {msg_erro}")

        # --- Estratégia 2: REST API (Fallback) ---
        if not sucesso:
            try:
                data_formatada = None
                if data_agendamento:
                    dt = datetime.strptime(data_agendamento, "%Y-%m-%dT%H:%M")
                    data_formatada = dt.strftime("%Y-%m-%dT%H:%M:%S")

                payload = {
                    "title": titulo,
                    "content": conteudo_rascunho,
                    "status": "draft"
                }
                if data_formatada:
                    payload["date"] = data_formatada

                url_posts = f"{configuracao.WP_URL}/wp-json/wp/v2/posts"
                resposta = requests.post(url_posts, auth=auth, json=payload, timeout=15)
                
                if resposta.status_code in [200, 201]:
                    dados_retorno = resposta.json()
                    post_id = dados_retorno.get("id")
                    sucesso = True
                    logging.info(f"[Lote] Artigo '{titulo}' criado via REST API. ID: {post_id}")
                else:
                    dados_erro = resposta.json() if 'application/json' in resposta.headers.get('content-type', '').lower() else {}
                    msg_erro = dados_erro.get("message", resposta.text)
            except Exception as rest_err:
                msg_erro = str(rest_err)
                logging.error(f"[Lote] Falha completa ao criar rascunho de '{titulo}': {msg_erro}")

        resultados.append({
            "title": titulo,
            "success": sucesso,
            "post_id": post_id,
            "message": "Rascunho criado com sucesso." if sucesso else f"Erro: {msg_erro}"
        })

    return jsonify({
        "success": True,
        "message": f"{sum(1 for r in resultados if r['success'])} de {len(resultados)} rascunhos criados com sucesso.",
        "results": resultados
    })
