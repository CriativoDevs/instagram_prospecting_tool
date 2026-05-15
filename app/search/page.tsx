"use client";

import { useState } from "react";
import { FilterBar } from "@/components/FilterBar";
import { ProfileCard } from "@/components/ProfileCard";
import { DMGenerator } from "@/components/DMGenerator";
import { searchInstagramHashtag } from "@/lib/instagram";
import { storage } from "@/lib/storage";
import { ScoredProfile } from "@/types/instagram";
import { FilterConfig } from "@/lib/niches";
import { ArrowLeft, Loader2, Info, Wifi, WifiOff } from "lucide-react";
import Link from "next/link";

export default function SearchPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [profiles, setProfiles] = useState<ScoredProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<ScoredProfile | null>(null);
  const [stats, setStats] = useState({ found: 0, filtered: 0 });
  const [dataSource, setDataSource] = useState<{ source: "real" | "mock"; apiError?: string } | null>(null);

  const handleSearch = async (hashtag: string, filters: FilterConfig) => {
    setIsLoading(true);
    setDataSource(null);
    try {
      const { profiles: results, source, apiError } = await searchInstagramHashtag(hashtag, filters);
      const visible = results.filter(p => p.score !== 'ignore');
      setProfiles(results);
      setDataSource({ source, apiError });
      setStats({ found: results.length, filtered: results.length - visible.length });
    } catch (error) {
      console.error("Erro na pesquisa:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsSent = (profile: ScoredProfile) => {
    const updated: ScoredProfile = {
      ...profile,
      prospectStatus: { status: 'sent', contactedAt: new Date().toISOString() },
    };
    storage.saveProspect(updated);
    setProfiles(prev => prev.map(p => p.username === profile.username ? updated : p));
  };

  return (
    <div className="flex flex-col gap-6 p-8 max-w-7xl mx-auto w-full">
      {/* Navigation */}
      <div className="flex items-center gap-4">
        <Link href="/" className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Pesquisa por Hashtag</h1>
          <p className="text-sm text-slate-500">Escolhe um nicho, seleciona uma hashtag e ajusta os filtros.</p>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar onSearch={handleSearch} isLoading={isLoading} />

      {/* API Source Banner */}
      {dataSource && (
        <div className={`flex items-start gap-3 p-4 rounded-xl border text-sm ${
          dataSource.source === "real"
            ? "bg-green-500/10 border-green-500/30 text-green-400"
            : "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
        }`}>
          {dataSource.source === "real"
            ? <Wifi size={18} className="shrink-0 mt-0.5" />
            : <WifiOff size={18} className="shrink-0 mt-0.5" />
          }
          <div>
            <span className="font-semibold">
              {dataSource.source === "real" ? "API Real do Instagram" : "Dados Simulados (Mock)"}
            </span>
            {dataSource.apiError && (
              <p className="mt-1 text-yellow-500/80 text-xs">{dataSource.apiError}</p>
            )}
          </div>
        </div>
      )}

      {/* Results Stats */}
      {profiles.length > 0 && (
        <div className="flex items-center gap-2 bg-accent/5 border border-accent/20 p-4 rounded-xl text-accent text-sm font-medium">
          <Info size={18} />
          <span>
            {stats.found} perfis encontrados.
            {stats.filtered > 0 && ` ${stats.filtered} ocultados pelos filtros.`}
          </span>
        </div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 size={48} className="text-accent animate-spin" />
          <p className="text-slate-400 animate-pulse">A analisar perfis do Instagram…</p>
        </div>
      ) : profiles.filter(p => p.score !== 'ignore').length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.filter(p => p.score !== 'ignore').map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              onGenerateDM={setSelectedProfile}
              onMarkAsSent={handleMarkAsSent}
            />
          ))}
        </div>
      ) : !isLoading && profiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-800 rounded-3xl">
          <p className="text-slate-500">Escolhe um nicho e uma hashtag acima para começar.</p>
        </div>
      ) : !isLoading && profiles.length > 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-800 rounded-3xl">
          <p className="text-slate-500">Nenhum perfil passou os filtros actuais.</p>
          <p className="text-slate-600 text-sm mt-1">Tenta alargar o intervalo de seguidores ou reduzir o mínimo de posts.</p>
        </div>
      ) : null}

      <DMGenerator profile={selectedProfile} onClose={() => setSelectedProfile(null)} />
    </div>
  );
}
