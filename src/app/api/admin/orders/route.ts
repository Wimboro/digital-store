import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deserializeOrder } from "@/lib/orders";
import { requireStaffSession } from "@/lib/auth-helpers";

export async function GET(request: Request) {
  try {
    await requireStaffSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  const gateway = searchParams.get("gateway") ?? undefined;
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;

  const where: Record<string, unknown> = {};

  if (status) {
    where.status = status;
  }

  if (gateway) {
    where.paymentGateway = gateway;
  }

  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: new Date(from) } : {}),
      ...(to ? { lte: new Date(to) } : {}),
    };
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders.map(deserializeOrder));
}
