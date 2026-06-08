import { ScoredProfile } from "@/types/instagram";

const LOCAL_KEY = "timelyone_prospects";

// Lê localStorage (usado apenas para migração)
export function getLocalProspects(): ScoredProfile[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(LOCAL_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Limpa localStorage após migração
export function clearLocalProspects() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LOCAL_KEY);
}

// ---------- API remota (Redis) ----------

export const storage = {
  getProspects: async (): Promise<ScoredProfile[]> => {
    const res = await fetch("/api/prospects");
    if (!res.ok) return [];
    return res.json();
  },

  saveProspect: async (profile: ScoredProfile): Promise<void> => {
    await fetch("/api/prospects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
  },

  updateStatus: async (username: string, status: "replied" | "converted" | "rejected"): Promise<void> => {
    await fetch(`/api/prospects/${encodeURIComponent(username)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  },

  deleteProspect: async (username: string): Promise<void> => {
    await fetch(`/api/prospects/${encodeURIComponent(username)}`, {
      method: "DELETE",
    });
  },

  getStats: (prospects: ScoredProfile[]) => {
    const contacted = prospects.filter(p =>
      ["sent", "replied", "converted", "rejected"].includes(p.prospectStatus?.status ?? "")
    );
    const replied = prospects.filter(p =>
      ["replied", "converted"].includes(p.prospectStatus?.status ?? "")
    );
    const converted = prospects.filter(p => p.prospectStatus?.status === "converted");
    const rejected = prospects.filter(p => p.prospectStatus?.status === "rejected");
    const responded = replied.length + rejected.length;

    return {
      totalFound: prospects.length,
      contacted: contacted.length,
      replied: replied.length,
      converted: converted.length,
      rejected: rejected.length,
      replyRate: contacted.length > 0 ? Math.round((responded / contacted.length) * 100) : 0,
    };
  },

  migrate: async (prospects: ScoredProfile[]): Promise<number> => {
    const res = await fetch("/api/prospects/migrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prospects),
    });
    const json = await res.json();
    return json.total ?? 0;
  },
};
