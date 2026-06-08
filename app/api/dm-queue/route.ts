import { NextRequest, NextResponse } from "next/server";
import { redis, PROSPECTS_KEY } from "@/lib/redis";
import { ScoredProfile } from "@/types/instagram";
import { randomUUID } from "crypto";

const DM_QUEUE_KEY = "timelyone:dm-queue";

export interface DMQueueItem {
  id: string;
  username: string;
  message: string;
  status: "pending" | "sent" | "failed";
  createdAt: string;
  error?: string;
}

// CORS para a extensão de browser (origin chrome-extension://)
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

// GET — ?action=next devolve o próximo item pendente; sem parâmetros devolve a fila completa
export async function GET(request: NextRequest) {
  const queue = (await redis.get<DMQueueItem[]>(DM_QUEUE_KEY)) ?? [];
  const action = request.nextUrl.searchParams.get("action");

  if (action === "next") {
    const next = queue.find((item) => item.status === "pending") ?? null;
    return NextResponse.json(next, { headers: corsHeaders() });
  }

  return NextResponse.json(queue, { headers: corsHeaders() });
}

// POST — aceita três acções:
//   { action: "add",      username, message }  → adiciona à fila
//   { action: "complete", username }            → marca como enviado, actualiza prospect
//   { action: "fail",     username, error }     → marca como falhado
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action } = body;

  if (!action) {
    return NextResponse.json({ error: "action obrigatório" }, { status: 400, headers: corsHeaders() });
  }

  const queue = (await redis.get<DMQueueItem[]>(DM_QUEUE_KEY)) ?? [];

  // ── Adicionar à fila ──────────────────────────────────────────────────────
  if (action === "add") {
    const { username, message } = body as { username: string; message: string };
    if (!username || !message) {
      return NextResponse.json(
        { error: "username e message são obrigatórios" },
        { status: 400, headers: corsHeaders() }
      );
    }

    // Não duplicar — se já existe pendente para o mesmo username, substituir mensagem
    const existing = queue.findIndex(
      (i) => i.username === username && i.status === "pending"
    );

    const item: DMQueueItem = {
      id: existing >= 0 ? queue[existing].id : randomUUID(),
      username,
      message,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    if (existing >= 0) {
      queue[existing] = item;
    } else {
      queue.push(item);
    }

    await redis.set(DM_QUEUE_KEY, queue);
    return NextResponse.json({ ok: true, id: item.id }, { headers: corsHeaders() });
  }

  // ── Marcar como enviado ───────────────────────────────────────────────────
  if (action === "complete") {
    const { username } = body as { username: string };
    const idx = queue.findIndex(
      (i) => i.username === username && i.status === "pending"
    );

    if (idx >= 0) {
      queue[idx].status = "sent";
      await redis.set(DM_QUEUE_KEY, queue);
    }

    // Actualizar status do prospect para "sent"
    const prospects = (await redis.get<ScoredProfile[]>(PROSPECTS_KEY)) ?? [];
    const pIdx = prospects.findIndex((p) => p.username === username);
    if (pIdx >= 0) {
      prospects[pIdx] = {
        ...prospects[pIdx],
        prospectStatus: {
          ...prospects[pIdx].prospectStatus,
          status: "sent",
          contactedAt: new Date().toISOString(),
        },
      };
      await redis.set(PROSPECTS_KEY, prospects);
    }

    return NextResponse.json({ ok: true }, { headers: corsHeaders() });
  }

  // ── Marcar como falhado ───────────────────────────────────────────────────
  if (action === "fail") {
    const { username, error } = body as { username: string; error?: string };
    const idx = queue.findIndex(
      (i) => i.username === username && i.status === "pending"
    );

    if (idx >= 0) {
      queue[idx].status = "failed";
      queue[idx].error = error ?? "Erro desconhecido";
      await redis.set(DM_QUEUE_KEY, queue);
    }

    return NextResponse.json({ ok: true }, { headers: corsHeaders() });
  }

  return NextResponse.json({ error: "action inválido" }, { status: 400, headers: corsHeaders() });
}
