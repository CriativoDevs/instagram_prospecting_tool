"use client";

import { useCallback, useEffect, useState } from "react";
import { Zap, RefreshCw } from "lucide-react";
import type { ApifyUsage } from "@/app/api/apify-usage/route";

export function ApifyCredits() {
  const [usage, setUsage] = useState<ApifyUsage | null>(null);
  const [error, setError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    setError(false);
    try {
      const r = await fetch("/api/apify-usage", { cache: "no-store" });
      if (!r.ok) throw new Error();
      setUsage(await r.json());
    } catch {
      setError(true);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (error || (!refreshing && !usage)) return null;

  const pct = usage && usage.total > 0 ? (usage.used / usage.total) * 100 : 0;
  const remaining = usage ? usage.total - usage.used : 0;
  const color =
    pct >= 90 ? "bg-red-500" :
    pct >= 70 ? "bg-yellow-500" :
    "bg-success";

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs">
      <Zap size={14} className="text-accent shrink-0" />
      <div className="flex flex-col gap-1 min-w-[140px]">
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-400">Créditos Apify</span>
          <span className="text-slate-300 font-medium">
            {usage ? `$${usage.used.toFixed(2)} / $${usage.total.toFixed(2)}` : "…"}
          </span>
        </div>
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${color}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
      </div>
      <span className={`font-semibold shrink-0 ${remaining <= 0 ? "text-red-400" : "text-slate-400"}`}>
        ${remaining.toFixed(2)} restante
      </span>
      <button
        onClick={load}
        disabled={refreshing}
        title="Atualizar créditos"
        className="ml-1 text-slate-600 hover:text-slate-300 transition-colors disabled:opacity-40"
      >
        <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
      </button>
    </div>
  );
}
