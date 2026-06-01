/* ==========================================================================
   WORDPRESS ARTICLE PUBLISHER - LOGICA DE INTERACAO (PRINCIPAL.JS)
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    // Referências dos Elementos - Formulário de Entrada
    const formulario = document.getElementById("article-form");
    const entradaTitulo = document.getElementById("title");
    const entradaSlug = document.getElementById("slug");
    const entradaConteudo = document.getElementById("content");
    const entradaCategorias = document.getElementById("categories");
    const entradaCategoriasManual = document.getElementById("categories_manual");
    const esqueletoCategorias = document.getElementById("categories-skeleton");
    const entradaTags = document.getElementById("tags");
    const entradaPalavraFoco = document.getElementById("focus_keyword");
    const entradaMetaDesc = document.getElementById("meta_description");
    const entradaAgendamento = document.getElementById("schedule_datetime");
    const entradaStatusPost = document.getElementById("post_status");
    const grupoAgendamento = document.getElementById("schedule-group");
    
    // Elementos do Planejador em Lote e Abas
    const botoesAbas = document.querySelectorAll(".tab-btn");
    const entradaTitulosLote = document.getElementById("bulk-titles");
    const entradaHorariosLote = document.getElementById("bulk-times");
    const entradaDataBaseLote = document.getElementById("bulk-base-date");
    const contadorTitulosLote = document.getElementById("bulk-titles-counter");
    const contadorHorariosLote = document.getElementById("bulk-times-counter");
    const emblemaConsistencia = document.getElementById("consistency-badge");
    const listaPreviaLote = document.getElementById("bulk-preview-list");
    const botaoCarregarFilaLote = document.getElementById("btn-bulk-load-wizard");
    
    // Elementos do Assistente de Fila Ativa (Wizard)
    const barraWizard = document.getElementById("wizard-bar");
    const textoStatusWizard = document.getElementById("wizard-status-text");
    const botaoWizardAnterior = document.getElementById("btn-wizard-prev");
    const botaoWizardProximo = document.getElementById("btn-wizard-next");
    const botaoWizardCancelar = document.getElementById("btn-wizard-cancel");
    const barraCopiarConfigAnterior = document.getElementById("copy-prev-config-bar");
    const botaoCopiarConfigAnterior = document.getElementById("btn-copy-prev-config");
    const mapaProgressoWizard = document.getElementById("wizard-progress-map");
    
    // Contadores e Progresso de SEO
    const contadorMeta = document.getElementById("meta-counter");
    const progressoMeta = document.getElementById("meta-progress");
    
    // Botões de Ação
    const botaoExportarJson = document.getElementById("btn-export-json");
    const botaoPublicarWp = document.getElementById("btn-publish-wp");
    const botaoLimparConsole = document.getElementById("btn-clear-console");
    const saidaConsole = document.getElementById("console-output");

    // Elementos da Aba de Links Gerados e Histórico
    const estadoVazioLinks = document.getElementById("links-empty-state");
    const feedLinks = document.getElementById("links-feed");
    const botaoLimparLinks = document.getElementById("btn-clear-links");
    const botaoCopiarTodosLinks = document.getElementById("btn-copy-all-links");
    let artigosGeradosHistorico = [];

    // Estado do Verificador de Slug Duplicado
    let slugEmUso = false;
    let tituloPostDuplicado = "";
    let temporizadorSlugCheck = null;
    const msgSlugCheck = document.getElementById("slug-check-msg");

    // ==========================================================================
    // 0. CONTROLES DO TEMA (DARK/LIGHT) E MAXIMIZADOR DE PREVIEW
    // ==========================================================================
    const botaoAlternarTema = document.getElementById("btn-theme-toggle");
    const botaoMaximizarPreview = document.getElementById("btn-maximize-preview");
    const wrapperCorpoPreview = document.getElementById("preview-body-wrapper");

    if (botaoAlternarTema) {
        const iconeSol = botaoAlternarTema.querySelector(".sun-icon");
        const iconeLua = botaoAlternarTema.querySelector(".moon-icon");

        function aplicarTema(tema) {
            document.documentElement.setAttribute("data-theme", tema);
            localStorage.setItem("wp-pub-theme", tema);
            
            if (tema === "dark") {
                iconeSol.classList.remove("hidden");
                iconeLua.classList.add("hidden");
            } else {
                iconeSol.classList.add("hidden");
                iconeLua.classList.remove("hidden");
            }
        }

        // Inicializar com o tema do localStorage ou Light por padrão
        const temaInicial = localStorage.getItem("wp-pub-theme") || "light";
        aplicarTema(temaInicial);

        botaoAlternarTema.addEventListener("click", () => {
            const temaAtual = document.documentElement.getAttribute("data-theme") || "light";
            const novoTema = temaAtual === "dark" ? "light" : "dark";
            aplicarTema(novoTema);
            exibirNotificacao(`Tema ${novoTema === "dark" ? "Escuro" : "Claro"} ativado!`, "info", 2000);
        });
    }

    if (botaoMaximizarPreview && wrapperCorpoPreview) {
        botaoMaximizarPreview.addEventListener("click", () => {
            wrapperCorpoPreview.classList.toggle("maximized");
            const estaMaximizado = wrapperCorpoPreview.classList.contains("maximized");
            botaoMaximizarPreview.title = estaMaximizado ? "Minimizar Visualização" : "Maximizar Visualização";
            
            if (estaMaximizado) {
                botaoMaximizarPreview.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="4 14 10 14 10 20"/>
                        <polyline points="20 10 14 10 14 4"/>
                        <line x1="14" y1="10" x2="21" y2="3"/>
                        <line x1="10" y1="14" x2="3" y2="21"/>
                    </svg>
                `;
                exibirNotificacao("Visualização em tela cheia ativada!", "info", 1500);
            } else {
                botaoMaximizarPreview.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M15 3h6v6"/>
                        <path d="M9 21H3v-6"/>
                        <line x1="21" y1="3" x2="14" y2="10"/>
                        <line x1="3" y1="21" x2="10" y2="14"/>
                    </svg>
                `;
            }
        });
    }

    // ==========================================================================
    // 1. SISTEMA DE TOAST NOTIFICATIONS (NOTIFICAÇÕES PREMIUM)
    // ==========================================================================
    function exibirNotificacao(mensagem, tipo = "info", duracao = 4500) {
        const container = document.getElementById("toast-container");
        if (!container) return;

        const card = document.createElement("div");
        card.className = `toast-card ${tipo}`;

        let iconeSvg = "";
        if (tipo === "success") {
            iconeSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
        } else if (tipo === "error") {
            iconeSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
        } else if (tipo === "warning") {
            iconeSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
        } else {
            iconeSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
        }

        card.innerHTML = `
            <span class="toast-icon">${iconeSvg}</span>
            <span class="toast-content">${mensagem}</span>
        `;

        container.appendChild(card);

        // Desvanecer um pouco antes do tempo acabar
        setTimeout(() => {
            card.classList.add("slide-out");
            card.addEventListener("animationend", () => {
                card.remove();
            });
        }, duracao);
    }
    
    // Obter data/hora formatada para logs do terminal
    function obterDataHoraLog() {
        const agora = new Date();
        return agora.toTimeString().split(" ")[0];
    }
    
    // Função para adicionar linha ao terminal interativo
    function adicionarLogTerminal(mensagem, tipo = "system") {
        const linha = document.createElement("div");
        linha.className = `console-line ${tipo}`;
        
        const spanTempo = document.createElement("span");
        spanTempo.className = "time";
        spanTempo.textContent = `[${obterDataHoraLog()}]`;
        
        linha.appendChild(spanTempo);
        
        if (mensagem.includes("<a") || mensagem.includes("<strong")) {
            const spanTemp = document.createElement("span");
            spanTemp.innerHTML = mensagem;
            linha.appendChild(spanTemp);
        } else {
            const noTexto = document.createTextNode(mensagem);
            linha.appendChild(noTexto);
        }
        
        saidaConsole.appendChild(linha);
        saidaConsole.scrollTop = saidaConsole.scrollHeight;
    }

    // ==========================================================================
    // 3. ENGINE DE LIVE PREVIEW EM TEMPO REAL (DEBOUNCED)
    // ==========================================================================
    let temporizadorPreview = null;
    const previewVazio = document.getElementById("live-preview-empty");
    const previewConteudo = document.getElementById("live-preview-content");

    function renderizarLivePreview() {
        if (!previewConteudo || !previewVazio) return;
        const htmlBruto = entradaConteudo.value.trim();

        if (htmlBruto === "") {
            previewVazio.classList.remove("hidden");
            previewConteudo.classList.add("hidden");
        } else {
            previewVazio.classList.add("hidden");
            previewConteudo.classList.remove("hidden");
            previewConteudo.innerHTML = htmlBruto;
        }
    }

    if (entradaConteudo) {
        entradaConteudo.addEventListener("input", () => {
            if (temporizadorPreview) clearTimeout(temporizadorPreview);
            temporizadorPreview = setTimeout(renderizarLivePreview, 300);
        });
    }

    // ==========================================================================
    // 4. GERADOR AUTOMÁTICO DE SLUG A PARTIR DO TÍTULO
    // ==========================================================================
    entradaTitulo.addEventListener("input", () => {
        if (!entradaSlug.dataset.manualEdited) {
            const slugGerado = entradaTitulo.value
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "") // remove acentos
                .replace(/[^a-z0-9\s-]/g, "")    // remove especiais
                .trim()
                .replace(/\s+/g, "-")            // substitui espaços por traços
                .replace(/-+/g, "-");            // remove traços duplicados
            entradaSlug.value = slugGerado;
            verificarSlugDinamico(slugGerado);
        }
    });

    function verificarSlugDinamico(slug) {
        if (temporizadorSlugCheck) {
            clearTimeout(temporizadorSlugCheck);
        }

        const slugLimpo = slug.trim();
        if (!slugLimpo) {
            if (msgSlugCheck) {
                msgSlugCheck.classList.add("hidden");
                msgSlugCheck.textContent = "";
            }
            slugEmUso = false;
            tituloPostDuplicado = "";
            return;
        }

        if (msgSlugCheck) {
            msgSlugCheck.classList.remove("hidden");
            msgSlugCheck.style.color = "var(--color-text-secondary, #9e9e9e)";
            msgSlugCheck.textContent = "Verificando disponibilidade do slug...";
        }

        temporizadorSlugCheck = setTimeout(() => {
            fetch(`/verificar-slug?slug=${encodeURIComponent(slugLimpo)}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        if (data.existe) {
                            slugEmUso = true;
                            tituloPostDuplicado = data.titulo || "Sem Título";
                            if (msgSlugCheck) {
                                msgSlugCheck.style.color = "#ec407a"; // Rosa Hisoka / Aviso
                                msgSlugCheck.textContent = `⚠️ Slug em uso no post: "${tituloPostDuplicado}"`;
                            }
                        } else {
                            slugEmUso = false;
                            tituloPostDuplicado = "";
                            if (msgSlugCheck) {
                                msgSlugCheck.style.color = "#26a69a"; // Teal Hisoka / Sucesso
                                msgSlugCheck.textContent = "✓ Slug disponível!";
                            }
                        }
                    } else {
                        if (msgSlugCheck) msgSlugCheck.classList.add("hidden");
                        slugEmUso = false;
                    }
                })
                .catch(() => {
                    if (msgSlugCheck) msgSlugCheck.classList.add("hidden");
                    slugEmUso = false;
                });
        }, 500);
    }

    entradaSlug.addEventListener("input", () => {
        verificarSlugDinamico(entradaSlug.value);
    });
    
    entradaSlug.addEventListener("change", () => {
        if (entradaSlug.value.trim() !== "") {
            entradaSlug.dataset.manualEdited = "true";
        } else {
            delete entradaSlug.dataset.manualEdited;
        }
        verificarSlugDinamico(entradaSlug.value);
    });
    
    // ==========================================================================
    // 5. CONTADOR DINÂMICO YOAST SEO (META DESCRIÇÃO)
    // ==========================================================================
    entradaMetaDesc.addEventListener("input", () => {
        const tamanho = entradaMetaDesc.value.length;
        contadorMeta.textContent = `${tamanho} / 160`;
        
        const percentual = Math.min((tamanho / 160) * 100, 100);
        progressoMeta.style.width = `${percentual}%`;
        
        if (tamanho === 0) {
            progressoMeta.style.backgroundColor = "var(--text-muted)";
            contadorMeta.style.color = "var(--text-muted)";
        } else if (tamanho < 120) {
            progressoMeta.style.backgroundColor = "var(--color-warning)";
            contadorMeta.style.color = "var(--color-warning)";
        } else if (tamanho <= 160) {
            progressoMeta.style.backgroundColor = "var(--color-success)";
            contadorMeta.style.color = "var(--color-success)";
        } else {
            progressoMeta.style.backgroundColor = "var(--color-danger)";
            contadorMeta.style.color = "var(--color-danger)";
        }
    });
    
    // Limpar console
    botaoLimparConsole.addEventListener("click", () => {
        saidaConsole.innerHTML = "";
        adicionarLogTerminal("Console limpo. Pronto para novas operações.");
        exibirNotificacao("Console limpo", "info");
    });

    // ==========================================================================
    // 5B. GERENCIADOR DE HISTÓRICO E LINKS GERADOS
    // ==========================================================================
    function registrarLinkGerado(titulo, postId, status) {
        const wpUrlText = document.querySelector(".wp-url-text");
        let wpUrl = wpUrlText ? wpUrlText.textContent.trim() : "";
        if (!wpUrl) {
            const settingsWpUrl = document.getElementById("settings-wp-url");
            wpUrl = settingsWpUrl ? settingsWpUrl.value.trim() : "";
        }
        
        if (wpUrl) {
            wpUrl = wpUrl.replace(/\/+$/, "");
        } else {
            wpUrl = "http://localhost"; // Fallback
        }

        const linkEdicao = `${wpUrl}/wp-admin/post.php?post=${postId}&action=edit`;

        artigosGeradosHistorico.push({
            title: titulo,
            postId: postId,
            status: status, // "Publicado", "Agendado", "Rascunho"
            editLink: linkEdicao
        });

        renderizarLinksHistorico();
    }

    function renderizarLinksHistorico() {
        if (!feedLinks || !estadoVazioLinks) return;

        if (artigosGeradosHistorico.length === 0) {
            estadoVazioLinks.classList.remove("hidden");
            feedLinks.classList.add("hidden");
            feedLinks.innerHTML = "";
            return;
        }

        estadoVazioLinks.classList.add("hidden");
        feedLinks.classList.remove("hidden");
        feedLinks.innerHTML = "";

        artigosGeradosHistorico.forEach((art) => {
            const card = document.createElement("div");
            card.className = "link-card";

            let classeStatus = "rascunho";
            if (art.status === "Publicado") classeStatus = "publicado";
            if (art.status === "Agendado") classeStatus = "agendado";

            card.innerHTML = `
                <div class="link-card-header">
                    <span class="link-title" title="${art.title}">${art.title}</span>
                    <span class="link-status-badge ${classeStatus}">
                        ${art.status === "Publicado" ? `
                            <svg xmlns="http://www.w3.org/2000/svg" class="svg-icon mr-1" style="height:0.8rem; width:0.8rem;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                                <polyline points="22 4 12 14.01 9 11.01"/>
                            </svg>
                        ` : art.status === "Agendado" ? `
                            <svg xmlns="http://www.w3.org/2000/svg" class="svg-icon mr-1" style="height:0.8rem; width:0.8rem;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12 6 12 12 16 14"/>
                            </svg>
                        ` : `
                            <svg xmlns="http://www.w3.org/2000/svg" class="svg-icon mr-1" style="height:0.8rem; width:0.8rem;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="16" y1="13" x2="8" y2="13"/>
                            </svg>
                        `}
                        ${art.status}
                    </span>
                </div>
                <div class="link-card-body">
                    <div class="link-url-wrapper" title="${art.editLink}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="svg-icon" style="height:0.85rem; width:0.85rem;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                        </svg>
                        <a href="${art.editLink}" target="_blank" class="link-url-text">${art.editLink}</a>
                    </div>
                    <button class="link-copy-btn" title="Copiar Link de Edição">
                        <span class="copy-badge-pop">Copiado!</span>
                        <svg class="svg-icon copy-icon" style="height: 0.95rem; width: 0.95rem;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                        <svg class="svg-icon check-icon hidden" style="height: 0.95rem; width: 0.95rem; color: var(--color-success);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                    </button>
                </div>
            `;

            const botaoCopiar = card.querySelector(".link-copy-btn");
            const iconeCopia = botaoCopiar.querySelector(".copy-icon");
            const iconeCheck = botaoCopiar.querySelector(".check-icon");

            botaoCopiar.addEventListener("click", async () => {
                try {
                    await navigator.clipboard.writeText(art.editLink);
                    
                    botaoCopiar.classList.add("copied");
                    iconeCopia.classList.add("hidden");
                    iconeCheck.classList.remove("hidden");

                    exibirNotificacao("Link de edição copiado!", "success", 2000);

                    setTimeout(() => {
                        botaoCopiar.classList.remove("copied");
                        iconeCopia.classList.remove("hidden");
                        iconeCheck.classList.add("hidden");
                    }, 2000);
                } catch (err) {
                    exibirNotificacao("Erro ao copiar o link.", "error");
                }
            });

            feedLinks.appendChild(card);
        });
    }

    if (botaoLimparLinks) {
        botaoLimparLinks.addEventListener("click", () => {
            artigosGeradosHistorico = [];
            renderizarLinksHistorico();
            adicionarLogTerminal("Histórico de links gerados limpo com sucesso.", "system");
            exibirNotificacao("Histórico de links limpo!", "info");
        });
    }

    if (botaoCopiarTodosLinks) {
        botaoCopiarTodosLinks.addEventListener("click", () => {
            if (artigosGeradosHistorico.length === 0) {
                exibirNotificacao("Nenhum link gerado para copiar!", "warning");
                return;
            }
            
            // Copia apenas a URL limpa de cada um pulando uma linha (com \n)
            const todosLinks = artigosGeradosHistorico.map(art => art.editLink).join("\n");
            navigator.clipboard.writeText(todosLinks)
                .then(() => {
                    exibirNotificacao("Todos os links copiados!", "success");
                    adicionarLogTerminal("Todos os links de edição do WP foram copiados (separados por quebra de linha).", "success");
                })
                .catch(err => {
                    adicionarLogTerminal("Erro ao copiar links: " + err, "error");
                });
        });
    }
    
    // Extrair e validar dados do formulário principal
    function obterDadosFormulario() {
        const titulo = entradaTitulo.value.trim();
        const conteudo = entradaConteudo.value.trim();
        
        if (!titulo) {
            adicionarLogTerminal("Erro: O campo Título é obrigatório!", "error");
            exibirNotificacao("Título obrigatório ausente!", "error");
            entradaTitulo.focus();
            return null;
        }
        
        let nomeCategoria = "";
        if (entradaCategorias && !entradaCategorias.classList.contains("hidden")) {
            nomeCategoria = entradaCategorias.value.trim();
        } else if (entradaCategoriasManual) {
            nomeCategoria = entradaCategoriasManual.value.trim();
        }

        if (!nomeCategoria) {
            adicionarLogTerminal("Erro: É obrigatório selecionar ou digitar uma categoria!", "error");
            exibirNotificacao("Categoria obrigatória ausente!", "error");
            if (entradaCategorias && !entradaCategorias.classList.contains("hidden")) {
                entradaCategorias.focus();
            } else if (entradaCategoriasManual) {
                entradaCategoriasManual.focus();
            }
            return null;
        }

        const categorias = [];
        categorias.push(nomeCategoria);

        const tags = entradaTags.value
            .split(",")
            .map(t => t.trim())
            .filter(t => t.length > 0);
            
        const statusPost = entradaStatusPost ? entradaStatusPost.value : "draft";
            
        return {
            title: titulo,
            slug: entradaSlug.value.trim(),
            content: conteudo,
            categories: categorias,
            tags: tags,
            focus_keyword: entradaPalavraFoco.value.trim(),
            meta_description: entradaMetaDesc.value.trim(),
            schedule_datetime: entradaAgendamento.value,
            post_status: statusPost
        };
    }
    
    // ==========================================================================
    // 6. EXPORTAR E IMPORTAR JSON
    // ==========================================================================
    botaoExportarJson.addEventListener("click", () => {
        const dados = obterDadosFormulario();
        if (!dados) return;
        
        adicionarLogTerminal("Iniciando exportação para formato JSON local...", "info");
        
        try {
            const stringJson = JSON.stringify(dados, null, 4);
            const blob = new Blob([stringJson], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const nomeArquivo = (dados.slug || "artigo-exportado") + ".json";
            
            const a = document.createElement("a");
            a.href = url;
            a.download = nomeArquivo;
            document.body.appendChild(a);
            a.click();
            
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            adicionarLogTerminal(`Sucesso: Artigo salvo localmente como '${nomeArquivo}'`, "success");
            exibirNotificacao("JSON exportado com sucesso!", "success");
        } catch (e) {
            adicionarLogTerminal(`Erro crítico ao gerar JSON: ${e.message}`, "error");
            exibirNotificacao("Erro ao exportar JSON.", "error");
        }
    });
    
    // ==========================================================================
    // 7. ENVIAR / AGENDAR NO WORDPRESS
    // ==========================================================================
    botaoPublicarWp.addEventListener("click", async () => {
        const dados = obterDadosFormulario();
        if (!dados) return;
        
        if (slugEmUso) {
            const prosseguir = confirm(`Atenção: O slug "${dados.slug}" já está em uso pelo post "${tituloPostDuplicado}".\n\nDeseja publicar mesmo assim? (O WordPress adicionará "-2" no link automaticamente)`);
            if (!prosseguir) {
                adicionarLogTerminal("Envio abortado pelo usuário: slug duplicado detectado.", "warning");
                exibirNotificacao("Envio cancelado!", "warning");
                return;
            }
        }
        
        botaoPublicarWp.disabled = true;
        botaoExportarJson.disabled = true;
        
        const spinner = botaoPublicarWp.querySelector(".spinner");
        const btnText = botaoPublicarWp.querySelector(".btn-text");
        
        spinner.classList.remove("hidden");
        btnText.classList.add("hidden");
        
        adicionarLogTerminal("Conectando ao servidor local do integrador...", "info");
        exibirNotificacao("Iniciando postagem no WordPress...", "info");
        
        if (dados.schedule_datetime) {
            adicionarLogTerminal(`Agendamento solicitado para: ${dados.schedule_datetime}`, "warning");
        } else {
            adicionarLogTerminal("Postagem solicitada para publicação imediata...", "warning");
        }
        
        try {
            const resposta = await fetch("/publish", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(dados)
            });
            
            const resultado = await resposta.json();
            
            if (resultado.success) {
                adicionarLogTerminal(`<strong>Sucesso:</strong> ${resultado.message}`, "success");
                adicionarLogTerminal(`Status do Post no WP: <strong>${resultado.status}</strong>`, "success");
                adicionarLogTerminal(`ID do Post Cadastrado: ${resultado.post_id}`, "info");
                exibirNotificacao(`Artigo cadastrado! ID: ${resultado.post_id}`, "success");
                
                if (resultado.link) {
                    adicionarLogTerminal(`Visualizar post no WordPress: <a href="${resultado.link}" target="_blank" class="console-link">${resultado.link}</a>`, "success");
                }

                registrarLinkGerado(dados.title, resultado.post_id, resultado.status);
                
                // Se o assistente de fila visual (wizard) estiver ativo
                if (typeof wizardQueue !== "undefined" && wizardQueue.length > 0) {
                    const artigoAtual = wizardQueue[wizardIndex];
                    if (artigoAtual) {
                        artigoAtual.isPublished = true;
                        artigoAtual.postId = resultado.post_id;
                        artigoAtual.publishedStatus = resultado.status;
                        artigoAtual.publishedLink = resultado.link;
                    }
                    
                    entradaConteudo.value = "";
                    entradaPalavraFoco.value = "";
                    entradaMetaDesc.value = "";
                    entradaTags.value = "";
                    
                    renderizarLivePreview();
                    entradaMetaDesc.dispatchEvent(new Event("input"));
                    
                    if (typeof renderWizardProgressMap === "function") {
                        renderWizardProgressMap();
                    }
                                       const proximoIndice = wizardIndex + 1;
                    if (proximoIndice < wizardQueue.length) {
                        adicionarLogTerminal(`✓ Artigo ${wizardIndex + 1} de ${wizardQueue.length} enviado. Carregando o próximo artigo da Fila Assistida...`, "success");
                        exibirNotificacao("Artigo enviado! Carregando próximo...", "success");
                        carregarArtigoWizard(proximoIndice);
                    } else {
                        adicionarLogTerminal("🎉 Parabéns! Todos os artigos da fila em lote foram publicados com sucesso!", "success");
                        exibirNotificacao("Fila em lote concluída com sucesso!", "success");
                        cancelarFilaWizard();
                    }
                }
            } else {
                adicionarLogTerminal(`<strong>Erro na Integração:</strong> ${resultado.message}`, "error");
                exibirNotificacao("Falha ao integrar no WordPress.", "error");
            }
        } catch (erro) {
            adicionarLogTerminal(`Erro crítico de comunicação com o backend: ${erro.message}`, "error");
            adicionarLogTerminal("Certifique-se de que o servidor Flask (python app.py) está em execução.", "error");
            exibirNotificacao("Erro crítico de conexão física.", "error");
        } finally {
            botaoPublicarWp.disabled = false;
            botaoExportarJson.disabled = false;
            spinner.classList.add("hidden");
            btnText.classList.remove("hidden");
        }
    });

    const formatHtmlBtn = document.getElementById("format-html-btn");
    if (formatHtmlBtn) {
        formatHtmlBtn.addEventListener("click", () => {
            adicionarLogTerminal("Aviso: O editor de código bruto está ativo. Cole o código gerado em HTML completo.", "info");
            exibirNotificacao("HTML Mode ativo", "info");
        });
    }

    // ==========================================================================
    // 8. CONFIGURAÇÕES DAS CREDENCIAIS DO WP (MODAL)
    // ==========================================================================
    const modalConfig = document.getElementById("settings-modal");
    const botaoAbrirConfig = document.getElementById("btn-open-settings");
    const botaoFecharConfigHeader = document.getElementById("btn-close-settings-header");
    
    const inputConfigWpUrl = document.getElementById("settings-wp-url");
    const inputConfigWpUsuario = document.getElementById("settings-wp-user");
    const inputConfigWpSenha = document.getElementById("settings-wp-password");
    
    const botaoTestarConfig = document.getElementById("btn-test-settings");
    const botaoSalvarConfig = document.getElementById("btn-save-settings");
    const msgStatusConfig = document.getElementById("settings-status-msg");
    const connectionBadge = document.getElementById("wp-connection-badge");

    // Abrir modal e buscar configurações atuais
    botaoAbrirConfig.addEventListener("click", async () => {
        msgStatusConfig.textContent = "";
        msgStatusConfig.className = "modal-status-msg";
        modalConfig.classList.remove("hidden");
        
        try {
            const resposta = await fetch("/settings");
            if (resposta.ok) {
                const config = await resposta.json();
                inputConfigWpUrl.value = config.wp_url || "";
                inputConfigWpUsuario.value = config.wp_user || "";
                inputConfigWpSenha.value = config.wp_app_password || "";
            }
        } catch (err) {
            adicionarLogTerminal(`Erro ao carregar configurações salvas: ${err.message}`, "error");
            exibirNotificacao("Erro ao carregar credenciais.", "error");
        }
    });

    function fecharModalConfig() {
        modalConfig.classList.add("hidden");
    }
    
    if (botaoFecharConfigHeader) botaoFecharConfigHeader.addEventListener("click", fecharModalConfig);
    
    modalConfig.addEventListener("click", (e) => {
        if (e.target === modalConfig) {
            fecharModalConfig();
        }
    });

    function definirStatusModal(mensagem, tipo) {
        msgStatusConfig.textContent = mensagem;
        msgStatusConfig.className = `modal-status-msg ${tipo}`;
    }

    // Ação: Testar Conexão
    botaoTestarConfig.addEventListener("click", async () => {
        const wp_url = inputConfigWpUrl.value.trim();
        const wp_user = inputConfigWpUsuario.value.trim();
        const wp_app_password = inputConfigWpSenha.value.trim();

        if (!wp_url || !wp_user || !wp_app_password) {
            definirStatusModal("Por favor, preencha todos os campos obrigatórios.", "error");
            exibirNotificacao("Credenciais incompletas!", "warning");
            return;
        }

        botaoTestarConfig.disabled = true;
        const spinner = botaoTestarConfig.querySelector(".spinner");
        const btnText = botaoTestarConfig.querySelector(".btn-text");
        spinner.classList.remove("hidden");
        btnText.classList.add("hidden");
        definirStatusModal("Testando conexão...", "info");

        adicionarLogTerminal(`Testando autenticação de API com o servidor WP: ${wp_url}`, "info");

        try {
            const resposta = await fetch("/test-connection", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ wp_url, wp_user, wp_app_password })
            });

            const resultado = await resposta.json();

            if (resposta.ok && resultado.success) {
                definirStatusModal(resultado.message, "success");
                adicionarLogTerminal(`<strong>Conexão Testada:</strong> ${resultado.message}`, "success");
                exibirNotificacao("Conexão com WordPress bem-sucedida!", "success");
            } else {
                definirStatusModal(resultado.message, "error");
                adicionarLogTerminal(`<strong>Falha no Teste:</strong> ${resultado.message}`, "error");
                exibirNotificacao("Falha na autenticação do WP.", "error");
            }
        } catch (err) {
            definirStatusModal("Erro ao conectar ao backend.", "error");
            adicionarLogTerminal(`Erro crítico de rede no teste de credenciais: ${err.message}`, "error");
            exibirNotificacao("Erro crítico de rede no teste.", "error");
        } finally {
            botaoTestarConfig.disabled = false;
            spinner.classList.add("hidden");
            btnText.classList.remove("hidden");
        }
    });

    // Ação: Salvar Credenciais
    botaoSalvarConfig.addEventListener("click", async () => {
        const wp_url = inputConfigWpUrl.value.trim();
        const wp_user = inputConfigWpUsuario.value.trim();
        const wp_app_password = inputConfigWpSenha.value.trim();

        if (!wp_url || !wp_user || !wp_app_password) {
            definirStatusModal("Por favor, preencha todos os campos obrigatórios.", "error");
            return;
        }

        botaoSalvarConfig.disabled = true;
        definirStatusModal("Gravando configurações...", "info");

        try {
            const resposta = await fetch("/settings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ wp_url, wp_user, wp_app_password })
            });

            const resultado = await resposta.json();

            if (resposta.ok && resultado.success) {
                adicionarLogTerminal(`<strong>Configurações Gravadas:</strong> ${resultado.message}`, "success");
                exibirNotificacao("Credenciais salvas localmente!", "success");
                
                // Atualizar o status badge do Header
                connectionBadge.innerHTML = `
                    <span class="status-badge connected">
                        <span class="pulse-dot"></span>
                        <svg xmlns="http://www.w3.org/2000/svg" class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                            <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                        WordPress Conectado: <strong class="wp-url-text">${wp_url}</strong>
                    </span>
                `;
                
                fecharModalConfig();
                carregarCategoriasWp();
            } else {
                definirStatusModal(resultado.message, "error");
                adicionarLogTerminal(`Erro ao salvar credenciais: ${resultado.message}`, "error");
            }
        } catch (err) {
            definirStatusModal("Erro ao se comunicar com o backend.", "error");
            adicionarLogTerminal(`Erro crítico ao tentar salvar credenciais: ${err.message}`, "error");
        } finally {
            botaoSalvarConfig.disabled = false;
        }
    });

    // ==========================================================================
    // 9. IMPORTAÇÃO DE ARTIGO VIA ARQUIVO JSON
    // ==========================================================================
    const btnImportJson = document.getElementById("btn-import-json");
    const inputImportJson = document.getElementById("input-import-json");

    btnImportJson.addEventListener("click", () => {
        inputImportJson.click();
    });

    inputImportJson.addEventListener("change", (e) => {
        const arquivo = e.target.files[0];
        if (!arquivo) return;

        adicionarLogTerminal(`Iniciando leitura do arquivo selecionado: '${arquivo.name}'...`, "info");
        exibirNotificacao("Lendo arquivo JSON...", "info");

        const leitor = new FileReader();
        leitor.onload = (event) => {
            try {
                const parseado = JSON.parse(event.target.result);

                if (!parseado.title || !parseado.content) {
                    adicionarLogTerminal("Falha na importação: O arquivo JSON deve conter ao menos os campos 'title' (Título) e 'content' (Conteúdo HTML).", "error");
                    exibirNotificacao("JSON inválido: Campos obrigatórios ausentes.", "error");
                    return;
                }

                entradaTitulo.value = parseado.title || "";
                entradaSlug.value = parseado.slug || "";
                entradaConteudo.value = parseado.content || "";
                entradaPalavraFoco.value = parseado.focus_keyword || "";
                entradaMetaDesc.value = parseado.meta_description || "";
                
                let catImportada = "";
                if (Array.isArray(parseado.categories) && parseado.categories.length > 0) {
                    catImportada = parseado.categories[0];
                } else if (typeof parseado.categories === "string") {
                    catImportada = parseado.categories;
                }
                
                if (catImportada) {
                    if (entradaCategorias && !entradaCategorias.classList.contains("hidden")) {
                        let opcaoExiste = Array.from(entradaCategorias.options).some(opt => opt.value === catImportada);
                        if (!opcaoExiste) {
                            const optDinamica = document.createElement("option");
                            optDinamica.value = catImportada;
                            optDinamica.textContent = `${catImportada} (Importada)`;
                            entradaCategorias.appendChild(optDinamica);
                            adicionarLogTerminal(`Categoria '${catImportada}' não listada localmente; adicionada e selecionada dinamicamente.`, "info");
                        }
                        entradaCategorias.value = catImportada;
                    } else if (entradaCategoriasManual) {
                        entradaCategoriasManual.value = catImportada;
                    }
                } else {
                    if (entradaCategorias) entradaCategorias.value = "";
                    if (entradaCategoriasManual) entradaCategoriasManual.value = "";
                }

                if (Array.isArray(parseado.tags)) {
                    entradaTags.value = parseado.tags.join(", ");
                } else {
                    entradaTags.value = parseado.tags || "";
                }

                if (parseado.schedule_datetime) {
                    entradaAgendamento.value = parseado.schedule_datetime;
                } else {
                    entradaAgendamento.value = "";
                }
                
                if (parseado.post_status && entradaStatusPost) {
                    entradaStatusPost.value = parseado.post_status;
                    entradaStatusPost.dispatchEvent(new Event("change"));
                } else if (entradaStatusPost) {
                    entradaStatusPost.value = "draft";
                    entradaStatusPost.dispatchEvent(new Event("change"));
                }

                entradaMetaDesc.dispatchEvent(new Event("input"));
                entradaTitulo.dispatchEvent(new Event("input"));
                renderizarLivePreview();

                adicionarLogTerminal(`<strong>Sucesso:</strong> Artigo '${parseado.title}' importado com sucesso do arquivo JSON!`, "success");
                exibirNotificacao("Artigo importado com sucesso!", "success");
            } catch (err) {
                adicionarLogTerminal(`Erro crítico ao analisar o arquivo JSON: ${err.message}`, "error");
                exibirNotificacao("Falha ao analisar JSON.", "error");
            } finally {
                inputImportJson.value = "";
            }
        };

        leitor.onerror = () => {
            adicionarLogTerminal("Erro físico de leitura do arquivo no navegador.", "error");
            exibirNotificacao("Erro na leitura física do JSON.", "error");
            inputImportJson.value = "";
        };

        leitor.readAsText(arquivo);
    });

    // ==========================================================================
    // 10. CARGA DINÂMICA DE CATEGORIAS DO WORDPRESS (SKELETON LOADER)
    // ==========================================================================
    async function carregarCategoriasWp() {
        if (!entradaCategorias) return;
        
        const selecaoAnterior = entradaCategorias.value;
        
        entradaCategorias.classList.add("hidden");
        if (entradaCategoriasManual) entradaCategoriasManual.classList.add("hidden");
        if (esqueletoCategorias) esqueletoCategorias.classList.remove("hidden");
        entradaCategorias.disabled = true;
        
        try {
            const resposta = await fetch("/wp-categories");
            if (!resposta.ok) throw new Error("Falha HTTP");
            
            const categorias = await resposta.json();
            
            if (Array.isArray(categorias) && categorias.length > 0) {
                entradaCategorias.innerHTML = '<option value="">Selecione uma categoria...</option>';
                categorias.forEach(cat => {
                    const opt = document.createElement("option");
                    opt.value = cat.name;
                    opt.textContent = cat.name;
                    entradaCategorias.appendChild(opt);
                });
                
                entradaCategorias.classList.remove("hidden");
                entradaCategorias.disabled = false;
                
                if (selecaoAnterior && Array.from(entradaCategorias.options).some(o => o.value === selecaoAnterior)) {
                    entradaCategorias.value = selecaoAnterior;
                }
                
                adicionarLogTerminal(`${categorias.length} categorias carregadas do WordPress com sucesso.`, "system");
            } else {
                throw new Error("Nenhuma categoria retornada ou site desconectado");
            }
        } catch (err) {
            adicionarLogTerminal("Aviso: Não foi possível carregar as categorias dinâmicas do WordPress. Ativando digitação manual.", "warning");
            
            entradaCategorias.classList.add("hidden");
            if (entradaCategoriasManual) {
                entradaCategoriasManual.classList.remove("hidden");
                if (selecaoAnterior) entradaCategoriasManual.value = selecaoAnterior;
            }
            
            adicionarLogTerminal("Fallback ativado: modo de digitação manual de categoria liberado.", "system");
        } finally {
            if (esqueletoCategorias) esqueletoCategorias.classList.add("hidden");
        }
    }

    if (entradaStatusPost && entradaAgendamento && grupoAgendamento) {
        entradaStatusPost.addEventListener("change", () => {
            if (entradaStatusPost.value === "draft") {
                adicionarLogTerminal("Status 'Rascunho' selecionado: o artigo será salvo como rascunho com a data/hora de agendamento pré-configurada no WordPress.", "info");
                exibirNotificacao("Modo Rascunho selecionado", "info");
            }
        });
    }

    // ==========================================================================
    // 11. SISTEMA DE NAVEGAÇÃO DE ABAS
    // ==========================================================================
    botoesAbas.forEach(btn => {
        btn.addEventListener("click", () => {
            const navPai = btn.parentElement;
            const irmaos = navPai.querySelectorAll(".tab-btn");
            irmaos.forEach(s => s.classList.remove("active"));
            btn.classList.add("active");

            const idAlvo = btn.dataset.tab;
            if (idAlvo) {
                if (navPai.classList.contains("right-tabs")) {
                    document.getElementById("right-console-content").classList.add("hidden");
                    document.getElementById("right-preview-content").classList.add("hidden");
                    document.getElementById("right-links-content").classList.add("hidden");
                    document.getElementById(`${idAlvo}-content`).classList.remove("hidden");
                } else {
                    document.getElementById("single-mode-content").classList.add("hidden");
                    document.getElementById("bulk-mode-content").classList.add("hidden");
                    const mediaContent = document.getElementById("media-mode-content");
                    if (mediaContent) mediaContent.classList.add("hidden");
                    document.getElementById(`${idAlvo}-content`).classList.remove("hidden");
                }
            }
        });
    });

    if (entradaDataBaseLote) {
        const stringHoje = new Date().toISOString().split("T")[0];
        entradaDataBaseLote.value = stringHoje;
    }

    // ==========================================================================
    // 12. LOGICA DO PLANEJADOR EM LOTE (BULK WIZARD / QUEUE)
    // ==========================================================================
    let titulosLoteParseados = [];
    let horariosLoteParseados = [];

    function formatarDataAmigavel(stringData) {
        if (!stringData) return "";
        const partes = stringData.split("-");
        if (partes.length === 3) {
            return `${partes[2]}/${partes[1]}/${partes[0].substring(2)}`;
        }
        return stringData;
    }

    function renderizarPreviaLote() {
        if (!listaPreviaLote) return;
        listaPreviaLote.innerHTML = "";
        
        if (titulosLoteParseados.length === 0) {
            listaPreviaLote.innerHTML = '<div class="preview-empty-msg">Nenhum título mapeado ainda. Insira títulos e horários acima.</div>';
            return;
        }
        
        const dataBaseValor = entradaDataBaseLote ? entradaDataBaseLote.value : new Date().toISOString().split("T")[0];
        const limite = Math.max(titulosLoteParseados.length, horariosLoteParseados.length);
        
        for (let i = 0; i < limite; i++) {
            const titulo = titulosLoteParseados[i] || `<span style="color: var(--color-danger); font-style: italic;">[Faltando título para o horário ${i+1}]</span>`;
            const horario = horariosLoteParseados[i] || '<span style="color: var(--color-danger); font-style: italic;">[HH:MM]</span>';
            
            const item = document.createElement("div");
            item.className = "bulk-preview-item";
            
            const spanTitulo = document.createElement("span");
            spanTitulo.className = "preview-title";
            spanTitulo.innerHTML = titulo;
            
            const spanData = document.createElement("span");
            spanData.className = "preview-date";
            spanData.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="svg-icon align-middle mr-1" style="height: 0.95rem; width: 0.95rem;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${formatarDataAmigavel(dataBaseValor)} às ${horario}`;
            
            item.appendChild(spanTitulo);
            item.appendChild(spanData);
            listaPreviaLote.appendChild(item);
        }
    }

    function analisarEntradasLote() {
        if (!entradaTitulosLote || !entradaHorariosLote) return;
        
        const titulosLimpos = entradaTitulosLote.value.split("\n").map(t => t.trim()).filter(t => t.length > 0);
        const horariosLimpos = entradaHorariosLote.value.split("\n").map(t => t.trim()).filter(t => t.length > 0);
        
        titulosLoteParseados = titulosLimpos;
        horariosLoteParseados = horariosLimpos;
        
        if (contadorTitulosLote) contadorTitulosLote.textContent = `${titulosLimpos.length} títulos`;
        if (contadorHorariosLote) contadorHorariosLote.textContent = `${horariosLimpos.length} horários`;
        
        const ehConsistente = titulosLimpos.length === horariosLimpos.length && titulosLimpos.length > 0;
        
        if (emblemaConsistencia) {
            if (titulosLimpos.length === 0 && horariosLimpos.length === 0) {
                emblemaConsistencia.className = "consistency-status-panel";
                emblemaConsistencia.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                    Cole títulos e horários para validar.
                `;
                if (botaoCarregarFilaLote) botaoCarregarFilaLote.disabled = true;
            } else if (ehConsistente) {
                emblemaConsistencia.className = "consistency-status-panel consistent";
                emblemaConsistencia.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    Consistência verificada! Quantidades equivalentes.
                `;
                if (botaoCarregarFilaLote) botaoCarregarFilaLote.disabled = false;
            } else {
                emblemaConsistencia.className = "consistency-status-panel inconsistent";
                emblemaConsistencia.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    Divergência: ${titulosLimpos.length} títulos vs ${horariosLimpos.length} horários.
                `;
                if (botaoCarregarFilaLote) botaoCarregarFilaLote.disabled = true;
            }
        }
        
        renderizarPreviaLote();
    }

    if (entradaTitulosLote) entradaTitulosLote.addEventListener("input", analisarEntradasLote);
    if (entradaHorariosLote) entradaHorariosLote.addEventListener("input", analisarEntradasLote);
    if (entradaDataBaseLote) entradaDataBaseLote.addEventListener("change", analisarEntradasLote);

    // ==========================================================================
    // 13. WIZARD INTERATIVO (FILA ASSISTIDA) CONTROLLER COM ESTADO ISOLADO
    // ==========================================================================
    window.wizardQueue = [];
    window.wizardIndex = 0;

    // Salvar estado atual do formulário na fila do assistente
    function salvarEstadoAtualWizard() {
        if (typeof window.wizardQueue === "undefined" || window.wizardQueue.length === 0) return;
        if (window.wizardIndex < 0 || window.wizardIndex >= window.wizardQueue.length) return;
        
        const artigoAtual = window.wizardQueue[window.wizardIndex];
        
        artigoAtual.slug = entradaSlug.value.trim();
        artigoAtual.content = entradaConteudo.value.trim();
        artigoAtual.category = entradaCategorias.classList.contains("hidden") ? entradaCategoriasManual.value.trim() : entradaCategorias.value.trim();
        artigoAtual.tags = entradaTags.value.trim();
        artigoAtual.focus_keyword = entradaPalavraFoco.value.trim();
        artigoAtual.meta_description = entradaMetaDesc.value.trim();
        artigoAtual.post_status = entradaStatusPost.value;
        artigoAtual.manualSlug = entradaSlug.dataset.manualEdited === "true";
        artigoAtual.isConfigured = true;
    }

    // Desenhar mapa de progresso visual
    window.renderWizardProgressMap = function() {
        if (!mapaProgressoWizard || typeof window.wizardQueue === "undefined") return;
        mapaProgressoWizard.innerHTML = "";
        
        window.wizardQueue.forEach((art, idx) => {
            const noPasso = document.createElement("div");
            let classes = "wizard-step-node";
            if (idx === window.wizardIndex) classes += " active";
            if (art.isPublished) classes += " published";
            noPasso.className = classes;
            
            noPasso.setAttribute("data-title", `Artigo ${idx + 1}: ${art.title}`);
            
            if (art.isPublished) {
                noPasso.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" style="width: 0.8rem; height: 0.8rem;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                    </svg>
                `;
            } else {
                noPasso.textContent = idx + 1;
            }
            
            noPasso.addEventListener("click", () => {
                if (idx !== window.wizardIndex) {
                    window.carregarArtigoWizard(idx);
                }
            });
            
            mapaProgressoWizard.appendChild(noPasso);
        });
    };

    // Carregar artigo da fila no formulário
    window.carregarArtigoWizard = function(indice) {
        if (!window.wizardQueue || indice < 0 || indice >= window.wizardQueue.length) return;
        
        if (window.wizardQueue.length > 0 && typeof window.wizardIndex === "number" && window.wizardQueue[window.wizardIndex]) {
            salvarEstadoAtualWizard();
        }
        
        window.wizardIndex = indice;
        const artigo = window.wizardQueue[indice];
        
        if (entradaTitulo) entradaTitulo.value = artigo.title || "";
        if (entradaAgendamento) entradaAgendamento.value = artigo.datetime || "";
        
        // Slug
        if (artigo.manualSlug) {
            entradaSlug.dataset.manualEdited = "true";
            entradaSlug.value = artigo.slug || "";
        } else {
            delete entradaSlug.dataset.manualEdited;
            const slugGerado = (artigo.title || "")
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9\s-]/g, "")
                .trim()
                .replace(/\s+/g, "-")
                .replace(/-+/g, "-");
            entradaSlug.value = slugGerado;
            artigo.slug = slugGerado;
        }
        
        // Restaurar estado ou limpar formulário
        if (artigo.isConfigured) {
            entradaConteudo.value = artigo.content || "";
            entradaTags.value = artigo.tags || "";
            entradaPalavraFoco.value = artigo.focus_keyword || "";
            entradaMetaDesc.value = artigo.meta_description || "";
            if (entradaStatusPost) entradaStatusPost.value = artigo.post_status || "draft";
            
            const valorCategoria = artigo.category || "";
            if (entradaCategorias) {
                if (entradaCategorias.classList.contains("hidden")) {
                    if (entradaCategoriasManual) entradaCategoriasManual.value = valorCategoria;
                } else {
                    let opcaoExiste = Array.from(entradaCategorias.options).some(o => o.value === valorCategoria);
                    if (valorCategoria && !opcaoExiste) {
                        const opt = document.createElement("option");
                        opt.value = valorCategoria;
                        opt.textContent = valorCategoria;
                        entradaCategorias.appendChild(opt);
                    }
                    entradaCategorias.value = valorCategoria;
                }
            }
        } else {
            entradaConteudo.value = "";
            entradaPalavraFoco.value = "";
            entradaMetaDesc.value = "";
            entradaTags.value = "";
            
            if (entradaCategorias) {
                if (!entradaCategorias.classList.contains("hidden")) {
                    entradaCategorias.value = "";
                } else if (entradaCategoriasManual) {
                    entradaCategoriasManual.value = "";
                }
            }
            if (entradaStatusPost) entradaStatusPost.value = "draft";
            
            artigo.content = "";
            artigo.focus_keyword = "";
            artigo.meta_description = "";
            artigo.tags = "";
            artigo.category = "";
            artigo.post_status = "draft";
            artigo.isConfigured = true;
        }
        
        // Exibir/Ocultar barra de cópia de configurações do artigo anterior
        if (indice > 0 && window.wizardQueue[indice - 1] && window.wizardQueue[indice - 1].isConfigured) {
            if (barraCopiarConfigAnterior) barraCopiarConfigAnterior.classList.remove("hidden");
        } else {
            if (barraCopiarConfigAnterior) barraCopiarConfigAnterior.classList.add("hidden");
        }
        
        if (entradaTitulo) entradaTitulo.dispatchEvent(new Event("input"));
        if (entradaMetaDesc) entradaMetaDesc.dispatchEvent(new Event("input"));
        renderizarLivePreview();
        
        window.renderWizardProgressMap();
        
        if (entradaConteudo) entradaConteudo.focus();
        
        if (textoStatusWizard) {
            textoStatusWizard.textContent = `Artigo ${indice + 1} de ${window.wizardQueue.length}: "${artigo.title}"`;
        }
        
        if (botaoWizardAnterior) botaoWizardAnterior.disabled = indice === 0;
        if (botaoWizardProximo) botaoWizardProximo.disabled = indice === window.wizardQueue.length - 1;
        
        if (entradaSlug) {
            verificarSlugDinamico(entradaSlug.value);
        }
        
        adicionarLogTerminal(`Fila Ativa: Artigo ${indice + 1}/${window.wizardQueue.length} carregado no formulário.`, "info");
    };

    // Duplicar configurações do artigo anterior
    window.duplicarConfiguracaoAnterior = function() {
        const idx = window.wizardIndex;
        if (idx <= 0) return;
        
        const artigoAnterior = window.wizardQueue[idx - 1];
        if (!artigoAnterior || !artigoAnterior.isConfigured) return;
        
        entradaTags.value = artigoAnterior.tags || "";
        entradaPalavraFoco.value = artigoAnterior.focus_keyword || "";
        entradaMetaDesc.value = artigoAnterior.meta_description || "";
        if (entradaStatusPost) entradaStatusPost.value = artigoAnterior.post_status || "draft";
        
        const valorCategoria = artigoAnterior.category || "";
        if (entradaCategorias) {
            if (entradaCategorias.classList.contains("hidden")) {
                if (entradaCategoriasManual) entradaCategoriasManual.value = valorCategoria;
            } else {
                let opcaoExiste = Array.from(entradaCategorias.options).some(o => o.value === valorCategoria);
                if (valorCategoria && !opcaoExiste) {
                    const opt = document.createElement("option");
                    opt.value = valorCategoria;
                    opt.textContent = valorCategoria;
                    entradaCategorias.appendChild(opt);
                }
                entradaCategorias.value = valorCategoria;
            }
        }
        
        entradaMetaDesc.dispatchEvent(new Event("input"));
        salvarEstadoAtualWizard();
        
        if (barraCopiarConfigAnterior) {
            barraCopiarConfigAnterior.classList.add("hidden");
        }
        
        adicionarLogTerminal("Configurações do artigo anterior duplicadas com sucesso!", "success");
        exibirNotificacao("Configurações copiadas!", "success");
    };

    if (botaoCopiarConfigAnterior) {
        botaoCopiarConfigAnterior.addEventListener("click", window.duplicarConfiguracaoAnterior);
    }

    window.cancelarFilaWizard = function() {
        window.wizardQueue = [];
        window.wizardIndex = 0;
        if (barraWizard) barraWizard.classList.add("hidden");
        if (barraCopiarConfigAnterior) barraCopiarConfigAnterior.classList.add("hidden");
        
        entradaTitulo.value = "";
        entradaSlug.value = "";
        delete entradaSlug.dataset.manualEdited;
        entradaConteudo.value = "";
        entradaTags.value = "";
        entradaPalavraFoco.value = "";
        entradaMetaDesc.value = "";
        entradaAgendamento.value = "";
        if (entradaStatusPost) entradaStatusPost.value = "draft";
        
        if (entradaCategorias) {
            if (!entradaCategorias.classList.contains("hidden")) {
                entradaCategorias.value = "";
            } else if (entradaCategoriasManual) {
                entradaCategoriasManual.value = "";
            }
        }
        
        renderizarLivePreview();
        entradaMetaDesc.dispatchEvent(new Event("input"));
        
        adicionarLogTerminal("Fila de publicação assistida cancelada e limpa.", "system");
        exibirNotificacao("Fila do assistente cancelada", "warning");
    };

    if (botaoCarregarFilaLote) {
        botaoCarregarFilaLote.addEventListener("click", () => {
            const stringHoje = new Date().toISOString().split("T")[0];
            const dataBaseValor = (entradaDataBaseLote && entradaDataBaseLote.value) ? entradaDataBaseLote.value : stringHoje;
            
            window.wizardQueue = titulosLoteParseados.map((titulo, indice) => {
                const horario = horariosLoteParseados[indice];
                return {
                    title: titulo,
                    datetime: `${dataBaseValor}T${horario}`
                };
            });
            
            window.wizardIndex = 0;
            if (window.wizardQueue.length === 0) return;
            
            adicionarLogTerminal(`Carregando fila de ${window.wizardQueue.length} artigos no assistente visual!`, "info");
            exibirNotificacao("Fila de artigos carregada!", "success");
            
            const botaoSingleAba = document.querySelector('[data-tab="single-mode"]');
            if (botaoSingleAba) botaoSingleAba.click();
            
            if (barraWizard) barraWizard.classList.remove("hidden");
            
            window.carregarArtigoWizard(0);
        });
    }

    if (botaoWizardAnterior) {
        botaoWizardAnterior.addEventListener("click", () => {
            window.carregarArtigoWizard(window.wizardIndex - 1);
        });
    }

    if (botaoWizardProximo) {
        botaoWizardProximo.addEventListener("click", () => {
            window.carregarArtigoWizard(window.wizardIndex + 1);
        });
    }

    if (botaoWizardCancelar) {
        botaoWizardCancelar.addEventListener("click", window.cancelarFilaWizard);
    }

    // Atalhos de teclado: Ctrl + Setas para navegar no assistente ou setas na aba de mídias
    document.addEventListener("keydown", (e) => {
        const mediaTabBtn = document.querySelector('[data-tab="media-mode"]');
        const mediaTabActive = mediaTabBtn && mediaTabBtn.classList.contains("active");

        if (mediaTabActive) {
            const cards = lotesMidiaFeed ? lotesMidiaFeed.querySelectorAll(".lote-media-card") : [];
            if (cards.length > 0) {
                if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    carouselMediaIndex = (carouselMediaIndex - 1 + cards.length) % cards.length;
                    atualizarVisibilidadeCarrossel();
                } else if (e.key === "ArrowRight") {
                    e.preventDefault();
                    carouselMediaIndex = (carouselMediaIndex + 1) % cards.length;
                    atualizarVisibilidadeCarrossel();
                }
            }
            return;
        }

        if (typeof window.wizardQueue !== "undefined" && window.wizardQueue.length > 0) {
            if (e.ctrlKey) {
                if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    if (window.wizardIndex > 0) {
                        window.carregarArtigoWizard(window.wizardIndex - 1);
                    }
                } else if (e.key === "ArrowRight") {
                    e.preventDefault();
                    if (window.wizardIndex < window.wizardQueue.length - 1) {
                        window.carregarArtigoWizard(window.wizardIndex + 1);
                    }
                }
            }
        }
    });

    // Inicialização automática
    carregarCategoriasWp();

    // ==========================================================================
    // 13. LOGICA DE UPLOAD DE MÍDIAS EM LOTE (♣)
    // ==========================================================================
    const inputTamanhoLote = document.getElementById("media-batch-size");
    const botaoIndivCaptions = document.getElementById("btn-media-indiv-captions");
    const botaoBulkCaptions = document.getElementById("btn-media-bulk-captions");
    const botaoEqualCaptions = document.getElementById("btn-media-equal-captions");
    const dragZoneMedia = document.getElementById("media-drag-zone");
    const inputFilesMedia = document.getElementById("media-files-input");
    const lotesMidiaFeed = document.getElementById("lotes-midia-feed");
    const tituloLotesGerados = document.getElementById("title-lotes-gerados");
    const mediaActionsBar = document.getElementById("media-actions-bar");
    const botaoUploadMediaWp = document.getElementById("btn-upload-media-wp");
    const bulkTitlesContainer = document.getElementById("media-bulk-titles-container");
    const bulkTitlesInput = document.getElementById("media-bulk-titles");
    const mediaCarouselNav = document.getElementById("media-carousel-nav");
    const btnMediaCarouselPrev = document.getElementById("btn-media-carousel-prev");
    const btnMediaCarouselNext = document.getElementById("btn-media-carousel-next");
    const mediaCarouselIndicator = document.getElementById("media-carousel-indicator");

    let imagensCarregadas = [];
    let carouselMediaIndex = 0;

    // Vincular botões de navegação do carrossel
    if (btnMediaCarouselPrev) {
        btnMediaCarouselPrev.addEventListener("click", () => {
            const cards = lotesMidiaFeed ? lotesMidiaFeed.querySelectorAll(".lote-media-card") : [];
            if (cards.length > 0) {
                carouselMediaIndex = (carouselMediaIndex - 1 + cards.length) % cards.length;
                atualizarVisibilidadeCarrossel();
            }
        });
    }

    if (btnMediaCarouselNext) {
        btnMediaCarouselNext.addEventListener("click", () => {
            const cards = lotesMidiaFeed ? lotesMidiaFeed.querySelectorAll(".lote-media-card") : [];
            if (cards.length > 0) {
                carouselMediaIndex = (carouselMediaIndex + 1) % cards.length;
                atualizarVisibilidadeCarrossel();
            }
        });
    }

    if (dragZoneMedia && inputFilesMedia) {
        dragZoneMedia.addEventListener("click", () => {
            inputFilesMedia.click();
        });

        dragZoneMedia.addEventListener("dragover", (e) => {
            e.preventDefault();
            dragZoneMedia.classList.add("dragover");
        });

        dragZoneMedia.addEventListener("dragleave", () => {
            dragZoneMedia.classList.remove("dragover");
        });

        dragZoneMedia.addEventListener("drop", (e) => {
            e.preventDefault();
            dragZoneMedia.classList.remove("dragover");
            tratarArquivosSelecionados(e.dataTransfer.files);
        });

        inputFilesMedia.addEventListener("change", () => {
            tratarArquivosSelecionados(inputFilesMedia.files);
        });
    }

    function obterBaseNomeLimpo(nomeCompleto) {
        const idxPonto = nomeCompleto.lastIndexOf(".");
        let base = idxPonto !== -1 ? nomeCompleto.substring(0, idxPonto) : nomeCompleto;

        // 1. Normalizar acentos
        base = base.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        // 2. Substituir hífens e espaços por underscores
        base = base.replace(/-/g, "_").replace(/\s+/g, "_");

        // 3. Remover parênteses/colchetes com números no final (ex: "(1)", "[2]")
        base = base.replace(/_*\s*[([].*?[\])]$/, "");

        // 4. Remover carimbo de data/hora ou números sequenciais no final (ex: _202606010048)
        base = base.replace(/_+\d+$/, "");

        // Caso ainda tenha números no final sem separador (ex: Adubo_caseiro202606010048)
        base = base.replace(/\d+$/, "");

        // 5. Remover caracteres especiais (manter letras, números e underscores)
        base = base.replace(/[^a-zA-Z0-9_]/g, "");

        // Converter para minúsculo
        base = base.toLowerCase();

        // Limpar underscores duplicados ou no início/fim
        base = base.replace(/_+/g, "_").replace(/^_+|_+$/g, "");

        if (!base.trim()) {
            base = "imagem_post";
        }

        return base;
    }

    function obterRegistroNomesExistentes() {
        const registro = {};
        for (const file of imagensCarregadas) {
            const name = file.name;
            const idxPonto = name.lastIndexOf(".");
            const base = idxPonto !== -1 ? name.substring(0, idxPonto) : name;
            
            let baseClean = base;
            if (base.endsWith("-1") || base.match(/-\d+$/)) {
                const baseSemNumero = base.replace(/-\d+$/, "");
                baseClean = baseSemNumero.replace(/-/g, "_");
            } else if (base.includes("-")) {
                baseClean = base.replace(/-/g, "_");
            }
            
            registro[baseClean] = (registro[baseClean] || 0) + 1;
        }
        return registro;
    }

    function redimensionarImagemComCorte(file, newName, targetWidth, targetHeight) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    try {
                        const canvas = document.createElement("canvas");
                        canvas.width = targetWidth;
                        canvas.height = targetHeight;
                        const ctx = canvas.getContext("2d");

                        // Central crop cover math
                        const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
                        const x = (targetWidth / 2) - (img.width / 2) * scale;
                        const y = (targetHeight / 2) - (img.height / 2) * scale;

                        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

                        canvas.toBlob((blob) => {
                            if (blob) {
                                const newFile = new File([blob], newName, {
                                    type: file.type || "image/jpeg",
                                    lastModified: Date.now()
                                });
                                resolve(newFile);
                            } else {
                                console.error("Erro ao gerar blob do Canvas para: " + file.name);
                                const fallbackFile = new File([file], newName, { type: file.type });
                                resolve(fallbackFile);
                            }
                        }, file.type || "image/jpeg", 0.9);
                    } catch (e) {
                        console.error("Erro no processamento de Canvas para: " + file.name, e);
                        const fallbackFile = new File([file], newName, { type: file.type });
                        resolve(fallbackFile);
                    }
                };
                img.onerror = () => {
                    console.error("Erro ao carregar imagem: " + file.name);
                    const fallbackFile = new File([file], newName, { type: file.type });
                    resolve(fallbackFile);
                };
            };
            reader.onerror = () => {
                console.error("Erro ao ler arquivo: " + file.name);
                const fallbackFile = new File([file], newName, { type: file.type });
                resolve(fallbackFile);
            };
        });
    }

    async function tratarArquivosSelecionados(arquivos) {
        if (!arquivos || arquivos.length === 0) return;

        // Filtrar apenas imagens
        const novasImagens = Array.from(arquivos).filter(arq => arq.type.startsWith("image/"));
        
        if (novasImagens.length === 0) {
            exibirNotificacao("Por favor, selecione apenas arquivos de imagem!", "warning");
            return;
        }

        adicionarLogTerminal(`Processando e redimensionando ${novasImagens.length} imagens...`, "warning");
        exibirNotificacao("Processando imagens...", "info");

        if (botaoUploadMediaWp) {
            botaoUploadMediaWp.disabled = true;
            const btnText = botaoUploadMediaWp.querySelector(".btn-text");
            if (btnText) btnText.textContent = "Processando Imagens...";
        }

        const registroNomes = obterRegistroNomesExistentes();
        const imagensProcessadas = [];

        try {
            // Processamento SEQUENCIAL para garantir a ordem exata do input
            for (const arquivo of novasImagens) {
                const baseClean = obterBaseNomeLimpo(arquivo.name);
                const idxPonto = arquivo.name.lastIndexOf(".");
                const ext = idxPonto !== -1 ? arquivo.name.substring(idxPonto).toLowerCase() : ".jpg";

                const count = registroNomes[baseClean] || 0;
                let novoNome = "";

                if (count === 0) {
                    novoNome = `${baseClean}${ext}`;
                } else if (count === 1) {
                    const comHifen = baseClean.replace(/_/g, "-");
                    novoNome = `${comHifen}${ext}`;
                } else {
                    const comHifen = baseClean.replace(/_/g, "-");
                    const sequencial = count - 1;
                    novoNome = `${comHifen}-${sequencial}${ext}`;
                }

                registroNomes[baseClean] = count + 1;

                adicionarLogTerminal(`Redimensionando e renomeando para: ${novoNome}...`, "info");
                
                const arquivoProcessado = await redimensionarImagemComCorte(arquivo, novoNome, 1280, 720);
                imagensProcessadas.push(arquivoProcessado);
            }

            imagensCarregadas = [...imagensCarregadas, ...imagensProcessadas];
            adicionarLogTerminal(`Sucesso! ${novasImagens.length} imagens processadas.`, "success");
            exibirNotificacao("Imagens processadas com sucesso!", "success");

        } catch (erro) {
            console.error("Erro no processamento de imagens: ", erro);
            adicionarLogTerminal(`Erro ao processar lote de imagens: ${erro.message}`, "error");
            exibirNotificacao("Erro ao processar algumas imagens", "error");
        } finally {
            if (botaoUploadMediaWp) {
                botaoUploadMediaWp.disabled = false;
                const btnText = botaoUploadMediaWp.querySelector(".btn-text");
                if (btnText) btnText.textContent = "Enviar para o WordPress";
            }
            renderizarLotesDeMidia();
        }
    }

    if (inputTamanhoLote) {
        inputTamanhoLote.addEventListener("input", () => {
            renderizarLotesDeMidia();
        });
    }

    if (bulkTitlesInput) {
        bulkTitlesInput.addEventListener("input", () => {
            distribuirTitulosEmMassa();
        });
    }

    function distribuirTitulosEmMassa() {
        if (!bulkTitlesInput) return;
        const linhas = bulkTitlesInput.value.split("\n").map(l => l.trim()).filter(l => l.length > 0).reverse();
        const inputsTitulo = lotesMidiaFeed.querySelectorAll(".lote-title-alt");
        inputsTitulo.forEach((input, index) => {
            input.value = linhas[index] || "";
        });
    }

    function renderizarLotesDeMidia() {
        if (!lotesMidiaFeed) return;
        lotesMidiaFeed.innerHTML = "";

        if (imagensCarregadas.length === 0) {
            if (tituloLotesGerados) tituloLotesGerados.style.display = "none";
            if (mediaActionsBar) mediaActionsBar.style.display = "none";
            if (bulkTitlesContainer) bulkTitlesContainer.classList.add("hidden");
            if (mediaCarouselNav) mediaCarouselNav.classList.add("hidden");
            return;
        }

        if (tituloLotesGerados) tituloLotesGerados.style.display = "block";
        if (mediaActionsBar) mediaActionsBar.style.display = "block";
        if (bulkTitlesContainer) bulkTitlesContainer.classList.remove("hidden");
        if (mediaCarouselNav) mediaCarouselNav.classList.remove("hidden");

        const tamanhoLote = parseInt(inputTamanhoLote.value) || 3;
        const batchTitlesList = bulkTitlesInput ? bulkTitlesInput.value.split("\n").map(l => l.trim()).filter(l => l.length > 0).reverse() : [];
        
        // Dividir imagens em lotes
        let lotes = [];
        for (let i = 0; i < imagensCarregadas.length; i += tamanhoLote) {
            lotes.push(imagensCarregadas.slice(i, i + tamanhoLote));
        }

        // Renderizar cada lote
        lotes.forEach((loteImagens, idx) => {
            const cardLote = document.createElement("div");
            cardLote.className = "lote-media-card";
            cardLote.dataset.loteIdx = idx;

            // Generate list of rows for individual inputs (Image on left, input on right)
            let individualRowsHtml = "";
            loteImagens.forEach(img => {
                const urlImg = URL.createObjectURL(img);
                individualRowsHtml += `
                    <div class="lote-indiv-row">
                        <div class="lote-indiv-thumb-wrapper">
                            <img src="${urlImg}" class="lote-thumbnail">
                            <span class="lote-thumb-name" title="${img.name}">${img.name}</span>
                        </div>
                        <div class="form-group lote-caption-textarea-group">
                            <textarea class="lote-caption-indiv input-premium" data-img-name="${img.name}" placeholder="Legenda e Descrição para esta imagem"></textarea>
                        </div>
                    </div>
                `;
            });

            // Generate stacked deck-of-cards thumbnails for global / bulk mode
            let stackedThumbsHtml = "";
            loteImagens.forEach((img, thumbIdx) => {
                const urlImg = URL.createObjectURL(img);
                stackedThumbsHtml += `
                    <div class="lote-thumb-stacked-wrapper" style="z-index: ${loteImagens.length - thumbIdx}; transform: rotate(${(thumbIdx % 2 === 0 ? -1 : 1) * (thumbIdx * 4 - 3)}deg);" title="${img.name}">
                        <img src="${urlImg}" class="lote-thumbnail">
                    </div>
                `;
            });

            cardLote.innerHTML = `
                <div class="lote-card-header">
                    <h4>Lote ${idx + 1} (${loteImagens.length} imagens)</h4>
                    <button type="button" class="btn-remove-lote" data-lote-idx="${idx}" title="Remover este lote">Remover</button>
                </div>
                <div class="lote-card-body">
                    <!-- Título acima de tudo -->
                    <div class="form-group" style="margin-bottom: 0.75rem;">
                        <label style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 0.35rem;">Título / Texto Alternativo (Todo o Lote)</label>
                        <input type="text" class="lote-title-alt input-premium" placeholder="Título e Alt Text das imagens do lote" value="${(batchTitlesList[idx] || '').replace(/"/g, '&quot;')}" style="height: 2.85rem; font-size: 0.85rem;">
                    </div>
                    
                    <!-- Seletor segmentado de modo de legenda -->
                    <div class="lote-mode-selector">
                        <button type="button" class="lote-mode-btn" data-mode="indiv">Individual</button>
                        <button type="button" class="lote-mode-btn active" data-mode="bulk">Em Massa</button>
                        <button type="button" class="lote-mode-btn" data-mode="equal">Igual</button>
                    </div>

                    <div class="lote-caption-input-group">
                        <!-- Entrada Global (oculta por padrão) -->
                        <div class="lote-caption-global-wrapper hidden">
                            <div class="lote-thumbnails-stacked">
                                ${stackedThumbsHtml}
                            </div>
                            <div class="form-group lote-caption-textarea-group">
                                <textarea class="lote-caption-global input-premium" placeholder="Legenda e descrição para todas as imagens do lote"></textarea>
                            </div>
                        </div>

                        <!-- Entrada Em Massa (visível por padrão) -->
                        <div class="lote-caption-bulk-wrapper">
                            <div class="lote-thumbnails-stacked">
                                ${stackedThumbsHtml}
                            </div>
                            <div class="form-group lote-caption-textarea-group">
                                <textarea class="lote-caption-bulk-textarea input-premium" placeholder="Cole legendas (uma por linha) para as imagens deste lote"></textarea>
                            </div>
                        </div>
                        
                        <!-- Entradas Individuais (oculta por padrão) -->
                        <div class="lote-caption-individual-wrapper hidden">
                            ${individualRowsHtml}
                        </div>
                    </div>
                </div>
            `;

            // Alternar visibilidade de legenda global/bulk/individual
            const modeBtns = cardLote.querySelectorAll(".lote-mode-btn");
            const wrapperGlobal = cardLote.querySelector(".lote-caption-global-wrapper");
            const wrapperBulk = cardLote.querySelector(".lote-caption-bulk-wrapper");
            const wrapperIndiv = cardLote.querySelector(".lote-caption-individual-wrapper");

            modeBtns.forEach(btn => {
                btn.addEventListener("click", () => {
                    modeBtns.forEach(b => b.classList.remove("active"));
                    btn.classList.add("active");

                    const mode = btn.dataset.mode;
                    if (mode === "indiv") {
                        wrapperIndiv.classList.remove("hidden");
                        wrapperBulk.classList.add("hidden");
                        wrapperGlobal.classList.add("hidden");
                    } else if (mode === "bulk") {
                        wrapperIndiv.classList.add("hidden");
                        wrapperBulk.classList.remove("hidden");
                        wrapperGlobal.classList.add("hidden");
                    } else if (mode === "equal") {
                        wrapperIndiv.classList.add("hidden");
                        wrapperBulk.classList.add("hidden");
                        wrapperGlobal.classList.remove("hidden");
                    }
                });
            });

            // Ouvinte para a Legenda em Massa do Lote (sincroniza com as individuais apenas se o usuário alternar para modo individual)
            const bulkCaptionTextarea = cardLote.querySelector(".lote-caption-bulk-textarea");
            if (bulkCaptionTextarea) {
                bulkCaptionTextarea.addEventListener("input", () => {
                    const linhasLegendas = bulkCaptionTextarea.value.split("\n").map(l => l.trim()).filter(l => l.length > 0);
                    const inputsLegenda = cardLote.querySelectorAll(".lote-caption-indiv");
                    inputsLegenda.forEach((input, index) => {
                        input.value = linhasLegendas[index] || "";
                    });
                });
            }

            // Adicionar evento para o botão de remover o lote
            const botaoRemover = cardLote.querySelector(".btn-remove-lote");
            botaoRemover.addEventListener("click", () => {
                const indiceLote = parseInt(botaoRemover.dataset.loteIdx);
                const comeco = indiceLote * tamanhoLote;
                // Remover as imagens do lote correspondente da lista global
                imagensCarregadas.splice(comeco, loteImagens.length);
                renderizarLotesDeMidia();
            });

            lotesMidiaFeed.appendChild(cardLote);
        });

        atualizarVisibilidadeCarrossel();
    }

    function atualizarVisibilidadeCarrossel() {
        const cards = lotesMidiaFeed ? lotesMidiaFeed.querySelectorAll(".lote-media-card") : [];
        if (cards.length === 0) {
            if (mediaCarouselNav) mediaCarouselNav.classList.add("hidden");
            return;
        }

        if (mediaCarouselNav) mediaCarouselNav.classList.remove("hidden");

        // Garantir que carouselMediaIndex esteja dentro dos limites
        if (carouselMediaIndex >= cards.length) {
            carouselMediaIndex = Math.max(0, cards.length - 1);
        }

        // Mostrar apenas o card do lote ativo
        cards.forEach((card, i) => {
            if (i === carouselMediaIndex) {
                card.classList.remove("hidden");
                card.classList.add("fade-in");
            } else {
                card.classList.add("hidden");
                card.classList.remove("fade-in");
            }
        });

        // Atualizar o indicador numérico
        if (mediaCarouselIndicator) {
            mediaCarouselIndicator.textContent = `Lote ${carouselMediaIndex + 1} de ${cards.length}`;
        }
    }

    // Stepper de Tamanho de Lote
    const btnStepperMinus = document.getElementById("btn-stepper-minus");
    const btnStepperPlus = document.getElementById("btn-stepper-plus");

    if (btnStepperMinus && btnStepperPlus && inputTamanhoLote) {
        btnStepperMinus.addEventListener("click", () => {
            let valor = parseInt(inputTamanhoLote.value) || 3;
            if (valor > 1) {
                inputTamanhoLote.value = valor - 1;
                inputTamanhoLote.dispatchEvent(new Event("input"));
            }
        });

        btnStepperPlus.addEventListener("click", () => {
            let valor = parseInt(inputTamanhoLote.value) || 3;
            if (valor < 20) {
                inputTamanhoLote.value = valor + 1;
                inputTamanhoLote.dispatchEvent(new Event("input"));
            }
        });
    }

    if (botaoIndivCaptions) {
        botaoIndivCaptions.addEventListener("click", () => {
            if (imagensCarregadas.length === 0) {
                exibirNotificacao("Nenhum lote carregado para alterar!", "warning");
                return;
            }
            const btns = document.querySelectorAll('.lote-mode-btn[data-mode="indiv"]');
            btns.forEach(btn => btn.click());
            exibirNotificacao("Todas as legendas definidas como individuais!", "success");
            adicionarLogTerminal("Todos os lotes foram alterados para preenchimento de legenda/descrição individual.", "info");
        });
    }

    if (botaoBulkCaptions) {
        botaoBulkCaptions.addEventListener("click", () => {
            if (imagensCarregadas.length === 0) {
                exibirNotificacao("Nenhum lote carregado para alterar!", "warning");
                return;
            }
            const btns = document.querySelectorAll('.lote-mode-btn[data-mode="bulk"]');
            btns.forEach(btn => btn.click());
            exibirNotificacao("Todas as legendas definidas em massa!", "success");
            adicionarLogTerminal("Todos os lotes foram alterados para preenchimento de legenda em massa.", "info");
        });
    }

    if (botaoEqualCaptions) {
        botaoEqualCaptions.addEventListener("click", () => {
            if (imagensCarregadas.length === 0) {
                exibirNotificacao("Nenhum lote carregado para alterar!", "warning");
                return;
            }
            const btns = document.querySelectorAll('.lote-mode-btn[data-mode="equal"]');
            btns.forEach(btn => btn.click());
            exibirNotificacao("Todas as legendas definidas como iguais!", "success");
            adicionarLogTerminal("Todos os lotes foram alterados para preenchimento de legenda igual.", "info");
        });
    }

    if (botaoUploadMediaWp) {
        botaoUploadMediaWp.addEventListener("click", async () => {
            if (imagensCarregadas.length === 0) {
                exibirNotificacao("Nenhuma imagem selecionada para envio!", "warning");
                return;
            }

            const tamanhoLote = parseInt(inputTamanhoLote.value) || 3;
            let lotes = [];
            for (let i = 0; i < imagensCarregadas.length; i += tamanhoLote) {
                lotes.push(imagensCarregadas.slice(i, i + tamanhoLote));
            }

            // Desabilitar botões
            botaoUploadMediaWp.disabled = true;
            if (inputTamanhoLote) inputTamanhoLote.disabled = true;
            if (botaoIndivCaptions) botaoIndivCaptions.disabled = true;
            if (botaoBulkCaptions) botaoBulkCaptions.disabled = true;
            if (botaoEqualCaptions) botaoEqualCaptions.disabled = true;
            if (dragZoneMedia) dragZoneMedia.style.pointerEvents = "none";

            const spinner = botaoUploadMediaWp.querySelector(".spinner");
            const btnText = botaoUploadMediaWp.querySelector(".btn-text");
            spinner.classList.remove("hidden");
            btnText.classList.add("hidden");

            const totalImagens = imagensCarregadas.length;
            let imagensEnviadasComSucesso = 0;

            adicionarLogTerminal(`Iniciando upload de ${totalImagens} imagens em ${lotes.length} lotes para a biblioteca do WordPress...`, "info");
            exibirNotificacao("Enviando mídias ao WordPress...", "info");

            for (let l = 0; l < lotes.length; l++) {
                const loteImagens = lotes[l];
                const cardLote = lotesMidiaFeed.children[l];

                if (!cardLote) continue;

                // Obter metadados do card específico
                const titleAltVal = cardLote.querySelector(".lote-title-alt").value.trim();
                const activeModeBtn = cardLote.querySelector(".lote-mode-btn.active");
                const activeMode = activeModeBtn ? activeModeBtn.dataset.mode : "indiv";

                for (let imgIdx = 0; imgIdx < loteImagens.length; imgIdx++) {
                    const arquivo = loteImagens[imgIdx];
                    
                    let finalCaption = "";
                    if (activeMode === "equal") {
                        const globalInput = cardLote.querySelector(".lote-caption-global");
                        finalCaption = globalInput ? globalInput.value.trim() : "";
                    } else if (activeMode === "bulk") {
                        const bulkInput = cardLote.querySelector(".lote-caption-bulk-textarea");
                        const linhasLegendas = bulkInput ? bulkInput.value.split("\n").map(l => l.trim()).filter(l => l.length > 0) : [];
                        finalCaption = linhasLegendas[imgIdx] || "";
                    } else {
                        const inputsIndiv = cardLote.querySelectorAll(".lote-caption-indiv");
                        const matchingInput = Array.from(inputsIndiv).find(input => input.dataset.imgName === arquivo.name);
                        if (matchingInput) {
                            finalCaption = matchingInput.value.trim();
                        }
                    }
                    
                    adicionarLogTerminal(`[Lote ${l + 1}/${lotes.length}] Enviando imagem "${arquivo.name}" (${imgIdx + 1}/${loteImagens.length})...`, "warning");

                    let captionWithCredits = finalCaption;
                    const checkAiCredits = document.getElementById("media-ai-credits");
                    if (checkAiCredits && checkAiCredits.checked) {
                        const creditsText = ' - Imagem gerada por IA';
                        if (!captionWithCredits.includes(creditsText)) {
                            captionWithCredits = captionWithCredits ? `${captionWithCredits}${creditsText}` : 'Imagem gerada por IA';
                        }
                    }

                    const formData = new FormData();
                    formData.append("file", arquivo);
                    formData.append("title", titleAltVal || arquivo.name.split(".")[0]);
                    formData.append("alt_text", titleAltVal || arquivo.name.split(".")[0]);
                    formData.append("caption", captionWithCredits);
                    formData.append("description", captionWithCredits);

                    try {
                        const resposta = await fetch("/upload-media", {
                            method: "POST",
                            body: formData
                        });

                        const resultado = await resposta.json();
                        
                        if (resultado.success) {
                            imagensEnviadasComSucesso++;
                            adicionarLogTerminal(`✓ <strong>Sucesso:</strong> "${arquivo.name}" enviado. ID: ${resultado.media_id}. URL: <a href="${resultado.media_url}" target="_blank" style="color: var(--color-success); text-decoration: underline;">${resultado.media_url}</a>`, "success");
                        } else {
                            adicionarLogTerminal(`✗ <strong>Erro ao enviar "${arquivo.name}":</strong> ${resultado.message}`, "error");
                        }
                    } catch (err) {
                        adicionarLogTerminal(`✗ <strong>Erro de conexão ao enviar "${arquivo.name}":</strong> ${err.message}`, "error");
                    }
                }
            }

            // Habilitar botões
            botaoUploadMediaWp.disabled = false;
            if (inputTamanhoLote) inputTamanhoLote.disabled = false;
            if (botaoIndivCaptions) botaoIndivCaptions.disabled = false;
            if (botaoBulkCaptions) botaoBulkCaptions.disabled = false;
            if (botaoEqualCaptions) botaoEqualCaptions.disabled = false;
            if (dragZoneMedia) dragZoneMedia.style.pointerEvents = "auto";
            spinner.classList.add("hidden");
            btnText.classList.remove("hidden");

            // Exibir resumo
            adicionarLogTerminal(`<strong>Concluído!</strong> ${imagensEnviadasComSucesso} de ${totalImagens} imagens enviadas com sucesso para a biblioteca do WordPress.`, "success");
            exibirNotificacao(`${imagensEnviadasComSucesso}/${totalImagens} mídias enviadas!`, "success");

            // Limpar fila e re-renderizar em caso de sucesso total
            if (imagensEnviadasComSucesso === totalImagens) {
                imagensCarregadas = [];
                renderizarLotesDeMidia();
            }
        });
    }
});
