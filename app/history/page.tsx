"use client";

import { useState, useEffect } from "react";
import { storage } from "@/lib/storage";
import { ScoredProfile } from "@/types/instagram";
import { ArrowLeft, ExternalLink, Download, MessageSquare, TrendingUp, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  pending:   { label: "Pendente",   color: "bg-slate-500/10 border-slate-500/30 text-slate-400" },
  sent:      { label: "Enviada",    color: "bg-blue-500/10 border-blue-500/30 text-blue-400" },
  replied:   { label: "Respondeu",  color: "bg-yellow-500/10 border-yellow-500/30 text-yellow-400" },
  converted: { label: "Converteu",  color: "bg-green-500/10 border-green-500/30 text-green-400" },
  ignored:   { label: "Ignorada",   color: "bg-red-500/10 border-red-500/30 text-red-400" },
};

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-PT");
}

const EMPTY_STATS = { totalFound: 0, contacted: 0, replied: 0, converted: 0, responseRate: 0 };

export default function HistoryPage() {
  const [prospects, setProspects] = useState<ScoredProfile[]>([]);
  const [stats, setStats] = useState(EMPTY_STATS);

  useEffect(() => {
    setProspects(storage.getProspects());
    setStats(storage.getStats());
  }, []);

  const refresh = () => setProspects(storage.getProspects());

  const handleUpdateStatus = (username: string, status: 'replied' | 'converted') => {
    storage.updateStatus(username, status);
    refresh();
  };

  const handleDelete = (username: string) => {
    storage.deleteProspect(username);
    refresh();
  };

  const handleExport = () => {
    if (prospects.length === 0) return;
    const headers = ["Username", "Nome", "Seguidores", "Status", "Data Envio", "Data Resposta", "Data Conversão", "Perfil"];
    const rows = prospects.map(p => [
      `@${p.username}`,
      p.fullName || "",
      p.followersCount,
      STATUS_CONFIG[p.prospectStatus?.status || "pending"]?.label || "",
      formatDate(p.prospectStatus?.contactedAt),
      formatDate(p.prospectStatus?.repliedAt),
      formatDate(p.prospectStatus?.convertedAt),
      p.profileUrl,
    ]);

    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `prospecção_timelyone_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const conversionRate = stats.contacted > 0
    ? Math.round((stats.converted / stats.contacted) * 100)
    : 0;
  const replyRate = stats.contacted > 0
    ? Math.round((stats.replied / stats.contacted) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-8 p-8 max-w-7xl mx-auto w-full">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Histórico de Contactos</h1>
            <p className="text-sm text-slate-500">Acompanha o funil de conversão dos teus leads.</p>
          </div>
        </div>
        <button
          onClick={handleExport}
          disabled={prospects.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Download size={18} />
          <span>Exportar CSV</span>
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Mensagens enviadas", value: stats.contacted, icon: Send, color: "text-blue-400" },
          { label: "Responderam", value: stats.replied, icon: MessageSquare, color: "text-yellow-400" },
          { label: "Taxa de resposta", value: `${replyRate}%`, icon: TrendingUp, color: "text-accent" },
          { label: "Conversões", value: stats.converted, icon: TrendingUp, color: "text-green-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 uppercase tracking-wider">{label}</span>
              <Icon size={16} className={color} />
            </div>
            <span className={cn("text-3xl font-bold", color)}>{value}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-widest font-bold text-slate-500">
                <th className="px-6 py-4">Perfil</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Enviada</th>
                <th className="px-6 py-4">Respondeu</th>
                <th className="px-6 py-4">Converteu</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {prospects.length > 0 ? prospects.map((prospect) => {
                const status = prospect.prospectStatus?.status || "pending";
                const cfg = STATUS_CONFIG[status];
                return (
                  <tr key={prospect.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Perfil */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                          {prospect.profilePictureUrl
                            ? <img src={prospect.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                            : <span className="text-[10px]">{prospect.username[0].toUpperCase()}</span>
                          }
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">@{prospect.username}</p>
                          <p className="text-[10px] text-slate-500">{prospect.followersCount.toLocaleString()} seguidores</p>
                        </div>
                      </div>
                    </td>

                    {/* Status badge */}
                    <td className="px-6 py-4">
                      <span className={cn("text-[10px] font-bold px-2 py-1 rounded-full border", cfg.color)}>
                        {cfg.label}
                      </span>
                    </td>

                    {/* Datas */}
                    <td className="px-6 py-4 text-sm text-slate-400">{formatDate(prospect.prospectStatus?.contactedAt)}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{formatDate(prospect.prospectStatus?.repliedAt)}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{formatDate(prospect.prospectStatus?.convertedAt)}</td>

                    {/* Ações */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {status === 'sent' && (
                          <button
                            onClick={() => handleUpdateStatus(prospect.username, 'replied')}
                            className="px-3 py-1 text-xs rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 transition-colors"
                          >
                            Respondeu
                          </button>
                        )}
                        {(status === 'sent' || status === 'replied') && (
                          <button
                            onClick={() => handleUpdateStatus(prospect.username, 'converted')}
                            className="px-3 py-1 text-xs rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-colors"
                          >
                            Converteu
                          </button>
                        )}
                        <a
                          href={prospect.profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-slate-500 hover:text-accent transition-colors"
                        >
                          <ExternalLink size={15} />
                        </a>
                        <button
                          onClick={() => handleDelete(prospect.username)}
                          className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-slate-500 text-sm">
                    Ainda não existem contactos no histórico.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
