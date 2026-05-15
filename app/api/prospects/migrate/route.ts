import { NextRequest, NextResponse } from "next/server";
import { redis, PROSPECTS_KEY } from "@/lib/redis";
import { ScoredProfile } from "@/types/instagram";

// POST — importar dados do localStorage para o Redis (migração única)
export async function POST(request: NextRequest) {
  const incoming: ScoredProfile[] = await request.json();
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return NextResponse.json({ ok: false, error: "Sem dados para migrar." }, { status: 400 });
  }

  const existing = (await redis.get<ScoredProfile[]>(PROSPECTS_KEY)) ?? [];

  // Merge: dados remotos têm prioridade para evitar duplicados
  const map = new Map<string, ScoredProfile>();
  for (const p of incoming) map.set(p.username, p);
  for (const p of existing) map.set(p.username, p); // sobrepõe com remotos

  await redis.set(PROSPECTS_KEY, Array.from(map.values()));
  return NextResponse.json({ ok: true, total: map.size });
}
