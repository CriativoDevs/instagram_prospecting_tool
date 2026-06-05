import { NextResponse } from "next/server";

export interface ApifyUsage {
  used: number;
  total: number;
  plan: string;
  cycleStart: string;
  cycleEnd: string;
}

export async function GET() {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "APIFY_API_TOKEN not configured" }, { status: 404 });
  }

  try {
    const [userRes, monthlyRes] = await Promise.all([
      fetch(`https://api.apify.com/v2/users/me?token=${token}`, { cache: "no-store" }),
      fetch(`https://api.apify.com/v2/users/me/usage/monthly?token=${token}`, { cache: "no-store" }),
    ]);

    if (!userRes.ok) return NextResponse.json({ error: "Apify API error" }, { status: userRes.status });

    const userData = (await userRes.json()).data ?? {};
    const total: number = userData.plan?.monthlyUsageCreditsUsd ?? userData.plan?.maxMonthlyUsageUsd ?? 5;

    let used = 0;
    let cycleStart = new Date().toISOString();
    let cycleEnd = new Date().toISOString();

    if (monthlyRes.ok) {
      const monthlyData = (await monthlyRes.json()).data ?? {};
      used = monthlyData.totalUsageCreditsUsdAfterVolumeDiscount ?? monthlyData.totalUsageCreditsUsdBeforeVolumeDiscount ?? 0;
      cycleStart = monthlyData.usageCycle?.startAt ?? cycleStart;
      cycleEnd = monthlyData.usageCycle?.endAt ?? cycleEnd;
    }

    const usage: ApifyUsage = {
      used: Math.round(used * 100) / 100,
      total,
      plan: userData.plan?.id ?? "FREE",
      cycleStart,
      cycleEnd,
    };

    return NextResponse.json(usage);
  } catch {
    return NextResponse.json({ error: "Failed to fetch Apify usage" }, { status: 500 });
  }
}
