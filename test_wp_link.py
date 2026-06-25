import requests
import json
from requests.auth import HTTPBasicAuth
from dotenv import load_dotenv
import os

load_dotenv()
WP_URL = os.getenv("WP_URL")
WP_USER = os.getenv("WP_USUARIO")
WP_PASS = os.getenv("WP_SENHA_APLICATIVO")

auth = HTTPBasicAuth(WP_USER, WP_PASS)

payload = {
    "title": "Teste Rascunho Permalink",
    "content": "Conteudo",
    "status": "draft"
}

print("WP_URL:", WP_URL)
res = requests.post(f"{WP_URL}/wp-json/wp/v2/posts", auth=auth, json=payload)
data = res.json()
print("LINK:", data.get("link"))
print("PERMALINK TEMPLATE:", data.get("permalink_template"))
print("SLUG:", data.get("slug"))
print("Generated_slug:", data.get("generated_slug"))

if data.get("id"):
    post_id = data.get("id")
    # GET with context=edit
    res2 = requests.get(f"{WP_URL}/wp-json/wp/v2/posts/{post_id}?context=edit", auth=auth)
    data2 = res2.json()
    print("GET LINK:", data2.get("link"))
    print("GET PERMALINK TEMPLATE:", data2.get("permalink_template"))
    print("GET SLUG:", data2.get("slug"))
    print("GET Generated_slug:", data2.get("generated_slug"))
