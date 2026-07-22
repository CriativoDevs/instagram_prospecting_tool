import { detectBusinessType, SEGMENTO_LABELS } from "@/lib/dm-templates";
import type { Script, ScriptStage } from "@/types/scripts";
import type { ScoredProfile } from "@/types/instagram";

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

export function applyScript(script: Script, profile: ScoredProfile): string {
  const nome = profile.fullName || profile.username;
  const segmento = SEGMENTO_LABELS[detectBusinessType(profile)];
  return script.body.replaceAll("{{nome}}", nome).replaceAll("{{segmento}}", segmento);
}

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
