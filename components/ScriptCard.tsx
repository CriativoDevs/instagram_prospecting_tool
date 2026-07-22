// components/ScriptCard.tsx
"use client";

import { useState } from "react";
import { Script } from "@/types/scripts";
import { Pencil, Trash2, Check, X } from "lucide-react";

interface ScriptCardProps {
  script: Script;
  onSave: (id: string, title: string, body: string) => Promise<boolean>;
  onDelete: (id: string) => void;
}

export function ScriptCard({ script, onSave, onDelete }: ScriptCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(script.title);
  const [body, setBody] = useState(script.body);

  const handleSave = async () => {
    if (!title.trim() || !body.trim()) return;
    const success = await onSave(script.id, title, body);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setTitle(script.title);
    setBody(script.body);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
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
          <button onClick={handleCancel} className="p-1.5 text-slate-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
          <button onClick={handleSave} className="p-1.5 text-success hover:text-success/80 transition-colors">
            <Check size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col gap-1">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-white">{script.title}</h4>
        <div className="flex gap-1 shrink-0">
          <button onClick={() => setIsEditing(true)} className="p-1 text-slate-400 hover:text-white transition-colors">
            <Pencil size={14} />
          </button>
          <button onClick={() => onDelete(script.id)} className="p-1 text-slate-400 hover:text-red-400 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <p className="text-xs text-slate-500 line-clamp-2">{script.body}</p>
    </div>
  );
}
