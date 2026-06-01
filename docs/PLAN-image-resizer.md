# PLAN: WordPress Media Uploader Enhancements (Corrigido)

## Overview
Este plano descreve a implementação de melhorias no envio de imagens em lote para o WordPress. Adicionaremos redimensionamento automático de imagens para 1280x720 com corte centralizado (crop/cover) para imagens com proporções diferentes, sanitização de nomes de arquivos para remover carimbos de data/hora e caracteres especiais, e resolução de conflitos de nomes usando regras personalizadas de nomenclatura.

## Project Type
WEB (JavaScript Frontend Utility Integration)

## Success Criteria
- [x] As imagens enviadas para o WordPress são redimensionadas para exatamente 1280x720 com corte (crop) centralizado para evitar distorção.
- [x] Carimbos de data/hora como `_202606010048` ou sufixos parenteses como `(1)` são removidos do nome do arquivo.
- [x] O primeiro arquivo do lote mantém underscores no nome (ex: `adubo_caseiro.jpg`).
- [x] A primeira cópia (segunda ocorrência) muda underscores para hífens (ex: `adubo-caseiro.jpg`).
- [x] O terceiro arquivo em diante recebe hífens e sufixo sequencial iniciando em 1 (ex: `adubo-caseiro-1.jpg`, `adubo-caseiro-2.jpg`).
- [x] O painel exibe visualmente os nomes das imagens atualizados nos cards do lote.

## Tech Stack
- Frontend: JavaScript (HTML5 Canvas API, File & Blob API)

## File Structure
Modificações concentradas no frontend:
- [estatico/js/principal.js](file:///c:/Users/luppi/OneDrive/Documentos/dev/Hisoka-push-V2/estatico/js/principal.js)

---

## Proposed Changes

### Component: Frontend Media Upload Process

#### [MODIFY] [principal.js](file:///c:/Users/luppi/OneDrive/Documentos/dev/Hisoka-push-V2/estatico/js/principal.js)
Implementar as seguintes funções auxiliares e atualizar a captura de arquivos:
1. `obterBaseNomeLimpo(nomeCompleto)`: Extrai a extensão e limpa a base do nome do arquivo, removendo sufixos parenteses e carimbos de data/hora, mantendo os underscores originais e retornando a string em minúsculo (ex: `adubo_caseiro`).
2. `redimensionarImagemComCorte(file, targetWidth, targetHeight)`: Carrega o arquivo e o desenha centralizado num canvas de 1280x720 utilizando preenchimento de corte (cover), salvando o resultado como um novo objeto `File`.
3. Atualizar `tratarArquivosSelecionados(arquivos)` para:
   - Exibir um indicador visual de carregamento.
   - Iterar sobre os arquivos e computar seus nomes sanitizados com base nas regras de colisão:
     - 1ª vez: `nome_original` (com `_`)
     - 2ª vez: `nome-original` (sem `_`)
     - 3ª vez em diante: `nome-original-1`, `nome-original-2`, etc.
   - Aplicar `redimensionarImagemComCorte` em cada imagem.
   - Adicionar os novos arquivos gerados em `imagensCarregadas` e renderizar os cards.

---

## Verification Plan

### Automated/Local Checks
- Executar linter e verificações básicas de integridade:
  ```bash
  python .agent/scripts/checklist.py .
  ```

### Manual Verification
1. Selecionar quatro imagens com nomes de teste como:
   - `Adubo_caseiro_202606010048.jpg`
   - `Adubo_caseiro_202606010048(1).jpg`
   - `Adubo_caseiro_202606010048(2).jpg`
   - `Adubo_caseiro_202606010048(3).jpg`
2. Verificar se o painel exibe os seguintes nomes:
   - `adubo_caseiro.jpg`
   - `adubo-caseiro.jpg`
   - `adubo-caseiro-1.jpg`
   - `adubo-caseiro-2.jpg`
3. Enviar as imagens para o WordPress e validar na biblioteca de mídia se a dimensão de todas foi fixada em 1280x720 com corte proporcional.

## ✅ PHASE X COMPLETE
- Lint: ✅ Pass (Unified checks passed)
- Security: ✅ No critical issues (Security scan passed)
- Build: ✅ Success (All 6 core checks passed)
- Date: 2026-06-01

