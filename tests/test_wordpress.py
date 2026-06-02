import unittest
from servicos.wordpress import converter_para_gutenberg

class TestWordpressConverter(unittest.TestCase):
    def test_empty_html(self):
        self.assertEqual(converter_para_gutenberg(""), "")
        self.assertEqual(converter_para_gutenberg(None), "")

    def test_simple_paragraph(self):
        html = "<p>Olá mundo</p>"
        expected = "<!-- wp:paragraph -->\n<p>Olá mundo</p>\n<!-- /wp:paragraph -->"
        self.assertEqual(converter_para_gutenberg(html), expected)

    def test_preserves_wp_html_blocks(self):
        html = (
            "<p>Parágrafo 1</p>\n"
            "<!-- wp:html -->\n"
            '<div class="custom-card">\n'
            '  <span>Texto intacto</span>\n'
            '</div>\n'
            "<!-- /wp:html -->\n"
            "<p>Parágrafo 2</p>"
        )
        expected = (
            "<!-- wp:paragraph -->\n"
            "<p>Parágrafo 1</p>\n"
            "<!-- /wp:paragraph -->\n\n"
            "<!-- wp:html -->\n"
            '<div class="custom-card">\n'
            '  <span>Texto intacto</span>\n'
            '</div>\n'
            "<!-- /wp:html -->\n\n"
            "<!-- wp:paragraph -->\n"
            "<p>Parágrafo 2</p>\n"
            "<!-- /wp:paragraph -->"
        )
        self.assertEqual(converter_para_gutenberg(html), expected)

    def test_preserves_other_wp_blocks(self):
        html = (
            "<h2>Título</h2>\n"
            "<!-- wp:separator /-->\n"
            "<p>Parágrafo</p>"
        )
        expected = (
            "<!-- wp:heading -->\n"
            "<h2>Título</h2>\n"
            "<!-- /wp:heading -->\n\n"
            "<!-- wp:separator /-->\n\n"
            "<!-- wp:paragraph -->\n"
            "<p>Parágrafo</p>\n"
            "<!-- /wp:paragraph -->"
        )
        self.assertEqual(converter_para_gutenberg(html), expected)

if __name__ == '__main__':
    unittest.main()
