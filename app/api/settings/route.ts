import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { clampFollowUpDays } from "@/lib/reminders";
import { getSettings, SETTINGS_KEY } from "@/lib/settings";

export async function GET() {
  return NextResponse.json(await getSettings());
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const settings = { ...(await getSettings()), followUpDays: clampFollowUpDays(body.followUpDays) };
  await redis.set(SETTINGS_KEY, settings);
  return NextResponse.json(settings);
}
