import { detectBusinessType, SEGMENTO_LABELS } from "@/lib/dm-templates";
import type { Script } from "@/types/scripts";
import type { ScoredProfile } from "@/types/instagram";

export function applyScript(script: Script, profile: ScoredProfile): string {
  const nome = profile.fullName || profile.username;
  const segmento = SEGMENTO_LABELS[detectBusinessType(profile)];
  return script.body.replaceAll("{{nome}}", nome).replaceAll("{{segmento}}", segmento);
}
