"use client";

import { ScoredProfile } from "@/types/instagram";
import { generateDM } from "@/lib/dm-templates";
import { X, Copy, Check, MessageSquare, Send, AlertCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface DMGeneratorProps {
  profile: ScoredProfile | null;
  onClose: () => void;
}

type SendState = "idle" | "sending" | "queued" | "error";

export function DMGenerator({ profile, onClose }: DMGeneratorProps) {
  const [copied, setCopied] = useState(false);
  const [dmText, setDmText] = useState("");
  const [sendState, setSendState] = useState<SendState>("idle");
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setDmText(generateDM(profile));
    }
  }, [profile]);

  const handleCopy = () => {
    navigator.clipboard.writeText(dmText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendDM = async () => {
    if (!profile || sendState === "sending") return;

    setSendState("sending");
    setSendError(null);

    try {
      const res = await fetch("/api/dm-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          username: profile.username,
          message: dmText,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erro ao adicionar à fila");
      }

      // Marcar prospect como enviado — upsert: cria se ainda não existia no Redis
      await fetch(`/api/prospects/${encodeURIComponent(profile.username)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "sent", profile }),
      }).catch(() => {});

      setSendState("queued");
      setTimeout(() => setSendState("idle"), 3000);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Erro desconhecido");
      setSendState("error");
      setTimeout(() => setSendState("idle"), 4000);
    }
  };

  if (!profile) return null;

  const withExtension = sendState !== "idle" || true; // sempre mostra o botão

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-navy-light border border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/20 text-accent rounded-full flex items-center justify-center">
              <MessageSquare size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">DM Personalizada</h2>
              <p className="text-xs text-slate-400">Gerada para @{profile.username}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <textarea
            value={dmText}
            onChange={(e) => setDmText(e.target.value)}
            className="w-full h-56 bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 leading-relaxed focus:outline-none focus:border-accent transition-colors resize-none"
          />

          {/* Acções */}
          <div className="mt-3 flex gap-2">
            {/* Copiar */}
            <button
              onClick={handleCopy}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all",
                copied
                  ? "bg-success text-white"
                  : "bg-slate-700 text-slate-200 hover:bg-slate-600"
              )}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copiado!" : "Copiar"}
            </button>

            {/* Enviar DM via extensão */}
            <button
              onClick={handleSendDM}
              disabled={sendState === "sending" || sendState === "queued"}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all flex-1 justify-center",
                sendState === "queued" && "bg-success text-white",
                sendState === "error" && "bg-red-600/80 text-white",
                sendState === "sending" && "bg-accent/60 text-white cursor-not-allowed",
                sendState === "idle" && "bg-accent text-white hover:bg-accent/90 shadow-lg shadow-accent/20"
              )}
            >
              {sendState === "idle" && <><Send size={16} />Enviar DM</>}
              {sendState === "sending" && <><Loader2 size={16} className="animate-spin" />A adicionar…</>}
              {sendState === "queued" && <><Check size={16} />Na fila!</>}
              {sendState === "error" && <><AlertCircle size={16} />{sendError ?? "Erro"}</>}
            </button>
          </div>

          {/* Instruções */}
          <div className="mt-4 bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">
              Como enviar
            </p>
            <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside">
              <li>Reveja e edite a mensagem se necessário.</li>
              <li>
                Clique em{" "}
                <span className="text-accent font-semibold">Enviar DM</span>{" "}
                — a extensão de browser processa o envio automaticamente.
              </li>
              <li>O status do perfil actualiza para "Enviada" após confirmação.</li>
            </ol>
            <p className="mt-3 text-[10px] text-slate-600 italic">
              Sem a extensão instalada, copie a mensagem e envie manualmente pelo Instagram.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
