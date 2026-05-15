"use client";

import { useState, useEffect } from "react";
import { storage } from "@/lib/storage";
import { ScoredProfile } from "@/types/instagram";
import { ArrowLeft, MessageSquare, ExternalLink, Trash2, Download } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function HistoryPage() {
  const [prospects, setProspects] = useState<ScoredProfile[]>([]);

  useEffect(() => {
    setProspects(storage.getProspects());
  }, []);

  const handleExport = () => {
    if (prospects.length === 0) return;
    
    const headers = ["Username", "Full Name", "Status", "Contacted At", "Followers"];
    const rows = prospects.map(p => [
      p.username,
      p.fullName || "",
      p.prospectStatus?.status || "pending",
      p.prospectStatus?.contactedAt || "",
      p.followersCount
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `prospecção_timelyone_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
            <p className="text-sm text-slate-500">Gira e acompanhe os seus leads do Instagram.</p>
          </div>
        </div>
        
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors"
        >
          <Download size={18} />
          <span>Exportar CSV</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-navy-light border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-800 text-xs uppercase tracking-widest font-bold text-slate-500">
                <th className="px-6 py-4">Perfil</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Data de Contacto</th>
                <th className="px-6 py-4">Seguidores</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {prospects.length > 0 ? prospects.map((prospect) => (
                <tr key={prospect.id} className="hover:bg-slate-900/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                        {prospect.profilePictureUrl ? (
                          <img src={prospect.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px]">{prospect.username[0].toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">@{prospect.username}</p>
                        <p className="text-[10px] text-slate-500">{prospect.fullName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                      prospect.prospectStatus?.status === 'sent' 
                        ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                        : "bg-slate-500/10 border-slate-500/30 text-slate-400"
                    )}>
                      {prospect.prospectStatus?.status === 'sent' ? "Enviada" : "Pendente"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {prospect.prospectStatus?.contactedAt 
                      ? new Date(prospect.prospectStatus.contactedAt).toLocaleDateString('pt-PT') 
                      : "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {prospect.followersCount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a 
                        href={prospect.profileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 text-slate-500 hover:text-accent transition-colors"
                      >
                        <ExternalLink size={16} />
                      </a>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-500 text-sm">
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
