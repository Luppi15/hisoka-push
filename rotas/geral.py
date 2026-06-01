from flask import Blueprint, render_template, send_file
import configuracao
import io
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY

bp_geral = Blueprint('geral', __name__)

@bp_geral.route("/")
def home():
    """
    Renderiza a página principal do painel de administração local.
    """
    configuracao.carregar_configuracoes()
    wp_configurado = bool(configuracao.WP_URL and configuracao.WP_USUARIO and configuracao.WP_SENHA_APLICATIVO)
    return render_template("painel.html", wp_configured=wp_configurado, wp_url=configuracao.WP_URL)

@bp_geral.route("/baixar-termo")
def baixar_termo():
    """
    Gera dinamicamente o PDF do Termo de Compromisso e Responsabilidade do Usuário usando ReportLab.
    """
    buffer = io.BytesIO()
    
    # Configurar o documento PDF com margens de 0.75 polegadas (54 pontos)
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )
    
    story = []
    
    # Estilos de texto
    styles = getSampleStyleSheet()
    
    # Criar estilos customizados para visual premium
    style_header_app = ParagraphStyle(
        'AppHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#ec407a'), # Rosa Hisoka
        alignment=TA_CENTER,
        spaceAfter=4
    )
    
    style_title = ParagraphStyle(
        'TermTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#1c142c'), # Roxo escuro
        alignment=TA_CENTER,
        spaceAfter=15
    )
    
    style_clause_title = ParagraphStyle(
        'ClauseTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#7e57c2'), # Lilás
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )
    
    style_body = ParagraphStyle(
        'TermBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#311b92'), # Indigo escuro para contraste
        alignment=TA_JUSTIFY,
        spaceAfter=8
    )
    
    style_bullet = ParagraphStyle(
        'TermBullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#311b92'),
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=4
    )
    
    style_alert = ParagraphStyle(
        'TermAlert',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor('#ef5350'), # Vermelho danger
        alignment=TA_JUSTIFY
    )

    # 1. Cabeçalho Principal
    story.append(Paragraph("HISOKA PUSH V2", style_header_app))
    story.append(Paragraph("TERMO DE COMPROMISSO E RESPONSABILIDADE DO USUÁRIO", style_title))
    
    # Linha divisória fina
    divider = Table([['']], colWidths=[504])
    divider.setStyle(TableStyle([
        ('LINEBELOW', (0,0), (-1,-1), 1, colors.HexColor('#e1bee7')),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(divider)
    story.append(Spacer(1, 15))
    
    # 2. Caixa de Alerta (Atenção)
    alert_text = Paragraph(
        "<b>ATENÇÃO E AVISO JURÍDICO CRUCIAL:</b> Ao utilizar este aplicativo de automação "
        "e agendamento local, você assume total e irrestrita responsabilidade pelo conteúdo, formato e "
        "revisão de todos os artigos publicados em seu site WordPress. O aplicativo é apenas uma ferramenta técnica "
        "de auxílio de publicação, sendo de exclusiva obrigação do usuário a validação editorial.",
        style_alert
    )
    
    # Tabela estilizada como caixa de alerta
    alert_table = Table([[alert_text]], colWidths=[504])
    alert_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#fcf1fc')),
        ('BOX', (0,0), (-1,-1), 1.5, colors.HexColor('#ef5350')),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(alert_table)
    story.append(Spacer(1, 15))
    
    # 3. Introdução e Cláusulas
    story.append(Paragraph(
        "Este documento constitui um acordo legal e vinculativo entre o Usuário e os Desenvolvedores do Hisoka Push V2 "
        "(\"Aplicativo\"). O uso continuado das funcionalidades do painel, incluindo exportação de JSON, upload de mídias "
        "em lote e envio/agendamento de posts, pressupõe a leitura, entendimento e aceitação integral de todas as cláusulas abaixo.",
        style_body
    ))
    
    story.append(Paragraph("CLÁUSULA 1: OBRIGATORIEDADE CRUCIAL DE REVISÃO EDITORIAL HUMANA", style_clause_title))
    story.append(Paragraph(
        "O Usuário compromete-se formalmente a <b>revisar pessoalmente cada artigo, imagem e metadado</b> gerados por ferramentas "
        "ou colados na área de transferência antes de disparar o comando de publicação técnica (\"Push\"). O Usuário concorda que a "
        "automação e a agilidade proporcionadas pelo aplicativo não substituem o crivo de um editor humano e que <b>erros de conteúdo "
        "publicados sem prévia revisão editorial humana são de responsabilidade exclusiva do Usuário</b>, não cabendo qualquer alegação "
        "de culpa ou defeito no sistema do Aplicativo.",
        style_body
    ))
    
    story.append(Paragraph("CLÁUSULA 2: INEXISTÊNCIA DE VÍNCULO TRABALHISTA, COMERCIAL OU PARCERIAS", style_clause_title))
    story.append(Paragraph(
        "O uso deste Aplicativo de execução estritamente local não estabelece qualquer forma de sociedade, mandato, associação, "
        "agenciamento, consórcio, joint-venture ou relação de trabalho entre o Usuário e os Desenvolvedores. Trata-se unicamente de "
        "licenciamento gratuito de ferramenta de software para uso em ambiente privado do próprio Usuário.",
        style_body
    ))
    
    story.append(Paragraph("CLÁUSULA 3: SEGURANÇA, PROPRIEDADE DAS CREDENCIAIS E DADOS DO WORDPRESS", style_clause_title))
    story.append(Paragraph(
        "O Aplicativo funciona localmente e salva chaves de API e credenciais do WordPress em arquivo .env na máquina física do Usuário. "
        "O Usuário é o único responsável por resguardar o acesso a tais credenciais e chaves contra perdas ou acessos não autorizados "
        "de terceiros no seu próprio ambiente de execução. Os desenvolvedores não possuem acesso remoto e não se responsabilizam por "
        "invasões resultantes de falhas de segurança no computador do Usuário.",
        style_body
    ))
    
    story.append(Paragraph("CLÁUSULA 4: ROL DETALHADO DE ERROS TECNOLÓGICOS E ISENÇÃO DE SUPORTE", style_clause_title))
    story.append(Paragraph(
        "Fica expressamente estabelecido que o Usuário isenta totalmente os desenvolvedores de qualquer obrigação de reparação ou "
        "suporte em face dos seguintes incidentes técnicos mapeados:",
        style_body
    ))
    
    # Lista de erros mapeados
    errors = [
        "<b>Falhas Crassas de Tradução ou Semântica:</b> Artigos traduzidos ou processados automaticamente que contenham erros ortográficos, frases sem sentido lógico, informações incorretas ou termos ofensivos.",
        "<b>Estrutura HTML Corrompida e Quebra de Layout:</b> Tags HTML órfãs (não fechadas), tabelas desconfiguradas, vetores SVG inline mal formatados ou links corrompidos que venham a danificar a apresentação visual do site de destino.",
        "<b>Estouros de Limite de Requisições (Rate Limits) e Falhas de API:</b> Bloqueios temporários ou permanentes impostos pelo servidor de hospedagem do Usuário ou pela API REST do WordPress devido ao volume de uploads de imagens ou artigos.",
        "<b>Divergências de Agendamento (Timezone/Fuso Horário):</b> Publicação de posts fora da hora planejada decorrente de diferenças de configuração de fuso horário entre o servidor Flask local e as configurações do painel do WordPress.",
        "<b>Publicações Duplicadas:</b> Envio de postagens idênticas ao WordPress devido a cliques sucessivos e rápidos do usuário no botão de Push ou falta de aguardo no processamento da resposta da rede.",
        "<b>Perda ou Corrupção de Dados em JSON:</b> Inconsistências ou falhas ocorridas na importação ou exportação de artigos através de arquivos JSON estruturados localmente."
    ]
    
    for err in errors:
        story.append(Paragraph(f"&bull; {err}", style_bullet))
        
    story.append(Paragraph("CLÁUSULA 5: COMPATIBILIDADE E ATUALIZAÇÕES DE SISTEMAS DE TERCEIROS", style_clause_title))
    story.append(Paragraph(
        "Dado que o WordPress e os plugins associados (como o Yoast SEO) sofrem constantes atualizações, os desenvolvedores não garantem "
        "a compatibilidade eterna ou imediata do Aplicativo com novas versões lançadas por terceiros. É responsabilidade do Usuário "
        "gerenciar e testar as atualizações em ambiente seguro e de homologação.",
        style_body
    ))
    
    story.append(Paragraph("CLÁUSULA 6: ISENÇÃO GERAL DE RESPONSABILIDADE E CONCEITO \"COMO ESTÁ\"", style_clause_title))
    story.append(Paragraph(
        "O Aplicativo é fornecido \"como está\" e \"conforme disponível\", sem garantias de qualquer natureza, sejam expressas "
        "ou implícitas. Os desenvolvedores não asseguram que a integração com a API do WordPress funcionará ininterruptamente ou "
        "que o software estará permanentemente livre de erros. Em nenhuma circunstância os desenvolvedores serão responsabilizados "
        "por perdas comerciais, desindexação ou penalidades de SEO aplicadas por mecanismos de busca (como o Google), perda de dados, "
        "ou quaisquer prejuízos de imagem decorrentes do uso da ferramenta.",
        style_body
    ))
    
    story.append(Paragraph("CLÁUSULA 7: LIMITAÇÕES DE SUPORTE E SLA", style_clause_title))
    story.append(Paragraph(
        "Os desenvolvedores reservam-se o direito de atualizar o código, alterar a interface ou descontinuar recursos a qualquer momento, "
        "sem necessidade de aviso prévio e sem obrigação de prestar suporte técnico individualizado ou sob níveis de serviço (SLA).",
        style_body
    ))
    
    story.append(Spacer(1, 10))
    
    # 4. Nota de Consentimento Digital
    consent_info = (
        "<b>Validade do Aceite Digital:</b> Este documento é aceito eletronicamente mediante a marcação da caixa de seleção "
        "\"Li, compreendo e aceito\" e o clique em \"Aceitar e Prosseguir\" no Painel do Hisoka Push V2. O consentimento do usuário "
        "é registrado localmente para fins de auditoria técnica de conformidade."
    )
    
    # Bloco final agrupado com KeepTogether
    footer_story = []
    footer_story.append(Paragraph(consent_info, style_body))
    footer_story.append(Spacer(1, 15))
    
    # Linha divisória de assinatura/auditoria
    auditoria_divider = Table([['']], colWidths=[504])
    auditoria_divider.setStyle(TableStyle([
        ('LINEBELOW', (0,0), (-1,-1), 1, colors.HexColor('#e1bee7')),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ]))
    footer_story.append(auditoria_divider)
    footer_story.append(Spacer(1, 8))
    
    footer_story.append(Paragraph(
        "<font color='#7b1fa2'><b>HISOKA PUSH V2 &bull; SEGURANÇA E CONFORMIDADE EDITORIAL &bull; 2026</b></font>",
        ParagraphStyle('FooterText', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8, alignment=TA_CENTER, textColor=colors.HexColor('#7b1fa2'))
    ))
    
    story.append(KeepTogether(footer_story))
    
    # Construir o documento PDF
    doc.build(story)
    
    buffer.seek(0)
    return send_file(
        buffer,
        mimetype='application/pdf',
        as_attachment=True,
        download_name='Termo_de_Compromisso_e_Responsabilidade.pdf'
    )

