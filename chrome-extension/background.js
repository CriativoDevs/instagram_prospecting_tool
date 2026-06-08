// Service worker — gere a fila de DMs e orquestra o content script
//
// ARQUITECTURA DE COMUNICAÇÃO:
// background → content script via sendMessage é frágil em MV3 (service worker dorme).
// Solução: background grava pendingDM em chrome.storage.local e navega o tab.
// O content script lê o storage ao arrancar e processa autonomamente.
// content script → background ainda usa sendMessage (sempre funciona neste sentido).

const DEFAULT_APP_URL = "https://instagram-prospecting-tool.vercel.app";
const POLL_ALARM = "dm-queue-poll";
const DAILY_LIMIT = 50;
const MIN_DELAY_S = 45;
const MAX_DELAY_S = 90;

// URL da app — usa a de produção por padrão; pode ser sobreposta em dev com:
// chrome.storage.local.set({ appUrl: "http://localhost:3000" })
async function getAppUrl() {
  const { appUrl } = await chrome.storage.local.get("appUrl");
  return appUrl || DEFAULT_APP_URL;
}

let isSending = false;

// ─── Arranque ────────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(POLL_ALARM, { periodInMinutes: 1 });
  resetDailyCountIfNeeded();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === POLL_ALARM) processQueue();
});

// Disparar quando uma aba do Instagram termina de carregar
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    tab.url?.startsWith("https://www.instagram.com")
  ) {
    processQueue();
  }
});

// Mensagens do content script
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === "DM_SENT") {
    handleDmSent(msg.username, msg.success, msg.error).then(sendResponse);
    return true;
  }
  if (msg.type === "GET_STATUS") {
    getStatus().then(sendResponse);
    return true;
  }
});

// ─── Lógica principal ─────────────────────────────────────────────────────────

async function processQueue() {
  // Processar resultado pendente do content script (pode ter chegado enquanto o worker estava dormente)
  const { completedDM } = await chrome.storage.local.get("completedDM");
  if (completedDM) {
    await chrome.storage.local.remove("completedDM");
    await handleDmSent(completedDM.username, completedDM.success, completedDM.error);
    return; // handleDmSent já agenda o próximo processQueue com delay
  }

  if (isSending) return;

  await resetDailyCountIfNeeded();
  const { sentToday = 0 } = await chrome.storage.local.get("sentToday");
  if (sentToday >= DAILY_LIMIT) {
    console.log("[DM Sender] Limite diário atingido:", sentToday);
    return;
  }

  // Buscar próximo item pendente
  let next;
  try {
    const appUrl = await getAppUrl();
    const res = await fetch(`${appUrl}/api/dm-queue?action=next`, { credentials: "omit" });
    if (!res.ok) return;
    next = await res.json();
  } catch {
    return;
  }

  if (!next?.username) return;

  isSending = true;

  // Gravar estado em session storage — o content script lê ao arrancar
  await chrome.storage.local.set({
    pendingDM: {
      id: next.id,
      username: next.username,
      message: next.message,
      ts: Date.now(),
    },
  });

  // Encontrar tab do Instagram ou criar uma nova
  const tabs = await chrome.tabs.query({ url: "https://www.instagram.com/*" });

  // Navegar directamente para o perfil — evita o fluxo de pesquisa em /direct/new/
  const profileUrl = `https://www.instagram.com/${next.username}/`;
  if (tabs.length > 0) {
    chrome.tabs.update(tabs[0].id, { url: profileUrl });
  } else {
    chrome.tabs.create({ url: profileUrl, active: false });
  }
  // isSending fica true até o content script enviar DM_SENT
}

async function handleDmSent(username, success, error) {
  // isSending fica true até terminar o fetch — evita re-processar o mesmo item
  // se tabs.onUpdated disparar entretanto (ex: resposta automática do Instagram)

  if (success) {
    const { sentToday = 0 } = await chrome.storage.local.get("sentToday");
    await chrome.storage.local.set({ sentToday: sentToday + 1 });

    try {
      const appUrl = await getAppUrl();
      await fetch(`${appUrl}/api/dm-queue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete", username }),
        credentials: "omit",
      });
    } catch { /* app temporariamente inacessível */ }

    isSending = false;
    const delayMs = randomBetween(MIN_DELAY_S, MAX_DELAY_S) * 1000;
    console.log(`[DM Sender] Enviado para @${username}. Próximo em ${delayMs / 1000}s`);
    setTimeout(() => processQueue(), delayMs);
  } else {
    console.error(`[DM Sender] Falha ao enviar para @${username}:`, error);
    try {
      const appUrl = await getAppUrl();
      await fetch(`${appUrl}/api/dm-queue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "fail", username, error }),
        credentials: "omit",
      });
    } catch { /* silencioso */ }
    isSending = false;
  }
}

async function getStatus() {
  const { sentToday = 0, lastReset } = await chrome.storage.local.get(["sentToday", "lastReset"]);
  return { sentToday, dailyLimit: DAILY_LIMIT, lastReset, isSending };
}

// ─── Utilitários ──────────────────────────────────────────────────────────────

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function resetDailyCountIfNeeded() {
  const { lastReset } = await chrome.storage.local.get("lastReset");
  const today = new Date().toDateString();
  if (lastReset !== today) {
    await chrome.storage.local.set({ sentToday: 0, lastReset: today });
  }
}
