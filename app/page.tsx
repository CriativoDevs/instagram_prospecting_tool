"use client";

import Link from "next/link";
import { Search, History, BarChart3, Users, MessageSquare, CheckCircle2, XCircle } from "lucide-react";
import { storage } from "@/lib/storage";
import { useEffect, useState } from "react";
import { ApifyCredits } from "@/components/ApifyCredits";

export default function Home() {
  const [stats, setStats] = useState({
    totalFound: 0,
    contacted: 0,
    replied: 0,
    converted: 0,
    rejected: 0,
    replyRate: 0
  });

  useEffect(() => {
    storage.getProspects().then(prospects => {
      setStats(storage.getStats(prospects));
    });
  }, []);

  return (
    <div className="flex flex-col gap-8 p-8 max-w-7xl mx-auto w-full">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold tracking-tight text-white">
            TimelyOne <span className="text-accent">Prospecting</span>
          </h1>
          <p className="text-slate-400 text-lg">
            Encontre os melhores parceiros de negócio no Instagram de forma estratégica.
          </p>
        </div>
        <ApifyCredits />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: "Perfis Encontrados", value: stats.totalFound.toString(),    icon: Users,        color: "text-blue-400" },
          { label: "Contactos Feitos",   value: stats.contacted.toString(),     icon: MessageSquare, color: "text-accent" },
          { label: "Taxa de Resposta",   value: `${stats.replyRate}%`,          icon: BarChart3,    color: "text-purple-400" },
          { label: "Conversões",         value: stats.converted.toString(),     icon: CheckCircle2, color: "text-success" },
          { label: "Recusaram",          value: stats.rejected.toString(),      icon: XCircle,      color: "text-red-400" },
        ].map((stat, i) => (
          <div key={i} className="bg-navy-light border border-slate-800 p-6 rounded-xl flex items-center gap-4">
            <div className={`p-3 rounded-lg bg-slate-900 ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link 
          href="/search"
          className="group relative overflow-hidden bg-navy-light border border-slate-800 p-8 rounded-2xl hover:border-accent/50 transition-all duration-300"
        >
          <div className="relative z-10">
            <div className="w-12 h-12 bg-accent/10 text-accent rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Search size={28} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Nova Pesquisa</h2>
            <p className="text-slate-400">
              Procure por hashtags, filtre perfis ideais e gere abordagens personalizadas em segundos.
            </p>
          </div>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Search size={120} />
          </div>
        </Link>

        <Link 
          href="/history"
          className="group relative overflow-hidden bg-navy-light border border-slate-800 p-8 rounded-2xl hover:border-purple-500/50 transition-all duration-300"
        >
          <div className="relative z-10">
            <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <History size={28} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Histórico</h2>
            <p className="text-slate-400">
              Acompanhe os contactos já realizados, veja quem respondeu e analise os seus resultados.
            </p>
          </div>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <History size={120} />
          </div>
        </Link>
      </div>
    </div>
  );
}

