import { NextRequest, NextResponse } from "next/server";
import { redis, PROSPECTS_KEY } from "@/lib/redis";
import { ProspectStatus, ScoredProfile } from "@/types/instagram";

// PATCH — actualizar status de um prospect
export async function PATCH(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  const body = await request.json();
  const { status, profile } = body as { status: string; profile?: ScoredProfile };
  const prospects = (await redis.get<ScoredProfile[]>(PROSPECTS_KEY)) ?? [];
  let index = prospects.findIndex(p => p.username === params.username);

  const now = new Date().toISOString();
  const updatedStatus = {
    status: status as ProspectStatus["status"],
    ...(status === "sent" && { contactedAt: now }),
    ...(status === "replied" && { repliedAt: now }),
    ...(status === "converted" && { convertedAt: now }),
    ...(status === "rejected" && { rejectedAt: now }),
  };

  if (index < 0) {
    // Prospect não existe — criar com os dados do perfil se fornecidos
    if (!profile) return NextResponse.json({ ok: false }, { status: 404 });
    prospects.push({ ...profile, prospectStatus: updatedStatus });
  } else {
    prospects[index] = {
      ...prospects[index],
      prospectStatus: {
        ...prospects[index].prospectStatus,
        ...updatedStatus,
        ...(status === "converted" && {
          repliedAt: prospects[index].prospectStatus?.repliedAt ?? now,
        }),
      },
    };
  }

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
