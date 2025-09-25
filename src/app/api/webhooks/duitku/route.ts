import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateOrderFromWebhook } from "@/lib/payments";
import { verifyDuitkuSignature } from "@/lib/duitku";

function getParam(body: Record<string, unknown>, key: string) {
  const value = body[key];
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  const merchantCode = getParam(body, "merchantCode") || process.env.DUITKU_MERCHANT_CODE || "";
  const orderNumber = getParam(body, "merchantOrderId");
  const amount = getParam(body, "amount");
  const reference = getParam(body, "reference");
  const resultCode = getParam(body, "resultCode");
  const statusMessage = getParam(body, "statusMessage");
  const signature = getParam(body, "signature");
  const apiKey = process.env.DUITKU_API_KEY || "";

  if (!orderNumber) {
    return NextResponse.json({ error: "Missing order number" }, { status: 400 });
  }

  if (!signature || !merchantCode || !apiKey) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const isValid = verifyDuitkuSignature({
    merchantCode,
    merchantOrderId: orderNumber,
    amount,
    resultCode,
    apiKey,
    signature,
  });

  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const normalizedCode = resultCode === "00" ? "paid" : resultCode === "01" ? "pending" : "failed";

  try {
    const updated = await updateOrderFromWebhook({
      orderNumber,
      paymentReference: reference,
      status: normalizedCode,
      invoiceUrl: undefined,
    });

    await prisma.order.update({
      where: { id: updated.id },
      data: {
        paymentRef: reference || updated.paymentRef,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to process order",
      },
      { status: 400 },
    );
  }

  return NextResponse.json({ received: true, message: statusMessage });
}
