"use client";

import { Search, SlidersHorizontal, X, ChevronDown, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { NICHES, FilterConfig, DEFAULT_FILTERS, GEO_RADIUS_OPTIONS, GEO_COUNTRIES } from "@/lib/niches";

const STORAGE_KEY = "prospect_filters";

interface FilterBarProps {
  onSearch: (hashtag: string, filters: FilterConfig) => void;
  isLoading: boolean;
}

function loadFilters(): FilterConfig {
  if (typeof window === "undefined") return DEFAULT_FILTERS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...DEFAULT_FILTERS, ...JSON.parse(saved) } : DEFAULT_FILTERS;
  } catch {
    return DEFAULT_FILTERS;
  }
}

function saveFilters(filters: FilterConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
}

export function FilterBar({ onSearch, isLoading }: FilterBarProps) {
  const [hashtag, setHashtag] = useState("");
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<FilterConfig>(DEFAULT_FILTERS);

  useEffect(() => {
    setFilters(loadFilters());
  }, []);

  const handleFilterChange = (patch: Partial<FilterConfig>) => {
    let updated = { ...filters, ...patch };
    if (patch.minFollowers !== undefined && updated.minFollowers > updated.maxFollowers) {
      updated.maxFollowers = updated.minFollowers;
    }
    if (patch.maxFollowers !== undefined && updated.maxFollowers < updated.minFollowers) {
      updated.minFollowers = updated.maxFollowers;
    }
    setFilters(updated);
    saveFilters(updated);
  };

  const activeNiche = NICHES.find(n => n.id === selectedNiche);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (filters.searchMode === "geo") {
      if (!filters.address?.trim()) return;
      const nicheHashtag = activeNiche?.hashtags[0] ?? "negocio";
      onSearch(nicheHashtag, filters);
    } else {
      if (!hashtag.trim()) return;
      onSearch(hashtag.trim().replace(/^#/, ""), filters);
    }
  };

  const isSearchDisabled =
    isLoading ||
    (filters.searchMode === "hashtag" ? !hashtag.trim() : !filters.address?.trim());

  return (
    <div className="flex flex-col gap-3">

      {/* Nicho pills — visíveis em ambos os modos */}
      <div className="flex flex-wrap gap-2">
        {NICHES.map(niche => (
          <button
            key={niche.id}
            onClick={() => setSelectedNiche(selectedNiche === niche.id ? null : niche.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
              selectedNiche === niche.id
                ? "bg-accent text-white border-accent shadow-lg shadow-accent/20"
                : "bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-white"
            }`}
          >
            <span>{niche.emoji}</span>
            <span>{niche.label}</span>
          </button>
        ))}
      </div>

      {/* Hashtag chips — visíveis apenas no modo hashtag */}
      {filters.searchMode === "hashtag" && activeNiche && (
        <div className="flex flex-wrap gap-2 p-3 bg-slate-900/50 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-500 w-full mb-1">Clica para pesquisar:</span>
          {activeNiche.hashtags.map(tag => (
            <button
              key={tag}
              onClick={() => setHashtag(tag)}
              className={`px-3 py-1 rounded-lg text-xs border transition-all ${
                hashtag === tag
                  ? "bg-accent/20 text-accent border-accent/50"
                  : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:border-slate-500"
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Toggle de modo */}
      <div className="flex gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl w-fit">
        <button
          onClick={() => handleFilterChange({ searchMode: "hashtag" })}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filters.searchMode === "hashtag"
              ? "bg-accent text-white shadow-md shadow-accent/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Search size={14} />
          Por Hashtag
        </button>
        <button
          onClick={() => handleFilterChange({ searchMode: "geo" })}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filters.searchMode === "geo"
              ? "bg-accent text-white shadow-md shadow-accent/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <MapPin size={14} />
          Por Localização
        </button>
      </div>

      {/* Search bar */}
      <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl flex flex-col md:flex-row gap-3 items-center">

        {filters.searchMode === "hashtag" ? (
          <form onSubmit={handleSubmit} className="relative flex-1 w-full">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
              <Search size={18} />
            </div>
            <input
              type="text"
              value={hashtag}
              onChange={e => setHashtag(e.target.value)}
              placeholder="Escreve ou seleciona uma hashtag acima…"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white text-sm focus:outline-none focus:border-accent transition-colors"
              disabled={isLoading}
            />
            {hashtag && (
              <button
                type="button"
                onClick={() => setHashtag("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </form>
        ) : (
          <div className="flex flex-col gap-3 flex-1 w-full">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                <MapPin size={18} />
              </div>
              <input
                type="text"
                value={filters.address ?? ""}
                onChange={e => handleFilterChange({ address: e.target.value })}
                placeholder="Endereço, cidade ou código postal…"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white text-sm focus:outline-none focus:border-accent transition-colors"
                disabled={isLoading}
              />
              {filters.address && (
                <button
                  type="button"
                  onClick={() => handleFilterChange({ address: "" })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            {/* País */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 shrink-0">País:</span>
              <div className="flex gap-2 flex-wrap">
                {GEO_COUNTRIES.map(c => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleFilterChange({ countryCode: c.code })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                      filters.countryCode === c.code
                        ? "bg-accent/20 text-accent border-accent/50"
                        : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:border-slate-500"
                    }`}
                  >
                    <span>{c.flag}</span>
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 shrink-0">Raio:</span>
              <div className="flex gap-2 flex-wrap">
                {GEO_RADIUS_OPTIONS.map(km => (
                  <button
                    key={km}
                    type="button"
                    onClick={() => handleFilterChange({ radius: km })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      filters.radius === km
                        ? "bg-accent/20 text-accent border-accent/50"
                        : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:border-slate-500"
                    }`}
                  >
                    {km} km
                  </button>
                ))}
              </div>
            </div>
            {filters.searchMode === "geo" && activeNiche && (
              <p className="text-xs text-slate-500">
                A pesquisar por <span className="text-accent">{activeNiche.emoji} {activeNiche.label}</span> dentro do raio definido.
              </p>
            )}
            {filters.searchMode === "geo" && !activeNiche && (
              <p className="text-xs text-yellow-500/70">
                Seleciona um nicho acima para definir o tipo de negócio a pesquisar.
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2 w-full md:w-auto shrink-0">
          <button
            onClick={() => setFiltersOpen(o => !o)}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl border text-sm font-medium transition-all ${
              filtersOpen
                ? "bg-accent/10 border-accent/50 text-accent"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-white"
            }`}
          >
            <SlidersHorizontal size={16} />
            <span>Filtros</span>
            <ChevronDown size={14} className={`transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
          </button>
          <button
            onClick={() => handleSubmit()}
            disabled={isSearchDisabled}
            className="flex-1 md:flex-none px-8 py-3 bg-accent hover:bg-accent/90 disabled:bg-accent/40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-accent/20 text-sm"
          >
            {isLoading ? "A pesquisar…" : "Pesquisar"}
          </button>
        </div>
      </div>

      {/* Painel de filtros */}
      {filtersOpen && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Filtros de qualificação</h3>
            <button
              onClick={() => handleFilterChange(DEFAULT_FILTERS)}
              className="text-xs text-slate-500 hover:text-accent transition-colors"
            >
              Repor padrão
            </button>
          </div>

          {/* Seguidores */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-400">Seguidores</label>
              <span className="text-xs text-slate-500">
                {filters.minFollowers.toLocaleString()} – {filters.maxFollowers.toLocaleString()}
              </span>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <span className="text-xs text-slate-600 mb-1 block">Mínimo</span>
                <input
                  type="range"
                  min={0} max={5000} step={100}
                  value={filters.minFollowers}
                  onChange={e => handleFilterChange({ minFollowers: Number(e.target.value) })}
                  className="w-full accent-[hsl(var(--accent))]"
                />
              </div>
              <div className="flex-1">
                <span className="text-xs text-slate-600 mb-1 block">Máximo</span>
                <input
                  type="range"
                  min={500} max={50000} step={500}
                  value={filters.maxFollowers}
                  onChange={e => handleFilterChange({ maxFollowers: Number(e.target.value) })}
                  className="w-full accent-[hsl(var(--accent))]"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { label: "Micro (200–1k)", min: 200, max: 1000 },
                { label: "Pequeno (1k–5k)", min: 1000, max: 5000 },
                { label: "Médio (5k–20k)", min: 5000, max: 20000 },
              ].map(p => (
                <button
                  key={p.label}
                  onClick={() => handleFilterChange({ minFollowers: p.min, maxFollowers: p.max })}
                  className={`px-3 py-1 rounded-lg text-xs border transition-all ${
                    filters.minFollowers === p.min && filters.maxFollowers === p.max
                      ? "bg-accent/20 text-accent border-accent/50"
                      : "bg-slate-800 text-slate-500 border-slate-700 hover:text-white hover:border-slate-500"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Máximo de perfis */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-400">Máximo de perfis</label>
              <span className="text-xs text-slate-500">{filters.maxProfiles} perfis</span>
            </div>
            <input
              type="range"
              min={10} max={100} step={10}
              value={filters.maxProfiles}
              onChange={e => handleFilterChange({ maxProfiles: Number(e.target.value) })}
              className="w-full accent-[hsl(var(--accent))]"
            />
            <div className="flex justify-between text-[10px] text-slate-600 px-0.5">
              <span>10</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100</span>
            </div>
          </div>

          {/* Posts mínimos */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-400">Posts mínimos</label>
              <span className="text-xs text-slate-500">{filters.minPosts} posts</span>
            </div>
            <input
              type="range"
              min={1} max={100} step={1}
              value={filters.minPosts}
              onChange={e => handleFilterChange({ minPosts: Number(e.target.value) })}
              className="w-full accent-[hsl(var(--accent))]"
            />
            <div className="flex gap-2">
              {[5, 10, 20, 50].map(v => (
                <button
                  key={v}
                  onClick={() => handleFilterChange({ minPosts: v })}
                  className={`px-3 py-1 rounded-lg text-xs border transition-all ${
                    filters.minPosts === v
                      ? "bg-accent/20 text-accent border-accent/50"
                      : "bg-slate-800 text-slate-500 border-slate-700 hover:text-white hover:border-slate-500"
                  }`}
                >
                  {v}+
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
