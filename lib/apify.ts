import { InstagramProfile } from "@/types/instagram";

// ---------- Apify ----------

interface ApifyPost {
  ownerUsername?: string;
  ownerId?: string;
}

interface ApifyProfile {
  id?: string;
  username?: string;
  fullName?: string;
  biography?: string;
  followersCount?: number;
  postsCount?: number;
  verified?: boolean;
  profilePicUrl?: string;
  // campos de localização retornados para contas Business
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  cityName?: string;
  city?: string;
  location?: { lat?: number; lng?: number; name?: string };
  businessAddressJson?: string;
}

export async function searchWithApify(hashtag: string, apiToken: string, maxProfiles: number): Promise<InstagramProfile[]> {
  // Passo 1 — obter posts da hashtag para recolher usernames
  const hashtagRes = await fetch(
    `https://api.apify.com/v2/acts/apify~instagram-hashtag-scraper/run-sync-get-dataset-items?token=${apiToken}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Pedimos 6× mais posts do que perfis pretendidos — hashtags populares têm muitos
      // posts do mesmo utilizador, pelo que a taxa posts→perfis únicos é baixa (~10-20%).
      body: JSON.stringify({ hashtags: [hashtag], resultsLimit: maxProfiles * 6 }),
      signal: AbortSignal.timeout(120_000),
    }
  );

  if (!hashtagRes.ok) {
    const body = await hashtagRes.text().catch(() => hashtagRes.status.toString());
    throw new Error(`Apify hashtag scraper: ${body}`);
  }

  const posts: ApifyPost[] = await hashtagRes.json();

  const seen = new Set<string>();
  const usernames: string[] = [];
  for (const post of posts) {
    if (post.ownerUsername && !seen.has(post.ownerUsername)) {
      seen.add(post.ownerUsername);
      usernames.push(post.ownerUsername);
    }
  }
  usernames.splice(maxProfiles);

  if (usernames.length === 0) {
    throw new Error(`Nenhum post encontrado para a hashtag "#${hashtag}".`);
  }

  // Passo 2 — obter dados completos de cada perfil
  const profileRes = await fetch(
    `https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items?token=${apiToken}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernames }),
      signal: AbortSignal.timeout(120_000),
    }
  );

  if (!profileRes.ok) {
    const body = await profileRes.text().catch(() => profileRes.status.toString());
    throw new Error(`Apify profile scraper: ${body}`);
  }

  const profiles: ApifyProfile[] = await profileRes.json();

  return profiles
    .filter(p => p.username)
    .map(p => {
      // extrai lat/lng tentando múltiplos campos que o Apify pode retornar
      const lat = p.lat ?? p.latitude ?? p.location?.lat ?? parseBusinessAddressLat(p.businessAddressJson);
      const lng = p.lng ?? p.longitude ?? p.location?.lng ?? parseBusinessAddressLng(p.businessAddressJson);
      const city = p.cityName ?? p.city ?? p.location?.name;

      return {
        id: p.id || p.username!,
        username: p.username!,
        fullName: p.fullName,
        biography: p.biography,
        followersCount: p.followersCount ?? 0,
        mediaCount: p.postsCount ?? 0,
        isVerified: p.verified ?? false,
        profilePictureUrl: p.profilePicUrl,
        profileUrl: `https://instagram.com/${p.username}`,
        ...(lat !== undefined && lng !== undefined && { latitude: lat, longitude: lng }),
        ...(city && { city }),
      };
    });
}

function parseBusinessAddressLat(json?: string): number | undefined {
  if (!json) return undefined;
  try { return JSON.parse(json).latitude; } catch { return undefined; }
}

function parseBusinessAddressLng(json?: string): number | undefined {
  if (!json) return undefined;
  try { return JSON.parse(json).longitude; } catch { return undefined; }
}

// ---------- Usage ----------

export interface ApifyUsage {
  used: number;
  total: number;
  plan: string;
  cycleStart: string;
  cycleEnd: string;
}

export async function getApifyUsage(token: string): Promise<ApifyUsage | null> {
  const [userRes, monthlyRes] = await Promise.all([
    fetch(`https://api.apify.com/v2/users/me?token=${token}`, { cache: "no-store" }),
    fetch(`https://api.apify.com/v2/users/me/usage/monthly?token=${token}`, { cache: "no-store" }),
  ]);

  if (!userRes.ok) return null;

  const userData = (await userRes.json()).data ?? {};
  const total: number = userData.plan?.monthlyUsageCreditsUsd ?? userData.plan?.maxMonthlyUsageUsd ?? 5;

  let used = 0;
  let cycleStart = new Date().toISOString();
  let cycleEnd = new Date().toISOString();

  if (monthlyRes.ok) {
    const monthlyData = (await monthlyRes.json()).data ?? {};
    used = monthlyData.totalUsageCreditsUsdAfterVolumeDiscount ?? monthlyData.totalUsageCreditsUsdBeforeVolumeDiscount ?? 0;
    cycleStart = monthlyData.usageCycle?.startAt ?? cycleStart;
    cycleEnd = monthlyData.usageCycle?.endAt ?? cycleEnd;
  }

  return {
    used: Math.round(used * 100) / 100,
    total,
    plan: userData.plan?.id ?? "FREE",
    cycleStart,
    cycleEnd,
  };
}
