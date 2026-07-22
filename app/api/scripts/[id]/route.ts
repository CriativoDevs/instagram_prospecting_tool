import { NextRequest, NextResponse } from "next/server";
import { redis, SCRIPTS_KEY } from "@/lib/redis";
import { Script } from "@/types/scripts";
import { isValidStage } from "@/lib/scripts";

// PATCH — actualizar stage/title/body de um script
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const updates = (await request.json()) as Partial<
    Pick<Script, "stage" | "title" | "body">
  >;
  const scripts = (await redis.get<Script[]>(SCRIPTS_KEY)) ?? [];
  const index = scripts.findIndex((s) => s.id === params.id);

  if (index < 0) {
    return NextResponse.json({ error: "script não encontrado" }, { status: 404 });
  }

  if (updates.stage !== undefined && !isValidStage(updates.stage)) {
    return NextResponse.json({ error: "stage inválido" }, { status: 400 });
  }

  scripts[index] = {
    ...scripts[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await redis.set(SCRIPTS_KEY, scripts);
  return NextResponse.json(scripts[index]);
}

// DELETE — remover um script
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const scripts = (await redis.get<Script[]>(SCRIPTS_KEY)) ?? [];
  const index = scripts.findIndex((s) => s.id === params.id);

  if (index < 0) {
    return NextResponse.json({ error: "script não encontrado" }, { status: 404 });
  }

  const filtered = scripts.filter((s) => s.id !== params.id);
  await redis.set(SCRIPTS_KEY, filtered);
  return NextResponse.json({ ok: true });
}
