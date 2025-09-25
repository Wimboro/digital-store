import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { deserializeSettings } from "@/lib/serializers";
import { checkAutoQrisPayment } from "@/lib/auto-qris";
import { updateOrderFromWebhook } from "@/lib/payments";

const verifySchema = z.object({
  orderNumber: z.string().min(1),
  combinedAmount: z.string().min(1),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => undefined);
  const parsed = verifySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { orderNumber, combinedAmount } = parsed.data;

  const order = await prisma.order.findUnique({ where: { orderNumber } });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const settingsRecord = await prisma.settings.findFirst({ orderBy: { createdAt: "desc" } });
  if (!settingsRecord) {
    return NextResponse.json({ error: "Store not configured" }, { status: 500 });
  }

  const settings = deserializeSettings(settingsRecord);
  const autoQrisConfig = (settings.payment.autoQris as Record<string, unknown>) ?? {};

  const paid = await checkAutoQrisPayment({
    config: {
      workerUrl: typeof autoQrisConfig.workerUrl === "string" ? autoQrisConfig.workerUrl : undefined,
      apiKey: typeof autoQrisConfig.apiKey === "string" ? autoQrisConfig.apiKey : undefined,
      staticQris: typeof autoQrisConfig.staticQris === "string" ? autoQrisConfig.staticQris : undefined,
      callbackUrl: typeof autoQrisConfig.callbackUrl === "string" ? autoQrisConfig.callbackUrl : undefined,
    },
    combinedAmount,
  });

  if (!paid) {
    return NextResponse.json({ paid: false });
  }

  await updateOrderFromWebhook({
    orderNumber,
    status: "paid",
    paymentReference: order.paymentRef ?? undefined,
    invoiceUrl: order.invoiceUrl ?? undefined,
  });

  return NextResponse.json({ paid: true });
}
