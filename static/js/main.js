/* ==========================================================================
   WORDPRESS ARTICLE PUBLISHER - INTERACTIVE LOGIC
   Strict adherence: NO banned colors (Purple Ban active).
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    // Referências dos Elementos - Formulário de Entrada
    const form = document.getElementById("article-form");
    const titleInput = document.getElementById("title");
    const slugInput = document.getElementById("slug");
    const contentInput = document.getElementById("content");
    const categoriesInput = document.getElementById("categories");
    const categoriesManualInput = document.getElementById("categories_manual");
    const categoriesSkeleton = document.getElementById("categories-skeleton");
    const tagsInput = document.getElementById("tags");
    const focusKeywordInput = document.getElementById("focus_keyword");
    const metaDescInput = document.getElementById("meta_description");
    const scheduleInput = document.getElementById("schedule_datetime");
    const postStatusInput = document.getElementById("post_status");
    const scheduleGroup = document.getElementById("schedule-group");
    
    // Novos elementos do Planejador em Lote e Abas
    const tabButtons = document.querySelectorAll(".tab-btn");
    const bulkTitles = document.getElementById("bulk-titles");
    const bulkTimes = document.getElementById("bulk-times");
    const bulkBaseDate = document.getElementById("bulk-base-date");
    const bulkTitlesCounter = document.getElementById("bulk-titles-counter");
    const bulkTimesCounter = document.getElementById("bulk-times-counter");
    const consistencyBadge = document.getElementById("consistency-badge");
    const bulkPreviewList = document.getElementById("bulk-preview-list");
    const btnBulkLoadWizard = document.getElementById("btn-bulk-load-wizard");
    
    // Elementos da Wizard Bar
    const wizardBar = document.getElementById("wizard-bar");
    const wizardStatusText = document.getElementById("wizard-status-text");
    const btnWizardPrev = document.getElementById("btn-wizard-prev");
    const btnWizardNext = document.getElementById("btn-wizard-next");
    const btnWizardCancel = document.getElementById("btn-wizard-cancel");
    
    // Contadores e Progresso de SEO
    const metaCounter = document.getElementById("meta-counter");
    const metaProgress = document.getElementById("meta-progress");
    
    // Botões e Ações
    const btnExportJson = document.getElementById("btn-export-json");
    const btnPublishWp = document.getElementById("btn-publish-wp");
    const btnClearConsole = document.getElementById("btn-clear-console");
    const consoleOutput = document.getElementById("console-output");

    // Elementos do Acordeão
    const accordionItems = document.querySelectorAll(".accordion-item");

    // ==========================================================================
    // 1. SISTEMA DE TOAST NOTIFICATIONS (VISUAL FEEDBACK PREMIUM)
    // ==========================================================================
    function showToast(message, type = "info", duration = 4500) {
        const container = document.getElementById("toast-container");
        if (!container) return;

        const card = document.createElement("div");
        card.className = `toast-card ${type}`;

        // Ícones SVG inline para cada tipo de notificação
        let svgIcon = "";
        if (type === "success") {
            svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
        } else if (type === "error") {
            svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
        } else if (type === "warning") {
            svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
        } else {
            svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
        }

        card.innerHTML = `
            <span class="toast-icon">${svgIcon}</span>
            <span class="toast-content">${message}</span>
        `;

        container.appendChild(card);

        // Dispara animação de saída um pouco antes de expirar
        setTimeout(() => {
            card.classList.add("slide-out");
            card.addEventListener("animationend", () => {
                card.remove();
            });
        }, duration);
    }
    
    // Auxiliar: Formatação de Data e Hora para o Log
    function getTimestamp() {
        const now = new Date();
        return now.toTimeString().split(" ")[0];
    }
    
    // Função para logar no Console interativo
    function logToConsole(message, type = "system") {
        const line = document.createElement("div");
        line.className = `console-line ${type}`;
        
        const timeSpan = document.createElement("span");
        timeSpan.className = "time";
        timeSpan.textContent = `[${getTimestamp()}]`;
        
        line.appendChild(timeSpan);
        
        // Se a mensagem contiver elementos HTML ou links estruturados
        if (message.includes("<a") || message.includes("<strong")) {
            const tempSpan = document.createElement("span");
            tempSpan.innerHTML = message;
            line.appendChild(tempSpan);
        } else {
            const textNode = document.createTextNode(message);
            line.appendChild(textNode);
        }
        
        consoleOutput.appendChild(line);
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }

    // ==========================================================================
    // 2. CONTROLE DO ACCORDION (INTERATIVIDADE E FLUIDEZ DE FORMULÁRIO)
    // ==========================================================================
    accordionItems.forEach(item => {
        const header = item.querySelector(".accordion-header");
        if (header) {
            header.addEventListener("click", () => {
                const isActive = item.classList.contains("active");
                
                // Fecha todos os itens
                accordionItems.forEach(acc => acc.classList.remove("active"));
                
                // Abre apenas se não estava ativo
                if (!isActive) {
                    item.classList.add("active");
                }
            });
        }
    });

    // Função auxiliar para expandir um acordeão específico
    function expandAccordion(accordionId) {
        accordionItems.forEach(acc => {
            if (acc.id === accordionId) {
                acc.classList.add("active");
            } else {
                acc.classList.remove("active");
            }
        });
    }

    // Auto-avanço de foco para o próximo acordeão ao preencher campos chave
    if (titleInput) {
        titleInput.addEventListener("blur", () => {
            if (titleInput.value.trim() !== "" && categoriesInput.value !== "") {
                // Se preenchidos os dados do passo 1, pisca e vai pro passo 2 (conteúdo HTML)
                setTimeout(() => {
                    if (document.getElementById("accordion-meta").classList.contains("active")) {
                        expandAccordion("accordion-editor");
                        if (contentInput) contentInput.focus();
                    }
                }, 400);
            }
        });
    }
    
    // ==========================================================================
    // 3. ENGINE DE LIVE HTML PREVIEW EM TEMPO REAL (DEBOUNCED)
    // ==========================================================================
    let previewDebounceTimeout = null;
    const previewEmpty = document.getElementById("live-preview-empty");
    const previewContent = document.getElementById("live-preview-content");
    const tabBtnPreview = document.getElementById("tab-btn-preview");

    function renderLivePreview() {
        if (!previewContent || !previewEmpty) return;
        const html = contentInput.value.trim();

        if (html === "") {
            previewEmpty.classList.remove("hidden");
            previewContent.classList.add("hidden");
        } else {
            previewEmpty.classList.add("hidden");
            previewContent.classList.remove("hidden");
            // Atribuição de HTML sanitizada e segura
            previewContent.innerHTML = html;
        }
    }

    if (contentInput) {
        contentInput.addEventListener("input", () => {
            if (previewDebounceTimeout) clearTimeout(previewDebounceTimeout);
            previewDebounceTimeout = setTimeout(renderLivePreview, 300);
        });
    }

    // ==========================================================================
    // 4. GERADOR AUTOMÁTICO DE SLUG A PARTIR DO TÍTULO
    // ==========================================================================
    titleInput.addEventListener("input", () => {
        if (!slugInput.dataset.manualEdited) {
            const slugified = titleInput.value
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "") // remove acentos
                .replace(/[^a-z0-9\s-]/g, "")    // remove caracteres especiais
                .trim()
                .replace(/\s+/g, "-")            // substitui espaços por -
                .replace(/-+/g, "-");            // remove traços duplicados
            slugInput.value = slugified;
        }
    });
    
    slugInput.addEventListener("change", () => {
        if (slugInput.value.trim() !== "") {
            slugInput.dataset.manualEdited = "true";
        } else {
            delete slugInput.dataset.manualEdited;
        }
    });
    
    // ==========================================================================
    // 5. CONTADOR DINÂMICO YOAST SEO
    // ==========================================================================
    metaDescInput.addEventListener("input", () => {
        const len = metaDescInput.value.length;
        metaCounter.textContent = `${len} / 160`;
        
        const percentage = Math.min((len / 160) * 100, 100);
        metaProgress.style.width = `${percentage}%`;
        
        if (len === 0) {
            metaProgress.style.backgroundColor = "var(--text-muted)";
            metaCounter.style.color = "var(--text-muted)";
        } else if (len < 120) {
            metaProgress.style.backgroundColor = "var(--color-warning)";
            metaCounter.style.color = "var(--color-warning)";
        } else if (len <= 160) {
            metaProgress.style.backgroundColor = "var(--color-success)";
            metaCounter.style.color = "var(--color-success)";
        } else {
            metaProgress.style.backgroundColor = "var(--color-danger)";
            metaCounter.style.color = "var(--color-danger)";
        }
    });
    
    // Limpar console
    btnClearConsole.addEventListener("click", () => {
        consoleOutput.innerHTML = "";
        logToConsole("Console limpo. Pronto para novas operações.");
        showToast("Console de execução limpo", "info");
    });
    
    // Função comum para extrair e validar dados do formulário
    function getFormData() {
        const title = titleInput.value.trim();
        const content = contentInput.value.trim();
        
        if (!title || !content) {
            logToConsole("Erro: Os campos Título e Conteúdo HTML são obrigatórios!", "error");
            showToast("Campos obrigatórios ausentes!", "error");
            
            // Foca na seção errada
            if (!title) {
                expandAccordion("accordion-meta");
                titleInput.focus();
            } else if (!content) {
                expandAccordion("accordion-editor");
                contentInput.focus();
            }
            return null;
        }
        
        let categoryName = "";
        if (categoriesInput && !categoriesInput.classList.contains("hidden")) {
            categoryName = categoriesInput.value.trim();
        } else if (categoriesManualInput) {
            categoryName = categoriesManualInput.value.trim();
        }

        const categories = [];
        if (categoryName) {
            categories.push(categoryName);
        }

        const tags = tagsInput.value
            .split(",")
            .map(t => t.trim())
            .filter(t => t.length > 0);
            
        const postStatus = postStatusInput ? postStatusInput.value : "publish_schedule";
            
        return {
            title: title,
            slug: slugInput.value.trim(),
            content: content,
            categories: categories,
            tags: tags,
            focus_keyword: focusKeywordInput.value.trim(),
            meta_description: metaDescInput.value.trim(),
            schedule_datetime: scheduleInput.value,
            post_status: postStatus
        };
    }
    
    // ==========================================================================
    // 6. EXPORTAR JSON E IMPORTAR JSON
    // ==========================================================================
    btnExportJson.addEventListener("click", () => {
        const data = getFormData();
        if (!data) return;
        
        logToConsole("Iniciando exportação para formato JSON local...", "info");
        
        try {
            const jsonString = JSON.stringify(data, null, 4);
            const blob = new Blob([jsonString], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const filename = (data.slug || "artigo-exportado") + ".json";
            
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            logToConsole(`Sucesso: Artigo salvo localmente como '${filename}'`, "success");
            showToast("JSON exportado com sucesso!", "success");
        } catch (e) {
            logToConsole(`Erro crítico ao gerar JSON: ${e.message}`, "error");
            showToast("Erro ao exportar JSON.", "error");
        }
    });
    
    // ==========================================================================
    // 7. ENVIAR / AGENDAR NO WORDPRESS
    // ==========================================================================
    btnPublishWp.addEventListener("click", async () => {
        const data = getFormData();
        if (!data) return;
        
        btnPublishWp.disabled = true;
        btnExportJson.disabled = true;
        
        const spinner = btnPublishWp.querySelector(".spinner");
        const btnText = btnPublishWp.querySelector(".btn-text");
        
        spinner.classList.remove("hidden");
        btnText.classList.add("hidden");
        
        logToConsole("Conectando ao servidor local do integrador...", "info");
        showToast("Iniciando postagem no WordPress...", "info");
        
        if (data.schedule_datetime) {
            logToConsole(`Agendamento solicitado para: ${data.schedule_datetime}`, "warning");
        } else {
            logToConsole("Postagem solicitada para publicação imediata...", "warning");
        }
        
        try {
            const response = await fetch("/publish", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (result.success) {
                logToConsole(`<strong>Sucesso:</strong> ${result.message}`, "success");
                logToConsole(`Status do Post no WP: <strong>${result.status}</strong>`, "success");
                logToConsole(`ID do Post Cadastrado: ${result.post_id}`, "info");
                showToast(`Artigo cadastrado! ID: ${result.post_id}`, "success");
                
                if (result.link) {
                    logToConsole(`Visualizar post no WordPress: <a href="${result.link}" target="_blank" class="console-link">${result.link}</a>`, "success");
                }
                
                // Se o assistente de fila visual (wizard) estiver ativo
                if (typeof wizardQueue !== "undefined" && wizardQueue.length > 0) {
                    contentInput.value = "";
                    focusKeywordInput.value = "";
                    metaDescInput.value = "";
                    tagsInput.value = "";
                    
                    // Reseta preview e progresso
                    renderLivePreview();
                    metaDescInput.dispatchEvent(new Event("input"));
                    
                    const nextIndex = wizardIndex + 1;
                    if (nextIndex < wizardQueue.length) {
                        logToConsole(`✓ Artigo ${wizardIndex + 1} de ${wizardQueue.length} publicado. Carregando próximo artigo em 1.5 segundos...`, "success");
                        setTimeout(() => {
                            loadWizardArticle(nextIndex);
                        }, 1500);
                    } else {
                        logToConsole("🎉 Parabéns! Todos os artigos da fila em lote foram publicados com sucesso!", "success");
                        showToast("Fila em lote concluída com sucesso!", "success");
                        cancelWizardQueue();
                    }
                }
            } else {
                logToConsole(`<strong>Erro na Integração:</strong> ${result.message}`, "error");
                showToast("Falha ao integrar no WordPress.", "error");
            }
        } catch (error) {
            logToConsole(`Erro crítico de comunicação com o backend: ${error.message}`, "error");
            logToConsole("Certifique-se de que o servidor Flask (python app.py) está sendo executado.", "error");
            showToast("Erro crítico de conexão física.", "error");
        } finally {
            btnPublishWp.disabled = false;
            btnExportJson.disabled = false;
            spinner.classList.add("hidden");
            btnText.classList.remove("hidden");
        }
    });

    // Botão de atalho para formatação de código
    document.getElementById("format-html-btn").addEventListener("click", () => {
        logToConsole("Aviso: O editor de código bruto está ativo. Cole o código gerado em HTML completo.", "info");
        showToast("HTML Mode ativo", "info");
    });

    // ==========================================================================
    // 8. CONFIGURAÇÕES DAS CREDENCIAIS DO WP (MODAL)
    // ==========================================================================
    const settingsModal = document.getElementById("settings-modal");
    const btnOpenSettings = document.getElementById("btn-open-settings");
    const btnCloseSettingsHeader = document.getElementById("btn-close-settings-header");
    
    const settingsWpUrl = document.getElementById("settings-wp-url");
    const settingsWpUser = document.getElementById("settings-wp-user");
    const settingsWpPassword = document.getElementById("settings-wp-password");
    
    const btnTestSettings = document.getElementById("btn-test-settings");
    const btnSaveSettings = document.getElementById("btn-save-settings");
    const settingsStatusMsg = document.getElementById("settings-status-msg");
    const connectionStatusContainer = document.querySelector(".connection-status");

    // Abre o Modal
    btnOpenSettings.addEventListener("click", async () => {
        settingsStatusMsg.textContent = "";
        settingsStatusMsg.className = "modal-status-msg";
        settingsModal.classList.remove("hidden");
        
        try {
            const response = await fetch("/settings");
            if (response.ok) {
                const config = await response.json();
                settingsWpUrl.value = config.wp_url || "";
                settingsWpUser.value = config.wp_user || "";
                settingsWpPassword.value = config.wp_app_password || "";
            }
        } catch (err) {
            logToConsole(`Erro ao carregar configurações salvas: ${err.message}`, "error");
            showToast("Erro ao carregar credenciais.", "error");
        }
    });

    // Fecha o Modal
    function closeSettingsModal() {
        settingsModal.classList.add("hidden");
    }
    
    if (btnCloseSettingsHeader) btnCloseSettingsHeader.addEventListener("click", closeSettingsModal);
    
    settingsModal.addEventListener("click", (e) => {
        if (e.target === settingsModal) {
            closeSettingsModal();
        }
    });

    function setModalStatus(message, type) {
        settingsStatusMsg.textContent = message;
        settingsStatusMsg.className = `modal-status-msg ${type}`;
    }

    // Ação: Testar Conexão
    btnTestSettings.addEventListener("click", async () => {
        const wp_url = settingsWpUrl.value.trim();
        const wp_user = settingsWpUser.value.trim();
        const wp_app_password = settingsWpPassword.value.trim();

        if (!wp_url || !wp_user || !wp_app_password) {
            setModalStatus("Por favor, preencha todos os campos obrigatórios.", "error");
            showToast("Credenciais incompletas!", "warning");
            return;
        }

        btnTestSettings.disabled = true;
        const spinner = btnTestSettings.querySelector(".spinner");
        const btnText = btnTestSettings.querySelector(".btn-text");
        spinner.classList.remove("hidden");
        btnText.classList.add("hidden");
        setModalStatus("Testando conexão...", "info");

        logToConsole(`Testando autenticação de API com o servidor WP: ${wp_url}`, "info");

        try {
            const response = await fetch("/test-connection", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ wp_url, wp_user, wp_app_password })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setModalStatus(result.message, "success");
                logToConsole(`<strong>Conexão Testada:</strong> ${result.message}`, "success");
                showToast("Conexão com WordPress bem-sucedida!", "success");
            } else {
                setModalStatus(result.message, "error");
                logToConsole(`<strong>Falha no Teste:</strong> ${result.message}`, "error");
                showToast("Falha na autenticação do WP.", "error");
            }
        } catch (err) {
            setModalStatus("Erro ao conectar ao backend.", "error");
            logToConsole(`Erro crítico de rede no teste de credenciais: ${err.message}`, "error");
            showToast("Erro crítico de rede no teste.", "error");
        } finally {
            btnTestSettings.disabled = false;
            spinner.classList.add("hidden");
            btnText.classList.remove("hidden");
        }
    });

    // Ação: Salvar Credenciais
    btnSaveSettings.addEventListener("click", async () => {
        const wp_url = settingsWpUrl.value.trim();
        const wp_user = settingsWpUser.value.trim();
        const wp_app_password = settingsWpPassword.value.trim();

        if (!wp_url || !wp_user || !wp_app_password) {
            setModalStatus("Por favor, preencha todos os campos obrigatórios.", "error");
            return;
        }

        btnSaveSettings.disabled = true;
        setModalStatus("Gravando configurações...", "info");

        try {
            const response = await fetch("/settings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ wp_url, wp_user, wp_app_password })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                logToConsole(`<strong>Configurações Gravadas:</strong> ${result.message}`, "success");
                showToast("Credenciais salvas localmente!", "success");
                
                // Atualiza o painel de status badge
                connectionStatusContainer.innerHTML = `
                    <span class="status-badge connected">
                        <span class="pulse-dot"></span>
                        <svg xmlns="http://www.w3.org/2000/svg" class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                            <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                        WordPress Conectado: <strong class="wp-url-text">${wp_url}</strong>
                    </span>
                    <button class="settings-btn" id="btn-open-settings" title="Configurar Credenciais do WordPress">
                        <svg xmlns="http://www.w3.org/2000/svg" class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                        </svg>
                    </button>
                `;
                
                document.getElementById("btn-open-settings").addEventListener("click", () => {
                    btnOpenSettings.click();
                });
                
                closeSettingsModal();
                loadWpCategories();
            } else {
                setModalStatus(result.message, "error");
                logToConsole(`Erro ao salvar credenciais: ${result.message}`, "error");
            }
        } catch (err) {
            setModalStatus("Erro ao se comunicar com o backend.", "error");
            logToConsole(`Erro crítico ao tentar salvar credenciais: ${err.message}`, "error");
        } finally {
            btnSaveSettings.disabled = false;
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
        const file = e.target.files[0];
        if (!file) return;

        logToConsole(`Iniciando leitura do arquivo selecionado: '${file.name}'...`, "info");
        showToast("Lendo arquivo JSON...", "info");

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target.result);

                if (!parsed.title || !parsed.content) {
                    logToConsole("Falha na importação: O arquivo JSON deve conter ao menos os campos 'title' (Título) e 'content' (Conteúdo HTML).", "error");
                    showToast("JSON inválido: Campos obrigatórios ausentes.", "error");
                    return;
                }

                // Preencher inputs
                titleInput.value = parsed.title || "";
                slugInput.value = parsed.slug || "";
                contentInput.value = parsed.content || "";
                focusKeywordInput.value = parsed.focus_keyword || "";
                metaDescInput.value = parsed.meta_description || "";
                
                let importedCat = "";
                if (Array.isArray(parsed.categories) && parsed.categories.length > 0) {
                    importedCat = parsed.categories[0];
                } else if (typeof parsed.categories === "string") {
                    importedCat = parsed.categories;
                }
                
                if (importedCat) {
                    if (categoriesInput && !categoriesInput.classList.contains("hidden")) {
                        let optionExists = Array.from(categoriesInput.options).some(opt => opt.value === importedCat);
                        if (!optionExists) {
                            const dynamicOpt = document.createElement("option");
                            dynamicOpt.value = importedCat;
                            dynamicOpt.textContent = `${importedCat} (Importada)`;
                            categoriesInput.appendChild(dynamicOpt);
                            logToConsole(`Categoria '${importedCat}' não listada localmente; adicionada e selecionada dinamicamente.`, "info");
                        }
                        categoriesInput.value = importedCat;
                    } else if (categoriesManualInput) {
                        categoriesManualInput.value = importedCat;
                    }
                } else {
                    if (categoriesInput) categoriesInput.value = "";
                    if (categoriesManualInput) categoriesManualInput.value = "";
                }

                if (Array.isArray(parsed.tags)) {
                    tagsInput.value = parsed.tags.join(", ");
                } else {
                    tagsInput.value = parsed.tags || "";
                }

                if (parsed.schedule_datetime) {
                    scheduleInput.value = parsed.schedule_datetime;
                } else {
                    scheduleInput.value = "";
                }
                
                if (parsed.post_status && postStatusInput) {
                    postStatusInput.value = parsed.post_status;
                    postStatusInput.dispatchEvent(new Event("change"));
                } else if (postStatusInput) {
                    postStatusInput.value = "publish_schedule";
                    postStatusInput.dispatchEvent(new Event("change"));
                }

                // Força atualizações e renders
                metaDescInput.dispatchEvent(new Event("input"));
                titleInput.dispatchEvent(new Event("input"));
                renderLivePreview();

                // Expande o acordeão de conteúdo para facilitar visualização
                expandAccordion("accordion-meta");

                logToConsole(`<strong>Sucesso:</strong> Artigo '${parsed.title}' importado com sucesso do arquivo JSON!`, "success");
                showToast("Artigo importado com sucesso!", "success");
            } catch (err) {
                logToConsole(`Erro crítico ao analisar o arquivo JSON: ${err.message}`, "error");
                showToast("Falha ao analisar JSON.", "error");
            } finally {
                inputImportJson.value = "";
            }
        };

        reader.onerror = () => {
            logToConsole("Erro físico de leitura do arquivo no navegador.", "error");
            showToast("Erro na leitura física do JSON.", "error");
            inputImportJson.value = "";
        };

        reader.readAsText(file);
    });

    // ==========================================================================
    // 10. CARGA DINÂMICA DE CATEGORIAS DO WORDPRESS (COM SKELETON LOADER)
    // ==========================================================================
    async function loadWpCategories() {
        if (!categoriesInput) return;
        
        const previousSelection = categoriesInput.value;
        
        // Ativa o Skeleton Loader visual premium!
        categoriesInput.classList.add("hidden");
        if (categoriesManualInput) categoriesManualInput.classList.add("hidden");
        if (categoriesSkeleton) categoriesSkeleton.classList.remove("hidden");
        categoriesInput.disabled = true;
        
        try {
            const response = await fetch("/wp-categories");
            if (!response.ok) throw new Error("Falha HTTP");
            
            const categories = await response.json();
            
            if (Array.isArray(categories) && categories.length > 0) {
                categoriesInput.innerHTML = '<option value="">Selecione uma categoria...</option>';
                categories.forEach(cat => {
                    const opt = document.createElement("option");
                    opt.value = cat.name;
                    opt.textContent = cat.name;
                    categoriesInput.appendChild(opt);
                });
                
                categoriesInput.classList.remove("hidden");
                categoriesInput.disabled = false;
                
                if (previousSelection && Array.from(categoriesInput.options).some(o => o.value === previousSelection)) {
                    categoriesInput.value = previousSelection;
                }
                
                logToConsole(`${categories.length} categorias carregadas do WordPress com sucesso.`, "system");
            } else {
                throw new Error("Nenhuma categoria retornada ou site desconectado");
            }
        } catch (err) {
            logToConsole("Aviso: Não foi possível carregar as categorias dinâmicas do WordPress. Ativando digitação manual.", "warning");
            
            categoriesInput.classList.add("hidden");
            if (categoriesManualInput) {
                categoriesManualInput.classList.remove("hidden");
                if (previousSelection) categoriesManualInput.value = previousSelection;
            }
            
            logToConsole("Fallback ativado: modo de digitação manual de categoria liberado.", "system");
        } finally {
            // Desativa o Skeleton Loader
            if (categoriesSkeleton) categoriesSkeleton.classList.add("hidden");
        }
    }

    if (postStatusInput && scheduleInput && scheduleGroup) {
        postStatusInput.addEventListener("change", () => {
            if (postStatusInput.value === "draft") {
                logToConsole("Status 'Rascunho' selecionado: o artigo será salvo como rascunho com a data/hora de agendamento pré-configurada no WordPress.", "info");
                showToast("Modo Rascunho selecionado", "info");
            }
        });
    }

    // ==========================================================================
    // 11. SISTEMA DE ABAS GERAIS (E PANEL DIREITO PREVIEW/CONSOLE)
    // ==========================================================================
    tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const parentNav = btn.parentElement;
            const siblings = parentNav.querySelectorAll(".tab-btn");
            siblings.forEach(s => s.classList.remove("active"));
            btn.classList.add("active");

            const targetId = btn.dataset.tab;
            if (targetId) {
                if (parentNav.classList.contains("right-tabs")) {
                    document.getElementById("right-console-content").classList.add("hidden");
                    document.getElementById("right-preview-content").classList.add("hidden");
                    document.getElementById(`${targetId}-content`).classList.remove("hidden");
                } else {
                    document.getElementById("single-mode-content").classList.add("hidden");
                    document.getElementById("bulk-mode-content").classList.add("hidden");
                    document.getElementById(`${targetId}-content`).classList.remove("hidden");
                }
            }
        });
    });

    if (bulkBaseDate) {
        const todayStr = new Date().toISOString().split("T")[0];
        bulkBaseDate.value = todayStr;
    }

    // ==========================================================================
    // 12. LOGICA DO PLANEJADOR EM LOTE (BULK WIZARD / QUEUE)
    // ==========================================================================
    let parsedTitles = [];
    let parsedTimes = [];

    function formatFriendlyDate(dateStr) {
        if (!dateStr) return "";
        const parts = dateStr.split("-");
        if (parts.length === 3) {
            return `${parts[2]}/${parts[1]}/${parts[0].substring(2)}`;
        }
        return dateStr;
    }

    function renderBulkPreview() {
        if (!bulkPreviewList) return;
        bulkPreviewList.innerHTML = "";
        
        if (parsedTitles.length === 0) {
            bulkPreviewList.innerHTML = '<div class="preview-empty-msg">Nenhum título mapeado ainda. Insira títulos e horários acima.</div>';
            return;
        }
        
        const baseDateVal = bulkBaseDate ? bulkBaseDate.value : new Date().toISOString().split("T")[0];
        const limit = Math.max(parsedTitles.length, parsedTimes.length);
        
        for (let i = 0; i < limit; i++) {
            const title = parsedTitles[i] || `<span style="color: var(--color-danger); font-style: italic;">[Faltando título para o horário ${i+1}]</span>`;
            const time = parsedTimes[i] || '<span style="color: var(--color-danger); font-style: italic;">[HH:MM]</span>';
            
            const item = document.createElement("div");
            item.className = "bulk-preview-item";
            
            const titleSpan = document.createElement("span");
            titleSpan.className = "preview-title";
            titleSpan.innerHTML = title;
            
            const dateSpan = document.createElement("span");
            dateSpan.className = "preview-date";
            dateSpan.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="svg-icon align-middle mr-1" style="height: 0.95rem; width: 0.95rem;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${formatFriendlyDate(baseDateVal)} às ${time}`;
            
            item.appendChild(titleSpan);
            item.appendChild(dateSpan);
            bulkPreviewList.appendChild(item);
        }
    }

    function parseBulkInputs() {
        if (!bulkTitles || !bulkTimes) return;
        
        const rawTitles = bulkTitles.value.split("\n").map(t => t.trim()).filter(t => t.length > 0);
        const rawTimes = bulkTimes.value.split("\n").map(t => t.trim()).filter(t => t.length > 0);
        
        parsedTitles = rawTitles;
        parsedTimes = rawTimes;
        
        if (bulkTitlesCounter) bulkTitlesCounter.textContent = `${rawTitles.length} títulos`;
        if (bulkTimesCounter) bulkTimesCounter.textContent = `${rawTimes.length} horários`;
        
        const isConsistent = rawTitles.length === rawTimes.length && rawTitles.length > 0;
        
        if (consistencyBadge) {
            if (rawTitles.length === 0 && rawTimes.length === 0) {
                consistencyBadge.className = "consistency-status-panel";
                consistencyBadge.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                    Cole títulos e horários para validar.
                `;
                if (btnBulkLoadWizard) btnBulkLoadWizard.disabled = true;
            } else if (isConsistent) {
                consistencyBadge.className = "consistency-status-panel consistent";
                consistencyBadge.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    Consistência verificada! Quantidades equivalentes.
                `;
                if (btnBulkLoadWizard) btnBulkLoadWizard.disabled = false;
            } else {
                consistencyBadge.className = "consistency-status-panel inconsistent";
                consistencyBadge.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    Divergência detectada: ${rawTitles.length} títulos vs ${rawTimes.length} horários.
                `;
                if (btnBulkLoadWizard) btnBulkLoadWizard.disabled = true;
            }
        }
        
        renderBulkPreview();
    }

    if (bulkTitles) bulkTitles.addEventListener("input", parseBulkInputs);
    if (bulkTimes) bulkTimes.addEventListener("input", parseBulkInputs);
    if (bulkBaseDate) bulkBaseDate.addEventListener("change", parseBulkInputs);

    // ==========================================================================
    // 13. WIZARD INTERATIVO (FILA ASSISTIDA) CONTROLLER
    // ==========================================================================
    window.wizardQueue = [];
    window.wizardIndex = 0;

    window.loadWizardArticle = function(index) {
        if (!window.wizardQueue || index < 0 || index >= window.wizardQueue.length) return;
        
        window.wizardIndex = index;
        const article = window.wizardQueue[index];
        
        if (titleInput) titleInput.value = article.title;
        if (scheduleInput) scheduleInput.value = article.datetime;
        
        if (titleInput) titleInput.dispatchEvent(new Event("input"));
        if (metaDescInput) metaDescInput.dispatchEvent(new Event("input"));
        
        // Expande o acordeão do formulário para meta e foca no editor de conteúdo
        expandAccordion("accordion-editor");
        if (contentInput) contentInput.focus();
        
        if (wizardStatusText) {
            wizardStatusText.textContent = `Artigo ${index + 1} de ${window.wizardQueue.length}: "${article.title}"`;
        }
        
        if (btnWizardPrev) btnWizardPrev.disabled = index === 0;
        if (btnWizardNext) btnWizardNext.disabled = index === window.wizardQueue.length - 1;
        
        logToConsole(`Fila Ativa: Artigo ${index + 1}/${window.wizardQueue.length} carregado no formulário.`, "info");
    };

    window.cancelWizardQueue = function() {
        window.wizardQueue = [];
        window.wizardIndex = 0;
        if (wizardBar) wizardBar.classList.add("hidden");
        logToConsole("Fila de publicação assistida cancelada e limpa.", "system");
        showToast("Fila do assistente cancelada", "warning");
    };

    if (btnBulkLoadWizard) {
        btnBulkLoadWizard.addEventListener("click", () => {
            const todayStr = new Date().toISOString().split("T")[0];
            const baseDateVal = (bulkBaseDate && bulkBaseDate.value) ? bulkBaseDate.value : todayStr;
            window.wizardQueue = parsedTitles.map((title, index) => {
                const time = parsedTimes[index];
                return {
                    title: title,
                    datetime: `${baseDateVal}T${time}`
                };
            });
            
            window.wizardIndex = 0;
            if (window.wizardQueue.length === 0) return;
            
            logToConsole(`Carregando fila de ${window.wizardQueue.length} artigos no assistente visual!`, "info");
            showToast("Fila de artigos carregada!", "success");
            
            // Alterna para Aba 1 (Artigo Individual)
            const tabSingleBtn = document.querySelector('[data-tab="single-mode"]');
            if (tabSingleBtn) tabSingleBtn.click();
            
            // Exibe a barra do assistente
            if (wizardBar) wizardBar.classList.remove("hidden");
            
            // Carrega o primeiro item
            window.loadWizardArticle(0);
        });
    }

    if (btnWizardPrev) {
        btnWizardPrev.addEventListener("click", () => {
            window.loadWizardArticle(window.wizardIndex - 1);
        });
    }

    if (btnWizardNext) {
        btnWizardNext.addEventListener("click", () => {
            window.loadWizardArticle(window.wizardIndex + 1);
        });
    }

    if (btnWizardCancel) {
        btnWizardCancel.addEventListener("click", window.cancelWizardQueue);
    }

    // Inicialização automática das categorias ao carregar a página
    loadWpCategories();
});
