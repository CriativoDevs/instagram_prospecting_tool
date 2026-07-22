"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Upload, FileDown } from "lucide-react";
import { ScriptColumn } from "@/components/ScriptColumn";
import { SCRIPT_STAGES, parseScriptsCsv, scriptsToCsv } from "@/lib/scripts";
import { Script, ScriptStage } from "@/types/scripts";

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/scripts")
      .then((res) => res.json())
      .then(setScripts)
      .catch(() => setScripts([]));
  }, []);

  const handleCreate = async (stage: ScriptStage, title: string, body: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage, title, body }),
      });
      if (!res.ok) {
        setSaveError("Erro ao criar script.");
        return false;
      }
      const created: Script = await res.json();
      setScripts((prev) => [...prev, created]);
      setSaveError(null);
      return true;
    } catch {
      setSaveError("Erro ao criar script.");
      return false;
    }
  };

  const handleSave = async (id: string, title: string, body: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/scripts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
      });
      if (!res.ok) {
        setSaveError("Erro ao guardar script.");
        return false;
      }
      const updated: Script = await res.json();
      setScripts((prev) => prev.map((s) => (s.id === id ? updated : s)));
      setSaveError(null);
      return true;
    } catch {
      setSaveError("Erro ao guardar script.");
      return false;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/scripts/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setSaveError("Erro ao remover script.");
        return;
      }
      setScripts((prev) => prev.filter((s) => s.id !== id));
      setSaveError(null);
    } catch {
      setSaveError("Erro ao remover script.");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const { valid, skipped } = parseScriptsCsv(text);

    try {
      if (valid.length > 0) {
        const res = await fetch("/api/scripts/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: valid }),
        });
        if (!res.ok) {
          setSaveError("Erro ao importar scripts.");
          e.target.value = "";
          return;
        }
        const refreshed = await fetch("/api/scripts").then((r) => r.json());
        setScripts(refreshed);
      }

      setSaveError(null);
      setImportMessage(`${valid.length} scripts importados, ${skipped} linha(s) inválida(s) ignorada(s).`);
    } catch {
      setSaveError("Erro ao importar scripts.");
    }

    e.target.value = "";
  };

  const handleExport = () => {
    const csv = scriptsToCsv(scripts);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scripts.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6 p-8 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Scripts</h1>
            <p className="text-sm text-slate-500">Mensagens pré-geradas por estágio de prospecção.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/scripts-modelo.csv"
            download
            className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-300 hover:text-white transition-colors"
          >
            <FileDown size={16} /> Modelo CSV
          </a>
          <label className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-300 hover:text-white transition-colors cursor-pointer">
            <Upload size={16} /> Importar CSV
            <input type="file" accept=".csv" onChange={handleImport} className="hidden" />
          </label>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-300 hover:text-white transition-colors"
          >
            <Download size={16} /> Exportar CSV
          </button>
        </div>
      </div>

      {importMessage && (
        <div className="bg-accent/5 border border-accent/20 p-3 rounded-xl text-accent text-sm">
          {importMessage}
        </div>
      )}

      {saveError && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm">
          {saveError}
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-2">
        {SCRIPT_STAGES.map(({ id, label }) => (
          <ScriptColumn
            key={id}
            stage={id}
            label={label}
            scripts={scripts.filter((s) => s.stage === id)}
            onCreate={handleCreate}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
