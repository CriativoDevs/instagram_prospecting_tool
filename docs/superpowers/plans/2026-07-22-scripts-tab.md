# FEAT-SCRIPT-01 — Scripts Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Scripts" tab where the user manages multiple pre-written DM templates organized by prospecting stage, with `{{nome}}`/`{{segmento}}` placeholder substitution, CSV import/export, and selection from the existing DM-generation modal.

**Architecture:** New `Script` type + Redis-backed CRUD API (`app/api/scripts/*`), mirroring the existing `prospects` API pattern. A kanban-style `/scripts` page (one column per fixed stage) built from two new client components (`ScriptColumn`, `ScriptCard`). `lib/scripts.ts` holds all pure logic (stage config, placeholder substitution, CSV parse/serialize) and is unit-tested with Jest, matching the existing `lib/geo.ts` + `__tests__/geo.test.ts` pattern. `DMGenerator.tsx` gains a script picker that overrides its existing automatic `generateDM()` output.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind, Upstash Redis (`@upstash/redis`), Jest + ts-jest, lucide-react icons.

---

## File Structure

- **Create** `types/scripts.ts` — `ScriptStage`, `Script` types.
- **Modify** `lib/redis.ts` — add `SCRIPTS_KEY` constant.
- **Modify** `lib/dm-templates.ts` — export `detectBusinessType` and new `SEGMENTO_LABELS` map.
- **Create** `lib/scripts.ts` — `SCRIPT_STAGES`, `isValidStage`, `applyScript`, `parseScriptsCsv`, `scriptsToCsv`.
- **Create** `__tests__/scripts.test.ts` — unit tests for `lib/scripts.ts`.
- **Create** `__tests__/dm-templates.test.ts` — unit tests for the new exports.
- **Create** `app/api/scripts/route.ts` — `GET`, `POST`.
- **Create** `app/api/scripts/[id]/route.ts` — `PATCH`, `DELETE`.
- **Create** `app/api/scripts/import/route.ts` — `POST` (bulk create).
- **Create** `public/scripts-modelo.csv` — downloadable example file.
- **Create** `components/ScriptCard.tsx` — view/edit card for one script.
- **Create** `components/ScriptColumn.tsx` — one stage column (list + inline "add" form).
- **Create** `app/scripts/page.tsx` — the kanban board page.
- **Modify** `app/page.tsx` — add a third dashboard card linking to `/scripts`.
- **Modify** `components/DMGenerator.tsx` — add script picker.

No automated tests exist today for API routes or React components (the one existing test file, `__tests__/geo.test.ts`, only covers pure `lib/` functions). We follow that same boundary: TDD for `lib/scripts.ts` and the `dm-templates.ts` exports, manual verification for routes/UI.

---

### Task 1: `Script` type

**Files:**
- Create: `types/scripts.ts`

- [ ] **Step 1: Write the type file**

```ts
// types/scripts.ts
export type ScriptStage =
  | "primeiro_contacto"
  | "followup_1_semana"
  | "followup_2_semanas"
  | "followup_1_mes"
  | "outro";

export interface Script {
  id: string;
  stage: ScriptStage;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit -p .`
Expected: no errors related to `types/scripts.ts`.

- [ ] **Step 3: Commit**

```bash
git add types/scripts.ts
git commit -m "feat: add Script type for FEAT-SCRIPT-01"
```

---

### Task 2: `SCRIPTS_KEY` Redis constant

**Files:**
- Modify: `lib/redis.ts`

- [ ] **Step 1: Add the constant**

Current file:

```ts
import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const PROSPECTS_KEY = "timelyone:prospects";
```

New file:

```ts
import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const PROSPECTS_KEY = "timelyone:prospects";
export const SCRIPTS_KEY = "timelyone:scripts";
```

- [ ] **Step 2: Commit**

```bash
git add lib/redis.ts
git commit -m "feat: add SCRIPTS_KEY redis constant"
```

---

### Task 3: Export `detectBusinessType` and add `SEGMENTO_LABELS`

**Files:**
- Modify: `lib/dm-templates.ts:1-27`
- Test: `__tests__/dm-templates.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/dm-templates.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/dm-templates.test.ts`
Expected: FAIL — `detectBusinessType` and `SEGMENTO_LABELS` are not exported from `lib/dm-templates.ts`.

- [ ] **Step 3: Export `detectBusinessType` and add `SEGMENTO_LABELS`**

In `lib/dm-templates.ts`, change:

```ts
function detectBusinessType(profile: ScoredProfile): BusinessType {
```

to:

```ts
export function detectBusinessType(profile: ScoredProfile): BusinessType {
```

And add, directly below the `detectBusinessType` function (before the `TEMPLATES` constant):

```ts
export const SEGMENTO_LABELS: Record<BusinessType, string> = {
  barbearia: "barbearia",
  salao: "salão de cabeleireiro",
  estetica: "centro de estética",
  unhas: "nail studio",
  spa: "spa",
  tatuagem: "estúdio de tatuagem",
  generico: "negócio de beleza",
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/dm-templates.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/dm-templates.ts __tests__/dm-templates.test.ts
git commit -m "feat: export detectBusinessType and add SEGMENTO_LABELS"
```

---

### Task 4: `applyScript` — placeholder substitution

**Files:**
- Create: `lib/scripts.ts`
- Test: `__tests__/scripts.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// __tests__/scripts.test.ts
import { applyScript } from "@/lib/scripts";
import type { Script } from "@/types/scripts";
import type { ScoredProfile } from "@/types/instagram";

const baseProfile: ScoredProfile = {
  id: "1",
  username: "estudiobela",
  fullName: "Estúdio Bela",
  biography: "Nail studio no centro",
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/scripts.test.ts`
Expected: FAIL — `lib/scripts.ts` does not exist yet.

- [ ] **Step 3: Implement `applyScript`**

```ts
// lib/scripts.ts
import { detectBusinessType, SEGMENTO_LABELS } from "@/lib/dm-templates";
import type { Script, ScriptStage } from "@/types/scripts";
import type { ScoredProfile } from "@/types/instagram";

export function applyScript(script: Script, profile: ScoredProfile): string {
  const nome = profile.fullName || profile.username;
  const segmento = SEGMENTO_LABELS[detectBusinessType(profile)];
  return script.body.replaceAll("{{nome}}", nome).replaceAll("{{segmento}}", segmento);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/scripts.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/scripts.ts __tests__/scripts.test.ts
git commit -m "feat: add applyScript placeholder substitution"
```

---

### Task 5: `SCRIPT_STAGES` config and `isValidStage`

**Files:**
- Modify: `lib/scripts.ts`
- Test: `__tests__/scripts.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `__tests__/scripts.test.ts`:

```ts
import { SCRIPT_STAGES, isValidStage } from "@/lib/scripts";

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/scripts.test.ts`
Expected: FAIL — `SCRIPT_STAGES` and `isValidStage` are not exported yet.

- [ ] **Step 3: Implement**

Add to `lib/scripts.ts` (above `applyScript`):

```ts
export const SCRIPT_STAGES: { id: ScriptStage; label: string }[] = [
  { id: "primeiro_contacto", label: "1º Contacto" },
  { id: "followup_1_semana", label: "Follow-up 1 semana" },
  { id: "followup_2_semanas", label: "Follow-up 2 semanas" },
  { id: "followup_1_mes", label: "Follow-up 1 mês" },
  { id: "outro", label: "Outro" },
];

export function isValidStage(value: string): value is ScriptStage {
  return SCRIPT_STAGES.some((s) => s.id === value);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/scripts.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/scripts.ts __tests__/scripts.test.ts
git commit -m "feat: add SCRIPT_STAGES config and isValidStage"
```

---

### Task 6: CSV parse/serialize

**Files:**
- Modify: `lib/scripts.ts`
- Test: `__tests__/scripts.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `__tests__/scripts.test.ts`:

```ts
import { parseScriptsCsv, scriptsToCsv } from "@/lib/scripts";

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/scripts.test.ts`
Expected: FAIL — `parseScriptsCsv` and `scriptsToCsv` are not exported yet.

- [ ] **Step 3: Implement CSV parse/serialize**

Add to `lib/scripts.ts`:

```ts
export interface ParsedCsvRow {
  stage: ScriptStage;
  title: string;
  body: string;
}

export interface ParseCsvResult {
  valid: ParsedCsvRow[];
  skipped: number;
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += char;
      i++;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (char === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }

    field += char;
    i++;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

export function parseScriptsCsv(csvText: string): ParseCsvResult {
  const rows = parseCsvRows(csvText.trim());
  const [, ...dataRows] = rows; // ignora a linha de cabeçalho
  const valid: ParsedCsvRow[] = [];
  let skipped = 0;

  for (const cols of dataRows) {
    const [stage, title, body] = cols;
    const trimmedStage = (stage ?? "").trim();
    const trimmedBody = (body ?? "").trim();

    if (!trimmedStage || !isValidStage(trimmedStage) || !trimmedBody) {
      skipped++;
      continue;
    }

    valid.push({
      stage: trimmedStage as ScriptStage,
      title: (title ?? "").trim(),
      body: trimmedBody,
    });
  }

  return { valid, skipped };
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function scriptsToCsv(scripts: Script[]): string {
  const header = "stage,title,body";
  const lines = scripts.map((s) =>
    [s.stage, s.title, s.body].map(csvEscape).join(",")
  );
  return [header, ...lines].join("\n");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/scripts.test.ts`
Expected: PASS (all tests in the file, ~14 total).

- [ ] **Step 5: Commit**

```bash
git add lib/scripts.ts __tests__/scripts.test.ts
git commit -m "feat: add CSV parse/serialize for scripts"
```

---

### Task 7: API routes `/api/scripts` (GET, POST)

**Files:**
- Create: `app/api/scripts/route.ts`

- [ ] **Step 1: Write the route**

```ts
// app/api/scripts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { redis, SCRIPTS_KEY } from "@/lib/redis";
import { Script } from "@/types/scripts";
import { randomUUID } from "crypto";

// GET — devolver todos os scripts
export async function GET() {
  const scripts = (await redis.get<Script[]>(SCRIPTS_KEY)) ?? [];
  return NextResponse.json(scripts);
}

// POST — criar um novo script
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { stage, title, body: text } = body as {
    stage: string;
    title: string;
    body: string;
  };

  if (!stage || !title || !text) {
    return NextResponse.json(
      { error: "stage, title e body são obrigatórios" },
      { status: 400 }
    );
  }

  const scripts = (await redis.get<Script[]>(SCRIPTS_KEY)) ?? [];
  const now = new Date().toISOString();
  const script: Script = {
    id: randomUUID(),
    stage: stage as Script["stage"],
    title,
    body: text,
    createdAt: now,
    updatedAt: now,
  };

  scripts.push(script);
  await redis.set(SCRIPTS_KEY, scripts);
  return NextResponse.json(script);
}
```

- [ ] **Step 2: Manual verification**

Run: `npm run dev` (in one terminal), then in another:

```bash
curl -s -X POST http://localhost:3000/api/scripts \
  -H "Content-Type: application/json" \
  -d '{"stage":"primeiro_contacto","title":"Teste","body":"Olá {{nome}}!"}'
```

Expected: JSON response with the created script (`id`, `stage`, `title`, `body`, `createdAt`, `updatedAt`).

```bash
curl -s http://localhost:3000/api/scripts
```

Expected: array containing the script created above.

- [ ] **Step 3: Commit**

```bash
git add app/api/scripts/route.ts
git commit -m "feat: add GET/POST /api/scripts"
```

---

### Task 8: API routes `/api/scripts/[id]` (PATCH, DELETE)

**Files:**
- Create: `app/api/scripts/[id]/route.ts`

- [ ] **Step 1: Write the route**

```ts
// app/api/scripts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { redis, SCRIPTS_KEY } from "@/lib/redis";
import { Script } from "@/types/scripts";

// PATCH — actualizar stage/title/body de um script
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const updates = (await request.json()) as Partial<
    Pick<Script, "stage" | "title" | "body">
  >;
  const scripts = (await redis.get<Script[]>(SCRIPTS_KEY)) ?? [];
  const index = scripts.findIndex((s) => s.id === params.id);

  if (index < 0) {
    return NextResponse.json({ error: "script não encontrado" }, { status: 404 });
  }

  scripts[index] = {
    ...scripts[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await redis.set(SCRIPTS_KEY, scripts);
  return NextResponse.json(scripts[index]);
}

// DELETE — remover um script
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const scripts = (await redis.get<Script[]>(SCRIPTS_KEY)) ?? [];
  const index = scripts.findIndex((s) => s.id === params.id);

  if (index < 0) {
    return NextResponse.json({ error: "script não encontrado" }, { status: 404 });
  }

  const filtered = scripts.filter((s) => s.id !== params.id);
  await redis.set(SCRIPTS_KEY, filtered);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Manual verification**

With `npm run dev` running and a script already created (from Task 7), grab its `id` from `curl http://localhost:3000/api/scripts` and run:

```bash
curl -s -X PATCH http://localhost:3000/api/scripts/<id> \
  -H "Content-Type: application/json" \
  -d '{"title":"Teste editado"}'
```

Expected: JSON with `title: "Teste editado"` and an updated `updatedAt`.

```bash
curl -s -X DELETE http://localhost:3000/api/scripts/<id>
curl -s http://localhost:3000/api/scripts
```

Expected: `{"ok":true}` then an empty array (or without that script).

```bash
curl -s -X PATCH http://localhost:3000/api/scripts/nao-existe -d '{}' -H "Content-Type: application/json"
```

Expected: `{"error":"script não encontrado"}` with HTTP 404.

- [ ] **Step 3: Commit**

```bash
git add "app/api/scripts/[id]/route.ts"
git commit -m "feat: add PATCH/DELETE /api/scripts/[id]"
```

---

### Task 9: API route `/api/scripts/import` (bulk create)

**Files:**
- Create: `app/api/scripts/import/route.ts`

- [ ] **Step 1: Write the route**

```ts
// app/api/scripts/import/route.ts
import { NextRequest, NextResponse } from "next/server";
import { redis, SCRIPTS_KEY } from "@/lib/redis";
import { Script } from "@/types/scripts";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { rows } = body as {
    rows: { stage: string; title: string; body: string }[];
  };

  if (!Array.isArray(rows)) {
    return NextResponse.json({ error: "rows deve ser um array" }, { status: 400 });
  }

  const scripts = (await redis.get<Script[]>(SCRIPTS_KEY)) ?? [];
  const now = new Date().toISOString();

  const created: Script[] = rows.map((row) => ({
    id: randomUUID(),
    stage: row.stage as Script["stage"],
    title: row.title,
    body: row.body,
    createdAt: now,
    updatedAt: now,
  }));

  await redis.set(SCRIPTS_KEY, [...scripts, ...created]);
  return NextResponse.json({ imported: created.length });
}
```

- [ ] **Step 2: Manual verification**

```bash
curl -s -X POST http://localhost:3000/api/scripts/import \
  -H "Content-Type: application/json" \
  -d '{"rows":[{"stage":"followup_1_semana","title":"FU1","body":"Oi {{nome}}"}]}'
```

Expected: `{"imported":1}`, and `curl http://localhost:3000/api/scripts` includes the new script.

- [ ] **Step 3: Commit**

```bash
git add app/api/scripts/import/route.ts
git commit -m "feat: add POST /api/scripts/import for bulk creation"
```

---

### Task 10: Example CSV template file

**Files:**
- Create: `public/scripts-modelo.csv`

- [ ] **Step 1: Write the file**

```csv
stage,title,body
primeiro_contacto,Primeiro contacto padrão,"Olá {{nome}}! Vi o vosso trabalho como {{segmento}} e fiquei impressionado."
followup_1_semana,Follow-up 1 semana,"Passei por aqui de novo {{nome}} — ainda interessados em conhecer a nossa plataforma para {{segmento}}?"
followup_2_semanas,Follow-up 2 semanas,"Olá {{nome}}, última tentativa — se mudarem de ideias sobre a gestão do vosso negócio, estamos por aqui."
```

- [ ] **Step 2: Verify it parses correctly with existing logic**

Run: `npx jest __tests__/scripts.test.ts` (no direct test reads this file, but this step confirms the CSV parser tests still pass, since the file follows the exact same escaping rules already covered by those tests).
Expected: PASS.

Also manually confirm the file opens cleanly in a spreadsheet app or `cat public/scripts-modelo.csv` shows 4 lines (header + 3 examples) with no broken quoting.

- [ ] **Step 3: Commit**

```bash
git add public/scripts-modelo.csv
git commit -m "feat: add downloadable CSV example template for scripts"
```

---

### Task 11: `ScriptCard` component

**Files:**
- Create: `components/ScriptCard.tsx`

- [ ] **Step 1: Write the component**

```tsx
// components/ScriptCard.tsx
"use client";

import { useState } from "react";
import { Script } from "@/types/scripts";
import { Pencil, Trash2, Check, X } from "lucide-react";

interface ScriptCardProps {
  script: Script;
  onSave: (id: string, title: string, body: string) => void;
  onDelete: (id: string) => void;
}

export function ScriptCard({ script, onSave, onDelete }: ScriptCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(script.title);
  const [body, setBody] = useState(script.body);

  const handleSave = () => {
    if (!title.trim() || !body.trim()) return;
    onSave(script.id, title, body);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTitle(script.title);
    setBody(script.body);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-slate-900 border border-accent rounded-lg p-3 flex flex-col gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título"
          className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-accent"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Texto — usa {{nome}} e {{segmento}}"
          className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200 h-24 resize-none focus:outline-none focus:border-accent"
        />
        <div className="flex gap-2 justify-end">
          <button onClick={handleCancel} className="p-1.5 text-slate-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
          <button onClick={handleSave} className="p-1.5 text-success hover:text-success/80 transition-colors">
            <Check size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col gap-1">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold text-white">{script.title}</h4>
        <div className="flex gap-1 shrink-0">
          <button onClick={() => setIsEditing(true)} className="p-1 text-slate-400 hover:text-white transition-colors">
            <Pencil size={14} />
          </button>
          <button onClick={() => onDelete(script.id)} className="p-1 text-slate-400 hover:text-red-400 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <p className="text-xs text-slate-500 line-clamp-2">{script.body}</p>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit -p .`
Expected: no errors related to `components/ScriptCard.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/ScriptCard.tsx
git commit -m "feat: add ScriptCard component"
```

---

### Task 12: `ScriptColumn` component

**Files:**
- Create: `components/ScriptColumn.tsx`

- [ ] **Step 1: Write the component**

```tsx
// components/ScriptColumn.tsx
"use client";

import { useState } from "react";
import { Script, ScriptStage } from "@/types/scripts";
import { ScriptCard } from "@/components/ScriptCard";
import { Plus, Check, X } from "lucide-react";

interface ScriptColumnProps {
  stage: ScriptStage;
  label: string;
  scripts: Script[];
  onCreate: (stage: ScriptStage, title: string, body: string) => void;
  onSave: (id: string, title: string, body: string) => void;
  onDelete: (id: string) => void;
}

export function ScriptColumn({
  stage,
  label,
  scripts,
  onCreate,
  onSave,
  onDelete,
}: ScriptColumnProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const handleAdd = () => {
    if (!title.trim() || !body.trim()) return;
    onCreate(stage, title, body);
    setTitle("");
    setBody("");
    setIsAdding(false);
  };

  return (
    <div className="flex flex-col gap-2 bg-navy-light border border-slate-800 rounded-xl p-3 min-w-[260px] w-[260px] shrink-0">
      <h3 className="text-xs uppercase tracking-widest font-bold text-slate-400">{label}</h3>

      {scripts.map((script) => (
        <ScriptCard key={script.id} script={script} onSave={onSave} onDelete={onDelete} />
      ))}

      {isAdding ? (
        <div className="bg-slate-900 border border-accent rounded-lg p-3 flex flex-col gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título"
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-accent"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Texto — usa {{nome}} e {{segmento}}"
            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200 h-24 resize-none focus:outline-none focus:border-accent"
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setIsAdding(false)} className="p-1.5 text-slate-400 hover:text-white transition-colors">
              <X size={16} />
            </button>
            <button onClick={handleAdd} className="p-1.5 text-success hover:text-success/80 transition-colors">
              <Check size={16} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center justify-center gap-2 p-2 text-sm text-slate-400 hover:text-white border border-dashed border-slate-700 rounded-lg transition-colors"
        >
          <Plus size={14} /> Adicionar
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit -p .`
Expected: no errors related to `components/ScriptColumn.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/ScriptColumn.tsx
git commit -m "feat: add ScriptColumn component"
```

---

### Task 13: `/scripts` page

**Files:**
- Create: `app/scripts/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
// app/scripts/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Upload, FileDown } from "lucide-react";
import { ScriptColumn } from "@/components/ScriptColumn";
import { SCRIPT_STAGES, parseScriptsCsv, scriptsToCsv } from "@/lib/scripts";
import { Script, ScriptStage } from "@/types/scripts";

export default function ScriptsPage() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/scripts")
      .then((res) => res.json())
      .then(setScripts)
      .catch(() => setScripts([]));
  }, []);

  const handleCreate = async (stage: ScriptStage, title: string, body: string) => {
    const res = await fetch("/api/scripts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage, title, body }),
    });
    const created: Script = await res.json();
    setScripts((prev) => [...prev, created]);
  };

  const handleSave = async (id: string, title: string, body: string) => {
    const res = await fetch(`/api/scripts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body }),
    });
    const updated: Script = await res.json();
    setScripts((prev) => prev.map((s) => (s.id === id ? updated : s)));
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/scripts/${id}`, { method: "DELETE" });
    setScripts((prev) => prev.filter((s) => s.id !== id));
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const { valid, skipped } = parseScriptsCsv(text);

    if (valid.length > 0) {
      await fetch("/api/scripts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: valid }),
      });
      const refreshed = await fetch("/api/scripts").then((r) => r.json());
      setScripts(refreshed);
    }

    setImportMessage(`${valid.length} scripts importados, ${skipped} linha(s) inválida(s) ignorada(s).`);
    e.target.value = "";
  };

  const handleExport = () => {
    const csv = scriptsToCsv(scripts);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scripts.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6 p-8 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Scripts</h1>
            <p className="text-sm text-slate-500">Mensagens pré-geradas por estágio de prospecção.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/scripts-modelo.csv"
            download
            className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-300 hover:text-white transition-colors"
          >
            <FileDown size={16} /> Modelo CSV
          </a>
          <label className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-300 hover:text-white transition-colors cursor-pointer">
            <Upload size={16} /> Importar CSV
            <input type="file" accept=".csv" onChange={handleImport} className="hidden" />
          </label>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-300 hover:text-white transition-colors"
          >
            <Download size={16} /> Exportar CSV
          </button>
        </div>
      </div>

      {importMessage && (
        <div className="bg-accent/5 border border-accent/20 p-3 rounded-xl text-accent text-sm">
          {importMessage}
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-2">
        {SCRIPT_STAGES.map(({ id, label }) => (
          <ScriptColumn
            key={id}
            stage={id}
            label={label}
            scripts={scripts.filter((s) => s.stage === id)}
            onCreate={handleCreate}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Manual verification**

Run: `npm run dev`, open `http://localhost:3000/scripts`.

Expected:
- 5 columns render in the fixed order (1º Contacto, Follow-up 1 semana, Follow-up 2 semanas, Follow-up 1 mês, Outro).
- Clicking "+ Adicionar" in a column opens an inline form; saving creates a card that persists on page refresh.
- Editing a card's pencil icon, changing text, and confirming updates the card.
- Deleting a card removes it and it stays gone after refresh.
- "Modelo CSV" downloads `scripts-modelo.csv`.
- Importing that same file shows "3 scripts importados, 0 linha(s) inválida(s) ignorada(s)." and the 3 examples appear split into their respective columns.
- "Exportar CSV" downloads a file that, when re-imported, recreates the same scripts (no data loss on the round trip).

- [ ] **Step 3: Commit**

```bash
git add app/scripts/page.tsx
git commit -m "feat: add /scripts kanban page"
```

---

### Task 14: Dashboard card

**Files:**
- Modify: `app/page.tsx:1-7` (imports), `app/page.tsx:61-95` (Quick Actions grid)

- [ ] **Step 1: Update the grid and add the third card**

Change:

```tsx
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
```

to:

```tsx
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
```

Then, immediately after the closing `</Link>` of the "Histórico" card and before the closing `</div>` of the grid, add:

```tsx
        <Link
          href="/scripts"
          className="group relative overflow-hidden bg-navy-light border border-slate-800 p-8 rounded-2xl hover:border-emerald-500/50 transition-all duration-300"
        >
          <div className="relative z-10">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MessageSquare size={28} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Scripts</h2>
            <p className="text-slate-400">
              Crie e organize mensagens pré-definidas por estágio, com suporte a follow-up.
            </p>
          </div>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <MessageSquare size={120} />
          </div>
        </Link>
```

`MessageSquare` is already imported in `app/page.tsx:4` (used for the "Contactos Feitos" stat icon), so no new import is needed.

- [ ] **Step 2: Manual verification**

Run: `npm run dev`, open `http://localhost:3000/`.
Expected: three cards in a row on desktop (Nova Pesquisa, Histórico, Scripts), stacking on mobile. Clicking "Scripts" navigates to `/scripts`.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add Scripts card to dashboard"
```

---

### Task 15: `DMGenerator` script picker

**Files:**
- Modify: `components/DMGenerator.tsx`

- [ ] **Step 1: Add imports and state**

Change the top of the file from:

```tsx
"use client";

import { ScoredProfile } from "@/types/instagram";
import { generateDM } from "@/lib/dm-templates";
import { X, Copy, Check, MessageSquare, Send, AlertCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface DMGeneratorProps {
  profile: ScoredProfile | null;
  onClose: () => void;
}

type SendState = "idle" | "sending" | "queued" | "error";

export function DMGenerator({ profile, onClose }: DMGeneratorProps) {
  const [copied, setCopied] = useState(false);
  const [dmText, setDmText] = useState("");
  const [sendState, setSendState] = useState<SendState>("idle");
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setDmText(generateDM(profile));
    }
  }, [profile]);
```

to:

```tsx
"use client";

import { ScoredProfile } from "@/types/instagram";
import { Script } from "@/types/scripts";
import { generateDM } from "@/lib/dm-templates";
import { applyScript, SCRIPT_STAGES } from "@/lib/scripts";
import { X, Copy, Check, MessageSquare, Send, AlertCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface DMGeneratorProps {
  profile: ScoredProfile | null;
  onClose: () => void;
}

type SendState = "idle" | "sending" | "queued" | "error";
const AUTO_OPTION = "auto";

export function DMGenerator({ profile, onClose }: DMGeneratorProps) {
  const [copied, setCopied] = useState(false);
  const [dmText, setDmText] = useState("");
  const [sendState, setSendState] = useState<SendState>("idle");
  const [sendError, setSendError] = useState<string | null>(null);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [selectedScriptId, setSelectedScriptId] = useState(AUTO_OPTION);

  useEffect(() => {
    if (profile) {
      setSelectedScriptId(AUTO_OPTION);
      setDmText(generateDM(profile));
      fetch("/api/scripts")
        .then((res) => res.json())
        .then(setScripts)
        .catch(() => setScripts([]));
    }
  }, [profile]);

  const handleSelectScript = (scriptId: string) => {
    setSelectedScriptId(scriptId);
    if (!profile) return;
    if (scriptId === AUTO_OPTION) {
      setDmText(generateDM(profile));
      return;
    }
    const script = scripts.find((s) => s.id === scriptId);
    if (script) {
      setDmText(applyScript(script, profile));
    }
  };
```

- [ ] **Step 2: Add the `<select>` above the textarea**

Change:

```tsx
        {/* Content */}
        <div className="p-6">
          <textarea
```

to:

```tsx
        {/* Content */}
        <div className="p-6">
          <select
            value={selectedScriptId}
            onChange={(e) => handleSelectScript(e.target.value)}
            className="w-full mb-3 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-accent"
          >
            <option value={AUTO_OPTION}>Automático (padrão)</option>
            {SCRIPT_STAGES.map(({ id, label }) => {
              const stageScripts = scripts.filter((s) => s.stage === id);
              if (stageScripts.length === 0) return null;
              return (
                <optgroup key={id} label={label}>
                  {stageScripts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>

          <textarea
```

- [ ] **Step 3: Manual verification**

Run: `npm run dev`, open a search result, click a profile card to open the DM modal.

Expected:
- Dropdown defaults to "Automático (padrão)" and the textarea shows the same text `generateDM()` produced before this change (regression check).
- With at least one script created (from Task 13's manual test), it appears in the dropdown under its stage's `<optgroup>`.
- Selecting it replaces the textarea text with `{{nome}}`/`{{segmento}}` resolved for that profile.
- Switching back to "Automático (padrão)" restores the original automatic text.
- "Copiar" and "Enviar DM" still work against whatever text is currently in the textarea.

- [ ] **Step 4: Commit**

```bash
git add components/DMGenerator.tsx
git commit -m "feat: add script picker to DMGenerator"
```

---

### Task 16: Full regression pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npx jest`
Expected: all tests pass (existing `geo.test.ts` + new `scripts.test.ts` + `dm-templates.test.ts`).

- [ ] **Step 2: Type-check the whole project**

Run: `npx tsc --noEmit -p .`
Expected: no errors.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no errors (warnings acceptable if they pre-exist elsewhere in the codebase).

- [ ] **Step 4: Manual end-to-end walkthrough**

With `npm run dev` running:
1. Dashboard → click "Scripts" card → lands on `/scripts`.
2. Create one script per stage (at least 3 distinct follow-up scripts, per the issue's acceptance criteria).
3. Export CSV, then delete all scripts, then re-import the exported CSV — confirm the same scripts reappear (round-trip).
4. Go to `/search`, run a search, open a profile's DM modal, pick a script from the dropdown, confirm `{{nome}}`/`{{segmento}}` are resolved, send/copy still works.
5. Confirm nothing else on `/`, `/search`, `/history` regressed (stats, filters, history list still render).

- [ ] **Step 5: Final commit (only if the above surfaced fixes)**

```bash
git add -A
git commit -m "fix: address regressions found in FEAT-SCRIPT-01 e2e walkthrough"
```

(Skip this step entirely if no fixes were needed.)
