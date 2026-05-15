import { NextRequest, NextResponse } from "next/server";
import { redis, PROSPECTS_KEY } from "@/lib/redis";
import { ScoredProfile } from "@/types/instagram";

// GET — devolver todos os prospects
export async function GET() {
  const data = await redis.get<ScoredProfile[]>(PROSPECTS_KEY);
  return NextResponse.json(data ?? []);
}

// POST — guardar ou actualizar um prospect
export async function POST(request: NextRequest) {
  const profile: ScoredProfile = await request.json();
  const prospects = (await redis.get<ScoredProfile[]>(PROSPECTS_KEY)) ?? [];
  const index = prospects.findIndex(p => p.username === profile.username);

  if (index >= 0) {
    prospects[index] = profile;
  } else {
    prospects.push(profile);
  }

  await redis.set(PROSPECTS_KEY, prospects);
  return NextResponse.json({ ok: true });
}
