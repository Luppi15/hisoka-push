/**
 * Hisoka Push V2 - Controle do Termo de Compromisso e Responsabilidade
 * Gerencia a obrigatoriedade de aceite do termo pelo usuário.
 */

document.addEventListener("DOMContentLoaded", function () {
    const KEY_ACCEPTED = "wp-pub-terms-accepted";
    
    const modal = document.getElementById("terms-modal");
    const checkbox = document.getElementById("terms-checkbox");
    const btnAccept = document.getElementById("btn-accept-terms");
    const btnDownload = document.getElementById("btn-download-terms-pdf");
    const contentBox = document.getElementById("terms-content-box");

    if (!modal) {
        console.warn("Elemento #terms-modal não encontrado na página.");
        return;
    }

    // Verificar se o usuário já aceitou os termos anteriormente
    const accepted = localStorage.getItem(KEY_ACCEPTED);

    if (!accepted) {
        // Exibir modal e desabilitar scroll da página principal
        modal.classList.remove("hidden");
        document.body.style.overflow = "hidden";
    } else {
        // Garantir que o modal permaneça fechado
        modal.classList.add("hidden");
    }

    // Habilitar botão apenas se o checkbox estiver marcado
    if (checkbox && btnAccept) {
        checkbox.addEventListener("change", function () {
            btnAccept.disabled = !checkbox.checked;
        });

        // Fechar modal ao aceitar
        btnAccept.addEventListener("click", function () {
            if (checkbox.checked) {
                // Registrar data e hora do aceite para maior validade jurídica
                const timestampAccept = new Date().toISOString();
                localStorage.setItem(KEY_ACCEPTED, timestampAccept);
                
                // Ocultar modal com efeito suave e reabilitar scroll
                modal.classList.add("hidden");
                document.body.style.overflow = "";

                // Notificar através de Toast se disponível (Hisoka native function)
                if (typeof showToast === "function") {
                    showToast("Termos de compromisso aceitos com sucesso! O painel está liberado.", "success");
                } else {
                    console.log("Termo aceito. Painel desbloqueado.");
                }
            }
        });
    }

    // Lógica para download do PDF
    if (btnDownload) {
        btnDownload.addEventListener("click", function () {
            // Abre a rota Flask em uma nova aba para baixar o PDF do termo de responsabilidade
            window.open("/baixar-termo", "_blank");
            
            if (typeof showToast === "function") {
                showToast("Iniciando download do Termo de Compromisso...", "info");
            }
        });
    }

    // Opcional premium: Forçar o usuário a rolar até o final da caixa de termos
    // para habilitar o checkbox de aceite (incentiva a leitura).
    if (contentBox && checkbox) {
        checkbox.disabled = true; // Começa desativado
        
        // Verifica se a caixa de texto não possui barra de rolagem (caso seja muito grande a tela)
        if (contentBox.scrollHeight <= contentBox.clientHeight) {
            checkbox.disabled = false;
        } else {
            contentBox.addEventListener("scroll", function () {
                // Se o usuário rolou até 95% do final, libera o checkbox
                const threshold = contentBox.scrollHeight - contentBox.clientHeight - 20;
                if (contentBox.scrollTop >= threshold) {
                    checkbox.disabled = false;
                }
            });
        }
    }
});
