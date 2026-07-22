import { NextRequest, NextResponse } from "next/server";
import { redis, SCRIPTS_KEY } from "@/lib/redis";
import { Script } from "@/types/scripts";
import { randomUUID } from "crypto";
import { isValidStage } from "@/lib/scripts";

// GET — devolver todos os scripts
export async function GET() {
  const scripts = (await redis.get<Script[]>(SCRIPTS_KEY)) ?? [];
  return NextResponse.json(scripts);
}

// POST — criar um novo script
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { stage, title, body: text } = body as {
    stage: string;
    title: string;
    body: string;
  };

  if (!stage || !title || !text || !isValidStage(stage)) {
    return NextResponse.json(
      { error: "stage, title e body são obrigatórios" },
      { status: 400 }
    );
  }

  const scripts = (await redis.get<Script[]>(SCRIPTS_KEY)) ?? [];
  const now = new Date().toISOString();
  const script: Script = {
    id: randomUUID(),
    stage: stage as Script["stage"],
    title,
    body: text,
    createdAt: now,
    updatedAt: now,
  };

  scripts.push(script);
  await redis.set(SCRIPTS_KEY, scripts);
  return NextResponse.json(script);
}
