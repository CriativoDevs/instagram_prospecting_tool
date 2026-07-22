import { applyScript, SCRIPT_STAGES, isValidStage } from "@/lib/scripts";
import type { Script } from "@/types/scripts";
import type { ScoredProfile } from "@/types/instagram";

const baseProfile: ScoredProfile = {
  id: "1",
  username: "estudiobela",
  fullName: "Estúdio Bela",
  biography: "Manicure e pedicure no centro",
  followersCount: 1000,
  mediaCount: 20,
  isVerified: false,
  profileUrl: "https://instagram.com/estudiobela",
  score: "ideal",
};

const baseScript: Script = {
  id: "s1",
  stage: "primeiro_contacto",
  title: "Primeiro contacto",
  body: "Olá {{nome}}! Vi o vosso trabalho como {{segmento}} e {{nome}} de novo.",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("applyScript", () => {
  it("substitui {{nome}} pelo fullName do perfil", () => {
    const result = applyScript(baseScript, baseProfile);
    expect(result).toContain("Olá Estúdio Bela!");
  });

  it("substitui todas as ocorrencias de {{nome}}", () => {
    const result = applyScript(baseScript, baseProfile);
    expect(result.match(/Estúdio Bela/g)).toHaveLength(2);
  });

  it("substitui {{segmento}} pelo tipo de negocio detectado", () => {
    const result = applyScript(baseScript, baseProfile);
    expect(result).toContain("como nail studio e");
  });

  it("usa username quando fullName esta ausente", () => {
    const { fullName, ...noName } = baseProfile;
    const result = applyScript(baseScript, noName as ScoredProfile);
    expect(result).toContain("Olá estudiobela!");
  });
});

describe("SCRIPT_STAGES", () => {
  it("tem 5 estagios na ordem fixa esperada", () => {
    expect(SCRIPT_STAGES.map(s => s.id)).toEqual([
      "primeiro_contacto",
      "followup_1_semana",
      "followup_2_semanas",
      "followup_1_mes",
      "outro",
    ]);
  });
});

describe("isValidStage", () => {
  it("aceita estagios validos", () => {
    expect(isValidStage("primeiro_contacto")).toBe(true);
  });

  it("rejeita estagios invalidos", () => {
    expect(isValidStage("qualquer_coisa")).toBe(false);
  });
});
