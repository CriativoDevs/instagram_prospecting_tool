"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, CheckCircle2, Clock, ExternalLink, MessageSquare, Trash2 } from "lucide-react";
import { storage } from "@/lib/storage";
import { ScoredProfile } from "@/types/instagram";
import { DMGenerator } from "@/components/DMGenerator";
import { cn } from "@/lib/utils";
import {
  MAX_FOLLOW_UP_DAYS,
  MIN_FOLLOW_UP_DAYS,
  followUpDate,
  pendingReminders,
  reminderState,
} from "@/lib/reminders";

const STATE_STYLE = {
  overdue:  { label: "Vencido",    color: "bg-red-500/10 border-red-500/30 text-red-400" },
  soon:     { label: "Hoje/amanhã", color: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400" },
  upcoming: { label: "Agendado",   color: "bg-slate-500/10 border-slate-500/30 text-slate-400" },
};

const SNOOZE_OPTIONS = [1, 3, 7];

export default function RemindersPage() {
  const [prospects, setProspects] = useState<ScoredProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [selected, setSelected] = useState<ScoredProfile | null>(null);

  const load = async () => {
    const [data, followUpDays] = await Promise.all([storage.getProspects(), storage.getFollowUpDays()]);
    setProspects(data);
    setDays(followUpDays);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const reminders = pendingReminders(prospects);

  const handleSaveDays = async (value: number) => {
    setDays(await storage.saveFollowUpDays(value));
  };

  const handleSnooze = async (username: string, snoozeDays: number) => {
    await storage.setFollowUp(username, followUpDate(snoozeDays));
    await load();
  };

  const handleRemove = async (username: string) => {
    await storage.setFollowUp(username, null);
    await load();
  };

  // "Feito" = follow-up enviado: reagenda o próximo lembrete pelo período padrão
  const handleDone = async (username: string) => {
    await storage.setFollowUp(username, followUpDate(days));
    await load();
  };

  return (
    <div className="flex flex-col gap-6 p-8 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Lembretes de follow-up</h1>
            <p className="text-sm text-slate-500">Perfis contactados que ainda não responderam.</p>
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-400">
          Lembrar após
          <input
            type="number"
            min={MIN_FOLLOW_UP_DAYS}
            max={MAX_FOLLOW_UP_DAYS}
            value={days}
            onChange={e => setDays(Number(e.target.value))}
            onBlur={e => handleSaveDays(Number(e.target.value))}
            className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white"
          />
          dias
        </label>
      </div>

      {loading ? (
        <p className="text-slate-500">A carregar…</p>
      ) : reminders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-800 rounded-3xl gap-2">
          <Bell size={32} className="text-slate-600" />
          <p className="text-slate-500">Sem lembretes pendentes.</p>
          <p className="text-slate-600 text-sm">Ao marcar uma DM como enviada, cria-se um lembrete automaticamente.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reminders.map(p => {
            const followUpAt = p.prospectStatus!.followUpAt!;
            const state = reminderState(followUpAt);
            const style = STATE_STYLE[state];
            return (
              <div key={p.username} className="bg-navy-light border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-white truncate">@{p.username}</p>
                    <p className="text-xs text-slate-500">
                      Enviada em {p.prospectStatus?.contactedAt ? new Date(p.prospectStatus.contactedAt).toLocaleDateString("pt-PT") : "—"}
                      {" · "}lembrar em {new Date(followUpAt).toLocaleDateString("pt-PT")}
                    </p>
                  </div>
                  <span className={cn("text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border shrink-0", style.color)}>
                    {style.label}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <a href={p.profileUrl} target="_blank" rel="noopener noreferrer"
                     className="flex items-center gap-1.5 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg">
                    <ExternalLink size={13} /> Instagram
                  </a>
                  <button onClick={() => setSelected(p)}
                          className="flex items-center gap-1.5 py-1.5 px-3 bg-accent/10 hover:bg-accent/20 text-accent text-xs font-bold rounded-lg">
                    <MessageSquare size={13} /> DM de follow-up
                  </button>
                  <button onClick={() => handleDone(p.username)}
                          className="flex items-center gap-1.5 py-1.5 px-3 border border-success/30 text-success text-xs font-bold rounded-lg hover:bg-success/10">
                    <CheckCircle2 size={13} /> Feito
                  </button>
                  {SNOOZE_OPTIONS.map(d => (
                    <button key={d} onClick={() => handleSnooze(p.username, d)}
                            className="flex items-center gap-1 py-1.5 px-2 border border-slate-700 text-slate-400 text-xs rounded-lg hover:text-white">
                      <Clock size={12} /> +{d}d
                    </button>
                  ))}
                  <button onClick={() => handleRemove(p.username)}
                          className="ml-auto flex items-center gap-1 py-1.5 px-2 text-slate-500 hover:text-red-400 text-xs">
                    <Trash2 size={13} /> Remover
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <DMGenerator profile={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
