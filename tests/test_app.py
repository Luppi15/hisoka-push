import unittest
from app import app

class TestApp(unittest.TestCase):
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def test_home_status_code(self):
        # Envia uma requisição GET para a rota inicial
        response = self.app.get('/')
        # Verifica se o código de status é 200
        self.assertEqual(response.status_code, 200)

    def test_wp_categories_endpoint(self):
        # Envia uma requisição GET para a rota de categorias
        response = self.app.get('/wp-categories')
        # Deve responder com status 200
        self.assertEqual(response.status_code, 200)
        # A resposta deve ser JSON
        self.assertTrue(response.is_json)
        # O retorno deve ser do tipo lista/array
        self.assertIsInstance(response.get_json(), list)

    def test_publish_endpoint_invalid_data(self):
        # Envia requisição com dados vazios para ver se retorna validação 400
        response = self.app.post('/publish', json={})
        self.assertEqual(response.status_code, 400)

    def test_publish_bulk_endpoint_invalid_data(self):
        # Envia requisição sem dados para rota /publish-bulk (deve retornar 400)
        response = self.app.post('/publish-bulk', json={})
        self.assertEqual(response.status_code, 400)

        # Envia requisição com lista de artigos vazia (deve retornar 400)
        response = self.app.post('/publish-bulk', json={"articles": []})
        self.assertEqual(response.status_code, 400)

    def test_verificar_slug_missing_param(self):
        # Envia requisição sem o parâmetro ?slug= (deve retornar 400)
        response = self.app.get('/verificar-slug')
        self.assertEqual(response.status_code, 400)

    from unittest.mock import patch
    @patch('rotas.publicacao.verificar_slug_existente')
    def test_verificar_slug_existente(self, mock_verificar):
        # Configura o mock para retornar True e o título do post
        mock_verificar.return_value = (True, "Post Existente")
        
        response = self.app.get('/verificar-slug?slug=meu-slug')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.is_json)
        
        dados = response.get_json()
        self.assertTrue(dados.get("success"))
        self.assertTrue(dados.get("existe"))
        self.assertEqual(dados.get("titulo"), "Post Existente")

    @patch('rotas.publicacao.verificar_slug_existente')
    def test_verificar_slug_nao_existente(self, mock_verificar):
        # Configura o mock para retornar False
        mock_verificar.return_value = (False, "")
        
        response = self.app.get('/verificar-slug?slug=meu-slug-livre')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.is_json)
        
        dados = response.get_json()
        self.assertTrue(dados.get("success"))
        self.assertFalse(dados.get("existe"))
        self.assertEqual(dados.get("titulo"), "")

if __name__ == '__main__':
    unittest.main()
