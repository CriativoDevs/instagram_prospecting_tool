import { detectBusinessType, SEGMENTO_LABELS } from "@/lib/dm-templates";
import type { ScoredProfile } from "@/types/instagram";

const baseProfile: ScoredProfile = {
  id: "1",
  username: "test",
  followersCount: 1000,
  mediaCount: 20,
  isVerified: false,
  profileUrl: "https://instagram.com/test",
  score: "ideal",
};

describe("detectBusinessType", () => {
  it("detecta barbearia pela bio", () => {
    const profile = { ...baseProfile, biography: "Barbearia moderna no centro" };
    expect(detectBusinessType(profile)).toBe("barbearia");
  });

  it("cai em generico sem correspondencia", () => {
    const profile = { ...baseProfile, biography: "Fotografia de eventos" };
    expect(detectBusinessType(profile)).toBe("generico");
  });
});

describe("SEGMENTO_LABELS", () => {
  it("tem um rotulo para cada tipo de negocio", () => {
    expect(SEGMENTO_LABELS.barbearia).toBe("barbearia");
    expect(SEGMENTO_LABELS.salao).toBe("salão de cabeleireiro");
    expect(SEGMENTO_LABELS.estetica).toBe("centro de estética");
    expect(SEGMENTO_LABELS.unhas).toBe("nail studio");
    expect(SEGMENTO_LABELS.spa).toBe("spa");
    expect(SEGMENTO_LABELS.tatuagem).toBe("estúdio de tatuagem");
    expect(SEGMENTO_LABELS.generico).toBe("negócio de beleza");
  });
});
