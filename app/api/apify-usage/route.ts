import { NextResponse } from "next/server";
import { getApifyUsage } from "@/lib/apify";

export type { ApifyUsage } from "@/lib/apify";

export async function GET() {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "APIFY_API_TOKEN not configured" }, { status: 404 });
  }

  try {
    const usage = await getApifyUsage(token);
    if (!usage) return NextResponse.json({ error: "Apify API error" }, { status: 502 });
    return NextResponse.json(usage);
  } catch {
    return NextResponse.json({ error: "Failed to fetch Apify usage" }, { status: 500 });
  }
}
