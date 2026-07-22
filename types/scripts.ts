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
