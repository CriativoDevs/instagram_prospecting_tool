import { redis } from "@/lib/redis";
import { clampFollowUpDays, DEFAULT_FOLLOW_UP_DAYS } from "@/lib/reminders";

export const SETTINGS_KEY = "timelyone:settings";

export interface AppSettings {
  followUpDays: number;
}

export async function getSettings(): Promise<AppSettings> {
  const stored = await redis.get<Partial<AppSettings>>(SETTINGS_KEY);
  return { followUpDays: clampFollowUpDays(stored?.followUpDays ?? DEFAULT_FOLLOW_UP_DAYS) };
}
