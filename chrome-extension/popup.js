chrome.runtime.sendMessage({ type: "GET_STATUS" }, (status) => {
  if (!status) return;

  document.getElementById("sentToday").textContent = status.sentToday;
  document.getElementById("dailyLimit").textContent = status.dailyLimit;

  const el = document.getElementById("statusMsg");
  if (status.isSending) {
    el.textContent = "A enviar mensagem…";
    el.className = "status sending";
  } else if (status.sentToday >= status.dailyLimit) {
    el.textContent = "Limite diário atingido";
    el.className = "status sending";
  } else {
    el.textContent = "Pronta para enviar";
    el.className = "status";
  }
});
