import {
  applyScript,
  SCRIPT_STAGES,
  isValidStage,
  parseScriptsCsv,
  scriptsToCsv,
} from "@/lib/scripts";
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

describe("parseScriptsCsv", () => {
  it("faz parse de linhas validas", () => {
    const csv = 'stage,title,body\nprimeiro_contacto,Ola,"Ola {{nome}}!"';
    const { valid, skipped } = parseScriptsCsv(csv);
    expect(valid).toEqual([
      { stage: "primeiro_contacto", title: "Ola", body: "Ola {{nome}}!" },
    ]);
    expect(skipped).toBe(0);
  });

  it("ignora linha com stage invalido", () => {
    const csv = 'stage,title,body\nnao_existe,Ola,"Ola {{nome}}!"';
    const { valid, skipped } = parseScriptsCsv(csv);
    expect(valid).toHaveLength(0);
    expect(skipped).toBe(1);
  });

  it("ignora linha com body vazio", () => {
    const csv = "stage,title,body\nprimeiro_contacto,Ola,";
    const { valid, skipped } = parseScriptsCsv(csv);
    expect(valid).toHaveLength(0);
    expect(skipped).toBe(1);
  });

  it("lida com campos entre aspas contendo virgulas", () => {
    const csv = 'stage,title,body\nprimeiro_contacto,Ola,"Ola {{nome}}, tudo bem?"';
    const { valid } = parseScriptsCsv(csv);
    expect(valid[0].body).toBe("Ola {{nome}}, tudo bem?");
  });
});

describe("scriptsToCsv / parseScriptsCsv round-trip", () => {
  it("exporta e reimporta o mesmo conteudo", () => {
    const scripts: Script[] = [
      {
        id: "1",
        stage: "primeiro_contacto",
        title: "Ola",
        body: 'Ola {{nome}}, "tudo bem"?',
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ];
    const csv = scriptsToCsv(scripts);
    const { valid, skipped } = parseScriptsCsv(csv);
    expect(skipped).toBe(0);
    expect(valid).toEqual([
      { stage: "primeiro_contacto", title: "Ola", body: 'Ola {{nome}}, "tudo bem"?' },
    ]);
  });
});
