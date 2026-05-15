import { NextRequest, NextResponse } from "next/server";
import { InstagramProfile, ScoredProfile } from "@/types/instagram";
import { DEFAULT_FILTERS, FilterConfig } from "@/lib/niches";

interface ScoringConfig extends FilterConfig {
  // sweet spot para badge IDEAL: 40%–80% do maxFollowers
}

function scoreProfile(profile: InstagramProfile, cfg: ScoringConfig): ScoredProfile {
  const idealMin = Math.round(cfg.minFollowers * 1.5);
  const idealMax = Math.round(cfg.maxFollowers * 0.6);

  if (profile.isVerified) return { ...profile, score: 'ignore' };
  if (profile.mediaCount < cfg.minPosts) return { ...profile, score: 'ignore' };
  if (profile.followersCount < cfg.minFollowers || profile.followersCount > cfg.maxFollowers)
    return { ...profile, score: 'ignore' };

  // Dentro do sweet spot → ideal; resto → ok
  const score = profile.followersCount >= idealMin && profile.followersCount <= idealMax
    ? 'ideal'
    : 'ok';

  return { ...profile, score };
}

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
}

async function searchWithApify(hashtag: string, apiToken: string): Promise<InstagramProfile[]> {
  // Passo 1 — obter posts da hashtag para recolher usernames
  const hashtagRes = await fetch(
    `https://api.apify.com/v2/acts/apify~instagram-hashtag-scraper/run-sync-get-dataset-items?token=${apiToken}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hashtags: [hashtag], resultsLimit: 30 }),
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
  usernames.splice(20);

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
    .map(p => ({
      id: p.id || p.username!,
      username: p.username!,
      fullName: p.fullName,
      biography: p.biography,
      followersCount: p.followersCount ?? 0,
      mediaCount: p.postsCount ?? 0,
      isVerified: p.verified ?? false,
      profilePictureUrl: p.profilePicUrl,
      profileUrl: `https://instagram.com/${p.username}`,
    }));
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
    },
    {
      id: "2", username: "barber_shop_porto", fullName: "Classic Barber Porto",
      biography: "O melhor corte da cidade. 💈 #barbearia #porto",
      followersCount: 1200, mediaCount: 120, isVerified: false,
      profilePictureUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=150&h=150&fit=crop",
      profileUrl: "https://instagram.com/barber_shop_porto",
    },
    {
      id: "3", username: "ana_nails_estetica", fullName: "Ana Estética",
      biography: "Trabalho feito com amor. Salão em Braga.",
      followersCount: 150, mediaCount: 12, isVerified: false,
      profilePictureUrl: "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=150&h=150&fit=crop",
      profileUrl: "https://instagram.com/ana_nails_estetica",
    },
    {
      id: "4", username: "glow_up_algarve", fullName: "Glow Up Spa",
      biography: "Bem-estar e massagens relaxantes em Faro. 🌿 #spa #wellness",
      followersCount: 1800, mediaCount: 89, isVerified: false,
      profilePictureUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=150&h=150&fit=crop",
      profileUrl: "https://instagram.com/glow_up_algarve",
    },
    {
      id: "5", username: "coimbra_hair_design", fullName: "Coimbra Hair Design",
      biography: "Transformamos o seu visual. Especialistas em coloração.",
      followersCount: 550, mediaCount: 210, isVerified: false,
      profilePictureUrl: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=150&h=150&fit=crop",
      profileUrl: "https://instagram.com/coimbra_hair_design",
    },
    {
      id: "6", username: "mega_estetica_viana", fullName: "Mega Estética",
      biography: "Serviços de depilação a laser e estética avançada.",
      followersCount: 2500, mediaCount: 300, isVerified: false,
      profilePictureUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=150&h=150&fit=crop",
      profileUrl: "https://instagram.com/mega_estetica_viana",
    },
    {
      id: "7", username: "vintage_barber_co", fullName: "Vintage Barber",
      biography: "Barba, cabelo e bigode. Desde 1990 em Setúbal.",
      followersCount: 620, mediaCount: 8, isVerified: false,
      profilePictureUrl: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=150&h=150&fit=crop",
      profileUrl: "https://instagram.com/vintage_barber_co",
    },
  ];
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
  };

  const apifyToken = process.env.APIFY_API_TOKEN;
  let profiles: InstagramProfile[] = [];
  let source: "real" | "mock" = "mock";
  let apiError: string | null = null;

  if (apifyToken) {
    try {
      profiles = await searchWithApify(hashtag, apifyToken);
      source = "real";
    } catch (error) {
      apiError = error instanceof Error ? error.message : "Erro desconhecido no Apify.";
      console.error("Erro no Apify, a usar mock:", apiError);
      profiles = getMockProfiles();
    }
  } else {
    await new Promise(resolve => setTimeout(resolve, 1500));
    profiles = getMockProfiles();
  }

  const scored = profiles.map(p => scoreProfile(p, filters));

  return NextResponse.json({
    data: scored,
    count: scored.length,
    filteredCount: scored.filter(p => p.score === 'ignore').length,
    source,
    ...(apiError && { apiError }),
  });
}
