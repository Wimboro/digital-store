import { updateOrderFromWebhook, type PaymentStatus } from "@/lib/payments";
import { NextResponse } from "next/server";
import { z } from "zod";

const baseSchema = z.object({
  orderNumber: z.string().min(1),
  status: z.enum(["paid", "failed", "pending"]).default("paid"),
  paymentRef: z.string().optional(),
  invoiceUrl: z.string().optional(),
});

export async function handleBasicWebhook(
  request: Request,
  transform?: (payload: unknown, rawBody: string) => unknown,
) {
  const rawBody = await request.text();
  const parsedJson = (() => {
    try {
      return JSON.parse(rawBody || "{}");
    } catch {
      return {};
    }
  })();

  const payload = transform ? transform(parsedJson, rawBody) : parsedJson;
  const parsed = baseSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const { orderNumber, status, paymentRef, invoiceUrl } = parsed.data;
    await updateOrderFromWebhook({
      orderNumber,
      status: status as PaymentStatus,
      paymentReference: paymentRef,
      invoiceUrl,
    });
    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to process webhook",
      },
      { status: 400 },
    );
  }
}
