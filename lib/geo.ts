import { InstagramProfile, ScoredProfile } from "@/types/instagram";
import { FilterConfig } from "@/lib/niches";

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Extrai o slug mais curto e distintivo para hashtag.
// "Vila Nova de Famalicão" → "famalicao"  |  "São João da Madeira" → "madeira"
export function cityToHashtagSlug(city: string): string {
  const stopWords = new Set(["de", "da", "do", "das", "dos", "e", "em", "a", "o", "as", "os"]);
  const normalize = (s: string) =>
    s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

  const words = city.split(/\s+/);
  for (let i = words.length - 1; i >= 0; i--) {
    const slug = normalize(words[i]);
    if (slug.length > 3 && !stopWords.has(slug)) return slug;
  }
  return normalize(city);
}

export function scoreProfile(profile: InstagramProfile, cfg: FilterConfig): ScoredProfile {
  const idealMin = Math.round(cfg.minFollowers * 1.5);
  const idealMax = Math.round(cfg.maxFollowers * 0.6);

  if (profile.isVerified) return { ...profile, score: "ignore" };
  if (profile.mediaCount < cfg.minPosts) return { ...profile, score: "ignore" };
  if (profile.followersCount < cfg.minFollowers || profile.followersCount > cfg.maxFollowers)
    return { ...profile, score: "ignore" };

  const score =
    idealMin <= idealMax &&
    profile.followersCount >= idealMin &&
    profile.followersCount <= idealMax
      ? "ideal"
      : "ok";

  return { ...profile, score };
}
