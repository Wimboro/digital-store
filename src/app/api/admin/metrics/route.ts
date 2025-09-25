import { NextResponse } from "next/server";
import { requireStaffSession } from "@/lib/auth-helpers";
import { getDashboardMetrics } from "@/lib/metrics";

export async function GET() {
  try {
    await requireStaffSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const metrics = await getDashboardMetrics();
  return NextResponse.json(metrics);
}
