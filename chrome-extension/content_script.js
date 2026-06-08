// Content script — injectado no instagram.com
// Recebe comandos do background.js e automatiza o envio de DMs via DOM.
//
// ARQUITECTURA DE NAVEGAÇÃO:
// window.location.href causa reload — o handler de mensagem morre.
// Solução: gravar o DM pendente em chrome.storage.local antes de navegar.
// Quando o content script carrega numa nova página, verifica o storage e retoma.

// ─── Utilitários ──────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function randomDelay(minMs = 300, maxMs = 800) {
  return sleep(minMs + Math.random() * (maxMs - minMs));
}

// Aguarda elemento visível no DOM (com MutationObserver)
function waitForElement(selectorOrFn, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const find = typeof selectorOrFn === "function"
      ? selectorOrFn
      : () => document.querySelector(selectorOrFn);

    const el = find();
    if (el) return resolve(el);

    const timer = setTimeout(() => {
      observer.disconnect();
      const desc = typeof selectorOrFn === "string" ? selectorOrFn : "custom predicate";
      reject(new Error(`Timeout (${timeout}ms): elemento não encontrado — ${desc}`));
    }, timeout);

    const observer = new MutationObserver(() => {
      const found = find();
      if (found) {
        clearTimeout(timer);
        observer.disconnect();
        resolve(found);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  });
}

// Digitar em <input> controlado pelo React
// React mantém um setter nativo sobrescrito — é necessário invocar o original
// para que o state do React seja actualizado.
function setReactInputValue(input, value) {
  const nativeSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value"
  )?.set;
  if (nativeSetter) {
    nativeSetter.call(input, value);
  } else {
    input.value = value;
  }
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

// Digitar num contenteditable React caracter a caracter (parecer humano)
async function typeIntoContentEditable(el, text) {
  el.focus();
  await randomDelay(100, 200);

  // Limpar conteúdo existente
  document.execCommand("selectAll", false, null);
  document.execCommand("delete", false, null);

  for (const char of text) {
    document.execCommand("insertText", false, char);
    await sleep(25 + Math.random() * 60);
  }
}

// ─── Fluxo de envio de DM ─────────────────────────────────────────────────────

// Selector para a caixa de texto de DM
// Instagram usa o editor Lexical — o atributo data-lexical-editor é o mais estável
function findMessageBox() {
  return (
    document.querySelector('div[data-lexical-editor="true"]') ||
    document.querySelector('div[aria-label="Message"][contenteditable="true"]') ||
    document.querySelector('div[aria-label="Mensagem"][contenteditable="true"]') ||
    document.querySelector('div[contenteditable="true"][role="textbox"]')
  );
}

async function sendMessage(msgBox, message, username, queueId) {
  await randomDelay(400, 700);
  log("Caixa de mensagem encontrada, a escrever...");
  await typeIntoContentEditable(msgBox, message);
  await randomDelay(800, 1200);

  // Aguardar o botão Send aparecer (só aparece após digitar no Lexical)
  const sendBtn = await waitForElement(
    () => document.querySelector('div[aria-label="Send"][role="button"]'),
    5000
  ).catch(() => null);

  if (sendBtn) {
    log("A clicar no botão Send...");
    sendBtn.click();
  } else {
    // Fallback: Enter
    log("Botão Send não encontrado, a tentar Enter...");
    msgBox.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Enter", code: "Enter", keyCode: 13, which: 13,
        bubbles: true, cancelable: true,
      })
    );
  }

  await sleep(2000);

  // Confirmar envio: caixa deve estar vazia e botão Send desaparece
  const remaining = msgBox.textContent?.trim();
  if (remaining && remaining.length > 0) {
    throw new Error(`Mensagem pode não ter sido enviada (caixa ainda tem: "${remaining}")`);
  }

  log(`DM enviada com sucesso para @${username}`);
  await clearPending();
  // Gravar resultado em storage — mais fiável que sendMessage (service worker pode estar dormente)
  await chrome.storage.local.set({ completedDM: { username, queueId, success: true, ts: Date.now() } });
  chrome.runtime.sendMessage({ type: "DM_SENT", username, queueId, success: true }).catch(() => {});
}

async function executeSendFlow(username, message, queueId) {
  log(`A iniciar envio para @${username}`);
  const currentUrl = window.location.href;

  try {
    // ── Caso A: conversa específica já aberta (/direct/t/) ───────────────────
    if (currentUrl.includes("/direct/t/")) {
      log("Na página de conversa, a aguardar caixa de mensagem...");
      await sleep(2000);
      const msgBox = await waitForElement(findMessageBox, 15000);
      await sendMessage(msgBox, message, username, queueId);
      return;
    }

    // ── Caso B: estamos no perfil — clicar em "Message" ──────────────────────
    // O Instagram abre um modal de chat no canto inferior direito da mesma página
    if (currentUrl.includes(`/${username}`)) {
      await sleep(2000);
      log("A procurar botão de mensagem no perfil...");

      const msgBtn = await waitForElement(() => {
        const labels = ["message", "mensagem", "enviar mensagem", "send message"];
        const btns = [
          ...document.querySelectorAll('div[role="button"]'),
          ...document.querySelectorAll("button"),
        ];
        return btns.find((b) =>
          labels.includes(b.textContent?.trim().toLowerCase())
        ) ?? null;
      }, 15000);

      if (!msgBtn) throw new Error(`Botão "Message" não encontrado no perfil de @${username}`);

      msgBtn.click();
      log("Botão de mensagem clicado, a aguardar modal de chat...");

      // Modal abre na mesma página — aguardar com timeout generoso
      const msgBox = await waitForElement(findMessageBox, 15000);
      await sendMessage(msgBox, message, username, queueId);
      return;
    }

    // ── Caso C: noutra página — navegar para o perfil ────────────────────────
    log(`A navegar para o perfil: instagram.com/${username}/`);
    window.location.href = `https://www.instagram.com/${username}/`;

  } catch (err) {
    logError(`Erro ao enviar para @${username}: ${err.message}`);
    await clearPending();
    await chrome.storage.local.set({ completedDM: { username, queueId, success: false, error: err.message, ts: Date.now() } });
    chrome.runtime.sendMessage({
      type: "DM_SENT", username, queueId, success: false, error: err.message,
    }).catch(() => {});
  }
}

// ─── Persistência de estado entre navegações ─────────────────────────────────

async function savePending(username, message, queueId) {
  await chrome.storage.local.set({
    pendingDM: { username, message, queueId, ts: Date.now() },
  });
}

async function clearPending() {
  await chrome.storage.local.remove("pendingDM");
}

// Ao carregar a página, verificar se há um DM pendente para retomar
async function resumeIfPending() {
  const { pendingDM } = await chrome.storage.local.get("pendingDM");
  if (!pendingDM) return;

  // Expirar entradas com mais de 5 minutos (evitar loops)
  if (Date.now() - pendingDM.ts > 5 * 60 * 1000) {
    await clearPending();
    return;
  }

  // Só retomar em páginas relevantes: /direct/ ou o perfil do utilizador pendente
  const onDirect = window.location.href.includes("/direct/");
  const onProfile = window.location.href.includes(`/${pendingDM.username}`);
  if (!onDirect && !onProfile) return;

  log(`A retomar envio pendente para @${pendingDM.username}`);
  await sleep(2000); // aguardar React hidratar a página
  await executeSendFlow(pendingDM.username, pendingDM.message, pendingDM.queueId);
}

// ─── Listener de mensagens vindas do background ───────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type !== "SEND_DM") return;

  const { username, message, queueId } = msg;

  (async () => {
    // Guardar estado antes de navegar (o reload vai destruir este contexto)
    await savePending(username, message, queueId);

    // Se já estamos na página de DM, executar directamente sem reload
    if (window.location.href.includes("/direct/")) {
      await executeSendFlow(username, message, queueId);
    } else {
      // Navegar para nova mensagem — o resumeIfPending() vai continuar quando carregar
      window.location.href = "https://www.instagram.com/direct/new/";
    }

    sendResponse({ ok: true });
  })();

  return true; // resposta assíncrona
});

// ─── Logging ──────────────────────────────────────────────────────────────────

function log(...args) {
  console.log("[DM Sender]", ...args);
}

function logError(...args) {
  console.error("[DM Sender]", ...args);
}

// ─── Init ─────────────────────────────────────────────────────────────────────

log("Content script iniciado em", window.location.href);
resumeIfPending();
