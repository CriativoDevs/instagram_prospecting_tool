import { ScoredProfile } from "@/types/instagram";

const STORAGE_KEY = "timelyone_prospects";

export const storage = {
  getProspects: (): ScoredProfile[] => {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  saveProspect: (profile: ScoredProfile) => {
    if (typeof window === "undefined") return;
    const prospects = storage.getProspects();
    const index = prospects.findIndex((p) => p.username === profile.username);
    if (index >= 0) {
      prospects[index] = profile;
    } else {
      prospects.push(profile);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prospects));
  },

  updateStatus: (username: string, status: 'replied' | 'converted') => {
    if (typeof window === "undefined") return;
    const prospects = storage.getProspects();
    const index = prospects.findIndex(p => p.username === username);
    if (index < 0) return;
    const now = new Date().toISOString();
    prospects[index] = {
      ...prospects[index],
      prospectStatus: {
        ...prospects[index].prospectStatus,
        status,
        ...(status === 'replied' && { repliedAt: now }),
        ...(status === 'converted' && { convertedAt: now, repliedAt: prospects[index].prospectStatus?.repliedAt || now }),
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prospects));
  },

  deleteProspect: (username: string) => {
    if (typeof window === "undefined") return;
    const prospects = storage.getProspects().filter(p => p.username !== username);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prospects));
  },

  getStats: () => {
    const prospects = storage.getProspects();
    const contacted = prospects.filter(p => p.prospectStatus?.status === 'sent' || p.prospectStatus?.status === 'replied' || p.prospectStatus?.status === 'converted');
    const replied = prospects.filter(p => p.prospectStatus?.status === 'replied');
    const converted = prospects.filter(p => p.prospectStatus?.status === 'converted');

    return {
      totalFound: prospects.length,
      contacted: contacted.length,
      replied: replied.length,
      converted: converted.length,
      responseRate: contacted.length > 0 ? (replied.length / contacted.length) * 100 : 0
    };
  }
};
