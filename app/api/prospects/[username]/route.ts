import { NextRequest, NextResponse } from "next/server";
import { redis, PROSPECTS_KEY } from "@/lib/redis";
import { ProspectStatus, ScoredProfile } from "@/types/instagram";
import { getSettings } from "@/lib/settings";
import { followUpDate } from "@/lib/reminders";

// PATCH — actualizar status de um prospect
export async function PATCH(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  const body = await request.json();
  const { status, profile, followUpAt } = body as { status?: string; profile?: ScoredProfile; followUpAt?: string | null };
  const prospects = (await redis.get<ScoredProfile[]>(PROSPECTS_KEY)) ?? [];
  let index = prospects.findIndex(p => p.username === params.username);

  // Só lembrete: adiar (ISO) ou remover (null), sem mexer no status
  if (!status && followUpAt !== undefined) {
    if (index < 0) return NextResponse.json({ ok: false }, { status: 404 });
    const { followUpAt: _old, ...rest } = prospects[index].prospectStatus ?? { status: "pending" as const };
    prospects[index] = {
      ...prospects[index],
      prospectStatus: { ...rest, ...(followUpAt && { followUpAt }) } as ProspectStatus,
    };
    await redis.set(PROSPECTS_KEY, prospects);
    return NextResponse.json({ ok: true });
  }
  if (!status) return NextResponse.json({ ok: false }, { status: 400 });

  const now = new Date().toISOString();
  const updatedStatus = {
    status: status as ProspectStatus["status"],
    ...(status === "sent" && { contactedAt: now, followUpAt: followUpDate((await getSettings()).followUpDays) }),
    ...(status === "replied" && { repliedAt: now }),
    ...(status === "converted" && { convertedAt: now }),
    ...(status === "rejected" && { rejectedAt: now }),
  };

  if (index < 0) {
    // Prospect não existe — criar com os dados do perfil se fornecidos
    if (!profile) return NextResponse.json({ ok: false }, { status: 404 });
    prospects.push({ ...profile, prospectStatus: updatedStatus });
  } else {
    const { followUpAt: _oldFollowUp, ...previous } = prospects[index].prospectStatus ?? {};
    prospects[index] = {
      ...prospects[index],
      prospectStatus: {
        // followUpAt só se mantém enquanto o prospect está em "sent"
        ...(status === "sent" ? prospects[index].prospectStatus : previous),
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
