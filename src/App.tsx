import React, { useState, useEffect } from 'react';
import {
  WordPressCredentials,
  Article,
  Category,
  WPMedia,
  testConnection,
  schedulePost,
  fetchMediaLibrary
} from './services/wordpress';

// --- INLINE SVG COMPONENTS ---
const IconHisokaLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '8px', color: 'var(--accent)' }}>
    <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.4 8.168L12 18.896l-7.334 3.857 1.4-8.168L.132 9.21l8.2-1.192z" />
  </svg>
);

const IconSpade = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--border-hover)' }}>
    <path d="M12 2C11.5 2 6 9 6 13.5a6 6 0 0 0 12 0C18 9 12.5 2 12 2Z" />
    <path d="M9.5 22h5l-1-3.5h-3L9.5 22Z" />
  </svg>
);

const IconHeart = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--error)' }}>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const IconDiamond = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--text-muted)' }}>
    <path d="M12 2L3 12l9 10 9-10L12 2z" />
  </svg>
);

const IconClub = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--success)' }}>
    <path d="M12 9.5a3.5 3.5 0 1 0-3.5 3.5c.23 0 .46-.02.68-.07A4.5 4.5 0 0 0 8 16.5a4.5 4.5 0 1 0 7.32-3.5 3.5 3.5 0 0 0-.64-3.5H12Z" />
    <path d="M9.5 22h5l-1-3.5h-3L9.5 22Z" />
  </svg>
);

const IconGlobe = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
);

const IconUser = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

const IconKey = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 1.5 1.5M15.5 7.5 14 6"/></svg>
);

const IconEye = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
);

const IconEyeOff = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
);

const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
);

const IconTrash = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);

const IconCheck = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
);

const IconAlert = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
);

const IconCalendar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
);

const IconTag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><circle cx="5" cy="5" r="1"/></svg>
);

const IconFolder = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
);

const IconLink = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
);

const IconSun = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.93 4.93l1.41 1.41"/><path d="M17.66 17.66l1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M6.34 17.66l-1.41 1.41"/><path d="M19.07 4.93l-1.41 1.41"/></svg>
);

const IconMoon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
);

const IconImage = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
);

const IconSearch = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
);

const IconX = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);

const IconChevronLeft = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
);

const IconChevronRight = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
);

const IconTerminal = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
);

const IconRocket = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.25-2.5 3.5-2.5 3.5s2.25-1 3.5-2.5M12 2C6 2 2 6 2 12c0 2.5 1 4.5 2.5 6l11.5-11.5C14.5 5 12.5 4 12 2Z"/><path d="M20 4s-4 1-7 4l8 8c3-3 4-7 4-7s-1-4-5-5Z"/></svg>
);

interface LogMessage {
  timestamp: string;
  text: string;
  type: 'info' | 'success' | 'error';
}

interface ArticleResult {
  title: string;
  scheduleDate: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  editUrl?: string;
}

export default function App() {
  // --- TEMA ATIVO (LIGHT / DARK) ---
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // --- CREDENCIAIS ---
  const [credentials, setCredentials] = useState<WordPressCredentials>({
    siteUrl: '',
    username: '',
    appPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [connectionState, setConnectionState] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');
  
  // Categorias precarregadas do WordPress
  const [categories, setCategories] = useState<Category[]>([]);
  
  // --- ARTIGOS ---
  const [articles, setArticles] = useState<Article[]>([
    createEmptyArticle(1)
  ]);
  const [activeTabId, setActiveTabId] = useState<number>(1);

  // --- CONTROLE DE EXECUÇÃO EM LOTE ---
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [results, setResults] = useState<ArticleResult[]>([]);

  // --- MEDIA PICKER ---
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'article' | 'bulk'>('article');
  const [mediaItems, setMediaItems] = useState<WPMedia[]>([]);
  const [mediaPage, setMediaPage] = useState(1);
  const [mediaTotalPages, setMediaTotalPages] = useState(1);
  const [mediaSearch, setMediaSearch] = useState('');
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState('');
  // Imagem destacada para geração em massa
  const [bulkFeaturedMedia, setBulkFeaturedMedia] = useState<WPMedia | null>(null);

  // --- IMPORTAÇÃO EM MASSA ---
  const [bulkDay, setBulkDay] = useState<string>('');
  const [bulkTimes, setBulkTimes] = useState<string>('');
  const [bulkTitles, setBulkTitles] = useState<string>('');

  // Sincroniza o atributo do tema no body
  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  // Carrega credenciais e tema salvos do localStorage
  useEffect(() => {
    const savedCreds = localStorage.getItem('wp_scheduler_credentials');
    if (savedCreds) {
      try {
        const parsed = JSON.parse(savedCreds);
        setCredentials(parsed);
      } catch (e) {
        console.warn('Erro ao carregar credenciais salvas:', e);
      }
    }

    const savedTheme = localStorage.getItem('wp_scheduler_theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Salva o tema quando for alterado
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('wp_scheduler_theme', nextTheme);
  };

  function createEmptyArticle(id: number): Article {
    return {
      id,
      title: '',
      slug: '',
      content: '',
      focusKeyword: '',
      metaDescription: '',
      scheduleDate: '',
      categoryId: '',
      tagsString: '',
      featuredMediaId: undefined
    };
  }

  // Abre o media picker e carrega a primeira página
  const openMediaPicker = async (target: 'article' | 'bulk') => {
    if (connectionState !== 'success') {
      alert('Conecte ao WordPress primeiro para acessar a biblioteca de mídia.');
      return;
    }
    setMediaPickerTarget(target);
    setMediaSearch('');
    setMediaPage(1);
    setMediaItems([]);
    setMediaError('');
    setMediaPickerOpen(true);
    await loadMedia(1, '');
  };

  const loadMedia = async (page: number, search: string) => {
    setMediaLoading(true);
    setMediaError('');
    try {
      const result = await fetchMediaLibrary(credentials, page, search);
      setMediaItems(result.items);
      setMediaTotalPages(result.totalPages);
      setMediaPage(page);
    } catch (e: any) {
      setMediaError(e.message || 'Erro ao carregar mídia.');
    } finally {
      setMediaLoading(false);
    }
  };

  const handleMediaSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadMedia(1, mediaSearch);
  };

  const handleSelectMedia = (media: WPMedia) => {
    if (mediaPickerTarget === 'bulk') {
      setBulkFeaturedMedia(media);
    } else {
      updateArticle(activeArticle.id, { featuredMediaId: media.id });
    }
    setMediaPickerOpen(false);
  };

  const handleRemoveFeaturedImage = (articleId: number) => {
    updateArticle(articleId, { featuredMediaId: undefined });
  };

  // Adiciona logs com timestamp local
  function addLog(text: string, type: 'info' | 'success' | 'error') {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { timestamp, text, type }]);
  }

  // Gera o slug automaticamente baseado no título
  function generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9]+/g, '-') // Substitui não-alfanuméricos por hífen
      .replace(/(^-|-$)/g, ''); // Limpa hífens no início e fim
  }

  // Atualiza um artigo específico
  const updateArticle = (id: number, fields: Partial<Article>) => {
    setArticles(prev => prev.map(art => {
      if (art.id === id) {
        const updated = { ...art, ...fields };
        if (fields.title !== undefined && (!art.slug || art.slug === generateSlug(art.title))) {
          updated.slug = generateSlug(fields.title);
        }
        return updated;
      }
      return art;
    }));
  };

  // Adiciona uma nova aba de artigo (sem limite — uso em massa permitido)
  const addArticleTab = () => {
    const nextId = Math.max(...articles.map(a => a.id), 0) + 1;
    const newArt = createEmptyArticle(nextId);
    setArticles(prev => [...prev, newArt]);
    setActiveTabId(nextId);
  };

  // Remove uma aba de artigo
  const removeArticleTab = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (articles.length === 1) return;
    
    const filtered = articles.filter(a => a.id !== id);
    setArticles(filtered);
    
    if (activeTabId === id) {
      setActiveTabId(filtered[filtered.length - 1].id);
    }
  };

  // Testar conexão remota
  const handleTestConnection = async () => {
    if (!credentials.siteUrl || !credentials.username || !credentials.appPassword) {
      setConnectionState('error');
      setConnectionMessage('Credenciais incompletas.');
      return;
    }

    setConnectionState('connecting');
    setConnectionMessage('Sincronizando...');
    
    const result = await testConnection(credentials);
    
    if (result.success) {
      setConnectionState('success');
      setConnectionMessage(result.message);
      setCategories(result.categories);
      localStorage.setItem('wp_scheduler_credentials', JSON.stringify(credentials));
    } else {
      setConnectionState('error');
      setConnectionMessage(result.message);
      setCategories([]);
    }
  };

  // Parse dos horários da importação em massa (formato HH:MM, um por linha)
  const parsedBulkTimes = bulkTimes
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      const m = line.match(/^(\d{1,2}):(\d{1,2})$/);
      if (!m) return null;
      const hh = String(Math.min(23, parseInt(m[1], 10))).padStart(2, '0');
      const mm = String(Math.min(59, parseInt(m[2], 10))).padStart(2, '0');
      return `${hh}:${mm}`;
    })
    .filter((t): t is string => t !== null);

  // Parse dos títulos (um por linha)
  const parsedBulkTitles = bulkTitles
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  // Gera artigos em massa pareando 1:1 (título <-> horário), ciclando horários se necessário
  const handleBulkGenerate = () => {
    if (!bulkDay) {
      alert('Selecione o Dia para o agendamento em massa.');
      return;
    }
    if (parsedBulkTimes.length === 0) {
      alert('Adicione pelo menos um horário válido (HH:MM, um por linha).');
      return;
    }
    if (parsedBulkTitles.length === 0) {
      alert('Adicione pelo menos um título (um por linha).');
      return;
    }

    const newArticles: Article[] = parsedBulkTitles.map((title, i) => {
      const time = parsedBulkTimes[i % parsedBulkTimes.length];
      return {
        id: i + 1,
        title,
        slug: generateSlug(title),
        content: '',
        focusKeyword: '',
        metaDescription: '',
        scheduleDate: `${bulkDay}T${time}`,
        categoryId: '',
        tagsString: '',
        featuredMediaId: bulkFeaturedMedia?.id
      };
    });

    setArticles(newArticles);
    setActiveTabId(newArticles[0].id);
  };

  // Enviar artigos em lote sequencialmente
  const handleScheduleAll = async () => {
    if (connectionState !== 'success') {
      alert('Por favor, verifique a conexão com o WordPress antes de agendar.');
      return;
    }

    const filledArticles = articles.filter(a => a.title.trim() && a.scheduleDate);
    
    if (filledArticles.length === 0) {
      alert('Insira o Título e a Data/Hora em pelo menos um artigo.');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setLogs([]);
    
    const initialResults: ArticleResult[] = filledArticles.map(a => ({
      title: a.title,
      scheduleDate: a.scheduleDate,
      status: 'pending',
      message: 'Fila de agendamento'
    }));
    setResults(initialResults);

    addLog(`Pipeline iniciado: Processando ${filledArticles.length} publicações...`, 'info');

    let completed = 0;
    const currentResults = [...initialResults];

    for (let i = 0; i < filledArticles.length; i++) {
      const article = filledArticles[i];
      addLog(`[Lote ${i + 1}/${filledArticles.length}] Agendando "${article.title}"`, 'info');
      
      try {
        const editUrl = await schedulePost(credentials, article, addLog);
        
        currentResults[i] = {
          title: article.title,
          scheduleDate: article.scheduleDate,
          status: 'success',
          message: 'Post agendado com sucesso!',
          editUrl
        };
      } catch (error: any) {
        const errorMsg = error.message || 'Erro de rede ou permissão na API.';
        addLog(`Falha ao enviar "${article.title}": ${errorMsg}`, 'error');
        
        currentResults[i] = {
          title: article.title,
          scheduleDate: article.scheduleDate,
          status: 'error',
          message: `Erro: ${errorMsg}`
        };
      }

      completed++;
      setProgress(Math.round((completed / filledArticles.length) * 100));
      setResults([...currentResults]);
    }

    addLog('Processamento do lote finalizado.', 'success');
    setIsProcessing(false);
  };

  const activeArticle = articles.find(a => a.id === activeTabId) || articles[0];


  return (
    <div className="dashboard-container">
      {/* MODAL: SELEÇÃO DE IMAGEM DESTACADA */}
      {mediaPickerOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            width: '100%', maxWidth: '860px',
            maxHeight: '90vh',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Header do modal */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1rem 1.25rem',
              borderBottom: '1px solid var(--border-color)'
            }}>
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <IconImage /> Biblioteca de Mídia — Selecionar Imagem Destacada
              </span>
              <button type="button" onClick={() => setMediaPickerOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                <IconX />
              </button>
            </div>

            {/* Barra de busca */}
            <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border-color)' }}>
              <form onSubmit={handleMediaSearch} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Buscar imagem por nome..."
                  value={mediaSearch}
                  onChange={e => setMediaSearch(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button type="submit" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 0.9rem' }}>
                  <IconSearch /> Buscar
                </button>
              </form>
            </div>

            {/* Grid de imagens */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' }}>
              {mediaLoading && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Carregando imagens...
                </div>
              )}
              {mediaError && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--error)' }}>
                  {mediaError}
                </div>
              )}
              {!mediaLoading && !mediaError && mediaItems.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Nenhuma imagem encontrada.
                </div>
              )}
              {!mediaLoading && mediaItems.length > 0 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: '0.75rem'
                }}>
                  {mediaItems.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectMedia(item)}
                      style={{
                        background: 'var(--bg-primary)',
                        border: '2px solid var(--border-color)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        padding: 0,
                        textAlign: 'left',
                        transition: 'border-color 0.15s'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                      title={item.title}
                    >
                      <img
                        src={item.thumbnail}
                        alt={item.alt || item.title}
                        style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
                        loading="lazy"
                      />
                      <span style={{
                        display: 'block',
                        padding: '0.35rem 0.5rem',
                        fontSize: '0.65rem',
                        color: 'var(--text-muted)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {item.title}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Paginação */}
            {mediaTotalPages > 1 && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                padding: '0.75rem', borderTop: '1px solid var(--border-color)'
              }}>
                <button type="button" className="btn btn-secondary"
                  disabled={mediaPage <= 1 || mediaLoading}
                  onClick={() => loadMedia(mediaPage - 1, mediaSearch)}
                  style={{ padding: '0.4rem 0.6rem', display: 'flex', alignItems: 'center' }}
                >
                  <IconChevronLeft />
                </button>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Página {mediaPage} de {mediaTotalPages}
                </span>
                <button type="button" className="btn btn-secondary"
                  disabled={mediaPage >= mediaTotalPages || mediaLoading}
                  onClick={() => loadMedia(mediaPage + 1, mediaSearch)}
                  style={{ padding: '0.4rem 0.6rem', display: 'flex', alignItems: 'center' }}
                >
                  <IconChevronRight />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CABEÇALHO TÉCNICO CLEAN COM SUITE LIGHT/DARK */}
      <header className="dashboard-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <IconHisokaLogo />
          <div>
            <h1 style={{ letterSpacing: '1px' }}>HISOKA PUSH</h1>
            <p>Distribuição Mágica de Conteúdo em Massa para WordPress</p>
          </div>
        </div>
        <div className="header-actions">
          <button 
            type="button" 
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Mudar para Modo Claro (Titanium)' : 'Mudar para Modo Escuro (Obsidian)'}
          >
            {theme === 'dark' ? <IconSun /> : <IconMoon />}
          </button>
        </div>
      </header>

      <div className="dashboard-grid">
        {/* COLUNA ESQUERDA: CONFIGURAÇÃO DE ACESSO */}
        <aside className="glass-card">
          <h2 className="section-title">
            <IconSpade /> CONEXÃO
          </h2>
          
          <div className="form-group">
            <label htmlFor="siteUrl">
              <IconGlobe /> URL DO SITE
            </label>
            <input 
              type="url" 
              id="siteUrl"
              placeholder="https://meusite.com.br"
              value={credentials.siteUrl}
              onChange={e => setCredentials(prev => ({ ...prev, siteUrl: e.target.value }))}
              disabled={isProcessing}
            />
          </div>

          <div className="form-group">
            <label htmlFor="username">
              <IconUser /> USUÁRIO DO SITE
            </label>
            <input 
              type="text" 
              id="username"
              placeholder="admin"
              value={credentials.username}
              onChange={e => setCredentials(prev => ({ ...prev, username: e.target.value }))}
              disabled={isProcessing}
            />
          </div>

          <div className="form-group">
            <label htmlFor="appPassword">
              <IconKey /> SENHA DE APLICATIVO
            </label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? 'text' : 'password'} 
                id="appPassword"
                placeholder="xxxx xxxx xxxx xxxx"
                value={credentials.appPassword}
                onChange={e => setCredentials(prev => ({ ...prev, appPassword: e.target.value }))}
                disabled={isProcessing}
                style={{ paddingRight: '2.5rem' }}
                className="input-mono"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  color: 'var(--text-muted)'
                }}
              >
                {showPassword ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>
            <p className="helper-text">
              Gere no painel em Usuários → Perfil → Senhas de aplicativo.
            </p>
          </div>

          <button 
            type="button"
            className="btn btn-secondary"
            onClick={handleTestConnection}
            disabled={isProcessing || !credentials.siteUrl || !credentials.username || !credentials.appPassword}
          >
            Verificar Acesso
          </button>

          {connectionState !== 'idle' && (
            <div className={`connection-status ${connectionState}`}>
              {connectionState === 'success' && <IconCheck />}
              {connectionState === 'error' && <IconAlert />}
              {connectionState === 'connecting' && (
                <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeDasharray="32" strokeLinecap="round"/></svg>
              )}
              <span>{connectionMessage}</span>
            </div>
          )}

          {/* CAIXA DE SNIPPET COMPLEMENTAR */}
          <div className="setup-info-box" style={{ marginTop: '2rem' }}>
            <h4 style={{ 
              fontSize: '0.75rem', 
              fontWeight: 700, 
              color: 'var(--text-primary)', 
              marginBottom: '0.5rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.35rem'
            }}>
              <IconAlert /> PREPARAÇÃO API
            </h4>
            <p className="helper-text" style={{ marginBottom: '0.75rem', lineHeight: '1.4' }}>
              Caso ocorra falhas no Yoast, adicione este código no <code style={{ color: 'var(--accent)' }}>functions.php</code> do WordPress:
            </p>
            <pre style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              padding: '0.6rem',
              borderRadius: '6px',
              overflowX: 'auto'
            }}>
              <code style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
{`add_action('rest_api_init', function() {
  register_post_meta('post', '_yoast_wpseo_metadesc', [
    'show_in_rest' => true,
    'single' => true,
    'type' => 'string'
  ]);
  register_post_meta('post', '_yoast_wpseo_focuskw', [
    'show_in_rest' => true,
    'single' => true,
    'type' => 'string'
  ]);
});`}
              </code>
            </pre>
          </div>
        </aside>

        {/* COLUNA DIREITA: TRABALHO SOBRE ARTIGOS */}
        <main className="glass-card">
          <div className="articles-configurator">

            {/* IMPORTAÇÃO EM MASSA */}
            <section className="bulk-import-panel">
              <div className="bulk-import-header">
                <h2 className="section-title" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <IconClub /> IMPORTAÇÃO EM MASSA
                </h2>
                <p className="helper-text" style={{ color: 'var(--text-secondary)' }}>
                  Cole um dia, vários horários (um por linha) e vários títulos (um por linha). O sistema gera todos os artigos pareando título com horário na ordem.
                </p>
              </div>

              <div className="bulk-import-grid">
                <div className="form-group">
                  <label htmlFor="bulkDay">
                    <IconCalendar /> Dia do Agendamento
                  </label>
                  <input
                    type="date"
                    id="bulkDay"
                    value={bulkDay}
                    onChange={e => setBulkDay(e.target.value)}
                    disabled={isProcessing}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="bulkTimes">
                    Horários (HH:MM, um por linha)
                    <span className="bulk-count-badge">{parsedBulkTimes.length}</span>
                  </label>
                  <textarea
                    id="bulkTimes"
                    className="bulk-textarea input-mono"
                    placeholder={'13:46\n10:26\n09:51\n07:51\n06:01'}
                    value={bulkTimes}
                    onChange={e => setBulkTimes(e.target.value)}
                    disabled={isProcessing}
                    rows={8}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="bulkTitles">
                    Títulos dos Artigos (um por linha)
                    <span className="bulk-count-badge">{parsedBulkTitles.length}</span>
                  </label>
                  <textarea
                    id="bulkTitles"
                    className="bulk-textarea"
                    placeholder={'Demorei muito para entender por que o creme hidratante...\nPor que você deve lavar o rosto com água fria...\nO óleo de coco é resistente a tudo...'}
                    value={bulkTitles}
                    onChange={e => setBulkTitles(e.target.value)}
                    disabled={isProcessing}
                    rows={8}
                  />
                </div>
              </div>

              {/* Imagem destacada em massa */}
              <div className="form-group" style={{ marginTop: '0.75rem' }}>
                <label><IconImage /> Imagem Destacada (todos os artigos)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {bulkFeaturedMedia ? (
                    <>
                      <img
                        src={bulkFeaturedMedia.thumbnail}
                        alt={bulkFeaturedMedia.alt || bulkFeaturedMedia.title}
                        style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '6px', border: '2px solid var(--accent)' }}
                      />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', flex: 1 }}>
                        {bulkFeaturedMedia.title} <span style={{ color: 'var(--text-muted)' }}>(ID: {bulkFeaturedMedia.id})</span>
                      </span>
                      <button type="button" className="btn btn-secondary" onClick={() => setBulkFeaturedMedia(null)}
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem' }}>
                        Remover
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={() => openMediaPicker('bulk')}
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem' }}>
                        Trocar
                      </button>
                    </>
                  ) : (
                    <button type="button" className="btn btn-secondary" onClick={() => openMediaPicker('bulk')}
                      disabled={isProcessing || connectionState !== 'success'}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <IconImage /> Selecionar do Banco de Mídia
                    </button>
                  )}
                </div>
                {connectionState !== 'success' && (
                  <p className="helper-text" style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Conecte ao WordPress para acessar a biblioteca de mídia.
                  </p>
                )}
              </div>

              <div className="bulk-import-footer">
                <span className="helper-text">
                  {parsedBulkTitles.length > 0 && parsedBulkTimes.length > 0 && bulkDay
                    ? `${parsedBulkTitles.length} artigo(s) serão gerados em ${bulkDay}. Substituirá o lote atual.`
                    : 'Preencha Dia + Horários + Títulos para liberar a geração.'}
                </span>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleBulkGenerate}
                  disabled={
                    isProcessing ||
                    !bulkDay ||
                    parsedBulkTimes.length === 0 ||
                    parsedBulkTitles.length === 0
                  }
                >
                  <IconClub /> Gerar Artigos em Massa
                </button>
              </div>
            </section>

            {/* ABAS DOS ARTIGOS */}
            <div className="articles-tabs">
              <h3 style={{ 
                fontFamily: 'var(--font-sans)', 
                fontSize: '0.75rem', 
                color: 'var(--text-muted)', 
                textTransform: 'uppercase', 
                marginBottom: '0.5rem', 
                letterSpacing: '0.5px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                <IconHeart /> Artigos do Lote
              </h3>
              
              {articles.map((art, idx) => {
                const isFilled = art.title.trim().length > 0 && art.scheduleDate.length > 0;
                return (
                  <button
                    key={art.id}
                    type="button"
                    className={`tab-btn ${activeTabId === art.id ? 'active' : ''} ${isFilled ? 'filled' : ''}`}
                    onClick={() => setActiveTabId(art.id)}
                  >
                    <span>Artigo {idx + 1}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="tab-badge">{idx + 1}</span>
                      {articles.length > 1 && (
                        <span 
                          onClick={(e) => removeArticleTab(art.id, e)}
                          style={{
                            color: 'var(--error)',
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            opacity: 0.6
                          }}
                          title="Remover post da fila"
                        >
                          <IconTrash />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}

              <button
                type="button"
                className="btn btn-secondary"
                onClick={addArticleTab}
                disabled={isProcessing}
                style={{
                  borderStyle: 'dashed',
                  marginTop: '0.5rem',
                  boxShadow: 'none'
                }}
              >
                <IconPlus /> Adicionar Artigo
              </button>
            </div>

            {/* FORMULÁRIO DO ARTIGO ATIVO */}
            <div className="article-panel">
              <div className="article-form-header">
                <span className="article-form-title">
                  Artigo #{articles.findIndex(a => a.id === activeArticle.id) + 1}
                </span>
                <span className="helper-text" style={{ fontWeight: 500, color: activeArticle.title ? 'var(--accent)' : 'var(--text-muted)' }}>
                  {activeArticle.title ? 'Pronto para agendamento' : 'Aguardando informações'}
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="title">Título do Artigo</label>
                <input 
                  type="text" 
                  id="title"
                  placeholder="Ex: Como criar Landing Pages que convertem muito"
                  value={activeArticle.title}
                  onChange={e => updateArticle(activeArticle.id, { title: e.target.value })}
                  disabled={isProcessing}
                />
              </div>

              <div className="form-group row-2">
                <div>
                  <label htmlFor="slug">
                    <IconLink /> URL Amigável / Slug
                  </label>
                  <input 
                    type="text" 
                    id="slug"
                    placeholder="landing-pages-conversao"
                    value={activeArticle.slug}
                    onChange={e => updateArticle(activeArticle.id, { slug: e.target.value })}
                    disabled={isProcessing}
                    className="input-mono"
                  />
                </div>
                <div>
                  <label htmlFor="scheduleDate">
                    <IconCalendar /> Data e Hora de Postagem
                  </label>
                  <input 
                    type="datetime-local" 
                    id="scheduleDate"
                    value={activeArticle.scheduleDate}
                    onChange={e => updateArticle(activeArticle.id, { scheduleDate: e.target.value })}
                    disabled={isProcessing}
                  />
                </div>
              </div>

              <div className="form-group row-2">
                <div>
                  <label htmlFor="category">
                    <IconFolder /> Categoria WordPress
                  </label>
                  <select 
                    id="category"
                    value={activeArticle.categoryId}
                    onChange={e => updateArticle(activeArticle.id, { categoryId: e.target.value ? Number(e.target.value) : '' })}
                    disabled={isProcessing || categories.length === 0}
                  >
                    <option value="">-- Sem Categoria (Padrão) --</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  {categories.length === 0 && (
                    <p className="helper-text" style={{ color: 'var(--error)' }}>
                      Conecte seu site para carregar as categorias do blog.
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="tags">
                    <IconTag /> Tags do Artigo (separadas por vírgula)
                  </label>
                  <input 
                    type="text" 
                    id="tags"
                    placeholder="marketing, vendas, design"
                    value={activeArticle.tagsString}
                    onChange={e => updateArticle(activeArticle.id, { tagsString: e.target.value })}
                    disabled={isProcessing}
                  />
                </div>
              </div>

              {/* IMAGEM DESTACADA */}
              <div className="form-group" style={{ marginTop: '0.5rem' }}>
                <label><IconImage /> Imagem Destacada</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {activeArticle.featuredMediaId ? (
                    <>
                      <div style={{
                        width: '64px', height: '64px', borderRadius: '6px',
                        border: '2px solid var(--accent)',
                        background: 'var(--bg-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--accent)', textAlign: 'center', padding: '0.25rem' }}>
                          ID: {activeArticle.featuredMediaId}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', flex: 1 }}>
                        Imagem selecionada (ID: {activeArticle.featuredMediaId})
                      </span>
                      <button type="button" className="btn btn-secondary"
                        onClick={() => handleRemoveFeaturedImage(activeArticle.id)}
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem' }}>
                        Remover
                      </button>
                      <button type="button" className="btn btn-secondary"
                        onClick={() => openMediaPicker('article')}
                        disabled={isProcessing || connectionState !== 'success'}
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.7rem' }}>
                        Trocar
                      </button>
                    </>
                  ) : (
                    <button type="button" className="btn btn-secondary"
                      onClick={() => openMediaPicker('article')}
                      disabled={isProcessing || connectionState !== 'success'}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <IconImage /> Selecionar do Banco de Mídia
                    </button>
                  )}
                </div>
                {connectionState !== 'success' && (
                  <p className="helper-text" style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Conecte ao WordPress para acessar a biblioteca de mídia.
                  </p>
                )}
              </div>

              {/* METADADOS DO YOAST SEO */}
              <div className="form-group" style={{ 
                borderTop: '1px dashed var(--border-color)', 
                paddingTop: '1.5rem', 
                marginTop: '1.75rem' 
              }}>
                <h4 style={{ 
                  fontFamily: 'var(--font-title)',
                  fontSize: '0.95rem', 
                  color: 'var(--text-primary)', 
                  marginBottom: '1rem', 
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  <IconDiamond /> Otimização de SEO (Yoast SEO)
                </h4>
                
                <div className="form-group row-2">
                  <div>
                    <label htmlFor="focusKeyword">Palavra-chave Foco</label>
                    <input 
                      type="text" 
                      id="focusKeyword"
                      placeholder="Ex: landing pages"
                      value={activeArticle.focusKeyword}
                      onChange={e => updateArticle(activeArticle.id, { focusKeyword: e.target.value })}
                      disabled={isProcessing}
                    />
                  </div>
                  <div>
                    <label htmlFor="metaDescription">Metadescrição do Post</label>
                    <input 
                      type="text" 
                      id="metaDescription"
                      placeholder="Ex: Aprenda as técnicas essenciais de UI/UX para aumentar as conversões..."
                      maxLength={160}
                      value={activeArticle.metaDescription}
                      onChange={e => updateArticle(activeArticle.id, { metaDescription: e.target.value })}
                      disabled={isProcessing}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem' }}>
                      <span className="helper-text">Recomendável: até 160 caracteres</span>
                      <span className="helper-text" style={{ 
                        fontFamily: 'var(--font-mono)',
                        color: activeArticle.metaDescription.length > 150 ? 'var(--accent)' : 'var(--text-muted)' 
                      }}>
                        {activeArticle.metaDescription.length}/160
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="content">Conteúdo em HTML</label>
                <textarea 
                  id="content"
                  className="editor-content"
                  placeholder="<p>Seu parágrafo inicial do artigo...</p>&#10;<h2>Tópico do Artigo</h2>&#10;<p>Mais informações e parágrafos explicativos...</p>"
                  value={activeArticle.content}
                  onChange={e => updateArticle(activeArticle.id, { content: e.target.value })}
                  disabled={isProcessing}
                />
              </div>
            </div>
          </div>

          {/* PAINEL DE DISPARO EM LOTE */}
          <section className="bulk-actions-section">
            <h2 className="section-title" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <IconRocket /> DISPARADOR DO PIPELINE
            </h2>
            
            <p className="helper-text" style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
              Verifique os posts preenchidos. O sistema agendará cada um na data/hora especificada em fila única ordenada de carregamento.
            </p>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleScheduleAll}
              disabled={isProcessing || connectionState !== 'success'}
              style={{ padding: '0.9rem 1.5rem', fontSize: '0.95rem' }}
            >
              {isProcessing ? 'PUBLICANDO LOTE...' : `EXECUTAR AGENDAMENTO DE ${articles.filter(a => a.title.trim() && a.scheduleDate).length} POST(S)`}
            </button>

            {/* PROGRESSO */}
            {(isProcessing || progress > 0) && (
              <div className="progress-container">
                <div className="progress-label">
                  <span>Progresso do Lote</span>
                  <span>{progress}%</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                </div>
              </div>
            )}

            {/* LOGS EM TEMPO REAL */}
            {logs.length > 0 && (
              <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ 
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.8rem', 
                  textTransform: 'uppercase', 
                  color: 'var(--text-secondary)', 
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontWeight: 700
                }}>
                  <IconTerminal /> Logs de Execução
                </h4>
                <div className="console-logs">
                  {logs.map((log, idx) => (
                    <div key={idx} className="log-line">
                      <span className="log-timestamp">[{log.timestamp}]</span>
                      <span className={`log-text ${log.type}`}>{log.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TABELA DE SUCESSOS/ERROS */}
            {results.length > 0 && (
              <div className="results-table-container">
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Título do Artigo</th>
                      <th>Agendamento</th>
                      <th>Estado</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((res, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 700 }}>{res.title}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                          {res.scheduleDate.replace('T', ' • ')}
                        </td>
                        <td>
                          <span className={`status-badge ${res.status}`}>
                            {res.status === 'success' && 'Sucesso'}
                            {res.status === 'error' && 'Falha'}
                            {res.status === 'pending' && 'Fila'}
                          </span>
                          <span style={{ 
                            display: 'block', 
                            fontSize: '0.75rem', 
                            color: 'var(--text-muted)', 
                            marginTop: '0.2rem' 
                          }}>
                            {res.message}
                          </span>
                        </td>
                        <td>
                          {res.editUrl ? (
                            <a 
                              href={res.editUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="results-link"
                            >
                              EDITAR NO WP <IconLink />
                            </a>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>--</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
