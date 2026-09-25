import { ScoredProfile } from "@/types/instagram";

export const DEFAULT_FOLLOW_UP_DAYS = 7;
export const MIN_FOLLOW_UP_DAYS = 1;
export const MAX_FOLLOW_UP_DAYS = 60;

const DAY_MS = 86_400_000;

export function clampFollowUpDays(days: unknown): number {
  const n = Math.round(Number(days));
  if (!Number.isFinite(n)) return DEFAULT_FOLLOW_UP_DAYS;
  return Math.min(MAX_FOLLOW_UP_DAYS, Math.max(MIN_FOLLOW_UP_DAYS, n));
}

export function followUpDate(days: number, from: Date = new Date()): string {
  return new Date(from.getTime() + clampFollowUpDays(days) * DAY_MS).toISOString();
}

export type ReminderState = "overdue" | "soon" | "upcoming";

// "soon" = vence nas próximas 24h
export function reminderState(followUpAt: string, now: Date = new Date()): ReminderState {
  const diff = new Date(followUpAt).getTime() - now.getTime();
  if (diff <= 0) return "overdue";
  return diff <= DAY_MS ? "soon" : "upcoming";
}

// Prospects com lembrete activo (enviada e ainda sem resposta), ordenados por data.
export function pendingReminders(prospects: ScoredProfile[]): ScoredProfile[] {
  return prospects
    .filter(p => p.prospectStatus?.status === "sent" && p.prospectStatus.followUpAt)
    .sort((a, b) => a.prospectStatus!.followUpAt!.localeCompare(b.prospectStatus!.followUpAt!));
}

export function dueReminderCount(prospects: ScoredProfile[], now: Date = new Date()): number {
  return pendingReminders(prospects).filter(p => reminderState(p.prospectStatus!.followUpAt!, now) !== "upcoming").length;
}
