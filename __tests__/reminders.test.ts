import { clampFollowUpDays, dueReminderCount, followUpDate, pendingReminders, reminderState } from "@/lib/reminders";
import { ScoredProfile } from "@/types/instagram";

const NOW = new Date("2026-01-10T12:00:00Z");

function prospect(username: string, status: string, followUpAt?: string): ScoredProfile {
  return {
    id: username, username, followersCount: 0, mediaCount: 0, isVerified: false, profileUrl: "", score: "ok",
    prospectStatus: { status: status as "sent", followUpAt },
  };
}

describe("clampFollowUpDays", () => {
  it("limits to 1..60 and falls back to 7", () => {
    expect(clampFollowUpDays(0)).toBe(1);
    expect(clampFollowUpDays(999)).toBe(60);
    expect(clampFollowUpDays("abc")).toBe(7);
    expect(clampFollowUpDays(14)).toBe(14);
  });
});

describe("followUpDate", () => {
  it("adds days to the base date", () => {
    expect(followUpDate(7, NOW)).toBe("2026-01-17T12:00:00.000Z");
  });
});

describe("reminderState", () => {
  it("classifies overdue / soon / upcoming", () => {
    expect(reminderState("2026-01-09T12:00:00Z", NOW)).toBe("overdue");
    expect(reminderState("2026-01-11T00:00:00Z", NOW)).toBe("soon");
    expect(reminderState("2026-01-20T00:00:00Z", NOW)).toBe("upcoming");
  });
});

describe("pendingReminders", () => {
  const list = [
    prospect("b", "sent", "2026-01-15T00:00:00Z"),
    prospect("a", "sent", "2026-01-09T00:00:00Z"),
    prospect("c", "replied", "2026-01-01T00:00:00Z"),
    prospect("d", "sent"),
  ];
  it("keeps only sent prospects with followUpAt, sorted by date", () => {
    expect(pendingReminders(list).map(p => p.username)).toEqual(["a", "b"]);
  });
  it("counts due reminders (overdue or soon)", () => {
    expect(dueReminderCount(list, NOW)).toBe(1);
  });
});
