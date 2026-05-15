import { NextRequest, NextResponse } from "next/server";
import { redis, PROSPECTS_KEY } from "@/lib/redis";
import { ScoredProfile } from "@/types/instagram";

// PATCH — actualizar status de um prospect
export async function PATCH(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  const { status } = await request.json();
  const prospects = (await redis.get<ScoredProfile[]>(PROSPECTS_KEY)) ?? [];
  const index = prospects.findIndex(p => p.username === params.username);

  if (index < 0) return NextResponse.json({ ok: false }, { status: 404 });

  const now = new Date().toISOString();
  prospects[index] = {
    ...prospects[index],
    prospectStatus: {
      ...prospects[index].prospectStatus,
      status,
      ...(status === "replied" && { repliedAt: now }),
      ...(status === "converted" && {
        convertedAt: now,
        repliedAt: prospects[index].prospectStatus?.repliedAt ?? now,
      }),
    },
  };

  await redis.set(PROSPECTS_KEY, prospects);
  return NextResponse.json({ ok: true });
}

// DELETE — remover um prospect
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { username: string } }
) {
  const prospects = (await redis.get<ScoredProfile[]>(PROSPECTS_KEY)) ?? [];
  const filtered = prospects.filter(p => p.username !== params.username);
  await redis.set(PROSPECTS_KEY, filtered);
  return NextResponse.json({ ok: true });
}
