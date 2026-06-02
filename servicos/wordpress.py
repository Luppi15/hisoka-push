import logging
import re
import xmlrpc.client
from datetime import datetime
from requests.auth import HTTPBasicAuth
import configuracao
import cloudscraper

# Instancia global stealth do cloudscraper para reutilização de cookies e bypass de Cloudflare
_scraper = cloudscraper.create_scraper(browser={
    'browser': 'chrome',
    'platform': 'windows',
    'desktop': True
})

# Transports customizados para XML-RPC enviar User-Agent stealth e evitar bloqueio
class StealthSafeTransport(xmlrpc.client.SafeTransport):
    def send_user_agent(self, connection):
        connection.putheader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

class StealthTransport(xmlrpc.client.Transport):
    def send_user_agent(self, connection):
        connection.putheader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")

def obter_cabecalhos_stealth(cabecalhos_adicionais=None):
    """
    Retorna cabeçalhos padrão simulando um navegador real para evitar bloqueios de WAF (ex: Cloudflare).
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        "Connection": "keep-alive"
    }
    if cabecalhos_adicionais:
        headers.update(cabecalhos_adicionais)
    return headers

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
            resposta = _scraper.get(url_busca, auth=auth, headers=obter_cabecalhos_stealth(), params={"search": nome_tag})
            
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
                resposta_criacao = _scraper.post(
                    f"{configuracao.WP_URL}/wp-json/wp/v2/tags",
                    auth=auth,
                    headers=obter_cabecalhos_stealth(),
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
            resposta = _scraper.get(url_busca, auth=auth, headers=obter_cabecalhos_stealth(), params={"search": nome_categoria})
            
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
                resposta_criacao = _scraper.post(
                    f"{configuracao.WP_URL}/wp-json/wp/v2/categories",
                    auth=auth,
                    headers=obter_cabecalhos_stealth(),
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
        resposta = _scraper.get(
            url_categorias,
            auth=auth,
            headers=obter_cabecalhos_stealth(),
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
        resposta = _scraper.get(url_teste, auth=auth, headers=obter_cabecalhos_stealth(), timeout=15)
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

def converter_para_gutenberg(html):
    """
    Converte HTML puro em blocos Gutenberg do WordPress.
    Garante que NENHUM conteúdo fique 'solto' (sem wrapper de bloco),
    evitando completamente o aviso de 'Converter para blocos' no editor.
    Preserva qualquer bloco Gutenberg existente (ex: <!-- wp:html -->...<!-- /wp:html -->) intacto.
    """
    if not html:
        return ""

    # Expressão regular para encontrar blocos Gutenberg existentes (com ou sem conteúdo)
    gutenberg_pattern = re.compile(
        r'<!--\s*wp:(?P<name>[\w\-]+(?:/[\w\-]+)?)(?:\s+[^>]*)?-->.*?<!--\s*/wp:(?P=name)\s*-->|'
        r'<!--\s*wp:[\w\-]+(?:/[\w\-]+)?(?:\s+[^>]*)?/-->',
        re.DOTALL
    )

    # Segmentar o HTML em partes preservadas (blocos Gutenberg existentes) e partes comuns (HTML puro)
    segmentos = []
    last_idx = 0
    for match in gutenberg_pattern.finditer(html):
        start, end = match.span()
        if start > last_idx:
            segmentos.append((html[last_idx:start], False))
        segmentos.append((html[start:end], True))
        last_idx = end
    if last_idx < len(html):
        segmentos.append((html[last_idx:], False))

    BLOCK_MAP = {
        'p':          ('<!-- wp:paragraph -->', '<!-- /wp:paragraph -->'),
        'h1':         ('<!-- wp:heading {"level":1} -->', '<!-- /wp:heading -->'),
        'h2':         ('<!-- wp:heading -->', '<!-- /wp:heading -->'),
        'h3':         ('<!-- wp:heading {"level":3} -->', '<!-- /wp:heading -->'),
        'h4':         ('<!-- wp:heading {"level":4} -->', '<!-- /wp:heading -->'),
        'h5':         ('<!-- wp:heading {"level":5} -->', '<!-- /wp:heading -->'),
        'h6':         ('<!-- wp:heading {"level":6} -->', '<!-- /wp:heading -->'),
        'ul':         ('<!-- wp:list -->', '<!-- /wp:list -->'),
        'ol':         ('<!-- wp:list {"ordered":true} -->', '<!-- /wp:list -->'),
        'blockquote': ('<!-- wp:quote -->', '<!-- /wp:quote -->'),
        'table':      ('<!-- wp:table -->', '<!-- /wp:table -->'),
        'figure':     ('<!-- wp:image -->', '<!-- /wp:image -->'),
        'pre':        ('<!-- wp:code -->', '<!-- /wp:code -->'),
        'hr':         (None, None),  # Self-closing
    }

    block_pattern = re.compile(
        r'(<blockquote(?:\s[^>]*)?>.*?</blockquote>|'
        r'<table(?:\s[^>]*)?>.*?</table>|'
        r'<figure(?:\s[^>]*)?>.*?</figure>|'
        r'<ul(?:\s[^>]*)?>.*?</ul>|'
        r'<ol(?:\s[^>]*)?>.*?</ol>|'
        r'<div(?:\s[^>]*)?>.*?</div>|'
        r'<pre(?:\s[^>]*)?>.*?</pre>|'
        r'<p(?:\s[^>]*)?>.*?</p>|'
        r'<h[1-6](?:\s[^>]*)?>.*?</h[1-6]>|'
        r'<hr\s*/?>|'
        r'<img\s[^>]*?/?>|'
        r'<iframe(?:\s[^>]*)?>.*?</iframe>)',
        flags=re.IGNORECASE | re.DOTALL
    )

    blocos_resultado = []

    for conteudo, eh_preservado in segmentos:
        if eh_preservado:
            # Preservar o bloco Gutenberg existente exatamente como está
            blocos_resultado.append(conteudo.strip())
        else:
            # Processar o HTML padrão para envelopar em blocos
            # Remover comentários HTML genéricos que NÃO são blocos Gutenberg
            conteudo_limpo = re.sub(r'<!--(?!\s*/?wp:).*?-->', '', conteudo, flags=re.DOTALL)
            
            # Dividir em blocos HTML
            partes = block_pattern.split(conteudo_limpo)
            for parte in partes:
                if not parte:
                    continue

                parte_strip = parte.strip()
                if not parte_strip:
                    continue

                # Verificar se é um bloco reconhecido
                match_tag = re.match(r'^<(\w+)[\s>]', parte_strip, re.IGNORECASE)

                if match_tag:
                    tag = match_tag.group(1).lower()

                    if tag == 'hr':
                        blocos_resultado.append('<!-- wp:separator -->\n<hr class="wp-block-separator has-alpha-channel-opacity"/>\n<!-- /wp:separator -->')
                        continue

                    if tag == 'img':
                        blocos_resultado.append(
                            f'<!-- wp:image -->\n<figure class="wp-block-image">{parte_strip}</figure>\n<!-- /wp:image -->'
                        )
                        continue

                    if tag == 'iframe':
                        blocos_resultado.append(f'<!-- wp:html -->\n{parte_strip}\n<!-- /wp:html -->')
                        continue

                    if tag == 'div':
                        blocos_resultado.append(f'<!-- wp:group -->\n{parte_strip}\n<!-- /wp:group -->')
                        continue

                    if tag in BLOCK_MAP:
                        opener, closer = BLOCK_MAP[tag]
                        blocos_resultado.append(f'{opener}\n{parte_strip}\n{closer}')
                        continue

                # Qualquer conteúdo que sobrou e não é bloco reconhecido
                if re.search(r'<[^>]+>', parte_strip):
                    blocos_resultado.append(f'<!-- wp:html -->\n{parte_strip}\n<!-- /wp:html -->')
                else:
                    blocos_resultado.append(f'<!-- wp:paragraph -->\n<p>{parte_strip}</p>\n<!-- /wp:paragraph -->')

    return '\n\n'.join(blocos_resultado)

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
    conteudo = converter_para_gutenberg(conteudo)
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
        if xmlrpc_url.startswith("https://"):
            servidor = xmlrpc.client.ServerProxy(xmlrpc_url, transport=StealthSafeTransport())
        else:
            servidor = xmlrpc.client.ServerProxy(xmlrpc_url, transport=StealthTransport())
        
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
        resposta = _scraper.post(url_posts, auth=auth, headers=obter_cabecalhos_stealth(), json=payload)
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

def verificar_slug_existente(slug):
    """
    Verifica na API REST do WordPress se um determinado slug já existe.
    Busca por posts com status publish, future, draft, pending, trash.
    Retorna (existe: bool, titulo: str, erro_verificacao: bool)
    """
    if not slug:
        return False, "", False
        
    configuracao.carregar_configuracoes()
    auth = HTTPBasicAuth(configuracao.WP_USUARIO, configuracao.WP_SENHA_APLICATIVO)
    url_posts = f"{configuracao.WP_URL.rstrip('/')}/wp-json/wp/v2/posts"
    
    params = {
        "slug": slug,
        "status": "publish,future,draft,pending,trash"
    }
    
    try:
        resposta = _scraper.get(url_posts, auth=auth, headers=obter_cabecalhos_stealth(), params=params, timeout=10)
        if resposta.status_code == 200:
            posts = resposta.json()
            if isinstance(posts, list):
                if len(posts) == 0:
                    return False, "", False
                
                # Verificar se algum dos posts retornados realmente possui o slug buscado
                for post in posts:
                    retornou_slug = post.get("slug", "").strip().lower()
                    if retornou_slug == slug.strip().lower():
                        titulo_post = post.get("title", {}).get("rendered", "Sem Título")
                        return True, titulo_post, False
                
                # Se retornou posts mas nenhum bate com o slug, o servidor ignorou o filtro
                return False, "", True
            return False, "", True
        else:
            logging.warning(f"Erro ao verificar slug na REST API ({resposta.status_code}): {resposta.text}")
            return False, "", True
    except Exception as e:
        logging.error(f"Erro de conexão ao verificar slug: {str(e)}")
        return False, "", True

def fazer_upload_midia(nome_arquivo, bytes_arquivo, mime_type, metadados):
    """
    Faz o upload de uma imagem binária para o WordPress e define seus metadados.
    metadados é um dicionário contendo:
      - title (Título da imagem)
      - alt_text (Texto Alternativo)
      - credits (Créditos da imagem)
    """
    configuracao.carregar_configuracoes()
    
    # 1. Upload Inicial (POST raw bytes)
    auth = HTTPBasicAuth(configuracao.WP_USUARIO, configuracao.WP_SENHA_APLICATIVO)
    url_media = f"{configuracao.WP_URL.rstrip('/')}/wp-json/wp/v2/media"
    
    headers = obter_cabecalhos_stealth({
        "Content-Type": mime_type,
        "Content-Disposition": f'attachment; filename="{nome_arquivo}"'
    })
    
    try:
        logging.info(f"Iniciando upload do arquivo '{nome_arquivo}' ({len(bytes_arquivo)} bytes)...")
        # Enviar bytes brutos da imagem
        resposta = _scraper.post(url_media, auth=auth, headers=headers, data=bytes_arquivo, timeout=30)
        
        if resposta.status_code not in [200, 201]:
            logging.error(f"Erro no upload inicial da mídia ({resposta.status_code}): {resposta.text}")
            return False, f"Erro no upload da imagem: {resposta.text}", None, None
            
        dados_midia = resposta.json()
        media_id = dados_midia.get("id")
        media_url = dados_midia.get("source_url")
        logging.info(f"Imagem cadastrada com sucesso! ID: {media_id}, URL: {media_url}")
        
        # 2. Atualização dos Metadados (Nativos garantidos)
        url_patch = f"{url_media}/{media_id}"
        
        title = metadados.get("title", "").strip()
        alt_text = metadados.get("alt_text", "").strip()
        caption = metadados.get("caption", "").strip()
        description = metadados.get("description", "").strip()
        
        payload_nativo = {
            "title": title,
            "alt_text": alt_text,
            "caption": caption,
            "description": description
        }
        
        logging.info(f"Atualizando metadados nativos da mídia {media_id}...")
        resposta_nativo = _scraper.post(url_patch, auth=auth, headers=obter_cabecalhos_stealth(), json=payload_nativo, timeout=15)
        if resposta_nativo.status_code != 200:
            logging.warning(f"Erro ao atualizar metadados nativos ({resposta_nativo.status_code}): {resposta_nativo.text}")
            
        return True, "Imagem enviada e metadados configurados com sucesso!", media_id, media_url
        
    except Exception as e:
        logging.error(f"Erro de conexão no upload da imagem: {str(e)}")
        return False, f"Falha de conexão com a REST API do WordPress: {str(e)}", None, None

