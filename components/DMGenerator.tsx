"use client";

import { ScoredProfile } from "@/types/instagram";
import { generateDM } from "@/lib/dm-templates";
import { X, Copy, Check, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface DMGeneratorProps {
  profile: ScoredProfile | null;
  onClose: () => void;
}

export function DMGenerator({ profile, onClose }: DMGeneratorProps) {
  const [copied, setCopied] = useState(false);
  const [dmText, setDmText] = useState("");

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

  if (!profile) return null;

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
          <div className="relative group">
            <textarea
              value={dmText}
              onChange={(e) => setDmText(e.target.value)}
              className="w-full h-64 bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 leading-relaxed focus:outline-none focus:border-accent transition-colors resize-none"
            />
            <div className="absolute bottom-4 right-4 flex gap-2">
              <button
                onClick={handleCopy}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all",
                  copied 
                    ? "bg-success text-white" 
                    : "bg-accent text-white hover:bg-accent/90 shadow-lg shadow-accent/20"
                )}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Copiado!" : "Copiar Mensagem"}
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4">
            <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
              <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Próximos Passos</p>
              <ol className="text-xs text-slate-400 space-y-2 list-decimal list-inside">
                <li>Copie o texto acima.</li>
                <li>Clique em "Abrir Instagram" no card do perfil.</li>
                <li>Cole a mensagem na DM do perfil.</li>
                <li>Marque como "Enviada" para manter o histórico.</li>
              </ol>
            </div>
            
            <p className="text-[10px] text-center text-slate-600 italic">
              "Esta ferramenta não envia mensagens automaticamente."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
