import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { deserializeOrder } from "@/lib/orders";
import { requireStaffSession } from "@/lib/auth-helpers";
import { updateOrderFromWebhook, type PaymentStatus } from "@/lib/payments";
import { sendOrderReceiptEmail } from "@/lib/email";

const updateSchema = z.object({
  status: z.enum(["pending", "paid", "failed", "refunded"]).optional(),
  paymentRef: z.string().optional(),
  invoiceUrl: z.string().url().optional(),
  resendEmail: z.boolean().optional(),
});

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireStaffSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json(deserializeOrder(order));
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireStaffSession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const json = await request.json().catch(() => undefined);
  const parsed = updateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (parsed.data.status || parsed.data.paymentRef || parsed.data.invoiceUrl) {
    await updateOrderFromWebhook({
      orderNumber: order.orderNumber,
      status: (parsed.data.status ?? order.status) as PaymentStatus,
      paymentReference: parsed.data.paymentRef ?? order.paymentRef ?? undefined,
      invoiceUrl: parsed.data.invoiceUrl ?? order.invoiceUrl ?? undefined,
    });
  }

  if (parsed.data.resendEmail) {
    await sendOrderReceiptEmail(order.id).catch((error) => {
      console.error("Failed to resend email", error);
    });
  }

  const refreshed = await prisma.order.findUnique({ where: { id } });

  return NextResponse.json(refreshed ? deserializeOrder(refreshed) : null);
}
