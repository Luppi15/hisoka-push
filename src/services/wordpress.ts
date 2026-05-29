export interface WordPressCredentials {
  siteUrl: string;
  username: string;
  appPassword: string;
}

export interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt: string;       // resumo exibido no card do Google Discover
  content: string;
  focusKeyword: string;
  metaDescription: string;
  scheduleDate: string; // YYYY-MM-DDTHH:MM
  categoryId: number | '';
  tagsString: string; // comma-separated tags
  featuredMediaId?: number; // WP media ID for featured image
}

export interface WPMedia {
  id: number;
  title: string;
  url: string;       // source_url
  thumbnail: string; // sizes.thumbnail or source_url
  alt: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

/**
 * Normaliza a URL do site para garantir que comece com http(s) e não termine com barra.
 */
function normalizeUrl(url: string): string {
  let cleanUrl = url.trim();
  if (!/^https?:\/\//i.test(cleanUrl)) {
    cleanUrl = 'https://' + cleanUrl;
  }
  return cleanUrl.replace(/\/+$/, '');
}

/**
 * Cria o cabeçalho de autenticação Basic com base no Usuário e Senha de Aplicativo.
 */
function getAuthHeader(username: string, appPassword: string): string {
  // Remove espaços que possam vir na senha de aplicativo
  const cleanPassword = appPassword.replace(/\s+/g, '');
  return 'Basic ' + btoa(`${username.trim()}:${cleanPassword}`);
}

/**
 * Testa as credenciais informadas buscando categorias e tags.
 */
export async function testConnection(credentials: WordPressCredentials): Promise<{
  success: boolean;
  categories: Category[];
  tags: Tag[];
  message: string;
}> {
  try {
    const siteUrl = normalizeUrl(credentials.siteUrl);
    const authHeader = getAuthHeader(credentials.username, credentials.appPassword);
    
    // Requisição simultânea de categorias e tags para otimizar velocidade
    const [categoriesRes, tagsRes] = await Promise.all([
      fetch(`${siteUrl}/wp-json/wp/v2/categories?per_page=100&context=edit`, {
        headers: { 'Authorization': authHeader }
      }),
      fetch(`${siteUrl}/wp-json/wp/v2/tags?per_page=100&context=edit`, {
        headers: { 'Authorization': authHeader }
      })
    ]);

    if (!categoriesRes.ok) {
      if (categoriesRes.status === 401) {
        throw new Error('Não autorizado. Verifique seu usuário e Senha de Aplicativo.');
      }
      throw new Error(`WordPress respondeu com status ${categoriesRes.status}`);
    }

    const categories = await categoriesRes.json();
    // Leitura defensiva — algumas instalações WP desabilitam o endpoint de tags
    const tags = tagsRes.ok ? await tagsRes.json() : [];

    return {
      success: true,
      categories: categories.map((c: any) => ({ id: c.id, name: c.name, slug: c.slug })),
      tags: tags.map((t: any) => ({ id: t.id, name: t.name, slug: t.slug })),
      message: 'Conexão estabelecida com sucesso!'
    };
  } catch (error: any) {
    console.error('WordPress test connection error:', error);
    return {
      success: false,
      categories: [],
      tags: [],
      message: error.message || 'Falha ao conectar com o WordPress REST API.'
    };
  }
}

/**
 * Busca imagens da biblioteca de mídia do WordPress com suporte a paginação e busca.
 */
export async function fetchMediaLibrary(
  credentials: WordPressCredentials,
  page = 1,
  search = ''
): Promise<{ items: WPMedia[]; totalPages: number }> {
  const siteUrl = normalizeUrl(credentials.siteUrl);
  const authHeader = getAuthHeader(credentials.username, credentials.appPassword);

  const params = new URLSearchParams({
    media_type: 'image',
    per_page: '20',
    page: String(page),
    orderby: 'date',
    order: 'desc',
    context: 'edit'
  });
  if (search.trim()) params.set('search', search.trim());

  const res = await fetch(`${siteUrl}/wp-json/wp/v2/media?${params}`, {
    headers: { 'Authorization': authHeader }
  });

  if (!res.ok) throw new Error(`Erro ao buscar mídia: HTTP ${res.status}`);

  const totalPages = Number(res.headers.get('X-WP-TotalPages') || '1');
  const data: any[] = await res.json();

  const items: WPMedia[] = data.map((m: any) => ({
    id: m.id,
    title: m.title?.rendered || m.slug || String(m.id),
    url: m.source_url,
    thumbnail: m.media_details?.sizes?.thumbnail?.source_url || m.source_url,
    alt: m.alt_text || ''
  }));

  return { items, totalPages };
}

/**
 * Busca uma tag por nome ou a cria caso ela não exista, retornando seu ID numérico.
 */
async function findOrCreateTag(siteUrl: string, authHeader: string, tagName: string): Promise<number> {
  const cleanTagName = tagName.trim();
  if (!cleanTagName) return 0;

  try {
    // 1. Tentar buscar se a tag já existe
    const searchRes = await fetch(`${siteUrl}/wp-json/wp/v2/tags?search=${encodeURIComponent(cleanTagName)}`, {
      headers: { 'Authorization': authHeader }
    });

    if (searchRes.ok) {
      const tagsList = await searchRes.json();
      // Procurar correspondência exata de nome
      const exactMatch = tagsList.find((t: any) => t.name.toLowerCase() === cleanTagName.toLowerCase());
      if (exactMatch) {
        return exactMatch.id;
      }
    }

    // 2. Se não existir, criá-la
    const createRes = await fetch(`${siteUrl}/wp-json/wp/v2/tags`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: cleanTagName })
    });

    if (createRes.ok) {
      const newTag = await createRes.json();
      return newTag.id;
    }

    // 3. Fallback se der erro na criação (tentar ler o erro, às vezes a tag já existe mas foi duplicada)
    const errData = await createRes.json();
    if (errData.code === 'term_exists' && errData.data?.term_id) {
      return errData.data.term_id;
    }

    throw new Error(errData.message || 'Erro ao criar tag');
  } catch (error) {
    console.warn(`Erro ao resolver a tag "${cleanTagName}". Tentando prosseguir sem ela.`, error);
    return 0;
  }
}

/**
 * Agenda um artigo no WordPress retornando o link de edição do post criado.
 */
export type PublishMode = 'future' | 'draft';

/**
 * Converte 'YYYY-MM-DDTHH:MM' (hora local do browser) para UTC ISO 8601.
 * Envia como date_gmt que o WordPress aceita sem ambiguidade de timezone.
 */
function toUtcIso(dateStr: string): string {
  const date = new Date(`${dateStr}:00`);
  return date.toISOString(); // Sempre UTC, ex: 2026-06-01T13:00:00.000Z
}

/**
 * Garante que o conteúdo chegue ao Gutenberg já em formato de blocos.
 * Evita o prompt "Converter em blocos" ao abrir o editor.
 */
function wrapInGutenbergBlocks(html: string): string {
  const trimmed = html.trim();
  if (!trimmed) return '';
  // Se já tem marcadores de bloco, não re-embrulha
  if (trimmed.includes('<!-- wp:')) return trimmed;
  // Embrulha em bloco Classic (freeform) — preserva HTML sem conversão
  return `<!-- wp:freeform -->\n${trimmed}\n<!-- /wp:freeform -->`;
}

export async function schedulePost(
  credentials: WordPressCredentials,
  article: Article,
  onLog: (text: string, type: 'info' | 'success' | 'error') => void,
  publishMode: PublishMode = 'future'
): Promise<string> {
  const siteUrl = normalizeUrl(credentials.siteUrl);
  const authHeader = getAuthHeader(credentials.username, credentials.appPassword);

  onLog(`[${article.title}] Processando tags do artigo...`, 'info');
  
  // 1. Processar e resolver IDs de Tags em paralelo (mais rápido para lotes)
  const tagNames = article.tagsString
    .split(',')
    .map(t => t.trim())
    .filter(t => t.length > 0);

  const tagIds = (
    await Promise.all(tagNames.map(name => findOrCreateTag(siteUrl, authHeader, name)))
  ).filter(id => id > 0);

  onLog(`[${article.title}] Enviando artigo para o WordPress...`, 'info');

  // 2. Preparar payload
  // WordPress requer a data em UTC via date_gmt para evitar dupla conversão de timezone
  const utcIsoDate = article.scheduleDate ? toUtcIso(article.scheduleDate) : undefined;

  const payload: any = {
    title: article.title.trim(),
    excerpt: article.excerpt?.trim() || '',
    content: wrapInGutenbergBlocks(article.content.trim()),
    status: publishMode, // 'future' = agendado | 'draft' = rascunho
    slug: article.slug.trim(),
    categories: article.categoryId ? [Number(article.categoryId)] : [],
    tags: tagIds,
    meta: {
      _yoast_wpseo_focuskw: article.focusKeyword.trim(),
      _yoast_wpseo_metadesc: article.metaDescription.trim()
    }
  };

  if (utcIsoDate) {
    payload.date_gmt = utcIsoDate;
  }

  if (article.featuredMediaId && article.featuredMediaId > 0) {
    payload.featured_media = article.featuredMediaId;
  }

  // 3. Fazer POST de criação do Post
  const res = await fetch(`${siteUrl}/wp-json/wp/v2/posts`, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const responseData = await res.json();

  if (!res.ok) {
    throw new Error(responseData.message || `Erro do servidor HTTP ${res.status}`);
  }

  const postId = responseData.id;
  const editUrl = `${siteUrl}/wp-admin/post.php?post=${postId}&action=edit`;

  const successWord = publishMode === 'draft' ? 'Salvo como rascunho' : 'Agendado';
  onLog(`[${article.title}] ${successWord} com sucesso! ID: ${postId}`, 'success');

  return editUrl;
}
