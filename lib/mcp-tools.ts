import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { redis, PROSPECTS_KEY } from "@/lib/redis";
import { ProspectStatus, ScoredProfile } from "@/types/instagram";
import { generateDM } from "@/lib/dm-templates";
import { DEFAULT_FILTERS } from "@/lib/niches";
import { scoreProfile } from "@/lib/geo";
import { getApifyUsage, searchWithApify } from "@/lib/apify";

const SEARCH_CACHE_PREFIX = "timelyone:mcp-search:";
const SEARCH_CACHE_TTL_S = 24 * 60 * 60;
const MAX_SEARCH_LIMIT = 20;

const STATUSES = ["pending", "sent", "replied", "converted", "rejected"] as const;

// Resposta compacta — poupa quota de tokens do Cowork (sem bio/foto).
function compact(p: ScoredProfile) {
  return {
    username: p.username,
    followers: p.followersCount,
    score: p.score,
    status: p.prospectStatus?.status ?? null,
    sentAt: p.prospectStatus?.contactedAt ?? null,
    ...(p.city && { city: p.city }),
  };
}

function text(data: unknown, isError = false) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data) }], ...(isError && { isError }) };
}

async function loadProspects() {
  return (await redis.get<ScoredProfile[]>(PROSPECTS_KEY)) ?? [];
}

export function createMcpServer() {
  const server = new McpServer({ name: "instagram-prospecting", version: "1.0.0" });

  server.registerTool(
    "list_prospects",
    {
      description: "Lista prospects guardados (compacto). Filtra por estado e/ou dias sem resposta após envio.",
      inputSchema: {
        status: z.enum(STATUSES).optional(),
        staleDays: z.number().int().min(1).optional().describe("Só status 'sent' enviados há mais de N dias"),
        limit: z.number().int().min(1).max(50).default(20),
        offset: z.number().int().min(0).default(0),
      },
    },
    async ({ status, staleDays, limit, offset }) => {
      let list = await loadProspects();
      if (status) list = list.filter(p => (p.prospectStatus?.status ?? "pending") === status);
      if (staleDays) {
        const cutoff = Date.now() - staleDays * 86_400_000;
        list = list.filter(p => {
          const s = p.prospectStatus;
          return s?.status === "sent" && s.contactedAt && new Date(s.contactedAt).getTime() < cutoff;
        });
      }
      return text({ total: list.length, offset, prospects: list.slice(offset, offset + limit).map(compact) });
    }
  );

  server.registerTool(
    "generate_dm",
    {
      description: "Gera a DM para um prospect guardado (template escolhido pelo tipo de negócio detectado na bio).",
      inputSchema: { username: z.string() },
    },
    async ({ username }) => {
      const p = (await loadProspects()).find(x => x.username === username);
      if (!p) return text({ error: `Prospect @${username} não encontrado.` }, true);
      return text({ username, message: generateDM(p) });
    }
  );

  server.registerTool(
    "update_prospect_status",
    {
      description: "Actualiza o estado de um prospect no funil.",
      inputSchema: { username: z.string(), status: z.enum(STATUSES) },
    },
    async ({ username, status }) => {
      const prospects = await loadProspects();
      const i = prospects.findIndex(p => p.username === username);
      if (i < 0) return text({ error: `Prospect @${username} não encontrado.` }, true);

      const now = new Date().toISOString();
      const prev = prospects[i].prospectStatus;
      const next: ProspectStatus = {
        ...prev,
        status,
        ...(status === "sent" && { contactedAt: now }),
        ...(status === "replied" && { repliedAt: now }),
        ...(status === "converted" && { convertedAt: now, repliedAt: prev?.repliedAt ?? now }),
        ...(status === "rejected" && { rejectedAt: now }),
      };
      prospects[i] = { ...prospects[i], prospectStatus: next };
      await redis.set(PROSPECTS_KEY, prospects);
      return text({ username, status, updatedAt: now });
    }
  );

  server.registerTool(
    "get_metrics",
    { description: "Métricas agregadas do funil de prospecção.", inputSchema: {} },
    async () => {
      const all = await loadProspects();
      const count = (...s: string[]) => all.filter(p => s.includes(p.prospectStatus?.status ?? "")).length;
      const contacted = count("sent", "replied", "converted", "rejected");
      const replied = count("replied", "converted");
      const converted = count("converted");
      const pct = (n: number) => (contacted > 0 ? `${Math.round((n / contacted) * 100)}%` : "0%");
      return text({
        total: all.length,
        contacted,
        replied,
        converted,
        rejected: count("rejected"),
        replyRate: pct(replied + count("rejected")),
        conversionRate: pct(converted),
      });
    }
  );

  server.registerTool(
    "run_search",
    {
      description:
        "Pesquisa perfis por hashtag e guarda-os como prospects. GASTA crédito Apify (free tier): usa cache 24h e recusa se o crédito restante for baixo. Máx 20 perfis.",
      inputSchema: {
        hashtag: z.string().describe("Sem #, ex: barbeariaporto"),
        limit: z.number().int().min(1).max(MAX_SEARCH_LIMIT).default(10),
      },
    },
    async ({ hashtag, limit }) => {
      const tag = hashtag.replace(/^#/, "").toLowerCase();
      const cacheKey = `${SEARCH_CACHE_PREFIX}${tag}:${limit}`;

      const cached = await redis.get<ScoredProfile[]>(cacheKey);
      if (cached) return text({ cached: true, count: cached.length, prospects: cached.map(compact) });

      const token = process.env.APIFY_API_TOKEN;
      if (!token) return text({ error: "APIFY_API_TOKEN não configurado." }, true);

      const minRemaining = Number(process.env.APIFY_MIN_REMAINING_USD ?? 1);
      const usage = await getApifyUsage(token).catch(() => null);
      if (!usage) return text({ error: "Não foi possível verificar o crédito Apify; pesquisa cancelada." }, true);
      const remaining = usage.total - usage.used;
      if (remaining < minRemaining) {
        return text({ error: `Crédito Apify baixo ($${remaining.toFixed(2)} restantes, mínimo $${minRemaining}). Pesquisa cancelada.` }, true);
      }

      let profiles;
      try {
        profiles = await searchWithApify(tag, token, limit);
      } catch (e) {
        return text({ error: e instanceof Error ? e.message : "Erro Apify." }, true);
      }

      const scored = profiles
        .map(p => scoreProfile(p, { ...DEFAULT_FILTERS, maxProfiles: limit }))
        .filter(p => p.score !== "ignore");

      const existing = await loadProspects();
      const known = new Set(existing.map(p => p.username));
      const fresh = scored.filter(p => !known.has(p.username));
      if (fresh.length > 0) await redis.set(PROSPECTS_KEY, [...existing, ...fresh]);

      await redis.set(cacheKey, scored, { ex: SEARCH_CACHE_TTL_S });
      return text({
        cached: false,
        count: scored.length,
        newSaved: fresh.length,
        creditRemainingUsd: Math.round(remaining * 100) / 100,
        prospects: scored.map(compact),
      });
    }
  );

  return server;
}
