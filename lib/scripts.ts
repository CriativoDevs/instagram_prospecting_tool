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
