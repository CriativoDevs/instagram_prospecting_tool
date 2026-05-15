import { ScoredProfile } from "@/types/instagram";
import { FilterConfig, DEFAULT_FILTERS } from "@/lib/niches";

export interface SearchResult {
  profiles: ScoredProfile[];
  source: "real" | "mock";
  apiError?: string;
}

export async function searchInstagramHashtag(
  hashtag: string,
  filters: FilterConfig = DEFAULT_FILTERS
): Promise<SearchResult> {
  const params = new URLSearchParams({
    hashtag,
    minFollowers: String(filters.minFollowers),
    maxFollowers: String(filters.maxFollowers),
    minPosts: String(filters.minPosts),
  });

  const res = await fetch(`/api/search?${params}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Erro ao contactar a API de pesquisa.");
  }

  const json = await res.json();
  return {
    profiles: json.data as ScoredProfile[],
    source: json.source,
    apiError: json.apiError,
  };
}
