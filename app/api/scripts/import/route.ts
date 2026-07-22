import { NextRequest, NextResponse } from "next/server";
import { redis, SCRIPTS_KEY } from "@/lib/redis";
import { isValidStage } from "@/lib/scripts";
import { Script } from "@/types/scripts";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { rows } = body as {
    rows: { stage: string; title: string; body: string }[];
  };

  if (!Array.isArray(rows)) {
    return NextResponse.json({ error: "rows deve ser um array" }, { status: 400 });
  }

  const validRows = rows.filter((row) => isValidStage(row.stage) && row.title && row.body);

  const scripts = (await redis.get<Script[]>(SCRIPTS_KEY)) ?? [];
  const now = new Date().toISOString();

  const created: Script[] = validRows.map((row) => ({
    id: randomUUID(),
    stage: row.stage as Script["stage"],
    title: row.title,
    body: row.body,
    createdAt: now,
    updatedAt: now,
  }));

  await redis.set(SCRIPTS_KEY, [...scripts, ...created]);
  return NextResponse.json({ imported: created.length });
}
