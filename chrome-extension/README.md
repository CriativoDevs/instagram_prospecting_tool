# DM Sender — Extensão de Browser

Extensão Chrome (Manifest V3) que lê a fila de DMs da app Timelyone e as envia pelo Instagram com delays humanizados, usando a sessão real do utilizador.

---

## Pré-requisitos

- Google Chrome (versão 102 ou superior)
- Sessão activa no Instagram aberta no Chrome
- App Timelyone acessível (produção: `https://instagram-prospecting-tool.vercel.app`)

---

## Instalação (modo developer — sem Chrome Web Store)

1. Abrir o Chrome e ir a `chrome://extensions`
2. Activar **"Developer mode"** (canto superior direito)
3. Clicar em **"Load unpacked"**
4. Seleccionar a pasta `chrome-extension/`
5. A extensão aparece na lista com o nome **"Instagram Prospecting DM Sender"**
6. Fixar o ícone na barra de ferramentas (ícone de puzzle → pin)

> A extensão não precisa de ser reinstalada após alterações ao código — basta clicar em ↻ (reload) na página `chrome://extensions`.

---

## Distribuir para outra pessoa (via ZIP)

1. Comprime a pasta `chrome-extension/` num ficheiro ZIP
2. Envia o ZIP (email, Google Drive, WhatsApp, etc.)
3. O destinatário descomprime e segue os passos de instalação acima

---

## Como usar

1. **Fazer login no Instagram** no Chrome (se ainda não estiver)
2. **Aceder à app** em `https://instagram-prospecting-tool.vercel.app`
3. **Pesquisar perfis** e gerar uma DM
4. **Clicar "Enviar DM"** no modal — a mensagem é adicionada à fila
5. A extensão detecta a entrada na fila e abre/usa uma aba do Instagram para enviar
6. O status do prospect actualiza automaticamente para **"Enviada"**

---

## Comportamento de segurança

| Parâmetro | Valor padrão |
|---|---|
| Delay entre envios | 45–90 segundos (aleatório) |
| Limite diário | 50 DMs |
| Conta de envios | Reinicia à meia-noite |

---

## Configuração de URL (apenas para desenvolvimento local)

Por padrão, a extensão aponta para a app em produção. Para apontar para o `localhost` durante desenvolvimento:

1. Ir a `chrome://extensions` → **DM Sender** → **"Service Worker"** → **"Inspect"**
2. Na consola do DevTools que abre, colar:
   ```javascript
   chrome.storage.local.set({ appUrl: "http://localhost:3000" })
   ```
3. Para reverter para produção:
   ```javascript
   chrome.storage.local.remove("appUrl")
   ```

---

## Arquitectura

```
manifest.json        ← permissões e registo de ficheiros (Manifest V3)
background.js        ← service worker: polling da fila, orquestração, delays
content_script.js    ← injectado no instagram.com, automatiza o DOM
popup.html / .js     ← badge de estado (enviadas hoje / limite)
```

**Fluxo de dados:**

```
App (DMGenerator)
  → POST /api/dm-queue { action:"add", username, message }
      ↓
  Redis (fila pendente)
      ↓
Extension (background.js) — polling cada 60s + dispara quando abre aba do Instagram
  → GET /api/dm-queue?action=next
      ↓
  Navega para instagram.com/{username}/
      ↓
  content_script.js — clica "Message", aguarda modal, escreve, envia
      ↓
  chrome.storage.local → completedDM (resultado persistido)
      ↓
  background.js lê completedDM no próximo ciclo
  → POST /api/dm-queue { action:"complete", username }
      ↓
  Redis: fila marcada "sent" + prospect status → "sent"
```

---

## Resolução de problemas

**A extensão não carrega**
- Verificar se o "Developer mode" está activo em `chrome://extensions`
- Confirmar que a pasta seleccionada contém o `manifest.json`
- Ver erros na linha "Errors" da extensão em `chrome://extensions`

**"Enviar DM" fica em erro na app**
- Confirmar que as variáveis `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` estão configuradas
- Verificar se a app em produção está acessível

**A extensão não envia após adicionar à fila**
- Confirmar que há uma aba do Chrome com o Instagram aberta e sessão activa
- Abrir `chrome://extensions` → DM Sender → "Service Worker" → "Inspect" para ver logs
- O background verifica a fila a cada 60 segundos; também dispara ao abrir uma aba do Instagram

**Erro no content script (DOM)**
- O Instagram actualiza o DOM com frequência — ver logs com o prefixo `[DM Sender]` na consola da aba do Instagram (F12)
- Se o modal de chat não abrir, confirmar que o botão "Message" está visível no perfil

**Status não actualiza para "Enviada"**
- O background pode ter estado dormente quando o envio terminou
- O resultado fica guardado e é processado no próximo ciclo (até 60 segundos depois)
- Verificar em `chrome://extensions` → Service Worker → Inspect se há erros de rede
