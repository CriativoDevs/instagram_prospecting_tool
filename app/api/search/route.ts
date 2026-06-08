import { NextRequest, NextResponse } from "next/server";
import { InstagramProfile } from "@/types/instagram";
import { DEFAULT_FILTERS, FilterConfig } from "@/lib/niches";
import { haversineKm, cityToHashtagSlug, scoreProfile } from "@/lib/geo";

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

async function searchWithApify(hashtag: string, apiToken: string, maxProfiles: number): Promise<InstagramProfile[]> {
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

// ---------- Mock ----------

function getMockProfiles(): InstagramProfile[] {
  return [
    {
      id: "1", username: "beleza_studio_lx", fullName: "Beleza Studio Lisboa",
      biography: "Especialistas em unhas e estética. 💅 Agende o seu horário!",
      followersCount: 850, mediaCount: 45, isVerified: false,
      profilePictureUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=150&h=150&fit=crop",
      profileUrl: "https://instagram.com/beleza_studio_lx",
      latitude: 38.7169, longitude: -9.1399, city: "Lisboa",
    },
    {
      id: "2", username: "barber_shop_porto", fullName: "Classic Barber Porto",
      biography: "O melhor corte da cidade. 💈 #barbearia #porto",
      followersCount: 1200, mediaCount: 120, isVerified: false,
      profilePictureUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=150&h=150&fit=crop",
      profileUrl: "https://instagram.com/barber_shop_porto",
      latitude: 41.1579, longitude: -8.6291, city: "Porto",
    },
    {
      id: "3", username: "ana_nails_estetica", fullName: "Ana Estética",
      biography: "Trabalho feito com amor. Salão em Braga.",
      followersCount: 150, mediaCount: 12, isVerified: false,
      profilePictureUrl: "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=150&h=150&fit=crop",
      profileUrl: "https://instagram.com/ana_nails_estetica",
      latitude: 41.5454, longitude: -8.4265, city: "Braga",
    },
    {
      id: "4", username: "glow_up_algarve", fullName: "Glow Up Spa",
      biography: "Bem-estar e massagens relaxantes em Faro. 🌿 #spa #wellness",
      followersCount: 1800, mediaCount: 89, isVerified: false,
      profilePictureUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=150&h=150&fit=crop",
      profileUrl: "https://instagram.com/glow_up_algarve",
      latitude: 37.0194, longitude: -7.9304, city: "Faro",
    },
    {
      id: "5", username: "coimbra_hair_design", fullName: "Coimbra Hair Design",
      biography: "Transformamos o seu visual. Especialistas em coloração.",
      followersCount: 550, mediaCount: 210, isVerified: false,
      profilePictureUrl: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=150&h=150&fit=crop",
      profileUrl: "https://instagram.com/coimbra_hair_design",
      latitude: 40.2033, longitude: -8.4103, city: "Coimbra",
    },
    {
      id: "6", username: "mega_estetica_viana", fullName: "Mega Estética",
      biography: "Serviços de depilação a laser e estética avançada.",
      followersCount: 2500, mediaCount: 300, isVerified: false,
      profilePictureUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=150&h=150&fit=crop",
      profileUrl: "https://instagram.com/mega_estetica_viana",
      // sem localização definida — será filtrado no modo geo
    },
    {
      id: "7", username: "vintage_barber_co", fullName: "Vintage Barber",
      biography: "Barba, cabelo e bigode. Desde 1990 em Setúbal.",
      followersCount: 620, mediaCount: 8, isVerified: false,
      profilePictureUrl: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=150&h=150&fit=crop",
      profileUrl: "https://instagram.com/vintage_barber_co",
      latitude: 38.5243, longitude: -8.8882, city: "Setúbal",
    },
  ];
}

// ---------- Handler ----------

// ---------- Geo ----------

interface GeoResult {
  lat: number;
  lon: number;
  cityName: string | null;
}

async function geocodeAddress(address: string, countryCode = "pt"): Promise<GeoResult | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&countrycodes=${countryCode}&addressdetails=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "TimelyOne-Prospecting/1.0 (timelyone.today)" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const addr = data[0].address ?? {};
    // Tenta extrair o nome da cidade/localidade com vários campos possíveis
    const cityName: string | null =
      addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? addr.county ?? null;

    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), cityName };
  } catch {
    return null;
  }
}

// ---------- Handler ----------

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const hashtag = searchParams.get("hashtag");

  if (!hashtag) {
    return NextResponse.json({ error: "Parâmetro 'hashtag' é obrigatório." }, { status: 400 });
  }

  const filters: FilterConfig = {
    minFollowers: Number(searchParams.get("minFollowers") ?? DEFAULT_FILTERS.minFollowers),
    maxFollowers: Number(searchParams.get("maxFollowers") ?? DEFAULT_FILTERS.maxFollowers),
    minPosts: Number(searchParams.get("minPosts") ?? DEFAULT_FILTERS.minPosts),
    maxProfiles: Number(searchParams.get("maxProfiles") ?? DEFAULT_FILTERS.maxProfiles),
    searchMode: (searchParams.get("searchMode") as FilterConfig["searchMode"]) ?? "hashtag",
    address: searchParams.get("address") ?? undefined,
    radius: searchParams.get("radius") ? Number(searchParams.get("radius")) : undefined,
    countryCode: searchParams.get("countryCode") ?? "pt",
  };

  const apifyToken = process.env.APIFY_API_TOKEN;
  let profiles: InstagramProfile[] = [];
  let source: "real" | "mock" = apifyToken ? "real" : "mock";
  let apiError: string | null = null;
  let geoError: string | null = null;
  let geoHashtag: string | null = null; // hashtag efectivamente usada no modo geo

  // Em modo geo, geocodifica o endereço primeiro para construir hashtag local
  let geoOrigin: GeoResult | null = null;
  if (filters.searchMode === "geo" && filters.address) {
    geoOrigin = await geocodeAddress(filters.address, filters.countryCode);
    if (!geoOrigin) {
      geoError = `Não foi possível localizar "${filters.address}". Tente um endereço mais específico (ex: "Lisboa", "Porto", "4770-772 Vila Nova de Famalicão").`;
    }
  }

  // Determina a hashtag a pesquisar
  let searchHashtag = hashtag;
  if (filters.searchMode === "geo" && geoOrigin?.cityName) {
    const slug = cityToHashtagSlug(geoOrigin.cityName);
    geoHashtag = `${hashtag}${slug}`;
    searchHashtag = geoHashtag;
  }

  if (apifyToken && !geoError) {
    try {
      profiles = await searchWithApify(searchHashtag, apifyToken, filters.maxProfiles);
    } catch (firstError) {
      if (geoHashtag) {
        // Hashtag local não existe — tenta a hashtag genérica do nicho
        console.log(`#${geoHashtag} sem resultados, a tentar #${hashtag}`);
        geoHashtag = null;
        try {
          profiles = await searchWithApify(hashtag, apifyToken, filters.maxProfiles);
        } catch (fallbackError) {
          apiError = fallbackError instanceof Error ? fallbackError.message : "Erro desconhecido no Apify.";
          profiles = getMockProfiles();
          source = "mock";
        }
      } else {
        apiError = firstError instanceof Error ? firstError.message : "Erro desconhecido no Apify.";
        profiles = getMockProfiles();
        source = "mock";
      }
    }

    // Se a hashtag local devolveu 0 resultados (sem erro), tenta a genérica
    if (profiles.length === 0 && geoHashtag) {
      console.log(`#${geoHashtag} vazia, a tentar #${hashtag}`);
      geoHashtag = null;
      try {
        profiles = await searchWithApify(hashtag, apifyToken, filters.maxProfiles);
      } catch {
        profiles = [];
      }
    }
  } else if (!apifyToken) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    profiles = getMockProfiles();
  }

  let scored = profiles.map(p => scoreProfile(p, filters));

  // Filtro de geolocalização: adiciona distância se o perfil tiver coordenadas
  if (filters.searchMode === "geo" && geoOrigin && filters.radius) {
    scored = scored.map(p => {
      if (p.latitude !== undefined && p.longitude !== undefined) {
        const distanceKm = haversineKm(geoOrigin!.lat, geoOrigin!.lon, p.latitude, p.longitude);
        if (distanceKm > filters.radius!) {
          // Tem coordenadas mas está fora do raio — ignora
          return { ...p, score: "ignore" as const };
        }
        return { ...p, distanceKm: Math.round(distanceKm * 10) / 10 };
      }
      // Sem coordenadas: mantém a pontuação (hashtag local já filtra geograficamente)
      return p;
    });
  } else if (filters.searchMode === "geo" && geoError) {
    scored = scored.map(p => ({ ...p, score: "ignore" as const }));
  }

  return NextResponse.json({
    data: scored,
    count: scored.length,
    filteredCount: scored.filter(p => p.score === 'ignore').length,
    source,
    ...(apiError && { apiError }),
    ...(geoError && { geoError }),
    ...(geoHashtag && { geoHashtag }),
  });
}
