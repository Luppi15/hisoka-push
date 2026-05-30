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

if __name__ == '__main__':
    unittest.main()
