"use client";

import { useState } from "react";
import { Script, ScriptStage } from "@/types/scripts";
import { ScriptCard } from "@/components/ScriptCard";
import { Plus, Check, X } from "lucide-react";

interface ScriptColumnProps {
  stage: ScriptStage;
  label: string;
  scripts: Script[];
  onCreate: (stage: ScriptStage, title: string, body: string) => Promise<boolean>;
  onSave: (id: string, title: string, body: string) => Promise<boolean>;
  onDelete: (id: string) => void;
}

export function ScriptColumn({
  stage,
  label,
  scripts,
  onCreate,
  onSave,
  onDelete,
}: ScriptColumnProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const handleAdd = async () => {
    if (!title.trim() || !body.trim()) return;
    const success = await onCreate(stage, title, body);
    if (success) {
      setTitle("");
      setBody("");
      setIsAdding(false);
    }
  };

  const handleCancelAdd = () => {
    setTitle("");
    setBody("");
    setIsAdding(false);
  };

  return (
    <div className="flex flex-col gap-2 bg-navy-light border border-slate-800 rounded-xl p-3 min-w-[260px] w-[260px] shrink-0">
      <h3 className="text-xs uppercase tracking-widest font-bold text-slate-400">{label}</h3>

      {scripts.map((script) => (
        <ScriptCard key={script.id} script={script} onSave={onSave} onDelete={onDelete} />
      ))}

      {isAdding ? (
        <div className="bg-slate-900 border border-accent rounded-lg p-3 flex flex-col gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título"
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-accent"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Texto — usa {{nome}} e {{segmento}}"
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200 h-24 resize-none focus:outline-none focus:border-accent"
          />
          <div className="flex gap-2 justify-end">
            <button onClick={handleCancelAdd} className="p-1.5 text-slate-400 hover:text-white transition-colors">
              <X size={16} />
            </button>
            <button onClick={handleAdd} className="p-1.5 text-success hover:text-success/80 transition-colors">
              <Check size={16} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center justify-center gap-2 p-2 text-sm text-slate-400 hover:text-white border border-dashed border-slate-700 rounded-lg transition-colors"
        >
          <Plus size={14} /> Adicionar
        </button>
      )}
    </div>
  );
}
