import requests
import re

def prever(wp_url, titulo, slug_final, categorias_raw):
    try:
        if not slug_final:
            slug_final = re.sub(r'[^a-z0-9\-]', '', titulo.lower().replace(' ', '-'))
            
        res = requests.get(f"{wp_url.rstrip('/')}/wp-json/wp/v2/posts?per_page=1&_embed", headers={"User-Agent": "Mozilla/5.0"}, timeout=5)
        if res.status_code == 200 and len(res.json()) > 0:
            exemplo = res.json()[0]
            link_ex = exemplo.get("link", "")
            slug_ex = exemplo.get("slug", "")
            
            cat_slug_ex = ""
            if "_embedded" in exemplo and "wp:term" in exemplo["_embedded"]:
                termos = exemplo["_embedded"]["wp:term"]
                if termos and len(termos) > 0 and len(termos[0]) > 0:
                    cat_slug_ex = termos[0][0].get("slug", "")
                    
            print(f"Exemplo Link: {link_ex}, Slug: {slug_ex}, Cat: {cat_slug_ex}")
            
            if cat_slug_ex and f"/{cat_slug_ex}/" in link_ex and slug_ex in link_ex:
                primeira_cat = categorias_raw.split(",")[0].strip() if categorias_raw else cat_slug_ex
                minha_cat_slug = re.sub(r'[^a-z0-9\-]', '', primeira_cat.lower().replace(' ', '-'))
                novo_link = link_ex.replace(f"/{cat_slug_ex}/", f"/{minha_cat_slug}/").replace(slug_ex, slug_final)
                return novo_link
            elif slug_ex and slug_ex in link_ex:
                novo_link = link_ex.replace(slug_ex, slug_final)
                return novo_link
    except Exception as e:
        print(e)
    return f"{wp_url.rstrip('/')}/{slug_final}/"

print("Previsto:", prever("https://catracalivre.com.br", "Meu Post Teste", "meu-post-teste", "Receitas R\u00e1pidas"))
