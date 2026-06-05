import { haversineKm, cityToHashtagSlug, scoreProfile } from "@/lib/geo";
import type { InstagramProfile } from "@/types/instagram";
import type { FilterConfig } from "@/lib/niches";

// ─── haversineKm ────────────────────────────────────────────────────────────

describe("haversineKm", () => {
  it("devolve 0 para o mesmo ponto", () => {
    expect(haversineKm(41.15, -8.61, 41.15, -8.61)).toBe(0);
  });

  it("Lisboa → Porto é ~274 km", () => {
    const d = haversineKm(38.7169, -9.1399, 41.1579, -8.6291);
    expect(d).toBeGreaterThan(270);
    expect(d).toBeLessThan(280);
  });

  it("Famalicão → Braga é ~20 km", () => {
    const d = haversineKm(41.404, -8.521, 41.5454, -8.4265);
    expect(d).toBeGreaterThan(15);
    expect(d).toBeLessThan(25);
  });

  it("perfil dentro do raio de 25 km a partir de Famalicão", () => {
    const origin = { lat: 41.404, lon: -8.521 }; // Famalicão
    const braga = { lat: 41.5454, lon: -8.4265 };
    expect(haversineKm(origin.lat, origin.lon, braga.lat, braga.lon)).toBeLessThan(25);
  });

  it("perfil fora do raio de 25 km a partir de Famalicão", () => {
    const origin = { lat: 41.404, lon: -8.521 }; // Famalicão
    const porto = { lat: 41.1579, lon: -8.6291 };
    expect(haversineKm(origin.lat, origin.lon, porto.lat, porto.lon)).toBeGreaterThan(25);
  });
});

// ─── cityToHashtagSlug ───────────────────────────────────────────────────────

describe("cityToHashtagSlug", () => {
  it("cidade simples", () => {
    expect(cityToHashtagSlug("Porto")).toBe("porto");
    expect(cityToHashtagSlug("Lisboa")).toBe("lisboa");
    expect(cityToHashtagSlug("Braga")).toBe("braga");
  });

  it("remove acentos", () => {
    expect(cityToHashtagSlug("Famalicão")).toBe("famalicao");
    expect(cityToHashtagSlug("Évora")).toBe("evora");
    expect(cityToHashtagSlug("Setúbal")).toBe("setubal");
  });

  it("extrai última palavra significativa em cidades compostas", () => {
    expect(cityToHashtagSlug("Vila Nova de Famalicão")).toBe("famalicao");
    expect(cityToHashtagSlug("São João da Madeira")).toBe("madeira");
    expect(cityToHashtagSlug("Viana do Castelo")).toBe("castelo");
  });

  it("ignora stopwords", () => {
    // "de", "da", "do" são stopwords — não devem ser o slug
    expect(cityToHashtagSlug("Vila Nova de Gaia")).toBe("gaia");
  });

  it("fallback para slug completo quando só há palavras curtas", () => {
    // Cidade hipotética com só palavras de ≤3 letras
    const result = cityToHashtagSlug("Rio Sol");
    // "sol" tem 3 letras (não > 3), "rio" tem 3 letras — cai no fallback
    expect(result).toBe("riosol");
  });
});

// ─── scoreProfile ────────────────────────────────────────────────────────────

const baseProfile: InstagramProfile = {
  id: "1",
  username: "test",
  followersCount: 1000,
  mediaCount: 20,
  isVerified: false,
  profileUrl: "https://instagram.com/test",
};

const baseFilters: FilterConfig = {
  minFollowers: 200,
  maxFollowers: 5000,
  minPosts: 10,
  maxProfiles: 50,
  searchMode: "hashtag",
};

describe("scoreProfile", () => {
  it("perfil verificado → ignore", () => {
    const result = scoreProfile({ ...baseProfile, isVerified: true }, baseFilters);
    expect(result.score).toBe("ignore");
  });

  it("posts abaixo do mínimo → ignore", () => {
    const result = scoreProfile({ ...baseProfile, mediaCount: 5 }, baseFilters);
    expect(result.score).toBe("ignore");
  });

  it("seguidores abaixo do mínimo → ignore", () => {
    const result = scoreProfile({ ...baseProfile, followersCount: 100 }, baseFilters);
    expect(result.score).toBe("ignore");
  });

  it("seguidores acima do máximo → ignore", () => {
    const result = scoreProfile({ ...baseProfile, followersCount: 10000 }, baseFilters);
    expect(result.score).toBe("ignore");
  });

  it("seguidores no sweet spot → ideal", () => {
    // idealMin = 200*1.5 = 300, idealMax = 5000*0.6 = 3000
    const result = scoreProfile({ ...baseProfile, followersCount: 1500 }, baseFilters);
    expect(result.score).toBe("ideal");
  });

  it("seguidores dentro do range mas fora do sweet spot → ok", () => {
    // 4500 está entre 200-5000 mas acima de 3000 (idealMax)
    const result = scoreProfile({ ...baseProfile, followersCount: 4500 }, baseFilters);
    expect(result.score).toBe("ok");
  });

  it("range estreito onde idealMin > idealMax → tudo ok (nunca ideal)", () => {
    const narrowFilters: FilterConfig = {
      ...baseFilters,
      minFollowers: 1000,
      maxFollowers: 1200,
    };
    // idealMin = 1500, idealMax = 720 — invertido, não há sweet spot
    const result = scoreProfile({ ...baseProfile, followersCount: 1100 }, narrowFilters);
    expect(result.score).toBe("ok");
  });

  it("preserva campos do perfil original", () => {
    const result = scoreProfile(baseProfile, baseFilters);
    expect(result.username).toBe("test");
    expect(result.followersCount).toBe(1000);
  });
});
